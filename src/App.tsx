import { useState, useEffect, lazy, Suspense } from 'react';
import { 
  MessageSquare, MessageCircle, ArrowUp, X, Lock,
  Cpu, Users, BookOpen, Globe, Receipt, PhoneCall, ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import Hero from './components/Hero';
import Logo from './components/Logo';
import { AppUser } from './types';

import About from './components/About';
import Team from './components/Team';
import Services from './components/Services';
import Workshops from './components/Workshops';
import Communities from './components/Communities';
import Payments from './components/Payments';
import Contact from './components/Contact';
import AIAssistant from './components/AIAssistant';
import AdminConsole from './components/AdminConsole';
import Networking from './components/Networking';
import Events from './components/Events';
import AuthPortal from './components/AuthPortal';
import Policies from './components/Policies';

const ViewLoader = () => (
  <div className="flex flex-col items-center justify-center py-24 min-h-[40vh] w-full">
    <div className="relative">
      <div className="w-10 h-10 rounded-full border-2 border-brand-teal/20 border-t-brand-teal animate-spin" />
      <div className="absolute inset-0 bg-brand-teal/10 blur-xl rounded-full" />
    </div>
    <p className="mt-4 text-xs font-mono text-gray-400 uppercase tracking-widest animate-pulse">
      Initializing segment...
    </p>
  </div>
);

const GatedAccessView = ({ 
  title, 
  description, 
  onRedirect, 
  onGoHome 
}: { 
  title: string; 
  description: string; 
  onRedirect: () => void; 
  onGoHome: () => void; 
}) => {
  return (
    <div className="relative py-16 px-4 max-w-xl mx-auto text-center min-h-[50vh] flex flex-col items-center justify-center">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-teal/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Main Locked Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative bg-brand-card/60 border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-md w-full overflow-hidden"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
        
        {/* Pulsing Lock Icon Ring */}
        <div className="relative mx-auto w-16 h-16 bg-brand-teal/10 border border-brand-teal/20 rounded-2xl flex items-center justify-center text-brand-teal mb-6">
          <div className="absolute inset-0 rounded-2xl border border-brand-teal/40 animate-ping opacity-20" />
          <Lock className="w-6 h-6 relative z-10" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono uppercase tracking-wider mb-4 relative z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          Gated Resources Access
        </div>

        {/* Content */}
        <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white mb-3 relative z-10">
          {title}
        </h2>
        <p className="text-gray-400 text-sm font-sans font-light leading-relaxed mb-8 relative z-10">
          {description} This segment is restricted to registered clients of S-CODERS. Log in or create a client workspace account to unlock elite products, estimating tools, and dynamic builders.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
          <button
            onClick={onRedirect}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-teal text-brand-dark font-mono font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-brand-dark transition-all duration-300 shadow-lg shadow-brand-teal/20 cursor-pointer focus:outline-none"
          >
            Access Client Portal
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onGoHome}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all duration-300 font-mono text-xs uppercase cursor-pointer focus:outline-none"
          >
            Return Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface PrefilledPaymentData {
  tab: 'invoice' | 'workshop';
  invoice: {
    client: string;
    contact: string;
    purpose: string;
    amount: number;
    currency: 'INR' | 'USD';
  } | null;
  workshopId: string | null;
}

export default function App() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'about' | 'crew' | 'services' | 'workshops' | 'communities' | 'payments' | 'contact' | 'admin' | 'networking' | 'events' | 'portal' | 'policies'>('home');
  const [activePolicyTab, setActivePolicyTab] = useState<string>('terms');
  const [prefilledPayment, setPrefilledPayment] = useState<PrefilledPaymentData | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleViewChange = (view: string) => {
    setCurrentView(view as any);
  };

  const handleViewPolicy = (tab: string) => {
    setActivePolicyTab(tab);
    setCurrentView('policies');
    window.scrollTo(0, 0);
  };

  // Authenticated user state
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('scoders_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Load registered items from localStorage to check if returning client has sessions
  const [localSessions, setLocalSessions] = useState<any[]>([]);

  useEffect(() => {
    const checkSessions = () => {
      try {
        const workshopsData = JSON.parse(localStorage.getItem('scoders_registered_workshops') || '{}');
        const servicesData = JSON.parse(localStorage.getItem('scoders_registered_services') || '{}');
        
        const sessionsList: any[] = [];
        
        Object.keys(workshopsData).forEach(key => {
          const item = workshopsData[key];
          const id = key.split('_')[0];
          let title = 'S-CODERS Professional Masterclass';
          if (id === 'w-1') title = 'Building Real-world AI Agents with n8n & Gemini';
          else if (id === 'w-2') title = 'Full-Stack React Native Masterclass';
          else if (id === 'w-3') title = 'SaaS Hackathon: Idea to MVP in 48 Hours';
          
          sessionsList.push({
            keyId: key,
            id,
            ...item,
            type: 'workshop',
            title
          });
        });

        Object.keys(servicesData).forEach(key => {
          const item = servicesData[key];
          const id = key.split('_')[0];
          let title = 'S-CODERS Engineering Project';
          if (id === 'ai') title = 'AI Agent System Pipeline';
          else if (id === 'mobile') title = 'Mobile Application Project Workspace';
          else if (id === 'web') title = 'Website Core Architecture Hub';
          else if (id === 'software') title = 'Custom Software System Workspace';
          else if (id === 'design') title = 'UI/UX High-Fidelity Design Studio';

          sessionsList.push({
            keyId: key,
            id,
            ...item,
            type: 'service',
            title
          });
        });

        setLocalSessions(sessionsList);
      } catch (err) {
        console.error('Error parsing sessions', err);
      }
    };

    checkSessions();

    // Listen to storage events, auth sync, or custom events to stay in sync
    window.addEventListener('storage', checkSessions);
    window.addEventListener('scoders_sessions_change', checkSessions);
    window.addEventListener('scoders_auth_change', checkSessions);
    
    return () => {
      window.removeEventListener('storage', checkSessions);
      window.removeEventListener('scoders_sessions_change', checkSessions);
      window.removeEventListener('scoders_auth_change', checkSessions);
    };
  }, []);

  // Keep user sync in multi-panel interactions
  useEffect(() => {
    const handleSyncAuth = () => {
      try {
        const saved = localStorage.getItem('scoders_user');
        setUser(saved ? JSON.parse(saved) : null);
      } catch (err) {
        console.error('Error syncing auth', err);
      }
    };
    window.addEventListener('scoders_auth_change', handleSyncAuth);
    return () => window.removeEventListener('scoders_auth_change', handleSyncAuth);
  }, []);

  const handleLogin = (newUser: AppUser) => {
    setUser(newUser);
    localStorage.setItem('scoders_user', JSON.stringify(newUser));
    if (newUser.role === 'admin') {
      localStorage.setItem('scoders_admin_auth', 'true');
    }
    setCurrentView('portal');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('scoders_user');
    localStorage.removeItem('scoders_admin_auth');
    setCurrentView('home');
  };

  const handlePayDepositInApp = (details: { clientName: string; email: string; category: string; amount: number }) => {
    setPrefilledPayment({
      tab: 'invoice',
      invoice: {
        client: details.clientName,
        contact: details.email,
        purpose: `Startup Deposit for ${details.category} development`,
        amount: details.amount,
        currency: 'INR'
      },
      workshopId: null
    });
    setIsPaymentModalOpen(true);
  };

  const handleBookWorkshopInApp = (details: string | { workshopId: string; title: string; seats: number; totalAmount: number }) => {
    const wId = typeof details === 'string' ? details : details.workshopId;
    setPrefilledPayment({
      tab: 'workshop',
      invoice: null,
      workshopId: wId
    });
    setIsPaymentModalOpen(true);
  };

  // Smooth scroll back to top helper
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-brand-dark text-gray-100 flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Fixed Header Navbar */}
      <Header 
        onOpenAssistant={() => setIsAssistantOpen(true)} 
        currentView={currentView}
        onViewChange={handleViewChange}
        onOpenPayments={() => { setPrefilledPayment(null); setIsPaymentModalOpen(true); }}
        user={user}
        onLogout={handleLogout}
        hasActiveSessions={localSessions.length > 0}
      />

      {/* Main Content Sections */}
      <main className="flex-grow pt-20">
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {/* Full-screen Hero Banner */}
              <Hero 
                onOpenAssistant={() => setIsAssistantOpen(true)} 
                onExploreServices={() => { setCurrentView('services'); window.scrollTo(0, 0); }}
              />

              {/* Home Overview Portal Section */}
              <section className="py-24 bg-brand-dark/40 relative">
                <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono mb-4">
                      <span>EXPLORE ECOSYSTEM</span>
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white mb-6">
                      Engineered for scale & automation
                    </h2>
                    <p className="text-gray-400 font-sans font-light text-lg">
                      Browse separate modules, book active workshop seats, settle dynamic client invoices, or interface with our developer team directly.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* 1. About Teaser */}
                    <div className="bg-brand-card/40 border border-white/5 rounded-2xl p-6 sm:p-8 hover:border-brand-teal/30 transition-all duration-300 group flex flex-col justify-between">
                      <div>
                        <div className="p-3 bg-brand-teal/10 rounded-xl w-fit text-brand-teal mb-6">
                          <Users className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-white mb-3 group-hover:text-brand-teal transition-colors">Our Origin & Crew</h3>
                        <p className="text-gray-400 text-sm font-sans font-light leading-relaxed mb-6">
                          Meet Suhas Gowda, Founder & Chief AI Architect, and discover our core engineering values, culture, and roadmap.
                        </p>
                      </div>
                      <button
                        onClick={() => { setCurrentView('about'); window.scrollTo(0,0); }}
                        className="flex items-center gap-1.5 text-sm font-mono font-bold text-brand-teal hover:text-white transition-colors cursor-pointer group self-start focus:outline-none"
                      >
                        View About & Crew
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    {/* 2. Services Teaser */}
                    <div className="bg-brand-card/40 border border-white/5 rounded-2xl p-6 sm:p-8 hover:border-brand-teal/30 transition-all duration-300 group flex flex-col justify-between">
                      <div>
                        <div className="p-3 bg-brand-teal/10 rounded-xl w-fit text-brand-teal mb-6">
                          <Cpu className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-white mb-3 group-hover:text-brand-teal transition-colors">AI & Automation Services</h3>
                        <p className="text-gray-400 text-sm font-sans font-light leading-relaxed mb-6">
                          Explore our expert developer services including n8n automations, custom LLM agents, system integrations, and React Native full-stack builds.
                        </p>
                      </div>
                      <button
                        onClick={() => { setCurrentView('services'); window.scrollTo(0,0); }}
                        className="flex items-center gap-1.5 text-sm font-mono font-bold text-brand-teal hover:text-white transition-colors cursor-pointer group self-start focus:outline-none"
                      >
                        Explore Services
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    {/* 3. Workshops Teaser */}
                    <div className="bg-brand-card/40 border border-white/5 rounded-2xl p-6 sm:p-8 hover:border-brand-teal/30 transition-all duration-300 group flex flex-col justify-between">
                      <div>
                        <div className="p-3 bg-brand-teal/10 rounded-xl w-fit text-brand-teal mb-6">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-white mb-3 group-hover:text-brand-teal transition-colors">Tech Seminars & Workshops</h3>
                        <p className="text-gray-400 text-sm font-sans font-light leading-relaxed mb-6">
                          Join our expert-led events. Learn custom WhatsApp automation, LLM orchestration, and rapid SaaS integration strategies.
                        </p>
                      </div>
                      <button
                        onClick={() => { setCurrentView('workshops'); window.scrollTo(0,0); }}
                        className="flex items-center gap-1.5 text-sm font-mono font-bold text-brand-teal hover:text-white transition-colors cursor-pointer group self-start focus:outline-none"
                      >
                        Browse Workshops
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    {/* 4. Communities Teaser */}
                    <div className="bg-brand-card/40 border border-white/5 rounded-2xl p-6 sm:p-8 hover:border-brand-teal/30 transition-all duration-300 group flex flex-col justify-between">
                      <div>
                        <div className="p-3 bg-brand-teal/10 rounded-xl w-fit text-brand-teal mb-6">
                          <Globe className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-white mb-3 group-hover:text-brand-teal transition-colors">Developer Communities</h3>
                        <p className="text-gray-400 text-sm font-sans font-light leading-relaxed mb-6">
                          Connect with our thriving networking chapters across Bangalore, Mumbai, Chennai, and other major tech hubs.
                        </p>
                      </div>
                      <button
                        onClick={() => { setCurrentView('communities'); window.scrollTo(0,0); }}
                        className="flex items-center gap-1.5 text-sm font-mono font-bold text-brand-teal hover:text-white transition-colors cursor-pointer group self-start focus:outline-none"
                      >
                        View Community Hub
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    {/* 5. Payments Teaser */}
                    <div className="bg-brand-card/40 border border-white/5 rounded-2xl p-6 sm:p-8 hover:border-brand-teal/30 transition-all duration-300 group flex flex-col justify-between">
                      <div>
                        <div className="p-3 bg-brand-teal/10 rounded-xl w-fit text-brand-teal mb-6">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-white mb-3 group-hover:text-brand-teal transition-colors">Secure Dynamic Payments</h3>
                        <p className="text-gray-400 text-sm font-sans font-light leading-relaxed mb-6">
                          Access secure UPI scan billing, credit card settlements, or bank NEFT verification receipts for your active S-CODERS invoices.
                        </p>
                      </div>
                      <button
                        onClick={() => { setPrefilledPayment(null); setIsPaymentModalOpen(true); }}
                        className="flex items-center gap-1.5 text-sm font-mono font-bold text-brand-teal hover:text-white transition-colors cursor-pointer group self-start focus:outline-none"
                      >
                        Access Billing Portal
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    {/* 6. Contact Teaser */}
                    <div className="bg-brand-card/40 border border-white/5 rounded-2xl p-6 sm:p-8 hover:border-brand-teal/30 transition-all duration-300 group flex flex-col justify-between">
                      <div>
                        <div className="p-3 bg-brand-teal/10 rounded-xl w-fit text-brand-teal mb-6">
                          <PhoneCall className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-white mb-3 group-hover:text-brand-teal transition-colors">Contact & Coordinates</h3>
                        <p className="text-gray-400 text-sm font-sans font-light leading-relaxed mb-6">
                          Get answers to frequently asked developer questions or dispatch direct project coordinates and inquiries to our inbox.
                        </p>
                      </div>
                      <button
                        onClick={() => { setCurrentView('contact'); window.scrollTo(0,0); }}
                        className="flex items-center gap-1.5 text-sm font-mono font-bold text-brand-teal hover:text-white transition-colors cursor-pointer group self-start focus:outline-none"
                      >
                        Get In Touch
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {currentView === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {/* Company Origin, Roadmap & Values */}
              <Suspense fallback={<ViewLoader />}>
                <About onNavigate={(v) => setCurrentView(v)} />
              </Suspense>
            </motion.div>
          )}

          {currentView === 'crew' && (
            <motion.div
              key="crew"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {/* Team Members & Cultural blueprint */}
              <Suspense fallback={<ViewLoader />}>
                <Team />
              </Suspense>
            </motion.div>
          )}

          {currentView === 'services' && (
            <motion.div
              key="services"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<ViewLoader />}>
                <Services onPayDeposit={handlePayDepositInApp} />
              </Suspense>
            </motion.div>
          )}

          {currentView === 'workshops' && (
            <motion.div
              key="workshops"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<ViewLoader />}>
                <Workshops onBookWorkshop={handleBookWorkshopInApp} />
              </Suspense>
            </motion.div>
          )}

          {currentView === 'communities' && (
            <motion.div
              key="communities"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {/* Regional startup community networking logs */}
              <Suspense fallback={<ViewLoader />}>
                <Communities />
              </Suspense>
            </motion.div>
          )}

          {currentView === 'networking' && (
            <motion.div
              key="networking"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {/* Live photostream and credibility certificates */}
              <Suspense fallback={<ViewLoader />}>
                <Networking />
              </Suspense>
            </motion.div>
          )}

          {currentView === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {/* Official S-CODERS Events, Hackathons & Verified Passes */}
              <Suspense fallback={<ViewLoader />}>
                <Events />
              </Suspense>
            </motion.div>
          )}

          {currentView === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {/* Contact form,Coordinates & FAQs accordion */}
              <Suspense fallback={<ViewLoader />}>
                <Contact />
              </Suspense>
            </motion.div>
          )}

          {currentView === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {/* Secure Developer Admin Panel Console */}
              <Suspense fallback={<ViewLoader />}>
                <AdminConsole onClose={() => { setCurrentView('home'); window.scrollTo(0, 0); }} />
              </Suspense>
            </motion.div>
          )}



          {currentView === 'policies' && (
            <motion.div
              key="policies"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<ViewLoader />}>
                <Policies initialTab={activePolicyTab} />
              </Suspense>
            </motion.div>
          )}

          {currentView === 'portal' && (
            <motion.div
              key="portal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {/* Secure Partner & Client Workspace Portal */}
              <Suspense fallback={<ViewLoader />}>
                <AuthPortal 
                  user={user} 
                  onLogin={handleLogin} 
                  onLogout={handleLogout} 
                  onOpenPayments={(details) => {
                    setPrefilledPayment(details);
                    setIsPaymentModalOpen(true);
                  }}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding Panel */}
      <footer className="bg-brand-dark border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Left branding */}
            <div className="flex flex-col items-center md:items-start gap-1.5">
              <div className="hover:scale-102 transition-transform duration-200">
                <Logo 
                  size="sm" 
                  showSubtitle={true} 
                  lightBg={false}
                  onClick={() => { setCurrentView('home'); window.scrollTo(0,0); }} 
                />
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
                <p className="text-[10px] text-gray-500 font-mono">
                  BHARATH TECH DEVELOPERS © 2026. ALL RIGHTS RESERVED.
                </p>
                {user?.role === 'admin' && (
                  <>
                    <span className="hidden sm:inline text-gray-700 text-xs">•</span>
                    <button 
                      onClick={() => { setCurrentView('admin'); window.scrollTo(0, 0); }}
                      className="text-[10px] text-brand-teal hover:text-white font-mono cursor-pointer transition-colors flex items-center gap-1.5 focus:outline-none"
                    >
                      <Lock className="w-3 h-3" />
                      Admin Gate
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Middle Quick Links */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs text-gray-400 font-medium">
                <button onClick={() => { setCurrentView('home'); window.scrollTo(0,0); }} className="hover:text-brand-teal transition-colors cursor-pointer focus:outline-none">Home</button>
                <button onClick={() => { setCurrentView('services'); window.scrollTo(0,0); }} className="hover:text-brand-teal transition-colors cursor-pointer focus:outline-none">Services</button>
                <button onClick={() => { setCurrentView('workshops'); window.scrollTo(0,0); }} className="hover:text-brand-teal transition-colors cursor-pointer focus:outline-none">Workshops</button>
                <button onClick={() => { setCurrentView('about'); window.scrollTo(0,0); }} className="hover:text-brand-teal transition-colors cursor-pointer focus:outline-none">About Us</button>
                <button onClick={() => { setCurrentView('crew'); window.scrollTo(0,0); }} className="hover:text-brand-teal transition-colors cursor-pointer focus:outline-none">The Crew</button>
                <button onClick={() => { setCurrentView('communities'); window.scrollTo(0,0); }} className="hover:text-brand-teal transition-colors cursor-pointer focus:outline-none">Communities</button>
                <button onClick={() => { setCurrentView('networking'); window.scrollTo(0,0); }} className="hover:text-brand-teal transition-colors cursor-pointer focus:outline-none">Networking & Achievements</button>
                <button onClick={() => { setCurrentView('contact'); window.scrollTo(0,0); }} className="hover:text-brand-teal transition-colors cursor-pointer focus:outline-none">Contact</button>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 text-[10px] text-gray-500 font-mono tracking-wider">
                <span className="text-gray-700">POLICIES:</span>
                <button onClick={() => handleViewPolicy('terms')} className="hover:text-brand-teal transition-colors cursor-pointer focus:outline-none uppercase">Terms</button>
                <span className="text-gray-800">•</span>
                <button onClick={() => handleViewPolicy('privacy')} className="hover:text-brand-teal transition-colors cursor-pointer focus:outline-none uppercase">Privacy</button>
                <span className="text-gray-800">•</span>
                <button onClick={() => handleViewPolicy('refund')} className="hover:text-brand-teal transition-colors cursor-pointer focus:outline-none uppercase">Refunds</button>
                <span className="text-gray-800">•</span>
                <button onClick={() => handleViewPolicy('cancellation')} className="hover:text-brand-teal transition-colors cursor-pointer focus:outline-none uppercase">Cancellations</button>
                <span className="text-gray-800">•</span>
                <button onClick={() => handleViewPolicy('shipping')} className="hover:text-brand-teal transition-colors cursor-pointer focus:outline-none uppercase">Shipping</button>
                <span className="text-gray-800">•</span>
                <button onClick={() => handleViewPolicy('about-brand')} className="hover:text-brand-teal transition-colors cursor-pointer focus:outline-none uppercase">About Brand</button>
                <span className="text-gray-800">•</span>
                <button onClick={() => handleViewPolicy('contact-info')} className="hover:text-brand-teal transition-colors cursor-pointer focus:outline-none uppercase">Corporate Info</button>
              </div>
            </div>

            {/* Right Quick back to top */}
            <button
              onClick={scrollToTop}
              className="p-2.5 bg-brand-card hover:bg-white/5 border border-white/10 rounded-full hover:border-brand-teal transition-all group cursor-pointer"
              title="Scroll to Top"
            >
              <ArrowUp className="w-4 h-4 text-gray-400 group-hover:text-brand-teal group-hover:-translate-y-0.5 transition-all" />
            </button>

          </div>
        </div>
      </footer>

      {/* Floating Interactive Trigger Widgets */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        {/* Instant WhatsApp trigger */}
        <a
          href="https://wa.me/918310463417?text=Hi%20S-CODERS%20team,%20I%20visited%20your%20website%20and%20wanted%20to%20discuss%20a%20project..."
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 bg-[#25d366] hover:bg-[#20ba5a] text-white rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
          title="Direct WhatsApp"
        >
          <MessageCircle className="w-6 h-6" />
        </a>

        {/* Floating AI Consultant trigger */}
        <button
          onClick={() => setIsAssistantOpen(!isAssistantOpen)}
          className="p-4 bg-brand-teal hover:bg-white text-brand-dark rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 flex items-center justify-center relative group cursor-pointer"
          title="S-CODERS AI Consultant"
        >
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-coral opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-coral"></span>
          </span>
          {isAssistantOpen ? <X className="w-6 h-6 animate-spin-slow" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      </div>

      {/* Floating AI Assistant Chat panel */}
      <Suspense fallback={null}>
        <AIAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
      </Suspense>

      {/* Contextual Payments Overlay Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-dark/90 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-y-auto"
          >
            {/* Backdrop click to close */}
            <div className="absolute inset-0 cursor-pointer" onClick={() => setIsPaymentModalOpen(false)} />
            
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-brand-card border border-white/10 rounded-[32px] w-full max-w-6xl shadow-2xl relative overflow-hidden z-10 max-h-[92vh] flex flex-col"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="absolute top-6 right-6 p-2 bg-white/5 border border-white/10 rounded-full hover:border-brand-teal hover:text-brand-teal text-gray-400 transition-all z-50 cursor-pointer focus:outline-none"
                title="Close Settlement Portal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Scrollable container for the payments gateway */}
              <div className="overflow-y-auto flex-grow">
                <Suspense fallback={<ViewLoader />}>
                  <Payments
                    initialTab={prefilledPayment?.tab}
                    prefilledInvoice={prefilledPayment?.invoice}
                    prefilledWorkshopId={prefilledPayment?.workshopId}
                    isModal={true}
                  />
                </Suspense>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
