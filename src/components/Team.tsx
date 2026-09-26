import React, { useState, useEffect } from 'react';
import { 
  Linkedin, Github, Mail, Users2, ExternalLink, Check, Copy, HeartHandshake,
  Sparkles, CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { getLeaderPhoto, fetchLeaderPhotosFromServer, initLeaderPhotosSync, getAllLeaderPhotos } from '../utils/leaderPhotos';
import { DatabaseEngine, TeamMemberRecord } from '../utils/dbEngine';

interface LeaderInfo {
  id: string;
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

const DEFAULT_CREW_MEMBERS: LeaderInfo[] = [
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
    githubUrl: 'https://github.com/Gowda487',
    githubHandle: 'Gowda487',
    linkedinUrl: 'https://www.linkedin.com/in/bhuvan-m-102835326/',
    linkedinHandle: 'Bhuvan M.',
    email: 'scoders82@gmail.com'
  }
];

export default function Team() {
  const [selectedLeader, setSelectedLeader] = useState<string>('all');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Record<string, string>>(() => getAllLeaderPhotos());
  const [crewList, setCrewList] = useState<LeaderInfo[]>(DEFAULT_CREW_MEMBERS);

  const loadTeam = () => {
    setPhotos(getAllLeaderPhotos());

    const dbMembers = DatabaseEngine.getTeamMembers();
    // Merge database custom team members if any
    const list: LeaderInfo[] = DEFAULT_CREW_MEMBERS.map(m => {
      const dbMatch = dbMembers.find(t => 
        (t.id === 'T1' && m.id === 'shreyas') ||
        (t.id === 'T2' && m.id === 'lokesh') ||
        (t.id === 'T3' && m.id === 'bhuvan') ||
        t.name.toLowerCase().includes(m.id)
      );
      if (dbMatch) {
        return {
          ...m,
          name: dbMatch.name || m.name,
          role: dbMatch.role || m.role,
          bio: dbMatch.bio || m.bio,
          expertise: dbMatch.expertise || m.expertise,
          githubUrl: dbMatch.githubUrl || m.githubUrl,
          githubHandle: dbMatch.githubHandle || m.githubHandle,
          linkedinUrl: dbMatch.linkedinUrl || m.linkedinUrl,
          linkedinHandle: dbMatch.linkedinHandle || m.linkedinHandle,
          email: dbMatch.contact || m.email,
        };
      }
      return m;
    });

    // Add any non-founder added team members
    dbMembers.forEach(t => {
      if (!['T1', 'T2', 'T3'].includes(t.id)) {
        list.push({
          id: t.id,
          name: t.name,
          role: t.role,
          badge: t.department.toUpperCase(),
          badgeColor: 'bg-brand-teal/20 text-brand-teal border border-brand-teal/30',
          accentBorder: 'border-brand-teal/30 hover:border-brand-teal/60',
          accentGlow: 'hover:shadow-brand-teal/10',
          photoUrl: t.photoUrl || '/techlead.jpg',
          bio: t.bio || `Specialist in ${t.department} at S-CODERS. Working on active development sprints.`,
          expertise: t.expertise || [t.department, 'Agile Sprint', 'Problem Solving'],
          githubUrl: t.githubUrl || 'https://github.com/scoders-developers',
          githubHandle: t.githubHandle || 'scoders-dev',
          linkedinUrl: t.linkedinUrl || 'https://linkedin.com/company/scoders',
          linkedinHandle: t.linkedinHandle || t.name,
          email: t.contact || 'scoders82@gmail.com'
        });
      }
    });

    setCrewList(list);
  };

  useEffect(() => {
    loadTeam();

    // Asynchronously fetch latest photos from server on mount
    fetchLeaderPhotosFromServer().then((freshPhotos) => {
      if (freshPhotos && Object.keys(freshPhotos).length > 0) {
        setPhotos(prev => ({ ...prev, ...freshPhotos }));
      }
    });
    initLeaderPhotosSync(true);

    const handleUpdate = () => {
      loadTeam();
    };

    window.addEventListener('scoders_leader_photo_updated', handleUpdate);
    window.addEventListener('scoders_team_change', handleUpdate);
    window.addEventListener('scoders_db_change', handleUpdate);
    window.addEventListener('scoders_data_change', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Continuous 3.5s interval to ensure real-time photo sync for all client visitors
    const interval = setInterval(() => {
      fetchLeaderPhotosFromServer().then(fresh => {
        if (fresh) setPhotos(prev => ({ ...prev, ...fresh }));
      });
      loadTeam();
    }, 3500);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scoders_leader_photo_updated', handleUpdate);
      window.removeEventListener('scoders_team_change', handleUpdate);
      window.removeEventListener('scoders_db_change', handleUpdate);
      window.removeEventListener('scoders_data_change', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const filteredMembers = selectedLeader === 'all' 
    ? crewList 
    : crewList.filter(m => m.id === selectedLeader || m.name.toLowerCase().includes(selectedLeader));

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

        {/* 🌟 UNIFIED CREW MEMBERS SECTION — INTERACTIVE HOVER CARDS 🌟 */}
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
              whileHover={{ y: -8, transition: { duration: 0.28, ease: 'easeOut' } }}
              transition={{ duration: 0.5 }}
              className={`group glass-panel rounded-3xl border ${member.accentBorder} ${member.accentGlow} p-6 sm:p-7 shadow-2xl relative bg-gradient-to-b from-[#12131C] to-[#0A0B10] flex flex-col justify-between transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)] hover:border-opacity-100 overflow-hidden`}
            >
              {/* Top ambient dynamic accent highlight on hover */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-teal to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-teal/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10">
                {/* Photo & Interactive Hover Quick-Action Overlay */}
                <div className="relative mb-6 group/photo">
                  <div className="w-full aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-lg relative bg-black/40">
                    <img
                      src={photos[member.id] || (photos as any)[member.id.toLowerCase()] || getLeaderPhoto(member.id as any) || member.photoUrl}
                      alt={member.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src !== member.photoUrl) {
                          target.src = member.photoUrl;
                        }
                      }}
                    />

                    {/* Interactive Hover Floating Social Bar Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4 backdrop-blur-[2px]">
                      <div className="flex justify-end">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 border border-white/20 text-[10px] font-mono text-brand-teal backdrop-blur-md">
                          <Sparkles className="w-3 h-3 text-brand-teal animate-spin" />
                          <span>Verified Executive</span>
                        </span>
                      </div>

                      {/* Quick-Action Social Connect Pill on Hover */}
                      <div className="flex items-center justify-center gap-2.5 py-2 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                        <a
                          href={member.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`View ${member.name}'s GitHub`}
                          className="w-10 h-10 rounded-xl bg-black/80 hover:bg-white border border-white/20 hover:border-white text-white hover:text-black flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                        <a
                          href={member.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Connect on LinkedIn with ${member.name}`}
                          className="w-10 h-10 rounded-xl bg-[#0077b5]/80 hover:bg-[#0077b5] border border-white/20 hover:border-[#38bdf8] text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                        <a
                          href={`mailto:${member.email}`}
                          title={`Email ${member.name}`}
                          className="w-10 h-10 rounded-xl bg-brand-teal/80 hover:bg-brand-teal border border-white/20 hover:border-brand-teal text-brand-dark flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg font-bold"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className={`absolute bottom-3 right-3 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider shadow-md ${member.badgeColor} z-20 group-hover:scale-105 transition-transform duration-300`}>
                    {member.badge}
                  </div>
                </div>

                {/* Name, Role & Company Subtitle */}
                <div className="mb-4">
                  <h3 className="font-display font-extrabold text-2xl text-white tracking-tight group-hover:text-brand-teal transition-colors duration-300 flex items-center justify-between">
                    <span>{member.name}</span>
                    <span className="text-xs font-mono text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      →
                    </span>
                  </h3>
                  <p className="text-sm font-mono font-semibold text-gray-200 mt-1">
                    {member.role}
                  </p>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">
                    S-CODERS • Bharat Tech Developers
                  </p>
                </div>

                {/* Bio Summary with interactive highlight */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] group-hover:bg-white/[0.05] border border-transparent group-hover:border-white/10 transition-all duration-300 mb-5">
                  <p className="text-gray-300 text-xs sm:text-sm font-sans font-light leading-relaxed">
                    {member.bio}
                  </p>
                </div>

                {/* Key Focus & Expertise Tags with Interactive Hover Pop */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {member.expertise.map((skill, idx) => (
                    <motion.span
                      key={idx}
                      whileHover={{ scale: 1.06, y: -2 }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 group-hover:bg-white/10 border border-white/10 group-hover:border-brand-teal/30 text-[11px] font-mono text-gray-300 group-hover:text-white transition-all duration-200 cursor-default"
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* 📋 UNIFIED CONTACT & PROFILE INFORMATION (1. GitHub, 2. LinkedIn, 3. E-mail) */}
              <div className="pt-5 border-t border-white/10 space-y-2.5 relative z-10">
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-1 mb-2 flex items-center justify-between">
                  <span>Official Profiles & Contact</span>
                  <span className="text-brand-teal opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold">
                    Quick Connect ↗
                  </span>
                </div>

                {/* 1. GitHub Profile */}
                <a
                  href={member.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-teal/40 text-xs font-mono text-gray-200 hover:text-white transition-all group/btn cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0 group-hover/btn:border-brand-teal/50 transition-colors">
                      <Github className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-sans">1. GitHub Profile</span>
                      <span className="font-semibold text-white group-hover/btn:text-brand-teal transition-colors">
                        {member.githubHandle}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-brand-teal group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all" />
                </a>

                {/* 2. LinkedIn Profile */}
                <a
                  href={member.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0077b5]/10 hover:bg-[#0077b5]/20 border border-[#0077b5]/30 hover:border-[#0077b5]/60 text-xs font-mono text-gray-200 hover:text-white transition-all group/btn cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#0077b5]/20 border border-[#0077b5]/40 flex items-center justify-center shrink-0 group-hover/btn:scale-105 transition-transform">
                      <Linkedin className="w-4 h-4 text-[#38bdf8]" />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-sans">2. LinkedIn Profile</span>
                      <span className="font-semibold text-[#38bdf8] group-hover/btn:text-white transition-colors">
                        {member.linkedinHandle}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-white group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all" />
                </a>

                {/* 3. E-mail: scoders82@gmail.com */}
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${member.email}`}
                    className="flex-1 flex items-center justify-between p-3 rounded-xl bg-brand-teal/10 hover:bg-brand-teal/20 border border-brand-teal/30 hover:border-brand-teal/60 text-xs font-mono text-gray-200 hover:text-white transition-all group/btn"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center shrink-0 group-hover/btn:scale-105 transition-transform">
                        <Mail className="w-4 h-4 text-brand-teal" />
                      </div>
                      <div className="truncate">
                        <span className="text-[10px] text-gray-400 block font-sans">3. E-mail</span>
                        <span className="font-semibold text-brand-teal group-hover/btn:text-white transition-colors truncate block">
                          {member.email}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-white group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all shrink-0 ml-1" />
                  </a>

                  <button
                    onClick={() => handleCopyEmail(member.email)}
                    title="Copy Email"
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 text-gray-300 hover:text-white transition-all cursor-pointer shrink-0 hover:scale-105 active:scale-95"
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
