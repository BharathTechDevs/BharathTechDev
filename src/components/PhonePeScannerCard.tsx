import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, UserCheck } from 'lucide-react';
import { DEFAULT_BHUVAN_UPI, DEFAULT_SHREYAS_UPI, getActiveMerchantUpi, setActiveMerchantUpi, buildUpiQueryString } from '../utils/paymentLinks';

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

  // Compute final UPI QR string dynamically
  const currentUpiPayload = upiString 
    ? upiString.replace(/pa=[^&]+/, `pa=${activeVpa}`).replace(/pn=[^&]+/, `pn=${encodeURIComponent(merchantName)}`)
    : `upi://pay?${buildUpiQueryString({ pa: activeVpa, pn: merchantName, am: amount || 0, tn: 'SCODERS Payment' })}`;

  useEffect(() => {
    if (canvasRef.current && currentUpiPayload) {
      QRCode.toCanvas(
        canvasRef.current,
        currentUpiPayload,
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
        <span className="text-white font-sans font-bold text-xl sm:text-2xl tracking-tight">PhonePe</span>
      </div>

      {/* 2. Accepted Here Label */}
      <span className="text-[#a855f7] font-sans font-bold text-xs sm:text-[13px] tracking-wider uppercase mb-1">
        ACCEPTED HERE • ALL UPI APPS
      </span>

      {/* 3. Subtitle */}
      <p className="text-gray-300 font-sans text-xs sm:text-[13px] mb-3">
        Scan & Pay using PhonePe, GPay, Paytm
      </p>

      {/* Account Selection Toggle */}
      <div className="w-full grid grid-cols-2 gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl mb-3">
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
          <span>Bhuvan (6363)</span>
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
          <span>Shreyas (8310)</span>
        </button>
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
        {amount && amount > 0 && (
          <span className="text-emerald-400 font-mono text-sm font-bold mt-1">
            Amount: ₹{amount.toLocaleString()}
          </span>
        )}
        
        <button
          type="button"
          onClick={handleCopy}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 rounded-lg text-purple-200 font-mono text-xs transition-colors cursor-pointer"
          title="Click to copy UPI ID"
        >
          <span>UPI ID: <strong className="text-white font-bold">{activeVpa}</strong></span>
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
        </button>
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
