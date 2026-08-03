import { TeamMember, Service, ProjectExample, WorkshopEvent, StartupCommunity } from './types';

export const S_CODERS_STATS = [
  { value: '15+', label: 'Shipped Projects' },
  { value: '1200+', label: 'Workshop Attendees' },
  { value: '7+', label: 'Startup Communities' },
  { value: '100%', label: 'Client Satisfaction' },
];

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Suhas Gowda',
    role: 'Founder & Chief AI Architect',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300&h=300',
    bio: 'Visionary engineer obsessed with AI Agent workflows, automation, and full-stack architecture. Suhas directs S-CODERS with a passion for turning complex business friction into seamless software.',
    expertise: ['Generative AI', 'n8n Automation', 'React Native', 'Express.js', 'System Architecture'],
    linkedin: 'https://linkedin.com/in/suhasgowda-scoders',
    github: 'https://github.com/suhas-scoders',
    contribution: 'Steers corporate strategy, leads technical architecture, coordinates external client partnerships, and designs S-CODERS core generative AI models.',
  },
  {
    id: '2',
    name: 'Prathiksha R',
    role: 'Co-Founder & Head of UI/UX',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300&h=300',
    bio: 'Creative design system lead focusing on pixel-perfect user experiences, micro-interactions, and visual storytelling that builds instant trust.',
    expertise: ['UI/UX Design', 'Figma', 'Framer Motion', 'Tailwind CSS', 'Frontend Engineering'],
    linkedin: 'https://linkedin.com/in/prathiksha-scoders',
    github: 'https://github.com/prathiksha-scoders',
    contribution: 'Designs high-fidelity wireframes, directs branding guides, builds interactive frontend motion systems, and leads UI quality assurance.',
  },
  {
    id: '3',
    name: 'Manoj Kumar',
    role: 'Lead Full-Stack Developer',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300&h=300',
    bio: 'Full-stack builder who specializes in robust backend pipelines, cloud databases, and cross-platform mobile apps that scale under heavy traffic.',
    expertise: ['React Native', 'Node.js', 'PostgreSQL', 'Firebase', 'TypeScript'],
    linkedin: 'https://linkedin.com/in/manoj-scoders',
    github: 'https://github.com/manoj-scoders',
    contribution: 'Architects reliable database schemas, manages API endpoints, integrates Razorpay payments, and programs our high-performance mobile apps.',
  },
  {
    id: '4',
    name: 'Aishwarya Shenoy',
    role: 'AI Automation & Workshop Lead',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300&h=300',
    bio: 'No-code workflow maven and expert technical presenter who bridges the gap between deep AI systems and non-technical business partners.',
    expertise: ['n8n Integration', 'Zapier', 'Digital Marketing', 'Technical Training', 'Client Relations'],
    linkedin: 'https://linkedin.com/in/aishwarya-scoders',
    github: 'https://github.com/aishwarya-scoders',
    contribution: 'Leads our regional tech workshops, curates community educational sessions, builds custom WhatsApp bots, and executes S-CODERS digital presence.',
  },
];

export const COMPANY_VALUES = [
  {
    title: 'Customer-Centric Innovation',
    description: 'We don’t just write code. We build tailored software that directly solves key business challenges and generates clear commercial value.',
  },
  {
    title: 'Speed & Craftsmanship',
    description: 'We move at the velocity of high-growth startups without ever compromising on security, readability, and pixel-perfect design.',
  },
  {
    title: 'Empowering Through Education',
    description: 'We believe in demystifying technology. Our workshops and community events help next-generation builders master AI agents and full-stack development.',
  },
  {
    title: 'Collaborative Excellence',
    description: 'We foster an open culture of learning, extreme ownership, and shared leadership, ensuring every team member can make a massive impact.',
  },
];

export const SERVICES: Service[] = [
  {
    id: 'ai',
    title: 'AI Agent Development',
    description: 'Autonomous AI agents, custom prompt pipelines, and multi-tool workflow systems built to automate operations and decision making.',
    icon: 'BrainCircuit',
    technologies: ['Gemini 3.5 Flash', 'n8n Workflow Automation', 'LangChain', 'Python', 'OpenAI API'],
    value: 'Saves up to 80% on repetitive operations and customer service overhead while providing instant 24/7 intelligent responses.',
    price: 150000
  },
  {
    id: 'mobile',
    title: 'Mobile Application Development',
    description: 'High-performance cross-platform iOS and Android apps with beautiful user interfaces, real-time sync, and fluid animations.',
    icon: 'Smartphone',
    technologies: ['React Native', 'Flutter', 'TypeScript', 'Firebase', 'Tailwind CSS'],
    value: 'Places a custom-branded software store experience right in your clients pockets with fully offline-first capabilities.',
    price: 120000
  },
  {
    id: 'web',
    title: 'Website Development',
    description: 'Fast, secure, responsive corporate websites and extensive SaaS platforms designed with interactive storytelling and elegant visuals.',
    icon: 'Globe',
    technologies: ['React', 'Next.js', 'Express.js', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
    value: 'Builds instant digital authority, drives conversions, and integrates directly with your existing CRM and billing software.',
    price: 90000
  },
  {
    id: 'software',
    title: 'Custom Software Development',
    description: 'Tailored backend systems, cloud architectures, and databases modeled after your specific operational workflows.',
    icon: 'Cpu',
    technologies: ['TypeScript', 'Docker', 'Google Cloud Platform', 'Node.js', 'SQL / NoSQL'],
    value: 'Unlocks complete technological freedom by removing reliance on rigid, expensive pre-packaged SaaS options.',
    price: 180000
  },
  {
    id: 'design',
    title: 'UI/UX Design Studio',
    description: 'User research, wireframing, high-fidelity mockups, and interactive prototypes tailored for emotional connection and usability.',
    icon: 'Palette',
    technologies: ['Figma', 'Adobe Creative Suite', 'Prototyping', 'Design Systems'],
    value: 'Eliminates friction, increases user retention, and shapes your product with beautiful, cohesive, and modern visual identity.',
    price: 45000
  },
  {
    id: 'workshops',
    title: 'Technical Workshops & Consulting',
    description: 'Action-oriented training sessions and hands-on workshops designed to skill up engineering teams, startups, and university students.',
    icon: 'Users',
    technologies: ['Generative AI Workshops', 'Modern React', 'n8n Automation', 'Agile Consultation'],
    value: 'Fast-tracks developer onboarding, spreads tech literacy, and sparks collaborative developer networks.',
    price: 25000
  }
];

export const PROJECT_EXAMPLES: ProjectExample[] = [
  {
    id: 'app-1',
    title: 'AgroSmart AI',
    category: 'app',
    description: 'A mobile application enabling local farmers in Karnataka to diagnose crop diseases in real-time via camera feed, connecting them instantly to regional agricultural specialists.',
    technologies: ['React Native', 'TensorFlow Lite', 'Node.js', 'PostgreSQL'],
    image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=600&h=400',
    highlights: ['AI-driven leaves diagnostic scan within 3 seconds', 'Vernacular language support (Kannada & English)', 'Integrated localized marketplace and pricing dashboard'],
  },
  {
    id: 'app-2',
    title: 'FitSync Pro',
    category: 'app',
    description: 'A personalized community-centric fitness and workout app enabling coaches to host training plans, track progress loops, and schedule virtual classes.',
    technologies: ['React Native', 'Firebase Auth', 'Firestore', 'WebSockets'],
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600&h=400',
    highlights: ['Real-time trainer dashboards', 'In-app peer motivation circles', 'Interactive calendar integration'],
  },
  {
    id: 'web-1',
    title: 'EdVantage LMS',
    category: 'website',
    description: 'A fully functional enterprise-scale Learning Management System equipped with high-speed video processing, mock-exam suites, and automatic grading keys.',
    technologies: ['Next.js', 'Express.js', 'GCP Storage', 'MongoDB'],
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600&h=400',
    highlights: ['Automatic AI generated notes and lesson summaries', 'Razorpay subscription checkout split configurations', 'Secure exam browser compatibility'],
  },
  {
    id: 'web-2',
    title: 'FinFlow SaaS Engine',
    category: 'website',
    description: 'A dynamic billing portal and service tracking dashboard for visual design studios, automating customer billing, split invoice payments, and task progression.',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600&h=400',
    highlights: ['One-click split transfers using Razorpay Route', 'Live client collaboration workspace with dynamic Gantt charts', 'Automated tax and compliance reporting tools'],
  },
  {
    id: 'page-1',
    title: 'MedConnect Landing',
    category: 'webpage',
    description: 'A highly optimized, high-performance landing page for specialty clinics, generating conversions through responsive scheduling calendars and AI symptoms checker.',
    technologies: ['Vite', 'React', 'Tailwind CSS', 'Framer Motion'],
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600&h=400',
    highlights: ['Interactive 3D body explorer widget', '98+ Google PageSpeed Performance score', 'Seamless Twilio SMS integration for automated slot bookings'],
  },
  {
    id: 'page-2',
    title: 'LaunchX Pitch deck Landing',
    category: 'webpage',
    description: 'An immersive, premium-grade single page website detailing a Web3 venture vision, capturing investor signups with scroll-based animations.',
    technologies: ['HTML5', 'Tailwind CSS', 'Three.js', 'Framer Motion'],
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=600&h=400',
    highlights: ['Cinematic scroll interactions and dark theme design', 'Interactive investor presentation sliders', 'Encrypted registration portal'],
  },
];

export const WORKSHOP_EVENTS: WorkshopEvent[] = [
  {
    id: 'w-1',
    title: 'Building Real-world AI Agents with n8n & Gemini',
    date: 'June 18, 2026',
    startTime: '10:00 AM IST',
    location: 'Microsoft Reactor, Bangalore',
    summary: 'A fully hands-on developer session detailing how to map intricate multi-agent pipelines with n8n workflow systems, integrate Gemini API models, and trigger actions over Slack and Gmail.',
    achievements: [
      'Over 150+ software developers and startup builders attended in person',
      'Developed 3 custom production ready workflows live',
      'Awarded "Outstanding Tech Community Contribution" badge'
    ],
    photo: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800&h=500',
    category: 'AI / Automation',
    attendees: 154,
    price: 1499,
    duration: '2 Days (8 Hours Total)',
    toolsUsed: ['n8n Orchestrator', 'Gemini 2.5 Flash API', 'React & TypeScript', 'Docker Containers', 'Webhooks & Slack Bots'],
    usefulness: [
      'Master building multi-agent AI systems and autonomous workflows without recurring SaaS fees',
      'Integrate LLM API calls directly into full-stack web and mobile applications',
      'Automate lead triage, customer dispatch, and automated email/slack notifications',
      'Receive the S-CODERS Certified AI Developer Badge and source code blueprints'
    ],
    prerequisites: 'Basic understanding of API concepts, JavaScript/TypeScript fundamentals, and a laptop with Node.js & Git installed.'
  },
  {
    id: 'w-2',
    title: 'Full-Stack React Native Masterclass',
    date: 'May 10, 2026',
    startTime: '09:30 AM IST',
    location: 'RV College of Engineering, Bengaluru',
    summary: 'A fast-paced masterclass covering local state optimization in React Native, building offline-first databases with SQLite, and deploying seamless animations using Reanimated.',
    achievements: [
      'Trained 250+ aspiring engineering students on mobile architecture',
      '30+ students launched active app prototypes on GitHub on the same day',
      'Established the S-CODERS Student Developer Circle'
    ],
    photo: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800&h=500',
    category: 'Mobile Dev',
    attendees: 260,
    price: 999,
    duration: '3 Days (12 Hours Total)',
    toolsUsed: ['React Native', 'Expo CLI', 'SQLite Mobile DB', 'Reanimated 3', 'Tailwind / NativeWind'],
    usefulness: [
      'Build cross-platform iOS & Android mobile applications from scratch',
      'Implement offline-first persistent database state management using local SQLite',
      'Create silky-smooth 60fps animations and gesture handlers',
      'Publish active mobile prototypes directly to GitHub and app store sandboxes'
    ],
    prerequisites: 'Familiarity with React components, state hooks, and standard JavaScript syntax.'
  },
  {
    id: 'w-3',
    title: 'SaaS Hackathon: Idea to MVP in 48 Hours',
    date: 'April 04, 2026',
    startTime: '10:00 AM IST',
    location: 'eChai Ventures Hub, Bengaluru',
    summary: 'A high-intensity, collaborative coding sprints bootcamp designed to assist founders in mapping out functional MVPs, configuring fast databases, and implementing standard payment processors.',
    achievements: [
      '12 startup teams participated directly under S-CODERS mentorship',
      '2 projects secured angel funding reviews within the same weekend',
      'Direct panel discussion with 5 notable Bengaluru investors'
    ],
    photo: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800&h=500',
    category: 'Startup / Scaling',
    attendees: 85,
    price: 1999,
    duration: '2 Days (16 Hours Sprint)',
    toolsUsed: ['Vite + React', 'Node.js Express', 'PostgreSQL / Firestore', 'Razorpay & Stripe SDK', 'Tailwind CSS'],
    usefulness: [
      'Transform rough product ideas into fully functional production MVPs in 48 hours',
      'Implement secure authentication, user roles, and database persistence',
      'Integrate payment gateways for immediate product monetisation and billing',
      'Pitch live to Bengaluru angel investors, mentors, and technical advisors'
    ],
    prerequisites: 'Full-stack web development interest and willingness to collaborate in a high-speed sprint team.'
  }
];

export const STARTUP_COMMUNITIES: StartupCommunity[] = [
  {
    id: 'comm-goat',
    name: 'GOAT Founder Club',
    description: 'An elite close-knit network of Bengaluru’s highest-performing startup founders, product builders, and seed-stage investors.',
    networkingHighlights: 'Presented S-CODERS multi-agent system workflows to 20+ VC partners and mapped collaborative pipelines with elite technology builders.',
    learnings: [
      'Bootstrapping to $10k MRR using hyper-targeted niche software solutions',
      'Optimizing multi-tenant SaaS structures to minimize GCP server costs',
      'Fostering deep-level enterprise client retention and building software loyalty'
    ],
    presentations: ['Scaling AI automations without breaking credit limits', 'Our Tech Journey: Building in Bengaluru']
  },
  {
    id: 'comm-tie',
    name: 'TiE Bangalore',
    description: 'The local chapter of the global nonprofit organization focusing on mentoring, networking, education, and accelerating startups.',
    networkingHighlights: 'Engaged in 1-on-1 mentorship circles with industry stalwarts and attended corporate scaling seminars on legal architectures.',
    learnings: [
      'Transitioning custom service solutions into productized SaaS tools',
      'Navigating early-stage compliance, IP protection, and patent guidelines in India',
      'Forming high-yield institutional sales teams for enterprise pipelines'
    ],
    presentations: ['Bridging traditional app architectures with localized LLM layers']
  },
  {
    id: 'comm-echai',
    name: 'eChai Ventures',
    description: 'A vibrant startup community hosting weekly networking, panel talks, and demo days across major tech hubs.',
    networkingHighlights: 'Frequent panelists and demo leaders sharing practical knowledge regarding fast MVP strategies and n8n integrations.',
    learnings: [
      'Gathering continuous raw feedback from early adopters during live demo panels',
      'Building public brand credibility via localized dev communities',
      'Assembling collaborative lean teams without massive venture funding overhead'
    ],
    presentations: ['Zero to Prototype: Shipping modern web applications in weeks', 'AI Agents: Beyond the Chatbot']
  },
  {
    id: 'comm-grind',
    name: 'Startup Grind Bangalore',
    description: 'A global startup community powered by Google for Startups, educating, inspiring, and connecting local entrepreneurs.',
    networkingHighlights: 'Connected with seed investors, early technical adopters, and global software directors at cross-border startup networking panels.',
    learnings: [
      'Designing global SaaS tools while residing in India',
      'Hiring and retaining elite software engineering talent',
      'Integrating modern AI capabilities inside standard enterprise legacy apps'
    ],
    presentations: ['The Future of Dev Agencies in the Age of Generative AI']
  },
  {
    id: 'comm-reactor',
    name: 'Microsoft Reactor',
    description: 'A physical and virtual community space for developer workshops, collaborative learning events, and hackathons.',
    networkingHighlights: 'Utilized as S-CODERS central workshop venue, enabling seamless technical setups and networking with Microsoft Azure architects.',
    learnings: [
      'Deploying LLM architectures on managed cloud systems efficiently',
      'Leveraging hybrid cloud solutions for extreme reliability and rapid uptime',
      'Utilizing modern vector databases (Pgvector) for semantic document searches'
    ],
    presentations: ['Building serverless Express apps backed by Gemini 3.5 Models']
  },
  {
    id: 'comm-nasscom',
    name: 'NASSCOM Startups',
    description: 'India’s premier IT and software council assisting startups via mentorship, ecosystem connections, and incubator access.',
    networkingHighlights: 'Aided by regional NASSCOM leads to establish client links and represent Indian software innovation on global stages.',
    learnings: [
      'Strategic corporate procurement rules for tech startups in India',
      'Grants and financial options provided by national digital programs',
      'Developing sustainable tech frameworks with secure data storage guidelines'
    ],
    presentations: ['Next-gen responsive layouts and secure database pipelines']
  },
  {
    id: 'comm-karnataka',
    name: 'Startup Karnataka',
    description: 'The government initiative powering startup acceleration, innovation hubs, incubation, and policy grants in Karnataka.',
    networkingHighlights: 'Interacted with technology policymakers, regional hub builders, and startup ecosystem grant reviewers.',
    learnings: [
      'Leveraging state-backed technology sandbox programs for real-world beta tests',
      'Navigating startup certification guidelines and tax benefits',
      'Connecting S-CODERS with Tier-2 and Tier-3 talent pools'
    ],
    presentations: ['Empowering local businesses via custom mobile and web tools']
  }
];

export const INITIAL_COMMENTS = [
  {
    id: 'c-1',
    workshopId: 'w-1',
    authorName: 'Rohan Sharma',
    role: 'Full-stack Engineer',
    content: 'The n8n & Gemini session was absolutely mind-blowing. S-CODERS demonstrated real production code rather than just basic Hello Worlds. Highly recommended!',
    timestamp: '2026-06-19',
    rating: 5,
  },
  {
    id: 'c-2',
    workshopId: 'w-1',
    authorName: 'Divya Hegde',
    role: 'SaaS Founder',
    content: 'Super practical! The walkthrough on building custom WhatsApp bots for automated lead capture saved us weeks of research. Suhas is an incredible teacher.',
    timestamp: '2026-06-20',
    rating: 5,
  },
  {
    id: 'c-3',
    workshopId: 'w-2',
    authorName: 'Abhishek Gowda',
    role: 'Engineering Student, RVCE',
    content: 'Prathiksha and Manoj made React Native feel so easy. The animations section was particularly top-notch. Can\'t wait for their next bootcamp!',
    timestamp: '2026-05-11',
    rating: 5,
  },
  {
    id: 'c-4',
    workshopId: 'w-3',
    authorName: 'Kiran Paul',
    role: 'Startup Co-founder',
    content: 'We joined the hackathon with just a wireframe and left with a live React app integrated with mock payments. S-CODERS mentor support is unparalleled.',
    timestamp: '2026-04-06',
    rating: 5,
  },
];

export const FAQS = [
  {
    question: 'What technologies does S-CODERS specialize in?',
    answer: 'We specialize in advanced AI workflows (Gemini API, n8n, LangChain, Python), modern full-stack web architectures (Next.js, React, Node.js, Express, PostgreSQL), and mobile app engineering (React Native, Flutter, Firebase).',
  },
  {
    question: 'How long does a typical software development cycle take?',
    answer: 'For standard landing pages and high-end webpages, we deliver within 1–2 weeks. Full-scale mobile applications and interactive SaaS dashboards usually require 4–8 weeks, including complete UI/UX prototyping.',
  },
  {
    question: 'Do you offer post-launch maintenance and support?',
    answer: 'Yes! S-CODERS provides flexible monthly retainer programs covering continuous security audits, minor UI polish, server scaling, API updates, and performance optimizations.',
  },
  {
    question: 'How can our university or group host a technical workshop with you?',
    answer: 'You can submit an inquiry through our Contact Form below or message us directly on WhatsApp. We collaborate with student circles, Microsoft Reactors, and incubation hubs to host free and paid tech seminars.',
  },
];
