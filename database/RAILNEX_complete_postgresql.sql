
-- ============================================================
-- RAILNEX - RAILWAY RESERVATION SYSTEM
-- PostgreSQL Database Script
-- Version: October 2026
--
-- IMPORTANT:
-- 1) Run SECTION A while connected to the default "postgres" database.
-- 2) After SECTION A, connect pgAdmin to "railway_reservation".
-- 3) Run SECTION B onward in that database.
-- 4) This script is intended for a fresh project database.
-- ============================================================


-- ============================================================
-- SECTION A - CREATE DATABASE
-- Run this section separately while connected to "postgres".
-- ============================================================

CREATE DATABASE railway_reservation;


-- ============================================================
-- SECTION B - EXTENSIONS + CLEAN RESET (OPTIONAL)
-- Connect to railway_reservation before running this section.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- OPTIONAL RESET FOR DEVELOPMENT ONLY:
-- WARNING: The next command deletes EVERYTHING in this database.
-- Uncomment only when you want to rebuild the project from scratch.
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;


-- ============================================================
-- SECTION C - TABLES
-- ============================================================

CREATE TABLE users (
    user_id          BIGSERIAL PRIMARY KEY,
    full_name        VARCHAR(120) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    phone            VARCHAR(20),
    password_hash    VARCHAR(255) NOT NULL,
    role             VARCHAR(20) NOT NULL DEFAULT 'USER',
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_users_role
        CHECK (role IN ('USER', 'ADMIN')),

    CONSTRAINT chk_users_name
        CHECK (length(trim(full_name)) >= 2)
);


CREATE TABLE stations (
    station_id       BIGSERIAL PRIMARY KEY,
    station_code     VARCHAR(10) NOT NULL,
    station_name     VARCHAR(120) NOT NULL,
    city             VARCHAR(100) NOT NULL,
    state            VARCHAR(100) NOT NULL,
    railway_zone     VARCHAR(100),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_station_code
        UNIQUE (station_code),

    CONSTRAINT chk_station_code
        CHECK (station_code = UPPER(station_code))
);


CREATE TABLE trains (
    train_id         BIGSERIAL PRIMARY KEY,
    train_number     INTEGER NOT NULL,
    train_name       VARCHAR(150) NOT NULL,
    train_type       VARCHAR(30) NOT NULL,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_train_number
        UNIQUE (train_number),

    CONSTRAINT chk_train_number
        CHECK (train_number BETWEEN 1 AND 99999),

    CONSTRAINT chk_train_type
        CHECK (
            train_type IN (
                'EXPRESS',
                'SUPERFAST',
                'RAJDHANI',
                'SHATABDI',
                'VANDE_BHARAT',
                'DURONTO',
                'HUMSAFAR',
                'INTERCITY'
            )
        )
);


-- Operating days are normalized into a separate table.
-- day_of_week: 1 = Monday, ... 7 = Sunday.
CREATE TABLE train_operating_days (
    train_id         BIGINT NOT NULL,
    day_of_week      SMALLINT NOT NULL,

    PRIMARY KEY (train_id, day_of_week),

    CONSTRAINT fk_operating_days_train
        FOREIGN KEY (train_id)
        REFERENCES trains(train_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_day_of_week
        CHECK (day_of_week BETWEEN 1 AND 7)
);


CREATE TABLE train_routes (
    route_id                 BIGSERIAL PRIMARY KEY,
    train_id                 BIGINT NOT NULL,
    station_id               BIGINT NOT NULL,
    sequence_no              INTEGER NOT NULL,
    arrival_time             TIME,
    departure_time           TIME,
    day_offset               SMALLINT NOT NULL DEFAULT 0,
    distance_from_origin_km  NUMERIC(8,2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_route_train
        FOREIGN KEY (train_id)
        REFERENCES trains(train_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_route_station
        FOREIGN KEY (station_id)
        REFERENCES stations(station_id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_train_route_sequence
        UNIQUE (train_id, sequence_no),

    CONSTRAINT uq_train_route_station
        UNIQUE (train_id, station_id),

    CONSTRAINT chk_route_sequence
        CHECK (sequence_no >= 1),

    CONSTRAINT chk_route_day_offset
        CHECK (day_offset >= 0),

    CONSTRAINT chk_route_distance
        CHECK (distance_from_origin_km >= 0),

    CONSTRAINT chk_route_times
        CHECK (
            arrival_time IS NOT NULL
            OR departure_time IS NOT NULL
        )
);


CREATE TABLE coaches (
    coach_id         BIGSERIAL PRIMARY KEY,
    train_id         BIGINT NOT NULL,
    coach_number     VARCHAR(10) NOT NULL,
    coach_type       VARCHAR(5) NOT NULL,
    capacity         INTEGER NOT NULL DEFAULT 20,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_coach_train
        FOREIGN KEY (train_id)
        REFERENCES trains(train_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_train_coach_number
        UNIQUE (train_id, coach_number),

    CONSTRAINT chk_coach_type
        CHECK (
            coach_type IN (
                '1A',
                '2A',
                '3A',
                'SL',
                'CC',
                'EC',
                '2S'
            )
        ),

    CONSTRAINT chk_coach_capacity
        CHECK (capacity > 0)
);


CREATE TABLE seats (
    seat_id          BIGSERIAL PRIMARY KEY,
    coach_id         BIGINT NOT NULL,
    seat_number      INTEGER NOT NULL,
    seat_type        VARCHAR(20) NOT NULL DEFAULT 'NORMAL',

    CONSTRAINT fk_seat_coach
        FOREIGN KEY (coach_id)
        REFERENCES coaches(coach_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_coach_seat_number
        UNIQUE (coach_id, seat_number),

    CONSTRAINT chk_seat_number
        CHECK (seat_number > 0),

    CONSTRAINT chk_seat_type
        CHECK (
            seat_type IN (
                'NORMAL',
                'LOWER',
                'MIDDLE',
                'UPPER',
                'SIDE_LOWER',
                'SIDE_UPPER'
            )
        )
);


CREATE TABLE fares (
    fare_id                BIGSERIAL PRIMARY KEY,
    train_id               BIGINT NOT NULL,
    class_code             VARCHAR(5) NOT NULL,
    full_route_fare        NUMERIC(10,2) NOT NULL,
    reservation_charge     NUMERIC(10,2) NOT NULL DEFAULT 40.00,
    gst_rate               NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    is_active              BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_fare_train
        FOREIGN KEY (train_id)
        REFERENCES trains(train_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_train_class_fare
        UNIQUE (train_id, class_code),

    CONSTRAINT chk_fare_class
        CHECK (
            class_code IN (
                '1A',
                '2A',
                '3A',
                'SL',
                'CC',
                'EC',
                '2S'
            )
        ),

    CONSTRAINT chk_fare_amount
        CHECK (full_route_fare > 0),

    CONSTRAINT chk_reservation_charge
        CHECK (reservation_charge >= 0),

    CONSTRAINT chk_gst_rate
        CHECK (gst_rate >= 0 AND gst_rate <= 100)
);


CREATE TABLE bookings (
    booking_id             BIGSERIAL PRIMARY KEY,
    pnr                     VARCHAR(10) NOT NULL,
    user_id                 BIGINT NOT NULL,
    train_id                BIGINT NOT NULL,
    source_station_id       BIGINT NOT NULL,
    destination_station_id  BIGINT NOT NULL,
    journey_date            DATE NOT NULL,
    booking_date            DATE NOT NULL DEFAULT CURRENT_DATE,
    status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    total_fare              NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    contact_email           VARCHAR(255) NOT NULL,
    contact_phone           VARCHAR(20),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_booking_pnr
        UNIQUE (pnr),

    CONSTRAINT fk_booking_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_booking_train
        FOREIGN KEY (train_id)
        REFERENCES trains(train_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_booking_source
        FOREIGN KEY (source_station_id)
        REFERENCES stations(station_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_booking_destination
        FOREIGN KEY (destination_station_id)
        REFERENCES stations(station_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_booking_status
        CHECK (
            status IN (
                'PENDING',
                'CONFIRMED',
                'CANCELLED',
                'WAITLIST',
                'FAILED'
            )
        ),

    CONSTRAINT chk_booking_total
        CHECK (total_fare >= 0),

    CONSTRAINT chk_booking_different_stations
        CHECK (source_station_id <> destination_station_id)
);


CREATE TABLE passengers (
    passenger_id       BIGSERIAL PRIMARY KEY,
    booking_id         BIGINT NOT NULL,
    full_name          VARCHAR(120) NOT NULL,
    age                INTEGER NOT NULL,
    gender             VARCHAR(20) NOT NULL,
    nationality        VARCHAR(60) NOT NULL DEFAULT 'Indian',
    id_type            VARCHAR(30),
    id_number          VARCHAR(60),
    class_code         VARCHAR(5) NOT NULL,
    seat_preference    VARCHAR(20),
    fare_amount        NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_passenger_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_passenger_age
        CHECK (age BETWEEN 1 AND 120),

    CONSTRAINT chk_passenger_gender
        CHECK (
            gender IN (
                'MALE',
                'FEMALE',
                'OTHER'
            )
        ),

    CONSTRAINT chk_passenger_class
        CHECK (
            class_code IN (
                '1A',
                '2A',
                '3A',
                'SL',
                'CC',
                'EC',
                '2S'
            )
        ),

    CONSTRAINT chk_passenger_preference
        CHECK (
            seat_preference IS NULL
            OR seat_preference IN (
                'LOWER',
                'MIDDLE',
                'UPPER',
                'SIDE_LOWER',
                'SIDE_UPPER',
                'WINDOW',
                'AISLE'
            )
        ),

    CONSTRAINT chk_passenger_fare
        CHECK (fare_amount >= 0)
);


CREATE TABLE seat_reservations (
    reservation_id    BIGSERIAL PRIMARY KEY,
    booking_id        BIGINT NOT NULL,
    passenger_id      BIGINT NOT NULL,
    seat_id           BIGINT NOT NULL,
    journey_date      DATE NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'RESERVED',
    reserved_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at       TIMESTAMPTZ,

    CONSTRAINT fk_seat_res_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_seat_res_passenger
        FOREIGN KEY (passenger_id)
        REFERENCES passengers(passenger_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_seat_res_seat
        FOREIGN KEY (seat_id)
        REFERENCES seats(seat_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_seat_reservation_status
        CHECK (
            status IN (
                'RESERVED',
                'RELEASED'
            )
        )
);


CREATE TABLE payments (
    payment_id        BIGSERIAL PRIMARY KEY,
    booking_id        BIGINT NOT NULL,
    amount            NUMERIC(12,2) NOT NULL,
    payment_method    VARCHAR(30) NOT NULL,
    payment_status    VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    transaction_ref   VARCHAR(100),
    paid_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_payment_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_payment_booking
        UNIQUE (booking_id),

    CONSTRAINT chk_payment_amount
        CHECK (amount >= 0),

    CONSTRAINT chk_payment_method
        CHECK (
            payment_method IN (
                'UPI',
                'CARD',
                'NET_BANKING',
                'WALLET',
                'CASH'
            )
        ),

    CONSTRAINT chk_payment_status
        CHECK (
            payment_status IN (
                'PENDING',
                'SUCCESS',
                'FAILED',
                'REFUNDED'
            )
        )
);


CREATE TABLE cancellations (
    cancellation_id   BIGSERIAL PRIMARY KEY,
    booking_id        BIGINT NOT NULL,
    cancelled_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason            VARCHAR(255),
    refund_amount     NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status            VARCHAR(20) NOT NULL DEFAULT 'PROCESSED',

    CONSTRAINT fk_cancellation_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_cancellation_booking
        UNIQUE (booking_id),

    CONSTRAINT chk_refund_amount
        CHECK (refund_amount >= 0),

    CONSTRAINT chk_cancellation_status
        CHECK (
            status IN (
                'PROCESSED',
                'REJECTED'
            )
        )
);


CREATE TABLE audit_logs (
    audit_id          BIGSERIAL PRIMARY KEY,
    user_id           BIGINT,
    action            VARCHAR(100) NOT NULL,
    entity_name       VARCHAR(100) NOT NULL,
    entity_id         BIGINT,
    details           JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);


-- ============================================================
-- SECTION D - INDEXES
-- ============================================================

CREATE UNIQUE INDEX uq_users_email_lower
    ON users (LOWER(email));

CREATE INDEX idx_users_role
    ON users(role);

CREATE INDEX idx_stations_name
    ON stations(station_name);

CREATE INDEX idx_stations_city
    ON stations(city);

CREATE INDEX idx_train_routes_train_sequence
    ON train_routes(train_id, sequence_no);

CREATE INDEX idx_train_routes_station
    ON train_routes(station_id);

CREATE INDEX idx_coaches_train_type
    ON coaches(train_id, coach_type);

CREATE INDEX idx_seats_coach
    ON seats(coach_id);

CREATE INDEX idx_fares_train_class
    ON fares(train_id, class_code);

CREATE INDEX idx_bookings_user_date
    ON bookings(user_id, journey_date);

CREATE INDEX idx_bookings_train_date
    ON bookings(train_id, journey_date);

CREATE INDEX idx_bookings_status
    ON bookings(status);

CREATE INDEX idx_bookings_pnr
    ON bookings(pnr);

CREATE INDEX idx_passengers_booking
    ON passengers(booking_id);

CREATE INDEX idx_seat_reservations_booking
    ON seat_reservations(booking_id);

CREATE INDEX idx_seat_reservations_date
    ON seat_reservations(journey_date);

-- This is the key anti-double-booking constraint:
-- a seat can have at most one ACTIVE reservation for a given date.
CREATE UNIQUE INDEX uq_active_seat_journey
    ON seat_reservations(seat_id, journey_date)
    WHERE status = 'RESERVED';


-- ============================================================
-- SECTION E - GENERIC UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER trg_stations_updated_at
BEFORE UPDATE ON stations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER trg_trains_updated_at
BEFORE UPDATE ON trains
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- SECTION F - DATA VALIDATION FUNCTIONS
-- ============================================================

-- Validate that the selected stations are on the train in the
-- correct order and the train is operating on that day.
CREATE OR REPLACE FUNCTION validate_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_source_seq       INTEGER;
    v_destination_seq  INTEGER;
    v_operates         BOOLEAN;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM trains
        WHERE train_id = NEW.train_id
          AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Train % does not exist or is inactive.', NEW.train_id;
    END IF;

    IF NEW.journey_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Journey date % cannot be in the past.', NEW.journey_date;
    END IF;

    SELECT sequence_no
    INTO v_source_seq
    FROM train_routes
    WHERE train_id = NEW.train_id
      AND station_id = NEW.source_station_id;

    IF v_source_seq IS NULL THEN
        RAISE EXCEPTION
            'Source station % is not on train % route.',
            NEW.source_station_id,
            NEW.train_id;
    END IF;

    SELECT sequence_no
    INTO v_destination_seq
    FROM train_routes
    WHERE train_id = NEW.train_id
      AND station_id = NEW.destination_station_id;

    IF v_destination_seq IS NULL THEN
        RAISE EXCEPTION
            'Destination station % is not on train % route.',
            NEW.destination_station_id,
            NEW.train_id;
    END IF;

    IF v_source_seq >= v_destination_seq THEN
        RAISE EXCEPTION
            'Destination must occur after source on the train route.';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM train_operating_days
        WHERE train_id = NEW.train_id
          AND day_of_week = EXTRACT(ISODOW FROM NEW.journey_date)::SMALLINT
    )
    INTO v_operates;

    IF NOT v_operates THEN
        RAISE EXCEPTION
            'Train % does not operate on %.',
            NEW.train_id,
            NEW.journey_date;
    END IF;

    RETURN NEW;
END;
$$;


CREATE TRIGGER trg_validate_booking
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION validate_booking();


-- Calculate a segment fare from route distance.
CREATE OR REPLACE FUNCTION calculate_segment_fare(
    p_train_id BIGINT,
    p_source_station_id BIGINT,
    p_destination_station_id BIGINT,
    p_class_code VARCHAR(5)
)
RETURNS NUMERIC(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_source_distance       NUMERIC(8,2);
    v_destination_distance  NUMERIC(8,2);
    v_full_distance         NUMERIC(8,2);
    v_full_route_fare       NUMERIC(10,2);
    v_reservation_charge    NUMERIC(10,2);
    v_gst_rate              NUMERIC(5,2);
    v_base                  NUMERIC(10,2);
    v_gst                   NUMERIC(10,2);
BEGIN
    SELECT
        distance_from_origin_km
    INTO v_source_distance
    FROM train_routes
    WHERE train_id = p_train_id
      AND station_id = p_source_station_id;

    SELECT
        distance_from_origin_km
    INTO v_destination_distance
    FROM train_routes
    WHERE train_id = p_train_id
      AND station_id = p_destination_station_id;

    SELECT
        MAX(distance_from_origin_km)
    INTO v_full_distance
    FROM train_routes
    WHERE train_id = p_train_id;

    SELECT
        full_route_fare,
        reservation_charge,
        gst_rate
    INTO
        v_full_route_fare,
        v_reservation_charge,
        v_gst_rate
    FROM fares
    WHERE train_id = p_train_id
      AND class_code = UPPER(p_class_code)
      AND is_active = TRUE;

    IF v_source_distance IS NULL
       OR v_destination_distance IS NULL THEN
        RAISE EXCEPTION
            'Invalid source/destination for train %.',
            p_train_id;
    END IF;

    IF v_full_route_fare IS NULL THEN
        RAISE EXCEPTION
            'Fare not configured for train %, class %.',
            p_train_id,
            p_class_code;
    END IF;

    IF v_full_distance IS NULL OR v_full_distance <= 0 THEN
        RAISE EXCEPTION
            'Invalid route distance for train %.',
            p_train_id;
    END IF;

    IF v_destination_distance <= v_source_distance THEN
        RAISE EXCEPTION
            'Destination must be after source.';
    END IF;

    v_base :=
        ROUND(
            v_full_route_fare *
            ((v_destination_distance - v_source_distance) / v_full_distance),
            2
        );

    -- Apply a reservation charge and GST to the base segment fare.
    v_gst :=
        ROUND(
            (v_base + v_reservation_charge) * (v_gst_rate / 100.0),
            2
        );

    RETURN ROUND(
        v_base + v_reservation_charge + v_gst,
        2
    );
END;
$$;


-- Automatically calculate each passenger's fare from the booking.
CREATE OR REPLACE FUNCTION set_passenger_fare()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_train_id          BIGINT;
    v_source_station    BIGINT;
    v_destination       BIGINT;
BEGIN
    SELECT
        train_id,
        source_station_id,
        destination_station_id
    INTO
        v_train_id,
        v_source_station,
        v_destination
    FROM bookings
    WHERE booking_id = NEW.booking_id;

    IF v_train_id IS NULL THEN
        RAISE EXCEPTION
            'Booking % does not exist.',
            NEW.booking_id;
    END IF;

    NEW.class_code = UPPER(NEW.class_code);

    NEW.fare_amount :=
        calculate_segment_fare(
            v_train_id,
            v_source_station,
            v_destination,
            NEW.class_code
        );

    RETURN NEW;
END;
$$;


CREATE TRIGGER trg_set_passenger_fare
BEFORE INSERT OR UPDATE OF class_code, booking_id
ON passengers
FOR EACH ROW
EXECUTE FUNCTION set_passenger_fare();


-- Recalculate booking total whenever passengers change.
CREATE OR REPLACE FUNCTION refresh_booking_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_booking_id BIGINT;
BEGIN
    v_booking_id :=
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.booking_id
            ELSE NEW.booking_id
        END;

    UPDATE bookings
    SET total_fare = (
        SELECT COALESCE(SUM(fare_amount), 0.00)
        FROM passengers
        WHERE booking_id = v_booking_id
    )
    WHERE booking_id = v_booking_id;

    RETURN CASE
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$;


CREATE TRIGGER trg_refresh_booking_total
AFTER INSERT OR UPDATE OR DELETE
ON passengers
FOR EACH ROW
EXECUTE FUNCTION refresh_booking_total();


-- Validate that a reserved seat belongs to:
-- 1) the same train as the booking,
-- 2) the same class as the passenger,
-- 3) the same journey date.
CREATE OR REPLACE FUNCTION validate_seat_reservation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_booking_train       BIGINT;
    v_booking_date        DATE;
    v_passenger_booking   BIGINT;
    v_passenger_class     VARCHAR(5);
    v_seat_train          BIGINT;
    v_coach_class         VARCHAR(5);
BEGIN
    SELECT train_id, journey_date
    INTO v_booking_train, v_booking_date
    FROM bookings
    WHERE booking_id = NEW.booking_id;

    IF v_booking_train IS NULL THEN
        RAISE EXCEPTION
            'Booking % does not exist.',
            NEW.booking_id;
    END IF;

    SELECT booking_id, class_code
    INTO v_passenger_booking, v_passenger_class
    FROM passengers
    WHERE passenger_id = NEW.passenger_id;

    IF v_passenger_booking IS NULL THEN
        RAISE EXCEPTION
            'Passenger % does not exist.',
            NEW.passenger_id;
    END IF;

    IF v_passenger_booking <> NEW.booking_id THEN
        RAISE EXCEPTION
            'Passenger % does not belong to booking %.',
            NEW.passenger_id,
            NEW.booking_id;
    END IF;

    IF NEW.journey_date <> v_booking_date THEN
        RAISE EXCEPTION
            'Seat reservation date does not match booking date.';
    END IF;

    SELECT
        c.train_id,
        c.coach_type
    INTO
        v_seat_train,
        v_coach_class
    FROM seats s
    JOIN coaches c
      ON c.coach_id = s.coach_id
    WHERE s.seat_id = NEW.seat_id;

    IF v_seat_train IS NULL THEN
        RAISE EXCEPTION
            'Seat % does not exist.',
            NEW.seat_id;
    END IF;

    IF v_seat_train <> v_booking_train THEN
        RAISE EXCEPTION
            'Seat % does not belong to train %.',
            NEW.seat_id,
            v_booking_train;
    END IF;

    IF v_coach_class <> v_passenger_class THEN
        RAISE EXCEPTION
            'Seat class % does not match passenger class %.',
            v_coach_class,
            v_passenger_class;
    END IF;

    RETURN NEW;
END;
$$;


CREATE TRIGGER trg_validate_seat_reservation
BEFORE INSERT OR UPDATE ON seat_reservations
FOR EACH ROW
EXECUTE FUNCTION validate_seat_reservation();


-- ============================================================
-- SECTION G - PNR + BOOKING FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION generate_pnr()
RETURNS VARCHAR(10)
LANGUAGE plpgsql
AS $$
DECLARE
    v_pnr VARCHAR(10);
BEGIN
    LOOP
        v_pnr :=
            UPPER(
                SUBSTRING(
                    MD5(clock_timestamp()::TEXT || random()::TEXT)
                    FROM 1 FOR 10
                )
            );

        EXIT WHEN NOT EXISTS (
            SELECT 1
            FROM bookings
            WHERE pnr = v_pnr
        );
    END LOOP;

    RETURN v_pnr;
END;
$$;


-- ============================================================
-- Create a complete booking.
--
-- p_passengers must be a JSON array like:
--
-- [
--   {
--     "full_name": "Rajdeep Biswas",
--     "age": 22,
--     "gender": "MALE",
--     "nationality": "Indian",
--     "id_type": "AADHAAR",
--     "id_number": "DEMO-ID-001",
--     "class_code": "3A",
--     "seat_preference": "LOWER",
--     "seat_id": 123
--   }
-- ]
--
-- This function:
-- 1) validates the booking route/date,
-- 2) creates the booking,
-- 3) locks logical seat resources,
-- 4) prevents double-booking,
-- 5) inserts passengers,
-- 6) reserves seats,
-- 7) calculates fares,
-- 8) creates a demo-success payment,
-- 9) returns PNR and total.
-- ============================================================

CREATE OR REPLACE FUNCTION create_booking(
    p_user_id                BIGINT,
    p_train_id               BIGINT,
    p_source_station_id      BIGINT,
    p_destination_station_id BIGINT,
    p_journey_date            DATE,
    p_contact_email           VARCHAR(255),
    p_contact_phone           VARCHAR(20),
    p_passengers              JSONB,
    p_payment_method          VARCHAR(30) DEFAULT 'UPI'
)
RETURNS TABLE (
    booking_id BIGINT,
    pnr VARCHAR(10),
    total_fare NUMERIC(12,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_booking_id      BIGINT;
    v_pnr             VARCHAR(10);
    v_item            JSONB;
    v_passenger_id    BIGINT;
    v_seat_id         BIGINT;
    v_class_code      VARCHAR(5);
    v_locked_seat     BIGINT;
    v_payment_ref     VARCHAR(100);
    v_total_fare      NUMERIC(12,2);
BEGIN
    IF p_passengers IS NULL
       OR jsonb_typeof(p_passengers) <> 'array'
       OR jsonb_array_length(p_passengers) = 0 THEN
        RAISE EXCEPTION 'At least one passenger is required.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM users
        WHERE user_id = p_user_id
          AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION
            'User % does not exist or is inactive.',
            p_user_id;
    END IF;

    v_pnr := generate_pnr();

    INSERT INTO bookings (
        pnr,
        user_id,
        train_id,
        source_station_id,
        destination_station_id,
        journey_date,
        status,
        contact_email,
        contact_phone
    )
    VALUES (
        v_pnr,
        p_user_id,
        p_train_id,
        p_source_station_id,
        p_destination_station_id,
        p_journey_date,
        'PENDING',
        LOWER(TRIM(p_contact_email)),
        p_contact_phone
    )
    RETURNING bookings.booking_id
    INTO v_booking_id;

    FOR v_item IN
        SELECT value
        FROM jsonb_array_elements(p_passengers)
    LOOP
        v_class_code :=
            UPPER(TRIM(v_item ->> 'class_code'));

        IF v_item ->> 'seat_id' IS NULL THEN
            RAISE EXCEPTION
                'Each confirmed passenger must contain seat_id.';
        END IF;

        v_seat_id :=
            (v_item ->> 'seat_id')::BIGINT;

        -- Serialize concurrent attempts to reserve this logical seat.
        PERFORM pg_advisory_xact_lock(
            hashtextextended(
                p_train_id::TEXT || ':' || v_seat_id::TEXT || ':' || p_journey_date::TEXT,
                0
            )
        );

        -- Lock the actual seat row and verify train/class.
        SELECT s.seat_id
        INTO v_locked_seat
        FROM seats s
        JOIN coaches c
          ON c.coach_id = s.coach_id
        WHERE s.seat_id = v_seat_id
          AND c.train_id = p_train_id
          AND c.coach_type = v_class_code
          AND c.is_active = TRUE
          AND s.seat_id IS NOT NULL
        FOR UPDATE;

        IF v_locked_seat IS NULL THEN
            RAISE EXCEPTION
                'Seat % is invalid for train % and class %.',
                v_seat_id,
                p_train_id,
                v_class_code;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM seat_reservations sr
            WHERE sr.seat_id = v_seat_id
              AND sr.journey_date = p_journey_date
              AND sr.status = 'RESERVED'
        ) THEN
            RAISE EXCEPTION
                'Seat % is already reserved for %.',
                v_seat_id,
                p_journey_date;
        END IF;

        INSERT INTO passengers (
            booking_id,
            full_name,
            age,
            gender,
            nationality,
            id_type,
            id_number,
            class_code,
            seat_preference
        )
        VALUES (
            v_booking_id,
            TRIM(v_item ->> 'full_name'),
            (v_item ->> 'age')::INTEGER,
            UPPER(TRIM(v_item ->> 'gender')),
            COALESCE(
                NULLIF(TRIM(v_item ->> 'nationality'), ''),
                'Indian'
            ),
            NULLIF(TRIM(v_item ->> 'id_type'), ''),
            NULLIF(TRIM(v_item ->> 'id_number'), ''),
            v_class_code,
            NULLIF(
                UPPER(TRIM(v_item ->> 'seat_preference')),
                ''
            )
        )
        RETURNING passenger_id
        INTO v_passenger_id;

        INSERT INTO seat_reservations (
            booking_id,
            passenger_id,
            seat_id,
            journey_date,
            status
        )
        VALUES (
            v_booking_id,
            v_passenger_id,
            v_seat_id,
            p_journey_date,
            'RESERVED'
        );
    END LOOP;

    SELECT b.total_fare
    INTO v_total_fare
    FROM bookings b
    WHERE b.booking_id = v_booking_id;

    UPDATE bookings
    SET status = 'CONFIRMED'
    WHERE bookings.booking_id = v_booking_id;

    v_payment_ref :=
        'DEMO-' ||
        UPPER(
            SUBSTRING(
                MD5(v_booking_id::TEXT || clock_timestamp()::TEXT)
                FROM 1 FOR 20
            )
        );

    INSERT INTO payments (
        booking_id,
        amount,
        payment_method,
        payment_status,
        transaction_ref,
        paid_at
    )
    VALUES (
        v_booking_id,
        v_total_fare,
        UPPER(p_payment_method),
        'SUCCESS',
        v_payment_ref,
        NOW()
    );

    INSERT INTO audit_logs (
        user_id,
        action,
        entity_name,
        entity_id,
        details
    )
    VALUES (
        p_user_id,
        'BOOKING_CREATED',
        'bookings',
        v_booking_id,
        jsonb_build_object(
            'pnr', v_pnr,
            'train_id', p_train_id,
            'journey_date', p_journey_date
        )
    );

    booking_id := v_booking_id;
    pnr := v_pnr;

    SELECT b.total_fare
    INTO v_total_fare
    FROM bookings b
    WHERE b.booking_id = v_booking_id;

    RETURN NEXT;
END;
$$;


-- ============================================================
-- SECTION H - CANCELLATION PROCEDURE
-- ============================================================

CREATE OR REPLACE PROCEDURE cancel_booking(
    p_pnr VARCHAR(10),
    p_reason VARCHAR(255) DEFAULT 'User requested cancellation'
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_booking_id   BIGINT;
    v_user_id      BIGINT;
    v_total_fare   NUMERIC(12,2);
    v_refund       NUMERIC(12,2);
    v_status       VARCHAR(20);
BEGIN
    SELECT
        booking_id,
        user_id,
        total_fare,
        status
    INTO
        v_booking_id,
        v_user_id,
        v_total_fare,
        v_status
    FROM bookings
    WHERE pnr = UPPER(TRIM(p_pnr))
    FOR UPDATE;

    IF v_booking_id IS NULL THEN
        RAISE EXCEPTION
            'Booking with PNR % was not found.',
            p_pnr;
    END IF;

    IF v_status = 'CANCELLED' THEN
        RAISE NOTICE
            'Booking % is already cancelled.',
            p_pnr;
        RETURN;
    END IF;

    IF v_status <> 'CONFIRMED' THEN
        RAISE EXCEPTION
            'Booking % cannot be cancelled from status %.',
            p_pnr,
            v_status;
    END IF;

    -- Demo cancellation policy:
    -- 80% refund of total fare.
    v_refund := ROUND(v_total_fare * 0.80, 2);

    UPDATE seat_reservations
    SET
        status = 'RELEASED',
        released_at = NOW()
    WHERE booking_id = v_booking_id
      AND status = 'RESERVED';

    UPDATE bookings
    SET status = 'CANCELLED'
    WHERE booking_id = v_booking_id;

    INSERT INTO cancellations (
        booking_id,
        reason,
        refund_amount,
        status
    )
    VALUES (
        v_booking_id,
        p_reason,
        v_refund,
        'PROCESSED'
    );

    UPDATE payments
    SET
        payment_status = 'REFUNDED'
    WHERE booking_id = v_booking_id
      AND payment_status = 'SUCCESS';

    INSERT INTO audit_logs (
        user_id,
        action,
        entity_name,
        entity_id,
        details
    )
    VALUES (
        v_user_id,
        'BOOKING_CANCELLED',
        'bookings',
        v_booking_id,
        jsonb_build_object(
            'pnr', p_pnr,
            'refund_amount', v_refund,
            'reason', p_reason
        )
    );
END;
$$;


-- ============================================================
-- SECTION I - AVAILABILITY FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION get_train_availability(
    p_train_id BIGINT,
    p_journey_date DATE,
    p_class_code VARCHAR(5)
)
RETURNS TABLE (
    coach_type VARCHAR(5),
    total_seats BIGINT,
    reserved_seats BIGINT,
    available_seats BIGINT
)
LANGUAGE sql
AS $$
    SELECT
        c.coach_type,
        COUNT(DISTINCT s.seat_id) AS total_seats,
        COUNT(
            DISTINCT sr.seat_id
        ) FILTER (
            WHERE sr.status = 'RESERVED'
              AND sr.journey_date = p_journey_date
        ) AS reserved_seats,
        COUNT(DISTINCT s.seat_id)
        -
        COUNT(
            DISTINCT sr.seat_id
        ) FILTER (
            WHERE sr.status = 'RESERVED'
              AND sr.journey_date = p_journey_date
        ) AS available_seats
    FROM coaches c
    LEFT JOIN seats s
      ON s.coach_id = c.coach_id
    LEFT JOIN seat_reservations sr
      ON sr.seat_id = s.seat_id
     AND sr.journey_date = p_journey_date
     AND sr.status = 'RESERVED'
    WHERE c.train_id = p_train_id
      AND c.coach_type = UPPER(p_class_code)
      AND c.is_active = TRUE
    GROUP BY c.coach_type;
$$;


CREATE OR REPLACE FUNCTION search_trains(
    p_source_station_id BIGINT,
    p_destination_station_id BIGINT,
    p_journey_date DATE,
    p_class_code VARCHAR(5) DEFAULT NULL
)
RETURNS TABLE (
    train_id BIGINT,
    train_number INTEGER,
    train_name VARCHAR(150),
    train_type VARCHAR(30),
    source_station VARCHAR(120),
    destination_station VARCHAR(120),
    departure_time TIME,
    arrival_time TIME,
    duration_minutes INTEGER,
    class_code VARCHAR(5),
    available_seats BIGINT,
    full_route_fare NUMERIC(10,2)
)
LANGUAGE sql
AS $$
    WITH matching_trains AS (
        SELECT
            t.train_id,
            t.train_number,
            t.train_name,
            t.train_type,
            src.station_name AS source_station,
            dst.station_name AS destination_station,
            rs.departure_time,
            rd.arrival_time,
            (
                (
                    rd.day_offset * 1440
                    + EXTRACT(HOUR FROM rd.arrival_time)::INTEGER * 60
                    + EXTRACT(MINUTE FROM rd.arrival_time)::INTEGER
                )
                -
                (
                    rs.day_offset * 1440
                    + EXTRACT(HOUR FROM rs.departure_time)::INTEGER * 60
                    + EXTRACT(MINUTE FROM rs.departure_time)::INTEGER
                )
            )::INTEGER AS duration_minutes,
            rs.distance_from_origin_km AS source_distance,
            rd.distance_from_origin_km AS destination_distance
        FROM trains t
        JOIN train_routes rs
          ON rs.train_id = t.train_id
         AND rs.station_id = p_source_station_id
        JOIN train_routes rd
          ON rd.train_id = t.train_id
         AND rd.station_id = p_destination_station_id
        JOIN stations src
          ON src.station_id = p_source_station_id
        JOIN stations dst
          ON dst.station_id = p_destination_station_id
        WHERE
            t.is_active = TRUE
            AND rs.sequence_no < rd.sequence_no
            AND EXISTS (
                SELECT 1
                FROM train_operating_days tod
                WHERE tod.train_id = t.train_id
                  AND tod.day_of_week =
                      EXTRACT(ISODOW FROM p_journey_date)::SMALLINT
            )
    ),
    classes AS (
        SELECT f.train_id, f.class_code, f.full_route_fare
        FROM fares f
        WHERE f.is_active = TRUE
          AND (
              p_class_code IS NULL
              OR f.class_code = UPPER(p_class_code)
          )
    )
    SELECT
        mt.train_id,
        mt.train_number,
        mt.train_name,
        mt.train_type,
        mt.source_station,
        mt.destination_station,
        mt.departure_time,
        mt.arrival_time,
        mt.duration_minutes,
        c.class_code,
        (
            SELECT COUNT(*)
            FROM seats s
            JOIN coaches co
              ON co.coach_id = s.coach_id
            LEFT JOIN seat_reservations sr
              ON sr.seat_id = s.seat_id
             AND sr.journey_date = p_journey_date
             AND sr.status = 'RESERVED'
            WHERE co.train_id = mt.train_id
              AND co.coach_type = c.class_code
              AND co.is_active = TRUE
              AND sr.reservation_id IS NULL
        )::BIGINT AS available_seats,
        c.full_route_fare
    FROM matching_trains mt
    JOIN classes c
      ON c.train_id = mt.train_id
    ORDER BY mt.departure_time, c.full_route_fare;
$$;


-- ============================================================
-- SECTION J - REPORTING VIEWS
-- ============================================================

CREATE OR REPLACE VIEW v_train_overview AS
SELECT
    t.train_id,
    t.train_number,
    t.train_name,
    t.train_type,

    (
        SELECT s.station_code
        FROM train_routes tr
        JOIN stations s
          ON s.station_id = tr.station_id
        WHERE tr.train_id = t.train_id
        ORDER BY tr.sequence_no
        LIMIT 1
    ) AS origin_code,

    (
        SELECT s.station_name
        FROM train_routes tr
        JOIN stations s
          ON s.station_id = tr.station_id
        WHERE tr.train_id = t.train_id
        ORDER BY tr.sequence_no
        LIMIT 1
    ) AS origin_station,

    (
        SELECT s.station_code
        FROM train_routes tr
        JOIN stations s
          ON s.station_id = tr.station_id
        WHERE tr.train_id = t.train_id
        ORDER BY tr.sequence_no DESC
        LIMIT 1
    ) AS destination_code,

    (
        SELECT s.station_name
        FROM train_routes tr
        JOIN stations s
          ON s.station_id = tr.station_id
        WHERE tr.train_id = t.train_id
        ORDER BY tr.sequence_no DESC
        LIMIT 1
    ) AS destination_station,

    COUNT(DISTINCT c.coach_id) AS total_coaches,
    COALESCE(SUM(c.capacity), 0) AS declared_capacity,
    t.is_active
FROM trains t
LEFT JOIN coaches c
  ON c.train_id = t.train_id
GROUP BY
    t.train_id,
    t.train_number,
    t.train_name,
    t.train_type,
    t.is_active;


CREATE OR REPLACE VIEW v_booking_details AS
SELECT
    b.booking_id,
    b.pnr,
    b.journey_date,
    b.status AS booking_status,
    b.total_fare,
    b.booking_date,

    u.user_id,
    u.full_name AS booked_by,
    u.email AS user_email,

    t.train_number,
    t.train_name,
    t.train_type,

    ss.station_code AS source_code,
    ss.station_name AS source_station,

    ds.station_code AS destination_code,
    ds.station_name AS destination_station,

    p.passenger_id,
    p.full_name AS passenger_name,
    p.age,
    p.gender,
    p.class_code,
    p.fare_amount,

    sr.reservation_id,
    sr.status AS seat_reservation_status,

    s.seat_number,
    c.coach_number,
    c.coach_type,

    pay.payment_method,
    pay.payment_status,
    pay.transaction_ref

FROM bookings b
JOIN users u
  ON u.user_id = b.user_id
JOIN trains t
  ON t.train_id = b.train_id
JOIN stations ss
  ON ss.station_id = b.source_station_id
JOIN stations ds
  ON ds.station_id = b.destination_station_id
JOIN passengers p
  ON p.booking_id = b.booking_id
LEFT JOIN seat_reservations sr
  ON sr.passenger_id = p.passenger_id
LEFT JOIN seats s
  ON s.seat_id = sr.seat_id
LEFT JOIN coaches c
  ON c.coach_id = s.coach_id
LEFT JOIN payments pay
  ON pay.booking_id = b.booking_id;


CREATE OR REPLACE VIEW v_revenue_by_train AS
SELECT
    t.train_id,
    t.train_number,
    t.train_name,
    COUNT(b.booking_id) FILTER (
        WHERE b.status = 'CONFIRMED'
    ) AS confirmed_bookings,
    COALESCE(
        SUM(
            pay.amount
        ) FILTER (
            WHERE pay.payment_status = 'SUCCESS'
        ),
        0
    )::NUMERIC(12,2) AS successful_revenue,
    COALESCE(
        SUM(
            can.refund_amount
        ),
        0
    )::NUMERIC(12,2) AS refunds
FROM trains t
LEFT JOIN bookings b
  ON b.train_id = t.train_id
LEFT JOIN payments pay
  ON pay.booking_id = b.booking_id
LEFT JOIN cancellations can
  ON can.booking_id = b.booking_id
GROUP BY
    t.train_id,
    t.train_number,
    t.train_name;


CREATE OR REPLACE VIEW v_passenger_trip_summary AS
SELECT
    b.pnr,
    b.journey_date,
    t.train_number,
    t.train_name,
    ss.station_name AS source_station,
    ds.station_name AS destination_station,
    p.full_name AS passenger_name,
    p.age,
    p.gender,
    p.class_code,
    c.coach_number,
    s.seat_number,
    b.status
FROM bookings b
JOIN trains t
  ON t.train_id = b.train_id
JOIN stations ss
  ON ss.station_id = b.source_station_id
JOIN stations ds
  ON ds.station_id = b.destination_station_id
JOIN passengers p
  ON p.booking_id = b.booking_id
LEFT JOIN seat_reservations sr
  ON sr.passenger_id = p.passenger_id
 AND sr.status = 'RESERVED'
LEFT JOIN seats s
  ON s.seat_id = sr.seat_id
LEFT JOIN coaches c
  ON c.coach_id = s.coach_id;


-- ============================================================
-- SECTION K - SAMPLE DATA
-- ============================================================

-- ----------------------------
-- DEMO USERS
-- Password for both demo users:
-- Password@123
-- These are local demonstration accounts only.
-- ----------------------------

INSERT INTO users (
    full_name,
    email,
    phone,
    password_hash,
    role
)
VALUES
(
    'RailNex Admin',
    'admin@railnex.local',
    '9000000001',
    crypt('Password@123', gen_salt('bf')),
    'ADMIN'
),
(
    'Demo Passenger',
    'user@railnex.local',
    '9000000002',
    crypt('Password@123', gen_salt('bf')),
    'USER'
),
(
    'Rajdeep Biswas',
    'rajdeep@railnex.local',
    '9000000003',
    crypt('Password@123', gen_salt('bf')),
    'USER'
);


-- ----------------------------
-- STATIONS
-- ----------------------------

INSERT INTO stations (
    station_code,
    station_name,
    city,
    state,
    railway_zone
)
VALUES
('HWH',  'Howrah Junction',       'Howrah',     'West Bengal',   'Eastern Railway'),
('SDAH', 'Sealdah',                'Kolkata',    'West Bengal',   'Eastern Railway'),
('KGP',  'Kharagpur Junction',     'Kharagpur',  'West Bengal',   'South Eastern Railway'),
('GAYA', 'Gaya Junction',          'Gaya',       'Bihar',         'East Central Railway'),
('CNB',  'Kanpur Central',         'Kanpur',     'Uttar Pradesh', 'North Central Railway'),
('BBS',  'Bhubaneswar',            'Bhubaneswar','Odisha',        'East Coast Railway'),
('VSKP', 'Visakhapatnam',          'Visakhapatnam','Andhra Pradesh','East Coast Railway'),
('VJA',  'Vijayawada Junction',    'Vijayawada', 'Andhra Pradesh','South Central Railway'),
('MAS',  'Chennai Central',        'Chennai',    'Tamil Nadu',    'Southern Railway'),
('NGP',  'Nagpur Junction',        'Nagpur',     'Maharashtra',   'Central Railway'),
('BPL',  'Bhopal Junction',        'Bhopal',     'Madhya Pradesh','West Central Railway'),
('NDLS', 'New Delhi',              'New Delhi',  'Delhi',         'Northern Railway'),
('KOTA', 'Kota Junction',          'Kota',       'Rajasthan',     'West Central Railway'),
('SBC',  'KSR Bengaluru',          'Bengaluru',  'Karnataka',     'South Western Railway'),
('CSMT', 'Mumbai CSMT',            'Mumbai',     'Maharashtra',   'Central Railway'),
('MYS',  'Mysuru Junction',        'Mysuru',     'Karnataka',     'South Western Railway');


-- ----------------------------
-- TRAINS
-- ----------------------------

INSERT INTO trains (
    train_number,
    train_name,
    train_type
)
VALUES
(12301, 'Rajdhani Express',       'RAJDHANI'),
(12649, 'Karnataka Express',      'EXPRESS'),
(12841, 'Coromandel Express',     'SUPERFAST'),
(12860, 'Gitanjali Express',      'SUPERFAST'),
(12007, 'Shatabdi Express',       'SHATABDI'),
(20643, 'Vande Bharat Express',   'VANDE_BHARAT');


-- ----------------------------
-- OPERATING DAYS
-- For this prototype all seeded trains run daily.
-- ----------------------------

INSERT INTO train_operating_days (train_id, day_of_week)
SELECT t.train_id, d.day_of_week
FROM trains t
CROSS JOIN generate_series(1, 7) AS d(day_of_week);


-- ----------------------------
-- TRAIN ROUTES
-- ----------------------------

-- 12301 Rajdhani: Howrah -> Delhi
INSERT INTO train_routes (
    train_id,
    station_id,
    sequence_no,
    arrival_time,
    departure_time,
    day_offset,
    distance_from_origin_km
)
SELECT t.train_id, s.station_id, x.sequence_no,
       x.arrival_time::TIME, x.departure_time::TIME,
       x.day_offset, x.distance_km
FROM trains t
JOIN (
    VALUES
    ('HWH',  1, NULL,     '16:55', 0,    0.0),
    ('GAYA', 2, '00:55',   '01:05', 1,   430.0),
    ('CNB',  3, '08:40',   '08:50', 1,   980.0),
    ('NDLS', 4, '15:30',   NULL,    1,  1450.0)
) AS x(code, sequence_no, arrival_time, departure_time, day_offset, distance_km)
  ON TRUE
JOIN stations s
  ON s.station_code = x.code
WHERE t.train_number = 12301;


-- 12649 Karnataka Express: Delhi -> Bengaluru
INSERT INTO train_routes (
    train_id,
    station_id,
    sequence_no,
    arrival_time,
    departure_time,
    day_offset,
    distance_from_origin_km
)
SELECT t.train_id, s.station_id, x.sequence_no,
       x.arrival_time::TIME, x.departure_time::TIME,
       x.day_offset, x.distance_km
FROM trains t
JOIN (
    VALUES
    ('NDLS', 1, NULL,     '21:00', 0,    0.0),
    ('KOTA', 2, '02:20',  '02:30', 1,   310.0),
    ('BPL',  3, '07:35',  '07:45', 1,   700.0),
    ('NGP',  4, '14:00',  '14:10', 1,  1085.0),
    ('SBC',  5, '06:30',  NULL,    2,  2100.0)
) AS x(code, sequence_no, arrival_time, departure_time, day_offset, distance_km)
  ON TRUE
JOIN stations s
  ON s.station_code = x.code
WHERE t.train_number = 12649;


-- 12841 Coromandel Express: Howrah -> Chennai
INSERT INTO train_routes (
    train_id,
    station_id,
    sequence_no,
    arrival_time,
    departure_time,
    day_offset,
    distance_from_origin_km
)
SELECT t.train_id, s.station_id, x.sequence_no,
       x.arrival_time::TIME, x.departure_time::TIME,
       x.day_offset, x.distance_km
FROM trains t
JOIN (
    VALUES
    ('HWH',  1, NULL,     '14:50', 0,    0.0),
    ('KGP',  2, '16:25',  '16:30', 0,   90.0),
    ('BBS',  3, '22:00',  '22:10', 0,  440.0),
    ('VSKP', 4, '03:00',  '03:10', 1,  780.0),
    ('VJA',  5, '07:30',  '07:40', 1,  1200.0),
    ('MAS',  6, '12:00',  NULL,    1,  1660.0)
) AS x(code, sequence_no, arrival_time, departure_time, day_offset, distance_km)
  ON TRUE
JOIN stations s
  ON s.station_code = x.code
WHERE t.train_number = 12841;


-- 12860 Gitanjali Express: Howrah -> Mumbai
INSERT INTO train_routes (
    train_id,
    station_id,
    sequence_no,
    arrival_time,
    departure_time,
    day_offset,
    distance_from_origin_km
)
SELECT t.train_id, s.station_id, x.sequence_no,
       x.arrival_time::TIME, x.departure_time::TIME,
       x.day_offset, x.distance_km
FROM trains t
JOIN (
    VALUES
    ('HWH',  1, NULL,     '14:00', 0,    0.0),
    ('KGP',  2, '15:35',  '15:40', 0,   90.0),
    ('NGP',  3, '04:10',  '04:20', 1,  1000.0),
    ('CSMT', 4, '14:30',  NULL,    1,  1900.0)
) AS x(code, sequence_no, arrival_time, departure_time, day_offset, distance_km)
  ON TRUE
JOIN stations s
  ON s.station_code = x.code
WHERE t.train_number = 12860;


-- 12007 Shatabdi: New Delhi -> Bhopal
INSERT INTO train_routes (
    train_id,
    station_id,
    sequence_no,
    arrival_time,
    departure_time,
    day_offset,
    distance_from_origin_km
)
SELECT t.train_id, s.station_id, x.sequence_no,
       x.arrival_time::TIME, x.departure_time::TIME,
       x.day_offset, x.distance_km
FROM trains t
JOIN (
    VALUES
    ('NDLS', 1, NULL,     '06:00', 0,   0.0),
    ('KOTA', 2, '08:35',  '08:40', 0, 310.0),
    ('BPL',  3, '13:45',  NULL,    0, 700.0)
) AS x(code, sequence_no, arrival_time, departure_time, day_offset, distance_km)
  ON TRUE
JOIN stations s
  ON s.station_code = x.code
WHERE t.train_number = 12007;


-- 20643 Vande Bharat: Chennai -> Mysuru
INSERT INTO train_routes (
    train_id,
    station_id,
    sequence_no,
    arrival_time,
    departure_time,
    day_offset,
    distance_from_origin_km
)
SELECT t.train_id, s.station_id, x.sequence_no,
       x.arrival_time::TIME, x.departure_time::TIME,
       x.day_offset, x.distance_km
FROM trains t
JOIN (
    VALUES
    ('MAS', 1, NULL,     '05:50', 0,   0.0),
    ('SBC', 2, '10:20',  '10:25', 0, 360.0),
    ('MYS', 3, '12:05',  NULL,    0, 480.0)
) AS x(code, sequence_no, arrival_time, departure_time, day_offset, distance_km)
  ON TRUE
JOIN stations s
  ON s.station_code = x.code
WHERE t.train_number = 20643;


-- ============================================================
-- COACHES
-- Each seeded coach has 20 seats.
-- ============================================================

INSERT INTO coaches (
    train_id,
    coach_number,
    coach_type,
    capacity
)
SELECT t.train_id, x.coach_number, x.coach_type, 20
FROM trains t
JOIN (
    VALUES
    (12301, 'A1', '1A'),
    (12301, 'B1', '2A'),
    (12301, 'B2', '2A'),
    (12301, 'C1', '3A'),
    (12301, 'S1', 'SL'),

    (12649, 'A1', '1A'),
    (12649, 'B1', '2A'),
    (12649, 'C1', '3A'),
    (12649, 'C2', '3A'),
    (12649, 'S1', 'SL'),
    (12649, 'S2', 'SL'),

    (12841, 'B1', '2A'),
    (12841, 'C1', '3A'),
    (12841, 'C2', '3A'),
    (12841, 'S1', 'SL'),
    (12841, 'S2', 'SL'),

    (12860, 'B1', '2A'),
    (12860, 'C1', '3A'),
    (12860, 'S1', 'SL'),

    (12007, 'C1', 'CC'),
    (12007, 'C2', 'CC'),

    (20643, 'C1', 'CC'),
    (20643, 'C2', 'CC'),
    (20643, 'E1', 'EC')
) AS x(train_number, coach_number, coach_type)
  ON t.train_number = x.train_number;


-- Generate 20 seats per coach.
INSERT INTO seats (
    coach_id,
    seat_number,
    seat_type
)
SELECT
    c.coach_id,
    gs,
    CASE
        WHEN gs % 8 = 1 THEN 'LOWER'
        WHEN gs % 8 = 2 THEN 'MIDDLE'
        WHEN gs % 8 = 3 THEN 'UPPER'
        WHEN gs % 8 = 4 THEN 'SIDE_LOWER'
        WHEN gs % 8 = 5 THEN 'SIDE_UPPER'
        WHEN gs % 8 = 6 THEN 'LOWER'
        WHEN gs % 8 = 7 THEN 'MIDDLE'
        ELSE 'UPPER'
    END
FROM coaches c
CROSS JOIN generate_series(1, 20) AS gs;


-- ============================================================
-- FARES
-- Demo fares for the full train route.
-- Segment fares are calculated proportionally by distance.
-- ============================================================

INSERT INTO fares (
    train_id,
    class_code,
    full_route_fare,
    reservation_charge,
    gst_rate
)
SELECT
    t.train_id,
    x.class_code,
    x.full_route_fare,
    x.reservation_charge,
    5.00
FROM trains t
JOIN (
    VALUES
    (12301, '1A', 5200.00, 60.00),
    (12301, '2A', 3200.00, 50.00),
    (12301, '3A', 2250.00, 40.00),
    (12301, 'SL', 1100.00, 40.00),

    (12649, '1A', 5900.00, 60.00),
    (12649, '2A', 3600.00, 50.00),
    (12649, '3A', 2400.00, 40.00),
    (12649, 'SL', 1150.00, 40.00),

    (12841, '2A', 3800.00, 50.00),
    (12841, '3A', 2550.00, 40.00),
    (12841, 'SL', 1200.00, 40.00),

    (12860, '2A', 3600.00, 50.00),
    (12860, '3A', 2450.00, 40.00),
    (12860, 'SL', 1100.00, 40.00),

    (12007, 'CC', 1800.00, 40.00),
    (20643, 'CC', 1500.00, 40.00),
    (20643, 'EC', 2800.00, 50.00)
) AS x(train_number, class_code, full_route_fare, reservation_charge)
  ON t.train_number = x.train_number;


-- ============================================================
-- SECTION L - SAMPLE BOOKINGS
-- Only future dates are used because validate_booking()
-- rejects dates in the past.
--
-- The examples below are commented intentionally.
-- Uncomment and run after verifying the relevant journey date.
-- ============================================================

-- Example 1: Search first:
--
-- SELECT *
-- FROM search_trains(
--     (SELECT station_id FROM stations WHERE station_code = 'HWH'),
--     (SELECT station_id FROM stations WHERE station_code = 'BBS'),
--     CURRENT_DATE + INTERVAL '7 days',
--     '3A'
-- );


-- Example 2: Create a booking:
--
-- SELECT *
-- FROM create_booking(
--     (SELECT user_id FROM users WHERE email = 'user@railnex.local'),
--     (SELECT train_id FROM trains WHERE train_number = 12841),
--     (SELECT station_id FROM stations WHERE station_code = 'HWH'),
--     (SELECT station_id FROM stations WHERE station_code = 'BBS'),
--     CURRENT_DATE + 7,
--     'user@railnex.local',
--     '9000000002',
--     jsonb_build_array(
--         jsonb_build_object(
--             'full_name', 'Demo Passenger',
--             'age', 22,
--             'gender', 'MALE',
--             'nationality', 'Indian',
--             'id_type', 'PASSPORT',
--             'id_number', 'DEMO-001',
--             'class_code', '3A',
--             'seat_preference', 'LOWER',
--             'seat_id',
--             (
--                 SELECT s.seat_id
--                 FROM seats s
--                 JOIN coaches c ON c.coach_id = s.coach_id
--                 JOIN trains t ON t.train_id = c.train_id
--                 WHERE t.train_number = 12841
--                   AND c.coach_type = '3A'
--                   AND c.coach_number = 'C1'
--                 ORDER BY s.seat_number
--                 LIMIT 1
--             )
--         )
--     ),
--     'UPI'
-- );


-- Example 3: Cancel booking:
--
-- CALL cancel_booking(
--     'PUT-REAL-PNR-HERE',
--     'User requested cancellation'
-- );


-- ============================================================
-- SECTION M - USEFUL DBMS DEMONSTRATION QUERIES
-- These are useful for your lab/project report and viva.
-- ============================================================

-- 1. Show all trains.
-- SELECT * FROM trains ORDER BY train_number;


-- 2. Show all stations.
-- SELECT * FROM stations ORDER BY station_code;


-- 3. Show complete train routes.
-- SELECT
--     t.train_number,
--     t.train_name,
--     tr.sequence_no,
--     s.station_code,
--     s.station_name,
--     tr.arrival_time,
--     tr.departure_time,
--     tr.day_offset,
--     tr.distance_from_origin_km
-- FROM train_routes tr
-- JOIN trains t ON t.train_id = tr.train_id
-- JOIN stations s ON s.station_id = tr.station_id
-- ORDER BY t.train_number, tr.sequence_no;


-- 4. Search trains between two stations.
-- SELECT *
-- FROM search_trains(
--     (SELECT station_id FROM stations WHERE station_code = 'HWH'),
--     (SELECT station_id FROM stations WHERE station_code = 'BBS'),
--     CURRENT_DATE + 7,
--     NULL
-- );


-- 5. Check availability in 3A for a train/date.
-- SELECT *
-- FROM get_train_availability(
--     (SELECT train_id FROM trains WHERE train_number = 12841),
--     CURRENT_DATE + 7,
--     '3A'
-- );


-- 6. Booking details.
-- SELECT *
-- FROM v_booking_details
-- ORDER BY journey_date, pnr;


-- 7. Revenue by train.
-- SELECT *
-- FROM v_revenue_by_train
-- ORDER BY successful_revenue DESC;


-- 8. Count bookings by train.
-- SELECT
--     t.train_number,
--     t.train_name,
--     COUNT(b.booking_id) AS total_bookings
-- FROM trains t
-- LEFT JOIN bookings b
--   ON b.train_id = t.train_id
-- GROUP BY t.train_id, t.train_number, t.train_name
-- ORDER BY total_bookings DESC;


-- 9. Count bookings by class.
-- SELECT
--     p.class_code,
--     COUNT(*) AS passenger_count
-- FROM passengers p
-- JOIN bookings b
--   ON b.booking_id = p.booking_id
-- WHERE b.status = 'CONFIRMED'
-- GROUP BY p.class_code
-- ORDER BY passenger_count DESC;


-- 10. Most popular routes.
-- SELECT
--     ss.station_name AS source,
--     ds.station_name AS destination,
--     COUNT(*) AS booking_count
-- FROM bookings b
-- JOIN stations ss
--   ON ss.station_id = b.source_station_id
-- JOIN stations ds
--   ON ds.station_id = b.destination_station_id
-- WHERE b.status = 'CONFIRMED'
-- GROUP BY ss.station_name, ds.station_name
-- ORDER BY booking_count DESC;


-- 11. Monthly revenue.
-- SELECT
--     DATE_TRUNC('month', b.created_at) AS month,
--     SUM(pay.amount) AS revenue
-- FROM bookings b
-- JOIN payments pay
--   ON pay.booking_id = b.booking_id
-- WHERE pay.payment_status = 'SUCCESS'
-- GROUP BY DATE_TRUNC('month', b.created_at)
-- ORDER BY month;


-- 12. Cancellation rate.
-- SELECT
--     COUNT(*) FILTER (WHERE status = 'CANCELLED') * 100.0
--     / NULLIF(COUNT(*), 0) AS cancellation_rate_percent
-- FROM bookings;


-- 13. Users by role.
-- SELECT role, COUNT(*)
-- FROM users
-- GROUP BY role;


-- 14. Trains with total coach capacity.
-- SELECT
--     t.train_number,
--     t.train_name,
--     SUM(c.capacity) AS total_capacity
-- FROM trains t
-- JOIN coaches c
--   ON c.train_id = t.train_id
-- GROUP BY t.train_id, t.train_number, t.train_name
-- ORDER BY total_capacity DESC;


-- 15. Find available seats in a particular coach.
-- SELECT
--     s.seat_id,
--     s.seat_number,
--     s.seat_type
-- FROM seats s
-- JOIN coaches c
--   ON c.coach_id = s.coach_id
-- WHERE c.train_id =
--       (SELECT train_id FROM trains WHERE train_number = 12841)
--   AND c.coach_number = 'C1'
--   AND NOT EXISTS (
--       SELECT 1
--       FROM seat_reservations sr
--       WHERE sr.seat_id = s.seat_id
--         AND sr.journey_date = CURRENT_DATE + 7
--         AND sr.status = 'RESERVED'
--   )
-- ORDER BY s.seat_number;


-- ============================================================
-- END OF RAILNEX DATABASE SCRIPT
-- ============================================================
