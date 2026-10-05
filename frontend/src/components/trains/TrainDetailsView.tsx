import React, { useState, useEffect } from 'react';
import { RouteStop, Train, TrainClassCode } from '../../types';
import { trainService } from '../../services/trainService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Clock,
  MapPin,
  Calendar,
  Wifi,
  Coffee,
  Zap,
  Shield,
  Snowflake,
  Bed,
  Droplets,
  ArrowRight,
  Check,
  AlertTriangle,
  X,
} from 'lucide-react';

interface TrainDetailsViewProps {
  train: Train;
  onClose?: () => void;
  onBookNow: (train: Train, classCode: TrainClassCode) => void;
}

export const TrainDetailsView: React.FC<TrainDetailsViewProps> = ({
  train,
  onClose,
  onBookNow,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'route' | 'fare' | 'amenities'>('overview');
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(true);
  const [selectedClass, setSelectedClass] = useState<TrainClassCode>(train.classes[0]?.code || '3A');

  useEffect(() => {
    setLoadingRoute(true);
    trainService.getRouteStops(train.id).then((stops) => {
      setRouteStops(stops);
      setLoadingRoute(false);
    });
  }, [train.id]);

  const amenityIcons: Record<string, React.ReactNode> = {
    wifi: <Wifi className="w-4 h-4 text-sky-600" />,
    food: <Coffee className="w-4 h-4 text-amber-600" />,
    charging: <Zap className="w-4 h-4 text-emerald-600" />,
    bedding: <Bed className="w-4 h-4 text-indigo-600" />,
    ac: <Snowflake className="w-4 h-4 text-cyan-600" />,
    water: <Droplets className="w-4 h-4 text-blue-500" />,
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xl max-w-4xl w-full mx-auto overflow-hidden flex flex-col max-h-[90vh]">
      {/* Header Bar */}
      <div className="bg-[#121417] text-white p-5 sm:p-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="font-mono text-xs font-bold bg-white/10 text-white px-2 py-0.5 rounded">
              {train.number}
            </span>
            <Badge variant="success" styleType="subtle" showDot>
              {train.status === 'ON_TIME' ? 'ON TIME' : 'SCHEDULED'}
            </Badge>
            <span className="text-xs text-neutral-400 font-medium">
              {train.type}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {train.name}
          </h2>

          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-2">
            <span>{train.fromStation.name} ({train.fromStation.code})</span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
            <span>{train.toStation.name} ({train.toStation.code})</span>
            <span className="text-neutral-600">·</span>
            <span>{train.duration}</span>
            <span className="text-neutral-600">·</span>
            <span>{train.distanceKm} km</span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 px-5 border-b border-neutral-200 bg-neutral-50">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'route', label: 'Route & Stops' },
          { id: 'fare', label: 'Fare Matrix' },
          { id: 'amenities', label: 'Amenities & Services' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#121417] text-neutral-900 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body Content */}
      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Departure
                </span>
                <span className="text-lg font-bold font-mono text-neutral-900 mt-1 block">
                  {train.departureTime}
                </span>
                <span className="text-xs text-neutral-500">{train.fromStation.code}</span>
              </div>
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Arrival
                </span>
                <span className="text-lg font-bold font-mono text-neutral-900 mt-1 block">
                  {train.arrivalTime}
                </span>
                <span className="text-xs text-neutral-500">{train.toStation.code}</span>
              </div>
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Total Run
                </span>
                <span className="text-lg font-bold font-mono text-neutral-900 mt-1 block">
                  {train.duration}
                </span>
                <span className="text-xs text-neutral-500">{train.distanceKm} km</span>
              </div>
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Pantry Service
                </span>
                <span className="text-lg font-bold text-neutral-900 mt-1 block">
                  {train.pantryAvailable ? 'Available' : 'No Pantry'}
                </span>
                <span className="text-xs text-neutral-500">Catering Onboard</span>
              </div>
            </div>

            {/* Operating Days */}
            <div className="p-4 bg-white rounded-xl border border-neutral-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                Weekly Operating Schedule
              </h4>
              <div className="flex items-center gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => {
                  const runs = train.operatingDays.includes(d);
                  return (
                    <div
                      key={d}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex flex-col items-center ${
                        runs
                          ? 'bg-[#121417] text-white'
                          : 'bg-neutral-100 text-neutral-300 line-through'
                      }`}
                    >
                      <span>{d}</span>
                      <span className="text-[9px] font-normal">{runs ? 'RUNS' : 'OFF'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coach Composition */}
            <div className="p-4 bg-white rounded-xl border border-neutral-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3">
                Available Classes & Seat Status
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {train.classes.map((cls) => (
                  <div
                    key={cls.code}
                    onClick={() => setSelectedClass(cls.code)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedClass === cls.code
                        ? 'border-[#121417] bg-neutral-50 ring-1 ring-[#121417]'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-xs">{cls.code}</span>
                      <span className="font-mono font-bold text-xs">₹{cls.baseFare}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{cls.name}</p>
                    <p className="text-xs font-semibold text-emerald-700 mt-2">
                      {cls.seatsAvailable} seats available
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ROUTE TAB - Clean Vertical Timeline */}
        {activeTab === 'route' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-500 pb-2 border-b border-neutral-200">
              <span>{routeStops.length} Scheduled Stoppages</span>
              <span>Total Distance: {train.distanceKm} km</span>
            </div>

            {loadingRoute ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                Loading accurate railway timetable...
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-neutral-200">
                {routeStops.map((stop, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === routeStops.length - 1;

                  return (
                    <div key={stop.sequence} className="relative flex items-start gap-4">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center ${
                          isFirst || isLast
                            ? 'border-[#D92D20] bg-[#D92D20]'
                            : 'border-neutral-700'
                        }`}
                      />

                      {/* Stop Info */}
                      <div className="flex-1 bg-neutral-50/70 p-3 rounded-lg border border-neutral-200/70 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-neutral-700 bg-neutral-200/60 px-1.5 py-0.5 rounded">
                              {stop.stationCode}
                            </span>
                            <span className="font-bold text-sm text-neutral-900">
                              {stop.stationName}
                            </span>
                          </div>
                          <span className="text-[11px] text-neutral-500 mt-1 block">
                            Day {stop.day} · {stop.distanceKm} km from origin
                          </span>
                        </div>

                        {/* Timing */}
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-neutral-400 block uppercase">
                              Arr
                            </span>
                            <span className="font-bold text-neutral-800">
                              {stop.arrivalTime}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-400 block uppercase">
                              Dep
                            </span>
                            <span className="font-bold text-neutral-800">
                              {stop.departureTime}
                            </span>
                          </div>
                          {stop.haltMinutes > 0 && (
                            <div className="bg-neutral-200/60 text-neutral-700 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                              {stop.haltMinutes}m halt
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FARE TAB */}
        {activeTab === 'fare' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Fare Structure Breakdown (Per Passenger)
            </h4>
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-100/70 border-b border-neutral-200 text-neutral-600 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-3">Class</th>
                    <th className="p-3">Base Fare</th>
                    <th className="p-3">Res. Fee</th>
                    <th className="p-3">Superfast</th>
                    <th className="p-3">GST (5%)</th>
                    <th className="p-3 font-bold text-right">Total Fare</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-mono">
                  {train.classes.map((c) => {
                    const resFee = 40;
                    const sf = 45;
                    const gst = Math.round((c.baseFare + resFee + sf) * 0.05);
                    const total = c.baseFare + resFee + sf + gst;
                    return (
                      <tr key={c.code} className="hover:bg-neutral-50/50">
                        <td className="p-3 font-sans font-bold text-neutral-900">
                          {c.code} - {c.name}
                        </td>
                        <td className="p-3 text-neutral-700">₹{c.baseFare}</td>
                        <td className="p-3 text-neutral-700">₹{resFee}</td>
                        <td className="p-3 text-neutral-700">₹{sf}</td>
                        <td className="p-3 text-neutral-700">₹{gst}</td>
                        <td className="p-3 font-bold text-right text-neutral-900">
                          ₹{total}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                Dynamic Pricing Notice
              </p>
              Fares listed are baseline rates adhering to Indian Railways Passenger Tariff schedules. Quota allocations (General, Tatkal, Senior Citizen) may alter final calculation during step 4 review.
            </div>
          </div>
        )}

        {/* AMENITIES TAB */}
        {activeTab === 'amenities' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Onboard Facilities & Standard Equipment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {train.amenities.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/70 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-white shadow-2xs border border-neutral-200 flex items-center justify-center shrink-0">
                    {amenityIcons[item.id] || <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900">{item.label}</p>
                    <p className="text-[11px] text-neutral-500">
                      Standard complimentary provision for all air-conditioned coaches.
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 mt-4">
              <h5 className="text-xs font-bold text-neutral-900 mb-2">
                Luggage & Baggage Allowance
              </h5>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Passengers are permitted up to 50kg (AC First), 40kg (AC 2-Tier), or 35kg (AC 3-Tier/Sleeper) of personal baggage. Commercial freight is strictly prohibited in passenger carriages.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-4 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Selected Class:</span>
          <span className="text-sm font-bold font-mono text-neutral-900">{selectedClass}</span>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="outline" size="md" onClick={onClose}>
              Close
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={() => onBookNow(train, selectedClass)}
          >
            Proceed to Book ({selectedClass})
          </Button>
        </div>
      </div>
    </div>
  );
};
