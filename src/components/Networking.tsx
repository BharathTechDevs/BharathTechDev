import React, { useState, useEffect } from 'react';
import { 
  Camera, Calendar, MapPin, Users, Sparkles, Check, Trophy, 
  Plus, Award, ShieldCheck, Image as ImageIcon, Upload, Filter, ArrowRight, Eye, ChevronLeft, ChevronRight, X, Trash2
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { getDynamicNetworking, saveDynamicNetworking } from '../utils/dynamicData';
import { NetworkingAchievement } from '../types';

export default function Networking() {
  const [moments, setMoments] = useState<NetworkingAchievement[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'attended' | 'conducted' | 'featured'>('all');
  
  // Quick Upload Panel state - supports up to 8 photos
  const [showQuickUpload, setShowQuickUpload] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('Today, July 2026');
  const [newType, setNewType] = useState<'attended' | 'conducted'>('conducted');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAttendeesCount, setNewAttendeesCount] = useState<number>(45);
  const [selectedPresetImage, setSelectedPresetImage] = useState<string>('preset-1');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [newTags, setNewTags] = useState('');
  const [successToast, setSuccessToast] = useState(false);
  
  // Card active photo index map: { [momentId: string]: number }
  const [activePhotoIndices, setActivePhotoIndices] = useState<Record<string, number>>({});
  
  // Fullscreen Lightbox Modal state
  const [lightboxData, setLightboxData] = useState<{
    images: string[];
    currentIndex: number;
    title: string;
    description: string;
  } | null>(null);

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('scoders_admin_auth') === 'true';
    }
    return false;
  });

  // Quick preset camera snapshots for easy testing
  const PRESET_SNAPSHOTS = [
    {
      id: 'preset-1',
      name: 'Live Pitching Panel',
      url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800&h=500',
    },
    {
      id: 'preset-2',
      name: 'Developer Sandbox Group',
      url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800&h=500',
    },
    {
      id: 'preset-3',
      name: 'Suhas Keynote Presentation',
      url: 'https://images.unsplash.com/photo-1492538368577-8b5fd600d805?auto=format&fit=crop&q=80&w=800&h=500',
    },
    {
      id: 'preset-4',
      name: 'Live Panel Candid Q&A',
      url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800&h=500',
    }
  ];

  useEffect(() => {
    setMoments(getDynamicNetworking());

    const handleDbUpdate = () => {
      setMoments(getDynamicNetworking());
      setIsAdmin(localStorage.getItem('scoders_admin_auth') === 'true');
    };

    window.addEventListener('scoders_db_change', handleDbUpdate);
    window.addEventListener('scoders_auth_change', handleDbUpdate);
    window.addEventListener('storage', handleDbUpdate);

    return () => {
      window.removeEventListener('scoders_db_change', handleDbUpdate);
      window.removeEventListener('scoders_auth_change', handleDbUpdate);
      window.removeEventListener('storage', handleDbUpdate);
    };
  }, []);

  const handleMultipleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 8 - uploadedPhotos.length;
    if (remainingSlots <= 0) {
      alert('Maximum of 8 photos allowed per moment. Please remove an existing photo first.');
      return;
    }

    const totalToProcess = Math.min(files.length, remainingSlots);
    for (let i = 0; i < totalToProcess; i++) {
      const file = files[i];
      if (!file) continue;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedPhotos(prev => {
            if (prev.length < 8) {
              return [...prev, event.target!.result as string];
            }
            return prev;
          });
        }
      };
      reader.readAsDataURL(file);
    }

    e.target.value = '';
  };

  const handleAddCustomUrlPhoto = () => {
    if (!customImageUrl.trim()) return;
    if (uploadedPhotos.length >= 8) {
      alert('Maximum of 8 photos allowed.');
      return;
    }
    setUploadedPhotos(prev => [...prev, customImageUrl.trim()]);
    setCustomImageUrl('');
  };

  const handleAddPresetPhoto = (url: string) => {
    if (uploadedPhotos.length >= 8) {
      alert('Maximum of 8 photos allowed.');
      return;
    }
    setUploadedPhotos(prev => [...prev, url]);
  };

  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddMoment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newLocation || !newDescription) return;

    let finalPhotos = [...uploadedPhotos];
    if (finalPhotos.length === 0) {
      if (customImageUrl.trim()) {
        finalPhotos.push(customImageUrl.trim());
      } else {
        const preset = PRESET_SNAPSHOTS.find(p => p.id === selectedPresetImage);
        finalPhotos.push(preset ? preset.url : PRESET_SNAPSHOTS[0].url);
      }
    }

    // Limit to max 8 photos
    finalPhotos = finalPhotos.slice(0, 8);

    const newMoment: NetworkingAchievement = {
      id: 'net-' + Date.now().toString(),
      title: newTitle,
      eventDate: newEventDate,
      type: newType,
      location: newLocation,
      description: newDescription,
      image: finalPhotos[0],
      images: finalPhotos,
      attendeesCount: Number(newAttendeesCount) || undefined,
      tags: newTags ? newTags.split(',').map(t => t.trim()).filter(Boolean) : ['Startup Circle', 'Live Sync'],
      featured: true
    };

    const updated = [newMoment, ...moments];
    setMoments(updated);
    saveDynamicNetworking(updated);

    // Reset Form & Show Success feedback
    setNewTitle('');
    setNewLocation('');
    setNewDescription('');
    setNewTags('');
    setCustomImageUrl('');
    setUploadedPhotos([]);
    setShowQuickUpload(false);
    
    setSuccessToast(true);
    setTimeout(() => {
      setSuccessToast(false);
    }, 4000);
  };

  const filteredMoments = moments.filter(m => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'featured') return m.featured;
    return m.type === activeFilter;
  });

  const getMomentPhotos = (m: NetworkingAchievement): string[] => {
    if (m.images && m.images.length > 0) return m.images;
    if (m.image) return [m.image];
    return ['https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800&h=500'];
  };

  // Tasteful minimal animation definitions
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="section-container relative min-h-screen py-24" id="networking-section">
      {/* Background radial accent glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-teal/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid of Section Header */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 relative z-10"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 border-b border-white/5 pb-10">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-teal/10 border border-brand-teal/20 rounded-full text-brand-teal text-xs font-mono uppercase tracking-widest">
              <Camera className="w-3.5 h-3.5 animate-pulse" />
              Live Credibility Engine
            </div>
            <h2 className="font-display font-black text-white text-4xl sm:text-5xl leading-tight tracking-tight">
              Networking & <span className="text-brand-teal drop-shadow-[0_0_20px_rgba(34,211,238,0.4)] font-black">Achievements</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base font-sans font-light leading-relaxed">
              We attend, speak, and host developer chapters across Bangalore's premier technology accelerators. Here is our unaltered, real-time photographic ledger building transparent client trust.
            </p>
          </div>

          {isAdmin ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowQuickUpload(!showQuickUpload)}
                className="px-5 py-3 bg-brand-teal text-brand-dark hover:bg-white rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg shadow-brand-teal/10 hover:shadow-white/10 active:scale-98"
              >
                <Plus className={`w-4 h-4 transition-transform duration-300 ${showQuickUpload ? 'rotate-45 text-brand-coral' : ''}`} />
                Upload Live Event Photo
              </button>
            </div>
          ) : (
            <div className="px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-2 text-[11px] font-mono text-gray-500 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" />
              Verified Admin Ledger
            </div>
          )}
        </div>

        {/* Quick Upload Panel Drawer */}
        <AnimatePresence>
          {showQuickUpload && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden mb-12"
            >
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-teal/25 bg-brand-card/90 mt-6 relative">
                <div className="absolute top-4 right-4">
                  <button 
                    onClick={() => setShowQuickUpload(false)}
                    className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-brand-teal font-mono text-[11px] font-bold tracking-widest uppercase mb-4">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  SIMULATE CAMERA PICTURE UPLOADER
                </div>
                <h3 className="font-display font-bold text-white text-xl mb-2">Showcase Your Real Traction Instantly</h3>
                <p className="text-gray-400 text-xs font-light mb-6 max-w-2xl leading-relaxed">
                  Did you just attend a community event or conduct an engineering session? Simulate taking a snapshot or keying in a custom image URL. Once uploaded, it updates live in the photostream below.
                </p>

                <form onSubmit={handleAddMoment} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column Fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5 pl-1">Event Name / Title</label>
                        <input
                          type="text"
                          required
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="e.g. Google Cloud AI Accelerator Pitch"
                          className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-teal transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5 pl-1">Event Type</label>
                          <select
                            value={newType}
                            onChange={(e) => setNewType(e.target.value as 'attended' | 'conducted')}
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-brand-teal transition-colors cursor-pointer"
                          >
                            <option value="conducted">Conducted by us</option>
                            <option value="attended">Attended by us</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5 pl-1">Date</label>
                          <input
                            type="text"
                            required
                            value={newEventDate}
                            onChange={(e) => setNewEventDate(e.target.value)}
                            placeholder="e.g. July 12, 2026"
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5 pl-1">Physical Location</label>
                          <input
                            type="text"
                            required
                            value={newLocation}
                            onChange={(e) => setNewLocation(e.target.value)}
                            placeholder="e.g. WeWork Galaxy, MG Road"
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5 pl-1">Attendees Count (Est.)</label>
                          <input
                            type="number"
                            value={newAttendeesCount}
                            onChange={(e) => setNewAttendeesCount(Number(e.target.value))}
                            placeholder="e.g. 150"
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5 pl-1">Snapshot Summary Description</label>
                        <textarea
                          required
                          rows={3}
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          placeholder="Provide context. What did Suhas and the crew demonstrate? Who did we collaborate with to drive client trust?"
                          className="w-full bg-brand-dark/50 border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-brand-teal transition-colors resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Right Column Multi-Photo Upload Options (Up to 8 pictures) */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider pl-1">
                            Upload Photos (Up to 8 pictures)
                          </label>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            uploadedPhotos.length >= 8 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                              : 'bg-brand-teal/20 text-brand-teal border border-brand-teal/30'
                          }`}>
                            {uploadedPhotos.length} / 8 photos selected
                          </span>
                        </div>

                        {/* Selected Photos Gallery Grid */}
                        {uploadedPhotos.length > 0 && (
                          <div className="grid grid-cols-4 gap-2 mb-3 p-2 bg-brand-dark/60 rounded-xl border border-white/10 max-h-40 overflow-y-auto">
                            {uploadedPhotos.map((photoUrl, idx) => (
                              <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-brand-teal/40 group bg-black/40">
                                <img src={photoUrl} alt={`Uploaded ${idx + 1}`} className="w-full h-full object-cover" />
                                <span className="absolute bottom-1 left-1 bg-black/80 text-[8px] font-mono text-white px-1 rounded">
                                  #{idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(idx)}
                                  className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-md transition-all shadow-md"
                                  title="Remove photo"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Upload Controls */}
                        <div className="space-y-3">
                          {/* File Uploader with Multiple Support */}
                          {uploadedPhotos.length < 8 && (
                            <label className="block cursor-pointer">
                              <div className="flex flex-col items-center justify-center border-2 border-dashed border-brand-teal/30 hover:border-brand-teal bg-brand-dark/40 rounded-xl py-3 px-4 text-center transition-all">
                                <Upload className="w-4 h-4 text-brand-teal mb-1" />
                                <span className="text-[10px] font-mono text-gray-200 font-bold uppercase">
                                  Choose files or drag & drop (up to {8 - uploadedPhotos.length} more)
                                </span>
                                <span className="text-[8px] text-gray-400 font-mono mt-0.5">PNG, JPG, WebP supported</span>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleMultipleFilesUpload}
                              />
                            </label>
                          )}

                          {/* Add Custom URL */}
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              value={customImageUrl}
                              onChange={(e) => setCustomImageUrl(e.target.value)}
                              placeholder="Or paste external image URL..."
                              className="flex-1 bg-brand-dark/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-teal transition-colors"
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomUrlPhoto}
                              disabled={!customImageUrl.trim() || uploadedPhotos.length >= 8}
                              className="px-3 py-2 bg-white/10 hover:bg-brand-teal hover:text-brand-dark text-white font-mono text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                            >
                              Add URL
                            </button>
                          </div>

                          {/* Add Presets */}
                          <div>
                            <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1.5 pl-1">
                              Quick Snapshot Presets (Click to add)
                            </span>
                            <div className="grid grid-cols-4 gap-2">
                              {PRESET_SNAPSHOTS.map((snap) => (
                                <button
                                  key={snap.id}
                                  type="button"
                                  onClick={() => handleAddPresetPhoto(snap.url)}
                                  disabled={uploadedPhotos.length >= 8}
                                  className="relative aspect-video rounded-lg overflow-hidden border border-white/10 hover:border-brand-teal transition-all disabled:opacity-40"
                                >
                                  <img src={snap.url} alt={snap.name} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-brand-dark/50 flex items-center justify-center p-1 text-center">
                                    <span className="text-[8px] font-mono text-white leading-tight">{snap.name}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5 pl-1">Keywords / Tags (Comma Separated)</label>
                        <input
                          type="text"
                          value={newTags}
                          onChange={(e) => setNewTags(e.target.value)}
                          placeholder="e.g. AI Meetup, Microsoft Reactor, Live Demo"
                          className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-teal transition-colors"
                        />
                      </div>

                      <div className="pt-4 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowQuickUpload(false)}
                          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-mono text-gray-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-brand-teal text-brand-dark hover:bg-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-brand-teal/20"
                        >
                          <Camera className="w-4 h-4" />
                          Publish to Photostream ({uploadedPhotos.length || 1} photo{uploadedPhotos.length !== 1 ? 's' : ''})
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Success Feedback Toast */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-brand-teal/10 border border-brand-teal/30 rounded-2xl p-4 text-center max-w-2xl mx-auto mb-10 relative overflow-hidden backdrop-blur-md"
            >
              <div className="absolute inset-y-0 left-0 w-1 bg-brand-teal" />
              <div className="flex items-center gap-3 justify-center text-brand-teal font-sans">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span className="text-sm font-semibold text-white">Event Snapshot Registered Live! Added to Client Credibility Photostream.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visual Filter Categories Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div className="flex flex-wrap items-center gap-1.5 bg-brand-card/60 border border-white/5 p-1.5 rounded-2xl backdrop-blur-md">
            {(['all', 'attended', 'conducted', 'featured'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-brand-teal text-brand-dark font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {filter === 'all' ? 'All Moments' : filter === 'attended' ? 'Attended Events' : filter === 'conducted' ? 'Conducted Masterclasses' : '⭐ Highly Featured'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-gray-500">
            <Filter className="w-3.5 h-3.5 text-brand-teal" />
            <span>Showing {filteredMoments.length} unfiltered records</span>
          </div>
        </div>

        {/* Live Photostream Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <AnimatePresence mode="popLayout">
            {filteredMoments.map((moment) => {
              const photos = getMomentPhotos(moment);
              const activeIndex = activePhotoIndices[moment.id] || 0;
              const currentPhotoUrl = photos[activeIndex] || photos[0];

              const handlePrevPhoto = (e: React.MouseEvent) => {
                e.stopPropagation();
                setActivePhotoIndices(prev => ({
                  ...prev,
                  [moment.id]: (activeIndex - 1 + photos.length) % photos.length
                }));
              };

              const handleNextPhoto = (e: React.MouseEvent) => {
                e.stopPropagation();
                setActivePhotoIndices(prev => ({
                  ...prev,
                  [moment.id]: (activeIndex + 1) % photos.length
                }));
              };

              const handleOpenLightbox = () => {
                setLightboxData({
                  images: photos,
                  currentIndex: activeIndex,
                  title: moment.title,
                  description: moment.description
                });
              };

              return (
                <motion.div
                  layout
                  key={moment.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3 }}
                  onClick={handleOpenLightbox}
                  className="glass-panel rounded-3xl border border-white/5 hover:border-brand-teal/30 overflow-hidden group flex flex-col justify-between transition-all duration-300 bg-brand-card/40 cursor-pointer"
                >
                  {/* Photo Header with In-Card Slider Controls */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/50">
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent opacity-90 z-10" />
                    <img 
                      src={currentPhotoUrl} 
                      alt={moment.title} 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out" 
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Floating Badges */}
                    <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 bg-brand-dark/80 backdrop-blur-md border border-white/10 rounded-lg text-[9px] font-mono font-bold tracking-widest uppercase text-brand-teal flex items-center gap-1.5">
                        <Camera className="w-3 h-3" />
                        LIVE CANDID
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold tracking-widest uppercase border ${
                        moment.type === 'conducted'
                          ? 'bg-brand-teal/20 border-brand-teal/30 text-brand-teal'
                          : 'bg-brand-coral/20 border-brand-coral/30 text-brand-coral'
                      }`}>
                        {moment.type === 'conducted' ? 'HOSTED BY US' : 'ATTENDED BY US'}
                      </span>
                    </div>

                    {/* Multi-Photo Counter Pill */}
                    {photos.length > 1 && (
                      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-brand-teal/40 rounded-lg text-[10px] font-mono font-bold text-white shadow-lg">
                        <ImageIcon className="w-3 h-3 text-brand-teal" />
                        <span>{activeIndex + 1} / {photos.length} photos</span>
                      </div>
                    )}

                    {/* In-Card Slider Navigation Arrows */}
                    {photos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handlePrevPhoto}
                          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 hover:bg-brand-teal hover:text-brand-dark text-white rounded-full transition-all border border-white/10 opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg"
                          title="Previous photo"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextPhoto}
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 hover:bg-brand-teal hover:text-brand-dark text-white rounded-full transition-all border border-white/10 opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg"
                          title="Next photo"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Corner Trust Stamp & Expand Button */}
                    <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenLightbox();
                        }}
                        className="p-1.5 bg-brand-dark/90 hover:bg-brand-teal hover:text-brand-dark text-gray-300 rounded-full border border-white/10 transition-all cursor-pointer"
                        title="View Fullscreen Lightbox"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center gap-1 bg-brand-dark/90 border border-brand-teal/30 rounded-full px-2.5 py-1 shadow-lg shadow-black/40">
                        <Check className="w-3 h-3 text-brand-teal" />
                        <span className="text-[9px] font-mono text-gray-300 font-bold tracking-widest uppercase">TRUST VERIFIED</span>
                      </div>
                    </div>
                  </div>

                  {/* Event Metadata and Body */}
                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Location & Date details */}
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-gray-500 font-mono text-[10px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-brand-teal" />
                          <span>{moment.eventDate}</span>
                        </div>
                        <div className="flex items-center gap-1 max-w-[200px] truncate">
                          <MapPin className="w-3.5 h-3.5 text-brand-teal" />
                          <span>{moment.location}</span>
                        </div>
                        {moment.attendeesCount && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-brand-teal" />
                            <span>~{moment.attendeesCount} Present</span>
                          </div>
                        )}
                      </div>

                      <h4 className="font-display font-bold text-white text-xl leading-snug group-hover:text-brand-teal transition-colors">
                        {moment.title}
                      </h4>

                      <p className="text-gray-400 text-xs sm:text-sm font-sans font-light leading-relaxed">
                        {moment.description}
                      </p>
                    </div>

                    {/* Foot tags list */}
                    <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {moment.tags?.map((tag, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-white/5 rounded-lg text-[10px] font-mono text-gray-400">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {photos.length > 1 && (
                        <span className="text-[10px] font-mono text-brand-teal font-semibold flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {photos.length} photos
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Fullscreen Lightbox Modal for All 8 Photos */}
        <AnimatePresence>
          {lightboxData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative max-w-5xl w-full bg-[#0B0F17] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
              >
                {/* Red Circular Close Button (❌) */}
                <button
                  type="button"
                  onClick={() => setLightboxData(null)}
                  className="absolute top-4 right-4 z-30 p-2 bg-red-500/20 hover:bg-red-600 text-white rounded-full border border-red-500/50 cursor-pointer transition-all shadow-lg"
                  title="Close Lightbox"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                {/* Lightbox Main Image Area */}
                <div className="relative aspect-[16/10] sm:aspect-video w-full bg-black/80 flex items-center justify-center overflow-hidden">
                  <img
                    src={lightboxData.images[lightboxData.currentIndex]}
                    alt={lightboxData.title}
                    className="max-h-full max-w-full object-contain"
                  />

                  {/* Previous / Next Lightbox Controls */}
                  {lightboxData.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setLightboxData(prev => prev ? {
                          ...prev,
                          currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
                        } : null)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-brand-teal hover:text-brand-dark text-white rounded-full transition-all border border-white/20 cursor-pointer shadow-xl"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setLightboxData(prev => prev ? {
                          ...prev,
                          currentIndex: (prev.currentIndex + 1) % prev.images.length
                        } : null)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-brand-teal hover:text-brand-dark text-white rounded-full transition-all border border-white/20 cursor-pointer shadow-xl"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Photo Counter Overlay */}
                  <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono text-white flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Photo {lightboxData.currentIndex + 1} of {lightboxData.images.length}</span>
                  </div>
                </div>

                {/* Thumbnails Filmstrip & Description */}
                <div className="p-5 sm:p-6 bg-[#0E1524] border-t border-white/10 space-y-4">
                  {lightboxData.images.length > 1 && (
                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                      {lightboxData.images.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLightboxData(prev => prev ? { ...prev, currentIndex: idx } : null)}
                          className={`relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                            lightboxData.currentIndex === idx
                              ? 'border-brand-teal scale-105 shadow-md shadow-brand-teal/20 ring-2 ring-brand-teal/40'
                              : 'border-white/10 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-display font-bold text-white mb-1">
                      {lightboxData.title}
                    </h3>
                    <p className="text-gray-400 text-xs font-sans leading-relaxed">
                      {lightboxData.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Corporate Trust Credentials Grid */}
        <div className="border-t border-white/5 pt-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-coral/15 border border-brand-coral/20 rounded-full text-brand-coral text-xs font-mono uppercase tracking-widest mb-4">
              <Award className="w-3.5 h-3.5" />
              S-CODERS CREDENTIALS BOARD
            </div>
            <h3 className="font-display font-bold text-white text-2xl sm:text-3xl">Certificates & Milestones</h3>
            <p className="text-gray-400 text-sm font-light mt-2 leading-relaxed">
              Our engineering standards are backstopped by industry validation from India's elite developmental associations.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Bento Milestone 1 */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 hover:border-brand-teal/25 transition-all duration-300 bg-brand-card/25 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 bg-brand-teal/10 border border-brand-teal/20 rounded-2xl flex items-center justify-center text-brand-teal">
                  <Trophy className="w-6 h-6" />
                </div>
                <h4 className="font-display font-bold text-white text-lg">Outstanding Tech Community Contribution</h4>
                <p className="text-gray-400 text-xs leading-relaxed font-sans font-light">
                  Awarded to S-CODERS leadership by regional community groups for driving extensive AI agent architectural awareness and multi-agent systems deployment masterclasses across India.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-500">
                <span>GRANTED BY ECHAI HUB</span>
                <span>JUNE 2026</span>
              </div>
            </motion.div>

            {/* Bento Milestone 2 */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 hover:border-brand-teal/25 transition-all duration-300 bg-brand-card/25 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 bg-brand-coral/10 border border-brand-coral/20 rounded-2xl flex items-center justify-center text-brand-coral">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-display font-bold text-white text-lg">Official Microsoft Reactor Venue Host</h4>
                <p className="text-gray-400 text-xs leading-relaxed font-sans font-light">
                  Formally authorized developer coordinates enabling Suhas Gowda to coordinate large-scale developer sprints, code reviews, and production-tier AI-pipeline hackathons in Bengaluru physical hubs.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-500">
                <span>MICROSOFT REACTOR HUB</span>
                <span>MAY 2026</span>
              </div>
            </motion.div>

            {/* Bento Milestone 3 */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 hover:border-brand-teal/25 transition-all duration-300 bg-brand-card/25 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 bg-brand-teal/10 border border-brand-teal/20 rounded-2xl flex items-center justify-center text-brand-teal">
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="font-display font-bold text-white text-lg">Certified Cloud Ingress Architects</h4>
                <p className="text-gray-400 text-xs leading-relaxed font-sans font-light">
                  Verifiable developer stamps certifying our core developers in secure cloud-native deployment patterns, GCP pipeline optimization, and custom container orchestration systems.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-500">
                <span>S-CODERS CREW VERIFIED</span>
                <span>ACTIVE STAMP</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
