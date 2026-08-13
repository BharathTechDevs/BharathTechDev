import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Cpu, Code2, Terminal, Zap, Shield, Globe, Database, Layers, CheckCircle2 } from 'lucide-react';

interface MarqueeTickerProps {
  items?: { label: string; tag?: string; icon?: React.ReactNode }[];
  speed?: number; // seconds for full cycle
  direction?: 'left' | 'right';
  className?: string;
  badgeText?: string;
}

const DEFAULT_ITEMS = [
  { label: 'Google Gemini 1.5 & 2.0 Flash', tag: 'AI LLM Engine', icon: <Sparkles className="w-4 h-4 text-brand-teal" /> },
  { label: 'n8n Workflow Automation', tag: 'Agent Orchestration', icon: <Zap className="w-4 h-4 text-brand-coral" /> },
  { label: 'React Native & Mobile App Dev', tag: 'iOS & Android', icon: <Code2 className="w-4 h-4 text-emerald-400" /> },
  { label: 'Razorpay Payment Gateway', tag: 'Auto Verification', icon: <Shield className="w-4 h-4 text-cyan-400" /> },
  { label: 'PostgreSQL & Cloud SQL', tag: 'Drizzle ORM Engine', icon: <Database className="w-4 h-4 text-purple-400" /> },
  { label: 'Firebase Auth & Firestore', tag: 'Cloud DB', icon: <Layers className="w-4 h-4 text-amber-400" /> },
  { label: 'Full-Stack React & Vite', tag: 'Modern Frontend', icon: <Globe className="w-4 h-4 text-blue-400" /> },
  { label: 'Docker & Express Microservices', tag: 'Cloud Backend', icon: <Terminal className="w-4 h-4 text-emerald-400" /> },
  { label: 'NASSCOM & Tech Incubator Certified', tag: 'Community Partner', icon: <CheckCircle2 className="w-4 h-4 text-brand-teal" /> },
  { label: 'S-CODERS Verified Event Passes', tag: 'QR Code Ticket', icon: <Cpu className="w-4 h-4 text-brand-coral" /> }
];

export default function MarqueeTicker({
  items = DEFAULT_ITEMS,
  speed = 25,
  direction = 'left',
  className = '',
  badgeText = 'TECH STACK & PARTNERS'
}: MarqueeTickerProps) {
  // Duplicate array 3 times to ensure continuous seamless looping
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div className={`w-full overflow-hidden relative py-4 bg-black/40 border-y border-white/10 backdrop-blur-md select-none ${className}`}>
      {/* Subtle fade edges on left and right */}
      <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-brand-dark via-brand-dark/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-brand-dark via-brand-dark/80 to-transparent z-10 pointer-events-none" />

      {/* Continuously Animated Infinite Track */}
      <div className="flex w-max space-x-6 sm:space-x-8 animate-marquee">
        {duplicatedItems.map((item, idx) => (
          <div
            key={idx}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-brand-teal/40 hover:bg-white/10 transition-all duration-300 group cursor-pointer whitespace-nowrap"
          >
            <div className="p-1.5 rounded-lg bg-black/40 group-hover:scale-110 transition-transform">
              {item.icon || <Sparkles className="w-4 h-4 text-brand-teal" />}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs sm:text-sm font-display font-bold text-white group-hover:text-brand-teal transition-colors">
                {item.label}
              </span>
              {item.tag && (
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest font-medium">
                  {item.tag}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
