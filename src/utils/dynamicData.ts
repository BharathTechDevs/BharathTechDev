import { Service, WorkshopEvent, NetworkingAchievement, SCODERSEvent, EventTicket } from '../types';
import { SERVICES, WORKSHOP_EVENTS } from '../data';

const DEFAULT_SCODERS_EVENTS: SCODERSEvent[] = [
  {
    id: 'evt-ai-hackathon-2026',
    name: 'S-CODERS AI Agent Builder Hackathon 2026',
    bannerImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200&h=600',
    date: 'August 28, 2026',
    day: 'Friday',
    time: '09:30 AM - 06:30 PM IST',
    location: 'Microsoft Reactor & S-CODERS Lab, Koramangala, Bengaluru',
    description: 'An elite 1-day immersive hackathon bringing together 150+ engineers, founders, and AI architects. Participants will build multi-agent n8n workflows, deploy full-stack Gemini applets, and pitch live to regional venture capitalists and angel networks. Mentored directly by S-CODERS leadership team.',
    category: 'hackathon',
    ticketPrice: 499,
    status: 'upcoming',
    featured: true,
    eventPhotos: [
      {
        id: 'p-1',
        caption: 'Main Auditorium Keynote & Briefing',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800&h=500',
        category: 'venue'
      },
      {
        id: 'p-2',
        caption: 'Developers Hacking on Gemini Multi-Agent Workflows',
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800&h=500',
        category: 'activities'
      },
      {
        id: 'p-3',
        caption: 'Mentorship Session with S-CODERS Tech Lead',
        imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800&h=500',
        category: 'speakers'
      },
      {
        id: 'p-4',
        caption: 'Live Pitching & Project Demo Panel',
        imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800&h=500',
        category: 'highlights'
      }
    ]
  },
  {
    id: 'evt-founder-meetup-14',
    name: 'Bengaluru Founder & Tech Meetup (Edition #14)',
    bannerImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200&h=600',
    date: 'September 12, 2026',
    day: 'Saturday',
    time: '04:00 PM - 08:00 PM IST',
    location: 'NASSCOM Startup Warehouse, HSR Layout, Bengaluru',
    description: 'An exclusive networking summit connecting early-stage tech founders, angel investors, and full-stack software engineers. Features keynotes on SaaS unit economics, n8n pipeline integration, and fundraising strategies for Indian tech startups.',
    category: 'founder',
    ticketPrice: 299,
    status: 'upcoming',
    featured: true,
    eventPhotos: [
      {
        id: 'pf-1',
        caption: 'Founder Fireside Chat & Q&A',
        imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800&h=500',
        category: 'speakers'
      },
      {
        id: 'pf-2',
        caption: 'Networking Dinner & Peer Discussions',
        imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800&h=500',
        category: 'activities'
      }
    ]
  },
  {
    id: 'evt-dev-llm-masterclass',
    name: 'Global Developer & LLM Orchestration Summit',
    bannerImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200&h=600',
    date: 'September 25, 2026',
    day: 'Friday',
    time: '02:00 PM - 06:00 PM IST',
    location: 'S-CODERS Live Virtual Stage & Zoom Auditorium',
    description: 'A hands-on technical masterclass focused on enterprise RAG architecture, function calling APIs, and automated agent orchestrators using React, Node.js, and Google Gemini SDKs.',
    category: 'developer',
    ticketPrice: 199,
    status: 'upcoming',
    featured: false,
    eventPhotos: [
      {
        id: 'pd-1',
        caption: 'Virtual Live Stream Studio Stage',
        imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&q=80&w=800&h=500',
        category: 'venue'
      }
    ]
  },
  {
    id: 'evt-tech-awards-2026',
    name: 'S-CODERS Annual Tech Summit & Community Awards',
    bannerImage: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=1200&h=600',
    date: 'July 15, 2026',
    day: 'Wednesday',
    time: '10:00 AM - 05:00 PM IST',
    location: 'Jnana Jyothi Auditorium, Central Bengaluru',
    description: 'Our annual grand gathering celebrating developer innovation across India, presenting startup excellence awards, and launching new open-source automation toolkits.',
    category: 'community',
    ticketPrice: 0,
    status: 'completed',
    featured: false,
    eventPhotos: [
      {
        id: 'pa-1',
        caption: 'Awards Ceremony & Winner Presentations',
        imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800&h=500',
        category: 'highlights'
      },
      {
        id: 'pa-2',
        caption: 'Community Group Photograph',
        imageUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80&w=800&h=500',
        category: 'participants'
      }
    ]
  }
];

export function getDynamicEvents(): SCODERSEvent[] {
  try {
    const saved = localStorage.getItem('scoders_dynamic_events');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading dynamic events:', e);
  }
  return DEFAULT_SCODERS_EVENTS;
}

export function saveDynamicEvents(events: SCODERSEvent[]): void {
  try {
    localStorage.setItem('scoders_dynamic_events', JSON.stringify(events));
  } catch (e) {
    console.error('Error saving dynamic events:', e);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('scoders_db_change'));
  }
}

export function getEventTickets(): EventTicket[] {
  try {
    const saved = localStorage.getItem('scoders_event_tickets');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading event tickets:', e);
  }
  return [];
}

export function saveEventTickets(tickets: EventTicket[]): void {
  try {
    localStorage.setItem('scoders_event_tickets', JSON.stringify(tickets));
  } catch (e) {
    console.error('Error saving event tickets:', e);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('scoders_db_change'));
  }
}

export interface DynamicInvoice {
  id: string;
  client: string;
  contact: string;
  purpose: string;
  amount: number;
  currency: 'INR' | 'USD';
  dueBy: string;
}

const DEFAULT_INVOICES: DynamicInvoice[] = [
  {
    id: 'INV-2026-001',
    client: 'AgroSmart AI Corp',
    contact: 'contact@agrosmart.in',
    purpose: 'AgroSmart Crop Diagnosis Phase 1 Deposit',
    amount: 25000,
    currency: 'INR',
    dueBy: 'July 25, 2026'
  },
  {
    id: 'INV-2026-002',
    client: 'EdVantage LMS Group',
    contact: 'billing@edvantage.edu',
    purpose: 'EdVantage Custom LMS deployment Milestone 2',
    amount: 1500,
    currency: 'USD',
    dueBy: 'July 18, 2026'
  }
];

export function getDynamicServices(): Service[] {
  try {
    const saved = localStorage.getItem('scoders_dynamic_services');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading dynamic services:', e);
  }
  return SERVICES;
}

export function saveDynamicServices(services: Service[]): void {
  try {
    localStorage.setItem('scoders_dynamic_services', JSON.stringify(services));
  } catch (e) {
    console.error('Error saving dynamic services:', e);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('scoders_db_change'));
    window.dispatchEvent(new Event('scoders_data_change'));
  }
}

export function getDynamicWorkshops(): WorkshopEvent[] {
  try {
    const saved = localStorage.getItem('scoders_dynamic_workshops');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading dynamic workshops:', e);
  }
  return WORKSHOP_EVENTS;
}

export function saveDynamicWorkshops(workshops: WorkshopEvent[]): void {
  try {
    localStorage.setItem('scoders_dynamic_workshops', JSON.stringify(workshops));
  } catch (e) {
    console.error('Error saving dynamic workshops:', e);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('scoders_db_change'));
    window.dispatchEvent(new Event('scoders_data_change'));
  }
}

export function getDynamicInvoices(): DynamicInvoice[] {
  try {
    const saved = localStorage.getItem('scoders_dynamic_invoices');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading dynamic invoices:', e);
  }
  return DEFAULT_INVOICES;
}

export function saveDynamicInvoices(invoices: DynamicInvoice[]): void {
  try {
    localStorage.setItem('scoders_dynamic_invoices', JSON.stringify(invoices));
  } catch (e) {
    console.error('Error saving dynamic invoices:', e);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('scoders_db_change'));
    window.dispatchEvent(new Event('scoders_data_change'));
  }
}

const DEFAULT_NETWORKING_ACHIEVEMENTS: NetworkingAchievement[] = [
  {
    id: 'net-1',
    title: 'Generative AI Hackathon Showcase',
    eventDate: 'June 25, 2026',
    type: 'conducted',
    location: 'Bengaluru Tech Hub, Bengaluru',
    description: 'Suhas Gowda demonstrating autonomous AI pipelines using the Gemini 3.5 Flash model during our weekly developers breakout session.',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800&h=500',
    attendeesCount: 120,
    tags: ['AI Hackathon', 'Gemini', 'S-CODERS Tech'],
    featured: true
  },
  {
    id: 'net-2',
    title: 'NASSCOM Product Conclave 2026',
    eventDate: 'July 02, 2026',
    type: 'attended',
    location: 'Taj Yashwantpur, Bengaluru',
    description: 'Our co-founder Prathiksha R engaging in an immersive panel Q&A session regarding SaaS scaling architectures in South Asia.',
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800&h=500',
    attendeesCount: 500,
    tags: ['NASSCOM', 'SaaS Scaling', 'Networking'],
    featured: true
  },
  {
    id: 'net-3',
    title: 'Zero-To-MVP n8n Workshop',
    eventDate: 'June 12, 2026',
    type: 'conducted',
    location: 'Microsoft Reactor, Bengaluru',
    description: 'Aishwarya Shenoy guiding over 80+ builders to automate their marketing funnels using S-CODERS custom n8n presets.',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800&h=500',
    attendeesCount: 85,
    tags: ['n8n', 'No-code Automation', 'Bootcamp'],
    featured: false
  },
  {
    id: 'net-4',
    title: 'eChai Startup Demo Night',
    eventDate: 'May 28, 2026',
    type: 'attended',
    location: 'BHIVE HSR Layout, Bengaluru',
    description: 'Suhas Gowda presenting our custom-built client-ready multi-agent pipeline to early-stage SaaS angel investors.',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800&h=500',
    attendeesCount: 110,
    tags: ['eChai Demo Day', 'Investor Pitch', 'Live Feedback'],
    featured: false
  }
];

export function getDynamicNetworking(): NetworkingAchievement[] {
  try {
    const saved = localStorage.getItem('scoders_dynamic_networking');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading dynamic networking:', e);
  }
  return DEFAULT_NETWORKING_ACHIEVEMENTS;
}

export function saveDynamicNetworking(items: NetworkingAchievement[]): void {
  try {
    localStorage.setItem('scoders_dynamic_networking', JSON.stringify(items));
  } catch (e) {
    console.error('Error saving dynamic networking:', e);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('scoders_db_change'));
  }
}
