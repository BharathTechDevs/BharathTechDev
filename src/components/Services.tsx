import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, Smartphone, Globe, Cpu, Palette, Users, 
  Sparkles, CheckCircle, ArrowRight, ClipboardCheck, ArrowUpRight,
  Edit2, Save, X, Lock, Key, Copy, Play, RefreshCw, Send, Terminal, 
  Settings, Database, AppWindow, Eye, Check, ChevronRight, Layout,
  Laptop, Server, Clock, Calendar, Shield, HelpCircle, Star, Download,
  Phone, Mail, MessageSquare, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PROJECT_EXAMPLES } from '../data';
import { getDynamicServices, saveDynamicServices } from '../utils/dynamicData';
import { ServiceEnquiry, Service, AppUser } from '../types';
import { DatabaseEngine, ServiceRegistration, EnquiryItem, PaymentTransaction, ChatConversation, FileRecord } from '../utils/dbEngine';

interface ServicesProps {
  onPayDeposit?: (details: { clientName: string; email: string; category: string; amount: number }) => void;
  onSelectService?: (serviceId: string) => void;
}

export default function Services({ onPayDeposit, onSelectService }: ServicesProps) {
  const [services, setServices] = useState(getDynamicServices);
  const [activeTab, setActiveTab] = useState<'app' | 'website' | 'webpage'>('app');
  
  // States for live forms
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [requirements, setRequirements] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [depositAmount, setDepositAmount] = useState<number>(10000);
  
  // Admin inline editing states
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('scoders_admin_auth') === 'true';
  });

  // Access control state persistence
  const [registeredKeys, setRegisteredKeys] = useState<{
    [serviceId: string]: {
      key: string;
      name: string;
      email: string;
      purpose?: string;
      role?: string;
      requirements?: string;
      budget?: string;
      timeline?: string;
      timestamp: string;
    }
  }>(() => {
    const saved = localStorage.getItem('scoders_registered_services');
    return saved ? JSON.parse(saved) : {};
  });

  // Modals controller
  const [registeringService, setRegisteringService] = useState<Service | null>(null);
  const [activeWorkspaceService, setActiveWorkspaceService] = useState<Service | null>(null);
  
  // Registration form states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('');
  const [regRequirements, setRegRequirements] = useState('');
  const [regBudget, setRegBudget] = useState('');
  const [regTimeline, setRegTimeline] = useState('');
  const [regSuccessKey, setRegSuccessKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [modalMode, setModalMode] = useState<'register' | 'enterKey'>('register');
  const [inputtedKey, setInputtedKey] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);

  // Sync current user state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('scoders_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const handleSyncAuth = () => {
      setIsAdmin(localStorage.getItem('scoders_admin_auth') === 'true');
      const savedUser = localStorage.getItem('scoders_user');
      setCurrentUser(savedUser ? JSON.parse(savedUser) : null);
    };
    window.addEventListener('scoders_auth_change', handleSyncAuth);
    window.addEventListener('focus', handleSyncAuth);
    return () => {
      window.removeEventListener('scoders_auth_change', handleSyncAuth);
      window.removeEventListener('focus', handleSyncAuth);
    };
  }, []);

  // Pre-populate registration fields if user is logged in
  useEffect(() => {
    if (currentUser) {
      setRegName(currentUser.name || '');
      setRegEmail(currentUser.email || '');
    }
  }, [currentUser, registeringService]);

  // Listen to external data changes
  useEffect(() => {
    const reloadServices = () => {
      setServices(getDynamicServices());
    };
    window.addEventListener('scoders_data_change', reloadServices);
    return () => {
      window.removeEventListener('scoders_data_change', reloadServices);
    };
  }, []);

  const handleSavePrice = (serviceId: string) => {
    const updated = services.map(s => s.id === serviceId ? { ...s, price: tempPrice } : s);
    setServices(updated);
    saveDynamicServices(updated);
    setEditingServiceId(null);
    window.dispatchEvent(new Event('scoders_data_change'));
  };

  // Feedback state initialized from localStorage / DatabaseEngine with fallback
  const [feedbacks, setFeedbacks] = useState(() => {
    try {
      const saved = localStorage.getItem('scoders_feedbacks');
      if (saved) return JSON.parse(saved);
      const dbFeeds = DatabaseEngine.getFeedbacks();
      if (dbFeeds && dbFeeds.length > 0) return dbFeeds;
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'FDB-SVC-01',
        type: 'service',
        clientName: 'AgroSmart Billing',
        clientEmail: 'billing@agrosmart.in',
        registrationId: 'REG-SVC-1001',
        rating: 5,
        review: 'The AI orchestration built by S-CODERS has completely optimized our diagnosis turnaround. Incredible expertise in the Gemini SDK and stateful agents!',
        submissionDate: '2026-07-14'
      },
      {
        id: 'FDB-SVC-02',
        type: 'service',
        clientName: 'EdVantage LMS Group',
        clientEmail: 'contact@edvantage.io',
        registrationId: 'REG-SVC-1002',
        rating: 5,
        review: 'S-CODERS delivered our Next.js multi-tenant platform in under 3 weeks. Prathiksha and Suhas ensured top-tier UI fidelity and seamless database integration.',
        submissionDate: '2026-07-20'
      },
      {
        id: 'FDB-SVC-03',
        type: 'service',
        clientName: 'Ketan Deshmukh',
        clientEmail: 'ketan@ruralagritech.org',
        registrationId: 'REG-SVC-1003',
        rating: 5,
        review: 'Working with Suhas and the team was an absolute pleasure. High communication, clean architecture, and transparent milestone updates.',
        submissionDate: '2026-07-28'
      }
    ];
  });

  // Feedback form states
  const [feedAuthorName, setFeedAuthorName] = useState('');
  const [feedRole, setFeedRole] = useState('Client Partner');
  const [feedContent, setFeedContent] = useState('');
  const [feedRating, setFeedRating] = useState<number>(5);
  const [feedSubmitSuccess, setFeedSubmitSuccess] = useState(false);

  const handlePostServiceFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedAuthorName.trim() || !feedContent.trim()) return;

    const newFeed = {
      id: 'FDB-SVC-' + Date.now().toString(),
      type: 'service' as const,
      clientName: feedAuthorName.trim(),
      clientEmail: currentUser?.email || `${feedAuthorName.toLowerCase().replace(/\s+/g, '')}@client.in`,
      registrationId: 'REG-SVC-' + Date.now().toString().slice(-4),
      rating: feedRating,
      review: feedContent.trim(),
      submissionDate: new Date().toISOString().split('T')[0]
    };

    const updated = [newFeed, ...feedbacks];
    setFeedbacks(updated);
    localStorage.setItem('scoders_feedbacks', JSON.stringify(updated));

    try {
      DatabaseEngine.saveFeedbacks(updated);
    } catch (err) {
      console.error("Failed to save feedback to DatabaseEngine:", err);
    }

    // Reset Form
    setFeedAuthorName('');
    setFeedRole('Client Partner');
    setFeedContent('');
    setFeedRating(5);
    setFeedSubmitSuccess(true);
    setTimeout(() => setFeedSubmitSuccess(false), 4000);
  };
  
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [savedEnquiries, setSavedEnquiries] = useState<ServiceEnquiry[]>(() => {
    const saved = localStorage.getItem('scoders_enquiries');
    return saved ? JSON.parse(saved) : [];
  });

  // Get matching projects for current category tab
  const categoryProjects = PROJECT_EXAMPLES.filter(proj => proj.category === activeTab);

  const handleTabChange = (tab: 'app' | 'website' | 'webpage') => {
    setActiveTab(tab);
    setFormSubmitted(false);
    setClientName('');
    setEmail('');
    setRequirements('');
    setBudget('');
    setTimeline('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !email || !requirements) return;

    const newEnquiry: ServiceEnquiry = {
      id: Date.now().toString(),
      category: activeTab,
      clientName,
      email,
      requirements,
      budget: budget || 'Not Specified',
      timeline: timeline || 'Not Specified',
      timestamp: new Date().toLocaleDateString(),
    };

    const updated = [newEnquiry, ...savedEnquiries];
    setSavedEnquiries(updated);
    localStorage.setItem('scoders_enquiries', JSON.stringify(updated));

    // Save in DatabaseEngine Enquiry table
    try {
      const dbEnquiry: EnquiryItem = {
        id: 'ENQ-' + Date.now().toString().slice(-4),
        name: clientName,
        email: email,
        phone: '+91 99999 00000',
        subject: `Project Enquiry: S-CODERS Custom ${activeTab === 'app' ? 'Mobile App' : activeTab === 'website' ? 'Next.js Website' : 'Single Webpage'}`,
        message: requirements,
        timestamp: new Date().toISOString(),
        replyStatus: 'Pending',
        replyMessage: null,
        replyDate: null
      };
      const currentEnquiries = DatabaseEngine.getEnquiries();
      DatabaseEngine.saveEnquiries([dbEnquiry, ...currentEnquiries]);
    } catch (dbErr) {
      console.error("Database Engine Enquiry Save Error:", dbErr);
    }

    setFormSubmitted(true);
  };

  // Service Keys generators & verifiers
  const handleRegisterService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringService || !regName || !regEmail || !regRequirements) return;

    // Auto-signup / log-in on the fly if not logged in!
    let activeClient = currentUser;
    if (!activeClient) {
      const newClient: AppUser = {
        uid: 'client-' + Date.now().toString(),
        name: regName,
        email: regEmail,
        role: 'client',
        company: 'Independent Client',
        phone: 'Not Specified',
        createdAt: new Date().toISOString()
      };
      
      // Save client profile in local client list
      const registeredClientsStr = localStorage.getItem('scoders_registered_clients');
      const clients: AppUser[] = registeredClientsStr ? JSON.parse(registeredClientsStr) : [];
      if (!clients.some(c => c.email.toLowerCase() === regEmail.toLowerCase().trim())) {
        clients.push(newClient);
        localStorage.setItem('scoders_registered_clients', JSON.stringify(clients));
      }

      // Save password secure map default for on-demand
      const passwordsMap = JSON.parse(localStorage.getItem('scoders_client_passwords') || '{}');
      if (!passwordsMap[newClient.email.toLowerCase()]) {
        passwordsMap[newClient.email.toLowerCase()] = 'password';
        localStorage.setItem('scoders_client_passwords', JSON.stringify(passwordsMap));
      }

      // Log in
      localStorage.setItem('scoders_user', JSON.stringify(newClient));
      setCurrentUser(newClient);
      activeClient = newClient;
      
      // Dispatch events to sync other parts of the app
      window.dispatchEvent(new Event('scoders_auth_change'));
    }

    const timestamp = Date.now().toString(36).substring(3, 7).toUpperCase();
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const serviceCode = registeringService.id.substring(0, 4).toUpperCase();
    const generatedKey = `BTD-SERV-${serviceCode}-${timestamp}-${randomHex}`;

    const newKeys = {
      ...registeredKeys,
      [registeringService.id]: {
        key: generatedKey,
        name: regName,
        email: regEmail,
        role: regRole || 'Developer',
        requirements: regRequirements,
        budget: regBudget || 'TBD',
        timeline: regTimeline || 'TBD',
        timestamp: new Date().toLocaleString(),
      }
    };

    setRegisteredKeys(newKeys);
    localStorage.setItem('scoders_registered_services', JSON.stringify(newKeys));

    // Complete relational DatabaseEngine integration
    try {
      const regId = 'REG-SVC-' + Date.now().toString().slice(-4);
      const mockChatId = 'CHT-SVC-' + Date.now().toString().slice(-4);
      const mockSrcFileId = 'FIL-SRC-' + Date.now().toString().slice(-4);
      const mockPdfFileId = 'FIL-PDF-' + Date.now().toString().slice(-4);
      const mockInvoiceId = 'INV-2026-' + Date.now().toString().slice(-3);

      const dbServiceReg: ServiceRegistration = {
        id: regId,
        clientProfile: {
          name: regName,
          email: regEmail,
          phone: '+91 99999 00000',
          company: 'Independent Client'
        },
        serviceId: registeringService.id,
        selectedServiceTitle: registeringService.title,
        uniqueKey: generatedKey,
        projectRequirements: regRequirements,
        budget: regBudget || 'TBD',
        timeline: regTimeline || 'TBD',
        projectStatus: 'Pending',
        registrationDate: new Date().toISOString().split('T')[0],
        projectSubmissionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sourceCodeFileId: mockSrcFileId,
        pdfFileId: mockPdfFileId,
        chatId: mockChatId,
        feedbackId: null,
        invoiceId: mockInvoiceId
      };

      // Save registration
      const currentRegs = DatabaseEngine.getServiceRegistrations();
      DatabaseEngine.saveServiceRegistrations([dbServiceReg, ...currentRegs]);

      // Save Payment Transaction
      const dbPayment: PaymentTransaction = {
        id: 'TXN-' + Math.floor(100000 + Math.random() * 900000).toString(),
        clientId: regEmail,
        clientName: regName,
        clientEmail: regEmail,
        amount: 10000, // deposit simulation
        paymentMethod: 'UPI (PhonePe)',
        status: 'Successful',
        timestamp: new Date().toISOString(),
        reference: `Deposit payment for S-CODERS ${registeringService.title}`,
        interrupted: false,
        failureReason: null
      };
      const currentPayments = DatabaseEngine.getPayments();
      DatabaseEngine.savePayments([dbPayment, ...currentPayments]);

      // Save Chat Conversation
      const dbChat: ChatConversation = {
        id: mockChatId,
        clientName: regName,
        clientEmail: regEmail,
        registrationId: regId,
        reference: registeringService.title,
        messages: [
          { id: 'msg-init-1', sender: 'team', content: `Welcome ${regName} to S-CODERS! We have created a separate database and conversation workspace for your project '${registeringService.title}'. Our team has reviewed your requirements: "${regRequirements}". Suhas Gowda (Founder) and Manoj Kumar (Lead Dev) will reach out shortly.`, timestamp: new Date().toISOString() }
        ],
        lastUpdated: new Date().toISOString()
      };
      const currentChats = DatabaseEngine.getChats();
      DatabaseEngine.saveChats([dbChat, ...currentChats]);

      // Save separate File Records
      const dbSrcFile: FileRecord = {
        id: mockSrcFileId,
        name: `${registeringService.id.replace('srv-', '')}_template_v1.zip`,
        type: 'project_source_code',
        url: '#download-source-zip',
        size: '2.5 MB',
        clientId: regEmail,
        registrationId: regId,
        uploadDate: new Date().toISOString().split('T')[0]
      };
      const dbPdfFile: FileRecord = {
        id: mockPdfFileId,
        name: `${registeringService.id.replace('srv-', '')}_specifications.pdf`,
        type: 'project_pdf',
        url: '#download-spec-pdf',
        size: '1.2 MB',
        clientId: regEmail,
        registrationId: regId,
        uploadDate: new Date().toISOString().split('T')[0]
      };
      const currentFiles = DatabaseEngine.getFiles();
      DatabaseEngine.saveFiles([dbSrcFile, dbPdfFile, ...currentFiles]);
    } catch (dbErr) {
      console.error("Database Engine Service Registration Error:", dbErr);
    }

    setRegSuccessKey(generatedKey);
  };

  const handleVerifyKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringService || !inputtedKey.trim()) return;

    const trimmed = inputtedKey.trim().toUpperCase();
    const serviceCode = registeringService.id.substring(0, 4).toUpperCase();
    
    // Key validation criteria: BTD-SERV-SERVCODE-XXXX-XXXX
    const expectedPrefix = `BTD-SERV-${serviceCode}-`;
    if (trimmed.startsWith(expectedPrefix) && trimmed.length >= expectedPrefix.length + 4) {
      const newKeys = {
        ...registeredKeys,
        [registeringService.id]: {
          key: trimmed,
          name: currentUser?.name || 'Manual Access',
          email: currentUser?.email || 'manual@access.key',
          purpose: 'Unlocked via existing license key',
          timestamp: new Date().toLocaleString(),
        }
      };
      setRegisteredKeys(newKeys);
      localStorage.setItem('scoders_registered_services', JSON.stringify(newKeys));
      setRegisteringService(null);
      setInputtedKey('');
      setKeyError(null);
    } else {
      setKeyError(`Invalid key format. Key for this service must follow format: ${expectedPrefix}XXXX-XXXX`);
    }
  };

  const handleRemoveKey = (serviceId: string) => {
    const updated = { ...registeredKeys };
    delete updated[serviceId];
    setRegisteredKeys(updated);
    localStorage.setItem('scoders_registered_services', JSON.stringify(updated));
  };

  const handleCopyKey = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Icon mapper helper
  const getIcon = (name: string, sizeClass = "w-6 h-6") => {
    switch (name) {
      case 'BrainCircuit': return <BrainCircuit className={`${sizeClass} text-brand-teal`} />;
      case 'Smartphone': return <Smartphone className={`${sizeClass} text-brand-teal`} />;
      case 'Globe': return <Globe className={`${sizeClass} text-brand-teal`} />;
      case 'Cpu': return <Cpu className={`${sizeClass} text-brand-teal`} />;
      case 'Palette': return <Palette className={`${sizeClass} text-brand-teal`} />;
      case 'Users': return <Users className={`${sizeClass} text-brand-teal`} />;
      default: return <Sparkles className={`${sizeClass} text-brand-teal`} />;
    }
  };

  return (
    <section id="services" className="py-24 bg-brand-dark/95 relative overflow-hidden">
      {/* Visual glowing backgrounds */}
      <div className="absolute top-1/4 left-1/2 w-[400px] h-[400px] ambient-glow rounded-full -translate-x-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>OUR OFFERINGS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight mb-6">
            Elite Capabilities, <span className="text-brand-teal">Custom Engineered</span>
          </h2>
          <p className="text-gray-400 font-sans font-light text-lg">
            S-CODERS • Bharath Tech Developers translates complex software architectures and agent logic into elegant commercial assets. Explore our solutions.
          </p>
        </div>

        {/* General Services Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {services.map((service) => {
            const currentPrice = service.price ?? 10000;
            const isEditing = editingServiceId === service.id;
            const registration = registeredKeys[service.id];
            const isUnlocked = !!registration;

            return (
              <div
                key={service.id}
                className={`glass-panel p-8 rounded-3xl border transition-all duration-300 flex flex-col justify-between group relative overflow-hidden ${
                  isUnlocked 
                    ? 'border-brand-teal/30 shadow-lg shadow-brand-teal/5 bg-brand-card/70' 
                    : 'border-white/5 hover:border-brand-teal/25'
                }`}
              >
                {/* Glowing status line */}
                {isUnlocked && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-teal via-cyan-400 to-transparent" />
                )}

                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-brand-teal/5 rounded-2xl border border-white/5 group-hover:border-brand-teal/20 w-fit transition-all duration-300">
                      {getIcon(service.icon)}
                    </div>

                    {/* Dynamic Pricing Displays / Actions */}
                    <div className="text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 bg-brand-dark/90 p-1.5 rounded-lg border border-brand-teal/30">
                          <span className="text-brand-teal text-xs font-mono font-bold">₹</span>
                          <input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(Number(e.target.value))}
                            className="w-20 bg-transparent text-white focus:outline-none text-xs font-mono font-bold"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePrice(service.id)}
                            className="p-1 text-emerald-400 hover:text-emerald-300 rounded cursor-pointer"
                            title="Save"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingServiceId(null)}
                            className="p-1 text-red-400 hover:text-red-300 rounded cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Est. Budget</span>
                          <span className="text-brand-teal text-base font-mono font-bold">
                            ₹{currentPrice.toLocaleString()}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setEditingServiceId(service.id);
                                setTempPrice(currentPrice);
                              }}
                              className="mt-1 flex items-center gap-1 text-[10px] text-gray-400 hover:text-white bg-white/5 hover:bg-brand-teal/20 px-2 py-1 rounded transition-all cursor-pointer font-mono"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              Edit Price
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-display font-bold text-xl text-white group-hover:text-brand-teal transition-colors">
                      {service.title}
                    </h3>
                    {isUnlocked ? (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-[9px] font-mono text-brand-teal tracking-wide animate-pulse uppercase font-bold">
                        <Check className="w-2.5 h-2.5" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-[9px] font-mono text-amber-400 tracking-wide uppercase font-bold">
                        <Lock className="w-2.5 h-2.5" />
                        Locked
                      </span>
                    )}
                  </div>

                  <p className="text-gray-400 font-sans text-sm font-light leading-relaxed mb-6">
                    {service.description}
                  </p>

                  {/* Tech tags */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {service.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-mono text-gray-400"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Keychain display and main Action trigger */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  {isUnlocked ? (
                    <div className="space-y-3">
                      <div className="bg-brand-dark/80 rounded-xl p-3 border border-brand-teal/15 flex items-center justify-between text-xs font-mono">
                        <div className="overflow-hidden mr-2">
                          <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Access Keychain</p>
                          <p className="text-brand-teal font-extrabold truncate select-all">{registration.key}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCopyKey(registration.key)}
                            className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-all cursor-pointer"
                            title="Copy Key"
                          >
                            {copiedKey ? <Check className="w-3.5 h-3.5 text-brand-teal" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleRemoveKey(service.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded text-red-400 hover:text-red-300 transition-all cursor-pointer"
                            title="Revoke Key"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveWorkspaceService(service)}
                        className="w-full py-2.5 bg-brand-teal hover:bg-white text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 group cursor-pointer shadow-md shadow-brand-teal/10"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Launch Active Workspace
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500 font-sans leading-relaxed italic">
                        🔒 Register for this service to obtain your dispatch key & run interactive agent simulators.
                      </p>
                      <button
                        onClick={() => {
                          if (onSelectService) {
                            onSelectService(service.id);
                          } else {
                            setRegisteringService(service);
                            setModalMode('register');
                            setRegSuccessKey(null);
                            setInputtedKey('');
                            setKeyError(null);
                          }
                        }}
                        className="w-full py-2.5 bg-white/5 hover:bg-brand-teal/10 text-gray-300 hover:text-brand-teal border border-white/10 hover:border-brand-teal/30 font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Key className="w-3.5 h-3.5" />
                        Register & Get Access Key
                      </button>
                    </div>
                  )}

                  {/* Business value subtitle */}
                  <div className="text-[10px] text-gray-500 font-sans leading-relaxed italic border-t border-white/5 pt-3">
                    <strong className="text-gray-400 not-italic block font-mono text-[9px] uppercase tracking-widest mb-0.5">Value Accent</strong>
                    "{service.value}"
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Case Showcase & Client Requirements Panel */}
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 ambient-coral-glow opacity-30 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white mb-2">
                Shipped Systems & Portfolio Showcase
              </h3>
              <p className="text-gray-400 text-sm font-sans font-light max-w-2xl mx-auto">
                Explore custom software systems engineered and delivered by S-CODERS • Bharath Tech Developers across mobile, web, and single-page architectures.
              </p>
            </div>

            {/* Category selection button-like tabs */}
            <div className="flex justify-center gap-3 sm:gap-4 mb-12">
              {(['app', 'website', 'webpage'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-6 py-3 rounded-full text-xs sm:text-sm font-mono tracking-wider uppercase border font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                    activeTab === tab
                      ? 'bg-brand-teal text-brand-dark border-brand-teal shadow-lg shadow-brand-teal/20 scale-105'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${activeTab === tab ? 'bg-brand-dark animate-pulse' : 'bg-gray-500'}`} />
                  {tab === 'app' ? 'Mobile Apps' : tab === 'website' ? 'Web Platforms' : 'Landing Pages'}
                </button>
              ))}
            </div>

            {/* Showcase projects list according to category tab */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <AnimatePresence mode="wait">
                {categoryProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="bg-brand-dark/50 border border-white/5 hover:border-brand-teal/20 rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 shadow-md"
                  >
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={project.image}
                        alt={project.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-transparent to-transparent opacity-80" />
                      <div className="absolute top-4 left-4 px-2.5 py-1 bg-brand-dark/80 backdrop-blur-md rounded border border-white/10 text-[9px] font-mono font-bold tracking-wider uppercase text-brand-teal">
                        SHIPPED
                      </div>
                    </div>

                    <div className="p-6 flex flex-col justify-between flex-grow">
                      <div>
                        <h4 className="font-display font-bold text-lg text-white mb-2 group-hover:text-brand-teal transition-colors">
                          {project.title}
                        </h4>
                        <p className="text-gray-400 text-xs font-sans font-light leading-relaxed mb-4">
                          {project.description}
                        </p>
                        
                        {/* Highlights checklist */}
                        <ul className="space-y-1.5 mb-6">
                          {project.highlights.map((highlight, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-[11px] text-gray-300 font-sans">
                              <CheckCircle className="w-3.5 h-3.5 text-brand-teal shrink-0 mt-0.5" />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tech badges */}
                      <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/5">
                        {project.technologies.map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-brand-card rounded text-[10px] font-mono text-gray-400 border border-white/5"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Feedback section replacing the redundant bottom app registration form */}
            <div className="bg-brand-dark/40 border border-white/5 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand-teal/10 rounded-xl text-brand-teal border border-brand-teal/20">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-lg text-white">
                    Client Feedback & Service Reviews
                  </h4>
                  <p className="text-gray-500 text-xs font-sans">
                    Verified testimonials and reviews from clients and partners using S-CODERS services.
                  </p>
                </div>
              </div>

              {/* List of existing service reviews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <AnimatePresence mode="popLayout">
                  {feedbacks.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="col-span-2 text-center py-8 bg-white/5 border border-white/5 rounded-2xl"
                    >
                      <p className="text-gray-500 text-sm font-sans font-light">
                        No service feedback logged yet. Be the first client to share your project experience!
                      </p>
                    </motion.div>
                  ) : (
                    feedbacks.map((fb: any) => (
                      <motion.div
                        key={fb.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-brand-dark/60 border border-white/5 p-5 rounded-2xl flex flex-col justify-between"
                      >
                        <div>
                          {/* Rating stars display */}
                          <div className="flex gap-1 text-brand-teal mb-2.5">
                            {Array.from({ length: fb.rating || 5 }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                          <p className="text-gray-300 text-xs sm:text-sm font-sans font-light italic leading-relaxed mb-4">
                            "{fb.review}"
                          </p>
                        </div>

                        {/* Author Details */}
                        <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                          <div className="w-8 h-8 rounded-full bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal text-xs font-bold font-mono">
                            {(fb.clientName || 'C').charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">{fb.clientName}</div>
                            <div className="text-[10px] font-mono text-gray-500">{fb.registrationId || 'Verified Client'}</div>
                          </div>
                          <span className="text-[10px] font-mono text-gray-600 ml-auto">{fb.submissionDate}</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Feedback Form */}
              <div className="bg-brand-dark/60 border border-white/5 rounded-xl p-5 sm:p-6">
                <h5 className="font-display font-bold text-sm sm:text-base text-white mb-1">
                  Have you worked with S-CODERS? Share Your Feedback!
                </h5>
                <p className="text-gray-400 text-xs font-sans mb-5">
                  Your feedback helps us continuously elevate our AI, Web, and Mobile software engineering standards.
                </p>

                <form onSubmit={handlePostServiceFeedback} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={feedAuthorName}
                        onChange={(e) => setFeedAuthorName(e.target.value)}
                        placeholder="e.g. Suhas M or Company Name"
                        className="w-full bg-brand-dark/80 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
                        Role / Designation *
                      </label>
                      <input
                        type="text"
                        required
                        value={feedRole}
                        onChange={(e) => setFeedRole(e.target.value)}
                        placeholder="e.g. Client Partner / Product Owner"
                        className="w-full bg-brand-dark/80 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
                      Rating out of 5 Stars *
                    </label>
                    <div className="flex gap-1 py-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedRating(star)}
                          className={`p-1 hover:scale-110 transition-all cursor-pointer ${
                            feedRating >= star ? 'text-brand-teal' : 'text-gray-700'
                          }`}
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
                      Describe Your Service Feedback / Experience *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={feedContent}
                      onChange={(e) => setFeedContent(e.target.value)}
                      placeholder="Share details about the service delivered by S-CODERS (e.g. AI Agent, Mobile App, Website performance, communication)..."
                      className="w-full bg-brand-dark/80 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-brand-teal hover:bg-white text-brand-dark font-bold rounded-lg transition-colors text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 cursor-pointer"
                    >
                      Send Service Testimonial
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

                {feedSubmitSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-brand-teal/10 rounded-lg border border-brand-teal/20 text-xs text-brand-teal text-center font-semibold"
                  >
                    Feedback submitted successfully! Thank you for reviewing S-CODERS services.
                  </motion.div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* --- SERVICE REGISTRATION MODAL --- */}
      <AnimatePresence>
        {registeringService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRegisteringService(null)}
              className="absolute inset-0 bg-brand-dark/85 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md max-h-[90vh] bg-brand-card border border-brand-teal/20 rounded-3xl p-5 sm:p-6 shadow-2xl relative z-10 overflow-hidden flex flex-col"
            >
              {/* Background accent glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-teal/5 blur-3xl rounded-full pointer-events-none" />

              {/* Sticky Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-teal/10 rounded-xl border border-brand-teal/20 text-brand-teal">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-brand-teal uppercase tracking-widest font-bold block">Access Portal</span>
                    <h3 className="font-display font-black text-sm sm:text-base text-white leading-tight">Unlock {registeringService.title}</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRegisteringService(null);
                    setRegSuccessKey(null);
                    setKeyError(null);
                    setInputtedKey('');
                  }}
                  className="p-1.5 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0 relative z-20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body Content */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                {regSuccessKey ? (
                  // SUCCESS STATE
                  <div className="text-center py-4 font-sans">
                    <div className="w-14 h-14 bg-brand-teal/10 border border-brand-teal/25 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-teal">
                      <Sparkles className="w-7 h-7 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-display font-extrabold text-white mb-2">Access Granted!</h3>
                    <p className="text-gray-400 text-xs font-light max-w-sm mx-auto mb-6">
                      Your exclusive developer dispatch key for <strong className="text-white font-semibold">{registeringService.title}</strong> has been minted and secured.
                    </p>

                    <div className="bg-brand-dark/95 border border-brand-teal/20 rounded-2xl p-4 mb-6 max-w-md mx-auto text-center space-y-1 relative">
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">Your Unique License Key</span>
                      <span className="font-mono text-base font-black text-brand-teal select-all block py-2">{regSuccessKey}</span>
                      <button
                        onClick={() => handleCopyKey(regSuccessKey)}
                        className="absolute right-3 top-3 p-1.5 bg-white/5 hover:bg-brand-teal/20 rounded text-gray-400 hover:text-brand-teal transition-all flex items-center gap-1 text-[10px] font-mono cursor-pointer border border-white/5"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setActiveWorkspaceService(registeringService);
                          setRegisteringService(null);
                        }}
                        className="flex-1 py-3 bg-brand-teal hover:bg-white text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Launch Dev Workspace
                      </button>
                      <button
                        onClick={() => setRegisteringService(null)}
                        className="px-5 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ) : (
                  // FORM STATE
                  <div>
                    {/* Toggle Modes */}
                    <div className="grid grid-cols-2 bg-brand-dark/50 p-1 rounded-xl mb-4 border border-white/5 relative z-20">
                      <button
                        type="button"
                        onClick={() => { setModalMode('register'); setKeyError(null); setInputtedKey(''); }}
                        className={`py-2 text-xs font-mono rounded-lg transition-all uppercase cursor-pointer relative z-20 ${
                          modalMode === 'register' ? 'bg-brand-teal text-brand-dark font-bold shadow' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Register New Key
                      </button>
                      <button
                        type="button"
                        onClick={() => { setModalMode('enterKey'); setKeyError(null); setInputtedKey(''); }}
                        className={`py-2 text-xs font-mono rounded-lg transition-all uppercase cursor-pointer relative z-20 ${
                          modalMode === 'enterKey' ? 'bg-brand-teal text-brand-dark font-bold shadow' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Enter Existing Key
                      </button>
                    </div>

                    {modalMode === 'register' ? (
                      <form onSubmit={handleRegisterService} className="space-y-4">
                        {currentUser && (
                          <div className="bg-brand-teal/5 border border-brand-teal/20 rounded-xl p-3 text-xs text-brand-teal flex items-center gap-2 mb-2 font-mono">
                            <Check className="w-4 h-4 shrink-0" />
                            <span>Auto-authenticating with registered account.</span>
                          </div>
                        )}

                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Full Name *</label>
                          <input
                            type="text"
                            required
                            disabled={!!currentUser}
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="e.g. Suhas Gowda"
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all disabled:opacity-60"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Email Address *</label>
                          <input
                            type="email"
                            required
                            disabled={!!currentUser}
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="e.g. customer@btd-hq.in"
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all disabled:opacity-60"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Your Technical Role / College (or Organization) *</label>
                          <input
                            type="text"
                            required
                            value={regRole}
                            onChange={(e) => setRegRole(e.target.value)}
                            placeholder="e.g. Student, PESU / SDE-1, Swiggy"
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Describe Your Requirements *</label>
                          <textarea
                            required
                            rows={2}
                            value={regRequirements}
                            onChange={(e) => setRegRequirements(e.target.value)}
                            placeholder="Please explain the details of the app, website or custom agent you want built."
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all resize-none font-sans"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Approximate Budget *</label>
                            <input
                              type="text"
                              required
                              value={regBudget}
                              onChange={(e) => setRegBudget(e.target.value)}
                              placeholder="e.g. ₹50k - ₹1 Lakh"
                              className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Target Timeline *</label>
                            <input
                              type="text"
                              required
                              value={regTimeline}
                              onChange={(e) => setRegTimeline(e.target.value)}
                              placeholder="e.g. 2-3 Weeks"
                              className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all"
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            className="w-full py-3 bg-brand-teal text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-brand-teal/10"
                          >
                            <Sparkles className="w-3.5 h-3.5 fill-current animate-pulse" />
                            Generate Custom Access Key
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyKey} className="space-y-4 font-sans">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Enter Dispatch Key *</label>
                          <input
                            type="text"
                            required
                            value={inputtedKey}
                            onChange={(e) => {
                              setInputtedKey(e.target.value);
                              setKeyError(null);
                            }}
                            placeholder="Enter your key..."
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all font-mono"
                          />
                        </div>

                        {keyError && (
                          <p className="text-red-400 text-xs font-mono">{keyError}</p>
                        )}

                        <div className="pt-2">
                          <button
                            type="submit"
                            className="w-full py-3 bg-brand-teal text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5" />
                            Verify & Sync Keychain
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ACTIVE SERVICE WORKSPACE (PLAYGROUND) OVERLAY MODAL --- */}
      <AnimatePresence>
        {activeWorkspaceService && (() => {
          const serviceId = activeWorkspaceService.id;
          const regInfo = registeredKeys[serviceId] || { key: 'ENTER-KEY-TO-VERIFY', name: currentUser?.name || 'Authorized Client' };

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-brand-dark/95 backdrop-blur-md"
              />

              {/* Workspace Layout Container */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 30 }}
                className="relative w-full max-w-5xl h-[85vh] bg-[#020516] border border-brand-teal/20 rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col justify-between"
              >
                {/* Visual Header */}
                <div className="p-6 bg-brand-dark/50 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-teal/15 rounded-xl border border-brand-teal/25 text-brand-teal">
                      {getIcon(activeWorkspaceService.icon, "w-5 h-5")}
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-brand-teal uppercase tracking-widest font-bold">Active Service Console</span>
                      <h3 className="font-display font-extrabold text-lg text-white leading-none mt-1">
                        {activeWorkspaceService.title} Workspace
                      </h3>
                    </div>
                  </div>

                  {/* Key and Info indicators */}
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col items-end text-right font-mono">
                      <span className="text-[9px] text-gray-500 uppercase tracking-widest">Licensed to</span>
                      <span className="text-xs text-white font-semibold">{regInfo.name}</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-xl px-3.5 py-1.5 flex items-center gap-2 text-xs font-mono text-brand-teal">
                      <Shield className="w-3.5 h-3.5" />
                      {regInfo.key}
                    </div>
                    <button
                      onClick={() => setActiveWorkspaceService(null)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Main Content Area - Renders custom Project Space Dashboard */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-brand-dark/30">
                  <ServiceProjectSpaceDashboard 
                    service={activeWorkspaceService} 
                    regInfo={regInfo} 
                    onClose={() => setActiveWorkspaceService(null)} 
                  />
                </div>

                {/* Footer action bar */}
                <div className="p-6 bg-brand-dark/40 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-xs text-gray-500 font-sans">
                    💡 This is a live sandboxed prototype matching your actual custom deployment pipeline structure.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleCopyKey(regInfo.key)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white font-mono text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy License Key
                    </button>
                    <button
                      onClick={() => setActiveWorkspaceService(null)}
                      className="px-5 py-2 bg-brand-teal hover:bg-white text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Save & Close Console
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </section>
  );
}

/* ========================================================================== */
/*                INDIVIDUAL HIGH-FIDELITY ACTIVE PLAYGROUNDS                */
/* ========================================================================== */

// 1. AI Agent Development Playground (ID: 'ai')
function AiAgentPlayground() {
  const [selectedTemplate, setSelectedTemplate] = useState('support');
  const [systemPrompt, setSystemPrompt] = useState('You are an expert customer relations manager representing S-CODERS.');
  const [selectedApis, setSelectedApis] = useState<string[]>(['gmail', 'slack']);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [agentStep, setAgentStep] = useState(0);

  const toggleApi = (api: string) => {
    setSelectedApis(prev => 
      prev.includes(api) ? prev.filter(item => item !== api) : [...prev, api]
    );
  };

  const templates = [
    { id: 'support', label: 'E-Commerce Auto-responder', prompt: 'You are an elite, helpful billing advisor. Analyze invoice discrepancies and reply on Gmail.' },
    { id: 'lead', label: 'Lead Classification Pipeline', prompt: 'Parse customer inquiries, score them from 1 to 10 based on criteria, and log high-scoring ones to Hubspot.' },
    { id: 'reconcile', label: 'PDF Invoice Data Extractor', prompt: 'Extract line items from uploaded PDF files, compute total sum taxes, and write records to PostgreSQL.' }
  ];

  const handleTemplateChange = (id: string) => {
    setSelectedTemplate(id);
    const templ = templates.find(t => t.id === id);
    if (templ) setSystemPrompt(templ.prompt);
  };

  const runPipeline = () => {
    setIsRunning(true);
    setTerminalLogs([]);
    setAgentStep(0);
  };

  useEffect(() => {
    if (!isRunning) return;

    const pipelineSteps = [
      `🕒 [${new Date().toLocaleTimeString()}] INITIATING MULTI-AGENT ARCHITECTURE (Gemini 3.5 Flash Model Core)`,
      `⚙️ Loading planning agent instructions: "${systemPrompt.substring(0, 45)}..."`,
      `🔌 Connecting integrated API sockets: [${selectedApis.join(', ').toUpperCase()}]`,
      `🔍 [AGENT STEP 1] Parsing payload schema trigger criteria...`,
      `🧠 [AGENT STEP 2] Thinking: "Received new inquiry. Plan: Check knowledge base database, formulate email draft, send QA alert."`,
      `💾 [AGENT STEP 3] Querying central documentation vector vector space... (Fetched 3 high-probability text match frames)`,
      `📝 [AGENT STEP 4] Running LLM synthesis loop for output drafting (364 output tokens generated)`,
      selectedApis.includes('slack') ? `💬 [AGENT STEP 5: TOOL TRIGGERED] Pushing notification payload card to #dispatch-qa channel on Slack...` : null,
      selectedApis.includes('gmail') ? `📧 [AGENT STEP 6: TOOL TRIGGERED] Formulating dynamic API payload and sending response email...` : null,
      `✅ [${new Date().toLocaleTimeString()}] Pipeline execution completed successfully. Status: 200 OK. Total execution time: 1.84s`
    ].filter(Boolean) as string[];

    if (agentStep < pipelineSteps.length) {
      const timer = setTimeout(() => {
        setTerminalLogs(prev => [...prev, pipelineSteps[agentStep]]);
        setAgentStep(prev => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setIsRunning(false);
    }
  }, [isRunning, agentStep]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full font-sans">
      {/* Left controls panel */}
      <div className="lg:col-span-5 bg-brand-dark/40 border border-white/5 rounded-2xl p-5 space-y-5">
        <div className="flex items-center gap-2 text-brand-teal font-mono text-[10px] font-bold tracking-widest uppercase">
          <Settings className="w-3.5 h-3.5" />
          Pipeline Configurations
        </div>

        {/* Template Selector */}
        <div className="space-y-2">
          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider font-bold">Select Agent Template</label>
          <div className="space-y-2">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => handleTemplateChange(t.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-xs transition-all cursor-pointer ${
                  selectedTemplate === t.id
                    ? 'bg-brand-teal/10 border-brand-teal text-white font-bold'
                    : 'bg-brand-dark/60 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider font-bold">Base Agent Persona Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full bg-brand-dark/70 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-teal h-24 resize-none leading-relaxed"
          />
        </div>

        {/* Tools integrations checkboxes */}
        <div className="space-y-2">
          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider font-bold font-bold">Mount Third-party API Tools</label>
          <div className="grid grid-cols-3 gap-2">
            {['gmail', 'slack', 'hubspot'].map(api => {
              const active = selectedApis.includes(api);
              return (
                <button
                  key={api}
                  onClick={() => toggleApi(api)}
                  className={`py-2 text-xs font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                    active 
                      ? 'bg-brand-teal border-brand-teal text-brand-dark shadow-sm' 
                      : 'bg-brand-dark/60 border-white/5 text-gray-500 hover:text-white'
                  }`}
                >
                  {api}
                </button>
              );
            })}
          </div>
        </div>

        {/* Trigger Execute */}
        <button
          onClick={runPipeline}
          disabled={isRunning}
          className="w-full py-3 bg-brand-teal hover:bg-white text-brand-dark font-display font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-brand-teal/15"
        >
          {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          {isRunning ? 'Running Simulation Loop...' : 'Trigger Agent Execution'}
        </button>
      </div>

      {/* Right logger stream */}
      <div className="lg:col-span-7 bg-[#02040b] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[52vh] sm:h-full">
        {/* Top bar */}
        <div className="bg-brand-dark/80 px-4 py-2.5 border-b border-white/5 flex items-center justify-between text-xs text-gray-500">
          <span className="font-mono flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            Agent Core Terminal Log
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ONLINE
          </span>
        </div>

        {/* Logs viewport */}
        <div className="flex-1 p-5 font-mono text-[11px] space-y-2 overflow-y-auto leading-relaxed text-emerald-300">
          {terminalLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-600">
              <Terminal className="w-8 h-8 mb-2 stroke-1" />
              <p>Terminal idle. Setup configurations and trigger the pipeline execution loop above!</p>
            </div>
          ) : (
            terminalLogs.map((log, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className={log.includes('completed') ? 'text-emerald-400 font-extrabold pt-2' : log.includes('🚨') || log.includes('🕒') ? 'text-white font-semibold' : ''}
              >
                {log}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// 2. Mobile Application Previewer (ID: 'mobile')
function MobileAppPlayground() {
  const [activeScreen, setActiveScreen] = useState<'scan' | 'fitness' | 'invoice'>('scan');
  
  // App-specific mock states
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [workoutActive, setWorkoutActive] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [workoutCalories, setWorkoutCalories] = useState(0);
  const [splitResult, setSplitResult] = useState<string | null>(null);
  const [billAmount, setBillAmount] = useState('1500');
  const [peopleCount, setPeopleCount] = useState('3');

  // Scanner timer
  const runScan = () => {
    setScanState('scanning');
    setTimeout(() => {
      setScanState('success');
    }, 2500);
  };

  // Workout timer
  useEffect(() => {
    let interval: any = null;
    if (workoutActive) {
      interval = setInterval(() => {
        setWorkoutTime(prev => prev + 1);
        setWorkoutCalories(prev => prev + Math.floor(Math.random() * 2) + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [workoutActive]);

  const handleCalculateSplit = () => {
    const amt = parseFloat(billAmount);
    const ppl = parseInt(peopleCount);
    if (!isNaN(amt) && !isNaN(ppl) && ppl > 0) {
      const perPerson = amt / ppl;
      setSplitResult(`₹${perPerson.toFixed(2)} per developer`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full font-sans">
      {/* Left sidebar controller */}
      <div className="lg:col-span-5 bg-brand-dark/40 border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-brand-teal font-mono text-[10px] font-bold tracking-widest uppercase">
          <Smartphone className="w-3.5 h-3.5" />
          Preview Mobile Sockets
        </div>

        <p className="text-gray-400 text-xs font-light leading-relaxed">
          S-CODERS constructs advanced cross-platform React Native apps. Switch between mock modules below to experience fluid client-ready app structures:
        </p>

        {/* Screen selectors */}
        <div className="space-y-2">
          {[
            { id: 'scan', title: 'AgroSmart Scan Engine', desc: 'Real-time agricultural leaf diagnostic simulation' },
            { id: 'fitness', title: 'FitSync Active Logger', desc: 'Real-time workout heartrate and community logs' },
            { id: 'invoice', title: 'FinFlow Split Checkout', desc: 'Enterprise Razorpay split billing calculator' },
          ].map(scr => (
            <button
              key={scr.id}
              onClick={() => {
                setActiveScreen(scr.id as any);
                setScanState('idle');
                setWorkoutActive(false);
                setWorkoutTime(0);
                setWorkoutCalories(0);
                setSplitResult(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl border text-xs transition-all cursor-pointer ${
                activeScreen === scr.id
                  ? 'bg-brand-teal/10 border-brand-teal text-white font-bold'
                  : 'bg-brand-dark/60 border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <div className="font-semibold">{scr.title}</div>
              <div className="text-[10px] text-gray-500 font-normal font-sans mt-0.5">{scr.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right iPhone viewport */}
      <div className="lg:col-span-7 flex justify-center items-center py-4 bg-[#010309] rounded-2xl border border-white/5 min-h-[50vh]">
        {/* Smartphone container */}
        <div className="w-[280px] h-[480px] bg-brand-dark rounded-[40px] border-[6px] border-gray-800 shadow-2xl relative flex flex-col justify-between overflow-hidden">
          {/* Top Speaker Slot */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-gray-800 rounded-full z-20 flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-black rounded-full" />
          </div>

          {/* Screen Content */}
          <div className="flex-1 bg-[#090b14] pt-8 px-4 flex flex-col justify-between text-white relative">
            
            {/* Screen Header */}
            <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 mb-4 border-b border-white/5 pb-2">
              <span className="font-bold">BTD NETWORK</span>
              <span>100% Core</span>
            </div>

            {/* SCREEN-SPECIFIC DESIGNS */}
            <div className="flex-grow flex flex-col justify-between">
              
              {/* SCREEN 1: Crop Scanner */}
              {activeScreen === 'scan' && (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="text-center">
                    <span className="text-[8px] tracking-wider font-mono text-brand-teal uppercase font-bold">AgroSmart S-2</span>
                    <h4 className="text-sm font-bold mt-1">Leaf Disease Scan</h4>
                  </div>

                  {/* Scanning area viewport */}
                  <div className="my-4 h-32 bg-gray-900 rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center">
                    {scanState === 'idle' && (
                      <div className="text-center p-3">
                        <p className="text-[10px] text-gray-400">Scan Crop Leaf Leaf to diagnose fungal anomalies</p>
                      </div>
                    )}
                    
                    {scanState === 'scanning' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-dark/80">
                        {/* Interactive scan line */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-brand-teal animate-bounce" />
                        <RefreshCw className="w-6 h-6 text-brand-teal animate-spin mb-1.5" />
                        <span className="text-[9px] font-mono tracking-wider">AI DIAGNOSING...</span>
                      </div>
                    )}

                    {scanState === 'success' && (
                      <div className="absolute inset-0 bg-brand-teal/5 p-3 flex flex-col justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 text-brand-teal font-bold font-mono text-[9px]">
                          <CheckCircle className="w-3.5 h-3.5" />
                          DIAGNOSIS COMPLETE
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">Rust Fungus (Puccinia)</p>
                          <p className="text-gray-400 text-[9px] mt-0.5">Confidence: 94.6%</p>
                        </div>
                        <p className="text-[8px] text-gray-400 border-t border-white/5 pt-1.5 leading-snug">
                          Recommendation: Copper fungicides with customized irrigation.
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={runScan}
                    disabled={scanState === 'scanning'}
                    className="w-full py-2 bg-brand-teal hover:bg-white text-brand-dark font-display font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    {scanState === 'scanning' ? 'Analysing Crop...' : 'Simulate Leaf Camera Scan'}
                  </button>
                </div>
              )}

              {/* SCREEN 2: Fitness Active Tracker */}
              {activeScreen === 'fitness' && (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="text-center">
                    <span className="text-[8px] tracking-wider font-mono text-brand-coral uppercase font-bold">FitSync S-Card</span>
                    <h4 className="text-sm font-bold mt-1">CrossFit Active Session</h4>
                  </div>

                  {/* Active telemetry logs */}
                  <div className="my-4 bg-white/5 p-4 rounded-2xl border border-white/5 text-center space-y-1">
                    <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest font-bold">Duration Time</p>
                    <p className="font-mono text-xl font-bold text-white">
                      00:{workoutTime < 10 ? `0${workoutTime}` : workoutTime}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 text-xs">
                      <div>
                        <p className="text-[8px] text-gray-500 font-mono">CALORIES</p>
                        <p className="font-bold text-brand-coral">{workoutCalories} kcal</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-gray-500 font-mono">HEARTRATE</p>
                        <p className="font-bold text-emerald-400">{workoutActive ? 120 + Math.floor(Math.random() * 25) : 74} BPM</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setWorkoutActive(prev => !prev)}
                    className={`w-full py-2 font-display font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      workoutActive ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-brand-teal hover:bg-white text-brand-dark'
                    }`}
                  >
                    {workoutActive ? 'Stop Session' : 'Start Active Workout'}
                  </button>
                </div>
              )}

              {/* SCREEN 3: Invoice Splits */}
              {activeScreen === 'invoice' && (
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div className="text-center">
                    <span className="text-[8px] tracking-wider font-mono text-brand-teal uppercase font-bold">FinFlow Billing</span>
                    <h4 className="text-sm font-bold mt-1">SaaS Split Invoice</h4>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-gray-500 uppercase font-bold">Total Bill Amount (₹)</label>
                      <input
                        type="text"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-teal"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-gray-500 uppercase font-bold">Divide Between (No. of People)</label>
                      <input
                        type="text"
                        value={peopleCount}
                        onChange={(e) => setPeopleCount(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-teal"
                      />
                    </div>
                    
                    {splitResult && (
                      <div className="p-2 bg-brand-teal/10 rounded border border-brand-teal/20 text-center text-brand-teal font-mono text-[10px] font-bold">
                        {splitResult}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCalculateSplit}
                    className="w-full py-2 bg-brand-teal hover:bg-white text-brand-dark font-display font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Calculate Split Pay
                  </button>
                </div>
              )}

            </div>

            {/* Bottom Indicator Bar */}
            <div className="py-2 flex justify-center">
              <span className="w-16 h-1 bg-gray-800 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. Website Theme Customizer Playground (ID: 'web')
function WebsiteStylerPlayground() {
  const [accent, setAccent] = useState<'neon' | 'mint' | 'coral' | 'gold'>('neon');
  const [layout, setLayout] = useState<'bento' | 'split'>('bento');
  const [font, setFont] = useState<'sans' | 'mono'>('sans');
  const [tab, setTab] = useState<'preview' | 'code'>('preview');

  const accentColors = {
    neon: { border: 'border-indigo-500', text: 'text-indigo-400', bg: 'bg-indigo-500', hex: '#6366f1', glow: 'shadow-indigo-500/10' },
    mint: { border: 'border-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500', hex: '#10b981', glow: 'shadow-emerald-500/10' },
    coral: { border: 'border-orange-500', text: 'text-orange-400', bg: 'bg-orange-500', hex: '#f97316', glow: 'shadow-orange-500/10' },
    gold: { border: 'border-amber-500', text: 'text-amber-400', bg: 'bg-amber-500', hex: '#f59e0b', glow: 'shadow-amber-500/10' },
  };

  const codeTemplate = `import React from 'react';

export default function CustomLandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white font-${font === 'sans' ? 'sans' : 'mono'}">
      {/* Dynamic Navigation */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5">
        <span className="text-xl font-black tracking-tight text-white uppercase">
          LAUNCH<span style={{ color: '${accentColors[accent].hex}' }}>X</span>
        </span>
        <button className="px-4 py-2 text-xs font-mono tracking-widest uppercase bg-white/5 hover:bg-white/10 rounded-lg transition-all">
          Launch App
        </button>
      </header>

      {/* Main Core Section */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        ${layout === 'bento' ? `
        {/* Bento Box Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white/5 border border-white/5 p-8 rounded-3xl">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Next-Generation Digital <span style={{ color: '${accentColors[accent].hex}' }}>Capabilities</span>
            </h1>
          </div>
          <div className="bg-white/5 border border-white/5 p-8 rounded-3xl">
            <p className="text-sm text-gray-400">Autonomous pipelines scaled instantly.</p>
          </div>
        </div>
        ` : `
        {/* Split Container Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl font-black tracking-tight leading-none mb-4">
              Infinite Scale <span style={{ color: '${accentColors[accent].hex}' }}>Unified</span>
            </h1>
            <p className="text-gray-400 text-sm">Deploy high-concurrency clusters on cloud storage easily.</p>
          </div>
          <div className="bg-white/5 border border-white/5 p-8 rounded-3xl h-64">
            <span className="text-[9px] font-mono tracking-wider text-gray-500 uppercase block mb-1">Interactive Telemetry</span>
          </div>
        </div>
        `}
      </main>
    </div>
  );
}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full font-sans">
      {/* Control Pane */}
      <div className="lg:col-span-5 bg-brand-dark/40 border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-brand-teal font-mono text-[10px] font-bold tracking-widest uppercase">
          <Layout className="w-3.5 h-3.5" />
          Style Configurator
        </div>

        {/* Color Toggles */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">Theme Primary Color</label>
          <div className="grid grid-cols-4 gap-2">
            {(['neon', 'mint', 'coral', 'gold'] as const).map(color => (
              <button
                key={color}
                onClick={() => setAccent(color)}
                className={`py-2 text-xs font-semibold capitalize rounded-lg border transition-all cursor-pointer ${
                  accent === color
                    ? 'bg-brand-teal/10 border-brand-teal text-white'
                    : 'bg-brand-dark/60 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* Layout Selector */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold font-bold">Visual Wireframe Layout</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'bento', label: 'Bento Grid System' },
              { id: 'split', label: 'Split Columns Hero' }
            ].map(lay => (
              <button
                key={lay.id}
                onClick={() => setLayout(lay.id as any)}
                className={`py-2 px-3 text-xs text-left rounded-lg border transition-all cursor-pointer ${
                  layout === lay.id
                    ? 'bg-brand-teal/10 border-brand-teal text-white font-bold'
                    : 'bg-brand-dark/60 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {lay.label}
              </button>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">System Font Hierarchy</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'sans', label: 'Inter Sans-serif' },
              { id: 'mono', label: 'JetBrains Monospace' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFont(f.id as any)}
                className={`py-2 px-3 text-xs text-left rounded-lg border transition-all cursor-pointer ${
                  font === f.id
                    ? 'bg-brand-teal/10 border-brand-teal text-white font-bold'
                    : 'bg-brand-dark/60 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Render/Code View */}
      <div className="lg:col-span-7 bg-[#02040a] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[52vh] sm:h-full">
        {/* Toggle View Tabs */}
        <div className="bg-brand-dark/80 px-4 py-2 border-b border-white/5 flex items-center justify-between text-xs text-gray-400">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('preview')}
              className={`px-3 py-1 rounded text-xs cursor-pointer ${
                tab === 'preview' ? 'bg-white/10 text-white font-bold' : 'hover:text-white'
              }`}
            >
              Live Render Preview
            </button>
            <button
              onClick={() => setTab('code')}
              className={`px-3 py-1 rounded text-xs cursor-pointer ${
                tab === 'code' ? 'bg-white/10 text-white font-bold' : 'hover:text-white'
              }`}
            >
              Export Code Boilerplate
            </button>
          </div>
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Web Engine S-3</span>
        </div>

        {/* Render Viewport */}
        <div className="flex-grow overflow-y-auto p-5">
          {tab === 'preview' ? (
            <div className={`h-full min-h-[30vh] bg-gray-950 border border-white/5 rounded-2xl p-6 font-${font} transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-2xl ${accentColors[accent].glow}`}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className={`text-sm font-black tracking-widest uppercase ${accentColors[accent].text}`}>
                  LAUNCH<span className="text-white">X</span>
                </span>
                <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Secure Client Node</span>
              </div>

              {/* Main Dynamic Block */}
              {layout === 'bento' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                  <div className="sm:col-span-2 bg-white/5 border border-white/5 p-4 rounded-xl">
                    <h4 className="text-sm sm:text-base font-extrabold tracking-tight">
                      Next-Generation Digital <span className={accentColors[accent].text}>Capabilities</span>
                    </h4>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center">
                    <p className="text-[10px] text-gray-400">Autonomous pipelines scaled instantly.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 items-center">
                  <div>
                    <h4 className="text-base font-black tracking-tight leading-none mb-1">
                      Infinite Scale <span className={accentColors[accent].text}>Unified</span>
                    </h4>
                    <p className="text-gray-400 text-[10px] leading-relaxed">Deploy high-concurrency clusters on cloud storage easily.</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-3 rounded-xl h-20 flex flex-col justify-between">
                    <span className="text-[7px] font-mono tracking-wider text-gray-500 uppercase block">Active telemetry</span>
                    <span className="text-xs font-bold text-emerald-400">99.98% uptime status</span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button className={`w-full py-2 font-mono text-[9px] uppercase tracking-widest text-white rounded-lg transition-all ${accentColors[accent].bg} hover:scale-102`}>
                Deploy Cloud Assets
              </button>
            </div>
          ) : (
            <pre className="p-4 bg-brand-dark rounded-xl text-[10px] text-gray-400 overflow-x-auto h-full font-mono">
              <code>{codeTemplate}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

// 4. Cloud Server REST Client Console Playground (ID: 'software')
function ApiClientPlayground() {
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [endpoint, setEndpoint] = useState('/api/v1/database/users');
  const [isRequesting, setIsRequesting] = useState(false);
  const [responseCode, setResponseCode] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseJson, setResponseJson] = useState<string | null>(null);

  const endpointConfigs = {
    '/api/v1/database/users': {
      GET: {
        response: {
          status: 'success',
          usersCount: 4,
          results: [
            { id: 'usr_879a', name: 'Bhuvan M', role: 'Premium Client', company: 'S-CODERS • Bharath Tech Developers' },
            { id: 'usr_102d', name: 'Suhas Gowda', role: 'System Admin', company: 'S-CODERS HQ' },
            { id: 'usr_443c', name: 'Aishwarya S', role: 'Instructor Lead', company: 'Microsoft Reactor' },
            { id: 'usr_901e', name: 'Manoj Kumar', role: 'Developer Lead', company: 'S-CODERS Core' }
          ]
        },
        payload: ''
      },
      POST: {
        response: {
          status: 'success',
          message: 'Client added to dispatcher queue successfully',
          assignedCluster: 'bengaluru-node-alpha',
          timestamp: new Date().toISOString()
        },
        payload: JSON.stringify({ name: 'Naveen Rao', email: 'naveen@startup.in', role: 'client' }, null, 2)
      }
    },
    '/api/v1/payments/split': {
      GET: {
        response: {
          status: 'success',
          activeTransfers: 2,
          routeConfiguration: { merchantId: 'merch_razor_982B', settlementCycle: 'T+1 split route' }
        },
        payload: ''
      },
      POST: {
        response: {
          status: 'success',
          transactionId: 'TXN-RAZOR-908123A',
          transfersLinked: [
            { id: 'sub_pay_1', recipient: 'Suhas Gowda', amount: 15000, status: 'transferred' },
            { id: 'sub_pay_2', recipient: 'Prathiksha R', amount: 10000, status: 'transferred' }
          ]
        },
        payload: JSON.stringify({ invoiceId: 'INV-2026-004', amount: 25000, recipientSplits: ['suhas', 'prathiksha'] }, null, 2)
      }
    }
  };

  const handleSend = () => {
    setIsRequesting(true);
    setResponseCode(null);
    setResponseJson(null);

    setTimeout(() => {
      const config = endpointConfigs[endpoint as keyof typeof endpointConfigs];
      const details = config ? config[method] : { response: { error: 'Not Found' } };
      setResponseCode(200);
      setResponseTime(Math.floor(Math.random() * 18) + 12);
      setResponseJson(JSON.stringify(details.response, null, 2));
      setIsRequesting(false);
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full font-sans">
      {/* Control panel */}
      <div className="lg:col-span-5 bg-brand-dark/40 border border-white/5 rounded-2xl p-5 space-y-4 text-xs">
        <div className="flex items-center gap-2 text-brand-teal font-mono text-[10px] font-bold tracking-widest uppercase">
          <Database className="w-3.5 h-3.5" />
          Request Composer
        </div>

        {/* Method & Endpoint selection */}
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className="bg-brand-dark border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-teal font-mono uppercase font-bold"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>

          <select
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="flex-1 bg-brand-dark border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-teal font-mono"
          >
            <option value="/api/v1/database/users">/api/v1/database/users</option>
            <option value="/api/v1/payments/split">/api/v1/payments/split</option>
          </select>
        </div>

        {/* Body input if POST */}
        {method === 'POST' && (
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">Request JSON Payload Body</label>
            <pre className="p-3 bg-brand-dark/80 rounded-xl text-[10px] text-gray-400 font-mono overflow-x-auto border border-white/5">
              <code>{endpointConfigs[endpoint as keyof typeof endpointConfigs]?.POST?.payload || '{}'}</code>
            </pre>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={isRequesting}
          className="w-full py-3 bg-brand-teal hover:bg-white text-brand-dark font-display font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-brand-teal/15"
        >
          {isRequesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          {isRequesting ? 'Resolving Network Node...' : 'Send REST request'}
        </button>
      </div>

      {/* Response viewport */}
      <div className="lg:col-span-7 bg-[#02040b] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[52vh] sm:h-full">
        {/* Top bar status */}
        <div className="bg-brand-dark/80 px-4 py-2 border-b border-white/5 flex items-center justify-between text-xs text-gray-500">
          <span className="font-mono flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-brand-teal" />
            Response Viewer
          </span>
          {responseCode && (
            <div className="flex gap-3 text-[10px] font-mono font-bold">
              <span className="text-emerald-400">STATUS: {responseCode} OK</span>
              <span className="text-gray-500">TIME: {responseTime}ms</span>
            </div>
          )}
        </div>

        {/* Console view */}
        <div className="flex-1 p-5 font-mono text-[11px] overflow-y-auto leading-relaxed text-emerald-300">
          {isRequesting ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-600">
              <RefreshCw className="w-8 h-8 mb-2 animate-spin text-brand-teal" />
              <p>Contacting server node gateway...</p>
            </div>
          ) : responseJson ? (
            <pre className="h-full"><code>{responseJson}</code></pre>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-600">
              <Database className="w-8 h-8 mb-2 stroke-1" />
              <p>Console idle. Compile parameters and click "Send REST Request" above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 5. UI/UX Wireframe Prototype Workspace Playground (ID: 'design')
function DesignSystemPlayground() {
  const [radius, setRadius] = useState<number>(12);
  const [padding, setPadding] = useState<number>(24);
  const [shadow, setShadow] = useState<'none' | 'small' | 'glowing'>('glowing');
  const [theme, setTheme] = useState<'blueprint' | 'slate'>('slate');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full font-sans text-xs">
      {/* Sidebar Controller */}
      <div className="lg:col-span-5 bg-brand-dark/40 border border-white/5 rounded-2xl p-5 space-y-5">
        <div className="flex items-center gap-2 text-brand-teal font-mono text-[10px] font-bold tracking-widest uppercase">
          <Palette className="w-3.5 h-3.5" />
          Figma Token Inspector
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-[10px] text-gray-500">
              <span>BORDER RADIUS (px)</span>
              <span className="text-brand-teal font-bold">{radius}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={32}
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full accent-brand-teal bg-white/10 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-[10px] text-gray-500">
              <span>CARD PADDING (px)</span>
              <span className="text-brand-teal font-bold">{padding}px</span>
            </div>
            <input
              type="range"
              min={12}
              max={44}
              value={padding}
              onChange={(e) => setPadding(parseInt(e.target.value))}
              className="w-full accent-brand-teal bg-white/10 rounded-lg cursor-pointer h-1.5"
            />
          </div>
        </div>

        {/* Shadows toggles */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">Shadow Elevation Glow</label>
          <div className="grid grid-cols-3 gap-2">
            {(['none', 'small', 'glowing'] as const).map(sh => (
              <button
                key={sh}
                onClick={() => setShadow(sh)}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  shadow === sh
                    ? 'bg-brand-teal/10 border-brand-teal text-white'
                    : 'bg-brand-dark/60 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {sh}
              </button>
            ))}
          </div>
        </div>

        {/* Blueprint Theme toggles */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">Workspace Viewport Preset</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'slate', label: 'High Contrast Slate' },
              { id: 'blueprint', label: 'Technical Blueprint Blueprint' }
            ].map(thm => (
              <button
                key={thm.id}
                onClick={() => setTheme(thm.id as any)}
                className={`py-2 px-3 text-xs text-left rounded-lg border transition-all cursor-pointer ${
                  theme === thm.id
                    ? 'bg-brand-teal/10 border-brand-teal text-white font-bold'
                    : 'bg-brand-dark/60 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {thm.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Render Canvas */}
      <div className="lg:col-span-7 flex items-center justify-center py-6 bg-[#010309] border border-white/5 rounded-2xl relative min-h-[40h] sm:min-h-[50vh] overflow-hidden">
        {/* Dynamic Canvas styling based on selections */}
        <div
          className="w-full max-w-sm transition-all duration-300"
          style={{
            borderRadius: `${radius}px`,
            padding: `${padding}px`,
            backgroundColor: theme === 'blueprint' ? '#001c40' : '#0e111d',
            border: theme === 'blueprint' ? '1.5px dashed #00ffff' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: shadow === 'glowing' ? '0 10px 40px -10px rgba(13,245,227,0.18)' : shadow === 'small' ? '0 4px 12px rgba(0,0,0,0.5)' : 'none'
          }}
        >
          {/* Mock element inside custom card container */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${theme === 'blueprint' ? 'bg-[#00ffff]/10 border border-[#00ffff] text-[#00ffff]' : 'bg-brand-teal/10 border border-brand-teal/20 text-brand-teal'}`}>
              B
            </div>
            <div>
              <h4 className="font-bold text-white leading-none">Dynamic Card Container</h4>
              <span className="text-[8px] font-mono text-gray-500 uppercase mt-0.5 block">Interactive UI Blueprint</span>
            </div>
          </div>

          <p className="text-gray-400 text-xs font-light leading-relaxed mb-4">
            Interact with the Token controllers on the left. The custom React card component container adapts dynamically in real-time, matching spacing parameters.
          </p>

          <div className="flex gap-2">
            <button className={`px-4 py-2 text-[10px] font-mono tracking-widest uppercase rounded-lg transition-all font-bold ${theme === 'blueprint' ? 'bg-[#00ffff]/15 border border-[#00ffff] text-[#00ffff]' : 'bg-brand-teal text-brand-dark'}`}>
              Settle
            </button>
            <button className="px-4 py-2 text-[10px] font-mono tracking-widest uppercase rounded-lg bg-white/5 border border-white/5 text-gray-400">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. S-CODERS Intelligent Consultation Advisor Playground (ID: 'workshops')
function ConsultancyAdvisorPlayground() {
  const [frontend, setFrontend] = useState('react');
  const [backend, setBackend] = useState('express');
  const [db, setDb] = useState('postgres');
  const [problem, setProblem] = useState('scaling');
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposal, setProposal] = useState('');

  const generateProposal = () => {
    setIsGenerating(true);
    setProposal('');

    const template = `### 📋 BTD CUSTOM ENGINEERING ARCHITECTURE PROPOSAL

**Target Objective**: Resolve key bottlenecks regarding **${problem.toUpperCase()}** using high-concurrency systems.

---

### 🏛️ Proposed Technical Stack
- **Frontend Layer**: **${frontend.toUpperCase()}** structured with responsive styling, server-side render compilation, and fluid Framer Motion transitions.
- **Backend Architecture**: **${backend.toUpperCase()}** structured as a modular REST API, mounting secure auth middleware, and proxying Gemini queries.
- **Data Persistence**: **${db.toUpperCase()}** cluster backed by automated backups, optimized connection pools, and strict indexing.

---

### 🛡️ Core Recommended Implementation Steps:
1. **Lazy SDK Initialization**: Restructure database connections and third-party secrets securely using environment configurations to prevent server crashes.
2. **Reverse Proxying**: Forward all external client operations cleanly through Express routes to maintain secret API credentials client-side.
3. **Caching Gateway**: Mitigate heavy read traffic by establishing a caching layer with automated TTL policies.
4. **Queue Dispatcher**: Decouple heavy calculations by creating background worker threads.

---

*Prepared by Suhas Gowda & the S-CODERS • Bharath Tech Developers technical board.*`;

    let cursor = 0;
    const interval = setInterval(() => {
      setProposal(prev => prev + template.charAt(cursor));
      cursor++;
      if (cursor >= template.length) {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 12);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full font-sans text-xs">
      {/* Form column */}
      <div className="lg:col-span-5 bg-brand-dark/40 border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-brand-teal font-mono text-[10px] font-bold tracking-widest uppercase">
          <Users className="w-3.5 h-3.5" />
          Technical Questionnaire
        </div>

        {/* Dropdowns selection */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[8px] font-mono text-gray-500 uppercase font-bold">Frontend Stack</label>
            <select
              value={frontend}
              onChange={(e) => setFrontend(e.target.value)}
              className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="react">React / Vite</option>
              <option value="nextjs">Next.js</option>
              <option value="react-native">React Native</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-mono text-gray-500 uppercase font-bold font-bold">Backend Stack</label>
            <select
              value={backend}
              onChange={(e) => setBackend(e.target.value)}
              className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="express">Express.js</option>
              <option value="fastapi">FastAPI</option>
              <option value="n8n">n8n Automations</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-mono text-gray-500 uppercase font-bold">Database Persistence</label>
            <select
              value={db}
              onChange={(e) => setDb(e.target.value)}
              className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="postgres">PostgreSQL</option>
              <option value="firestore">Firestore</option>
              <option value="mongodb">MongoDB</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-mono text-gray-500 uppercase font-bold">Business Friction</label>
            <select
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="scaling">Uptime / Scaling</option>
              <option value="manual ops">Manual Operations</option>
              <option value="low conversions">Low Conversions</option>
            </select>
          </div>
        </div>

        <button
          onClick={generateProposal}
          disabled={isGenerating}
          className="w-full py-3 bg-brand-teal hover:bg-white text-brand-dark font-display font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-brand-teal/15"
        >
          {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          {isGenerating ? 'Mapping Architectures...' : 'Generate Architecture Proposal'}
        </button>
      </div>

      {/* Output proposal */}
      <div className="lg:col-span-7 bg-[#02040b] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[52vh] sm:h-full">
        <div className="bg-brand-dark/80 px-4 py-2 border-b border-white/5 flex items-center justify-between text-xs text-gray-500">
          <span className="font-mono flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-brand-teal" />
            Proposal Render Output
          </span>
          <span className="font-mono text-[9px] tracking-widest text-emerald-400 font-bold uppercase">
            COMPILING
          </span>
        </div>

        <div className="flex-grow p-6 overflow-y-auto font-sans leading-relaxed text-slate-300 select-text text-xs whitespace-pre-wrap max-h-72 sm:max-h-none">
          {proposal ? (
            <div className="space-y-3 prose prose-invert prose-xs">{proposal}</div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-600">
              <Laptop className="w-8 h-8 mb-2 stroke-1" />
              <p>Proposal stream idle. Fill out technical questionnaires and trigger the compilation advisor above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*                S-CODERS CLIENT PROJECT SPACE DASHBOARD                     */
/* ========================================================================== */
export function ServiceProjectSpaceDashboard({ 
  service, 
  regInfo, 
  onClose 
}: { 
  service: any; 
  regInfo: any; 
  onClose: () => void; 
}) {
  // Live Chat state
  const [messages, setMessages] = useState<Array<{ sender: 'client' | 'scoders'; text: string; time: string }>>([
    {
      sender: 'scoders',
      text: `Hello ${regInfo.name}! Welcome to your S-CODERS custom project space. We've initialized analysis for your ${service.title} project based on your registered budget of ${regInfo.budget || 'TBD'} and timeline of ${regInfo.timeline || 'TBD'}. Our expert team is reviewing the requirements.`,
      time: 'Just Now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  
  // Feedback Form State
  const [feedName, setFeedName] = useState(regInfo.name || '');
  const [feedEmail, setFeedEmail] = useState(regInfo.email || '');
  const [feedRole, setFeedRole] = useState(regInfo.role || '');
  const [feedRating, setFeedRating] = useState(5);
  const [feedExperience, setFeedExperience] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // File download simulation
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { sender: 'client', text: userMsg, time: nowStr }]);
    setInputText('');

    // Simulate smart team response after 1.5 seconds
    setTimeout(() => {
      const responses = [
        "That sounds like an excellent design consideration! I've added this detail directly to our technical spec sheet. Suhas will address this in our next Zoom meet.",
        "Understood. We are aligning the UI layouts accordingly. I'll ask Suhas to update the progress PDFs so you can review the change shortly.",
        "Perfect. Regarding the timeline, we can expedite the database schema creation to match your requirements. I will WhatsApp you with a draft link.",
        "Received. Suhas is currently writing the core AI routing graph. We will showcase the functional prototype during our next milestone demo!"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { sender: 'scoders', text: randomResponse, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1500);
  };

  const handleDownload = (fileName: string) => {
    setDownloadingFile(fileName);
    setDownloadProgress(0);
    const interval = setInterval(() => {
      setDownloadProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setDownloadingFile(null), 1000);
          return 100;
        }
        return p + 20;
      });
    }, 150);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedName || !feedEmail || !feedExperience) return;

    const feedbackItem = {
      id: Date.now().toString(),
      serviceId: service.id,
      serviceTitle: service.title,
      name: feedName,
      email: feedEmail,
      role: feedRole,
      rating: feedRating,
      experience: feedExperience,
      timestamp: new Date().toLocaleDateString()
    };

    // Save to local storage feedback collection
    const existing = JSON.parse(localStorage.getItem('scoders_feedbacks') || '[]');
    localStorage.setItem('scoders_feedbacks', JSON.stringify([feedbackItem, ...existing]));

    setFeedbackSuccess(true);
    setFeedExperience('');
    setTimeout(() => setFeedbackSuccess(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-white font-sans max-h-[70vh]">
      {/* LEFT COLUMN: CONTACT DETAILS & LIFECYCLE PROGRESS */}
      <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Status badge */}
          <div className="bg-[#25d366]/5 border border-[#25d366]/20 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#25d366] animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#25d366]">PROJECT LIFE-CYCLE ACTIVE</span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">No Upfront Payment Required</h4>
            <p className="text-gray-400 text-xs leading-relaxed">
              Your registered project budget (<strong>{regInfo.budget || 'TBD'}</strong>) and timeline is being analyzed by our team. Price is determined dynamically after aligning requirements. We will connect with you via Call / WhatsApp and Zoom meeting to coordinate.
            </p>
          </div>

          {/* S-CODERS Professional Team contacts */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono text-gray-500 uppercase tracking-widest font-bold">S-CODERS EXPERT TEAM CONTACTS</h4>
            
            {/* Suhas Gowda */}
            <div className="bg-white/5 border border-white/5 p-3.5 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="text-sm font-bold text-white leading-tight">Suhas Gowda</h5>
                  <span className="text-[10px] text-brand-teal font-mono uppercase tracking-widest">Lead AI Architect & Developer</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                <a href="tel:+919876543210" className="py-1.5 bg-brand-teal/10 hover:bg-brand-teal hover:text-brand-dark rounded text-brand-teal transition-all flex items-center justify-center gap-1">
                  <Phone className="w-3 h-3" /> Call
                </a>
                <a href="mailto:suhas@scoders.com" className="py-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-300 hover:text-white transition-all flex items-center justify-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </a>
                <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="py-1.5 bg-[#25D366]/15 hover:bg-[#25D366] hover:text-[#0c0d14] rounded text-[#25D366] transition-all flex items-center justify-center gap-1">
                  <MessageSquare className="w-3 h-3" /> WhatsApp
                </a>
              </div>
            </div>

            {/* Bhuvan M */}
            <div className="bg-white/5 border border-white/5 p-3.5 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="text-sm font-bold text-white leading-tight">Bhuvan M</h5>
                  <span className="text-[10px] text-brand-teal font-mono uppercase tracking-widest">Project Coordinator</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                <a href="tel:+918765432109" className="py-1.5 bg-brand-teal/10 hover:bg-brand-teal hover:text-brand-dark rounded text-brand-teal transition-all flex items-center justify-center gap-1">
                  <Phone className="w-3 h-3" /> Call
                </a>
                <a href="mailto:bhuvan@scoders.com" className="py-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-300 hover:text-white transition-all flex items-center justify-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </a>
                <a href="https://wa.me/918765432109" target="_blank" rel="noopener noreferrer" className="py-1.5 bg-[#25D366]/15 hover:bg-[#25D366] hover:text-[#0c0d14] rounded text-[#25D366] transition-all flex items-center justify-center gap-1">
                  <MessageSquare className="w-3 h-3" /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: TWO COLUMNS (PROGRESS FILES & LIVE CHAT) */}
      <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PROGRESS FILES / PDF SECTION */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3.5 border-b border-white/5 pb-2">
              <FileText className="w-4 h-4 text-brand-teal" />
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest">Progress Files & Spec PDFs</h4>
            </div>
            
            <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
              Whenever you log in with your key, the latest blueprints, wireframes, and spec files uploaded by S-CODERS will appear here.
            </p>

            <div className="space-y-2.5 flex-grow">
              {[
                { name: 'Project_Architecture_Spec.pdf', desc: 'Tech stack flow, system diagram & parameters', size: '1.8 MB' },
                { name: 'Interactive_UI_Mockups_v1.pdf', desc: 'High fidelity wireframes & layout templates', size: '4.5 MB' },
                { name: 'Database_Schema_Spec.pdf', desc: 'PostgreSQL structures, attributes & indices', size: '1.2 MB' },
                { name: 'AI_Agent_Logic_Flowchart.pdf', desc: 'Structured chain-of-thought routing blueprint', size: '2.4 MB' }
              ].map((file) => (
                <div key={file.name} className="p-3 bg-brand-dark/50 border border-white/5 rounded-xl flex items-center justify-between gap-3 text-left">
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-white truncate">{file.name}</span>
                    <span className="block text-[10px] text-gray-500 truncate mt-0.5">{file.desc}</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[9px] font-mono text-gray-500">{file.size}</span>
                    <button
                      onClick={() => handleDownload(file.name)}
                      disabled={downloadingFile !== null}
                      className="p-1.5 bg-white/5 hover:bg-brand-teal/20 hover:text-brand-teal rounded-lg transition-colors cursor-pointer text-gray-400"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {downloadingFile && (
            <div className="mt-4 p-3 bg-brand-teal/5 border border-brand-teal/20 rounded-xl space-y-1.5 font-mono">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400 truncate">Downloading: {downloadingFile}</span>
                <span className="text-brand-teal font-bold">{downloadProgress}%</span>
              </div>
              <div className="w-full bg-brand-dark h-1.5 rounded-full overflow-hidden">
                <div className="bg-brand-teal h-full transition-all duration-150" style={{ width: `${downloadProgress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* CHATBOX SECTION */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col h-[400px] justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
              <MessageSquare className="w-4 h-4 text-brand-teal" />
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest">Collaborative Live Chat</h4>
            </div>
          </div>

          {/* Messages scrollable area */}
          <div className="flex-grow overflow-y-auto space-y-3 pr-1 py-1 scrollbar-thin scrollbar-thumb-white/10 max-h-[250px]">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === 'client' ? 'items-end' : 'items-start'}`}>
                <span className="text-[8px] font-mono text-gray-500 mb-1">
                  {msg.sender === 'client' ? 'You' : 'S-CODERS Lead'} • {msg.time}
                </span>
                <div className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                  msg.sender === 'client' ? 'bg-brand-teal text-brand-dark font-medium rounded-tr-none' : 'bg-white/5 text-gray-300 rounded-tl-none border border-white/5'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Form Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-white/5 pt-3 mt-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Drop developer feedback..."
              className="flex-grow bg-brand-dark/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-teal font-sans"
            />
            <button
              type="submit"
              className="p-2.5 bg-brand-teal hover:bg-white text-brand-dark rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

      {/* FULL WIDTH BOTTOM SECTION: FEEDBACK FORM (6 fields) */}
      <div className="lg:col-span-12 border-t border-white/5 pt-6 mt-2">
        <div className="max-w-3xl mx-auto bg-white/[0.01] border border-white/5 rounded-3xl p-6 sm:p-8">
          <div className="text-center max-w-lg mx-auto mb-6">
            <h4 className="text-sm font-mono text-brand-teal uppercase tracking-widest font-bold mb-1">We Value Your Experience</h4>
            <h3 className="text-xl font-display font-black text-white">Client Service Feedback Form</h3>
            <p className="text-gray-400 text-xs mt-1 leading-normal">
              Please share your honest ratings and suggestions with us. We utilize this loop to constantly optimize our Custom Engineering workflows!
            </p>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="space-y-4 font-sans text-left">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={feedName}
                  onChange={(e) => setFeedName(e.target.value)}
                  placeholder="e.g. Suhas Gowda"
                  className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={feedEmail}
                  onChange={(e) => setFeedEmail(e.target.value)}
                  placeholder="e.g. email@btd.in"
                  className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Your Role / College *</label>
                <input
                  type="text"
                  required
                  value={feedRole}
                  onChange={(e) => setFeedRole(e.target.value)}
                  placeholder="e.g. SDE-1 / College Student"
                  className="w-full bg-[#0d0f1a] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all"
                />
              </div>
            </div>

            {/* Rating select (glowing stars 1to5) */}
            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Rating stars (1 to 5) *</label>
              <div className="flex items-center gap-2 bg-brand-dark/40 border border-white/5 p-3 rounded-xl w-fit">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setFeedRating(star)}
                    className="p-1 cursor-pointer transition-transform active:scale-90 hover:scale-110"
                  >
                    <Star className={`w-6 h-6 transition-all ${
                      star <= feedRating ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]' : 'text-gray-600'
                    }`} />
                  </button>
                ))}
                <span className="text-xs font-mono font-bold text-gray-400 ml-2">({feedRating}/5 Stars)</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Describe Your Feedback / Experience *</label>
              <textarea
                required
                rows={3}
                value={feedExperience}
                onChange={(e) => setFeedExperience(e.target.value)}
                placeholder="How was your experience working with S-CODERS? Highlight the speed, quality, and coordination."
                className="w-full bg-[#0d0f1a] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-brand-teal hover:bg-white text-brand-dark font-display font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-teal/15"
            >
              Submit Client Feedback Form
            </button>

            {feedbackSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-[#25d366]/10 border border-[#25d366]/20 text-[#25d366] text-xs font-mono font-bold text-center rounded-xl"
              >
                ✓ Feedback submitted successfully! S-CODERS team appreciates your precious thoughts.
              </motion.div>
            )}
          </form>
        </div>
      </div>

    </div>
  );
}
