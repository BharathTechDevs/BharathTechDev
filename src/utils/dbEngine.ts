import { AppUser, Service, WorkshopEvent, CandidateApplication } from '../types';
import { getLeaderPhoto } from './leaderPhotos';
import { syncRegistrationToFirestore } from '../firebase';

// ==========================================
// 1. DATABASE SCHEMA TYPES
// ==========================================

export interface ServiceRegistration {
  id: string; // e.g. "REG-SVC-8491"
  clientProfile: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
  serviceId: string;
  selectedServiceTitle: string;
  uniqueKey: string; // Assigned Client Service Key
  projectRequirements: string;
  notes?: string;
  budget: string;
  timeline: string;
  projectStatus: 'Pending' | 'In Progress' | 'Completed' | 'Delivered' | 'Cancelled';
  registrationDate: string;
  projectSubmissionDate: string;
  sourceCodeFileId: string | null; // Ref to FileRecord
  pdfFileId: string | null; // Ref to FileRecord
  chatId: string | null; // Ref to ChatConversation
  feedbackId: string | null; // Ref to FeedbackItem
  invoiceId: string | null; // Ref to DynamicInvoice
}

export interface RevokedPassRecord {
  passKey: string;
  workshopId: string;
  workshopTitle: string;
  participantName: string;
  participantEmail: string;
  revokedAt: string;
  revokedBy: string; // 'Admin'
  reason?: string;
  originalAmount?: number;
}

export interface WorkshopRegistration {
  id: string; // e.g. "REG-WKSP-7301"
  participantProfile: {
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  workshopId: string;
  workshopTitle: string;
  paymentStatus: 'Pending' | 'Processing' | 'Successful' | 'Failed' | 'Cancelled' | 'Refunded' | 'Revoked';
  isRevoked?: boolean;
  revokedAt?: string;
  revokedBy?: string;
  revokedReason?: string;
  amountPaid: number;
  paymentMethod: string; // "UPI", "PhonePe", "Google Pay", "Credit Card"
  paymentDate: string;
  transactionId: string; // e.g. "TXN-74891"
  uniqueAccessKey: string; // assigned workshop key
  notes?: string;
  materialsFileIds: string[]; // Ref to FileRecord[]
  chatId: string | null; // Ref to ChatConversation
  feedbackId: string | null; // Ref to FeedbackItem
}

export interface PaymentTransaction {
  id: string; // e.g. "TXN-284910"
  clientId: string; // references registered participant email or UID
  clientName: string;
  clientEmail: string;
  amount: number;
  paymentMethod: string;
  status: 'Pending' | 'Processing' | 'Successful' | 'Failed' | 'Cancelled' | 'Refunded';
  timestamp: string;
  reference: string; // e.g. "Workshop: LLM Fine-Tuning" or "Service Invoice #2"
  interrupted: boolean; // For tracking failed/interrupted transaction details
  failureReason: string | null;
}

export interface FeedbackItem {
  id: string; // e.g. "FDB-901"
  type: 'workshop' | 'service';
  clientName: string;
  clientEmail: string;
  registrationId: string; // Ref to ServiceRegistration / WorkshopRegistration
  rating: number; // 1 to 5
  review: string;
  submissionDate: string;
}

export interface ChatMessageItem {
  id: string;
  sender: 'client' | 'team';
  senderName?: string;
  senderRole?: string;
  content: string;
  timestamp: string;
  edited?: boolean;
  editedAt?: string;
}

export interface ChatConversation {
  id: string; // e.g. "CHT-5819" or "chat-wksp-..."
  clientName: string;
  clientEmail: string;
  registrationId: string; // Service / Workshop registration ID
  reference: string; // Selected service title or workshop title
  workshopId?: string;
  serviceId?: string;
  uniqueAccessKey?: string;
  messages: ChatMessageItem[];
  lastUpdated: string;
}

export interface FileRecord {
  id: string; // e.g. "FIL-84910"
  name: string;
  type: 'project_source_code' | 'project_pdf' | 'workshop_pdf' | 'workshop_source_code' | 'image' | 'other_document';
  url: string; // Simulated link
  size: string;
  clientId: string; // email or user id
  registrationId: string; // Service / Workshop Registration ID
  uploadDate: string;
}

export interface EnquiryItem {
  id: string; // e.g. "ENQ-9210"
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  timestamp: string;
  replyStatus: 'Pending' | 'Responded';
  replyMessage: string | null;
  replyDate: string | null;
}

export interface TeamMemberRecord {
  id: string;
  name: string;
  role: string;
  department: 'Management' | 'Design' | 'Engineering' | 'AI & Automation';
  contact: string;
  photoUrl: string;
  joiningDate: string;
  assignedProjects: string[]; // Project IDs/titles
  currentProjectStatus: string;
  bio?: string;
  expertise?: string[];
  githubUrl?: string;
  githubHandle?: string;
  linkedinUrl?: string;
  linkedinHandle?: string;
}

export interface GalleryMediaItem {
  id: string;
  title: string;
  category: 'workshop_photos' | 'event_photos' | 'service_related_images' | 'project_screenshots' | 'client_shared_images';
  imageUrl: string;
  uploadDate: string;
  relatedClientId: string | null;
  relatedWorkshopId: string | null;
}

// ==========================================
// 2. PRE-SEEDED SECTIONS DATA (PROFESSIONAL INITIAL STATE)
// ==========================================

const SEED_TEAM: TeamMemberRecord[] = [
  {
    id: 'T1',
    name: 'Shreyas M.',
    role: 'Founder & CEO — S-CODERS',
    department: 'Management',
    contact: 'shreyas@scoders.com',
    photoUrl: '/founder.jpg',
    joiningDate: '01/01/2026',
    assignedProjects: ['S-CODERS Core AI Platform', 'Bharat Tech Developers Systems'],
    currentProjectStatus: 'Directing & Expanding'
  },
  {
    id: 'T2',
    name: 'Lokesh A.',
    role: 'Co-Founder — S-CODERS',
    department: 'Management',
    contact: 'lokesh@scoders.com',
    photoUrl: '/cofounder.jpg',
    joiningDate: '01/01/2026',
    assignedProjects: ['Vibe Coder AI Workflows', 'Rapid Prototyping Systems'],
    currentProjectStatus: 'Building Real-World Products'
  },
  {
    id: 'T3',
    name: 'Bhuvan M.',
    role: 'Tech Lead • Backend & AI',
    department: 'AI & Automation',
    contact: 'bhuvan@scoders.com',
    photoUrl: '/techlead.jpg',
    joiningDate: '01/01/2026',
    assignedProjects: ['AgroSmart AI Cloud Core', 'Real-time WebSocket Engine'],
    currentProjectStatus: 'Active & Architecting',
    githubUrl: 'https://github.com/Gowda487',
    githubHandle: 'Gowda487',
    linkedinUrl: 'https://www.linkedin.com/in/bhuvan-m-102835326/',
    linkedinHandle: 'Bhuvan M.'
  }
];

const SEED_GALLERY: GalleryMediaItem[] = [
  {
    id: 'G1',
    title: 'Microsoft Reactor Tech Series Keynote',
    category: 'workshop_photos',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800&h=500',
    uploadDate: '2026-06-25',
    relatedClientId: null,
    relatedWorkshopId: 'wksp-reactor-ai'
  },
  {
    id: 'G2',
    title: 'AgroSmart AI Design Prototype Session',
    category: 'project_screenshots',
    imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=800&h=500',
    uploadDate: '2026-07-10',
    relatedClientId: 'agro-client-id',
    relatedWorkshopId: null
  },
  {
    id: 'G3',
    title: 'RV College Bootcamp Interactive Lab',
    category: 'event_photos',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800&h=500',
    uploadDate: '2026-06-12',
    relatedClientId: null,
    relatedWorkshopId: 'wksp-rvce'
  },
  {
    id: 'G4',
    title: 'NASSCOM Conclave S-CODERS Panel Display',
    category: 'event_photos',
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800&h=500',
    uploadDate: '2026-07-02',
    relatedClientId: null,
    relatedWorkshopId: null
  }
];

const SEED_ENQUIRIES: EnquiryItem[] = [
  {
    id: 'ENQ-2026-001',
    name: 'Ketan Deshmukh',
    email: 'ketan@ruralagritech.org',
    phone: '+91 98765 12345',
    subject: 'AI Agent for soil moisture and nutrient tracking',
    message: 'Greetings S-CODERS! We are looking to develop a custom conversational agent that integrates with our soil sensors and alerts farmers in Marathi. Please let us know if your chief AI architect Shreyas is available for a quick consult next week.',
    timestamp: '2026-07-15T11:45:00Z',
    replyStatus: 'Pending',
    replyMessage: null,
    replyDate: null
  },
  {
    id: 'ENQ-2026-002',
    name: 'Shruti Hegde',
    email: 'shruti@learnwell.co',
    phone: '+91 88990 01122',
    subject: 'Requesting Quotes for Next.js Website & Portfolio System',
    message: 'We require a stunning, fast, and responsive React/Next.js educational portal for school kids. The UI needs to be beautiful and highly interactive. Bhuvan\'s portfolio looks excellent, so we want him to direct the UI/UX.',
    timestamp: '2026-07-17T16:20:00Z',
    replyStatus: 'Responded',
    replyMessage: 'Hi Shruti, thank you for reaching out! Bhuvan and our engineering team would love to design this child-friendly LMS platform. S-CODERS can certainly build and launch this Next.js app. I have sent an introductory meeting invite to your email.',
    replyDate: '2026-07-18T08:30:00Z'
  }
];

const SEED_APPLICATIONS: CandidateApplication[] = [
  {
    id: 'SCD-APP-2026-001',
    submissionDate: '2026-08-15',
    status: 'Shortlisted',
    sector: 'AI & Automation Engineering',
    roleTitle: 'Junior AI Workflow Engineer (n8n & LLM Orchestration)',
    employmentType: 'Full-Time',
    fullName: 'Ananya Sharma',
    email: 'ananya.sharma.dev@gmail.com',
    phone: '+91 98450 11223',
    whatsapp: '+91 98450 11223',
    currentCity: 'Bengaluru, Karnataka',
    portfolioUrl: 'https://ananyasharma.dev',
    githubUrl: 'https://github.com/ananya-ai',
    linkedinUrl: 'https://linkedin.com/in/ananya-sharma-tech',
    highestQualification: 'B.Tech in Computer Science & Engineering',
    institutionName: 'PES University, Bengaluru',
    yearOfGraduation: '2025',
    experienceLevel: '0-1 Years',
    keySkills: 'Python, Gemini SDK, n8n, LangChain, React, FastAPI, Docker, Vector Databases',
    previousProjects: 'Built a WhatsApp autonomous customer support bot integrated with pgvector and Gemini Flash that reduced ticket triage time by 70%.',
    availabilityNotice: 'Immediate',
    expectedCompensation: '₹45,000 / month',
    whyJoinScoders: 'S-CODERS is driving genuine AI agent innovation right out of Bangalore. I want to build real-world workflows that impact startups directly.',
    impressiveAchievement: 'Finalist at Smart India Hackathon 2024 for an automated agricultural disease detection agent.',
    resumeLink: 'https://drive.google.com/file/d/sample-resume-ananya/view',
    agreementTitle: 'S-CODERS Professional Talent Induction & Non-Disclosure Agreement',
    agreementReferenceId: 'SCD-AGR-2026-ANANYA-01',
    agreementDate: '2026-08-15',
    effectiveDate: '2026-09-01',
    agreementDuration: '12 Months',
    agreementJurisdiction: 'Bengaluru, Karnataka, India',
    agreementVersion: 'v2.4 - 2026',
    companyLegalName: 'S-CODERS (Bharat Tech Developers)',
    companyAddress: 'Bengaluru, Karnataka, India - 560060',
    companyCin: 'UDYAM-KR-03-018249',
    companyGstin: '29AABCXXXXX1Z5',
    companyPan: 'AABCS8291M',
    companyEmail: 'scoders82@gmail.com',
    companyPhone: '+91 6363905989 / +91 8867540445',
    companyAuthorizedRepresentative: 'Shreyas M. / Bhuvan M.',
    companyRepresentativeDesignation: 'Founder & CEO / Tech Lead',
    candidateLegalName: 'Ananya Sharma',
    guardianName: 'Ramesh Sharma',
    dateOfBirth: '2003-04-12',
    gender: 'Female',
    permanentAddress: '#42, 3rd Cross, Indiranagar, Bengaluru - 560038',
    communicationAddress: '#42, 3rd Cross, Indiranagar, Bengaluru - 560038',
    panNumber: 'ABCPS1234K',
    aadhaarNumber: 'XXXX-XXXX-8921',
    officialEmail: 'ananya.sharma.dev@gmail.com',
    emergencyContactName: 'Ramesh Sharma (Father)',
    emergencyContactPhone: '+91 94480 22334',
    bankName: 'HDFC Bank',
    accountHolderName: 'Ananya Sharma',
    accountNumber: '50100492819201',
    ifscCode: 'HDFC0001234',
    branchName: 'Indiranagar Branch, Bengaluru',
    candidateDigitalSignature: 'Ananya Sharma',
    agreedToNda: true,
    agreedToCodeOfConduct: true,
    agreedToIpAssignment: true,
    declarationConfirmed: true,
    adminNotes: 'Impressed by her live demo of the Gemini agent. Scheduled for Technical Round with Shreyas M.',
    reviewedBy: 'Bhuvan M.'
  }
];

const SEED_FILES: FileRecord[] = [
  {
    id: 'FIL-SVC-001-SRC',
    name: 'agrosmart_ai_agent_pipeline_v1.zip',
    type: 'project_source_code',
    url: '#download-source-zip',
    size: '14.2 MB',
    clientId: 'billing@agrosmart.in',
    registrationId: 'REG-SVC-1001',
    uploadDate: '2026-07-12'
  },
  {
    id: 'FIL-SVC-001-PDF',
    name: 'AgroSmart_Architecture_Specification.pdf',
    type: 'project_pdf',
    url: '#download-spec-pdf',
    size: '2.4 MB',
    clientId: 'billing@agrosmart.in',
    registrationId: 'REG-SVC-1001',
    uploadDate: '2026-07-10'
  },
  {
    id: 'FIL-WKSP-101-PDF',
    name: 'Gemini_Prompting_CheatSheet.pdf',
    type: 'workshop_pdf',
    url: '#download-cheatsheet-pdf',
    size: '480 KB',
    clientId: 'all_participants',
    registrationId: 'REG-WKSP-2001',
    uploadDate: '2026-06-25'
  },
  {
    id: 'FIL-WKSP-101-SRC',
    name: 'n8n_scoders_automation_presets.json',
    type: 'workshop_source_code',
    url: '#download-presets-json',
    size: '45 KB',
    clientId: 'all_participants',
    registrationId: 'REG-WKSP-2001',
    uploadDate: '2026-06-25'
  }
];

const SEED_CHATS: ChatConversation[] = [
  {
    id: 'CHT-SVC-1001',
    clientName: 'AgroSmart Billing',
    clientEmail: 'billing@agrosmart.in',
    registrationId: 'REG-SVC-1001',
    reference: 'AI Agent & LLM Orchestration',
    messages: [
      { id: 'm1', sender: 'client', content: 'Hi Team, did we start training the model on our custom crop dataset?', timestamp: '2026-07-11T10:00:00Z' },
      { id: 'm2', sender: 'team', content: 'Hello! Yes, Bhuvan has configured the database pipeline, and Shreyas is refining the temperature parameters using Gemini 3.5 Flash. We are seeing 94% accuracy in crop diagnostic answers.', timestamp: '2026-07-11T10:15:00Z' },
      { id: 'm3', sender: 'client', content: 'That sounds spectacular! Looking forward to the milestone 1 review.', timestamp: '2026-07-11T11:00:00Z' }
    ],
    lastUpdated: '2026-07-11T11:00:00Z'
  },
  {
    id: 'CHT-WKSP-2001',
    clientName: 'Rahul Joshi',
    clientEmail: 'rahul.joshi@gmail.com',
    registrationId: 'REG-WKSP-2001',
    reference: 'Microsoft Reactor AI Masterclass',
    messages: [
      { id: 'w1', sender: 'client', content: 'Will I get a certificates of completion for this workshop?', timestamp: '2026-06-24T14:00:00Z' },
      { id: 'w2', sender: 'team', content: 'Hi Rahul! Yes, absolutely. S-CODERS issues official digital certifications co-signed by NASSCOM ecosystem and S-CODERS founders.', timestamp: '2026-06-24T14:10:00Z' }
    ],
    lastUpdated: '2026-06-24T14:10:00Z'
  }
];

const SEED_FEEDBACKS: FeedbackItem[] = [
  {
    id: 'FDB-001',
    type: 'service',
    clientName: 'AgroSmart Billing',
    clientEmail: 'billing@agrosmart.in',
    registrationId: 'REG-SVC-1001',
    rating: 5,
    review: 'The AI orchestration built by S-CODERS has completely optimized our diagnosis turnaround. Incredible expertise in the Gemini SDK and stateful agents!',
    submissionDate: '2026-07-14'
  },
  {
    id: 'FDB-002',
    type: 'workshop',
    clientName: 'Rahul Joshi',
    clientEmail: 'rahul.joshi@gmail.com',
    registrationId: 'REG-WKSP-2001',
    rating: 5,
    review: 'Absolutely mind-blowing class. Live prompt exercises and real n8n templates gave me immediately actionable developer skills.',
    submissionDate: '2026-06-26'
  }
];

const SEED_PAYMENTS: PaymentTransaction[] = [
  {
    id: 'TXN-90281',
    clientId: 'billing@agrosmart.in',
    clientName: 'AgroSmart Billing',
    clientEmail: 'billing@agrosmart.in',
    amount: 25000,
    paymentMethod: 'UPI (PhonePe)',
    status: 'Successful',
    timestamp: '2026-07-10T14:22:00Z',
    reference: 'Deposit Invoice #INV-2026-001',
    interrupted: false,
    failureReason: null
  },
  {
    id: 'TXN-90282',
    clientId: 'rahul.joshi@gmail.com',
    clientName: 'Rahul Joshi',
    clientEmail: 'rahul.joshi@gmail.com',
    amount: 1499,
    paymentMethod: 'UPI (Google Pay)',
    status: 'Successful',
    timestamp: '2026-06-24T11:05:00Z',
    reference: 'Workshop Access Key BTD-WKSP-AI-REACTOR-73891',
    interrupted: false,
    failureReason: null
  },
  {
    id: 'TXN-90283',
    clientId: 'interrupted-eval@scoders.com',
    clientName: 'Interrupted Tester',
    clientEmail: 'interrupted-eval@scoders.com',
    amount: 1499,
    paymentMethod: 'UPI (Paytm)',
    status: 'Failed',
    timestamp: '2026-07-18T09:12:00Z',
    reference: 'Workshop Access: RV College Tech Bootcamp',
    interrupted: true,
    failureReason: 'Transaction Interrupted: Connection terminated by user before PIN authorization.'
  }
];

const SEED_SERVICES_REG: ServiceRegistration[] = [
  {
    id: 'REG-SVC-1001',
    clientProfile: {
      name: 'AgroSmart Billing',
      email: 'billing@agrosmart.in',
      phone: '+91 99001 22334',
      company: 'AgroSmart AI Corp'
    },
    serviceId: 'srv-ai-agents',
    selectedServiceTitle: 'AI Agent & LLM Orchestration',
    uniqueKey: 'BTD-SVC-AI-AG-82910',
    projectRequirements: 'Integrate crop diagnosis neural graphs with conversational Gemini agents and custom WhatsApp endpoints.',
    budget: '₹2,50,000',
    timeline: '4 Weeks',
    projectStatus: 'In Progress',
    registrationDate: '2026-07-10',
    projectSubmissionDate: '2026-08-10',
    sourceCodeFileId: 'FIL-SVC-001-SRC',
    pdfFileId: 'FIL-SVC-001-PDF',
    chatId: 'CHT-SVC-1001',
    feedbackId: 'FDB-001',
    invoiceId: 'INV-2026-001'
  }
];

const SEED_WORKSHOPS_REG: WorkshopRegistration[] = [
  {
    id: 'REG-WKSP-2001',
    participantProfile: {
      name: 'Rahul Joshi',
      email: 'rahul.joshi@gmail.com',
      phone: '+91 88771 99221',
      role: 'Registered Developer'
    },
    workshopId: 'wksp-reactor-ai',
    workshopTitle: 'Microsoft Reactor Generative AI Masterclass',
    paymentStatus: 'Successful',
    amountPaid: 1499,
    paymentMethod: 'UPI (Google Pay)',
    paymentDate: '2026-06-24',
    transactionId: 'TXN-90282',
    uniqueAccessKey: 'BTD-WKSP-AI-73891-RAHUL',
    materialsFileIds: ['FIL-WKSP-101-PDF', 'FIL-WKSP-101-SRC'],
    chatId: 'CHT-WKSP-2001',
    feedbackId: 'FDB-002'
  }
];

// ==========================================
// 3. UNIFIED DATABASE MANAGER ENGINE
// ==========================================

export class DatabaseEngine {
  private static isSyncing = false;
  private static lastLocalWriteAt: Record<string, number> = {};
  private static readonly WRITE_GUARD_MS = 6000;
  private static readonly BLOCKED_SYNC_KEYS = new Set([
    'scoders_client_passwords',
    'db_uid_recovery_otps',
    'db_client_accounts',
    'scoders_registered_services',
    'scoders_registered_workshops',
    'scoders_session_unlocked_uids',
    'scoders_user',
    'scoders_admin_auth',
  ]);

  private static markLocalWrite(key: string): void {
    this.lastLocalWriteAt[key] = Date.now();
  }

  public static getSessionUnlockedUids(): string[] {
    try {
      const raw = localStorage.getItem('scoders_session_unlocked_uids');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map((u) => String(u).trim().toUpperCase()).filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  public static addSessionUnlockedUid(uid: string): void {
    const clean = String(uid || '').trim().toUpperCase();
    if (!clean || clean === 'ENTER-KEY-TO-VERIFY' || clean === 'PASS-KEY') return;
    try {
      const current = new Set(this.getSessionUnlockedUids());
      current.add(clean);
      localStorage.setItem('scoders_session_unlocked_uids', JSON.stringify(Array.from(current)));
    } catch {}
  }

  public static clearClientSessionData(): void {
    try {
      localStorage.removeItem('scoders_registered_services');
      localStorage.removeItem('scoders_registered_workshops');
      localStorage.removeItem('scoders_session_unlocked_uids');
    } catch {}
  }

  private static mergeByKey<T extends Record<string, any>>(
    existing: T[],
    incoming: T[],
    getKey: (item: T) => string
  ): T[] {
    const map = new Map<string, T>();
    const order: string[] = [];
    for (const item of incoming) {
      const k = getKey(item);
      if (!k) continue;
      if (!map.has(k)) order.push(k);
      map.set(k, item);
    }
    for (const item of existing) {
      const k = getKey(item);
      if (!k) continue;
      if (!map.has(k)) {
        order.push(k);
        map.set(k, item);
      }
    }
    return order.map((k) => map.get(k)!);
  }

  public static hydrateVerifiedRecord(record: any, hydrated?: any): void {
    if (typeof window === 'undefined' || (!record && !hydrated)) return;
    try {
      const cleanUid = String(record?.uid || hydrated?.serviceRegistration?.uniqueKey || hydrated?.workshopRegistration?.uniqueAccessKey || hydrated?.eventTicket?.ticketCode || '')
        .trim()
        .toUpperCase();

      if (cleanUid) {
        this.addSessionUnlockedUid(cleanUid);
      }

      // 1. Upsert db_registration_uids
      if (record?.uid) {
        const uidsRaw = localStorage.getItem('db_registration_uids');
        const uids: any[] = uidsRaw ? JSON.parse(uidsRaw) : [];
        const normalizedRecord = { ...record, uid: String(record.uid).trim().toUpperCase() };
        const mergedUids = this.mergeByKey(Array.isArray(uids) ? uids : [], [normalizedRecord], (u) =>
          String(u?.uid || '').trim().toUpperCase()
        );
        this.markLocalWrite('db_registration_uids');
        localStorage.setItem('db_registration_uids', JSON.stringify(mergedUids));
      }

      // 2. Service hydration
      const svcReg = hydrated?.serviceRegistration;
      if (svcReg?.uniqueKey || (record?.section === 'service' && record?.itemId)) {
        if (svcReg?.uniqueKey) {
          const existing = this.getServiceRegistrations();
          const merged = this.mergeByKey(existing, [svcReg], (r) =>
            String(r?.uniqueKey || r?.id || '').trim().toUpperCase()
          );
          this.markLocalWrite('db_service_registrations');
          localStorage.setItem('db_service_registrations', JSON.stringify(merged));
        }

        const svcId = svcReg?.serviceId || record?.itemId;
        if (svcId && cleanUid) {
          const savedMapRaw = localStorage.getItem('scoders_registered_services');
          const savedMap = savedMapRaw ? JSON.parse(savedMapRaw) : {};
          const resolvedNotes = svcReg?.notes || svcReg?.projectRequirements || record?.metadata?.notes || record?.metadata?.requirements || '';
          savedMap[svcId] = {
            key: cleanUid,
            name: svcReg?.clientProfile?.name || record?.clientName || 'Registered Client',
            email: (svcReg?.clientProfile?.email || record?.clientEmail || '').toLowerCase(),
            role: svcReg?.clientProfile?.company || record?.clientRole || 'Client Partner',
            phone: svcReg?.clientProfile?.phone || record?.clientPhone || '',
            requirements: svcReg?.projectRequirements || record?.metadata?.requirements || resolvedNotes || '',
            notes: resolvedNotes,
            budget: svcReg?.budget || record?.metadata?.budget || 'TBD',
            timeline: svcReg?.timeline || record?.metadata?.timeline || 'TBD',
            chatId: svcReg?.chatId || record?.chatId || `chat-svc-${cleanUid}`,
            timestamp: svcReg?.registrationDate || record?.issuedAt || new Date().toISOString(),
          };
          localStorage.setItem('scoders_registered_services', JSON.stringify(savedMap));
        }
      }

      // 3. Workshop hydration
      const wkspReg = hydrated?.workshopRegistration;
      if (wkspReg?.uniqueAccessKey || (record?.section === 'workshop' && record?.itemId)) {
        if (wkspReg?.uniqueAccessKey) {
          const existing = this.getWorkshopRegistrations();
          const merged = this.mergeByKey(existing, [wkspReg], (r) =>
            String(r?.uniqueAccessKey || r?.id || '').trim().toUpperCase()
          );
          this.markLocalWrite('db_workshop_registrations');
          localStorage.setItem('db_workshop_registrations', JSON.stringify(merged));
        }

        const wkspId = wkspReg?.workshopId || record?.itemId;
        if (wkspId && cleanUid) {
          const savedMapRaw = localStorage.getItem('scoders_registered_workshops');
          const savedMap = savedMapRaw ? JSON.parse(savedMapRaw) : {};
          const resolvedNotes = wkspReg?.notes || record?.metadata?.notes || '';
          savedMap[wkspId] = {
            key: cleanUid,
            name: wkspReg?.participantProfile?.name || record?.clientName || 'Registered Attendee',
            email: (wkspReg?.participantProfile?.email || record?.clientEmail || '').toLowerCase(),
            role: wkspReg?.participantProfile?.role || record?.clientRole || 'Developer',
            phone: wkspReg?.participantProfile?.phone || record?.clientPhone || '',
            notes: resolvedNotes,
            tickets: 1,
            totalPaid: Number(wkspReg?.amountPaid ?? record?.amount) || 0,
            chatId: wkspReg?.chatId || record?.chatId || `chat-wksp-${cleanUid}`,
            timestamp: wkspReg?.paymentDate || record?.issuedAt || new Date().toLocaleDateString(),
          };
          localStorage.setItem('scoders_registered_workshops', JSON.stringify(savedMap));
        }
      }

      // 4. Event ticket hydration
      const evtTicket = hydrated?.eventTicket;
      if (evtTicket?.ticketCode) {
        const existingRaw = localStorage.getItem('scoders_event_tickets');
        const existing: any[] = existingRaw ? JSON.parse(existingRaw) : [];
        const merged = this.mergeByKey(Array.isArray(existing) ? existing : [], [evtTicket], (t) =>
          String(t?.ticketCode || t?.id || '').trim().toUpperCase()
        );
        this.markLocalWrite('scoders_event_tickets');
        localStorage.setItem('scoders_event_tickets', JSON.stringify(merged));
      }

      // 5. Chat hydration
      if (hydrated?.chatRecord?.id) {
        const existingChats = this.getChats();
        const mergedChats = this.mergeByKey(existingChats, [hydrated.chatRecord], (c) =>
          String(c?.id || c?.uniqueAccessKey || '').trim().toUpperCase()
        );
        this.markLocalWrite('db_chats');
        localStorage.setItem('db_chats', JSON.stringify(mergedChats));
      }

      // 6. Persist to Cloud Firestore when authenticated via Google
      if (record?.uid && record?.section && record?.clientEmail) {
        void syncRegistrationToFirestore({
          uid: String(record.uid).trim().toUpperCase(),
          section: record.section,
          itemId: String(record.itemId || record.section),
          itemTitle: String(record.itemTitle || 'S-CODERS Offering'),
          clientName: String(record.clientName || 'Registered Client'),
          clientEmail: String(record.clientEmail).toLowerCase(),
          clientPhone: record.clientPhone || svcReg?.clientProfile?.phone || wkspReg?.participantProfile?.phone || '',
          clientRole: record.clientRole || record.clientOrg || svcReg?.clientProfile?.company || wkspReg?.participantProfile?.role || '',
          requirements: svcReg?.projectRequirements || record.metadata?.requirements || '',
          notes: svcReg?.notes || wkspReg?.notes || record.metadata?.notes || '',
          budget: svcReg?.budget || record.metadata?.budget || '',
          timeline: svcReg?.timeline || record.metadata?.timeline || '',
          amount: Number(record.amount) || 0,
          paymentStatus: record.paymentStatus === 'VERIFIED' ? 'VERIFIED' : 'NOT_REQUIRED',
          paymentId: record.paymentId || '',
          status: record.status === 'EXPIRED' ? 'EXPIRED' : record.status === 'REVOKED' ? 'REVOKED' : 'ACTIVE',
          chatId: record.chatId || svcReg?.chatId || wkspReg?.chatId || '',
          issuedAt: record.issuedAt || new Date().toISOString(),
          validUntil: record.validUntil || '',
        }).catch(() => {});
      }

      window.dispatchEvent(new Event('scoders_db_change'));
      window.dispatchEvent(new Event('scoders_data_change'));
      window.dispatchEvent(new Event('scoders_sessions_change'));
      window.dispatchEvent(new Event('scoders_registered_workshops_changed'));
    } catch (err) {
      console.warn('hydrateVerifiedRecord warning:', err);
    }
  }

  public static applyClientAuthSnapshot(snapshot: any): void {
    if (typeof window === 'undefined' || !snapshot || typeof snapshot !== 'object') return;
    try {
      if (Array.isArray(snapshot.registrationUids)) {
        const uidsRaw = localStorage.getItem('db_registration_uids');
        const existing: any[] = uidsRaw ? JSON.parse(uidsRaw) : [];
        const merged = this.mergeByKey(Array.isArray(existing) ? existing : [], snapshot.registrationUids, (u) =>
          String(u?.uid || '').trim().toUpperCase()
        );
        this.markLocalWrite('db_registration_uids');
        localStorage.setItem('db_registration_uids', JSON.stringify(merged));
        for (const u of snapshot.registrationUids) {
          if (u?.uid && u?.status !== 'REVOKED') {
            this.addSessionUnlockedUid(u.uid);
          }
        }
      }

      if (Array.isArray(snapshot.serviceRegistrations)) {
        const existing = this.getServiceRegistrations();
        const merged = this.mergeByKey(existing, snapshot.serviceRegistrations, (r) =>
          String(r?.uniqueKey || r?.id || '').trim().toUpperCase()
        );
        this.markLocalWrite('db_service_registrations');
        localStorage.setItem('db_service_registrations', JSON.stringify(merged));
        for (const s of snapshot.serviceRegistrations) {
          if (s?.uniqueKey) this.addSessionUnlockedUid(s.uniqueKey);
        }
      }

      if (Array.isArray(snapshot.workshopRegistrations)) {
        const existing = this.getWorkshopRegistrations();
        const merged = this.mergeByKey(existing, snapshot.workshopRegistrations, (r) =>
          String(r?.uniqueAccessKey || r?.id || '').trim().toUpperCase()
        );
        this.markLocalWrite('db_workshop_registrations');
        localStorage.setItem('db_workshop_registrations', JSON.stringify(merged));
        for (const w of snapshot.workshopRegistrations) {
          if (w?.uniqueAccessKey) this.addSessionUnlockedUid(w.uniqueAccessKey);
        }
      }

      if (Array.isArray(snapshot.eventTickets)) {
        const existingRaw = localStorage.getItem('scoders_event_tickets');
        const existing: any[] = existingRaw ? JSON.parse(existingRaw) : [];
        const merged = this.mergeByKey(Array.isArray(existing) ? existing : [], snapshot.eventTickets, (t) =>
          String(t?.ticketCode || t?.id || '').trim().toUpperCase()
        );
        this.markLocalWrite('scoders_event_tickets');
        localStorage.setItem('scoders_event_tickets', JSON.stringify(merged));
        for (const t of snapshot.eventTickets) {
          if (t?.ticketCode) this.addSessionUnlockedUid(t.ticketCode);
        }
      }

      if (Array.isArray(snapshot.chats)) {
        const existingChats = this.getChats();
        const mergedChats = this.mergeByKey(existingChats, snapshot.chats, (c) =>
          String(c?.id || c?.uniqueAccessKey || '').trim().toUpperCase()
        );
        this.markLocalWrite('db_chats');
        localStorage.setItem('db_chats', JSON.stringify(mergedChats));
      }

      if (snapshot.registeredServicesMap && typeof snapshot.registeredServicesMap === 'object') {
        localStorage.setItem('scoders_registered_services', JSON.stringify(snapshot.registeredServicesMap));
      }

      if (snapshot.registeredWorkshopsMap && typeof snapshot.registeredWorkshopsMap === 'object') {
        localStorage.setItem('scoders_registered_workshops', JSON.stringify(snapshot.registeredWorkshopsMap));
      }

      window.dispatchEvent(new Event('scoders_db_change'));
      window.dispatchEvent(new Event('scoders_data_change'));
      window.dispatchEvent(new Event('scoders_sessions_change'));
      window.dispatchEvent(new Event('scoders_registered_workshops_changed'));
    } catch (err) {
      console.warn('applyClientAuthSnapshot warning:', err);
    }
  }

  private static getStored<T>(key: string, defaultValue: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(`Error reading db collection [${key}]`, e);
    }
    return defaultValue;
  }

  private static setStored<T>(key: string, value: T): void {
    this.markLocalWrite(key);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing db collection [${key}]`, e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('scoders_db_change'));
      window.dispatchEvent(new Event('scoders_data_change'));

      // Asynchronously synchronize with server for multi-user/multi-device persistence
      fetch('/api/app-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      }).catch(err => console.warn(`Server sync failed for [${key}]:`, err));
    }
  }

  public static async syncWithServer(): Promise<void> {
    if (typeof window === 'undefined' || this.isSyncing) return;
    this.isSyncing = true;
    try {
      const res = await fetch('/api/app-state', {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.state) {
        let changed = false;
        const serverState = data.state;
        const now = Date.now();

        // 1. Sync from server to local (respecting recent local writes & excluding auth/session-scoped keys)
        for (const [key, val] of Object.entries(serverState)) {
          if (this.BLOCKED_SYNC_KEYS.has(key)) continue;
          if (now - (this.lastLocalWriteAt[key] || 0) < this.WRITE_GUARD_MS) continue;
          const localValStr = localStorage.getItem(key);
          const serverValStr = JSON.stringify(val);
          if (localValStr !== serverValStr) {
            localStorage.setItem(key, serverValStr);
            changed = true;
          }
        }

        // Refresh only the currently logged-in user's unlocked services/workshops maps if logged in
        try {
          const userStr = localStorage.getItem('scoders_user');
          const activeUser = userStr ? JSON.parse(userStr) : null;
          const activeEmail = String(activeUser?.email || '').trim().toLowerCase();
          if (activeEmail) {
            const svcRegs: any[] = Array.isArray(serverState['db_service_registrations'])
              ? serverState['db_service_registrations']
              : [];
            const currentSvcMap = JSON.parse(localStorage.getItem('scoders_registered_services') || '{}');
            let svcMapTouched = false;
            for (const reg of svcRegs) {
              const regEmail = String(reg?.clientProfile?.email || '').trim().toLowerCase();
              if (regEmail === activeEmail && reg?.serviceId && reg?.uniqueKey) {
                const resolvedNotes = reg.notes || reg.projectRequirements || currentSvcMap[reg.serviceId]?.notes || '';
                currentSvcMap[reg.serviceId] = {
                  ...(currentSvcMap[reg.serviceId] || {}),
                  key: reg.uniqueKey,
                  name: reg.clientProfile?.name || currentSvcMap[reg.serviceId]?.name || 'Registered Client',
                  email: regEmail,
                  role: reg.clientProfile?.company || currentSvcMap[reg.serviceId]?.role || 'Client Partner',
                  phone: reg.clientProfile?.phone || currentSvcMap[reg.serviceId]?.phone || '',
                  requirements: reg.projectRequirements || currentSvcMap[reg.serviceId]?.requirements || resolvedNotes || '',
                  notes: resolvedNotes,
                  budget: reg.budget || currentSvcMap[reg.serviceId]?.budget || 'TBD',
                  timeline: reg.timeline || currentSvcMap[reg.serviceId]?.timeline || 'TBD',
                  chatId: reg.chatId || `chat-svc-${reg.uniqueKey}`,
                  timestamp: reg.registrationDate || new Date().toISOString(),
                };
                this.addSessionUnlockedUid(reg.uniqueKey);
                svcMapTouched = true;
              }
            }
            if (svcMapTouched) {
              localStorage.setItem('scoders_registered_services', JSON.stringify(currentSvcMap));
            }

            const wkspRegs: any[] = Array.isArray(serverState['db_workshop_registrations'])
              ? serverState['db_workshop_registrations']
              : [];
            const revokedMap = serverState['scoders_revoked_passes'] || {};
            const currentWkspMap = JSON.parse(localStorage.getItem('scoders_registered_workshops') || '{}');
            let wkspMapTouched = false;
            for (const reg of wkspRegs) {
              const regEmail = String(reg?.participantProfile?.email || '').trim().toLowerCase();
              const regKey = String(reg?.uniqueAccessKey || '').trim().toUpperCase();
              if (
                regEmail === activeEmail &&
                reg?.workshopId &&
                regKey &&
                !reg?.isRevoked &&
                reg?.paymentStatus !== 'Cancelled' &&
                reg?.paymentStatus !== 'Revoked' &&
                !revokedMap[regKey]
              ) {
                currentWkspMap[reg.workshopId] = {
                  ...(currentWkspMap[reg.workshopId] || {}),
                  key: regKey,
                  name: reg.participantProfile?.name || 'Registered Attendee',
                  email: regEmail,
                  role: reg.participantProfile?.role || 'Developer',
                  phone: reg.participantProfile?.phone || '',
                  notes: reg.notes || currentWkspMap[reg.workshopId]?.notes || '',
                  tickets: 1,
                  totalPaid: Number(reg.amountPaid) || 0,
                  chatId: reg.chatId || `chat-wksp-${regKey}`,
                  timestamp: reg.paymentDate || new Date().toLocaleDateString(),
                };
                this.addSessionUnlockedUid(regKey);
                wkspMapTouched = true;
              }
            }
            if (wkspMapTouched) {
              localStorage.setItem('scoders_registered_workshops', JSON.stringify(currentWkspMap));
            }
          }
        } catch {}

        // 2. If local has existing collections not yet on server, push them
        const localPushEntries: Record<string, any> = {};
        const trackedKeys = [
          'db_service_registrations', 'db_workshop_registrations', 'db_payments',
          'db_feedbacks', 'db_chats', 'db_files', 'db_enquiries', 'db_team_members',
          'db_gallery_media', 'db_candidate_applications', 'db_registration_uids',
          'scoders_event_tickets', 'scoders_revoked_passes', 'scoders_dynamic_events',
          'scoders_dynamic_services', 'scoders_dynamic_workshops', 'scoders_dynamic_invoices',
          'scoders_dynamic_networking', 'scoders_saved_candidate_applications', 'scoders_enquiries',
          'scoders_department_configs', 'scoders_department_meetings', 'scoders_main_whatsapp_community',
          'scoders_photo_shreyas', 'scoders_photo_lokesh', 'scoders_photo_bhuvan', 'scoders_team_photos'
        ];

        for (const key of trackedKeys) {
          if (serverState[key] === undefined) {
            const localStr = localStorage.getItem(key);
            if (localStr) {
              try {
                localPushEntries[key] = JSON.parse(localStr);
              } catch {}
            }
          }
        }

        if (Object.keys(localPushEntries).length > 0) {
          fetch('/api/app-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries: localPushEntries })
          }).catch(() => {});
        }

        if (changed) {
          window.dispatchEvent(new Event('scoders_db_change'));
          window.dispatchEvent(new Event('scoders_data_change'));
          window.dispatchEvent(new Event('scoders_departments_change'));
          window.dispatchEvent(new Event('scoders_meetings_change'));
          window.dispatchEvent(new Event('scoders_saved_applications_change'));
          window.dispatchEvent(new Event('scoders_team_change'));
          window.dispatchEvent(new Event('storage'));
        }
      }
    } catch (e) {
      console.warn('Error syncing database with server:', e);
    } finally {
      this.isSyncing = false;
    }
  }

  // --- Collection 1: Service Registrations ---
  public static getServiceRegistrations(): ServiceRegistration[] {
    return this.getStored('db_service_registrations', SEED_SERVICES_REG);
  }

  public static saveServiceRegistrations(data: ServiceRegistration[]): void {
    this.setStored('db_service_registrations', data);
  }

  public static async updateServiceClientProfile(params: {
    serviceId: string;
    uniqueKey?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    budget?: string;
    timeline?: string;
    requirements?: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string; record?: any }> {
    const rawKey = (params.uniqueKey || '').trim().toUpperCase();
    const cleanKey = rawKey && rawKey !== 'ENTER-KEY-TO-VERIFY' ? rawKey : '';
    const cleanEmail = (params.email || '').trim().toLowerCase();
    const cleanName = (params.name || '').trim();
    const cleanRole = (params.role || '').trim();
    const cleanPhone = (params.phone || '').trim();

    try {
      this.markLocalWrite('db_service_registrations');
      this.markLocalWrite('db_chats');

      const currentRegs = this.getServiceRegistrations();
      let touchedRegs = false;
      const updatedRegs = currentRegs.map((reg) => {
        const regEmail = (reg.clientProfile?.email || '').trim().toLowerCase();
        const keyMatch = cleanKey && reg.uniqueKey?.trim().toUpperCase() === cleanKey;
        const svcMatch = !cleanKey && reg.serviceId === params.serviceId && (!cleanEmail || !regEmail || regEmail === cleanEmail);
        if (keyMatch || svcMatch) {
          touchedRegs = true;
          const updatedNotes = params.notes !== undefined ? params.notes : (params.requirements ?? reg.notes);
          return {
            ...reg,
            clientProfile: {
              ...reg.clientProfile,
              name: cleanName || reg.clientProfile.name,
              email: cleanEmail || reg.clientProfile.email,
              phone: cleanPhone || reg.clientProfile.phone,
              company: cleanRole || reg.clientProfile.company,
            },
            budget: params.budget || reg.budget,
            timeline: params.timeline || reg.timeline,
            projectRequirements: params.requirements || (params.notes ? params.notes : reg.projectRequirements),
            notes: updatedNotes,
          };
        }
        return reg;
      });
      if (touchedRegs) {
        localStorage.setItem('db_service_registrations', JSON.stringify(updatedRegs));
      }

      const regServicesRaw = localStorage.getItem('scoders_registered_services');
      const regServices = regServicesRaw ? JSON.parse(regServicesRaw) : {};
      if (regServices && typeof regServices === 'object' && regServices[params.serviceId]) {
        const nextNotes = params.notes !== undefined ? params.notes : (params.requirements ?? regServices[params.serviceId].notes);
        regServices[params.serviceId] = {
          ...regServices[params.serviceId],
          name: cleanName || regServices[params.serviceId].name,
          email: cleanEmail || regServices[params.serviceId].email,
          phone: cleanPhone || regServices[params.serviceId].phone,
          role: cleanRole || regServices[params.serviceId].role,
          budget: params.budget || regServices[params.serviceId].budget,
          timeline: params.timeline || regServices[params.serviceId].timeline,
          requirements: params.requirements || regServices[params.serviceId].requirements,
          notes: nextNotes,
          autoSavedAt: new Date().toISOString(),
        };
        localStorage.setItem('scoders_registered_services', JSON.stringify(regServices));
      }

      const chats = this.getChats();
      let touchedChats = false;
      const updatedChats = chats.map((c) => {
        if (cleanKey && c.uniqueAccessKey?.trim().toUpperCase() === cleanKey) {
          touchedChats = true;
          return {
            ...c,
            clientName: cleanName || c.clientName,
            clientEmail: cleanEmail || c.clientEmail,
            lastUpdated: new Date().toISOString(),
          };
        }
        return c;
      });
      if (touchedChats) {
        localStorage.setItem('db_chats', JSON.stringify(updatedChats));
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('scoders_sessions_change'));
        window.dispatchEvent(new Event('scoders_db_change'));
      }

      const res = await fetch('/api/services/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: params.serviceId,
          uniqueKey: cleanKey || undefined,
          name: cleanName || undefined,
          email: cleanEmail || undefined,
          phone: cleanPhone || undefined,
          role: cleanRole || undefined,
          budget: params.budget || undefined,
          timeline: params.timeline || undefined,
          requirements: params.requirements || undefined,
          notes: params.notes !== undefined ? params.notes : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || data?.updated === false) {
        return {
          success: false,
          error: data?.error || `Server returned status ${res.status} while saving service profile.`,
        };
      }

      if (data.record?.uniqueKey) {
        this.markLocalWrite('db_service_registrations');
        const latestRegs = this.getServiceRegistrations();
        const merged = this.mergeByKey(latestRegs, [data.record], (r) =>
          String(r?.uniqueKey || r?.id || '').trim().toUpperCase()
        );
        localStorage.setItem('db_service_registrations', JSON.stringify(merged));

        void syncRegistrationToFirestore({
          uid: data.record.uniqueKey,
          section: 'service',
          itemId: data.record.serviceId || params.serviceId,
          itemTitle: data.record.selectedServiceTitle || 'S-CODERS Custom Service',
          clientName: data.record.clientProfile?.name || cleanName || 'Registered Client',
          clientEmail: data.record.clientProfile?.email || cleanEmail,
          clientPhone: data.record.clientProfile?.phone || cleanPhone,
          clientRole: data.record.clientProfile?.company || cleanRole,
          requirements: data.record.projectRequirements || params.requirements || '',
          notes: data.record.notes ?? params.notes ?? '',
          budget: data.record.budget || params.budget || '',
          timeline: data.record.timeline || params.timeline || '',
          amount: 0,
          paymentStatus: 'NOT_REQUIRED',
          status: 'ACTIVE',
          chatId: data.record.chatId || '',
        }).catch(() => {});
      }

      return { success: true, record: data.record };
    } catch (err: any) {
      console.warn('Save service profile warning:', err);
      return { success: false, error: err?.message || 'Unable to reach server to save service profile.' };
    }
  }

  public static async cancelServiceOrder(params: {
    serviceId: string;
    uniqueKey?: string;
    clientEmail?: string;
    chatId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const cleanKey = (params.uniqueKey || '').trim().toUpperCase();
    const cleanEmail = (params.clientEmail || '').trim().toLowerCase();
    const validKey = cleanKey && cleanKey !== 'ENTER-KEY-TO-VERIFY' ? cleanKey : '';

    // 1. Permanently delete from authoritative server database first
    try {
      const res = await fetch('/api/services/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: params.serviceId,
          uniqueKey: validKey || undefined,
          clientEmail: cleanEmail || undefined,
          chatId: params.chatId || undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.warn('Backend service cancel returned error:', errData);
      }
    } catch (netErr) {
      console.warn('Offline fallback for service cancellation:', netErr);
    }

    // 2. Permanently purge all associated client records locally so they cannot reappear
    try {
      const matchedRegIds = new Set<string>();
      const matchedFileIds = new Set<string>();
      const matchedChatIds = new Set<string>();
      const matchedKeys = new Set<string>();
      if (validKey) matchedKeys.add(validKey);
      if (params.chatId) matchedChatIds.add(params.chatId);

      const currentRegs = this.getServiceRegistrations();
      const remainingRegs = currentRegs.filter((reg) => {
        const regKey = (reg.uniqueKey || '').trim().toUpperCase();
        const regEmail = (reg.clientProfile?.email || '').trim().toLowerCase();
        const matchesKey = Boolean(validKey && regKey === validKey);
        const matchesSvc = Boolean(!validKey && reg.serviceId === params.serviceId && (!cleanEmail || !regEmail || regEmail === cleanEmail));
        if (matchesKey || matchesSvc) {
          if (reg.id) matchedRegIds.add(reg.id);
          if (regKey) matchedKeys.add(regKey);
          if (reg.chatId) matchedChatIds.add(reg.chatId);
          if (reg.sourceCodeFileId) matchedFileIds.add(reg.sourceCodeFileId);
          if (reg.pdfFileId) matchedFileIds.add(reg.pdfFileId);
          return false;
        }
        return true;
      });
      localStorage.setItem('db_service_registrations', JSON.stringify(remainingRegs));

      const regServicesRaw = localStorage.getItem('scoders_registered_services');
      const regServices = regServicesRaw ? JSON.parse(regServicesRaw) : {};
      if (regServices && typeof regServices === 'object') {
        if (params.serviceId && regServices[params.serviceId]) {
          const entryKey = String(regServices[params.serviceId]?.key || '').trim().toUpperCase();
          if (entryKey) matchedKeys.add(entryKey);
          if (regServices[params.serviceId]?.chatId) matchedChatIds.add(String(regServices[params.serviceId].chatId));
          delete regServices[params.serviceId];
        }
        Object.keys(regServices).forEach((k) => {
          const entryKey = String(regServices[k]?.key || '').trim().toUpperCase();
          if (entryKey && matchedKeys.has(entryKey)) {
            delete regServices[k];
          }
        });
        localStorage.setItem('scoders_registered_services', JSON.stringify(regServices));
      }

      const uidsRaw = localStorage.getItem('db_registration_uids');
      if (uidsRaw) {
        const uids = JSON.parse(uidsRaw);
        if (Array.isArray(uids)) {
          const filteredUids = uids.filter((u: any) => {
            if (u?.section !== 'service') return true;
            const recUid = String(u?.uid || '').trim().toUpperCase();
            return !(recUid && matchedKeys.has(recUid));
          });
          localStorage.setItem('db_registration_uids', JSON.stringify(filteredUids));
        }
      }

      const remainingChats = this.getChats().filter((c) => {
        const cKey = (c.uniqueAccessKey || '').trim().toUpperCase();
        const cEmail = (c.clientEmail || '').trim().toLowerCase();
        if (c.id && matchedChatIds.has(c.id)) return false;
        if (cKey && matchedKeys.has(cKey)) return false;
        if (c.registrationId && matchedRegIds.has(c.registrationId)) return false;
        if (params.serviceId && c.serviceId === params.serviceId && cleanEmail && cEmail === cleanEmail) return false;
        return true;
      });
      localStorage.setItem('db_chats', JSON.stringify(remainingChats));

      const remainingFiles = this.getFiles().filter(
        (f) => !matchedFileIds.has(f.id) && !matchedRegIds.has(f.registrationId)
      );
      localStorage.setItem('db_files', JSON.stringify(remainingFiles));

      const remainingFeedbacks = this.getFeedbacks().filter(
        (fb) => fb.type !== 'service' || !matchedRegIds.has(fb.registrationId)
      );
      localStorage.setItem('db_feedbacks', JSON.stringify(remainingFeedbacks));

      // Remove any auto-save draft for this cancelled service
      try {
        localStorage.removeItem(`scoders_service_draft_${params.serviceId}_${validKey || 'active'}`);
        localStorage.removeItem(`scoders_service_draft_${params.serviceId}_active`);
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('scoders_db_change'));
        window.dispatchEvent(new Event('scoders_data_change'));
        window.dispatchEvent(new Event('scoders_sessions_change'));
        window.dispatchEvent(new Event('storage'));
      }

      return { success: true };
    } catch (err: any) {
      console.error('Local service cancellation cleanup error:', err);
      return { success: false, error: err?.message || 'Failed to delete local service data.' };
    }
  }

  // --- Collection 2: Workshop Registrations ---
  public static getWorkshopRegistrations(): WorkshopRegistration[] {
    return this.getStored('db_workshop_registrations', SEED_WORKSHOPS_REG);
  }

  public static saveWorkshopRegistrations(data: WorkshopRegistration[]): void {
    this.setStored('db_workshop_registrations', data);
  }

  public static async updateWorkshopClientProfile(params: {
    workshopId: string;
    uniqueKey?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string; record?: any }> {
    const cleanKey = (params.uniqueKey || '').trim().toUpperCase();
    const cleanName = (params.name || '').trim();
    const cleanEmail = (params.email || '').trim().toLowerCase();
    const cleanRole = (params.role || '').trim();
    const cleanPhone = (params.phone || '').trim();
    const validKey = cleanKey && cleanKey !== 'PASS-KEY' ? cleanKey : '';

    try {
      this.markLocalWrite('db_workshop_registrations');
      this.markLocalWrite('db_chats');

      const currentRegs = this.getWorkshopRegistrations();
      let touchedRegs = false;
      const updatedRegs = currentRegs.map((reg) => {
        const regKey = (reg.uniqueAccessKey || '').trim().toUpperCase();
        const regEmail = (reg.participantProfile?.email || '').trim().toLowerCase();
        const keyMatch = Boolean(validKey && regKey === validKey);
        const wkspMatch = Boolean(!validKey && reg.workshopId === params.workshopId && (!cleanEmail || !regEmail || regEmail === cleanEmail));
        if (keyMatch || wkspMatch) {
          touchedRegs = true;
          return {
            ...reg,
            participantProfile: {
              ...reg.participantProfile,
              name: cleanName || reg.participantProfile?.name,
              email: cleanEmail || reg.participantProfile?.email,
              phone: cleanPhone || reg.participantProfile?.phone,
              role: cleanRole || reg.participantProfile?.role,
            },
            ...(params.notes !== undefined ? { notes: params.notes } : {}),
          };
        }
        return reg;
      });
      if (touchedRegs) {
        localStorage.setItem('db_workshop_registrations', JSON.stringify(updatedRegs));
      }

      const savedWkspsRaw = localStorage.getItem('scoders_registered_workshops');
      const savedWksps = savedWkspsRaw ? JSON.parse(savedWkspsRaw) : {};
      if (savedWksps && params.workshopId && savedWksps[params.workshopId]) {
        savedWksps[params.workshopId] = {
          ...savedWksps[params.workshopId],
          name: cleanName || savedWksps[params.workshopId].name,
          email: cleanEmail || savedWksps[params.workshopId].email,
          phone: cleanPhone || savedWksps[params.workshopId].phone,
          role: cleanRole || savedWksps[params.workshopId].role,
          ...(params.notes !== undefined ? { notes: params.notes } : {}),
          autoSavedAt: new Date().toISOString(),
        };
        localStorage.setItem('scoders_registered_workshops', JSON.stringify(savedWksps));
      }

      const chats = this.getChats();
      let touchedChats = false;
      const updatedChats = chats.map((c) => {
        if (validKey && c.uniqueAccessKey?.trim().toUpperCase() === validKey) {
          touchedChats = true;
          return {
            ...c,
            clientName: cleanName || c.clientName,
            clientEmail: cleanEmail || c.clientEmail,
            lastUpdated: new Date().toISOString(),
          };
        }
        return c;
      });
      if (touchedChats) {
        localStorage.setItem('db_chats', JSON.stringify(updatedChats));
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('scoders_registered_workshops_changed'));
        window.dispatchEvent(new Event('scoders_sessions_change'));
        window.dispatchEvent(new Event('scoders_db_change'));
      }

      const res = await fetch('/api/workshops/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopId: params.workshopId,
          uniqueKey: validKey || undefined,
          name: cleanName || undefined,
          email: cleanEmail || undefined,
          phone: cleanPhone || undefined,
          role: cleanRole || undefined,
          notes: params.notes !== undefined ? params.notes : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || data?.updated === false) {
        return {
          success: false,
          error: data?.error || `Server returned status ${res.status} while saving workshop profile.`,
        };
      }

      if (data.record?.uniqueAccessKey) {
        this.markLocalWrite('db_workshop_registrations');
        const latestRegs = this.getWorkshopRegistrations();
        const merged = this.mergeByKey(latestRegs, [data.record], (r) =>
          String(r?.uniqueAccessKey || r?.id || '').trim().toUpperCase()
        );
        localStorage.setItem('db_workshop_registrations', JSON.stringify(merged));

        void syncRegistrationToFirestore({
          uid: data.record.uniqueAccessKey,
          section: 'workshop',
          itemId: data.record.workshopId || params.workshopId,
          itemTitle: data.record.workshopTitle || 'S-CODERS Workshop',
          clientName: data.record.participantProfile?.name || cleanName || 'Registered Attendee',
          clientEmail: data.record.participantProfile?.email || cleanEmail,
          clientPhone: data.record.participantProfile?.phone || cleanPhone,
          clientRole: data.record.participantProfile?.role || cleanRole,
          notes: data.record.notes ?? params.notes ?? '',
          amount: Number(data.record.amountPaid) || 0,
          paymentStatus: 'VERIFIED',
          paymentId: data.record.transactionId || '',
          status: 'ACTIVE',
          chatId: data.record.chatId || '',
        }).catch(() => {});
      }

      return { success: true, record: data.record };
    } catch (err: any) {
      console.warn('Save workshop profile warning:', err);
      return { success: false, error: err?.message || 'Unable to reach server to save workshop profile.' };
    }
  }

  public static async cancelWorkshopOrder(params: {
    workshopId: string;
    uniqueKey?: string;
    clientEmail?: string;
    chatId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const cleanKey = (params.uniqueKey || '').trim().toUpperCase();
    const cleanEmail = (params.clientEmail || '').trim().toLowerCase();
    const validKey = cleanKey && cleanKey !== 'PASS-KEY' ? cleanKey : '';

    // 1. Permanently delete from authoritative server database first
    try {
      const res = await fetch('/api/workshops/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopId: params.workshopId,
          uniqueKey: validKey || undefined,
          clientEmail: cleanEmail || undefined,
          chatId: params.chatId || undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.warn('Backend workshop cancel returned error:', errData);
      }
    } catch (netErr) {
      console.warn('Offline fallback for workshop cancellation:', netErr);
    }

    // 2. Permanently purge all associated workshop registration records locally
    try {
      const matchedRegIds = new Set<string>();
      const matchedFileIds = new Set<string>();
      const matchedChatIds = new Set<string>();
      const matchedKeys = new Set<string>();
      if (validKey) matchedKeys.add(validKey);
      if (params.chatId) matchedChatIds.add(params.chatId);

      const currentRegs = this.getWorkshopRegistrations();
      const remainingRegs = currentRegs.filter((reg) => {
        const regKey = (reg.uniqueAccessKey || '').trim().toUpperCase();
        const regEmail = (reg.participantProfile?.email || '').trim().toLowerCase();
        const matchesKey = Boolean(validKey && regKey === validKey);
        const matchesWksp = Boolean(!validKey && reg.workshopId === params.workshopId && (!cleanEmail || !regEmail || regEmail === cleanEmail));
        if (matchesKey || matchesWksp) {
          if (reg.id) matchedRegIds.add(reg.id);
          if (regKey) matchedKeys.add(regKey);
          if (reg.chatId) matchedChatIds.add(reg.chatId);
          if (Array.isArray(reg.materialsFileIds)) {
            reg.materialsFileIds.forEach((fid) => {
              if (fid) matchedFileIds.add(fid);
            });
          }
          return false;
        }
        return true;
      });
      localStorage.setItem('db_workshop_registrations', JSON.stringify(remainingRegs));

      const regWkspsRaw = localStorage.getItem('scoders_registered_workshops');
      const regWksps = regWkspsRaw ? JSON.parse(regWkspsRaw) : {};
      if (regWksps && typeof regWksps === 'object') {
        if (params.workshopId && regWksps[params.workshopId]) {
          const entryKey = String(regWksps[params.workshopId]?.key || '').trim().toUpperCase();
          if (entryKey) matchedKeys.add(entryKey);
          if (regWksps[params.workshopId]?.chatId) matchedChatIds.add(String(regWksps[params.workshopId].chatId));
          delete regWksps[params.workshopId];
        }
        Object.keys(regWksps).forEach((k) => {
          const entryKey = String(regWksps[k]?.key || '').trim().toUpperCase();
          if (entryKey && matchedKeys.has(entryKey)) {
            delete regWksps[k];
          }
        });
        localStorage.setItem('scoders_registered_workshops', JSON.stringify(regWksps));
      }

      const uidsRaw = localStorage.getItem('db_registration_uids');
      if (uidsRaw) {
        const uids = JSON.parse(uidsRaw);
        if (Array.isArray(uids)) {
          const filteredUids = uids.filter((u: any) => {
            if (u?.section !== 'workshop') return true;
            const recUid = String(u?.uid || '').trim().toUpperCase();
            return !(recUid && matchedKeys.has(recUid));
          });
          localStorage.setItem('db_registration_uids', JSON.stringify(filteredUids));
        }
      }

      const remainingChats = this.getChats().filter((c) => {
        const cKey = (c.uniqueAccessKey || '').trim().toUpperCase();
        const cEmail = (c.clientEmail || '').trim().toLowerCase();
        if (c.id && matchedChatIds.has(c.id)) return false;
        if (cKey && matchedKeys.has(cKey)) return false;
        if (c.registrationId && matchedRegIds.has(c.registrationId)) return false;
        if (params.workshopId && c.workshopId === params.workshopId && cleanEmail && cEmail === cleanEmail) return false;
        return true;
      });
      localStorage.setItem('db_chats', JSON.stringify(remainingChats));

      const remainingFiles = this.getFiles().filter(
        (f) => !matchedFileIds.has(f.id) && !matchedRegIds.has(f.registrationId)
      );
      localStorage.setItem('db_files', JSON.stringify(remainingFiles));

      const remainingFeedbacks = this.getFeedbacks().filter(
        (fb) => fb.type !== 'workshop' || !matchedRegIds.has(fb.registrationId)
      );
      localStorage.setItem('db_feedbacks', JSON.stringify(remainingFeedbacks));

      const revokedMap = this.getRevokedPasses();
      let touchedRevoked = false;
      matchedKeys.forEach((mk) => {
        if (revokedMap[mk]) {
          delete revokedMap[mk];
          touchedRevoked = true;
        }
      });
      if (touchedRevoked) {
        localStorage.setItem('scoders_revoked_passes', JSON.stringify(revokedMap));
      }

      try {
        localStorage.removeItem(`scoders_workshop_draft_${params.workshopId}_${validKey || 'active'}`);
        localStorage.removeItem(`scoders_workshop_draft_${params.workshopId}`);
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('scoders_registered_workshops_changed'));
        window.dispatchEvent(new Event('scoders_db_change'));
        window.dispatchEvent(new Event('scoders_data_change'));
        window.dispatchEvent(new Event('scoders_sessions_change'));
        window.dispatchEvent(new Event('storage'));
      }

      return { success: true };
    } catch (err: any) {
      console.error('Local workshop cancellation cleanup error:', err);
      return { success: false, error: err?.message || 'Failed to delete local workshop registration data.' };
    }
  }

  // --- Workshop Pass Revocation / Restoration (Admin Controlled) ---
  public static getRevokedPasses(): Record<string, RevokedPassRecord> {
    try {
      const stored = localStorage.getItem('scoders_revoked_passes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  public static isPassRevoked(passKey: string): boolean {
    if (!passKey) return false;
    const normalized = passKey.trim().toUpperCase();
    const revoked = this.getRevokedPasses();
    if (revoked[normalized]) return true;
    
    // Check in database workshop registrations
    const regs = this.getWorkshopRegistrations();
    return regs.some(r => r.uniqueAccessKey?.trim().toUpperCase() === normalized && (r.isRevoked || r.paymentStatus === 'Revoked'));
  }

  public static revokeWorkshopPass(
    workshopId: string, 
    passKey?: string, 
    reason: string = 'Administrative Revocation', 
    adminName: string = 'Admin'
  ): { success: boolean; message: string } {
    const revokedList = this.getRevokedPasses();
    const regs = this.getWorkshopRegistrations();
    let targetKey = passKey ? passKey.trim().toUpperCase() : '';
    let targetName = 'Attendee';
    let targetEmail = '';
    let targetTitle = 'Workshop';
    let targetAmount = 1499;

    const updatedRegs = regs.map(reg => {
      const isMatch = (workshopId && reg.workshopId === workshopId) || 
                      (targetKey && reg.uniqueAccessKey?.trim().toUpperCase() === targetKey);
      if (isMatch) {
        targetKey = reg.uniqueAccessKey || targetKey;
        targetName = reg.participantProfile?.name || targetName;
        targetEmail = reg.participantProfile?.email || targetEmail;
        targetTitle = reg.workshopTitle || targetTitle;
        targetAmount = reg.amountPaid || targetAmount;
        return {
          ...reg,
          paymentStatus: 'Revoked' as const,
          isRevoked: true,
          revokedAt: new Date().toISOString(),
          revokedBy: adminName,
          revokedReason: reason
        };
      }
      return reg;
    });

    this.saveWorkshopRegistrations(updatedRegs);

    // Also check and update scoders_registered_workshops
    try {
      const savedWksps = JSON.parse(localStorage.getItem('scoders_registered_workshops') || '{}');
      if (workshopId && savedWksps[workshopId]) {
        if (!targetKey) targetKey = savedWksps[workshopId].key;
        if (!targetName) targetName = savedWksps[workshopId].name;
        if (!targetEmail) targetEmail = savedWksps[workshopId].email;
        delete savedWksps[workshopId];
      }
      if (targetKey) {
        Object.keys(savedWksps).forEach(wId => {
          if (savedWksps[wId]?.key?.trim().toUpperCase() === targetKey) {
            delete savedWksps[wId];
          }
        });
      }
      localStorage.setItem('scoders_registered_workshops', JSON.stringify(savedWksps));
    } catch (e) {
      console.warn("Error updating local registered workshops on revoke:", e);
    }

    if (targetKey) {
      revokedList[targetKey] = {
        passKey: targetKey,
        workshopId,
        workshopTitle: targetTitle,
        participantName: targetName,
        participantEmail: targetEmail,
        revokedAt: new Date().toISOString(),
        revokedBy: adminName,
        reason,
        originalAmount: targetAmount
      };
      localStorage.setItem('scoders_revoked_passes', JSON.stringify(revokedList));
    }

    // Trigger window events so UI updates everywhere
    try {
      window.dispatchEvent(new CustomEvent('scoders_pass_revoked', { detail: { passKey: targetKey, workshopId, reason } }));
      window.dispatchEvent(new Event('scoders_registered_workshops_changed'));
      window.dispatchEvent(new Event('scoders_db_change'));
    } catch (e) {}

    return { success: true, message: `Pass ${targetKey || workshopId} has been successfully revoked by Admin.` };
  }

  public static restoreWorkshopPass(passKey: string): { success: boolean; message: string } {
    if (!passKey) return { success: false, message: 'Invalid pass key' };
    const normalized = passKey.trim().toUpperCase();
    const revokedList = this.getRevokedPasses();
    const record = revokedList[normalized];

    delete revokedList[normalized];
    localStorage.setItem('scoders_revoked_passes', JSON.stringify(revokedList));

    const regs = this.getWorkshopRegistrations();
    let restoredWorkshopId = record?.workshopId || '';
    const updatedRegs = regs.map(reg => {
      if (reg.uniqueAccessKey?.trim().toUpperCase() === normalized) {
        restoredWorkshopId = reg.workshopId;
        return {
          ...reg,
          paymentStatus: 'Successful' as const,
          isRevoked: false,
          revokedAt: undefined,
          revokedBy: undefined,
          revokedReason: undefined
        };
      }
      return reg;
    });
    this.saveWorkshopRegistrations(updatedRegs);

    if (restoredWorkshopId && record) {
      try {
        const savedWksps = JSON.parse(localStorage.getItem('scoders_registered_workshops') || '{}');
        savedWksps[restoredWorkshopId] = {
          key: normalized,
          name: record.participantName,
          email: record.participantEmail,
          role: 'Registered Attendee',
          tickets: 1,
          totalPaid: record.originalAmount || 1499,
          timestamp: new Date().toLocaleDateString()
        };
        localStorage.setItem('scoders_registered_workshops', JSON.stringify(savedWksps));
      } catch (e) {}
    }

    try {
      window.dispatchEvent(new CustomEvent('scoders_pass_restored', { detail: { passKey: normalized } }));
      window.dispatchEvent(new Event('scoders_registered_workshops_changed'));
      window.dispatchEvent(new Event('scoders_db_change'));
    } catch (e) {}

    return { success: true, message: `Pass ${normalized} has been restored successfully.` };
  }

  // --- Collection 3: Payments ---
  public static getPayments(): PaymentTransaction[] {
    return this.getStored('db_payments', SEED_PAYMENTS);
  }

  public static savePayments(data: PaymentTransaction[]): void {
    this.setStored('db_payments', data);
    localStorage.setItem('scoders_payments', JSON.stringify(data));
  }

  // --- Collection 4: Feedbacks ---
  public static getFeedbacks(): FeedbackItem[] {
    return this.getStored('db_feedbacks', SEED_FEEDBACKS);
  }

  public static saveFeedbacks(data: FeedbackItem[]): void {
    this.setStored('db_feedbacks', data);
    localStorage.setItem('scoders_feedbacks', JSON.stringify(data));
  }

  // --- Collection 5: Chats ---
  public static getChats(): ChatConversation[] {
    return this.getStored('db_chats', SEED_CHATS);
  }

  public static saveChats(data: ChatConversation[]): void {
    this.setStored('db_chats', data);
  }

  // --- Collection 6: Files ---
  public static getFiles(): FileRecord[] {
    return this.getStored('db_files', SEED_FILES);
  }

  public static saveFiles(data: FileRecord[]): void {
    this.setStored('db_files', data);
  }

  // --- Collection 7: Enquiries ---
  public static getEnquiries(): EnquiryItem[] {
    return this.getStored('db_enquiries', SEED_ENQUIRIES);
  }

  public static saveEnquiries(data: EnquiryItem[]): void {
    this.setStored('db_enquiries', data);
    localStorage.setItem('scoders_enquiries', JSON.stringify(data));
  }

  // --- Collection 8: Team Members ---
  public static getTeamMembers(): TeamMemberRecord[] {
    const list = this.getStored('db_team_members', SEED_TEAM);
    return list.map(member => {
      if (member.id === 'T1') return { ...member, photoUrl: getLeaderPhoto('shreyas') };
      if (member.id === 'T2') return { ...member, photoUrl: getLeaderPhoto('lokesh') };
      if (member.id === 'T3') return { ...member, photoUrl: getLeaderPhoto('bhuvan') };
      return member;
    });
  }

  public static saveTeamMembers(data: TeamMemberRecord[]): void {
    this.setStored('db_team_members', data);
  }

  // --- Collection 9: Gallery & Media ---
  public static getGalleryMedia(): GalleryMediaItem[] {
    return this.getStored('db_gallery_media', SEED_GALLERY);
  }

  public static saveGalleryMedia(data: GalleryMediaItem[]): void {
    this.setStored('db_gallery_media', data);
  }

  // --- Collection 10: Candidate Applications (Recruitment) ---
  public static getCandidateApplications(): CandidateApplication[] {
    return this.getStored('db_candidate_applications', SEED_APPLICATIONS);
  }

  public static saveCandidateApplications(data: CandidateApplication[]): void {
    this.setStored('db_candidate_applications', data);
    localStorage.setItem('scoders_candidate_applications', JSON.stringify(data));
  }

  public static addCandidateApplication(app: CandidateApplication): void {
    const apps = this.getCandidateApplications();
    const updated = [app, ...apps.filter(a => a.id !== app.id)];
    this.saveCandidateApplications(updated);
  }

  public static updateCandidateApplicationStatus(id: string, status: CandidateApplication['status'], notes?: string, reviewedBy?: string): CandidateApplication[] {
    const apps = this.getCandidateApplications();
    const updated = apps.map(app => {
      if (app.id === id) {
        return {
          ...app,
          status,
          adminNotes: notes !== undefined ? notes : app.adminNotes,
          reviewedBy: reviewedBy !== undefined ? reviewedBy : app.reviewedBy
        };
      }
      return app;
    });
    this.saveCandidateApplications(updated);
    return updated;
  }

  public static updateCandidateDepartmentVerification(
    id: string,
    departmentStatus: 'Not Requested' | 'Pending Verification' | 'Approved' | 'Rejected',
    departmentReferenceId?: string,
    departmentSelection?: string,
    rejectionReason?: string,
    approvedBy?: string
  ): CandidateApplication[] {
    const apps = this.getCandidateApplications();
    const now = new Date().toISOString();
    const updated = apps.map(app => {
      if (app.id === id) {
        return {
          ...app,
          departmentStatus,
          departmentReferenceId: departmentReferenceId || app.departmentReferenceId,
          departmentSelection: departmentSelection || app.departmentSelection,
          departmentApprovedAt: departmentStatus === 'Approved' ? now : app.departmentApprovedAt,
          departmentApprovedBy: departmentStatus === 'Approved' ? (approvedBy || 'Admin Desk') : app.departmentApprovedBy,
          departmentRejectionReason: departmentStatus === 'Rejected' ? rejectionReason : undefined,
          lastUpdated: now
        };
      }
      return app;
    });
    this.saveCandidateApplications(updated);
    return updated;
  }

  /**
   * Synchronize candidate applications with backend server database (/api/careers/applications).
   * Ensures that applications filled by candidates using the direct career link on any device are loaded.
   */
  public static async syncApplicationsFromServer(): Promise<CandidateApplication[]> {
    try {
      const res = await fetch('/api/careers/applications');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.applications)) {
          const local = this.getCandidateApplications();
          const map = new Map<string, CandidateApplication>();
          
          // Seed local first
          local.forEach(app => map.set(app.id, app));
          // Server database entries take precedence and add new ones
          data.applications.forEach((app: CandidateApplication) => map.set(app.id, app));
          
          const merged = Array.from(map.values()).sort((a, b) => {
            const dateA = new Date(a.createdAt || a.submissionDate || 0).getTime();
            const dateB = new Date(b.createdAt || b.submissionDate || 0).getTime();
            return dateB - dateA;
          });
          
          this.saveCandidateApplications(merged);
          return merged;
        }
      }
    } catch (err) {
      console.warn('Sync candidate applications with server database warning:', err);
    }
    return this.getCandidateApplications();
  }

  // ==========================================
  // 4. METRICS & INTERACTIVE ANALYTICS API
  // ==========================================
  public static getAnalytics() {
    const services = this.getServiceRegistrations();
    const workshops = this.getWorkshopRegistrations();
    const enquiries = this.getEnquiries();
    const payments = this.getPayments();
    const feedbacks = this.getFeedbacks();
    const candidateApplications = this.getCandidateApplications();

    // Calculate revenue
    const successPayments = payments.filter((p) => p.status === 'Successful');
    const revenue = successPayments.reduce((sum, p) => sum + p.amount, 0);

    // Active project count (In Progress or Pending status)
    const activeProjectsCount = services.filter(
      (s) => s.projectStatus === 'In Progress' || s.projectStatus === 'Pending'
    ).length;

    return {
      totalRegisteredClients: services.length,
      totalWorkshopParticipants: workshops.length,
      totalServices: services.length,
      totalCandidateApplications: candidateApplications.length,
      pendingServices: services.filter((s) => s.projectStatus === 'Pending').length,
      completedServices: services.filter((s) => s.projectStatus === 'Completed').length,
      deliveredProjects: services.filter((s) => s.projectStatus === 'Delivered').length,
      totalEnquiries: enquiries.length,
      successfulPayments: successPayments.length,
      failedPayments: payments.filter((p) => p.status === 'Failed').length,
      revenueGenerated: revenue,
      recentRegistrations: [
        ...services.map((s) => ({
          name: s.clientProfile.name,
          email: s.clientProfile.email,
          type: 'Service Registration',
          title: s.selectedServiceTitle,
          date: s.registrationDate
        })),
        ...workshops.map((w) => ({
          name: w.participantProfile.name,
          email: w.participantProfile.email,
          type: 'Workshop Admission',
          title: w.workshopTitle,
          date: w.paymentDate
        })),
        ...candidateApplications.map((c) => ({
          name: c.fullName,
          email: c.email,
          type: 'Talent Application',
          title: `${c.sector} (${c.roleTitle})`,
          date: c.submissionDate
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
      recentFeedback: feedbacks.slice(0, 5),
      activeProjectsCount
    };
  }

  // Helper to wipe the simulation database and re-seed
  public static resetToDefaultSeed(): void {
    localStorage.removeItem('db_service_registrations');
    localStorage.removeItem('db_workshop_registrations');
    localStorage.removeItem('db_payments');
    localStorage.removeItem('db_feedbacks');
    localStorage.removeItem('db_chats');
    localStorage.removeItem('db_files');
    localStorage.removeItem('db_enquiries');
    localStorage.removeItem('db_team_members');
    localStorage.removeItem('db_gallery_media');
    localStorage.removeItem('db_candidate_applications');
    
    // Core structural seeds
    this.saveServiceRegistrations(SEED_SERVICES_REG);
    this.saveWorkshopRegistrations(SEED_WORKSHOPS_REG);
    this.savePayments(SEED_PAYMENTS);
    this.saveFeedbacks(SEED_FEEDBACKS);
    this.saveChats(SEED_CHATS);
    this.saveFiles(SEED_FILES);
    this.saveEnquiries(SEED_ENQUIRIES);
    this.saveTeamMembers(SEED_TEAM);
    this.saveGalleryMedia(SEED_GALLERY);
    this.saveCandidateApplications(SEED_APPLICATIONS);
  }
}

// Auto-sync database with server on load, focus, visibility change, and every 3.5 seconds for multi-device sync
if (typeof window !== 'undefined') {
  DatabaseEngine.syncWithServer();
  DatabaseEngine.syncApplicationsFromServer();
  window.addEventListener('focus', () => {
    DatabaseEngine.syncWithServer();
    DatabaseEngine.syncApplicationsFromServer();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      DatabaseEngine.syncWithServer();
      DatabaseEngine.syncApplicationsFromServer();
    }
  });
  // Background interval so changes made by admin or tech head appear on all client devices automatically
  setInterval(() => {
    DatabaseEngine.syncWithServer();
    DatabaseEngine.syncApplicationsFromServer();
  }, 3500);
}

