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

      <div className="relative max-w-5xl mx-auto px-6 sm:px-8 w-full z-10 text-center py-12">
        {/* Animated Architectural Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#143b4e]/90 border border-[#A7D8F2]/45 text-white text-xs font-mono tracking-widest uppercase mb-10 shadow-xl backdrop-blur-md group hover:border-brand-teal transition-all cursor-default"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-teal"></span>
          </span>
          <span className="font-semibold">S-CODERS • Bharath Tech Developers</span>
          <Sparkles className="w-3.5 h-3.5 text-brand-teal group-hover:rotate-180 transition-transform duration-700" />
        </motion.div>

        {/* Serif Editorial Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-display font-serif text-white tracking-normal leading-[1.15] max-w-4xl mx-auto mb-8 drop-shadow-md"
        >
          The Next Generation of <span className="italic text-[#A7D8F2] font-serif">Software Engineering</span> is Here.
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
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(34, 211, 238, 0.25)" }}
            whileTap={{ scale: 0.96 }}
            onClick={onExploreServices}
            className="px-8 py-4 bg-[#1F4959] hover:bg-brand-teal hover:text-brand-dark text-white font-serif font-medium text-base rounded-full border border-[#5C7C89]/50 transition-all duration-300 shadow-xl flex items-center justify-center gap-3 group cursor-pointer font-bold"
          >
            <span>Explore Our Services</span>
            <ArrowRight className="w-4 h-4 text-brand-teal group-hover:text-brand-dark group-hover:translate-x-1.5 transition-all" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenAssistant}
            className="group relative inline-flex items-center gap-2 text-sm font-sans font-medium text-slate-200 hover:text-white transition-colors cursor-pointer py-2"
          >
            <Code2 className="w-4 h-4 text-brand-teal group-hover:rotate-12 transition-transform" />
            <span className="border-b border-[#5C7C89] group-hover:border-brand-teal pb-0.5 transition-colors font-mono">
              Consult S-CODERS AI Assistant
            </span>
          </motion.button>
        </motion.div>

        {/* Animated statistics and counters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
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
