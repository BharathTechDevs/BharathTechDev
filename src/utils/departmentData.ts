import { DepartmentConfig, DepartmentMeeting } from '../types';

export const DEFAULT_MAIN_WHATSAPP_COMMUNITY = 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q';

export const OFFICIAL_DEPARTMENT_WHATSAPP_LINK = 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q';

export const DEFAULT_DEPARTMENTS: DepartmentConfig[] = [
  {
    id: 'frontend',
    name: 'Front-End Developer',
    codePrefix: 'GHZ',
    referenceFormat: 'GHZ-2026-XXX',
    whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
    zoomMeetingLink: 'https://zoom.us/j/scoders-frontend-work',
    description: 'Modern React 19, TypeScript, Tailwind CSS, motion design, and responsive web user interfaces.'
  },
  {
    id: 'backend',
    name: 'Back-End Developer',
    codePrefix: 'HAX',
    referenceFormat: 'HAX-2026-XXX',
    whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
    zoomMeetingLink: 'https://zoom.us/j/scoders-backend-work',
    description: 'Server architectures, Node.js, Express, PostgreSQL, Redis caching, gRPC, and REST API microservices.'
  },
  {
    id: 'fullstack',
    name: 'Full-Stack Developer',
    codePrefix: 'FSD',
    referenceFormat: 'FSD-2026-XXX',
    whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
    zoomMeetingLink: 'https://zoom.us/j/scoders-fullstack-work',
    description: 'End-to-end full stack web applications, Next.js, MERN systems, database schemas, and cloud deployment.'
  },
  {
    id: 'video_editor',
    name: 'Video Editor',
    codePrefix: 'KAG',
    referenceFormat: 'KAG-2026-XXX',
    whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
    zoomMeetingLink: 'https://zoom.us/j/scoders-video-editing-work',
    description: 'High-production tech product trailers, YouTube long-form, social reels, motion graphics, and color grading.'
  },
  {
    id: 'content_writer',
    name: 'Content Writer',
    codePrefix: 'CTW',
    referenceFormat: 'CTW-2026-XXX',
    whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
    zoomMeetingLink: 'https://zoom.us/j/scoders-content-writing-work',
    description: 'Technical whitepapers, developer documentation, API tutorials, and architectural engineering blogs.'
  },
  {
    id: 'content_creator',
    name: 'Content Creator',
    codePrefix: 'CCR',
    referenceFormat: 'CCR-2026-XXX',
    whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
    zoomMeetingLink: 'https://zoom.us/j/scoders-content-creators-work',
    description: 'Developer advocacy, tech shorts, podcast production, live coding demos, and social storytelling.'
  },
  {
    id: 'ui_ux_designer',
    name: 'UI/UX Designer',
    codePrefix: 'UIX',
    referenceFormat: 'UIX-2026-XXX',
    whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
    zoomMeetingLink: 'https://zoom.us/j/scoders-uiux-design-work',
    description: 'Figma design systems, responsive wireframes, design tokens, micro-interactions, and design-to-code pipelines.'
  },
  {
    id: 'digital_marketing',
    name: 'Digital Marketing',
    codePrefix: 'MKT',
    referenceFormat: 'MKT-2026-XXX',
    whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
    zoomMeetingLink: 'https://zoom.us/j/scoders-digital-marketing-work',
    description: 'Performance growth, dev community acquisition, SEO strategies, paid funnels, and marketing analytics.'
  },
  {
    id: 'software_developer',
    name: 'Software Developer',
    codePrefix: 'SDE',
    referenceFormat: 'SDE-2026-XXX',
    whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
    zoomMeetingLink: 'https://zoom.us/j/scoders-software-devs-work',
    description: 'Core platform algorithms, CLI tools, systems programming, and high-performance automation utilities.'
  },
  {
    id: 'documentation',
    name: 'Documentation',
    codePrefix: 'DOC',
    referenceFormat: 'DOC-2026-XXX',
    whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
    zoomMeetingLink: 'https://zoom.us/j/scoders-documentation-work',
    description: 'Software specifications, system architecture diagrams, onboarding manuals, and knowledge bases.'
  },
  {
    id: 'event_management',
    name: 'Event Management',
    codePrefix: 'EVM',
    referenceFormat: 'EVM-2026-XXX',
    whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
    zoomMeetingLink: 'https://zoom.us/j/scoders-event-management-work',
    description: 'Developer hackathons, tech workshops, campus partnerships, speaker curation, and logistics.'
  }
];

export const DEFAULT_DEPARTMENT_MEETINGS: DepartmentMeeting[] = [
  {
    id: 'meet-fe-01',
    department: 'Front-End Developer',
    topic: 'Front-End Sprint: UI Design System & Component Library',
    instructions: 'Interactive screen sharing session to review React 19 component tokens, Tailwind utility structures, and responsive layouts. Please have your local dev server running.',
    meetingDate: '2026-09-28',
    meetingTime: '04:30 PM IST',
    zoomLink: 'https://zoom.us/j/scoders-frontend-work',
    status: 'Upcoming',
    createdAt: new Date().toISOString()
  },
  {
    id: 'meet-be-02',
    department: 'Back-End Developer',
    topic: 'Back-End Architecture: API Endpoints & PostgreSQL Connection Pool',
    instructions: 'Live architectural review covering database queries, transaction rollbacks, and webhook security. Active discussions and code walkthrough.',
    meetingDate: '2026-09-29',
    meetingTime: '05:00 PM IST',
    zoomLink: 'https://zoom.us/j/scoders-backend-work',
    status: 'Upcoming',
    createdAt: new Date().toISOString()
  },
  {
    id: 'meet-fsd-03',
    department: 'Full-Stack Developer',
    topic: 'Full-Stack End-to-End Feature Deployment & Integration',
    instructions: 'Live debugging, state synchronization, and Docker deployment test. Screen sharing enabled for all verified developers.',
    meetingDate: '2026-09-30',
    meetingTime: '06:00 PM IST',
    zoomLink: 'https://zoom.us/j/scoders-fullstack-work',
    status: 'Upcoming',
    createdAt: new Date().toISOString()
  },
  {
    id: 'meet-vid-04',
    department: 'Video Editor',
    topic: 'Video Editing & Motion Graphics Workshop',
    instructions: 'Review 4K rendering timelines, Premiere Pro/DaVinci presets, and audio ducking. We will screen share the latest tech promo cut.',
    meetingDate: '2026-09-28',
    meetingTime: '03:00 PM IST',
    zoomLink: 'https://zoom.us/j/scoders-video-editing-work',
    status: 'Upcoming',
    createdAt: new Date().toISOString()
  },
  {
    id: 'meet-ctw-05',
    department: 'Content Writer',
    topic: 'Editorial Review: Tech Articles & Developer Documentation',
    instructions: 'Content review and tone-of-voice alignment for tech blogs and onboarding documentation. Bring your draft outlines.',
    meetingDate: '2026-09-29',
    meetingTime: '11:30 AM IST',
    zoomLink: 'https://zoom.us/j/scoders-content-writing-work',
    status: 'Upcoming',
    createdAt: new Date().toISOString()
  }
];

// Department prefix lookup
export function getDepartmentPrefix(deptName: string): string {
  const normalized = deptName.toLowerCase().trim();
  const match = DEFAULT_DEPARTMENTS.find(
    d => d.name.toLowerCase() === normalized || d.id.toLowerCase() === normalized
  );
  if (match) return match.codePrefix;

  if (normalized.includes('front')) return 'GHZ';
  if (normalized.includes('back')) return 'HAX';
  if (normalized.includes('full') || normalized.includes('mern')) return 'FSD';
  if (normalized.includes('video') || normalized.includes('edit')) return 'KAG';
  if (normalized.includes('writer') || normalized.includes('writing')) return 'CTW';
  if (normalized.includes('creator') || normalized.includes('social')) return 'CCR';
  if (normalized.includes('ui') || normalized.includes('ux') || normalized.includes('design')) return 'UIX';
  if (normalized.includes('market') || normalized.includes('growth')) return 'MKT';
  if (normalized.includes('soft') || normalized.includes('sde') || normalized.includes('engineer')) return 'SDE';
  if (normalized.includes('doc') || normalized.includes('technical write')) return 'DOC';
  if (normalized.includes('event') || normalized.includes('workshop')) return 'EVM';

  // Fallback 3 letters
  const cleaned = deptName.replace(/[^A-Za-z]/g, '').toUpperCase();
  return cleaned.substring(0, 3) || 'SCD';
}

// Generate guaranteed unique department reference ID: <PREFIX>-2026-<XXX>
export function generateDepartmentReferenceId(deptName: string, existingReferenceIds: string[] = []): string {
  const prefix = getDepartmentPrefix(deptName);
  const existingSet = new Set(existingReferenceIds.map(id => (id || '').toUpperCase().trim()));

  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  // Try letter + 2 digits (e.g. A17, B42, C89, A21, D56)
  for (let attempt = 0; attempt < 500; attempt++) {
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const num = Math.floor(10 + Math.random() * 90); // 10 to 99
    const suffix = `${letter}${num}`;
    const candidateId = `${prefix}-2026-${suffix}`;
    if (!existingSet.has(candidateId)) {
      return candidateId;
    }
  }

  // Fallback high entropy 3 alphanumeric
  for (let attempt = 0; attempt < 100; attempt++) {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let suffix = '';
    for (let i = 0; i < 3; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    const candidateId = `${prefix}-2026-${suffix}`;
    if (!existingSet.has(candidateId)) {
      return candidateId;
    }
  }

  return `${prefix}-2026-${Date.now().toString().slice(-3)}`;
}

// Guess closest department from sector or roleTitle
export function detectCandidateDepartment(sector: string = '', roleTitle: string = ''): string {
  const combined = `${sector} ${roleTitle}`.toLowerCase();
  if (combined.includes('front')) return 'Front-End Developer';
  if (combined.includes('back') || combined.includes('api') || combined.includes('systems engineer')) return 'Back-End Developer';
  if (combined.includes('full') || combined.includes('mern') || combined.includes('saas platform')) return 'Full-Stack Developer';
  if (combined.includes('video') || combined.includes('film') || combined.includes('multimedia')) return 'Video Editor';
  if (combined.includes('writer') || combined.includes('writing') || combined.includes('copywrit')) return 'Content Writer';
  if (combined.includes('creator') || combined.includes('advoca') || combined.includes('media')) return 'Content Creator';
  if (combined.includes('ui') || combined.includes('ux') || combined.includes('design') || combined.includes('figma')) return 'UI/UX Designer';
  if (combined.includes('market') || combined.includes('seo') || combined.includes('growth')) return 'Digital Marketing';
  if (combined.includes('doc') || combined.includes('technical doc') || combined.includes('spec')) return 'Documentation';
  if (combined.includes('event') || combined.includes('workshop') || combined.includes('hackathon')) return 'Event Management';
  if (combined.includes('software') || combined.includes('dev') || combined.includes('ai') || combined.includes('prompt')) return 'Software Developer';
  return 'Front-End Developer';
}

// Local + Server Sync for Department Configs
export function getStoredDepartmentConfigs(): DepartmentConfig[] {
  try {
    const raw = localStorage.getItem('scoders_department_configs');
    if (raw) {
      const parsed = JSON.parse(raw) as DepartmentConfig[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure all departments use the active official group link if they have placeholder links
        return parsed.map(dept => ({
          ...dept,
          whatsappSubgroupLink: (!dept.whatsappSubgroupLink || dept.whatsappSubgroupLink.includes('scoders-') || dept.whatsappSubgroupLink.includes('-subgroup'))
            ? OFFICIAL_DEPARTMENT_WHATSAPP_LINK
            : dept.whatsappSubgroupLink
        }));
      }
    }
  } catch (e) {
    console.error('Error loading department configs:', e);
  }
  return DEFAULT_DEPARTMENTS;
}

export function saveStoredDepartmentConfigs(configs: DepartmentConfig[]): void {
  try {
    localStorage.setItem('scoders_department_configs', JSON.stringify(configs));
  } catch (e) {
    console.error('Error saving department configs:', e);
  }
  // Sync to backend app-state
  fetch('/api/app-state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'scoders_department_configs', value: configs })
  }).catch(() => {});
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('scoders_departments_change'));
    window.dispatchEvent(new Event('scoders_db_change'));
  }
}

export function getStoredMainWhatsAppCommunity(): string {
  try {
    const raw = localStorage.getItem('scoders_main_whatsapp_community');
    if (raw && !raw.includes('scoders-developers-main-community')) return raw;
  } catch (e) {
    console.error('Error loading main whatsapp community:', e);
  }
  return DEFAULT_MAIN_WHATSAPP_COMMUNITY;
}

export function saveStoredMainWhatsAppCommunity(link: string): void {
  try {
    localStorage.setItem('scoders_main_whatsapp_community', link);
  } catch (e) {
    console.error('Error saving main whatsapp community:', e);
  }
  fetch('/api/app-state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'scoders_main_whatsapp_community', value: link })
  }).catch(() => {});
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('scoders_departments_change'));
    window.dispatchEvent(new Event('scoders_db_change'));
  }
}

// Local + Server Sync for Department Meetings
export function getStoredDepartmentMeetings(): DepartmentMeeting[] {
  try {
    const raw = localStorage.getItem('scoders_department_meetings');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading department meetings:', e);
  }
  return DEFAULT_DEPARTMENT_MEETINGS;
}

export function saveStoredDepartmentMeetings(meetings: DepartmentMeeting[]): void {
  try {
    localStorage.setItem('scoders_department_meetings', JSON.stringify(meetings));
  } catch (e) {
    console.error('Error saving department meetings:', e);
  }
  fetch('/api/app-state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'scoders_department_meetings', value: meetings })
  }).catch(() => {});
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('scoders_meetings_change'));
    window.dispatchEvent(new Event('scoders_db_change'));
  }
}
