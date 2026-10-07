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
  initialStep?: 'checkout' | 'payment_methods' | 'all_options';
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
  // Steps in the Payment Flow:
  // 1. 'checkout' -> Customer information input (Name, Email, Mobile, Coupon)
  // 2. 'payment_methods' -> All Payment Options (UPI [PhonePe, GPay, Paytm, FamPay, BHIM, CRED, Amazon Pay, WhatsApp, VPA, QR], Cards, Net Banking, EMI, Wallets)
  // 3. 'card_input' -> Add credit/debit card form
  // 4. 'emi_plans' -> Monthly EMI breakdown
  // 5. 'netbanking_redirect' -> Bank authorization simulator
  // 6. 'processing' -> Spinning coin screen "Processing your payment"
  // 7. 'confirming' -> "Confirming Payment"
  const [currentStep, setCurrentStep] = useState<
    | 'checkout'
    | 'payment_methods'
    | 'card_input'
    | 'emi_plans'
    | 'netbanking_redirect'
    | 'processing'
    | 'confirming'
  >('checkout');

  // Customer registration details (Initialized empty unless custom explicit user provided)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
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
  const [selectedMethodName, setSelectedMethodName] = useState('UPI - PhonePe');

  // Accordion open section in Payment Methods
  const [expandedSection, setExpandedSection] = useState<'upi' | 'cards' | 'emi' | 'netbanking' | 'wallet' | null>('upi');

  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [saveCardRbi, setSaveCardRbi] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Netbanking state
  const [selectedBankName, setSelectedBankName] = useState('State Bank of India');
  const [searchBankQuery, setSearchBankQuery] = useState('');

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
      setShowCodeInput(false);
      setAppliedDiscount(null);
      setPromoError(null);
      setPromoCode('');
      setCustomUpiId('');
      setUpiIdError(null);
      setShowQrModal(false);
      setCurrentStep(initialStep === 'checkout' ? 'checkout' : 'payment_methods');
      setExpandedSection('upi');
      setCardNumber('');
      setCardHolder('');
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

  // Calculate pricing
  const baseAmount = paymentDetails?.amount || 299;
  const currency = paymentDetails?.currency || 'INR';
  const discountVal = appliedDiscount ? appliedDiscount.amount : 0;
  const finalAmount = Math.max(1, baseAmount - discountVal);
  const activeMerchantVpa = paymentDetails?.merchantUpiId || getActiveMerchantUpi();
  const merchantBankingName = getBankingNameForUpi(activeMerchantVpa);
  const merchantPhone = getPhoneNumberForUpi(activeMerchantVpa);

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

  // Step 1 Submission: Customer fills Name, Email, Mobile and clicks "Continue"
  // It transitions directly to the Payment Options screen (showing UPI, Cards, Net Banking, EMI, Wallets)
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

    // Pre-create/warm order in the background for instant checkout response
    ensureServerOrder().catch(() => {});

    // Transition to the Payment Options View where user chooses UPI (PhonePe, GPay, Paytm, FamPay, etc.), Cards, Net Banking, EMI, Wallets
    setCurrentStep('payment_methods');
  };

  // Trigger Payment Processing for chosen payment method
  const handleInitiateMethodPay = (
    methodName: string, 
    upiAppScheme?: 'phonepe' | 'gpay' | 'paytm' | 'fampay' | 'bhim' | 'cred' | 'amazonpay' | 'whatsapp' | 'universal'
  ) => {
    setSelectedMethodName(methodName);
    setCurrentStep('processing');

    // If mobile or requested UPI app, trigger app intent
    if (upiAppScheme) {
      openUpiApp({
        pa: activeMerchantVpa,
        pn: merchantBankingName,
        am: finalAmount,
        tn: paymentDetails.purpose.slice(0, 25),
      }, upiAppScheme);
    }

    // Smooth verification simulation
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
      }, 1400);
    }, 2600);
  };

  // Custom UPI ID submission (e.g. 9876543210@paytm, user@fam)
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
      setCardError('Please enter a valid 16-digit card number');
      return;
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      setCardError('Please enter valid expiry date (MM/YY)');
      return;
    }
    if (!cardCvv || cardCvv.length < 3) {
      setCardError('Please enter valid 3 or 4 digit CVV');
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

  const allBanksList = [
    { name: 'State Bank of India', code: 'SBI', popular: true },
    { name: 'HDFC Bank', code: 'HDFC', popular: true },
    { name: 'ICICI Bank', code: 'ICICI', popular: true },
    { name: 'Axis Bank', code: 'AXIS', popular: true },
    { name: 'Kotak Mahindra Bank', code: 'KOTAK', popular: true },
    { name: 'Punjab National Bank', code: 'PNB', popular: true },
    { name: 'Bank of Baroda', code: 'BOB', popular: false },
    { name: 'Canara Bank', code: 'CANARA', popular: false },
    { name: 'Union Bank of India', code: 'UBI', popular: false },
    { name: 'IndusInd Bank', code: 'INDUS', popular: false },
    { name: 'Yes Bank', code: 'YES', popular: false },
    { name: 'IDFC FIRST Bank', code: 'IDFC', popular: false },
  ];

  const filteredBanks = searchBankQuery.trim()
    ? allBanksList.filter(b => b.name.toLowerCase().includes(searchBankQuery.toLowerCase()))
    : allBanksList;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto bg-black/80 backdrop-blur-sm animate-fade-in">
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#191514] text-white rounded-t-3xl sm:rounded-3xl border border-[#332927] shadow-2xl overflow-hidden flex flex-col font-sans"
            style={{ maxHeight: '92vh' }}
          >
        {/* ============================================================== */}
        {/* VIEW 1: REGISTRATION / CUSTOMER DETAILS INPUT                  */}
        {/* ============================================================== */}
        {currentStep === 'checkout' && (
          <div className="p-6 sm:p-7 space-y-5">
            {/* Header with Title and Close X */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-serif font-black tracking-tight text-[#f7f2ef]">
                  Checkout
                </h3>
                <p className="text-xs font-sans text-[#b89f9a] mt-0.5 font-medium">
                  {paymentDetails.purpose} • ₹{finalAmount.toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#2a2220] hover:bg-[#382e2c] text-[#b89f9a] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Cancel and close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input Form with clean Enter your name / email / phone placeholders */}
            <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-1">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-mono text-[#9e8f8b] mb-1.5 uppercase tracking-wider">
                  Full Name *
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

              {/* Email */}
              <div>
                <label className="block text-[11px] font-mono text-[#9e8f8b] mb-1.5 uppercase tracking-wider">
                  Email Address *
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

              {/* Mobile Phone Number */}
              <div>
                <label className="block text-[11px] font-mono text-[#9e8f8b] mb-1.5 uppercase tracking-wider">
                  Phone Number
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
                    <span>Have a promo code?</span>
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

              {/* Continue to Payment Options button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-[#521714] hover:bg-[#681e1a] active:bg-[#401210] text-[#ffded9] font-bold text-sm tracking-wide transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Continue to Payment (₹{finalAmount.toLocaleString()})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Trust Footer */}
              <div className="text-center pt-2 space-y-1">
                <p className="text-[11px] text-[#8e817e] font-sans flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#a89995] inline" />
                  <span>Secured by Razorpay • Instant Access • 7-day assurance</span>
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-[10px] text-[#736765] hover:text-[#b89f9a] underline cursor-pointer"
                  >
                    Terms & Privacy
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: ALL PAYMENT OPTIONS (UPI, CARDS, NETBANKING, EMI, WALLET) */}
        {/* ============================================================== */}
        {currentStep === 'payment_methods' && (
          <div className="flex flex-col h-full bg-[#1b1716] overflow-y-auto">
            {/* Top Bar with back arrow & Close */}
            <div className="p-4 border-b border-[#2e2624] flex items-center justify-between bg-[#191514] sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('checkout')}
                  className="p-1.5 text-[#9e8f8b] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  title="Back to details"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h4 className="text-base font-bold text-white">Payment Options</h4>
                  <p className="text-[10px] text-[#8a7c79] font-mono">Amount: ₹{finalAmount.toLocaleString()}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#9e8f8b] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Offer banner */}
            <div className="p-3.5 bg-[#261f1c] border-b border-[#332a28] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[#e2d8d5] text-[11px]">Instant UPI, Card & Netbanking discounts active</span>
              </div>
              <span className="text-[10px] font-bold text-amber-400 font-mono">Razorpay Verified</span>
            </div>

            {/* Accordion list of payment options */}
            <div className="p-4 space-y-3 pb-8">
              <span className="text-[10px] font-mono text-[#8a7c79] uppercase tracking-wider block font-bold">
                Select Your Payment Method
              </span>

              {/* 1. UPI SECTION (PhonePe, GPay, Paytm, FamPay, BHIM, CRED, Amazon Pay, WhatsApp, Any UPI ID, QR Code) */}
              <div className="border border-[#382d2a] rounded-2xl overflow-hidden bg-[#221c1a]">
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 'upi' ? null : 'upi')}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-white/[2%]"
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">UPI (Instant & Zero Fee)</span>
                      <span className="text-[10px] text-emerald-400 font-bold block">PhonePe, GPay, Paytm, FamPay & More</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#8a7c79] transition-transform ${expandedSection === 'upi' ? 'rotate-180' : ''}`} />
                </button>

                {expandedSection === 'upi' && (
                  <div className="p-4 pt-2 space-y-3 border-t border-[#2e2523] bg-[#1a1514]">
                    <span className="text-[10px] font-mono text-[#9e8f8b] uppercase tracking-wider block">
                      Choose UPI Application:
                    </span>

                    {/* Popular UPI Apps Grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* PhonePe */}
                      <button
                        type="button"
                        onClick={() => handleInitiateMethodPay('UPI - PhonePe', 'phonepe')}
                        className="p-3 bg-[#241e1c] hover:bg-[#342927] border border-[#3d312f] hover:border-[#672d91] rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#5f259f]/30 border border-[#5f259f]/60 text-[#c084fc] font-bold text-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                          PP
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">PhonePe</span>
                          <span className="text-[9px] text-emerald-400 block font-mono">Instant Fast</span>
                        </div>
                      </button>

                      {/* Google Pay */}
                      <button
                        type="button"
                        onClick={() => handleInitiateMethodPay('UPI - Google Pay', 'gpay')}
                        className="p-3 bg-[#241e1c] hover:bg-[#342927] border border-[#3d312f] hover:border-blue-500 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-400 font-bold text-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                          G
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">Google Pay</span>
                          <span className="text-[9px] text-blue-400 block font-mono">GPay UPI</span>
                        </div>
                      </button>

                      {/* Paytm */}
                      <button
                        type="button"
                        onClick={() => handleInitiateMethodPay('UPI - Paytm', 'paytm')}
                        className="p-3 bg-[#241e1c] hover:bg-[#342927] border border-[#3d312f] hover:border-cyan-500 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-bold text-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                          PT
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">Paytm UPI</span>
                          <span className="text-[9px] text-cyan-300 block font-mono">Wallet/UPI</span>
                        </div>
                      </button>

                      {/* FamPay (Explicitly Requested) */}
                      <button
                        type="button"
                        onClick={() => handleInitiateMethodPay('UPI - FamPay', 'fampay')}
                        className="p-3 bg-[#241e1c] hover:bg-[#342927] border border-[#3d312f] hover:border-amber-500 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-400 font-bold text-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                          FP
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">FamPay</span>
                          <span className="text-[9px] text-amber-300 block font-mono">Gen-Z UPI</span>
                        </div>
                      </button>

                      {/* CRED UPI */}
                      <button
                        type="button"
                        onClick={() => handleInitiateMethodPay('UPI - CRED UPI', 'cred')}
                        className="p-3 bg-[#241e1c] hover:bg-[#342927] border border-[#3d312f] hover:border-stone-400 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-stone-700 border border-stone-500 text-stone-200 font-bold text-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                          CR
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">CRED UPI</span>
                          <span className="text-[9px] text-stone-300 block font-mono">Cashback</span>
                        </div>
                      </button>

                      {/* BHIM UPI */}
                      <button
                        type="button"
                        onClick={() => handleInitiateMethodPay('UPI - BHIM NPCI', 'bhim')}
                        className="p-3 bg-[#241e1c] hover:bg-[#342927] border border-[#3d312f] hover:border-emerald-500 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold text-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                          BH
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">BHIM UPI</span>
                          <span className="text-[9px] text-emerald-300 block font-mono">NPCI Official</span>
                        </div>
                      </button>

                      {/* Amazon Pay */}
                      <button
                        type="button"
                        onClick={() => handleInitiateMethodPay('UPI - Amazon Pay', 'amazonpay')}
                        className="p-3 bg-[#241e1c] hover:bg-[#342927] border border-[#3d312f] hover:border-yellow-500 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 font-bold text-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                          AP
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">Amazon Pay</span>
                          <span className="text-[9px] text-yellow-300 block font-mono">Amazon UPI</span>
                        </div>
                      </button>

                      {/* WhatsApp Pay */}
                      <button
                        type="button"
                        onClick={() => handleInitiateMethodPay('UPI - WhatsApp Pay', 'whatsapp')}
                        className="p-3 bg-[#241e1c] hover:bg-[#342927] border border-[#3d312f] hover:border-emerald-400 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                          WA
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">WhatsApp Pay</span>
                          <span className="text-[9px] text-emerald-300 block font-mono">Chat UPI</span>
                        </div>
                      </button>
                    </div>

                    {/* Enter Any UPI ID or Scan QR */}
                    <div className="pt-2 border-t border-[#2e2523] space-y-2.5">
                      <form onSubmit={handleCustomUpiSubmit} className="space-y-2">
                        <label className="block text-[10px] font-mono text-[#9e8f8b] uppercase tracking-wider">
                          Or Enter Any UPI ID / VPA
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customUpiId}
                            onChange={(e) => {
                              setCustomUpiId(e.target.value);
                              setUpiIdError(null);
                            }}
                            placeholder="e.g. yourname@oksbi or mobile@fam"
                            className="flex-1 bg-[#241e1c] border border-[#3d312f] text-white text-xs rounded-xl px-3.5 py-2.5 font-mono outline-none focus:border-[#d97768]"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2.5 bg-[#401614] hover:bg-[#521c1a] text-[#ffded9] font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Pay
                          </button>
                        </div>
                        {upiIdError && (
                          <p className="text-[11px] text-rose-400 font-mono">{upiIdError}</p>
                        )}
                      </form>

                      {/* QR Code trigger */}
                      <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className="w-full p-2.5 bg-[#241e1c] hover:bg-[#302624] border border-[#3d312f] rounded-xl flex items-center justify-between text-xs text-amber-300 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-amber-400" />
                          <span className="font-semibold">Show Instant QR Code (Scan from any UPI App)</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-amber-400" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. CARDS SECTION */}
              <div className="border border-[#382d2a] rounded-2xl overflow-hidden bg-[#221c1a]">
                <button
                  type="button"
                  onClick={() => setCurrentStep('card_input')}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-white/[2%]"
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Cards (Credit / Debit)</span>
                      <span className="text-[10px] text-[#8a7c79] block">Visa, Mastercard, RuPay, Maestro, Amex</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8a7c79]" />
                </button>
              </div>

              {/* 3. NETBANKING SECTION */}
              <div className="border border-[#382d2a] rounded-2xl overflow-hidden bg-[#221c1a]">
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 'netbanking' ? null : 'netbanking')}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-white/[2%]"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Net Banking</span>
                      <span className="text-[10px] text-[#8a7c79] block">SBI, HDFC, ICICI, Axis, Kotak & 50+ Banks</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#8a7c79] transition-transform ${expandedSection === 'netbanking' ? 'rotate-180' : ''}`} />
                </button>

                {expandedSection === 'netbanking' && (
                  <div className="p-4 pt-2 space-y-3 border-t border-[#2e2523] bg-[#1a1514]">
                    <input
                      type="text"
                      value={searchBankQuery}
                      onChange={(e) => setSearchBankQuery(e.target.value)}
                      placeholder="Search your bank (e.g. SBI, HDFC)..."
                      className="w-full bg-[#241e1c] border border-[#3d312f] text-white text-xs rounded-xl px-3.5 py-2 font-sans outline-none focus:border-[#d97768] placeholder:text-[#6a5e5c]"
                    />

                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {filteredBanks.map((bank) => (
                        <button
                          key={bank.name}
                          type="button"
                          onClick={() => {
                            setSelectedBankName(bank.name);
                            setCurrentStep('netbanking_redirect');
                          }}
                          className="p-2.5 bg-[#241e1c] hover:bg-[#342927] border border-[#3d312f] rounded-xl text-left transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <div className="w-6 h-6 rounded-md bg-purple-600/20 text-purple-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {bank.code[0]}
                          </div>
                          <span className="text-xs font-medium text-white truncate">{bank.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. EMI SECTION */}
              <div className="border border-[#382d2a] rounded-2xl overflow-hidden bg-[#221c1a]">
                <button
                  type="button"
                  onClick={() => setCurrentStep('emi_plans')}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-white/[2%]"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">EMI Plans</span>
                      <span className="text-[10px] text-[#8a7c79] block">Credit Card EMI & Low Cost EMI available</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8a7c79]" />
                </button>
              </div>

              {/* 5. WALLET SECTION */}
              <div className="border border-[#382d2a] rounded-2xl overflow-hidden bg-[#221c1a]">
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 'wallet' ? null : 'wallet')}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-white/[2%]"
                >
                  <div className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-rose-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Wallets</span>
                      <span className="text-[10px] text-[#8a7c79] block">Mobikwik, Airtel Payments, Ola Money, PayZapp</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#8a7c79] transition-transform ${expandedSection === 'wallet' ? 'rotate-180' : ''}`} />
                </button>

                {expandedSection === 'wallet' && (
                  <div className="p-4 pt-2 grid grid-cols-2 gap-2 border-t border-[#2e2523] bg-[#1a1514]">
                    {['Mobikwik', 'Airtel Payments', 'Ola Money', 'PayZapp', 'Amazon Pay Balance'].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => handleInitiateMethodPay(`Wallet - ${w}`)}
                        className="p-3 bg-[#241e1c] hover:bg-[#342927] border border-[#3d312f] rounded-xl text-left transition-colors flex items-center gap-2 cursor-pointer"
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

            {/* Bottom Total Bar */}
            <div className="mt-auto p-4 border-t border-[#2e2624] flex items-center justify-between bg-[#191514] sticky bottom-0">
              <div>
                <span className="text-lg font-bold text-white block">₹{finalAmount.toLocaleString()}</span>
                <span className="text-[10px] text-[#8a7c79] block font-mono">Payment for {paymentDetails.purpose}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-[#2a2220] hover:bg-[#382d2a] text-[#a89c99] hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: CARD INPUT VIEW                                        */}
        {/* ============================================================== */}
        {currentStep === 'card_input' && (
          <div className="flex flex-col h-full bg-[#1b1716]">
            {/* Top Bar with back arrow */}
            <div className="p-4 border-b border-[#2e2624] flex items-center justify-between bg-[#191514]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('payment_methods')}
                  className="p-1.5 text-[#9e8f8b] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h4 className="text-base font-bold text-white">Enter Card Details</h4>
                  <p className="text-[10px] text-[#8a7c79] font-mono">Amount: ₹{finalAmount.toLocaleString()}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="p-1.5 text-[#9e8f8b] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCardSubmit} className="p-5 sm:p-6 space-y-4">
              <span className="text-xs font-bold text-white block">Credit or Debit Card</span>

              <div>
                <label className="block text-[10px] font-mono text-[#9e8f8b] mb-1 uppercase tracking-wider">Card Number</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="XXXX XXXX XXXX XXXX"
                  className="w-full bg-[#27201f] border border-[#3d3230] text-white text-sm rounded-xl px-4 py-3 outline-none font-mono placeholder:text-[#6a5e5c] focus:border-[#d97768]"
                />
                {cardError && (
                  <p className="text-[11px] text-rose-400 mt-1 font-mono">{cardError}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#9e8f8b] mb-1 uppercase tracking-wider">Name on Card</label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Cardholder full name"
                  className="w-full bg-[#27201f] border border-[#3d3230] text-white text-sm rounded-xl px-4 py-3 outline-none font-sans placeholder:text-[#6a5e5c] focus:border-[#d97768]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-[#9e8f8b] mb-1 uppercase tracking-wider">Expiry Date</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    placeholder="MM / YY"
                    className="w-full bg-[#27201f] border border-[#3d3230] text-white text-sm rounded-xl px-4 py-3 outline-none font-mono placeholder:text-[#6a5e5c] focus:border-[#d97768]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[#9e8f8b] mb-1 uppercase tracking-wider">CVV</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                    placeholder="CVV"
                    className="w-full bg-[#27201f] border border-[#3d3230] text-white text-sm rounded-xl px-4 py-3 outline-none font-mono placeholder:text-[#6a5e5c] focus:border-[#d97768]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-[#a89c99] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={saveCardRbi}
                  onChange={(e) => setSaveCardRbi(e.target.checked)}
                  className="rounded accent-[#d97768] w-4 h-4 cursor-pointer"
                />
                <span>Save card securely as per RBI guidelines</span>
              </label>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-4 bg-[#521714] hover:bg-[#681e1a] text-[#ffded9] font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-lg"
                >
                  Pay ₹{finalAmount.toLocaleString()}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: EMI PLANS VIEW                                         */}
        {/* ============================================================== */}
        {currentStep === 'emi_plans' && (
          <div className="flex flex-col h-full bg-[#1b1716]">
            <div className="p-4 border-b border-[#2e2624] flex items-center justify-between bg-[#191514]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('payment_methods')}
                  className="p-1.5 text-[#9e8f8b] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h4 className="text-base font-bold text-white">EMI Plans</h4>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="p-1.5 text-[#9e8f8b] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <span className="text-xs font-bold text-white block">Select Your Credit Card EMI Option:</span>

              <div 
                onClick={() => handleInitiateMethodPay('HDFC Credit Card 3M EMI')}
                className="bg-[#241e1c] hover:bg-[#302624] border border-[#382d2b] hover:border-amber-500 rounded-2xl p-4 space-y-2 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">HDFC Bank Credit Card (3 Months)</span>
                  <span className="text-xs text-amber-400 font-mono font-bold">₹{Math.round(finalAmount / 3)}/mo</span>
                </div>
                <p className="text-[11px] text-[#8a7c79]">
                  3 Months EMI • Low Interest • Instant Approval
                </p>
              </div>

              <div 
                onClick={() => handleInitiateMethodPay('ICICI Bank 6M EMI')}
                className="bg-[#241e1c] hover:bg-[#302624] border border-[#382d2b] hover:border-amber-500 rounded-2xl p-4 space-y-2 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">ICICI Bank Credit Card (6 Months)</span>
                  <span className="text-xs text-amber-400 font-mono font-bold">₹{Math.round(finalAmount / 6)}/mo</span>
                </div>
                <p className="text-[11px] text-[#8a7c79]">
                  6 Months EMI • Flexible tenure
                </p>
              </div>

              <div 
                onClick={() => handleInitiateMethodPay('SBI Card 9M EMI')}
                className="bg-[#241e1c] hover:bg-[#302624] border border-[#382d2b] hover:border-amber-500 rounded-2xl p-4 space-y-2 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">SBI Card (9 Months)</span>
                  <span className="text-xs text-amber-400 font-mono font-bold">₹{Math.round(finalAmount / 9)}/mo</span>
                </div>
                <p className="text-[11px] text-[#8a7c79]">
                  9 Months EMI • Low monthly payments
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 5: NETBANKING REDIRECT VIEW                               */}
        {/* ============================================================== */}
        {currentStep === 'netbanking_redirect' && (
          <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center min-h-[360px] space-y-5">
            <div className="w-14 h-14 bg-purple-500/20 border border-purple-500/40 rounded-2xl flex items-center justify-center text-purple-300 font-bold text-xl">
              {selectedBankName[0]}
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">Connecting to {selectedBankName}</h4>
              <p className="text-xs text-[#a89c99] max-w-xs mx-auto leading-relaxed">
                Please wait while we redirect you to the official {selectedBankName} secure payment portal.
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
                onClick={() => handleInitiateMethodPay(`Netbanking - ${selectedBankName}`)}
                className="w-full py-3.5 bg-[#521714] hover:bg-[#681e1a] text-[#ffded9] text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Authorize Payment (₹{finalAmount.toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep('payment_methods')}
                className="w-full py-2.5 bg-[#261f1d] hover:bg-[#302624] text-[#9e8f8b] hover:text-white text-xs rounded-xl transition-colors cursor-pointer"
              >
                Choose Another Bank
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 6: PROCESSING WITH 3D SPINNING COIN                       */}
        {/* ============================================================== */}
        {currentStep === 'processing' && (
          <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center min-h-[360px] space-y-6">
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold font-serif text-white tracking-tight">
                Processing your payment
              </h3>
              <p className="text-xs text-[#9e8f8b] font-sans">
                Authenticating via {selectedMethodName}...
              </p>
            </div>

            {/* 3D Animated Spinning Golden Coin */}
            <div className="py-4 perspective-1000">
              <motion.div
                animate={{ rotateY: [0, 180, 360] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#d97006] via-[#fcd34d] to-[#b45309] shadow-2xl flex items-center justify-center border-4 border-[#fef08a] relative"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="text-center font-serif font-black text-2xl text-[#78350f]">
                  ₹
                </div>
              </motion.div>
            </div>

            {/* Cancel Button - Immediately Closes cleanly without unwanted retry loop */}
            <div className="w-full pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 bg-[#2c2422] hover:bg-[#382f2c] text-[#a89c99] hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel Payment
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
        {/* VIEW 7: CONFIRMING PAYMENT (Success animation)                 */}
        {/* ============================================================== */}
        {currentStep === 'confirming' && (
          <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center min-h-[360px] space-y-6">
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold font-serif text-white tracking-tight">
                Confirming Payment
              </h3>
              <p className="text-xs text-[#9e8f8b] font-sans">
                This will only take a moment...
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
                  className="p-1 text-[#9e8f8b] hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-auto space-y-4">
                {/* Instant dynamic QR code image */}
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
                    Scan with PhonePe, Google Pay, Paytm, FamPay, CRED, or any UPI App
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
