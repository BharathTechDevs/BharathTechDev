export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
  bio: string;
  expertise: string[];
  linkedin: string;
  github: string;
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
  location: string;
  summary: string;
  achievements: string[];
  photo: string;
  category: string;
  attendees: number;
  price?: number;
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
  image: string; // Captured live picture URL or custom uploaded photo
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


