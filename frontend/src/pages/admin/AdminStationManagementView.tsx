import React, { useState, useEffect } from 'react';
import { Station } from '../../types';
import { stationService } from '../../services/stationService';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { useToast } from '../../components/common/Toast';
import {
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const AdminStationManagementView: React.FC = () => {
  const { showToast } = useToast();
  const [stations, setStations] = useState<Station[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zone, setZone] = useState('ER');
  const [platforms, setPlatforms] = useState(6);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Station | null>(null);

  const fetchStations = async () => {
    const list = await stationService.getStations();
    setStations(list);
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const openAddModal = () => {
    setEditingStation(null);
    setCode('');
    setName('');
    setCity('');
    setState('');
    setZone('ER');
    setPlatforms(6);
    setIsModalOpen(true);
  };

  const openEditModal = (s: Station) => {
    setEditingStation(s);
    setCode(s.code);
    setName(s.name);
    setCity(s.city);
    setState(s.state);
    setZone(s.zone);
    setPlatforms(s.platforms || 4);
    setIsModalOpen(true);
  };

  const handleSaveStation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStation) {
        await stationService.updateStation(editingStation.code, {
          name,
          city,
          state,
          zone,
          platforms: Number(platforms),
        });
        showToast(`Updated station ${editingStation.code}`);
      } else {
        await stationService.addStation({
          code: code.toUpperCase().trim(),
          name,
          city,
          state,
          zone,
          platforms: Number(platforms),
          status: 'ACTIVE',
        });
        showToast(`Added station ${code.toUpperCase()} to network`);
      }
      setIsModalOpen(false);
      fetchStations();
    } catch (e) {
      showToast('Error saving station', { type: 'error' });
    }
  };

  const handleDeleteStation = async () => {
    if (!deleteTarget) return;
    try {
      await stationService.deleteStation(deleteTarget.code);
      showToast(`Removed station ${deleteTarget.code}`);
      setDeleteTarget(null);
      fetchStations();
    } catch (e) {
      showToast('Error removing station', { type: 'error' });
    }
  };

  const filtered = stations.filter((s) => {
    const matchesQuery =
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.state.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesZone = zoneFilter === 'ALL' || s.zone === zoneFilter;
    return matchesQuery && matchesZone;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Station Network Directory
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure junction codes, railway administrative zones, and active track platforms.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={openAddModal}
        >
          Add Station
        </Button>
      </div>

      {/* Search and Filters */}
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
              placeholder="Search station code, city, state..."
              className="w-full bg-neutral-50 text-xs rounded-lg border border-neutral-200 pl-8 pr-3 py-1.5 focus:outline-none focus:border-neutral-900 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 font-medium">Zone:</span>
            <select
              value={zoneFilter}
              onChange={(e) => {
                setZoneFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-neutral-50 border border-neutral-200 rounded-md px-2 py-1 text-xs outline-none"
            >
              <option value="ALL">All Zones</option>
              <option value="ER">ER (Eastern)</option>
              <option value="NR">NR (Northern)</option>
              <option value="SR">SR (Southern)</option>
              <option value="WR">WR (Western)</option>
              <option value="CR">CR (Central)</option>
              <option value="SCR">SCR (South Central)</option>
              <option value="SWR">SWR (South Western)</option>
            </select>
          </div>
        </div>

        <div className="text-neutral-500 font-mono">
          Showing {paginated.length} of {filtered.length} stations
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold text-[10px] uppercase border-b border-neutral-200">
              <tr>
                <th className="p-3.5">Code</th>
                <th className="p-3.5">Station Name</th>
                <th className="p-3.5">City</th>
                <th className="p-3.5">State</th>
                <th className="p-3.5">Zone</th>
                <th className="p-3.5">Platforms</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginated.map((st) => (
                <tr key={st.code} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-neutral-900 bg-neutral-50/60 w-24">
                    {st.code}
                  </td>
                  <td className="p-3.5 font-bold text-neutral-900">{st.name}</td>
                  <td className="p-3.5 text-neutral-700">{st.city}</td>
                  <td className="p-3.5 text-neutral-600">{st.state}</td>
                  <td className="p-3.5 font-mono text-neutral-700">{st.zone}</td>
                  <td className="p-3.5 font-mono text-neutral-600">{st.platforms || 4}</td>
                  <td className="p-3.5">
                    <Badge variant="success" styleType="subtle" showDot>
                      OPERATIONAL
                    </Badge>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(st)}
                        className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                        title="Edit station"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(st)}
                        className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete station"
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
              className="p-1.5 rounded border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStation ? `Edit Station ${editingStation.code}` : 'Add Station'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveStation} className="space-y-4">
          <Input
            label="Station Code (Alpha 3-4)"
            placeholder="e.g. HWH"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={!!editingStation}
            required
          />
          <Input
            label="Station Name"
            placeholder="e.g. Howrah Junction"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              placeholder="e.g. Kolkata"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            <Input
              label="State"
              placeholder="e.g. West Bengal"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Railway Zone"
              placeholder="e.g. ER"
              value={zone}
              onChange={(e) => setZone(e.target.value.toUpperCase())}
              required
            />
            <Input
              label="Platforms Count"
              type="number"
              value={platforms}
              onChange={(e) => setPlatforms(Number(e.target.value))}
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
              {editingStation ? 'Save Station' : 'Add Station'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      {deleteTarget && (
        <ConfirmationDialog
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteStation}
          title="Delete Station Node?"
          message={`Are you sure you want to remove ${deleteTarget.code} (${deleteTarget.name})? Any active routes linked to this station will require reconfiguration.`}
          confirmText="Yes, Remove Station"
          cancelText="Cancel"
          variant="danger"
        />
      )}
    </div>
  );
};
