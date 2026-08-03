import { ArrowRight, Sparkles, Code2, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { S_CODERS_STATS } from '../data';

interface HeroProps {
  onOpenAssistant: () => void;
  onExploreServices?: () => void;
}

export default function Hero({ onOpenAssistant, onExploreServices }: HeroProps) {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center pt-28 pb-20 overflow-hidden bg-brand-dark"
    >
      {/* Background Ambience & Architectural Lighting */}
      <div className="absolute top-1/4 left-1/2 w-[600px] h-[600px] ambient-glow rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] ambient-coral-glow rounded-full pointer-events-none opacity-40" />
      
      {/* Subtle architectural grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      {/* Decorative Architectural Arch Silhouette Background Container */}
      <div className="absolute inset-x-4 top-24 bottom-12 max-w-6xl mx-auto border border-[#5C7C89]/20 arch-frame pointer-events-none bg-gradient-to-b from-[#1F4959]/20 via-[#011425]/40 to-transparent flex items-center justify-center overflow-hidden">
        {/* Inner Arch Layer */}
        <div className="w-3/4 h-5/6 border border-[#5C7C89]/30 arch-frame bg-[#011425]/60 opacity-80 backdrop-blur-3xl flex items-center justify-center">
          <div className="w-2/3 h-4/5 border border-[#5C7C89]/20 arch-frame bg-[#1F4959]/20" />
        </div>
      </div>

      <div className="relative max-w-5xl mx-auto px-6 sm:px-8 w-full z-10 text-center py-12">
        {/* Animated Architectural Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#1F4959]/50 border border-[#5C7C89]/30 text-white text-xs font-mono tracking-widest uppercase mb-10 shadow-lg backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#5C7C89] animate-spin-slow" />
          <span>S-CODERS • Bharath Tech Developers</span>
        </motion.div>

        {/* Serif Editorial Title (Inspired directly by "The Extra O collection is now available!") */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-display font-serif text-white tracking-normal leading-[1.15] max-w-4xl mx-auto mb-8 drop-shadow-md"
        >
          The Next Generation of <span className="italic text-[#5C7C89] font-serif">Software Engineering</span> is Here.
        </motion.h1>

        {/* Short storytelling subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-base sm:text-lg text-slate-300 font-sans font-normal max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          S-CODERS (Bharath Tech Developers) crafts customized AI agents, mobile applications, and high-performance full-stack web architectures for founders, enterprises, and visionary teams globally.
        </motion.p>

        {/* Call to action controls & Underlined Action Link */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
        >
          <button
            onClick={onExploreServices}
            className="px-8 py-4 bg-[#1F4959] hover:bg-[#5C7C89] text-white font-serif font-medium text-base rounded-full border border-[#5C7C89]/40 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl flex items-center justify-center gap-3 group cursor-pointer"
          >
            Explore Our Services
            <ArrowRight className="w-4 h-4 text-[#5C7C89] group-hover:text-white group-hover:translate-x-1.5 transition-all" />
          </button>

          <button
            onClick={onOpenAssistant}
            className="group relative inline-flex items-center gap-2 text-sm font-sans font-medium text-slate-200 hover:text-white transition-colors cursor-pointer py-2"
          >
            <Code2 className="w-4 h-4 text-[#5C7C89] group-hover:rotate-12 transition-transform" />
            <span className="border-b border-[#5C7C89] group-hover:border-white pb-0.5 transition-colors">
              Consult S-CODERS AI Assistant
            </span>
          </button>
        </motion.div>

        {/* Animated statistics and counters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {S_CODERS_STATS.map((stat, idx) => (
            <div
              key={idx}
              className="bg-[#1F4959]/40 backdrop-blur-md p-6 rounded-2xl text-center border border-[#5C7C89]/25 relative overflow-hidden group hover:border-[#5C7C89]/50 transition-all duration-300 shadow-lg"
            >
              <div className="font-display font-serif text-3xl sm:text-4xl text-white mb-1 group-hover:scale-105 transition-transform duration-300">
                {stat.value}
              </div>
              <div className="text-xs text-slate-300 font-sans font-medium tracking-wider uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
