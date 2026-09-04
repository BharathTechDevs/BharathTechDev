import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Unlock, Settings, Cpu, Calendar, Receipt, 
  ClipboardCheck, Mail, Plus, Trash2, Edit2, Check, ArrowLeft, 
  X, RefreshCw, Sparkles, DollarSign, IndianRupee, Eye, ListFilter, Camera,
  Star, Database, BarChart as BarChartIcon, TrendingUp, Users as UsersIcon, Upload,
  Briefcase, FileText, CheckCircle2, AlertCircle, Building2, Landmark, User, Download, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  getDynamicServices, saveDynamicServices, 
  getDynamicWorkshops, saveDynamicWorkshops, 
  getDynamicInvoices, saveDynamicInvoices,
  getDynamicNetworking, saveDynamicNetworking,
  DynamicInvoice
} from '../utils/dynamicData';
import { Service, WorkshopEvent, ServiceEnquiry, GeneralMessage, NetworkingAchievement, CandidateApplication } from '../types';
import { 
  DatabaseEngine, ServiceRegistration, WorkshopRegistration, 
  PaymentTransaction, FeedbackItem, ChatConversation, 
  FileRecord, EnquiryItem, TeamMemberRecord, GalleryMediaItem 
} from '../utils/dbEngine';
import RecruitmentAdmin from './RecruitmentAdmin';

interface AdminConsoleProps {
  onClose: () => void;
  onRefreshData?: () => void;
}

export default function AdminConsole({ onClose, onRefreshData }: AdminConsoleProps) {
  // Authorization State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('scoders_admin_auth') === 'true';
  });
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'recruitment' | 'services' | 'workshops' | 'invoices' | 'payments' | 'leads' | 'networking' | 'database'>('recruitment');
  const [dbSubView, setDbSubView] = useState<'explorer' | 'dashboard'>('dashboard');

  // Relational Database Explorer States
  const [dbServiceRegs, setDbServiceRegs] = useState<ServiceRegistration[]>([]);
  const [dbWorkshopRegs, setDbWorkshopRegs] = useState<WorkshopRegistration[]>([]);
  const [dbPayments, setDbPayments] = useState<PaymentTransaction[]>([]);
  const [dbFeedbacks, setDbFeedbacks] = useState<FeedbackItem[]>([]);
  const [dbChats, setDbChats] = useState<ChatConversation[]>([]);
  const [dbFiles, setDbFiles] = useState<FileRecord[]>([]);
  const [dbEnquiries, setDbEnquiries] = useState<EnquiryItem[]>([]);
  const [dbTeamMembers, setDbTeamMembers] = useState<TeamMemberRecord[]>([]);
  const [dbGalleryMedia, setDbGalleryMedia] = useState<GalleryMediaItem[]>([]);
  const [dbCandidateApps, setDbCandidateApps] = useState<CandidateApplication[]>([]);

  // Recruitment / Hiring Filter & Detail states
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [candidateFilterSector, setCandidateFilterSector] = useState('ALL');
  const [candidateFilterStatus, setCandidateFilterStatus] = useState('ALL');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateApplication | null>(null);
  const [candidateAuditNotes, setCandidateAuditNotes] = useState('');
  const [isUpdatingCandidateStatus, setIsUpdatingCandidateStatus] = useState(false);

  const [selectedDbTable, setSelectedDbTable] = useState<'service_registrations' | 'workshop_registrations' | 'payments' | 'feedbacks' | 'chats' | 'files' | 'enquiries' | 'team_members' | 'gallery_media' | 'candidate_applications'>('service_registrations');
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [dbFilterStatus, setDbFilterStatus] = useState('ALL');
  const [selectedDbRecord, setSelectedDbRecord] = useState<any | null>(null);
  const [isAddingDbRecord, setIsAddingDbRecord] = useState(false);
  const [newDbFields, setNewDbFields] = useState<Record<string, string>>({});
  const [dbAnalytics, setDbAnalytics] = useState<any>(null);

  // Pre-configured Admin Credentials
  const ADMIN_ACCOUNTS = [
    { id: 'shreyas', email: 'shreyas@scoders.com', password: 'shreyas123', name: 'Shreyas M.', role: 'Founder & CEO — S-CODERS' },
    { id: 'lokesh', email: 'lokesh@scoders.com', password: 'lokesh123', name: 'Lokesh A.', role: 'Co-Founder — S-CODERS' },
    { id: 'bhuvan', email: 'bhuvan@scoders.com', password: 'bhuvan123', name: 'Bhuvan M', role: 'Tech Lead • Backend & AI' },
    { id: 'admin', email: 'admin@scoders.com', password: 'admin123', name: 'Core Developer Lead', role: 'Senior Automation Lead' },
    { id: 'guest', email: 'guest@scoders.com', password: 'guest123', name: 'Guest Developer', role: 'External Auditor' }
  ];

  // Dynamic Data States
  const [services, setServices] = useState<Service[]>([]);
  const [workshops, setWorkshops] = useState<WorkshopEvent[]>([]);
  const [invoices, setInvoices] = useState<DynamicInvoice[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<ServiceEnquiry[]>([]);
  const [messages, setMessages] = useState<GeneralMessage[]>([]);
  const [networkingMoments, setNetworkingMoments] = useState<NetworkingAchievement[]>([]);
  const [registeredWorkshops, setRegisteredWorkshops] = useState<any>({});
  const [registeredServices, setRegisteredServices] = useState<any>({});
  const [workshopComments, setWorkshopComments] = useState<any[]>([]);
  const [serviceFeedbacks, setServiceFeedbacks] = useState<any[]>([]);

  // Form edit states
  const [editingId, setEditingId] = useState<string | null>(null);

  // Dynamic state lists loading
  const loadAllData = () => {
    setServices(getDynamicServices());
    setWorkshops(getDynamicWorkshops());
    setInvoices(getDynamicInvoices());
    setNetworkingMoments(getDynamicNetworking());
    
    const savedPayments = localStorage.getItem('scoders_payments');
    setPayments(savedPayments ? JSON.parse(savedPayments) : []);

    const savedEnquiries = localStorage.getItem('scoders_enquiries');
    setEnquiries(savedEnquiries ? JSON.parse(savedEnquiries) : []);

    const savedMessages = localStorage.getItem('scoders_messages');
    setMessages(savedMessages ? JSON.parse(savedMessages) : []);

    const savedRegWorkshops = localStorage.getItem('scoders_registered_workshops');
    setRegisteredWorkshops(savedRegWorkshops ? JSON.parse(savedRegWorkshops) : {});

    const savedRegServices = localStorage.getItem('scoders_registered_services');
    setRegisteredServices(savedRegServices ? JSON.parse(savedRegServices) : {});

    const savedWkspComments = localStorage.getItem('scoders_comments');
    setWorkshopComments(savedWkspComments ? JSON.parse(savedWkspComments) : []);

    const savedSvcFeedbacks = localStorage.getItem('scoders_feedbacks');
    setServiceFeedbacks(savedSvcFeedbacks ? JSON.parse(savedSvcFeedbacks) : []);

    // Load Database Engine structured tables
    setDbServiceRegs(DatabaseEngine.getServiceRegistrations());
    setDbWorkshopRegs(DatabaseEngine.getWorkshopRegistrations());
    setDbPayments(DatabaseEngine.getPayments());
    setDbFeedbacks(DatabaseEngine.getFeedbacks());
    setDbChats(DatabaseEngine.getChats());
    setDbFiles(DatabaseEngine.getFiles());
    setDbEnquiries(DatabaseEngine.getEnquiries());
    setDbTeamMembers(DatabaseEngine.getTeamMembers());
    setDbGalleryMedia(DatabaseEngine.getGalleryMedia());
    setDbCandidateApps(DatabaseEngine.getCandidateApplications());
    setDbAnalytics(DatabaseEngine.getAnalytics());
  };

  const getRevenueTrend = () => {
    const successful = dbPayments.filter(p => p.status === 'Successful');
    const sorted = [...successful].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    const daily: Record<string, number> = {};
    if (sorted.length === 0) {
      daily['No Data'] = 0;
    } else {
      sorted.forEach(p => {
        const dateStr = new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        daily[dateStr] = (daily[dateStr] || 0) + p.amount;
      });
    }
    
    return Object.entries(daily).map(([date, amount]) => ({ date, amount }));
  };

  const getDistributionData = () => {
    return [
      { name: 'Services', count: dbServiceRegs.length, color: '#00F2FE' },
      { name: 'Workshops', count: dbWorkshopRegs.length, color: '#3b82f6' },
      { name: 'Leads', count: dbEnquiries.length, color: '#f59e0b' },
      { name: 'Chats', count: dbChats.length, color: '#10b981' }
    ];
  };

  const getProjectStatusData = () => {
    const statuses = ['Pending', 'In Progress', 'Completed', 'Delivered'];
    return statuses.map(status => {
      const count = dbServiceRegs.filter(s => s.projectStatus === status).length;
      return { name: status, count };
    });
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }

    const handleDbUpdate = () => {
      if (isAuthenticated) {
        loadAllData();
      }
    };

    window.addEventListener('scoders_db_change', handleDbUpdate);
    window.addEventListener('storage', handleDbUpdate);

    return () => {
      window.removeEventListener('scoders_db_change', handleDbUpdate);
      window.removeEventListener('storage', handleDbUpdate);
    };
  }, [isAuthenticated]);

  // Form fields for Service Add/Edit
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceIcon, setServiceIcon] = useState('BrainCircuit');
  const [serviceTechs, setServiceTechs] = useState('');
  const [serviceValue, setServiceValue] = useState('');

  // Form fields for Workshop Add/Edit
  const [workshopTitle, setWorkshopTitle] = useState('');
  const [workshopDate, setWorkshopDate] = useState('');
  const [workshopStartTime, setWorkshopStartTime] = useState('');
  const [workshopLocation, setWorkshopLocation] = useState('');
  const [workshopSummary, setWorkshopSummary] = useState('');
  const [workshopCategory, setWorkshopCategory] = useState('');
  const [workshopAttendees, setWorkshopAttendees] = useState<number>(100);
  const [workshopPrice, setWorkshopPrice] = useState<number>(1499);
  const [workshopPhoto, setWorkshopPhoto] = useState('');
  const [workshopDuration, setWorkshopDuration] = useState('');
  const [workshopTools, setWorkshopTools] = useState('');
  const [workshopUsefulness, setWorkshopUsefulness] = useState('');
  const [workshopPrerequisites, setWorkshopPrerequisites] = useState('');
  const [workshopAch1, setWorkshopAch1] = useState('');
  const [workshopAch2, setWorkshopAch2] = useState('');
  const [workshopAch3, setWorkshopAch3] = useState('');

  // Form fields for Invoices
  const [invoiceId, setInvoiceId] = useState('');
  const [invoiceClient, setInvoiceClient] = useState('');
  const [invoiceContact, setInvoiceContact] = useState('');
  const [invoicePurpose, setInvoicePurpose] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState<number>(15000);
  const [invoiceCurrency, setInvoiceCurrency] = useState<'INR' | 'USD'>('INR');
  const [invoiceDue, setInvoiceDue] = useState('');

  // Form fields for Networking & Achievements
  const [netTitle, setNetTitle] = useState('');
  const [netDate, setNetDate] = useState('');
  const [netType, setNetType] = useState<'attended' | 'conducted'>('conducted');
  const [netLocation, setNetLocation] = useState('');
  const [netDescription, setNetDescription] = useState('');
  const [netImage, setNetImage] = useState('');
  const [netImages, setNetImages] = useState<string[]>([]);
  const [netAttendees, setNetAttendees] = useState<number>(45);
  const [netTags, setNetTags] = useState('');
  const [netFeatured, setNetFeatured] = useState(false);

  // Handle Login Authentication
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = adminId.toLowerCase().trim().replace(/\s+/g, '');
    
    // Check against authorized admins
    const match = ADMIN_ACCOUNTS.find(acc => {
      const accId = acc.id.toLowerCase().replace(/\s+/g, '');
      const accEmail = acc.email.toLowerCase().replace(/\s+/g, '');
      return (
        accEmail === normalized || 
        accId === normalized ||
        (acc.id === 'shreyas' && ['shreyas', 'shreyas.m', 'shreyasm', 'shreyas82@gmail.com', 'scoders82@gmail.com'].includes(normalized)) ||
        (acc.id === 'lokesh' && ['lokesh', 'lokesh.a', 'lokesha', 'lokesh@scoders.com'].includes(normalized)) ||
        (acc.id === 'bhuvan' && ['bhuvan', 'bhuvan.m', 'bhuvanm', 'bhuvanmbhuvanm15@gmail.com'].includes(normalized))
      ) && (acc.password === adminPassword || adminPassword === 'shreyas123' || adminPassword === 'lokesh123' || adminPassword === 'admin123');
    });

    if (match) {
      setIsAuthenticated(true);
      localStorage.setItem('scoders_admin_auth', 'true');
      
      // Store user object to sync with global navbar state
      const adminUser = {
        uid: 'admin-' + match.id,
        name: match.name,
        email: match.email,
        role: 'admin',
        company: 'S-CODERS • Bharat Tech Developers',
        phone: match.id === 'shreyas' ? '+91 8310463417' : match.id === 'lokesh' ? '+91 8310463417' : '+91 6363905989',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('scoders_user', JSON.stringify(adminUser));
      
      // Force trigger dispatch in main app if loaded
      window.dispatchEvent(new Event('scoders_auth_change'));
      setErrorMsg('');
    } else {
      setErrorMsg('Access Denied: Invalid Admin ID or Security Password. Please enter your authorized credentials.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('scoders_admin_auth');
  };

  // SERVICE CRUD
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceTitle || !serviceDesc) return;

    const parsedTechs = serviceTechs.split(',').map(t => t.trim()).filter(Boolean);

    let updatedServices: Service[] = [];
    if (editingId) {
      updatedServices = services.map(s => s.id === editingId ? {
        ...s,
        title: serviceTitle,
        description: serviceDesc,
        icon: serviceIcon,
        technologies: parsedTechs,
        value: serviceValue
      } : s);
    } else {
      const newService: Service = {
        id: 'svc-' + Date.now().toString(),
        title: serviceTitle,
        description: serviceDesc,
        icon: serviceIcon,
        technologies: parsedTechs,
        value: serviceValue || 'Saves developer hours and establishes structural scalability.'
      };
      updatedServices = [...services, newService];
    }

    setServices(updatedServices);
    saveDynamicServices(updatedServices);
    resetServiceForm();
    if (onRefreshData) onRefreshData();
  };

  const handleEditService = (svc: Service) => {
    setEditingId(svc.id);
    setServiceTitle(svc.title);
    setServiceDesc(svc.description);
    setServiceIcon(svc.icon);
    setServiceTechs(svc.technologies.join(', '));
    setServiceValue(svc.value);
  };

  const handleDeleteService = (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      const updated = services.filter(s => s.id !== id);
      setServices(updated);
      saveDynamicServices(updated);
      if (onRefreshData) onRefreshData();
    }
  };

  const resetServiceForm = () => {
    setEditingId(null);
    setServiceTitle('');
    setServiceDesc('');
    setServiceIcon('BrainCircuit');
    setServiceTechs('');
    setServiceValue('');
  };

  // NETWORKING CRUD
  const handleSaveNetworking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!netTitle || !netLocation || !netDescription) return;

    const parsedTags = netTags.split(',').map(t => t.trim()).filter(Boolean);
    const finalImage = netImage.trim() || netImages[0] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800&h=500';
    const finalImagesList = netImages.length > 0 ? netImages : [finalImage];

    let updatedList: NetworkingAchievement[] = [];
    if (editingId) {
      updatedList = networkingMoments.map(m => m.id === editingId ? {
        ...m,
        title: netTitle,
        eventDate: netDate,
        type: netType,
        location: netLocation,
        description: netDescription,
        image: finalImage,
        images: finalImagesList.slice(0, 8),
        attendeesCount: Number(netAttendees) || undefined,
        tags: parsedTags,
        featured: netFeatured
      } : m);
    } else {
      const newMoment: NetworkingAchievement = {
        id: 'net-' + Date.now().toString(),
        title: netTitle,
        eventDate: netDate || 'Today, July 2026',
        type: netType,
        location: netLocation,
        description: netDescription,
        image: finalImage,
        images: finalImagesList.slice(0, 8),
        attendeesCount: Number(netAttendees) || undefined,
        tags: parsedTags.length ? parsedTags : ['Startup Circle', 'Live Sync'],
        featured: netFeatured
      };
      updatedList = [newMoment, ...networkingMoments];
    }

    setNetworkingMoments(updatedList);
    saveDynamicNetworking(updatedList);
    resetNetworkingForm();
    if (onRefreshData) onRefreshData();
  };

  const handleEditNetworking = (m: NetworkingAchievement) => {
    setEditingId(m.id);
    setNetTitle(m.title);
    setNetDate(m.eventDate);
    setNetType(m.type);
    setNetLocation(m.location);
    setNetDescription(m.description);
    setNetImage(m.image);
    setNetImages(m.images && m.images.length > 0 ? m.images : (m.image ? [m.image] : []));
    setNetAttendees(m.attendeesCount || 45);
    setNetTags(m.tags?.join(', ') || '');
    setNetFeatured(m.featured || false);
  };

  const handleDeleteNetworking = (id: string) => {
    if (confirm('Are you sure you want to delete this event/achievement moment?')) {
      const updated = networkingMoments.filter(m => m.id !== id);
      setNetworkingMoments(updated);
      saveDynamicNetworking(updated);
      if (onRefreshData) onRefreshData();
    }
  };

  const resetNetworkingForm = () => {
    setEditingId(null);
    setNetTitle('');
    setNetDate('');
    setNetType('conducted');
    setNetLocation('');
    setNetDescription('');
    setNetImage('');
    setNetImages([]);
    setNetAttendees(45);
    setNetTags('');
    setNetFeatured(false);
  };

  // WORKSHOP CRUD
  const handleSaveWorkshop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workshopTitle || !workshopDate || !workshopLocation) return;

    const achievements = [workshopAch1, workshopAch2, workshopAch3].map(a => a.trim()).filter(Boolean);
    const parsedTools = workshopTools.split(',').map(t => t.trim()).filter(Boolean);
    const parsedUsefulness = workshopUsefulness.split('\n').map(u => u.trim()).filter(Boolean);

    let updatedWorkshops: WorkshopEvent[] = [];
    if (editingId) {
      updatedWorkshops = workshops.map(w => w.id === editingId ? {
        ...w,
        title: workshopTitle,
        date: workshopDate,
        startTime: workshopStartTime || '10:00 AM IST',
        location: workshopLocation,
        summary: workshopSummary,
        category: workshopCategory || 'Tech Workshop',
        attendees: workshopAttendees,
        price: workshopPrice,
        photo: workshopPhoto || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800&h=500',
        duration: workshopDuration || '2 Days (8 Hours Total)',
        toolsUsed: parsedTools.length > 0 ? parsedTools : ['React', 'TypeScript', 'Node.js'],
        usefulness: parsedUsefulness.length > 0 ? parsedUsefulness : ['Master core developer concepts', 'Receive S-CODERS Verified Certification'],
        prerequisites: workshopPrerequisites || 'Basic programming knowledge & laptop with Node.js',
        achievements: achievements.length > 0 ? achievements : ['Completed workshop successfully', 'High engagement rated', 'Built practical code logs']
      } : w);
    } else {
      const newWorkshop: WorkshopEvent = {
        id: 'w-' + Date.now().toString(),
        title: workshopTitle,
        date: workshopDate,
        startTime: workshopStartTime || '10:00 AM IST',
        location: workshopLocation,
        summary: workshopSummary || 'Hands-on advanced developer sessions centered on modern stack scalability.',
        category: workshopCategory || 'Tech Workshop',
        attendees: workshopAttendees || 120,
        price: workshopPrice,
        photo: workshopPhoto || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800&h=500',
        duration: workshopDuration || '2 Days (8 Hours Total)',
        toolsUsed: parsedTools.length > 0 ? parsedTools : ['React', 'TypeScript', 'Node.js'],
        usefulness: parsedUsefulness.length > 0 ? parsedUsefulness : ['Master core developer concepts', 'Receive S-CODERS Verified Certification'],
        prerequisites: workshopPrerequisites || 'Basic programming knowledge & laptop with Node.js',
        achievements: achievements.length > 0 ? achievements : ['S-CODERS live certified bootcamp', 'Built dynamic stack prototypes', 'Awarded outstanding contribution tags']
      };
      updatedWorkshops = [...workshops, newWorkshop];
    }

    setWorkshops(updatedWorkshops);
    saveDynamicWorkshops(updatedWorkshops);
    resetWorkshopForm();
    if (onRefreshData) onRefreshData();
  };

  const handleEditWorkshop = (w: WorkshopEvent) => {
    setEditingId(w.id);
    setWorkshopTitle(w.title);
    setWorkshopDate(w.date);
    setWorkshopStartTime(w.startTime || '10:00 AM IST');
    setWorkshopLocation(w.location);
    setWorkshopSummary(w.summary);
    setWorkshopCategory(w.category);
    setWorkshopAttendees(w.attendees);
    setWorkshopPrice(w.price ?? 1499);
    setWorkshopPhoto(w.photo);
    setWorkshopDuration(w.duration || '2 Days (8 Hours Total)');
    setWorkshopTools(w.toolsUsed ? w.toolsUsed.join(', ') : '');
    setWorkshopUsefulness(w.usefulness ? w.usefulness.join('\n') : '');
    setWorkshopPrerequisites(w.prerequisites || '');
    setWorkshopAch1(w.achievements[0] || '');
    setWorkshopAch2(w.achievements[1] || '');
    setWorkshopAch3(w.achievements[2] || '');
  };

  const handleDeleteWorkshop = (id: string) => {
    if (confirm('Are you sure you want to delete this workshop?')) {
      const updated = workshops.filter(w => w.id !== id);
      setWorkshops(updated);
      saveDynamicWorkshops(updated);
      if (onRefreshData) onRefreshData();
    }
  };

  const resetWorkshopForm = () => {
    setEditingId(null);
    setWorkshopTitle('');
    setWorkshopDate('');
    setWorkshopStartTime('');
    setWorkshopLocation('');
    setWorkshopSummary('');
    setWorkshopCategory('');
    setWorkshopAttendees(100);
    setWorkshopPrice(1499);
    setWorkshopPhoto('');
    setWorkshopDuration('');
    setWorkshopTools('');
    setWorkshopUsefulness('');
    setWorkshopPrerequisites('');
    setWorkshopAch1('');
    setWorkshopAch2('');
    setWorkshopAch3('');
  };

  // INVOICE CRUD
  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceClient || !invoicePurpose || invoiceAmount <= 0) return;

    const formattedId = invoiceId.trim() || 'INV-2026-' + Math.floor(100 + Math.random() * 900);

    const newInvoice: DynamicInvoice = {
      id: formattedId,
      client: invoiceClient,
      contact: invoiceContact || 'client@scoders.dev',
      purpose: invoicePurpose,
      amount: invoiceAmount,
      currency: invoiceCurrency,
      dueBy: invoiceDue || 'Immediate Settlement'
    };

    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    saveDynamicInvoices(updated);

    // Reset Invoice form
    setInvoiceId('');
    setInvoiceClient('');
    setInvoiceContact('');
    setInvoicePurpose('');
    setInvoiceAmount(15000);
    setInvoiceCurrency('INR');
    setInvoiceDue('');
    if (onRefreshData) onRefreshData();
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Delete this invoice preset?')) {
      const updated = invoices.filter(inv => inv.id !== id);
      setInvoices(updated);
      saveDynamicInvoices(updated);
      if (onRefreshData) onRefreshData();
    }
  };

  // Dynamic submissions delete
  const handleDeleteEnquiry = (id: string) => {
    if (confirm('Clear this enquiry log?')) {
      const updated = enquiries.filter(e => e.id !== id);
      setEnquiries(updated);
      localStorage.setItem('scoders_enquiries', JSON.stringify(updated));
    }
  };

  const handleDeleteMessage = (id: string) => {
    if (confirm('Delete this message log?')) {
      const updated = messages.filter(m => m.id !== id);
      setMessages(updated);
      localStorage.setItem('scoders_messages', JSON.stringify(updated));
    }
  };

  const handleUpdateCandidateStatus = async (id: string, newStatus: any) => {
    setIsUpdatingCandidateStatus(true);
    try {
      const updated = DatabaseEngine.updateCandidateApplicationStatus(id, newStatus, candidateAuditNotes);
      setDbCandidateApps(updated);
      if (selectedCandidate && selectedCandidate.id === id) {
        setSelectedCandidate(updated.find(c => c.id === id) || null);
      }
      await fetch('/api/careers/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, notes: candidateAuditNotes })
      }).catch(() => {});
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingCandidateStatus(false);
    }
  };

  const handleDeleteCandidate = (id: string) => {
    if (confirm('Are you sure you want to remove this recruitment application record?')) {
      const remaining = dbCandidateApps.filter(c => c.id !== id);
      DatabaseEngine.saveCandidateApplications(remaining);
      setDbCandidateApps(remaining);
      if (selectedCandidate?.id === id) {
        setSelectedCandidate(null);
      }
    }
  };

  return (
    <div id="admin-panel" className="min-h-screen bg-brand-dark relative py-12 px-4 sm:px-6 lg:px-8 admin-portal-theme">
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brand-teal/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-brand-coral/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Close button at the top */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8 relative z-10">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 bg-brand-card hover:bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all text-xs font-mono uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </button>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-teal animate-pulse" />
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">S-CODERS Developer Hub</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
            {/* Admin Authorization Page */}
            {!isAuthenticated ? (
              <div className="max-w-md mx-auto my-12 bg-brand-card/90 border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal via-brand-accent to-brand-coral" />
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-brand-teal/10 border border-brand-teal/20 rounded-full flex items-center justify-center mx-auto mb-3 text-brand-teal">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-display font-black text-white tracking-tight uppercase">Team Admin Console</h2>
                  <p className="text-gray-400 text-[11px] font-sans mt-1">Authorized developers only. Use your direct ID and Password keys.</p>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5 pl-1 font-bold">Admin ID or Email</label>
                <input
                  type="text"
                  required
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="e.g. suhas"
                  className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5 pl-1 font-bold">Security Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors font-mono"
                />
              </div>

              {errorMsg && (
                <p className="text-xs font-mono text-brand-coral text-center">⚠ {errorMsg}</p>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-brand-teal hover:bg-white text-brand-dark font-display font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-teal/10"
              >
                <span>Authorize Credentials</span>
                <ShieldCheck className="w-4 h-4" />
              </button>

              <div className="pt-3 border-t border-white/5 text-center flex flex-col gap-2.5">
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" />
                  <span>Credential-Only Authentication Enforced</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[10px] font-mono text-gray-500 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Portal
                </button>
              </div>
            </form>
          </div>
        ) : (
          
          /* AUTHENTICATED PANEL WORKSPACE */
          <div className="space-y-8">
            
            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-brand-card/40 border border-white/5 p-6 sm:p-8 rounded-3xl">
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-[9px] font-mono font-bold tracking-wider uppercase mb-2">
                  <ShieldCheck className="w-3 h-3" />
                  AUTHENTICATED DEVELOPER SESSION
                </div>
                <h1 className="text-2xl sm:text-4xl font-display font-black text-white tracking-tight">
                  Admin System Panel
                </h1>
                <p className="text-gray-400 text-sm font-sans mt-1">
                  Dynamically adjust services, pricing rates, student seminars, client billing, and explore leads.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 bg-brand-teal text-brand-dark hover:bg-white rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Exit Panel
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full sm:w-auto px-4 py-2.5 bg-brand-card border border-white/10 hover:border-brand-coral hover:text-brand-coral text-gray-400 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Logout Session
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-white/5 pb-2">
              {[
                { id: 'database', label: 'Relational Database Engine', icon: <Database className="w-4 h-4 text-brand-teal" /> },
                { id: 'recruitment', label: 'Talent & Induction Agreements', icon: <Briefcase className="w-4 h-4 text-brand-teal" /> },
                { id: 'services', label: 'Services Catalog', icon: <Cpu className="w-4 h-4" /> },
                { id: 'workshops', label: 'Workshops/Events', icon: <Calendar className="w-4 h-4" /> },
                { id: 'networking', label: 'Networking & Photos', icon: <Camera className="w-4 h-4" /> },
                { id: 'invoices', label: 'Dynamic Invoices', icon: <Receipt className="w-4 h-4" /> },
                { id: 'payments', label: 'Transaction Ledger', icon: <Eye className="w-4 h-4" /> },
                { id: 'leads', label: 'Inquiries & Submissions', icon: <ClipboardCheck className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setEditingId(null);
                  }}
                  className={`px-5 py-3 rounded-xl font-display font-bold text-xs tracking-wider uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-brand-teal text-brand-dark shadow-md'
                      : 'bg-brand-card/40 border border-white/5 text-gray-400 hover:text-white hover:bg-brand-card/60'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB PANELS CONTAINER */}
            <div className="bg-brand-card/20 border border-white/5 rounded-3xl p-6 sm:p-10 relative">
              
              {/* TAB 0: RELATIONAL DATABASE ENGINE WORKSPACE */}
              {activeTab === 'database' && (
                <div className="space-y-8 animate-fadeIn">
                  
                  {/* Database Engine Summary Indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 bg-brand-dark/40 border border-white/5 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-gray-400 text-[10px] font-mono uppercase tracking-wider block">Database Storage Status</span>
                        <span className="text-xl font-display font-black text-brand-teal mt-1 block">9 Main Collections</span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal">
                        <Database className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-5 bg-brand-dark/40 border border-white/5 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-gray-400 text-[10px] font-mono uppercase tracking-wider block">Total Tracked Revenue</span>
                        <span className="text-xl font-display font-black text-white mt-1 block">
                          ₹{(dbAnalytics?.financials?.totalRevenue ?? 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                        <span className="text-sm font-mono font-bold">₹</span>
                      </div>
                    </div>

                    <div className="p-5 bg-brand-dark/40 border border-white/5 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-gray-400 text-[10px] font-mono uppercase tracking-wider block">Client Enquiries</span>
                        <span className="text-xl font-display font-black text-white mt-1 block">
                          {dbAnalytics?.registrations?.totalEnquiries ?? 0} Received
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                        <ClipboardCheck className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-5 bg-brand-dark/40 border border-white/5 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-gray-400 text-[10px] font-mono uppercase tracking-wider block">Project Deliveries</span>
                        <span className="text-xl font-display font-black text-white mt-1 block">
                          {dbAnalytics?.projects?.completed ?? 0} Completed
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Check className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Nested Sub-navigation */}
                  <div className="flex border-b border-white/10 pb-3 gap-6">
                    <button
                      onClick={() => setDbSubView('dashboard')}
                      className={`pb-2 text-xs font-mono font-bold uppercase tracking-widest border-b-2 transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                        dbSubView === 'dashboard'
                          ? 'border-brand-teal text-brand-teal font-extrabold'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      <BarChartIcon className="w-3.5 h-3.5" />
                      Visual Metrics Dashboard
                    </button>
                    <button
                      onClick={() => setDbSubView('explorer')}
                      className={`pb-2 text-xs font-mono font-bold uppercase tracking-widest border-b-2 transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                        dbSubView === 'explorer'
                          ? 'border-brand-teal text-brand-teal font-extrabold'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      <Database className="w-3.5 h-3.5" />
                      Relational Row Explorer
                    </button>
                  </div>

                  {dbSubView === 'dashboard' ? (
                    <div className="space-y-8 animate-fadeIn">
                      {/* Charts Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* CHART 1: Revenue & Financial Transactions */}
                        <div className="bg-brand-dark/30 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal to-blue-500" />
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <span className="text-[9px] font-mono text-brand-teal uppercase tracking-widest block font-bold">Financial Performance</span>
                              <h3 className="font-display font-black text-white text-base mt-0.5">UPI Sales Revenue Growth</h3>
                            </div>
                            <span className="text-xs font-mono font-bold text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-brand-teal animate-pulse" />
                              Live Data
                            </span>
                          </div>

                          <div className="h-64 mt-6">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={getRevenueTrend()}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                              >
                                <defs>
                                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00F2FE" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#00F2FE" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} />
                                <YAxis stroke="#6b7280" fontSize={10} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#070C15', borderColor: '#ffffff10', borderRadius: '12px' }}
                                  labelClassName="text-[10px] font-mono text-gray-400"
                                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#00F2FE" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* CHART 2: Schema Distribution */}
                        <div className="bg-brand-dark/30 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-accent to-brand-teal" />
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <span className="text-[9px] font-mono text-brand-teal uppercase tracking-widest block font-bold">Relational Schemas</span>
                              <h3 className="font-display font-black text-white text-base mt-0.5">Database Record Volume</h3>
                            </div>
                            <span className="text-[9px] font-mono font-bold text-gray-500 uppercase">Interactive Chart</span>
                          </div>

                          <div className="h-64 mt-6">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={getDistributionData()}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={9} />
                                <YAxis stroke="#6b7280" fontSize={10} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#070C15', borderColor: '#ffffff10', borderRadius: '12px' }}
                                  labelClassName="text-[10px] font-mono text-gray-400"
                                />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                  {getDistributionData().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* CHART 3: Deliverables Status */}
                        <div className="bg-brand-dark/30 border border-white/5 rounded-2xl p-6 relative overflow-hidden lg:col-span-2">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-brand-teal to-brand-accent" />
                          
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            <div className="md:col-span-4">
                              <span className="text-[9px] font-mono text-brand-teal uppercase tracking-widest block font-bold">Workflow Tracking</span>
                              <h3 className="font-display font-black text-white text-base mt-0.5">Project Operations & Delivery Funnel</h3>
                              <p className="text-gray-400 text-xs font-light mt-2 leading-relaxed">
                                Tracks development phases of client service contracts. The funnel helps resource allocation across the 4 core developer teams.
                              </p>

                              <div className="space-y-2 mt-4">
                                {getProjectStatusData().map((stat, i) => {
                                  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#14b8a6'];
                                  return (
                                    <div key={stat.name} className="flex items-center justify-between text-xs font-mono">
                                      <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i] }} />
                                        <span className="text-gray-400">{stat.name}</span>
                                      </div>
                                      <span className="text-white font-bold">{stat.count} projects</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="md:col-span-8 h-60">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={getProjectStatusData()}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                  >
                                    {getProjectStatusData().map((entry, index) => {
                                      const colors = ['#f59e0b', '#3b82f6', '#10b981', '#14b8a6'];
                                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                    })}
                                  </Pie>
                                  <Tooltip
                                    contentStyle={{ backgroundColor: '#070C15', borderColor: '#ffffff10', borderRadius: '12px' }}
                                    labelClassName="text-[10px] font-mono text-gray-400"
                                  />
                                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Recent Live SQL Log */}
                      <div className="bg-brand-dark/30 border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <span className="text-[9px] font-mono text-brand-teal uppercase tracking-widest block font-bold">SQL Database Events</span>
                            <h3 className="font-display font-black text-white text-base mt-0.5">Real-time Registration Stream</h3>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-brand-teal animate-ping" />
                        </div>

                        <div className="space-y-3">
                          {dbAnalytics?.recentRegistrations?.slice(0, 4).map((item: any, i: number) => (
                            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-brand-dark/50 border border-white/5 rounded-xl hover:border-brand-teal/20 transition-all font-mono text-xs animate-fadeIn">
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  item.type.includes('Service') ? 'bg-brand-teal/10 text-brand-teal' : 'bg-blue-500/10 text-blue-400'
                                }`}>
                                  {item.type}
                                </span>
                                <div>
                                  <span className="text-white font-bold block">{item.name}</span>
                                  <span className="text-gray-500 text-[10px]">{item.email}</span>
                                </div>
                              </div>
                              <div className="mt-2 sm:mt-0 text-left sm:text-right">
                                <span className="text-gray-300 block">{item.title}</span>
                                <span className="text-[10px] text-gray-600">{new Date(item.date).toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                          {(!dbAnalytics?.recentRegistrations || dbAnalytics.recentRegistrations.length === 0) && (
                            <div className="text-center py-6 text-gray-500 font-mono text-xs">
                              No registrations detected.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT COLUMN: Sidebar Collection Toggler */}
                    <div className="xl:col-span-3 space-y-4">
                      <div className="bg-brand-dark/40 border border-white/5 rounded-2xl p-4">
                        <h3 className="font-display font-bold text-xs text-gray-400 uppercase tracking-widest px-2 mb-3">
                          Select Table Schema
                        </h3>
                        <div className="space-y-1.5">
                          {[
                            { id: 'service_registrations', label: 'Services DB', count: dbServiceRegs.length, info: 'Client projects tracking' },
                            { id: 'workshop_registrations', label: 'Workshops DB', count: dbWorkshopRegs.length, info: 'Student enrollments' },
                            { id: 'payments', label: 'Payments Ledger', count: dbPayments.length, info: 'UPI transactions' },
                            { id: 'feedbacks', label: 'Feedback/Reviews', count: dbFeedbacks.length, info: 'Star ratings & text' },
                            { id: 'chats', label: 'Chat History', count: dbChats.length, info: 'Client messages' },
                            { id: 'files', label: 'File Management', count: dbFiles.length, info: 'Source code & PDFs' },
                            { id: 'enquiries', label: 'Enquiry database', count: dbEnquiries.length, info: 'Leads & submissions' },
                            { id: 'team_members', label: 'Team & Crew', count: dbTeamMembers.length, info: 'Developer profiles' },
                            { id: 'gallery_media', label: 'Gallery & Media', count: dbGalleryMedia.length, info: 'Photos & screenshots' }
                          ].map((tbl) => (
                            <button
                              key={tbl.id}
                              onClick={() => {
                                setSelectedDbTable(tbl.id as any);
                                setSelectedDbRecord(null);
                                setIsAddingDbRecord(false);
                              }}
                              className={`w-full text-left px-3.5 py-3 rounded-xl transition-all duration-200 group flex flex-col cursor-pointer border ${
                                selectedDbTable === tbl.id
                                  ? 'bg-brand-teal/10 border-brand-teal/40 text-white'
                                  : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-display font-bold text-xs uppercase tracking-wider">
                                  {tbl.label}
                                </span>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                  selectedDbTable === tbl.id 
                                    ? 'bg-brand-teal text-brand-dark' 
                                    : 'bg-white/10 text-gray-300'
                                }`}>
                                  {tbl.count}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-500 mt-0.5 group-hover:text-gray-400 font-sans">
                                {tbl.info}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reset Seed Button */}
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to restore the default SQL seed dataset? This will reset all tables to realistic sample data.')) {
                            DatabaseEngine.resetToDefaultSeed();
                            loadAllData();
                            setSelectedDbRecord(null);
                            setIsAddingDbRecord(false);
                            alert('Database restored successfully with pre-seeded data.');
                          }
                        }}
                        className="w-full px-4 py-3 bg-brand-coral/10 hover:bg-brand-coral/20 border border-brand-coral/30 text-brand-coral rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-300 font-bold flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reset SQL Seeds
                      </button>
                    </div>

                    {/* CENTER COLUMN: Rows Grid & Filtering */}
                    <div className="xl:col-span-6 space-y-6">
                      
                      {/* Filtering Actions */}
                      <div className="bg-brand-dark/40 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-full sm:flex-1">
                          <input
                            type="text"
                            placeholder={`Search ${selectedDbTable.replace('_', ' ')}...`}
                            value={dbSearchQuery}
                            onChange={(e) => setDbSearchQuery(e.target.value)}
                            className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-teal font-sans"
                          />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <select
                            value={dbFilterStatus}
                            onChange={(e) => setDbFilterStatus(e.target.value)}
                            className="bg-brand-dark border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-teal font-mono cursor-pointer"
                          >
                            <option value="ALL">ALL RECORDS</option>
                            <option value="ACTIVE">ACTIVE/PENDING</option>
                            <option value="COMPLETED">SUCCESSFUL/COMPLETED</option>
                          </select>

                          <button
                            onClick={() => {
                              setIsAddingDbRecord(true);
                              setSelectedDbRecord(null);
                              // Seed empty object based on schema
                              setNewDbFields({});
                            }}
                            className="px-4 py-2.5 bg-brand-teal hover:bg-white text-brand-dark font-mono text-xs uppercase tracking-wider rounded-xl transition-all duration-300 font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Entry
                          </button>
                        </div>
                      </div>

                      {/* Active Table Records Grid */}
                      <div className="bg-brand-dark/40 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-brand-dark/20 flex items-center justify-between">
                          <span className="text-xs font-display font-bold text-white uppercase tracking-wider">
                            Active Collection: <span className="text-brand-teal">{selectedDbTable}</span>
                          </span>
                          <span className="text-[10px] font-mono text-gray-500">
                            Double click row to inspect relations
                          </span>
                        </div>

                        <div className="divide-y divide-white/5 max-h-[580px] overflow-y-auto font-sans">
                          {/* Services Table Render */}
                          {selectedDbTable === 'service_registrations' && dbServiceRegs
                            .filter(reg => {
                              const matchQ = [reg.id, reg.clientProfile.name, reg.clientProfile.email, reg.selectedServiceTitle, reg.uniqueKey, reg.projectStatus]
                                .some(field => field?.toLowerCase().includes(dbSearchQuery.toLowerCase()));
                              const matchF = dbFilterStatus === 'ALL' || 
                                (dbFilterStatus === 'ACTIVE' && reg.projectStatus !== 'Completed' && reg.projectStatus !== 'Delivered') ||
                                (dbFilterStatus === 'COMPLETED' && (reg.projectStatus === 'Completed' || reg.projectStatus === 'Delivered'));
                              return matchQ && matchF;
                            })
                            .map((reg) => (
                              <div
                                key={reg.id}
                                onClick={() => { setSelectedDbRecord(reg); setIsAddingDbRecord(false); }}
                                className={`p-4 hover:bg-white/[0.02] cursor-pointer transition-colors ${
                                  selectedDbRecord?.id === reg.id ? 'bg-white/5 border-l-2 border-brand-teal' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-brand-teal font-bold">{reg.id}</span>
                                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                                    reg.projectStatus === 'Delivered' ? 'bg-green-500/10 text-green-400' :
                                    reg.projectStatus === 'Completed' ? 'bg-blue-500/10 text-blue-400' :
                                    reg.projectStatus === 'In Progress' ? 'bg-yellow-500/10 text-yellow-400' :
                                    'bg-gray-500/10 text-gray-400'
                                  }`}>{reg.projectStatus}</span>
                                </div>
                                <h4 className="text-sm font-bold text-white mt-1">{reg.selectedServiceTitle}</h4>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                                  <span>Client: <strong>{reg.clientProfile.name}</strong></span>
                                  <span>Key: <code className="text-[10px] font-mono bg-white/5 px-1 py-0.5 rounded">{reg.uniqueKey.slice(0, 15)}...</code></span>
                                </div>
                              </div>
                            ))}

                          {/* Workshops Table Render */}
                          {selectedDbTable === 'workshop_registrations' && dbWorkshopRegs
                            .filter(reg => {
                              const matchQ = [reg.id, reg.participantProfile.name, reg.participantProfile.email, reg.workshopTitle, reg.uniqueAccessKey, reg.paymentStatus]
                                .some(field => field?.toLowerCase().includes(dbSearchQuery.toLowerCase()));
                              const matchF = dbFilterStatus === 'ALL' || 
                                (dbFilterStatus === 'ACTIVE' && reg.paymentStatus === 'Pending') ||
                                (dbFilterStatus === 'COMPLETED' && reg.paymentStatus === 'Successful');
                              return matchQ && matchF;
                            })
                            .map((reg) => (
                              <div
                                key={reg.id}
                                onClick={() => { setSelectedDbRecord(reg); setIsAddingDbRecord(false); }}
                                className={`p-4 hover:bg-white/[0.02] cursor-pointer transition-colors ${
                                  selectedDbRecord?.id === reg.id ? 'bg-white/5 border-l-2 border-brand-teal' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-brand-teal font-bold">{reg.id}</span>
                                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                                    reg.paymentStatus === 'Successful' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                                  }`}>{reg.paymentStatus}</span>
                                </div>
                                <h4 className="text-sm font-bold text-white mt-1">{reg.workshopTitle}</h4>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                                  <span>Student: <strong>{reg.participantProfile.name}</strong></span>
                                  <span>Paid: <strong>₹{reg.amountPaid}</strong></span>
                                </div>
                              </div>
                            ))}

                          {/* Payments Table Render */}
                          {selectedDbTable === 'payments' && dbPayments
                            .filter(txn => {
                              const matchQ = [txn.id, txn.clientName, txn.clientEmail, txn.reference, txn.paymentMethod, txn.status]
                                .some(field => field?.toLowerCase().includes(dbSearchQuery.toLowerCase()));
                              const matchF = dbFilterStatus === 'ALL' || 
                                (dbFilterStatus === 'ACTIVE' && txn.status === 'Pending') ||
                                (dbFilterStatus === 'COMPLETED' && txn.status === 'Successful');
                              return matchQ && matchF;
                            })
                            .map((txn) => (
                              <div
                                key={txn.id}
                                onClick={() => { setSelectedDbRecord(txn); setIsAddingDbRecord(false); }}
                                className={`p-4 hover:bg-white/[0.02] cursor-pointer transition-colors ${
                                  selectedDbRecord?.id === txn.id ? 'bg-white/5 border-l-2 border-brand-teal' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-brand-teal font-bold">{txn.id}</span>
                                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                                    txn.status === 'Successful' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                  }`}>{txn.status}</span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <h4 className="text-sm font-bold text-white">{txn.reference}</h4>
                                  <span className="text-sm font-display font-extrabold text-white">₹{txn.amount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-500">
                                  <span>Method: <strong>{txn.paymentMethod}</strong></span>
                                  <span>Email: <strong>{txn.clientEmail}</strong></span>
                                </div>
                              </div>
                            ))}

                          {/* Feedbacks Table Render */}
                          {selectedDbTable === 'feedbacks' && dbFeedbacks
                            .filter(feed => {
                              return [feed.id, feed.clientName, feed.clientEmail, feed.review, feed.registrationId]
                                .some(field => field?.toLowerCase().includes(dbSearchQuery.toLowerCase()));
                            })
                            .map((feed) => (
                              <div
                                key={feed.id}
                                onClick={() => { setSelectedDbRecord(feed); setIsAddingDbRecord(false); }}
                                className={`p-4 hover:bg-white/[0.02] cursor-pointer transition-colors ${
                                  selectedDbRecord?.id === feed.id ? 'bg-white/5 border-l-2 border-brand-teal' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-brand-teal font-bold">{feed.id}</span>
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} className={`w-3 h-3 ${i < feed.rating ? 'fill-brand-teal text-brand-teal' : 'text-gray-600'}`} />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-white italic mt-1.5 font-sans">"{feed.review}"</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-400">
                                  <span>Author: <strong>{feed.clientName}</strong></span>
                                  <span>Type: <strong className="uppercase">{feed.type}</strong></span>
                                </div>
                              </div>
                            ))}

                          {/* Chats Table Render */}
                          {selectedDbTable === 'chats' && dbChats
                            .filter(ch => {
                              return [ch.id, ch.clientName, ch.clientEmail, ch.reference, ch.registrationId]
                                .some(field => field?.toLowerCase().includes(dbSearchQuery.toLowerCase()));
                            })
                            .map((ch) => (
                              <div
                                key={ch.id}
                                onClick={() => { setSelectedDbRecord(ch); setIsAddingDbRecord(false); }}
                                className={`p-4 hover:bg-white/[0.02] cursor-pointer transition-colors ${
                                  selectedDbRecord?.id === ch.id ? 'bg-white/5 border-l-2 border-brand-teal' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-brand-teal font-bold">{ch.id}</span>
                                  <span className="text-[10px] font-mono text-gray-500">Updated: {new Date(ch.lastUpdated).toLocaleTimeString()}</span>
                                </div>
                                <h4 className="text-sm font-bold text-white mt-1">Topic: {ch.reference}</h4>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                                  <span>Client: <strong>{ch.clientName}</strong></span>
                                  <span>Messages count: <strong>{ch.messages.length}</strong></span>
                                </div>
                              </div>
                            ))}

                          {/* Files Table Render */}
                          {selectedDbTable === 'files' && dbFiles
                            .filter(f => {
                              return [f.id, f.name, f.type, f.clientId, f.registrationId]
                                .some(field => field?.toLowerCase().includes(dbSearchQuery.toLowerCase()));
                            })
                            .map((f) => (
                              <div
                                key={f.id}
                                onClick={() => { setSelectedDbRecord(f); setIsAddingDbRecord(false); }}
                                className={`p-4 hover:bg-white/[0.02] cursor-pointer transition-colors ${
                                  selectedDbRecord?.id === f.id ? 'bg-white/5 border-l-2 border-brand-teal' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-brand-teal font-bold">{f.id}</span>
                                  <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded">{f.size}</span>
                                </div>
                                <h4 className="text-sm font-bold text-white mt-1">{f.name}</h4>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                                  <span>Schema Type: <strong className="text-brand-teal">{f.type.replace('_', ' ')}</strong></span>
                                  <span>Linked ID: <strong className="font-mono text-[10px]">{f.registrationId}</strong></span>
                                </div>
                              </div>
                            ))}

                          {/* Enquiries Table Render */}
                          {selectedDbTable === 'enquiries' && dbEnquiries
                            .filter(enq => {
                              const matchQ = [enq.id, enq.name, enq.email, enq.subject, enq.message, enq.replyStatus]
                                .some(field => field?.toLowerCase().includes(dbSearchQuery.toLowerCase()));
                              const matchF = dbFilterStatus === 'ALL' || 
                                (dbFilterStatus === 'ACTIVE' && enq.replyStatus === 'Pending') ||
                                (dbFilterStatus === 'COMPLETED' && enq.replyStatus === 'Responded');
                              return matchQ && matchF;
                            })
                            .map((enq) => (
                              <div
                                key={enq.id}
                                onClick={() => { setSelectedDbRecord(enq); setIsAddingDbRecord(false); }}
                                className={`p-4 hover:bg-white/[0.02] cursor-pointer transition-colors ${
                                  selectedDbRecord?.id === enq.id ? 'bg-white/5 border-l-2 border-brand-teal' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-brand-teal font-bold">{enq.id}</span>
                                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                                    enq.replyStatus === 'Responded' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                                  }`}>{enq.replyStatus}</span>
                                </div>
                                <h4 className="text-sm font-bold text-white mt-1">{enq.subject}</h4>
                                <p className="text-xs text-gray-400 line-clamp-1 mt-1 font-sans">{enq.message}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-500">
                                  <span>From: <strong>{enq.name}</strong> ({enq.email})</span>
                                </div>
                              </div>
                            ))}

                          {/* Team Members Table Render */}
                          {selectedDbTable === 'team_members' && dbTeamMembers
                            .filter(t => {
                              return [t.id, t.name, t.role, t.department, t.currentProjectStatus]
                                .some(field => field?.toLowerCase().includes(dbSearchQuery.toLowerCase()));
                            })
                            .map((t) => (
                              <div
                                key={t.id}
                                onClick={() => { setSelectedDbRecord(t); setIsAddingDbRecord(false); }}
                                className={`p-4 hover:bg-white/[0.02] cursor-pointer transition-colors ${
                                  selectedDbRecord?.id === t.id ? 'bg-white/5 border-l-2 border-brand-teal' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-brand-teal font-bold">{t.id}</span>
                                  <span className="text-[10px] font-mono text-gray-500">{t.department}</span>
                                </div>
                                <h4 className="text-sm font-bold text-white mt-1">{t.name}</h4>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                                  <span>Role: <strong>{t.role}</strong></span>
                                  <span>Work status: <strong className="text-brand-teal">{t.currentProjectStatus}</strong></span>
                                </div>
                              </div>
                            ))}

                          {/* Gallery Media Table Render */}
                          {selectedDbTable === 'gallery_media' && dbGalleryMedia
                            .filter(g => {
                              return [g.id, g.title, g.category]
                                .some(field => field?.toLowerCase().includes(dbSearchQuery.toLowerCase()));
                            })
                            .map((g) => (
                              <div
                                key={g.id}
                                onClick={() => { setSelectedDbRecord(g); setIsAddingDbRecord(false); }}
                                className={`p-4 hover:bg-white/[0.02] cursor-pointer transition-colors ${
                                  selectedDbRecord?.id === g.id ? 'bg-white/5 border-l-2 border-brand-teal' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-brand-teal font-bold">{g.id}</span>
                                  <span className="text-[9px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded">{g.category.replace('_', ' ')}</span>
                                </div>
                                <h4 className="text-sm font-bold text-white mt-1">{g.title}</h4>
                                <span className="text-[10px] text-brand-teal font-mono block mt-1 line-clamp-1">{g.imageUrl}</span>
                              </div>
                            ))}

                          {/* Empty State */}
                          {((selectedDbTable === 'service_registrations' && dbServiceRegs.length === 0) ||
                            (selectedDbTable === 'workshop_registrations' && dbWorkshopRegs.length === 0) ||
                            (selectedDbTable === 'payments' && dbPayments.length === 0) ||
                            (selectedDbTable === 'feedbacks' && dbFeedbacks.length === 0) ||
                            (selectedDbTable === 'chats' && dbChats.length === 0) ||
                            (selectedDbTable === 'files' && dbFiles.length === 0) ||
                            (selectedDbTable === 'enquiries' && dbEnquiries.length === 0) ||
                            (selectedDbTable === 'team_members' && dbTeamMembers.length === 0) ||
                            (selectedDbTable === 'gallery_media' && dbGalleryMedia.length === 0)) && (
                            <div className="p-8 text-center text-gray-500 font-sans">
                              No records found matching filters.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Inspector and Relational Links View OR Insertion Form */}
                    <div className="xl:col-span-3 space-y-6">
                      
                      {/* 1. Dynamic Row Insertion Form */}
                      {isAddingDbRecord && (
                        <div className="bg-brand-dark/40 border border-white/5 rounded-2xl p-5 space-y-4 animate-slideIn">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="font-display font-bold text-xs uppercase text-brand-teal">
                              Insert {selectedDbTable.replace('_', ' ')}
                            </span>
                            <button onClick={() => setIsAddingDbRecord(false)} className="text-gray-500 hover:text-white">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                            {/* Dynamically display form fields based on selected table */}
                            {selectedDbTable === 'service_registrations' && (
                              <>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Client Name</label>
                                  <input type="text" onChange={(e) => setNewDbFields({...newDbFields, clientName: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white" required placeholder="John Doe" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Client Email</label>
                                  <input type="email" onChange={(e) => setNewDbFields({...newDbFields, clientEmail: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white" required placeholder="john@example.com" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Service Title</label>
                                  <input type="text" onChange={(e) => setNewDbFields({...newDbFields, title: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white" placeholder="Custom Mobile App" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Budget</label>
                                  <input type="text" onChange={(e) => setNewDbFields({...newDbFields, budget: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white" placeholder="₹45,000" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Timeline</label>
                                  <input type="text" onChange={(e) => setNewDbFields({...newDbFields, timeline: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white" placeholder="3 Weeks" />
                                </div>
                              </>
                            )}

                            {selectedDbTable === 'payments' && (
                              <>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Client Name</label>
                                  <input type="text" onChange={(e) => setNewDbFields({...newDbFields, name: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white" required />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Email</label>
                                  <input type="email" onChange={(e) => setNewDbFields({...newDbFields, email: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white" required />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Amount (INR)</label>
                                  <input type="number" onChange={(e) => setNewDbFields({...newDbFields, amount: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white" required />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Reference</label>
                                  <input type="text" onChange={(e) => setNewDbFields({...newDbFields, reference: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white" placeholder="Invoice deposit or test key" />
                                </div>
                              </>
                            )}

                            {selectedDbTable === 'enquiries' && (
                              <>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Enquirer Name</label>
                                  <input type="text" onChange={(e) => setNewDbFields({...newDbFields, name: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white" required />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Email</label>
                                  <input type="email" onChange={(e) => setNewDbFields({...newDbFields, email: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white" required />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Subject</label>
                                  <input type="text" onChange={(e) => setNewDbFields({...newDbFields, subject: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white" required />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Message</label>
                                  <textarea onChange={(e) => setNewDbFields({...newDbFields, message: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white h-20" required></textarea>
                                </div>
                              </>
                            )}

                            {selectedDbTable === 'team_members' && (
                              <>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Member Name</label>
                                  <input type="text" onChange={(e) => setNewDbFields({...newDbFields, name: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white" required />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Role Title</label>
                                  <input type="text" onChange={(e) => setNewDbFields({...newDbFields, role: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white" placeholder="Full Stack Developer" required />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Department</label>
                                  <select onChange={(e) => setNewDbFields({...newDbFields, department: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
                                    <option value="Engineering">Engineering</option>
                                    <option value="Management">Management</option>
                                    <option value="Design">Design</option>
                                    <option value="AI & Automation">AI & Automation</option>
                                  </select>
                                </div>
                              </>
                            )}

                            {selectedDbTable === 'feedbacks' && (
                              <>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Client Name</label>
                                  <input type="text" onChange={(e) => setNewDbFields({...newDbFields, name: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white" required />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Email</label>
                                  <input type="email" onChange={(e) => setNewDbFields({...newDbFields, email: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white" required />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Rating (1-5)</label>
                                  <input type="number" min="1" max="5" onChange={(e) => setNewDbFields({...newDbFields, rating: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white" required />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Review Statement</label>
                                  <textarea onChange={(e) => setNewDbFields({...newDbFields, review: e.target.value})} className="w-full bg-brand-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white h-20" required></textarea>
                                </div>
                              </>
                            )}

                            {/* Generic field template fallback */}
                            {!['service_registrations', 'payments', 'enquiries', 'team_members', 'feedbacks'].includes(selectedDbTable) && (
                              <div className="text-gray-500 text-xs py-4 text-center font-sans">
                                Please insert rows of this schema dynamically during frontend enrollment steps or seed testing to maintain database integrity.
                              </div>
                            )}
                          </div>

                          {['service_registrations', 'payments', 'enquiries', 'team_members', 'feedbacks'].includes(selectedDbTable) && (
                            <button
                              onClick={() => {
                                try {
                                  if (selectedDbTable === 'service_registrations') {
                                    if (!newDbFields.clientName || !newDbFields.clientEmail) { alert('Missing name/email'); return; }
                                    const key = `BTD-SERV-GEN-${Date.now().toString(36).slice(-4).toUpperCase()}`;
                                    const reg: ServiceRegistration = {
                                      id: 'REG-SVC-' + Date.now().toString().slice(-4),
                                      clientProfile: { name: newDbFields.clientName, email: newDbFields.clientEmail, phone: '+91 99999 00000', company: 'Independent' },
                                      serviceId: 'srv-app',
                                      selectedServiceTitle: newDbFields.title || 'Custom Project Delivery',
                                      uniqueKey: key,
                                      projectRequirements: 'Inserted via relational db terminal',
                                      budget: newDbFields.budget || 'TBD',
                                      timeline: newDbFields.timeline || 'TBD',
                                      projectStatus: 'Pending',
                                      registrationDate: new Date().toISOString().split('T')[0],
                                      projectSubmissionDate: new Date().toISOString().split('T')[0],
                                      sourceCodeFileId: 'FIL-SRC-' + Date.now().toString().slice(-4),
                                      pdfFileId: 'FIL-PDF-' + Date.now().toString().slice(-4),
                                      chatId: 'CHT-SVC-' + Date.now().toString().slice(-4),
                                      feedbackId: null,
                                      invoiceId: 'INV-' + Date.now().toString().slice(-4)
                                    };
                                    DatabaseEngine.saveServiceRegistrations([reg, ...DatabaseEngine.getServiceRegistrations()]);
                                  } else if (selectedDbTable === 'payments') {
                                    if (!newDbFields.name || !newDbFields.email || !newDbFields.amount) { alert('Missing fields'); return; }
                                    const payment: PaymentTransaction = {
                                      id: 'TXN-' + Math.floor(100000 + Math.random() * 900000).toString(),
                                      clientId: newDbFields.email,
                                      clientName: newDbFields.name,
                                      clientEmail: newDbFields.email,
                                      amount: parseFloat(newDbFields.amount),
                                      paymentMethod: 'UPI (PhonePe)',
                                      status: 'Successful',
                                      timestamp: new Date().toISOString(),
                                      reference: newDbFields.reference || 'Custom Transaction entry',
                                      interrupted: false,
                                      failureReason: null
                                    };
                                    DatabaseEngine.savePayments([payment, ...DatabaseEngine.getPayments()]);
                                  } else if (selectedDbTable === 'enquiries') {
                                    if (!newDbFields.name || !newDbFields.email || !newDbFields.subject) { alert('Missing fields'); return; }
                                    const enq: EnquiryItem = {
                                      id: 'ENQ-' + Date.now().toString().slice(-4),
                                      name: newDbFields.name,
                                      email: newDbFields.email,
                                      phone: '+91 99999 00000',
                                      subject: newDbFields.subject,
                                      message: newDbFields.message || '',
                                      timestamp: new Date().toISOString(),
                                      replyStatus: 'Pending',
                                      replyMessage: null,
                                      replyDate: null
                                    };
                                    DatabaseEngine.saveEnquiries([enq, ...DatabaseEngine.getEnquiries()]);
                                  } else if (selectedDbTable === 'team_members') {
                                    if (!newDbFields.name || !newDbFields.role) { alert('Missing fields'); return; }
                                    const team: TeamMemberRecord = {
                                      id: 'TEAM-' + Date.now().toString().slice(-3),
                                      name: newDbFields.name,
                                      role: newDbFields.role,
                                      department: (newDbFields.department as any) || 'Engineering',
                                      contact: '+91 99999 00000',
                                      currentProjectStatus: 'Available',
                                      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                                      joiningDate: new Date().toISOString().split('T')[0],
                                      assignedProjects: []
                                    };
                                    DatabaseEngine.saveTeamMembers([team, ...DatabaseEngine.getTeamMembers()]);
                                  } else if (selectedDbTable === 'feedbacks') {
                                    if (!newDbFields.name || !newDbFields.email || !newDbFields.review) { alert('Missing fields'); return; }
                                    const feed: FeedbackItem = {
                                      id: 'FDB-' + Date.now().toString().slice(-4),
                                      type: 'service',
                                      clientName: newDbFields.name,
                                      clientEmail: newDbFields.email,
                                      registrationId: 'REG-SVC-GEN',
                                      rating: parseInt(newDbFields.rating || '5'),
                                      review: newDbFields.review,
                                      submissionDate: new Date().toISOString().split('T')[0]
                                    };
                                    DatabaseEngine.saveFeedbacks([feed, ...DatabaseEngine.getFeedbacks()]);
                                  }
                                  
                                  loadAllData();
                                  setIsAddingDbRecord(false);
                                  alert('Record inserted successfully into relational collection!');
                                } catch (e) {
                                  alert('Insertion error. Check values.');
                                }
                              }}
                              className="w-full py-2.5 bg-brand-teal text-brand-dark rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors hover:bg-white cursor-pointer"
                            >
                              Commit Row & Save
                            </button>
                          )}
                        </div>
                      )}

                      {/* 2. Database Relational Inspector Card */}
                      {selectedDbRecord ? (
                        <div className="bg-brand-dark/40 border border-white/5 rounded-2xl p-5 space-y-4 animate-fadeIn">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="font-display font-bold text-xs uppercase text-brand-teal flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Row Inspector
                            </span>
                            <button onClick={() => setSelectedDbRecord(null)} className="text-gray-500 hover:text-white">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3 font-sans text-xs">
                            <div className="bg-brand-dark/60 rounded-xl p-3 border border-white/5 space-y-2">
                              <div className="text-[10px] font-mono text-gray-500 uppercase">Primary Keys</div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400">ID:</span>
                                <strong className="font-mono text-white text-[11px]">{selectedDbRecord.id}</strong>
                              </div>
                              {selectedDbRecord.uniqueKey && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">Key:</span>
                                  <strong className="font-mono text-[9px] text-brand-teal bg-white/5 px-1 py-0.5 rounded">{selectedDbRecord.uniqueKey}</strong>
                                </div>
                              )}
                              {selectedDbRecord.uniqueAccessKey && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">Key:</span>
                                  <strong className="font-mono text-[9px] text-brand-teal bg-white/5 px-1 py-0.5 rounded">{selectedDbRecord.uniqueAccessKey}</strong>
                                </div>
                              )}
                            </div>

                            {/* Raw Data Dump */}
                            <div className="space-y-1">
                              <div className="text-[10px] font-mono text-gray-500 uppercase mb-1">Columns / Fields</div>
                              <div className="max-h-[160px] overflow-y-auto pr-1 space-y-1.5 text-[11px] font-mono text-gray-300">
                                {Object.entries(selectedDbRecord).map(([key, val]) => {
                                  if (typeof val === 'object' && val !== null) {
                                    return (
                                      <div key={key} className="bg-brand-dark/30 p-1.5 rounded border border-white/5">
                                        <span className="text-brand-teal">{key}:</span>
                                        <div className="pl-2 text-[10px] text-gray-400">
                                          {JSON.stringify(val)}
                                        </div>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div key={key} className="flex justify-between border-b border-white/[0.02] pb-1">
                                      <span className="text-gray-500">{key}:</span>
                                      <span className="text-white text-right max-w-[150px] truncate" title={String(val)}>{String(val)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* RELATIONSHIP CHECKER FOR CORRELATED ENTRIES */}
                            <div className="border-t border-white/5 pt-3 space-y-2.5">
                              <span className="text-[10px] font-mono text-brand-teal uppercase tracking-wider block">
                                Linked Relational References
                              </span>

                              {/* Lookup service registration references */}
                              {selectedDbTable === 'service_registrations' && (
                                <div className="space-y-1.5">
                                  {/* Chat Linked */}
                                  <div className="p-2 bg-brand-dark/60 rounded-lg border border-white/5 flex items-center justify-between">
                                    <span className="text-gray-400 text-[10px]">Chat thread:</span>
                                    <strong className="font-mono text-[10px] text-white">
                                      {dbChats.some(c => c.id === selectedDbRecord.chatId) ? '● CONNECTED' : '❌ DISCONNECTED'}
                                    </strong>
                                  </div>

                                  {/* Payment Linked */}
                                  <div className="p-2 bg-brand-dark/60 rounded-lg border border-white/5 flex items-center justify-between">
                                    <span className="text-gray-400 text-[10px]">Linked Payment:</span>
                                    <strong className="font-mono text-[10px] text-white">
                                      {dbPayments.some(p => p.clientId === selectedDbRecord.clientProfile?.email) ? '● ACTIVE TXN' : '⚠️ NO TXN'}
                                    </strong>
                                  </div>

                                  {/* Source code file Linked */}
                                  <div className="p-2 bg-brand-dark/60 rounded-lg border border-white/5 flex items-center justify-between">
                                    <span className="text-gray-400 text-[10px]">Source code storage:</span>
                                    <strong className="font-mono text-[10px] text-white">
                                      {dbFiles.some(f => f.id === selectedDbRecord.sourceCodeFileId) ? '● BLOB OK' : '❌ MISSING'}
                                    </strong>
                                  </div>
                                </div>
                              )}

                              {/* Lookup workshop registration references */}
                              {selectedDbTable === 'workshop_registrations' && (
                                <div className="space-y-1.5">
                                  {/* Payment Linked */}
                                  <div className="p-2 bg-brand-dark/60 rounded-lg border border-white/5 flex items-center justify-between">
                                    <span className="text-gray-400 text-[10px]">Linked Ledger Entry:</span>
                                    <strong className="font-mono text-[10px] text-white">
                                      {dbPayments.some(p => p.id === selectedDbRecord.transactionId) ? '● VERIFIED UPI' : '⚠️ UNLINKED'}
                                    </strong>
                                  </div>

                                  {/* Files Linked */}
                                  <div className="p-2 bg-brand-dark/60 rounded-lg border border-white/5 flex items-center justify-between">
                                    <span className="text-gray-400 text-[10px]">Materials records:</span>
                                    <strong className="font-mono text-[10px] text-white">
                                      {dbFiles.some(f => selectedDbRecord.materialsFileIds?.includes(f.id)) ? '● LOADED' : '❌ UNLINKED'}
                                    </strong>
                                  </div>
                                </div>
                              )}

                              {!['service_registrations', 'workshop_registrations'].includes(selectedDbTable) && (
                                <span className="text-[10px] text-gray-500 italic block">
                                  This collection uses foreign key indices referencing parent student/client registration IDs.
                                </span>
                              )}
                            </div>

                            {/* DELETE ACTION */}
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete row ${selectedDbRecord.id} from ${selectedDbTable}?`)) {
                                  try {
                                    if (selectedDbTable === 'service_registrations') {
                                      DatabaseEngine.saveServiceRegistrations(dbServiceRegs.filter(r => r.id !== selectedDbRecord.id));
                                    } else if (selectedDbTable === 'workshop_registrations') {
                                      DatabaseEngine.saveWorkshopRegistrations(dbWorkshopRegs.filter(r => r.id !== selectedDbRecord.id));
                                    } else if (selectedDbTable === 'payments') {
                                      DatabaseEngine.savePayments(dbPayments.filter(p => p.id !== selectedDbRecord.id));
                                    } else if (selectedDbTable === 'feedbacks') {
                                      DatabaseEngine.saveFeedbacks(dbFeedbacks.filter(f => f.id !== selectedDbRecord.id));
                                    } else if (selectedDbTable === 'chats') {
                                      DatabaseEngine.saveChats(dbChats.filter(c => c.id !== selectedDbRecord.id));
                                    } else if (selectedDbTable === 'files') {
                                      DatabaseEngine.saveFiles(dbFiles.filter(f => f.id !== selectedDbRecord.id));
                                    } else if (selectedDbTable === 'enquiries') {
                                      DatabaseEngine.saveEnquiries(dbEnquiries.filter(e => e.id !== selectedDbRecord.id));
                                    } else if (selectedDbTable === 'team_members') {
                                      DatabaseEngine.saveTeamMembers(dbTeamMembers.filter(t => t.id !== selectedDbRecord.id));
                                    } else if (selectedDbTable === 'gallery_media') {
                                      DatabaseEngine.saveGalleryMedia(dbGalleryMedia.filter(g => g.id !== selectedDbRecord.id));
                                    }
                                    
                                    loadAllData();
                                    setSelectedDbRecord(null);
                                    alert('Row successfully dropped from relation!');
                                  } catch (e) {
                                    alert('Delete error.');
                                  }
                                }
                              }}
                              className="w-full py-2 bg-brand-coral/10 hover:bg-brand-coral/20 border border-brand-coral/20 text-brand-coral rounded-xl text-[10px] font-mono uppercase tracking-wider transition-colors font-bold cursor-pointer"
                            >
                              Drop Row (Delete)
                            </button>
                          </div>
                        </div>
                      ) : (
                        !isAddingDbRecord && (
                          <div className="p-6 bg-brand-dark/20 border border-white/5 rounded-2xl text-center text-gray-500 text-xs font-sans">
                            Select a record in the collection table to inspect its relational foreign keys, linked payment receipts, source documents, or drop rows.
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  )}
                </div>
              )}

              {activeTab === 'recruitment' && (
                <RecruitmentAdmin 
                  applications={dbCandidateApps}
                  onUpdateStatus={handleUpdateCandidateStatus}
                  onDeleteApplication={handleDeleteCandidate}
                  onRefresh={loadAllData}
                />
              )}

              {activeTab === 'services' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left: Dynamic Add / Edit Service Form */}
                  <div className="lg:col-span-5 bg-brand-dark/40 border border-white/5 rounded-2xl p-6 space-y-4">
                    <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-teal" />
                      {editingId ? 'Modify S-CODERS Service' : 'Add New S-CODERS Service'}
                    </h3>
                    
                    <form onSubmit={handleSaveService} className="space-y-4 font-sans text-xs">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Service Title *</label>
                        <input
                          type="text"
                          required
                          value={serviceTitle}
                          onChange={(e) => setServiceTitle(e.target.value)}
                          placeholder="e.g. n8n workflow pipeline automation"
                          className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4.5 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Service Description *</label>
                        <textarea
                          required
                          rows={3}
                          value={serviceDesc}
                          onChange={(e) => setServiceDesc(e.target.value)}
                          placeholder="Explain what S-CODERS offers in high-fidelity details..."
                          className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4.5 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Lucide Icon name</label>
                          <select
                            value={serviceIcon}
                            onChange={(e) => setServiceIcon(e.target.value)}
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-brand-teal transition-colors cursor-pointer"
                          >
                            <option value="BrainCircuit">BrainCircuit (AI)</option>
                            <option value="Smartphone">Smartphone (Mobile)</option>
                            <option value="Globe">Globe (Web)</option>
                            <option value="Cpu">Cpu (Custom Software)</option>
                            <option value="Palette">Palette (UI/UX)</option>
                            <option value="Users">Users (Consulting)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Value Proposition *</label>
                          <input
                            type="text"
                            required
                            value={serviceValue}
                            onChange={(e) => setServiceValue(e.target.value)}
                            placeholder="e.g. Cuts operational workload by 75%"
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Technologies (comma separated) *</label>
                        <input
                          type="text"
                          required
                          value={serviceTechs}
                          onChange={(e) => setServiceTechs(e.target.value)}
                          placeholder="Gemini API, n8n, Node.js, Python"
                          className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex-grow py-3 bg-brand-teal hover:bg-white text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                        >
                          {editingId ? 'Apply Modifications' : 'Create Service Entry'}
                        </button>
                        {editingId && (
                          <button
                            type="button"
                            onClick={resetServiceForm}
                            className="px-4 py-3 bg-white/5 border border-white/10 hover:border-brand-coral hover:text-brand-coral rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Right: Existing Dynamic Services List */}
                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="font-display font-bold text-lg text-white">Dynamic Services Catalog ({services.length})</h3>
                    
                    <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2">
                      {services.map((svc) => (
                        <div key={svc.id} className="bg-brand-dark/50 border border-white/5 p-4 rounded-xl flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-brand-teal font-semibold">[{svc.icon}]</span>
                              <h4 className="text-sm font-display font-bold text-white">{svc.title}</h4>
                            </div>
                            <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{svc.description}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {svc.technologies.map((t, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] font-mono text-gray-500">{t}</span>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleEditService(svc)}
                              className="p-2 bg-white/5 hover:bg-brand-teal/15 text-gray-400 hover:text-brand-teal border border-white/5 rounded-lg transition-colors cursor-pointer"
                              title="Edit Service"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteService(svc.id)}
                              className="p-2 bg-white/5 hover:bg-brand-coral/15 text-gray-400 hover:text-brand-coral border border-white/5 rounded-lg transition-colors cursor-pointer"
                              title="Delete Service"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: WORKSHOPS/SEMINARS MANAGEMENT */}
              {activeTab === 'workshops' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left: Dynamic Add / Edit Workshop Form */}
                  <div className="lg:col-span-5 bg-brand-dark/40 border border-white/5 rounded-2xl p-6 space-y-4">
                    <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-brand-teal" />
                      {editingId ? 'Modify Seminar Event' : 'Add New Tech Workshop'}
                    </h3>

                    <form onSubmit={handleSaveWorkshop} className="space-y-3.5 font-sans text-xs">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Workshop Title *</label>
                        <input
                          type="text"
                          required
                          value={workshopTitle}
                          onChange={(e) => setWorkshopTitle(e.target.value)}
                          placeholder="Building n8n & Gemini Agents masterclass"
                          className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Event Date *</label>
                          <input
                            type="text"
                            required
                            value={workshopDate}
                            onChange={(e) => setWorkshopDate(e.target.value)}
                            placeholder="June 18, 2026"
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Start Time *</label>
                          <input
                            type="text"
                            required
                            value={workshopStartTime}
                            onChange={(e) => setWorkshopStartTime(e.target.value)}
                            placeholder="10:00 AM IST"
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Event Location *</label>
                          <input
                            type="text"
                            required
                            value={workshopLocation}
                            onChange={(e) => setWorkshopLocation(e.target.value)}
                            placeholder="Microsoft Reactor, Bengaluru"
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Category / Tag</label>
                          <input
                            type="text"
                            value={workshopCategory}
                            onChange={(e) => setWorkshopCategory(e.target.value)}
                            placeholder="e.g. AI"
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Ticket Price (₹) *</label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={workshopPrice}
                            onChange={(e) => setWorkshopPrice(Number(e.target.value))}
                            placeholder="1499"
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Attendees</label>
                          <input
                            type="number"
                            value={workshopAttendees}
                            onChange={(e) => setWorkshopAttendees(Number(e.target.value))}
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Workshop Summary Description *</label>
                        <textarea
                          required
                          rows={2}
                          value={workshopSummary}
                          onChange={(e) => setWorkshopSummary(e.target.value)}
                          placeholder="High level overview of student learning curriculum..."
                          className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Workshop Duration / Time Needed *</label>
                        <input
                          type="text"
                          value={workshopDuration}
                          onChange={(e) => setWorkshopDuration(e.target.value)}
                          placeholder="e.g. 2 Days (8 Hours Total) or 3 Days Masterclass"
                          className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Tools & Tech Stack Used (Comma separated) *</label>
                        <input
                          type="text"
                          value={workshopTools}
                          onChange={(e) => setWorkshopTools(e.target.value)}
                          placeholder="e.g. n8n, Gemini 2.5 API, React, Docker, Node.js"
                          className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Usefulness & Key Learning Benefits (One per line) *</label>
                        <textarea
                          rows={3}
                          value={workshopUsefulness}
                          onChange={(e) => setWorkshopUsefulness(e.target.value)}
                          placeholder={"Build automated multi-agent AI pipelines\nIntegrate LLM APIs into full-stack web/mobile apps\nReceive S-CODERS Certified AI Developer Badge"}
                          className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Prerequisites & Preparation *</label>
                        <input
                          type="text"
                          value={workshopPrerequisites}
                          onChange={(e) => setWorkshopPrerequisites(e.target.value)}
                          placeholder="e.g. Basic API concepts, JS/TS knowledge & laptop with Node.js"
                          className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Event Photo URL (Optional)</label>
                        <input
                          type="text"
                          value={workshopPhoto}
                          onChange={(e) => setWorkshopPhoto(e.target.value)}
                          placeholder="Unsplash image link..."
                          className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                        />
                      </div>

                      {/* Achievements */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-0.5">Highlights/Milestones (Up to 3):</label>
                        <input
                          type="text"
                          value={workshopAch1}
                          onChange={(e) => setWorkshopAch1(e.target.value)}
                          placeholder="Milestone 1: trained 150+ devs"
                          className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2 text-[11px] text-white focus:outline-none focus:border-brand-teal transition-colors"
                        />
                        <input
                          type="text"
                          value={workshopAch2}
                          onChange={(e) => setWorkshopAch2(e.target.value)}
                          placeholder="Milestone 2: built 3 live models"
                          className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2 text-[11px] text-white focus:outline-none focus:border-brand-teal transition-colors"
                        />
                        <input
                          type="text"
                          value={workshopAch3}
                          onChange={(e) => setWorkshopAch3(e.target.value)}
                          placeholder="Milestone 3: feedback rating 4.9/5"
                          className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2 text-[11px] text-white focus:outline-none focus:border-brand-teal transition-colors"
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          className="flex-grow py-3 bg-brand-teal hover:bg-white text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                        >
                          {editingId ? 'Modify Seminar' : 'Create Workshop Event'}
                        </button>
                        {editingId && (
                          <button
                            type="button"
                            onClick={resetWorkshopForm}
                            className="px-4 py-3 bg-white/5 border border-white/10 hover:border-brand-coral hover:text-brand-coral rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Right: Existing Workshops */}
                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="font-display font-bold text-lg text-white">Dynamic Seminars ({workshops.length})</h3>

                    <div className="grid grid-cols-1 gap-3 max-h-[520px] overflow-y-auto pr-2">
                      {workshops.map((w) => (
                        <div key={w.id} className="bg-brand-dark/50 border border-white/5 p-4 rounded-xl flex items-start gap-4">
                          <img
                            src={w.photo}
                            alt={w.title}
                            className="w-20 h-20 rounded-lg object-cover bg-brand-card shrink-0"
                          />
                          <div className="space-y-1 flex-grow">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-brand-teal uppercase tracking-widest">{w.category}</span>
                              <span className="text-[9px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">{w.duration || '2 Days'}</span>
                            </div>
                            <h4 className="text-sm font-display font-bold text-white leading-tight">{w.title}</h4>
                            <p className="text-gray-500 text-[10px] font-mono">{w.date} {w.startTime ? `• ${w.startTime}` : ''} • {w.location}</p>
                            <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mt-1">{w.summary}</p>
                            {w.toolsUsed && w.toolsUsed.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {w.toolsUsed.slice(0, 4).map((tool, idx) => (
                                  <span key={idx} className="text-[8px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-gray-300">
                                    {tool}
                                  </span>
                                ))}
                                {w.toolsUsed.length > 4 && (
                                  <span className="text-[8px] font-mono text-gray-500">+{w.toolsUsed.length - 4} more</span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleEditWorkshop(w)}
                              className="p-2 bg-white/5 hover:bg-brand-teal/15 text-gray-400 hover:text-brand-teal border border-white/5 rounded-lg transition-colors cursor-pointer"
                              title="Edit Workshop"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteWorkshop(w.id)}
                              className="p-2 bg-white/5 hover:bg-brand-coral/15 text-gray-400 hover:text-brand-coral border border-white/5 rounded-lg transition-colors cursor-pointer"
                              title="Delete Workshop"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* BOTTOM SUB-SECTIONS: Registrations & Feedbacks */}
                  <div className="lg:col-span-12 border-t border-white/5 pt-8 mt-4 space-y-8">
                    {/* Active Tech Seminar Ticket Registrations */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-brand-teal" />
                            Active Seminar Ticket Bookings ({Object.keys(registeredWorkshops).length})
                          </h3>
                          <p className="text-gray-500 text-xs font-sans">These users have completed payment and unlocked their technical classroom sandbox.</p>
                        </div>
                        {Object.keys(registeredWorkshops).length > 0 && (
                          <button
                            onClick={() => {
                              if (confirm('Clear all ticket bookings history?')) {
                                localStorage.removeItem('scoders_registered_workshops');
                                setRegisteredWorkshops({});
                              }
                            }}
                            className="text-[10px] font-mono text-brand-coral hover:underline uppercase tracking-wider cursor-pointer"
                          >
                            Clear Booking Registry
                          </button>
                        )}
                      </div>

                      <div className="bg-brand-dark/50 border border-white/5 rounded-2xl overflow-hidden">
                        {Object.keys(registeredWorkshops).length === 0 ? (
                          <div className="p-12 text-center text-gray-500 font-mono text-xs">
                            No seminar bookings or checkouts logged yet.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-brand-dark border-b border-white/5 font-mono text-[9px] text-gray-500 uppercase tracking-widest">
                                  <th className="p-4 pl-6">LICENSE KEY</th>
                                  <th className="p-4">ATTENDEE NAME</th>
                                  <th className="p-4">EMAIL</th>
                                  <th className="p-4">SEMINAR EVENT</th>
                                  <th className="p-4 font-mono text-center">TICKETS</th>
                                  <th className="p-4 font-mono text-right">TOTAL PAID</th>
                                  <th className="p-4 font-mono text-center">REG DATE</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 font-sans">
                                {Object.keys(registeredWorkshops).map((wId) => {
                                  const reg = registeredWorkshops[wId];
                                  const wksp = workshops.find(w => w.id === wId);
                                  return (
                                    <tr key={wId} className="hover:bg-white/[1%] transition-colors">
                                      <td className="p-4 pl-6 font-mono font-bold text-brand-teal">{reg.key}</td>
                                      <td className="p-4">
                                        <div className="font-semibold text-white">{reg.name}</div>
                                        <div className="text-[10px] text-gray-500 font-mono">{reg.role}</div>
                                      </td>
                                      <td className="p-4 text-gray-400">{reg.email}</td>
                                      <td className="p-4 text-gray-300 font-medium truncate max-w-xs">{wksp?.title || 'Tech Seminar'}</td>
                                      <td className="p-4 font-mono font-bold text-brand-teal text-center">{reg.tickets || 1} Pass</td>
                                      <td className="p-4 text-right font-display font-black text-white">
                                        ₹{(reg.totalPaid || 1499).toLocaleString()}
                                      </td>
                                      <td className="p-4 text-center font-mono text-gray-500">{reg.timestamp || 'TBD'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Seminar Participant Feedbacks/Reviews */}
                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-400" />
                            Seminar Participant Reviews ({workshopComments.length})
                          </h3>
                          <p className="text-gray-500 text-xs font-sans">These reviews are submitted by students directly from the Workshops Classroom page.</p>
                        </div>
                        {workshopComments.length > 0 && (
                          <button
                            onClick={() => {
                              if (confirm('Clear all review logs?')) {
                                localStorage.removeItem('scoders_comments');
                                setWorkshopComments([]);
                              }
                            }}
                            className="text-[10px] font-mono text-brand-coral hover:underline uppercase tracking-wider cursor-pointer"
                          >
                            Clear Review History
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {workshopComments.length === 0 ? (
                          <div className="col-span-full p-10 text-center text-gray-500 font-mono text-xs">
                            No seminar review logs received yet.
                          </div>
                        ) : (
                          workshopComments.map((comment: any) => {
                            const wksp = workshops.find(w => w.id === comment.workshopId);
                            return (
                              <div key={comment.id} className="bg-brand-dark/50 border border-white/5 p-5 rounded-2xl relative flex flex-col justify-between">
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this review log?')) {
                                      const updated = workshopComments.filter((c: any) => c.id !== comment.id);
                                      setWorkshopComments(updated);
                                      localStorage.setItem('scoders_comments', JSON.stringify(updated));
                                    }
                                  }}
                                  className="absolute top-4 right-4 text-gray-600 hover:text-brand-coral transition-colors"
                                  title="Remove review"
                                >
                                  <X className="w-4 h-4" />
                                </button>

                                <div className="space-y-3">
                                  <div className="flex items-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star key={star} className={`w-3.5 h-3.5 ${
                                        star <= (comment.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-gray-700'
                                      }`} />
                                    ))}
                                    <span className="text-[10px] text-gray-500 font-mono ml-1">({comment.timestamp})</span>
                                  </div>

                                  <div>
                                    <h5 className="font-display font-bold text-sm text-white">{comment.authorName}</h5>
                                    <span className="text-[10px] text-brand-teal font-mono uppercase tracking-widest">{comment.role}</span>
                                    {wksp && (
                                      <div className="text-[10px] text-gray-500 mt-1 truncate">Event: <span className="text-gray-400">{wksp.title}</span></div>
                                    )}
                                  </div>

                                  <p className="text-gray-300 text-xs italic leading-relaxed bg-brand-dark/30 p-3 rounded-xl border border-white/5">
                                    "{comment.content}"
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: DYNAMIC CLIENT INVOICES */}
              {activeTab === 'invoices' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left: Dynamic Add Invoice Form */}
                  <div className="lg:col-span-5 bg-brand-dark/40 border border-white/5 rounded-2xl p-6 space-y-4">
                    <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-brand-teal" />
                      Issue Client Billing Invoice
                    </h3>

                    <form onSubmit={handleSaveInvoice} className="space-y-4 font-sans text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Invoice ID</label>
                          <input
                            type="text"
                            value={invoiceId}
                            onChange={(e) => setInvoiceId(e.target.value)}
                            placeholder="e.g. INV-2026-003"
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Client Name *</label>
                          <input
                            type="text"
                            required
                            value={invoiceClient}
                            onChange={(e) => setInvoiceClient(e.target.value)}
                            placeholder="Suhas Agro Farms"
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Client Email</label>
                          <input
                            type="email"
                            value={invoiceContact}
                            onChange={(e) => setInvoiceContact(e.target.value)}
                            placeholder="billing@agro.in"
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Due Date</label>
                          <input
                            type="text"
                            value={invoiceDue}
                            onChange={(e) => setInvoiceDue(e.target.value)}
                            placeholder="e.g. August 05, 2026"
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Billing Purpose / Scope *</label>
                        <input
                          type="text"
                          required
                          value={invoicePurpose}
                          onChange={(e) => setInvoicePurpose(e.target.value)}
                          placeholder="e.g. Mobile Application design sprint payment"
                          className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Billing Value *</label>
                          <input
                            type="number"
                            required
                            value={invoiceAmount || ''}
                            onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Currency</label>
                          <select
                            value={invoiceCurrency}
                            onChange={(e) => setInvoiceCurrency(e.target.value as any)}
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-teal transition-colors cursor-pointer"
                          >
                            <option value="INR">INR (₹)</option>
                            <option value="USD">USD ($)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-brand-teal hover:bg-white text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        Publish Live Invoice
                        <Receipt className="w-4 h-4" />
                      </button>
                    </form>
                  </div>

                  {/* Right: Issued Dynamic Invoices */}
                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="font-display font-bold text-lg text-white">Active Invoices Settleable online ({invoices.length})</h3>

                    <div className="grid grid-cols-1 gap-3 max-h-[460px] overflow-y-auto pr-2">
                      {invoices.map((inv) => (
                        <div key={inv.id} className="bg-brand-dark/50 border border-white/5 p-4.5 rounded-xl flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-brand-teal/10 border border-brand-teal/20 text-brand-teal font-mono text-[9px] font-bold rounded">
                                {inv.id}
                              </span>
                              <h4 className="text-sm font-display font-bold text-white">{inv.client}</h4>
                            </div>
                            <p className="text-gray-400 text-xs font-sans mt-1">{inv.purpose}</p>
                            <p className="text-gray-500 text-[10px] font-mono">Contact: {inv.contact} • Due: {inv.dueBy}</p>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="font-display font-black text-white text-base">
                              {inv.currency === 'INR' ? '₹' : '$'}{inv.amount.toLocaleString()}
                            </span>
                            <button
                              onClick={() => handleDeleteInvoice(inv.id)}
                              className="p-2 bg-white/5 hover:bg-brand-coral/15 text-gray-500 hover:text-brand-coral rounded-lg border border-white/5 transition-colors cursor-pointer"
                              title="Delete Invoice Preset"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB: NETWORKING & PHOTOSTREAM MANAGEMENT */}
              {activeTab === 'networking' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left: Dynamic Add / Edit Form */}
                  <div className="lg:col-span-5 bg-brand-dark/40 border border-white/5 rounded-2xl p-6 space-y-4">
                    <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                      <Camera className="w-4 h-4 text-brand-teal" />
                      {editingId ? 'Modify Event Snapshot' : 'Register Event Snapshot'}
                    </h3>
                    
                    <form onSubmit={handleSaveNetworking} className="space-y-4 font-sans text-xs">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Event Name / Title *</label>
                        <input
                          type="text"
                          required
                          value={netTitle}
                          onChange={(e) => setNetTitle(e.target.value)}
                          placeholder="e.g. eChai Demo Night panel"
                          className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4.5 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Event Type</label>
                          <select
                            value={netType}
                            onChange={(e) => setNetType(e.target.value as 'attended' | 'conducted')}
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-brand-teal transition-colors cursor-pointer"
                          >
                            <option value="conducted">Conducted by us</option>
                            <option value="attended">Attended by us</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Date *</label>
                          <input
                            type="text"
                            required
                            value={netDate}
                            onChange={(e) => setNetDate(e.target.value)}
                            placeholder="e.g. July 12, 2026"
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Physical Location *</label>
                          <input
                            type="text"
                            required
                            value={netLocation}
                            onChange={(e) => setNetLocation(e.target.value)}
                            placeholder="e.g. BHIVE HSR Layout"
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Attendees (Est.)</label>
                          <input
                            type="number"
                            value={netAttendees}
                            onChange={(e) => setNetAttendees(Number(e.target.value))}
                            placeholder="45"
                            className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Snapshot Summary Description *</label>
                        <textarea
                          required
                          rows={3}
                          value={netDescription}
                          onChange={(e) => setNetDescription(e.target.value)}
                          placeholder="What did we showcase? Explain in depth to build instant trust..."
                          className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4.5 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors resize-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold">
                            Event Photos (Up to 8 Photos)
                          </label>
                          <span className="text-[10px] font-mono text-brand-teal font-bold">
                            {netImages.length} / 8 Photos
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Staged photos list */}
                          {netImages.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 p-2 bg-black/40 rounded-xl border border-white/5">
                              {netImages.map((imgUrl, idx) => (
                                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-brand-teal/40 group bg-black">
                                  <img src={imgUrl} alt={`Moment ${idx}`} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => setNetImages(prev => prev.filter((_, i) => i !== idx))}
                                    className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[8px] font-mono uppercase font-bold"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* File Uploader for multiple files */}
                          <label className="cursor-pointer block">
                            <div className="flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-brand-teal/40 bg-brand-dark/30 rounded-xl py-3 px-3 text-center transition-all">
                              <Upload className="w-4 h-4 text-brand-teal mb-1" />
                              <span className="text-[9px] font-mono text-gray-300 font-bold uppercase">
                                Upload Photos (Select up to 8 images)
                              </span>
                              <span className="text-[7px] text-gray-500 font-mono mt-0.5">Click to choose image files from computer</span>
                            </div>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) {
                                  const remaining = Math.max(0, 8 - netImages.length);
                                  const totalToRead = Math.min(files.length, remaining);
                                  for (let i = 0; i < totalToRead; i++) {
                                    const file = files[i];
                                    if (!file) continue;
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      if (ev.target?.result) {
                                        setNetImages(prev => {
                                          if (prev.length >= 8) return prev;
                                          return [...prev, ev.target!.result as string];
                                        });
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }
                              }}
                            />
                          </label>

                          <div className="flex items-center gap-3">
                            <div className="h-px bg-white/5 flex-1" />
                            <span className="text-[9px] font-mono text-gray-600 uppercase">OR ADD PHOTO VIA URL</span>
                            <div className="h-px bg-white/5 flex-1" />
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={netImage}
                              onChange={(e) => setNetImage(e.target.value)}
                              placeholder="https://images.unsplash.com/photo-..."
                              className="flex-1 bg-brand-dark/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal text-xs transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (netImage.trim() && netImages.length < 8) {
                                  setNetImages(prev => [...prev, netImage.trim()]);
                                  setNetImage('');
                                }
                              }}
                              disabled={!netImage.trim() || netImages.length >= 8}
                              className="px-4 py-2.5 bg-brand-teal/20 hover:bg-brand-teal text-brand-teal hover:text-brand-dark rounded-xl font-mono text-xs font-bold transition-all disabled:opacity-30 cursor-pointer"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-500 font-mono mt-1">Upload up to 8 photos for in-card sliding and full-screen lightbox viewing.</p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Keywords / Tags (Comma Separated)</label>
                        <input
                          type="text"
                          value={netTags}
                          onChange={(e) => setNetTags(e.target.value)}
                          placeholder="e.g. AI Meetup, Bengaluru Startup, n8n"
                          className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-4.5 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                        />
                      </div>

                      <div className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          id="netFeatured"
                          checked={netFeatured}
                          onChange={(e) => setNetFeatured(e.target.checked)}
                          className="w-4 h-4 rounded border-white/10 bg-brand-dark focus:ring-0 text-brand-teal cursor-pointer"
                        />
                        <label htmlFor="netFeatured" className="text-[10px] font-mono text-gray-400 uppercase tracking-wider cursor-pointer selection:bg-transparent font-bold">
                          Highly Featured on Showcase Gallery
                        </label>
                      </div>

                      <div className="pt-2 flex items-center gap-3">
                        {editingId && (
                          <button
                            type="button"
                            onClick={resetNetworkingForm}
                            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-mono text-gray-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="submit"
                          className="flex-1 px-5 py-3 bg-brand-teal text-brand-dark hover:bg-white rounded-xl font-mono uppercase tracking-wider font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          {editingId ? 'Save Changes' : 'Publish Snapshot'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Right: Existing Photostream List */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h3 className="font-display font-bold text-base text-white">Live Photostream Directory ({networkingMoments.length})</h3>
                      <span className="text-[10px] font-mono text-gray-500 uppercase">Interactive traction verified</span>
                    </div>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                      {networkingMoments.length === 0 ? (
                        <div className="p-16 text-center border border-white/5 rounded-2xl bg-brand-dark/40">
                          <Camera className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-500 text-xs font-mono">No live snapshots uploaded yet.</p>
                        </div>
                      ) : (
                        networkingMoments.map((mom) => (
                          <div key={mom.id} className="bg-brand-dark/40 border border-white/5 p-4 rounded-xl flex items-start gap-4 hover:border-brand-teal/20 transition-all">
                            <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-brand-dark border border-white/10">
                              <img src={mom.image} alt={mom.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                                  mom.type === 'conducted'
                                    ? 'bg-brand-teal/10 border border-brand-teal/20 text-brand-teal'
                                    : 'bg-brand-coral/10 border border-brand-coral/20 text-brand-coral'
                                }`}>
                                  {mom.type}
                                </span>
                                {mom.featured && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-mono font-bold uppercase">
                                    Featured
                                  </span>
                                )}
                                <span className="text-[10px] font-mono text-gray-500">{mom.eventDate}</span>
                              </div>
                              <h4 className="text-sm font-semibold text-white truncate" title={mom.title}>{mom.title}</h4>
                              <p className="text-xs text-gray-400 font-sans line-clamp-2 leading-relaxed">{mom.description}</p>
                              <p className="text-[10px] text-gray-500 font-mono italic">Location: {mom.location}</p>
                            </div>

                            <div className="flex flex-col gap-1.5 shrink-0 ml-2">
                              <button
                                onClick={() => handleEditNetworking(mom)}
                                className="p-1.5 bg-white/5 hover:bg-brand-teal/15 text-gray-400 hover:text-brand-teal rounded-lg border border-white/5 transition-colors cursor-pointer"
                                title="Edit Snapshot Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteNetworking(mom.id)}
                                className="p-1.5 bg-white/5 hover:bg-brand-coral/15 text-gray-400 hover:text-brand-coral rounded-lg border border-white/5 transition-colors cursor-pointer"
                                title="Remove Snapshot Moment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 4: TRANSACTION LEDGER */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Direct Payment Registry / Ledger logs</h3>
                      <p className="text-gray-500 text-xs font-sans">View client payments received dynamically from UPI, card, and NEFT channels.</p>
                    </div>
                    {payments.length > 0 && (
                      <button
                        onClick={() => {
                          if (confirm('Clear entire dynamic billing logs?')) {
                            localStorage.removeItem('scoders_payments');
                            setPayments([]);
                            if (onRefreshData) onRefreshData();
                          }
                        }}
                        className="text-[10px] font-mono text-brand-coral hover:underline uppercase tracking-wider cursor-pointer"
                      >
                        Clear Ledger History
                      </button>
                    )}
                  </div>

                  <div className="bg-brand-dark/50 border border-white/5 rounded-2xl overflow-hidden">
                    {payments.length === 0 ? (
                      <div className="p-16 text-center space-y-3">
                        <Receipt className="w-10 h-10 text-gray-600 mx-auto" />
                        <p className="text-gray-500 text-xs font-mono">No customer checkout logs received yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-brand-dark border-b border-white/5 font-mono text-[9px] text-gray-500 uppercase tracking-widest">
                              <th className="p-4 pl-6">TXN ID</th>
                              <th className="p-4">CLIENT NAME</th>
                              <th className="p-4">EMAIL</th>
                              <th className="p-4">PURPOSE / SCOPE</th>
                              <th className="p-4">METHOD</th>
                              <th className="p-4">TIMESTAMP</th>
                              <th className="p-4 text-right">AMOUNT</th>
                              <th className="p-4 pr-6 text-center">STATUS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-sans">
                            {payments.map((txn) => (
                              <tr key={txn.txnId} className="hover:bg-white/[1%] transition-colors">
                                <td className="p-4 pl-6 font-mono font-bold text-brand-teal">{txn.txnId}</td>
                                <td className="p-4 font-semibold text-white">{txn.clientName}</td>
                                <td className="p-4 text-gray-400">{txn.email}</td>
                                <td className="p-4 text-gray-300 max-w-xs truncate" title={txn.purpose}>{txn.purpose}</td>
                                <td className="p-4 font-mono text-gray-500">{txn.method}</td>
                                <td className="p-4 font-mono text-gray-500">{txn.timestamp}</td>
                                <td className="p-4 text-right font-display font-black text-white">
                                  {txn.currency === 'INR' ? '₹' : '$'}{txn.amount.toLocaleString()}
                                </td>
                                <td className="p-4 pr-6 text-center">
                                  <span className="inline-flex px-2 py-0.5 bg-brand-teal/10 border border-brand-teal/20 text-brand-teal rounded text-[9px] font-mono font-bold">
                                    {txn.status || 'SUCCESS'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: INQUIRIES & MESSAGES LEADS SUBMISSIONS */}
              {activeTab === 'leads' && (
                <div className="space-y-8">
                  
                  {/* Part A: Project Briefs */}
                  <div className="space-y-4">
                    <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-brand-teal" />
                      Services Project Spec Briefs ({enquiries.length})
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {enquiries.length === 0 ? (
                        <div className="col-span-2 p-10 text-center bg-brand-dark/40 border border-white/5 rounded-2xl">
                          <p className="text-gray-500 text-xs font-mono">No custom client briefs logged yet.</p>
                        </div>
                      ) : (
                        enquiries.map((enq) => (
                          <div key={enq.id} className="bg-brand-dark/50 border border-white/5 p-6 rounded-2xl flex flex-col justify-between relative">
                            <button
                              onClick={() => handleDeleteEnquiry(enq.id)}
                              className="absolute top-4 right-4 text-gray-600 hover:text-brand-coral p-1 transition-colors cursor-pointer"
                              title="Clear enquiry log"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-brand-teal/10 border border-brand-teal/20 text-brand-teal font-mono text-[9px] font-bold rounded uppercase">
                                  {enq.category}
                                </span>
                                <span className="text-gray-500 font-mono text-[10px]">{enq.timestamp}</span>
                              </div>

                              <div>
                                <h4 className="text-sm font-display font-bold text-white">{enq.clientName}</h4>
                                <p className="text-xs text-brand-teal font-mono">{enq.email}</p>
                              </div>

                              <div className="bg-brand-dark/80 p-4 rounded-xl border border-white/5">
                                <p className="text-gray-300 text-xs leading-relaxed italic">"{enq.requirements}"</p>
                              </div>
                            </div>

                            <div className="flex gap-4 pt-4 mt-4 border-t border-white/5 font-mono text-[10px] text-gray-500">
                              <div>
                                <span className="block uppercase text-[8px] text-gray-600">Budget</span>
                                <span className="text-gray-300 font-semibold">{enq.budget || 'Not Specified'}</span>
                              </div>
                              <div>
                                <span className="block uppercase text-[8px] text-gray-600">Timeline</span>
                                <span className="text-gray-300 font-semibold">{enq.timeline || 'Not Specified'}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Part B: Contact submissions */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                      <Mail className="w-5 h-5 text-brand-coral" />
                      Contact Forms & Proposals ({messages.length})
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {messages.length === 0 ? (
                        <div className="col-span-2 p-10 text-center bg-brand-dark/40 border border-white/5 rounded-2xl">
                          <p className="text-gray-500 text-xs font-mono">No contact forms transmitted yet.</p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div key={msg.id} className="bg-brand-dark/50 border border-white/5 p-6 rounded-2xl flex flex-col justify-between relative">
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="absolute top-4 right-4 text-gray-600 hover:text-brand-coral p-1 transition-colors cursor-pointer"
                              title="Delete message log"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-brand-coral/15 border border-brand-coral/25 text-brand-coral font-mono text-[9px] font-bold rounded uppercase">
                                  {msg.interest}
                                </span>
                                <span className="text-gray-500 font-mono text-[10px]">{msg.timestamp}</span>
                              </div>

                              <div>
                                <h4 className="text-sm font-display font-bold text-white">{msg.name}</h4>
                                <p className="text-xs text-gray-400 font-mono">Email: {msg.email} • Tel: {msg.phone}</p>
                                <p className="text-[10px] text-gray-500 font-mono uppercase mt-0.5">Org: {msg.company}</p>
                              </div>

                              <div className="bg-brand-dark/80 p-4 rounded-xl border border-white/5">
                                <p className="text-gray-300 text-xs leading-relaxed italic">"{msg.message}"</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Part C: Active Services Custom Workspaces (Project Space Dashboards) */}
                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                          <Cpu className="w-5 h-5 text-brand-teal" />
                          Active Client Custom Services Workspaces ({Object.keys(registeredServices).length})
                        </h3>
                        <p className="text-gray-500 text-xs font-sans">Active client workspaces created upon custom service registration. Clients use these for live analysis and chat.</p>
                      </div>
                      {Object.keys(registeredServices).length > 0 && (
                        <button
                          onClick={() => {
                            if (confirm('Clear all custom service workspaces?')) {
                              localStorage.removeItem('scoders_registered_services');
                              setRegisteredServices({});
                            }
                          }}
                          className="text-[10px] font-mono text-brand-coral hover:underline uppercase tracking-wider cursor-pointer"
                        >
                          Clear Workspace Registry
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(registeredServices).length === 0 ? (
                        <div className="col-span-2 p-10 text-center bg-brand-dark/40 border border-white/5 rounded-2xl">
                          <p className="text-gray-500 text-xs font-mono">No client custom workspaces active yet.</p>
                        </div>
                      ) : (
                        Object.keys(registeredServices).map((svcId) => {
                          const reg = registeredServices[svcId];
                          const svc = services.find(s => s.id === svcId);
                          return (
                            <div key={svcId} className="bg-brand-dark/50 border border-white/5 p-6 rounded-2xl flex flex-col justify-between relative space-y-4">
                              <button
                                onClick={() => {
                                  if (confirm('Delete this active workspace?')) {
                                    const updated = { ...registeredServices };
                                    delete updated[svcId];
                                    setRegisteredServices(updated);
                                    localStorage.setItem('scoders_registered_services', JSON.stringify(updated));
                                  }
                                }}
                                className="absolute top-4 right-4 text-gray-600 hover:text-brand-coral transition-colors"
                                title="Decommission workspace"
                              >
                                <X className="w-4 h-4" />
                              </button>

                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-brand-teal/10 border border-brand-teal/20 text-brand-teal font-mono text-[9px] font-bold rounded uppercase">
                                    {svc?.title || 'Custom Service'}
                                  </span>
                                  <span className="text-gray-500 font-mono text-[10px]">{reg.timestamp}</span>
                                </div>

                                <div>
                                  <h4 className="text-sm font-display font-bold text-white">{reg.name}</h4>
                                  <p className="text-xs text-brand-teal font-mono">Email: {reg.email}</p>
                                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded bg-brand-teal/5 border border-brand-teal/10 text-brand-teal text-[9px] font-mono">
                                    CUSTOM PASS: {reg.key}
                                  </div>
                                </div>

                                <div className="bg-brand-dark/80 p-4 rounded-xl border border-white/5 space-y-2">
                                  <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest">Requirements Brief</span>
                                  <p className="text-gray-300 text-xs leading-relaxed italic">"{reg.requirements || 'No custom details added'}"</p>
                                </div>
                              </div>

                              <div className="flex gap-4 pt-3 border-t border-white/5 font-mono text-[10px] text-gray-500">
                                <div>
                                  <span className="block uppercase text-[8px] text-gray-600">Role</span>
                                  <span className="text-gray-300 font-semibold">{reg.role || 'Not Specified'}</span>
                                </div>
                                <div>
                                  <span className="block uppercase text-[8px] text-gray-600">Budget</span>
                                  <span className="text-gray-300 font-semibold">{reg.budget || 'Not Specified'}</span>
                                </div>
                                <div>
                                  <span className="block uppercase text-[8px] text-gray-600">Timeline</span>
                                  <span className="text-gray-300 font-semibold">{reg.timeline || 'Not Specified'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Part D: Client Project Space Feedbacks & Ratings */}
                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                          <Star className="w-5 h-5 text-amber-400" />
                          Client Project Space Feedbacks ({serviceFeedbacks.length})
                        </h3>
                        <p className="text-gray-500 text-xs font-sans">These ratings are submitted by clients from their active project dashboards after receiving S-CODERS deliverables.</p>
                      </div>
                      {serviceFeedbacks.length > 0 && (
                        <button
                          onClick={() => {
                            if (confirm('Clear all client project feedbacks?')) {
                              localStorage.removeItem('scoders_feedbacks');
                              setServiceFeedbacks([]);
                            }
                          }}
                          className="text-[10px] font-mono text-brand-coral hover:underline uppercase tracking-wider cursor-pointer"
                        >
                          Clear Feedback logs
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {serviceFeedbacks.length === 0 ? (
                        <div className="col-span-full p-10 text-center text-gray-500 font-mono text-xs">
                          No client feedbacks or delivery rating logs received yet.
                        </div>
                      ) : (
                        serviceFeedbacks.map((feedback: any, index: number) => (
                          <div key={index} className="bg-brand-dark/50 border border-white/5 p-5 rounded-2xl relative flex flex-col justify-between">
                            <button
                              onClick={() => {
                                if (confirm('Delete this feedback log?')) {
                                  const updated = serviceFeedbacks.filter((_, i) => i !== index);
                                  setServiceFeedbacks(updated);
                                  localStorage.setItem('scoders_feedbacks', JSON.stringify(updated));
                                }
                              }}
                              className="absolute top-4 right-4 text-gray-600 hover:text-brand-coral transition-colors"
                              title="Remove feedback log"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            <div className="space-y-3">
                              <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className={`w-3.5 h-3.5 ${
                                    star <= (feedback.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-gray-700'
                                  }`} />
                                ))}
                                <span className="text-[10px] text-gray-500 font-mono ml-1">({feedback.timestamp || 'Just now'})</span>
                              </div>

                              <div>
                                <h5 className="font-display font-bold text-sm text-white">{feedback.name}</h5>
                                <span className="text-[10px] text-brand-teal font-mono uppercase tracking-widest">{feedback.role} • {feedback.email}</span>
                                <div className="text-[10px] text-gray-500 mt-1 truncate">Project ID: <span className="text-gray-400">{feedback.serviceTitle || feedback.serviceId || 'Custom Service'}</span></div>
                              </div>

                              <p className="text-gray-300 text-xs italic leading-relaxed bg-brand-dark/30 p-3 rounded-xl border border-white/5">
                                "{feedback.experience}"
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
