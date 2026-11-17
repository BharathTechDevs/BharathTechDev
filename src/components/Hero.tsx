import { ArrowRight, Sparkles, Code2, Users, Cpu, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import MarqueeTicker from './MarqueeTicker';
import { S_CODERS_STATS } from '../data';

interface HeroProps {
  onOpenAssistant: () => void;
  onExploreServices?: () => void;
}

export default function Hero({ onOpenAssistant, onExploreServices }: HeroProps) {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center pt-28 pb-20 overflow-hidden bg-brand-dark select-none"
    >
      {/* Background Ambience & Architectural Lighting */}
      <div className="absolute top-1/4 left-1/2 w-[700px] h-[700px] ambient-glow rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-80" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] ambient-coral-glow rounded-full pointer-events-none opacity-60" />
      <div className="absolute top-20 left-10 w-[400px] h-[400px] ambient-glow rounded-full pointer-events-none opacity-45" />

      {/* Floating Animated Cyber Particles in Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[
          { left: '10%', top: '20%', size: 6, delay: 0, duration: 6 },
          { left: '85%', top: '15%', size: 8, delay: 1, duration: 8 },
          { left: '25%', top: '70%', size: 5, delay: 2, duration: 7 },
          { left: '75%', top: '65%', size: 7, delay: 0.5, duration: 9 },
          { left: '50%', top: '80%', size: 6, delay: 1.5, duration: 6.5 },
          { left: '90%', top: '45%', size: 4, delay: 2.5, duration: 5.5 },
        ].map((particle, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-brand-teal/40 blur-[1px]"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              y: [0, -35, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: particle.delay,
            }}
          />
        ))}
      </div>
      
      {/* Subtle architectural grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-25 pointer-events-none" />

      {/* Decorative Architectural Arch Silhouette Background Container */}
      <div className="absolute inset-x-3 sm:inset-x-6 top-20 bottom-8 max-w-6xl mx-auto border border-[#A7D8F2]/30 arch-frame pointer-events-none bg-gradient-to-b from-[#143b4e]/45 via-[#062338]/60 to-[#021221]/80 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(20,59,78,0.35)]">
        {/* Inner Arch Layer */}
        <div className="w-4/5 h-[88%] border border-[#A7D8F2]/35 arch-frame bg-[#062338]/75 opacity-90 backdrop-blur-xl flex items-center justify-center shadow-[inset_0_0_30px_rgba(167,216,242,0.06)]">
          <div className="w-3/4 h-4/5 border border-[#A7D8F2]/25 arch-frame bg-[#143b4e]/40" />
        </div>
      </div>

      <div className="relative max-w-5xl mx-auto px-6 sm:px-8 w-full z-10 text-center py-10 sm:py-14">
        {/* CHILLCHAI-STYLE HERO BRAND INTRO ANIMATION: "S-CODERS" + "Bharat Tech Developers" */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center mb-8 relative"
        >
          {/* Animated Glowing Radial Halo behind brand */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-8 bg-gradient-to-r from-[#4361EE]/20 via-[#00D2FF]/25 to-[#22D3EE]/20 rounded-full blur-3xl pointer-events-none"
          />

          {/* Badge Indicator */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#143b4e]/80 border border-brand-teal/30 text-white text-[11px] font-mono tracking-wider uppercase mb-5 backdrop-blur-md shadow-lg"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-teal" />
            </span>
            <span className="font-semibold text-gray-200">Official Tech Studio</span>
            <Sparkles className="w-3 h-3 text-brand-teal animate-spin-slow" />
          </motion.div>

          {/* Animated Main Brand Name: S-CODERS (Matches original Logo.tsx identity & proportions) */}
          <div className="relative flex items-center justify-center text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tight leading-none select-none">
            {/* "S" */}
            <motion.span
              initial={{ opacity: 0, y: 25, rotateX: 60 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[#4361EE] font-black leading-none drop-shadow-[0_0_24px_rgba(67,97,238,0.85)] inline-block"
            >
              S
            </motion.span>

            {/* Symmetrical Chain Link Icon matching Logo.tsx */}
            <motion.svg
              viewBox="0 0 42 22"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.32, ease: "easeOut" }}
              className="w-12 h-6 mx-1.5 sm:w-16 sm:h-8 sm:mx-2 md:w-24 md:h-12 md:mx-2.5 shrink-0 drop-shadow-[0_0_10px_rgba(0,210,255,0.75)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Left Link Capsule */}
              <motion.path
                d="M18 5H10C6.13401 5 3 8.13401 3 12C3 15.866 6.13401 19 10 19H18"
                stroke="#00D2FF"
                strokeWidth="3.6"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
              />
              {/* Right Link Capsule */}
              <motion.path
                d="M24 5H32C37.866 5 41 8.13401 41 12C41 15.866 37.866 19 32 19H24"
                stroke="#00D2FF"
                strokeWidth="3.6"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.42, ease: "easeOut" }}
              />
              {/* Connecting bridge */}
              <motion.path
                d="M13 12H29"
                stroke="#00D2FF"
                strokeWidth="3.6"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.48, ease: "easeOut" }}
              />
            </motion.svg>

            {/* "CODERS" with upper-right proportional sparkle star */}
            <div className="relative flex items-center">
              <div className="flex items-center">
                {"CODERS".split('').map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 25, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.4 + index * 0.06,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    className="text-[#00D2FF] font-black leading-none drop-shadow-[0_0_20px_rgba(0,210,255,0.7)] inline-block"
                  >
                    {char}
                  </motion.span>
                ))}
              </div>

              {/* Sparkle Star positioned neatly in upper-right corner matching Logo.tsx */}
              <motion.div
                initial={{ scale: 0, rotate: -45, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], rotate: [0, 90, 0], opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.85, ease: "easeOut" }}
                className="absolute -top-1.5 -right-3.5 sm:-top-2 sm:-right-5 md:-top-2.5 md:-right-6 text-[#E0F2FE] drop-shadow-[0_0_10px_rgba(255,255,255,0.85)] pointer-events-none"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 shrink-0 animate-pulse"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z"
                    fill="currentColor"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                </svg>
              </motion.div>
            </div>
          </div>

          {/* Expanding Neon Accent Rule */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '80%', opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
            className="h-[1.5px] bg-gradient-to-r from-transparent via-[#00D2FF]/60 to-transparent mt-3 mb-2.5 max-w-sm"
          />

          {/* Animated Tagline: "BHARAT TECH DEVELOPERS" */}
          <motion.div
            initial={{ opacity: 0, y: 10, letterSpacing: '0.15em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '0.28em' }}
            transition={{ duration: 0.7, delay: 1.05, ease: "easeOut" }}
            className="text-xs sm:text-sm font-display font-bold uppercase text-slate-200 tracking-[0.28em] drop-shadow-md text-center"
          >
            Bharat Tech Developers
          </motion.div>
        </motion.div>

        {/* Serif Editorial Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-display font-serif text-white tracking-normal leading-[1.2] max-w-4xl mx-auto mb-6 drop-shadow-md"
        >
          The Next Generation of <span className="italic text-[#A7D8F2] font-serif">Software Engineering</span> is Here.
        </motion.h1>

        {/* Short storytelling subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="text-sm sm:text-base text-slate-300 font-sans font-normal max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          S-CODERS (Bharat Tech Developers) crafts customized AI agents, mobile applications, and high-performance full-stack web architectures for founders, enterprises, and visionary teams globally.
        </motion.p>

        {/* Call to action controls & Underlined Action Link */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14"
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(34, 211, 238, 0.25)" }}
            whileTap={{ scale: 0.96 }}
            onClick={onExploreServices}
            className="px-8 py-3.5 bg-[#1F4959] hover:bg-brand-teal hover:text-brand-dark text-white font-serif font-medium text-sm sm:text-base rounded-full border border-[#5C7C89]/50 transition-all duration-300 shadow-xl flex items-center justify-center gap-3 group cursor-pointer font-bold"
          >
            <span>Explore Our Services</span>
            <ArrowRight className="w-4 h-4 text-brand-teal group-hover:text-brand-dark group-hover:translate-x-1.5 transition-all" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenAssistant}
            className="group relative inline-flex items-center gap-2 text-xs sm:text-sm font-sans font-medium text-slate-200 hover:text-white transition-colors cursor-pointer py-2"
          >
            <Code2 className="w-4 h-4 text-brand-teal group-hover:rotate-12 transition-transform" />
            <span className="border-b border-[#5C7C89] group-hover:border-brand-teal pb-0.5 transition-colors font-mono">
              Consult S-CODERS AI Assistant
            </span>
          </motion.button>
        </motion.div>

        {/* Chillchai-style Animated SCROLL indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.85 }}
          className="flex flex-col items-center justify-center my-8 text-center"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-[0.25em] text-brand-teal/80 uppercase font-semibold">
            <span>SCROLL</span>
            <motion.span
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-brand-teal inline-block"
            >
              ↓
            </motion.span>
          </div>
        </motion.div>

        {/* Animated statistics and counters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.95 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {S_CODERS_STATS.map((stat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-[#1F4959]/40 backdrop-blur-md p-6 rounded-2xl text-center border border-[#5C7C89]/25 relative overflow-hidden group hover:border-brand-teal/50 hover:bg-[#1F4959]/60 transition-all duration-300 shadow-lg"
            >
              <div className="absolute top-0 right-0 w-12 h-12 bg-brand-teal/10 rounded-full blur-xl group-hover:bg-brand-teal/30 transition-all pointer-events-none" />
              <div className="font-display font-serif text-3xl sm:text-4xl text-white mb-1 group-hover:text-brand-teal group-hover:scale-105 transition-all duration-300 font-extrabold">
                {stat.value}
              </div>
              <div className="text-xs text-slate-300 font-mono font-medium tracking-wider uppercase">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Continuous Infinite Moving Ticker Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.75 }}
          className="mt-14"
        >
          <MarqueeTicker />
        </motion.div>
      </div>
    </section>
  );
}
