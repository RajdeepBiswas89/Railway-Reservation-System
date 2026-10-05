import React, { useState, useEffect } from 'react';
import { FilterOptions, SearchParams, Train, TrainClassCode } from '../types';
import { trainService } from '../services/trainService';
import { MainTrainSearch } from '../components/search/MainTrainSearch';
import { TrainResultCard } from '../components/trains/TrainResultCard';
import { TrainDetailsView } from '../components/trains/TrainDetailsView';
import { TrainCardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import {
  Filter,
  SlidersHorizontal,
  ChevronDown,
  ArrowRight,
  Clock,
  RotateCcw,
  Search,
} from 'lucide-react';

interface SearchResultsPageProps {
  initialParams: SearchParams;
  onBookTrain: (train: Train, classCode: TrainClassCode) => void;
  onModifyParams: (params: SearchParams) => void;
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  initialParams,
  onBookTrain,
  onModifyParams,
}) => {
  const [params, setParams] = useState<SearchParams>(initialParams);
  const [showModifySearch, setShowModifySearch] = useState(false);
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filters, setFilters] = useState<FilterOptions>({
    departureTimes: [],
    arrivalTimes: [],
    trainTypes: [],
    classes: [],
    availableOnly: false,
    maxPrice: 6000,
    sortBy: 'RECOMMENDED',
  });

  // Modal for full train details
  const [selectedTrainForDetails, setSelectedTrainForDetails] = useState<Train | null>(null);

  // Load trains
  const loadTrains = async () => {
    setLoading(true);
    const results = await trainService.searchTrains(params, filters);
    setTrains(results);
    setLoading(false);
  };

  useEffect(() => {
    loadTrains();
  }, [params, filters]);

  const handleFilterChange = (updates: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const resetFilters = () => {
    setFilters({
      departureTimes: [],
      arrivalTimes: [],
      trainTypes: [],
      classes: [],
      availableOnly: false,
      maxPrice: 6000,
      sortBy: 'RECOMMENDED',
    });
  };

  const toggleDepartureTime = (time: 'morning' | 'afternoon' | 'evening' | 'night') => {
    const current = [...filters.departureTimes];
    const idx = current.indexOf(time);
    if (idx > -1) current.splice(idx, 1);
    else current.push(time);
    handleFilterChange({ departureTimes: current });
  };

  const toggleTrainType = (type: any) => {
    const current = [...filters.trainTypes];
    const idx = current.indexOf(type);
    if (idx > -1) current.splice(idx, 1);
    else current.push(type);
    handleFilterChange({ trainTypes: current });
  };

  const toggleClass = (cls: TrainClassCode) => {
    const current = [...filters.classes];
    const idx = current.indexOf(cls);
    if (idx > -1) current.splice(idx, 1);
    else current.push(cls);
    handleFilterChange({ classes: current });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Search Summary Header Bar */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold text-neutral-900">
              {params.fromStation}
            </span>
            <ArrowRight className="w-4 h-4 text-neutral-400" />
            <span className="text-base sm:text-lg font-bold text-neutral-900">
              {params.toStation}
            </span>
          </div>

          <div className="h-4 w-px bg-neutral-200 hidden sm:block" />

          <div className="flex items-center gap-4 text-xs text-neutral-600 font-mono">
            <span>{params.journeyDate}</span>
            <span>·</span>
            <span>{params.passengersCount} {params.passengersCount === 1 ? 'Passenger' : 'Passengers'}</span>
            <span>·</span>
            <span className="font-bold text-neutral-800">{params.classCode}</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowModifySearch(!showModifySearch)}
        >
          {showModifySearch ? 'Close Search' : 'Modify Search'}
        </Button>
      </div>

      {/* Expandable Modify Search Panel */}
      {showModifySearch && (
        <div className="animate-in fade-in duration-150">
          <MainTrainSearch
            initialValues={params}
            compact
            onSearch={(newParams) => {
              setParams(newParams);
              onModifyParams(newParams);
              setShowModifySearch(false);
            }}
          />
        </div>
      )}

      {/* Main Grid: Sidebar Filters (3 cols) + Results (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Filter Sidebar */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-neutral-200/90 shadow-2xs p-5 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-neutral-700" />
              <h3 className="text-sm font-bold text-neutral-900">Filter Trains</h3>
            </div>
            <button
              onClick={resetFilters}
              className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Availability Toggle */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filters.availableOnly}
                onChange={(e) => handleFilterChange({ availableOnly: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
              />
              <span className="text-xs font-semibold text-neutral-800">
                Show Available Seats Only
              </span>
            </label>
          </div>

          {/* Departure Time Slots */}
          <div className="space-y-2.5 pt-3 border-t border-neutral-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
              Departure Time
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { id: 'morning', label: '06:00 - 12:00', name: 'Morning' },
                { id: 'afternoon', label: '12:00 - 17:00', name: 'Afternoon' },
                { id: 'evening', label: '17:00 - 21:00', name: 'Evening' },
                { id: 'night', label: '21:00 - 06:00', name: 'Night' },
              ].map((slot) => {
                const active = filters.departureTimes.includes(slot.id as any);
                return (
                  <button
                    key={slot.id}
                    onClick={() => toggleDepartureTime(slot.id as any)}
                    className={`p-2 rounded-lg text-left border transition-all ${
                      active
                        ? 'border-neutral-900 bg-neutral-900 text-white font-bold'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                    }`}
                  >
                    <span className="block text-[11px] font-medium">{slot.name}</span>
                    <span className="block text-[9px] font-mono opacity-80">{slot.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Train Types */}
          <div className="space-y-2 pt-3 border-t border-neutral-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
              Train Category
            </span>
            <div className="space-y-1.5 text-xs">
              {['Vande Bharat', 'Rajdhani', 'Shatabdi', 'Superfast', 'Duronto', 'Express'].map((type) => {
                const active = filters.trainTypes.includes(type as any);
                return (
                  <label key={type} className="flex items-center gap-2 cursor-pointer text-neutral-700">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleTrainType(type)}
                      className="w-3.5 h-3.5 rounded border-neutral-300 text-neutral-900"
                    />
                    <span className="text-xs">{type}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Travel Classes */}
          <div className="space-y-2 pt-3 border-t border-neutral-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
              Class of Travel
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
              {(['1A', '2A', '3A', 'CC', 'EC', 'SL'] as TrainClassCode[]).map((cls) => {
                const active = filters.classes.includes(cls);
                return (
                  <button
                    key={cls}
                    onClick={() => toggleClass(cls)}
                    className={`py-1.5 px-2 rounded-md border text-center transition-all ${
                      active
                        ? 'border-neutral-900 bg-neutral-900 text-white font-bold'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                    }`}
                  >
                    {cls}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-2 pt-3 border-t border-neutral-100">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Max Fare
              </span>
              <span className="font-mono font-bold text-neutral-900">
                ₹{filters.maxPrice}
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="6000"
              step="200"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange({ maxPrice: parseInt(e.target.value, 10) })}
              className="w-full accent-neutral-900 cursor-pointer"
            />
          </div>
        </div>

        {/* Right Search Results (9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          {/* Header Sorting Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-neutral-200 text-xs">
            <div className="font-medium text-neutral-600">
              <strong className="text-neutral-900 font-bold">{trains.length} trains</strong> found for this journey
            </div>

            <div className="flex items-center gap-2">
              <span className="text-neutral-500 font-medium">Sort by:</span>
              <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg">
                {[
                  { id: 'RECOMMENDED', label: 'Recommended' },
                  { id: 'DEPARTURE', label: 'Departure' },
                  { id: 'DURATION', label: 'Duration' },
                  { id: 'PRICE_LOW', label: 'Price' },
                ].map((sort) => (
                  <button
                    key={sort.id}
                    onClick={() => handleFilterChange({ sortBy: sort.id as any })}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      filters.sortBy === sort.id
                        ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results List */}
          {loading ? (
            <div className="space-y-4">
              <TrainCardSkeleton />
              <TrainCardSkeleton />
              <TrainCardSkeleton />
            </div>
          ) : trains.length === 0 ? (
            <EmptyState
              title="No trains found for your filter criteria"
              description="Try adjusting your departure timing, unchecking 'Available Seats Only', or expanding the price range."
              actionText="Reset All Filters"
              onAction={resetFilters}
            />
          ) : (
            <div className="space-y-4">
              {trains.map((train) => (
                <TrainResultCard
                  key={train.id}
                  train={train}
                  selectedClass={params.classCode !== 'ALL' ? params.classCode : undefined}
                  onBookNow={(t, cls) => onBookTrain(t, cls)}
                  onViewFullDetails={(t) => setSelectedTrainForDetails(t)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Train Details Modal */}
      {selectedTrainForDetails && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTrainForDetails(null)}
          maxWidth="2xl"
        >
          <TrainDetailsView
            train={selectedTrainForDetails}
            onClose={() => setSelectedTrainForDetails(null)}
            onBookNow={(t, cls) => {
              setSelectedTrainForDetails(null);
              onBookTrain(t, cls);
            }}
          />
        </Modal>
      )}
    </div>
  );
};
