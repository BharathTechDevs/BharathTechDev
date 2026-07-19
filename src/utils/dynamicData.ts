import { Service, WorkshopEvent, ServiceEnquiry, GeneralMessage, NetworkingAchievement } from '../types';
import { SERVICES, WORKSHOP_EVENTS } from '../data';

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
  const saved = localStorage.getItem('scoders_dynamic_services');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return SERVICES;
}

export function saveDynamicServices(services: Service[]): void {
  localStorage.setItem('scoders_dynamic_services', JSON.stringify(services));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('scoders_db_change'));
    window.dispatchEvent(new Event('scoders_data_change'));
  }
}

export function getDynamicWorkshops(): WorkshopEvent[] {
  const saved = localStorage.getItem('scoders_dynamic_workshops');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return WORKSHOP_EVENTS;
}

export function saveDynamicWorkshops(workshops: WorkshopEvent[]): void {
  localStorage.setItem('scoders_dynamic_workshops', JSON.stringify(workshops));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('scoders_db_change'));
    window.dispatchEvent(new Event('scoders_data_change'));
  }
}

export function getDynamicInvoices(): DynamicInvoice[] {
  const saved = localStorage.getItem('scoders_dynamic_invoices');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return DEFAULT_INVOICES;
}

export function saveDynamicInvoices(invoices: DynamicInvoice[]): void {
  localStorage.setItem('scoders_dynamic_invoices', JSON.stringify(invoices));
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
    location: 'Koramangala Innovators Hub, Bengaluru',
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
  const saved = localStorage.getItem('scoders_dynamic_networking');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return DEFAULT_NETWORKING_ACHIEVEMENTS;
}

export function saveDynamicNetworking(items: NetworkingAchievement[]): void {
  localStorage.setItem('scoders_dynamic_networking', JSON.stringify(items));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('scoders_db_change'));
  }
}

