export type RegistrationSection = 'workshop' | 'event';
export type RegistrationWindowStatus = 'OPEN' | 'NOT_STARTED' | 'CLOSED';

export interface RegistrationWindowEvaluation {
  section: RegistrationSection;
  itemId: string;
  itemTitle: string;
  status: RegistrationWindowStatus;
  allowed: boolean;
  startDate?: string;
  endDate?: string;
  startDateDisplay: string;
  endDateDisplay: string;
  startDateShort: string;
  endDateShort: string;
  headline: string;
  message: string;
  serverNowIso?: string;
}

export const DEFAULT_WORKSHOP_WINDOWS: Record<string, { start: string; end: string }> = {
  'w-1': { start: '2026-11-01', end: '2026-12-31' },
  'w-2': { start: '2026-11-01', end: '2026-12-31' },
  'w-3': { start: '2026-11-01', end: '2026-12-31' },
};

export const DEFAULT_EVENT_WINDOWS: Record<string, { start: string; end: string }> = {
  'evt-ai-hackathon-2026': { start: '2026-11-01', end: '2026-12-31' },
  'evt-founder-meetup-14': { start: '2026-11-01', end: '2026-12-31' },
  'evt-dev-llm-masterclass': { start: '2026-11-01', end: '2026-12-31' },
  'evt-tech-awards-2026': { start: '2026-06-15', end: '2026-07-14' },
};

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

let serverClockOffsetMs = 0;
let lastServerSyncMs = 0;

export function getAuthoritativeNowMs(): number {
  return Date.now() + serverClockOffsetMs;
}

export function updateServerClockOffset(serverNowIso?: string): void {
  if (!serverNowIso) return;
  const parsed = Date.parse(serverNowIso);
  if (!Number.isNaN(parsed)) {
    serverClockOffsetMs = parsed - Date.now();
    lastServerSyncMs = Date.now();
  }
}

export function normalizeIsoDateOnly(raw?: string | null): string {
  const val = String(raw || '').trim();
  if (!val) return '';

  const directMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (directMatch) {
    return `${directMatch[1]}-${directMatch[2]}-${directMatch[3]}`;
  }

  const parsedMs = Date.parse(val);
  if (Number.isNaN(parsedMs)) return '';

  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(parsedMs));
  } catch {
    const d = new Date(parsedMs);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

export function getTodayIsoDateIst(nowMs?: number): string {
  const ms = typeof nowMs === 'number' ? nowMs : getAuthoritativeNowMs();
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toISOString().slice(0, 10);
  }
}

export function parseStartTimestampIst(isoDate: string): number {
  const clean = normalizeIsoDateOnly(isoDate);
  if (!clean) return NaN;
  return Date.parse(`${clean}T00:00:00.000+05:30`);
}

export function parseEndTimestampIst(isoDate: string): number {
  const clean = normalizeIsoDateOnly(isoDate);
  if (!clean) return NaN;
  return Date.parse(`${clean}T23:59:59.999+05:30`);
}

export function formatRegistrationDateLong(raw?: string | null): string {
  const clean = normalizeIsoDateOnly(raw);
  if (!clean) return raw ? String(raw) : 'Not Set';
  const [yStr, mStr, dStr] = clean.split('-');
  const y = Number(yStr);
  const mIdx = Number(mStr) - 1;
  const d = Number(dStr);
  if (!MONTHS_LONG[mIdx] || !d || !y) return clean;
  return `${d} ${MONTHS_LONG[mIdx]} ${y}`;
}

export function formatRegistrationDateShort(raw?: string | null): string {
  const clean = normalizeIsoDateOnly(raw);
  if (!clean) return raw ? String(raw) : 'Not Set';
  const [yStr, mStr, dStr] = clean.split('-');
  const y = Number(yStr);
  const mIdx = Number(mStr) - 1;
  const d = Number(dStr);
  if (!MONTHS_SHORT[mIdx] || !d || !y) return clean;
  return `${d} ${MONTHS_SHORT[mIdx]} ${y}`;
}

export function resolveDefaultDatesForItem(
  section: RegistrationSection,
  itemId?: string,
  startDate?: string,
  endDate?: string
): { startDate: string; endDate: string } {
  const cleanStart = normalizeIsoDateOnly(startDate);
  const cleanEnd = normalizeIsoDateOnly(endDate);

  const map = section === 'workshop' ? DEFAULT_WORKSHOP_WINDOWS : DEFAULT_EVENT_WINDOWS;
  const def = itemId ? map[itemId] : undefined;

  return {
    startDate: cleanStart || (!cleanEnd && def ? def.start : ''),
    endDate: cleanEnd || (!cleanStart && def ? def.end : ''),
  };
}

export function evaluateRegistrationWindow(params: {
  section: RegistrationSection;
  itemId?: string;
  itemTitle?: string;
  startDate?: string;
  endDate?: string;
  statusOverride?: string;
  nowMs?: number;
}): RegistrationWindowEvaluation {
  const {
    section,
    itemId = '',
    itemTitle = section === 'workshop' ? 'Workshop' : 'Event',
    statusOverride,
    nowMs = getAuthoritativeNowMs(),
  } = params;

  const { startDate, endDate } = resolveDefaultDatesForItem(
    section,
    itemId,
    params.startDate,
    params.endDate
  );

  const startMs = startDate ? parseStartTimestampIst(startDate) : NaN;
  const endMs = endDate ? parseEndTimestampIst(endDate) : NaN;

  const startDateDisplay = startDate ? formatRegistrationDateLong(startDate) : 'Open Now';
  const endDateDisplay = endDate ? formatRegistrationDateLong(endDate) : 'No Expiry Set';
  const startDateShort = startDate ? formatRegistrationDateShort(startDate) : 'Open';
  const endDateShort = endDate ? formatRegistrationDateShort(endDate) : 'TBA';

  const sectionLabel = section === 'workshop' ? 'workshop' : 'event';
  const sectionPlural = section === 'workshop' ? 'workshops' : 'events';

  // Completed status without explicit future end date is always closed
  if (statusOverride === 'completed' && (Number.isNaN(endMs) || nowMs > endMs)) {
    const timelineSentence =
      startDate && endDate
        ? `The registration period for this ${sectionLabel} was from ${startDateDisplay} to ${endDateDisplay}. `
        : '';
    return {
      section,
      itemId,
      itemTitle,
      status: 'CLOSED',
      allowed: false,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      startDateDisplay,
      endDateDisplay,
      startDateShort,
      endDateShort,
      headline: 'Registration Closed!',
      message: `${timelineSentence}Unfortunately, the registration deadline has now expired, and registrations are officially closed. You can no longer register for this ${sectionLabel}. Kindly look forward to our upcoming ${sectionPlural}. Thank you!`,
    };
  }

  if (!Number.isNaN(startMs) && nowMs < startMs) {
    const periodText = endDate
      ? `from ${startDateDisplay} to ${endDateDisplay}`
      : `starting ${startDateDisplay}`;
    return {
      section,
      itemId,
      itemTitle,
      status: 'NOT_STARTED',
      allowed: false,
      startDate,
      endDate: endDate || undefined,
      startDateDisplay,
      endDateDisplay,
      startDateShort,
      endDateShort,
      headline: 'Registration Opens Soon!',
      message: `The registration period for this ${sectionLabel} is scheduled ${periodText}. Registrations have not opened yet. Kindly check back starting ${startDateDisplay}. Thank you!`,
    };
  }

  if (!Number.isNaN(endMs) && nowMs > endMs) {
    const timelineSentence = startDate
      ? `The registration period for this ${sectionLabel} was from ${startDateDisplay} to ${endDateDisplay}.`
      : `The registration closing date for this ${sectionLabel} (${endDateDisplay}) has passed.`;
    return {
      section,
      itemId,
      itemTitle,
      status: 'CLOSED',
      allowed: false,
      startDate: startDate || undefined,
      endDate,
      startDateDisplay,
      endDateDisplay,
      startDateShort,
      endDateShort,
      headline: 'Registration Closed!',
      message: `${timelineSentence} Unfortunately, the registration deadline has now expired, and registrations are officially closed. You can no longer register for this ${sectionLabel}. Kindly look forward to our upcoming ${sectionPlural}. Thank you!`,
    };
  }

  return {
    section,
    itemId,
    itemTitle,
    status: 'OPEN',
    allowed: true,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    startDateDisplay,
    endDateDisplay,
    startDateShort,
    endDateShort,
    headline: 'Registration Open',
    message:
      startDate && endDate
        ? `Registrations are open from ${startDateDisplay} to ${endDateDisplay}.`
        : 'Registrations are currently open.',
  };
}

export async function syncServerClock(force = false): Promise<number> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    return getAuthoritativeNowMs();
  }
  if (!force && lastServerSyncMs > 0 && Date.now() - lastServerSyncMs < 30000) {
    return getAuthoritativeNowMs();
  }
  try {
    const res = await fetch('/api/registrations/window-status', {
      cache: 'no-store',
      headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.serverNowIso) {
        updateServerClockOffset(data.serverNowIso);
      }
    }
  } catch {
    // Offline fallback uses existing offset
  }
  return getAuthoritativeNowMs();
}

export async function checkServerRegistrationWindow(params: {
  section: RegistrationSection;
  itemId: string;
  itemTitle?: string;
  startDate?: string;
  endDate?: string;
  statusOverride?: string;
}): Promise<RegistrationWindowEvaluation> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    return evaluateRegistrationWindow(params);
  }

  try {
    const res = await fetch('/api/registrations/check-window', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: params.section,
        itemId: params.itemId,
        itemTitle: params.itemTitle,
        startDate: params.startDate,
        endDate: params.endDate,
        statusOverride: params.statusOverride,
      }),
    });

    const data = await res.json().catch(() => null);
    if (data?.serverNowIso) {
      updateServerClockOffset(data.serverNowIso);
    }
    if (data?.windowStatus) {
      return data.windowStatus as RegistrationWindowEvaluation;
    }
    if (data && typeof data.allowed === 'boolean' && data.status) {
      return data as RegistrationWindowEvaluation;
    }
  } catch {
    // Fallback to server-offset-calibrated local evaluation if server offline
  }

  return evaluateRegistrationWindow({
    ...params,
    nowMs: getAuthoritativeNowMs(),
  });
}
