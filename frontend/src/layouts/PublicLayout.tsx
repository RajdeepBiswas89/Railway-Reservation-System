import React, { useState } from 'react';
import { Logo } from '../components/common/Logo';
import { Button } from '../components/common/Button';
import { UserProfile } from '../types';
import { User, Bell, Menu, X, Shield, ArrowRight } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
  user: UserProfile | null;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  user,
  currentPath,
  onNavigate,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Trains', path: '/search' },
    { label: 'Live Status', path: '/live-status' },
    { label: 'PNR Status', path: '/pnr-status' },
    { label: 'Catering', path: '/meals' },
    { label: 'My Bookings', path: '/bookings' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA] text-[#121417]">
      {/* Top Bar - Strictly 1-row, 3-zone contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Single Brand Wordmark Element */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('/')}
              className="text-left focus-visible:outline-none"
            >
              <Logo size="md" />
            </button>
          </div>

          {/* Zone 2: 4-6 Clean text navigation links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-neutral-600">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => onNavigate(link.path)}
                  className={`transition-colors py-1 relative cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-neutral-900 font-bold'
                      : 'hover:text-neutral-900'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D92D20] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1-2 Primary Actions & User Menu */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Direct Admin Portal Switcher */}
            <button
              onClick={() => onNavigate('/admin')}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
              title="Switch to Enterprise Admin Portal"
            >
              <Shield className="w-3.5 h-3.5 text-neutral-500" />
              <span>Admin Portal</span>
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors focus-visible:outline-none cursor-pointer"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-neutral-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold">
                      {user.fullName.charAt(0)}
                    </div>
                  )}
                  <span className="hidden sm:inline text-xs font-semibold text-neutral-800 max-w-[110px] truncate">
                    {user.fullName.split(' ')[0]}
                  </span>
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-neutral-200/90 py-1.5 z-50 text-xs animate-in fade-in duration-100">
                    <div className="px-3 py-2 border-b border-neutral-100">
                      <p className="font-semibold text-neutral-900 truncate">{user.fullName}</p>
                      <p className="text-neutral-500 truncate mt-0.5">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('/dashboard');
                      }}
                      className="w-full text-left px-3 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 font-medium"
                    >
                      User Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('/bookings');
                      }}
                      className="w-full text-left px-3 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 font-medium"
                    >
                      My Bookings
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('/profile');
                      }}
                      className="w-full text-left px-3 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 font-medium"
                    >
                      Profile & Saved Passengers
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('/admin');
                      }}
                      className="w-full text-left px-3 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 font-medium"
                    >
                      Admin Console
                    </button>
                    <div className="border-t border-neutral-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 font-medium"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('/login')}
                >
                  Log In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate('/register')}
                >
                  Register
                </Button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-neutral-200 bg-white px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate(link.path);
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  currentPath === link.path
                    ? 'bg-neutral-100 text-neutral-900 font-bold'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="pt-2 border-t border-neutral-100 space-y-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('/admin');
                }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <Shield className="w-4 h-4 text-neutral-500" />
                Admin Console
              </button>
              {user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('/dashboard');
                  }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-neutral-700"
                >
                  Dashboard ({user.fullName})
                </button>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate('/login');
                    }}
                  >
                    Log In
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate('/register');
                    }}
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1">{children}</main>

      {/* Quiet, High-Grade Footer */}
      <footer className="bg-[#121417] text-white border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="md:col-span-2 space-y-4">
              <Logo variant="light" size="lg" showTagline />
              <p className="text-xs sm:text-sm text-neutral-400 max-w-sm leading-relaxed mt-2">
                A modern railway reservation and transportation management ecosystem designed for speed, clarity, and uncompromising reliability.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs text-neutral-400">DBMS Architectural Prototype</span>
                <span className="text-neutral-600">·</span>
                <span className="text-xs text-neutral-400">FastAPI & PostgreSQL Ready</span>
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3.5">
                Passenger Tools
              </h4>
              <ul className="space-y-2.5 text-xs text-neutral-400 font-medium">
                <li>
                  <button onClick={() => onNavigate('/')} className="hover:text-white transition-colors">
                    Home & Search
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('/live-status')} className="hover:text-white transition-colors">
                    Live GPS Status
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('/pnr-status')} className="hover:text-white transition-colors">
                    PNR Live Tracker
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('/meals')} className="hover:text-white transition-colors">
                    Berth E-Catering
                  </button>
                </li>
              </ul>
            </div>

            {/* Enterprise & Admin */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3.5">
                Operations
              </h4>
              <ul className="space-y-2.5 text-xs text-neutral-400 font-medium">
                <li>
                  <button onClick={() => onNavigate('/admin')} className="hover:text-white transition-colors">
                    Admin Dashboard
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('/admin/trains')} className="hover:text-white transition-colors">
                    Train Fleet Master
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('/admin/stations')} className="hover:text-white transition-colors">
                    Station Network
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('/admin/reports')} className="hover:text-white transition-colors">
                    Revenue & Analytics
                  </button>
                </li>
              </ul>
            </div>

            {/* Support & Legal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3.5">
                Assistance
              </h4>
              <ul className="space-y-2.5 text-xs text-neutral-400 font-medium">
                <li>
                  <button onClick={() => onNavigate('/help')} className="hover:text-white transition-colors">
                    Help Center & FAQs
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('/ticket/8A72K91')} className="hover:text-white transition-colors">
                    Sample Digital Ticket
                  </button>
                </li>
                <li>
                  <span className="text-neutral-500">24/7 Rail Care: 139</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 mt-8 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            <div>
              © 2026 RAILNEX Transport Systems Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <span className="hover:text-neutral-300 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-neutral-300 cursor-pointer">Terms of Carriage</span>
              <span className="hover:text-neutral-300 cursor-pointer">System Status</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
