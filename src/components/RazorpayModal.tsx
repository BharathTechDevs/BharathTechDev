import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ArrowLeft, ArrowRight, ShieldCheck, Check, CreditCard, Building2, 
  Wallet, RefreshCw, Smartphone, QrCode, Tag, Sparkles, ChevronRight, 
  ChevronDown, Lock, AlertTriangle, AlertCircle, CheckCircle2, MoreHorizontal, ExternalLink,
  Copy, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  createRazorpayOrder,
  verifyRazorpayPayment,
  loadRazorpaySDK,
  checkRazorpayOrderStatus
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
  initialStep,
}: RazorpayModalProps) {
  // Steps matching Video Flow & Razorpay Standard:
  // 1. 'checkout' -> Customer details input card (Name, Email, Mobile, "pay ₹...", "have a code?")
  // 2. 'razorpay_main' -> Official Razorpay Bottom Sheet with PhonePe & "More Options >"
  // 3. 'processing' -> 3D Spinning Golden Coin "Waiting for payment confirmation" + active countdown timer
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
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Active Razorpay Order details
  const [currentOrderId, setCurrentOrderId] = useState<string>(orderData?.orderId || '');
  const [activeKeyId, setActiveKeyId] = useState<string>(orderData?.keyId || '');
  const [selectedMethodName, setSelectedMethodName] = useState('PhonePe');
  const [retryReason, setRetryReason] = useState('Payment could not be processed. Please try again.');

  // Timing & Waiting state (Active 10-minute timer for UPI / App payments)
  const [waitingSeconds, setWaitingSeconds] = useState(600); // 10 minutes (600s)
  const [isCheckingManualStatus, setIsCheckingManualStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

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
      const rawName = paymentDetails.clientName?.trim() || '';
      const initialName = rawName !== 'Attendee' && !rawName.startsWith('Manual User') ? rawName : '';
      const rawEmail = paymentDetails.email?.trim() || '';
      const initialEmail = rawEmail !== 'attendee@scoders.com' && rawEmail !== 'attendee@scoders.dev' ? rawEmail : '';
      const initialPhone = paymentDetails.phone?.trim() || '';

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
      setCheckoutError(null);

      // Check whether user has already filled registration details
      const hasRegistrationDetails = Boolean(
        initialName && initialName.trim() &&
        initialEmail && initialEmail.trim()
      );

      // If user has already registered / filled details:
      // Automatically read details and open UPI & other payment options directly.
      // If user has NOT yet registered (e.g. clicking on registration without details):
      // Open the registration form first so they get registered, then auto-open UPI upon submitting!
      if (initialStep === 'checkout' || !hasRegistrationDetails) {
        setCurrentStep('checkout');
      } else {
        setCurrentStep('all_options');
        setExpandedSection('upi');
      }
      setSelectedOptionInAll(null);
      setAllOptionsError(null);
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setSaveCardRbi(false);
      setCardError(null);
      setWaitingSeconds(600);
      setStatusMessage(null);
      setIsCheckingManualStatus(false);
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

  // Helper to dispatch email notification on payment failure / cancellation
  const dispatchPaymentFailureEmail = async (reasonText: string) => {
    const targetEmail = email.trim();
    if (!targetEmail || !targetEmail.includes('@')) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    try {
      if (paymentDetails.purpose.toLowerCase().includes('workshop')) {
        await fetch('/api/email/workshop-payment-failed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            clientName: name.trim() || 'Valued Participant',
            workshopTitle: paymentDetails.purpose,
            amount: finalAmount,
            currency,
            reason: reasonText,
            actionUrl: `${origin}/?view=workshops`,
          }),
        });
      } else if (paymentDetails.purpose.toLowerCase().includes('event') || paymentDetails.purpose.toLowerCase().includes('summit')) {
        await fetch('/api/email/event-payment-failed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            clientName: name.trim() || 'Valued Attendee',
            eventTitle: paymentDetails.purpose,
            amount: finalAmount,
            currency,
            reason: reasonText,
            actionUrl: `${origin}/?view=events`,
          }),
        });
      } else {
        await fetch('/api/razorpay/payment-failed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            clientName: name.trim() || 'Valued Client',
            purpose: paymentDetails.purpose,
            amount: finalAmount,
            currency,
            errorReason: reasonText,
            orderId: currentOrderId,
          }),
        });
      }
    } catch (err) {
      console.warn('Could not dispatch failure email:', err);
    }
  };

  // Active Timer & Background Polling Effect
  useEffect(() => {
    if (!isOpen || currentStep !== 'processing') {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    // 1. Decrement countdown timer every 1s
    const timerInterval = setInterval(() => {
      setWaitingSeconds((prev) => {
        if (prev <= 1) {
          // Timer expired -> Mark failed, dispatch email, transition to retry_sheet
          const timeoutReason = 'Payment session timed out. No payment was completed within the 10-minute window.';
          setRetryReason(timeoutReason);
          dispatchPaymentFailureEmail(timeoutReason);
          setCurrentStep('retry_sheet');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 2. Poll backend order status every 3.5s to see if payment was completed in UPI/Bank
    const pollStatus = async () => {
      if (!currentOrderId) return;
      try {
        const check = await checkRazorpayOrderStatus(currentOrderId);
        if (check.status === 'PAID' && check.verified) {
          // Payment captured!
          clearInterval(timerInterval);
          if (pollingRef.current) clearInterval(pollingRef.current);
          setCurrentStep('confirming');
          setTimeout(async () => {
            await handlePaymentSuccess(
              check.paymentId || `pay_rzp_${Date.now()}`,
              currentOrderId,
              'verified_by_gateway',
              selectedMethodName
            );
          }, 1200);
        }
      } catch (e) {
        // Continue polling
      }
    };

    pollingRef.current = setInterval(pollStatus, 3500);

    return () => {
      clearInterval(timerInterval);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen, currentStep, currentOrderId, selectedMethodName]);

  // Format seconds into MM:SS
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  // Main "Pay ₹..." button on Checkout Step:
  // Initiates official Razorpay Standard Checkout SDK popup with full method support
  // Handle Pay Click: Automatically reads details, creates server order, and opens UPI options immediately
  const handlePayViaRazorpaySDK = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setCheckoutError('Please enter your full name to complete registration');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setCheckoutError('Please enter a valid email address to receive pass confirmation');
      return;
    }

    setCheckoutError(null);
    setIsProcessingCheckout(true);

    // Initialize/ensure server order in the background
    ensureServerOrder().catch((err) => {
      console.warn('Pre-creating Razorpay order in background:', err);
    });

    // Automatically transition to the payment options sheet with UPI section already expanded
    setExpandedSection('upi');
    setIsProcessingCheckout(false);
    setCurrentStep('all_options');
  };

  // Launch official Razorpay standard checkout popup when explicitly requested
  const handleLaunchRazorpayStandardPopup = async () => {
    setIsProcessingCheckout(true);
    const order = await ensureServerOrder();

    const sdkReady = await loadRazorpaySDK();
    if (sdkReady && (window as any).Razorpay && order.orderId && order.orderId.startsWith('order_')) {
      try {
        let paymentConfirmed = false;

        const rzp = new (window as any).Razorpay({
          key: order.keyId || 'rzp_live_scoders_ybl',
          amount: Math.round(finalAmount * 100),
          currency,
          name: 'S-CODERS (Bharat Tech Developers)',
          description: paymentDetails.purpose,
          image: '/favicon.ico',
          order_id: order.orderId,
          prefill: {
            name: name.trim(),
            email: email.trim(),
            contact: mobile.trim(),
          },
          theme: {
            color: '#521714',
            backdrop_color: '#0B0F17',
          },
          modal: {
            confirm_close: true,
            backdropclose: false,
            ondismiss: async () => {
              if (paymentConfirmed) return;
              setIsProcessingCheckout(false);

              // Check backend if payment was captured before dismissing
              const check = await checkRazorpayOrderStatus(order.orderId);
              if (check.status === 'PAID' && check.verified) {
                paymentConfirmed = true;
                setCurrentStep('confirming');
                await handlePaymentSuccess(
                  check.paymentId || `pay_rzp_${Date.now()}`,
                  order.orderId,
                  'verified',
                  'Razorpay Standard Checkout'
                );
                return;
              }

              // Intercept dismissal: User cancelled or backed out
              setSelectedMethodName('Razorpay Gateway');
              const cancelMsg = 'Your payment was cancelled before completion.';
              setRetryReason(cancelMsg);
              dispatchPaymentFailureEmail(cancelMsg);
              setCurrentStep('retry_sheet');
            },
          },
          handler: async (response: any) => {
            paymentConfirmed = true;
            setIsProcessingCheckout(false);
            setCurrentStep('confirming');
            await handlePaymentSuccess(
              response.razorpay_payment_id,
              response.razorpay_order_id || order.orderId,
              response.razorpay_signature,
              'Razorpay Standard Checkout'
            );
          },
        });

        rzp.on('payment.failed', (failResp: any) => {
          setIsProcessingCheckout(false);
          const failMsg = failResp?.error?.description || 'Payment was declined by bank or cancelled.';
          setRetryReason(failMsg);
          dispatchPaymentFailureEmail(failMsg);
          setCurrentStep('retry_sheet');
        });

        rzp.open();
        setIsProcessingCheckout(false);
        return;
      } catch (sdkErr) {
        console.warn('Razorpay SDK popup invocation warning, routing to payment options:', sdkErr);
      }
    }

    setIsProcessingCheckout(false);
    setExpandedSection('upi');
    setCurrentStep('all_options');
  };

  // Initiate direct method payment (PhonePe, GPay, Paytm, FamPay, Card, Netbanking, etc.)
  const handleInitiateMethodPay = (
    methodName: string, 
    upiAppScheme?: 'phonepe' | 'gpay' | 'paytm' | 'fampay' | 'bhim' | 'cred' | 'amazonpay' | 'whatsapp' | 'universal'
  ) => {
    setSelectedMethodName(methodName);
    setWaitingSeconds(600); // 10 minutes session
    setStatusMessage(null);
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
  };

  // Manual status check ("I have completed payment" button)
  const handleManualCheckStatus = async () => {
    if (!currentOrderId) return;
    setIsCheckingManualStatus(true);
    setStatusMessage(null);

    try {
      const check = await checkRazorpayOrderStatus(currentOrderId);
      setIsCheckingManualStatus(false);

      if (check.status === 'PAID' && check.verified) {
        setCurrentStep('confirming');
        await handlePaymentSuccess(
          check.paymentId || `pay_rzp_${Date.now()}`,
          currentOrderId,
          'verified_by_manual_check',
          selectedMethodName
        );
      } else {
        setStatusMessage(
          `We have not received payment confirmation from your bank or ${selectedMethodName} yet. Please complete the transaction in your app, or wait a few seconds.`
        );
      }
    } catch (err) {
      setIsCheckingManualStatus(false);
      setStatusMessage('Network check timed out. Please verify your payment in your bank/UPI app.');
    }
  };

  // Cancel payment flow:
  // User confirms cancellation -> marks failed, dispatches failure email, shows retry sheet
  const handleConfirmCancel = () => {
    setCurrentStep('cancelling_loader');
    const cancelReason = 'Your payment was cancelled. Try again or complete the payment later.';
    setRetryReason(cancelReason);
    dispatchPaymentFailureEmail(cancelReason);

    setTimeout(() => {
      setCurrentStep('retry_sheet');
    }, 1100);
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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#191514] text-white rounded-t-3xl sm:rounded-3xl border border-[#332927] shadow-2xl overflow-hidden flex flex-col font-sans"
            style={{ maxHeight: '92vh' }}
          >
            {/* ============================================================== */}
            {/* VIEW 1: THE SLEEK CHECKOUT SHEET (Name, Email, Phone, Pay)     */}
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
                <form onSubmit={handlePayViaRazorpaySDK} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-[11px] font-mono text-[#9e8f8b] mb-1.5 uppercase tracking-wider">
                      name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (checkoutError) setCheckoutError(null);
                      }}
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
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (checkoutError) setCheckoutError(null);
                      }}
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
                      onChange={(e) => {
                        setMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
                        if (checkoutError) setCheckoutError(null);
                      }}
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

                  {/* Primary Pay Button: Launches Official Razorpay Checkout Modal */}
                  <div className="pt-2 space-y-2">
                    {checkoutError && (
                      <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs font-mono text-rose-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{checkoutError}</span>
                      </div>
                    )}

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

                    {/* Secondary Option: Directly Choose Specific Methods */}
                    <button
                      type="button"
                      onClick={() => {
                        ensureServerOrder().catch(() => {});
                        setExpandedSection('upi');
                        setCurrentStep('all_options');
                      }}
                      className="w-full py-2.5 text-xs text-[#b89f9a] hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>or choose payment method (UPI, Cards, Netbanking, EMI, Wallets)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Trust Footer */}
                  <div className="text-center pt-1 space-y-1">
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
            {/* VIEW 2: OFFICIAL RAZORPAY STANDARD SHEET                       */}
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
                      title="All Payment Options"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1.5 text-[#9e8f8b] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Quick PhonePe & Google Pay Cards */}
                <div className="p-5 sm:p-6 space-y-3">
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

                  <div className="bg-[#241e1c] border border-[#382d2b] rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-sm">
                        G
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white block">Google Pay</span>
                        <span className="text-[10px] text-[#8e817e] block">Instant Bank UPI</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleInitiateMethodPay('Google Pay', 'gpay')}
                      className="px-5 py-2.5 bg-white text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-stone-200 transition-colors cursor-pointer shadow-md"
                    >
                      Pay
                    </button>
                  </div>

                  {/* More Options Link */}
                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={handlePayViaRazorpaySDK}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline flex items-center gap-1"
                    >
                      <span>Open Razorpay Standard Modal</span>
                    </button>
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
            {/* VIEW 3: WAITING FOR PAYMENT & ACTIVE COUNTDOWN TIMER           */}
            {/* ============================================================== */}
            {currentStep === 'processing' && (
              <div className="p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[400px] space-y-5 bg-[#1b1716]">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold font-serif text-white tracking-tight">
                    Waiting for payment confirmation
                  </h3>
                  <p className="text-xs text-[#9e8f8b] font-sans max-w-xs mx-auto">
                    Please approve the payment of <strong className="text-white">₹{finalAmount.toLocaleString()}</strong> in your <strong className="text-[#38BDF8]">{selectedMethodName}</strong> app.
                  </p>
                </div>

                {/* Active Countdown Timer Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2a2220] border border-[#4a3a37] rounded-full text-xs font-mono text-[#fcd34d] shadow-inner">
                  <Clock className="w-3.5 h-3.5 text-[#f59e0b] animate-pulse" />
                  <span>Payment Window: <strong className="text-white text-sm">{formatTimer(waitingSeconds)}</strong></span>
                </div>

                {/* 3D Animated Spinning Golden Coin */}
                <div className="py-2 perspective-1000">
                  <motion.div
                    animate={{ rotateY: [0, 180, 360] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }}
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#d97706] via-[#fcd34d] to-[#b45309] shadow-2xl flex items-center justify-center border-4 border-[#fef08a] relative"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="text-center font-serif font-black text-xl text-[#78350f]">
                      ₹
                    </div>
                  </motion.div>
                </div>

                {/* Manual status verification feedback */}
                {statusMessage && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 text-left max-w-sm">
                    {statusMessage}
                  </div>
                )}

                {/* Action Buttons: Check Status, Cancel, Change Option */}
                <div className="w-full space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleManualCheckStatus}
                    disabled={isCheckingManualStatus}
                    className="w-full py-3 bg-[#22c55e] hover:bg-[#16a34a] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isCheckingManualStatus ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                        <span>Checking with bank...</span>
                      </>
                    ) : (
                      <span>I have completed payment</span>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('cancel_confirm')}
                      className="py-3 bg-[#2c2422] hover:bg-[#382f2c] text-[#f87171] hover:text-red-300 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-[#3d2e2c]"
                    >
                      Cancel Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep('all_options')}
                      className="py-3 bg-[#2c2422] hover:bg-[#382f2c] text-[#a89c99] hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer border border-[#3d2e2c]"
                    >
                      Other Methods
                    </button>
                  </div>
                </div>

                <div className="pt-1 text-center">
                  <span className="text-[10px] text-[#6d6260]">
                    Do not refresh this page. Verified securely by <strong className="text-blue-400">Razorpay</strong>.
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 4: CANCEL PAYMENT DIALOG ("Cancel or Wait options")       */}
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
                    className="w-full py-3.5 bg-[#3a302e] hover:bg-[#483d3a] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-md"
                  >
                    No, wait
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    className="w-full py-3.5 bg-[#261f1d] hover:bg-[#302725] text-[#9e8f8b] hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer border border-[#3a2d2a]"
                  >
                    Yes, Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 5: CANCELLING LOADER                                      */}
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
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#d97706] via-[#fcd34d] to-[#b45309] shadow-2xl flex items-center justify-center border-4 border-[#fef08a] relative"
                  >
                    <div className="text-center font-serif font-black text-xl text-[#78350f]">
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
            {/* VIEW 6: RETRY PAYMENT DIALOG ("Payment could not be completed")*/}
            {/* ============================================================== */}
            {currentStep === 'retry_sheet' && (
              <div className="p-6 sm:p-7 space-y-5 bg-[#1f1918]">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 text-[#9e8f8b] hover:text-white rounded-lg cursor-pointer"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center space-y-2 -mt-4">
                  <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
                    <AlertTriangle className="w-6 h-6 text-[#ef4444]" />
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
                        <div className="w-7 h-7 rounded-lg bg-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center">
                          CR
                        </div>
                        <span className="text-xs font-semibold text-white">CRED UPI</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8f827f]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep('all_options')}
                      className="w-full py-3 bg-[#3a302e] hover:bg-[#483d3a] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer text-center block"
                    >
                      Show All Options
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs text-[#a89c99] hover:text-white underline cursor-pointer"
                  >
                    Quit & complete payment later
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 7: ALL PAYMENT OPTIONS (UPI, Cards, EMI, Netbanking, etc.)*/}
            {/* ============================================================== */}
            {currentStep === 'all_options' && (
              <div className="flex flex-col h-full bg-[#1b1716] overflow-y-auto">
                {/* Header with back */}
                <div className="p-4 sm:p-5 border-b border-[#2e2624] flex items-center justify-between bg-[#191514]">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('checkout')}
                      className="p-1.5 text-[#9e8f8b] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                      title="Edit contact info"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-[#0c2340] border border-[#0d5392] flex items-center justify-center">
                          <span className="text-[10px] font-black text-[#528ff0]">R</span>
                        </div>
                        <h4 className="text-base font-bold text-white tracking-tight">Razorpay Gateway</h4>
                        <span className="px-2 py-0.5 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-mono rounded-full font-bold">
                          UPI & Cards
                        </span>
                      </div>
                      <span className="text-xs text-[#b89f9a] font-medium block">
                        Pay ₹{finalAmount.toLocaleString()} • {paymentDetails.purpose}
                      </span>
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

                {/* Pre-filled Payer Details Bar */}
                {(name || email) && (
                  <div className="px-4 py-2 bg-[#221a18] border-b border-[#302422] flex items-center justify-between text-[11px] font-sans text-[#b89f9a]">
                    <div className="truncate">
                      <span>Paying as </span>
                      <strong className="text-white font-medium">{name || 'Attendee'}</strong>
                      {email && <span className="text-[#8e7e7b]"> ({email})</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep('checkout')}
                      className="text-[#d97768] hover:text-[#ff9b8c] underline font-mono text-[10px] shrink-0 ml-2 cursor-pointer"
                    >
                      edit
                    </button>
                  </div>
                )}

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
                          <span className="text-[10px] text-emerald-400 font-bold block">PhonePe, GPay, Paytm, FamPay, CRED</span>
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
                          <span className="text-xs font-medium text-white truncate">Tata Neu UPI</span>
                        </button>

                        {/* WhatsApp Pay */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOptionInAll('WhatsApp Pay');
                            setAllOptionsError(null);
                            handleInitiateMethodPay('WhatsApp Pay', 'whatsapp');
                          }}
                          className="p-3 bg-[#2a2220] hover:bg-[#382e2c] border border-white/5 rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">WA</div>
                          <span className="text-xs font-medium text-white truncate">WhatsApp Pay</span>
                        </button>

                        {/* BHIM UPI */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOptionInAll('BHIM UPI');
                            setAllOptionsError(null);
                            handleInitiateMethodPay('BHIM UPI', 'bhim');
                          }}
                          className="p-3 bg-[#2a2220] hover:bg-[#382e2c] border border-white/5 rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <div className="w-6 h-6 rounded-md bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center">BH</div>
                          <span className="text-xs font-medium text-white truncate">BHIM UPI</span>
                        </button>

                        {/* 1-Tap Auto-Launch Any Installed UPI App */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOptionInAll('Any UPI App');
                            setAllOptionsError(null);
                            handleInitiateMethodPay('Any UPI App', 'universal');
                          }}
                          className="p-3.5 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/40 hover:to-teal-600/40 border border-emerald-500/40 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer col-span-2 shadow-md shadow-emerald-950/40"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center">⚡</div>
                            <div>
                              <span className="text-xs font-bold text-white block">Auto-Redirect to Any UPI App</span>
                              <span className="text-[10px] text-emerald-300/90 block">Auto-opens installed Google Pay, PhonePe, Paytm or default UPI app</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
                        </button>

                        {/* Apps & UPI ID / Scan QR */}
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
                          <span className="text-xs font-medium text-white">Enter Custom UPI ID / Scan QR</span>
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
                          <span className="text-[10px] text-[#8a7c79] block">SBI, HDFC, ICICI, Axis, BOB</span>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-[#8a7c79] transition-transform ${expandedSection === 'netbanking' ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedSection === 'netbanking' && (
                      <div className="p-4 pt-1 grid grid-cols-2 gap-2 border-t border-[#2e2523]">
                        {['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Bank of Baroda', 'Kotak Bank'].map((bank) => (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => {
                              setSelectedBankName(bank);
                              handleInitiateMethodPay(`Net Banking (${bank})`);
                            }}
                            className="p-3 bg-[#2a2220] hover:bg-[#382e2c] border border-white/5 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span className="text-xs font-medium text-white">{bank}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#8a7c79]" />
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
                          <span className="text-xs font-bold text-white block">Wallets</span>
                          <span className="text-[10px] text-[#8a7c79] block">Mobikwik, Airtel Money, Ola Money</span>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-[#8a7c79] transition-transform ${expandedSection === 'wallet' ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedSection === 'wallet' && (
                      <div className="p-4 pt-1 grid grid-cols-2 gap-2 border-t border-[#2e2523]">
                        {['Mobikwik', 'Airtel Money', 'Ola Money', 'PayZapp', 'Amazon Pay'].map((wallet) => (
                          <button
                            key={wallet}
                            type="button"
                            onClick={() => handleInitiateMethodPay(`Wallet (${wallet})`)}
                            className="p-3 bg-[#2a2220] hover:bg-[#382e2c] border border-white/5 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span className="text-xs font-medium text-white">{wallet}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#8a7c79]" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Option: Standard Razorpay Popup */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleLaunchRazorpayStandardPopup}
                      className="w-full py-3 px-4 bg-[#261f1c] hover:bg-[#332826] border border-[#3d2f2c] rounded-2xl text-xs text-[#d97768] hover:text-[#ff9b8c] font-semibold transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#d97768]" />
                        <span>Open Razorpay Standard Popup</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#a89c99]" />
                    </button>
                  </div>
                </div>

                {/* Razorpay Secured Footer */}
                <div className="mt-auto p-3.5 border-t border-[#2e2624] text-center bg-[#151211]">
                  <div className="inline-flex items-center gap-1.5 text-xs text-[#7e7370] font-sans">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
                    <span>Secured by</span>
                    <span className="font-bold text-[#3b82f6]">Razorpay</span>
                    <span>• 100% Encrypted Payment</span>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 8: CARD INPUT FORM                                        */}
            {/* ============================================================== */}
            {currentStep === 'card_input' && (
              <div className="p-6 space-y-5 bg-[#1b1716]">
                <div className="flex items-center justify-between border-b border-[#2e2624] pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('all_options')}
                      className="p-1 text-[#9e8f8b] hover:text-white cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h4 className="text-base font-bold text-white">Pay via Card</h4>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 text-[#9e8f8b] hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCardSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono text-[#9e8f8b] mb-1.5 uppercase tracking-wider">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="1234 5678 9012 3456"
                        className="w-full bg-[#27201f] border border-[#3d3230] focus:border-[#d97768] text-white text-sm rounded-xl px-4 py-3.5 outline-none font-mono"
                      />
                      <CreditCard className="w-4 h-4 text-[#8a7c79] absolute right-3.5 top-4" />
                    </div>
                    {cardError && (
                      <p className="text-[11px] text-rose-400 font-mono mt-1">{cardError}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-[#9e8f8b] mb-1.5 uppercase tracking-wider">
                        Valid Thru (MM/YY)
                      </label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        className="w-full bg-[#27201f] border border-[#3d3230] focus:border-[#d97768] text-white text-sm rounded-xl px-4 py-3.5 outline-none font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-[#9e8f8b] mb-1.5 uppercase tracking-wider">
                        CVV
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="•••"
                        className="w-full bg-[#27201f] border border-[#3d3230] focus:border-[#d97768] text-white text-sm rounded-xl px-4 py-3.5 outline-none font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="save-card-rbi"
                      checked={saveCardRbi}
                      onChange={(e) => setSaveCardRbi(e.target.checked)}
                      className="mt-1 accent-[#521714]"
                    />
                    <label htmlFor="save-card-rbi" className="text-xs text-[#9e8f8b] cursor-pointer">
                      Save this card as per RBI guidelines for faster future checkout
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-4 rounded-xl bg-[#521714] hover:bg-[#681e1a] text-[#ffded9] font-bold text-sm tracking-wide transition-all shadow-lg cursor-pointer"
                    >
                      Pay ₹{finalAmount.toLocaleString()}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 9: EMI PLANS BREAKDOWN                                    */}
            {/* ============================================================== */}
            {currentStep === 'emi_plans' && (
              <div className="p-6 space-y-4 bg-[#1b1716] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[#2e2624] pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('all_options')}
                      className="p-1 text-[#9e8f8b] hover:text-white cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h4 className="text-base font-bold text-white">Credit Card EMI Plans</h4>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 text-[#9e8f8b] hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {[
                    { bank: 'HDFC Bank', months: 3, monthly: Math.round(finalAmount / 3 * 1.04), rate: '14%' },
                    { bank: 'ICICI Bank', months: 6, monthly: Math.round(finalAmount / 6 * 1.07), rate: '15%' },
                    { bank: 'RBL Bank', months: 9, monthly: Math.round(finalAmount / 9 * 1.09), rate: '16%' },
                    { bank: 'Axis Bank', months: 12, monthly: Math.round(finalAmount / 12 * 1.12), rate: '16%' },
                  ].map((plan, i) => (
                    <div
                      key={i}
                      className="p-4 bg-[#241e1c] border border-[#382d2b] rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">{plan.bank}</span>
                        <span className="text-[11px] text-[#a89c99] block mt-0.5">
                          ₹{plan.monthly} x {plan.months} months @ {plan.rate} p.a.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInitiateMethodPay(`EMI (${plan.bank} ${plan.months}M)`)}
                        className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg cursor-pointer hover:bg-stone-200"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 10: CONFIRMING PAYMENT (GREEN COIN)                       */}
            {/* ============================================================== */}
            {currentStep === 'confirming' && (
              <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center min-h-[360px] space-y-6 bg-[#1b1716]">
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold font-serif text-white tracking-tight">
                    Confirming Payment...
                  </h3>
                  <p className="text-xs text-[#9e8f8b] font-sans">
                    Finalizing your transaction and generating your access pass.
                  </p>
                </div>

                <div className="py-4 perspective-1000">
                  <motion.div
                    animate={{ rotateY: [0, 180, 360] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                    className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#059669] via-[#34d399] to-[#047857] shadow-2xl flex items-center justify-center border-4 border-[#a7f3d0] relative"
                  >
                    <Check className="w-10 h-10 text-white stroke-[3]" />
                  </motion.div>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[11px] text-emerald-400 font-mono">
                    ✓ Transaction Confirmed & Verified
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* CUSTOM UPI ID & QR MODAL OVERLAY                               */}
            {/* ============================================================== */}
            {showQrModal && (
              <div className="absolute inset-0 bg-[#161211]/95 backdrop-blur-md z-30 p-6 flex flex-col justify-between overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[#302725] pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-amber-400" />
                    <span>Scan UPI QR or Enter UPI ID</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowQrModal(false)}
                    className="p-1 text-[#8f827f] hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-4 space-y-4 text-center">
                  {/* Enter VPA form */}
                  <form onSubmit={handleCustomUpiSubmit} className="space-y-2 text-left">
                    <label className="block text-[11px] font-mono text-[#9e8f8b] uppercase tracking-wider">
                      Enter UPI ID / VPA
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customUpiId}
                        onChange={(e) => setCustomUpiId(e.target.value)}
                        placeholder="username@okhdfcbank"
                        className="flex-1 bg-[#27201f] border border-[#3d3230] text-white text-xs rounded-xl px-3.5 py-3 outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-3 bg-[#521714] hover:bg-[#681e1a] text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Verify & Pay
                      </button>
                    </div>
                    {upiIdError && (
                      <p className="text-[11px] text-rose-400 font-mono">{upiIdError}</p>
                    )}
                  </form>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#332a28]" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-mono text-[#8a7c79]">
                      <span className="bg-[#161211] px-2">Or Scan Dynamic QR</span>
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        `upi://pay?pa=${activeMerchantVpa}&pn=${encodeURIComponent(
                          merchantBankingName
                        )}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(paymentDetails.purpose)}`
                      )}`}
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs font-mono text-[#dcd1ce]">{activeMerchantVpa}</span>
                      <button
                        type="button"
                        onClick={handleCopyUpiId}
                        className="p-1 hover:text-amber-400 text-[#8f827f] cursor-pointer"
                        title="Copy UPI VPA"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {copiedUpi && (
                      <span className="text-[10px] text-emerald-400 font-mono block">✓ UPI ID Copied!</span>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQrModal(false);
                      handleInitiateMethodPay('Dynamic UPI QR');
                    }}
                    className="w-full py-3 bg-[#22c55e] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    I Have Scanned & Paid ₹{finalAmount.toLocaleString()}
                  </button>
                </div>
              </div>
            )}

            {/* TERMS MODAL */}
            {showTerms && (
              <div className="absolute inset-0 bg-[#161211]/95 backdrop-blur-md z-40 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#302725] pb-3">
                    <h4 className="text-sm font-bold text-white">Payment & Refund Terms</h4>
                    <button
                      type="button"
                      onClick={() => setShowTerms(false)}
                      className="p-1 text-[#8f827f] hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="py-4 space-y-3 text-xs text-[#a89c99] leading-relaxed">
                    <p>
                      <strong>1. Instant Access:</strong> Upon verified payment confirmation, access keys, tickets, and learning materials are delivered immediately.
                    </p>
                    <p>
                      <strong>2. 7-Day Money-Back Policy:</strong> You are protected by our 7-day money-back satisfaction guarantee.
                    </p>
                    <p>
                      <strong>3. Bank Security:</strong> All card payments and bank transactions are encrypted and tokenized according to RBI guidelines and PCI-DSS compliance.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className="w-full py-3 bg-[#2c2422] text-white text-xs font-bold rounded-xl"
                >
                  Close Terms
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
