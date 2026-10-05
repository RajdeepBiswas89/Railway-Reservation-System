import React, { useState, useEffect } from 'react';
import {
  Booking,
  FareBreakdown,
  Passenger,
  PaymentDetails,
  SavedPassenger,
  Train,
  TrainClassCode,
  UserProfile,
} from '../types';
import { paymentService } from '../services/paymentService';
import { bookingService } from '../services/bookingService';
import { authService } from '../services/authService';
import { StepIndicator } from '../components/common/StepIndicator';
import { FareSummaryPanel } from '../components/booking/FareSummaryPanel';
import { SeatSelectionMap } from '../components/booking/SeatSelectionMap';
import { DigitalTicketCard } from '../components/ticket/DigitalTicketCard';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { useToast } from '../components/common/Toast';
import {
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  QrCode,
  Building,
  Wallet,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Clock,
  Train as TrainIcon,
} from 'lucide-react';

interface BookingFlowPageProps {
  train: Train;
  initialClassCode: TrainClassCode;
  journeyDate: string;
  currentUser: UserProfile | null;
  onBookingComplete: (booking: Booking) => void;
  onNavigateHome: () => void;
  onNavigateDashboard: () => void;
}

export const BookingFlowPage: React.FC<BookingFlowPageProps> = ({
  train,
  initialClassCode,
  journeyDate,
  currentUser,
  onBookingComplete,
  onNavigateHome,
  onNavigateDashboard,
}) => {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0); // 0: Journey, 1: Passenger, 2: Seat, 3: Review, 4: Payment, 5: Confirmed
  const [classCode, setClassCode] = useState<TrainClassCode>(initialClassCode);

  // Passengers state
  const [passengers, setPassengers] = useState<Passenger[]>([
    {
      id: 'p-1',
      fullName: currentUser?.fullName || '',
      age: 25,
      gender: 'MALE',
      nationality: 'Indian',
      idType: 'AADHAAR',
      idNumber: '',
      seatPreference: 'NO_PREF',
      mealPreference: 'NO_MEAL',
    },
  ]);

  // Saved passengers from profile
  const [savedPassengers, setSavedPassengers] = useState<SavedPassenger[]>([]);

  // Selected seats state: array of seat IDs e.g. ["B2-4"]
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>(['B2-4']);
  const [coachNumber, setCoachNumber] = useState('B2');

  // Terms agreement in Review step
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET'>('UPI');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState(currentUser?.fullName || '');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Confirmed booking state
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Calculate dynamic fare
  const currentClassInfo = train.classes.find((c) => c.code === classCode) || train.classes[0];
  const fareBreakdown: FareBreakdown = paymentService.calculateFares(
    currentClassInfo.baseFare,
    passengers.length,
    classCode
  );

  useEffect(() => {
    authService.getSavedPassengers().then(setSavedPassengers);
  }, []);

  // Passenger management
  const addPassenger = () => {
    if (passengers.length >= 6) {
      showToast('Maximum 6 passengers allowed per booking', { type: 'error' });
      return;
    }
    const newP: Passenger = {
      id: `p-${Date.now()}`,
      fullName: '',
      age: 25,
      gender: 'MALE',
      nationality: 'Indian',
      idType: 'AADHAAR',
      idNumber: '',
      seatPreference: 'NO_PREF',
    };
    setPassengers([...passengers, newP]);
    showToast('Passenger slot added');
  };

  const removePassenger = (index: number) => {
    if (passengers.length <= 1) {
      showToast('At least one passenger is required', { type: 'error' });
      return;
    }
    const updated = passengers.filter((_, idx) => idx !== index);
    setPassengers(updated);
    // Trim selected seats if more than passengers
    setSelectedSeatIds((prev) => prev.slice(0, updated.length));
  };

  const updatePassenger = (index: number, updates: Partial<Passenger>) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], ...updates };
    setPassengers(updated);
  };

  const autofillSavedPassenger = (saved: SavedPassenger, index: number) => {
    updatePassenger(index, {
      fullName: saved.fullName,
      age: saved.age,
      gender: saved.gender,
      idType: saved.idType,
      idNumber: saved.idNumber,
    });
    showToast(`Autofilled details for ${saved.fullName}`);
  };

  // Seat toggle handler
  const handleSeatToggle = (seatId: string, seatInfo: { number: number; coach: string; berth: any }) => {
    setCoachNumber(seatInfo.coach);
    if (selectedSeatIds.includes(seatId)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seatId));
      showToast(`Seat ${seatId} deselected`, { type: 'info' });
    } else {
      if (selectedSeatIds.length >= passengers.length) {
        // Replace oldest or last
        const newSelection = [...selectedSeatIds.slice(1), seatId];
        setSelectedSeatIds(newSelection);
        showToast(`Seat ${seatId} selected`);
      } else {
        setSelectedSeatIds([...selectedSeatIds, seatId]);
        showToast(`Seat ${seatId} selected`);
      }
    }
  };

  const handleAutoAssignSeats = () => {
    const autoSeats = passengers.map((_, idx) => `${coachNumber}-${idx + 4}`);
    setSelectedSeatIds(autoSeats);
    showToast('Seats automatically assigned');
  };

  // Validation before advancing to next step
  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate passengers
      for (let i = 0; i < passengers.length; i++) {
        const p = passengers[i];
        if (!p.fullName || p.fullName.trim().length < 2) {
          showToast(`Please enter a valid full name for Passenger ${i + 1}`, { type: 'error' });
          return;
        }
        if (p.age < 1 || p.age > 120) {
          showToast(`Age must be between 1 and 120 for Passenger ${i + 1}`, { type: 'error' });
          return;
        }
      }
    }

    if (currentStep === 2) {
      if (selectedSeatIds.length < passengers.length) {
        handleAutoAssignSeats();
      }
    }

    if (currentStep === 3) {
      if (!agreedToTerms) {
        showToast('Please agree to the booking terms and cancellation policy', { type: 'error' });
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Payment execution
  const handleProcessPayment = async () => {
    setIsProcessingPayment(true);
    try {
      const paymentDetails = await paymentService.processPayment({
        method: paymentMethod,
        amount: fareBreakdown.total,
        upiId: paymentMethod === 'UPI' ? upiId : undefined,
        cardNumber: paymentMethod === 'CARD' ? cardNumber : undefined,
      });

      // Allocate seats to passengers
      const allocatedPassengers = passengers.map((p, idx) => ({
        ...p,
        allocatedCoach: coachNumber,
        allocatedSeat: selectedSeatIds[idx] ? selectedSeatIds[idx].split('-')[1] : `B${idx + 4}`,
        allocatedBerth: p.seatPreference !== 'NO_PREF' ? p.seatPreference : 'LOWER',
      }));

      const newBooking = await bookingService.createBooking({
        userId: currentUser!.id,
        userName: currentUser!.fullName,
        userEmail: currentUser!.email,
        train,
        journeyDate,
        classCode,
        coachNumber,
        passengers: allocatedPassengers,
        fareBreakdown,
        payment: paymentDetails,
      });

      setConfirmedBooking(newBooking);
      onBookingComplete(newBooking);
      setCurrentStep(5); // Confirmed
      showToast('Booking successfully confirmed! PNR Generated: ' + newBooking.pnr, {
        type: 'success',
      });
    } catch (err: any) {
      showToast(err?.message || 'Unable to complete booking. Please try again.', { type: 'error' });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] pb-20">
      {/* Visual Step Indicator */}
      <StepIndicator currentStep={currentStep} onStepClick={(idx) => idx < currentStep && setCurrentStep(idx)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Step 6: Confirmation Screen is full-width presentation */}
        {currentStep === 5 && confirmedBooking ? (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Confirmation Banner */}
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                Your journey is confirmed.
              </h1>
              <p className="text-sm text-neutral-600">
                Your reservation has been successfully booked with the Indian Railways Central Reservation System.
              </p>
            </div>

            {/* Complete Digital Ticket */}
            <DigitalTicketCard booking={confirmedBooking} />

            {/* Quick Actions Footer */}
            <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-neutral-200">
              <Button variant="outline" size="md" onClick={onNavigateHome}>
                Return to Home
              </Button>
              <div className="flex gap-2">
                <Button variant="primary" size="md" onClick={onNavigateDashboard}>
                  Go to User Dashboard
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Steps 0 to 4: Dual-Column Layout with Persistent Fare Summary */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Interactive Form Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* STEP 0: JOURNEY REVIEW */}
              {currentStep === 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900">
                      Step 1: Verify Train & Class Details
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      Check your journey route, scheduled timings, and coach category.
                    </p>
                  </div>

                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="font-mono text-xs font-bold text-neutral-500 bg-neutral-200/80 px-2 py-0.5 rounded">
                        {train.number}
                      </span>
                      <h3 className="text-base font-bold text-neutral-900 mt-1">
                        {train.name}
                      </h3>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {train.type} · Pantry Available
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                        Date of Travel
                      </span>
                      <span className="text-sm font-bold font-mono text-neutral-900">
                        {journeyDate}
                      </span>
                    </div>
                  </div>

                  {/* Route Bar */}
                  <div className="grid grid-cols-3 gap-2 text-center p-4 bg-neutral-900 text-white rounded-xl">
                    <div className="text-left">
                      <div className="text-xl font-bold font-mono">{train.departureTime}</div>
                      <div className="text-xs font-semibold">{train.fromStation.code}</div>
                      <div className="text-[10px] text-neutral-400 truncate">{train.fromStation.city}</div>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[11px] font-mono text-neutral-400">{train.duration}</span>
                      <div className="w-16 h-0.5 bg-neutral-700 my-1" />
                      <span className="text-[10px] text-neutral-400">{train.distanceKm} km</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold font-mono">{train.arrivalTime}</div>
                      <div className="text-xs font-semibold">{train.toStation.code}</div>
                      <div className="text-[10px] text-neutral-400 truncate">{train.toStation.city}</div>
                    </div>
                  </div>

                  {/* Class Selection in Step 0 */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-2">
                      Choose Travel Class
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {train.classes.map((cls) => (
                        <div
                          key={cls.code}
                          onClick={() => setClassCode(cls.code)}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                            classCode === cls.code
                              ? 'border-[#121417] bg-neutral-50 ring-1 ring-[#121417]'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex justify-between font-mono font-bold text-xs">
                            <span>{cls.code}</span>
                            <span>₹{cls.baseFare}</span>
                          </div>
                          <p className="text-[11px] text-neutral-500 truncate mt-1">{cls.name}</p>
                          <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                            {cls.seatsAvailable} seats
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1: PASSENGER DETAILS */}
              {currentStep === 1 && (
                <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-6 space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900">
                        Step 2: Passenger Details
                      </h2>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Government-issued photo identification is required for each passenger.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Plus className="w-4 h-4" />}
                      onClick={addPassenger}
                    >
                      + Add Passenger
                    </Button>
                  </div>

                  {/* Saved Passengers Quick Picker */}
                  {savedPassengers.length > 0 && (
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
                      <span className="text-[11px] font-bold text-neutral-600 block mb-1.5">
                        Quick Auto-Fill From Saved Passengers:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {savedPassengers.map((sp) => (
                          <button
                            key={sp.id}
                            type="button"
                            onClick={() => autofillSavedPassenger(sp, 0)}
                            className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-md font-medium text-neutral-800 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>+ {sp.fullName}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">({sp.age}y)</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Passengers Cards */}
                  <div className="space-y-4">
                    {passengers.map((p, idx) => (
                      <div
                        key={p.id}
                        className="p-5 bg-neutral-50/60 rounded-xl border border-neutral-200 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                            Passenger {idx + 1}
                          </span>
                          {passengers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePassenger(idx)}
                              className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-6">
                            <Input
                              label="Full Name (as per ID)"
                              placeholder="e.g. Rajdeep Biswas"
                              value={p.fullName}
                              onChange={(e) => updatePassenger(idx, { fullName: e.target.value })}
                              required
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <Input
                              label="Age"
                              type="number"
                              min="1"
                              max="120"
                              value={p.age}
                              onChange={(e) => updatePassenger(idx, { age: parseInt(e.target.value, 10) || 0 })}
                              required
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <Select
                              label="Gender"
                              value={p.gender}
                              onChange={(e) => updatePassenger(idx, { gender: e.target.value as any })}
                              options={[
                                { value: 'MALE', label: 'Male' },
                                { value: 'FEMALE', label: 'Female' },
                                { value: 'OTHER', label: 'Other' },
                              ]}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-4">
                            <Select
                              label="ID Document Type"
                              value={p.idType}
                              onChange={(e) => updatePassenger(idx, { idType: e.target.value as any })}
                              options={[
                                { value: 'AADHAAR', label: 'Aadhaar Card' },
                                { value: 'PASSPORT', label: 'Passport' },
                                { value: 'PAN', label: 'PAN Card' },
                                { value: 'VOTER_ID', label: 'Voter ID' },
                                { value: 'DRIVING_LICENSE', label: 'Driving License' },
                              ]}
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <Input
                              label="ID Number"
                              placeholder="e.g. 7392 4810 4912"
                              value={p.idNumber}
                              onChange={(e) => updatePassenger(idx, { idNumber: e.target.value })}
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <Select
                              label="Berth Preference"
                              value={p.seatPreference}
                              onChange={(e) => updatePassenger(idx, { seatPreference: e.target.value as any })}
                              options={[
                                { value: 'NO_PREF', label: 'No Preference' },
                                { value: 'LOWER', label: 'Lower Berth' },
                                { value: 'MIDDLE', label: 'Middle Berth' },
                                { value: 'UPPER', label: 'Upper Berth' },
                                { value: 'SIDE_LOWER', label: 'Side Lower' },
                                { value: 'SIDE_UPPER', label: 'Side Upper' },
                                { value: 'WINDOW', label: 'Window Seat' },
                              ]}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: SEAT SELECTION */}
              {currentStep === 2 && (
                <SeatSelectionMap
                  classCode={classCode}
                  passengers={passengers}
                  selectedSeatIds={selectedSeatIds}
                  onSeatToggle={handleSeatToggle}
                  onAutoAssign={handleAutoAssignSeats}
                />
              )}

              {/* STEP 3: REVIEW BOOKING */}
              {currentStep === 3 && (
                <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900">
                      Step 4: Review Booking & Policies
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Verify your travel itinerary, passenger roster, and fare schedule prior to payment.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                      <div>
                        <span className="font-mono text-xs font-bold bg-neutral-200 px-2 py-0.5 rounded">
                          {train.number}
                        </span>
                        <span className="font-bold text-sm text-neutral-900 ml-2">{train.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-neutral-700">
                        Class {classCode} · Coach {coachNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-neutral-400 block uppercase">From</span>
                        <span className="font-bold text-neutral-900">{train.fromStation.name}</span>
                        <span className="text-neutral-500 block">Dep: {train.departureTime}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block uppercase">To</span>
                        <span className="font-bold text-neutral-900">{train.toStation.name}</span>
                        <span className="text-neutral-500 block">Arr: {train.arrivalTime}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block uppercase">Date</span>
                        <span className="font-bold text-neutral-900">{journeyDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block uppercase">Seats</span>
                        <span className="font-bold text-[#D92D20]">{selectedSeatIds.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Passenger Manifest */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                      Passenger Manifest ({passengers.length})
                    </h4>
                    <div className="border border-neutral-200 rounded-lg overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-neutral-100 text-neutral-600 font-semibold text-[10px] uppercase">
                          <tr>
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">Age/Sex</th>
                            <th className="p-2.5">ID Document</th>
                            <th className="p-2.5 text-right">Allocated Seat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-mono">
                          {passengers.map((p, idx) => (
                            <tr key={p.id}>
                              <td className="p-2.5 font-sans font-bold text-neutral-900">{p.fullName}</td>
                              <td className="p-2.5 text-neutral-600">
                                {p.age} / {p.gender.charAt(0)}
                              </td>
                              <td className="p-2.5 text-neutral-600">
                                {p.idType}: {p.idNumber || '---'}
                              </td>
                              <td className="p-2.5 text-right font-bold text-neutral-900">
                                {coachNumber} - {selectedSeatIds[idx] ? selectedSeatIds[idx].split('-')[1] : `B${idx + 4}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Cancellation Policy terms */}
                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 text-xs text-neutral-600">
                    <h5 className="font-bold text-neutral-900">Official Cancellation Policy:</h5>
                    <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                      <li>Up to 48 hours before scheduled departure: Flat clerkage deduction of ₹60 per passenger.</li>
                      <li>Between 48 hours and 12 hours: 25% cancellation surcharge applied.</li>
                      <li>Between 12 hours and 4 hours (chart preparation): 50% cancellation surcharge.</li>
                      <li>Refunds processed directly back to source payment account within 2-4 hours.</li>
                    </ul>
                  </div>

                  {/* Agreement Checkbox */}
                  <label className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                    />
                    <span className="text-xs text-neutral-700 leading-normal">
                      I have read and agree to the <strong>Railnex Booking Terms & Conditions</strong> and the Indian Railways Passenger Carriage Regulations.
                    </span>
                  </label>
                </div>
              )}

              {/* STEP 4: PAYMENT UI */}
              {currentStep === 4 && (
                <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900">
                      Step 5: Secure Payment Processing
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Select your preferred payment channel. Simulated sandbox transaction environment.
                    </p>
                  </div>

                  {/* Payment Method Switcher */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                      { id: 'CARD', label: 'Credit / Debit', icon: CreditCard },
                      { id: 'NET_BANKING', label: 'Net Banking', icon: Building },
                      { id: 'WALLET', label: 'Wallets', icon: Wallet },
                    ].map((m) => {
                      const Icon = m.icon;
                      const active = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                            active
                              ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                              : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-semibold">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Payment Details Container */}
                  <div className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
                    {paymentMethod === 'UPI' && (
                      <div className="space-y-3">
                        <Input
                          label="Enter Virtual Payment Address (UPI ID)"
                          placeholder="e.g. username@okhdfcbank"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          hint="You will receive a payment mandate request on your UPI app"
                        />
                        <div className="p-3 bg-white rounded-lg border border-neutral-200 flex items-center justify-between text-xs">
                          <span className="text-neutral-500">Supported apps:</span>
                          <span className="font-mono text-neutral-800 font-bold">
                            Google Pay · PhonePe · Paytm · BHIM
                          </span>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'CARD' && (
                      <div className="space-y-3">
                        <Input
                          label="Card Number"
                          placeholder="4532 •••• •••• 4190"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Expiry Date"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                          />
                          <Input
                            label="CVV"
                            placeholder="•••"
                            type="password"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                          />
                        </div>
                        <Input
                          label="Name on Card"
                          placeholder="e.g. Rajdeep Biswas"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                        />
                      </div>
                    )}

                    {paymentMethod === 'NET_BANKING' && (
                      <div className="space-y-3 text-xs">
                        <label className="font-bold text-neutral-700 uppercase tracking-wider text-[11px] block">
                          Popular Banking Gateways
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank'].map((b) => (
                            <button
                              key={b}
                              type="button"
                              className="p-2.5 rounded-lg border border-neutral-300 bg-white hover:border-neutral-900 font-medium text-neutral-800"
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'WALLET' && (
                      <div className="space-y-2 text-xs">
                        <label className="font-bold text-neutral-700 uppercase tracking-wider text-[11px] block">
                          Select Wallet
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Amazon Pay', 'Paytm Wallet', 'MobiKwik'].map((w) => (
                            <button
                              key={w}
                              type="button"
                              className="p-2.5 rounded-lg border border-neutral-300 bg-white hover:border-neutral-900 font-medium text-neutral-800"
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>256-Bit SSL Encrypted Mock Payment Gateway. No live funds are charged.</span>
                  </div>
                </div>
              )}

              {/* Navigation Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                {currentStep > 0 ? (
                  <Button
                    variant="outline"
                    size="md"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    onClick={handlePrevStep}
                    disabled={isProcessingPayment}
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <Button
                    variant="primary"
                    size="md"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    onClick={handleNextStep}
                  >
                    Continue to {currentStep === 0 ? 'Passenger Details' : currentStep === 1 ? 'Seat Selection' : currentStep === 2 ? 'Review Booking' : 'Payment'}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    isLoading={isProcessingPayment}
                    onClick={handleProcessPayment}
                    className="px-8 bg-emerald-700 hover:bg-emerald-800"
                  >
                    Pay ₹{fareBreakdown.total.toLocaleString('en-IN')} & Confirm Ticket
                  </Button>
                )}
              </div>
            </div>

            {/* Persistent Right Fare Summary Column (4 cols) */}
            <div className="lg:col-span-4">
              <FareSummaryPanel
                train={train}
                classCode={classCode}
                journeyDate={journeyDate}
                passengerCount={passengers.length}
                selectedSeats={selectedSeatIds}
                fareBreakdown={fareBreakdown}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
