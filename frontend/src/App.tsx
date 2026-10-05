import React, { useState, useEffect } from 'react';
import {
  Booking,
  SearchParams,
  Train,
  TrainClassCode,
  UserProfile,
} from './types';
import { authService } from './services/authService';
import { trainService } from './services/trainService';
import { ToastProvider } from './components/common/Toast';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public & User Pages
import { HomePage } from './pages/HomePage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { BookingFlowPage } from './pages/BookingFlowPage';
import { DigitalTicketPage } from './pages/DigitalTicketPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { HelpCenterPage } from './pages/HelpCenterPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Advanced Platform Tools
import { LiveStatusTrackerPage } from './pages/LiveStatusTrackerPage';
import { PnrTrackerPage } from './pages/PnrTrackerPage';
import { CateringPage } from './pages/CateringPage';

// Admin Views
import { AdminDashboardView } from './pages/admin/AdminDashboardView';
import { AdminTrainManagementView } from './pages/admin/AdminTrainManagementView';
import { AdminStationManagementView } from './pages/admin/AdminStationManagementView';
import { AdminRouteManagementView } from './pages/admin/AdminRouteManagementView';
import { AdminCoachesSeatsView } from './pages/admin/AdminCoachesSeatsView';
import { AdminBookingManagementView } from './pages/admin/AdminBookingManagementView';
import { AdminUsersView } from './pages/admin/AdminUsersView';
import { AdminReportsView } from './pages/admin/AdminReportsView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [popularTrains, setPopularTrains] = useState<Train[]>([]);

  // Search parameters state
  const [searchParams, setSearchParams] = useState<SearchParams>({
    fromStation: 'HWH',
    toStation: 'NDLS',
    journeyDate: '2026-10-20',
    passengersCount: 1,
    classCode: '3A',
  });

  // Active booking flow state
  const [activeBookingTrain, setActiveBookingTrain] = useState<Train | null>(null);
  const [activeBookingClass, setActiveBookingClass] = useState<TrainClassCode>('3A');
  const [viewTicketPnr, setViewTicketPnr] = useState<string>('8A72K91');

  // Admin Section state
  const [adminSection, setAdminSection] = useState<string>('dashboard');

  useEffect(() => {
    authService.getCurrentUser().then(setCurrentUser);
    trainService.getPopularTrains().then(setPopularTrains);
  }, []);

  // Navigation router helper
  const navigate = (path: string) => {
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartSearch = (params: SearchParams) => {
    setSearchParams(params);
    navigate('/search');
  };

  const handleBookTrain = (train: Train, classCode?: TrainClassCode) => {
    setActiveBookingTrain(train);
    setActiveBookingClass(classCode || train.classes[0]?.code || '3A');
    navigate(currentUser ? '/book' : '/login');
  };

  const handleViewTicket = (pnr: string) => {
    setViewTicketPnr(pnr);
    navigate(`/ticket/${pnr}`);
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    navigate('/');
  };

  // Check if current route is an Admin route
  const isAdminRoute = currentPath.startsWith('/admin');

  return (
    <ToastProvider>
      {isAdminRoute ? (
        <AdminLayout
          currentSection={adminSection}
          onNavigateSection={(sec) => {
            setAdminSection(sec);
            navigate(`/admin/${sec}`);
          }}
          onExitToPublic={() => navigate('/')}
        >
          {adminSection === 'dashboard' && (
            <AdminDashboardView onNavigateSection={(sec) => setAdminSection(sec)} />
          )}
          {adminSection === 'trains' && <AdminTrainManagementView />}
          {adminSection === 'stations' && <AdminStationManagementView />}
          {adminSection === 'routes' && <AdminRouteManagementView />}
          {(adminSection === 'coaches' || adminSection === 'seats') && <AdminCoachesSeatsView />}
          {adminSection === 'bookings' && <AdminBookingManagementView />}
          {adminSection === 'users' && <AdminUsersView />}
          {(adminSection === 'reports' || adminSection === 'settings') && <AdminReportsView />}
        </AdminLayout>
      ) : (
        <PublicLayout
          user={currentUser}
          currentPath={currentPath}
          onNavigate={navigate}
          onLogout={handleLogout}
        >
          {/* Public Home */}
          {currentPath === '/' && (
            <HomePage
              onSearch={handleStartSearch}
              onSelectTrain={(id) => {
                trainService.getTrainById(id).then((t) => t && handleBookTrain(t));
              }}
              onBookTrain={handleBookTrain}
              onNavigate={navigate}
              popularTrains={popularTrains}
              initialSearchParams={searchParams}
            />
          )}

          {/* Search Results */}
          {currentPath === '/search' && (
            <SearchResultsPage
              initialParams={searchParams}
              onBookTrain={handleBookTrain}
              onModifyParams={setSearchParams}
            />
          )}

          {/* Advanced Feature 1: Live Running Status */}
          {currentPath === '/live-status' && <LiveStatusTrackerPage />}

          {/* Advanced Feature 2: PNR Tracker & Coach Position */}
          {currentPath === '/pnr-status' && (
            <PnrTrackerPage
              initialPnr={viewTicketPnr || '8A72K91'}
              onViewTicket={handleViewTicket}
            />
          )}

          {/* Advanced Feature 3: Onboard E-Catering */}
          {currentPath === '/meals' && <CateringPage />}

          {/* Multi-step Booking Flow */}
          {currentPath === '/book' && (
            <BookingFlowPage
              train={activeBookingTrain || popularTrains[0] || ({} as any)}
              initialClassCode={activeBookingClass}
              journeyDate={searchParams.journeyDate}
              currentUser={currentUser}
              onBookingComplete={(b) => {
                setViewTicketPnr(b.pnr);
              }}
              onNavigateHome={() => navigate('/')}
              onNavigateDashboard={() => navigate('/dashboard')}
            />
          )}

          {/* Digital Ticket Viewer */}
          {currentPath.startsWith('/ticket') && (
            <DigitalTicketPage
              pnr={viewTicketPnr || '8A72K91'}
              onNavigateBack={() => navigate('/bookings')}
            />
          )}

          {/* User Dashboard */}
          {currentPath === '/dashboard' && currentUser && (
            <UserDashboardPage
              user={currentUser}
              onViewBooking={handleViewTicket}
              onNavigateSearch={() => navigate('/search')}
              onNavigateBookings={() => navigate('/bookings')}
              onNavigateProfile={() => navigate('/profile')}
            />
          )}

          {/* My Bookings History */}
          {currentPath === '/bookings' && (
            <MyBookingsPage
              userId={currentUser?.id || 'usr-rajdeep-01'}
              onViewTicket={handleViewTicket}
              onBookNew={() => navigate('/search')}
            />
          )}

          {/* User Profile */}
          {currentPath === '/profile' && currentUser && (
            <ProfilePage
              user={currentUser}
              onUpdateUser={setCurrentUser}
            />
          )}

          {/* Help & FAQs */}
          {currentPath === '/help' && (
            <HelpCenterPage onNavigateHome={() => navigate('/')} />
          )}

          {/* Auth: Login */}
          {currentPath === '/login' && (
            <LoginPage
              onSuccess={(u) => {
                setCurrentUser(u);
                navigate(activeBookingTrain ? '/book' : '/dashboard');
              }}
              onNavigateRegister={() => navigate('/register')}
              onNavigateHome={() => navigate('/')}
            />
          )}

          {/* Auth: Register */}
          {currentPath === '/register' && (
            <RegisterPage
              onSuccess={(u) => {
                setCurrentUser(u);
                navigate(activeBookingTrain ? '/book' : '/dashboard');
              }}
              onNavigateLogin={() => navigate('/login')}
              onNavigateHome={() => navigate('/')}
            />
          )}

          {/* Fallback 404 */}
          {![
            '/',
            '/search',
            '/live-status',
            '/pnr-status',
            '/meals',
            '/book',
            '/dashboard',
            '/bookings',
            '/profile',
            '/help',
            '/login',
            '/register',
          ].includes(currentPath) &&
            !currentPath.startsWith('/ticket') && (
              <NotFoundPage onReturnHome={() => navigate('/')} />
            )}
        </PublicLayout>
      )}
    </ToastProvider>
  );
}
