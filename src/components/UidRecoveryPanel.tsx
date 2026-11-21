import React, { useState } from 'react';
import { Mail, Key, ShieldCheck, Check, Copy, RefreshCw, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

export interface RecoveredUidRecord {
  uid: string;
  section: 'service' | 'workshop' | 'event';
  itemId: string;
  itemTitle: string;
  clientName: string;
  clientEmail: string;
  validUntil?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  amount?: number;
  metadata?: {
    date?: string;
    day?: string;
    time?: string;
    location?: string;
    description?: string;
    requirements?: string;
    budget?: string;
    timeline?: string;
  };
  chatId?: string;
  paymentId?: string;
  orderId?: string;
}

interface UidRecoveryPanelProps {
  section: 'service' | 'workshop' | 'event';
  defaultEmail?: string;
  onRecoveredKeySelect?: (uid: string, record: RecoveredUidRecord) => void;
}

export default function UidRecoveryPanel({
  section,
  defaultEmail = '',
  onRecoveredKeySelect,
}: UidRecoveryPanelProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'results'>('email');
  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [records, setRecords] = useState<RecoveredUidRecord[]>([]);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  const sectionLabel =
    section === 'service' ? 'Service Workspace' : section === 'workshop' ? 'Workshop Session' : 'Event Ticket';

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await fetch('/api/registrations/recovery/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, section }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || `No ${sectionLabel.toLowerCase()} registrations found for ${cleanEmail}.`);
      } else {
        setInfoMessage(
          data.message || `A 6-digit verification code was sent to ${cleanEmail} from scoders82@gmail.com.`
        );
        setStep('otp');
      }
    } catch {
      setError('Unable to reach verification service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length < 6) {
      setError('Please enter the 6-digit verification code emailed to you.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/registrations/recovery/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: cleanOtp,
          section,
          resendEmail: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid or expired verification code.');
      } else {
        setRecords(Array.isArray(data.registrations) ? data.registrations : []);
        setInfoMessage(
          data.message || 'Verification complete! A copy of your active codes has also been emailed from scoders82@gmail.com.'
        );
        setStep('results');
      }
    } catch {
      setError('Unable to verify code right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  return (
    <div className="bg-black/40 border border-brand-teal/25 rounded-2xl p-4 sm:p-5 space-y-4 text-left font-sans">
      <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand-teal/15 border border-brand-teal/30 rounded-xl text-brand-teal shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-brand-teal uppercase tracking-wider font-bold block">
              Secure Email Verification
            </span>
            <h4 className="text-sm font-display font-bold text-white">
              Recover / Resend Lost {sectionLabel} UID
            </h4>
          </div>
        </div>
        {step !== 'email' && (
          <button
            type="button"
            onClick={() => {
              setStep('email');
              setOtp('');
              setError(null);
              setInfoMessage(null);
            }}
            className="text-[10px] font-mono text-gray-400 hover:text-brand-teal underline cursor-pointer shrink-0"
          >
            Start Over
          </button>
        )}
      </div>

      <p className="text-[11px] text-gray-400 leading-relaxed">
        Lost your unique registration code? Verify ownership with a one-time 6-digit code dispatched from{' '}
        <strong className="text-brand-teal font-mono">scoders82@gmail.com</strong>.
      </p>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-mono flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {infoMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{infoMessage}</span>
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={handleRequestOtp} className="space-y-3">
          <div>
            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
              Registered Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="you@example.com"
                className="w-full bg-brand-dark/70 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brand-teal hover:bg-white text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Sending Verification Code...' : 'Send Verification Code'}</span>
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <div>
            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
              Enter 6-Digit Code Sent to {email} *
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError(null);
              }}
              placeholder="e.g. 482910"
              className="w-full bg-brand-dark/70 border border-brand-teal/40 rounded-xl px-4 py-2.5 text-sm font-mono font-bold tracking-[0.35em] text-center text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brand-teal hover:bg-white text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{loading ? 'Verifying...' : 'Verify Code & Recover UID'}</span>
          </button>
        </form>
      )}

      {step === 'results' && (
        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {records.length === 0 ? (
            <p className="text-xs text-gray-400 font-mono">No registrations matched this account.</p>
          ) : (
            records.map((rec) => {
              const isActive = rec.status === 'ACTIVE';
              return (
                <div
                  key={rec.uid}
                  className="bg-brand-dark/80 border border-white/10 rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-display font-bold text-white truncate">
                      {rec.itemTitle}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 bg-black/50 border border-brand-teal/30 rounded-lg px-3 py-2">
                    <code className="font-mono text-xs font-black text-amber-300 tracking-wider select-all">
                      {rec.uid}
                    </code>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(rec.uid)}
                        className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                      >
                        {copiedUid === rec.uid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedUid === rec.uid ? 'Copied' : 'Copy'}</span>
                      </button>
                      {isActive && onRecoveredKeySelect && (
                        <button
                          type="button"
                          onClick={() => onRecoveredKeySelect(rec.uid, rec)}
                          className="px-2.5 py-1 bg-brand-teal hover:bg-white text-brand-dark rounded text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>Use UID</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {rec.validUntil && (
                    <span className="block text-[10px] font-mono text-gray-500">
                      Valid until: {new Date(rec.validUntil).toLocaleDateString()}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
