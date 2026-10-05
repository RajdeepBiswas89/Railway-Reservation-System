import React, { useState } from 'react';
import { cateringService, CATERING_MEALS, MealItem } from '../services/cateringService';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import {
  Coffee,
  Check,
  Star,
  Plus,
  Minus,
  ShoppingBag,
  MapPin,
  Train,
  ShieldCheck,
} from 'lucide-react';

export const CateringPage: React.FC = () => {
  const { showToast } = useToast();
  const [selectedStation, setSelectedStation] = useState('HWH');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [pnr, setPnr] = useState('8A72K91');
  const [coachSeat, setCoachSeat] = useState('Coach B2, Seat 4');

  const meals = CATERING_MEALS.filter(
    (m) =>
      (selectedCategory === 'ALL' || m.category === selectedCategory) &&
      (m.availableStations.includes(selectedStation) || m.availableStations.length === 0)
  );

  const addToCart = (mealId: string) => {
    setCart((prev) => ({
      ...prev,
      [mealId]: (prev[mealId] || 0) + 1,
    }));
    showToast('Added meal to journey tray');
  };

  const removeFromCart = (mealId: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[mealId] > 1) updated[mealId] -= 1;
      else delete updated[mealId];
      return updated;
    });
  };

  const cartTotalCount = Object.values(cart).reduce((sum, count) => sum + count, 0);
  const cartTotalPrice = Object.entries(cart).reduce((sum, [id, count]) => {
    const meal = CATERING_MEALS.find((m) => m.id === id);
    return sum + (meal ? meal.price * count : 0);
  }, 0);

  const handleCompleteOrder = () => {
    showToast(`Catering order confirmed! Delivery scheduled at ${selectedStation} to ${coachSeat}.`, {
      type: 'success',
    });
    setCart({});
    setIsCheckoutOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
              Onboard E-Catering & Berth Delivery
            </h1>
            <Badge variant="accent" styleType="subtle" showDot>
              IRCTC APPROVED
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Pre-order hygienic hot restaurant meals delivered directly to your berth at major station halts.
          </p>
        </div>

        {cartTotalCount > 0 && (
          <Button
            variant="primary"
            size="md"
            leftIcon={<ShoppingBag className="w-4 h-4" />}
            onClick={() => setIsCheckoutOpen(true)}
          >
            Review Tray ({cartTotalCount} items · ₹{cartTotalPrice})
          </Button>
        )}
      </div>

      {/* Controls & Station Selector */}
      <div className="p-4 bg-white rounded-2xl border border-neutral-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-neutral-700">Delivery Stoppage:</span>
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 font-bold text-neutral-900 outline-none"
          >
            <option value="HWH">Howrah Junction (HWH)</option>
            <option value="KGP">Kharagpur Junction (KGP)</option>
            <option value="BBS">Bhubaneswar (BBS)</option>
            <option value="VSKP">Visakhapatnam (VSKP)</option>
            <option value="BZA">Vijayawada (BZA)</option>
            <option value="SBC">KSR Bengaluru (SBC)</option>
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5">
          {['ALL', 'VEG', 'NON_VEG', 'JAIN', 'BREAKFAST'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-neutral-900 text-white font-bold'
                  : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Meal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meals.map((meal) => {
          const qty = cart[meal.id] || 0;
          return (
            <div
              key={meal.id}
              className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-neutral-400 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-500 font-mono">
                    {meal.partnerBrand}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-neutral-800 font-bold">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{meal.rating}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-neutral-900">{meal.name}</h3>
                <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">
                  {meal.description}
                </p>

                <div className="flex items-center gap-3 text-xs font-mono text-neutral-400 pt-1">
                  <span>{meal.calories}</span>
                  <span>·</span>
                  <span className="text-emerald-700 font-bold font-sans">
                    {meal.category}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-lg font-black font-mono text-neutral-900">
                  ₹{meal.price}
                </span>

                {qty > 0 ? (
                  <div className="flex items-center gap-2 bg-neutral-100 px-2 py-1 rounded-lg">
                    <button
                      onClick={() => removeFromCart(meal.id)}
                      className="p-1 text-neutral-700 hover:text-neutral-950"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold font-mono px-1">{qty}</span>
                    <button
                      onClick={() => addToCart(meal.id)}
                      className="p-1 text-neutral-700 hover:text-neutral-950"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addToCart(meal.id)}
                  >
                    Add to Tray
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCheckoutOpen(false)}
          title="Confirm Berth Meal Delivery"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
              <span className="font-bold text-neutral-900 text-sm">Delivery Destination:</span>
              <p className="text-neutral-600 font-mono">
                Stoppage: {selectedStation} · Coach {coachSeat}
              </p>
              <p className="text-neutral-500 font-mono">Linked PNR: {pnr}</p>
            </div>

            <div className="border border-neutral-200 rounded-lg p-3 space-y-2 font-mono">
              {Object.entries(cart).map(([id, qty]) => {
                const meal = CATERING_MEALS.find((m) => m.id === id);
                if (!meal) return null;
                return (
                  <div key={id} className="flex justify-between items-center text-xs">
                    <span className="font-sans font-medium text-neutral-800">
                      {meal.name} x {qty}
                    </span>
                    <span className="font-bold text-neutral-900">
                      ₹{meal.price * qty}
                    </span>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-neutral-200 flex justify-between font-bold text-sm text-neutral-900">
                <span>Total Amount:</span>
                <span>₹{cartTotalPrice}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sanitized tamper-proof delivery direct to your seat during scheduled stoppage.</span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsCheckoutOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleCompleteOrder}
              >
                Confirm & Schedule Delivery
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
