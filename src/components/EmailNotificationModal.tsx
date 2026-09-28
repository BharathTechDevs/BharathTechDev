import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, Copy, Check, ExternalLink, X, ShieldCheck, 
  Sparkles, Clock, ArrowRight, MessageCircle, Mail, Key,
  BookOpen, Download, Terminal, CheckSquare
} from 'lucide-react';

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
    : "https://chat.whatsapp.com/Dp1kVXukz0B3KXQq3FTuId?s=cl&p=a&mlu=4&ilr=4";

  const groupTitle = isService
    ? "Join S-CODERS Service WhatsApp Group"
    : isWorkshop
    ? "Join Workshop Community WhatsApp"
    : "Join S-CODERS WhatsApp Community";

  const groupDesc = isService
    ? "Connect directly with our engineering team, get live architecture dispatches, and priority development support."
    : isWorkshop
    ? "All workshop session links, meeting codes, repositories, and mentor Q&A are shared inside the official WhatsApp group."
    : "All live event room codes, session recordings, mentor Q&A, and technical updates are shared inside the official community.";

  const handleOpenWhatsApp = () => {
    window.open(WHATSAPP_GROUP_LINK, '_blank', 'noopener,noreferrer');
    setHasJoinedWhatsApp(true);
  };

  const formattedAmount = data.amount !== undefined 
    ? (data.amount === 0 ? 'FREE PASS' : `₹${data.amount.toLocaleString('en-IN')}`)
    : null;

  const passBadgeText = isWorkshop ? 'WORKSHOP ADMISSION PASS' : isService ? 'SERVICE ACCESS PASS' : 'OFFICIAL EVENT PASS';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-lg overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="bg-gradient-to-b from-[#111420] via-[#0B0D16] to-[#08090F] border border-brand-teal/40 rounded-3xl max-w-3xl w-full p-6 sm:p-8 relative shadow-[0_0_60px_rgba(34,211,238,0.2)] my-auto overflow-hidden text-white font-sans"
        >
          {/* Ambient Glows */}
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-brand-teal/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 hover:text-white text-gray-400 rounded-full border border-white/10 cursor-pointer transition-all duration-200 z-20"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Header & Branding */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/40 rounded-full text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Payment Verified • Pass Activated</span>
                </span>
                <span className="text-[11px] font-mono text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-brand-teal" />
                  Just now
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight">
                {isWorkshop ? 'Workshop Admission Confirmed' : isService ? 'Service Registration Confirmed' : 'Event Ticket Confirmed'}
              </h3>
            </div>

            {/* S-CODERS Stamp */}
            <div className="flex items-center gap-2 sm:text-right">
              <div className="p-2.5 bg-brand-teal/10 rounded-2xl border border-brand-teal/30 text-brand-teal">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="font-display font-black text-white text-sm tracking-wider flex items-center gap-1">
                  <span>S</span>
                  <span className="text-brand-teal">⚡</span>
                  <span>CODERS</span>
                </span>
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Bharat Tech Developers</span>
              </div>
            </div>
          </div>

          {/* Main 2-Column Responsive Body */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6 relative z-10">
            
            {/* LEFT COLUMN: Pass Details & Key (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              
              {/* Item Details Card */}
              <div className="bg-brand-dark/80 border border-white/10 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-brand-teal uppercase font-bold tracking-wider">
                    {passBadgeText}
                  </span>
                  {formattedAmount && (
                    <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      Paid: {formattedAmount}
                    </span>
                  )}
                </div>

                <h4 className="text-base sm:text-lg font-display font-bold text-white leading-snug">
                  {data.title}
                </h4>

                <div className="text-xs text-gray-400 font-sans leading-relaxed">
                  Registered for: <strong className="text-white">{data.recipientName}</strong> ({data.recipientEmail})
                </div>
              </div>

              {/* Unique Pass Key Box */}
              <div className="bg-gradient-to-r from-brand-teal/10 via-[#0E1524] to-[#0A0D18] border-2 border-brand-teal/40 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-300 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Your Unique Access Pass Key</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Save for Entry</span>
                </div>

                <div className="flex items-center justify-between gap-2 bg-black/70 border border-brand-teal/30 p-2.5 rounded-xl">
                  <span className="text-sm sm:text-base font-mono font-black text-brand-teal tracking-wider truncate select-all">
                    {data.uniqueKey}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="p-2 bg-brand-teal hover:bg-white text-brand-dark rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1 text-xs font-mono font-bold"
                    title="Copy Access Key"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {copied && (
                  <span className="text-[10px] font-mono text-emerald-400 block font-bold">
                    ✓ Access key copied to clipboard!
                  </span>
                )}
              </div>

              {/* Features Unlocked Quick Checklist */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-gray-300">
                <div className="flex items-center gap-1.5 p-2 bg-white/5 rounded-xl border border-white/5">
                  <Terminal className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                  <span>Sandbox IDE Access</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 bg-white/5 rounded-xl border border-white/5">
                  <Download className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                  <span>Downloads Locker</span>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: WhatsApp Community & Actions (5 cols) */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-4">
              
              {/* WhatsApp Community Card */}
              <div className="p-4 sm:p-5 bg-gradient-to-b from-[#0F291E] to-[#0A1A14] border-2 border-emerald-500/50 rounded-2xl space-y-3 shadow-lg shadow-emerald-950/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#25D366] text-black rounded-xl font-bold shadow-md">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                      Recommended Next Step
                    </span>
                    <h5 className="text-xs sm:text-sm font-display font-extrabold text-white">
                      {groupTitle}
                    </h5>
                  </div>
                </div>

                <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                  {groupDesc}
                </p>

                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-black font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-98"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{hasJoinedWhatsApp ? '✓ WhatsApp Opened' : 'Join WhatsApp Group'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {data.onAction && (
                  <button
                    type="button"
                    onClick={() => {
                      data.onAction?.();
                      onClose();
                    }}
                    className="w-full py-3.5 px-4 bg-brand-teal hover:bg-white text-brand-dark font-display font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-teal/20"
                  >
                    <span>{data.actionText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-mono text-xs font-semibold uppercase rounded-xl transition-colors cursor-pointer text-center"
                >
                  Close & View Workshop
                </button>
              </div>

            </div>

          </div>

          {/* Footer Dispatch Note */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-400 font-mono relative z-10">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-brand-teal" />
              <span>Official dispatch confirmation emailed from <strong className="text-brand-teal font-bold">scoders82@gmail.com</strong></span>
            </div>
            <span className="text-gray-500">© 2026 S-CODERS</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
