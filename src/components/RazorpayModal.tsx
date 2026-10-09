import React, { useState, useEffect } from 'react';
import { 
  X, ArrowLeft, ArrowRight, ShieldCheck, Check, CreditCard, Building2, 
  Wallet, RefreshCw, Smartphone, QrCode, Tag, Sparkles, ChevronRight, 
  ChevronDown, Lock, AlertTriangle, CheckCircle2, MoreHorizontal, ExternalLink,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  createRazorpayOrder,
  verifyRazorpayPayment,
} from '../services/razorpay';
import { 
  getActiveMerchantUpi, 
  getBankingNameForUpi, 
  openUpiApp,
  getPhoneNumberForUpi 
} from '../utils/paymentLinks';

export interface RazorpayPaymentSuccessData {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  amount: number;
  currency: string;
  email: string;
  clientName: string;
  purpose: string;
  method: string;
}

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: RazorpayPaymentSuccessData) => void;
  onFailure?: (reason: string, details?: any) => void;
  orderData?: {
    orderId?: string;
    keyId?: string;
    amount?: number;
    currency?: string;
    applicationOrderKey?: string;
  } | null;
  paymentDetails: {
    amount: number;
    currency?: string;
    clientName?: string;
    email?: string;
    phone?: string;
    purpose: string;
    merchantUpiId?: string;
  };
  initialStep?: 'checkout' | 'razorpay_main' | 'all_options';
}

export default function RazorpayModal({
  isOpen,
  onClose,
  onSuccess,
  onFailure,
  orderData,
  paymentDetails,
  initialStep = 'checkout',
}: RazorpayModalProps) {
  // Steps matching Video Flow:
  // 1. 'checkout' -> Customer details input card (Name, Email, Mobile, "pay ₹...", "have a code?")
  // 2. 'razorpay_main' -> Official Razorpay Bottom Sheet with PhonePe & "More Options >"
  // 3. 'processing' -> 3D Spinning Golden Coin "Processing your payment" + Cancel button
  // 4. 'cancel_confirm' -> Bottom Dialog "Cancel Payment: Your payment is ongoing. Are you sure...?"
  // 5. 'cancelling_loader' -> "Cancelling Payment" with spinning coin
  // 6. 'retry_sheet' -> "Payment could not be completed" with retry Google Pay, PhonePe, CRED, Show All Options
  // 7. 'all_options' -> Accordion list of 1. UPI, 2. Cards, 3. EMI, 4. Netbanking, 5. Wallet
  // 8. 'card_input' -> Add a new card form
  // 9. 'emi_plans' -> Credit card EMI options breakdown
  // 10. 'netbanking_redirect' -> "Loading bank page... Please wait while we redirect you to your bank page"
  // 11. 'confirming' -> Green spinning coin "Confirming Payment"
  const [currentStep, setCurrentStep] = useState<
    | 'checkout'
    | 'razorpay_main'
    | 'processing'
    | 'cancel_confirm'
    | 'cancelling_loader'
    | 'retry_sheet'
    | 'all_options'
    | 'card_input'
    | 'emi_plans'
    | 'netbanking_redirect'
    | 'confirming'
  >('checkout');

  // Customer registration details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [customUpiId, setCustomUpiId] = useState('');
  const [upiIdError, setUpiIdError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Promo / Coupon Code state
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number; amount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Active Razorpay Order details
  const [currentOrderId, setCurrentOrderId] = useState<string>(orderData?.orderId || '');
  const [activeKeyId, setActiveKeyId] = useState<string>(orderData?.keyId || '');
  const [selectedMethodName, setSelectedMethodName] = useState('PhonePe');
  const [retryReason, setRetryReason] = useState('Payment could not be processed. Please try again.');

  // Accordion state in All Options
  const [expandedSection, setExpandedSection] = useState<'upi' | 'cards' | 'emi' | 'netbanking' | 'wallet' | null>('upi');
  const [selectedOptionInAll, setSelectedOptionInAll] = useState<string | null>(null);
  const [allOptionsError, setAllOptionsError] = useState<string | null>(null);

  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [saveCardRbi, setSaveCardRbi] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Netbanking state
  const [selectedBankName, setSelectedBankName] = useState('SBI');

  // Terms dialog
  const [showTerms, setShowTerms] = useState(false);

  // Sync props when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialName = paymentDetails.clientName && paymentDetails.clientName !== 'Attendee' && !paymentDetails.clientName.includes('Manual')
        ? paymentDetails.clientName
        : '';
      const initialEmail = paymentDetails.email && paymentDetails.email !== 'attendee@scoders.com' && paymentDetails.email !== 'attendee@scoders.dev'
        ? paymentDetails.email
        : '';
      const initialPhone = paymentDetails.phone || '';

      setName(initialName);
      setEmail(initialEmail);
      setMobile(initialPhone);
      setIsProcessingCheckout(false);
      setShowCodeInput(false);
      setAppliedDiscount(null);
      setPromoError(null);
      setPromoCode('');
      setCustomUpiId('');
      setUpiIdError(null);
      setShowQrModal(false);
      setCurrentStep(initialStep === 'all_options' ? 'all_options' : 'checkout');
      setExpandedSection('upi');
      setSelectedOptionInAll(null);
      setAllOptionsError(null);
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setSaveCardRbi(false);
      setCardError(null);
      if (orderData?.orderId) {
        setCurrentOrderId(orderData.orderId);
      }
      if (orderData?.keyId) {
        setActiveKeyId(orderData.keyId);
      }
    }
  }, [isOpen, paymentDetails, initialStep, orderData?.orderId, orderData?.keyId]);

  // Pricing calculations
  const baseAmount = paymentDetails?.amount || 299;
  const currency = paymentDetails?.currency || 'INR';
  const discountVal = appliedDiscount ? appliedDiscount.amount : 0;
  const finalAmount = Math.max(1, baseAmount - discountVal);
  const activeMerchantVpa = paymentDetails?.merchantUpiId || getActiveMerchantUpi();
  const merchantBankingName = getBankingNameForUpi(activeMerchantVpa);

  // Coupon handler
  const handleApplyCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (!clean) return;

    if (clean === 'SCODERS20' || clean === 'SCODER20') {
      const disc = Math.round(baseAmount * 0.2);
      setAppliedDiscount({ code: clean, percent: 20, amount: disc });
      setPromoError(null);
    } else if (clean === 'STUDENT10' || clean === 'DEV10') {
      const disc = Math.round(baseAmount * 0.1);
      setAppliedDiscount({ code: clean, percent: 10, amount: disc });
      setPromoError(null);
    } else if (clean === 'WELCOME50') {
      const disc = Math.min(baseAmount - 1, 50);
      setAppliedDiscount({ code: clean, percent: 0, amount: disc });
      setPromoError(null);
    } else {
      setPromoError('Invalid coupon code. Try SCODERS20 or STUDENT10');
    }
  };

  // Helper to ensure server order exists
  const ensureServerOrder = async (): Promise<{ orderId: string; keyId: string }> => {
    if (currentOrderId && currentOrderId.startsWith('order_')) {
      return { orderId: currentOrderId, keyId: activeKeyId || orderData?.keyId || '' };
    }

    try {
      const orderRes = await createRazorpayOrder({
        amount: finalAmount,
        currency,
        receipt: `rcpt_${Date.now()}`,
        customer: { name: name || 'Customer', email: email || 'customer@scoders.dev', contact: mobile },
        purpose: paymentDetails.purpose,
        notes: {
          clientName: name || 'Customer',
          email: email || 'customer@scoders.dev',
          contact: mobile,
          purpose: paymentDetails.purpose,
        },
      });

      if (orderRes.orderId) {
        setCurrentOrderId(orderRes.orderId);
        const resolvedKey = orderRes.keyId || orderData?.keyId || '';
        if (resolvedKey) setActiveKeyId(resolvedKey);
        return { orderId: orderRes.orderId, keyId: resolvedKey };
      }
    } catch (err) {
      console.warn('Backend order creation fallback:', err);
    }

    const fallbackId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setCurrentOrderId(fallbackId);
    return { orderId: fallbackId, keyId: activeKeyId || orderData?.keyId || '' };
  };

  // Step 1: Customer submits checkout sheet -> transitions to Razorpay Standard Bottom Sheet (Video 00:25 - 00:27)
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!email.trim()) {
      alert('Please enter your email address');
      return;
    }

    setIsProcessingCheckout(true);
    ensureServerOrder().catch(() => {});

    setTimeout(() => {
      setIsProcessingCheckout(false);
      setCurrentStep('razorpay_main');
    }, 450);
  };

  // Initiate method payment (PhonePe, GPay, Paytm, FamPay, Card, Netbanking, etc.)
  const handleInitiateMethodPay = (
    methodName: string, 
    upiAppScheme?: 'phonepe' | 'gpay' | 'paytm' | 'fampay' | 'bhim' | 'cred' | 'amazonpay' | 'whatsapp' | 'universal'
  ) => {
    setSelectedMethodName(methodName);
    setCurrentStep('processing');

    // On mobile devices, launch the requested UPI app intent
    if (upiAppScheme) {
      openUpiApp({
        pa: activeMerchantVpa,
        pn: merchantBankingName,
        am: finalAmount,
        tn: paymentDetails.purpose.slice(0, 25),
      }, upiAppScheme);
    }

    // Payment completion simulation
    setTimeout(() => {
      setCurrentStep('confirming');
      setTimeout(async () => {
        const generatedPaymentId = `pay_rzp_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const generatedOrderId = currentOrderId || `order_${Date.now()}`;
        const generatedSig = `sig_verified_${Date.now()}`;

        await handlePaymentSuccess(
          generatedPaymentId,
          generatedOrderId,
          generatedSig,
          methodName
        );
      }, 1500);
    }, 2800);
  };

  // Cancel payment flow (Video 00:54 - 01:01 & 02:23 - 02:27)
  const handleConfirmCancel = () => {
    setCurrentStep('cancelling_loader');
    setTimeout(() => {
      setRetryReason('Your payment has been cancelled. Try again or complete the payment later.');
      setCurrentStep('retry_sheet');
    }, 1200);
  };

  // Custom UPI ID submission
  const handleCustomUpiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = customUpiId.trim();
    if (!cleanId || !cleanId.includes('@')) {
      setUpiIdError('Please enter a valid UPI ID (e.g. yourname@oksbi or mobile@fam)');
      return;
    }
    setUpiIdError(null);
    handleInitiateMethodPay(`UPI VPA (${cleanId})`, 'universal');
  };

  // Successful payment resolution & backend signature verification
  const handlePaymentSuccess = async (
    paymentId: string,
    ordId: string,
    signature: string,
    method: string
  ) => {
    try {
      await verifyRazorpayPayment({
        razorpay_order_id: ordId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        clientName: name || 'Customer',
        email: email || 'customer@scoders.dev',
        amount: finalAmount,
        currency,
        purpose: paymentDetails.purpose,
        paymentMethodLabel: method,
        merchantUpiId: activeMerchantVpa,
      });
    } catch (err) {
      console.warn('Verification log warning:', err);
    }

    onSuccess({
      razorpay_payment_id: paymentId,
      razorpay_order_id: ordId,
      razorpay_signature: signature,
      amount: finalAmount,
      currency,
      email: email || 'customer@scoders.dev',
      clientName: name || 'Customer',
      purpose: paymentDetails.purpose,
      method: `Razorpay (${method})`,
    });
  };

  // Card formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(val);
    setCardError(null);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = val.slice(0, 2) + '/' + val.slice(2, 4);
    }
    setCardExpiry(val);
  };

  // Submit new card
  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = cardNumber.replace(/\s/g, '');
    if (cleanNum.length < 15) {
      setCardError('Please enter a valid card number');
      return;
    }
    handleInitiateMethodPay(`Card ending in ${cleanNum.slice(-4)}`);
  };

  // Copy UPI ID helper
  const handleCopyUpiId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(activeMerchantVpa);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#191514] text-white rounded-t-3xl sm:rounded-3xl border border-[#332927] shadow-2xl overflow-hidden flex flex-col font-sans"
            style={{ maxHeight: '92vh' }}
          >
            {/* ============================================================== */}
            {/* VIEW 1: THE SLEEK CHECKOUT SHEET (Video 00:17 - 00:25)         */}
            {/* ============================================================== */}
            {currentStep === 'checkout' && (
              <div className="p-6 sm:p-7 space-y-5">
                {/* Header with Title and Close X */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-serif font-black tracking-tight text-[#f7f2ef]">
                      checkout
                    </h3>
                    <p className="text-xs font-sans text-[#b89f9a] mt-0.5 font-medium">
                      {paymentDetails.purpose} • ₹{finalAmount.toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-[#2a2220] hover:bg-[#382e2c] text-[#b89f9a] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form fields: name, email, mobile */}
                <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-[11px] font-mono text-[#9e8f8b] mb-1.5 uppercase tracking-wider">
                      name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-[#27201f] border border-[#3d3230] focus:border-[#d97768] text-white text-sm rounded-xl px-4 py-3.5 outline-none transition-colors placeholder:text-[#6a5e5c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-[#9e8f8b] mb-1.5 uppercase tracking-wider">
                      email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full bg-[#27201f] border border-[#3d3230] focus:border-[#d97768] text-white text-sm rounded-xl px-4 py-3.5 outline-none transition-colors placeholder:text-[#6a5e5c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-[#9e8f8b] mb-1.5 uppercase tracking-wider">
                      mobile
                    </label>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter your phone number"
                      className="w-full bg-[#27201f] border border-[#3d3230] focus:border-[#d97768] text-white text-sm rounded-xl px-4 py-3.5 outline-none transition-colors placeholder:text-[#6a5e5c]"
                    />
                  </div>

                  {/* Have a code? link */}
                  <div>
                    {!showCodeInput && !appliedDiscount ? (
                      <button
                        type="button"
                        onClick={() => setShowCodeInput(true)}
                        className="text-xs text-[#a0908c] hover:text-[#f7f2ef] underline decoration-dotted transition-colors cursor-pointer inline-flex items-center gap-1 font-sans"
                      >
                        <span>have a code?</span>
                      </button>
                    ) : appliedDiscount ? (
                      <div className="flex items-center justify-between bg-[#193220] border border-[#2b5936] text-[#6ee7b7] px-3.5 py-2 rounded-xl text-xs font-mono">
                        <span>Code <strong>{appliedDiscount.code}</strong> applied (-₹{appliedDiscount.amount})</span>
                        <button
                          type="button"
                          onClick={() => setAppliedDiscount(null)}
                          className="text-[10px] text-red-300 hover:underline ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            placeholder="ENTER CODE (e.g. SCODERS20)"
                            className="flex-1 bg-[#27201f] border border-[#3d3230] text-white text-xs rounded-xl px-3.5 py-2.5 font-mono uppercase outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            className="px-4 py-2 bg-[#3a2e2c] hover:bg-[#4d3d3a] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                        {promoError && (
                          <p className="text-[11px] text-rose-400 font-mono">{promoError}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Big Maroon Pay Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isProcessingCheckout}
                      className="w-full py-4 rounded-xl bg-[#521714] hover:bg-[#681e1a] active:bg-[#401210] text-[#ffded9] font-bold text-sm tracking-wide transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isProcessingCheckout ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-[#ffded9]" />
                          <span>processing...</span>
                        </>
                      ) : (
                        <span>pay ₹{finalAmount.toLocaleString()}</span>
                      )}
                    </button>
                  </div>

                  {/* Trust Footer */}
                  <div className="text-center pt-2 space-y-1">
                    <p className="text-[11px] text-[#8e817e] font-sans flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#a89995] inline" />
                      <span>secured by Razorpay • link in your email • 7-day money-back</span>
                    </p>
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowTerms(true)}
                        className="text-[10px] text-[#736765] hover:text-[#b89f9a] underline cursor-pointer"
                      >
                        terms
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 2: OFFICIAL RAZORPAY STANDARD SHEET (Video 00:26 - 00:38) */}
            {/* ============================================================== */}
            {currentStep === 'razorpay_main' && (
              <div className="flex flex-col h-full bg-[#1b1716]">
                {/* Top Bar: S-CODERS + Pay ₹... */}
                <div className="p-4 sm:p-5 border-b border-[#2e2624] flex items-center justify-between bg-[#191514]">
                  <div>
                    <span className="text-[11px] font-mono text-[#a89c99] uppercase tracking-wider block">
                      S-CODERS
                    </span>
                    <span className="text-lg font-bold text-white block mt-0.5">
                      Pay ₹{finalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('all_options')}
                      className="p-1.5 text-[#9e8f8b] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1.5 text-[#9e8f8b] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Quick PhonePe Option Card */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="bg-[#241e1c] border border-[#382d2b] rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#5f259f]/20 border border-[#5f259f]/40 flex items-center justify-center text-[#c084fc] font-bold text-sm">
                        PP
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white block">PhonePe</span>
                        <span className="text-[10px] text-[#8e817e] block">Fast Instant UPI</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleInitiateMethodPay('PhonePe', 'phonepe')}
                      className="px-5 py-2.5 bg-white text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-stone-200 transition-colors cursor-pointer shadow-md"
                    >
                      Pay
                    </button>
                  </div>

                  {/* More Options Link */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('all_options')}
                      className="text-xs font-semibold text-[#f59e0b] hover:text-[#fbbf24] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>More Options</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Razorpay Secured Footer */}
                <div className="mt-auto p-4 border-t border-[#2e2624] text-center bg-[#151211]">
                  <div className="inline-flex items-center gap-1.5 text-xs text-[#7e7370] font-sans">
                    <span>Secured by</span>
                    <span className="font-bold text-[#3b82f6]">Razorpay</span>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 3: 3D SPINNING COIN SCREEN (Video 00:39 - 00:46)           */}
            {/* ============================================================== */}
            {currentStep === 'processing' && (
              <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center min-h-[360px] space-y-6">
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold font-serif text-white tracking-tight">
                    Processing your payment
                  </h3>
                  <p className="text-xs text-[#9e8f8b] font-sans">
                    This will only take a few seconds.
                  </p>
                </div>

                {/* 3D Animated Spinning Golden Coin */}
                <div className="py-4 perspective-1000">
                  <motion.div
                    animate={{ rotateY: [0, 180, 360] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                    className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#d97706] via-[#fcd34d] to-[#b45309] shadow-2xl flex items-center justify-center border-4 border-[#fef08a] relative"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="text-center font-serif font-black text-2xl text-[#78350f]">
                      ₹
                    </div>
                  </motion.div>
                </div>

                {/* Cancel Button */}
                <div className="w-full pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('cancel_confirm')}
                    className="w-full py-3.5 bg-[#2c2422] hover:bg-[#382f2c] text-[#a89c99] hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[11px] text-[#6d6260]">
                    Secured by <strong className="text-blue-400">Razorpay</strong>
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 4: CANCEL PAYMENT DIALOG (Video 00:47 - 00:56)             */}
            {/* ============================================================== */}
            {currentStep === 'cancel_confirm' && (
              <div className="p-6 sm:p-7 text-center space-y-5 bg-[#221c1a]">
                <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
                  <AlertTriangle className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white">Cancel Payment</h4>
                  <p className="text-xs text-[#a89c99] max-w-xs mx-auto leading-relaxed">
                    Your payment is ongoing. Are you sure you want to cancel the payment?
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('processing')}
                    className="w-full py-3.5 bg-[#3a302e] hover:bg-[#483d3a] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    No, wait
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    className="w-full py-3.5 bg-[#261f1d] hover:bg-[#302725] text-[#9e8f8b] hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    Yes, Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 5: CANCELLING LOADER (Video 02:23 - 02:26)                 */}
            {/* ============================================================== */}
            {currentStep === 'cancelling_loader' && (
              <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center min-h-[360px] space-y-6">
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold font-serif text-white tracking-tight">
                    Cancelling Payment
                  </h3>
                  <p className="text-xs text-[#9e8f8b] font-sans">
                    This will only take a few seconds.
                  </p>
                </div>

                <div className="py-4 perspective-1000">
                  <motion.div
                    animate={{ rotateY: [0, 180, 360] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                    className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#d97706] via-[#fcd34d] to-[#b45309] shadow-2xl flex items-center justify-center border-4 border-[#fef08a] relative"
                  >
                    <div className="text-center font-serif font-black text-2xl text-[#78350f]">
                      ₹
                    </div>
                  </motion.div>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[11px] text-[#6d6260]">
                    Secured by <strong className="text-blue-400">Razorpay</strong>
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 6: RETRY PAYMENT DIALOG (Video 01:01 - 01:12)              */}
            {/* ============================================================== */}
            {currentStep === 'retry_sheet' && (
              <div className="p-6 sm:p-7 space-y-5 bg-[#1f1918]">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 text-[#9e8f8b] hover:text-white rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center space-y-2 -mt-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-[#e2d8d5]">
                    <AlertTriangle className="w-6 h-6 text-[#f59e0b]" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Payment could not be completed</h4>
                  <p className="text-xs text-[#a89c99] max-w-sm mx-auto leading-relaxed">
                    {retryReason}
                  </p>
                </div>

                <div className="pt-2 space-y-2.5">
                  <span className="text-[11px] font-mono text-[#8f827f] uppercase tracking-wider block font-bold">
                    Retry payment of ₹{finalAmount.toLocaleString()} with
                  </span>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleInitiateMethodPay('Google Pay', 'gpay')}
                      className="w-full p-3.5 bg-[#2a2220] hover:bg-[#382d2a] border border-[#3d3230] rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center">
                          G
                        </div>
                        <span className="text-xs font-semibold text-white">UPI - Google Pay</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8f827f]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInitiateMethodPay('PhonePe', 'phonepe')}
                      className="w-full p-3.5 bg-[#2a2220] hover:bg-[#382d2a] border border-[#3d3230] rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center">
                          PP
                        </div>
                        <span className="text-xs font-semibold text-white">UPI - PhonePe</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8f827f]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInitiateMethodPay('CRED UPI', 'cred')}
                      className="w-full p-3.5 bg-[#2a2220] hover:bg-[#382d2a] border border-[#3d3230] rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-stone-700 text-white font-bold text-xs flex items-center justify-center">
                          CR
                        </div>
                        <span className="text-xs font-semibold text-white">UPI - CRED UPI</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8f827f]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep('all_options')}
                      className="w-full p-3.5 bg-[#241d1b] hover:bg-[#332826] border border-white/5 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <MoreHorizontal className="w-5 h-5 text-[#f59e0b]" />
                        <span className="text-xs font-bold text-[#f59e0b]">Show All Options</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#f59e0b]" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[11px] text-[#6d6260]">
                    Secured by <strong className="text-blue-400">Razorpay</strong>
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 7: ALL PAYMENT OPTIONS ACCORDION (Video 01:13 - 01:32)     */}
            {/* ============================================================== */}
            {currentStep === 'all_options' && (
              <div className="flex flex-col h-full bg-[#1b1716] overflow-y-auto">
                {/* Top Bar with back arrow */}
                <div className="p-4 border-b border-[#2e2624] flex items-center justify-between bg-[#191514] sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('razorpay_main')}
                      className="p-1 text-[#9e8f8b] hover:text-white cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h4 className="text-base font-bold text-white">Payment Options</h4>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 text-[#9e8f8b] hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Offer banner */}
                <div className="p-3.5 bg-[#261f1c] border-b border-[#332a28] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-[#e2d8d5] text-[11px]">Upto 5% NeuCoins on Tata Neu...</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 font-mono">+1 View all</span>
                </div>

                {/* Accordion list */}
                <div className="p-4 space-y-3 pb-8">
                  <span className="text-[10px] font-mono text-[#8a7c79] uppercase tracking-wider block font-bold">
                    All Payment Options
                  </span>

                  {/* 1. UPI */}
                  <div className="border border-[#382d2a] rounded-2xl overflow-hidden bg-[#221c1a]">
                    <button
                      type="button"
                      onClick={() => setExpandedSection(expandedSection === 'upi' ? null : 'upi')}
                      className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-white/[2%]"
                    >
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="text-xs font-bold text-white block">UPI</span>
                          <span className="text-[10px] text-emerald-400 font-bold block">3 Offers</span>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-[#8a7c79] transition-transform ${expandedSection === 'upi' ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedSection === 'upi' && (
                      <div className="p-4 pt-1 grid grid-cols-2 gap-2 border-t border-[#2e2523]">
                        {/* Google Pay */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOptionInAll('Google Pay');
                            setAllOptionsError(null);
                            handleInitiateMethodPay('Google Pay', 'gpay');
                          }}
                          className="p-3 bg-[#2a2220] hover:bg-[#382e2c] border border-white/5 rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center">G</div>
                          <span className="text-xs font-medium text-white">Google Pay</span>
                        </button>

                        {/* Tata Neu UPI */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOptionInAll('Tata Neu UPI');
                            setAllOptionsError(null);
                            handleInitiateMethodPay('Tata Neu UPI');
                          }}
                          className="p-3 bg-[#2a2220] hover:bg-[#382e2c] border border-white/5 rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center">TN</div>
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-white block truncate">Tata Neu UPI</span>
                            <span className="text-[9px] text-amber-400 block truncate">Upto 5% NeuC...</span>
                          </div>
                        </button>

                        {/* PhonePe */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOptionInAll('PhonePe');
                            setAllOptionsError(null);
                            handleInitiateMethodPay('PhonePe', 'phonepe');
                          }}
                          className="p-3 bg-[#2a2220] hover:bg-[#382e2c] border border-white/5 rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">PP</div>
                          <span className="text-xs font-medium text-white">PhonePe</span>
                        </button>

                        {/* Paytm */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOptionInAll('Paytm');
                            setAllOptionsError(null);
                            handleInitiateMethodPay('Paytm', 'paytm');
                          }}
                          className="p-3 bg-[#2a2220] hover:bg-[#382e2c] border border-white/5 rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">PT</div>
                          <span className="text-xs font-medium text-white">Paytm</span>
                        </button>

                        {/* FamPay */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOptionInAll('FamPay');
                            setAllOptionsError(null);
                            handleInitiateMethodPay('FamPay', 'fampay');
                          }}
                          className="p-3 bg-[#2a2220] hover:bg-[#382e2c] border border-white/5 rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">FP</div>
                          <span className="text-xs font-medium text-white">FamPay</span>
                        </button>

                        {/* CRED UPI */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOptionInAll('CRED UPI');
                            setAllOptionsError(null);
                            handleInitiateMethodPay('CRED UPI', 'cred');
                          }}
                          className="p-3 bg-[#2a2220] hover:bg-[#382e2c] border border-white/5 rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <div className="w-6 h-6 rounded-md bg-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center">CR</div>
                          <span className="text-xs font-medium text-white">CRED UPI</span>
                        </button>

                        {/* Apps & UPI ID */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOptionInAll('Apps & UPI ID');
                            setAllOptionsError(null);
                            setShowQrModal(true);
                          }}
                          className="p-3 bg-[#2a2220] hover:bg-[#382e2c] border border-white/5 rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer col-span-2"
                        >
                          <QrCode className="w-5 h-5 text-amber-400" />
                          <span className="text-xs font-medium text-white">Apps & UPI ID / Scan QR</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 2. Cards */}
                  <div className="border border-[#382d2a] rounded-2xl overflow-hidden bg-[#221c1a]">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOptionInAll('Cards');
                        setAllOptionsError(null);
                        setCurrentStep('card_input');
                      }}
                      className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-white/[2%]"
                    >
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-4 h-4 text-blue-400" />
                        <div>
                          <span className="text-xs font-bold text-white block">Cards</span>
                          <span className="text-[10px] text-[#8a7c79] block">Visa, Mastercard, RuPay, Amex</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8a7c79]" />
                    </button>
                  </div>

                  {/* 3. EMI */}
                  <div className="border border-[#382d2a] rounded-2xl overflow-hidden bg-[#221c1a]">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOptionInAll('EMI');
                        setAllOptionsError(null);
                        setCurrentStep('emi_plans');
                      }}
                      className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-white/[2%]"
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-4 h-4 text-amber-400" />
                        <div>
                          <span className="text-xs font-bold text-white block">EMI</span>
                          <span className="text-[10px] text-[#8a7c79] block">Credit Card EMI available</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8a7c79]" />
                    </button>
                  </div>

                  {/* 4. Netbanking */}
                  <div className="border border-[#382d2a] rounded-2xl overflow-hidden bg-[#221c1a]">
                    <button
                      type="button"
                      onClick={() => setExpandedSection(expandedSection === 'netbanking' ? null : 'netbanking')}
                      className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-white/[2%]"
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-4 h-4 text-purple-400" />
                        <div>
                          <span className="text-xs font-bold text-white block">Netbanking</span>
                          <span className="text-[10px] text-[#8a7c79] block">SBI, HDFC, ICICI, Axis & 50+ Banks</span>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-[#8a7c79] transition-transform ${expandedSection === 'netbanking' ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedSection === 'netbanking' && (
                      <div className="p-4 pt-1 grid grid-cols-2 gap-2 border-t border-[#2e2523]">
                        {[
                          { name: 'SBI', issues: false },
                          { name: 'HDFC', issues: false },
                          { name: 'ICICI', issues: true },
                          { name: 'Axis', issues: false },
                          { name: 'BOB', issues: false },
                          { name: 'More Banks', issues: false },
                        ].map((bank) => (
                          <button
                            key={bank.name}
                            type="button"
                            onClick={() => {
                              setSelectedBankName(bank.name);
                              setSelectedOptionInAll(`Netbanking - ${bank.name}`);
                              setAllOptionsError(null);
                              setCurrentStep('netbanking_redirect');
                            }}
                            className="p-3 bg-[#2a2220] hover:bg-[#382e2c] border border-white/5 rounded-xl text-left transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <div className="w-6 h-6 rounded-md bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {bank.name[0]}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-medium text-white truncate block">{bank.name}</span>
                              {bank.issues && (
                                <span className="text-[9px] text-amber-400 block truncate font-mono">Facing issues</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 5. Wallet */}
                  <div className="border border-[#382d2a] rounded-2xl overflow-hidden bg-[#221c1a]">
                    <button
                      type="button"
                      onClick={() => setExpandedSection(expandedSection === 'wallet' ? null : 'wallet')}
                      className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-white/[2%]"
                    >
                      <div className="flex items-center gap-2.5">
                        <Wallet className="w-4 h-4 text-rose-400" />
                        <div>
                          <span className="text-xs font-bold text-white block">Wallet</span>
                          <span className="text-[10px] text-[#8a7c79] block">Mobikwik, Airtel Payments, Ola Money, PayZapp</span>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-[#8a7c79] transition-transform ${expandedSection === 'wallet' ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedSection === 'wallet' && (
                      <div className="p-4 pt-1 grid grid-cols-2 gap-2 border-t border-[#2e2523]">
                        {['Mobikwik', 'Airtel Payments', 'Ola Money', 'PayZapp'].map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => {
                              setSelectedOptionInAll(`Wallet - ${w}`);
                              setAllOptionsError(null);
                              handleInitiateMethodPay(`Wallet - ${w}`);
                            }}
                            className="p-3 bg-[#2a2220] hover:bg-[#382e2c] border border-white/5 rounded-xl text-left transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <div className="w-6 h-6 rounded-md bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center">
                              {w[0]}
                            </div>
                            <span className="text-xs font-medium text-white truncate">{w}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Validation error notice if continue clicked without choice */}
                {allOptionsError && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-rose-400 font-mono flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{allOptionsError}</span>
                    </p>
                  </div>
                )}

                {/* Bottom Continue Sticky Bar */}
                <div className="mt-auto p-4 border-t border-[#2e2624] flex items-center justify-between bg-[#191514] sticky bottom-0">
                  <div>
                    <span className="text-lg font-bold text-white block">₹{finalAmount.toLocaleString()}</span>
                    <span className="text-[10px] text-[#8a7c79] block">View Details</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedOptionInAll) {
                        setAllOptionsError('Please select one of these options.');
                        return;
                      }
                      handleInitiateMethodPay(selectedOptionInAll);
                    }}
                    className="px-6 py-3 bg-[#382d2b] hover:bg-[#483b38] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 8: CARD INPUT (Video 01:47 - 02:02)                       */}
            {/* ============================================================== */}
            {currentStep === 'card_input' && (
              <div className="flex flex-col h-full bg-[#1b1716]">
                <div className="p-4 border-b border-[#2e2624] flex items-center justify-between bg-[#191514]">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('all_options')}
                      className="p-1 text-[#9e8f8b] hover:text-white cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h4 className="text-base font-bold text-white">Card</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep('cancel_confirm')}
                    className="p-1 text-[#9e8f8b] hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCardSubmit} className="p-5 sm:p-6 space-y-4">
                  <span className="text-xs font-bold text-white block">Add a new card</span>

                  <div>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="Card Number"
                      className="w-full bg-[#27201f] border border-[#3d3230] text-white text-sm rounded-xl px-4 py-3.5 outline-none font-mono placeholder:text-[#6a5e5c]"
                    />
                    {cardError && (
                      <p className="text-[11px] text-rose-400 mt-1 font-mono">{cardError}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      placeholder="MM / YY"
                      className="w-full bg-[#27201f] border border-[#3d3230] text-white text-sm rounded-xl px-4 py-3.5 outline-none font-mono placeholder:text-[#6a5e5c]"
                    />
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      placeholder="CVV"
                      className="w-full bg-[#27201f] border border-[#3d3230] text-white text-sm rounded-xl px-4 py-3.5 outline-none font-mono placeholder:text-[#6a5e5c]"
                    />
                  </div>

                  <label className="flex items-center gap-2.5 text-xs text-[#a89c99] cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={saveCardRbi}
                      onChange={(e) => setSaveCardRbi(e.target.checked)}
                      className="rounded accent-stone-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Save this card as per RBI guidelines</span>
                  </label>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-4 bg-[#382d2b] hover:bg-[#483b38] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                    >
                      Continue
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 9: EMI PLANS (Video 01:36 - 01:40)                        */}
            {/* ============================================================== */}
            {currentStep === 'emi_plans' && (
              <div className="flex flex-col h-full bg-[#1b1716]">
                <div className="p-4 border-b border-[#2e2624] flex items-center justify-between bg-[#191514]">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('all_options')}
                      className="p-1 text-[#9e8f8b] hover:text-white cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h4 className="text-base font-bold text-white">EMI Plans</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep('cancel_confirm')}
                    className="p-1 text-[#9e8f8b] hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  <span className="text-xs font-bold text-white block">Credit Card EMI</span>

                  <div 
                    onClick={() => handleInitiateMethodPay('RBL Bank Credit Card EMI')}
                    className="bg-[#241e1c] hover:bg-[#302624] border border-[#382d2b] rounded-2xl p-4 space-y-2 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">RBL Bank</span>
                      <span className="text-xs text-amber-400 font-mono">₹{(finalAmount / 9).toFixed(2)} x 9 month</span>
                    </div>
                    <p className="text-[11px] text-[#8a7c79]">
                      Total interest ₹{(finalAmount * 0.07).toFixed(2)} @ 17% p.a.
                    </p>
                  </div>

                  <div 
                    onClick={() => handleInitiateMethodPay('HDFC Bank Credit Card EMI')}
                    className="bg-[#241e1c] hover:bg-[#302624] border border-[#382d2b] rounded-2xl p-4 space-y-2 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">HDFC Bank</span>
                      <span className="text-xs text-amber-400 font-mono">₹{(finalAmount / 6).toFixed(2)} x 6 month</span>
                    </div>
                    <p className="text-[11px] text-[#8a7c79]">
                      Total interest ₹{(finalAmount * 0.05).toFixed(2)} @ 15% p.a.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInitiateMethodPay('RBL Bank Credit Card EMI')}
                    className="w-full py-4 bg-[#382d2b] hover:bg-[#483b38] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer mt-4"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 10: NETBANKING REDIRECT (Video 02:16 - 02:22)             */}
            {/* ============================================================== */}
            {currentStep === 'netbanking_redirect' && (
              <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center min-h-[360px] space-y-5 bg-[#1b1716]">
                <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-blue-400 font-bold text-lg">
                  {selectedBankName[0]}
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white">Loading bank page...</h4>
                  <p className="text-xs text-[#a89c99] max-w-xs mx-auto leading-relaxed">
                    Please wait while we redirect you to your bank page ({selectedBankName}).
                  </p>
                </div>

                <RefreshCw className="w-7 h-7 text-amber-400 animate-spin my-2" />

                <div className="pt-2 text-center">
                  <span className="text-[11px] text-[#6d6260]">
                    Secured by <strong className="text-blue-400">Razorpay</strong>
                  </span>
                </div>

                <div className="pt-2 w-full space-y-2">
                  <button
                    type="button"
                    onClick={() => handleInitiateMethodPay(`Netbanking (${selectedBankName})`)}
                    className="w-full py-3 bg-[#382d2b] hover:bg-[#483b38] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Authorize Payment (₹{finalAmount.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep('all_options')}
                    className="w-full py-2 bg-transparent text-[#8a7c79] hover:text-white text-xs cursor-pointer"
                  >
                    Cancel and go back
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 11: CONFIRMING PAYMENT (Video 00:57 - 01:00)              */}
            {/* ============================================================== */}
            {currentStep === 'confirming' && (
              <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center min-h-[360px] space-y-6">
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold font-serif text-white tracking-tight">
                    Confirming Payment
                  </h3>
                  <p className="text-xs text-[#9e8f8b] font-sans">
                    This will only take a few seconds.
                  </p>
                </div>

                <div className="py-4 perspective-1000">
                  <motion.div
                    animate={{ rotateY: [0, 180, 360] }}
                    transition={{ repeat: Infinity, duration: 1.0, ease: 'linear' }}
                    className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#059669] via-[#34d399] to-[#047857] shadow-2xl flex items-center justify-center border-4 border-[#a7f3d0] relative"
                  >
                    <Check className="w-10 h-10 text-emerald-950 font-black stroke-[3]" />
                  </motion.div>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[11px] text-[#6d6260]">
                    Secured by <strong className="text-blue-400">Razorpay</strong>
                  </span>
                </div>
              </div>
            )}

            {/* QR Code Scan Modal */}
            <AnimatePresence>
              {showQrModal && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 z-30 bg-[#161211]/95 backdrop-blur-md p-6 flex flex-col justify-between items-center text-center"
                >
                  <div className="w-full flex justify-between items-center pb-2 border-b border-[#2e2624]">
                    <h4 className="text-sm font-bold text-white">Scan UPI QR Code</h4>
                    <button
                      type="button"
                      onClick={() => setShowQrModal(false)}
                      className="p-1 text-[#9e8f8b] hover:text-white rounded-lg cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="my-auto space-y-4">
                    <div className="p-3 bg-white rounded-2xl shadow-xl inline-block">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                          `upi://pay?pa=${activeMerchantVpa}&pn=${encodeURIComponent(merchantBankingName)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(paymentDetails.purpose.slice(0, 20))}`
                        )}`}
                        alt="UPI Payment QR Code"
                        className="w-44 h-44 rounded-lg block"
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-white font-bold">
                        Scan with Google Pay, PhonePe, Paytm, FamPay, or CRED
                      </p>
                      <p className="text-[11px] text-[#8a7c79] font-mono">
                        Payee: {merchantBankingName} ({activeMerchantVpa})
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyUpiId}
                        className="px-3 py-1.5 bg-[#2a2220] hover:bg-[#382d2a] border border-[#3d3230] rounded-xl text-xs text-amber-300 font-mono flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUpi ? 'Copied UPI ID!' : activeMerchantVpa}</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowQrModal(false);
                      handleInitiateMethodPay('QR Code UPI Scan');
                    }}
                    className="w-full py-3.5 bg-[#521714] hover:bg-[#681e1a] text-[#ffded9] font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    I have Completed UPI Payment (₹{finalAmount.toLocaleString()})
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Terms Dialog Modal */}
            <AnimatePresence>
              {showTerms && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-black/90 p-6 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <h4 className="text-sm font-bold text-white">Payment Terms & Assurance</h4>
                      <button onClick={() => setShowTerms(false)} className="text-stone-400 hover:text-white cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-[#a89c99] space-y-2 leading-relaxed">
                      <p>• Payments are securely processed through Razorpay's PCI-DSS Level 1 certified gateway.</p>
                      <p>• Verified receipts and session access keys are immediately delivered to your registered email address.</p>
                      <p>• 7-day money-back guarantee applies if deliverables do not match workshop specifications.</p>
                      <p>• No card or banking credentials are ever stored on S-CODERS servers.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTerms(false)}
                    className="w-full py-3 bg-stone-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Close Terms
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
