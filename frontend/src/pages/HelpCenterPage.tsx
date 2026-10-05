import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { HelpCircle, Shield, FileText, Phone, ChevronDown, ChevronUp } from 'lucide-react';

export const HelpCenterPage: React.FC<{ onNavigateHome: () => void }> = ({ onNavigateHome }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does digital seat selection work on Railnex?',
      a: 'Railnex interfaces directly with the national train inventory. During step 3 of the booking flow, you can view the exact coach bay layout (Lower, Middle, Upper, and Side Berths) and handpick your preferred seat, or opt for instant auto-assignment.',
    },
    {
      q: 'What is the ticket cancellation and refund policy?',
      a: 'Confirmed tickets can be cancelled directly through the "My Bookings" tab up to 48 hours prior to train departure for a flat clerkage deduction of ₹60. Refunds are initiated instantly back to the original UPI, Card, or Net Banking source.',
    },
    {
      q: 'Is the Railnex Digital Ticket valid for train travel without printing?',
      a: 'Yes. The digital ticket containing your confirmed PNR and secure QR code is an officially recognized Electronic Reservation Slip (ERS). Presenting it on your phone alongside a valid Government Photo ID (Aadhaar, Voter ID, Passport, PAN) is fully acceptable for travel.',
    },
    {
      q: 'How is this project architected for future backend integration?',
      a: 'Railnex is structured with clean asynchronous service abstractions (`authService`, `trainService`, `bookingService`, `stationService`, `adminService`). The UI components consume normalized typed Promise APIs designed to map 1:1 with Python FastAPI endpoints and PostgreSQL schemas.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
          Help & Information Center
        </h1>
        <p className="text-sm text-neutral-500 max-w-xl mx-auto">
          Learn about ticketing protocols, refund guidelines, berth quotas, and platform features.
        </p>
      </div>

      {/* Emergency & Support Contacts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-xl border border-neutral-200 text-center space-y-1">
          <Phone className="w-5 h-5 text-neutral-700 mx-auto" />
          <h4 className="font-bold text-xs text-neutral-900">24/7 Rail Care Helpline</h4>
          <p className="text-base font-bold font-mono text-[#D92D20]">Dial 139</p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-neutral-200 text-center space-y-1">
          <Shield className="w-5 h-5 text-neutral-700 mx-auto" />
          <h4 className="font-bold text-xs text-neutral-900">Security & Medical</h4>
          <p className="text-base font-bold font-mono text-neutral-900">182 / 112</p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-neutral-200 text-center space-y-1">
          <FileText className="w-5 h-5 text-neutral-700 mx-auto" />
          <h4 className="font-bold text-xs text-neutral-900">Email Inquiries</h4>
          <p className="text-xs font-mono text-neutral-700">support@railnex.in</p>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-neutral-900">Frequently Asked Questions</h2>
        <div className="divide-y divide-neutral-100">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={faq.q} className="py-4">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-sm font-bold text-neutral-800 hover:text-neutral-950"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                </button>
                {isOpen && (
                  <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center pt-4">
        <Button variant="primary" size="md" onClick={onNavigateHome}>
          Return to Booking Portal
        </Button>
      </div>
    </div>
  );
};
