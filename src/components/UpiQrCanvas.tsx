import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface UpiQrCanvasProps {
  upiString: string;
  size?: number;
  className?: string;
}

export default function UpiQrCanvas({ upiString, size = 220, className = '' }: UpiQrCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current && upiString) {
      QRCode.toCanvas(
        canvasRef.current,
        upiString,
        {
          width: size,
          margin: 2,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#050B14',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) {
            console.error('Failed to generate UPI QR Canvas:', error);
          }
        }
      );
    }
  }, [upiString, size]);

  return (
    <div className={`relative flex items-center justify-center bg-white rounded-2xl p-2.5 shadow-md ${className}`}>
      <canvas ref={canvasRef} className="rounded-xl block max-w-full h-auto" />
    </div>
  );
}
