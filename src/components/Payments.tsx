import React, { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle, ArrowRight, ShieldCheck, 
  Copy, Check, FileText, Sparkles, Wallet, RefreshCw, Mail, 
  Zap, Lock, Star, ChevronRight, Layers, Award, Terminal, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDynamicWorkshops, getDynamicInvoices } from '../utils/dynamicData';
import RazorpayModal, { RazorpayPaymentSuccessData } from './RazorpayModal';
import EmailNotificationModal, { EmailNotificationData } from './EmailNotificationModal';
import { getActiveMerchantUpi } from '../utils/paymentLinks';

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

export default function Payments({
  initialTab,
  prefilledInvoice,
  prefilledWorkshopId,
  isModal = false,
  onSuccess,
  onClose,
  onNavigate
}: PaymentsProps) {
  const dynamicWorkshops = getDynamicWorkshops();
  const defaultWorkshop = dynamicWorkshops[0] || {
    id: 'ai-fullstack',
    title: 'AI Full-Stack Engineering Bootcamp',
    price: 1499,
  };

  // State for Video-Style Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<{
    purpose: string;
    amount: number;
    currency: 'INR' | 'USD';
    clientName?: string;
    email?: string;
    phone?: string;
  }>({
    purpose: 'CS Student OS (Pro)',
    amount: 299,
    currency: 'INR',
  });

  // Custom invoice input states
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState('INV-2026-001');
  const [customClientName, setCustomClientName] = useState('');
  const [customClientEmail, setCustomClientEmail] = useState('');
  const [customClientPhone, setCustomClientPhone] = useState('');
  const [customPurpose, setCustomPurpose] = useState('Phase 1 Web Development Deposit');
  const [customAmount, setCustomAmount] = useState<number>(5000);
  const [customCurrency, setCustomCurrency] = useState<'INR' | 'USD'>('INR');

  // Success Receipt & Email Modal state
  const [successTxn, setSuccessTxn] = useState<PaymentHistoryItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showEmailNotice, setShowEmailNotice] = useState(false);
  const [emailNoticeData, setEmailNoticeData] = useState<EmailNotificationData | null>(null);

  // Local transaction ledger records
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>(() => {
    const saved = localStorage.getItem('scoders_payments');
    return saved ? JSON.parse(saved) : [];
  });

  // Handle prefilled invoice / workshop props if passed from other views
  useEffect(() => {
    if (prefilledInvoice) {
      setCheckoutItem({
        purpose: prefilledInvoice.purpose,
        amount: prefilledInvoice.amount,
        currency: prefilledInvoice.currency,
        clientName: prefilledInvoice.client,
        email: prefilledInvoice.contact,
      });
      setIsCheckoutOpen(true);
    } else if (prefilledWorkshopId) {
      const found = dynamicWorkshops.find(w => w.id === prefilledWorkshopId);
      if (found) {
        setCheckoutItem({
          purpose: `Workshop Pass: ${found.title}`,
          amount: found.price ?? 1499,
          currency: 'INR',
        });
        setIsCheckoutOpen(true);
      }
    }
  }, [prefilledInvoice, prefilledWorkshopId]);

  // Open Checkout for a specific item (matching the video's card click)
  const handleOpenItemCheckout = (title: string, price: number, curr: 'INR' | 'USD' = 'INR') => {
    setCheckoutItem({
      purpose: title,
      amount: price,
      currency: curr,
      clientName: customClientName || '',
      email: customClientEmail || '',
      phone: customClientPhone || '',
    });
    setIsCheckoutOpen(true);
  };

  // Open Checkout for Custom Invoice
  const handleCustomInvoiceCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAmount <= 0) return;
    setCheckoutItem({
      purpose: `${customPurpose} (${customInvoiceNumber})`,
      amount: customAmount,
      currency: customCurrency,
      clientName: customClientName,
      email: customClientEmail,
      phone: customClientPhone,
    });
    setIsCheckoutOpen(true);
  };

  // Payment verified callback from Razorpay Checkout
  const handlePaymentSuccess = (data: RazorpayPaymentSuccessData) => {
    setIsCheckoutOpen(false);
    const activeVpa = getActiveMerchantUpi();

    const newTxn: PaymentHistoryItem = {
      txnId: data.razorpay_payment_id || `SCO-RZP-${Math.floor(100000000 + Math.random() * 900000000)}`,
      clientName: data.clientName,
      email: data.email,
      purpose: data.purpose,
      amount: data.amount,
      currency: (data.currency as any) || 'INR',
      method: data.method || `Razorpay Checkout (${activeVpa})`,
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

    // Trigger Popup Email Notice
    setEmailNoticeData({
      type: 'service',
      recipientEmail: data.email,
      recipientName: data.clientName,
      subject: `✅ Razorpay Payment Verified - S-CODERS (Ref: ${data.razorpay_payment_id})`,
      title: data.purpose,
      uniqueKey: data.razorpay_payment_id,
      messageText: `Your payment of ₹${data.amount.toLocaleString()} has been received and verified successfully. An official receipt has been dispatched to ${data.email} from scoders82@gmail.com.`,
      amount: data.amount,
      actionText: isModal ? "Return & Continue Work" : "Return to Workspace",
      onAction: () => {
        if (onClose) onClose();
        if (onNavigate) onNavigate('workshops');
      }
    });
    setShowEmailNotice(true);
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Format currency helper
  const formatAmount = (val: number, cur: 'INR' | 'USD') => {
    return new Intl.NumberFormat(cur === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <section id="payments" className={`${isModal ? 'py-6 sm:py-10' : 'py-20 sm:py-28'} bg-[#120f0e] text-white relative overflow-hidden font-sans`}>
      {/* Decorative ambient background glows */}
      <div className="absolute left-1/4 top-1/4 w-[500px] h-[500px] bg-[#521714]/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/4 w-[400px] h-[400px] bg-[#22d3ee]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Trust Header Badges (Matching video 00:00 - 00:06) */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-mono text-[#b89f9a] mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#261f1d] border border-[#3b302d]">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>instant delivery</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#261f1d] border border-[#3b302d]">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>lifetime access</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#261f1d] border border-[#3b302d]">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              <span>7-day money-back</span>
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-[#fbf6f3] mb-4">
            checkout & digital pass portal
          </h2>
          <p className="text-[#a89995] font-sans text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Get instant access to our engineering systems, developer workshops, or settle custom project milestone invoices. 100% secured by Razorpay.
          </p>
        </div>

        {/* ============================================================== */}
        {/* PRODUCT CARDS GRID (Matching video 00:00 - 00:15)              */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-16">
          
          {/* CARD 1: CS Student OS (Pro) • ₹299 (Exact Video Match) */}
          <div className="bg-[#1b1716] border border-[#362b29] hover:border-[#6b221e] rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#521714]/20 rounded-full blur-2xl pointer-events-none" />
            
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest text-[#f87171] bg-[#451210]/60 border border-[#6b201c] px-2.5 py-1 rounded-full">
                  <Star className="w-3 h-3 fill-current text-rose-400" />
                  Most popular • Bestseller
                </span>
                <span className="text-xs font-mono text-[#8f827f]">Single Payment</span>
              </div>

              {/* Title & Description */}
              <h3 className="text-2xl font-serif font-black text-white group-hover:text-[#ffded9] transition-colors mb-2">
                cs student os (pro)
              </h3>
              <p className="text-xs text-[#aba09d] leading-relaxed mb-5 font-sans">
                Don't just graduate, get hired! The only system designed to crush LeetCode, ship projects, and secure your placement. Includes Advanced Habit Tracker & Multi-Project Goal Planner.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-[10px] font-mono text-[#d1c5c2] bg-[#27201e] px-2.5 py-1 rounded-lg border border-[#3b302e]">
                  productivity
                </span>
                <span className="text-[10px] font-mono text-[#d1c5c2] bg-[#27201e] px-2.5 py-1 rounded-lg border border-[#3b302e]">
                  placement prep
                </span>
                <span className="text-[10px] font-mono text-[#d1c5c2] bg-[#27201e] px-2.5 py-1 rounded-lg border border-[#3b302e]">
                  works on notion
                </span>
              </div>
            </div>

            {/* Price & CTA Button */}
            <div className="pt-4 border-t border-[#2e2523] flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-[#8f827f] uppercase block">Lifetime Pass</span>
                <span className="text-3xl font-serif font-black text-white">₹299</span>
              </div>

              <button
                type="button"
                onClick={() => handleOpenItemCheckout('cs student os (pro)', 299)}
                className="px-6 py-3.5 bg-[#521714] hover:bg-[#6b1e1b] active:bg-[#401210] text-[#ffded9] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-black/50 cursor-pointer flex items-center gap-2 group-hover:scale-[1.02]"
              >
                <span>get instant access</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CARD 2: Semester Student OS (Lite) • ₹199 (Exact Video Match) */}
          <div className="bg-[#1b1716] border border-[#362b29] hover:border-[#6b221e] rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl relative overflow-hidden group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest text-[#a89c99] bg-[#292220] border border-[#3b302d] px-2.5 py-1 rounded-full">
                  Semester Essentials
                </span>
                <span className="text-xs font-mono text-[#8f827f]">Single Payment</span>
              </div>

              <h3 className="text-2xl font-serif font-black text-white group-hover:text-[#ffded9] transition-colors mb-2">
                semester student os (lite)
              </h3>
              <p className="text-xs text-[#aba09d] leading-relaxed mb-5 font-sans">
                One semester. One system. One better version of you. Complete with Daily Command Dashboard, Habit Consistency Tracker, and coursework checklist.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-[10px] font-mono text-[#d1c5c2] bg-[#27201e] px-2.5 py-1 rounded-lg border border-[#3b302e]">
                  daily command
                </span>
                <span className="text-[10px] font-mono text-[#d1c5c2] bg-[#27201e] px-2.5 py-1 rounded-lg border border-[#3b302e]">
                  habit tracker
                </span>
                <span className="text-[10px] font-mono text-[#d1c5c2] bg-[#27201e] px-2.5 py-1 rounded-lg border border-[#3b302e]">
                  academic os
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#2e2523] flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-[#8f827f] uppercase block">Full Semester</span>
                <span className="text-3xl font-serif font-black text-white">₹199</span>
              </div>

              <button
                type="button"
                onClick={() => handleOpenItemCheckout('semester student os (lite)', 199)}
                className="px-6 py-3.5 bg-[#521714] hover:bg-[#6b1e1b] active:bg-[#401210] text-[#ffded9] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-black/50 cursor-pointer flex items-center gap-2 group-hover:scale-[1.02]"
              >
                <span>get instant access</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CARD 3: AI Full-Stack Engineering Bootcamp Pass • ₹1,499 */}
          <div className="bg-[#1b1716] border border-[#362b29] hover:border-[#6b221e] rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl relative overflow-hidden group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  Live Workshop Bootcamp
                </span>
                <span className="text-xs font-mono text-[#8f827f]">2 Days • 8 Hours</span>
              </div>

              <h3 className="text-2xl font-serif font-black text-white group-hover:text-[#ffded9] transition-colors mb-2">
                {defaultWorkshop.title}
              </h3>
              <p className="text-xs text-[#aba09d] leading-relaxed mb-5 font-sans">
                Interactive live classroom pass with technical mentors, verified digital session credentials, source code sandboxes, and recorded replays.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-[10px] font-mono text-[#d1c5c2] bg-[#27201e] px-2.5 py-1 rounded-lg border border-[#3b302e]">
                  zoom live access
                </span>
                <span className="text-[10px] font-mono text-[#d1c5c2] bg-[#27201e] px-2.5 py-1 rounded-lg border border-[#3b302e]">
                  pass key verification
                </span>
                <span className="text-[10px] font-mono text-[#d1c5c2] bg-[#27201e] px-2.5 py-1 rounded-lg border border-[#3b302e]">
                  completion certificate
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#2e2523] flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-[#8f827f] uppercase block">Workshop Pass</span>
                <span className="text-3xl font-serif font-black text-white">₹{(defaultWorkshop.price ?? 1499).toLocaleString()}</span>
              </div>

              <button
                type="button"
                onClick={() => handleOpenItemCheckout(defaultWorkshop.title, defaultWorkshop.price ?? 1499)}
                className="px-6 py-3.5 bg-[#521714] hover:bg-[#6b1e1b] active:bg-[#401210] text-[#ffded9] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-black/50 cursor-pointer flex items-center gap-2 group-hover:scale-[1.02]"
              >
                <span>get instant access</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CARD 4: Custom Project Deposit / Client Milestone Settlement */}
          <div className="bg-[#1b1716] border border-[#362b29] hover:border-[#6b221e] rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl relative overflow-hidden group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-full">
                  <Terminal className="w-3 h-3" />
                  Client Settlement Portal
                </span>
                <span className="text-xs font-mono text-[#8f827f]">Custom Amount</span>
              </div>

              <h3 className="text-2xl font-serif font-black text-white group-hover:text-[#ffded9] transition-colors mb-2">
                Custom Invoice / Milestone Deposit
              </h3>
              <p className="text-xs text-[#aba09d] leading-relaxed mb-4 font-sans">
                Settle custom project milestones, client deliverables, or consultation retainers directly with verified invoice receipts.
              </p>

              {/* Quick parameter inputs */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="block text-[9px] font-mono text-[#8f827f] uppercase mb-1">Invoice Ref</label>
                  <input
                    type="text"
                    value={customInvoiceNumber}
                    onChange={(e) => setCustomInvoiceNumber(e.target.value)}
                    placeholder="INV-2026-001"
                    className="w-full bg-[#27201f] border border-[#3d3230] text-xs text-white px-3 py-2 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-[#8f827f] uppercase mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={customAmount || ''}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    placeholder="5000"
                    className="w-full bg-[#27201f] border border-[#3d3230] text-xs text-white px-3 py-2 rounded-xl outline-none font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#2e2523] flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-[#8f827f] uppercase block">Payable Amount</span>
                <span className="text-3xl font-serif font-black text-white">₹{customAmount.toLocaleString()}</span>
              </div>

              <button
                type="button"
                onClick={handleCustomInvoiceCheckout}
                className="px-6 py-3.5 bg-[#521714] hover:bg-[#6b1e1b] active:bg-[#401210] text-[#ffded9] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-black/50 cursor-pointer flex items-center gap-2 group-hover:scale-[1.02]"
              >
                <span>proceed to checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* ============================================================== */}
        {/* PAYMENT LEDGER / TRANSACTION HISTORY                           */}
        {/* ============================================================== */}
        <div className="max-w-5xl mx-auto pt-10 border-t border-[#2e2624]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-serif font-black text-2xl text-white">Verified Client Payment Ledger</h3>
              <p className="text-[#8f827f] text-xs font-sans mt-0.5">Your official billing, settlement transactions, and workshop credentials logs.</p>
            </div>
            
            {paymentHistory.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear local transaction history ledger?')) {
                    setPaymentHistory([]);
                    localStorage.removeItem('scoders_payments');
                  }
                }}
                className="text-[10px] font-mono text-rose-400 uppercase tracking-wider hover:underline cursor-pointer"
              >
                Clear History Logs
              </button>
            )}
          </div>

          <div className="bg-[#1b1716] border border-[#362b29] rounded-2xl overflow-hidden">
            {paymentHistory.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto text-[#8f827f]">
                  <FileText className="w-4 h-4" />
                </div>
                <p className="text-[#8f827f] text-xs font-sans max-w-sm mx-auto">
                  No active transactions recorded yet. Tap "get instant access" above to start your checkout!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#151211] border-b border-[#2e2624] text-[9px] font-mono text-[#8f827f] uppercase tracking-widest">
                      <th className="p-4 pl-6">TXN ID</th>
                      <th className="p-4">CLIENT</th>
                      <th className="p-4">PURPOSE</th>
                      <th className="p-4">METHOD</th>
                      <th className="p-4">DATETIME</th>
                      <th className="p-4 text-right">AMOUNT</th>
                      <th className="p-4 pr-6 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2e2624] text-xs">
                    {paymentHistory.map((history) => (
                      <tr key={history.txnId} className="hover:bg-white/[2%] transition-colors">
                        <td className="p-4 pl-6 font-mono font-bold text-amber-300">{history.txnId.replace('SCO-TXN-', '')}</td>
                        <td className="p-4 font-sans">
                          <span className="text-white block font-medium">{history.clientName}</span>
                          <span className="text-[10px] text-[#8f827f] block mt-0.5">{history.email}</span>
                        </td>
                        <td className="p-4 font-sans text-[#d1c5c2] max-w-xs truncate" title={history.purpose}>
                          {history.purpose}
                        </td>
                        <td className="p-4 font-mono text-[#8f827f]">{history.method}</td>
                        <td className="p-4 font-mono text-[#8f827f]">{history.timestamp.split(',')[0]}</td>
                        <td className="p-4 text-right font-serif font-black text-white">
                          {formatAmount(history.amount, history.currency)}
                        </td>
                        <td className="p-4 pr-6 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold rounded">
                            VERIFIED
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

        {/* ============================================================== */}
        {/* SUCCESS TRANSACTION RECEIPT MODAL OVERLAY                      */}
        {/* ============================================================== */}
        <AnimatePresence>
          {successTxn && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 30, opacity: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className="bg-[#1b1716] border border-[#483734] rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative overflow-hidden"
              >
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-serif font-black text-white">Payment Verified Successfully!</h3>
                  <p className="text-xs text-[#a89c99] mt-1">S-CODERS Official Dispatch Ledger</p>
                  
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>Receipt email sent to: <strong>{successTxn.email}</strong></span>
                  </div>
                </div>

                <div className="bg-[#241e1c] border border-[#382d2b] rounded-2xl p-5 space-y-3 font-sans text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-[#8f827f] font-mono">TRANSACTION ID</span>
                    <span className="text-amber-400 font-mono font-bold tracking-wider">{successTxn.txnId}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-[#8f827f] font-mono">CLIENT NAME</span>
                    <span className="text-white font-semibold">{successTxn.clientName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-[#8f827f] font-mono">ITEM / ACCESS</span>
                    <span className="text-gray-200 text-right truncate max-w-[200px]">{successTxn.purpose}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-[#8f827f] font-mono">PAYMENT MODE</span>
                    <span className="text-white font-mono">{successTxn.method}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm font-bold text-white">TOTAL VALUE PAID</span>
                    <span className="text-2xl font-serif font-black text-emerald-400">
                      {formatAmount(successTxn.amount, successTxn.currency)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleCopy(JSON.stringify(successTxn, null, 2), 'receipt')}
                    className="py-3 bg-[#261f1d] border border-white/10 text-white font-mono text-xs font-bold rounded-xl hover:border-white/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedField === 'receipt' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        Copied Ledger!
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
                      if (onNavigate) onNavigate('workshops');
                    }}
                    className="py-3 bg-[#521714] hover:bg-[#681e1a] text-[#ffded9] font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <span>{isModal ? "Close & Continue" : "Return to Workspace"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================== */}
        {/* THE SLEEK VIDEO-STYLE CHECKOUT MODAL (RAZORPAY STANDARD)       */}
        {/* ============================================================== */}
        <RazorpayModal
          isOpen={isCheckoutOpen}
          initialStep={(checkoutItem.clientName || customClientName) && (checkoutItem.email || customClientEmail) ? 'all_options' : 'checkout'}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={handlePaymentSuccess}
          paymentDetails={{
            amount: checkoutItem.amount,
            currency: checkoutItem.currency,
            purpose: checkoutItem.purpose,
            clientName: checkoutItem.clientName || customClientName,
            email: checkoutItem.email || customClientEmail,
            phone: checkoutItem.phone || customClientPhone,
            merchantUpiId: getActiveMerchantUpi(),
          }}
        />

        {/* Email Notification Dispatch Modal from scoders82@gmail.com */}
        <EmailNotificationModal
          isOpen={showEmailNotice}
          onClose={() => setShowEmailNotice(false)}
          data={emailNoticeData}
        />

      </div>
    </section>
  );
}
