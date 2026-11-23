import { WorkshopEvent } from '../types';

export const OFFICIAL_WORKSHOP_WHATSAPP_COORDINATOR_PHONE = '918310463417';

const DEFAULT_WORKSHOP_GROUPS: Record<string, { groupName: string; groupLink?: string }> = {
  'w-1': {
    groupName: 'AI Agents & n8n Workshop Group',
    groupLink: 'https://chat.whatsapp.com/GBlr54MzWPq4gn8BOJSbGZ?s=cl&p=a&iam=2',
  },
  'w-2': {
    groupName: 'React Native Masterclass Group',
    groupLink: 'https://chat.whatsapp.com/KmQJHfuw0YQIFb24JCh0C0?s=cl&p=a&iam=2',
  },
  'w-3': {
    groupName: 'SaaS 48h MVP Hackathon Group',
    groupLink: 'https://chat.whatsapp.com/EyMgYulqGs1BY3KhAm3PaM?s=cl&p=a&iam=2',
  },
};

export function sanitizeWhatsappUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export interface ResolvedWorkshopWhatsappGroup {
  workshopId: string;
  groupCode: string;
  groupName: string;
  href: string;
  hasDirectInviteLink: boolean;
}

export function getWorkshopWhatsappGroup(
  workshop: WorkshopEvent,
  participantUid?: string
): ResolvedWorkshopWhatsappGroup {
  const defaults = DEFAULT_WORKSHOP_GROUPS[workshop.id];
  const groupCode = `WA-${workshop.id.toUpperCase().replace(/[^A-Z0-9-]/g, '')}`;
  const groupName =
    workshop.whatsappGroupName?.trim() ||
    defaults?.groupName ||
    `${workshop.title} WhatsApp Group`;

  const rawCustomHref = sanitizeWhatsappUrl(workshop.whatsappGroupLink);
  const customHref =
    workshop.id === 'w-1' && rawCustomHref === 'https://chat.whatsapp.com/Dn2rD4GVvJw9DtKUIcBs1F'
      ? undefined
      : rawCustomHref;
  const defaultHref = sanitizeWhatsappUrl(defaults?.groupLink);
  const directInviteHref = customHref || defaultHref;

  if (directInviteHref) {
    return {
      workshopId: workshop.id,
      groupCode,
      groupName,
      href: directInviteHref,
      hasDirectInviteLink: true,
    };
  }

  const uidSegment = participantUid ? ` | Pass UID: ${participantUid}` : '';
  const joinMessage = `Hello S-CODERS! I have unlocked the "${workshop.title}" workshop (${groupCode}${uidSegment}). Please add me to the dedicated "${groupName}" WhatsApp group.`;

  return {
    workshopId: workshop.id,
    groupCode,
    groupName,
    href: `https://wa.me/${OFFICIAL_WORKSHOP_WHATSAPP_COORDINATOR_PHONE}?text=${encodeURIComponent(joinMessage)}`,
    hasDirectInviteLink: false,
  };
}
