import { Linkedin, Github, Users2, Sparkles, HeartHandshake } from 'lucide-react';
import { motion } from 'motion/react';
import { TEAM_MEMBERS } from '../data';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Team() {
  return (
    <section id="team" className="py-24 bg-brand-dark relative overflow-hidden select-none">
      {/* Background radial highlight */}
      <div className="absolute right-0 top-1/3 w-[350px] h-[350px] ambient-coral-glow rounded-full pointer-events-none opacity-50" />
      <div className="absolute left-0 bottom-1/4 w-[300px] h-[300px] ambient-glow rounded-full pointer-events-none opacity-30" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono mb-4">
            <Users2 className="w-3.5 h-3.5" />
            <span>THE CREW</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight mb-6">
            Meet the <span className="text-brand-teal drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">S-CODERS</span> Brain Trust
          </h2>
          <p className="text-gray-400 font-sans font-light text-lg">
            A lean, interdisciplinary group of tech-obsessed builders, developers, and designers working collaboratively from Bengaluru to push technological limits.
          </p>
        </motion.div>

        {/* Team Grid with Staggered Entrance */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-20"
        >
          {TEAM_MEMBERS.map((member) => (
            <motion.div
              key={member.id}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { duration: 0.25 } }}
              className="glass-panel rounded-3xl border border-white/10 hover:border-brand-teal/40 overflow-hidden flex flex-col sm:flex-row group transition-all duration-300 shadow-xl hover:shadow-brand-teal/10 relative"
            >
              {/* Profile image column */}
              <div className="sm:w-2/5 relative h-64 sm:h-auto overflow-hidden">
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-brand-dark via-brand-dark/40 to-transparent opacity-80" />
              </div>

              {/* Bio & Details Column */}
              <div className="p-8 sm:w-3/5 flex flex-col justify-between relative z-10">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-display font-bold text-xl text-white group-hover:text-brand-teal transition-colors">
                      {member.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <motion.a
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-brand-teal transition-colors p-1"
                      >
                        <Linkedin className="w-4 h-4" />
                      </motion.a>
                      <motion.a
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors p-1"
                      >
                        <Github className="w-4 h-4" />
                      </motion.a>
                    </div>
                  </div>
                  
                  <div className="text-xs font-mono text-brand-teal uppercase tracking-widest mb-4 font-semibold">
                    {member.role}
                  </div>
                  
                  <p className="text-gray-400 text-sm font-sans font-light leading-relaxed mb-4">
                    {member.bio}
                  </p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {member.expertise.map((skill, idx) => (
                      <motion.span
                        key={idx}
                        whileHover={{ scale: 1.08, backgroundColor: 'rgba(34, 211, 238, 0.15)' }}
                        className="px-2.5 py-1 bg-white/5 rounded-md text-[10px] font-mono text-gray-300 border border-white/10 transition-colors cursor-default"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Specific Contribution panel */}
                <div className="pt-4 border-t border-white/10">
                  <div className="text-[10px] font-mono text-brand-teal/80 uppercase tracking-widest mb-1 font-bold">Key Impact</div>
                  <p className="text-gray-300 text-xs font-sans font-light italic leading-relaxed">
                    "{member.contribution}"
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Culture Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 hover:border-brand-teal/30 relative overflow-hidden transition-all shadow-2xl"
        >
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
              {[
                { title: 'High-Velocity Collaboration', desc: 'We maintain zero hierarchy. Communication is direct, feedback loops are daily, and decisions are backed strictly by technical data and prototypes.', color: 'text-brand-teal' },
                { title: 'Build in Public', desc: 'We share our research, host active developer bootcamps, publish code repositories, and participate actively in Karnataka\'s startup communities.', color: 'text-brand-coral' },
                { title: 'Extreme Ownership', desc: 'Each crew member directs their modules. We don\'t micromanage—we define objective value metrics and empower our builders to hit them.', color: 'text-brand-accent' },
                { title: 'Continuous Learning', desc: 'AI is shifting at hyper-speed. S-CODERS guarantees 20% dedicated time weekly to experiment with new SDKs, model weights, and automation pipelines.', color: 'text-white' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="p-6 bg-brand-dark/50 border border-white/5 hover:border-white/20 rounded-2xl transition-all"
                >
                  <h4 className={`font-display font-bold text-lg ${item.color} mb-2`}>{item.title}</h4>
                  <p className="text-gray-400 text-sm font-sans font-light leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
