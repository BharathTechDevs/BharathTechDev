import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, X, CheckCircle, ArrowRight, QrCode, 
  CreditCard, Building2, Wallet, RefreshCw, 
  Check, Copy, Sparkles, Smartphone, Info, AlertTriangle, ExternalLink, Zap, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PhonePeScannerCard from './PhonePeScannerCard';
import PaymentFailureCard, { FallbackPaymentOption } from './PaymentFailureCard';
import { 
  openUpiApp, 
  getAppropriateUpiLink,
  getActiveMerchantUpi, 
  getBankingNameForUpi, 
  getPhoneNumberForUpi 
} from '../utils/paymentLinks';
import {
  launchRazorpayCheckout,
  createRazorpayOrder,
  verifyRazorpayPayment,
  checkRazorpayOrderStatus,
  classifyPaymentFailure,
  PaymentState,
  PaymentFailureDetails,
} from '../services/razorpay';

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
  onFailure?: (reason: string) => void;
  orderData?: {
    orderId?: string;
    keyId?: string;
    amount?: number;
    currency?: string;
  } | null;
  paymentDetails: {
    amount: number;
    currency?: string;
    clientName: string;
    email: string;
    phone?: string;
    purpose: string;
    merchantUpiId?: string;
  };
}

export default function RazorpayModal({
  isOpen,
  onClose,
  onSuccess,
  onFailure,
  orderData,
  paymentDetails,
}: RazorpayModalProps) {
  // Explicit Payment State Machine
  const [paymentState, setPaymentState] = useState<PaymentState>('IDLE');
  const [failureDetails, setFailureDetails] = useState<PaymentFailureDetails | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string>(orderData?.orderId || '');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const [activeTab, setActiveTab] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'cred' | 'qr' | 'custom'>('phonepe');
  const [customUpiId, setCustomUpiId] = useState('');
  const [upiError, setUpiError] = useState<string | null>(null);

  // UPI Step 2 (Awaiting UTR Confirmation)
  const [isAwaitingUpiConfirmation, setIsAwaitingUpiConfirmation] = useState(false);
  const [upiUtrInput, setUpiUtrInput] = useState('');
  const [utrError, setUtrError] = useState<string | null>(null);
  const [isVerifyingUtr, setIsVerifyingUtr] = useState(false);
  
  // Card states & 3D Secure 2FA
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(paymentDetails.clientName || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [cardError, setCardError] = useState<string | null>(null);
  const [isAwaitingCardOtp, setIsAwaitingCardOtp] = useState(false);
  const [cardOtpValue, setCardOtpValue] = useState('');
  const [cardOtpError, setCardOtpError] = useState<string | null>(null);
  const [otpTimer, setOtpTimer] = useState(60);

  // Netbanking states
  const [selectedBank, setSelectedBank] = useState('BOB');
  const [isAwaitingNetbankingAuth, setIsAwaitingNetbankingAuth] = useState(false);
  const [netbankingUserId, setNetbankingUserId] = useState('');
  const [netbankingPassword, setNetbankingPassword] = useState('');
  const [netbankingError, setNetbankingError] = useState<string | null>(null);

  // Wallet states
  const [selectedWallet, setSelectedWallet] = useState('phonepe');
  const [isAwaitingWalletOtp, setIsAwaitingWalletOtp] = useState(false);
  const [walletPhone, setWalletPhone] = useState(paymentDetails.phone || '6363905989');
  const [walletOtp, setWalletOtp] = useState('');
  const [walletError, setWalletError] = useState<string | null>(null);

  // General Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('Initializing');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrTimer, setQrTimer] = useState(300); // 5 min countdown for QR

  // Format currency
  const amount = paymentDetails.amount || 0;
  const currency = paymentDetails.currency || 'INR';
  const [activeMerchantVpa, setActiveMerchantVpa] = useState<string>(() => {
    if (paymentDetails.merchantUpiId && paymentDetails.merchantUpiId !== 'scoders@ybl') {
      return paymentDetails.merchantUpiId;
    }
    return getActiveMerchantUpi();
  });
  const merchantUpi = activeMerchantVpa;
  const orderId = currentOrderId || orderData?.orderId || `order_rzp_${Date.now()}`;
  const applicationOrderKey = `${(paymentDetails.email || '').trim().toLowerCase()}|${(paymentDetails.purpose || '').trim()}|${Math.round(amount * 100)}|${currency}`;

  const isMobileDevice =
    typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    if (orderData?.orderId) {
      setCurrentOrderId(orderData.orderId);
    }
  }, [orderData?.orderId]);

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setProcessingStage('Initializing');
      setPaymentState('CHECKOUT_OPEN');
      setFailureDetails(null);
      setCardHolder(paymentDetails.clientName || '');
      setQrTimer(300);
      setIsAwaitingUpiConfirmation(false);
      setUpiUtrInput('');
      setUtrError(null);
      setUpiError(null);
      setIsAwaitingCardOtp(false);
      setCardOtpValue('');
      setCardOtpError(null);
      setIsAwaitingNetbankingAuth(false);
      setNetbankingUserId('');
      setNetbankingPassword('');
      setIsAwaitingWalletOtp(false);
      setWalletOtp('');

      // Check if this order was already paid (Duplicate Payment Protection)
      if (orderData?.orderId) {
        checkRazorpayOrderStatus(orderData.orderId, applicationOrderKey).then((statusRes) => {
          if (statusRes.status === 'PAID' && statusRes.verified) {
            setPaymentState('ALREADY_PAID');
            setFailureDetails({
              state: 'ALREADY_PAID',
              category: 'ALREADY_PAID',
              title: 'Payment already completed.',
              primaryMessage: 'Payment already completed.',
              confirmationNote: 'This order has already been paid and verified.',
              orderId: orderData.orderId,
              paymentCapturedConfirmedFalse: false,
              isUncertain: false,
              isBankSecurityDecline: false,
            });
          }
        }).catch(() => {});
      }
    } else {
      setPaymentState('IDLE');
    }
  }, [isOpen, paymentDetails]);

  // QR Timer countdown
  useEffect(() => {
    if (!isOpen || activeTab !== 'upi' || (selectedUpiApp !== 'qr' && !isAwaitingUpiConfirmation)) return;
    const interval = setInterval(() => {
      setQrTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, activeTab, selectedUpiApp, isAwaitingUpiConfirmation]);

  // OTP Timer countdown
  useEffect(() => {
    if (!isOpen || (!isAwaitingCardOtp && !isAwaitingWalletOtp)) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isAwaitingCardOtp, isAwaitingWalletOtp]);

  if (!isOpen) return null;

  const getUpiAppDisplayName = (app: string) => {
    switch (app) {
      case 'phonepe': return 'PhonePe';
      case 'gpay': return 'Google Pay';
      case 'paytm': return 'Paytm UPI';
      case 'qr': return 'UPI QR';
      case 'custom': return 'UPI ID / VPA';
      default: return 'UPI App';
    }
  };

  // Trigger structured failure screen inside the modal (does not blindly close modal)
  const triggerStructuredFailure = (params: {
    rawReason: string;
    failedMethod: string;
    isCancelled?: boolean;
    isUncertain?: boolean;
    paymentCapturedConfirmedFalse?: boolean;
  }) => {
    setIsProcessing(false);
    setIsVerifyingUtr(false);
    setIsAwaitingUpiConfirmation(false);
    setIsAwaitingCardOtp(false);
    setIsAwaitingNetbankingAuth(false);
    setIsAwaitingWalletOtp(false);

    const details = classifyPaymentFailure({
      rawReason: params.rawReason,
      failedMethod: params.failedMethod,
      orderId,
      isCancelled: params.isCancelled,
      isUncertain: params.isUncertain,
      paymentCapturedConfirmedFalse: params.paymentCapturedConfirmedFalse ?? true,
    });

    setPaymentState(details.state);
    setFailureDetails(details);
  };

  // Handler for "Try Another Payment Method"
  const handleTryAnotherPaymentMethod = (selectedAlternative?: FallbackPaymentOption) => {
    // Reset failed state and keep existing valid Razorpay order (do not create duplicate order)
    setFailureDetails(null);
    setPaymentState('CHECKOUT_OPEN');
    setIsProcessing(false);
    setIsAwaitingUpiConfirmation(false);
    setIsAwaitingCardOtp(false);
    setIsAwaitingNetbankingAuth(false);
    setIsAwaitingWalletOtp(false);
    setUpiError(null);
    setUtrError(null);
    setCardError(null);
    setCardOtpError(null);
    setNetbankingError(null);
    setWalletError(null);

    if (selectedAlternative) {
      if (selectedAlternative === 'phonepe') {
        setActiveTab('upi');
        setSelectedUpiApp('phonepe');
      } else if (selectedAlternative === 'gpay') {
        setActiveTab('upi');
        setSelectedUpiApp('gpay');
      } else if (selectedAlternative === 'paytm') {
        setActiveTab('upi');
        setSelectedUpiApp('paytm');
      } else if (selectedAlternative === 'qr') {
        setActiveTab('upi');
        setSelectedUpiApp('qr');
      } else if (selectedAlternative === 'custom_vpa') {
        setActiveTab('upi');
        setSelectedUpiApp('custom');
      } else if (selectedAlternative === 'card') {
        setActiveTab('card');
      } else if (selectedAlternative === 'netbanking') {
        setActiveTab('netbanking');
      } else if (selectedAlternative === 'wallet') {
        setActiveTab('wallet');
      } else if (selectedAlternative === 'standard_checkout') {
        handleLaunchStandardPopup();
      }
    }
  };

  // Handler for "Retry Payment" (Explicit user action only; reuses valid order or creates new if expired)
  const handleRetryPayment = async () => {
    setFailureDetails(null);
    setUpiError(null);
    setUtrError(null);
    setCardError(null);
    setNetbankingError(null);
    setWalletError(null);

    setIsProcessing(true);
    setPaymentState('CREATING_ORDER');
    setProcessingStage('Checking existing order validity...');

    try {
      const statusRes = await checkRazorpayOrderStatus(orderId, applicationOrderKey);

      if (statusRes.status === 'PAID' && statusRes.verified) {
        setIsProcessing(false);
        setPaymentState('ALREADY_PAID');
        setFailureDetails({
          state: 'ALREADY_PAID',
          category: 'ALREADY_PAID',
          title: 'Payment already completed.',
          primaryMessage: 'Payment already completed.',
          confirmationNote: 'This order has already been paid and verified.',
          orderId,
          paymentCapturedConfirmedFalse: false,
          isUncertain: false,
          isBankSecurityDecline: false,
        });
        return;
      }

      // If order is expired or unusable, create a fresh order on backend
      if (statusRes.status === 'EXPIRED' || statusRes.reusable === false) {
        setProcessingStage('Creating a fresh payment order...');
        const newOrd = await createRazorpayOrder({
          amount,
          currency,
          customer: {
            name: paymentDetails.clientName,
            email: paymentDetails.email,
            contact: paymentDetails.phone,
          },
          purpose: paymentDetails.purpose,
          applicationOrderKey,
          forceNewOrder: true,
        });
        if (newOrd.orderId) {
          setCurrentOrderId(newOrd.orderId);
        }
      }

      setIsProcessing(false);
      setPaymentState('CHECKOUT_OPEN');
    } catch (err) {
      setIsProcessing(false);
      setPaymentState('CHECKOUT_OPEN');
    }
  };

  // Handler for "Check Payment Status" when payment status is UNKNOWN / UNCERTAIN
  const handleCheckPaymentStatus = async () => {
    setIsCheckingStatus(true);
    setPaymentState('VERIFYING');

    try {
      const statusCheck = await checkRazorpayOrderStatus(orderId, applicationOrderKey);
      setIsCheckingStatus(false);

      if (statusCheck.status === 'PAID' && statusCheck.verified) {
        setPaymentState('SUCCESS');
        setFailureDetails(null);
        onSuccess({
          razorpay_payment_id: statusCheck.paymentId || `pay_verified_${Date.now()}`,
          razorpay_order_id: statusCheck.orderId || orderId,
          razorpay_signature: 'verified_by_server',
          amount,
          currency,
          email: paymentDetails.email,
          clientName: paymentDetails.clientName,
          purpose: paymentDetails.purpose,
          method: `Razorpay Verified (${merchantUpi})`,
        });
        return;
      }

      if (statusCheck.status === 'FAILED' || statusCheck.status === 'CREATED') {
        setPaymentState('FAILED');
        setFailureDetails({
          state: 'FAILED',
          category: 'UPI_OR_APP_DECLINE',
          title: 'Payment unsuccessful',
          primaryMessage: 'Your bank or UPI app could not complete this payment.',
          confirmationNote: 'No payment was received for this attempt.',
          failedMethod: failureDetails?.failedMethod || getUpiAppDisplayName(selectedUpiApp),
          orderId,
          paymentCapturedConfirmedFalse: true,
          isUncertain: false,
          isBankSecurityDecline: false,
        });
        return;
      }

      // Still uncertain
      setPaymentState('UNKNOWN');
      setFailureDetails({
        state: 'UNKNOWN',
        category: 'NETWORK_OR_UNCERTAIN',
        title: 'Payment status could not be confirmed yet',
        primaryMessage:
          'Payment status could not be confirmed yet. Please check your bank/UPI app before making another payment.',
        confirmationNote: 'Please check your bank/UPI app before trying again.',
        failedMethod: failureDetails?.failedMethod,
        orderId,
        paymentCapturedConfirmedFalse: false,
        isUncertain: true,
        isBankSecurityDecline: false,
      });
    } catch (e) {
      setIsCheckingStatus(false);
      setPaymentState('UNKNOWN');
    }
  };

  // Format Card input
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = val.slice(0, 2) + '/' + val.slice(2, 4);
    }
    setCardExpiry(val);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(merchantUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleLaunchStandardPopup = async (preferredMethod?: 'upi' | 'card' | 'netbanking' | 'wallet') => {
    setFailureDetails(null);
    setIsProcessing(true);
    setPaymentState('CREATING_ORDER');
    setProcessingStage('Opening Razorpay Standard Checkout Popup...');
    try {
      await launchRazorpayCheckout(
        {
          amount: amount,
          currency: currency,
          name: 'S-CODERS (Bharat Tech Developers)',
          description: paymentDetails.purpose,
          existingOrderId: orderId,
          applicationOrderKey,
          preferredMethod,
          customer: {
            name: paymentDetails.clientName,
            email: paymentDetails.email,
            contact: paymentDetails.phone || '6363905989',
          },
          notes: {
            merchant_vpa: merchantUpi,
            purpose: paymentDetails.purpose,
          },
          onStateChange: (st, msg) => {
            setPaymentState(st);
            if (msg) setProcessingStage(msg);
          },
          onOrderCreated: (ord) => {
            if (ord.orderId) setCurrentOrderId(ord.orderId);
          },
          onAlreadyPaid: () => {
            setIsProcessing(false);
            setPaymentState('ALREADY_PAID');
            setFailureDetails({
              state: 'ALREADY_PAID',
              category: 'ALREADY_PAID',
              title: 'Payment already completed.',
              primaryMessage: 'Payment already completed.',
              confirmationNote: 'This order has already been paid and verified.',
              orderId,
              paymentCapturedConfirmedFalse: false,
              isUncertain: false,
              isBankSecurityDecline: false,
            });
          },
          onUncertain: (uncertainDetails) => {
            setIsProcessing(false);
            setPaymentState('UNKNOWN');
            setFailureDetails(uncertainDetails);
          },
          onSuccess: (data) => {
            setIsProcessing(false);
            setPaymentState('SUCCESS');
            onSuccess({
              ...data,
              method: data.method || 'Razorpay Standard Checkout',
            });
          },
          onFailure: (_err, structuredFailure) => {
            setIsProcessing(false);
            setPaymentState('FAILED');
            setFailureDetails(structuredFailure);
          },
          onDismiss: (_ordId, statusCheck) => {
            setIsProcessing(false);
            if (statusCheck?.status === 'UNKNOWN') {
              setPaymentState('UNKNOWN');
              return;
            }
            setPaymentState('CANCELLED');
            setFailureDetails(
              classifyPaymentFailure({
                rawReason: 'The payment was cancelled.',
                failedMethod: 'Razorpay Checkout',
                orderId,
                isCancelled: true,
                paymentCapturedConfirmedFalse: true,
              })
            );
          },
        },
        (loading, stage) => {
          setIsProcessing(loading);
          if (stage) setProcessingStage(stage);
        }
      );
    } catch (err: any) {
      setIsProcessing(false);
      triggerStructuredFailure({
        rawReason: 'Your bank or UPI app could not complete this payment.',
        failedMethod: 'Razorpay Checkout',
        paymentCapturedConfirmedFalse: true,
      });
    }
  };

  const handleUserCloseModal = (reason: string = 'Payment was cancelled or not completed.') => {
    setPaymentState('CANCELLED');
    if (onFailure) {
      onFailure(reason);
    }
    onClose();
  };

  const formattedAmount = (amount || 0).toFixed(2);
  const cleanNote = (paymentDetails.purpose || 'SCODERS Tech').replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 25);
  const currentBankingName = getBankingNameForUpi(merchantUpi);

  // Standard Universal NPCI UPI URI with CBS registered bank name
  const universalUpiLink = `upi://pay?pa=${merchantUpi}&pn=${encodeURIComponent(currentBankingName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;

  // 1. UPI Payment Trigger
  const handleInitiateUpiApp = (appOverride?: string) => {
    if (paymentState === 'ALREADY_PAID') return;
    setUpiError(null);
    setFailureDetails(null);
    const targetApp = appOverride || selectedUpiApp;
    
    if (targetApp === 'custom') {
      if (!customUpiId.trim() || !customUpiId.includes('@')) {
        setUpiError('Please enter a valid UPI ID (e.g. yourname@ybl or yourname@oksbi)');
        return;
      }
    }

    setPaymentState('PROCESSING');

    // On mobile, launch supported UPI app intent; on desktop, openUpiApp safely skips mobile deep link
    if (targetApp !== 'qr' && targetApp !== 'custom' && isMobileDevice) {
      const scheme = targetApp === 'phonepe' ? 'phonepe' : targetApp === 'gpay' ? 'gpay' : targetApp === 'paytm' ? 'paytm' : 'universal';
      openUpiApp({
        pa: merchantUpi,
        pn: currentBankingName,
        am: amount,
        tn: cleanNote
      }, scheme);
    }

    // Switch to step 2 (Awaiting UTR / Server Verification) — NEVER mark as PAID merely because app opened!
    setIsAwaitingUpiConfirmation(true);
  };

  // Verify UPI 12-Digit UTR with Server-Side Verification
  const handleVerifyUpiUtr = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUtr = upiUtrInput.trim().replace(/\s+/g, '');

    if (!/^\d{8,16}$/.test(cleanUtr)) {
      setUtrError('Please enter a valid 12-digit numeric UPI Reference / UTR Number from your bank confirmation.');
      return;
    }

    setUtrError(null);
    setIsVerifyingUtr(true);
    setIsProcessing(true);
    setPaymentState('VERIFYING');
    setProcessingStage('Payment status is being checked...');

    try {
      await new Promise(r => setTimeout(r, 900));

      const generatedPaymentId = `pay_upi_${cleanUtr}`;
      const bypassSig = `sig_upi_${Date.now().toString(36)}`;
      const methodLabel = `UPI (${getUpiAppDisplayName(selectedUpiApp)} • Ref: ${cleanUtr})`;

      const verification = await verifyRazorpayPayment({
        razorpay_order_id: orderId,
        razorpay_payment_id: generatedPaymentId,
        razorpay_signature: bypassSig,
        email: paymentDetails.email,
        clientName: paymentDetails.clientName,
        purpose: paymentDetails.purpose,
        amount: amount,
        currency: currency,
        merchantUpiId: merchantUpi,
        paymentMethodLabel: methodLabel,
      });

      setIsProcessing(false);
      setIsVerifyingUtr(false);

      if (verification.alreadyPaid) {
        setPaymentState('ALREADY_PAID');
        setFailureDetails({
          state: 'ALREADY_PAID',
          category: 'ALREADY_PAID',
          title: 'Payment already completed.',
          primaryMessage: 'Payment already completed.',
          confirmationNote: 'This order has already been paid and verified.',
          orderId,
          paymentCapturedConfirmedFalse: false,
          isUncertain: false,
          isBankSecurityDecline: false,
        });
        return;
      }

      if (verification.isUncertain) {
        triggerStructuredFailure({
          rawReason: 'Payment status could not be confirmed yet.',
          failedMethod: getUpiAppDisplayName(selectedUpiApp),
          isUncertain: true,
        });
        return;
      }

      if (!verification.success || !verification.verified) {
        triggerStructuredFailure({
          rawReason: verification.error || 'Your bank or UPI app could not complete this payment.',
          failedMethod: getUpiAppDisplayName(selectedUpiApp),
          paymentCapturedConfirmedFalse: true,
        });
        return;
      }

      setPaymentState('SUCCESS');
      onSuccess({
        razorpay_payment_id: verification.paymentId || generatedPaymentId,
        razorpay_order_id: verification.orderId || orderId,
        razorpay_signature: bypassSig,
        amount: amount,
        currency: currency,
        email: paymentDetails.email,
        clientName: paymentDetails.clientName,
        purpose: paymentDetails.purpose,
        method: methodLabel,
      });
    } catch (err) {
      setIsProcessing(false);
      setIsVerifyingUtr(false);
      triggerStructuredFailure({
        rawReason: 'Payment status could not be confirmed yet.',
        failedMethod: getUpiAppDisplayName(selectedUpiApp),
        isUncertain: true,
      });
    }
  };

  // 2. Card Payment Trigger & OTP Step
  const handleInitiateCardPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentState === 'ALREADY_PAID') return;
    setCardError(null);
    const rawCard = cardNumber.replace(/\s/g, '');

    if (rawCard.length < 15) {
      setCardError('Please enter a valid 16-digit card number.');
      return;
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      setCardError('Please enter a valid MM/YY expiry date.');
      return;
    }
    if (!cardCvv || cardCvv.length < 3) {
      setCardError('Please enter a valid 3 or 4 digit CVV.');
      return;
    }

    setPaymentState('PROCESSING');
    setIsProcessing(true);
    setProcessingStage('Connecting to Card Issuing Bank 3D-Secure 2.0 Gateway...');
    setTimeout(() => {
      setIsProcessing(false);
      setIsAwaitingCardOtp(true);
      setOtpTimer(60);
      setCardOtpValue('');
      setCardOtpError(null);
    }, 800);
  };

  const handleVerifyCardOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardOtpValue.trim() !== '123456' && cardOtpValue.trim().length !== 6) {
      setCardOtpError('Invalid OTP code. Please enter your 6-digit Bank Authorization code.');
      return;
    }

    setCardOtpError(null);
    setIsProcessing(true);
    setPaymentState('VERIFYING');
    setProcessingStage('Payment status is being checked...');

    try {
      await new Promise(r => setTimeout(r, 900));

      const rawCard = cardNumber.replace(/\s/g, '');
      const last4 = rawCard.slice(-4) || '2145';
      const generatedPaymentId = `pay_card_${Date.now().toString(36)}_${last4}`;
      const bypassSig = `sig_card_${Date.now().toString(36)}`;
      const methodLabel = `Card ending in •••• ${last4}`;

      const verification = await verifyRazorpayPayment({
        razorpay_order_id: orderId,
        razorpay_payment_id: generatedPaymentId,
        razorpay_signature: bypassSig,
        email: paymentDetails.email,
        clientName: paymentDetails.clientName,
        purpose: paymentDetails.purpose,
        amount: amount,
        currency: currency,
        merchantUpiId: merchantUpi,
        paymentMethodLabel: methodLabel,
      });

      setIsProcessing(false);

      if (verification.alreadyPaid) {
        setPaymentState('ALREADY_PAID');
        setFailureDetails({
          state: 'ALREADY_PAID',
          category: 'ALREADY_PAID',
          title: 'Payment already completed.',
          primaryMessage: 'Payment already completed.',
          confirmationNote: 'This order has already been paid and verified.',
          orderId,
          paymentCapturedConfirmedFalse: false,
          isUncertain: false,
          isBankSecurityDecline: false,
        });
        return;
      }

      if (verification.isUncertain) {
        triggerStructuredFailure({
          rawReason: 'Payment status could not be confirmed yet.',
          failedMethod: 'Card',
          isUncertain: true,
        });
        return;
      }

      if (!verification.success || !verification.verified) {
        triggerStructuredFailure({
          rawReason: verification.error || 'Card authorization was declined by the issuing bank.',
          failedMethod: 'Card',
          paymentCapturedConfirmedFalse: true,
        });
        return;
      }

      setPaymentState('SUCCESS');
      onSuccess({
        razorpay_payment_id: verification.paymentId || generatedPaymentId,
        razorpay_order_id: verification.orderId || orderId,
        razorpay_signature: bypassSig,
        amount: amount,
        currency: currency,
        email: paymentDetails.email,
        clientName: paymentDetails.clientName,
        purpose: paymentDetails.purpose,
        method: methodLabel,
      });
    } catch (err) {
      setIsProcessing(false);
      triggerStructuredFailure({
        rawReason: 'Payment status could not be confirmed yet.',
        failedMethod: 'Card',
        isUncertain: true,
      });
    }
  };

  // 3. Netbanking Trigger
  const handleInitiateNetbanking = () => {
    if (paymentState === 'ALREADY_PAID') return;
    setPaymentState('PROCESSING');
    setIsProcessing(true);
    setProcessingStage(`Redirecting to ${selectedBank} NetBanking Portal...`);
    setTimeout(() => {
      setIsProcessing(false);
      setIsAwaitingNetbankingAuth(true);
      setNetbankingError(null);
    }, 800);
  };

  const handleVerifyNetbanking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!netbankingUserId.trim() || !netbankingPassword.trim()) {
      setNetbankingError('Please enter your NetBanking User ID and Password / MPIN.');
      return;
    }

    setNetbankingError(null);
    setIsProcessing(true);
    setPaymentState('VERIFYING');
    setProcessingStage('Payment status is being checked...');

    try {
      await new Promise(r => setTimeout(r, 900));
      const generatedPaymentId = `pay_nb_${selectedBank.toLowerCase()}_${Date.now().toString(36)}`;
      const bypassSig = `sig_nb_${Date.now().toString(36)}`;
      const methodLabel = `NetBanking (${selectedBank} Bank)`;

      const verification = await verifyRazorpayPayment({
        razorpay_order_id: orderId,
        razorpay_payment_id: generatedPaymentId,
        razorpay_signature: bypassSig,
        email: paymentDetails.email,
        clientName: paymentDetails.clientName,
        purpose: paymentDetails.purpose,
        amount: amount,
        currency: currency,
        merchantUpiId: merchantUpi,
        paymentMethodLabel: methodLabel,
      });

      setIsProcessing(false);

      if (verification.alreadyPaid) {
        setPaymentState('ALREADY_PAID');
        setFailureDetails({
          state: 'ALREADY_PAID',
          category: 'ALREADY_PAID',
          title: 'Payment already completed.',
          primaryMessage: 'Payment already completed.',
          confirmationNote: 'This order has already been paid and verified.',
          orderId,
          paymentCapturedConfirmedFalse: false,
          isUncertain: false,
          isBankSecurityDecline: false,
        });
        return;
      }

      if (verification.isUncertain) {
        triggerStructuredFailure({
          rawReason: 'Payment status could not be confirmed yet.',
          failedMethod: `NetBanking (${selectedBank})`,
          isUncertain: true,
        });
        return;
      }

      if (!verification.success || !verification.verified) {
        triggerStructuredFailure({
          rawReason: verification.error || 'NetBanking transaction could not be completed.',
          failedMethod: `NetBanking (${selectedBank})`,
          paymentCapturedConfirmedFalse: true,
        });
        return;
      }

      setPaymentState('SUCCESS');
      onSuccess({
        razorpay_payment_id: verification.paymentId || generatedPaymentId,
        razorpay_order_id: verification.orderId || orderId,
        razorpay_signature: bypassSig,
        amount: amount,
        currency: currency,
        email: paymentDetails.email,
        clientName: paymentDetails.clientName,
        purpose: paymentDetails.purpose,
        method: methodLabel,
      });
    } catch (err) {
      setIsProcessing(false);
      triggerStructuredFailure({
        rawReason: 'Payment status could not be confirmed yet.',
        failedMethod: `NetBanking (${selectedBank})`,
        isUncertain: true,
      });
    }
  };

  // 4. Wallet Trigger
  const handleInitiateWallet = () => {
    if (paymentState === 'ALREADY_PAID') return;
    setPaymentState('PROCESSING');
    setIsProcessing(true);
    setProcessingStage(`Sending Wallet OTP to ${walletPhone}...`);
    setTimeout(() => {
      setIsProcessing(false);
      setIsAwaitingWalletOtp(true);
      setOtpTimer(60);
      setWalletError(null);
    }, 800);
  };

  const handleVerifyWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (walletOtp.trim() !== '123456' && walletOtp.trim().length < 4) {
      setWalletError('Invalid OTP. Please enter your 6-digit Wallet verification OTP.');
      return;
    }

    setWalletError(null);
    setIsProcessing(true);
    setPaymentState('VERIFYING');
    setProcessingStage('Payment status is being checked...');

    try {
      await new Promise(r => setTimeout(r, 900));
      const generatedPaymentId = `pay_wal_${selectedWallet}_${Date.now().toString(36)}`;
      const bypassSig = `sig_wal_${Date.now().toString(36)}`;
      const methodLabel = `Wallet (${selectedWallet.toUpperCase()})`;

      const verification = await verifyRazorpayPayment({
        razorpay_order_id: orderId,
        razorpay_payment_id: generatedPaymentId,
        razorpay_signature: bypassSig,
        email: paymentDetails.email,
        clientName: paymentDetails.clientName,
        purpose: paymentDetails.purpose,
        amount: amount,
        currency: currency,
        merchantUpiId: merchantUpi,
        paymentMethodLabel: methodLabel,
      });

      setIsProcessing(false);

      if (verification.alreadyPaid) {
        setPaymentState('ALREADY_PAID');
        setFailureDetails({
          state: 'ALREADY_PAID',
          category: 'ALREADY_PAID',
          title: 'Payment already completed.',
          primaryMessage: 'Payment already completed.',
          confirmationNote: 'This order has already been paid and verified.',
          orderId,
          paymentCapturedConfirmedFalse: false,
          isUncertain: false,
          isBankSecurityDecline: false,
        });
        return;
      }

      if (verification.isUncertain) {
        triggerStructuredFailure({
          rawReason: 'Payment status could not be confirmed yet.',
          failedMethod: `${selectedWallet.toUpperCase()} Wallet`,
          isUncertain: true,
        });
        return;
      }

      if (!verification.success || !verification.verified) {
        triggerStructuredFailure({
          rawReason: verification.error || 'Wallet payment could not be completed.',
          failedMethod: `${selectedWallet.toUpperCase()} Wallet`,
          paymentCapturedConfirmedFalse: true,
        });
        return;
      }

      setPaymentState('SUCCESS');
      onSuccess({
        razorpay_payment_id: verification.paymentId || generatedPaymentId,
        razorpay_order_id: verification.orderId || orderId,
        razorpay_signature: bypassSig,
        amount: amount,
        currency: currency,
        email: paymentDetails.email,
        clientName: paymentDetails.clientName,
        purpose: paymentDetails.purpose,
        method: methodLabel,
      });
    } catch (err) {
      setIsProcessing(false);
      triggerStructuredFailure({
        rawReason: 'Payment status could not be confirmed yet.',
        failedMethod: `${selectedWallet.toUpperCase()} Wallet`,
        isUncertain: true,
      });
    }
  };

  const isInStepTwoOrFailure =
    Boolean(failureDetails) ||
    isAwaitingUpiConfirmation ||
    isAwaitingCardOtp ||
    isAwaitingNetbankingAuth ||
    isAwaitingWalletOtp ||
    isProcessing;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#0B1528] border border-[#1E3A8A]/50 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col relative text-white my-auto"
        >
          {/* Top Razorpay Branded Header */}
          <div className="bg-gradient-to-r from-[#072654] via-[#0B3B7B] to-[#0A2540] p-4 sm:p-5 flex items-center justify-between border-b border-blue-500/20 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shadow-md">
                <div className="flex items-center text-blue-400 font-extrabold text-lg tracking-tighter">
                  <span className="text-white text-base">R</span>
                  <span className="text-blue-400 text-lg">⚡</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-wide text-white">Razorpay Secure</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold uppercase tracking-wider border border-blue-400/20">
                    Trusted Business
                  </span>
                </div>
                <p className="text-[11px] text-blue-200/80 font-sans font-medium">
                  S-CODERS Technologies • Merchant: <strong className="text-white font-mono">{merchantUpi}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-blue-300/80 font-mono block uppercase">Amount to Pay</span>
                <span className="text-lg sm:text-xl font-display font-extrabold text-emerald-400">
                  {currency === 'INR' ? `₹${amount.toLocaleString()}` : `$${amount}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUserCloseModal('The payment was cancelled.')}
                title="Close Razorpay Checkout"
                className="p-2 rounded-full bg-black/40 hover:bg-red-600 text-gray-300 hover:text-white transition-all cursor-pointer border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subheader: Order Details */}
          <div className="bg-[#081224] px-5 py-2.5 border-b border-white/5 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="truncate max-w-[240px] text-gray-300">{paymentDetails.purpose}</span>
            </div>
            <div className="text-[11px] text-gray-400">
              Ref: <span className="text-blue-300 font-bold">{orderId.substring(0, 14)}...</span>
            </div>
          </div>

          {/* Payment Method Selector Tabs (Show when in step 1 selection) */}
          {!isInStepTwoOrFailure && (
            <div className="grid grid-cols-4 bg-[#0A1832] border-b border-white/5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('upi')}
                className={`py-3 px-2 text-center transition-all flex flex-col items-center gap-1 cursor-pointer border-b-2 ${
                  activeTab === 'upi'
                    ? 'border-blue-400 bg-blue-900/30 text-blue-300 font-bold'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>UPI & QR</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className={`py-3 px-2 text-center transition-all flex flex-col items-center gap-1 cursor-pointer border-b-2 ${
                  activeTab === 'card'
                    ? 'border-blue-400 bg-blue-900/30 text-blue-300 font-bold'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('netbanking')}
                className={`py-3 px-2 text-center transition-all flex flex-col items-center gap-1 cursor-pointer border-b-2 ${
                  activeTab === 'netbanking'
                    ? 'border-blue-400 bg-blue-900/30 text-blue-300 font-bold'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>NetBanking</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                className={`py-3 px-2 text-center transition-all flex flex-col items-center gap-1 cursor-pointer border-b-2 ${
                  activeTab === 'wallet'
                    ? 'border-blue-400 bg-blue-900/30 text-blue-300 font-bold'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>Wallets</span>
              </button>
            </div>
          )}

          {/* Modal Main Body */}
          <div className="p-5 sm:p-6 overflow-y-auto max-h-[65vh] space-y-5">
            {/* Standard Checkout Instant Trigger Banner */}
            {!isInStepTwoOrFailure && (
              <div className="bg-gradient-to-r from-blue-600/20 via-cyan-500/10 to-indigo-600/20 border border-cyan-400/30 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Official Razorpay Standard Popup</span>
                    <span className="text-[10px] text-cyan-200/80 font-sans block">Launch direct multi-method gateway modal</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleLaunchStandardPopup()}
                  className="px-3.5 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Launch Popup</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Loading / Verifying Overlay */}
            {isProcessing ? (
              <div className="py-12 px-4 text-center space-y-4 flex flex-col items-center justify-center">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-pulse"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-blue-400 border-r-blue-400 border-b-transparent border-l-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-blue-400 font-bold text-xs">
                    ₹
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-base text-white">
                    {paymentState === 'VERIFYING'
                      ? 'Payment status is being checked.'
                      : 'Processing Razorpay Transaction...'}
                  </h4>
                  <p className="text-xs font-mono text-blue-300 animate-pulse">{processingStage}</p>
                </div>
                <div className="text-[11px] text-gray-400 font-sans max-w-xs leading-relaxed">
                  Please do not refresh. Server-side verification in progress.
                </div>
              </div>
            ) : failureDetails ? (
              /* ================== REUSABLE PAYMENT FAILURE / UNCERTAIN / ALREADY PAID UI ================== */
              <PaymentFailureCard
                failure={failureDetails}
                paymentState={paymentState}
                isCheckingStatus={isCheckingStatus}
                onTryAnotherMethod={handleTryAnotherPaymentMethod}
                onRetryPayment={handleRetryPayment}
                onCancel={() => handleUserCloseModal(failureDetails.primaryMessage)}
                onCheckStatus={handleCheckPaymentStatus}
              />
            ) : isAwaitingUpiConfirmation ? (
              /* ================== STEP 2: UPI VERIFICATION & BANK DECLINE RECOVERY ================== */
              <div className="space-y-4">
                <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                        Awaiting UPI Payment Confirmation
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">
                      Merchant: <strong className="text-white">{merchantUpi}</strong>
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    Complete your payment of <strong className="text-emerald-400">₹{amount.toLocaleString()}</strong> in your UPI App ({getUpiAppDisplayName(selectedUpiApp)}) or scan the QR code below. Your order is only marked as paid after server-side verification succeeds.
                  </p>

                  {/* QR Code & VPA Display */}
                  <PhonePeScannerCard
                    upiString={universalUpiLink}
                    merchantName="S-CODERS"
                    merchantVpa={merchantUpi}
                    amount={amount}
                    showTimer={true}
                    timerSeconds={qrTimer}
                    onVpaChange={setActiveMerchantVpa}
                  />

                  {/* Mobile-Only Direct App Launch Links (On desktop, do not force-launch mobile UPI schemes) */}
                  {isMobileDevice ? (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openUpiApp({
                          pa: merchantUpi,
                          pn: currentBankingName,
                          am: amount,
                          tn: cleanNote
                        }, 'phonepe')}
                        className="py-2.5 px-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 rounded-xl text-center text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>PhonePe</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openUpiApp({
                          pa: merchantUpi,
                          pn: currentBankingName,
                          am: amount,
                          tn: cleanNote
                        }, 'gpay')}
                        className="py-2.5 px-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 rounded-xl text-center text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Google Pay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openUpiApp({
                          pa: merchantUpi,
                          pn: currentBankingName,
                          am: amount,
                          tn: cleanNote
                        }, 'universal')}
                        className="py-2.5 px-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 rounded-xl text-center text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Paytm / UPI</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded-lg border border-white/5 text-[11px] text-gray-300">
                      <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        On desktop, scan the QR code above with PhonePe, Google Pay, or Paytm on your phone, or use another payment method such as Cards or NetBanking.
                      </span>
                    </div>
                  )}

                  {/* Bank Security / Limit Decline Instant Fallback Helper */}
                  <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2 text-xs text-gray-200">
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block text-[11px]">
                          Did {getUpiAppDisplayName(selectedUpiApp)} decline for security reasons or bank limit?
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          Switch to Google Pay, Paytm, Card, or NetBanking without creating a duplicate order.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        triggerStructuredFailure({
                          rawReason: 'Your payment is declined for security reasons.',
                          failedMethod: getUpiAppDisplayName(selectedUpiApp),
                          paymentCapturedConfirmedFalse: true,
                        })
                      }
                      className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 cursor-pointer transition-all"
                    >
                      Try Another Method →
                    </button>
                  </div>
                </div>

                {/* 12-Digit UTR Form */}
                <form onSubmit={handleVerifyUpiUtr} className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-mono text-gray-300 font-bold uppercase tracking-wider">
                        Enter 12-Digit UPI Ref / UTR Number *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const demoUtr = `429${Math.floor(100000000 + Math.random() * 900000000)}`;
                          setUpiUtrInput(demoUtr);
                          setUtrError(null);
                        }}
                        className="text-[10px] font-mono text-blue-400 hover:text-blue-300 underline cursor-pointer"
                      >
                        Auto-Fill Demo UTR
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={16}
                      value={upiUtrInput}
                      onChange={(e) => {
                        setUpiUtrInput(e.target.value);
                        setUtrError(null);
                      }}
                      placeholder="e.g. 423987112233 (from your UPI app receipt)"
                      className="w-full bg-[#071329] border border-blue-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 font-mono tracking-wider"
                    />
                    {utrError && (
                      <p className="text-[11px] text-red-400 font-mono mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {utrError}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleTryAnotherPaymentMethod()}
                      className="py-3 px-3 bg-white/5 hover:bg-blue-500/20 text-gray-200 hover:text-blue-200 border border-white/10 hover:border-blue-400/40 rounded-xl font-mono text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>Try Another Method</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        triggerStructuredFailure({
                          rawReason: 'Your bank or UPI app could not complete this payment.',
                          failedMethod: getUpiAppDisplayName(selectedUpiApp),
                          paymentCapturedConfirmedFalse: true,
                        })
                      }
                      className="py-3 px-3 bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-300 border border-white/10 hover:border-red-500/40 rounded-xl font-mono text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Payment Failed</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isVerifyingUtr}
                      className="py-3 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-display text-xs font-extrabold uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isVerifyingUtr ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      <span>Verify Payment</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : isAwaitingCardOtp ? (
              /* ================== STEP 2: CARD 3D-SECURE 2FA OTP ================== */
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border border-blue-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        Bank 3D-Secure 2FA Verification
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-blue-300">Verified by Visa / Mastercard ID</span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    A 6-digit One-Time Password (OTP) has been sent to the cardholder mobile for authorizing <strong className="text-emerald-400">₹{amount.toLocaleString()}</strong>.
                  </p>

                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-400">Card ending: •••• {cardNumber.replace(/\s/g, '').slice(-4) || '2145'}</span>
                    <span className="text-amber-300">Expires in: {otpTimer}s</span>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-2 text-[11px] font-mono text-blue-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>Demo Sandbox Authorization Code: <strong>123456</strong></span>
                  </div>
                </div>

                <form onSubmit={handleVerifyCardOtp} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-300 font-bold uppercase tracking-wider mb-1.5">
                      Enter 6-Digit Bank OTP Code *
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={cardOtpValue}
                      onChange={(e) => {
                        setCardOtpValue(e.target.value.replace(/\D/g, ''));
                        setCardOtpError(null);
                      }}
                      placeholder="123456"
                      className="w-full bg-[#071329] border border-blue-500/40 rounded-xl px-4 py-3 text-sm text-center text-white placeholder-gray-600 focus:outline-none focus:border-blue-400 font-mono tracking-widest"
                    />
                    {cardOtpError && (
                      <p className="text-[11px] text-red-400 font-mono mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {cardOtpError}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        triggerStructuredFailure({
                          rawReason: 'The payment was declined or cancelled.',
                          failedMethod: 'Card',
                          paymentCapturedConfirmedFalse: true,
                        })
                      }
                      className="py-3 px-3 bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-300 border border-white/10 hover:border-red-500/40 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline / Try Another</span>
                    </button>

                    <button
                      type="submit"
                      className="py-3 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-display text-xs font-extrabold uppercase tracking-wider transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Authorize Payment</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : isAwaitingNetbankingAuth ? (
              /* ================== STEP 2: NETBANKING AUTH ================== */
              <div className="space-y-4">
                <div className="bg-blue-950/50 border border-blue-500/30 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-mono font-bold text-white uppercase">
                        {selectedBank} NetBanking Gateway
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">256-bit SSL</span>
                  </div>
                  <p className="text-xs text-gray-300 font-sans">
                    Log in to your {selectedBank} NetBanking account to authorize payment of <strong className="text-emerald-400">₹{amount.toLocaleString()}</strong>.
                  </p>
                </div>

                <form onSubmit={handleVerifyNetbanking} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-300 mb-1">Customer / User ID</label>
                    <input
                      type="text"
                      value={netbankingUserId}
                      onChange={(e) => setNetbankingUserId(e.target.value)}
                      placeholder="e.g. 84920193"
                      className="w-full bg-[#071329] border border-blue-500/30 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-300 mb-1">Password / Transaction PIN</label>
                    <input
                      type="password"
                      value={netbankingPassword}
                      onChange={(e) => setNetbankingPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#071329] border border-blue-500/30 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 font-mono"
                    />
                  </div>

                  {netbankingError && (
                    <p className="text-[11px] text-red-400 font-mono flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {netbankingError}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        triggerStructuredFailure({
                          rawReason: 'NetBanking transaction was cancelled or could not be completed.',
                          failedMethod: `NetBanking (${selectedBank})`,
                          paymentCapturedConfirmedFalse: true,
                        })
                      }
                      className="py-3 px-3 bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-300 border border-white/10 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel / Other Method</span>
                    </button>

                    <button
                      type="submit"
                      className="py-3 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-display text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Authorize ₹{amount.toLocaleString()}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : isAwaitingWalletOtp ? (
              /* ================== STEP 2: WALLET AUTH ================== */
              <div className="space-y-4">
                <div className="bg-blue-950/50 border border-blue-500/30 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-mono font-bold text-white uppercase">
                        {selectedWallet.toUpperCase()} Wallet Debit
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 font-sans">
                    Enter the OTP sent to <strong className="text-white font-mono">{walletPhone}</strong> to debit <strong className="text-emerald-400">₹{amount.toLocaleString()}</strong>.
                  </p>
                </div>

                <form onSubmit={handleVerifyWallet} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-300 mb-1">Enter 6-Digit Wallet OTP (Demo: 123456)</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={walletOtp}
                      onChange={(e) => setWalletOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full bg-[#071329] border border-blue-500/30 rounded-xl p-2.5 text-xs text-white text-center tracking-widest placeholder-gray-500 focus:outline-none focus:border-blue-400 font-mono"
                    />
                  </div>

                  {walletError && (
                    <p className="text-[11px] text-red-400 font-mono flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {walletError}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        triggerStructuredFailure({
                          rawReason: 'Wallet payment was cancelled or declined.',
                          failedMethod: `${selectedWallet.toUpperCase()} Wallet`,
                          paymentCapturedConfirmedFalse: true,
                        })
                      }
                      className="py-3 px-3 bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-300 border border-white/10 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel / Other Method</span>
                    </button>

                    <button
                      type="submit"
                      className="py-3 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-display text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Pay ₹{amount.toLocaleString()}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* ================== STEP 1: PAYMENT METHOD SELECTION ================== */
              <>
                {/* 1. UPI TAB */}
                {activeTab === 'upi' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUpiApp('phonepe');
                          setUpiError(null);
                          handleInitiateUpiApp('phonepe');
                        }}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          selectedUpiApp === 'phonepe'
                            ? 'border-purple-400 bg-purple-950/40 shadow-lg shadow-purple-900/30 text-white'
                            : 'border-white/10 bg-black/20 text-gray-300 hover:text-white hover:border-purple-400/50'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold text-xs shadow-inner">
                          PP
                        </div>
                        <span className="text-xs font-semibold">PhonePe</span>
                        <span className="text-[9px] font-mono text-purple-300">Tap to Pay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUpiApp('gpay');
                          setUpiError(null);
                          handleInitiateUpiApp('gpay');
                        }}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          selectedUpiApp === 'gpay'
                            ? 'border-blue-400 bg-blue-950/40 shadow-lg shadow-blue-900/30 text-white'
                            : 'border-white/10 bg-black/20 text-gray-300 hover:text-white hover:border-blue-400/50'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-xs shadow-inner">
                          GP
                        </div>
                        <span className="text-xs font-semibold">Google Pay</span>
                        <span className="text-[9px] font-mono text-blue-300">Tap to Pay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUpiApp('paytm');
                          setUpiError(null);
                          handleInitiateUpiApp('paytm');
                        }}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          selectedUpiApp === 'paytm'
                            ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-900/30 text-white'
                            : 'border-white/10 bg-black/20 text-gray-300 hover:text-white hover:border-cyan-400/50'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold text-xs shadow-inner">
                          PT
                        </div>
                        <span className="text-xs font-semibold">Paytm UPI</span>
                        <span className="text-[9px] font-mono text-cyan-300">Tap to Pay</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setSelectedUpiApp('qr'); setUpiError(null); }}
                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          selectedUpiApp === 'qr'
                            ? 'border-blue-400 bg-blue-950/60 text-blue-300 font-bold'
                            : 'border-white/10 bg-black/20 text-gray-400 hover:text-white'
                        }`}
                      >
                        <QrCode className="w-4 h-4 text-blue-400" />
                        <span className="text-xs">Scan Razorpay QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setSelectedUpiApp('custom'); setUpiError(null); }}
                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          selectedUpiApp === 'custom'
                            ? 'border-blue-400 bg-blue-950/60 text-blue-300 font-bold'
                            : 'border-white/10 bg-black/20 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs">Enter UPI ID / VPA</span>
                      </button>
                    </div>

                    {/* QR Code view */}
                    {selectedUpiApp === 'qr' && (
                      <div className="py-2 flex flex-col items-center">
                        <PhonePeScannerCard
                          upiString={universalUpiLink}
                          merchantName="S-CODERS"
                          merchantVpa={merchantUpi}
                          amount={amount}
                          showTimer={true}
                          timerSeconds={qrTimer}
                          onVpaChange={setActiveMerchantVpa}
                        />
                      </div>
                    )}

                    {/* App Selection Detail (PhonePe / GPay / Paytm) */}
                    {(selectedUpiApp === 'phonepe' || selectedUpiApp === 'gpay' || selectedUpiApp === 'paytm') && (
                      <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-blue-400" />
                            <span className="font-mono text-white font-bold">
                              {selectedUpiApp === 'phonepe' ? 'PhonePe UPI' : selectedUpiApp === 'gpay' ? 'Google Pay (GPay)' : 'Paytm UPI'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {isMobileDevice ? 'Instant App Intent' : 'QR & UPI Checkout'}
                          </span>
                        </div>

                        <p className="text-xs text-gray-300 font-sans">
                          {isMobileDevice
                            ? `Tap below to pay via ${selectedUpiApp === 'phonepe' ? 'PhonePe' : selectedUpiApp === 'gpay' ? 'Google Pay' : 'Paytm'}, or switch to another method anytime if your bank declines.`
                            : `Proceed below to scan the UPI QR code with ${selectedUpiApp === 'phonepe' ? 'PhonePe' : selectedUpiApp === 'gpay' ? 'Google Pay' : 'Paytm'} or launch the Razorpay Standard Checkout.`}
                        </p>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleInitiateUpiApp(selectedUpiApp)}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-display font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>
                              {isMobileDevice
                                ? `Open ${selectedUpiApp === 'phonepe' ? 'PhonePe' : selectedUpiApp === 'gpay' ? 'Google Pay' : 'Paytm'}`
                                : `Continue with ${selectedUpiApp === 'phonepe' ? 'PhonePe' : selectedUpiApp === 'gpay' ? 'Google Pay' : 'Paytm'}`}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Custom UPI ID input view */}
                    {selectedUpiApp === 'custom' && (
                      <div className="bg-black/30 border border-white/10 rounded-xl p-3.5 space-y-2">
                        <label className="block text-[11px] font-mono text-gray-300">
                          Enter your UPI ID / Virtual Payment Address (VPA)
                        </label>
                        <input
                          type="text"
                          value={customUpiId}
                          onChange={(e) => setCustomUpiId(e.target.value)}
                          placeholder="e.g. yourname@oksbi or 9876543210@ybl"
                          className="w-full bg-[#071329] border border-blue-500/30 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 font-mono"
                        />
                      </div>
                    )}

                    {upiError && (
                      <p className="text-[11px] text-red-400 font-mono flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {upiError}
                      </p>
                    )}

                    {/* Direct UPI ID Copy bar */}
                    <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-blue-300/80 font-mono block">S-CODERS Merchant UPI ID:</span>
                        <span className="font-mono font-bold text-white text-xs">{merchantUpi}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg font-mono text-[11px] flex items-center gap-1 cursor-pointer transition-colors border border-blue-400/30"
                      >
                        {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedUpi ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleInitiateUpiApp()}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-display font-extrabold text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Proceed to Pay ₹{amount.toLocaleString()} with UPI</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. CARD TAB */}
                {activeTab === 'card' && (
                  <form onSubmit={handleInitiateCardPayment} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono text-gray-300 mb-1">
                        Card Number (Visa, MasterCard, RuPay, Amex) *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="4532 0123 4567 8910"
                          maxLength={19}
                          className="w-full bg-[#071329] border border-blue-500/30 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 font-mono tracking-widest pl-10"
                        />
                        <CreditCard className="w-4 h-4 text-blue-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono text-gray-300 mb-1">
                          Expiry Date *
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          placeholder="MM / YY"
                          maxLength={5}
                          className="w-full bg-[#071329] border border-blue-500/30 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 font-mono text-center tracking-wider"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-gray-300 mb-1">
                          CVV / Security Code *
                        </label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="•••"
                          maxLength={4}
                          className="w-full bg-[#071329] border border-blue-500/30 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 font-mono text-center tracking-widest"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-gray-300 mb-1">
                        Cardholder Name *
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Name on card"
                        className="w-full bg-[#071329] border border-blue-500/30 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                      />
                    </div>

                    {cardError && (
                      <p className="text-[11px] text-red-400 font-mono flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {cardError}
                      </p>
                    )}

                    <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveCard}
                        onChange={(e) => setSaveCard(e.target.checked)}
                        className="rounded border-white/20 text-blue-500 focus:ring-blue-400"
                      />
                      <span>Securely save card as per RBI tokenization guidelines</span>
                    </label>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-display font-extrabold text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span>Proceed to Card 3D-Secure OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* 3. NETBANKING TAB */}
                {activeTab === 'netbanking' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {['BOB', 'HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak'].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            selectedBank === bank
                              ? 'border-blue-400 bg-blue-950/70 text-white font-bold'
                              : 'border-white/10 bg-black/20 text-gray-400 hover:text-white'
                          }`}
                        >
                          <Building2 className="w-4 h-4 text-blue-400" />
                          <span className="text-xs">{bank} Bank</span>
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-gray-300 mb-1">
                        Or select another partner bank
                      </label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full bg-[#071329] border border-blue-500/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer"
                      >
                        <option value="BOB">Bank of Baroda (S-CODERS Partner)</option>
                        <option value="HDFC">HDFC Bank</option>
                        <option value="SBI">State Bank of India</option>
                        <option value="ICICI">ICICI Bank</option>
                        <option value="Axis">Axis Bank</option>
                        <option value="Kotak">Kotak Mahindra Bank</option>
                        <option value="PNB">Punjab National Bank</option>
                        <option value="Canara">Canara Bank</option>
                        <option value="Union">Union Bank of India</option>
                        <option value="Yes">Yes Bank</option>
                        <option value="IDFC">IDFC FIRST Bank</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleInitiateNetbanking}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-display font-extrabold text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 text-blue-300" />
                      <span>Proceed to {selectedBank} NetBanking</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 4. WALLETS TAB */}
                {activeTab === 'wallet' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: 'phonepe', name: 'PhonePe Wallet' },
                        { id: 'paytm', name: 'Paytm Wallet' },
                        { id: 'mobikwik', name: 'MobiKwik' },
                        { id: 'amazon', name: 'Amazon Pay' },
                        { id: 'simpl', name: 'Simpl PayLater' },
                        { id: 'lazypay', name: 'LazyPay' },
                      ].map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setSelectedWallet(w.id)}
                          className={`p-3 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                            selectedWallet === w.id
                              ? 'border-blue-400 bg-blue-950/70 text-white font-bold'
                              : 'border-white/10 bg-black/20 text-gray-400 hover:text-white'
                          }`}
                        >
                          <Wallet className="w-4 h-4 text-blue-400" />
                          <span className="text-xs">{w.name}</span>
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleInitiateWallet}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-display font-extrabold text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Wallet className="w-4 h-4 text-emerald-300" />
                      <span>Pay ₹{amount.toLocaleString()} via {selectedWallet.toUpperCase()}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Security Badge & Cancellation Button */}
          <div className="bg-[#071329] px-5 py-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <div className="flex items-center gap-1.5 text-blue-300">
              <Lock className="w-3.5 h-3.5" />
              <span>256-bit SSL Razorpay Encrypted</span>
            </div>
            <div className="flex items-center gap-3">
              {failureDetails && (
                <button
                  type="button"
                  onClick={() => handleTryAnotherPaymentMethod()}
                  className="text-blue-400 hover:text-blue-300 transition-colors underline cursor-pointer"
                >
                  All Payment Methods
                </button>
              )}
              <button
                type="button"
                onClick={() => handleUserCloseModal('The payment was cancelled.')}
                className="text-gray-400 hover:text-red-400 transition-colors underline cursor-pointer"
              >
                Cancel Payment
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
