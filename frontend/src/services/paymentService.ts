import { FareBreakdown, PaymentDetails, TrainClassCode } from '../types';

export const paymentService = {
  calculateFares(basePrice: number, passengerCount: number, classCode: TrainClassCode): FareBreakdown {
    const baseFareTotal = basePrice * passengerCount;
    const reservationFee = 40 * passengerCount;
    const superfastCharge = classCode === '1A' || classCode === '2A' ? 45 * passengerCount : 30 * passengerCount;
    const cateringCharge = classCode === '1A' ? 140 * passengerCount : classCode === '3A' || classCode === '2A' ? 95 * passengerCount : 0;
    const subtotal = baseFareTotal + reservationFee + superfastCharge + cateringCharge;
    const gst = Math.round(subtotal * 0.05); // 5% GST for AC rail classes
    const total = subtotal + gst;

    return {
      baseFare: baseFareTotal,
      reservationFee,
      superfastCharge,
      cateringCharge,
      gst,
      total,
    };
  },

  async processPayment(params: {
    method: 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET';
    amount: number;
    upiId?: string;
    cardNumber?: string;
  }): Promise<PaymentDetails> {
    // Simulate payment gateway delay (800ms)
    await new Promise((resolve) => setTimeout(resolve, 800));

    const txnId = `TXN${Math.floor(10000000000 + Math.random() * 90000000000)}`;
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    return {
      method: params.method,
      transactionId: txnId,
      timestamp,
      status: 'SUCCESS',
      upiId: params.upiId,
      cardLast4: params.cardNumber ? params.cardNumber.slice(-4) : undefined,
    };
  },
};
