// Utility for managing executive leader photos with synchronized server persistence and local fallbacks

export const DEFAULT_LEADER_PHOTOS: Record<'shreyas' | 'lokesh' | 'bhuvan' | string, string> = {
  shreyas: '/founder.jpg',
  lokesh: '/cofounder.jpg',
  bhuvan: '/techlead.jpg',
};

// In-memory cache
const cachedPhotos: Record<string, string> = { ...DEFAULT_LEADER_PHOTOS };

// Sync tracking
let isSyncingPhotos = false;

export function getLeaderPhoto(id: 'shreyas' | 'lokesh' | 'bhuvan' | string): string {
  if (typeof window === 'undefined') return DEFAULT_LEADER_PHOTOS[id] || '/techlead.jpg';

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

  return DEFAULT_LEADER_PHOTOS[id] || '/techlead.jpg';
}

export function getAllLeaderPhotos(): Record<string, string> {
  const result: Record<string, string> = { ...DEFAULT_LEADER_PHOTOS, ...cachedPhotos };
  if (typeof window !== 'undefined') {
    try {
      const keys = ['shreyas', 'lokesh', 'bhuvan'];
      for (const k of keys) {
        const val = localStorage.getItem(`scoders_photo_${k}`);
        if (val && val.length > 50) {
          result[k] = val;
        }
      }
    } catch {}
  }
  return result;
}

export async function setLeaderPhoto(id: 'shreyas' | 'lokesh' | 'bhuvan' | string, dataUrl: string): Promise<void> {
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
  window.dispatchEvent(new Event('scoders_team_change'));
  window.dispatchEvent(new Event('scoders_db_change'));

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

export async function resetLeaderPhoto(id: 'shreyas' | 'lokesh' | 'bhuvan' | string): Promise<void> {
  if (typeof window === 'undefined') return;

  const def = DEFAULT_LEADER_PHOTOS[id] || '/techlead.jpg';
  cachedPhotos[id] = def;
  try {
    localStorage.removeItem(`scoders_photo_${id}`);
  } catch {}

  window.dispatchEvent(new CustomEvent('scoders_leader_photo_updated', { detail: { id, photoUrl: def } }));
  window.dispatchEvent(new Event('scoders_team_change'));
  window.dispatchEvent(new Event('scoders_db_change'));

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

// Directly fetch latest photos from server
export async function fetchLeaderPhotosFromServer(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`/api/leader-photos?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.photos) {
        Object.assign(cachedPhotos, data.photos);
        if (typeof window !== 'undefined') {
          for (const [k, v] of Object.entries(data.photos)) {
            if (typeof v === 'string' && v.length > 50) {
              try { localStorage.setItem(`scoders_photo_${k}`, v); } catch {}
            }
          }
        }
        return data.photos;
      }
    }
  } catch (err) {
    console.warn('Could not fetch leader photos from server:', err);
  }
  return getAllLeaderPhotos();
}

// Fetch photos from the server and synchronize with localStorage & UI
export async function initLeaderPhotosSync(force = false): Promise<void> {
  if (typeof window === 'undefined' || (isSyncingPhotos && !force)) return;
  isSyncingPhotos = true;

  try {
    const res = await fetch(`/api/leader-photos?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.photos) {
        let updatedAny = false;
        const leaders = ['shreyas', 'lokesh', 'bhuvan'];

        for (const id of leaders) {
          const serverUrl = data.photos[id];
          const localUrl = localStorage.getItem(`scoders_photo_${id}`);

          if (serverUrl && serverUrl !== DEFAULT_LEADER_PHOTOS[id]) {
            // Server has custom photo -> sync to local cache and storage
            if (serverUrl !== localUrl || cachedPhotos[id] !== serverUrl) {
              cachedPhotos[id] = serverUrl;
              try { localStorage.setItem(`scoders_photo_${id}`, serverUrl); } catch {}
              updatedAny = true;
            }
          } else if (localUrl && localUrl.length > 50 && (!serverUrl || serverUrl === DEFAULT_LEADER_PHOTOS[id])) {
            // Local has custom photo from earlier upload -> push to server so all visitors see it!
            cachedPhotos[id] = localUrl;
            fetch('/api/leader-photos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, photoUrl: localUrl })
            }).catch(() => {});
          }
        }

        // Also merge any other custom keys from server
        Object.entries(data.photos).forEach(([k, v]) => {
          if (typeof v === 'string' && v.length > 50 && cachedPhotos[k] !== v) {
            cachedPhotos[k] = v;
            try { localStorage.setItem(`scoders_photo_${k}`, v); } catch {}
            updatedAny = true;
          }
        });

        if (updatedAny) {
          window.dispatchEvent(new CustomEvent('scoders_leader_photo_updated', { detail: { photos: cachedPhotos } }));
          window.dispatchEvent(new Event('scoders_team_change'));
        }
      }
    }
  } catch (err) {
    console.warn('Could not sync leader photos from server:', err);
  } finally {
    isSyncingPhotos = false;
  }
}

// Continuous real-time synchronization for multi-device visibility
if (typeof window !== 'undefined') {
  initLeaderPhotosSync(true);

  window.addEventListener('focus', () => {
    initLeaderPhotosSync(true);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      initLeaderPhotosSync(true);
    }
  });

  // Background interval every 3 seconds to ensure client gets latest photo updates instantly
  setInterval(() => {
    initLeaderPhotosSync();
  }, 3000);
}
