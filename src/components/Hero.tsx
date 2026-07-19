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
      className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden bg-brand-dark"
    >
      {/* Background Ambience & Lighting */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] ambient-glow rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] ambient-coral-glow rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />
      
      {/* Dot grid decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 text-center">
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-brand-teal text-xs font-mono tracking-wider uppercase mb-8 shadow-inner"
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
          <span>Bharath Tech Developers</span>
        </motion.div>

        {/* Dynamic Display Typography Headings */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold text-white tracking-tight leading-[1.1] max-w-5xl mx-auto mb-8"
        >
          We build the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-teal via-brand-accent to-brand-coral">software</span> that runs your next big idea.
        </motion.h1>

        {/* Short storytelling subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg sm:text-xl text-gray-400 font-sans font-light max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          Bharath Tech Developers (operating as S-CODERS) is an elite AI engineering and software development startup based in Bengaluru. We build customized AI agents, mobile applications, and high-performance full-stack web architectures for founders, enterprises, and visionary teams globally.
        </motion.p>

        {/* Call to action controls */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
        >
          <button
            onClick={onExploreServices}
            className="w-full sm:w-auto px-8 py-4 bg-brand-teal text-brand-dark font-bold rounded-full hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-brand-teal/25 flex items-center justify-center gap-2 group cursor-pointer"
          >
            Explore Services
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>
          
          <button
            onClick={onOpenAssistant}
            className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-full border border-white/10 hover:border-white/20 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            <Code2 className="w-5 h-5 text-brand-teal group-hover:rotate-12 transition-transform" />
            Consult Bharath Tech AI
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
              className="glass-panel p-6 rounded-2xl text-center border border-white/5 relative overflow-hidden group hover:border-white/15 transition-all duration-300"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-teal/40 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="font-display font-extrabold text-3xl sm:text-4xl text-brand-teal mb-1 group-hover:scale-105 transition-transform duration-300">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 font-mono tracking-wider uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
