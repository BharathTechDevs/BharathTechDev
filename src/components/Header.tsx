import { useState, useEffect, useRef } from 'react';
import { 
  Menu, X, Terminal, ArrowRight, ChevronDown, 
  Cpu, BookOpen, Users, Globe, Receipt, Mail, Camera, Shield,
  LogOut, Key, User, Home, ClipboardCheck, Calendar, Target, Users2, Sparkles, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import { AppUser } from '../types';

interface HeaderProps {
  onOpenAssistant: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
  onOpenPayments?: () => void;
  user: AppUser | null;
  onLogout: () => void;
  hasActiveSessions?: boolean;
}

export default function Header({ 
  onOpenAssistant, 
  currentView, 
  onViewChange, 
  onOpenPayments, 
  user, 
  onLogout,
  hasActiveSessions = false
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  const navRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Mobile accordion state
  const [mobileExpandedGroup, setMobileExpandedGroup] = useState<string | null>('Solutions');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto expand active group on mobile menu open
  useEffect(() => {
    if (mobileMenuOpen) {
      const activeGroup = menuGroups.find(g => g.items.some(i => i.view === currentView));
      if (activeGroup) {
        setMobileExpandedGroup(activeGroup.label);
      }
    }
  }, [mobileMenuOpen, currentView]);

  const menuGroups = [
    {
      label: 'Solutions',
      items: [
        { name: 'Services', desc: 'n8n pipelines, custom AI agents & React products', view: 'services', icon: Cpu },
        { name: 'Workshops', desc: 'Live training masterclasses & interactive coding labs', view: 'workshops', icon: BookOpen }
      ]
    },
    {
      label: 'Company',
      items: [
        { name: 'About Us', desc: 'Our engineering heritage, vision, mission & roadmap', view: 'about', icon: Target },
        { name: 'The Crew', desc: 'Meet our leadership team & engineering brain trust', view: 'crew', icon: Users2 },
        { name: 'Careers & Hiring', desc: 'Join S-CODERS crew, multi-step application & induction agreement', view: 'careers', icon: Briefcase },
        { name: 'Communities', desc: 'Thriving developer chapters & tech networking events', view: 'communities', icon: Globe },
        { name: 'Rules & Policies', desc: 'Terms, privacy, refunds & delivery parameters', view: 'policies', icon: ClipboardCheck }
      ]
    },
    {
      label: 'Engage',
      items: [
        { name: 'Networking & Achievements', desc: 'Live event photostream, certificates & credibility boards', view: 'networking', icon: Camera },
        { name: 'Events', desc: 'Announcements, registrations & tickets for upcoming S-CODERS events', view: 'events', icon: Calendar }
      ]
    },
    {
      label: 'Connect',
      items: [
        { name: 'AI Consultant', desc: 'Launch our real-time smart advisor', action: 'assistant', icon: Terminal },
        { name: 'Get In Touch', desc: 'Consultations & general inquiries', view: 'contact', icon: Mail }
      ]
    }
  ];

  const isGroupActive = (group: any) => {
    return group.items.some((item: any) => item.view && item.view === currentView);
  };

  return (
    <header
      id="app-header"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#011425]/95 backdrop-blur-md border-b border-[#5C7C89]/20 py-3 sm:py-4 shadow-xl'
          : 'bg-gradient-to-b from-[#011425]/80 via-[#011425]/40 to-transparent py-4 sm:py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="group text-left shrink-0">
            <Logo 
              size="sm" 
              showSubtitle={true} 
              lightBg={false}
              horizontal={false}
              className="!items-start !text-left scale-90 sm:scale-100 origin-left"
              onAdminClick={() => { onViewChange('admin'); window.scrollTo(0, 0); }} 
              onClick={() => { onViewChange('home'); window.scrollTo(0, 0); }}
            />
          </div>

          {/* Desktop & Laptop Navigation System (lg+) */}
          <nav ref={navRef} className="hidden lg:flex items-center gap-1 xl:gap-2">
            {/* Home Option */}
            <button
              onClick={() => { onViewChange('home'); window.scrollTo(0, 0); }}
              className={`px-3 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-medium tracking-wide transition-all duration-300 cursor-pointer focus:outline-none ${
                currentView === 'home'
                  ? 'text-white bg-[#1F4959] border border-[#5C7C89]/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#1F4959]/50'
              }`}
            >
              Home
            </button>

            {menuGroups.map((group) => {
              const groupActive = isGroupActive(group);
              const isOpen = activeDropdown === group.label;

              return (
                <div
                  key={group.label}
                  className="relative py-2 px-0.5"
                  onMouseEnter={() => setActiveDropdown(group.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    onClick={() => setActiveDropdown(isOpen ? null : group.label)}
                    className={`flex items-center gap-1 px-3 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-medium tracking-wide transition-all duration-300 cursor-pointer focus:outline-none ${
                      isOpen || groupActive
                        ? 'text-white bg-[#1F4959] border border-[#5C7C89]/40'
                        : 'text-slate-300 hover:text-white hover:bg-[#1F4959]/50'
                    }`}
                  >
                    <span>{group.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-teal' : 'text-slate-400'}`} />
                  </button>

                  {/* High-Fidelity Dropdown Sub-menu */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-80 bg-[#1F4959]/95 border border-[#5C7C89]/40 rounded-2xl p-3 shadow-2xl z-50 backdrop-blur-xl"
                      >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2.5 h-2.5 rotate-45 bg-[#1F4959] border-t border-l border-[#5C7C89]/40" />
                        
                        <div className="space-y-1 relative z-10">
                          {group.items.map((item) => {
                            if ((item as any).requiresSession && !hasActiveSessions) return null;
                            const IconComponent = item.icon;
                            const itemActive = item.view ? currentView === item.view : false;

                            return (
                              <button
                                key={item.name}
                                onClick={() => {
                                  if (item.action === 'assistant') {
                                    onOpenAssistant();
                                  } else if (item.view === 'payments' && onOpenPayments) {
                                    onOpenPayments();
                                  } else if (item.view) {
                                    onViewChange(item.view);
                                  }
                                  setActiveDropdown(null);
                                  window.scrollTo(0, 0);
                                }}
                                className={`w-full text-left p-2.5 rounded-xl transition-all duration-200 flex items-start gap-3 cursor-pointer group/item ${
                                  itemActive
                                    ? 'bg-brand-teal/15 border border-brand-teal/30'
                                    : 'hover:bg-white/5 border border-transparent'
                                }`}
                              >
                                <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                                  itemActive 
                                    ? 'bg-brand-teal/20 text-brand-teal' 
                                    : 'bg-brand-dark text-gray-400 group-hover/item:text-brand-teal group-hover/item:bg-brand-teal/10'
                                }`}>
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div className="space-y-0.5">
                                  <div className={`text-xs font-bold tracking-wide transition-colors ${
                                    itemActive ? 'text-brand-teal' : 'text-white group-hover/item:text-brand-teal'
                                  }`}>
                                    {item.name}
                                  </div>
                                  <p className="text-[10px] text-gray-300 font-sans leading-normal">
                                    {item.desc}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Right Header Controls (Desktop & Tablet) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Careers / Hiring pill */}
            <button
              onClick={() => { onViewChange('careers'); window.scrollTo(0, 0); }}
              className={`hidden md:flex items-center gap-2 px-3 sm:px-3.5 py-2 border rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-sm ${
                currentView === 'careers'
                  ? 'bg-brand-teal text-brand-dark border-brand-teal shadow-brand-teal/20'
                  : 'bg-brand-dark/80 hover:bg-brand-teal/10 border-brand-teal/30 text-gray-200 hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-brand-teal" />
              <span>Careers</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* Quick AI Consultant trigger button visible on all desktop / laptop screens */}
            <button
              onClick={onOpenAssistant}
              className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 bg-brand-teal/10 hover:bg-brand-teal/20 border border-brand-teal/30 rounded-xl text-xs font-mono font-bold text-brand-teal transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden md:inline">AI Consultant</span>
            </button>

            {user ? (
              /* Authenticated User Menu */
              <div ref={userRef} className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 border rounded-full text-xs font-mono font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer focus:outline-none bg-brand-card/80 border-brand-teal/30 hover:border-white text-brand-teal hover:text-white"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse" />
                  <span className="max-w-[80px] sm:max-w-none truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-300 ${userDropdownOpen ? 'rotate-180 text-white' : ''}`} />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-brand-card border border-white/10 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl z-50 text-left"
                    >
                      <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest font-bold">Partner Account</p>
                        <p className="text-xs font-bold text-white truncate mt-0.5">{user.name}</p>
                        <p className="text-[9px] font-mono text-brand-teal truncate mt-0.5">{user.company}</p>
                      </div>

                      <div className="space-y-0.5">
                        <button
                          onClick={() => {
                            onViewChange('portal');
                            window.scrollTo(0, 0);
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer focus:outline-none"
                        >
                          <Shield className="w-3.5 h-3.5 text-brand-teal" />
                          <span>My Workspace Portal</span>
                        </button>

                        <button
                          onClick={() => {
                            onLogout();
                            onViewChange('home');
                            window.scrollTo(0, 0);
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all cursor-pointer border-t border-white/5 mt-1 pt-2 focus:outline-none"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : null}

            {/* Mobile / Tablet Drawer Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
              className="lg:hidden p-2.5 rounded-xl border border-white/10 bg-brand-card/60 hover:bg-white/10 transition-colors cursor-pointer focus:outline-none text-gray-300 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-brand-teal" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Mobile / Tablet Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="lg:hidden bg-[#011425]/98 border-b border-white/10 overflow-hidden shadow-2xl backdrop-blur-2xl"
          >
            <div className="px-4 pt-3 pb-8 space-y-4 max-h-[82vh] overflow-y-auto custom-scrollbar">
              
              {/* Quick Assistant Callout on Mobile */}
              <button
                onClick={() => {
                  onOpenAssistant();
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-[44px] p-3 rounded-2xl bg-gradient-to-r from-brand-teal/20 via-brand-teal/10 to-transparent border border-brand-teal/30 flex items-center justify-between text-brand-teal text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-4 h-4 text-brand-teal animate-pulse" />
                  <span>Consult S-CODERS AI Agent</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Navigation Options */}
              <div className="space-y-2.5">
                {/* Home Link */}
                <button
                  onClick={() => {
                    onViewChange('home');
                    setMobileMenuOpen(false);
                    window.scrollTo(0, 0);
                  }}
                  className={`w-full min-h-[44px] flex items-center justify-between px-4 py-3 border rounded-2xl text-xs font-mono font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer focus:outline-none ${
                    currentView === 'home'
                      ? 'text-brand-teal border-brand-teal/40 bg-brand-teal/10 shadow-sm'
                      : 'text-gray-300 hover:text-white border-white/10 bg-brand-card/30'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-brand-teal" />
                    Home
                  </span>
                </button>

                {menuGroups.map((group) => {
                  const isExpanded = mobileExpandedGroup === group.label;
                  const groupContainsActive = isGroupActive(group);

                  return (
                    <div 
                      key={group.label} 
                      className={`border rounded-2xl overflow-hidden transition-colors ${
                        groupContainsActive 
                          ? 'border-brand-teal/30 bg-brand-card/50' 
                          : 'border-white/10 bg-brand-card/20'
                      }`}
                    >
                      <button
                        onClick={() => setMobileExpandedGroup(isExpanded ? null : group.label)}
                        className="w-full min-h-[44px] flex justify-between items-center px-4 py-3 text-xs font-mono font-bold tracking-wider uppercase text-gray-300 hover:text-white focus:outline-none cursor-pointer"
                      >
                        <span className={groupContainsActive ? 'text-brand-teal font-extrabold' : ''}>
                          {group.label}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-brand-teal' : 'text-gray-400'}`} />
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="px-2 pb-3 space-y-1"
                          >
                            {group.items.map((item) => {
                              if ((item as any).requiresSession && !hasActiveSessions) return null;
                              const IconComponent = item.icon;
                              const itemActive = item.view ? currentView === item.view : false;

                              return (
                                <button
                                  key={item.name}
                                  onClick={() => {
                                    if (item.action === 'assistant') {
                                      onOpenAssistant();
                                    } else if (item.view === 'payments' && onOpenPayments) {
                                      onOpenPayments();
                                    } else if (item.view) {
                                      onViewChange(item.view);
                                    }
                                    setMobileMenuOpen(false);
                                    window.scrollTo(0, 0);
                                  }}
                                  className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer text-left ${
                                    itemActive
                                      ? 'text-brand-teal bg-brand-teal/15 font-bold border border-brand-teal/20'
                                      : 'text-gray-300 hover:text-brand-teal hover:bg-white/5 border border-transparent'
                                  }`}
                                >
                                  <div className={`p-2 rounded-lg shrink-0 ${itemActive ? 'bg-brand-teal/20 text-brand-teal' : 'bg-brand-dark/80 text-gray-400'}`}>
                                    <IconComponent className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="text-xs block font-bold text-white">{item.name}</span>
                                    <span className="text-[10px] text-gray-400 block leading-tight font-sans mt-0.5">{item.desc}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Mobile User Actions */}
              {user && (
                <div className="pt-2 space-y-2">
                  <div className="p-3 bg-brand-card rounded-2xl border border-brand-teal/20 space-y-1">
                    <p className="text-[9px] font-mono text-brand-teal uppercase tracking-widest font-bold">Signed in as</p>
                    <h4 className="text-xs font-bold text-white">{user.name}</h4>
                    <p className="text-[10px] text-gray-400 font-mono">{user.company}</p>
                  </div>
                  <button
                    onClick={() => {
                      onViewChange('portal');
                      setMobileMenuOpen(false);
                      window.scrollTo(0, 0);
                    }}
                    className="w-full min-h-[44px] py-2.5 bg-brand-teal text-[#011425] rounded-xl text-center text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer focus:outline-none"
                  >
                    Client & Team Portal
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full min-h-[44px] py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer focus:outline-none"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

