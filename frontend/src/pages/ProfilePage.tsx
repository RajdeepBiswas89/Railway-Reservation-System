import React, { useState } from 'react';
import { SavedPassenger, UserProfile } from '../types';
import { authService } from '../services/authService';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import {
  User,
  Users,
  Shield,
  Bell,
  Plus,
  Trash2,
  CheckCircle,
  Save,
} from 'lucide-react';

interface ProfilePageProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateUser }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'passengers' | 'preferences' | 'security'>('profile');

  // Form states
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [preferredClass, setPreferredClass] = useState(user.preferences.preferredClass);
  const [preferredBerth, setPreferredBerth] = useState(user.preferences.preferredBerth);
  const [foodChoice, setFoodChoice] = useState(user.preferences.foodChoice);
  const [smsAlerts, setSmsAlerts] = useState(user.preferences.smsAlerts);
  const [emailAlerts, setEmailAlerts] = useState(user.preferences.emailAlerts);

  // Add passenger modal
  const [isAddPassengerOpen, setIsAddPassengerOpen] = useState(false);
  const [newPassName, setNewPassName] = useState('');
  const [newPassAge, setNewPassAge] = useState(24);
  const [newPassGender, setNewPassGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [newPassIdType, setNewPassIdType] = useState<any>('AADHAAR');
  const [newPassIdNum, setNewPassIdNum] = useState('');
  const [newPassPref, setNewPassPref] = useState('Lower Berth');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await authService.updateProfile({
        fullName,
        email,
        phone,
        preferences: {
          preferredClass,
          preferredBerth,
          foodChoice,
          smsAlerts,
          emailAlerts,
        },
      });
      onUpdateUser(updated);
      showToast('Profile and preferences updated successfully!');
    } catch (e) {
      showToast('Failed to save profile', { type: 'error' });
    }
  };

  const handleAddPassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassName.trim()) {
      showToast('Please enter passenger full name', { type: 'error' });
      return;
    }
    try {
      const added = await authService.addSavedPassenger({
        fullName: newPassName,
        age: newPassAge,
        gender: newPassGender,
        idType: newPassIdType,
        idNumber: newPassIdNum || '•••• •••• 9999',
        preference: newPassPref,
      });
      const updated = await authService.getCurrentUser();
      if (updated) onUpdateUser(updated);
      setIsAddPassengerOpen(false);
      setNewPassName('');
      showToast(`Added ${added.fullName} to saved passengers`);
    } catch (e) {
      showToast('Error adding passenger', { type: 'error' });
    }
  };

  const handleDeletePassenger = async (id: string) => {
    await authService.deleteSavedPassenger(id);
    const updated = await authService.getCurrentUser();
    if (updated) onUpdateUser(updated);
    showToast('Passenger removed from saved list');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-neutral-200">
        <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
          Account & Travel Settings
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Manage your personal identity, frequent co-passengers, and travel preferences.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 bg-white rounded-2xl border border-neutral-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border-2 border-neutral-900"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xl font-bold">
              {user.fullName.charAt(0)}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-neutral-900">{user.fullName}</h2>
            <p className="text-xs text-neutral-500 font-mono">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                KYC VERIFIED
              </span>
              <span className="text-xs text-neutral-400">·</span>
              <span className="text-xs text-neutral-500">{user.phone}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="p-3 bg-neutral-50 rounded-lg text-center">
            <span className="font-bold text-neutral-900 block text-sm">{user.savedPassengers.length}</span>
            <span className="text-neutral-500 text-[10px]">Saved Passengers</span>
          </div>
          <div className="p-3 bg-neutral-50 rounded-lg text-center">
            <span className="font-bold text-neutral-900 block text-sm">{user.metrics.totalJourneys}</span>
            <span className="text-neutral-500 text-[10px]">Total Trips</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-200">
        {[
          { id: 'profile', label: 'Personal Information', icon: User },
          { id: 'passengers', label: 'Saved Passengers', icon: Users },
          { id: 'preferences', label: 'Travel Preferences', icon: CheckCircle },
          { id: 'security', label: 'Security & Alerts', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-neutral-900 text-neutral-900 font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PERSONAL INFORMATION */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Primary Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input
              label="Registered Aadhaar / ID"
              value="•••• •••• 4912"
              disabled
              hint="Verified under Indian Railways KYC Guidelines"
            />
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-end">
            <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: SAVED PASSENGERS */}
      {activeTab === 'passengers' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Frequent Travelers Roster
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Saved passengers can be auto-filled in 1 click during train ticket reservations.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddPassengerOpen(true)}
            >
              Add Co-Passenger
            </Button>
          </div>

          <div className="divide-y divide-neutral-100">
            {user.savedPassengers.map((p) => (
              <div
                key={p.id}
                className="py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-neutral-50/50 p-2 rounded-lg"
              >
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">{p.fullName}</h4>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono mt-1">
                    <span>{p.age} years</span>
                    <span>·</span>
                    <span>{p.gender}</span>
                    <span>·</span>
                    <span>{p.idType}: {p.idNumber}</span>
                    <span>·</span>
                    <span className="text-neutral-700 font-sans font-semibold">{p.preference}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeletePassenger(p.id)}
                  className="text-neutral-400 hover:text-rose-600 p-1.5 transition-colors"
                  aria-label="Remove passenger"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TRAVEL PREFERENCES */}
      {activeTab === 'preferences' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Default Travel Choices</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              These preferences will automatically apply as defaults when searching and booking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Default Class"
              value={preferredClass}
              onChange={(e) => setPreferredClass(e.target.value as any)}
              options={[
                { value: '3A', label: 'AC 3 Tier (3A)' },
                { value: '2A', label: 'AC 2 Tier (2A)' },
                { value: '1A', label: 'AC First Class (1A)' },
                { value: 'CC', label: 'AC Chair Car (CC)' },
                { value: 'SL', label: 'Sleeper Class (SL)' },
              ]}
            />
            <Select
              label="Default Berth"
              value={preferredBerth}
              onChange={(e) => setPreferredBerth(e.target.value)}
              options={[
                { value: 'LOWER', label: 'Lower Berth' },
                { value: 'MIDDLE', label: 'Middle Berth' },
                { value: 'UPPER', label: 'Upper Berth' },
                { value: 'SIDE_LOWER', label: 'Side Lower' },
                { value: 'SIDE_UPPER', label: 'Side Upper' },
                { value: 'WINDOW', label: 'Window Seat' },
              ]}
            />
            <Select
              label="Meal Choice"
              value={foodChoice}
              onChange={(e) => setFoodChoice(e.target.value as any)}
              options={[
                { value: 'VEG', label: 'Vegetarian Catering' },
                { value: 'NON_VEG', label: 'Non-Vegetarian Catering' },
              ]}
            />
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-end">
            <Button type="submit" variant="primary" size="md">
              Update Preferences
            </Button>
          </div>
        </form>
      )}

      {/* TAB 4: SECURITY & ALERTS */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Notification & Security Controls</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Configure communication channels and authentication protocols.
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-neutral-900">SMS Booking & Platform Alerts</p>
                <p className="text-[11px] text-neutral-500">Receive live SMS alerts on chart preparation and train delays.</p>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-neutral-900">Email Invoices & Digital Passes</p>
                <p className="text-[11px] text-neutral-500">Auto-email PDF boarding passes upon reservation confirmation.</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900"
              />
            </label>
          </div>

          <div className="pt-4 border-t border-neutral-100">
            <Button variant="primary" size="md" onClick={handleSaveProfile}>
              Save Notification Preferences
            </Button>
          </div>
        </div>
      )}

      {/* Add Passenger Modal */}
      <Modal
        isOpen={isAddPassengerOpen}
        onClose={() => setIsAddPassengerOpen(false)}
        title="Add Frequent Co-Passenger"
        description="Saved passengers can be selected during booking without re-entering details."
        maxWidth="md"
      >
        <form onSubmit={handleAddPassenger} className="space-y-4">
          <Input
            label="Full Legal Name"
            placeholder="e.g. Suman Sen"
            value={newPassName}
            onChange={(e) => setNewPassName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Age"
              type="number"
              min="1"
              max="120"
              value={newPassAge}
              onChange={(e) => setNewPassAge(parseInt(e.target.value, 10))}
              required
            />
            <Select
              label="Gender"
              value={newPassGender}
              onChange={(e) => setNewPassGender(e.target.value as any)}
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="ID Document"
              value={newPassIdType}
              onChange={(e) => setNewPassIdType(e.target.value as any)}
              options={[
                { value: 'AADHAAR', label: 'Aadhaar' },
                { value: 'PAN', label: 'PAN Card' },
                { value: 'PASSPORT', label: 'Passport' },
                { value: 'VOTER_ID', label: 'Voter ID' },
              ]}
            />
            <Input
              label="ID Number"
              placeholder="e.g. 8491 0284 9182"
              value={newPassIdNum}
              onChange={(e) => setNewPassIdNum(e.target.value)}
            />
          </div>

          <Select
            label="Preferred Berth"
            value={newPassPref}
            onChange={(e) => setNewPassPref(e.target.value)}
            options={[
              { value: 'Lower Berth', label: 'Lower Berth' },
              { value: 'Middle Berth', label: 'Middle Berth' },
              { value: 'Upper Berth', label: 'Upper Berth' },
              { value: 'Side Lower', label: 'Side Lower' },
              { value: 'Window Seat', label: 'Window Seat' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsAddPassengerOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save Co-Passenger
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
