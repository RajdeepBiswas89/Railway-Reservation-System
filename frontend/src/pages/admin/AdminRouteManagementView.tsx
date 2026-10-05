import React, { useState, useEffect } from 'react';
import { RouteStop, Train } from '../../types';
import { trainService } from '../../services/trainService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';
import {
  Route,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Train as TrainIcon,
} from 'lucide-react';

export const AdminRouteManagementView: React.FC = () => {
  const { showToast } = useToast();
  const [trains, setTrains] = useState<Train[]>([]);
  const [selectedTrainId, setSelectedTrainId] = useState<string>('tr-12649');
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(false);

  // Stop edit / add modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [stCode, setStCode] = useState('');
  const [stName, setStName] = useState('');
  const [arrTime, setArrTime] = useState('');
  const [depTime, setDepTime] = useState('');
  const [halt, setHalt] = useState(5);
  const [dist, setDist] = useState(100);
  const [day, setDay] = useState(1);

  useEffect(() => {
    trainService.getAllTrains().then((data) => {
      setTrains(data);
      if (data.length > 0) setSelectedTrainId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedTrainId) {
      setLoading(true);
      trainService.getRouteStops(selectedTrainId).then((data) => {
        setStops(data);
        setLoading(false);
      });
    }
  }, [selectedTrainId]);

  const openAddStop = () => {
    setEditingIndex(null);
    setStCode('');
    setStName('');
    setArrTime('12:00');
    setDepTime('12:10');
    setHalt(10);
    setDist(Math.max(0, ...stops.map((s) => s.distanceKm)) + 150);
    setDay(1);
    setIsModalOpen(true);
  };

  const openEditStop = (index: number) => {
    setEditingIndex(index);
    const s = stops[index];
    setStCode(s.stationCode);
    setStName(s.stationName);
    setArrTime(s.arrivalTime);
    setDepTime(s.departureTime);
    setHalt(s.haltMinutes);
    setDist(s.distanceKm);
    setDay(s.day);
    setIsModalOpen(true);
  };

  const handleSaveStop = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = [...stops];
    if (editingIndex !== null) {
      updated[editingIndex] = {
        ...updated[editingIndex],
        stationCode: stCode.toUpperCase(),
        stationName: stName,
        arrivalTime: arrTime,
        departureTime: depTime,
        haltMinutes: Number(halt),
        distanceKm: Number(dist),
        day: Number(day),
      };
      showToast(`Updated halt at ${stCode.toUpperCase()}`);
    } else {
      updated.push({
        sequence: updated.length + 1,
        stationCode: stCode.toUpperCase(),
        stationName: stName,
        arrivalTime: arrTime,
        departureTime: depTime,
        haltMinutes: Number(halt),
        distanceKm: Number(dist),
        day: Number(day),
      });
      showToast(`Added stoppage at ${stCode.toUpperCase()}`);
    }
    // Re-index sequences
    const reindexed = updated.map((s, idx) => ({ ...s, sequence: idx + 1 }));
    setStops(reindexed);
    setIsModalOpen(false);
  };

  const handleDeleteStop = (index: number) => {
    const updated = stops.filter((_, idx) => idx !== index);
    const reindexed = updated.map((s, idx) => ({ ...s, sequence: idx + 1 }));
    setStops(reindexed);
    showToast('Stoppage removed from timetable');
  };

  const moveStop = (index: number, direction: 'UP' | 'DOWN') => {
    const newIndex = direction === 'UP' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stops.length) return;
    const updated = [...stops];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    const reindexed = updated.map((s, idx) => ({ ...s, sequence: idx + 1 }));
    setStops(reindexed);
  };

  const currentTrain = trains.find((t) => t.id === selectedTrainId);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Train Route & Stoppage Schedule
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure intermediate halts, dwell times, and kilometer chainage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedTrainId}
            onChange={(e) => setSelectedTrainId(e.target.value)}
            className="bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-bold text-neutral-900 shadow-2xs outline-none"
          >
            {trains.map((t) => (
              <option key={t.id} value={t.id}>
                {t.number} - {t.name}
              </option>
            ))}
          </select>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openAddStop}
          >
            Add Stoppage
          </Button>
        </div>
      </div>

      {/* Train Info Strip */}
      {currentTrain && (
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div>
            <span className="font-bold text-neutral-900 text-sm font-sans">{currentTrain.name}</span>
            <span className="text-neutral-500 ml-2">({currentTrain.number})</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-600">
            <span>{currentTrain.fromStation.code} → {currentTrain.toStation.code}</span>
            <span>·</span>
            <span>Total: {currentTrain.distanceKm} km</span>
            <span>·</span>
            <span>{stops.length} Stoppages</span>
          </div>
        </div>
      )}

      {/* Route Table */}
      <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-neutral-50 text-neutral-600 font-semibold text-[10px] uppercase border-b border-neutral-200">
            <tr>
              <th className="p-3.5">Seq #</th>
              <th className="p-3.5">Station</th>
              <th className="p-3.5">Arrival</th>
              <th className="p-3.5">Departure</th>
              <th className="p-3.5">Halt Time</th>
              <th className="p-3.5">Distance</th>
              <th className="p-3.5">Day</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 font-mono">
            {stops.map((s, idx) => (
              <tr key={s.sequence} className="hover:bg-neutral-50/70">
                <td className="p-3.5 font-bold text-neutral-900">{s.sequence}</td>
                <td className="p-3.5 font-sans font-bold text-neutral-900">
                  <span className="font-mono text-neutral-500 mr-2 bg-neutral-100 px-1 rounded">
                    {s.stationCode}
                  </span>
                  {s.stationName}
                </td>
                <td className="p-3.5 text-neutral-700">{s.arrivalTime}</td>
                <td className="p-3.5 text-neutral-700">{s.departureTime}</td>
                <td className="p-3.5 text-neutral-600">{s.haltMinutes} mins</td>
                <td className="p-3.5 text-neutral-600">{s.distanceKm} km</td>
                <td className="p-3.5 text-neutral-600">Day {s.day}</td>
                <td className="p-3.5 text-right font-sans">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => moveStop(idx, 'UP')}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-800 disabled:opacity-20"
                      title="Move up in route"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === stops.length - 1}
                      onClick={() => moveStop(idx, 'DOWN')}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-800 disabled:opacity-20"
                      title="Move down in route"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditStop(idx)}
                      className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 ml-1"
                      title="Edit stop"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteStop(idx)}
                      className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Remove stop"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIndex !== null ? 'Edit Stoppage Details' : 'Add Route Stoppage'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveStop} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Station Code"
              placeholder="e.g. BSB"
              value={stCode}
              onChange={(e) => setStCode(e.target.value.toUpperCase())}
              required
            />
            <Input
              label="Station Name"
              placeholder="e.g. Varanasi Junction"
              value={stName}
              onChange={(e) => setStName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Arrival Time"
              placeholder="12:00"
              value={arrTime}
              onChange={(e) => setArrTime(e.target.value)}
              required
            />
            <Input
              label="Departure Time"
              placeholder="12:10"
              value={depTime}
              onChange={(e) => setDepTime(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Halt (Mins)"
              type="number"
              value={halt}
              onChange={(e) => setHalt(Number(e.target.value))}
              required
            />
            <Input
              label="Cumulative Km"
              type="number"
              value={dist}
              onChange={(e) => setDist(Number(e.target.value))}
              required
            />
            <Input
              label="Journey Day"
              type="number"
              min="1"
              max="5"
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save Halt
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
