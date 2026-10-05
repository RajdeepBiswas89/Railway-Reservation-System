import React, { useState, useEffect, useRef } from 'react';
import { SearchParams, Station, TrainClassCode } from '../../types';
import { autocompleteService, StationSuggestion } from '../../services/autocompleteService';
import {
  ArrowLeftRight,
  Calendar,
  Users,
  Train as TrainIcon,
  Search,
  MapPin,
  X,
  Sparkles,
} from 'lucide-react';
import { Button } from '../common/Button';

interface MainTrainSearchProps {
  initialValues?: Partial<SearchParams>;
  onSearch: (params: SearchParams) => void;
  compact?: boolean;
}

export const MainTrainSearch: React.FC<MainTrainSearchProps> = ({
  initialValues,
  onSearch,
  compact = false,
}) => {
  const [fromQuery, setFromQuery] = useState(initialValues?.fromStation || 'HWH');
  const [toQuery, setToQuery] = useState(initialValues?.toStation || 'SBC');
  const [journeyDate, setJourneyDate] = useState(initialValues?.journeyDate || '2026-10-20');
  const [passengersCount, setPassengersCount] = useState(initialValues?.passengersCount || 1);
  const [trainClass, setTrainClass] = useState<TrainClassCode | 'ALL'>(
    initialValues?.classCode || '3A'
  );

  // Autocomplete station suggestions
  const [fromSuggestions, setFromSuggestions] = useState<StationSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<StationSuggestion[]>([]);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  // Keyboard navigation active indices
  const [fromActiveIndex, setFromActiveIndex] = useState(-1);
  const [toActiveIndex, setToActiveIndex] = useState(-1);

  const [fromStationObj, setFromStationObj] = useState<Station | null>(null);
  const [toStationObj, setToStationObj] = useState<Station | null>(null);

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  // Initialize station objects
  useEffect(() => {
    autocompleteService.getStationByCode(fromQuery).then((st) => st && setFromStationObj(st));
    autocompleteService.getStationByCode(toQuery).then((st) => st && setToStationObj(st));
  }, []);

  // Fetch suggestions with ranking from autocompleteService
  useEffect(() => {
    let isCancelled = false;
    autocompleteService.getSuggestions(fromQuery, 8).then((res) => {
      if (!isCancelled) {
        setFromSuggestions(res);
        setFromActiveIndex(-1);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [fromQuery]);

  useEffect(() => {
    let isCancelled = false;
    autocompleteService.getSuggestions(toQuery, 8).then((res) => {
      if (!isCancelled) {
        setToSuggestions(res);
        setToActiveIndex(-1);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [toQuery]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) {
        setShowFromDropdown(false);
      }
      if (toRef.current && !toRef.current.contains(e.target as Node)) {
        setShowToDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwap = () => {
    const tempQuery = fromQuery;
    const tempObj = fromStationObj;
    setFromQuery(toQuery);
    setFromStationObj(toStationObj);
    setToQuery(tempQuery);
    setToStationObj(tempObj);
  };

  const handleSelectFrom = (station: Station) => {
    setFromQuery(station.code);
    setFromStationObj(station);
    setShowFromDropdown(false);
    toInputRef.current?.focus();
  };

  const handleSelectTo = (station: Station) => {
    setToQuery(station.code);
    setToStationObj(station);
    setShowToDropdown(false);
  };

  // Keyboard navigation for 'From'
  const handleFromKeyDown = (e: React.KeyboardEvent) => {
    if (!showFromDropdown || fromSuggestions.length === 0) {
      if (e.key === 'ArrowDown') setShowFromDropdown(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFromActiveIndex((prev) => (prev < fromSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFromActiveIndex((prev) => (prev > 0 ? prev - 1 : fromSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (fromActiveIndex >= 0 && fromActiveIndex < fromSuggestions.length) {
        handleSelectFrom(fromSuggestions[fromActiveIndex].station);
      }
    } else if (e.key === 'Escape') {
      setShowFromDropdown(false);
    }
  };

  // Keyboard navigation for 'To'
  const handleToKeyDown = (e: React.KeyboardEvent) => {
    if (!showToDropdown || toSuggestions.length === 0) {
      if (e.key === 'ArrowDown') setShowToDropdown(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setToActiveIndex((prev) => (prev < toSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setToActiveIndex((prev) => (prev > 0 ? prev - 1 : toSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (toActiveIndex >= 0 && toActiveIndex < toSuggestions.length) {
        handleSelectTo(toSuggestions[toActiveIndex].station);
      }
    } else if (e.key === 'Escape') {
      setShowToDropdown(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      fromStation: fromQuery,
      toStation: toQuery,
      journeyDate,
      passengersCount,
      classCode: trainClass,
    });
  };

  // Render highlighted text helper
  const renderHighlighted = (text: string, query: string) => {
    const { before, match, after } = autocompleteService.highlightMatch(text, query);
    if (!match) return <span>{text}</span>;
    return (
      <span>
        {before}
        <span className="font-extrabold text-[#D92D20] bg-rose-50 px-0.5 rounded">
          {match}
        </span>
        {after}
      </span>
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-xl shadow-xl border border-neutral-200/90 transition-all ${
        compact ? 'p-3.5' : 'p-4 sm:p-6 lg:p-7'
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 lg:gap-4 items-center">
        {/* FROM Station input */}
        <div className="md:col-span-3 relative" ref={fromRef}>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
            From Station
          </label>
          <div
            className="flex items-center bg-neutral-50 border border-neutral-200 hover:border-neutral-400 focus-within:border-[#121417] focus-within:bg-white rounded-lg p-2.5 transition-colors cursor-text"
            onClick={() => {
              setShowFromDropdown(true);
              fromInputRef.current?.focus();
            }}
          >
            <MapPin className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
            <div className="min-w-0 flex-1">
              <input
                ref={fromInputRef}
                type="text"
                value={fromQuery}
                onChange={(e) => {
                  setFromQuery(e.target.value);
                  setShowFromDropdown(true);
                }}
                onFocus={() => setShowFromDropdown(true)}
                onKeyDown={handleFromKeyDown}
                placeholder="Station code, city or name..."
                aria-expanded={showFromDropdown}
                aria-autocomplete="list"
                className="w-full bg-transparent text-sm font-semibold text-neutral-900 outline-none placeholder:text-neutral-400"
              />
              <div className="text-[11px] text-neutral-500 truncate">
                {fromStationObj ? `${fromStationObj.name}, ${fromStationObj.city}` : 'Enter departure station'}
              </div>
            </div>

            {fromQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFromQuery('');
                  setFromStationObj(null);
                  fromInputRef.current?.focus();
                }}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded mr-1"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {fromStationObj && (
              <span className="text-xs font-mono font-bold bg-neutral-200/70 text-neutral-700 px-1.5 py-0.5 rounded ml-1">
                {fromStationObj.code}
              </span>
            )}
          </div>

          {/* Autocomplete Dropdown for FROM */}
          {showFromDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-neutral-200 py-1.5 z-50 max-h-72 overflow-y-auto">
              <div className="px-3 py-1 flex items-center justify-between text-[10px] uppercase font-bold text-neutral-400 tracking-wider border-b border-neutral-100 pb-1">
                <span>{fromQuery ? 'Matching Stations' : 'Popular Railway Hubs'}</span>
                <span className="font-mono text-neutral-400">↑↓ to navigate</span>
              </div>

              {fromSuggestions.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500">
                  No stations found matching "{fromQuery}". Try searching by station code (e.g. HWH, NDLS) or city.
                </div>
              ) : (
                fromSuggestions.map((item, idx) => {
                  const st = item.station;
                  const isSelected = idx === fromActiveIndex;
                  return (
                    <div
                      key={st.code}
                      onClick={() => handleSelectFrom(st)}
                      onMouseEnter={() => setFromActiveIndex(idx)}
                      className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between text-xs transition-colors border-b border-neutral-50 last:border-0 ${
                        isSelected
                          ? 'bg-neutral-100 text-neutral-900 font-semibold'
                          : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-neutral-900 truncate">
                            {renderHighlighted(st.name, fromQuery)}
                          </p>
                          {item.isHub && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1 rounded">
                              Hub
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-500 text-[11px] truncate mt-0.5">
                          {renderHighlighted(st.city, fromQuery)}, {st.state} · Zone {st.zone}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-neutral-800 bg-neutral-200/70 px-1.5 py-0.5 rounded text-xs">
                          {renderHighlighted(st.code, fromQuery)}
                        </span>
                        {st.platforms && (
                          <span className="block text-[9px] text-neutral-400 mt-0.5 font-mono">
                            {st.platforms} plats
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Swap Button */}
        <div className="md:col-span-1 flex justify-center -my-2 md:my-0">
          <button
            type="button"
            onClick={handleSwap}
            aria-label="Swap origin and destination"
            className="w-8 h-8 rounded-full border border-neutral-200 bg-white hover:bg-neutral-100 flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-transform active:rotate-180 duration-200 shadow-2xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* TO Station input */}
        <div className="md:col-span-3 relative" ref={toRef}>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
            To Station
          </label>
          <div
            className="flex items-center bg-neutral-50 border border-neutral-200 hover:border-neutral-400 focus-within:border-[#121417] focus-within:bg-white rounded-lg p-2.5 transition-colors cursor-text"
            onClick={() => {
              setShowToDropdown(true);
              toInputRef.current?.focus();
            }}
          >
            <MapPin className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
            <div className="min-w-0 flex-1">
              <input
                ref={toInputRef}
                type="text"
                value={toQuery}
                onChange={(e) => {
                  setToQuery(e.target.value);
                  setShowToDropdown(true);
                }}
                onFocus={() => setShowToDropdown(true)}
                onKeyDown={handleToKeyDown}
                placeholder="Station code, city or name..."
                aria-expanded={showToDropdown}
                aria-autocomplete="list"
                className="w-full bg-transparent text-sm font-semibold text-neutral-900 outline-none placeholder:text-neutral-400"
              />
              <div className="text-[11px] text-neutral-500 truncate">
                {toStationObj ? `${toStationObj.name}, ${toStationObj.city}` : 'Enter destination station'}
              </div>
            </div>

            {toQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setToQuery('');
                  setToStationObj(null);
                  toInputRef.current?.focus();
                }}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded mr-1"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {toStationObj && (
              <span className="text-xs font-mono font-bold bg-neutral-200/70 text-neutral-700 px-1.5 py-0.5 rounded ml-1">
                {toStationObj.code}
              </span>
            )}
          </div>

          {/* Autocomplete Dropdown for TO */}
          {showToDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-neutral-200 py-1.5 z-50 max-h-72 overflow-y-auto">
              <div className="px-3 py-1 flex items-center justify-between text-[10px] uppercase font-bold text-neutral-400 tracking-wider border-b border-neutral-100 pb-1">
                <span>{toQuery ? 'Matching Stations' : 'Popular Railway Hubs'}</span>
                <span className="font-mono text-neutral-400">↑↓ to navigate</span>
              </div>

              {toSuggestions.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500">
                  No stations found matching "{toQuery}". Try searching by station code (e.g. SBC, CSMT) or city.
                </div>
              ) : (
                toSuggestions.map((item, idx) => {
                  const st = item.station;
                  const isSelected = idx === toActiveIndex;
                  return (
                    <div
                      key={st.code}
                      onClick={() => handleSelectTo(st)}
                      onMouseEnter={() => setToActiveIndex(idx)}
                      className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between text-xs transition-colors border-b border-neutral-50 last:border-0 ${
                        isSelected
                          ? 'bg-neutral-100 text-neutral-900 font-semibold'
                          : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-neutral-900 truncate">
                            {renderHighlighted(st.name, toQuery)}
                          </p>
                          {item.isHub && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1 rounded">
                              Hub
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-500 text-[11px] truncate mt-0.5">
                          {renderHighlighted(st.city, toQuery)}, {st.state} · Zone {st.zone}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-neutral-800 bg-neutral-200/70 px-1.5 py-0.5 rounded text-xs">
                          {renderHighlighted(st.code, toQuery)}
                        </span>
                        {st.platforms && (
                          <span className="block text-[9px] text-neutral-400 mt-0.5 font-mono">
                            {st.platforms} plats
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Journey Date */}
        <div className="md:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
            Journey Date
          </label>
          <div className="flex items-center bg-neutral-50 border border-neutral-200 hover:border-neutral-400 focus-within:border-[#121417] focus-within:bg-white rounded-lg p-2.5 transition-colors">
            <Calendar className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
            <input
              type="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-neutral-900 outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Passengers & Class (Combined / Compact) */}
        <div className="md:col-span-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Passengers
              </label>
              <div className="flex items-center bg-neutral-50 border border-neutral-200 hover:border-neutral-400 focus-within:border-[#121417] focus-within:bg-white rounded-lg p-2.5 transition-colors">
                <Users className="w-3.5 h-3.5 text-neutral-400 mr-1.5 shrink-0" />
                <select
                  value={passengersCount}
                  onChange={(e) => setPassengersCount(parseInt(e.target.value, 10))}
                  className="w-full bg-transparent text-xs font-semibold text-neutral-900 outline-none cursor-pointer"
                >
                  <option value={1}>1 Adult</option>
                  <option value={2}>2 Adults</option>
                  <option value={3}>3 Adults</option>
                  <option value={4}>4 Adults</option>
                  <option value={5}>5 Adults</option>
                  <option value={6}>6 Adults</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Class
              </label>
              <div className="flex items-center bg-neutral-50 border border-neutral-200 hover:border-neutral-400 focus-within:border-[#121417] focus-within:bg-white rounded-lg p-2.5 transition-colors">
                <TrainIcon className="w-3.5 h-3.5 text-neutral-400 mr-1.5 shrink-0" />
                <select
                  value={trainClass}
                  onChange={(e) => setTrainClass(e.target.value as any)}
                  className="w-full bg-transparent text-xs font-semibold text-neutral-900 outline-none cursor-pointer"
                >
                  <option value="ALL">All Classes</option>
                  <option value="3A">3A (AC 3 Tier)</option>
                  <option value="2A">2A (AC 2 Tier)</option>
                  <option value="1A">1A (First AC)</option>
                  <option value="CC">CC (Chair Car)</option>
                  <option value="EC">EC (Exec Chair)</option>
                  <option value="SL">SL (Sleeper)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main CTA & Status Footer */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-100">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>Live station autocomplete · PostgreSQL network directory</span>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          leftIcon={<Search className="w-4 h-4" />}
          className="w-full sm:w-auto px-8"
        >
          SEARCH TRAINS
        </Button>
      </div>
    </form>
  );
};
