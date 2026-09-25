// Utility for managing executive leader photos with synchronized server persistence and local fallbacks

export const DEFAULT_LEADER_PHOTOS: Record<'shreyas' | 'lokesh' | 'bhuvan', string> = {
  shreyas: '/founder.jpg',
  lokesh: '/cofounder.jpg',
  bhuvan: '/techlead.jpg',
};

// In-memory cache
const cachedPhotos: Record<'shreyas' | 'lokesh' | 'bhuvan', string> = { ...DEFAULT_LEADER_PHOTOS };

// Sync initialization tracking
let hasInitializedSync = false;

export function getLeaderPhoto(id: 'shreyas' | 'lokesh' | 'bhuvan'): string {
  if (typeof window === 'undefined') return DEFAULT_LEADER_PHOTOS[id];
  
  // Ensure sync is triggered on first read in browser
  if (!hasInitializedSync) {
    initLeaderPhotosSync();
  }

  // Check in-memory cache first
  if (cachedPhotos[id] && cachedPhotos[id] !== DEFAULT_LEADER_PHOTOS[id]) {
    return cachedPhotos[id];
  }

  // Check localStorage
  try {
    const custom = localStorage.getItem(`scoders_photo_${id}`);
    if (custom && custom.length > 50) {
      cachedPhotos[id] = custom;
      return custom;
    }
  } catch {
    // Fallback if localStorage is restricted
  }

  return DEFAULT_LEADER_PHOTOS[id];
}

export async function setLeaderPhoto(id: 'shreyas' | 'lokesh' | 'bhuvan', dataUrl: string): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Immediately update cache and localStorage for instant UI response
  cachedPhotos[id] = dataUrl;
  try {
    localStorage.setItem(`scoders_photo_${id}`, dataUrl);
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }

  // 2. Dispatch reactive event across UI components
  window.dispatchEvent(new CustomEvent('scoders_leader_photo_updated', { detail: { id, photoUrl: dataUrl } }));

  // 3. Persist to server so any other visitor or friend sees the exact same image
  try {
    await fetch('/api/leader-photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, photoUrl: dataUrl })
    });
  } catch (err) {
    console.warn('Server photo sync failed, cached locally:', err);
  }
}

export async function resetLeaderPhoto(id: 'shreyas' | 'lokesh' | 'bhuvan'): Promise<void> {
  if (typeof window === 'undefined') return;

  cachedPhotos[id] = DEFAULT_LEADER_PHOTOS[id];
  try {
    localStorage.removeItem(`scoders_photo_${id}`);
  } catch {}

  window.dispatchEvent(new CustomEvent('scoders_leader_photo_updated', { detail: { id, photoUrl: DEFAULT_LEADER_PHOTOS[id] } }));

  try {
    await fetch('/api/leader-photos/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  } catch (err) {
    console.warn('Server photo reset failed:', err);
  }
}

// Fetch photos from the server and synchronize with localStorage & UI
export async function initLeaderPhotosSync(): Promise<void> {
  if (typeof window === 'undefined' || hasInitializedSync) return;
  hasInitializedSync = true;

  try {
    const res = await fetch('/api/leader-photos', {
      cache: 'no-store',
      headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.photos) {
        const leaders: Array<'shreyas' | 'lokesh' | 'bhuvan'> = ['shreyas', 'lokesh', 'bhuvan'];
        let updatedAny = false;

        for (const id of leaders) {
          const serverUrl = data.photos[id];
          const localUrl = localStorage.getItem(`scoders_photo_${id}`);

          if (serverUrl && serverUrl !== DEFAULT_LEADER_PHOTOS[id]) {
            // Server has custom photo -> sync to local
            if (serverUrl !== localUrl) {
              cachedPhotos[id] = serverUrl;
              try { localStorage.setItem(`scoders_photo_${id}`, serverUrl); } catch {}
              updatedAny = true;
            }
          } else if (localUrl && localUrl.length > 50 && (!serverUrl || serverUrl === DEFAULT_LEADER_PHOTOS[id])) {
            // Local has custom photo from earlier upload -> push to server so others see it!
            cachedPhotos[id] = localUrl;
            fetch('/api/leader-photos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, photoUrl: localUrl })
            }).catch(() => {});
          }
        }

        if (updatedAny) {
          window.dispatchEvent(new CustomEvent('scoders_leader_photo_updated', { detail: {} }));
        }
      }
    }
  } catch (err) {
    console.warn('Could not sync leader photos from server:', err);
  }
}

// Run initial sync on load in browser
if (typeof window !== 'undefined') {
  initLeaderPhotosSync();
  window.addEventListener('focus', () => {
    hasInitializedSync = false;
    initLeaderPhotosSync();
  });
}
