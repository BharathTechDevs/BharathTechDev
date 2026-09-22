import React, { useState, useEffect } from 'react';
import { 
  Linkedin, Github, Mail, Users2, ExternalLink, Check, Copy, HeartHandshake,
  Sparkles, CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { getLeaderPhoto } from '../utils/leaderPhotos';

interface LeaderInfo {
  id: 'shreyas' | 'lokesh' | 'bhuvan';
  name: string;
  role: string;
  badge: string;
  badgeColor: string;
  accentBorder: string;
  accentGlow: string;
  photoUrl: string;
  bio: string;
  expertise: string[];
  githubUrl: string;
  githubHandle: string;
  linkedinUrl: string;
  linkedinHandle: string;
  email: string;
}

const CREW_MEMBERS: LeaderInfo[] = [
  {
    id: 'shreyas',
    name: 'Shreyas M.',
    role: 'Founder & CEO',
    badge: 'FOUNDER & CEO',
    badgeColor: 'bg-brand-teal text-brand-dark',
    accentBorder: 'border-brand-teal/30 hover:border-brand-teal/60',
    accentGlow: 'hover:shadow-brand-teal/10',
    photoUrl: '/founder.jpg',
    bio: 'AI Engineer & Full-Stack Developer. Leads startup strategy, autonomous AI agent pipelines, and enterprise application architectures at S-CODERS.',
    expertise: ['AI Engineering', 'Full-Stack Development', 'React Native', 'Automation'],
    githubUrl: 'https://github.com/Shreyas-73',
    githubHandle: 'Shreyas-73',
    linkedinUrl: 'https://www.linkedin.com/in/shreyas-shreyas-97187638b?utm_source=share_via&utm_content=profile&utm_medium=member_android',
    linkedinHandle: 'Shreyas M.',
    email: 'scoders82@gmail.com'
  },
  {
    id: 'lokesh',
    name: 'Lokesh A.',
    role: 'Co-Founder',
    badge: 'CO-FOUNDER',
    badgeColor: 'bg-purple-500 text-white',
    accentBorder: 'border-purple-500/30 hover:border-purple-500/60',
    accentGlow: 'hover:shadow-purple-500/10',
    photoUrl: '/cofounder.jpg',
    bio: 'Vibe Coder & AI-Assisted Developer. Specializes in rapid prototyping, prompt engineering, smart workflow automations, and practical product innovation.',
    expertise: ['Vibe Coding', 'AI Prototyping', 'Prompt Engineering', 'Product Strategy'],
    githubUrl: 'https://github.com/Lokesh132005',
    githubHandle: 'Lokesh132005',
    linkedinUrl: 'https://www.linkedin.com/in/lokesh-a-62b217316?utm_source=share_via&utm_content=profile&utm_medium=android_app',
    linkedinHandle: 'Lokesh A.',
    email: 'scoders82@gmail.com'
  },
  {
    id: 'bhuvan',
    name: 'Bhuvan M.',
    role: 'Tech Lead',
    badge: 'TECH LEAD',
    badgeColor: 'bg-cyan-400 text-brand-dark',
    accentBorder: 'border-cyan-400/30 hover:border-cyan-400/60',
    accentGlow: 'hover:shadow-cyan-400/10',
    photoUrl: '/techlead.jpg',
    bio: 'Full-Stack Web Developer & UI/UX Architect. Solely designed and developed the entire S-CODERS web platform, user interfaces, and interactive systems.',
    expertise: ['Full-Stack Web Dev', 'UI/UX Architecture', 'React / Next.js', 'Digital Platforms'],
    githubUrl: 'https://github.com/Bhuvanm28',
    githubHandle: 'Bhuvanm28',
    linkedinUrl: 'https://www.linkedin.com/in/bhuvan-m-8ba340316?utm_source=share_via&utm_content=profile&utm_medium=android_app',
    linkedinHandle: 'Bhuvan M.',
    email: 'scoders82@gmail.com'
  }
];

export default function Team() {
  const [selectedLeader, setSelectedLeader] = useState<'all' | 'shreyas' | 'lokesh' | 'bhuvan'>('all');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Record<string, string>>({
    shreyas: getLeaderPhoto('shreyas'),
    lokesh: getLeaderPhoto('lokesh'),
    bhuvan: getLeaderPhoto('bhuvan')
  });

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: 'shreyas' | 'lokesh' | 'bhuvan'; photoUrl: string }>;
      if (customEvent.detail?.id) {
        setPhotos(prev => ({ ...prev, [customEvent.detail.id]: customEvent.detail.photoUrl }));
      } else {
        setPhotos({
          shreyas: getLeaderPhoto('shreyas'),
          lokesh: getLeaderPhoto('lokesh'),
          bhuvan: getLeaderPhoto('bhuvan')
        });
      }
    };
    window.addEventListener('scoders_leader_photo_updated', handleUpdate);
    return () => window.removeEventListener('scoders_leader_photo_updated', handleUpdate);
  }, []);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const filteredMembers = selectedLeader === 'all' 
    ? CREW_MEMBERS 
    : CREW_MEMBERS.filter(m => m.id === selectedLeader);

  return (
    <section id="team" className="py-24 bg-brand-dark relative overflow-hidden select-none">
      {/* Background radial highlights */}
      <div className="absolute right-0 top-1/3 w-[350px] h-[350px] ambient-coral-glow rounded-full pointer-events-none opacity-40" />
      <div className="absolute left-0 bottom-1/4 w-[300px] h-[300px] ambient-glow rounded-full pointer-events-none opacity-30" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
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

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setSelectedLeader('all')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                selectedLeader === 'all'
                  ? 'bg-brand-teal text-brand-dark shadow-lg shadow-brand-teal/20'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              All Crew Members (3)
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

        {/* 🌟 UNIFIED CREW MEMBERS SECTION — IDENTICAL FORMAT ACROSS ALL THREE 🌟 */}
        <div className={`grid gap-8 mb-16 ${
          selectedLeader === 'all'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 max-w-xl mx-auto'
        }`}>
          {filteredMembers.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`glass-panel rounded-3xl border ${member.accentBorder} ${member.accentGlow} p-6 sm:p-7 shadow-2xl relative bg-gradient-to-b from-[#12131C] to-[#0A0B10] flex flex-col justify-between transition-all duration-300`}
            >
              <div>
                {/* Photo & Role Badge */}
                <div className="relative mb-6">
                  <div className="w-full aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-lg relative bg-black/40">
                    <img
                      src={photos[member.id] || member.photoUrl}
                      alt={member.name}
                      className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Role Badge */}
                  <div className={`absolute bottom-3 right-3 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider shadow-md ${member.badgeColor}`}>
                    {member.badge}
                  </div>
                </div>

                {/* Name, Role & Company Subtitle */}
                <div className="mb-4">
                  <h3 className="font-display font-extrabold text-2xl text-white tracking-tight">
                    {member.name}
                  </h3>
                  <p className="text-sm font-mono font-semibold text-gray-200 mt-1">
                    {member.role}
                  </p>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">
                    S-CODERS • Bharat Tech Developers
                  </p>
                </div>

                {/* Bio Summary */}
                <p className="text-gray-300 text-xs sm:text-sm font-sans font-light leading-relaxed mb-5">
                  {member.bio}
                </p>

                {/* Key Focus & Expertise Tags */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {member.expertise.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-gray-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* 📋 UNIFIED CONTACT & PROFILE INFORMATION (1. GitHub, 2. LinkedIn, 3. E-mail) */}
              <div className="pt-5 border-t border-white/10 space-y-2.5">
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-1 mb-2">
                  Official Profiles & Contact
                </div>

                {/* 1. GitHub Profile */}
                <a
                  href={member.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 text-xs font-mono text-gray-200 hover:text-white transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                      <Github className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-sans">1. Git hub profile</span>
                      <span className="font-semibold text-white group-hover:text-brand-teal transition-colors">
                        {member.githubHandle}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />
                </a>

                {/* 2. LinkedIn Profile */}
                <a
                  href={member.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0077b5]/10 hover:bg-[#0077b5]/20 border border-[#0077b5]/30 hover:border-[#0077b5]/50 text-xs font-mono text-gray-200 hover:text-white transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#0077b5]/20 border border-[#0077b5]/40 flex items-center justify-center shrink-0">
                      <Linkedin className="w-4 h-4 text-[#38bdf8]" />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-sans">2. Linked.in profile</span>
                      <span className="font-semibold text-[#38bdf8] group-hover:text-white transition-colors">
                        {member.linkedinHandle}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />
                </a>

                {/* 3. E-mail: scoders82@gmail.com */}
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${member.email}`}
                    className="flex-1 flex items-center justify-between p-3 rounded-xl bg-brand-teal/10 hover:bg-brand-teal/20 border border-brand-teal/30 hover:border-brand-teal/50 text-xs font-mono text-gray-200 hover:text-white transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-brand-teal" />
                      </div>
                      <div className="truncate">
                        <span className="text-[10px] text-gray-400 block font-sans">3. E-mail</span>
                        <span className="font-semibold text-brand-teal group-hover:text-white transition-colors truncate block">
                          {member.email}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-white shrink-0 ml-1" />
                  </a>

                  <button
                    onClick={() => handleCopyEmail(member.email)}
                    title="Copy Email"
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white transition-all cursor-pointer shrink-0"
                  >
                    {copiedEmail === member.email ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

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
