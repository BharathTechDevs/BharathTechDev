// Utility for managing executive leader photos with local upload support and fallbacks

export const DEFAULT_LEADER_PHOTOS: Record<'shreyas' | 'lokesh' | 'bhuvan', string> = {
  shreyas: '/founder.jpg',
  lokesh: '/cofounder.jpg',
  bhuvan: '/techlead.jpg',
};

export function getLeaderPhoto(id: 'shreyas' | 'lokesh' | 'bhuvan'): string {
  if (typeof window === 'undefined') return DEFAULT_LEADER_PHOTOS[id];
  try {
    const custom = localStorage.getItem(`scoders_photo_${id}`);
    if (custom && custom.length > 50) return custom;
  } catch {
    // Fallback if localStorage is restricted
  }
  return DEFAULT_LEADER_PHOTOS[id];
}

export function setLeaderPhoto(id: 'shreyas' | 'lokesh' | 'bhuvan', dataUrl: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`scoders_photo_${id}`, dataUrl);
    window.dispatchEvent(new CustomEvent('scoders_leader_photo_updated', { detail: { id, photoUrl: dataUrl } }));
  } catch (e) {
    console.error('Failed to save leader photo:', e);
  }
}

export function resetLeaderPhoto(id: 'shreyas' | 'lokesh' | 'bhuvan'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`scoders_photo_${id}`);
    window.dispatchEvent(new CustomEvent('scoders_leader_photo_updated', { detail: { id, photoUrl: DEFAULT_LEADER_PHOTOS[id] } }));
  } catch {}
}
