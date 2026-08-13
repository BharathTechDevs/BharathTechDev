import React from 'react';
import { 
  Target, Eye, Milestone, Sparkles, Award, Heart, Globe, 
  Cpu, BookOpen, Users, Rocket, ShieldCheck, Zap, ArrowRight,
  CheckCircle2, Compass, MessageCircle, Mail
} from 'lucide-react';
import { motion } from 'motion/react';

interface AboutProps {
  onNavigate?: (view: any) => void;
}

export default function About({ onNavigate }: AboutProps) {
  const storyMilestones = [
    {
      period: 'April 2024 - Early 2025',
      title: 'The Seed & Genesis in Bengaluru',
      description: 'S-CODERS (Bharath Tech Developers) originated in Bengaluru, India as a high-velocity developer group passionate about building real-world software beyond standard textbook theory. We focused on hands-on practical execution, shipping custom web portals, and solving complex client software challenges.',
    },
    {
      period: 'Late 2025 - Mid 2026',
      title: 'AI Agent & n8n Automation Breakthrough',
      description: 'Recognizing the massive shift toward generative AI and autonomous workflows, S-CODERS expanded into LLM orchestration, custom prompt chaining, and n8n pipeline engineering. We were inducted into top regional developer circles and tech incubator networks.',
    },
    {
      period: 'Mid 2026 - Present',
      title: 'National Masterclasses & Hackathons',
      description: 'Beyond client software development, we launched hands-on workshops and developer hackathons across India—at venues like Microsoft Reactor and leading engineering institutions—training thousands of builders in practical AI agent deployment.',
    },
    {
      period: 'Future Vision',
      title: 'Empowering India’s Tech Ecosystem',
      description: 'Building standardized digital toolkits, expanding SaaS products, and nurturing a vibrant national developer network capable of building global-class digital solutions.',
    },
  ];

  const corePrinciples = [
    {
      num: '01',
      title: 'Learn Continuously',
      description: 'Growth does not stop at traditional classrooms. We treat every software build, complex challenge, and technical obstacle as an invaluable learning opportunity.',
      icon: <Compass className="w-5 h-5 text-brand-teal" />
    },
    {
      num: '02',
      title: 'Stay Curious',
      description: 'The best engineering mindset is an endlessly questioning one. We dig deeper into AI agent architectures, full-stack design patterns, and system performance.',
      icon: <Zap className="w-5 h-5 text-brand-teal" />
    },
    {
      num: '03',
      title: 'Share Knowledge Freely',
      description: 'What we learn, we share with the community. Through open masterclasses, practical code logs, and live Q&A sessions, the entire developer community rises together.',
      icon: <Heart className="w-5 h-5 text-brand-teal" />
    },
    {
      num: '04',
      title: 'Build Meaningful Production Systems',
      description: 'Every software applet we write and every workflow we automate is designed with intention, high-speed performance, and production-grade craftsmanship.',
      icon: <ShieldCheck className="w-5 h-5 text-brand-teal" />
    },
    {
      num: '05',
      title: 'Support & Uplift the Community',
      description: 'We mentor aspiring student developers, collaborate with early-stage founders, and show up for others. S-CODERS thrives because our community thrives.',
      icon: <Users className="w-5 h-5 text-brand-teal" />
    }
  ];

  const whatWeDoList = [
    {
      icon: <Cpu className="w-6 h-6 text-brand-teal" />,
      title: 'Custom Software & Web Engineering',
      desc: 'High-performance React web applications, mobile platforms, backend microservices, and database architectures tailored to client business needs.'
    },
    {
      icon: <Zap className="w-6 h-6 text-brand-coral" />,
      title: 'AI Agents & n8n Workflow Automation',
      desc: 'Autonomous AI agents, Gemini LLM integrations, function-calling pipelines, and zero-code n8n workflows that save hundreds of operational hours.'
    },
    {
      icon: <BookOpen className="w-6 h-6 text-brand-teal" />,
      title: 'Hands-On Workshops & Bootcamps',
      desc: 'Practical, project-based live masterclasses teaching AI agent building, prompt engineering, and modern full-stack development to students and engineers.'
    },
    {
      icon: <Rocket className="w-6 h-6 text-emerald-400" />,
      title: 'Events, Hackathons & Founder Circles',
      desc: 'Hosting hackathons, founder networking circles, and technical summits that connect ambitious builders with mentors and angel networks.'
    }
  ];

  const practicalValuePillars = [
    {
      target: 'For Startup Founders & Businesses',
      benefit: 'Transform complex business ideas into fully functional, revenue-generating digital products in weeks instead of months, reducing capital expenditure and time-to-market.'
    },
    {
      target: 'For Students & Developers',
      benefit: 'Bridge the gap between academic theory and real industry requirements by mastering in-demand AI and full-stack skills through hands-on building.'
    },
    {
      target: 'For Society & India’s Tech Ecosystem',
      benefit: 'Foster digital self-reliance, nurture local software talent, and position India as a global leader in autonomous AI and digital product development.'
    }
  ];

  return (
    <section id="about" className="py-20 bg-brand-dark relative overflow-hidden text-white">
      {/* Background Lights & Glows */}
      <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-brand-teal/5 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-brand-coral/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-24">
        
        {/* 1. Header Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ABOUT S-CODERS • BHARATH TECH DEVELOPERS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-white leading-tight">
            A Company Built Around <span className="text-brand-teal">Practical Innovation</span> & Community Growth
          </h1>
          <p className="text-gray-300 font-sans font-light text-base sm:text-lg leading-relaxed">
            S-CODERS was founded in Bengaluru with a clear conviction: the best way to master software engineering and artificial intelligence is by <strong>building real things</strong>.
          </p>
        </div>

        {/* 2. Our Story / Company Journey */}
        <div className="bg-brand-card/60 border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono text-brand-teal uppercase tracking-widest font-bold block mb-2">GENESIS & EVOLUTION</span>
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-white mb-4">Our Journey</h2>
            <p className="text-gray-300 font-sans font-light text-sm sm:text-base leading-relaxed">
              Founded in Bengaluru, India, S-CODERS (Bharath Tech Developers) began as a dedicated group of software engineers and student innovators who wanted to explore coding and AI beyond traditional textbooks. Through consistent project building, collaboration, and real-world client deliverables, our team cultivated a strong culture of technical rigor and rapid execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {storyMilestones.map((m, idx) => (
              <motion.div 
                key={idx} 
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-black/40 border border-white/5 hover:border-brand-teal/30 p-6 rounded-2xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-mono font-bold text-brand-teal block mb-2">{m.period}</span>
                  <h3 className="font-display font-bold text-base text-white mb-2">{m.title}</h3>
                  <p className="text-gray-400 font-sans text-xs leading-relaxed font-light">{m.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 3. Vision & Mission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-brand-card/70 border border-brand-teal/30 p-8 sm:p-10 rounded-3xl relative overflow-hidden shadow-xl"
          >
            <div className="p-3 bg-brand-teal/10 rounded-2xl border border-brand-teal/20 w-fit mb-6">
              <Eye className="w-8 h-8 text-brand-teal" />
            </div>
            <h2 className="font-display font-extrabold text-2xl text-white mb-3">Our Vision</h2>
            <p className="text-gray-300 font-sans font-light text-sm sm:text-base leading-relaxed">
              To build a vibrant, hands-on technology ecosystem across India where aspiring developers, founders, and enterprises can experiment, innovate, and deploy world-class digital products with confidence and speed.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-brand-card/70 border border-brand-coral/30 p-8 sm:p-10 rounded-3xl relative overflow-hidden shadow-xl"
          >
            <div className="p-3 bg-brand-coral/10 rounded-2xl border border-brand-coral/20 w-fit mb-6">
              <Target className="w-8 h-8 text-brand-coral" />
            </div>
            <h2 className="font-display font-extrabold text-2xl text-white mb-3">Our Mission</h2>
            <p className="text-gray-300 font-sans font-light text-sm sm:text-base leading-relaxed">
              To create accessible, high-impact opportunities for practical software and AI learning through direct development services, hands-on masterclasses, hackathons, and transparent community collaboration.
            </p>
          </motion.div>
        </div>

        {/* 4. What We Do (Services & Offerings) */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-mono text-brand-teal uppercase tracking-widest font-bold block mb-2">OUR CORE CAPABILITIES</span>
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-white">What We Do</h2>
            <p className="text-gray-400 text-xs sm:text-sm font-sans font-light mt-2">
              From enterprise AI agent workflows to practical developer bootcamps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whatWeDoList.map((item, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-brand-card/40 border border-white/10 hover:border-brand-teal/40 p-6 rounded-2xl transition-all duration-300"
              >
                <div className="mb-4">{item.icon}</div>
                <h3 className="font-display font-bold text-lg text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 font-sans text-xs font-light leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 5. Contribution to Country & Society */}
        <div className="bg-gradient-to-br from-brand-card via-black/80 to-brand-card border border-brand-teal/30 p-8 sm:p-12 rounded-3xl space-y-8 shadow-2xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-3">
              <Globe className="w-3.5 h-3.5" />
              <span>NATION BUILDING & COMMUNITY IMPACT</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-white mb-4">
              Our Contribution to India & Society
            </h2>
            <p className="text-gray-300 font-sans font-light text-sm sm:text-base leading-relaxed">
              We believe that engineering capability should not be confined to elite tech hubs. S-CODERS actively contributes to India's technological ecosystem by:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black/50 p-6 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-brand-teal font-mono font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Democratizing AI Education</span>
              </div>
              <p className="text-gray-400 text-xs font-light leading-relaxed">
                Hosting affordable and free developer workshops across tier-1 and tier-2 Indian cities, making advanced AI agent workflows accessible to students regardless of background.
              </p>
            </div>

            <div className="bg-black/50 p-6 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-brand-teal font-mono font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Nurturing Indian Startup Talent</span>
              </div>
              <p className="text-gray-400 text-xs font-light leading-relaxed">
                Providing mentorship, technical architecture guidance, and incubation connections through partnerships with NASSCOM and regional founder networks.
              </p>
            </div>

            <div className="bg-black/50 p-6 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-brand-teal font-mono font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Driving Digital Sovereignty</span>
              </div>
              <p className="text-gray-400 text-xs font-light leading-relaxed">
                Empowering Indian MSMEs and businesses with locally built, secure automation solutions, reducing dependency on expensive foreign SaaS vendors.
              </p>
            </div>
          </div>
        </div>

        {/* 6. "What Is The Use Of All This Stuff?" (Practical Value) */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-mono text-brand-teal uppercase tracking-widest font-bold block mb-2">THE REAL-WORLD IMPACT</span>
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-white">Why All This Stuff Matters</h2>
            <p className="text-gray-400 text-xs sm:text-sm font-sans font-light mt-2">
              Understanding the tangible outcomes of our software engineering and education ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {practicalValuePillars.map((p, idx) => (
              <div 
                key={idx}
                className="bg-brand-card/50 border border-white/10 p-6 sm:p-8 rounded-2xl space-y-3"
              >
                <span className="text-[10px] font-mono font-bold text-brand-teal uppercase tracking-widest px-2.5 py-1 bg-brand-teal/10 rounded-md inline-block">
                  Pillar 0{idx + 1}
                </span>
                <h3 className="font-display font-bold text-lg text-white">{p.target}</h3>
                <p className="text-gray-300 font-sans text-xs font-light leading-relaxed">{p.benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Core Principles */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-mono text-brand-teal uppercase tracking-widest font-bold block mb-2">OUR CULTURE</span>
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-white">Core Principles</h2>
            <p className="text-gray-400 text-xs sm:text-sm font-sans font-light mt-2">
              The fundamental values that guide every line of code we write and every event we host.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {corePrinciples.map((cp, idx) => (
              <div 
                key={idx}
                className="bg-brand-card/40 border border-white/10 hover:border-brand-teal/30 p-6 rounded-2xl transition-all duration-300 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-brand-teal">{cp.num}</span>
                  {cp.icon}
                </div>
                <h3 className="font-display font-bold text-lg text-white">{cp.title}</h3>
                <p className="text-gray-400 font-sans text-xs font-light leading-relaxed">{cp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 8. Call To Action (Join Us / Get in Touch) */}
        <div className="bg-brand-card border border-brand-teal/40 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono font-bold uppercase tracking-widest">
            <Rocket className="w-4 h-4" />
            <span>JOIN THE S-CODERS ECOSYSTEM</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-display font-black text-white">
            Ready to Build or Learn With Us?
          </h2>

          <p className="text-gray-300 text-sm font-sans font-light max-w-2xl mx-auto leading-relaxed">
            Whether you need enterprise AI software, want to master modern agent engineering, or wish to attend our upcoming hackathons in Bengaluru, we're always looking for curious, driven minds.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {onNavigate && (
              <>
                <button
                  onClick={() => onNavigate('crew')}
                  className="px-6 py-3 bg-brand-card hover:bg-white/10 text-brand-teal border border-brand-teal/30 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Meet The Crew</span>
                </button>
                <button
                  onClick={() => onNavigate('contact')}
                  className="px-6 py-3 bg-brand-teal hover:bg-white text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-brand-teal/20"
                >
                  <Mail className="w-4 h-4" />
                  <span>Get In Touch</span>
                </button>
                <button
                  onClick={() => onNavigate('workshops')}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-white/10"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Explore Workshops</span>
                </button>
                <button
                  onClick={() => onNavigate('events')}
                  className="px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Rocket className="w-4 h-4" />
                  <span>View Upcoming Events</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}

