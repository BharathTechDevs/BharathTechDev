import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, UserCheck, AlertTriangle } from 'lucide-react';
import { 
  DEFAULT_BHUVAN_UPI, DEFAULT_SHREYAS_UPI, getActiveMerchantUpi, 
  setActiveMerchantUpi, buildUpiQueryString, getBankingNameForUpi, 
  getPhoneNumberForUpi, openUpiApp 
} from '../utils/paymentLinks';

interface PhonePeScannerCardProps {
  upiString?: string;
  merchantName?: string;
  merchantVpa?: string;
  amount?: number;
  showTimer?: boolean;
  timerSeconds?: number;
  className?: string;
  onVpaChange?: (newVpa: string) => void;
}

export default function PhonePeScannerCard({
  upiString,
  merchantName = 'S-CODERS Technologies',
  merchantVpa,
  amount,
  showTimer = false,
  timerSeconds = 300,
  className = '',
  onVpaChange
}: PhonePeScannerCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeVpa, setActiveVpa] = useState<string>(() => merchantVpa || getActiveMerchantUpi());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (merchantVpa) {
      setActiveVpa(merchantVpa);
    }
  }, [merchantVpa]);

  const handleSelectVpa = (vpa: string) => {
    setActiveVpa(vpa);
    setActiveMerchantUpi(vpa);
    if (onVpaChange) {
      onVpaChange(vpa);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeVpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentBankingName = getBankingNameForUpi(activeVpa);
  const currentPhone = getPhoneNumberForUpi(activeVpa);

  // Compute final UPI QR string dynamically with registered banking name matching CBS
  const currentUpiPayload = buildUpiQueryString({ 
    pa: activeVpa, 
    pn: currentBankingName, 
    am: amount || 0, 
    tn: 'SCODERS Pass' 
  });
  const upiQrUri = `upi://pay?${currentUpiPayload}`;

  useEffect(() => {
    if (canvasRef.current && upiQrUri) {
      QRCode.toCanvas(
        canvasRef.current,
        upiQrUri,
        {
          width: 220,
          margin: 1,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) {
            console.error('Failed to generate PhonePe QR Canvas:', error);
          }
        }
      );
    }
  }, [currentUpiPayload]);

  const isBhuvan = activeVpa.includes('6363905989');

  return (
    <div className={`bg-[#0b0c10] text-white rounded-[2rem] p-6 sm:p-7 shadow-2xl border border-white/10 max-w-[340px] w-full mx-auto flex flex-col items-center select-none text-center ${className}`}>
      {/* 1. Top PhonePe Brand Header */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-9 h-9 rounded-full bg-[#5f259f] flex items-center justify-center shadow-md shrink-0">
          <span className="text-white font-sans font-black text-sm leading-none">पे</span>
        </div>
        <span className="text-white font-sans font-bold text-xl sm:text-2xl tracking-tight">PhonePe & GPay</span>
      </div>

      {/* 2. Accepted Here Label */}
      <span className="text-[#a855f7] font-sans font-bold text-xs sm:text-[13px] tracking-wider uppercase mb-1">
        ACCEPTED HERE • ALL UPI APPS
      </span>

      {/* 3. Subtitle */}
      <p className="text-gray-300 font-sans text-xs sm:text-[13px] mb-3">
        Scan & Pay using PhonePe, Google Pay, Paytm, BHIM
      </p>

      {/* Account Selection Toggle - Helpful when bank limit is exceeded */}
      <div className="w-full space-y-1 mb-3">
        <div className="text-[10px] font-mono text-gray-400 text-left flex items-center justify-between">
          <span>Receiving Account:</span>
          <span className="text-brand-teal font-semibold">Switch if bank limit reached</span>
        </div>
        <div className="w-full grid grid-cols-2 gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl">
          <button
            type="button"
            onClick={() => handleSelectVpa(DEFAULT_BHUVAN_UPI)}
            className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              isBhuvan
                ? 'bg-[#5f259f] text-white shadow-md shadow-[#5f259f]/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            <span>Bhuvan M. (6363)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectVpa(DEFAULT_SHREYAS_UPI)}
            className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              !isBhuvan
                ? 'bg-[#5f259f] text-white shadow-md shadow-[#5f259f]/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            <span>Shreyas M. (8310)</span>
          </button>
        </div>
      </div>

      {/* 4. Center QR Code Container with Centered PhonePe Logo */}
      <div className="relative p-2.5 bg-white rounded-2xl shadow-inner group">
        <canvas ref={canvasRef} className="rounded-xl block max-w-full h-auto" />
        
        {/* Absolute Centered PhonePe 'पे' Badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-9 h-9 rounded-full bg-[#5f259f] border-2 border-white flex items-center justify-center shadow-md">
            <span className="text-white font-sans text-xs font-black tracking-tighter">पे</span>
          </div>
        </div>
      </div>

      {/* 5. Merchant Name Banner & Copyable UPI */}
      <div className="mt-4 pt-1 flex flex-col items-center w-full">
        <span className="text-white font-sans font-black text-sm sm:text-base tracking-wider uppercase">
          {merchantName}
        </span>
        <span className="text-[11px] font-mono text-purple-300">
          Banking Name: {currentBankingName}
        </span>
        {amount && amount > 0 && (
          <span className="text-emerald-400 font-mono text-sm font-bold mt-1">
            Amount: ₹{amount.toLocaleString()}
          </span>
        )}
        
        <div className="mt-2.5 flex flex-col gap-1.5 w-full">
          {/* Mobile One-Tap Pay Buttons */}
          <div className="grid grid-cols-2 gap-1.5 w-full">
            <button
              type="button"
              onClick={() => openUpiApp({ pa: activeVpa, pn: currentBankingName, am: amount || 0, tn: 'SCODERS Payment' }, 'phonepe')}
              className="py-1.5 px-2 bg-[#5f259f]/30 hover:bg-[#5f259f]/50 border border-[#5f259f]/50 hover:border-[#5f259f] rounded-lg text-purple-200 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
            >
              <span>Pay in PhonePe</span>
            </button>
            <button
              type="button"
              onClick={() => openUpiApp({ pa: activeVpa, pn: currentBankingName, am: amount || 0, tn: 'SCODERS Payment' }, 'gpay')}
              className="py-1.5 px-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 hover:border-blue-500 rounded-lg text-blue-200 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
            >
              <span>Pay in GPay</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 rounded-lg text-purple-200 font-mono text-xs transition-colors cursor-pointer w-full"
            title="Click to copy UPI ID"
          >
            <span>UPI ID: <strong className="text-white font-bold">{activeVpa}</strong></span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(currentPhone);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 rounded-lg text-gray-200 hover:text-white font-mono text-xs transition-colors cursor-pointer w-full"
            title="Click to copy Phone Number for PhonePe / GPay"
          >
            <span>PhonePe / GPay Mobile: <strong className="text-purple-300 font-bold">{currentPhone}</strong></span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-purple-300 shrink-0" />}
          </button>
        </div>

        {/* Security & Bank Limit Resolution Notice */}
        <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-gray-300 text-left space-y-1 w-full">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold font-mono text-[10px] uppercase">
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Bank Limit or Security Decline Fix</span>
          </div>
          <p className="text-[10px] text-gray-300 font-sans leading-tight">
            If PhonePe/GPay shows <strong className="text-amber-200">"declined for security reasons"</strong> or <strong className="text-amber-200">"exceeded bank limit"</strong>:
          </p>
          <ol className="text-[10px] text-gray-300 list-decimal pl-4 space-y-0.5 font-sans">
            <li>Open PhonePe or GPay directly on your phone</li>
            <li>Tap <strong className="text-white">"To Mobile Number"</strong> & enter <span className="text-purple-300 font-mono font-bold">{currentPhone}</span></li>
            <li>Or tap <strong className="text-white">"To UPI ID"</strong> & enter <span className="text-purple-300 font-mono font-bold">{activeVpa}</span></li>
            <li>Or switch to <strong className="text-white">Shreyas (8310)</strong> above if Bhuvan's daily bank limit is reached today!</li>
          </ol>
        </div>
      </div>

      {/* Optional Timer */}
      {showTimer && timerSeconds !== undefined && (
        <div className="mt-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-purple-300 flex items-center gap-1">
          <span>QR Expires in:</span>
          <span className="font-bold text-white">
            {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  );
}
