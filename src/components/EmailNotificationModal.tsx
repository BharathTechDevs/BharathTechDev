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

  const handleCopyKey = () => {
    if (!data?.uniqueKey) return;
    navigator.clipboard.writeText(data.uniqueKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isService = data?.type === 'service';
  const isWorkshop = data?.type === 'workshop';

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

  const formattedAmount = data && data.amount !== undefined 
    ? (data.amount === 0 ? 'FREE PASS' : `₹${data.amount.toLocaleString('en-IN')}`)
    : null;

  const passBadgeText = isWorkshop ? 'WORKSHOP ADMISSION PASS' : isService ? 'SERVICE ACCESS PASS' : 'OFFICIAL EVENT PASS';

  return (
    <AnimatePresence>
      {isOpen && data && (
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
                  <span className="block font-mono text-xs text-brand-teal font-bold tracking-widest uppercase">S-CODERS</span>
                  <span className="block text-[10px] text-gray-400 font-mono">Official System Pass</span>
                </div>
              </div>
            </div>

            {/* Main Pass Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 py-6 relative z-10">
              
              {/* Left Column: Pass Credentials */}
              <div className="lg:col-span-3 space-y-4">
                
                {/* Pass Certificate Card */}
                <div className="bg-gradient-to-br from-[#161B2B] to-[#0E121E] border border-brand-teal/30 rounded-2xl p-5 relative overflow-hidden shadow-lg">
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-brand-teal" />
                      <span className="font-mono text-xs font-bold text-brand-teal uppercase tracking-wider">
                        {passBadgeText}
                      </span>
                    </div>
                    {formattedAmount && (
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold rounded-md">
                        {formattedAmount}
                      </span>
                    )}
                  </div>

                  <h4 className="font-display font-bold text-lg text-white mb-2 leading-snug">
                    {data.title}
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-1 text-gray-300 mb-4">
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">Issued To</span>
                      <span className="font-semibold text-white truncate block">{data.recipientName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase">Registered Email</span>
                      <span className="font-semibold text-white truncate block">{data.recipientEmail}</span>
                    </div>
                  </div>

                  {/* Secret Pass Key with 1-Click Copy */}
                  <div className="bg-black/60 border border-brand-teal/40 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-mono text-brand-teal uppercase block tracking-wider font-bold">Your Unique Pass Key</span>
                      <span className="font-mono text-sm sm:text-base font-black text-amber-300 tracking-wider truncate block">
                        {data.uniqueKey}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyKey}
                      className="px-3.5 py-2 bg-brand-teal hover:bg-white text-brand-dark font-mono text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Email Dispatch Notice banner */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-blue-200">
                      Confirmation Dispatched to {data.recipientEmail}
                    </p>
                    <p className="text-gray-400 leading-relaxed text-[11px]">
                      {data.messageText}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: WhatsApp Community Card & Action */}
              <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
                
                {/* Official WhatsApp Group Card */}
                <div className="bg-gradient-to-br from-[#0F241C] via-[#0B1A14] to-[#07130E] border border-emerald-500/40 rounded-2xl p-5 relative overflow-hidden shadow-lg flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">Official Community</span>
                        <h5 className="font-display font-bold text-sm text-white">{groupTitle}</h5>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed">
                      {groupDesc}
                    </p>

                    <ul className="text-[11px] font-mono text-emerald-300/90 space-y-1 pt-1">
                      <li className="flex items-center gap-1.5">
                        <CheckSquare className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Instant Zoom meeting links & recordings</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckSquare className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Direct 1-on-1 access to technical mentors</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckSquare className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Code sandbox snippets & GitHub repos</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 mt-2">
                    <button
                      onClick={handleOpenWhatsApp}
                      className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-display font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>{hasJoinedWhatsApp ? 'Open WhatsApp Group Again' : 'Join WhatsApp Group Now'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => {
                      if (data.onAction) {
                        data.onAction();
                      } else {
                        onClose();
                      }
                    }}
                    className="w-full py-3.5 px-4 bg-brand-teal hover:bg-white text-brand-dark font-display font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-brand-teal/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>{data.actionText || 'Continue to Session'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
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
      )}
    </AnimatePresence>
  );
}
