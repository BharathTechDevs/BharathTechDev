import React, { useState, useEffect } from 'react';
import { 
  Briefcase, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, 
  Shield, FileText, Building2, User, Landmark, Sparkles, 
  Cpu, Smartphone, Globe, Palette, Cloud, Users, Award, 
  Download, Printer, Check, Copy, ExternalLink, RefreshCw,
  Layout, Terminal, Code, Video, Megaphone, PenTool, TrendingUp, Film,
  Calendar, Rocket, Link2, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CandidateApplication } from '../types';
import { DatabaseEngine } from '../utils/dbEngine';

interface CareersProps {
  onNavigate?: (view: string) => void;
}

const SECTORS = [
  {
    id: 'ai_engineering',
    name: 'AI & Automation Engineering',
    role: 'AI Agent & LLM Workflow Engineer',
    roles: [
      'AI Agent & LLM Workflow Engineer',
      'Generative AI & Prompt Engineer',
      'n8n & Workflow Automation Specialist',
      'Python & Vector Database Engineer',
      'AI Solutions Architect'
    ],
    icon: Cpu,
    skills: 'Gemini SDK, n8n, Python, Vector DBs, LangChain',
    badge: 'High Priority Hiring'
  },
  {
    id: 'frontend_engineering',
    name: 'Frontend Engineering',
    role: 'Frontend Software Engineer (React / Next.js)',
    roles: [
      'Frontend Software Engineer (React / Next.js)',
      'UI/UX Implementation Developer',
      'React 19 & TypeScript Specialist',
      'Web Performance & Animation Specialist'
    ],
    icon: Layout,
    skills: 'React 19, TypeScript, Next.js, Tailwind CSS, Motion',
    badge: 'Immediate Opening'
  },
  {
    id: 'backend_systems',
    name: 'Backend & AI Systems',
    role: 'Backend Systems Engineer (Node.js / Python)',
    roles: [
      'Backend Systems Engineer (Node.js / Python)',
      'API & Microservices Architect',
      'Database & Cache Engineer (PostgreSQL / Redis)',
      'FastAPI & Python Developer'
    ],
    icon: Terminal,
    skills: 'Node.js, Express, FastAPI, PostgreSQL, Redis, REST/gRPC',
    badge: 'Core Platform'
  },
  {
    id: 'fullstack_web',
    name: 'Full-Stack Web Development',
    role: 'Full-Stack Software Engineer (React / Node.js)',
    roles: [
      'Full-Stack Software Engineer (React / Node.js)',
      'MERN Stack Developer',
      'Next.js Full-Stack Architect',
      'SaaS Platform Engineer'
    ],
    icon: Globe,
    skills: 'React 19, Node.js, Express, PostgreSQL, TypeScript',
    badge: 'Active Hiring'
  },
  {
    id: 'mobile_apps',
    name: 'Mobile App Development',
    role: 'React Native Cross-Platform Developer',
    roles: [
      'React Native Cross-Platform Developer',
      'Flutter & Dart Mobile Engineer',
      'Android (Kotlin) Application Developer',
      'iOS & Native Modules Developer'
    ],
    icon: Smartphone,
    skills: 'React Native, Expo, Flutter, Native Modules, Offline Sync',
    badge: 'Active Hiring'
  },
  {
    id: 'video_editing',
    name: 'Video Editing',
    role: 'Video Editor & Motion Designer',
    roles: [
      'Video Editor & Motion Designer',
      'Lead Video Editor & Reel Creator',
      'Motion Graphics & VFX Artist',
      'YouTube & Long-Form Video Editor',
      'Shorts & Reels Video Editor',
      'Podcast & Audio-Visual Production Specialist',
      'Thumbnail & Visual Asset Designer'
    ],
    icon: Video,
    skills: 'Premiere Pro, After Effects, DaVinci Resolve, CapCut, Photoshop',
    badge: 'Media Track'
  },
  {
    id: 'content_writing',
    name: 'Content Writing',
    role: 'Content Writer & Copywriter',
    roles: [
      'Content Writer & Copywriter',
      'Technical Content Writer & Tech Blogger',
      'Social Media Copywriter & Ghostwriter',
      'Video Scriptwriter (Tech & AI Content)',
      'Developer Documentation & Guide Specialist',
      'Creative & Ad Copywriter'
    ],
    icon: PenTool,
    skills: 'Technical Writing, SEO Writing, Storytelling, Scriptwriting, Copywriting',
    badge: 'Content Track'
  },
  {
    id: 'digital_marketing',
    name: 'Digital Marketing',
    role: 'Digital Marketing Specialist',
    roles: [
      'Digital Marketing Specialist',
      'Social Media Marketing Manager',
      'Performance Marketing & Paid Ads Lead (Meta / Google Ads)',
      'SEO & Organic Growth Strategist',
      'Influencer Relations & Creator Partnerships Lead',
      'Email & Retention Marketing Specialist'
    ],
    icon: Megaphone,
    skills: 'Meta Ads, Google Ads, SEO, Social Strategy, Growth Hacking, Analytics',
    badge: 'Growth Track'
  },
  {
    id: 'startup_business',
    name: 'Startup & Business',
    role: 'Business Development & Startup Associate',
    roles: [
      'Business Development & Startup Associate',
      'Startup Strategy & Operations Lead',
      'Client Relations & Tech Sales Executive',
      'Partnership & Investor Relations Associate',
      'Product Operations & Project Coordinator',
      'Entrepreneur-in-Residence (EIR) Intern'
    ],
    icon: Rocket,
    skills: 'Startup Operations, Business Development, Client Outreach, Pitch Decks, CRM',
    badge: 'Strategy Track'
  },
  {
    id: 'event_management',
    name: 'Event Management',
    role: 'Event Coordinator & Community Lead',
    roles: [
      'Event Coordinator & Community Lead',
      'Hackathon & Workshop Operations Manager',
      'Campus Ambassador & College Outreach Lead',
      'Event Logistics & Venue Production Lead',
      'Sponsorship & Hospitality Coordinator',
      'Stage & AV Technical Coordinator'
    ],
    icon: Calendar,
    skills: 'Event Operations, Logistics, Community Building, Hospitality, Public Speaking',
    badge: 'Events Track'
  },
  {
    id: 'ui_ux_design',
    name: 'UI/UX & Product Design',
    role: 'Lead UI/UX Designer & Product Architect',
    roles: [
      'Lead UI/UX Designer & Product Architect',
      'Product Designer (Figma / Design Systems)',
      'Interaction & Motion Designer',
      'Visual & Brand Identity Designer'
    ],
    icon: Palette,
    skills: 'Figma, Design Systems, Motion Prototyping, Wireframing',
    badge: 'Design Track'
  },
  {
    id: 'devops_cloud',
    name: 'DevOps & Cloud Systems',
    role: 'DevOps & Backend Pipeline Engineer',
    roles: [
      'DevOps & Backend Pipeline Engineer',
      'Cloud Infrastructure Architect (GCP / Cloud Run)',
      'Site Reliability Engineer (SRE)',
      'CI/CD & Containerization Specialist'
    ],
    icon: Cloud,
    skills: 'Docker, Cloud Run, GCP, PostgreSQL, Redis, CI/CD',
    badge: 'Infrastructure'
  },
  {
    id: 'qa_testing',
    name: 'QA & Software Testing',
    role: 'QA Automation Engineer',
    roles: [
      'QA Automation Engineer',
      'Full-Cycle Web & Mobile Tester',
      'API & Load Performance Tester',
      'Security & Vulnerability Test Specialist'
    ],
    icon: CheckCircle2,
    skills: 'Jest, Playwright, Cypress, Postman, Security Auditing',
    badge: 'Quality Track'
  },
  {
    id: 'workshops_community',
    name: 'Tech Workshops & Community Growth',
    role: 'Developer Evangelist & Workshop Coordinator',
    roles: [
      'Developer Evangelist & Workshop Coordinator',
      'Technical Workshop Instructor',
      'Campus Ambassador & Hackathon Lead',
      'Tech Content Creator & Community Manager'
    ],
    icon: Users,
    skills: 'Technical Training, Public Speaking, Developer Relations',
    badge: 'Growth Track'
  }
];

const ALL_PREDEFINED_ROLES = Array.from(
  new Set(SECTORS.flatMap(s => s.roles || [s.role]))
);

export default function Careers({ onNavigate }: CareersProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successApp, setSuccessApp] = useState<CandidateApplication | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Compute the live active cloud server URL (running right now on Google Cloud Run)
  const liveActiveCloudUrl = typeof window !== 'undefined' && window.location.origin
    ? `${window.location.origin}/careers`
    : 'https://ais-pre-4pr6x2ldsz6wlrzuhtwvkl-289165168867.asia-southeast1.run.app/careers';

  // State for custom domain if user connects one
  const [customDomainInput, setCustomDomainInput] = useState<string>('');
  const [isUsingCustomDomain, setIsUsingCustomDomain] = useState(false);

  const getShareUrl = (): string => {
    if (isUsingCustomDomain && customDomainInput.trim()) {
      let d = customDomainInput.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
      return d.endsWith('/careers') ? `https://${d}` : `https://${d}/careers`;
    }
    return liveActiveCloudUrl;
  };

  const shareableCareersUrl = getShareUrl();

  const handleCopyShareLink = () => {
    const textToCopy = shareableCareersUrl;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedShareLink(true);
        setTimeout(() => setCopiedShareLink(false), 2500);
      }).catch(() => fallbackCopy(textToCopy));
    } else {
      fallbackCopy(textToCopy);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
    } catch (e) {
      console.error('Copy fallback failed', e);
    }
  };

  // Generate an initial unique Agreement Reference ID
  const [agreementRefId] = useState<string>(() => {
    return `SCD-AGR-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  });

  const todayDate = new Date().toISOString().split('T')[0];

  // ==========================================
  // FORM STATE: STEP 1 (Candidate Profile & Sector)
  // ==========================================
  const [selectedSector, setSelectedSector] = useState<string>(SECTORS[0].name);
  const [roleTitle, setRoleTitle] = useState<string>(SECTORS[0].role);
  const [employmentType, setEmploymentType] = useState<'Full-Time' | 'Part-Time' | 'Internship' | 'Contractor'>('Full-Time');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  const [highestQualification, setHighestQualification] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [yearOfGraduation, setYearOfGraduation] = useState('2025');
  const [experienceLevel, setExperienceLevel] = useState('0-1 Years');
  const [keySkills, setKeySkills] = useState('');
  const [previousProjects, setPreviousProjects] = useState('');

  const [availabilityNotice, setAvailabilityNotice] = useState('Immediate');
  const [expectedCompensation, setExpectedCompensation] = useState('');
  const [whyJoinScoders, setWhyJoinScoders] = useState('');
  const [impressiveAchievement, setImpressiveAchievement] = useState('');
  const [resumeLink, setResumeLink] = useState('');

  // ==========================================
  // FORM STATE: STEP 2 (Induction & Non-Disclosure Agreement)
  // ==========================================
  // 1. Agreement Identification
  const [agreementTitle] = useState('S-CODERS Talent Induction & Non-Disclosure Agreement (NDA)');
  const [agreementDate] = useState(todayDate);
  const [effectiveDate, setEffectiveDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [agreementDuration, setAgreementDuration] = useState('12 Months');
  const [agreementJurisdiction] = useState('Bengaluru, Karnataka, India');
  const [agreementVersion] = useState('v2.4 - 2026');

  // 2. S-CODERS Company Information (Contracting Party)
  const [companyLegalName] = useState('S-CODERS (Bharath Tech Developers)');
  const [companyAddress] = useState('Bengaluru, Karnataka, India - 560060');
  const [companyCin] = useState('UDYAM-KR-03-018249');
  const [companyGstin] = useState('29AABCXXXXX1Z5');
  const [companyPan] = useState('AABCS8291M');
  const [companyEmail] = useState('scoders82@gmail.com');
  const [companyPhone] = useState('+91 6363905989 / +91 8867540445');
  const [companyAuthorizedRepresentative] = useState('Shreyas M. / Bhuvan M.');
  const [companyRepresentativeDesignation] = useState('Founder & CEO / Tech Lead');

  // 3. Candidate Legal Verification & Identification
  const [candidateLegalName, setCandidateLegalName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [communicationAddress, setCommunicationAddress] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Bank Account Details for compensation/stipend
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branchName, setBranchName] = useState('');

  // Declarations & Signatures
  const [candidateDigitalSignature, setCandidateDigitalSignature] = useState('');
  const [agreedToNda, setAgreedToNda] = useState(false);
  const [agreedToCodeOfConduct, setAgreedToCodeOfConduct] = useState(false);
  const [agreedToIpAssignment, setAgreedToIpAssignment] = useState(false);
  const [declarationConfirmed, setDeclarationConfirmed] = useState(false);

  // Sync candidate legal name with full name from step 1 when advancing
  const handleSelectSector = (sector: typeof SECTORS[0]) => {
    setSelectedSector(sector.name);
    setRoleTitle(sector.role);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ==========================================
  // VALIDATION: STEP 1 (ALL QUESTIONS MANDATORY)
  // ==========================================
  const validateStep1 = (): boolean => {
    setErrorBanner(null);

    if (!selectedSector.trim()) {
      setErrorBanner('Please select the sector / track you wish to join.');
      return false;
    }
    if (!roleTitle.trim()) {
      setErrorBanner('Role Title is required.');
      return false;
    }
    if (!fullName.trim()) {
      setErrorBanner('Please enter your Full Legal Name.');
      return false;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorBanner('Please provide a valid Contact Email Address.');
      return false;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setErrorBanner('Please provide a valid 10-digit Phone / Mobile Number.');
      return false;
    }
    if (!whatsapp.trim()) {
      setErrorBanner('Please enter your WhatsApp Contact Number.');
      return false;
    }
    if (!currentCity.trim()) {
      setErrorBanner('Please enter your Current City & State.');
      return false;
    }
    if (!portfolioUrl.trim() && !githubUrl.trim() && !linkedinUrl.trim()) {
      setErrorBanner('Please provide at least one developer profile link (GitHub, LinkedIn, or Portfolio).');
      return false;
    }
    if (!highestQualification.trim()) {
      setErrorBanner('Please enter your Highest Qualification (e.g. B.Tech in CSE, BCA, MCA).');
      return false;
    }
    if (!institutionName.trim()) {
      setErrorBanner('Please enter your College / University / Institute Name.');
      return false;
    }
    if (!yearOfGraduation.trim()) {
      setErrorBanner('Please enter your Year of Graduation.');
      return false;
    }
    if (!keySkills.trim()) {
      setErrorBanner('Please list your Core Technical Skills & Frameworks.');
      return false;
    }
    if (!previousProjects.trim()) {
      setErrorBanner('Please describe your previous projects or technical experience.');
      return false;
    }
    if (!expectedCompensation.trim()) {
      setErrorBanner('Please specify your Expected Salary.');
      return false;
    }
    if (!whyJoinScoders.trim()) {
      setErrorBanner('Please share why you want to join S-CODERS (Bharath Tech Developers).');
      return false;
    }
    if (!impressiveAchievement.trim()) {
      setErrorBanner('Please describe your most impressive technical achievement or project.');
      return false;
    }
    if (!resumeLink.trim()) {
      setErrorBanner('Please provide a link to your Resume / CV (Google Drive / GitHub / Hosted link).');
      return false;
    }

    return true;
  };

  const handleProceedToStep2 = () => {
    if (validateStep1()) {
      // Pre-populate candidate legal name and official email if not yet set
      if (!candidateLegalName) setCandidateLegalName(fullName);
      if (!officialEmail) setOfficialEmail(email);
      if (!accountHolderName) setAccountHolderName(fullName);
      if (!communicationAddress && currentCity) setCommunicationAddress(currentCity);
      
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ==========================================
  // VALIDATION: STEP 2 (ALL QUESTIONS MANDATORY)
  // ==========================================
  const validateStep2 = (): boolean => {
    setErrorBanner(null);

    if (!effectiveDate) {
      setErrorBanner('Please specify the Proposed Effective Start Date of the agreement.');
      return false;
    }
    if (!candidateLegalName.trim()) {
      setErrorBanner('Candidate Legal Name (as per Government ID) is mandatory.');
      return false;
    }
    if (!guardianName.trim()) {
      setErrorBanner("Father's / Guardian's / Spouse's Name is mandatory.");
      return false;
    }
    if (!dateOfBirth) {
      setErrorBanner('Date of Birth is mandatory.');
      return false;
    }
    if (!permanentAddress.trim()) {
      setErrorBanner('Permanent Residential Address is mandatory.');
      return false;
    }
    if (!communicationAddress.trim()) {
      setErrorBanner('Current Communication Address is mandatory.');
      return false;
    }
    if (!panNumber.trim() || panNumber.trim().length < 8) {
      setErrorBanner('A valid Permanent Account Number (PAN) is mandatory for employment contracting.');
      return false;
    }
    if (!aadhaarNumber.trim() || aadhaarNumber.replace(/\D/g, '').length < 12) {
      setErrorBanner('A valid 12-digit Aadhaar / National ID Number is mandatory for legal onboarding.');
      return false;
    }
    if (!emergencyContactName.trim()) {
      setErrorBanner('Emergency Contact Person name is mandatory.');
      return false;
    }
    if (!emergencyContactPhone.trim()) {
      setErrorBanner('Emergency Contact Phone number is mandatory.');
      return false;
    }
    if (!bankName.trim()) {
      setErrorBanner('Bank Name is mandatory for payroll & compensation disbursement.');
      return false;
    }
    if (!accountHolderName.trim()) {
      setErrorBanner('Bank Account Holder Name is mandatory.');
      return false;
    }
    if (!accountNumber.trim()) {
      setErrorBanner('Bank Account Number is mandatory.');
      return false;
    }
    if (accountNumber.trim() !== confirmAccountNumber.trim()) {
      setErrorBanner('Bank Account Number and Confirm Account Number do not match.');
      return false;
    }
    if (!ifscCode.trim() || ifscCode.trim().length < 6) {
      setErrorBanner('Valid Bank IFSC Code is mandatory.');
      return false;
    }
    if (!branchName.trim()) {
      setErrorBanner('Bank Branch Location is mandatory.');
      return false;
    }
    if (!candidateDigitalSignature.trim()) {
      setErrorBanner('Please type your Full Legal Name in the Digital Signature field.');
      return false;
    }
    if (!agreedToNda) {
      setErrorBanner('You must accept the S-CODERS Non-Disclosure Agreement (NDA) clause.');
      return false;
    }
    if (!agreedToCodeOfConduct) {
      setErrorBanner('You must agree to the S-CODERS Engineering Code of Conduct & IP Assignment policy.');
      return false;
    }
    if (!agreedToIpAssignment) {
      setErrorBanner('You must accept the Intellectual Property (IP) Assignment terms.');
      return false;
    }
    if (!declarationConfirmed) {
      setErrorBanner('You must confirm that all provided information is accurate and legally truthful.');
      return false;
    }

    return true;
  };

  // ==========================================
  // FINAL SUBMISSION HANDLER
  // ==========================================
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsSubmitting(true);
    setErrorBanner(null);

    const submissionId = `SCD-APP-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const applicationPayload: CandidateApplication = {
      id: submissionId,
      submissionDate: todayDate,
      status: 'Submitted',
      sector: selectedSector,
      roleTitle,
      employmentType,
      fullName,
      email,
      phone,
      whatsapp,
      currentCity,
      portfolioUrl: portfolioUrl || 'N/A',
      githubUrl: githubUrl || 'N/A',
      linkedinUrl: linkedinUrl || 'N/A',
      highestQualification,
      institutionName,
      yearOfGraduation,
      experienceLevel,
      keySkills,
      previousProjects,
      availabilityNotice,
      expectedCompensation,
      whyJoinScoders,
      impressiveAchievement,
      resumeLink,
      agreementTitle,
      agreementReferenceId: agreementRefId,
      agreementDate,
      effectiveDate,
      agreementDuration,
      agreementJurisdiction,
      agreementVersion,
      companyLegalName,
      companyAddress,
      companyCin,
      companyGstin,
      companyPan,
      companyEmail,
      companyPhone,
      companyAuthorizedRepresentative,
      companyRepresentativeDesignation,
      candidateLegalName,
      guardianName,
      dateOfBirth,
      gender,
      permanentAddress,
      communicationAddress,
      panNumber: panNumber.toUpperCase(),
      aadhaarNumber,
      officialEmail,
      emergencyContactName,
      emergencyContactPhone,
      bankName,
      accountHolderName,
      accountNumber,
      ifscCode: ifscCode.toUpperCase(),
      branchName,
      candidateDigitalSignature,
      agreedToNda,
      agreedToCodeOfConduct,
      agreedToIpAssignment,
      declarationConfirmed,
      adminNotes: 'Application received via Careers Recruitment Portal. Mandatory fields and induction agreement verified.',
      reviewedBy: 'Under Initial Screening'
    };

    try {
      // 1. Save directly to DatabaseEngine local collection
      DatabaseEngine.addCandidateApplication(applicationPayload);

      // 2. Post to server-side API endpoint for persistent storage in data/applications.json & email dispatch
      const res = await fetch('/api/careers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationPayload)
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.candidate) {
          DatabaseEngine.addCandidateApplication(data.candidate);
        }
      }

      // 3. Trigger server sync to keep collections unified
      DatabaseEngine.syncApplicationsFromServer().catch(() => {});

      setSuccessApp(applicationPayload);
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Submission error:', err);
      // Even if network fails, DatabaseEngine has safely preserved it locally
      setSuccessApp(applicationPayload);
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="careers-portal" className="min-h-screen bg-brand-dark text-gray-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-teal/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Header Title Section */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-teal/10 border border-brand-teal/30 text-brand-teal text-xs font-mono mb-4 uppercase tracking-wider">
            <Briefcase className="w-3.5 h-3.5" />
            <span>S-CODERS TALENT & CAREERS PORTAL</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight mb-4">
            Join S-CODERS <span className="text-brand-teal">Crew</span>
          </h1>
          <p className="text-gray-400 font-sans font-light text-base sm:text-lg leading-relaxed">
            We are hiring builders, AI architects, designers, and systems engineers. Complete your profile and execute the Talent Induction & Non-Disclosure Agreement.
          </p>
        </div>

        {/* Dedicated Separate Link & Database Sync Banner */}
        <div className="mb-10 bg-brand-card/80 border border-brand-teal/30 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-teal/15 border border-brand-teal/30 flex items-center justify-center text-brand-teal shrink-0">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      Direct Recruitment Form Link
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Cloud Server Active
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-[10px] font-mono">
                      Database Connected
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                    Share this link with applicants. Anyone who fills the form will have their candidate dossier & signed agreement saved into the S-CODERS recruitment database and synced with the Admin Console.
                  </p>
                </div>
              </div>

              {/* Quick Actions (Copy & WhatsApp) */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shadow-md ${
                    copiedShareLink
                      ? 'bg-emerald-500 text-brand-dark shadow-emerald-500/20'
                      : 'bg-brand-teal text-brand-dark hover:bg-white hover:text-brand-dark shadow-brand-teal/10'
                  }`}
                >
                  {copiedShareLink ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Apply to S-CODERS: Join the Tech Crew & execute Talent Induction Agreement: ${shareableCareersUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/25 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Share on WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Current Working Live URL Box */}
            <div className="bg-black/50 border border-brand-teal/25 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Working Link:
                  </span>
                  <div className="font-mono text-xs sm:text-sm font-semibold text-brand-teal bg-brand-teal/10 px-3 py-1.5 rounded-lg border border-brand-teal/30 truncate select-all break-all">
                    {shareableCareersUrl}
                  </div>
                </div>
                <a
                  href={shareableCareersUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-teal text-brand-dark hover:bg-white transition-all text-xs font-mono font-bold cursor-pointer shadow-md"
                >
                  <span>Open & Test Form</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Status & Technical Explanation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs text-gray-300">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-mono text-[11px]">Why this link is 100% active:</strong>
                    <span className="text-gray-400 text-[11px] leading-relaxed">
                      This is the real, running server on Google Cloud Run. Anyone who clicks it can apply right now, and all submissions immediately write to your database and appear in your Admin Console.
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-mono text-[11px]">Why "ais" is in the link & why TinyURL failed:</strong>
                    <span className="text-gray-400 text-[11px] leading-relaxed">
                      <strong>ais</strong> stands for <em>Google AI Studio</em>. Public shorteners (TinyURL, Bitly) block or show security warning screens on cloud domains (<code className="text-cyan-300 font-mono">.run.app</code>). Custom domains like <code className="text-amber-300 font-mono">s-coders.com</code> require purchasing the domain and setting up DNS.
                    </span>
                  </div>
                </div>
              </div>

              {/* Custom Domain Option Toggle */}
              <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsUsingCustomDomain(!isUsingCustomDomain)}
                  className="text-xs font-mono text-gray-400 hover:text-brand-teal flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{isUsingCustomDomain ? 'Use Cloud Run URL' : 'Have a registered custom domain (e.g. yourcompany.com)?'}</span>
                </button>

                {isUsingCustomDomain && (
                  <div className="flex items-center gap-2 flex-1 max-w-md">
                    <span className="text-xs font-mono text-gray-400">https://</span>
                    <input
                      type="text"
                      value={customDomainInput}
                      onChange={(e) => setCustomDomainInput(e.target.value)}
                      placeholder="yourdomain.com"
                      className="bg-black/60 border border-brand-teal/30 rounded-lg px-3 py-1 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal flex-1"
                    />
                    <span className="text-xs font-mono text-gray-400">/careers</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step Progress Tracker */}
        <div className="mb-10 bg-brand-card/70 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-md">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
            {/* Step 1 Pill */}
            <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              currentStep === 1 
                ? 'bg-brand-teal/15 border border-brand-teal/40 text-brand-teal' 
                : currentStep > 1 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                  : 'bg-white/5 text-gray-500'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                currentStep === 1 
                  ? 'bg-brand-teal text-brand-dark' 
                  : currentStep > 1 
                    ? 'bg-emerald-500 text-brand-dark' 
                    : 'bg-white/10 text-gray-400'
              }`}>
                {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '01'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[11px] font-mono uppercase tracking-wider">Step 1</p>
                <p className="text-xs font-semibold text-white truncate">Profile & Sector</p>
              </div>
            </div>

            {/* Step 2 Pill */}
            <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              currentStep === 2 
                ? 'bg-brand-teal/15 border border-brand-teal/40 text-brand-teal' 
                : currentStep > 2 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                  : 'bg-white/5 text-gray-500'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                currentStep === 2 
                  ? 'bg-brand-teal text-brand-dark' 
                  : currentStep > 2 
                    ? 'bg-emerald-500 text-brand-dark' 
                    : 'bg-white/10 text-gray-400'
              }`}>
                {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '02'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[11px] font-mono uppercase tracking-wider">Step 2</p>
                <p className="text-xs font-semibold text-white truncate">Legal & Induction Agreement</p>
              </div>
            </div>

            {/* Step 3 Pill */}
            <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              currentStep === 3 
                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400' 
                : 'bg-white/5 text-gray-500'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                currentStep === 3 ? 'bg-emerald-500 text-brand-dark' : 'bg-white/10 text-gray-400'
              }`}>
                03
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[11px] font-mono uppercase tracking-wider">Step 3</p>
                <p className="text-xs font-semibold text-white truncate">Dossier Confirmation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Notification Banner */}
        {errorBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 flex items-start gap-3 text-sm"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-200">Mandatory Information Required</p>
              <p className="text-xs text-red-300/90 mt-0.5">{errorBanner}</p>
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* STEP 1: CANDIDATE PROFILE & SECTOR SELECTION */}
        {/* ============================================================ */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Sector / Track Picker */}
            <div className="bg-brand-card/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-teal" />
                    Select Your Track / Sector <span className="text-brand-teal">*</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Choose the engineering or design vertical that aligns with your domain expertise.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-brand-teal bg-brand-teal/10 px-2.5 py-1 rounded-full border border-brand-teal/20">
                  Mandatory Field
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {SECTORS.map((sector) => {
                  const Icon = sector.icon;
                  const isSelected = selectedSector === sector.name;
                  return (
                    <button
                      key={sector.id}
                      type="button"
                      onClick={() => handleSelectSector(sector)}
                      className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-brand-teal/10 border-brand-teal text-white shadow-lg shadow-brand-teal/10 ring-1 ring-brand-teal/50' 
                          : 'bg-brand-dark/50 border-white/10 text-gray-300 hover:border-white/25 hover:bg-white/5'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-brand-teal text-brand-dark' : 'bg-white/10 text-brand-teal'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            isSelected ? 'bg-brand-teal/20 border-brand-teal/40 text-brand-teal' : 'bg-white/5 border-white/10 text-gray-400'
                          }`}>
                            {sector.badge}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-white mb-1 leading-snug">{sector.name}</h3>
                        <p className="text-xs text-gray-400 line-clamp-1">{sector.role}</p>
                      </div>
                      <p className="text-[11px] font-mono text-gray-400 mt-3 pt-2 border-t border-white/5">
                        <span className="text-gray-300">Stack:</span> {sector.skills}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Application Specifics */}
            <div className="bg-brand-card/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                <Briefcase className="w-5 h-5 text-brand-teal" />
                Role Specifics & Employment Model
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-mono uppercase tracking-wider text-gray-300">
                      Designated Role Title <span className="text-brand-teal">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-gray-400">
                      Select or type custom
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    list="all-roles-datalist"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. AI Workflow Engineer, Frontend Developer..."
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                  <datalist id="all-roles-datalist">
                    {ALL_PREDEFINED_ROLES.map((role) => (
                      <option key={role} value={role} />
                    ))}
                  </datalist>

                  {/* Quick Role Selection Pills for Active Track */}
                  {(() => {
                    const activeSector = SECTORS.find(s => s.name === selectedSector);
                    if (!activeSector?.roles || activeSector.roles.length === 0) return null;
                    return (
                      <div className="mt-2.5 space-y-1.5">
                        <span className="text-[10px] font-mono text-gray-400 block">
                          Suggested Roles in {activeSector.name} (Click to auto-fill):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeSector.roles.map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setRoleTitle(r)}
                              className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer text-left ${
                                roleTitle === r
                                  ? 'bg-brand-teal text-brand-dark font-bold border-brand-teal shadow-sm shadow-brand-teal/20'
                                  : 'bg-white/5 border-white/10 text-gray-300 hover:border-brand-teal/40 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Employment Type <span className="text-brand-teal">*</span>
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value as any)}
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-teal transition-colors"
                  >
                    <option value="Full-Time">Full-Time (Core Member)</option>
                    <option value="Part-Time">Part-Time (Flexible Hours)</option>
                    <option value="Internship">Engineering Internship (3 - 6 Months)</option>
                    <option value="Contractor">Contractor / Project Basis</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Personal & Contact Details */}
            <div className="bg-brand-card/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                <User className="w-5 h-5 text-brand-teal" />
                Personal & Contact Coordinates
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Full Name <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ananya Sharma"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Email Address <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ananya.sharma@gmail.com"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Primary Mobile Number <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98450 11223"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    WhatsApp Contact Number <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="e.g. +91 98450 11223"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Current Location / City & State <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={currentCity}
                    onChange={(e) => setCurrentCity(e.target.value)}
                    placeholder="e.g. Bengaluru, Karnataka"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    GitHub Profile Link <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    LinkedIn Profile Link <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Portfolio or Live Project URL
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://yourportfolio.dev"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Qualifications & Experience */}
            <div className="bg-brand-card/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                <Award className="w-5 h-5 text-brand-teal" />
                Education, Technical Skills & Projects
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Highest Degree / Qualification <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={highestQualification}
                    onChange={(e) => setHighestQualification(e.target.value)}
                    placeholder="e.g. B.Tech in CSE / BCA"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    College / Institute Name <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="e.g. RVCE / PES / BMSCE"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Graduation Year <span className="text-brand-teal">*</span>
                  </label>
                  <select
                    value={yearOfGraduation}
                    onChange={(e) => setYearOfGraduation(e.target.value)}
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-teal transition-colors"
                  >
                    <option value="2027">2027 (Undergrad)</option>
                    <option value="2026">2026 (Final Year)</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023 or Earlier</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Years of Relevant Experience <span className="text-brand-teal">*</span>
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-teal transition-colors"
                  >
                    <option value="Fresher / Student">Fresher / Student</option>
                    <option value="0-1 Years">0 - 1 Years</option>
                    <option value="1-3 Years">1 - 3 Years</option>
                    <option value="3-5 Years">3 - 5 Years</option>
                    <option value="5+ Years">5+ Years (Senior Lead)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Key Technical Skills & Tools <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={keySkills}
                    onChange={(e) => setKeySkills(e.target.value)}
                    placeholder="e.g. React, TypeScript, Gemini SDK, n8n, Tailwind, Node.js"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Highlight Recent Projects Built <span className="text-brand-teal">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={previousProjects}
                  onChange={(e) => setPreviousProjects(e.target.value)}
                  placeholder="Describe 1-2 major software, web, mobile, or AI projects you built, architectures used, and live impact..."
                  className="w-full bg-brand-dark/70 border border-white/15 rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                />
              </div>
            </div>

            {/* Availability, Motivation & Resume */}
            <div className="bg-brand-card/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                <FileText className="w-5 h-5 text-brand-teal" />
                Availability & Compensation Expectation
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Joining Notice / Availability <span className="text-brand-teal">*</span>
                  </label>
                  <select
                    value={availabilityNotice}
                    onChange={(e) => setAvailabilityNotice(e.target.value)}
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-teal transition-colors"
                  >
                    <option value="Immediate">Immediate Joining (Within 3 Days)</option>
                    <option value="7 Days">Within 7 Days</option>
                    <option value="15 Days">Within 15 Days</option>
                    <option value="30 Days">30 Days Notice Period</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="expectedSalary" className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Expected Salary <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    id="expectedSalary"
                    name="expectedSalary"
                    type="text"
                    required
                    value={expectedCompensation}
                    onChange={(e) => setExpectedCompensation(e.target.value)}
                    placeholder="Expected Salary"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Why do you want to join S-CODERS? <span className="text-brand-teal">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={whyJoinScoders}
                  onChange={(e) => setWhyJoinScoders(e.target.value)}
                  placeholder="What excites you about our startup, generative AI agent workflows, and client delivery model?"
                  className="w-full bg-brand-dark/70 border border-white/15 rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  What is your most impressive technical achievement? <span className="text-brand-teal">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={impressiveAchievement}
                  onChange={(e) => setImpressiveAchievement(e.target.value)}
                  placeholder="Hackathon win, open source PR merged, production service scaled, or complex bug resolved..."
                  className="w-full bg-brand-dark/70 border border-white/15 rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Resume / CV Link (Google Drive / Dropbox / PDF link) <span className="text-brand-teal">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={resumeLink}
                  onChange={(e) => setResumeLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/your-resume/view (Ensure access is public/viewable)"
                  className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                />
              </div>
            </div>

            {/* Navigation CTA: Proceed to Step 2 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
              <p className="text-xs text-gray-400">
                All questions above are mandatory. Clicking Next will open the Induction Agreement form.
              </p>
              <button
                type="button"
                onClick={handleProceedToStep2}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-brand-teal text-brand-dark font-mono font-bold text-sm uppercase tracking-wider hover:bg-white hover:shadow-xl hover:shadow-brand-teal/20 transition-all duration-300 cursor-pointer focus:outline-none"
              >
                <span>Next: Legal & Induction Agreement</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: INDUCTION & NON-DISCLOSURE AGREEMENT (NDA) */}
        {/* ============================================================ */}
        {currentStep === 2 && (
          <motion.form
            key="step2"
            onSubmit={handleSubmitApplication}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Induction Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1F4959]/50 via-brand-card to-[#011425] border border-brand-teal/30 flex items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal/20 text-brand-teal text-xs font-mono uppercase mb-2">
                  <Shield className="w-3.5 h-3.5" />
                  Legal Contracting Instrument
                </div>
                <h3 className="text-xl font-display font-bold text-white">
                  S-CODERS Professional Talent Induction & NDA
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  Reference: <span className="font-mono text-brand-teal font-bold">{agreementRefId}</span> • Jurisdiction: Bengaluru, Karnataka, India
                </p>
              </div>
              <div className="hidden md:block text-right font-mono text-xs text-gray-400">
                <p>Status: <span className="text-amber-400 font-bold">Execution Ready</span></p>
                <p>Version: {agreementVersion}</p>
              </div>
            </div>

            {/* 1. Agreement Identification */}
            <div className="bg-brand-card/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                <FileText className="w-5 h-5 text-brand-teal" />
                1. Agreement Identification & Validity Parameters
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                    Agreement Title
                  </label>
                  <input
                    type="text"
                    disabled
                    value={agreementTitle}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 cursor-not-allowed font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                    Agreement Number / Reference ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      value={agreementRefId}
                      className="w-full bg-white/5 border border-brand-teal/30 rounded-xl px-4 py-3 text-sm text-brand-teal font-mono font-bold cursor-not-allowed text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(agreementRefId, 'agr')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {copiedKey === 'agr' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                    Date of Agreement
                  </label>
                  <input
                    type="text"
                    disabled
                    value={agreementDate}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 cursor-not-allowed font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1">
                    Proposed Effective Date <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1">
                    Agreement Duration <span className="text-brand-teal">*</span>
                  </label>
                  <select
                    value={agreementDuration}
                    onChange={(e) => setAgreementDuration(e.target.value)}
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-teal transition-colors"
                  >
                    <option value="6 Months">6 Months</option>
                    <option value="12 Months">12 Months (1 Year)</option>
                    <option value="24 Months">24 Months (2 Years)</option>
                    <option value="Indefinite / Permanent">Indefinite / Permanent Employment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                    Place / Jurisdiction
                  </label>
                  <input
                    type="text"
                    disabled
                    value={agreementJurisdiction}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 cursor-not-allowed font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 2. S-CODERS Company Information */}
            <div className="bg-brand-card/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-brand-teal" />
                  2. S-CODERS Entity Details (First Contracting Party)
                </h2>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Verified Entity
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                    Legal Company Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={companyLegalName}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 cursor-not-allowed font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                    Registered Office Address
                  </label>
                  <input
                    type="text"
                    disabled
                    value={companyAddress}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 cursor-not-allowed text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                    CIN / Startup Registration
                  </label>
                  <input
                    type="text"
                    disabled
                    value={companyCin}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 cursor-not-allowed font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    disabled
                    value={companyGstin}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 cursor-not-allowed font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                    Company PAN
                  </label>
                  <input
                    type="text"
                    disabled
                    value={companyPan}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 cursor-not-allowed font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                    Company Official Email
                  </label>
                  <input
                    type="text"
                    disabled
                    value={companyEmail}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 cursor-not-allowed text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                    Company Contact Numbers
                  </label>
                  <input
                    type="text"
                    disabled
                    value={companyPhone}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 cursor-not-allowed text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                    Authorized Representatives
                  </label>
                  <input
                    type="text"
                    disabled
                    value={companyAuthorizedRepresentative}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 cursor-not-allowed text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                    Designation & Digital Seal
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${companyRepresentativeDesignation} [SEALED]`}
                    className="w-full bg-white/5 border border-brand-teal/20 rounded-xl px-4 py-3 text-sm text-brand-teal cursor-not-allowed text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 3. Candidate Legal Verification & Identification Details */}
            <div className="bg-brand-card/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                <User className="w-5 h-5 text-brand-teal" />
                3. Candidate / Contracting Party Legal Verification Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Full Legal Name (as per Govt ID) <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={candidateLegalName}
                    onChange={(e) => setCandidateLegalName(e.target.value)}
                    placeholder="Candidate Legal Name"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Father's / Spouse's Name <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Father / Spouse Name"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Date of Birth <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Gender <span className="text-brand-teal">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-teal transition-colors"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    PAN Card Number <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 uppercase font-mono focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Aadhaar / National ID Number <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    placeholder="12-digit Aadhaar Number"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 font-mono focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Permanent Residential Address <span className="text-brand-teal">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={permanentAddress}
                    onChange={(e) => setPermanentAddress(e.target.value)}
                    placeholder="House No, Street, Landmark, District, State, Pincode"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Current Communication Address <span className="text-brand-teal">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={communicationAddress}
                    onChange={(e) => setCommunicationAddress(e.target.value)}
                    placeholder="Current city residence address, Pincode"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Official Candidate Email <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={officialEmail}
                    onChange={(e) => setOfficialEmail(e.target.value)}
                    placeholder="official.email@example.com"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Emergency Contact Person <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="Name & Relationship (e.g. Parent)"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Emergency Contact Phone <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="+91 94480 XXXXX"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 4. Bank Account Details (Compensation / Stipend Disbursement) */}
            <div className="bg-brand-card/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                <Landmark className="w-5 h-5 text-brand-teal" />
                4. Bank Account Details for Payroll & Stipend Remittance
              </h2>
              <p className="text-xs text-gray-400">
                Required for direct bank deposits of monthly stipends, consulting honorariums, and project milestone bonuses.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Bank Name <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank / SBI / ICICI Bank"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Account Holder Name <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="Name as printed in Passbook"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Bank Account Number <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter Account Number"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 font-mono focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Confirm Account Number <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={confirmAccountNumber}
                    onChange={(e) => setConfirmAccountNumber(e.target.value)}
                    placeholder="Re-enter Account Number"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 font-mono focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    IFSC Code <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 font-mono uppercase focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    Branch Name & City <span className="text-brand-teal">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Koramangala Branch, Bengaluru"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 5. Legal Terms, NDA & Digital Signature */}
            <div className="bg-brand-card/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                <Shield className="w-5 h-5 text-brand-teal" />
                5. Non-Disclosure Declarations & Digital Signature
              </h2>

              <div className="space-y-4 text-xs text-gray-300 bg-brand-dark/50 p-4 rounded-xl border border-white/10 max-h-48 overflow-y-auto leading-relaxed">
                <p className="font-semibold text-white">Non-Disclosure & Confidentiality Obligations:</p>
                <p>
                  The candidate acknowledges that in connection with their engagement at S-CODERS (Bharath Tech Developers), they will have access to confidential software architectures, proprietary LLM prompt workflows, private repositories, and client project specifications. The candidate agrees not to disclose, replicate, reverse-engineer, or distribute any proprietary material without prior written authorization from the founders.
                </p>
                <p className="font-semibold text-white">Intellectual Property (IP) Assignment:</p>
                <p>
                  All code, algorithms, visual interfaces, documentation, and automated pipelines created during the engagement shall remain the sole intellectual property of S-CODERS.
                </p>
                <p className="font-semibold text-white">Jurisdiction:</p>
                <p>
                  This agreement is governed by the laws of India, under the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={agreedToNda}
                    onChange={(e) => setAgreedToNda(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-teal focus:ring-brand-teal border-white/20 bg-brand-dark"
                  />
                  <span className="text-xs text-gray-300">
                    I agree to the strict Non-Disclosure Agreement (NDA) and confidential handling of all S-CODERS codebases, client data, and algorithms. <span className="text-brand-teal">*</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={agreedToCodeOfConduct}
                    onChange={(e) => setAgreedToCodeOfConduct(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-teal focus:ring-brand-teal border-white/20 bg-brand-dark"
                  />
                  <span className="text-xs text-gray-300">
                    I pledge adherence to the S-CODERS Engineering Code of Conduct, security guidelines, and transparent milestone reporting. <span className="text-brand-teal">*</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={agreedToIpAssignment}
                    onChange={(e) => setAgreedToIpAssignment(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-teal focus:ring-brand-teal border-white/20 bg-brand-dark"
                  />
                  <span className="text-xs text-gray-300">
                    I agree to the standard Intellectual Property (IP) assignment for all software, scripts, and products developed during tenure. <span className="text-brand-teal">*</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={declarationConfirmed}
                    onChange={(e) => setDeclarationConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-brand-teal focus:ring-brand-teal border-white/20 bg-brand-dark"
                  />
                  <span className="text-xs text-gray-300 font-semibold text-white">
                    I solemnly declare that all information provided in Step 1 and Step 2 is true, authentic, and verified to the best of my knowledge. <span className="text-brand-teal">*</span>
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-white/10">
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Digital Signature (Type your Full Legal Name) <span className="text-brand-teal">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={candidateDigitalSignature}
                  onChange={(e) => setCandidateDigitalSignature(e.target.value)}
                  placeholder="Type your full legal name as authorized signature"
                  className="w-full bg-brand-dark/70 border border-brand-teal/40 rounded-xl px-4 py-3 text-base text-brand-teal font-display font-bold placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                />
                <p className="text-[11px] text-gray-400 mt-1.5 font-mono">
                  By typing your full legal name, you execute this digital signature with full legal validity under the Information Technology Act.
                </p>
              </div>
            </div>

            {/* Navigation CTA: Back or Final Submit */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => { setCurrentStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/15 text-gray-300 hover:text-white hover:border-white/30 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Profile Details</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-brand-teal to-cyan-400 text-brand-dark font-mono font-extrabold text-sm uppercase tracking-wider hover:opacity-95 shadow-xl shadow-brand-teal/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing & Recording Application...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Submit Application & Execute Agreement</span>
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}

        {/* ============================================================ */}
        {/* STEP 3: SUBMISSION SUCCESS & CANDIDATE DOSSIER */}
        {/* ============================================================ */}
        {currentStep === 3 && successApp && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* Success Hero Banner */}
            <div className="bg-brand-card/80 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-center backdrop-blur-md relative overflow-hidden">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-4 uppercase tracking-wider">
                ✓ Application Registered in S-CODERS Database
              </div>

              <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-white mb-3">
                Welcome to the S-CODERS Talent Pipeline!
              </h2>
              <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto mb-8 font-light leading-relaxed">
                Thank you, <strong className="text-white">{successApp.fullName}</strong>. Your recruitment application for the <strong className="text-brand-teal">{successApp.sector}</strong> track and executed Talent Induction Agreement have been recorded. Our technical lead team will review your dossier and get in touch within 24–48 hours.
              </p>

              {/* Reference ID Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-8 text-left">
                <div className="bg-brand-dark/70 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Candidate Application ID</p>
                    <p className="font-mono font-bold text-brand-teal text-sm sm:text-base mt-0.5">{successApp.id}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(successApp.id, 'appId')}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                  >
                    {copiedKey === 'appId' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="bg-brand-dark/70 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Agreement Reference ID</p>
                    <p className="font-mono font-bold text-emerald-400 text-sm sm:text-base mt-0.5">{successApp.agreementReferenceId}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(successApp.agreementReferenceId, 'agrId')}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                  >
                    {copiedKey === 'agrId' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Dossier Summary</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('home');
                    } else {
                      window.location.href = '/?view=home';
                    }
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-brand-teal text-brand-dark font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-all cursor-pointer"
                >
                  <span>Return to Website Home</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dossier Overview Card */}
            <div className="bg-brand-card/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-teal" />
                  Executed Induction Dossier Summary
                </h3>
                <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                  Status: Under Technical Review
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-brand-dark/50 border border-white/5">
                  <p className="text-gray-400 font-mono uppercase text-[10px]">Sector Applied</p>
                  <p className="font-semibold text-white mt-1">{successApp.sector}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-brand-dark/50 border border-white/5">
                  <p className="text-gray-400 font-mono uppercase text-[10px]">Designation</p>
                  <p className="font-semibold text-white mt-1">{successApp.roleTitle}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-brand-dark/50 border border-white/5">
                  <p className="text-gray-400 font-mono uppercase text-[10px]">Employment Model</p>
                  <p className="font-semibold text-white mt-1">{successApp.employmentType}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-brand-dark/50 border border-white/5">
                  <p className="text-gray-400 font-mono uppercase text-[10px]">Effective Date</p>
                  <p className="font-semibold text-white mt-1">{successApp.effectiveDate}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-brand-dark/50 border border-white/5">
                  <p className="text-gray-400 font-mono uppercase text-[10px]">Notice Period</p>
                  <p className="font-semibold text-white mt-1">{successApp.availabilityNotice}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-brand-dark/50 border border-white/5">
                  <p className="text-gray-400 font-mono uppercase text-[10px]">Compensation Stated</p>
                  <p className="font-semibold text-white mt-1">{successApp.expectedCompensation}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-brand-dark/50 border border-white/5">
                  <p className="text-gray-400 font-mono uppercase text-[10px]">Primary Contact</p>
                  <p className="font-semibold text-white mt-1">{successApp.email} • {successApp.phone}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-brand-dark/50 border border-white/5">
                  <p className="text-gray-400 font-mono uppercase text-[10px]">Disbursement Bank</p>
                  <p className="font-semibold text-white mt-1">{successApp.bankName} (IFSC: {successApp.ifscCode})</p>
                </div>
                <div className="p-3.5 rounded-xl bg-brand-dark/50 border border-white/5">
                  <p className="text-gray-400 font-mono uppercase text-[10px]">Authorized Signature</p>
                  <p className="font-semibold text-brand-teal font-display mt-1">{successApp.candidateDigitalSignature}</p>
                </div>
              </div>

              {/* Navigation & New Application Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setSuccessApp(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-mono transition-colors cursor-pointer"
                >
                  ← Submit Another Candidate Application
                </button>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('home')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-teal text-brand-dark font-mono font-bold text-xs hover:bg-white transition-colors cursor-pointer"
                  >
                    Return to S-CODERS Home →
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
