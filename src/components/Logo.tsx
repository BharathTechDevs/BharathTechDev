import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  lightBg?: boolean;
  onAdminClick?: () => void;
  onClick?: () => void;
  horizontal?: boolean;
}

export default function Logo({
  size = 'md',
  showSubtitle = true,
  className = '',
  lightBg = false,
  onAdminClick,
  onClick,
  horizontal = false,
}: LogoProps) {
  // Size-specific dimensions
  const sizeClasses = {
    sm: {
      sText: 'text-2xl font-black leading-none',
      linkSvg: 'w-8 h-4 mx-1',
      codersText: 'text-2xl font-black leading-none',
      sparkleSvg: 'w-3.5 h-3.5',
      sparkleOffset: '-top-1 -right-2.5',
      subtitle: 'text-[9px] tracking-wider font-medium mt-1',
      glowRadius: 'blur-md',
    },
    md: {
      sText: 'text-4xl font-black leading-none',
      linkSvg: 'w-12 h-6 mx-1.5',
      codersText: 'text-4xl font-black leading-none',
      sparkleSvg: 'w-5 h-5',
      sparkleOffset: '-top-1.5 -right-3.5',
      subtitle: 'text-xs tracking-wider font-medium mt-1.5',
      glowRadius: 'blur-lg',
    },
    lg: {
      sText: 'text-5xl sm:text-6xl font-black leading-none',
      linkSvg: 'w-16 h-8 mx-2',
      codersText: 'text-5xl sm:text-6xl font-black leading-none',
      sparkleSvg: 'w-7 h-7',
      sparkleOffset: '-top-2 -right-5',
      subtitle: 'text-sm sm:text-base tracking-wider font-medium mt-2',
      glowRadius: 'blur-xl',
    },
    xl: {
      sText: 'text-6xl sm:text-7xl font-black leading-none',
      linkSvg: 'w-24 h-12 mx-2.5',
      codersText: 'text-6xl sm:text-7xl font-black leading-none',
      sparkleSvg: 'w-9 h-9',
      sparkleOffset: '-top-3 -right-6.5',
      subtitle: 'text-base sm:text-lg tracking-wider font-medium mt-2.5',
      glowRadius: 'blur-2xl',
    }
  };

  const currentSize = sizeClasses[size];

  // Color selections based on exact user brand guidelines & reference photo
  const sColor = lightBg 
    ? 'text-[#1200A5] font-black drop-shadow-sm' 
    : 'text-[#1200A5] dark:text-[#2510E5] font-black drop-shadow-[0_0_10px_rgba(37,16,229,0.7)]'; // Exact deep dark navy/indigo blue for "S" as in reference image
  
  const linkColor = '#2563EB'; // Royal blue for chain link (-)
  const bridgeColor = '#2563EB'; // Matching royal blue bridge
  
  const codersColor = 'text-[#38BDF8] font-black drop-shadow-sm'; // Sky Blue for "CODERS"
    
  const subtitleColor = lightBg 
    ? 'text-[#1E293B] font-semibold' 
    : 'text-slate-200 font-medium'; // "Bharath Tech Developers"
    
  const sparkleColor = 'text-black'; // Black 4-point star as per reference image

  return (
    <div 
      id={`logo-container-${size}`} 
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`flex select-none relative focus:outline-none ${
        horizontal 
          ? 'flex-row items-center gap-2' 
          : 'flex-col items-center md:items-start text-center md:text-left'
      } ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      {/* Background soft glow (only on dark mode) */}
      {!lightBg && (
        <div className={`absolute -inset-4 bg-gradient-to-r from-indigo-500/10 via-sky-500/5 to-transparent rounded-full ${currentSize.glowRadius} pointer-events-none opacity-80`} />
      )}

      {/* S 🔗 CODERS Top Row */}
      <div className="relative flex items-center justify-center font-display">
        {/* Letter S */}
        <span className={`font-black tracking-tight transition-all duration-300 ${sColor} ${currentSize.sText}`}>
          S
        </span>

        {/* Link / Socket Symmetrical Icon */}
        <svg
          viewBox="0 0 42 22"
          className={`${currentSize.linkSvg} shrink-0 transition-transform duration-300 group-hover:scale-110 ${
            !lightBg ? 'drop-shadow-[0_0_8px_rgba(37,99,235,0.6)]' : ''
          }`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left Link Capsule */}
          <path
            d="M18 5H10C6.13401 5 3 8.13401 3 12C3 15.866 6.13401 19 10 19H18"
            stroke={linkColor}
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          {/* Right Link Capsule */}
          <path
            d="M24 5H32C37.866 5 41 8.13401 41 12C41 15.866 37.866 19 32 19H24"
            stroke={linkColor}
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          {/* Connecting bridge */}
          <path
            d="M13 12H29"
            stroke={bridgeColor}
            strokeWidth="3.6"
            strokeLinecap="round"
          />
        </svg>

        {/* Word CODERS with absolute relative sparkle */}
        <div className="relative flex items-center">
          <span className={`font-black tracking-tight transition-all duration-300 ${codersColor} ${currentSize.codersText}`}>
            CODERS
          </span>

          {/* Sparkle Star absolutely positioned on top right of "CODERS" */}
          <div className={`absolute ${currentSize.sparkleOffset} ${sparkleColor} animate-pulse`}>
            <svg
              viewBox="0 0 24 24"
              className={`${currentSize.sparkleSvg} shrink-0 transition-transform duration-500 hover:rotate-90`}
            >
              <path 
                d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z" 
                fill="#000000"
                stroke={!lightBg ? "#ffffff" : "none"}
                strokeWidth={!lightBg ? "1.5" : "0"}
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Subtitle Row "Bharath Tech Developers" */}
      {showSubtitle && (
        <div className={`flex items-center gap-1.5 ${horizontal ? 'mt-0 ml-1' : 'mt-1'}`}>
          {horizontal && (
            <div className={`h-4.5 w-px mr-1 shrink-0 ${lightBg ? 'bg-slate-300' : 'bg-white/20'}`} />
          )}
          <span className={`font-sans font-semibold transition-colors duration-300 whitespace-nowrap ${subtitleColor} ${
            horizontal 
              ? 'text-[11px] sm:text-xs md:text-[13px]' 
              : currentSize.subtitle
          }`}>
            Bharath Tech Developers
          </span>
          {onAdminClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdminClick();
              }}
              title="Admin Portal"
              className="p-1 rounded bg-brand-teal/10 border border-brand-teal/20 text-brand-teal hover:bg-brand-teal hover:text-brand-dark transition-all duration-200 cursor-pointer focus:outline-none flex items-center justify-center shrink-0 ml-1"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-2.5 h-2.5"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
