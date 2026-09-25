import React, { useState, useEffect } from 'react';
import { 
  Briefcase, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, 
  Shield, FileText, Building2, User, Landmark, Sparkles, 
  Cpu, Smartphone, Globe, Palette, Cloud, Users, Award, 
  Download, Printer, Check, Copy, ExternalLink, RefreshCw,
  Layout, Terminal, Code, Video, Megaphone, PenTool, TrendingUp, Film,
  Calendar, Rocket, Link2, Share2, Lock, Key, Mail, Clock, ChevronRight,
  ShieldCheck, HelpCircle, X, Search, Trash2, Eye, QrCode, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CandidateApplication } from '../types';
import { DatabaseEngine } from '../utils/dbEngine';
import UpiQrCanvas from './UpiQrCanvas';
import { 
  getSavedCandidateApplications, 
  saveCandidateApplications, 
  addSavedCandidateApplication, 
  removeSavedCandidateApplication 
} from '../utils/dynamicData';
import CareersSection3ReferenceIds from './careers/CareersSection3ReferenceIds';
import CareersSection4DepartmentWork from './careers/CareersSection4DepartmentWork';

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
    badge: 'High Priority Hiring',
    description: 'Architect autonomous AI agents, prompt pipelines, Gemini workflows, and automated enterprise integrations using modern LLM stacks.',
    whatWeRequire: [
      'Ability to build and test functional AI workflows, agentic loops, or webhook-based automations',
      'Understanding of prompt engineering, system instructions, and structured JSON outputs',
      'Practical integration of LLM APIs (such as Google Gemini) with databases and web apps',
      'Self-driven problem solving and passion for shipping real-world AI applications'
    ],
    expectedSkills: ['Google Gemini API / SDK', 'Python or Node.js', 'n8n / Make Automation', 'Vector DBs (Pinecone / Chroma)', 'LangChain / LlamaIndex', 'REST APIs & Webhooks'],
    deliverables: ['Production AI agent workflows', 'Autonomous customer support & lead bots', 'Document intelligence pipelines', 'Client AI prototypes'],
    isNonTechnical: false
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
    badge: 'Immediate Opening',
    description: 'Develop modular, responsive, high-performance web user interfaces with modern React architectures, fluid micro-interactions, and mobile-first responsiveness.',
    whatWeRequire: [
      'Strong proficiency in React functional components, custom hooks, and state management',
      'Pixel-perfect translation of UI/UX designs into accessible, responsive web code',
      'Expertise with Tailwind CSS utility classes, flexible layouts, and modern typography math',
      'Cross-browser and mobile viewport optimization with high rendering performance'
    ],
    expectedSkills: ['React 19 / 18', 'TypeScript', 'Next.js / Vite', 'Tailwind CSS', 'Motion (Framer Motion)', 'Git & GitHub', 'Responsive Design'],
    deliverables: ['Interactive client portals & dashboards', 'High-converting web landing pages', 'Design system component libraries', 'Mobile-responsive web applications'],
    isNonTechnical: false
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
    badge: 'Core Platform',
    description: 'Design scalable server-side architectures, REST/gRPC endpoints, secure database models, and cloud services for enterprise platforms.',
    whatWeRequire: [
      'Solid fundamentals in relational (PostgreSQL) and key-value database design and querying',
      'API security, JWT authentication, rate limiting, and robust input validation',
      'Efficient query handling, indexing, and caching mechanisms with Redis',
      'Clean error handling, asynchronous event logging, and microservice communication'
    ],
    expectedSkills: ['Node.js / Express', 'Python (FastAPI / Django)', 'PostgreSQL / MySQL', 'Redis Caching', 'REST & gRPC APIs', 'Docker Basics'],
    deliverables: ['Secure microservices & APIs', 'Database schemas & migration scripts', 'Webhook event handlers', 'Enterprise authentication systems'],
    isNonTechnical: false
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
    badge: 'Active Hiring',
    description: 'Own end-to-end web software lifecycle from responsive frontend UI down to backend databases, server routes, and cloud deployment.',
    whatWeRequire: [
      'Ability to independently build and connect frontend interfaces to backend databases',
      'Full lifecycle understanding: authentication, routing, CRUD operations, and cloud hosting',
      'Clean, structured TypeScript/JavaScript codebase maintenance and Git workflow',
      'Strong debugging skills across client and server execution environments'
    ],
    expectedSkills: ['React / Next.js', 'Node.js / Express', 'TypeScript', 'PostgreSQL or MongoDB', 'Tailwind CSS', 'REST APIs', 'Git & GitHub'],
    deliverables: ['Full-stack web applications & portals', 'Client SaaS platforms', 'Internal management tools', 'Interactive data dashboards'],
    isNonTechnical: false
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
    badge: 'Active Hiring',
    description: 'Build engaging, fast, native and cross-platform mobile applications for iOS and Android with smooth gestures and offline reliability.',
    whatWeRequire: [
      'Hands-on experience developing cross-platform mobile screens and components',
      'Understanding of mobile navigation, touch gestures, and responsive layouts',
      'Integration with native device hardware (camera, GPS, push notifications, storage)',
      'Offline data caching and responsive API state synchronization'
    ],
    expectedSkills: ['React Native / Expo', 'Flutter & Dart', 'Kotlin / Android Basics', 'Mobile UI Patterns', 'REST API integration', 'Mobile Testing'],
    deliverables: ['Cross-platform mobile apps', 'App Store & Play Store ready builds', 'Offline-first mobile utilities', 'Native device feature integrations'],
    isNonTechnical: false
  },
  {
    id: 'video_editing',
    name: 'Video Editing & Content Creation',
    role: 'Video Editor & Content Creator',
    roles: [
      'Content Creator & Video Presenter',
      'Video Editor & Motion Designer',
      'Shorts & Reels Video Creator',
      'Lead Video Editor & Reel Creator',
      'Motion Graphics & VFX Artist',
      'YouTube & Long-Form Video Editor',
      'Podcast & Audio-Visual Production Specialist',
      'Thumbnail & Visual Asset Designer'
    ],
    icon: Video,
    skills: 'Premiere Pro, After Effects, DaVinci Resolve, CapCut, Photoshop (Optional)',
    badge: 'Media & Creator Track',
    description: 'Produce high-retention video content, viral Instagram Reels/YouTube Shorts, motion graphics, visual effects, and storytelling assets.',
    whatWeRequire: [
      'Strong visual storytelling with retention-focused, fast-paced editing',
      'Creative hook crafting in the first 3 seconds of video playback to maximize retention',
      'Pristine audio syncing, sound effects (SFX), and mood-matching background scores',
      'Consistent output, quick turnaround, and receptiveness to creative iteration'
    ],
    expectedSkills: ['Adobe Premiere Pro', 'CapCut', 'DaVinci Resolve', 'After Effects (Basics)', 'Photoshop (Thumbnails)', 'Sound Design & SFX', 'Storyboarding'],
    deliverables: ['Viral Instagram Reels & YouTube Shorts', 'Long-form tutorials & company showcases', 'High-CTR YouTube thumbnails', 'Client promotional videos'],
    isNonTechnical: true
  },
  {
    id: 'content_writing',
    name: 'Content Writing & Creation',
    role: 'Content Creator & Writer',
    roles: [
      'Content Creator & Creative Writer',
      'Content Writer & Copywriter',
      'Social Media Copywriter & Ghostwriter',
      'Video Scriptwriter (Tech, Reels & AI Content)',
      'Technical Content Writer & Tech Blogger',
      'Developer Documentation & Guide Specialist',
      'Creative & Ad Copywriter'
    ],
    icon: PenTool,
    skills: 'Creative Writing, SEO Writing, Storytelling, Scriptwriting, Copywriting (Optional)',
    badge: 'Content & Creator Track',
    description: 'Author captivating articles, social media hooks, video scripts, technical documentation, and persuasive marketing copy.',
    whatWeRequire: [
      'Flawless grammar, tone consistency, and engaging storytelling ability',
      'Capability to break down technical or business concepts into simple, gripping narratives',
      'Writing high-retention scripts for YouTube videos and short-form reels',
      'Prompt turnaround and thorough research on tech and AI trends'
    ],
    expectedSkills: ['Video Scriptwriting (Shorts/YouTube)', 'SEO Content Writing', 'LinkedIn / X Social Copywriting', 'Technical Blogging', 'Storytelling & Brand Voice'],
    deliverables: ['Weekly video scripts for creators', 'Viral LinkedIn & Twitter threads', 'In-depth tech articles', 'Website landing page copy'],
    isNonTechnical: true
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
    badge: 'Growth Track',
    description: 'Spearhead growth marketing, paid acquisition funnels (Meta/Google), organic SEO, and viral social media campaigns.',
    whatWeRequire: [
      'Data-driven experimentation mindset with focus on CAC, ROAS, and conversions',
      'Campaign setup, ad copywriting, and creative direction for high-CTR ads',
      'Audience targeting, retargeting funnels, and performance monitoring',
      'Proactive social community engagement and growth hacking strategies'
    ],
    expectedSkills: ['Meta Ads Manager', 'Google Ads', 'SEO & Keyword Research', 'Google Analytics', 'Social Media Strategy', 'Canva / Ad Creatives'],
    deliverables: ['Profitable paid ad campaigns', 'Organic social growth strategies', 'Weekly performance dashboards', 'Lead generation funnels'],
    isNonTechnical: true
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
    badge: 'Strategy Track',
    description: 'Drive business development, client acquisition, strategic B2B partnerships, investor decks, and operational expansion.',
    whatWeRequire: [
      'Exceptional written and verbal communication and negotiation skills',
      'Proactive outreach to clients, institutions, and industry partners',
      'Ability to structure compelling pitch decks, proposals, and ROI models',
      'Resilience, ownership mindset, and enthusiasm for startup operations'
    ],
    expectedSkills: ['Business Development & Sales', 'Cold Outreach & Follow-ups', 'Pitch Deck Creation', 'Client Relationship Management (CRM)', 'Market Research & Strategy'],
    deliverables: ['Signed client and college partnerships', 'Custom B2B proposals', 'Investor presentations', 'Operational growth playbooks'],
    isNonTechnical: true
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
    badge: 'Events Track',
    description: 'Plan, orchestrate, and host high-energy hackathons, technical bootcamps, developer workshops, and campus meetups.',
    whatWeRequire: [
      'Uncompromising organizational skills and end-to-end event timeline control',
      'Calm problem-solving and rapid adaptability during live event operations',
      'Public speaking, attendee coordination, and vendor negotiation',
      'Coordination with sponsors, colleges, judges, and student teams'
    ],
    expectedSkills: ['Event Logistics & Planning', 'Campus Ambassador Leadership', 'Hospitality & Venue Ops', 'Public Speaking & Hosting', 'Sponsor Management'],
    deliverables: ['Seamless hackathons and bootcamps', 'Active campus ambassador networks', 'Post-event recap reports', 'Sponsorship deliverables'],
    isNonTechnical: true
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
    badge: 'Design Track',
    description: 'Design beautiful, intuitive digital experiences, design systems, wireframes, and clickable interactive prototypes in Figma.',
    whatWeRequire: [
      'Strong portfolio demonstrating user-centric design principles and clean aesthetics',
      'Deep knowledge of Figma (Auto-layout, Components, Variants, Design Tokens)',
      'Understanding of user psychology, mobile-first UX, and accessibility heuristics',
      'Close collaboration with developers to ensure seamless UI handoff'
    ],
    expectedSkills: ['Figma Mastery', 'Design Systems & Tokens', 'Wireframing & User Flows', 'Interactive Prototyping', 'Typography & Color Theory', 'Micro-interactions'],
    deliverables: ['Production Figma UI kits', 'Interactive clickable prototypes', 'Mobile & Web screen flows', 'Design system documentation'],
    isNonTechnical: true
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
    badge: 'Infrastructure',
    description: 'Automate deployment pipelines, oversee cloud infrastructure, manage container clusters, and maintain maximum uptime.',
    whatWeRequire: [
      'Strong understanding of Linux command-line, containerization, and networking',
      'Experience setting up automated CI/CD build and deploy workflows',
      'Cloud resource provisioning and environment security best practices',
      'Proactive server monitoring, log aggregation, and issue diagnosis'
    ],
    expectedSkills: ['Docker & Containerization', 'GCP / Cloud Run / AWS', 'GitHub Actions CI/CD', 'Nginx & Reverse Proxies', 'Linux Shell Scripting', 'PostgreSQL Maintenance'],
    deliverables: ['Automated zero-downtime CI/CD pipelines', 'Production Docker configurations', 'Server health monitoring dashboards', 'Secure cloud architectures'],
    isNonTechnical: false
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
    badge: 'Quality Track',
    description: 'Ensure flawless software quality through automated regression suites, end-to-end UI tests, API tests, and edge-case validation.',
    whatWeRequire: [
      'Eagle-eyed attention to edge cases, broken user flows, and visual anomalies',
      'Writing robust automated test scripts for web and API layers',
      'Clear, reproducible bug reports with steps, logs, and screenshots',
      'Collaborative communication with engineers to resolve bugs swiftly'
    ],
    expectedSkills: ['Playwright / Cypress', 'Jest / Vitest', 'Postman API Testing', 'Manual Exploratory Testing', 'Bug Reporting & JIRA/Linear', 'Security & Load Testing Basics'],
    deliverables: ['Automated end-to-end test suites', 'Comprehensive QA test matrices', 'Release verification sign-offs', 'Bug reproduction reports'],
    isNonTechnical: false
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
    badge: 'Growth Track',
    description: 'Empower aspiring tech talent through interactive coding workshops, developer mentorship, and engaging community spaces.',
    whatWeRequire: [
      'Enthusiasm for explaining technical concepts in an approachable, engaging manner',
      'Ability to build hands-on, interactive coding exercises for students',
      'Active community moderation and mentoring across Discord, Telegram, and WhatsApp',
      'Empathetic, encouraging attitude toward junior learners and peers'
    ],
    expectedSkills: ['Technical Training & Mentorship', 'Public Speaking & Demos', 'Community Management', 'Hands-on Workshop Curriculum Design', 'Student Engagement'],
    deliverables: ['Live coding workshop sessions', 'Curriculum slide decks and sample code', 'Thriving developer community groups', 'Student project reviews'],
    isNonTechnical: true
  }
];

const ALL_PREDEFINED_ROLES = Array.from(
  new Set(SECTORS.flatMap(s => s.roles || [s.role]))
);

export default function Careers({ onNavigate }: CareersProps) {
  const [currentStep, setCurrentStep] = useState<1 | 'submitted_stage1' | 2 | 3 | 4>(1);
  const [section3TargetFirstId, setSection3TargetFirstId] = useState<string>('');
  const [section4TargetSecondId, setSection4TargetSecondId] = useState<string>('');
  const [activeCandidateForSection4, setActiveCandidateForSection4] = useState<CandidateApplication | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successApp, setSuccessApp] = useState<CandidateApplication | null>(null);
  const [submittedStage1App, setSubmittedStage1App] = useState<CandidateApplication | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Key verification state ("ENTER YOUR KEY / PASTE UNIQUE LINK") - Matches Event Section Format
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [manualAccessInput, setManualAccessInput] = useState('');
  const [keyLookupNotice, setKeyLookupNotice] = useState<{ type: 'SUCCESS' | 'ERROR'; message: string } | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Onboarding security gatekeeper & authorization state
  const [onboardingAuthorized, setOnboardingAuthorized] = useState(false);
  const [authorizedAppId, setAuthorizedAppId] = useState('');
  const [authorizedToken, setAuthorizedToken] = useState('');
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [tokenInputId, setTokenInputId] = useState('');
  const [tokenInputKey, setTokenInputKey] = useState('');
  const [tokenVerifyError, setTokenVerifyError] = useState<string | null>(null);
  const [accessVerifiedBanner, setAccessVerifiedBanner] = useState<string | null>(null);
  const [showTokenUnlockDialog, setShowTokenUnlockDialog] = useState(false);

  // Saved application forms collection (identical to Event Tickets structure)
  const [savedApplications, setSavedApplications] = useState<CandidateApplication[]>(() => {
    return getSavedCandidateApplications();
  });
  const [activeCareersTab, setActiveCareersTab] = useState<'form' | 'saved_forms'>('form');
  const [viewingSavedApp, setViewingSavedApp] = useState<CandidateApplication | null>(null);
  const [appToDelete, setAppToDelete] = useState<CandidateApplication | null>(null);
  const [showDeleteAppModal, setShowDeleteAppModal] = useState(false);
  const [savedActionNotice, setSavedActionNotice] = useState<string | null>(null);

  // Check admin authorization (My Application Forms is restricted to admins only)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('scoders_admin_auth') === 'true';
  });

  useEffect(() => {
    const checkAdmin = () => {
      setIsAdmin(localStorage.getItem('scoders_admin_auth') === 'true');
    };
    window.addEventListener('storage', checkAdmin);
    window.addEventListener('scoders_admin_change', checkAdmin);
    return () => {
      window.removeEventListener('storage', checkAdmin);
      window.removeEventListener('scoders_admin_change', checkAdmin);
    };
  }, []);

  // Sync saved applications across browser tabs & db changes
  useEffect(() => {
    const handleSavedSync = () => {
      setSavedApplications(getSavedCandidateApplications());
    };
    window.addEventListener('scoders_saved_applications_change', handleSavedSync);
    window.addEventListener('scoders_db_change', handleSavedSync);
    return () => {
      window.removeEventListener('scoders_saved_applications_change', handleSavedSync);
      window.removeEventListener('scoders_db_change', handleSavedSync);
    };
  }, []);

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

  // Listen for onboarding or direct dossier access params: ?stage=onboarding&appId=...&token=... or ?appId=... or ?key=...
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const stage = params.get('stage');
      const appId = params.get('appId');
      const token = params.get('token');
      const key = params.get('key');
      const secRef = params.get('secRef') || params.get('secondRef') || params.get('secondRefId');

      if (stage === 'department' || stage === 'section4' || stage === 'whatsapp') {
        if (secRef || key || appId) {
          setSection4TargetSecondId(secRef || key || appId || '');
        }
        setCurrentStep(4);
      } else if (stage === 'section3' || stage === 'reference') {
        if (appId) setSection3TargetFirstId(appId);
        if (secRef || key) setSection4TargetSecondId(secRef || key || '');
        setCurrentStep(3);
      } else if (stage === 'onboarding' && appId && token) {
        verifyOnboardingToken(appId, token);
      } else if (appId || key) {
        handleLookupApplication(appId || key || '');
      }
    } catch (e) {
      console.error('URL params onboarding check failed:', e);
    }
  }, []);

  const handleLookupApplication = async (inputStr?: string) => {
    const rawInput = (inputStr || manualAccessInput).trim();
    if (!rawInput) return;

    setIsLookingUp(true);
    setKeyLookupNotice(null);

    try {
      // 1. Check if user pasted a full URL
      let query = rawInput;
      if (rawInput.includes('http://') || rawInput.includes('https://') || rawInput.includes('/careers') || rawInput.includes('?')) {
        try {
          const urlObj = new URL(rawInput.startsWith('http') ? rawInput : `https://${rawInput.replace(/^\/+/, '')}`);
          const urlStage = urlObj.searchParams.get('stage');
          const urlAppId = urlObj.searchParams.get('appId');
          const urlToken = urlObj.searchParams.get('token');
          const urlKey = urlObj.searchParams.get('key');

          if (urlStage === 'onboarding' && urlAppId && urlToken) {
            await verifyOnboardingToken(urlAppId, urlToken);
            setShowKeyModal(false);
            setManualAccessInput('');
            setIsLookingUp(false);
            return;
          }

          query = urlAppId || urlKey || query;
        } catch (e) {
          // Fallback regex if URL parse fails
          const matchAppId = rawInput.match(/[?&](?:appId|id|key)=([^&#]+)/i);
          if (matchAppId) query = decodeURIComponent(matchAppId[1]);
        }
      }

      // 2. Search local database first
      const cleanQ = query.trim().toUpperCase();
      const localApps = DatabaseEngine.getCandidateApplications();
      let found = localApps.find(a => 
        (a.id && a.id.toUpperCase() === cleanQ) ||
        (a.agreementReferenceId && a.agreementReferenceId.toUpperCase() === cleanQ) ||
        (a.onboardingToken && a.onboardingToken.toUpperCase() === cleanQ) ||
        (a.email && a.email.toUpperCase() === cleanQ)
      );

      // 3. If not found locally, query backend server
      if (!found) {
        try {
          const res = await fetch(`/api/careers/lookup?query=${encodeURIComponent(query.trim())}`);
          const data = await res.json();
          if (res.ok && data.success && data.application) {
            found = data.application;
            DatabaseEngine.addCandidateApplication(found);
          }
        } catch (e) {
          console.error('Remote lookup failed:', e);
        }
      }

      if (found) {
        // Automatically save to candidate's saved applications collection (just like event tickets)
        const updatedSaved = addSavedCandidateApplication(found);
        setSavedApplications(updatedSaved);
        setSavedActionNotice(`✓ Application Form #${found.id} for ${found.fullName} has been saved to your "My Application Forms" collection!`);
        setTimeout(() => setSavedActionNotice(null), 6000);

        setShowKeyModal(false);
        setManualAccessInput('');

        // If candidate already finished stage 2 / onboarding
        if (found.status === 'Onboarding Completed' || found.status === 'Hired' || found.bankName || found.candidateDigitalSignature) {
          setSuccessApp(found);
          setCurrentStep(3);
          setActiveCareersTab('saved_forms');
          setKeyLookupNotice({
            type: 'SUCCESS',
            message: `✓ Verified Application & Executed Dossier [${found.id}] for ${found.fullName} unlocked & saved!`
          });
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        // If candidate was authorized for stage 2 onboarding
        if (found.onboardingAuthorized || found.onboardingToken || found.status === 'Approved for Onboarding') {
          if (found.onboardingToken) {
            await verifyOnboardingToken(found.id, found.onboardingToken);
          } else {
            setOnboardingAuthorized(true);
            setAuthorizedAppId(found.id);
            setCurrentStep(2);
          }
          setActiveCareersTab('form');
          setKeyLookupNotice({
            type: 'SUCCESS',
            message: `✓ Onboarding verified for ${found.fullName}. Saved to your dossier. Proceed with Stage 2 Induction & Banking details.`
          });
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        // If candidate application is under review (Stage 1 submitted)
        setSubmittedStage1App(found);
        setCurrentStep('submitted_stage1');
        setActiveCareersTab('saved_forms');
        setKeyLookupNotice({
          type: 'SUCCESS',
          message: `✓ Application [${found.id}] for ${found.fullName} saved to your dossier. Status: ${found.status}.`
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setKeyLookupNotice({
          type: 'ERROR',
          message: 'No candidate record found matching the provided Pass Key or Link. Please verify your reference ID (e.g. SCD-APP-2026-XXXX).'
        });
      }
    } catch (err: any) {
      console.error('Access key lookup failed:', err);
      setKeyLookupNotice({
        type: 'ERROR',
        message: 'Error verifying pass key. Please check your network connection or enter your ID again.'
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const verifyOnboardingToken = async (appId: string, token: string) => {
    setIsVerifyingToken(true);
    setTokenVerifyError(null);

    const cleanAppId = appId.trim();
    const cleanToken = token.trim();

    // Friendly detection if candidate entered Application ID in the second (token) box
    if (cleanToken.toUpperCase().startsWith('SCD-APP-') || cleanAppId.toUpperCase() === cleanToken.toUpperCase()) {
      setIsVerifyingToken(false);
      setTokenVerifyError(
        `💡 Notice: "${cleanToken}" is your Application Reference ID, which belongs in the FIRST BOX above. The second box is for your Authorization Security Token, which is emailed to you from scoders82@gmail.com only after clearing your technical interview.`
      );
      return;
    }

    try {
      const res = await fetch(`/api/careers/verify-onboarding?appId=${encodeURIComponent(cleanAppId)}&token=${encodeURIComponent(cleanToken)}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.valid && data.candidate) {
        const c: CandidateApplication = data.candidate;
        setOnboardingAuthorized(true);
        setAuthorizedAppId(c.id || cleanAppId);
        setAuthorizedToken(cleanToken);

        // Automatically save to candidate's saved applications collection
        const updatedSaved = addSavedCandidateApplication(c);
        setSavedApplications(updatedSaved);

        // Pre-fill fields from the verified candidate application
        if (c.fullName) {
          setFullName(c.fullName);
          setCandidateLegalName(c.fullName);
          setAccountHolderName(c.fullName);
        }
        if (c.email) {
          setEmail(c.email);
          setOfficialEmail(c.email);
        }
        if (c.phone) setPhone(c.phone);
        if (c.whatsapp) setWhatsapp(c.whatsapp);
        if (c.currentCity) {
          setCurrentCity(c.currentCity);
          setCommunicationAddress(c.currentCity);
        }
        if (c.sector) setSelectedSector(c.sector);
        if (c.roleTitle) setRoleTitle(c.roleTitle);
        if (c.expectedCompensation) setExpectedCompensation(c.expectedCompensation);
        if (c.availabilityNotice) setAvailabilityNotice(c.availabilityNotice);

        setAccessVerifiedBanner(`✓ Verification Successful! Welcome, ${c.fullName}. Your interview clearance has been validated by S-CODERS Admin.`);
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setOnboardingAuthorized(false);
        // Look up candidate locally or in server to see if their application exists and give real-time status
        const localApps = DatabaseEngine.getCandidateApplications();
        const found = localApps.find(a => a.id?.toUpperCase() === cleanAppId.toUpperCase());
        if (found) {
          setTokenVerifyError(
            `Application ${found.id} for ${found.fullName} is currently in '${found.status}' status. Stage 2 (Legal NDA & Banking) unlocks only after clearing your technical interview. S-CODERS HR will email your security token to ${found.email || 'your registered address'}.`
          );
        } else {
          setTokenVerifyError(data.error || 'Invalid or expired onboarding authorization credentials. Please verify your Application ID and Token.');
        }
      }
    } catch (err: any) {
      setOnboardingAuthorized(false);
      setTokenVerifyError('Unable to connect to S-CODERS verification server. Please verify your connection.');
    } finally {
      setIsVerifyingToken(false);
    }
  };

  const confirmDeleteApplication = () => {
    if (!appToDelete) return;
    const updated = removeSavedCandidateApplication(appToDelete.id);
    setSavedApplications(updated);
    setSavedActionNotice(`Application Form #${appToDelete.id} was removed from your saved forms.`);
    setTimeout(() => setSavedActionNotice(null), 4000);
    setShowDeleteAppModal(false);
    setAppToDelete(null);
  };

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

  // Generate an initial unique Agreement / Second Reference ID
  const [agreementRefId] = useState<string>(() => {
    return `SCD-JOIN-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
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
  const [expectedCompensation, setExpectedCompensation] = useState('₹15,000 / Month (Fixed)');
  const [salaryOption, setSalaryOption] = useState<'preset' | 'custom'>('preset');
  const [customSalaryInput, setCustomSalaryInput] = useState('15000');
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
  const [companyLegalName] = useState('S-CODERS (Bharat Tech Developers)');
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
  const [upiId, setUpiId] = useState('');

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
    setTimeout(() => {
      const el = document.getElementById('track-requirements-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 60);
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
    if (!highestQualification.trim()) {
      setErrorBanner('Please enter your Highest Qualification (e.g. B.Tech, BCA, MCA, Degree, Diploma).');
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
    // Key Technical Skills & Tools is OPTIONAL for creative/content/video/writing roles
    if (!previousProjects.trim()) {
      setErrorBanner('Please describe your previous projects, work samples, or creative/technical experience.');
      return false;
    }
    if (!expectedCompensation.trim()) {
      setErrorBanner('Please select your Fixed Monthly Salary.');
      return false;
    }
    const numericSalary = parseInt(expectedCompensation.replace(/\D/g, ''), 10);
    if (numericSalary && numericSalary > 20000) {
      setErrorBanner('Fixed monthly salary must be under or equal to ₹20,000 / Month for this hiring cohort.');
      return false;
    }
    if (!whyJoinScoders.trim()) {
      setErrorBanner('Please share why you want to join S-CODERS (Bharat Tech Developers).');
      return false;
    }
    // impressiveAchievement is OPTIONAL (especially for content creators, writers, video editors)
    if (!resumeLink.trim()) {
      setErrorBanner('Please provide a link to your Resume / CV (Google Drive / GitHub / Hosted link).');
      return false;
    }

    return true;
  };

  const handleProceedToStep2 = async () => {
    if (!validateStep1()) return;

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
      adminNotes: 'Application Form 1 submitted via Careers Recruitment Portal. Profile placed in shortlisting queue.',
      reviewedBy: 'Under Initial Screening'
    };

    try {
      // 1. Save directly to DatabaseEngine local collection
      DatabaseEngine.addCandidateApplication(applicationPayload);
      const updatedSaved = addSavedCandidateApplication(applicationPayload);
      setSavedApplications(updatedSaved);

      // 2. Post to server-side API endpoint for persistent storage & confirmation email dispatch from scoders82@gmail.com
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

      // Pre-populate candidate legal name and official email for next stage
      if (!candidateLegalName) setCandidateLegalName(fullName);
      if (!officialEmail) setOfficialEmail(email);
      if (!accountHolderName) setAccountHolderName(fullName);
      if (!communicationAddress && currentCity) setCommunicationAddress(currentCity);

      // Save submitted stage 1 application state
      setSubmittedStage1App(applicationPayload);
      setAuthorizedAppId(submissionId);

      // Advance to the dedicated Stage 1 Submission Confirmation Screen
      setCurrentStep('submitted_stage1');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Stage 1 submission error:', err);
      // Even if network fails, DatabaseEngine has safely preserved it locally
      setSubmittedStage1App(applicationPayload);
      setAuthorizedAppId(submissionId);
      setCurrentStep('submitted_stage1');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
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
  // FINAL SUBMISSION HANDLER: STEP 2 (ONBOARDING)
  // ==========================================
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsSubmitting(true);
    setErrorBanner(null);

    const targetAppId = authorizedAppId || successApp?.id || submittedStage1App?.id || `SCD-APP-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const onboardingPayload = {
      appId: targetAppId,
      token: authorizedToken,
      onboardingData: {
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
        upiId: upiId.trim(),
        candidateDigitalSignature,
        agreedToNda,
        agreedToCodeOfConduct,
        agreedToIpAssignment,
        declarationConfirmed
      }
    };

    try {
      // 1. Post to server-side onboarding endpoint
      const res = await fetch('/api/careers/submit-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingPayload)
      });

      let updatedRecord: CandidateApplication;

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        updatedRecord = data.candidate;
      } else {
        // Fallback local update
        updatedRecord = {
          ...(submittedStage1App || {}),
          id: targetAppId,
          submissionDate: todayDate,
          status: 'Onboarding Completed',
          sector: selectedSector,
          roleTitle,
          employmentType,
          fullName: candidateLegalName || fullName,
          email: officialEmail || email,
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
          ...onboardingPayload.onboardingData
        } as CandidateApplication;
      }

      DatabaseEngine.addCandidateApplication(updatedRecord);
      DatabaseEngine.syncApplicationsFromServer().catch(() => {});
      const updatedSaved = addSavedCandidateApplication(updatedRecord);
      setSavedApplications(updatedSaved);

      setSuccessApp(updatedRecord);
      setSection4TargetSecondId(updatedRecord.agreementReferenceId || updatedRecord.id);
      setActiveCandidateForSection4(updatedRecord);
      setSection3TargetFirstId(updatedRecord.id);
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Onboarding submission error:', err);
      const fallbackRecord = {
        ...(submittedStage1App || {}),
        id: targetAppId,
        submissionDate: todayDate,
        status: 'Onboarding Completed',
        sector: selectedSector,
        roleTitle,
        employmentType,
        fullName: candidateLegalName || fullName,
        email: officialEmail || email,
        phone,
        whatsapp,
        currentCity,
        ...onboardingPayload.onboardingData
      } as CandidateApplication;

      DatabaseEngine.addCandidateApplication(fallbackRecord);
      const updatedSavedFallback = addSavedCandidateApplication(fallbackRecord);
      setSavedApplications(updatedSavedFallback);
      setSuccessApp(fallbackRecord);
      setSection4TargetSecondId(fallbackRecord.agreementReferenceId || fallbackRecord.id);
      setActiveCandidateForSection4(fallbackRecord);
      setSection3TargetFirstId(fallbackRecord.id);
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

        {/* Navigation Tabs Bar (Matching Event Section: Form vs My Application Forms) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-black/60 border border-white/10 p-3 rounded-2xl backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => {
                setActiveCareersTab('form');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`relative px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap z-10 flex items-center gap-2 ${
                activeCareersTab === 'form'
                  ? 'text-brand-dark bg-brand-teal shadow-md shadow-brand-teal/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Apply for Roles</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('admin');
                  } else {
                    setActiveCareersTab('saved_forms');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="relative px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap z-10 flex items-center gap-2 text-brand-teal bg-brand-teal/10 hover:bg-brand-teal hover:text-brand-dark border border-brand-teal/30 shadow-md"
                title="Application Forms tab is restricted to Admins only and placed under Admin Page"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>My Application Forms (Admin Page)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setShowKeyModal(true);
                setKeyLookupNotice(null);
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-brand-teal/20 hover:bg-brand-teal text-brand-teal hover:text-brand-dark border border-brand-teal/40 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
            >
              <Lock className="w-4 h-4" />
              <span>🔑 Paste Unique Link / Enter Key</span>
            </button>
          </div>
        </div>

        {savedActionNotice && (
          <div className="mb-6 p-4 rounded-2xl font-mono text-xs flex items-center justify-between gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{savedActionNotice}</span>
            </div>
            <button onClick={() => setSavedActionNotice(null)} className="text-gray-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {keyLookupNotice && (
          <div className={`mb-6 p-4 rounded-2xl font-mono text-xs flex items-center justify-between gap-3 border ${
            keyLookupNotice.type === 'SUCCESS'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {keyLookupNotice.type === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{keyLookupNotice.message}</span>
            </div>
            <button onClick={() => setKeyLookupNotice(null)} className="text-gray-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 1: SAVED APPLICATION FORMS (ACCESSIBLE BY ADMINS ONLY UNDER ADMIN PAGE) */}
        {/* ============================================================ */}
        {activeCareersTab === 'saved_forms' && (
          !isAdmin ? (
            <div className="text-center py-16 bg-brand-card/50 border border-brand-teal/20 rounded-3xl p-8 space-y-4 max-w-xl mx-auto my-8 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-brand-teal/10 border border-brand-teal/30 flex items-center justify-center text-brand-teal mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-display font-extrabold text-white">Admin Access Restricted</h3>
              <p className="text-gray-300 text-xs sm:text-sm font-sans leading-relaxed">
                The "My Application Forms" collection and candidate dossiers are restricted exclusively to authorized administrators under the Admin Page.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate?.('admin')}
                  className="px-6 py-3 bg-brand-teal hover:bg-white text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-teal/20 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Admin Page Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCareersTab('form')}
                  className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Back to Open Roles
                </button>
              </div>
            </div>
          ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-display font-extrabold text-white flex items-center gap-2.5">
                  <FileText className="w-6 h-6 text-brand-teal" />
                  <span>My Saved Application Forms</span>
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm font-sans mt-1">
                  Your submitted candidate dossiers, induction records, and unique access keys saved on this device.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(true)}
                  className="px-4 py-2.5 bg-brand-teal/20 hover:bg-brand-teal text-brand-teal hover:text-brand-dark border border-brand-teal/40 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Key className="w-4 h-4" />
                  <span>+ Paste Link to Add Form</span>
                </button>
              </div>
            </div>

            {savedApplications.length === 0 ? (
              <div className="text-center py-16 bg-brand-card/50 border border-white/10 rounded-3xl p-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-display font-bold text-white">No Application Forms Saved Yet</h3>
                <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                  When you submit an application or paste your unique application link, it is saved here as a separate verifiable application form dossier — just like event tickets in the event section.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setShowKeyModal(true)}
                    className="px-5 py-2.5 bg-brand-teal text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all cursor-pointer shadow-lg shadow-brand-teal/20 flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    <span>Paste Unique Link or Pass Key</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveCareersTab('form');
                      setCurrentStep(1);
                    }}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Apply for Open Positions
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {savedApplications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-brand-card/90 border border-brand-teal/30 hover:border-brand-teal/60 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-2xl flex flex-col justify-between space-y-6 transition-all"
                  >
                    {/* Ambient accent */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-brand-teal/5 rounded-full blur-2xl pointer-events-none" />

                    <div className="space-y-4 relative z-10">
                      {/* Card Header: Status + Date + Delete */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-3 gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          (app.status as any) === 'Onboarding Completed' || (app.status as any) === 'Hired'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : (app.status as any) === 'Approved for Onboarding'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : app.status === 'Shortlisted' || (app.status as any) === 'Shortlisted for Interview'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{app.status || 'Submitted'}</span>
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-gray-400">{app.submissionDate || 'Recent'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setAppToDelete(app);
                              setShowDeleteAppModal(true);
                            }}
                            title="Remove from saved forms"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Sector & Role Title */}
                      <div>
                        <span className="text-[10px] font-mono uppercase text-brand-teal font-bold tracking-wider block mb-1">
                          {app.sector}
                        </span>
                        <h3 className="text-xl font-display font-extrabold text-white tracking-tight">
                          {app.roleTitle || 'Candidate Application'}
                        </h3>
                      </div>

                      {/* Candidate Snapshot Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-black/40 p-3.5 rounded-xl border border-white/5">
                        <div>
                          <span className="text-gray-500 text-[10px] block uppercase">Applicant Name</span>
                          <span className="text-white font-bold truncate block">{app.fullName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] block uppercase">Contact Email</span>
                          <span className="text-gray-300 truncate block">{app.email}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] block uppercase">Phone / WhatsApp</span>
                          <span className="text-gray-300">{app.whatsapp || app.phone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] block uppercase">Expected Salary</span>
                          <span className="text-brand-teal font-bold">{app.expectedCompensation || '< ₹20,000 / Month'}</span>
                        </div>
                      </div>

                      {/* Pass Key & Scannable QR code */}
                      <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="space-y-1.5 text-xs font-mono flex-1 min-w-0">
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Application Reference ID:</div>
                          <div className="flex items-center gap-2">
                            <code className="text-brand-teal font-bold text-xs bg-black/60 px-2.5 py-1 rounded border border-brand-teal/30 truncate">
                              {app.id}
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(app.id);
                                setCopiedKey(app.id);
                                setTimeout(() => setCopiedKey(null), 2000);
                              }}
                              className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all shrink-0"
                              title="Copy ID"
                            >
                              {copiedKey === app.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          {app.onboardingToken && (
                            <div className="text-[10px] text-amber-300 pt-0.5">
                              Security Token: <code className="text-white bg-black/40 px-1 rounded">{app.onboardingToken}</code>
                            </div>
                          )}
                        </div>

                        {/* Verified Scannable QR Code Canvas */}
                        <div className="bg-white p-2 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-md text-black">
                          <UpiQrCanvas upiString={`${window.location.origin}/careers?appId=${app.id}`} size={64} />
                          <span className="text-[7px] font-mono text-gray-700 font-bold mt-0.5 uppercase tracking-tighter">
                            Scan Dossier
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="space-y-2 pt-2 border-t border-white/10 relative z-10">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingSavedApp(app)}
                          className="py-2.5 px-3 rounded-xl bg-brand-teal text-brand-dark font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Form</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (app.status === 'Onboarding Completed' || app.status === 'Hired' || app.bankName) {
                              setSuccessApp(app);
                              setCurrentStep(3);
                            } else if (app.onboardingAuthorized || app.onboardingToken) {
                              setAuthorizedAppId(app.id);
                              setOnboardingAuthorized(true);
                              setCurrentStep(2);
                            } else {
                              setSubmittedStage1App(app);
                              setAuthorizedAppId(app.id);
                              setCurrentStep('submitted_stage1');
                            }
                            setActiveCareersTab('form');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-white/15 cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5 text-brand-teal" />
                          <span>Open In Portal</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const directLink = `${window.location.origin}/careers?appId=${encodeURIComponent(app.id)}`;
                            navigator.clipboard.writeText(directLink);
                            setSavedActionNotice(`✓ Unique link for Application #${app.id} copied to clipboard!`);
                            setTimeout(() => setSavedActionNotice(null), 3000);
                          }}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-mono text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Copy className="w-3 h-3 text-brand-teal" />
                          <span>Copy Link</span>
                        </button>

                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `*S-CODERS Candidate Application Form Dossier*\n\n` +
                            `*Applicant:* ${app.fullName}\n` +
                            `*Role:* ${app.roleTitle || app.sector}\n` +
                            `*Application ID:* ${app.id}\n` +
                            `*Status:* ${app.status}\n\n` +
                            `*Direct Access Link:* ${window.location.origin}/careers?appId=${app.id}\n\n` +
                            `Official HR: scoders82@gmail.com`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-mono text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Share2 className="w-3 h-3 text-emerald-400" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )
        )}

        {/* ============================================================ */}
        {/* TAB 2: RECRUITMENT APPLICATION STAGES & PORTAL */}
        {/* ============================================================ */}
        {activeCareersTab === 'form' && (
          <div>

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

        {/* Step Progress Tracker (4-Step Flow: Initial -> Joining -> Reference IDs -> WhatsApp & Online Work) */}
        <div className="mb-10 bg-brand-card/70 border border-white/10 rounded-2xl p-3 sm:p-5 backdrop-blur-md">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 relative">
            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => {
                setCurrentStep(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left cursor-pointer ${
                currentStep === 1 
                  ? 'bg-brand-teal/15 border border-brand-teal/40 text-brand-teal shadow-md shadow-brand-teal/10' 
                  : currentStep === 'submitted_stage1' || (typeof currentStep === 'number' && currentStep > 1)
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                    : 'bg-white/5 text-gray-500 hover:bg-white/10'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                currentStep === 1 
                  ? 'bg-brand-teal text-brand-dark font-bold' 
                  : currentStep === 'submitted_stage1' || (typeof currentStep === 'number' && currentStep > 1)
                    ? 'bg-emerald-500 text-brand-dark' 
                    : 'bg-white/10 text-gray-400'
              }`}>
                {currentStep === 'submitted_stage1' || (typeof currentStep === 'number' && currentStep > 1) ? <Check className="w-4 h-4 stroke-[3]" /> : '01'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Step 1</p>
                <p className="text-xs font-semibold text-white truncate">Initial Application</p>
              </div>
            </button>

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => {
                setCurrentStep(2);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left cursor-pointer ${
                currentStep === 2 
                  ? 'bg-brand-teal/15 border border-brand-teal/40 text-brand-teal shadow-md shadow-brand-teal/10' 
                  : (typeof currentStep === 'number' && currentStep > 2)
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                    : currentStep === 'submitted_stage1'
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                      : 'bg-white/5 text-gray-500 hover:bg-white/10'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                currentStep === 2 
                  ? 'bg-brand-teal text-brand-dark font-bold' 
                  : (typeof currentStep === 'number' && currentStep > 2)
                    ? 'bg-emerald-500 text-brand-dark' 
                    : currentStep === 'submitted_stage1'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-white/10 text-gray-400'
              }`}>
                {(typeof currentStep === 'number' && currentStep > 2) ? <Check className="w-4 h-4 stroke-[3]" /> : currentStep === 'submitted_stage1' ? <Lock className="w-3.5 h-3.5" /> : '02'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Step 2</p>
                <p className="text-xs font-semibold text-white truncate">
                  {currentStep === 'submitted_stage1' ? 'Joining Form' : 'Joining Application'}
                </p>
              </div>
            </button>

            {/* Step 3 Pill */}
            <button
              type="button"
              onClick={() => {
                setCurrentStep(3);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left cursor-pointer ${
                currentStep === 3 
                  ? 'bg-brand-teal/15 border border-brand-teal/40 text-brand-teal shadow-md shadow-brand-teal/10' 
                  : (typeof currentStep === 'number' && currentStep > 3)
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-white/5 text-gray-500 hover:bg-white/10'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                currentStep === 3 
                  ? 'bg-brand-teal text-brand-dark font-bold' 
                  : (typeof currentStep === 'number' && currentStep > 3)
                    ? 'bg-emerald-500 text-brand-dark'
                    : 'bg-white/10 text-gray-400'
              }`}>
                {(typeof currentStep === 'number' && currentStep > 3) ? <Check className="w-4 h-4 stroke-[3]" /> : '03'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Step 3</p>
                <p className="text-xs font-semibold text-white truncate">Reference IDs Portal</p>
              </div>
            </button>

            {/* Step 4 Pill */}
            <button
              type="button"
              onClick={() => {
                setCurrentStep(4);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left cursor-pointer ${
                currentStep === 4 
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/10' 
                  : 'bg-white/5 text-gray-500 hover:bg-white/10'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                currentStep === 4 ? 'bg-emerald-500 text-brand-dark font-bold' : 'bg-white/10 text-gray-400'
              }`}>
                04
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Step 4</p>
                <p className="text-xs font-semibold text-white truncate">WhatsApp & Online Work</p>
              </div>
            </button>
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
                            isSelected ? 'bg-brand-teal/20 border-brand-teal/40 text-brand-teal font-bold' : 'bg-white/5 border-white/10 text-gray-400'
                          }`}>
                            {sector.badge}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-white mb-1 leading-snug">{sector.name}</h3>
                        <p className="text-xs text-gray-400 line-clamp-1">{sector.role}</p>
                      </div>

                      {isSelected ? (
                        <div className="mt-3 pt-2.5 border-t border-brand-teal/30 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-brand-teal font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Selected Track
                          </span>
                          <span className="text-[10px] text-gray-200 bg-brand-teal/20 px-2 py-0.5 rounded flex items-center gap-1">
                            See Requirements ↓
                          </span>
                        </div>
                      ) : (
                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-400">
                          <span className="truncate pr-1"><span className="text-gray-300">Stack:</span> {sector.skills}</span>
                          <span className="text-[10px] text-brand-teal/80 shrink-0 font-medium">Click to view →</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* DYNAMIC TRACK REQUIREMENTS & EXPECTED SKILLS BLUEPRINT (Appears when candidate clicks any sector / interest) */}
              {(() => {
                const currentSector = SECTORS.find(s => s.name === selectedSector) || SECTORS[0];
                const SectorIcon = currentSector.icon;
                return (
                  <div id="track-requirements-section" className="mt-6 pt-6 border-t border-white/10 scroll-mt-20">
                    <div className="bg-brand-dark/95 border-2 border-brand-teal/40 rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-md relative overflow-hidden space-y-6">
                      {/* Ambient background glow */}
                      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-teal/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10 relative z-10">
                        <div className="flex items-start gap-3.5">
                          <div className="p-3 rounded-xl bg-brand-teal text-brand-dark shadow-lg shadow-brand-teal/20 shrink-0">
                            <SectorIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="px-2.5 py-0.5 rounded-full bg-brand-teal/20 border border-brand-teal/40 text-brand-teal text-[11px] font-mono font-bold uppercase tracking-wider">
                                Track Requirements & Skill Expectations
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-gray-300 text-[10px] font-mono">
                                {currentSector.badge}
                              </span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-display font-bold text-white leading-snug">
                              {currentSector.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-3xl leading-relaxed">
                              {currentSector.description}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-left sm:text-right">
                          <span className="text-[10px] font-mono text-gray-400 block uppercase">Default Designated Role</span>
                          <span className="text-xs font-mono font-bold text-brand-teal">{currentSector.role}</span>
                        </div>
                      </div>

                      {/* 2-Column: What We Require VS Expected Skills */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                        {/* Column 1: What We Require from your side */}
                        <div className="p-5 rounded-xl bg-black/40 border border-emerald-500/30 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-white/10">
                              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                                ✓
                              </div>
                              <h4 className="font-mono text-xs uppercase tracking-wider text-emerald-300 font-bold">
                                What We Require From Your Side
                              </h4>
                            </div>
                            <ul className="space-y-3">
                              {currentSector.whatWeRequire.map((req, idx) => (
                                <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-200 leading-relaxed">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-300/90 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                            <span>We value practical capability, passion, and execution over rigid degrees.</span>
                          </div>
                        </div>

                        {/* Column 2: Expected Skills & Tools */}
                        <div className="p-5 rounded-xl bg-black/40 border border-cyan-500/30 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-white/10">
                              <div className="w-6 h-6 rounded-lg bg-brand-teal/20 text-brand-teal flex items-center justify-center font-bold text-xs">
                                ★
                              </div>
                              <h4 className="font-mono text-xs uppercase tracking-wider text-cyan-300 font-bold">
                                Expected Skills & Tools From Your Side
                              </h4>
                            </div>
                            
                            <div className="space-y-2">
                              <span className="text-[10px] font-mono text-gray-400 block uppercase">
                                Recommended Core Skills / Software:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {currentSector.expectedSkills.map((skill, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-brand-teal/15 border border-white/10 hover:border-brand-teal/40 text-xs text-white font-mono transition-colors"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Note on portfolio / coding requirements */}
                          {currentSector.isNonTechnical ? (
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] font-mono text-amber-300 flex items-start gap-2">
                              <span className="text-sm shrink-0">💡</span>
                              <span>
                                <strong>Creative & Media Track:</strong> GitHub profile & programming code are <strong>100% OPTIONAL</strong>. Share your YouTube, Instagram, Google Drive, or writing links below.
                              </span>
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/25 text-[11px] font-mono text-cyan-300 flex items-start gap-2">
                              <span className="text-sm shrink-0">🚀</span>
                              <span>
                                <strong>Technical Engineering Track:</strong> Practical project demos, live deployments, or GitHub code repositories demonstrate high capability.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Deliverables & Real-World Projects */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-brand-teal font-bold block mb-1">
                            Key Deliverables You Will Build & Ship At S-CODERS:
                          </span>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                            {currentSector.deliverables.map((d, dIdx) => (
                              <span key={dIdx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/50 border border-white/10 text-gray-200">
                                <span className="text-brand-teal font-bold">•</span>
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Suggested Sub-Roles in this Track */}
                      {currentSector.roles && currentSector.roles.length > 0 && (
                        <div className="pt-2 border-t border-white/10 relative z-10">
                          <span className="text-[11px] font-mono text-gray-400 block mb-2">
                            Select Specific Role in <strong className="text-white">{currentSector.name}</strong> (Click to set as your role):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {currentSector.roles.map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setRoleTitle(r)}
                                className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all cursor-pointer text-left ${
                                  roleTitle === r
                                    ? 'bg-brand-teal text-brand-dark font-bold border-brand-teal shadow-md shadow-brand-teal/20'
                                    : 'bg-white/5 border-white/10 text-gray-300 hover:border-brand-teal/40 hover:text-white hover:bg-white/10'
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
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
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2 flex items-center justify-between">
                    <span>GitHub Profile Link</span>
                    <span className="text-gray-400 font-normal lowercase text-[11px]">(optional for creators / editors / writers)</span>
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username (Optional)"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2 flex items-center justify-between">
                    <span>LinkedIn Profile Link</span>
                    <span className="text-gray-400 font-normal lowercase text-[11px]">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username (Optional)"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2 flex items-center justify-between">
                    <span>Portfolio / Work Samples / Drive Link</span>
                    <span className="text-gray-400 font-normal lowercase text-[11px]">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="e.g. YouTube, Behance, Google Drive, Portfolio URL (Optional)"
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
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2 flex items-center justify-between">
                    <span>Key Skills, Creative Tools & Software</span>
                    <span className="text-gray-400 font-normal lowercase text-[11px]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={keySkills}
                    onChange={(e) => setKeySkills(e.target.value)}
                    placeholder="e.g. Premiere Pro, CapCut, Content Writing, SEO, Figma, React, or Python (Optional)"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                  Highlight Recent Projects or Creative Work Samples <span className="text-brand-teal">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={previousProjects}
                  onChange={(e) => setPreviousProjects(e.target.value)}
                  placeholder="Describe 1-2 major projects, videos edited, articles written, social campaigns run, or software built..."
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

                <div className="space-y-2">
                  <label htmlFor="expectedSalary" className="block text-xs font-mono uppercase tracking-wider text-gray-300 flex items-center justify-between">
                    <span>Fixed Monthly Salary <span className="text-brand-teal">*</span></span>
                    <span className="text-brand-teal text-[11px] font-mono font-bold">Max ₹20,000/mo</span>
                  </label>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <select
                      id="expectedSalary"
                      name="expectedSalary"
                      value={salaryOption === 'custom' ? 'CUSTOM' : expectedCompensation}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'CUSTOM') {
                          setSalaryOption('custom');
                          setExpectedCompensation(`₹${customSalaryInput} / Month (Fixed)`);
                        } else {
                          setSalaryOption('preset');
                          setExpectedCompensation(val);
                        }
                      }}
                      className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-teal transition-colors"
                    >
                      <option value="₹10,000 / Month (Fixed)">₹10,000 / Month (Fixed Stipend)</option>
                      <option value="₹12,000 / Month (Fixed)">₹12,000 / Month (Fixed Stipend)</option>
                      <option value="₹15,000 / Month (Fixed)">₹15,000 / Month (Fixed Standard)</option>
                      <option value="₹18,000 / Month (Fixed)">₹18,000 / Month (Fixed Specialist)</option>
                      <option value="₹20,000 / Month (Fixed)">₹20,000 / Month (Fixed Maximum Cap)</option>
                      <option value="CUSTOM">Custom Fixed Amount (Under ₹20,000 / Month)</option>
                    </select>

                    {salaryOption === 'custom' && (
                      <div className="space-y-1 pt-1">
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">₹</span>
                          <input
                            type="number"
                            min="3000"
                            max="20000"
                            value={customSalaryInput}
                            onChange={(e) => {
                              const rawVal = e.target.value;
                              const numVal = parseInt(rawVal, 10);
                              if (!isNaN(numVal) && numVal > 20000) {
                                setCustomSalaryInput('20000');
                                setExpectedCompensation('₹20,000 / Month (Fixed)');
                              } else {
                                setCustomSalaryInput(rawVal);
                                setExpectedCompensation(rawVal ? `₹${rawVal} / Month (Fixed)` : '');
                              }
                            }}
                            placeholder="e.g. 15000 (Max 20000)"
                            className="w-full bg-brand-dark/90 border border-brand-teal/40 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-brand-teal"
                          />
                        </div>
                        <p className="text-[11px] text-brand-teal/90 font-mono flex items-center gap-1.5">
                          <span>✓ Fixed monthly salary is capped under ₹20,000 / Month.</span>
                        </p>
                      </div>
                    )}
                  </div>
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
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2 flex items-center justify-between">
                  <span>Notable Achievement, Project, or Creative Milestone</span>
                  <span className="text-gray-400 font-normal lowercase text-[11px]">(optional for creators / writers / editors)</span>
                </label>
                <textarea
                  rows={2}
                  value={impressiveAchievement}
                  onChange={(e) => setImpressiveAchievement(e.target.value)}
                  placeholder="e.g. Viral video created, published article, hackathon win, open-source PR, or milestone creative work (Optional)..."
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

            {/* Navigation CTA: Proceed to Step 2 (First Form Submission) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
              <p className="text-xs text-gray-400 leading-relaxed max-w-lg">
                Technical skills, GitHub, LinkedIn, and achievements are optional for content creators & creative tracks. Submitting creates your Application Form 1 and saves it to your <strong>My Application Forms</strong> tab.
              </p>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleProceedToStep2}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-brand-teal text-brand-dark font-mono font-bold text-sm uppercase tracking-wider hover:bg-white hover:shadow-xl hover:shadow-brand-teal/20 transition-all duration-300 cursor-pointer focus:outline-none disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Submitting Application Form...</span>
                  </>
                ) : (
                  <>
                    <span>Next – Legal & Introduction Agreement</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* INTERMEDIATE STEP: STAGE 1 SUBMISSION CONFIRMATION & ROADMAP */}
        {/* ============================================================ */}
        {currentStep === 'submitted_stage1' && (
          <motion.div
            key="submitted_stage1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8 max-w-4xl mx-auto"
          >
            {/* Primary Success Announcement Banner */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#021F2D] via-brand-card to-[#011425] border-2 border-brand-teal/50 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-brand-teal/15 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold uppercase mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    First Application Form Submitted Successfully
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
                    Application Form 1 Acknowledged
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-300 mt-1">
                    Candidate: <strong className="text-white">{submittedStage1App?.fullName || fullName}</strong> • Role: <strong className="text-brand-teal">{submittedStage1App?.roleTitle || roleTitle}</strong>
                  </p>
                </div>
              </div>

              {/* Exact Mandated Confirmation Notice Box */}
              <div className="mt-6 p-6 rounded-2xl bg-brand-dark/80 border border-brand-teal/40 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <span className="font-mono text-xs uppercase tracking-wider text-brand-teal flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Official S-CODERS Confirmation Email Dispatched
                  </span>
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-brand-teal/10 border border-brand-teal/30 text-cyan-300 font-bold">
                    scoders82@gmail.com
                  </span>
                </div>

                <blockquote className="text-sm sm:text-base text-gray-100 italic leading-relaxed border-l-4 border-brand-teal pl-4 py-1">
                  «Your application form has been submitted successfully.
                  Your resume and application form will now undergo the shortlisting process. If your profile is shortlisted, you will receive another email from S-CODERS – Bharat Tech Developers with information about the next stage of the selection process.»
                </blockquote>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
                  <div className="text-gray-400 font-mono">
                    Recipient Address: <span className="text-white font-bold">{submittedStage1App?.email || email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-mono">Reference ID:</span>
                    <code className="bg-black/50 px-2.5 py-1 rounded text-brand-teal font-mono font-bold border border-brand-teal/30">
                      {submittedStage1App?.id || authorizedAppId}
                    </code>
                  </div>
                </div>
              </div>

              {/* Why Second Form is not accessible immediately */}
              <div className="mt-6 p-5 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-300 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold font-mono uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  Why is the Second Application Form currently locked?
                </div>
                <p className="leading-relaxed text-gray-300">
                  The second application form comprises the <strong>S-CODERS Talent Induction & Non-Disclosure Agreement (NDA)</strong>, official government identity document records (PAN Card & Aadhaar Number), and direct banking coordinates for compensation disbursement.
                </p>
                <p className="leading-relaxed text-gray-300">
                  To safeguard candidate data integrity and enforce company compliance, this second form is accessed strictly after passing the technical interview stage and receiving an <strong>Authorization Access Token</strong> directly from S-CODERS recruitment management.
                </p>
              </div>

              {/* Recruitment Selection Roadmap */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-teal" />
                  S-CODERS 7-Stage Candidate Selection Roadmap
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs">
                    <div className="font-bold flex items-center justify-between">
                      <span>1. First Form</span>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-gray-300 mt-1">Submitted & Logged in Central DB</p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs">
                    <div className="font-bold flex items-center justify-between">
                      <span>2. Shortlisting</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200">Active</span>
                    </div>
                    <p className="text-[11px] text-gray-300 mt-1">Application & Portfolio Evaluation</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs">
                    <div className="font-bold flex items-center justify-between">
                      <span>3. Interview</span>
                      <Clock className="w-3 h-3" />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Google Meet Invite (If Shortlisted)</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs">
                    <div className="font-bold flex items-center justify-between">
                      <span>4. Onboarding Form</span>
                      <Lock className="w-3 h-3" />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Legal Agreement & Banking Setup</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <a
                  href="https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#25D366] hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#25D366]/20"
                >
                  <MessageSquare className="w-4 h-4 fill-black" />
                  <span>Join Department WhatsApp Group</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    const activeId = submittedStage1App?.id || authorizedAppId;
                    if (activeId) setTokenInputId(activeId);
                    setCurrentStep(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Key className="w-4 h-4 text-brand-teal" />
                  <span>Have an Authorization Token? Unlock Stage 2</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveCareersTab('saved_forms');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-teal text-brand-dark hover:bg-white font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer shadow-md"
                >
                  <FileText className="w-4 h-4" />
                  <span>View in My Application Forms ({savedApplications.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/10 text-gray-400 hover:text-white font-mono text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <span>Submit Another Application</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: INDUCTION & NON-DISCLOSURE AGREEMENT (NDA) */}
        {/* ============================================================ */}
        {currentStep === 2 && !onboardingAuthorized && (
          <motion.div
            key="step2_gatekeeper"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <div className="bg-brand-card/90 border-2 border-amber-500/40 rounded-3xl p-8 sm:p-10 backdrop-blur-md shadow-2xl space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <Lock className="w-8 h-8" />
              </div>

              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono uppercase font-bold">
                  Stage 2 Gatekeeper Protection
                </div>
                <h3 className="text-2xl font-display font-bold text-white">
                  Second Application Form Access Restricted
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto leading-relaxed">
                  The S-CODERS Legal Induction Agreement, Government ID verification, and Banking details form is accessible only to candidates who have cleared their technical interview and been authorized by Recruitment Admin.
                </p>
              </div>

              {/* Token verification form */}
              <div className="p-6 rounded-2xl bg-brand-dark/70 border border-white/10 space-y-5">
                {/* Visual Guide Callout */}
                <div className="p-4 rounded-2xl bg-brand-teal/15 border-2 border-brand-teal/50 text-xs text-gray-200 space-y-3">
                  <div className="font-bold font-mono text-brand-teal uppercase flex items-center gap-2 text-xs sm:text-sm">
                    <CheckCircle2 className="w-5 h-5 text-brand-teal" />
                    <span>Which Box Should You Paste Your Unique Key Into?</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-black/60 border-2 border-brand-teal shadow-md">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-brand-teal mb-1">
                        <span className="w-5 h-5 rounded-full bg-brand-teal text-brand-dark flex items-center justify-center text-[10px] font-extrabold">1</span>
                        <span>PASTE HERE: 1st BOX (First One)</span>
                      </div>
                      <p className="text-white text-xs leading-relaxed">
                        If you have a <strong>Unique Key / Application ID</strong> (e.g. <code className="text-cyan-300 font-mono font-bold">SCD-APP-2026-XXXX</code> from Image 1 or your confirmation screen), paste it into this <strong>1st BOX</strong>.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/60 border border-amber-500/40">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-amber-300 mb-1">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-brand-dark flex items-center justify-center text-[10px] font-extrabold">2</span>
                        <span>2nd BOX: Post-Interview Token Only</span>
                      </div>
                      <p className="text-gray-300 text-xs leading-relaxed">
                        Do <strong>NOT</strong> paste your unique key here. This second box is strictly for the <strong>Authorization Security Token</strong> emailed to you from <code className="text-cyan-300 font-mono">scoders82@gmail.com</code> <em>after</em> passing your interview.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Box 1: Application ID Reference */}
                <div className="space-y-2 p-4 rounded-xl bg-white/5 border-2 border-brand-teal/30">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-brand-teal text-brand-dark text-[11px] font-extrabold">1st BOX (First One)</span>
                      <span>Unique Application Key / ID</span>
                    </label>
                    {(submittedStage1App?.id || authorizedAppId) && (
                      <button
                        type="button"
                        onClick={() => setTokenInputId(submittedStage1App?.id || authorizedAppId)}
                        className="text-[10px] font-mono text-brand-teal bg-brand-teal/10 hover:bg-brand-teal/20 px-2.5 py-1 rounded-lg border border-brand-teal/30 transition-colors cursor-pointer"
                      >
                        Auto-Fill My Key
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={tokenInputId}
                    onChange={(e) => setTokenInputId(e.target.value)}
                    placeholder="Paste your unique key here (e.g. SCD-APP-2026-XXXX)"
                    className="w-full bg-brand-card border border-brand-teal/50 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-brand-teal"
                  />
                  <p className="text-[11px] text-gray-300">
                    Paste the unique key from Image 1 / confirmation screen here (e.g., <code className="text-brand-teal font-mono font-bold">{submittedStage1App?.id || 'SCD-APP-2026-XXXX'}</code>).
                  </p>
                </div>

                {/* Box 2: Authorization Security Token */}
                <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono uppercase tracking-wider text-amber-300 font-bold flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-brand-dark text-[11px] font-extrabold">2nd BOX (Second One)</span>
                      <span>Security Token (Post-Interview)</span>
                    </label>
                    <span className="text-[10px] font-mono text-amber-300/80 uppercase">Cleared Interview Only</span>
                  </div>
                  <input
                    type="text"
                    value={tokenInputKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Smart assistance: If candidate pastes their unique application ID in Box 2, auto-move it to Box 1!
                      if (val.trim().toUpperCase().startsWith('SCD-APP-') || val.trim().toUpperCase().startsWith('SCD-AGR-')) {
                        setTokenInputId(val.trim());
                        setTokenInputKey('');
                        setTokenVerifyError('Notice: We moved your unique application key to the 1st BOX for you! The 2nd box is only for security tokens sent after interviews.');
                      } else {
                        setTokenInputKey(val);
                      }
                    }}
                    placeholder="e.g. SCD-ONB-ABC12345 (Do NOT paste your Application ID here)"
                    className="w-full bg-brand-card border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[11px] text-amber-200/70">
                    Dispatched from <code className="text-cyan-300 font-mono">scoders82@gmail.com</code> only after clearing your technical interview.
                  </p>
                </div>

                {tokenVerifyError && (
                  <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span>{tokenVerifyError}</span>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    disabled={isVerifyingToken || !tokenInputId.trim() || !tokenInputKey.trim()}
                    onClick={() => verifyOnboardingToken(tokenInputId, tokenInputKey)}
                    className="w-full py-3.5 rounded-xl bg-brand-teal text-brand-dark font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-teal/20"
                  >
                    {isVerifyingToken ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Authorization...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        <span>Verify & Unlock Second Form</span>
                      </>
                    )}
                  </button>

                  {/* Direct status lookup if candidate only has Application ID */}
                  {tokenInputId.trim() && (
                    <button
                      type="button"
                      disabled={isLookingUp}
                      onClick={() => handleLookupApplication(tokenInputId)}
                      className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Search className="w-3.5 h-3.5 text-brand-teal" />
                      <span>Check Application Status (Using Application ID Only)</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-gray-400 hover:text-white font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to First Application Form</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: INDUCTION & NON-DISCLOSURE AGREEMENT (AUTHORIZED) */}
        {/* ============================================================ */}
        {currentStep === 2 && onboardingAuthorized && (
          <motion.form
            key="step2"
            onSubmit={handleSubmitApplication}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {accessVerifiedBanner && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{accessVerifiedBanner}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAccessVerifiedBanner(null)}
                  className="text-emerald-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

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

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
                    UPI ID (Optional / Fast Disbursements)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. candidate@okhdfcbank / paytm"
                    className="w-full bg-brand-dark/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 font-mono focus:outline-none focus:border-brand-teal transition-colors"
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
                  The candidate acknowledges that in connection with their engagement at S-CODERS (Bharat Tech Developers), they will have access to confidential software architectures, proprietary LLM prompt workflows, private repositories, and client project specifications. The candidate agrees not to disclose, replicate, reverse-engineer, or distribute any proprietary material without prior written authorization from the founders.
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

              {/* Unique Application Form Access Link & Pass Key Card */}
              <div className="bg-brand-dark/90 border border-brand-teal/40 rounded-2xl p-5 max-w-2xl mx-auto mb-8 text-left space-y-3 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-brand-teal" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      Your Unique Application Form Access Link
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    Permanent Link Ready
                  </span>
                </div>

                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  Copy and save this unique link. You can paste this link or your Application Pass Key (<strong className="text-brand-teal font-mono">{successApp.id}</strong>) anytime at the top of the Careers portal using the <strong className="text-brand-teal">"🔑 Enter Existing Pass Key / Paste Link"</strong> button to immediately view, print, or track your application form.
                </p>

                <div className="p-3 bg-black/60 border border-white/10 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="min-w-0 font-mono text-xs text-brand-teal truncate select-all bg-black/40 px-3 py-2 rounded-lg border border-white/5 flex-1">
                    {typeof window !== 'undefined' ? `${window.location.origin}/careers?appId=${encodeURIComponent(successApp.id)}&key=${encodeURIComponent(successApp.agreementReferenceId || successApp.id)}` : `https://scoders.dev/careers?appId=${successApp.id}`}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const linkToCopy = typeof window !== 'undefined' ? `${window.location.origin}/careers?appId=${encodeURIComponent(successApp.id)}&key=${encodeURIComponent(successApp.agreementReferenceId || successApp.id)}` : `https://scoders.dev/careers?appId=${successApp.id}`;
                        copyToClipboard(linkToCopy, 'dossierLink');
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-brand-teal hover:bg-white text-brand-dark rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      {copiedKey === 'dossierLink' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-brand-dark" />
                          <span>Copied Link!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Unique Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`My S-CODERS Application Form & Induction Dossier Link (ID: ${successApp.id}): ${typeof window !== 'undefined' ? `${window.location.origin}/careers?appId=${encodeURIComponent(successApp.id)}&key=${encodeURIComponent(successApp.agreementReferenceId || successApp.id)}` : ''}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-black border border-[#25D366]/40 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      title="Save link to your WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
                <a
                  href="https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#25D366] hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#25D366]/20 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 fill-black" />
                  <span>Join Department WhatsApp Group</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setSection4TargetSecondId(successApp.agreementReferenceId || successApp.id);
                    setActiveCandidateForSection4(successApp);
                    setCurrentStep(4);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-brand-teal text-brand-dark font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  <span>👉 Proceed to Section 4: WhatsApp & Online Work</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

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
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-white/20 transition-all cursor-pointer"
                >
                  <span>Return Home</span>
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
                <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                  Status: Section 2 Onboarding Finalized
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
                    setSection4TargetSecondId(successApp.agreementReferenceId || successApp.id);
                    setActiveCandidateForSection4(successApp);
                    setCurrentStep(4);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 text-brand-dark font-mono font-bold text-xs hover:bg-emerald-400 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Open Section 4: WhatsApp & Online Work</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      setSuccessApp(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-mono transition-colors cursor-pointer"
                  >
                    ← Submit Another Application
                  </button>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('home')}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 text-white font-mono font-bold text-xs hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      Home →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 3: APPLICATION & DEPARTMENT REFERENCE IDS PORTAL */}
        {currentStep === 3 && (
          <motion.div
            key="section3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            <CareersSection3ReferenceIds
              initialFirstRefId={section3TargetFirstId || successApp?.id || ''}
              initialSecondRefId={section4TargetSecondId || successApp?.agreementReferenceId || ''}
              onProceedToSection4={(secRef, cand) => {
                setSection4TargetSecondId(secRef);
                if (cand) setActiveCandidateForSection4(cand);
                setCurrentStep(4);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onProceedToSection2={(appId, token) => {
                setAuthorizedAppId(appId);
                if (token) setAuthorizedToken(token);
                setOnboardingAuthorized(true);
                setCurrentStep(2);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateTab={(step) => {
                setCurrentStep(step);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </motion.div>
        )}

        {/* SECTION 4: DEPARTMENT WHATSAPP GROUP & ONLINE WORK */}
        {currentStep === 4 && (
          <motion.div
            key="section4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <CareersSection4DepartmentWork
              initialSecondRefId={section4TargetSecondId || successApp?.agreementReferenceId || ''}
              candidateRecord={activeCandidateForSection4 || successApp}
              onNavigateTab={(step) => {
                setCurrentStep(step);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </motion.div>
        )}

          </div>
        )}

      </div>

      {/* ENTER PASS KEY / PASTE UNIQUE APPLICATION LINK MODAL (EXACT SAME FORMAT AS EVENT SECTION) */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-card border border-brand-teal/40 rounded-3xl max-w-md w-full p-6 space-y-5 relative shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-600 text-white rounded-full border border-red-500/50 cursor-pointer transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="flex items-center gap-2 text-brand-teal font-mono text-xs font-bold uppercase">
                <Lock className="w-4 h-4" />
                <span>Application Access Key Verification</span>
              </div>

              <h3 className="text-xl font-display font-extrabold text-white">
                Enter Pass Key or Paste Unique Link
              </h3>

              <p className="text-gray-300 text-xs font-sans leading-relaxed">
                Enter your unique S-CODERS candidate pass key (e.g. <code className="text-brand-teal font-bold font-mono">SCD-APP-2026-XXXX</code>, <code className="text-brand-teal font-bold font-mono">SCD-AGR-XXXX</code>) or paste your direct link to unlock and save your verified application form.
              </p>

              <div className="p-3 bg-brand-teal/10 border border-brand-teal/30 rounded-xl text-[11px] font-sans text-brand-teal/90 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-brand-teal mt-0.5" />
                <span>
                  <strong>Automatic Dossier Saving:</strong> Pasting your unique application link will automatically save your application form into your <strong>My Application Forms</strong> collection (just like tickets in the events section).
                </span>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleLookupApplication(); }} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-gray-400 mb-1 uppercase text-[10px] tracking-widest font-bold">
                    Application ID / Pass Key or Paste Link *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualAccessInput}
                    onChange={e => setManualAccessInput(e.target.value)}
                    placeholder="Paste link or e.g. SCD-APP-2026-X8Y2Z"
                    className="w-full p-3 bg-black/50 border border-brand-teal/30 rounded-xl text-white font-mono text-xs sm:text-sm focus:border-brand-teal focus:outline-none uppercase tracking-wider"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 font-sans">
                    Accepts full URL link, Reference ID, Onboarding Token, or registered email.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLookingUp}
                  className="w-full py-3 bg-brand-teal hover:bg-white text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-teal/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLookingUp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying & Saving Application...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Unlock & Save Application Form</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL CANDIDATE APPLICATION FORM DOSSIER MODAL */}
      <AnimatePresence>
        {viewingSavedApp && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0B0F17] border-2 border-brand-teal/40 rounded-3xl max-w-3xl w-full p-6 sm:p-8 relative shadow-[0_0_50px_rgba(20,184,166,0.2)] my-auto text-white font-sans max-h-[90vh] overflow-y-auto"
            >
              {/* Top Bar with Close Button */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-teal/15 border border-brand-teal/30 flex items-center justify-center text-brand-teal">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-lg sm:text-xl text-white">
                      Candidate Application Form
                    </h3>
                    <p className="text-xs font-mono text-gray-400">
                      ID: <span className="text-brand-teal font-bold">{viewingSavedApp.id}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    (viewingSavedApp.status as any) === 'Onboarding Completed' || (viewingSavedApp.status as any) === 'Hired'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : (viewingSavedApp.status as any) === 'Approved for Onboarding'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : viewingSavedApp.status === 'Shortlisted' || (viewingSavedApp.status as any) === 'Shortlisted for Interview'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {viewingSavedApp.status || 'Submitted'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewingSavedApp(null)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Application Content */}
              <div id="printable-candidate-dossier" className="space-y-6 text-xs sm:text-sm font-sans">
                {/* Header info block */}
                <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-brand-teal font-bold tracking-widest block mb-0.5">
                      {viewingSavedApp.sector}
                    </span>
                    <h4 className="text-lg font-display font-bold text-white">
                      {viewingSavedApp.roleTitle || 'Candidate Application'}
                    </h4>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      Submitted on: {viewingSavedApp.submissionDate || 'Recent'}
                    </p>
                  </div>

                  <div className="bg-white p-2 rounded-xl flex items-center gap-3 text-black">
                    <UpiQrCanvas upiString={`${window.location.origin}/careers?appId=${viewingSavedApp.id}`} size={64} />
                    <div className="text-left font-mono">
                      <span className="text-[8px] uppercase tracking-tighter text-gray-500 font-bold block">Digital Verifier</span>
                      <span className="text-[10px] font-bold text-brand-dark">{viewingSavedApp.id}</span>
                      <span className="text-[8px] text-emerald-600 font-bold block mt-0.5">✓ Authenticated</span>
                    </div>
                  </div>
                </div>

                {/* Section 1: Personal & Contact Profile */}
                <div className="space-y-2">
                  <h5 className="font-mono text-xs uppercase tracking-wider text-brand-teal font-bold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Applicant Identity & Communication</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 font-mono text-xs">
                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                      <span className="text-gray-500 text-[10px] block uppercase">Full Legal Name</span>
                      <span className="text-white font-bold">{viewingSavedApp.fullName}</span>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                      <span className="text-gray-500 text-[10px] block uppercase">Official Email</span>
                      <span className="text-gray-200 truncate block">{viewingSavedApp.email}</span>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                      <span className="text-gray-500 text-[10px] block uppercase">Phone / WhatsApp</span>
                      <span className="text-gray-200">{viewingSavedApp.whatsapp || viewingSavedApp.phone || 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                      <span className="text-gray-500 text-[10px] block uppercase">Current City / Location</span>
                      <span className="text-gray-200">{viewingSavedApp.currentCity || 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                      <span className="text-gray-500 text-[10px] block uppercase">Expected Salary</span>
                      <span className="text-brand-teal font-bold">{viewingSavedApp.expectedCompensation || '< ₹20,000 / Month'}</span>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                      <span className="text-gray-500 text-[10px] block uppercase">Joining Notice</span>
                      <span className="text-gray-200">{viewingSavedApp.availabilityNotice || 'Immediate'}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Technical / Creative Deliverables & Portfolio */}
                <div className="space-y-2">
                  <h5 className="font-mono text-xs uppercase tracking-wider text-brand-teal font-bold flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Skills, Experience & Work Samples</span>
                  </h5>
                  <div className="space-y-2 font-mono text-xs">
                    {viewingSavedApp.keySkills && (
                      <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                        <span className="text-gray-500 text-[10px] block uppercase">Core Skills & Tools</span>
                        <p className="text-gray-200 font-sans text-xs mt-1 leading-relaxed">{viewingSavedApp.keySkills}</p>
                      </div>
                    )}
                    {viewingSavedApp.portfolioUrl && viewingSavedApp.portfolioUrl !== 'N/A' && (
                      <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between gap-2">
                        <div>
                          <span className="text-gray-500 text-[10px] block uppercase">Portfolio / Work Drive Link</span>
                          <a
                            href={viewingSavedApp.portfolioUrl.startsWith('http') ? viewingSavedApp.portfolioUrl : `https://${viewingSavedApp.portfolioUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-teal hover:underline truncate block"
                          >
                            {viewingSavedApp.portfolioUrl}
                          </a>
                        </div>
                        <ExternalLink className="w-4 h-4 text-brand-teal shrink-0" />
                      </div>
                    )}
                    {viewingSavedApp.previousProjects && (
                      <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                        <span className="text-gray-500 text-[10px] block uppercase">Featured Project / Creative Work</span>
                        <p className="text-gray-200 font-sans text-xs mt-1 leading-relaxed">{viewingSavedApp.previousProjects}</p>
                      </div>
                    )}
                    {viewingSavedApp.impressiveAchievement && (
                      <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                        <span className="text-gray-500 text-[10px] block uppercase">Notable Achievement</span>
                        <p className="text-gray-200 font-sans text-xs mt-1 leading-relaxed">{viewingSavedApp.impressiveAchievement}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Legal Induction & Banking Coordinates (If executed) */}
                {(viewingSavedApp.bankName || viewingSavedApp.candidateDigitalSignature || viewingSavedApp.agreementReferenceId) && (
                  <div className="space-y-2">
                    <h5 className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Stage 2: Talent Induction & Banking Coordinates</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 font-mono text-xs">
                      <div className="p-3 bg-black/40 border border-emerald-500/20 rounded-xl">
                        <span className="text-gray-500 text-[10px] block uppercase">Disbursement Bank</span>
                        <span className="text-white font-bold">{viewingSavedApp.bankName}</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-emerald-500/20 rounded-xl">
                        <span className="text-gray-500 text-[10px] block uppercase">Bank Account Number</span>
                        <span className="text-gray-200">{viewingSavedApp.accountNumber ? `••••${viewingSavedApp.accountNumber.slice(-4)}` : 'Recorded'}</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-emerald-500/20 rounded-xl">
                        <span className="text-gray-500 text-[10px] block uppercase">IFSC Code</span>
                        <span className="text-gray-200">{viewingSavedApp.ifscCode}</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-emerald-500/20 rounded-xl">
                        <span className="text-gray-500 text-[10px] block uppercase">Agreement Reference</span>
                        <span className="text-brand-teal font-bold">{viewingSavedApp.agreementReferenceId || viewingSavedApp.id}</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-emerald-500/20 rounded-xl">
                        <span className="text-gray-500 text-[10px] block uppercase">Digital Signature</span>
                        <span className="text-brand-teal font-bold font-display">{viewingSavedApp.candidateDigitalSignature}</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-emerald-500/20 rounded-xl">
                        <span className="text-gray-500 text-[10px] block uppercase">Execution Date</span>
                        <span className="text-gray-200">{viewingSavedApp.effectiveDate || viewingSavedApp.submissionDate}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/10 mt-6">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Form</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const directLink = `${window.location.origin}/careers?appId=${encodeURIComponent(viewingSavedApp.id)}`;
                      navigator.clipboard.writeText(directLink);
                      setSavedActionNotice(`✓ Direct link for Application #${viewingSavedApp.id} copied to clipboard!`);
                      setTimeout(() => setSavedActionNotice(null), 3000);
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-brand-teal text-brand-dark hover:bg-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Unique Link</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingSavedApp(null)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* APPLICATION FORM DELETION CONFIRMATION MODAL (MATCHING EVENT TICKETS FORMAT) */}
      <AnimatePresence>
        {showDeleteAppModal && appToDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="bg-[#0B0F17] border-2 border-red-500/60 rounded-3xl max-w-lg w-full p-6 sm:p-8 relative shadow-[0_0_50px_rgba(239,68,68,0.3)] my-auto text-white font-sans"
            >
              <div className="flex items-center gap-3 text-red-400 mb-4">
                <div className="p-3 bg-red-500/20 rounded-2xl border border-red-500/40">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-xl text-white">Remove Saved Application</h3>
                  <p className="text-xs font-mono text-gray-400">Application Reference ID: #{appToDelete.id}</p>
                </div>
              </div>

              {/* Candidate Application Snapshot */}
              <div className="bg-black/50 border border-white/10 rounded-2xl p-4 mb-5 font-mono text-xs space-y-1.5">
                <p className="text-white font-bold text-sm">{appToDelete.roleTitle || appToDelete.sector}</p>
                <p className="text-gray-400">Applicant: <span className="text-gray-200">{appToDelete.fullName}</span> ({appToDelete.email})</p>
                <p className="text-gray-400">Date: <span className="text-gray-200">{appToDelete.submissionDate || 'Recent'}</span></p>
              </div>

              {/* Privacy & Retention Warning Banner */}
              <div className="bg-amber-500/10 border-l-4 border-amber-400 p-4 rounded-r-2xl mb-6 space-y-2 text-xs">
                <p className="font-mono font-bold text-amber-300 uppercase tracking-wide">
                  ⚠️ Privacy & Application Retention Policy:
                </p>
                <p className="text-amber-100 font-semibold leading-relaxed">
                  "If you remove this application form from your saved collection, the reference will be erased from this device session. You can restore it anytime by pasting your unique link or pass key."
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={confirmDeleteApplication}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Yes, Remove From Saved</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteAppModal(false);
                    setAppToDelete(null);
                  }}
                  className="py-3.5 px-6 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-mono text-xs sm:text-sm font-bold uppercase rounded-xl transition-colors cursor-pointer text-center"
                >
                  Keep My Application Form
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
