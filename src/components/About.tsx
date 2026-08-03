import { Target, Eye, Milestone, TrendingUp, Sparkles, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { COMPANY_VALUES } from '../data';

export default function About() {
  const roadmapSteps = [
    {
      year: '2025',
      title: 'The Spark & Genesis',
      description: 'S-CODERS (Bharath Tech Developers) was registered and launched in Bengaluru by Suhas Gowda as a high-velocity software engineering agency, initially delivering custom websites and web applications.',
    },
    {
      year: '2026 (Q1-Q2)',
      title: 'AI Workflows & Incubation',
      description: 'Expanded expertise into Generative AI agent pipelines, custom prompt chaining, and n8n integrations. Selected into GOAT Founder Club and NASSCOM incubation Circles.',
    },
    {
      year: '2026 (Q3-Q4)',
      title: 'Community Scaling',
      description: 'Initiated regional workshop series at Microsoft Reactor and major engineering colleges, building local technical authority and forming deep developer ties.',
    },
    {
      year: '2027+',
      title: 'SaaS Expansion & Beyond',
      description: 'Transitioning custom service flows into standardized, productized mobile SaaS utilities, deploying robust cloud frameworks globally.',
    },
  ];

  return (
    <section id="about" className="py-24 bg-brand-dark/95 relative overflow-hidden">
      {/* Lights & Effects */}
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] ambient-glow rounded-full -translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OUR STORY</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight mb-6">
            Pioneering the Future of <span className="text-brand-teal">Software & AI</span>
          </h2>
          <p className="text-gray-400 font-sans font-light text-lg">
            S-CODERS (Bharath Tech Developers) is an elite software engineering and AI design studio based in Bengaluru. Under our high-fidelity operations, we build actual software systems that optimize workflow pipelines, automate decision loops, and build credible digital authority for high-growth ventures.
          </p>
        </div>

        {/* Vision & Mission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <motion.div
            whileHover={{ y: -5 }}
            className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 text-white group-hover:scale-110 transition-transform duration-500">
              <Eye className="w-24 h-24" />
            </div>
            <div className="p-3 bg-brand-teal/10 rounded-2xl border border-brand-teal/20 w-fit mb-6">
              <Eye className="w-8 h-8 text-brand-teal" />
            </div>
            <h3 className="font-display font-bold text-2xl text-white mb-4">Our Vision</h3>
            <p className="text-gray-400 font-sans font-light leading-relaxed">
              To be recognized globally as the primary innovation engine and software design studio for startup founders and enterprises. We aim to construct an ecosystem where autonomous AI intelligence and elegant user interfaces align perfectly to solve real-world problems.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 text-white group-hover:scale-110 transition-transform duration-500">
              <Target className="w-24 h-24" />
            </div>
            <div className="p-3 bg-brand-coral/10 rounded-2xl border border-brand-coral/20 w-fit mb-6">
              <Target className="w-8 h-8 text-brand-coral" />
            </div>
            <h3 className="font-display font-bold text-2xl text-white mb-4">Our Mission</h3>
            <p className="text-gray-400 font-sans font-light leading-relaxed">
              To demystify complex software development. We achieve this by providing world-class, pixel-perfect engineering services and hands-on workshops that turn abstract ideas into production-ready software systems, empowering developers and founders.
            </p>
          </motion.div>
        </div>

        {/* Core Values Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h3 className="font-display font-bold text-2xl sm:text-3xl text-white mb-2">Our Operating Values</h3>
            <p className="text-gray-500 text-sm font-mono uppercase tracking-wider">The principles guiding S-CODERS • Bharath Tech Developers daily deliverables</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {COMPANY_VALUES.map((value, idx) => (
              <div
                key={idx}
                className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-brand-teal/20 transition-all duration-300"
              >
                <div className="text-brand-teal font-mono text-xs font-bold mb-3">0{idx + 1}.</div>
                <h4 className="font-display font-bold text-lg text-white mb-2">{value.title}</h4>
                <p className="text-gray-400 font-sans text-sm font-light leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Journey Timeline & Roadmap */}
        <div>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-coral/10 border border-brand-coral/20 text-brand-coral text-xs font-mono mb-3">
              <Milestone className="w-3.5 h-3.5" />
              <span>THE ROADMAP</span>
            </div>
            <h3 className="font-display font-bold text-2xl sm:text-3xl text-white">S-CODERS Milestones</h3>
            <p className="text-gray-500 text-sm font-mono uppercase tracking-wider mt-1">Our chronological growth and upcoming goals</p>
          </div>

          <div className="relative border-l border-white/10 ml-4 md:ml-32 pl-8 md:pl-12 space-y-12 max-w-4xl mx-auto">
            {roadmapSteps.map((step, idx) => (
              <div key={idx} className="relative group">
                {/* Year tag left-aligned on desktop */}
                <div className="hidden md:block absolute -left-44 top-1 text-right w-28">
                  <span className="font-display font-extrabold text-xl text-brand-teal">{step.year}</span>
                </div>
                
                {/* Visual Bullet Node */}
                <div className="absolute -left-[41px] md:-left-[57px] top-1.5 w-5 h-5 rounded-full bg-brand-dark border-2 border-brand-teal group-hover:bg-brand-teal transition-colors duration-300 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-teal group-hover:bg-brand-dark" />
                </div>

                <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300">
                  <span className="inline-block md:hidden font-mono font-bold text-brand-teal text-sm mb-1">{step.year}</span>
                  <h4 className="font-display font-bold text-lg sm:text-xl text-white mb-2 group-hover:text-brand-teal transition-colors">
                    {step.title}
                  </h4>
                  <p className="text-gray-400 font-sans font-light text-sm sm:text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
