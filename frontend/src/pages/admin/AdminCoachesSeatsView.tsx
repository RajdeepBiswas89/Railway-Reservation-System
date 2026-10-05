import React, { useState } from 'react';
import { TrainClassCode } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Armchair, Layers, Info } from 'lucide-react';

export const AdminCoachesSeatsView: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<TrainClassCode>('3A');

  const coachTypes = [
    { code: '1A', name: 'AC First Class', capacity: 24, layout: '2-Berth Coupes & 4-Berth Cabins', rakes: 18 },
    { code: '2A', name: 'AC 2 Tier', capacity: 48, layout: '2 + 2 Bay with Curtains', rakes: 54 },
    { code: '3A', name: 'AC 3 Tier', capacity: 64, layout: '3 + 3 Bay + 2 Side Berths', rakes: 112 },
    { code: '3E', name: 'AC 3 Economy', capacity: 72, layout: 'High-Density 3-Tier', rakes: 32 },
    { code: 'CC', name: 'AC Chair Car', capacity: 78, layout: '3 + 2 Seating Configuration', rakes: 44 },
    { code: 'EC', name: 'Executive Chair Car', capacity: 52, layout: '2 + 2 Luxury Rotatable', rakes: 16 },
    { code: 'SL', name: 'Sleeper Class', capacity: 72, layout: 'Standard 3-Tier Non-AC', rakes: 140 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Coach Composition & Seat Topology
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            LHB & Vande Bharat carriage architectures, berth layouts, and capacity ratings.
          </p>
        </div>
      </div>

      {/* Grid of coach types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {coachTypes.map((c) => (
          <div
            key={c.code}
            onClick={() => setSelectedClass(c.code as any)}
            className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
              selectedClass === c.code
                ? 'border-neutral-900 bg-white ring-2 ring-neutral-900 shadow-sm'
                : 'border-neutral-200 bg-white hover:border-neutral-300'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono font-bold text-sm text-neutral-900">{c.code}</span>
              <span className="font-mono text-xs text-neutral-500">{c.capacity} Berths</span>
            </div>
            <h4 className="text-xs font-bold text-neutral-800">{c.name}</h4>
            <p className="text-[11px] text-neutral-500 mt-1">{c.layout}</p>
            <div className="mt-3 pt-2 border-t border-neutral-100 flex justify-between text-[10px] text-neutral-400 font-mono">
              <span>ACTIVE RAKES: {c.rakes}</span>
              <span>LHB CERTIFIED</span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Coach Specification Detail */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-neutral-700" />
            <h3 className="text-sm font-bold text-neutral-900">
              Technical Rake Schema: Class {selectedClass}
            </h3>
          </div>
          <Badge variant="success" styleType="subtle" showDot>
            Standard Specification
          </Badge>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed">
          Standard Indian Railways production configuration equipped with anti-telescopic CBC couplers, microprocessor-controlled disc brake system, and modular bio-vacuum toilets. Emergency windows positioned at bays 3 and 6.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs font-mono">
          <div className="p-3 bg-neutral-50 rounded-lg">
            <span className="text-neutral-400 text-[10px] uppercase block">Carriage Length</span>
            <span className="font-bold text-neutral-900 text-sm">23.54 Meters</span>
          </div>
          <div className="p-3 bg-neutral-50 rounded-lg">
            <span className="text-neutral-400 text-[10px] uppercase block">Maximum Safe Speed</span>
            <span className="font-bold text-neutral-900 text-sm">160 km/h</span>
          </div>
          <div className="p-3 bg-neutral-50 rounded-lg">
            <span className="text-neutral-400 text-[10px] uppercase block">Aisle Width</span>
            <span className="font-bold text-neutral-900 text-sm">560 mm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
