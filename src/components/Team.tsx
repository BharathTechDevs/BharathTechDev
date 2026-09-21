import React, { useState } from 'react';
import { 
  Linkedin, Github, Users2, Sparkles, HeartHandshake, Rocket, Lightbulb, 
  Building2, BrainCircuit, Globe, Smartphone, Cog, ShieldCheck, Laptop, 
  GraduationCap, Quote, Mail, Phone, Code2, Bot, Wrench, Palette, Cpu, CheckCircle2,
  MessageCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { TEAM_MEMBERS } from '../data';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function Team() {
  const [selectedLeader, setSelectedLeader] = useState<'all' | 'shreyas' | 'lokesh' | 'bhuvan'>('all');

  return (
    <section id="team" className="py-24 bg-brand-dark relative overflow-hidden select-none">
      {/* Background radial highlights */}
      <div className="absolute right-0 top-1/3 w-[350px] h-[350px] ambient-coral-glow rounded-full pointer-events-none opacity-50" />
      <div className="absolute left-0 bottom-1/4 w-[300px] h-[300px] ambient-glow rounded-full pointer-events-none opacity-30" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono mb-4">
            <Users2 className="w-3.5 h-3.5" />
            <span>THE CREW & EXECUTIVE LEADERSHIP</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight mb-4">
            Meet the <span className="text-brand-teal drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">S-CODERS</span> Brain Trust
          </h2>
          <p className="text-gray-400 font-sans font-light text-base sm:text-lg">
            A technology-driven startup built around innovation, experimentation, learning, and real-world problem solving — Bharat Tech Developers.
          </p>

          {/* Executive Filter Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setSelectedLeader('all')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                selectedLeader === 'all'
                  ? 'bg-brand-teal text-brand-dark shadow-lg shadow-brand-teal/20'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              All Leadership Spotlight
            </button>
            <button
              onClick={() => setSelectedLeader('shreyas')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                selectedLeader === 'shreyas'
                  ? 'bg-brand-teal text-brand-dark shadow-lg shadow-brand-teal/20'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              Shreyas M. (Founder & CEO)
            </button>
            <button
              onClick={() => setSelectedLeader('lokesh')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                selectedLeader === 'lokesh'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              Lokesh A. (Co-Founder)
            </button>
            <button
              onClick={() => setSelectedLeader('bhuvan')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                selectedLeader === 'bhuvan'
                  ? 'bg-cyan-400 text-brand-dark shadow-lg shadow-cyan-400/20'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              Bhuvan M. (Tech Lead)
            </button>
          </div>
        </motion.div>

        {/* 🌟 EXECUTIVE LEADERSHIP SPOTLIGHT SECTION 🌟 */}
        <div className="space-y-12 mb-16">
          
          {/* 1. SHREYAS M. — FOUNDER & CEO */}
          {(selectedLeader === 'all' || selectedLeader === 'shreyas') && (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="glass-panel rounded-3xl border border-brand-teal/30 hover:border-brand-teal/50 overflow-hidden p-6 sm:p-10 shadow-2xl relative bg-gradient-to-b from-[#12131C] to-[#0A0B10]"
            >
              <div className="absolute top-0 right-0 w-80 h-80 ambient-glow opacity-30 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
                {/* Avatar & Quick Badges */}
                <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
                  <div className="relative group">
                    <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl overflow-hidden border-2 border-brand-teal/60 shadow-xl shadow-brand-teal/20">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600&h=600"
                        alt="Shreyas M. - Founder & CEO"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute -bottom-3 -right-3 px-3 py-1 bg-brand-teal text-brand-dark rounded-full text-[11px] font-mono font-bold uppercase tracking-wider shadow-lg">
                      FOUNDER & CEO
                    </div>
                  </div>

                  <div className="pt-2">
                    <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                      Shreyas M.
                    </h3>
                    <p className="text-brand-teal font-mono text-xs font-semibold uppercase tracking-wider mt-1">
                      Founder & CEO — S-CODERS
                    </p>
                    <p className="text-gray-400 font-mono text-[11px] mt-0.5">
                      Bharat Tech Developers
                    </p>
                  </div>

                  {/* Profile & Expertise */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl w-full text-left">
                    <span className="text-[10px] font-mono text-gray-400 uppercase block font-semibold mb-1">
                      Profile & Expertise
                    </span>
                    <p className="text-xs text-gray-200 font-sans leading-relaxed">
                      AI Engineer • Full-Stack Developer • App & Web Developer • Digital Creator
                    </p>
                  </div>

                  {/* Contact & Social Links */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <a
                      href="https://github.com/shreyasshreyas40858-max/Chaturya"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-full text-xs font-mono text-gray-300 hover:text-white transition-all shadow-sm cursor-pointer"
                    >
                      <Github className="w-3.5 h-3.5 text-white" />
                      <span>GitHub</span>
                    </a>
                    <a
                      href="https://www.linkedin.com/in/shreyas-shreyas-97187638b?utm_source=share_via&utm_content=profile&utm_medium=member_android"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0077b5]/10 hover:bg-[#0077b5]/20 border border-[#0077b5]/30 hover:border-[#0077b5]/60 rounded-full text-xs font-mono text-[#38bdf8] hover:text-white transition-all shadow-sm cursor-pointer"
                    >
                      <Linkedin className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>LinkedIn</span>
                    </a>
                    <a
                      href="tel:+918310463417"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-brand-teal/20 border border-white/10 hover:border-brand-teal/40 rounded-full text-xs font-mono text-gray-300 hover:text-white transition-all"
                    >
                      <Phone className="w-3.5 h-3.5 text-brand-teal" />
                      <span>+91 8310463417</span>
                    </a>
                    <a
                      href="mailto:scoders82@gmail.com"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-brand-teal/20 border border-white/10 hover:border-brand-teal/40 rounded-full text-xs font-mono text-gray-300 hover:text-white transition-all"
                    >
                      <Mail className="w-3.5 h-3.5 text-brand-teal" />
                      <span>scoders82@gmail.com</span>
                    </a>
                  </div>
                </div>

                {/* Narrative & Vision */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-brand-teal" />
                      <span>Executive Leadership • S-CODERS</span>
                    </div>
                    
                    <p className="text-gray-300 text-sm sm:text-base font-sans font-light leading-relaxed">
                      I’m <strong className="text-white font-medium">Shreyas M.</strong>, the Founder and CEO of <strong className="text-brand-teal font-semibold">S-CODERS</strong>, a technology-driven startup focused on building innovative digital solutions, AI-powered systems, websites, applications, and automation platforms.
                    </p>

                    <p className="text-gray-400 text-sm font-sans font-light leading-relaxed">
                      My journey in technology began with a passion for software development, artificial intelligence, and problem-solving. Through S-CODERS, my goal is to transform ideas into practical, scalable, and user-friendly digital products that can create real-world impact.
                    </p>

                    <p className="text-gray-400 text-sm font-sans font-light leading-relaxed">
                      As an AI Engineer and Full-Stack Developer, I work across modern technologies including <span className="text-gray-200 font-mono text-xs">Python, JavaScript, React Native, Flutter, Django, AI/ML, automation, databases, and AI agent development</span>. I also explore technologies such as <span className="text-gray-200 font-mono text-xs">n8n</span> and modern AI models to create intelligent and automated solutions.
                    </p>
                  </div>

                  {/* Vision Block */}
                  <div className="p-5 rounded-2xl bg-brand-teal/5 border border-brand-teal/20 relative overflow-hidden space-y-3">
                    <div className="flex items-center gap-2 text-brand-teal font-mono text-xs uppercase tracking-wider font-bold">
                      <Rocket className="w-4 h-4" />
                      <span>My Vision</span>
                    </div>
                    <p className="text-gray-200 text-sm font-sans leading-relaxed">
                      "My vision is to build S-CODERS into a trusted technology company from India, delivering high-quality software, AI solutions, digital services, and innovative products for individuals, startups, and businesses."
                    </p>
                    <div className="pt-2 border-t border-brand-teal/15 flex items-center gap-2">
                      <Quote className="w-4 h-4 text-brand-teal/60 shrink-0" />
                      <span className="text-xs font-mono text-brand-teal italic font-semibold">
                        «“Turning ideas into technology, and technology into impact.”»
                      </span>
                    </div>
                  </div>

                  {/* What I Focus On Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white font-mono text-xs uppercase tracking-wider font-bold">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span>What I Focus On</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { icon: BrainCircuit, title: 'Artificial Intelligence & AI Agents', color: 'text-brand-teal' },
                        { icon: Globe, title: 'Full-Stack Web Development', color: 'text-blue-400' },
                        { icon: Smartphone, title: 'Mobile Application Development', color: 'text-emerald-400' },
                        { icon: Cog, title: 'Business & Workflow Automation', color: 'text-amber-400' },
                        { icon: ShieldCheck, title: 'Secure & Scalable Software Systems', color: 'text-purple-400' },
                        { icon: Laptop, title: 'Digital Products & SaaS Solutions', color: 'text-pink-400' },
                        { icon: Rocket, title: 'Startup & Product Development', color: 'text-orange-400' },
                        { icon: GraduationCap, title: 'Technology Workshops & Events', color: 'text-indigo-400' },
                      ].map((item, idx) => {
                        const IconComp = item.icon;
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 p-2.5 bg-white/5 border border-white/5 hover:border-white/20 rounded-xl transition-all"
                          >
                            <div className="p-1.5 rounded-lg bg-black/40 border border-white/10 shrink-0">
                              <IconComp className={`w-3.5 h-3.5 ${item.color}`} />
                            </div>
                            <span className="text-xs font-sans text-gray-200 font-medium">
                              {item.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* About S-CODERS Statement */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                    <div className="flex items-center gap-2 text-gray-300 font-mono text-xs uppercase tracking-wider font-semibold">
                      <Building2 className="w-4 h-4 text-brand-teal" />
                      <span>About S-CODERS (Bharat Tech Developers)</span>
                    </div>
                    <p className="text-gray-400 text-xs font-sans font-light leading-relaxed">
                      S-CODERS is more than a development company — it is a technology-driven startup built around innovation, learning, automation, and digital transformation. Our mission is to help turn ideas into reliable digital products while continuously exploring emerging technologies and creating solutions for the future.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. LOKESH A. — CO-FOUNDER */}
          {(selectedLeader === 'all' || selectedLeader === 'lokesh') && (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="glass-panel rounded-3xl border border-purple-500/30 hover:border-purple-500/50 overflow-hidden p-6 sm:p-10 shadow-2xl relative bg-gradient-to-b from-[#14101E] to-[#0A0B10]"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 opacity-40 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
                {/* Co-Founder Avatar & Badges */}
                <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
                  <div className="relative group">
                    <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl overflow-hidden border-2 border-purple-400/60 shadow-xl shadow-purple-500/20">
                      <img
                        src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600&h=600"
                        alt="Lokesh A. - Co-Founder"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute -bottom-3 -right-3 px-3 py-1 bg-purple-500 text-white rounded-full text-[11px] font-mono font-bold uppercase tracking-wider shadow-lg">
                      CO-FOUNDER
                    </div>
                  </div>

                  <div className="pt-2">
                    <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                      Lokesh A.
                    </h3>
                    <p className="text-purple-400 font-mono text-xs font-semibold uppercase tracking-wider mt-1">
                      Co-Founder — S-CODERS
                    </p>
                    <p className="text-gray-400 font-mono text-[11px] mt-0.5">
                      Bharat Tech Developers
                    </p>
                  </div>

                  {/* Profile & Expertise */}
                  <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-2xl w-full text-left">
                    <span className="text-[10px] font-mono text-purple-300 uppercase block font-semibold mb-1">
                      Core Persona & Subtitle
                    </span>
                    <p className="text-xs text-gray-200 font-sans leading-relaxed font-medium">
                      Vibe Coder • AI-Assisted Developer • Real-World Project Builder • Digital Creator
                    </p>
                  </div>

                  {/* Contact Links */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <a
                      href="mailto:lokesh@scoders.com"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/40 rounded-full text-xs font-mono text-gray-300 hover:text-white transition-all"
                    >
                      <Mail className="w-3.5 h-3.5 text-purple-400" />
                      <span>lokesh@scoders.com</span>
                    </a>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs font-mono text-purple-300">
                      <Bot className="w-3.5 h-3.5 text-purple-400" />
                      <span>Vibe Coder</span>
                    </div>
                  </div>
                </div>

                {/* Narrative & Vision */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Co-Founder Leadership • S-CODERS</span>
                    </div>
                    
                    <p className="text-gray-300 text-sm sm:text-base font-sans font-light leading-relaxed">
                      I’m <strong className="text-white font-medium">Lokesh A.</strong>, the Co-Founder of <strong className="text-purple-400 font-semibold">S-CODERS</strong>, a technology-driven startup focused on turning ideas into practical digital products and real-world technology solutions.
                    </p>

                    <p className="text-gray-400 text-sm font-sans font-light leading-relaxed">
                      My journey in technology is driven by a passion for building, experimenting, and solving real-life problems through technology. I specialize in <span className="text-purple-300 font-medium">vibe coding and AI-assisted development</span>, using modern AI tools and development workflows to rapidly transform concepts into functional websites, applications, automation systems, and digital products.
                    </p>

                    <p className="text-gray-400 text-sm font-sans font-light leading-relaxed">
                      Rather than limiting myself to theoretical concepts, I focus on <strong className="text-gray-200 font-medium">learning by building</strong>. I enjoy taking an idea from the initial concept and turning it into a working project that can solve an actual problem or provide real value.
                    </p>

                    <p className="text-gray-400 text-sm font-sans font-light leading-relaxed">
                      Through S-CODERS, I contribute to product development, project execution, digital experiences, and exploring new ways of using AI to make software development faster, smarter, and more accessible.
                    </p>
                  </div>

                  {/* Vision Block */}
                  <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/30 relative overflow-hidden space-y-3">
                    <div className="flex items-center gap-2 text-purple-300 font-mono text-xs uppercase tracking-wider font-bold">
                      <Rocket className="w-4 h-4 text-purple-400" />
                      <span>🚀 My Vision</span>
                    </div>
                    <p className="text-gray-200 text-sm font-sans leading-relaxed">
                      "My vision is to become a creator who turns ideas into meaningful technology and contributes to building S-CODERS into an innovative technology company from India. I believe the future belongs to people who can combine creativity, AI, technology, and execution to solve real-world problems."
                    </p>
                    <div className="pt-2 border-t border-purple-500/20 flex items-center gap-2">
                      <Quote className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="text-xs font-mono text-purple-300 italic font-semibold">
                        «“Don’t just imagine the idea. Build it, test it, and make it real.”»
                      </span>
                    </div>
                  </div>

                  {/* 💡 What I Focus On Grid (10 Focus Items) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white font-mono text-xs uppercase tracking-wider font-bold">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span>💡 What I Focus On</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { icon: Bot, title: 'AI-Assisted Development & Vibe Coding', color: 'text-purple-400' },
                        { icon: Laptop, title: 'Real-World Project Development', color: 'text-blue-400' },
                        { icon: Globe, title: 'Websites & Digital Products', color: 'text-emerald-400' },
                        { icon: Smartphone, title: 'Application Development', color: 'text-amber-400' },
                        { icon: Cog, title: 'Automation & Smart Workflows', color: 'text-brand-teal' },
                        { icon: Rocket, title: 'Startup & Product Building', color: 'text-orange-400' },
                        { icon: BrainCircuit, title: 'Problem Solving Through Technology', color: 'text-pink-400' },
                        { icon: Wrench, title: 'Rapid Prototyping & Development', color: 'text-indigo-400' },
                        { icon: Cpu, title: 'Exploring Emerging Technologies', color: 'text-cyan-400' },
                        { icon: Palette, title: 'Digital Creativity & Innovation', color: 'text-rose-400' },
                      ].map((item, idx) => {
                        const IconComp = item.icon;
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 p-2.5 bg-white/5 border border-purple-500/10 hover:border-purple-500/30 rounded-xl transition-all"
                          >
                            <div className="p-1.5 rounded-lg bg-black/40 border border-purple-500/20 shrink-0">
                              <IconComp className={`w-3.5 h-3.5 ${item.color}`} />
                            </div>
                            <span className="text-xs font-sans text-gray-200 font-medium">
                              {item.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 🏢 About S-CODERS Statement */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-purple-500/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-purple-300 font-mono text-xs uppercase tracking-wider font-semibold">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      <span>🏢 About S-CODERS (Bharat Tech Developers)</span>
                    </div>
                    <p className="text-gray-300 text-xs font-sans font-light leading-relaxed">
                      S-CODERS is more than a development company — it is a technology-driven startup built around innovation, experimentation, learning, and real-world problem solving. As a Co-Founder, my focus is on turning ideas into working products, experimenting with emerging technologies, and helping create digital solutions that are practical, scalable, and useful. Our goal is to build technology that doesn't simply look impressive, but actually solves problems and creates value.
                    </p>
                    <div className="pt-2 text-right">
                      <span className="text-[11px] font-mono text-purple-300 font-semibold">
                        — Lokesh A. • Co-Founder, S-CODERS • Bharat Tech Developers
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. BHUVAN M. — TECH LEAD */}
          {(selectedLeader === 'all' || selectedLeader === 'bhuvan') && (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="glass-panel rounded-3xl border border-cyan-500/30 hover:border-cyan-400/50 overflow-hidden p-6 sm:p-10 shadow-2xl relative bg-gradient-to-b from-[#0c1624] to-[#0A0B10]"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 opacity-40 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
                {/* Tech Lead Avatar & Badges */}
                <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
                  <div className="relative group">
                    <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl overflow-hidden border-2 border-cyan-400/60 shadow-xl shadow-cyan-500/20">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600&h=600"
                        alt="Bhuvan M. - Tech Lead"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute -bottom-3 -right-3 px-3 py-1 bg-cyan-400 text-brand-dark rounded-full text-[11px] font-mono font-bold uppercase tracking-wider shadow-lg">
                      TECH LEAD
                    </div>
                  </div>

                  <div className="pt-2">
                    <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                      Bhuvan M.
                    </h3>
                    <p className="text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider mt-1">
                      Tech Lead — S-CODERS
                    </p>
                    <p className="text-gray-400 font-mono text-[11px] mt-0.5">
                      Bharat Tech Developers
                    </p>
                  </div>

                  {/* Profile & Expertise */}
                  <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl w-full text-left">
                    <span className="text-[10px] font-mono text-cyan-300 uppercase block font-semibold mb-1">
                      Core Persona & Subtitle
                    </span>
                    <p className="text-xs text-gray-200 font-sans leading-relaxed font-medium">
                      Full-Stack Developer • Web Developer • UI/UX Enthusiast • Digital Product Builder
                    </p>
                  </div>

                  {/* Contact Links */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <a
                      href="tel:+916363905989"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 rounded-full text-xs font-mono text-gray-300 hover:text-white transition-all"
                    >
                      <Phone className="w-3.5 h-3.5 text-cyan-400" />
                      <span>+91 6363905989</span>
                    </a>
                    <a
                      href="https://wa.me/916363905989"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 hover:border-[#25D366]/60 rounded-full text-xs font-mono text-emerald-300 hover:text-white transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href="mailto:scoders82@gmail.com"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 rounded-full text-xs font-mono text-gray-300 hover:text-white transition-all"
                    >
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span>scoders82@gmail.com</span>
                    </a>
                  </div>
                </div>

                {/* Narrative & Vision */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Tech Leadership • S-CODERS</span>
                    </div>
                    
                    <p className="text-gray-300 text-sm sm:text-base font-sans font-light leading-relaxed">
                      I’m <strong className="text-white font-medium">Bhuvan M.</strong>, the Tech Lead at <strong className="text-cyan-400 font-semibold">S-CODERS</strong>, where I focus on turning ideas into modern, functional, and engaging digital experiences.
                    </p>

                    <p className="text-gray-400 text-sm font-sans font-light leading-relaxed">
                      My journey in technology is driven by a passion for web development, creative design, problem-solving, and building digital products from the ground up. I enjoy taking an idea from its initial concept and transforming it into a complete, working digital experience.
                    </p>

                    <p className="text-gray-400 text-sm font-sans font-light leading-relaxed">
                      As the Tech Lead of S-CODERS, I focus on the technical development and implementation of our digital platforms. I work on website architecture, frontend development, interactive interfaces, responsive design, and overall user experience to create products that are both visually appealing and practically useful.
                    </p>

                    <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/25 rounded-xl">
                      <p className="text-cyan-200 text-xs sm:text-sm font-sans leading-relaxed">
                        ✨ One of my key contributions to S-CODERS is the <strong className="text-white font-semibold">complete design and development of the S-CODERS website</strong>, from its initial structure and interface to its responsive design, interactions, and overall digital experience.
                      </p>
                    </div>

                    <p className="text-gray-400 text-sm font-sans font-light leading-relaxed">
                      Beyond S-CODERS, I actively work on personal and development projects that are available through my GitHub portfolio, where I continue to experiment with different technologies and build practical applications. I also maintain a professional presence on LinkedIn, where I share my technology journey, projects, learning experiences, and professional development.
                    </p>

                    <p className="text-gray-400 text-sm font-sans font-light leading-relaxed">
                      Through continuous building and learning, I aim to strengthen my skills while exploring modern technologies, AI-assisted development, creative web experiences, and new approaches to solving real-world problems.
                    </p>
                  </div>

                  {/* Vision Block */}
                  <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 relative overflow-hidden space-y-3">
                    <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs uppercase tracking-wider font-bold">
                      <Rocket className="w-4 h-4 text-cyan-400" />
                      <span>🚀 My Vision</span>
                    </div>
                    <p className="text-gray-200 text-sm font-sans leading-relaxed">
                      "My vision is to contribute to building S-CODERS into a technology company known for creating innovative, reliable, and meaningful digital products. I believe that technology becomes powerful when <strong className="text-white font-medium">creativity, functionality, and user experience come together</strong>. My goal is to build digital experiences that are not only impressive to look at but also useful, intuitive, and capable of solving real-world problems."
                    </p>
                    <div className="pt-2 border-t border-cyan-500/20 flex items-center gap-2">
                      <Quote className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-xs font-mono text-cyan-300 italic font-semibold">
                        «“Build with purpose. Create with creativity. Deliver with impact.”»
                      </span>
                    </div>
                  </div>

                  {/* 💡 What I Focus On Grid (10 Focus Items) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white font-mono text-xs uppercase tracking-wider font-bold">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span>💡 What I Focus On</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { icon: Globe, title: 'Full-Stack Web Development', color: 'text-cyan-400' },
                        { icon: Laptop, title: 'Modern Website Development', color: 'text-blue-400' },
                        { icon: Palette, title: 'UI/UX & Interactive Experiences', color: 'text-pink-400' },
                        { icon: Cpu, title: 'Website Architecture & Implementation', color: 'text-emerald-400' },
                        { icon: Smartphone, title: 'Responsive Web Applications', color: 'text-amber-400' },
                        { icon: Rocket, title: 'Digital Product Development', color: 'text-orange-400' },
                        { icon: Bot, title: 'AI-Assisted Development', color: 'text-purple-400' },
                        { icon: BrainCircuit, title: 'Technology & Problem Solving', color: 'text-rose-400' },
                        { icon: Wrench, title: 'Modern Development Tools & Workflows', color: 'text-indigo-400' },
                        { icon: Sparkles, title: 'Creative Digital Experiences', color: 'text-teal-400' },
                      ].map((item, idx) => {
                        const IconComp = item.icon;
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 p-2.5 bg-white/5 border border-cyan-500/10 hover:border-cyan-500/30 rounded-xl transition-all"
                          >
                            <div className="p-1.5 rounded-lg bg-black/40 border border-cyan-500/20 shrink-0">
                              <IconComp className={`w-3.5 h-3.5 ${item.color}`} />
                            </div>
                            <span className="text-xs font-sans text-gray-200 font-medium">
                              {item.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 🏢 My Role at S-CODERS Statement */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-cyan-500/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs uppercase tracking-wider font-semibold">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      <span>🏢 My Role at S-CODERS</span>
                    </div>
                    <p className="text-gray-300 text-xs font-sans font-light leading-relaxed">
                      As Tech Lead, I focus on converting the team's ideas into technically functional and engaging digital products. My responsibilities include planning, designing, developing, and improving the technical aspects of S-CODERS projects. I work particularly on <strong className="text-white font-medium">web development, user interfaces, digital experiences, and technical implementation</strong>. The <strong className="text-white font-medium">S-CODERS website was completely designed and developed by me</strong>, representing my approach to combining technology, creativity, functionality, and user experience. Alongside my work at S-CODERS, my GitHub projects and professional work reflect my continuous interest in learning, experimenting, and building technology. I aim to help S-CODERS create technology that combines innovation, design, functionality, and real-world value.
                    </p>
                    <div className="pt-2 text-right">
                      <span className="text-[11px] font-mono text-cyan-300 font-semibold">
                        — Bhuvan M. • Tech Lead, S-CODERS • Bharat Tech Developers
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>

        {/* Section Divider */}
        <div className="flex items-center gap-4 my-12">
          <div className="h-px bg-white/10 flex-1" />
          <span className="text-xs font-mono text-gray-400 uppercase tracking-widest px-2">Core Engineering & Design Crew</span>
          <div className="h-px bg-white/10 flex-1" />
        </div>

        {/* Team Grid with Staggered Entrance */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-20"
        >
          {TEAM_MEMBERS.map((member) => (
            <motion.div
              key={member.id}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { duration: 0.25 } }}
              className="glass-panel rounded-3xl border border-white/10 hover:border-brand-teal/40 overflow-hidden flex flex-col sm:flex-row lg:flex-col group transition-all duration-300 shadow-xl hover:shadow-brand-teal/10 relative"
            >
              {/* Profile image column */}
              <div className="sm:w-2/5 lg:w-full relative h-64 sm:h-auto lg:h-64 overflow-hidden">
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r lg:bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent opacity-80" />
              </div>

              {/* Bio & Details Column */}
              <div className="p-6 sm:p-8 sm:w-3/5 lg:w-full flex flex-col justify-between flex-1 relative z-10">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-display font-bold text-xl text-white group-hover:text-brand-teal transition-colors">
                      {member.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {member.linkedin ? (
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
                      ) : null}
                      {member.github ? (
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
                      ) : null}
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
