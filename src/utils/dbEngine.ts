import { AppUser, Service, WorkshopEvent, CandidateApplication } from '../types';
import { getLeaderPhoto } from './leaderPhotos';

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
  paymentStatus: 'Pending' | 'Processing' | 'Successful' | 'Failed' | 'Cancelled' | 'Refunded';
  amountPaid: number;
  paymentMethod: string; // "UPI", "PhonePe", "Google Pay", "Credit Card"
  paymentDate: string;
  transactionId: string; // e.g. "TXN-74891"
  uniqueAccessKey: string; // assigned workshop key
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

export interface ChatConversation {
  id: string; // e.g. "CHT-5819"
  clientName: string;
  clientEmail: string;
  registrationId: string; // Service / Workshop registration ID
  reference: string; // Selected service title or workshop title
  messages: Array<{
    id: string;
    sender: 'client' | 'team';
    content: string;
    timestamp: string;
  }>;
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
    currentProjectStatus: 'Active & Architecting'
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
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing db collection [${key}]`, e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('scoders_db_change'));
      window.dispatchEvent(new Event('scoders_data_change'));
    }
  }

  // --- Collection 1: Service Registrations ---
  public static getServiceRegistrations(): ServiceRegistration[] {
    return this.getStored('db_service_registrations', SEED_SERVICES_REG);
  }

  public static saveServiceRegistrations(data: ServiceRegistration[]): void {
    this.setStored('db_service_registrations', data);
    // Backward compatibility sync
    const scodersReg: Record<string, any> = {};
    data.forEach((reg) => {
      scodersReg[reg.serviceId] = {
        key: reg.uniqueKey,
        name: reg.clientProfile.name,
        email: reg.clientProfile.email,
        role: 'Client Partner',
        budget: reg.budget,
        timeline: reg.timeline,
        timestamp: reg.registrationDate
      };
    });
    localStorage.setItem('scoders_registered_services', JSON.stringify(scodersReg));
  }

  // --- Collection 2: Workshop Registrations ---
  public static getWorkshopRegistrations(): WorkshopRegistration[] {
    return this.getStored('db_workshop_registrations', SEED_WORKSHOPS_REG);
  }

  public static saveWorkshopRegistrations(data: WorkshopRegistration[]): void {
    this.setStored('db_workshop_registrations', data);
    // Backward compatibility sync
    const scodersReg: Record<string, any> = {};
    data.forEach((reg) => {
      scodersReg[reg.workshopId] = {
        key: reg.uniqueAccessKey,
        name: reg.participantProfile.name,
        email: reg.participantProfile.email,
        role: reg.participantProfile.role,
        tickets: 1,
        totalPaid: reg.amountPaid,
        timestamp: reg.paymentDate
      };
    });
    localStorage.setItem('scoders_registered_workshops', JSON.stringify(scodersReg));
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
