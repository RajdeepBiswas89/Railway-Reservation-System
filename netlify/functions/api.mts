import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";
import { createHmac, timingSafeEqual } from "node:crypto";

// RAILNEX API — a port of the FastAPI backend (backend/app) to a Netlify Function
// backed by Netlify Database. Response shapes match the original API.

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Row = Record<string, any>;

const db = getDatabase();

async function q(text: string, params: unknown[] = []): Promise<Row[]> {
  const result = await db.pool.query(text, params as any[]);
  return result.rows as Row[];
}

async function one(text: string, params: unknown[] = []): Promise<Row | null> {
  const rows = await q(text, params);
  return rows[0] ?? null;
}

const json = (data: unknown, status = 200) => Response.json(data, { status });

// ---------------------------------------------------------------------------
// Auth (HS256 JWT, bcrypt via pgcrypto)
// ---------------------------------------------------------------------------

const TOKEN_TTL_SECONDS = 60 * 60 * 24;

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new HttpError(500, "Server is missing JWT_SECRET configuration");
  return secret;
}

const b64url = (input: Buffer | string) => Buffer.from(input).toString("base64url");

function createToken(subject: string): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({ sub: subject, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS }),
  );
  const signature = createHmac("sha256", jwtSecret()).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function decodeToken(token: string): { sub: string } | null {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;
  const expected = createHmac("sha256", jwtSecret()).update(`${header}.${payload}`).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.exp !== "number" || data.exp < Date.now() / 1000) return null;
    return data;
  } catch {
    return null;
  }
}

async function getCurrentUser(req: Request): Promise<Row | null> {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const payload = decodeToken(match[1]);
  if (!payload?.sub || !/^\d+$/.test(payload.sub)) return null;
  return one("SELECT * FROM users WHERE user_id = $1 AND is_active = TRUE", [payload.sub]);
}

async function requireUser(req: Request): Promise<Row> {
  if (!req.headers.get("authorization")) throw new HttpError(401, "Authentication token is missing");
  const user = await getCurrentUser(req);
  if (!user) throw new HttpError(401, "Invalid or expired authentication token");
  return user;
}

async function requireAdmin(req: Request): Promise<Row> {
  const user = await requireUser(req);
  if (user.role !== "ADMIN") throw new HttpError(403, "Administrator access required");
  return user;
}

async function getUserProfile(userId: string | number) {
  const user = await one("SELECT user_id, full_name, email, phone, role FROM users WHERE user_id = $1", [userId]);
  if (!user) throw new HttpError(404, "User not found.");

  const m = await one(
    `SELECT
        COUNT(booking_id) AS total_journeys,
        COUNT(booking_id) FILTER (WHERE status = 'COMPLETED') AS completed_trips,
        COUNT(booking_id) FILTER (WHERE status = 'CONFIRMED' AND journey_date >= CURRENT_DATE) AS upcoming_trips
     FROM bookings WHERE user_id = $1`,
    [userId],
  );
  const totalJourneys = Number(m?.total_journeys || 0);

  let passengers = await q(
    `SELECT saved_passenger_id, full_name, age, gender, id_type, id_number, preference
     FROM saved_passengers WHERE user_id = $1 ORDER BY saved_passenger_id DESC LIMIT 20`,
    [userId],
  );
  if (!passengers.length) {
    passengers = await q(
      `SELECT DISTINCT ON (p.full_name)
          p.passenger_id AS saved_passenger_id, p.full_name, p.age, p.gender,
          COALESCE(p.id_type, 'AADHAAR') AS id_type,
          COALESCE(p.id_number, 'XXXX-XXXX') AS id_number,
          COALESCE(p.seat_preference, 'LOWER') AS preference
       FROM passengers p JOIN bookings b ON b.booking_id = p.booking_id
       WHERE b.user_id = $1
       ORDER BY p.full_name, p.passenger_id DESC LIMIT 5`,
      [userId],
    );
  }

  return {
    id: String(user.user_id),
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    avatarUrl: null,
    role: user.role,
    savedPassengers: passengers.map(mapSavedPassenger),
    preferences: { preferredClass: "3A", preferredBerth: "LOWER", foodChoice: "VEG", smsAlerts: true, emailAlerts: true },
    metrics: {
      totalJourneys,
      citiesVisited: Math.min(12, Math.max(2, totalJourneys * 2)),
      completedTrips: Number(m?.completed_trips || 0),
      upcomingTrips: Number(m?.upcoming_trips || 0),
      savedKms: totalJourneys * 450,
    },
  };
}

function mapSavedPassenger(r: Row) {
  return {
    id: String(r.saved_passenger_id),
    fullName: r.full_name,
    age: Number(r.age),
    gender: r.gender,
    idType: r.id_type || "AADHAAR",
    idNumber: r.id_number || "",
    preference: r.preference || "LOWER",
  };
}

async function tokenResponse(userId: string | number) {
  return { access_token: createToken(String(userId)), token_type: "bearer", user: await getUserProfile(userId) };
}

async function register(body: Row) {
  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();
  const password = String(body.password || "");
  if (fullName.length < 2) throw new HttpError(400, "Please enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Please enter a valid email address.");
  if (password.length < 6) throw new HttpError(400, "Password must be at least 6 characters.");

  if (await one("SELECT user_id FROM users WHERE LOWER(email) = $1", [email])) {
    throw new HttpError(400, "An account with this email address already exists.");
  }
  const row = await one(
    `INSERT INTO users (full_name, email, phone, password_hash, role, is_active)
     VALUES ($1, $2, $3, crypt($4, gen_salt('bf')), 'USER', TRUE)
     RETURNING user_id`,
    [fullName, email, phone || null, password],
  );
  return tokenResponse(row!.user_id);
}

async function login(body: Row) {
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const user = await one(
    `SELECT user_id FROM users
     WHERE LOWER(email) = $1 AND is_active = TRUE AND crypt($2, password_hash) = password_hash`,
    [email, password],
  );
  if (!user) throw new HttpError(401, "Invalid email or password.");
  return tokenResponse(user.user_id);
}

// ---------------------------------------------------------------------------
// Stations
// ---------------------------------------------------------------------------

const STATION_COLUMNS = `
  station_code AS code, station_name AS name, city, state, railway_zone AS zone,
  6 AS platforms, CASE WHEN is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS status`;

const HUB_CODES = new Set(["HWH", "NDLS", "SBC", "MAS", "CSMT", "PUNE", "ADI", "CNB"]);

const toStation = (r: Row) => ({
  code: r.code,
  name: r.name,
  city: r.city,
  state: r.state,
  zone: r.zone,
  platforms: Number(r.platforms),
  status: r.status,
});

async function listStations() {
  const rows = await q(`SELECT ${STATION_COLUMNS} FROM stations WHERE is_active = TRUE ORDER BY station_name`);
  return rows.map(toStation);
}

async function getStation(code: string) {
  const row = await one(`SELECT ${STATION_COLUMNS} FROM stations WHERE UPPER(station_code) = UPPER($1)`, [code.trim()]);
  return row ? toStation(row) : null;
}

async function searchStations(query: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    const hubs = await q(
      `SELECT ${STATION_COLUMNS} FROM stations
       WHERE is_active = TRUE AND station_code IN ('HWH','NDLS','CSMT','SBC','MAS','ADI','CNB','BBS','PUNE')
       ORDER BY station_name LIMIT 8`,
    );
    return hubs.map((r) => ({ station: toStation(r), matchedField: "name", score: 100, isHub: true }));
  }
  const rows = await q(
    `SELECT ${STATION_COLUMNS},
        CASE WHEN UPPER(station_code) = $2 THEN 'code'
             WHEN station_name ILIKE $1 THEN 'name'
             WHEN city ILIKE $1 THEN 'city' ELSE 'state' END AS matched_field,
        CASE WHEN UPPER(station_code) = $2 THEN 100
             WHEN station_name ILIKE $1 THEN 80
             WHEN city ILIKE $1 THEN 60 ELSE 40 END AS score
     FROM stations
     WHERE is_active = TRUE
       AND (station_code ILIKE $1 OR station_name ILIKE $1 OR city ILIKE $1 OR state ILIKE $1)
     ORDER BY score DESC, station_name ASC LIMIT 10`,
    [`%${trimmed}%`, trimmed.toUpperCase()],
  );
  return rows.map((r) => ({
    station: toStation(r),
    matchedField: r.matched_field,
    score: Number(r.score),
    isHub: HUB_CODES.has(r.code),
  }));
}

async function createStation(body: Row) {
  const code = String(body.code || "").trim().toUpperCase();
  const name = String(body.name || "").trim();
  if (!code || !name) throw new HttpError(400, "Station code and name are required.");
  if (await one("SELECT 1 FROM stations WHERE UPPER(station_code) = $1", [code])) {
    throw new HttpError(400, `Station ${code} already exists.`);
  }
  const row = await one(
    `INSERT INTO stations (station_code, station_name, city, state, railway_zone, is_active)
     VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING ${STATION_COLUMNS}`,
    [code, name, String(body.city || "").trim(), String(body.state || "").trim(), body.zone || "NR"],
  );
  return toStation(row!);
}

async function updateStation(code: string, body: Row) {
  const existing = await getStation(code);
  if (!existing) return null;
  const row = await one(
    `UPDATE stations
     SET station_name = $2, city = $3, state = $4, railway_zone = $5, is_active = $6, updated_at = NOW()
     WHERE UPPER(station_code) = UPPER($1)
     RETURNING ${STATION_COLUMNS}`,
    [
      code,
      body.name ?? existing.name,
      body.city ?? existing.city,
      body.state ?? existing.state,
      body.zone ?? existing.zone,
      body.status != null ? String(body.status).toUpperCase() === "ACTIVE" : true,
    ],
  );
  return row ? toStation(row) : null;
}

// ---------------------------------------------------------------------------
// Trains
// ---------------------------------------------------------------------------

const DAYS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TYPE_DISPLAY: Record<string, string> = {
  VANDE_BHARAT: "Vande Bharat",
  RAJDHANI: "Rajdhani",
  SHATABDI: "Shatabdi",
  DURONTO: "Duronto",
  SUPERFAST: "Superfast",
  EXPRESS: "Express",
  HUMSAFAR: "Humsafar",
  INTERCITY: "Intercity",
};
const CLASS_NAMES: Record<string, string> = {
  "1A": "AC First Class",
  "2A": "AC 2 Tier",
  "3A": "AC 3 Tier",
  SL: "Sleeper Class",
  CC: "AC Chair Car",
  EC: "Executive Chair Car",
  "2S": "Second Sitting",
};
const CLASS_PREFIXES: Record<string, string> = { "1A": "H", "2A": "A", "3A": "B", SL: "S", CC: "C", EC: "E", "2S": "D" };

const typeKey = (t: string) => (t || "").toUpperCase().replace(/ /g, "_");
const displayType = (t: string) =>
  TYPE_DISPLAY[typeKey(t)] ?? (t ? t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Express");
const dbType = (t: string) => (TYPE_DISPLAY[typeKey(t)] ? typeKey(t) : "EXPRESS");
const dayNumber = (d: string) => {
  const idx = DAYS.findIndex((x) => x && x.toUpperCase() === String(d).slice(0, 3).toUpperCase());
  return idx > 0 ? idx : 1;
};
const formatTime = (t: unknown) => (t ? String(t).slice(0, 5) : "00:00");
const todayIso = () => new Date().toISOString().slice(0, 10);

function amenities(trainType: string) {
  const tt = typeKey(trainType);
  const premium = ["VANDE_BHARAT", "RAJDHANI", "SHATABDI"].includes(tt);
  return [
    { id: "wifi", label: "High-Speed Wi-Fi", available: premium },
    { id: "food", label: "Onboard Catering", available: true },
    { id: "charging", label: "Power Sockets", available: true },
    { id: "bedding", label: "Bedding", available: !["SHATABDI", "VANDE_BHARAT"].includes(tt) },
    { id: "ac", label: "Air Conditioned", available: true },
    { id: "water", label: "Drinking Water", available: true },
  ];
}

const DURATION_SQL = `(
  (r_dst.day_offset - r_src.day_offset) * 1440
  + EXTRACT(HOUR FROM r_dst.arrival_time)::INTEGER * 60 + EXTRACT(MINUTE FROM r_dst.arrival_time)::INTEGER
  - (EXTRACT(HOUR FROM r_src.departure_time)::INTEGER * 60 + EXTRACT(MINUTE FROM r_src.departure_time)::INTEGER)
)`;

const TRAIN_COLUMNS = `
  t.train_id, t.train_number, t.train_name, t.train_type,
  src_st.station_code AS from_code, src_st.station_name AS from_name, src_st.city AS from_city,
  dst_st.station_code AS to_code, dst_st.station_name AS to_name, dst_st.city AS to_city,
  r_src.departure_time::TEXT AS departure_time, r_dst.arrival_time::TEXT AS arrival_time,
  ${DURATION_SQL} AS duration_minutes`;

interface SearchParams {
  fromStation?: string | null;
  toStation?: string | null;
  journeyDate?: string | null;
  trainId?: string | number;
}

async function searchTrains(params: SearchParams) {
  const journeyDate = params.journeyDate || todayIso();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(journeyDate)) throw new HttpError(400, "journeyDate must be YYYY-MM-DD");

  let rows: Row[];
  if (params.fromStation && params.toStation) {
    const isoDay = ((new Date(`${journeyDate}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
    rows = await q(
      `SELECT DISTINCT ${TRAIN_COLUMNS},
          (r_dst.distance_from_origin_km - r_src.distance_from_origin_km) AS distance_km
       FROM trains t
       JOIN train_routes r_src ON r_src.train_id = t.train_id
       JOIN stations src_st ON src_st.station_id = r_src.station_id
       JOIN train_routes r_dst ON r_dst.train_id = t.train_id
       JOIN stations dst_st ON dst_st.station_id = r_dst.station_id
       WHERE t.is_active = TRUE
         AND UPPER(src_st.station_code) = $1
         AND UPPER(dst_st.station_code) = $2
         AND r_src.sequence_no < r_dst.sequence_no
         AND EXISTS (SELECT 1 FROM train_operating_days od WHERE od.train_id = t.train_id AND od.day_of_week = $3)`,
      [params.fromStation.trim().toUpperCase(), params.toStation.trim().toUpperCase(), isoDay],
    );
  } else {
    rows = await q(
      `SELECT ${TRAIN_COLUMNS}, r_dst.distance_from_origin_km AS distance_km
       FROM trains t
       JOIN train_routes r_src ON r_src.train_id = t.train_id
         AND r_src.sequence_no = (SELECT MIN(sequence_no) FROM train_routes WHERE train_id = t.train_id)
       JOIN stations src_st ON src_st.station_id = r_src.station_id
       JOIN train_routes r_dst ON r_dst.train_id = t.train_id
         AND r_dst.sequence_no = (SELECT MAX(sequence_no) FROM train_routes WHERE train_id = t.train_id)
       JOIN stations dst_st ON dst_st.station_id = r_dst.station_id
       WHERE t.is_active = TRUE ${params.trainId != null ? "AND t.train_id = $1" : ""}
       ORDER BY t.train_number`,
      params.trainId != null ? [params.trainId] : [],
    );
  }
  if (!rows.length) return [];

  const ids = rows.map((r) => r.train_id);
  const [dayRows, fareRows, bookedRows] = await Promise.all([
    q(`SELECT train_id, day_of_week FROM train_operating_days WHERE train_id = ANY($1::BIGINT[]) ORDER BY day_of_week`, [ids]),
    q(
      `SELECT f.train_id, f.class_code, f.full_route_fare, COALESCE(SUM(c.capacity), 72) AS capacity
       FROM fares f
       LEFT JOIN coaches c ON c.train_id = f.train_id AND c.coach_type = f.class_code AND c.is_active = TRUE
       WHERE f.train_id = ANY($1::BIGINT[]) AND f.is_active = TRUE
       GROUP BY f.train_id, f.class_code, f.full_route_fare
       ORDER BY f.full_route_fare DESC`,
      [ids],
    ),
    q(
      `SELECT co.train_id, co.coach_type, COUNT(DISTINCT sr.seat_id) AS booked
       FROM seat_reservations sr
       JOIN seats s ON s.seat_id = sr.seat_id
       JOIN coaches co ON co.coach_id = s.coach_id
       WHERE co.train_id = ANY($1::BIGINT[]) AND sr.journey_date = $2::DATE AND sr.status = 'RESERVED'
       GROUP BY co.train_id, co.coach_type`,
      [ids, journeyDate],
    ),
  ]);

  return rows.map((tr) => {
    const tid = String(tr.train_id);
    const operatingDays = dayRows.filter((d) => String(d.train_id) === tid).map((d) => DAYS[Number(d.day_of_week)]);
    const classes = fareRows
      .filter((f) => String(f.train_id) === tid)
      .map((f) => {
        const booked = Number(
          bookedRows.find((b) => String(b.train_id) === tid && b.coach_type === f.class_code)?.booked || 0,
        );
        const available = Math.max(0, Number(f.capacity || 72) - booked);
        return {
          code: f.class_code,
          name: CLASS_NAMES[f.class_code] ?? f.class_code,
          baseFare: Number(f.full_route_fare),
          seatsAvailable: available,
          status: available > 10 ? "AVAILABLE" : available > 0 ? "LIMITED" : "WAITLIST",
          coachPrefix: CLASS_PREFIXES[f.class_code] ?? "B",
        };
      });
    const minutes = Number(tr.duration_minutes) > 0 ? Number(tr.duration_minutes) : 300;
    const distance = Number(tr.distance_km) > 0 ? Number(tr.distance_km) : 500;

    return {
      id: tid,
      number: String(tr.train_number).padStart(5, "0"),
      name: tr.train_name,
      type: displayType(tr.train_type),
      fromStation: { code: tr.from_code, name: tr.from_name, city: tr.from_city },
      toStation: { code: tr.to_code, name: tr.to_name, city: tr.to_city },
      departureTime: formatTime(tr.departure_time),
      arrivalTime: formatTime(tr.arrival_time),
      duration: `${Math.floor(minutes / 60)}h ${minutes % 60}m`,
      distanceKm: distance,
      operatingDays: operatingDays.length ? operatingDays : DAYS.slice(1),
      classes,
      amenities: amenities(tr.train_type),
      status: "ON_TIME",
      delayMinutes: 0,
      pantryAvailable: true,
    };
  });
}

async function resolveTrainId(identifier: string, activeOnly = true): Promise<string | null> {
  const active = activeOnly ? "AND is_active = TRUE" : "";
  const row = /^\d+$/.test(identifier)
    ? await one(`SELECT train_id FROM trains WHERE (train_id = $1 OR train_number = $1) ${active} ORDER BY train_number = $1 DESC LIMIT 1`, [Number(identifier)])
    : await one(`SELECT train_id FROM trains WHERE UPPER(train_name) = UPPER($1) ${active} LIMIT 1`, [identifier.trim()]);
  return row ? String(row.train_id) : null;
}

async function getTrain(identifier: string) {
  const tid = await resolveTrainId(identifier);
  if (!tid) return null;
  const [train] = await searchTrains({ trainId: tid });
  return train ?? null;
}

async function getRouteStops(trainId: string) {
  const rows = await q(
    `SELECT s.station_code, s.station_name, tr.arrival_time::TEXT AS arrival_time,
        tr.departure_time::TEXT AS departure_time, tr.distance_from_origin_km, tr.day_offset, tr.sequence_no
     FROM train_routes tr JOIN stations s ON s.station_id = tr.station_id
     WHERE tr.train_id = $1 ORDER BY tr.sequence_no`,
    [trainId],
  );
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return rows.map((r) => ({
    stationCode: r.station_code,
    stationName: r.station_name,
    arrivalTime: r.arrival_time ? formatTime(r.arrival_time) : "--",
    departureTime: r.departure_time ? formatTime(r.departure_time) : "--",
    haltMinutes:
      r.arrival_time && r.departure_time ? Math.max(0, toMinutes(r.departure_time) - toMinutes(r.arrival_time)) : 0,
    distanceKm: Number(r.distance_from_origin_km || 0),
    day: Number(r.day_offset || 0) + 1,
    sequence: Number(r.sequence_no),
  }));
}

async function stationIdByCode(code: string, label: string) {
  const row = await one("SELECT station_id FROM stations WHERE UPPER(station_code) = UPPER($1) AND is_active = TRUE", [
    code.trim(),
  ]);
  if (!row) throw new HttpError(400, `${label} station was not found.`);
  return row.station_id;
}

async function setOperatingDays(tid: string, days: string[]) {
  await q("DELETE FROM train_operating_days WHERE train_id = $1", [tid]);
  for (const d of new Set(days.map(dayNumber))) {
    await q("INSERT INTO train_operating_days (train_id, day_of_week) VALUES ($1, $2) ON CONFLICT DO NOTHING", [tid, d]);
  }
}

async function createTrain(body: Row) {
  const fromCode = String(body.fromStationCode || body.fromStation?.code || "").trim();
  const toCode = String(body.toStationCode || body.toStation?.code || "").trim();
  if (!fromCode || !toCode) throw new HttpError(400, "Origin and destination station codes are required.");
  const number = Number(body.number);
  if (!Number.isInteger(number) || number <= 0) throw new HttpError(400, "Train number must be numeric.");
  if (await one("SELECT 1 FROM trains WHERE train_number = $1", [number])) {
    throw new HttpError(400, `Train ${number} already exists.`);
  }
  const src = await stationIdByCode(fromCode, "Origin");
  const dst = await stationIdByCode(toCode, "Destination");

  const row = await one(
    "INSERT INTO trains (train_number, train_name, train_type, is_active) VALUES ($1, $2, $3, TRUE) RETURNING train_id",
    [number, String(body.name || "").trim(), dbType(body.type)],
  );
  const tid = String(row!.train_id);

  await q(
    `INSERT INTO train_routes (train_id, station_id, sequence_no, arrival_time, departure_time, day_offset, distance_from_origin_km)
     VALUES ($1, $2, 1, NULL, $4::TIME, 0, 0), ($1, $3, 2, $5::TIME, NULL, 0, $6)`,
    [
      tid,
      src,
      dst,
      String(body.departureTime || "06:00").slice(0, 5),
      String(body.arrivalTime || "18:00").slice(0, 5),
      Number(body.distanceKm || 0),
    ],
  );
  await setOperatingDays(tid, body.operatingDays?.length ? body.operatingDays : DAYS.slice(1));

  const classes: Row[] = body.classes?.length
    ? body.classes
    : [
        { code: "3A", baseFare: Number(body.baseFare || 1200) },
        { code: "SL", baseFare: Number(body.baseFare || 1200) * 0.4 },
      ];
  for (const cls of classes) {
    await q(
      `INSERT INTO fares (train_id, class_code, full_route_fare) VALUES ($1, $2, $3)
       ON CONFLICT (train_id, class_code) DO UPDATE SET full_route_fare = EXCLUDED.full_route_fare`,
      [tid, String(cls.code).toUpperCase(), Number(cls.baseFare)],
    );
  }

  const created = await getTrain(tid);
  if (!created) throw new HttpError(500, "Train was created but could not be loaded.");
  return created;
}

async function updateTrain(identifier: string, body: Row) {
  const tid = await resolveTrainId(identifier);
  if (!tid) return null;
  const first = "(SELECT MIN(sequence_no) FROM train_routes WHERE train_id = $1)";
  const last = "(SELECT MAX(sequence_no) FROM train_routes WHERE train_id = $1)";

  if (body.name) await q("UPDATE trains SET train_name = $2, updated_at = NOW() WHERE train_id = $1", [tid, body.name]);
  if (body.type) await q("UPDATE trains SET train_type = $2, updated_at = NOW() WHERE train_id = $1", [tid, dbType(body.type)]);
  if (body.fromStationCode) {
    const sid = await stationIdByCode(body.fromStationCode, "Origin");
    await q(`UPDATE train_routes SET station_id = $2 WHERE train_id = $1 AND sequence_no = ${first}`, [tid, sid]);
  }
  if (body.toStationCode) {
    const sid = await stationIdByCode(body.toStationCode, "Destination");
    await q(`UPDATE train_routes SET station_id = $2 WHERE train_id = $1 AND sequence_no = ${last}`, [tid, sid]);
  }
  if (body.departureTime) {
    await q(`UPDATE train_routes SET departure_time = $2::TIME WHERE train_id = $1 AND sequence_no = ${first}`, [
      tid,
      String(body.departureTime).slice(0, 5),
    ]);
  }
  if (body.arrivalTime) {
    await q(`UPDATE train_routes SET arrival_time = $2::TIME WHERE train_id = $1 AND sequence_no = ${last}`, [
      tid,
      String(body.arrivalTime).slice(0, 5),
    ]);
  }
  if (body.distanceKm != null) {
    await q(`UPDATE train_routes SET distance_from_origin_km = $2 WHERE train_id = $1 AND sequence_no = ${last}`, [
      tid,
      Number(body.distanceKm),
    ]);
  }
  if (body.operatingDays?.length) await setOperatingDays(tid, body.operatingDays);
  return getTrain(tid);
}

async function deleteTrain(identifier: string) {
  const tid = await resolveTrainId(identifier, false);
  if (tid) await q("UPDATE trains SET is_active = FALSE, updated_at = NOW() WHERE train_id = $1", [tid]);
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

const BOOKING_STATUS_MAP: Record<string, string> = { WAITLIST: "WAITLISTED", PENDING: "CONFIRMED", FAILED: "CANCELLED" };
const SEAT_PREFS = new Set(["LOWER", "MIDDLE", "UPPER", "SIDE_LOWER", "SIDE_UPPER", "WINDOW", "AISLE"]);

async function getBookingByPnr(pnr: string) {
  const rows = await q(
    `SELECT v.booking_id, v.pnr, v.journey_date::TEXT AS journey_date, v.booking_status, v.total_fare,
        v.booking_date::TEXT AS booking_date, v.user_id, v.booked_by, v.user_email,
        v.train_id_ref AS train_id, v.train_number, v.train_name, v.train_type,
        v.source_code, v.source_station, v.source_city, v.destination_code, v.destination_station, v.destination_city,
        v.passenger_id, v.passenger_name, v.age, v.gender, v.class_code, v.fare_amount,
        v.seat_number, v.coach_number, v.payment_method, v.payment_status, v.transaction_ref,
        v.departure_time::TEXT AS departure_time, v.arrival_time::TEXT AS arrival_time, v.duration_minutes
     FROM (
       SELECT d.*, b.train_id AS train_id_ref,
         ss.city AS source_city, ds.city AS destination_city,
         r_src.departure_time, r_dst.arrival_time, ${DURATION_SQL} AS duration_minutes
       FROM v_booking_details d
       JOIN bookings b ON b.booking_id = d.booking_id
       JOIN stations ss ON ss.station_id = b.source_station_id
       JOIN stations ds ON ds.station_id = b.destination_station_id
       LEFT JOIN train_routes r_src ON r_src.train_id = b.train_id AND r_src.station_id = b.source_station_id
       LEFT JOIN train_routes r_dst ON r_dst.train_id = b.train_id AND r_dst.station_id = b.destination_station_id
       WHERE UPPER(d.pnr) = UPPER($1)
     ) v
     ORDER BY v.passenger_id`,
    [pnr.trim()],
  );
  if (!rows.length) return null;
  const first = rows[0];

  const total = Number(first.total_fare || 0);
  const base = total * 0.82;
  const gst = total * 0.05;
  const reservationFee = 40;
  const superfast = 45;
  const minutes = Number(first.duration_minutes) > 0 ? Number(first.duration_minutes) : 0;
  const round2 = (n: number) => Math.round(n * 100) / 100;

  return {
    id: String(first.booking_id),
    pnr: first.pnr,
    userId: String(first.user_id),
    userEmail: first.user_email,
    userName: first.booked_by,
    train: {
      id: String(first.train_id),
      number: String(first.train_number).padStart(5, "0"),
      name: first.train_name,
      type: displayType(first.train_type),
    },
    fromStation: { code: first.source_code, name: first.source_station, city: first.source_city },
    toStation: { code: first.destination_code, name: first.destination_station, city: first.destination_city },
    journeyDate: first.journey_date,
    departureTime: formatTime(first.departure_time),
    arrivalTime: formatTime(first.arrival_time),
    duration: minutes ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : "--",
    classCode: first.class_code || "3A",
    coachNumber: first.coach_number || "B1",
    passengers: rows.map((r) => {
      const seat = String(r.seat_number ?? "");
      return {
        id: String(r.passenger_id),
        fullName: r.passenger_name,
        age: Number(r.age),
        gender: r.gender,
        allocatedCoach: r.coach_number || "--",
        allocatedSeat: seat || "--",
        allocatedBerth: seat ? (Number(seat) % 3 === 1 ? "Lower Berth" : "Upper Berth") : "--",
      };
    }),
    fareBreakdown: {
      baseFare: round2(base),
      reservationFee,
      superfastCharge: superfast,
      gst: round2(gst),
      cateringCharge: round2(Math.max(0, total - base - reservationFee - gst - superfast)),
      total: round2(total),
    },
    payment: {
      method: first.payment_method || "UPI",
      transactionId: first.transaction_ref || `TXN-${first.pnr}`,
      timestamp: new Date().toISOString(),
      status: first.payment_status || "SUCCESS",
    },
    status: BOOKING_STATUS_MAP[String(first.booking_status || "CONFIRMED").toUpperCase()] ?? first.booking_status,
    bookingDate: first.booking_date,
    platform: "02",
  };
}

async function bookingsForPnrs(pnrs: Row[]) {
  const bookings = await Promise.all(pnrs.map((r) => getBookingByPnr(r.pnr)));
  return bookings.filter(Boolean);
}

async function createBooking(body: Row, user: Row) {
  const journeyDate = String(body.journeyDate || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(journeyDate)) throw new HttpError(400, "journeyDate must be a valid ISO date (YYYY-MM-DD).");
  const passengers: Row[] = Array.isArray(body.passengers) ? body.passengers : [];
  if (!passengers.length) throw new HttpError(400, "At least one passenger is required.");
  const classCode = String(body.classCode || "").toUpperCase();
  const trainInfo = body.train || {};

  const asInt = (v: unknown) => (/^\d+$/.test(String(v ?? "")) ? Number(v) : 0);
  const train = await one(
    "SELECT train_id FROM trains WHERE train_id = $1 OR train_number = $2 ORDER BY train_id = $1 DESC LIMIT 1",
    [asInt(trainInfo.id), asInt(trainInfo.number)],
  );
  if (!train) throw new HttpError(409, `Train ${trainInfo.name ?? ""} not found.`);
  const trainId = train.train_id;

  const routeStation = async (code: string | undefined, order: "ASC" | "DESC") => {
    if (code) {
      const row = await one(
        `SELECT s.station_id FROM stations s JOIN train_routes r ON r.station_id = s.station_id
         WHERE r.train_id = $1 AND UPPER(s.station_code) = UPPER($2)`,
        [trainId, code],
      );
      if (row) return row.station_id;
    }
    const row = await one(`SELECT station_id FROM train_routes WHERE train_id = $1 ORDER BY sequence_no ${order} LIMIT 1`, [
      trainId,
    ]);
    return row?.station_id;
  };
  const sourceId = await routeStation(trainInfo.fromStation?.code, "ASC");
  const destId = await routeStation(trainInfo.toStation?.code, "DESC");

  const seats = await q(
    `SELECT s.seat_id FROM seats s JOIN coaches c ON c.coach_id = s.coach_id
     WHERE c.train_id = $1 AND c.coach_type = $2 AND c.is_active = TRUE
       AND NOT EXISTS (
         SELECT 1 FROM seat_reservations sr
         WHERE sr.seat_id = s.seat_id AND sr.journey_date = $3::DATE AND sr.status = 'RESERVED'
       )
     ORDER BY c.coach_number, s.seat_number LIMIT $4`,
    [trainId, classCode, journeyDate, passengers.length],
  );
  if (seats.length < passengers.length) {
    throw new HttpError(409, `Not enough seats available in class ${classCode} for this date.`);
  }

  const payload = passengers.map((p, i) => {
    const pref = String(p.seatPreference || "").toUpperCase().replace(/ /g, "_");
    return {
      full_name: p.fullName,
      age: Number(p.age),
      gender: String(p.gender || "").toUpperCase(),
      nationality: p.nationality || "Indian",
      id_type: p.idType || "AADHAAR",
      id_number: p.idNumber || "XXXX-1234",
      class_code: classCode,
      seat_id: seats[i].seat_id,
      seat_preference: SEAT_PREFS.has(pref) ? pref : null,
    };
  });

  try {
    const res = await one(
      `SELECT pnr FROM create_booking($1, $2, $3, $4, $5::DATE, $6, $7, $8::JSONB, $9)`,
      [
        user.user_id,
        trainId,
        sourceId,
        destId,
        journeyDate,
        body.userEmail || user.email,
        user.phone || "9876543210",
        JSON.stringify(payload),
        body.payment?.method || "UPI",
      ],
    );
    return await getBookingByPnr(res!.pnr);
  } catch (error: any) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(409, error?.message || "Booking could not be created.");
  }
}

async function cancelBooking(pnr: string, reason: string) {
  try {
    await q("CALL cancel_booking($1, $2)", [pnr.trim().toUpperCase(), reason]);
  } catch (error: any) {
    throw new HttpError(400, error?.message || "Booking could not be cancelled.");
  }
  return getBookingByPnr(pnr);
}

// ---------------------------------------------------------------------------
// Admin reports
// ---------------------------------------------------------------------------

async function getMetrics() {
  const row = (await one(`SELECT
      (SELECT COUNT(*) FROM trains WHERE is_active = TRUE) AS total_trains,
      (SELECT COUNT(*) FROM stations WHERE is_active = TRUE) AS total_stations,
      (SELECT COUNT(*) FROM bookings WHERE booking_date = CURRENT_DATE) AS todays_bookings,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = 'SUCCESS') AS total_revenue,
      (SELECT COALESCE(SUM(capacity), 0) FROM coaches WHERE is_active = TRUE) AS available_seats,
      (SELECT COUNT(*) FROM bookings WHERE status = 'CANCELLED') AS cancelled_tickets,
      (SELECT COUNT(DISTINCT user_id) FROM bookings) AS active_passengers`))!;
  return {
    totalTrains: Number(row.total_trains),
    totalStations: Number(row.total_stations),
    todaysBookings: Number(row.todays_bookings),
    totalRevenue: Number(row.total_revenue),
    availableSeats: Number(row.available_seats),
    cancelledTickets: Number(row.cancelled_tickets),
    activePassengers: Number(row.active_passengers),
    onTimePerformance: 94.6,
  };
}

async function getRevenueTrends() {
  const rows = await q(`SELECT booking_date::TEXT AS date,
      COALESCE(SUM(total_fare) FILTER (WHERE status <> 'CANCELLED'), 0) AS revenue, COUNT(*) AS bookings
    FROM bookings WHERE booking_date >= CURRENT_DATE - INTERVAL '13 days'
    GROUP BY booking_date ORDER BY booking_date`);
  if (rows.length) return rows.map((r) => ({ date: r.date, revenue: Number(r.revenue), bookings: Number(r.bookings) }));
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10),
    revenue: 0,
    bookings: 0,
  }));
}

async function getClassDistribution() {
  const rows = await q(`SELECT p.class_code, COUNT(*) AS count, COALESCE(SUM(p.fare_amount), 0) AS revenue
    FROM passengers p JOIN bookings b ON b.booking_id = p.booking_id
    WHERE b.status IN ('CONFIRMED', 'WAITLIST') GROUP BY p.class_code ORDER BY revenue DESC`);
  const total = rows.reduce((s, r) => s + Number(r.count), 0) || 1;
  return rows.map((r) => ({
    classCode: r.class_code,
    count: Number(r.count),
    revenue: Number(r.revenue),
    occupancyPercent: Math.round((1000 * Number(r.count)) / total) / 10,
  }));
}

async function getReports(days = 30) {
  const summary = (await one(
    `SELECT
        COUNT(*) FILTER (WHERE status <> 'CANCELLED') AS tickets,
        COALESCE(SUM(total_fare) FILTER (WHERE status <> 'CANCELLED'), 0) AS gross,
        COALESCE((SELECT SUM(refund_amount) FROM cancellations
                  WHERE cancelled_at >= CURRENT_DATE - ($1 * INTERVAL '1 day')), 0) AS refunds
     FROM bookings WHERE booking_date >= CURRENT_DATE - ($1 * INTERVAL '1 day')`,
    [days],
  ))!;
  const routes = await q(
    `SELECT ss.station_name || ' → ' || ds.station_name AS route, COUNT(*) AS bookings,
        COALESCE(SUM(b.total_fare), 0) AS revenue
     FROM bookings b
     JOIN stations ss ON ss.station_id = b.source_station_id
     JOIN stations ds ON ds.station_id = b.destination_station_id
     WHERE b.status <> 'CANCELLED' AND b.booking_date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
     GROUP BY ss.station_name, ds.station_name ORDER BY bookings DESC LIMIT 6`,
    [days],
  );
  const gross = Number(summary.gross);
  const refunds = Number(summary.refunds);
  return {
    totalTicketsSold: Number(summary.tickets),
    totalGrossRevenue: gross,
    cancellationLoss: refunds,
    netRevenue: gross - refunds,
    topRoutes: routes.map((r) => ({ route: r.route, bookings: Number(r.bookings), revenue: Number(r.revenue) })),
  };
}

async function listUsers() {
  const rows = await q(`SELECT u.user_id, u.full_name, u.email, u.phone, u.role, u.is_active,
      COUNT(b.booking_id) FILTER (WHERE b.status IN ('CONFIRMED', 'COMPLETED')) AS trips
    FROM users u LEFT JOIN bookings b ON b.user_id = u.user_id
    GROUP BY u.user_id ORDER BY u.user_id`);
  return rows.map((r) => ({
    id: String(r.user_id),
    name: r.full_name,
    email: r.email,
    phone: r.phone,
    role: r.role,
    trips: Number(r.trips),
    status: r.role === "ADMIN" ? "ADMIN" : r.is_active ? "VERIFIED" : "INACTIVE",
  }));
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

async function readBody(req: Request): Promise<Row> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

async function route(req: Request, url: URL): Promise<Response> {
  const method = req.method.toUpperCase();
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const [section, a, b, c] = parts;
  const notFound = (what: string) => new HttpError(404, `${what} not found`);

  if (!section) return json({ project: "RAILNEX", tagline: "Your Journey. Reimagined.", status: "ok" });

  if (section === "health") {
    try {
      await one("SELECT 1 AS ok");
      return json({ status: "ok", database: "connected" });
    } catch {
      return json({ status: "degraded", database: "disconnected" });
    }
  }

  if (section === "auth") {
    if (a === "register" && method === "POST") return json(await register(await readBody(req)));
    if (a === "login" && method === "POST") return json(await login(await readBody(req)));
    if (a === "logout") return json({ message: "Logged out successfully" });
    const user = await requireUser(req);
    if (a === "me" && method === "GET") return json(await getUserProfile(user.user_id));
    if (a === "me" && method === "PUT") {
      const body = await readBody(req);
      if (body.fullName) await q("UPDATE users SET full_name = $2 WHERE user_id = $1", [user.user_id, String(body.fullName).trim()]);
      if (body.phone) await q("UPDATE users SET phone = $2 WHERE user_id = $1", [user.user_id, String(body.phone).trim()]);
      return json(await getUserProfile(user.user_id));
    }
    if (a === "saved-passengers" && !b && method === "GET") {
      return json((await getUserProfile(user.user_id)).savedPassengers);
    }
    if (a === "saved-passengers" && !b && method === "POST") {
      const body = await readBody(req);
      const row = await one(
        `INSERT INTO saved_passengers (user_id, full_name, age, gender, id_type, id_number, preference)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING saved_passenger_id, full_name, age, gender, id_type, id_number, preference`,
        [
          user.user_id,
          String(body.fullName || "").trim(),
          Number(body.age),
          String(body.gender || "").toUpperCase(),
          body.idType ?? null,
          body.idNumber ?? null,
          body.preference || "LOWER",
        ],
      ).catch((e) => {
        throw new HttpError(400, e?.message || "Invalid passenger details");
      });
      return json(mapSavedPassenger(row!));
    }
    if (a === "saved-passengers" && b && method === "DELETE") {
      if (/^\d+$/.test(b)) await q("DELETE FROM saved_passengers WHERE saved_passenger_id = $1 AND user_id = $2", [b, user.user_id]);
      return json({ message: "Saved passenger removed" });
    }
  }

  if (section === "stations" && method === "GET") {
    if (!a) return json(await listStations());
    if (a === "search") return json(await searchStations(url.searchParams.get("query") || ""));
    const station = await getStation(a);
    if (!station) throw notFound("Station");
    return json(station);
  }

  if (section === "trains" && method === "GET") {
    if (!a) return json(await searchTrains({}));
    if (a === "search") {
      const fromStation = url.searchParams.get("fromStation");
      const toStation = url.searchParams.get("toStation");
      const journeyDate = url.searchParams.get("journeyDate");
      if (!fromStation || !toStation || !journeyDate) {
        throw new HttpError(400, "fromStation, toStation and journeyDate are required");
      }
      return json(await searchTrains({ fromStation, toStation, journeyDate }));
    }
    const train = await getTrain(a);
    if (!train) throw notFound("Train");
    if (!b) return json(train);
    if (b === "route") {
      return json({ trainId: train.id, route: await getRouteStops(train.id), origin: train.fromStation, destination: train.toStation });
    }
    if (b === "fares" || b === "classes") return json({ trainId: train.id, classes: train.classes });
  }

  if (section === "bookings") {
    if (!a && method === "POST") {
      const user = await requireUser(req);
      return json(await createBooking(await readBody(req), user));
    }
    if (a === "me" && method === "GET") {
      const user = await requireUser(req);
      return json(await bookingsForPnrs(await q("SELECT pnr FROM bookings WHERE user_id = $1 ORDER BY created_at DESC", [user.user_id])));
    }
    if (a && !b && (method === "GET" || method === "PATCH")) {
      const booking = await getBookingByPnr(a);
      if (!booking) throw notFound("Booking");
      return json(booking);
    }
    if (a && b === "cancel" && method === "POST") {
      const user = await requireUser(req);
      const existing = await getBookingByPnr(a);
      if (!existing) throw notFound("Booking");
      if (user.role !== "ADMIN" && existing.userId !== String(user.user_id)) {
        throw new HttpError(403, "You cannot cancel another user's booking");
      }
      const body = await readBody(req);
      return json(await cancelBooking(a, body.reason || "User requested cancellation"));
    }
  }

  if (section === "admin") {
    await requireAdmin(req);
    if (a === "metrics" || (a === "reports" && b === "overview")) return json(await getMetrics());

    if (a === "trains") {
      if (!b && method === "GET") return json(await searchTrains({}));
      if (!b && method === "POST") return json(await createTrain(await readBody(req)));
      if (b && method === "PUT") {
        const train = await updateTrain(b, await readBody(req));
        if (!train) throw notFound("Train");
        return json(train);
      }
      if (b && method === "DELETE") {
        await deleteTrain(b);
        return json({ message: "Train deactivated" });
      }
    }

    if (a === "stations") {
      if (!b && method === "GET") return json(await listStations());
      if (!b && method === "POST") return json(await createStation(await readBody(req)));
      if (b && method === "PUT") {
        const station = await updateStation(b, await readBody(req));
        if (!station) throw notFound("Station");
        return json(station);
      }
      if (b && method === "DELETE") {
        await q("UPDATE stations SET is_active = FALSE, updated_at = NOW() WHERE UPPER(station_code) = UPPER($1)", [b]);
        return json({ message: "Station deactivated" });
      }
    }

    const allBookings = async () => bookingsForPnrs(await q("SELECT pnr FROM bookings ORDER BY created_at DESC LIMIT 200"));
    if (a === "bookings" && method === "GET") return json(await allBookings());
    if (a === "users" && method === "GET") return json({ users: await listUsers() });
    if (a === "routes" && method === "GET") return json({ routes: [] });
    if (a === "coaches" && method === "GET") return json({ coaches: [] });
    if (a === "seats" && method === "GET") return json({ seats: [] });

    if (a === "reports" && method === "GET") {
      if (b === "bookings") return json({ bookings: await allBookings() });
      if (b === "revenue") return json({ revenue: await getRevenueTrends() });
      if (b === "occupancy") return json({ occupancy: await getClassDistribution() });
      if (b === "routes") return json({ routes: (await getReports()).topRoutes });
      if (b === "cancellations") {
        const report = await getReports();
        return json({ cancellations: { loss: report.cancellationLoss, tickets: report.totalTicketsSold } });
      }
    }
  }

  void c;
  throw new HttpError(404, "Not found");
}

export default async (req: Request) => {
  const url = new URL(req.url);
  try {
    return await route(req, url);
  } catch (error) {
    if (error instanceof HttpError) return json({ detail: error.message }, error.status);
    console.error(error);
    return json({ detail: "Internal server error" }, 500);
  }
};

export const config: Config = {
  path: "/api/*",
};
