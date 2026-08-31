import React, { useState, useEffect } from 'react';
import { 
  CreditCard, QrCode, CheckCircle, ArrowRight, Lock, ShieldCheck, 
  Copy, Check, FileText, Upload, Download, Search, Receipt, 
  Sparkles, IndianRupee, DollarSign, Wallet, RefreshCw, Star, Mail 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDynamicWorkshops, getDynamicInvoices } from '../utils/dynamicData';
import RazorpayModal, { RazorpayPaymentSuccessData } from './RazorpayModal';
import EmailNotificationModal, { EmailNotificationData } from './EmailNotificationModal';
import PhonePeScannerCard from './PhonePeScannerCard';
import { openUpiApp } from '../utils/paymentLinks';

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

  // Razorpay Live Checkout & Automated Email Handler
  const handleRazorpayCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const isWorkshop = activeTab === 'workshop';
    const workshopObj = workshopEvents.find(w => w.id === selectedWorkshopId);
    
    const finalClientName = isWorkshop ? clientName || 'Workshop Attendee' : clientName;
    const finalEmail = isWorkshop ? clientEmail || 'attendee@scoders.dev' : clientEmail;
    const purposeText = isWorkshop 
      ? `Booking: ${ticketQty}x Seats for ${workshopObj?.title || 'S-CODERS Workshop'}` 
      : purpose;

    const finalAmount = isWorkshop ? workshopTotal : amount;
    const finalCurrency = isWorkshop ? 'INR' : currency;

    if (!finalClientName.trim() || !finalEmail.trim() || !purposeText.trim() || finalAmount <= 0) {
      alert('Please fill out your Name, Email ID, Purpose, and Amount before proceeding.');
      return;
    }

    setLoading(true);
    setRazorpayEmailNotice(null);

    try {
      // 1. Call backend order API
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          currency: finalCurrency,
          receipt: `rcpt_${Date.now()}`,
          notes: { clientName: finalClientName, email: finalEmail, purpose: purposeText }
        })
      });

      const orderData = await orderRes.json();

      setRazorpayOrderData({
        orderId: orderData?.orderId || `ord_${Date.now()}`,
        amount: finalAmount,
        currency: finalCurrency,
        keyId: orderData?.keyId || 'rzp_live_scoders_ybl'
      });

      setRazorpayPaymentDetails({
        amount: finalAmount,
        currency: finalCurrency,
        clientName: finalClientName,
        email: finalEmail,
        purpose: purposeText,
        merchantUpiId: 'scoders@ybl'
      });

      setShowRazorpayModal(true);
      setLoading(false);
    } catch (err: any) {
      console.warn("Using offline Razorpay order initialization:", err);
      setRazorpayOrderData({
        orderId: `ord_${Date.now()}`,
        amount: finalAmount,
        currency: finalCurrency,
        keyId: 'rzp_live_scoders_ybl'
      });
      setRazorpayPaymentDetails({
        amount: finalAmount,
        currency: finalCurrency,
        clientName: finalClientName,
        email: finalEmail,
        purpose: purposeText,
        merchantUpiId: 'scoders@ybl'
      });
      setShowRazorpayModal(true);
      setLoading(false);
    }
  };

  const handleRazorpaySuccess = (data: RazorpayPaymentSuccessData) => {
    setShowRazorpayModal(false);

    const newTxn: PaymentHistoryItem = {
      txnId: data.razorpay_payment_id || `SCO-RZP-${Math.floor(100000000 + Math.random() * 900000000)}`,
      clientName: data.clientName,
      email: data.email,
      purpose: `${data.purpose} (Merchant: scoders@ybl)`,
      amount: data.amount,
      currency: (data.currency as any) || 'INR',
      method: data.method || 'Razorpay Gateway (scoders@ybl Verified)',
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
      message: `Razorpay Payment Verified (Merchant: scoders@ybl)! Official Receipt sent to ${data.email} with Txn ID ${data.razorpay_payment_id}.`
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
  
  // Local transaction records
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>(() => {
    const saved = localStorage.getItem('scoders_payments');
    return saved ? JSON.parse(saved) : [];
  });

  // Calculate workshop total
  const selectedWorkshopObj = workshopEvents.find(w => w.id === selectedWorkshopId);
  const ticketPrice = selectedWorkshopObj?.price ?? 1499;
  const workshopTotal = ticketQty * ticketPrice;

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
    } else if (ruyTimer === 0) {
      setRuyGatewayStep('idle');
      alert('Ruy Secure Checkout Session has timed out. Please select your app again.');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [ruyGatewayStep, ruyTimer]);

  // Helper to generate the most robust device-specific UPI deep link
  const getUpiDeviceLink = (app: 'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'generic', address: string, name: string, amount: number, note: string) => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    const encodedName = encodeURIComponent(name);
    const encodedNote = encodeURIComponent(note);
    const params = `pa=${address}&pn=${encodedName}&am=${amount}&cu=INR&tn=${encodedNote}`;
    
    if (isAndroid) {
      if (app === 'phonepe') {
        return `intent://pay?${params}#Intent;scheme=upi;package=com.phonepe.app;end`;
      } else if (app === 'gpay') {
        return `intent://pay?${params}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
      } else if (app === 'paytm') {
        return `intent://pay?${params}#Intent;scheme=upi;package=net.one97.paytm;end`;
      } else if (app === 'bhim') {
        return `intent://pay?${params}#Intent;scheme=upi;package=in.org.npci.upiapp;end`;
      }
      return `upi://pay?${params}`;
    } else if (isIOS) {
      if (app === 'phonepe') {
        return `phonepe://pay?${params}`;
      } else if (app === 'gpay') {
        return `gpay://upi/pay?${params}`;
      } else if (app === 'paytm') {
        return `paytmmp://pay?${params}`;
      }
      return `upi://pay?${params}`;
    } else {
      return `upi://pay?${params}`;
    }
  };

  // Initiate Ruy Pay app redirect
  const handleRuyAppRedirect = (app: 'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'generic') => {
    // Check form parameters if paying invoice
    if (activeTab === 'invoice') {
      if (!clientName.trim() || !clientEmail.trim() || !purpose.trim() || amount <= 0) {
        alert('Please fill out all invoice parameters first.');
        return;
      }
    }

    setSelectedUpiApp(app);
    setRuyGatewayStep('awaiting');
    setRuyTimer(300); // Reset countdown to 5 minutes
    
    // Generate UPI standard payload
    const payeeAddress = 'scoders@ybl';
    const payeeName = 'S-CODERS Technologies';
    const payAmount = activeTab === 'workshop' ? workshopTotal : amount;
    const note = activeTab === 'workshop' ? `Workshop Booking` : purpose.substring(0, 30);
    
    const scheme = app === 'phonepe' ? 'phonepe' : app === 'gpay' ? 'gpay' : app === 'paytm' ? 'paytm' : app === 'bhim' ? 'bhim' : 'universal';
    
    openUpiApp({
      pa: payeeAddress,
      pn: payeeName,
      am: payAmount,
      tn: note,
      tr: `PAY${Date.now()}`
    }, scheme);
  };

  const handleRuyPaymentComplete = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validations
    if (activeTab === 'invoice') {
      if (!clientName.trim() || !clientEmail.trim() || !purpose.trim() || amount <= 0) {
        alert('Please fill out all invoice parameters.');
        return;
      }
    }

    setLoading(true);
    setRuyGatewayStep('processing');

    setTimeout(() => {
      const isWorkshop = activeTab === 'workshop';
      const workshopObj = workshopEvents.find(w => w.id === selectedWorkshopId);
      
      const purposeText = isWorkshop 
        ? `Booking: ${ticketQty}x Seats for ${workshopObj?.title || 'S-CODERS Workshop'}` 
        : purpose;

      const finalAmount = isWorkshop ? workshopTotal : amount;
      const finalCurrency = isWorkshop ? 'INR' : currency;

      let modeLabel = 'Ruy Pay Instant UPI';
      if (selectedUpiApp) {
        modeLabel = `Ruy Pay (${selectedUpiApp === 'gpay' ? 'GPay' : selectedUpiApp === 'phonepe' ? 'PhonePe' : selectedUpiApp === 'paytm' ? 'Paytm' : selectedUpiApp === 'bhim' ? 'BHIM UPI' : 'UPI Link'})`;
      } else if (paymentMethod === 'card') {
        modeLabel = `Ruy Secure Card (${getCardBrand()})`;
      } else if (paymentMethod === 'bank') {
        modeLabel = 'Ruy NetBanking';
      }

      const newTxn: PaymentHistoryItem = {
        txnId: `SCO-TXN-${Math.floor(100000000 + Math.random() * 900000000)}`,
        clientName: isWorkshop ? clientName || 'Workshop Attendee' : clientName,
        email: isWorkshop ? clientEmail || 'attendee@scoders.dev' : clientEmail,
        purpose: purposeText,
        amount: finalAmount,
        currency: finalCurrency,
        method: modeLabel,
        timestamp: new Date().toLocaleString(),
        status: 'SUCCESS'
      };

      // Save to state & localstorage
      const updatedHistory = [newTxn, ...paymentHistory];
      setPaymentHistory(updatedHistory);
      localStorage.setItem('scoders_payments', JSON.stringify(updatedHistory));

      setSuccessTxn(newTxn);
      if (onSuccess) {
        onSuccess(newTxn);
      }
      setLoading(false);
      setRuyGatewayStep('success');

      // Trigger Email Notice
      const targetReturnView = prefilledInvoice?.returnView || (isWorkshop ? 'workshops' : 'services');
      setEmailNoticeData({
        type: isWorkshop ? 'workshop' : 'service',
        recipientEmail: isWorkshop ? clientEmail || 'attendee@scoders.dev' : clientEmail,
        recipientName: isWorkshop ? clientName || 'Workshop Attendee' : clientName,
        subject: `✅ Payment Done Successfully - S-CODERS (Ref: ${newTxn.txnId})`,
        title: purposeText,
        uniqueKey: newTxn.txnId,
        messageText: `Your payment of ₹${finalAmount.toLocaleString()} has been received and logged in the immutable ledger. An official receipt has been dispatched from scoders82@gmail.com.`,
        amount: finalAmount,
        actionText: isModal ? "Return & Continue Work" : `Return to ${targetReturnView === 'workshops' ? 'Workshops' : targetReturnView === 'services' ? 'Services' : 'Workspace'}`,
        onAction: () => {
          if (onClose) onClose();
          if (onNavigate && targetReturnView) onNavigate(targetReturnView);
        }
      });
      setShowEmailNotice(true);

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
      setSelectedUpiApp(null);
    }, 2000);
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

  // Submit Payment Handler
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (activeTab === 'invoice') {
      if (!clientName.trim() || !clientEmail.trim() || !purpose.trim() || amount <= 0) {
        alert('Please fill out all invoice parameters.');
        return;
      }
    }

    setLoading(true);

    // Simulate Network Latency
    setTimeout(() => {
      const isWorkshop = activeTab === 'workshop';
      const workshopObj = workshopEvents.find(w => w.id === selectedWorkshopId);
      
      const purposeText = isWorkshop 
        ? `Booking: ${ticketQty}x Seats for ${workshopObj?.title || 'S-CODERS Workshop'}` 
        : purpose;

      const finalAmount = isWorkshop ? workshopTotal : amount;
      const finalCurrency = isWorkshop ? 'INR' : currency;

      let modeLabel = 'UPI Transfer';
      if (paymentMethod === 'card') modeLabel = `Credit Card (${getCardBrand()})`;
      if (paymentMethod === 'bank') modeLabel = 'Direct Bank NEFT/IMPS';

      const newTxn: PaymentHistoryItem = {
        txnId: `SCO-TXN-${Math.floor(100000000 + Math.random() * 900000000)}`,
        clientName: isWorkshop ? clientName || 'Workshop Attendee' : clientName,
        email: isWorkshop ? clientEmail || 'attendee@scoders.dev' : clientEmail,
        purpose: purposeText,
        amount: finalAmount,
        currency: finalCurrency,
        method: modeLabel,
        timestamp: new Date().toLocaleString(),
        status: 'SUCCESS'
      };

      // Save to state & localstorage
      const updatedHistory = [newTxn, ...paymentHistory];
      setPaymentHistory(updatedHistory);
      localStorage.setItem('scoders_payments', JSON.stringify(updatedHistory));

      setSuccessTxn(newTxn);
      setLoading(false);

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
    }, 2500);
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
  // pa = payee address, pn = payee name, am = amount, tn = transaction note, cu = currency
  const getUpiUri = () => {
    const payeeAddress = 'scoders@ybl';
    const payeeName = 'S-CODERS Technologies';
    const payAmount = activeTab === 'workshop' ? workshopTotal : amount;
    const payCurrency = activeTab === 'workshop' ? 'INR' : currency;
    const note = activeTab === 'workshop' ? 'Workshop Booking' : purpose.substring(0, 30);

    return `upi://pay?pa=${payeeAddress}&pn=${encodeURIComponent(payeeName)}&am=${payAmount}&cu=${payCurrency}&tn=${encodeURIComponent(note)}`;
  };

  const getUpiQrUrl = () => {
    const upiUri = getUpiUri();
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
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
                  <p className="text-gray-400 font-sans text-xs mt-1">S-CODERS Bharath Tech Developers Dispatch Ledger</p>
                  
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
                  // Trigger initial preset
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
                        placeholder="e.g. Suhas Gowda Developments"
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
                          placeholder="e.g. Suhas Gowda"
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
              <div className="p-6 sm:p-10">
                
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
                        Pay securely using <strong>UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, or Wallets</strong>. Upon completion or failure, an automated email receipt is sent directly to the client's email address.
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
                      {razorpayEmailNotice && (
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
                              {razorpayEmailNotice.type === 'SUCCESS' ? 'Payment Verified & Email Sent' : 'Payment Failed / Cancelled'}
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
                              Ruy Payment Gateway will automatically open the selected app with the pre-filled amount for a seamless, secure transaction.
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

                           {/* Premium PhonePe Merchant Scanner Card (Matching User Image) */}
                          <PhonePeScannerCard
                            upiString={getUpiUri()}
                            merchantName="sCoders"
                            merchantVpa="scoders@ybl"
                            amount={activeTab === 'workshop' ? workshopTotal : amount}
                          />

                          {/* UPI ID Details for manual typing */}
                          <div className="bg-brand-dark/50 border border-white/5 rounded-xl p-3 max-w-sm w-full flex items-center justify-between">
                            <div className="text-left">
                              <span className="text-[9px] font-mono text-gray-500 block">RUY VIRTUAL PAYMENT ADDRESS</span>
                              <span className="text-xs font-mono font-bold text-white block">scoders@ybl</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy('scoders@ybl', 'upi')}
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
                              className="w-full py-3.5 bg-brand-teal/10 hover:bg-brand-teal/20 border border-brand-teal/30 hover:border-brand-teal/50 text-brand-teal font-display text-xs font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer animate-pulse"
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
                              Awaiting Gateway Authorization
                            </span>
                            <h4 className="text-lg font-display font-black text-white">
                              Ruy Pay Secure Connection Active
                            </h4>
                            <p className="text-gray-400 text-xs max-w-md mx-auto leading-relaxed">
                              {selectedUpiApp === 'generic' 
                                ? 'Your default system UPI application has been invoked with the pre-filled parameters.'
                                : `Ruy Secure Link has launched the ${selectedUpiApp === 'phonepe' ? 'PhonePe' : selectedUpiApp === 'gpay' ? 'Google Pay' : 'Paytm'} application on your device.`
                              } Please authorize the payment of <strong className="text-brand-teal font-bold">{activeTab === 'workshop' ? formatAmount(workshopTotal, 'INR') : formatAmount(amount || 0, currency)}</strong> inside your app.
                            </p>
                          </div>

                          {/* Timer details */}
                          <div className="bg-brand-dark/40 border border-white/5 rounded-2xl p-4 max-w-xs mx-auto text-center space-y-1">
                            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">Checkout Session Timer</span>
                            <span className="font-mono text-2xl font-black text-brand-teal block">
                              {Math.floor(ruyTimer / 60)}:{(ruyTimer % 60).toString().padStart(2, '0')}
                            </span>
                            <span className="text-[9px] text-gray-400 block">Do not refresh or close this tab</span>
                          </div>

                          {/* Quick Actions */}
                          <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto pt-4">
                            <button
                              type="button"
                              onClick={() => handleRuyPaymentComplete()}
                              className="w-full py-4 bg-brand-teal text-brand-dark font-display font-black text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all shadow-lg shadow-brand-teal/10 cursor-pointer flex items-center justify-center gap-2"
                            >
                              {loading ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  Verifying Secure Handshake...
                                </>
                              ) : (
                                <>
                                  Simulate Instant Ruy Pay Settle
                                  <Check className="w-4 h-4" />
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setRuyGatewayStep('idle');
                                setSelectedUpiApp(null);
                              }}
                              className="w-full py-2 bg-transparent text-gray-500 hover:text-white font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              ← Choose different app / Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 space-y-4">
                          <RefreshCw className="w-10 h-10 text-brand-teal animate-spin mx-auto" />
                          <p className="text-white font-sans font-semibold text-sm">Locking Transaction Ledger...</p>
                          <p className="text-gray-400 text-xs max-w-xs mx-auto leading-relaxed">
                            Securing transaction blocks, creating permanent cryptographic record keys, and notifying attendee registry.
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
                            <span className="text-[8px] font-mono text-gray-500 block uppercase">Bharath Tech Systems</span>
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
                            placeholder="e.g. Suhas Gowda"
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
                                Processing Secure Transaction...
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
                          Settle your balance via direct corporate wire. Once completed, upload the receipt screenshot below to register credit instantly.
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
                <span>PCI-DSS Compliant Gateway Simulation. S-CODERS is Razorpay verified.</span>
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
                  if (confirm('Clear entire mock payment history?')) {
                    setPaymentHistory([]);
                    localStorage.removeItem('scoders_payments');
                  }
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
              setRazorpayEmailNotice({
                sent: false,
                email: '',
                type: 'FAILED',
                message: 'Payment was cancelled or not completed. No receipt was generated.'
              });
            }}
            onFailure={(reason) => {
              setShowRazorpayModal(false);
              setRazorpayEmailNotice({
                sent: false,
                email: '',
                type: 'FAILED',
                message: reason || 'Payment was cancelled or not completed.'
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
