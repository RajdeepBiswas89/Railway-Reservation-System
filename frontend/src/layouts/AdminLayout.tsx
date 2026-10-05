import React, { useState } from 'react';
import { Logo } from '../components/common/Logo';
import {
  LayoutDashboard,
  Train as TrainIcon,
  MapPin,
  Route,
  Layers,
  Armchair,
  Ticket,
  Users,
  BarChart3,
  Settings,
  Bell,
  Search,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  CheckCircle,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentSection: string;
  onNavigateSection: (section: string) => void;
  onExitToPublic: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  currentSection,
  onNavigateSection,
  onExitToPublic,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trains', label: 'Trains', icon: TrainIcon },
    { id: 'stations', label: 'Stations', icon: MapPin },
    { id: 'routes', label: 'Routes', icon: Route },
    { id: 'coaches', label: 'Coaches', icon: Layers },
    { id: 'seats', label: 'Seats', icon: Armchair },
    { id: 'bookings', label: 'Bookings', icon: Ticket },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const currentItem = menuItems.find((m) => m.id === currentSection) || menuItems[0];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#121417] flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-neutral-200">
        <Logo size="sm" />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#121417] text-white flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Brand header */}
          <div className="p-5 border-b border-neutral-800/80 flex items-center justify-between">
            <Logo variant="light" size="sm" showTagline />
          </div>

          <div className="px-4 py-2 text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
            Management Console
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigateSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D92D20]' : ''}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom user / exit area */}
          <div className="p-3 border-t border-neutral-800/80 bg-neutral-900/50">
            <button
              onClick={onExitToPublic}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Exit to Passenger Site</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
            </button>

            <div className="mt-2 pt-2 border-t border-neutral-800/60 flex items-center gap-2.5 px-2">
              <div className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold text-white">
                AD
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate text-white">Admin Controller</p>
                <p className="text-[10px] text-neutral-400 truncate">Central Rail Ops</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header bar with Breadcrumbs, Search, Notifications */}
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-200/80 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span className="font-medium text-neutral-400">Railnex Admin</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
            <span className="font-semibold text-neutral-900">{currentItem.label}</span>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search train, PNR, station..."
                className="w-full bg-neutral-50 text-xs rounded-lg border border-neutral-200 pl-9 pr-3 py-1.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
              />
            </div>

            {/* Notification button */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 relative"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D92D20]" />
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-neutral-200 p-3 z-50 text-xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <span className="font-bold text-neutral-900">System Alerts</span>
                    <span className="text-[10px] text-neutral-500">Just now</span>
                  </div>
                  <div className="space-y-2.5 mt-2">
                    <div className="flex items-start gap-2.5 p-1.5 rounded hover:bg-neutral-50">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-neutral-800">12649 Karnataka Exp On-Time</p>
                        <p className="text-neutral-500 text-[11px]">Departed HWH on scheduled platform 09.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 p-1.5 rounded hover:bg-neutral-50">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <div>
                        <p className="font-semibold text-neutral-800">High Demand: NDLS → CSMT</p>
                        <p className="text-neutral-500 text-[11px]">Occupancy reached 98.4% for weekend slots.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onExitToPublic}
              className="text-xs font-semibold text-neutral-700 hover:text-neutral-950 px-2.5 py-1.5 rounded-md hover:bg-neutral-100 transition-colors"
            >
              Passenger App
            </button>
          </div>
        </header>

        {/* Admin Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
