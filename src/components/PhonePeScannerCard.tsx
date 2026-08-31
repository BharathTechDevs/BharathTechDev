import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface PhonePeScannerCardProps {
  upiString: string;
  merchantName?: string;
  merchantVpa?: string;
  amount?: number;
  showTimer?: boolean;
  timerSeconds?: number;
  className?: string;
}

export default function PhonePeScannerCard({
  upiString,
  merchantName = 'sCoders',
  merchantVpa = 'scoders@ybl',
  amount,
  showTimer = false,
  timerSeconds = 300,
  className = ''
}: PhonePeScannerCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current && upiString) {
      QRCode.toCanvas(
        canvasRef.current,
        upiString,
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
  }, [upiString]);

  return (
    <div className={`bg-[#0b0c10] text-white rounded-[2rem] p-6 sm:p-7 shadow-2xl border border-white/10 max-w-[320px] w-full mx-auto flex flex-col items-center select-none text-center ${className}`}>
      {/* 1. Top PhonePe Brand Header */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-9 h-9 rounded-full bg-[#5f259f] flex items-center justify-center shadow-md shrink-0">
          <span className="text-white font-sans font-black text-sm leading-none">पे</span>
        </div>
        <span className="text-white font-sans font-bold text-xl sm:text-2xl tracking-tight">PhonePe</span>
      </div>

      {/* 2. Accepted Here Label */}
      <span className="text-[#a855f7] font-sans font-bold text-xs sm:text-[13px] tracking-wider uppercase mb-1">
        ACCEPTED HERE
      </span>

      {/* 3. Subtitle */}
      <p className="text-gray-300 font-sans text-xs sm:text-[13px] mb-4">
        Scan & Pay Using PhonePe App
      </p>

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

      {/* 5. Merchant Name Banner */}
      <div className="mt-4 pt-1 flex flex-col items-center">
        <span className="text-white font-sans font-black text-sm sm:text-base tracking-wider uppercase">
          {merchantName}
        </span>
        {amount && amount > 0 && (
          <span className="text-emerald-400 font-mono text-xs font-bold mt-1">
            Amount: ₹{amount.toLocaleString()}
          </span>
        )}
        <span className="text-gray-500 font-mono text-[9px] uppercase tracking-widest mt-0.5">
          UPI ID: {merchantVpa}
        </span>
      </div>

      {/* Optional Timer */}
      {showTimer && timerSeconds !== undefined && (
        <div className="mt-2.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-purple-300 flex items-center gap-1">
          <span>QR Expires in:</span>
          <span className="font-bold text-white">
            {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  );
}
