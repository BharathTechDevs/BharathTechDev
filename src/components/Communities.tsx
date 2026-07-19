import { useState } from 'react';
import { 
  Network, Sparkles, Presentation, Lightbulb, BadgeCheck, ArrowRight,
  TrendingUp, Compass, Award 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { STARTUP_COMMUNITIES } from '../data';

export default function Communities() {
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>(STARTUP_COMMUNITIES[0].id);

  const activeCommunity = STARTUP_COMMUNITIES.find(c => c.id === selectedCommunityId) || STARTUP_COMMUNITIES[0];

  return (
    <section id="communities" className="py-24 bg-brand-dark/95 relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute right-0 top-1/4 w-[350px] h-[350px] ambient-glow rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono mb-4">
            <Network className="w-3.5 h-3.5" />
            <span>NETWORKING & ECOSYSTEMS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight mb-6">
            Startup Communities & Networking
          </h2>
          <p className="text-gray-400 font-sans font-light text-lg">
            S-CODERS is embedded inside leading Indian technology networks. Discover our presentations, networking landmarks, and collaborative insights.
          </p>
        </div>

        {/* Community selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-12">
          {STARTUP_COMMUNITIES.map((comm) => (
            <button
              key={comm.id}
              onClick={() => setSelectedCommunityId(comm.id)}
              className={`p-4 rounded-xl border text-center font-display text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                selectedCommunityId === comm.id
                  ? 'bg-brand-teal text-brand-dark border-brand-teal shadow-lg shadow-brand-teal/15 scale-105 font-bold'
                  : 'bg-brand-card/40 border-white/5 text-gray-400 hover:text-white hover:border-white/10 hover:bg-brand-card/60'
              }`}
            >
              {comm.name}
            </button>
          ))}
        </div>

        {/* Detailed Selected Community Showcase Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCommunity.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-80 h-80 ambient-coral-glow opacity-30 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
              
              {/* Community Summary */}
              <div className="lg:col-span-5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/10 text-brand-teal text-xs font-mono mb-4">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>ACTIVE MEMBER</span>
                </div>
                <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight mb-4">
                  {activeCommunity.name}
                </h3>
                <p className="text-gray-300 font-sans font-light text-sm sm:text-base leading-relaxed mb-6">
                  {activeCommunity.description}
                </p>

                {/* Networking highlight badge box */}
                <div className="bg-brand-dark/50 border border-white/5 p-5 rounded-2xl">
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-brand-coral animate-pulse" />
                    Networking Highlights
                  </div>
                  <p className="text-gray-300 text-xs sm:text-sm font-sans font-light italic leading-relaxed">
                    "{activeCommunity.networkingHighlights}"
                  </p>
                </div>
              </div>

              {/* Learnings & Presentations */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Learnings checklists */}
                <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                  <h4 className="font-display font-bold text-sm uppercase tracking-widest text-brand-teal mb-4 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-brand-teal shrink-0" />
                    Key Learnings & Takeaways
                  </h4>
                  <ul className="space-y-3">
                    {activeCommunity.learnings.map((learning, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-gray-300 font-sans font-light">
                        <span className="w-5 h-5 rounded-full bg-brand-teal/10 text-brand-teal border border-brand-teal/20 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{learning}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Presentations list */}
                <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                  <h4 className="font-display font-bold text-sm uppercase tracking-widest text-brand-coral mb-4 flex items-center gap-2">
                    <Presentation className="w-4 h-4 text-brand-coral shrink-0" />
                    Delivered Presentations & Demos
                  </h4>
                  <div className="space-y-3">
                    {activeCommunity.presentations.map((presentation, idx) => (
                      <div key={idx} className="flex gap-3 bg-brand-dark/40 border border-white/5 p-3 rounded-xl items-center">
                        <Award className="w-4 h-4 text-brand-coral shrink-0" />
                        <span className="text-xs sm:text-sm text-gray-300 font-sans font-light">{presentation}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
