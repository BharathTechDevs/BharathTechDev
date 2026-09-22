import React, { useState, useEffect, useRef } from 'react';
import { 
  Users2, Upload, RotateCcw, CheckCircle2, AlertCircle, Link2, 
  ExternalLink, Eye, ShieldCheck, Sparkles, Image, Camera, RefreshCw
} from 'lucide-react';
import { 
  getLeaderPhoto, setLeaderPhoto, resetLeaderPhoto, DEFAULT_LEADER_PHOTOS 
} from '../utils/leaderPhotos';

interface LeaderMeta {
  id: 'shreyas' | 'lokesh' | 'bhuvan';
  name: string;
  role: string;
  title: string;
  badge: string;
  badgeColor: string;
  accentBorder: string;
  defaultPath: string;
  description: string;
}

const LEADERS: LeaderMeta[] = [
  {
    id: 'shreyas',
    name: 'Shreyas M.',
    role: 'Founder & CEO',
    title: 'AI Engineer & Enterprise Systems Architect',
    badge: 'FOUNDER & CEO',
    badgeColor: 'bg-brand-teal text-brand-dark',
    accentBorder: 'border-brand-teal/40 hover:border-brand-teal/70',
    defaultPath: '/founder.jpg',
    description: 'Leads company strategy, autonomous AI agent pipelines, and enterprise architectures.'
  },
  {
    id: 'lokesh',
    name: 'Lokesh A.',
    role: 'Co-Founder',
    title: 'Vibe Coder & Product Strategist',
    badge: 'CO-FOUNDER',
    badgeColor: 'bg-purple-500 text-white',
    accentBorder: 'border-purple-500/40 hover:border-purple-500/70',
    defaultPath: '/cofounder.jpg',
    description: 'Directs rapid prototyping, prompt engineering, and smart automation innovations.'
  },
  {
    id: 'bhuvan',
    name: 'Bhuvan M.',
    role: 'Tech Lead',
    title: 'Full-Stack Web Architect & UI/UX Specialist',
    badge: 'TECH LEAD',
    badgeColor: 'bg-cyan-400 text-brand-dark',
    accentBorder: 'border-cyan-400/40 hover:border-cyan-400/70',
    defaultPath: '/techlead.jpg',
    description: 'Sole developer and architect of the S-CODERS web platform, interactive systems, and UI/UX.'
  }
];

export default function CrewPhotosAdmin() {
  const [photos, setPhotos] = useState<Record<'shreyas' | 'lokesh' | 'bhuvan', string>>({
    shreyas: getLeaderPhoto('shreyas'),
    lokesh: getLeaderPhoto('lokesh'),
    bhuvan: getLeaderPhoto('bhuvan')
  });

  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({
    shreyas: '',
    lokesh: '',
    bhuvan: ''
  });

  const [feedback, setFeedback] = useState<{ id: string; message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRefs = {
    shreyas: useRef<HTMLInputElement>(null),
    lokesh: useRef<HTMLInputElement>(null),
    bhuvan: useRef<HTMLInputElement>(null)
  };

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

  const showNotification = (id: string, message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ id, message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleFileUpload = (id: 'shreyas' | 'lokesh' | 'bhuvan', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification(id, 'Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLeaderPhoto(id, result);
        setPhotos(prev => ({ ...prev, [id]: result }));
        showNotification(id, `Successfully updated ${id.toUpperCase()}'s photo with real file!`);
      }
    };
    reader.onerror = () => {
      showNotification(id, 'Failed to read image file. Please try again.', 'error');
    };
    reader.readAsDataURL(file);

    // Reset the input value so the same file can be re-selected if desired
    if (e.target) e.target.value = '';
  };

  const handleApplyUrl = (id: 'shreyas' | 'lokesh' | 'bhuvan') => {
    const url = (urlInputs[id] || '').trim();
    if (!url) {
      showNotification(id, 'Please enter a valid image URL.', 'error');
      return;
    }
    setLeaderPhoto(id, url);
    setPhotos(prev => ({ ...prev, [id]: url }));
    setUrlInputs(prev => ({ ...prev, [id]: '' }));
    showNotification(id, `Successfully updated ${id.toUpperCase()}'s photo from URL!`);
  };

  const handleResetToDefault = (id: 'shreyas' | 'lokesh' | 'bhuvan') => {
    resetLeaderPhoto(id);
    setPhotos(prev => ({ ...prev, [id]: DEFAULT_LEADER_PHOTOS[id] }));
    showNotification(id, `Reset ${id.toUpperCase()}'s photo to default system asset.`);
  };

  const isCustom = (id: 'shreyas' | 'lokesh' | 'bhuvan') => {
    return photos[id] !== DEFAULT_LEADER_PHOTOS[id];
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Security Status */}
      <div className="bg-gradient-to-r from-brand-card/80 to-[#141522] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ADMIN-ONLY RESTRICTED AREA • EXECUTIVE ACCESS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users2 className="w-7 h-7 text-brand-teal" />
            <span>Crew & Leadership Photos Manager</span>
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm font-sans max-w-2xl leading-relaxed">
            Only authenticated administrators can modify executive photos. Any updates applied here immediately synchronize across the public Crew cards, Services developer spotlight, Workshop host bios, and the Database Engine.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-1.5 shrink-0 text-right">
          <div className="text-[11px] font-mono text-gray-400">Public Client Access</div>
          <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 justify-end">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Upload Controls Hidden from Public</span>
          </div>
          <div className="text-[10px] text-gray-500 font-mono">
            3 Executive Profiles Active
          </div>
        </div>
      </div>

      {/* Global Notification Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs font-mono flex items-center justify-between gap-3 shadow-lg ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button 
            onClick={() => setFeedback(null)} 
            className="text-gray-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3 Leadership Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {LEADERS.map((leader) => {
          const currentPhoto = photos[leader.id];
          const hasCustomPhoto = isCustom(leader.id);

          return (
            <div 
              key={leader.id}
              className={`bg-gradient-to-b from-[#161725] to-[#0D0E17] border ${leader.accentBorder} rounded-3xl p-6 shadow-2xl flex flex-col justify-between transition-all duration-300 space-y-6`}
            >
              <div className="space-y-5">
                {/* Header & Badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${leader.badgeColor}`}>
                    {leader.badge}
                  </span>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
                    hasCustomPhoto 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}>
                    {hasCustomPhoto ? '● Custom Image Active' : '○ Default Asset'}
                  </span>
                </div>

                {/* Profile Photo Preview Box */}
                <div className="relative group/preview rounded-2xl overflow-hidden border border-white/10 shadow-lg aspect-square bg-black/60 flex items-center justify-center">
                  <img
                    src={currentPhoto}
                    alt={leader.name}
                    className="w-full h-full object-cover object-center group-hover/preview:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-[11px] font-mono text-gray-300 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-brand-teal" />
                      Live Website Preview
                    </span>
                  </div>
                </div>

                {/* Leader Bio Info */}
                <div>
                  <h3 className="text-xl font-display font-bold text-white tracking-tight">
                    {leader.name}
                  </h3>
                  <p className="text-xs font-mono font-semibold text-gray-300 mt-0.5">
                    {leader.role}
                  </p>
                  <p className="text-[11px] text-gray-400 font-sans mt-1 line-clamp-2 leading-relaxed">
                    {leader.description}
                  </p>
                </div>

                {/* Current Source Info */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Active Image Source</span>
                    <span>{hasCustomPhoto ? 'Custom Storage' : 'Default Asset'}</span>
                  </div>
                  <div className="text-[11px] font-mono text-gray-200 truncate" title={currentPhoto}>
                    {currentPhoto.startsWith('data:') 
                      ? `[Uploaded Binary File • ${(currentPhoto.length / 1024).toFixed(0)} KB]` 
                      : currentPhoto}
                  </div>
                </div>

                {/* Action 1: Upload Real Photo File */}
                <div className="space-y-2">
                  <input
                    ref={fileInputRefs[leader.id]}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(leader.id, e)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs[leader.id].current?.click()}
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-teal text-brand-dark font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-brand-teal/90 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload New Photo (File)</span>
                  </button>
                </div>

                {/* Action 2: Paste Image URL */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                    Or Enter Image URL:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://... or /image.jpg"
                      value={urlInputs[leader.id] || ''}
                      onChange={(e) => setUrlInputs(prev => ({ ...prev, [leader.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyUrl(leader.id);
                        }
                      }}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-brand-teal/60"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyUrl(leader.id)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* Action 3: Reset to Default Asset */}
              <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-500">
                  Default: {leader.defaultPath}
                </span>
                {hasCustomPhoto && (
                  <button
                    type="button"
                    onClick={() => handleResetToDefault(leader.id)}
                    className="text-[11px] font-mono text-brand-coral hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Default</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Information Footnote */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-gray-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-teal shrink-0" />
          <span>Photos updated via this panel persist in browser storage and apply across all leadership references.</span>
        </div>
        <div className="text-[11px] text-gray-500">
          S-CODERS Executive Admin Suite • Access Restricted
        </div>
      </div>
    </div>
  );
}
