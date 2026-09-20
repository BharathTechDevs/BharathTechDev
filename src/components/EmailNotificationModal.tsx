import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, CheckCircle2, Copy, Check, ExternalLink, X, ShieldCheck, Sparkles, Clock, ArrowRight, MessageCircle } from 'lucide-react';

export interface EmailNotificationData {
  type: 'event' | 'service' | 'workshop';
  recipientEmail: string;
  recipientName: string;
  subject: string;
  title: string;
  uniqueKey: string;
  messageText: string;
  amount?: number;
  actionText: string;
  onAction?: () => void;
}

interface EmailNotificationModalProps {
  data: EmailNotificationData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailNotificationModal({ data, isOpen, onClose }: EmailNotificationModalProps) {
  const [copied, setCopied] = useState(false);
  const [hasJoinedWhatsApp, setHasJoinedWhatsApp] = useState(false);

  if (!isOpen || !data) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(data.uniqueKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isService = data.type === 'service';
  const isWorkshop = data.type === 'workshop';

  // Dynamic routing: Service WhatsApp Group vs Workshop Group vs Customer Care/Event Group
  const WHATSAPP_GROUP_LINK = isService
    ? "https://chat.whatsapp.com/CgksCDeW7LnINcEvGwn7kK"
    : isWorkshop
    ? "https://chat.whatsapp.com/Dn2rD4GVvJw9DtKUIcBs1F"
    : "https://chat.whatsapp.com/Dp1kVXukz0B3KXQq3FTuId?s=cl&p=a&mlu=4";

  const groupTitle = isService
    ? "Join S-CODERS Service WhatsApp Group"
    : isWorkshop
    ? "Join S-CODERS Workshop Community Group"
    : "Join S-CODERS WhatsApp Community Group";

  const groupDesc = isService
    ? "Connect directly with our engineering team, get live architecture dispatches, 1-on-1 sprint coordination, and priority development support."
    : isWorkshop
    ? "All workshop masterclasses, live session links, code repositories, and developer Q&A are shared directly inside the official WhatsApp community."
    : "All live event room codes, session recordings, mentor Q&A, and technical dispatch updates are shared directly inside the official WhatsApp community. Please join before proceeding.";

  const handleOpenWhatsApp = () => {
    window.open(WHATSAPP_GROUP_LINK, '_blank', 'noopener,noreferrer');
    setHasJoinedWhatsApp(true);
  };

  const formattedAmount = data.amount !== undefined 
    ? (data.amount === 0 ? 'FREE PASS' : `₹${data.amount.toLocaleString('en-IN')}`)
    : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-[#0B0F17] border-2 border-brand-teal/40 rounded-3xl max-w-xl w-full p-5 sm:p-8 relative shadow-[0_0_50px_rgba(34,211,238,0.25)] my-6 sm:my-8 overflow-hidden text-white font-sans"
        >
          {/* Prominent Red Circular Close Button (❌) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-600 text-white rounded-full border border-red-500/50 cursor-pointer transition-all duration-200 shadow-lg z-20"
            title="Close Email Notification"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Top Incoming Mail Header Badge */}
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Payment Successful & Email Dispatched</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-brand-teal" />
              Just now
            </span>
          </div>

          {/* Mandatory WhatsApp Joining Gate Card */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/80 via-emerald-900/50 to-[#0F172A] border-2 border-emerald-500/60 rounded-2xl mb-5 space-y-3 shadow-lg shadow-emerald-950/40">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#25D366] text-black rounded-xl font-bold">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                  Mandatory Step 1 • {isService ? 'Service WhatsApp Group' : isWorkshop ? 'Workshop WhatsApp Group' : 'Official Community'}
                </span>
                <h4 className="text-sm sm:text-base font-display font-extrabold text-white">
                  {groupTitle}
                </h4>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 font-sans leading-relaxed">
              {groupDesc}
            </p>

            <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-black font-mono font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{hasJoinedWhatsApp ? '✓ WhatsApp Group Opened' : isService ? 'Join Service WhatsApp Group Now' : isWorkshop ? 'Join Workshop WhatsApp Group' : 'Join WhatsApp Group Now'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Simulated Email Client Envelope Card */}
          <div className="bg-[#131A29] border border-white/10 rounded-2xl p-4 sm:p-5 mb-5 space-y-3 font-mono text-xs sm:text-sm shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-2.5 gap-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-semibold">From:</span>
                <span className="text-brand-teal font-bold flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  scoders82@gmail.com
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                S-CODERS Bharath Tech Developers
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-2.5 gap-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-semibold">To:</span>
                <span className="text-white font-bold">{data.recipientEmail}</span>
              </div>
              <span className="text-[10px] sm:text-xs text-gray-400 font-sans">
                ({data.recipientName})
              </span>
            </div>

            <div className="pt-1">
              <span className="text-gray-400 font-semibold block text-[10px] uppercase tracking-wider mb-0.5">Subject:</span>
              <span className="text-amber-300 font-bold font-sans text-sm sm:text-base">
                {data.subject}
              </span>
            </div>
          </div>

          {/* Email Body Template Content */}
          <div className="space-y-4">
            {/* S-CODERS Branding Ribbon */}
            <div className="p-4 bg-gradient-to-r from-[#0F172A] to-[#1E293B] border-t-2 border-brand-teal rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-base sm:text-lg font-display font-black text-white tracking-wide flex items-center gap-1.5">
                  <span>S</span>
                  <span className="text-brand-teal">⚡</span>
                  <span>CODERS</span>
                </h4>
                <p className="text-[10px] sm:text-xs font-mono text-gray-400 uppercase tracking-wider">
                  Bharath Tech Developers • Bengaluru, India
                </p>
              </div>
              <div className="p-2 bg-brand-teal/15 rounded-xl border border-brand-teal/30 text-brand-teal">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            {/* Success Message Banner */}
            <div className="p-4 bg-emerald-500/10 border-l-4 border-emerald-400 rounded-xl">
              <p className="text-xs sm:text-sm text-emerald-300 font-medium leading-relaxed font-sans">
                {data.messageText}
              </p>
            </div>

            {/* Scope / Item Details */}
            <div className="bg-[#0F172A] border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-gray-400 text-[10px] block uppercase">
                  {data.type === 'event' ? 'Event Name' : data.type === 'service' ? 'Project Service Scope' : 'Workshop Masterclass'}
                </span>
                <span className="text-white font-bold text-sm sm:text-base">{data.title}</span>
              </div>
              {formattedAmount && (
                <div className="sm:text-right">
                  <span className="text-gray-400 text-[10px] block uppercase">Amount</span>
                  <span className="text-emerald-400 font-bold text-sm sm:text-base">{formattedAmount}</span>
                </div>
              )}
            </div>

            {/* Unique Key Box with Direct Copy */}
            <div className="bg-[#0F172A] border-2 border-dashed border-brand-teal/40 rounded-2xl p-4 text-center space-y-2">
              <span className="text-[10px] sm:text-xs font-mono text-gray-400 uppercase tracking-widest block font-bold">
                {data.type === 'event' ? 'Your Unique Event Ticket Pass Key' : 'Your Unique Registration & Access Key'}
              </span>
              
              <div className="flex items-center justify-center gap-2">
                <span className="text-base sm:text-xl font-mono font-black text-brand-teal tracking-widest bg-black/60 px-4 py-2 rounded-xl border border-brand-teal/30 select-all">
                  {data.uniqueKey}
                </span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="p-2.5 bg-brand-teal hover:bg-white text-brand-dark rounded-xl transition-all cursor-pointer shadow-md"
                  title="Copy Key"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-900" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {copied && (
                <span className="text-[10px] sm:text-xs font-mono text-emerald-400 block font-bold">
                  ✓ Pass key copied to clipboard!
                </span>
              )}
            </div>

            {/* Actions Bar */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {data.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    data.onAction?.();
                    onClose();
                  }}
                  className="flex-1 py-3.5 bg-brand-teal hover:bg-white text-brand-dark font-mono font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-teal/20"
                >
                  <span>{data.actionText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="py-3.5 px-6 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-mono text-xs sm:text-sm font-bold uppercase rounded-xl transition-colors cursor-pointer text-center"
              >
                Done
              </button>
            </div>

            {/* Footer */}
            <p className="text-[10px] sm:text-xs text-center text-gray-400 font-mono pt-2">
              Official email sent from <strong className="text-brand-teal">scoders82@gmail.com</strong> • Keep your pass key safe for entry verification.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
