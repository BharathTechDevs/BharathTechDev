export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
  bio: string;
  expertise: string[];
  linkedin: string;
  github: string;
  email?: string;
  contribution: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  technologies: string[];
  value: string;
  price?: number;
}

export interface ProjectExample {
  id: string;
  title: string;
  category: 'app' | 'website' | 'webpage';
  description: string;
  technologies: string[];
  image: string;
  demoUrl?: string;
  highlights: string[];
}

export interface WorkshopEvent {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  location: string;
  summary: string;
  achievements: string[];
  photo: string;
  category: string;
  attendees: number;
  price?: number;
  duration?: string;
  toolsUsed?: string[];
  usefulness?: string[];
  prerequisites?: string;
}

export interface StartupCommunity {
  id: string;
  name: string;
  logoUrl?: string;
  description: string;
  networkingHighlights: string;
  learnings: string[];
  presentations: string[];
  certification?: string;
}

export interface WorkshopComment {
  id: string;
  workshopId: string;
  authorName: string;
  role: string; // e.g. "Attendee", "Intern", "Startup Founder"
  content: string;
  timestamp: string;
  rating: number;
}

export interface ServiceEnquiry {
  id: string;
  category: 'app' | 'website' | 'webpage';
  clientName: string;
  email: string;
  requirements: string;
  budget?: string;
  timeline?: string;
  timestamp: string;
}

export interface GeneralMessage {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
  interest: string;
  timestamp: string;
}

export interface NetworkingAchievement {
  id: string;
  title: string;
  eventDate: string;
  type: 'attended' | 'conducted';
  location: string;
  description: string;
  image: string; // Primary captured live picture URL or custom uploaded photo
  images?: string[]; // Up to 8 photos for gallery / photostream carousel
  attendeesCount?: number;
  tags?: string[];
  featured?: boolean;
}

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'client';
  company?: string;
  phone?: string;
  createdAt: string;
}

export interface SCODERSEvent {
  id: string;
  name: string;
  bannerImage: string;
  date: string;
  day: string;
  time: string;
  location: string;
  description: string;
  category: 'hackathon' | 'networking' | 'workshop' | 'ai' | 'developer' | 'community' | 'founder';
  ticketPrice: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  featured?: boolean;
  eventPhotos: {
    id: string;
    caption: string;
    imageUrl: string;
    category?: 'venue' | 'speakers' | 'participants' | 'activities' | 'highlights' | 'behind_the_scenes';
  }[];
}

export interface EventTicket {
  id?: string;
  ticketCode: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventDay: string;
  eventTime: string;
  eventLocation: string;
  participantName: string;
  participantEmail: string;
  participantPhone: string;
  participantOrg?: string;
  bookingDate: string;
  bookingTime: string;
  amountPaid: number;
  paymentId: string;
  orderId: string;
  status: 'Payment Pending' | 'Payment Failed' | 'Payment Successful' | 'Ticket Generated' | 'Ticket Cancelled';
  qrCodeData: string;
}

export interface CandidateApplication {
  id: string; // e.g. "SCD-APP-2026-9481"
  submissionDate: string;
  status: 'Submitted' | 'Under Review' | 'Shortlisted' | 'Interview Scheduled' | 'Interview Cleared' | 'Approved for Onboarding' | 'Onboarding Completed' | 'Hired' | 'Rejected' | 'Archived' | 'Technical Round' | 'Offer Extended';
  
  // Step 1: Sector & Candidate Profile (First Application Form)
  sector: string; // Sector / Department
  roleTitle: string;
  employmentType: 'Full-Time' | 'Part-Time' | 'Internship' | 'Contractor';
  
  // Personal & Contact
  fullName: string;
  email: string;
  phone: string;
  whatsapp: string;
  currentCity: string;
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  
  // Education & Experience
  highestQualification: string;
  institutionName: string;
  yearOfGraduation: string;
  experienceLevel: string;
  keySkills: string;
  previousProjects: string;
  
  // Availability & Drive
  availabilityNotice: string;
  expectedCompensation: string;
  whyJoinScoders: string;
  impressiveAchievement: string;
  resumeLink: string;

  // Stage 3 & 4: Interview & Shortlisting Details
  interviewDate?: string;
  interviewTime?: string;
  interviewMeetingLink?: string; // Zoom link
  interviewRoundTitle?: string;
  interviewInstructions?: string;
  interviewFeedback?: string;
  interviewCleared?: boolean;
  interviewClearedAt?: string;

  // Stage 5 & 6: Admin Authorization for Second Form
  onboardingAuthorized?: boolean;
  onboardingToken?: string;
  onboardingAuthorizedAt?: string;
  rejectionReason?: string;
  rejectedAt?: string;

  // Stage 7: Second Application Form (Onboarding, Identification, Banking & Legal Induction)
  agreementTitle?: string;
  agreementReferenceId?: string;
  agreementDate?: string;
  effectiveDate?: string;
  agreementDuration?: string;
  agreementJurisdiction?: string;
  agreementVersion?: string;

  // S-CODERS Entity Details
  companyLegalName?: string;
  companyAddress?: string;
  companyCin?: string;
  companyGstin?: string;
  companyPan?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAuthorizedRepresentative?: string;
  companyRepresentativeDesignation?: string;

  // Full Personal & Identification Details
  candidateLegalName?: string;
  guardianName?: string; // Father / Spouse / Guardian
  dateOfBirth?: string;
  gender?: string;
  permanentAddress?: string;
  communicationAddress?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  officialEmail?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  
  // Bank coordinates for payroll / stipend disbursement
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  bankIfsc?: string;
  branchName?: string;
  upiId?: string;

  // Signatures & Consent
  candidateDigitalSignature?: string;
  agreedToNda?: boolean;
  agreedToCodeOfConduct?: boolean;
  agreedToIpAssignment?: boolean;
  declarationConfirmed?: boolean;

  // Stage 8 / Section 4: Department Selection, Admin Verification & WhatsApp/Zoom Access
  departmentSelection?: string;
  departmentStatus?: 'Not Requested' | 'Pending Verification' | 'Approved' | 'Rejected';
  departmentReferenceId?: string; // e.g. "GHZ-2026-A17"
  departmentRequestedAt?: string;
  departmentApprovedAt?: string;
  departmentApprovedBy?: string;
  departmentRejectionReason?: string;

  // Admin audit
  adminNotes?: string;
  reviewedBy?: string;
  createdAt?: string;
  lastUpdated?: string;
}

export interface DepartmentConfig {
  id: string; // e.g. 'frontend'
  name: string; // e.g. 'Front-End Developer'
  codePrefix: string; // e.g. 'GHZ'
  referenceFormat: string; // e.g. 'GHZ-2026-XXX'
  whatsappSubgroupLink: string;
  zoomMeetingLink: string;
  description: string;
}

export interface DepartmentMeeting {
  id: string;
  department: string; // e.g. 'Front-End Developer' or 'ALL'
  topic: string;
  instructions: string;
  meetingDate: string;
  meetingTime: string;
  zoomLink: string;
  status: 'Upcoming' | 'Live Now' | 'Completed' | 'Cancelled';
  createdAt?: string;
}



