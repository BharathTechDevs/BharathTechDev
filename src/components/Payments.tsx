import React, { useState, useEffect } from 'react';
import { 
  CreditCard, QrCode, CheckCircle, ArrowRight, Lock, ShieldCheck, 
  Copy, Check, FileText, Upload, Search, Receipt, 
  Sparkles, Wallet, RefreshCw, Mail, AlertTriangle, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDynamicWorkshops, getDynamicInvoices } from '../utils/dynamicData';
import RazorpayModal, { RazorpayPaymentSuccessData } from './RazorpayModal';
import EmailNotificationModal, { EmailNotificationData } from './EmailNotificationModal';
import PhonePeScannerCard from './PhonePeScannerCard';
import PaymentFailureCard, { FallbackPaymentOption } from './PaymentFailureCard';
import { openUpiApp, getActiveMerchantUpi, getBankingNameForUpi } from '../utils/paymentLinks';
import {
  PaymentState,
  PaymentFailureDetails,
  createRazorpayOrder,
  verifyRazorpayPayment,
  checkRazorpayOrderStatus,
  classifyPaymentFailure,
} from '../services/razorpay';

interface PaymentHistoryItem {
  txnId: string;
  clientName: string;
  email: string;
  purpose: string;
  amount: number;
  currency: 'INR' | 'USD';
  method: string;
  timestamp: string;
  status: 'SUCCESS' | 'PENDING' | 'REJECTED';
}

interface PaymentsProps {
  initialTab?: 'invoice' | 'workshop';
  prefilledInvoice?: {
    client: string;
    contact: string;
    purpose: string;
    amount: number;
    currency: 'INR' | 'USD';
    returnView?: string;
  } | null;
  prefilledWorkshopId?: string | null;
  isModal?: boolean;
  onSuccess?: (txn: PaymentHistoryItem) => void;
  onClose?: () => void;
  onNavigate?: (view: string) => void;
}

export default function Payments({ initialTab, prefilledInvoice, prefilledWorkshopId, isModal = false, onSuccess, onClose, onNavigate }: PaymentsProps) {
  const workshopEvents = getDynamicWorkshops();
  const presetInvoices = getDynamicInvoices();

  // Tabs: 'invoice' | 'workshop'
  const [activeTab, setActiveTab] = useState<'invoice' | 'workshop'>('invoice');
  
  // Payment methods: 'razorpay' | 'upi' | 'card' | 'bank'
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'card' | 'bank'>('razorpay');

  // Authoritative Payment State Machine (Section 1)
  const [paymentState, setPaymentState] = useState<PaymentState>('IDLE');
  const [failureDetails, setFailureDetails] = useState<PaymentFailureDetails | null>(null);
  const [alreadyPaidNotice, setAlreadyPaidNotice] = useState<string | null>(null);
  const [statusCheckLoading, setStatusCheckLoading] = useState(false);

  // Razorpay email status notification feedback state
  const [razorpayEmailNotice, setRazorpayEmailNotice] = useState<{
    sent: boolean;
    email: string;
    type: 'SUCCESS' | 'FAILED';
    message?: string;
  } | null>(null);

  // Input states for Invoice payment
  const [invoiceLookup, setInvoiceLookup] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState<number>(15000);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Input states for Workshop booking
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');
  const [ticketQty, setTicketQty] = useState(1);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    if (prefilledInvoice) {
      setClientName(prefilledInvoice.client);
      setClientEmail(prefilledInvoice.contact);
      setPurpose(prefilledInvoice.purpose);
      setAmount(prefilledInvoice.amount);
      setCurrency(prefilledInvoice.currency);
      setSelectedInvoiceId('STARTUP-DEPOSIT');
    }
    if (prefilledWorkshopId) {
      setSelectedWorkshopId(prefilledWorkshopId);
    } else if (workshopEvents.length > 0 && !selectedWorkshopId) {
      setSelectedWorkshopId(workshopEvents[0].id);
    }
  }, [initialTab, prefilledInvoice, prefilledWorkshopId]);

  // Card input states
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Bank transfer receipt state
  const [receiptFile, setReceiptFile] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState('');

  // UPI UTR / Reference input for custom UPI verification
  const [utrInput, setUtrInput] = useState('');
  const [validationNotice, setValidationNotice] = useState<string | null>(null);

  // State managers
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [successTxn, setSuccessTxn] = useState<PaymentHistoryItem | null>(null);

  // Razorpay Gateway Modal Integration States
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState<{
    orderId: string;
    amount: number;
    currency: string;
    keyId?: string;
    applicationOrderKey?: string;
  } | null>(null);
  const [razorpayPaymentDetails, setRazorpayPaymentDetails] = useState<{
    amount: number;
    currency: string;
    clientName: string;
    email: string;
    purpose: string;
    merchantUpiId: string;
  } | null>(null);

  // Email Notification Modal States (scoders82@gmail.com)
  const [showEmailNotice, setShowEmailNotice] = useState(false);
  const [emailNoticeData, setEmailNoticeData] = useState<EmailNotificationData | null>(null);

  // Ruy Payment Gateway Specific States
  const [selectedUpiApp, setSelectedUpiApp] = useState<'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'generic' | null>(null);
  const [ruyGatewayStep, setRuyGatewayStep] = useState<'idle' | 'awaiting' | 'processing' | 'success'>('idle');
  const [ruyTimer, setRuyTimer] = useState(300); // 5 minutes (300 seconds)

  // Local transaction records
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>(() => {
    const saved = localStorage.getItem('scoders_payments');
    return saved ? JSON.parse(saved) : [];
  });

  // Calculate workshop total
  const selectedWorkshopObj = workshopEvents.find(w => w.id === selectedWorkshopId);
  const ticketPrice = selectedWorkshopObj?.price ?? 1499;
  const workshopTotal = ticketQty * ticketPrice;

  // Deterministic Application Order Key for Duplicate Payment Protection (Section 9)
  const getCurrentApplicationOrderKey = () => {
    const isWorkshop = activeTab === 'workshop';
    const workshopObj = workshopEvents.find(w => w.id === selectedWorkshopId);
    const finalEmail = (isWorkshop ? clientEmail || 'attendee@scoders.dev' : clientEmail).trim().toLowerCase();
    const finalAmount = isWorkshop ? workshopTotal : amount;
    const targetKey = isWorkshop
      ? `workshop_${workshopObj?.id || 'default'}_${ticketQty}`
      : `invoice_${selectedInvoiceId || purpose.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 32)}`;
    return `app_ord_${targetKey}_${finalEmail}_${finalAmount}`;
  };

  // Helper to ensure an authoritative Razorpay order exists (reusing valid order or creating new one)
  const ensureAuthoritativeOrder = async (forceNewOrder = false): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    keyId?: string;
    applicationOrderKey: string;
    alreadyPaid?: boolean;
    paymentId?: string;
  } | null> => {
    const isWorkshop = activeTab === 'workshop';
    const workshopObj = workshopEvents.find(w => w.id === selectedWorkshopId);
    const finalClientName = isWorkshop ? clientName || 'Workshop Attendee' : clientName;
    const finalEmail = isWorkshop ? clientEmail || 'attendee@scoders.dev' : clientEmail;
    const purposeText = isWorkshop 
      ? `Booking: ${ticketQty}x Seats for ${workshopObj?.title || 'S-CODERS Workshop'}` 
      : purpose;
    const finalAmount = isWorkshop ? workshopTotal : amount;
    const finalCurrency = isWorkshop ? 'INR' : currency;
    const applicationOrderKey = getCurrentApplicationOrderKey();

    // Reuse existing order if parameters match and not forcing a new order
    if (
      !forceNewOrder &&
      razorpayOrderData?.orderId &&
      razorpayOrderData.applicationOrderKey === applicationOrderKey &&
      razorpayOrderData.amount === finalAmount
    ) {
      const statusRes = await checkRazorpayOrderStatus(
        razorpayOrderData.orderId,
        applicationOrderKey
      );
      if (statusRes.status === 'PAID' || statusRes.verified) {
        return {
          ...razorpayOrderData,
          applicationOrderKey,
          alreadyPaid: true,
          paymentId: statusRes.paymentId,
        };
      }
      if (statusRes.reusable !== false && statusRes.status !== 'EXPIRED') {
        return {
          ...razorpayOrderData,
          applicationOrderKey,
        };
      }
    }

    setPaymentState('CREATING_ORDER');
    const orderRes = await createRazorpayOrder({
      amount: finalAmount,
      currency: finalCurrency,
      receipt: `rcpt_${Date.now()}`,
      purpose: purposeText,
      workshopId: isWorkshop ? selectedWorkshopId : undefined,
      productId: !isWorkshop ? (selectedInvoiceId || undefined) : undefined,
      applicationOrderKey,
      existingOrderId: !forceNewOrder ? razorpayOrderData?.orderId : undefined,
      forceNewOrder,
      customer: {
        name: finalClientName,
        email: finalEmail,
      },
      notes: {
        clientName: finalClientName,
        email: finalEmail,
        purpose: purposeText,
        applicationOrderKey,
      },
    });

    if (orderRes.alreadyPaid) {
      return {
        orderId: orderRes.orderId || razorpayOrderData?.orderId || '',
        amount: finalAmount,
        currency: finalCurrency,
        keyId: orderRes.keyId,
        applicationOrderKey,
        alreadyPaid: true,
        paymentId: orderRes.paymentId,
      };
    }

    if (!orderRes.success || !orderRes.orderId) {
      const classified = classifyPaymentFailure({
        rawReason: orderRes.error || 'Could not initialize payment order.',
        failedMethod: paymentMethod === 'upi' ? selectedUpiApp || 'UPI' : 'Razorpay',
      });
      setPaymentState('FAILED');
      setFailureDetails(classified);
      return null;
    }

    const newOrderObj = {
      orderId: orderRes.orderId,
      amount: finalAmount,
      currency: finalCurrency,
      keyId: orderRes.keyId || 'rzp_live_scoders_ybl',
      applicationOrderKey,
    };
    setRazorpayOrderData(newOrderObj);
    setRazorpayPaymentDetails({
      amount: finalAmount,
      currency: finalCurrency,
      clientName: finalClientName,
      email: finalEmail,
      purpose: purposeText,
      merchantUpiId: getActiveMerchantUpi(),
    });
    return newOrderObj;
  };

  // Razorpay Live Checkout & Automated Email Handler
  const handleRazorpayCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationNotice(null);
    setAlreadyPaidNotice(null);

    const isWorkshop = activeTab === 'workshop';
    const workshopObj = workshopEvents.find(w => w.id === selectedWorkshopId);
    
    const finalClientName = isWorkshop ? clientName || 'Workshop Attendee' : clientName;
    const finalEmail = isWorkshop ? clientEmail || 'attendee@scoders.dev' : clientEmail;
    const purposeText = isWorkshop 
      ? `Booking: ${ticketQty}x Seats for ${workshopObj?.title || 'S-CODERS Workshop'}` 
      : purpose;

    const finalAmount = isWorkshop ? workshopTotal : amount;

    if (!finalClientName.trim() || !finalEmail.trim() || !purposeText.trim() || finalAmount <= 0) {
      setValidationNotice('Please fill out your Name, Email ID, Purpose, and Amount before proceeding.');
      return;
    }

    setLoading(true);
    setRazorpayEmailNotice(null);
    setFailureDetails(null);

    try {
      const orderInfo = await ensureAuthoritativeOrder(false);
      setLoading(false);

      if (!orderInfo) {
        return;
      }

      if (orderInfo.alreadyPaid) {
        setPaymentState('ALREADY_PAID');
        setAlreadyPaidNotice('Payment already completed.');
        setRazorpayEmailNotice({
          sent: true,
          email: finalEmail,
          type: 'SUCCESS',
          message: 'Payment already completed for this order. Duplicate payments are prevented.',
        });
        return;
      }

      setPaymentState('CHECKOUT_OPEN');
      setShowRazorpayModal(true);
    } catch (err: any) {
      setLoading(false);
      const classified = classifyPaymentFailure({
        rawReason: err?.message || 'Unable to start checkout.',
        failedMethod: 'Razorpay Checkout',
      });
      setPaymentState('FAILED');
      setFailureDetails(classified);
    }
  };

  const handleRazorpaySuccess = (data: RazorpayPaymentSuccessData) => {
    setShowRazorpayModal(false);
    setPaymentState('SUCCESS');
    setFailureDetails(null);
    setRuyGatewayStep('idle');
    const activeVpa = getActiveMerchantUpi();

    const newTxn: PaymentHistoryItem = {
      txnId: data.razorpay_payment_id || `SCO-RZP-${Math.floor(100000000 + Math.random() * 900000000)}`,
      clientName: data.clientName,
      email: data.email,
      purpose: `${data.purpose} (Merchant: ${activeVpa})`,
      amount: data.amount,
      currency: (data.currency as any) || 'INR',
      method: data.method || `Razorpay Gateway (${activeVpa} Verified)`,
      timestamp: new Date().toLocaleString(),
      status: 'SUCCESS'
    };

    const updatedHistory = [newTxn, ...paymentHistory];
    setPaymentHistory(updatedHistory);
    localStorage.setItem('scoders_payments', JSON.stringify(updatedHistory));

    setSuccessTxn(newTxn);
    if (onSuccess) {
      onSuccess(newTxn);
    }
    setRazorpayEmailNotice({
      sent: true,
      email: data.email,
      type: 'SUCCESS',
      message: `Razorpay Payment Verified (Merchant: ${activeVpa})! Official Receipt sent to ${data.email} with Txn ID ${data.razorpay_payment_id}.`
    });

    // Trigger Popup Email Notice
    const targetReturnView = prefilledInvoice?.returnView || (activeTab === 'workshop' ? 'workshops' : 'services');
    setEmailNoticeData({
      type: activeTab === 'workshop' ? 'workshop' : 'service',
      recipientEmail: data.email,
      recipientName: data.clientName,
      subject: `✅ Razorpay Payment Verified - S-CODERS (Ref: ${data.razorpay_payment_id})`,
      title: data.purpose,
      uniqueKey: data.razorpay_payment_id,
      messageText: `Your Razorpay payment of ₹${data.amount.toLocaleString()} has been processed and verified successfully. An official receipt has been dispatched to ${data.email} via scoders82@gmail.com.`,
      amount: data.amount,
      actionText: isModal ? "Return & Continue Work" : `Return to ${targetReturnView === 'workshops' ? 'Workshops' : targetReturnView === 'services' ? 'Services' : 'Workspace'}`,
      onAction: () => {
        if (onClose) onClose();
        if (onNavigate && targetReturnView) onNavigate(targetReturnView);
      }
    });
    setShowEmailNotice(true);
  };

  // Invoice autofill handler
  const handleLookupInvoice = (id: string) => {
    const inv = presetInvoices.find(p => p.id.toLowerCase() === id.trim().toLowerCase());
    if (inv) {
      setClientName(inv.client);
      setClientEmail(inv.contact);
      setPurpose(inv.purpose);
      setAmount(inv.amount);
      setCurrency(inv.currency);
      setSelectedInvoiceId(inv.id);
      setAlreadyPaidNotice(null);
      setFailureDetails(null);
      setPaymentState('IDLE');
    } else {
      setSelectedInvoiceId(null);
    }
  };

  useEffect(() => {
    if (invoiceLookup) {
      handleLookupInvoice(invoiceLookup);
    }
  }, [invoiceLookup]);

  // Ruy Payment Gateway Session Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (ruyGatewayStep === 'awaiting' && ruyTimer > 0) {
      interval = setInterval(() => {
        setRuyTimer((prev) => prev - 1);
      }, 1000);
    } else if (ruyGatewayStep === 'awaiting' && ruyTimer === 0) {
      setRuyGatewayStep('idle');
      setPaymentState('UNKNOWN');
      setFailureDetails(
        classifyPaymentFailure({
          isUncertain: true,
          failedMethod: selectedUpiApp ? selectedUpiApp.toUpperCase() : 'UPI App',
          orderId: razorpayOrderData?.orderId,
        })
      );
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [ruyGatewayStep, ruyTimer, selectedUpiApp, razorpayOrderData?.orderId]);

  // Initiate Ruy Pay app redirect associated with an authoritative Razorpay Order (Section 12 & 13)
  const handleRuyAppRedirect = async (app: 'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'generic') => {
    setValidationNotice(null);
    setAlreadyPaidNotice(null);

    if (activeTab === 'invoice') {
      if (!clientName.trim() || !clientEmail.trim() || !purpose.trim() || amount <= 0) {
        setValidationNotice('Please fill out all invoice parameters (Client Name, Email, Purpose, Amount) first.');
        return;
      }
    }

    setLoading(true);
    const orderInfo = await ensureAuthoritativeOrder(false);
    setLoading(false);

    if (!orderInfo) return;

    if (orderInfo.alreadyPaid) {
      setPaymentState('ALREADY_PAID');
      setAlreadyPaidNotice('Payment already completed.');
      return;
    }

    setSelectedUpiApp(app);
    setFailureDetails(null);
    setPaymentState('PROCESSING');
    setRuyGatewayStep('awaiting');
    setRuyTimer(300); // Reset countdown to 5 minutes
    
    // On desktop, do not force-launch a mobile-only intent; openUpiApp safely handles mobile devices
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      const payeeAddress = getActiveMerchantUpi();
      const payeeName = getBankingNameForUpi(payeeAddress);
      const payAmount = activeTab === 'workshop' ? workshopTotal : amount;
      const note = (activeTab === 'workshop' ? `Workshop Booking` : purpose).slice(0, 25);
      const scheme = app === 'phonepe' ? 'phonepe' : app === 'gpay' ? 'gpay' : app === 'paytm' ? 'paytm' : app === 'bhim' ? 'bhim' : 'universal';
      
      openUpiApp({
        pa: payeeAddress,
        pn: payeeName,
        am: payAmount,
        tn: note
      }, scheme);
    }
  };

  // Authoritative verification for custom UPI tab (never marks PAID without backend Razorpay verification)
  const handleRuyPaymentComplete = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationNotice(null);

    if (activeTab === 'invoice') {
      if (!clientName.trim() || !clientEmail.trim() || !purpose.trim() || amount <= 0) {
        setValidationNotice('Please fill out all invoice parameters.');
        return;
      }
    }

    const cleanUtr = utrInput.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setValidationNotice('Please enter your 12-digit UPI Reference / UTR Number from your UPI app to verify payment with the server, or use Razorpay Checkout.');
      return;
    }

    setLoading(true);
    setPaymentState('VERIFYING');
    setRuyGatewayStep('processing');

    try {
      const orderInfo = await ensureAuthoritativeOrder(false);
      if (!orderInfo) {
        setLoading(false);
        setRuyGatewayStep('idle');
        return;
      }

      if (orderInfo.alreadyPaid) {
        setLoading(false);
        setPaymentState('ALREADY_PAID');
        setAlreadyPaidNotice('Payment already completed.');
        setRuyGatewayStep('idle');
        return;
      }

      const isWorkshop = activeTab === 'workshop';
      const workshopObj = workshopEvents.find(w => w.id === selectedWorkshopId);
      const finalClientName = isWorkshop ? clientName || 'Workshop Attendee' : clientName;
      const finalEmail = isWorkshop ? clientEmail || 'attendee@scoders.dev' : clientEmail;
      const purposeText = isWorkshop 
        ? `Booking: ${ticketQty}x Seats for ${workshopObj?.title || 'S-CODERS Workshop'}` 
        : purpose;
      const finalAmount = isWorkshop ? workshopTotal : amount;
      const finalCurrency = isWorkshop ? 'INR' : currency;

      let modeLabel = 'UPI Verified';
      if (selectedUpiApp) {
        modeLabel = `${selectedUpiApp === 'gpay' ? 'Google Pay' : selectedUpiApp === 'phonepe' ? 'PhonePe' : selectedUpiApp === 'paytm' ? 'Paytm' : selectedUpiApp === 'bhim' ? 'BHIM UPI' : 'UPI'} (UTR: ${cleanUtr})`;
      }

      const paymentId = `pay_upi_${cleanUtr}`;
      const verifyResult = await verifyRazorpayPayment({
        razorpay_order_id: orderInfo.orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: `upi_verified_sig_${orderInfo.orderId}`,
        clientName: finalClientName,
        email: finalEmail,
        amount: finalAmount,
        currency: finalCurrency,
        purpose: purposeText,
        paymentMethodLabel: modeLabel,
        merchantUpiId: getActiveMerchantUpi(),
      });

      setLoading(false);

      if (verifyResult.verified) {
        setPaymentState('SUCCESS');
        setRuyGatewayStep('success');
        setUtrInput('');
        handleRazorpaySuccess({
          razorpay_payment_id: verifyResult.paymentId || paymentId,
          razorpay_order_id: orderInfo.orderId,
          razorpay_signature: `upi_verified_sig_${orderInfo.orderId}`,
          amount: finalAmount,
          currency: finalCurrency,
          clientName: finalClientName,
          email: finalEmail,
          purpose: purposeText,
          method: modeLabel,
        });
      } else if (verifyResult.isUncertain) {
        setPaymentState('UNKNOWN');
        setRuyGatewayStep('idle');
        setFailureDetails(
          classifyPaymentFailure({
            isUncertain: true,
            failedMethod: modeLabel,
            orderId: orderInfo.orderId,
          })
        );
      } else {
        const classified = classifyPaymentFailure({
          rawReason: verifyResult.error || 'Payment verification failed.',
          failedMethod: modeLabel,
          orderId: orderInfo.orderId,
          paymentCapturedConfirmedFalse: true,
        });
        setPaymentState('FAILED');
        setRuyGatewayStep('idle');
        setFailureDetails(classified);
      }
    } catch (err: any) {
      setLoading(false);
      setPaymentState('UNKNOWN');
      setRuyGatewayStep('idle');
      setFailureDetails(
        classifyPaymentFailure({
          isUncertain: true,
          failedMethod: selectedUpiApp || 'UPI',
          orderId: razorpayOrderData?.orderId,
        })
      );
    }
  };

  // Report a UPI App Decline (e.g. PhonePe/Google Pay bank security or limit decline)
  const handleReportUpiDecline = (reasonType: 'bank_security' | 'cancelled' | 'uncertain') => {
    const appLabel =
      selectedUpiApp === 'phonepe'
        ? 'PhonePe'
        : selectedUpiApp === 'gpay'
        ? 'Google Pay'
        : selectedUpiApp === 'paytm'
        ? 'Paytm'
        : selectedUpiApp === 'bhim'
        ? 'BHIM UPI'
        : 'UPI App';

    setRuyGatewayStep('idle');

    if (reasonType === 'uncertain') {
      setPaymentState('UNKNOWN');
      setFailureDetails(
        classifyPaymentFailure({
          isUncertain: true,
          failedMethod: appLabel,
          orderId: razorpayOrderData?.orderId,
        })
      );
      return;
    }

    if (reasonType === 'cancelled') {
      const details = classifyPaymentFailure({
        rawReason: 'The payment was cancelled.',
        isCancelled: true,
        failedMethod: appLabel,
        orderId: razorpayOrderData?.orderId,
        paymentCapturedConfirmedFalse: true,
      });
      setPaymentState('CANCELLED');
      setFailureDetails(details);
      return;
    }

    const details = classifyPaymentFailure({
      rawReason: 'Your payment is declined for security reasons or bank limit.',
      code: 'BAD_REQUEST_ERROR',
      failedMethod: appLabel,
      orderId: razorpayOrderData?.orderId,
      paymentCapturedConfirmedFalse: true,
    });
    setPaymentState('FAILED');
    setFailureDetails(details);
  };

  // Check Payment Status with Backend (Section 8)
  const handleCheckOrderStatus = async () => {
    setStatusCheckLoading(true);
    try {
      const applicationOrderKey = getCurrentApplicationOrderKey();
      const statusRes = await checkRazorpayOrderStatus(
        razorpayOrderData?.orderId,
        applicationOrderKey
      );
      setStatusCheckLoading(false);

      if (statusRes.status === 'PAID' || statusRes.verified) {
        setPaymentState('ALREADY_PAID');
        setFailureDetails(null);
        setAlreadyPaidNotice('Payment already completed.');
        return;
      }

      if (statusRes.status === 'FAILED') {
        setPaymentState('FAILED');
        setFailureDetails(
          classifyPaymentFailure({
            rawReason: 'Your bank or UPI app could not complete this payment.',
            failedMethod: failureDetails?.failedMethod || 'UPI',
            orderId: razorpayOrderData?.orderId,
            paymentCapturedConfirmedFalse: !statusRes.paymentCaptured,
          })
        );
      } else {
        setFailureDetails((prev) =>
          prev
            ? {
                ...prev,
                primaryMessage:
                  'No completed payment was found on the server yet. If money was not debited in your bank/UPI app, you can safely try another payment method.',
                confirmationNote: 'Please check your bank/UPI app before making another payment.',
              }
            : null
        );
      }
    } catch {
      setStatusCheckLoading(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Card formatting helpers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      setCardExpiry(`${val.substring(0, 2)}/${val.substring(2, 4)}`);
    } else {
      setCardExpiry(val);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCardCvv(val);
  };

  // Mock receipt upload simulator
  const handleReceiptMockUpload = () => {
    setReceiptName('UPI_Transaction_Screenshot_July_2026.png');
    setReceiptFile('mock_file_uploaded_success');
  };

  // Detect card brand
  const getCardBrand = () => {
    if (cardNumber.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(cardNumber)) return 'Mastercard';
    if (cardNumber.startsWith('6')) return 'RuPay';
    return 'Generic Card';
  };

  // Submit Payment Handler for Card & Bank Wire (Associates with Razorpay Order & Server Verification)
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationNotice(null);
    setAlreadyPaidNotice(null);

    if (activeTab === 'invoice') {
      if (!clientName.trim() || !clientEmail.trim() || !purpose.trim() || amount <= 0) {
        setValidationNotice('Please fill out all invoice parameters.');
        return;
      }
    }

    setLoading(true);
    setPaymentState('VERIFYING');

    try {
      const orderInfo = await ensureAuthoritativeOrder(false);
      if (!orderInfo) {
        setLoading(false);
        return;
      }

      if (orderInfo.alreadyPaid) {
        setLoading(false);
        setPaymentState('ALREADY_PAID');
        setAlreadyPaidNotice('Payment already completed.');
        return;
      }

      const isWorkshop = activeTab === 'workshop';
      const workshopObj = workshopEvents.find(w => w.id === selectedWorkshopId);
      const finalClientName = isWorkshop ? clientName || 'Workshop Attendee' : clientName;
      const finalEmail = isWorkshop ? clientEmail || 'attendee@scoders.dev' : clientEmail;
      const purposeText = isWorkshop 
        ? `Booking: ${ticketQty}x Seats for ${workshopObj?.title || 'S-CODERS Workshop'}` 
        : purpose;
      const finalAmount = isWorkshop ? workshopTotal : amount;
      const finalCurrency = isWorkshop ? 'INR' : currency;

      let modeLabel = 'UPI Transfer';
      if (paymentMethod === 'card') modeLabel = `Credit Card (${getCardBrand()})`;
      if (paymentMethod === 'bank') modeLabel = 'Direct Bank NEFT/IMPS';

      const paymentId = `pay_${paymentMethod}_${Date.now()}`;
      const verifyResult = await verifyRazorpayPayment({
        razorpay_order_id: orderInfo.orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: `razorpay_verified_sig_${orderInfo.orderId}`,
        clientName: finalClientName,
        email: finalEmail,
        amount: finalAmount,
        currency: finalCurrency,
        purpose: purposeText,
        paymentMethodLabel: modeLabel,
        merchantUpiId: getActiveMerchantUpi(),
      });

      setLoading(false);

      if (verifyResult.verified) {
        setPaymentState('SUCCESS');
        handleRazorpaySuccess({
          razorpay_payment_id: verifyResult.paymentId || paymentId,
          razorpay_order_id: orderInfo.orderId,
          razorpay_signature: `razorpay_verified_sig_${orderInfo.orderId}`,
          amount: finalAmount,
          currency: finalCurrency,
          clientName: finalClientName,
          email: finalEmail,
          purpose: purposeText,
          method: modeLabel,
        });

        // Reset specific forms
        setInvoiceLookup('');
        setClientName('');
        setClientEmail('');
        setPurpose('');
        setCardNumber('');
        setCardHolder('');
        setCardExpiry('');
        setCardCvv('');
        setReceiptFile(null);
        setReceiptName('');
      } else {
        setPaymentState('FAILED');
        setFailureDetails(
          classifyPaymentFailure({
            rawReason: verifyResult.error || 'Payment could not be verified.',
            failedMethod: modeLabel,
            orderId: orderInfo.orderId,
          })
        );
      }
    } catch (err: any) {
      setLoading(false);
      setPaymentState('FAILED');
      setFailureDetails(
        classifyPaymentFailure({
          rawReason: err?.message || 'Payment processing failed.',
          failedMethod: paymentMethod,
        })
      );
    }
  };

  // Format currency helper
  const formatAmount = (val: number, cur: 'INR' | 'USD') => {
    return new Intl.NumberFormat(cur === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0
    }).format(val);
  };

  // Generate UPI QR Code URL & URI String
  const getUpiUri = () => {
    const payeeAddress = getActiveMerchantUpi();
    const payeeName = getBankingNameForUpi(payeeAddress);
    const payAmount = activeTab === 'workshop' ? workshopTotal : amount;
    const cleanAmount = (payAmount || 0).toFixed(2);
    const cleanNote = (activeTab === 'workshop' ? 'Workshop Booking' : purpose || 'SCODERS Payment').replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 25);

    return `upi://pay?pa=${payeeAddress}&pn=${encodeURIComponent(payeeName)}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;
  };

  // Handle "Try Another Payment Method" from PaymentFailureCard (Sections 3 & 11)
  const handleTryAnotherPaymentMethod = async (preferredFallback?: FallbackPaymentOption) => {
    setFailureDetails(null);
    setRuyGatewayStep('idle');
    setPaymentState('IDLE');

    if (preferredFallback === 'card') {
      setPaymentMethod('card');
      return;
    }

    // Open Razorpay Checkout payment-method selection reusing the existing valid order
    setPaymentMethod('razorpay');
    await handleRazorpayCheckout();
  };

  // Handle explicit "Retry Payment" (Section 4)
  const handleExplicitRetryPayment = async () => {
    setFailureDetails(null);
    setRuyGatewayStep('idle');
    setPaymentState('IDLE');
    await handleRazorpayCheckout();
  };

  return (
    <section id="payments" className={`${isModal ? 'py-6 sm:py-10' : 'py-24'} bg-brand-dark relative overflow-hidden`}>
      {/* Decorative ambient background glows */}
      <div className="absolute left-1/4 top-1/4 w-[500px] h-[500px] bg-brand-teal/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/4 w-[400px] h-[400px] bg-brand-coral/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono mb-4">
            <Wallet className="w-3.5 h-3.5 animate-bounce" />
            <span>SECURE PAYMENT PORTAL</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight mb-6">
            Client Billing & checkout
          </h2>
          <p className="text-gray-400 font-sans font-light text-lg">
            Pay invoices, settle milestone deposits, or secure your seat at our upcoming tech workshops with our secure multi-channel billing gateway.
          </p>
        </div>

        {/* Success Transaction Receipt Modal Overlay */}
        <AnimatePresence>
          {successTxn && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-brand-dark/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 30, opacity: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className="bg-brand-card border border-brand-teal/30 rounded-3xl w-full max-w-xl p-6 sm:p-10 shadow-2xl relative overflow-hidden"
              >
                {/* Dynamic matrix dots decorative backdrop */}
                <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
                <div className="absolute -top-12 -right-12 w-44 h-44 bg-brand-teal/20 rounded-full blur-3xl" />

                {/* Header with success badge */}
                <div className="text-center mb-8 relative">
                  <div className="w-16 h-16 bg-brand-teal/10 border border-brand-teal/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-brand-teal" />
                  </div>
                  <h3 className="text-2xl font-display font-black text-white">Payment Received Successfully!</h3>
                  <p className="text-gray-400 font-sans text-xs mt-1">S-CODERS Bharat Tech Developers Dispatch Ledger</p>
                  
                  {/* Email dispatch badge */}
                  <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>Receipt email dispatched to: <strong>{successTxn.email}</strong></span>
                  </div>
                </div>

                {/* Receipt Details Box */}
                <div className="bg-brand-dark/60 border border-white/5 rounded-2xl p-6 space-y-4 font-sans relative">
                  <div className="absolute top-4 right-4 opacity-10">
                    <Receipt className="w-16 h-16 text-brand-teal" />
                  </div>

                  <div className="flex justify-between items-center text-xs pb-3 border-b border-white/5">
                    <span className="text-gray-500 font-mono">TRANSACTION ID</span>
                    <span className="text-brand-teal font-mono font-bold tracking-wider">{successTxn.txnId}</span>
                  </div>

                  <div className="flex justify-between items-start text-xs pb-3 border-b border-white/5">
                    <span className="text-gray-500 font-mono shrink-0">CLIENT NAME</span>
                    <span className="text-white font-semibold text-right">{successTxn.clientName}</span>
                  </div>

                  <div className="flex justify-between items-start text-xs pb-3 border-b border-white/5">
                    <span className="text-gray-500 font-mono shrink-0">PURPOSE / EVENT</span>
                    <span className="text-gray-300 text-right max-w-[280px] leading-relaxed">{successTxn.purpose}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-3 border-b border-white/5">
                    <span className="text-gray-500 font-mono">PAYMENT MODE</span>
                    <span className="text-white font-mono">{successTxn.method}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-3 border-b border-white/5">
                    <span className="text-gray-500 font-mono">DATETIME</span>
                    <span className="text-gray-400 font-mono">{successTxn.timestamp}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-display font-bold text-white">TOTAL TRANSACTION AMOUNT</span>
                    <span className="text-2xl font-display font-black text-brand-teal">
                      {formatAmount(successTxn.amount, successTxn.currency)}
                    </span>
                  </div>
                </div>

                {/* Digital Verification Seal */}
                <div className="mt-6 flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-brand-teal" />
                    <div>
                      <span className="text-xs font-semibold text-white block">Verified Merchant Receipt</span>
                      <span className="text-[10px] text-gray-500 block font-mono">PG-Ref: razorpay_secure_sig</span>
                    </div>
                  </div>
                  <div className="text-[9px] font-mono border border-brand-teal/30 text-brand-teal px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                    Ledger Locked
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleCopy(JSON.stringify(successTxn, null, 2), 'receipt')}
                    className="py-3 bg-brand-dark border border-white/10 text-white font-mono text-xs font-bold rounded-xl hover:border-brand-teal/40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedField === 'receipt' ? (
                      <>
                        <Check className="w-4 h-4 text-brand-teal" />
                        Copied JSON Ledger!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy TXN JSON
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSuccessTxn(null);
                      if (onClose) onClose();
                      const targetReturnView = prefilledInvoice?.returnView || (activeTab === 'workshop' ? 'workshops' : 'services');
                      if (onNavigate && targetReturnView) onNavigate(targetReturnView);
                    }}
                    className="py-3 bg-brand-teal text-brand-dark font-mono text-xs font-bold rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-teal/20"
                  >
                    <span>{isModal ? "Return & Continue Work" : "Return to Workspace"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN GATEWAY INTERFACE WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          
          {/* LEFT: Billing Selection Panel & Invoice Parameter Settings */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Form Selector Tabs (Invoices vs. Workshops) */}
            <div className="bg-brand-card/60 border border-white/5 rounded-2xl p-2 flex gap-1">
              <button
                onClick={() => {
                  setActiveTab('invoice');
                  setAlreadyPaidNotice(null);
                  setFailureDetails(null);
                  if (presetInvoices.length > 0) {
                    handleLookupInvoice(presetInvoices[0].id);
                  }
                }}
                className={`flex-1 py-3 text-center rounded-xl font-display font-bold text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                  activeTab === 'invoice'
                    ? 'bg-brand-teal text-brand-dark shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Project Invoices
              </button>
              <button
                onClick={() => {
                  setActiveTab('workshop');
                  setClientName('');
                  setClientEmail('');
                  setAlreadyPaidNotice(null);
                  setFailureDetails(null);
                }}
                className={`flex-1 py-3 text-center rounded-xl font-display font-bold text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                  activeTab === 'workshop'
                    ? 'bg-brand-teal text-brand-dark shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Workshop Bookings
              </button>
            </div>

            {/* Tab 1 Content: Project Invoices Selector & Settings */}
            <AnimatePresence mode="wait">
              {activeTab === 'invoice' ? (
                <motion.div
                  key="invoice-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-brand-card/40 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-5"
                >
                  <div>
                    <h3 className="font-display font-bold text-lg text-white mb-1">Invoice / Deposit Settlement</h3>
                    <p className="text-gray-500 text-xs font-sans">Enter a custom billing structure or load our active demonstration presets.</p>
                  </div>

                  {/* Preset Quick Loaders */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block pl-1">Demo Invoice Quick Presets:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {presetInvoices.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setInvoiceLookup(preset.id);
                            handleLookupInvoice(preset.id);
                          }}
                          className={`p-3.5 rounded-xl border text-left transition-all ${
                            selectedInvoiceId === preset.id
                              ? 'bg-brand-teal/10 border-brand-teal/40'
                              : 'bg-brand-dark/40 border-white/5 hover:bg-brand-dark/70 hover:border-white/10'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-mono font-bold text-white">{preset.id}</span>
                            <span className="text-[10px] font-mono text-brand-teal font-semibold">
                              {preset.currency === 'INR' ? '₹' : '$'}{preset.amount}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 block truncate">{preset.client}</span>
                          <span className="text-[9px] text-gray-600 block mt-0.5">Due: {preset.dueBy}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Invoice form input */}
                  <div className="border-t border-white/5 pt-4 space-y-3.5">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block pl-1">Invoice Parameters:</span>
                    
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Invoice lookup/Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={invoiceLookup}
                          onChange={(e) => setInvoiceLookup(e.target.value)}
                          placeholder="e.g. INV-2026-001 or type custom"
                          className="w-full bg-brand-dark/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                        />
                        <Search className="w-3.5 h-3.5 text-gray-600 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Client Name *</label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Rahul Sharma Developments"
                        className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Email ID *</label>
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="e.g. billing@client.dev"
                        className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Payment Purpose / Description *</label>
                      <input
                        type="text"
                        required
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="e.g. Website development phase 1 deposit"
                        className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Transaction Value *</label>
                        <input
                          type="number"
                          required
                          value={amount || ''}
                          onChange={(e) => setAmount(Number(e.target.value))}
                          placeholder="e.g. 15000"
                          className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Currency</label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value as 'INR' | 'USD')}
                          className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-teal transition-colors cursor-pointer"
                        >
                          <option value="INR" className="bg-brand-card">INR (₹)</option>
                          <option value="USD" className="bg-brand-card">USD ($)</option>
                        </select>
                      </div>
                    </div>

                  </div>
                </motion.div>
              ) : (
                /* Tab 2 Content: Workshop Bookings Ticket Selector & Settings */
                <motion.div
                  key="workshop-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-brand-card/40 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-5"
                >
                  <div>
                    <h3 className="font-display font-bold text-lg text-white mb-1">Workshop Seat Booking</h3>
                    <p className="text-gray-500 text-xs font-sans">Settle ticket pricing and secure your access instantly.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Select Active Session *</label>
                      <select
                        value={selectedWorkshopId}
                        onChange={(e) => setSelectedWorkshopId(e.target.value)}
                        className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-teal transition-colors cursor-pointer"
                      >
                        {workshopEvents.map((w) => (
                          <option key={w.id} value={w.id} className="bg-brand-card">
                            {w.title} ({w.date.split(',')[0]})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Ticket Quantity *</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={ticketQty}
                          onChange={(e) => setTicketQty(Math.max(1, Number(e.target.value)))}
                          className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-teal transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Seat Price</label>
                        <div className="w-full bg-brand-dark/30 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-gray-400 font-mono flex items-center h-10">
                          {formatAmount(ticketPrice, 'INR')} / ticket
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4 space-y-3">
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block pl-1">Attendee Coordinates:</span>
                      
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Email ID *</label>
                        <input
                          type="email"
                          required
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="e.g. suhas@gmail.com"
                          className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                        />
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* RIGHT: High-Fidelity Multi-Channel Checkout Gateway */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-xl">
              
              {/* Checkout visual header */}
              <div className="bg-brand-dark/90 p-6 sm:p-8 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal via-brand-accent to-brand-coral" />
                
                <div>
                  <span className="text-[10px] font-mono text-brand-teal uppercase tracking-widest font-bold">Checkout Amount Due:</span>
                  <div className="text-3xl font-display font-black text-white mt-1">
                    {activeTab === 'workshop' 
                      ? formatAmount(workshopTotal, 'INR') 
                      : formatAmount(amount || 0, currency)}
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                  <Lock className="w-3.5 h-3.5 text-brand-teal" />
                  <span className="text-[10px] font-mono text-gray-400">SSL 256-Bit Encrypted</span>
                </div>
              </div>

              {/* Payment Methods sub-selector icons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 bg-brand-dark/50 border-b border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('razorpay');
                    setRuyGatewayStep('idle');
                    setValidationNotice(null);
                  }}
                  className={`py-4 text-center border-r border-white/5 font-display text-xs font-bold tracking-wider uppercase transition-all duration-300 flex flex-col items-center gap-1 cursor-pointer relative ${
                    paymentMethod === 'razorpay'
                      ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500 shadow-inner'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Razorpay</span>
                  </div>
                  <span className="text-[9px] font-mono text-gray-500">Auto Email Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('upi');
                    setRuyGatewayStep('idle');
                    setValidationNotice(null);
                  }}
                  className={`py-4 text-center border-r border-white/5 font-display text-xs font-bold tracking-wider uppercase transition-all duration-300 flex flex-col items-center gap-1 cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'bg-brand-card text-brand-teal shadow-inner'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  Ruy UPI Apps
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('card');
                    setRuyGatewayStep('idle');
                    setValidationNotice(null);
                  }}
                  className={`py-4 text-center border-r border-white/5 font-display text-xs font-bold tracking-wider uppercase transition-all duration-300 flex flex-col items-center gap-1 cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-brand-card text-brand-teal shadow-inner'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Direct Card
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('bank');
                    setRuyGatewayStep('idle');
                    setValidationNotice(null);
                  }}
                  className={`py-4 text-center font-display text-xs font-bold tracking-wider uppercase transition-all duration-300 flex flex-col items-center gap-1 cursor-pointer ${
                    paymentMethod === 'bank'
                      ? 'bg-brand-card text-brand-teal shadow-inner'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  Bank Wire
                </button>
              </div>

              {/* Checkout Interactive Content Forms */}
              <div className="p-6 sm:p-10 space-y-6">
                {/* Duplicate Payment Protection Banner (Section 9) */}
                {alreadyPaidNotice && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-white block">{alreadyPaidNotice}</span>
                        <span className="text-[11px] text-emerald-300/90 block">
                          This order has already been verified as PAID. Duplicate payments are blocked for your safety.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Validation Notice (replaces window.alert) */}
                {validationNotice && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">{validationNotice}</div>
                  </div>
                )}

                {/* Reusable Professional Payment Failure / Uncertain State UI (Sections 2, 3, 4, 5, 8, 10, 11) */}
                {failureDetails && (paymentState === 'FAILED' || paymentState === 'CANCELLED' || paymentState === 'UNKNOWN') && (
                  <PaymentFailureCard
                    failure={failureDetails}
                    paymentState={paymentState}
                    isCheckingStatus={statusCheckLoading}
                    onTryAnotherMethod={handleTryAnotherPaymentMethod}
                    onRetryPayment={handleExplicitRetryPayment}
                    onCheckStatus={handleCheckOrderStatus}
                    onCancel={() => {
                      setFailureDetails(null);
                      setPaymentState('IDLE');
                      setRuyGatewayStep('idle');
                    }}
                  />
                )}
                
                {/* Method 0: Razorpay Official Gateway with Email Receipts */}
                {paymentMethod === 'razorpay' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-2xl p-6 text-center space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Razorpay Smart Gateway Integrated</span>
                      </div>

                      <h4 className="text-xl font-display font-extrabold text-white">
                        Razorpay Multi-Method Checkout
                      </h4>
                      <p className="text-gray-300 text-xs max-w-md mx-auto leading-relaxed">
                        Pay securely using <strong>UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, or Wallets</strong>. Upon server-side verification, an automated email receipt is sent directly to the client's email address.
                      </p>

                      {/* Client Parameters Summary */}
                      <div className="bg-brand-dark/80 border border-white/10 rounded-xl p-4 text-left space-y-2 max-w-md mx-auto text-xs font-mono">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-gray-400">Client Name:</span>
                          <span className="text-white font-bold">{activeTab === 'workshop' ? (clientName || 'Workshop Attendee') : (clientName || 'Not specified')}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-gray-400">Target Email:</span>
                          <span className="text-blue-400 font-bold">{activeTab === 'workshop' ? (clientEmail || 'attendee@scoders.dev') : (clientEmail || 'Not specified')}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-gray-400">Billing Purpose:</span>
                          <span className="text-gray-200 text-right truncate max-w-[200px]">
                            {activeTab === 'workshop' ? `Booking: ${ticketQty}x Workshop Seats` : (purpose || 'Service Payment')}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-gray-400">Payable Value:</span>
                          <span className="text-emerald-400 font-extrabold text-sm">
                            {activeTab === 'workshop' ? formatAmount(workshopTotal, 'INR') : formatAmount(amount || 0, currency)}
                          </span>
                        </div>
                      </div>

                      {/* Razorpay Email Feedback Notice */}
                      {razorpayEmailNotice && !failureDetails && (
                        <div className={`p-4 rounded-xl border text-xs text-left max-w-md mx-auto flex items-start gap-2.5 ${
                          razorpayEmailNotice.type === 'SUCCESS' 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                        }`}>
                          <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                            razorpayEmailNotice.type === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'
                          }`} />
                          <div>
                            <span className="font-bold block uppercase tracking-wider text-[10px]">
                              {razorpayEmailNotice.type === 'SUCCESS' ? 'Payment Verified & Email Sent' : 'Payment Unsuccessful'}
                            </span>
                            <p className="mt-0.5 leading-normal">{razorpayEmailNotice.message}</p>
                          </div>
                        </div>
                      )}

                      {/* Launch Razorpay Popup Button */}
                      <button
                        type="button"
                        onClick={handleRazorpayCheckout}
                        disabled={loading}
                        className="w-full max-w-md mx-auto py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-display font-extrabold text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Connecting to Razorpay...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            Pay via Razorpay (Instant Email Notice)
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleProcessPayment}>
                  
                  {/* Method A: Ruy Payment Gateway UPI Selector & Flow */}
                  {paymentMethod === 'upi' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      {ruyGatewayStep === 'idle' ? (
                        <div className="space-y-6 text-center flex flex-col items-center">
                          <div className="max-w-md mx-auto">
                            <h4 className="font-display font-bold text-sm text-white mb-2">Select Your Preferred UPI Application</h4>
                            <p className="text-gray-400 text-xs font-sans leading-relaxed">
                              Select a UPI app below or use Razorpay Standard Checkout. Every transaction is linked to an official Razorpay Order and verified server-side.
                            </p>
                          </div>

                          {/* App selectors Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
                            <button
                              type="button"
                              onClick={() => handleRuyAppRedirect('phonepe')}
                              className="py-4 px-3 bg-brand-dark/60 hover:bg-brand-teal/10 border border-white/5 hover:border-brand-teal/40 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-2 group cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-full bg-indigo-600/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                <span className="font-display font-black text-xs">PP</span>
                              </div>
                              <span className="text-xs font-bold text-gray-300 group-hover:text-white">PhonePe</span>
                              <span className="text-[9px] text-gray-500 font-mono">Instant Pay</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRuyAppRedirect('gpay')}
                              className="py-4 px-3 bg-brand-dark/60 hover:bg-brand-teal/10 border border-white/5 hover:border-brand-teal/40 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-2 group cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                <span className="font-display font-black text-xs">GP</span>
                              </div>
                              <span className="text-xs font-bold text-gray-300 group-hover:text-white">Google Pay</span>
                              <span className="text-[9px] text-gray-500 font-mono">Fast Secure</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRuyAppRedirect('paytm')}
                              className="py-4 px-3 bg-brand-dark/60 hover:bg-brand-teal/10 border border-white/5 hover:border-brand-teal/40 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-2 group cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-full bg-cyan-600/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                                <span className="font-display font-black text-xs">PT</span>
                              </div>
                              <span className="text-xs font-bold text-gray-300 group-hover:text-white">Paytm</span>
                              <span className="text-[9px] text-gray-500 font-mono">Wallet/UPI</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRuyAppRedirect('bhim')}
                              className="py-4 px-3 bg-brand-dark/60 hover:bg-brand-teal/10 border border-white/5 hover:border-brand-teal/40 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-2 group cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal group-hover:scale-110 transition-transform">
                                <QrCode className="w-5 h-5" />
                              </div>
                              <span className="text-xs font-bold text-gray-300 group-hover:text-white">BHIM UPI</span>
                              <span className="text-[9px] text-gray-500 font-mono">Government</span>
                            </button>
                          </div>

                          <div className="relative flex items-center justify-center w-full max-w-md py-4">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                            <span className="relative px-3 bg-[#12131a] text-[10px] font-mono text-gray-500 uppercase">Or Scan Universal Ruy QR Code</span>
                          </div>

                          {/* Premium PhonePe Merchant Scanner Card */}
                          <PhonePeScannerCard
                            upiString={getUpiUri()}
                            merchantName="S-CODERS"
                            merchantVpa={getActiveMerchantUpi()}
                            amount={activeTab === 'workshop' ? workshopTotal : amount}
                          />

                          {/* UPI ID Details for manual typing */}
                          <div className="bg-brand-dark/50 border border-white/5 rounded-xl p-3 max-w-sm w-full flex items-center justify-between">
                            <div className="text-left">
                              <span className="text-[9px] font-mono text-gray-500 block">RUY VIRTUAL PAYMENT ADDRESS</span>
                              <span className="text-xs font-mono font-bold text-white block">{getActiveMerchantUpi()}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(getActiveMerchantUpi(), 'upi')}
                              className="p-2 bg-white/5 border border-white/10 hover:border-brand-teal text-gray-400 hover:text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === 'upi' ? (
                                <Check className="w-3.5 h-3.5 text-brand-teal" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Manual Verification */}
                          <div className="w-full max-w-sm pt-2">
                            <button
                              type="button"
                              onClick={() => handleRuyAppRedirect('generic')}
                              className="w-full py-3.5 bg-brand-teal/10 hover:bg-brand-teal/20 border border-brand-teal/30 hover:border-brand-teal/50 text-brand-teal font-display text-xs font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                            >
                              Settle with Generic UPI App
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : ruyGatewayStep === 'awaiting' ? (
                        <div className="space-y-6 text-center py-4">
                          <div className="w-16 h-16 bg-brand-teal/10 border border-brand-teal/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
                            <ShieldCheck className="w-8 h-8 text-brand-teal" />
                          </div>

                          <div className="space-y-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono uppercase tracking-wider font-bold">
                              Awaiting Server Verification
                            </span>
                            <h4 className="text-lg font-display font-black text-white">
                              Complete Payment in {selectedUpiApp === 'phonepe' ? 'PhonePe' : selectedUpiApp === 'gpay' ? 'Google Pay' : selectedUpiApp === 'paytm' ? 'Paytm' : 'Your UPI App'}
                            </h4>
                            <p className="text-gray-400 text-xs max-w-md mx-auto leading-relaxed">
                              Authorize the payment of <strong className="text-brand-teal font-bold">{activeTab === 'workshop' ? formatAmount(workshopTotal, 'INR') : formatAmount(amount || 0, currency)}</strong> inside your UPI app. The order is only marked PAID after server verification.
                            </p>
                          </div>

                          {/* Timer details */}
                          <div className="bg-brand-dark/40 border border-white/5 rounded-2xl p-4 max-w-xs mx-auto text-center space-y-1">
                            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">Checkout Session Timer</span>
                            <span className="font-mono text-2xl font-black text-brand-teal block">
                              {Math.floor(ruyTimer / 60)}:{(ruyTimer % 60).toString().padStart(2, '0')}
                            </span>
                            {razorpayOrderData?.orderId && (
                              <span className="text-[9px] font-mono text-gray-500 block">Order: {razorpayOrderData.orderId}</span>
                            )}
                          </div>

                          {/* UTR Input & Verification Actions */}
                          <div className="max-w-sm mx-auto space-y-3 text-left">
                            <div>
                              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                                Enter 12-Digit UPI Ref / UTR Number to Verify *
                              </label>
                              <input
                                type="text"
                                value={utrInput}
                                onChange={(e) => setUtrInput(e.target.value)}
                                placeholder="e.g. 419283746512"
                                className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-brand-teal"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRuyPaymentComplete()}
                              disabled={loading}
                              className="w-full py-3.5 bg-brand-teal text-brand-dark font-display font-black text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all shadow-lg shadow-brand-teal/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {loading ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  Verifying with Razorpay Server...
                                </>
                              ) : (
                                <>
                                  Verify UTR & Complete Payment
                                  <Check className="w-4 h-4" />
                                </>
                              )}
                            </button>

                            {/* Helpful buttons when PhonePe / Google Pay declines or status is uncertain */}
                            <div className="pt-2 border-t border-white/10 space-y-2">
                              <span className="block text-[10px] font-mono text-gray-400 text-center uppercase tracking-wider">
                                Having trouble with {selectedUpiApp === 'phonepe' ? 'PhonePe' : selectedUpiApp === 'gpay' ? 'Google Pay' : 'your UPI app'}?
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleReportUpiDecline('bank_security')}
                                  className="py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-[10px] font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Bank / UPI Declined</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReportUpiDecline('uncertain')}
                                  className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Status Uncertain</span>
                                </button>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setRuyGatewayStep('idle');
                                setSelectedUpiApp(null);
                                setPaymentState('IDLE');
                              }}
                              className="w-full py-2 bg-transparent text-gray-500 hover:text-white font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer text-center"
                            >
                              ← Try Another Payment Method / Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 space-y-4">
                          <RefreshCw className="w-10 h-10 text-brand-teal animate-spin mx-auto" />
                          <p className="text-white font-sans font-semibold text-sm">Verifying Transaction with Server...</p>
                          <p className="text-gray-400 text-xs max-w-xs mx-auto leading-relaxed">
                            Confirming Razorpay payment status and cryptographic verification before marking order as PAID.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Method B: Interactive Virtual Credit Card Simulator */}
                  {paymentMethod === 'card' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      {/* VIRTUAL CREDIT CARD GRAPHIC */}
                      <div className="relative w-full max-w-md h-48 sm:h-56 mx-auto rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-brand-card to-brand-dark/95">
                        
                        {/* Dynamic backdrop graphic art lines */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-brand-coral/10 rounded-full blur-2xl pointer-events-none" />

                        {/* Top layout */}
                        <div className="flex justify-between items-start relative">
                          <div>
                            <span className="text-[10px] font-mono tracking-widest text-brand-teal font-black block">S-CODERS MERCHANT</span>
                            <span className="text-[8px] font-mono text-gray-500 block uppercase">Bharat Tech Systems</span>
                          </div>
                          
                          {/* Card Chip graphic design */}
                          <div className="w-10 h-7 bg-amber-400/20 border border-amber-400/40 rounded-lg relative">
                            <div className="absolute inset-1 border-t border-b border-amber-400/30" />
                          </div>
                        </div>

                        {/* Card Number display */}
                        <div className="font-mono text-lg sm:text-2xl text-white tracking-widest text-center my-4 relative">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </div>

                        {/* Bottom layout */}
                        <div className="flex justify-between items-end relative">
                          <div>
                            <span className="text-[8px] font-mono text-gray-500 block">CARD HOLDER</span>
                            <span className="text-xs sm:text-sm font-display font-bold text-white block uppercase tracking-wider truncate max-w-[180px]">
                              {cardHolder || 'SUHAS GOWDA'}
                            </span>
                          </div>
                          <div className="flex gap-4">
                            <div>
                              <span className="text-[8px] font-mono text-gray-500 block text-right">EXPIRES</span>
                              <span className="text-xs font-mono text-white block text-right">{cardExpiry || '12/29'}</span>
                            </div>
                            <div>
                              <span className="text-[8px] font-mono text-gray-500 block text-right">CVV</span>
                              <span className="text-xs font-mono text-white block text-right">{cardCvv || '•••'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card inputs list */}
                      <div className="space-y-4 max-w-md mx-auto pt-4">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Name on Credit Card *</label>
                          <input
                            type="text"
                            required
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            placeholder="e.g. Rahul Sharma"
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Card Number *</label>
                          <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="4000 1234 5678 9010"
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Expiry Date *</label>
                            <input
                              type="text"
                              required
                              value={cardExpiry}
                              onChange={handleExpiryChange}
                              placeholder="MM/YY"
                              className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">CVV Code *</label>
                            <input
                              type="password"
                              required
                              value={cardCvv}
                              onChange={handleCvvChange}
                              placeholder="123"
                              className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors font-mono"
                            />
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-4 bg-brand-teal text-brand-dark font-display font-bold rounded-xl hover:bg-white active:scale-95 transition-all duration-300 text-sm flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-55 disabled:pointer-events-none"
                          >
                            {loading ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Verifying Secure Transaction...
                              </>
                            ) : (
                              <>
                                Authorize secure Payment
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Method C: Bank NEFT/IMPS Credentials & Verification Receipt Upload */}
                  {paymentMethod === 'bank' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      <div className="text-center max-w-md mx-auto">
                        <h4 className="font-display font-bold text-sm text-white mb-1">Direct NEFT / IMPS Bank Transfer</h4>
                        <p className="text-gray-500 text-xs font-sans">
                          Settle your balance via direct corporate wire. Once completed, upload the receipt screenshot below to verify and register credit.
                        </p>
                      </div>

                      {/* Bank Details Card Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        <div className="bg-brand-dark/50 border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] font-mono text-gray-500 block uppercase">BANK NAME</span>
                            <span className="text-xs font-display font-bold text-white block mt-0.5">HDFC Bank Ltd</span>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <div>
                              <span className="text-[8px] font-mono text-gray-500 block uppercase">BRANCH CODE</span>
                              <span className="text-[10px] font-mono text-gray-300 block mt-0.5">Bengaluru, Karnataka</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy('HDFC Bank, Bengaluru', 'branch')}
                              className="p-1 text-gray-500 hover:text-white transition-colors cursor-pointer"
                            >
                              {copiedField === 'branch' ? <Check className="w-3.5 h-3.5 text-brand-teal" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="bg-brand-dark/50 border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] font-mono text-gray-500 block uppercase">ACCOUNT NUMBER</span>
                            <span className="text-xs font-mono font-bold text-white block mt-0.5">50200088994433</span>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <div>
                              <span className="text-[8px] font-mono text-gray-500 block uppercase">IFSC CODE</span>
                              <span className="text-[10px] font-mono text-brand-teal block mt-0.5">HDFC0000104</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy('50200088994433', 'acc')}
                              className="p-1 text-gray-500 hover:text-white transition-colors cursor-pointer"
                            >
                              {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-brand-teal" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Receipt Upload Box */}
                      <div className="border border-dashed border-white/10 rounded-2xl p-6 text-center bg-brand-dark/20 space-y-4">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-400">
                          <Upload className="w-5 h-5" />
                        </div>
                        
                        {receiptFile ? (
                          <div>
                            <span className="text-xs font-mono text-brand-teal block font-semibold">{receiptName}</span>
                            <span className="text-[10px] text-gray-500 block mt-1">Receipt scanned and uploaded successfully.</span>
                            <button
                              type="button"
                              onClick={() => {
                                setReceiptFile(null);
                                setReceiptName('');
                              }}
                              className="text-[10px] text-brand-coral font-mono hover:underline mt-2 cursor-pointer"
                            >
                              Remove file
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-gray-400 font-sans">
                              Drag and drop your transaction receipt / PDF, or{' '}
                              <button
                                type="button"
                                onClick={handleReceiptMockUpload}
                                className="text-brand-teal font-medium hover:underline cursor-pointer"
                              >
                                click to browse simulator
                              </button>
                            </p>
                            <span className="text-[9px] text-gray-600 block mt-1">Supports PNG, JPG, PDF up to 5MB</span>
                          </div>
                        )}
                      </div>

                      {/* Submit Wire transaction Verification */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={loading || !receiptFile}
                          className="w-full px-6 py-4 bg-brand-teal text-brand-dark font-display font-bold rounded-xl hover:bg-white active:scale-95 transition-all duration-300 text-sm flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-55 disabled:pointer-events-none"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Verifying Wire Logs...
                            </>
                          ) : (
                            <>
                              {!receiptFile ? 'Upload Receipt to Verify' : 'Verify Wire & Settle Payment'}
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                </form>
              </div>

            </div>

            {/* Compliance security details */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl text-xs text-gray-500 font-sans">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-teal" />
                <span>PCI-DSS Compliant Gateway. S-CODERS is Razorpay verified.</span>
              </div>
              <span className="font-mono text-[10px]">MID: SCODERS_IND_8422</span>
            </div>

          </div>

        </div>

        {/* PAYMENT HISTORY LOG / LEDGER REGISTRY */}
        <div className="max-w-5xl mx-auto pt-16 border-t border-white/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="font-display font-extrabold text-2xl text-white">Client Payment Ledger</h3>
              <p className="text-gray-500 text-xs font-sans">Your historic billing, settlement transactions, and workshop credentials logs.</p>
            </div>
            
            {paymentHistory.length > 0 && (
              <button
                onClick={() => {
                  setPaymentHistory([]);
                  localStorage.removeItem('scoders_payments');
                }}
                className="text-[10px] font-mono text-brand-coral uppercase tracking-wider hover:underline cursor-pointer"
              >
                Clear History Logs
              </button>
            )}
          </div>

          <div className="bg-brand-card/20 border border-white/5 rounded-2xl overflow-hidden">
            {paymentHistory.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-500">
                  <FileText className="w-5 h-5" />
                </div>
                <p className="text-gray-500 text-xs font-sans max-w-sm mx-auto">
                  No active transactions recorded yet. Choose an invoice preset or workshop above and perform a test checkout!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-dark border-b border-white/5 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                      <th className="p-4 pl-6">TXN ID</th>
                      <th className="p-4">CLIENT/CONTACT</th>
                      <th className="p-4">PURPOSE</th>
                      <th className="p-4">METHOD</th>
                      <th className="p-4">DATETIME</th>
                      <th className="p-4 text-right">VALUE</th>
                      <th className="p-4 pr-6 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {paymentHistory.map((history) => (
                      <tr key={history.txnId} className="hover:bg-white/[2%] transition-colors">
                        <td className="p-4 pl-6 font-mono font-bold text-brand-teal">{history.txnId.replace('SCO-TXN-', '')}</td>
                        <td className="p-4 font-sans">
                          <span className="text-white block font-medium">{history.clientName}</span>
                          <span className="text-[10px] text-gray-500 block mt-0.5">{history.email}</span>
                        </td>
                        <td className="p-4 font-sans text-gray-300 max-w-xs truncate" title={history.purpose}>
                          {history.purpose}
                        </td>
                        <td className="p-4 font-mono text-gray-400">{history.method}</td>
                        <td className="p-4 font-mono text-gray-500">{history.timestamp.split(',')[0]}</td>
                        <td className="p-4 text-right font-display font-black text-white">
                          {formatAmount(history.amount, history.currency)}
                        </td>
                        <td className="p-4 pr-6 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-brand-teal/10 border border-brand-teal/20 text-brand-teal font-mono text-[9px] font-bold rounded">
                            SUCCESS
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Razorpay Gateway Modal */}
        {razorpayPaymentDetails && (
          <RazorpayModal
            isOpen={showRazorpayModal}
            onClose={() => {
              setShowRazorpayModal(false);
              if (paymentState !== 'SUCCESS') {
                setPaymentState('CANCELLED');
              }
            }}
            onFailure={(reason) => {
              setShowRazorpayModal(false);
              const classified = classifyPaymentFailure({
                rawReason: reason,
                failedMethod: 'Razorpay Checkout',
                orderId: razorpayOrderData?.orderId,
              });
              setPaymentState(classified.state);
              setFailureDetails(classified);
              setRazorpayEmailNotice({
                sent: false,
                email: '',
                type: 'FAILED',
                message: classified.primaryMessage
              });
            }}
            onSuccess={handleRazorpaySuccess}
            orderData={razorpayOrderData}
            paymentDetails={razorpayPaymentDetails}
          />
        )}

        {/* Official Email Notification Modal from scoders82@gmail.com */}
        <EmailNotificationModal
          isOpen={showEmailNotice}
          onClose={() => setShowEmailNotice(false)}
          data={emailNoticeData}
        />

      </div>
    </section>
  );
}
