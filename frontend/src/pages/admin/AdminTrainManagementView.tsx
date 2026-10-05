import React, { useState, useEffect } from 'react';
import { Train, TrainType } from '../../types';
import { trainService } from '../../services/trainService';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { useToast } from '../../components/common/Toast';
import {
  Train as TrainIcon,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

export const AdminTrainManagementView: React.FC = () => {
  const { showToast } = useToast();
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrain, setEditingTrain] = useState<Train | null>(null);

  // Form states
  const [trainNumber, setTrainNumber] = useState('');
  const [trainName, setTrainName] = useState('');
  const [trainType, setTrainType] = useState<TrainType>('Superfast');
  const [fromCode, setFromCode] = useState('HWH');
  const [fromCity, setFromCity] = useState('Kolkata');
  const [toCode, setToCode] = useState('SBC');
  const [toCity, setToCity] = useState('Bengaluru');
  const [departureTime, setDepartureTime] = useState('14:30');
  const [arrivalTime, setArrivalTime] = useState('08:45');
  const [duration, setDuration] = useState('18h 15m');
  const [distanceKm, setDistanceKm] = useState(1450);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Train | null>(null);

  const fetchTrains = async () => {
    setLoading(true);
    const data = await trainService.getAllTrains();
    setTrains(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTrains();
  }, []);

  const openAddModal = () => {
    setEditingTrain(null);
    setTrainNumber('');
    setTrainName('');
    setTrainType('Superfast');
    setFromCode('HWH');
    setFromCity('Kolkata');
    setToCode('SBC');
    setToCity('Bengaluru');
    setDepartureTime('14:30');
    setArrivalTime('08:45');
    setDuration('18h 15m');
    setDistanceKm(1450);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Train) => {
    setEditingTrain(t);
    setTrainNumber(t.number);
    setTrainName(t.name);
    setTrainType(t.type);
    setFromCode(t.fromStation.code);
    setFromCity(t.fromStation.city);
    setToCode(t.toStation.code);
    setToCity(t.toStation.city);
    setDepartureTime(t.departureTime);
    setArrivalTime(t.arrivalTime);
    setDuration(t.duration);
    setDistanceKm(t.distanceKm);
    setIsModalOpen(true);
  };

  const handleSaveTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTrain) {
        await trainService.updateTrain(editingTrain.id, {
          number: trainNumber,
          name: trainName,
          type: trainType,
          fromStation: { code: fromCode, name: `${fromCity} Junction`, city: fromCity },
          toStation: { code: toCode, name: `${toCity} Terminal`, city: toCity },
          departureTime,
          arrivalTime,
          duration,
          distanceKm: Number(distanceKm),
        });
        showToast(`Updated train ${trainNumber} ${trainName}`);
      } else {
        await trainService.addTrain({
          number: trainNumber,
          name: trainName,
          type: trainType,
          fromStation: { code: fromCode, name: `${fromCity} Junction`, city: fromCity },
          toStation: { code: toCode, name: `${toCity} Terminal`, city: toCity },
          departureTime,
          arrivalTime,
          duration,
          distanceKm: Number(distanceKm),
          operatingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          status: 'ON_TIME',
          pantryAvailable: true,
          amenities: [
            { id: 'charging', label: 'Charging Points', available: true },
            { id: 'food', label: 'Pantry Car', available: true },
            { id: 'ac', label: 'Air Conditioned', available: true },
          ],
          classes: [
            { code: '3A', name: 'AC 3 Tier', baseFare: 1980, seatsAvailable: 48, status: 'AVAILABLE', coachPrefix: 'B' },
            { code: '2A', name: 'AC 2 Tier', baseFare: 2890, seatsAvailable: 16, status: 'AVAILABLE', coachPrefix: 'A' },
            { code: 'SL', name: 'Sleeper Class', baseFare: 740, seatsAvailable: 72, status: 'AVAILABLE', coachPrefix: 'S' },
          ],
        });
        showToast(`Train ${trainNumber} added to fleet`);
      }
      setIsModalOpen(false);
      fetchTrains();
    } catch (e) {
      showToast('Error saving train', { type: 'error' });
    }
  };

  const handleDeleteTrain = async () => {
    if (!deleteTarget) return;
    try {
      await trainService.deleteTrain(deleteTarget.id);
      showToast(`Train ${deleteTarget.number} removed from active roster`);
      setDeleteTarget(null);
      fetchTrains();
    } catch (e) {
      showToast('Error deleting train', { type: 'error' });
    }
  };

  // Filter & Search
  const filtered = trains.filter((t) => {
    const matchesQuery =
      t.number.includes(searchQuery) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.fromStation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.toStation.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'ALL' || t.type === filterType;
    return matchesQuery && matchesType;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Train Fleet Management
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure train compositions, operational classes, schedules, and active status.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={openAddModal}
        >
          Add New Train
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by number, name, or station..."
              className="w-full bg-neutral-50 text-xs rounded-lg border border-neutral-200 pl-8 pr-3 py-1.5 focus:outline-none focus:border-neutral-900 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 font-medium">Type:</span>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-neutral-50 border border-neutral-200 rounded-md px-2 py-1 text-xs outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Vande Bharat">Vande Bharat</option>
              <option value="Rajdhani">Rajdhani</option>
              <option value="Shatabdi">Shatabdi</option>
              <option value="Superfast">Superfast</option>
              <option value="Express">Express</option>
            </select>
          </div>
        </div>

        <div className="text-neutral-500 font-mono">
          Showing {paginated.length} of {filtered.length} trains
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold text-[10px] uppercase border-b border-neutral-200">
              <tr>
                <th className="p-3.5">Train #</th>
                <th className="p-3.5">Train Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Source</th>
                <th className="p-3.5">Destination</th>
                <th className="p-3.5">Departure</th>
                <th className="p-3.5">Arrival</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginated.map((t) => (
                <tr key={t.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-neutral-900">{t.number}</td>
                  <td className="p-3.5 font-bold text-neutral-900">{t.name}</td>
                  <td className="p-3.5">
                    <Badge variant="neutral" styleType="subtle" showDot={false}>
                      {t.type}
                    </Badge>
                  </td>
                  <td className="p-3.5 font-mono text-neutral-700">{t.fromStation.code}</td>
                  <td className="p-3.5 font-mono text-neutral-700">{t.toStation.code}</td>
                  <td className="p-3.5 font-mono font-semibold text-neutral-900">{t.departureTime}</td>
                  <td className="p-3.5 font-mono font-semibold text-neutral-900">{t.arrivalTime}</td>
                  <td className="p-3.5">
                    <Badge variant="success" styleType="subtle" showDot>
                      ACTIVE
                    </Badge>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                        title="Edit train"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete train"
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

        {/* Pagination Bar */}
        <div className="p-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs">
          <span className="text-neutral-500 font-mono">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Train Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTrain ? `Edit Train ${editingTrain.number}` : 'Add Train to Fleet'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveTrain} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Train Number"
              placeholder="e.g. 12649"
              value={trainNumber}
              onChange={(e) => setTrainNumber(e.target.value)}
              required
            />
            <Input
              label="Train Name"
              placeholder="e.g. Karnataka Express"
              value={trainName}
              onChange={(e) => setTrainName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Category"
              value={trainType}
              onChange={(e) => setTrainType(e.target.value as any)}
              options={[
                { value: 'Vande Bharat', label: 'Vande Bharat' },
                { value: 'Rajdhani', label: 'Rajdhani' },
                { value: 'Shatabdi', label: 'Shatabdi' },
                { value: 'Superfast', label: 'Superfast' },
                { value: 'Duronto', label: 'Duronto' },
                { value: 'Express', label: 'Express' },
              ]}
            />
            <Input
              label="Source Code"
              placeholder="HWH"
              value={fromCode}
              onChange={(e) => setFromCode(e.target.value)}
              required
            />
            <Input
              label="Dest Code"
              placeholder="SBC"
              value={toCode}
              onChange={(e) => setToCode(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <Input
              label="Departure"
              placeholder="21:15"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              required
            />
            <Input
              label="Arrival"
              placeholder="06:30"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              required
            />
            <Input
              label="Duration"
              placeholder="33h 15m"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
            <Input
              label="Distance (km)"
              type="number"
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
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
              {editingTrain ? 'Save Changes' : 'Add Train'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmationDialog
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteTrain}
          title="Decommission Train?"
          message={`Are you sure you want to remove ${deleteTarget.number} ${deleteTarget.name} from the central inventory? Future bookings for this train will be halted.`}
          confirmText="Yes, Decommission"
          cancelText="Keep Train"
          variant="danger"
        />
      )}
    </div>
  );
};
