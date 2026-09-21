import { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { 
  X, Send, Bot, RefreshCw, Sparkles, MessageCircle, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: `### Welcome to S-CODERS • Bharat Tech Developers! ⚡

I am your **AI Technology & Strategic Consultant**. I can assist you with comprehensive details on:

* **About S-CODERS Startup**: Our Bengaluru roots, enterprise mission, and proven track record.
* **Services & Pricing**: AI Agents, Mobile Apps, SaaS Platforms, Custom Software & UI/UX.
* **Hands-on Workshops**: Masterclasses at Microsoft Reactor, RVCE, and eChai Ventures.
* **About Us & Story**: Our journey, architectural values, and flagship production deployments.
* **The Crew, Careers & Hiring**: Meet our founders & crew, or explore open 12-month internships.
* **Community**: Official WhatsApp groups, student chapters, and verified channels.
* **Rules & Policy**: Terms, privacy, instant digital delivery, and refund guidelines.
* **Networking & Achievements**: GOAT Founder Club, NASSCOM Startups, and TiE Bangalore.
* **Events**: 48-Hour SaaS Hackathons, demo sprints, and technical conferences.
* **Get in Touch**: Direct WhatsApp, phone lines, email, and 24-hour callback SLAs.

How can I help you today? Feel free to ask any question or tap a topic below!`,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    // Add user message
    const updatedMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: messages,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.response) {
        throw new Error(data.error || "Failed to communicate with S-CODERS agent.");
      }

      setMessages([...updatedMessages, { role: 'model', content: data.response }]);
    } catch (err: any) {
      console.warn("Using detailed local knowledge engine:", err);
      // Fallback response inside offline or unconfigured mode
      const offlineFallback = getOfflineResponse(text);
      setMessages([...updatedMessages, { role: 'model', content: offlineFallback }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Comprehensive knowledge engine covering all 10 core dimensions
  const getOfflineResponse = (query: string): string => {
    const q = query.toLowerCase().trim();

    // 1. ABOUT S-CODERS STARTUP
    if (
      q.includes('about s-coders') || 
      q.includes('about scoders') || 
      q.includes('bharat tech') || 
      q.includes('startup') || 
      q.includes('what is s-coders') || 
      q.includes('who are you') || 
      q.includes('company') ||
      q.includes('overview') ||
      q.includes('organization')
    ) {
      return `### About S-CODERS (Bharat Tech Developers)

**S-CODERS** is an elite software engineering studio, AI innovation startup, and hands-on digital developer education enterprise headquartered in **Bengaluru (Bangalore), Karnataka, India** — the technology and startup capital of India.

#### Key Corporate Profile:
* **Brand Name:** S-CODERS
* **Parent / Core Identity:** Bharat Tech Developers
* **Trade Name:** S-CODERS | **Legal Entity:** Shreyas.M
* **Headquarters:** Bengaluru, Karnataka, India
* **Website:** [www.s-coders.com](https://www.s-coders.com) | **Email:** scoders82@gmail.com
* **Core Mission:** To engineer robust software architectures, automate complex workflows with AI agents, deliver scalable mobile and web applications, and host real-world technical workshops that demystify modern technology.

#### Proven Metrics & Impact:
* **15+ Shipped Production Systems** across AI, HealthTech, EdTech, and FinTech.
* **1,200+ Developers, Students & Founders** trained through live hands-on cohorts.
* **7+ Strategic Startup Ecosystem Affiliations** (including GOAT Founder Club, NASSCOM Startups, and TiE Bangalore).
* **100% Client Satisfaction** with dedicated 24-business-hour support SLAs.`;
    }

    // 2. ABOUT SERVICES & PRICING
    if (
      q.includes('service') || 
      q.includes('pricing') || 
      q.includes('price') || 
      q.includes('cost') || 
      q.includes('budget') || 
      q.includes('charge') || 
      q.includes('offer') || 
      q.includes('develop') || 
      q.includes('build') ||
      q.includes('saas') ||
      q.includes('ai agent') ||
      q.includes('mobile app') ||
      q.includes('webpage') ||
      q.includes('spec')
    ) {
      return `### S-CODERS Core Services & Technical Solutions

We design and ship production-grade digital assets tailored to your business goals. Here are our six specialized service pillars:

1. **AI Agent & LLM Workflow Automation**
   * **Tech Stack:** Google Gemini 2.5 Flash, n8n Orchestrator, LangChain, Python, Vector DBs, WhatsApp & Slack Bots.
   * **Capabilities:** Autonomous customer triage, document intelligence pipelines, multi-step agentic workflows, and lead qualification saving up to **80% operational overhead**.
   * **Indicative Pricing:** Enterprise multi-agent systems start from **₹1,50,000 (~$1,800)**.

2. **Mobile Application Development**
   * **Tech Stack:** React Native, Flutter, TypeScript, SQLite (offline-first), Firebase, Reanimated 3, NativeWind.
   * **Capabilities:** Cross-platform iOS & Android apps with silky 60fps animations, local data caching, push notifications, and App Store publishing.
   * **Indicative Pricing:** Custom builds typically range between **₹1,00,000 and ₹1,20,000+ (~$1,200 - $1,500)**.

3. **Website & SaaS Platform Development**
   * **Tech Stack:** React 19, Next.js, Express.js, Node.js, PostgreSQL, MongoDB, Tailwind CSS, Framer Motion.
   * **Capabilities:** High-throughput corporate portals, customer billing dashboards, multi-tenant SaaS tools, and secure JWT authentication.
   * **Indicative Pricing:** SaaS engines and dynamic web applications range from **₹40,000 to ₹90,000+ (~$500 - $1,100)**.

4. **High-Performance Webpages & Landing Pages**
   * **Tech Stack:** Vite, React, Tailwind CSS, Three.js 3D elements, Framer Motion.
   * **Capabilities:** 98+ Google PageSpeed score, interactive 3D elements, scroll-driven visual storytelling, and high conversion rates.
   * **Indicative Pricing:** Custom landing experiences start from **₹15,000 to ₹25,000 (~$180 - $300)**.

5. **Custom Software Development**
   * **Tech Stack:** TypeScript, Docker Containers, Google Cloud Platform (GCP), Azure, Node.js, REST & gRPC microservices.
   * **Capabilities:** Bespoke operational backends, proprietary databases, and enterprise inventory/billing management.
   * **Indicative Pricing:** Custom enterprise architectures start from **₹1,80,000+ (~$2,200)**.

6. **UI/UX Design Studio**
   * **Tech Stack:** Figma, Design Systems, Framer Motion interactive prototyping.
   * **Capabilities:** End-to-end user journeys, accessible component libraries, and pixel-perfect developer handoff specifications.
   * **Indicative Pricing:** Comprehensive design systems start from **₹45,000 (~$550)**.

* **Interactive Specs Builder:** Use the interactive configuration tool on our website under the **Services** section to configure your scope, generate a unique tracking ID (e.g. \`SCD-XXXX-XXXX\`), and receive an instant PDF proposal!
* **Service Booking Policy:** All custom development orders have a **Strict Non-Refundable Policy** once booked, as developer hours and cloud infrastructure are provisioned immediately.`;
    }

    // 3. ABOUT WORKSHOPS & MASTERCLASSES
    if (
      q.includes('workshop') || 
      q.includes('bootcamp') || 
      q.includes('masterclass') || 
      q.includes('training') || 
      q.includes('reactor') || 
      q.includes('microsoft') || 
      q.includes('rvce') || 
      q.includes('rv college') || 
      q.includes('echai') ||
      q.includes('ticket') ||
      q.includes('learn')
    ) {
      return `### S-CODERS Hands-on Workshops & Masterclasses

S-CODERS hosts intensive, practical technical masterclasses where developers, engineering students, and startup founders build and deploy functional production code:

1. **Building Real-world AI Agents with n8n & Gemini**
   * **Venue:** Microsoft Reactor, Bangalore
   * **Format:** 2 Days (8 Hours Total) | **Audience:** 150+ software developers & founders
   * **Curriculum:** Chaining multi-agent pipelines with n8n, integrating Gemini Flash API, deploying autonomous WhatsApp & Slack bots, webhook error handling, and production deployment.
   * **Fee:** **₹1,499** (includes S-CODERS Certified AI Developer Badge & source blueprints).

2. **Full-Stack React Native Masterclass**
   * **Venue:** RV College of Engineering (RVCE), Bengaluru
   * **Format:** 3 Days (12 Hours Total) | **Audience:** 260+ engineers; 30+ prototypes pushed to GitHub in 24 hours
   * **Curriculum:** Cross-platform iOS/Android development, offline-first SQLite database architecture, 60fps animations with Reanimated 3, and Expo CLI workflows.
   * **Fee:** **₹999** (includes interactive code sandboxes and live instructor Q&A).

3. **SaaS Hackathon: Idea to MVP in 48 Hours**
   * **Venue:** eChai Ventures Hub, Bengaluru
   * **Format:** 2 Days (16-Hour Sprint) | **Audience:** 85 builders across 12 startup teams
   * **Curriculum:** Converting wireframes to full-stack MVPs with React, Node.js, PostgreSQL/Firestore, Razorpay payment integrations, and pitching live to angel investors.
   * **Fee:** **₹1,999** per team/seat.

#### Workshop Pass Delivery & Cancellation Policy:
* **Instant Digital Pass:** Upon booking, you receive a verified digital entry ticket pass with a scannable QR code via email within 5 to 10 minutes.
* **3-Day Notice Refund Rule:** Full refunds are granted **only if requested at least 3 days (72 hours)** prior to the event start time. Cancellations under 3 days cannot be refunded; however, you may transfer your seat to a colleague by emailing **scoders82@gmail.com**.`;
    }

    // 4. ABOUT US (STORY & PORTFOLIO)
    if (
      q.includes('about us') || 
      q.includes('story') || 
      q.includes('vision') || 
      q.includes('mission') || 
      q.includes('portfolio') || 
      q.includes('project') || 
      q.includes('case study') ||
      q.includes('agrosmart') ||
      q.includes('fitsync') ||
      q.includes('edvantage') ||
      q.includes('finflow')
    ) {
      return `### About Us: The S-CODERS Journey

Founded in Bengaluru by passionate software craftsmen, **S-CODERS (Bharat Tech Developers)** was created to eliminate the gap between high-level theoretical AI and real-world business execution. 

#### Our Core Architectural Values:
* **Customer-Centric Innovation:** We engineer software that directly solves commercial challenges and delivers quantifiable return on investment.
* **Speed & Craftsmanship:** We deploy at rapid startup speed while enforcing clean code standards, rigorous type safety, and silky-smooth micro-interactions.
* **Empowering Through Education:** Demystifying modern frameworks and AI models through live developer cohorts and student mentoring.
* **Collaborative Excellence:** Extreme ownership, transparent communication, and shared leadership.

#### Flagship Production Projects:
1. **AgroSmart AI:** An intelligent mobile platform for Karnataka farmers that detects agricultural crop diseases via real-time camera feeds, with vernacular Kannada language support.
2. **FitSync Pro:** An interactive cross-platform fitness tracker featuring real-time trainer dashboards and biometric progression curves.
3. **EdVantage LMS:** An enterprise learning management suite with AI-generated lecture summaries, mock exam suites, and automated grading pipelines.
4. **FinFlow SaaS Engine:** A dynamic invoicing, client portal, and split-payment management dashboard for creative studios and agencies.`;
    }

    // 5. THE CREW, CAREERS & HIRING
    if (
      q.includes('crew') || 
      q.includes('team') || 
      q.includes('founder') || 
      q.includes('ceo') || 
      q.includes('shreyas') || 
      q.includes('lokesh') || 
      q.includes('bhuvan') || 
      q.includes('prathiksha') || 
      q.includes('manoj') || 
      q.includes('aishwarya') || 
      q.includes('career') || 
      q.includes('careers') || 
      q.includes('hiring') || 
      q.includes('hire') || 
      q.includes('job') || 
      q.includes('intern') || 
      q.includes('stipend')
    ) {
      return `### The S-CODERS Crew, Careers & Hiring

#### Executive Leadership:
* **Shreyas M. — Founder & CEO:**
  AI Engineer, Full-Stack Developer, and Product Visionary. Oversees company strategy, architects AI agent pipelines, builds cross-platform mobile apps, and leads product innovation at Bharat Tech Developers. *(Direct WhatsApp/Call: +91 8310463417)*.
* **Lokesh A. — Co-Founder:**
  Vibe Coder, AI-assisted developer, and rapid prototyping specialist. Focuses on turning ideas into functional software, smart automations, and practical digital products.
* **Bhuvan M. — Tech Lead:**
  Full-Stack Web Developer, UI/UX Architect, and Digital Product Builder. Solely designed and developed the entire S-CODERS digital platform, web motion architecture, and responsive frontend systems. *(Direct WhatsApp/Call: +91 6363905989)*.

#### Core Engineering & Design Crew:
* **Prathiksha R — Head of UI/UX:** Design systems lead specializing in pixel-perfect Figma wireframes, accessible component libraries, and Framer Motion micro-interactions.
* **Manoj Kumar — Lead Full-Stack Developer:** Architect of scalable backend systems, PostgreSQL schemas, Firebase integration, and high-performance React Native mobile apps.
* **Aishwarya Shenoy — AI Automation & Workshop Lead:** n8n workflow specialist and developer educator bridging client operational needs with automated AI agents.

#### Careers & Hiring Program:
We are actively hiring passionate developers and designers across **6 Core Sectors**:
1. **AI & Automation Engineering** (AI Agent & LLM Workflow Engineer, Prompt Engineer, n8n Specialist)
2. **Frontend Engineering** (React 19, Next.js, TypeScript, Tailwind CSS, Motion)
3. **Backend & AI Systems** (Node.js, Express, Python FastAPI, PostgreSQL, Redis)
4. **Mobile Application Development** (React Native, Flutter, SQLite)
5. **UI/UX Design & Motion Architecture** (Figma, Design Systems, UX Research)
6. **Technical Workshop Instructor & Developer Advocate**

* **Terms & Benefits:** Structured 12-Month Internship / Induction Agreement, performance-based stipend up to **₹20,000/month**, comprehensive Non-Disclosure Agreement (NDA), and genuine hands-on production ownership.
* **How to Apply:** Submit your portfolio, GitHub profile, and resume directly through our **Careers portal** on the website!`;
    }

    // 6. COMMUNITY
    if (
      q.includes('community') || 
      q.includes('whatsapp') || 
      q.includes('group') || 
      q.includes('social') || 
      q.includes('youtube') || 
      q.includes('instagram') || 
      q.includes('twitter') || 
      q.includes('linkedin')
    ) {
      return `### S-CODERS Community & Networks

Join our active community of 1,200+ developers, startup founders, and software engineers:

#### Official WhatsApp Groups:
* **Service WhatsApp Community:** [Join Service Group](https://chat.whatsapp.com/CgksCDeW7LnINcEvGwn7kK) — Connect with clients, tech collaborators, and founders.
* **Customer Care Support WhatsApp:** [Join Support Group](https://chat.whatsapp.com/Dp1kVXukz0B3KXQq3FTuId?s=cl&p=a&mlu=4) — Immediate support, event ticket verifications, and technical queries.

#### Verified Social Media Channels:
* **YouTube:** [@S-CODERS](https://www.youtube.com/@S-CODERS) — Video tutorials, live coding streams, and event highlights.
* **Instagram:** [@scoders2025](https://www.instagram.com/scoders2025?igsh=Ym1jcG01czR1MHdj) — Behind-the-scenes, workshop highlights, and tech tips.
* **Twitter / X:** [@SCODERSozws](https://x.com/SCODERSozws) — Tech announcements, AI agent teardowns, and industry discussions.
* **LinkedIn:** [S-CODERS Company Page](https://linkedin.com/company/scoders) — Corporate updates, partnership announcements, and hiring alerts.

#### Student Chapters:
We support vibrant student developer circles across engineering institutions in Karnataka (including RV College of Engineering) with access to hackathon mentors and open-source project code.`;
    }

    // 7. RULES AND POLICY
    if (
      q.includes('rule') || 
      q.includes('policy') || 
      q.includes('policies') || 
      q.includes('terms') || 
      q.includes('privacy') || 
      q.includes('refund') || 
      q.includes('cancellation') || 
      q.includes('shipping') || 
      q.includes('delivery') || 
      q.includes('payment fail') || 
      q.includes('failed') || 
      q.includes('ticket delete') ||
      q.includes('dispute')
    ) {
      return `### S-CODERS Rules, Policies & Legal Guidelines

S-CODERS operates with complete transparency in compliance with the laws of India (jurisdiction in Bengaluru, Karnataka):

1. **Terms & Conditions:**
   * All digital assets, source code blueprints, and course materials are licensed strictly for personal or agreed internal business use.
   * Unauthorized resale, redistribution, or white-labeling of S-CODERS assets without explicit written consent is strictly prohibited.

2. **Privacy Policy:**
   * We collect minimal necessary information (name, email, phone) strictly to fulfill service orders and send workshop credentials.
   * All transactions are processed through certified, bank-grade encrypted gateways (Razorpay, UPI). S-CODERS never stores or views credit card numbers, CVVs, or banking PINs.

3. **Return & Refund Policy:**
   * **Custom Software & Services:** **STRICT NO REFUND POLICY** once an order or deposit is confirmed, as engineering hours and cloud infrastructure are dedicated immediately.
   * **Workshops & Events:** **3-Day Notice Rule** (72 hours prior) grants a 100% refund. Cancellations made less than 3 days prior to the session start time will **not** be refunded under any circumstances (though participants may transfer their seat to another person).

4. **Payment Failures & Responsibility Guidelines:**
   * **Case 1 (Amount debited on your bank/UPI app, but NOT received by S-CODERS):** This is the customer's and their issuing bank's responsibility. S-CODERS cannot issue refunds or grant access for funds not settled in our merchant account. Customers must contact their UPI provider or bank with their UTR number for an auto-reversal.
   * **Case 2 (Technical checkout failure on the S-CODERS website itself):** S-CODERS takes 100% full responsibility. Our support team verifies the error and manually issues the ticket pass or service confirmation within 24 hours.

5. **Ticket Management Clause:**
   * If a participant mistakenly or purposely deletes their ticket pass from their self-service dashboard, it is their sole responsibility. The QR validation record is removed from the local keychain upon deletion.

6. **Instant Electronic Delivery Policy:**
   * All digital goods, source codes, and workshop entry passes are delivered electronically via email within **5 to 15 minutes** of payment. There are zero physical shipping fees.`;
    }

    // 8. NETWORKING AND ACHIEVEMENTS
    if (
      q.includes('network') || 
      q.includes('achievement') || 
      q.includes('partner') || 
      q.includes('ecosystem') || 
      q.includes('goat') || 
      q.includes('nasscom') || 
      q.includes('tie') || 
      q.includes('startup grind') || 
      q.includes('award') ||
      q.includes('milestone')
    ) {
      return `### S-CODERS Networking & Ecosystem Achievements

S-CODERS is actively integrated into Bengaluru's premier startup and technology ecosystems:

* **GOAT Founder Club:** Inducted into Bengaluru’s elite community of high-performing founders. S-CODERS showcased autonomous AI multi-agent architectures to 20+ VC partners.
* **NASSCOM Startups:** Associated with India’s apex IT council for startup incubation, corporate procurement connections, and national software showcases.
* **TiE Bangalore:** Engaged in 1-on-1 mentorship circles with industry stalwarts on intellectual property, scaling, and enterprise sales.
* **eChai Ventures:** Frequent demo leads and panel speakers presenting fast MVP shipping blueprints and n8n automations.
* **Startup Grind Bangalore (Powered by Google for Startups):** Active network participant connecting with international software leaders and early tech adopters.
* **Microsoft Reactor, Bangalore:** Official workshop host venue, collaborating on Azure AI and LLM cloud architectures.
* **Startup Karnataka:** Participating in state-backed technology sandbox programs and innovation grant reviews.

#### Track Record:
* **15+ High-Fidelity Custom Projects** delivered on time and within budget.
* **1,200+ Developers and Founders** upskilled through live technical masterclasses.`;
    }

    // 9. EVENTS
    if (
      q.includes('event') || 
      q.includes('events') || 
      q.includes('hackathon') || 
      q.includes('summit') || 
      q.includes('meetup') || 
      q.includes('conference')
    ) {
      return `### S-CODERS Events & Hackathons

We regularly host and participate in premier technical events across Bengaluru:

1. **48-Hour SaaS Hackathons:**
   * Rapid MVP building sprints hosted at eChai Ventures Hub where founders turn wireframes into functional MVPs and pitch live to angel investors.
2. **Microsoft Reactor AI Developer Summits:**
   * Deep-dive architectural sessions on n8n workflow automation, vector databases, and Google Gemini API integration.
3. **Campus Developer Sprints:**
   * Hands-on 3-day hackathons at premier engineering colleges (such as RVCE), guiding hundreds of students from blank repositories to working mobile apps.
4. **Interactive Sandbox Sessions:**
   * Live coding sessions with open Q&A, repository templates, and verifiable digital certificate badges for all attendees.

* Check out the **Workshops** section on our website to view upcoming events and register for your digital entry pass!`;
    }

    // 10. GET IN TOUCH
    if (
      q.includes('get in touch') || 
      q.includes('contact') || 
      q.includes('phone') || 
      q.includes('call') || 
      q.includes('email') || 
      q.includes('address') || 
      q.includes('location') || 
      q.includes('reach') || 
      q.includes('support') ||
      q.includes('enquiry') ||
      q.includes('talk')
    ) {
      return `### Get in Touch with S-CODERS (Bharat Tech Developers)

We would love to discuss your next breakthrough project or workshop collaboration:

* **Official Email:** [scoders82@gmail.com](mailto:scoders82@gmail.com)
* **Location:** Bengaluru (Bangalore), Karnataka, India

#### Direct Leadership Contact:
* **Bhuvan M. (Tech Lead):**
  * Phone / Call: **+91 6363905989**
  * Direct WhatsApp: [Chat with Bhuvan](https://wa.me/916363905989)
* **Shreyas M. (Founder & CEO):**
  * Phone / Call: **+91 8310463417**
  * Direct WhatsApp: [Chat with Shreyas](https://wa.me/918310463417)

#### Official Communities & Support:
* **Service WhatsApp Group:** [Join Service Community](https://chat.whatsapp.com/CgksCDeW7LnINcEvGwn7kK)
* **Customer Care Support:** [Join Customer Care WhatsApp](https://chat.whatsapp.com/Dp1kVXukz0B3KXQq3FTuId?s=cl&p=a&mlu=4)

#### Response Commitment:
All project inquiries submitted through our website contact form receive a dedicated response from our engineering leadership within **24 business hours**.`;
    }

    // Default rich fallback response
    return `### S-CODERS (Bharat Tech Developers) • Executive Overview

Thank you for your question! **S-CODERS** is a premier software engineering studio and AI startup based in **Bengaluru, Karnataka, India**.

I can provide comprehensive, detailed information on any of the following topics:

1. **About S-CODERS Startup:** Our Bengaluru headquarters, legal identity, and mission.
2. **Services & Pricing:** AI Agent Workflows, Mobile Apps, SaaS Platforms, Custom Software & UI/UX.
3. **Workshops & Masterclasses:** Hands-on developer cohorts at Microsoft Reactor, RVCE, and eChai.
4. **About Us:** Our founding story, architectural values, and flagship project portfolio.
5. **The Crew, Careers & Hiring:** Founders Shreyas M., Lokesh A., Bhuvan M., and 12-month internships.
6. **Community:** Official WhatsApp groups and verified social channels.
7. **Rules & Policy:** Terms, privacy, instant digital delivery, and refund guidelines.
8. **Networking & Achievements:** GOAT Founder Club, NASSCOM Startups, and TiE Bangalore affiliations.
9. **Events:** 48-Hour SaaS Hackathons and developer masterclasses.
10. **Get in Touch:** Direct WhatsApp (+91 6363905989 / +91 8310463417) and email (*scoders82@gmail.com*).

Please let me know which of these topics you would like to explore in detail, or feel free to type your specific question!`;
  };

  // Pre-scripted questions covering the 10 requested areas
  const suggestedQuestions = [
    "About S-CODERS startup",
    "About services & pricing",
    "About workshops & masterclasses",
    "About us & our story",
    "The crew & hiring opportunities",
    "Community & WhatsApp groups",
    "Rules & refund policy",
    "Networking & achievements",
    "Upcoming events & hackathons",
    "Get in touch & contact details",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm"
        >
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative w-full max-w-2xl h-[88vh] max-h-[720px] bg-brand-card/98 border border-white/10 rounded-2xl shadow-2xl flex flex-col z-10 overflow-hidden backdrop-blur-xl"
          >
            {/* Header branding */}
            <div className="p-4 bg-brand-dark/90 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand-teal/10 rounded-xl text-brand-teal border border-brand-teal/20 animate-pulse">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-mono text-brand-teal uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <span>S-CODERS Consultant AI</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-teal/10 text-brand-teal border border-brand-teal/20">Bharat Tech</span>
                  </div>
                  <div className="text-[11px] text-gray-400 font-sans">Official S-CODERS Knowledge & Solutions Agent</div>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                title="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat workspace area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 max-w-[92%] ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Visual icon for model */}
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-brand-teal" />
                    </div>
                  )}
                  
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm font-sans leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-teal text-brand-dark rounded-br-none font-medium whitespace-pre-line shadow-md'
                        : 'bg-white/5 text-gray-200 border border-white/10 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {msg.role === 'model' ? (
                      <div className="markdown-body space-y-3 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_strong]:text-brand-teal [&_strong]:font-semibold [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-white [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-white [&_h4]:text-xs [&_h4]:font-bold [&_h4]:text-brand-teal [&_h4]:uppercase [&_h4]:tracking-wider [&_a]:text-brand-teal [&_a]:underline hover:[&_a]:text-white [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:bg-white/10 [&_code]:rounded [&_code]:text-brand-teal [&_code]:font-mono">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {/* Spinner loading logic */}
              {isLoading && (
                <div className="flex gap-3 max-w-[80%] mr-auto">
                  <div className="w-8 h-8 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-bold flex items-center justify-center shrink-0 animate-spin">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl rounded-bl-none text-xs text-gray-400 font-sans flex items-center gap-2">
                    <span>Synthesizing comprehensive S-CODERS technical intelligence</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messageEndRef} />
            </div>

            {/* Suggested Prompts Grid */}
            {messages.length === 1 && !isLoading && (
              <div className="px-4 py-3 border-t border-white/5 bg-brand-dark/40 space-y-2">
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-brand-teal" />
                  <span>Explore Key Topics:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(q)}
                      className="text-left px-2.5 py-1.5 bg-white/5 border border-white/5 hover:border-brand-teal/30 text-[11px] text-gray-300 rounded-lg font-sans transition-all hover:bg-brand-teal/10 hover:text-white text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form input messaging controls */}
            <div className="p-4 bg-brand-dark/90 border-t border-white/5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about S-CODERS startup, services, workshops, crew, policies..."
                  className="flex-1 bg-brand-card border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-3 bg-brand-teal hover:bg-white text-brand-dark rounded-xl transition-all duration-300 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

