import { Linkedin, Github, Users2, Sparkles, HeartHandshake } from 'lucide-react';
import { motion } from 'motion/react';
import { TEAM_MEMBERS } from '../data';

export default function Team() {
  return (
    <section id="team" className="py-24 bg-brand-dark relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute right-0 top-1/3 w-[350px] h-[350px] ambient-coral-glow rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono mb-4">
            <Users2 className="w-3.5 h-3.5" />
            <span>THE CREW</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight mb-6">
            Meet the <span className="text-brand-teal">S-CODERS</span> Brain Trust
          </h2>
          <p className="text-gray-400 font-sans font-light text-lg">
            A lean, interdisciplinary group of tech-obsessed builders, developers, and designers working collaboratively from Bengaluru to push technological limits.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-20">
          {TEAM_MEMBERS.map((member) => (
            <motion.div
              key={member.id}
              whileHover={{ y: -8 }}
              className="glass-panel rounded-3xl border border-white/5 overflow-hidden flex flex-col sm:flex-row group transition-all duration-300"
            >
              {/* Profile image column */}
              <div className="sm:w-2/5 relative h-64 sm:h-auto overflow-hidden">
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-brand-dark via-transparent to-transparent opacity-80" />
              </div>

              {/* Bio & Details Column */}
              <div className="p-8 sm:w-3/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-display font-bold text-xl text-white group-hover:text-brand-teal transition-colors">
                      {member.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-brand-teal transition-colors"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="text-xs font-mono text-brand-coral uppercase tracking-widest mb-4">
                    {member.role}
                  </div>
                  
                  <p className="text-gray-400 text-sm font-sans font-light leading-relaxed mb-4">
                    {member.bio}
                  </p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {member.expertise.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-mono text-gray-400 border border-white/5"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Specific Contribution panel */}
                <div className="pt-4 border-t border-white/5">
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Key Impact</div>
                  <p className="text-gray-300 text-xs font-sans font-light italic leading-relaxed">
                    "{member.contribution}"
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Culture Card */}
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 ambient-glow opacity-60 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 items-center">
            
            <div className="lg:col-span-1">
              <div className="p-3 bg-brand-teal/10 rounded-2xl border border-brand-teal/20 w-fit mb-6">
                <HeartHandshake className="w-8 h-8 text-brand-teal" />
              </div>
              <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight mb-4">
                Our Cultural Blueprint
              </h3>
              <p className="text-gray-400 font-sans font-light leading-relaxed">
                We believe that elite software is built in environments that inspire trust, reward extreme curiosity, and foster complete developer autonomy.
              </p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-brand-dark/40 border border-white/5 rounded-2xl">
                <h4 className="font-display font-bold text-lg text-brand-teal mb-2">High-Velocity Collaboration</h4>
                <p className="text-gray-400 text-sm font-sans font-light leading-relaxed">
                  We maintain zero hierarchy. Communication is direct, feedback loops are daily, and decisions are backed strictly by technical data and prototypes.
                </p>
              </div>

              <div className="p-6 bg-brand-dark/40 border border-white/5 rounded-2xl">
                <h4 className="font-display font-bold text-lg text-brand-coral mb-2">Build in Public</h4>
                <p className="text-gray-400 text-sm font-sans font-light leading-relaxed">
                  We share our research, host active developer bootcamps, publish code repositories, and participate actively in Karnataka's startup communities.
                </p>
              </div>

              <div className="p-6 bg-brand-dark/40 border border-white/5 rounded-2xl">
                <h4 className="font-display font-bold text-lg text-brand-accent mb-2">Extreme Ownership</h4>
                <p className="text-gray-400 text-sm font-sans font-light leading-relaxed">
                  Each crew member directs their modules. We don't micromanage—we define objective value metrics and empower our builders to hit them.
                </p>
              </div>

              <div className="p-6 bg-brand-dark/40 border border-white/5 rounded-2xl">
                <h4 className="font-display font-bold text-lg text-white mb-2">Continuous Learning</h4>
                <p className="text-gray-400 text-sm font-sans font-light leading-relaxed">
                  AI is shifting at hyper-speed. S-CODERS guarantees 20% dedicated time weekly to experiment with new SDKs, model weights, and automation pipelines.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
