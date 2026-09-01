/**
 * Cross-platform UPI & Payment App Deep Link Dispatcher & Payment Handler.
 * Supports iOS, Android, and Desktop web environments with multi-protocol schemes,
 * intent packages, and immediate interactive redirects.
 */

export const DEFAULT_BHUVAN_PHONE = '6363905989';
export const DEFAULT_SHREYAS_PHONE = '8310463417';

export const DEFAULT_BHUVAN_UPI = '6363905989@ybl';
export const DEFAULT_SHREYAS_UPI = '8310463417@ybl';
export const DEFAULT_UPI_VPA = '6363905989@ybl';
export const DEFAULT_PAYEE_NAME = 'S-CODERS Technologies';

export function getActiveMerchantUpi(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('scoders_merchant_upi') || DEFAULT_BHUVAN_UPI;
  }
  return DEFAULT_BHUVAN_UPI;
}

export function setActiveMerchantUpi(upi: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('scoders_merchant_upi', upi);
    window.dispatchEvent(new Event('scoders_merchant_upi_changed'));
  }
}

export interface UpiIntentParams {
  pa?: string; // Payee VPA address (e.g. 6363905989@ybl)
  pn?: string; // Payee Name
  am: number | string; // Amount in INR
  cu?: string; // Currency (INR)
  tn?: string; // Transaction note
  tr?: string; // Transaction reference / Order ID
}

/**
 * Builds standard RFC / NPCI compliant UPI query strings
 */
export function buildUpiQueryString(params: UpiIntentParams): string {
  const currency = params.cu || 'INR';
  const cleanAmount = typeof params.am === 'number' ? params.am.toFixed(2) : parseFloat(params.am || '0').toFixed(2);
  const cleanNote = (params.tn || 'SCODERS Services').replace(/[^a-zA-Z0-9 -]/g, '').slice(0, 30);
  const cleanTr = (params.tr || `TRX${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '').slice(-12);
  const paAddress = params.pa || getActiveMerchantUpi();
  const cleanPn = encodeURIComponent(params.pn || 'S-CODERS Technologies');
  
  return `pa=${paAddress}&pn=${cleanPn}&am=${cleanAmount}&cu=${currency}&tn=${encodeURIComponent(cleanNote)}&tr=${cleanTr}`;
}

/**
 * Generates direct URI schemes for specific payment providers
 */
export function generateUpiUrl(
  params: UpiIntentParams, 
  scheme: 'universal' | 'phonepe' | 'gpay' | 'paytm' | 'bhim' = 'universal'
): string {
  const qs = buildUpiQueryString(params);

  switch (scheme) {
    case 'phonepe':
      return `phonepe://pay?${qs}`;
    case 'gpay':
      return `tez://upi/pay?${qs}`;
    case 'paytm':
      return `paytmmp://pay?${qs}`;
    case 'bhim':
      return `bhim://pay?${qs}`;
    case 'universal':
    default:
      return `upi://pay?${qs}`;
  }
}

/**
 * Generates Android Intent URIs specifically matching target package manager on Android devices
 */
export function getAppSpecificIntent(params: UpiIntentParams, app: 'phonepe' | 'gpay' | 'paytm'): string {
  const qs = buildUpiQueryString(params);

  if (app === 'phonepe') {
    return `intent://pay?${qs}#Intent;scheme=upi;package=com.phonepe.app;action=android.intent.action.VIEW;end;`;
  } else if (app === 'gpay') {
    return `intent://pay?${qs}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;action=android.intent.action.VIEW;end;`;
  } else if (app === 'paytm') {
    return `intent://pay?${qs}#Intent;scheme=upi;package=net.one97.paytm;action=android.intent.action.VIEW;end;`;
  }
  return `upi://pay?${qs}`;
}

/**
 * Launches the requested UPI application or presents the universal device intent chooser.
 * Uses top-level window dispatching to break out of iframes and trigger the OS app handler.
 */
export function openUpiApp(
  params: UpiIntentParams, 
  app: 'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'universal' = 'universal'
) {
  const customScheme = generateUpiUrl(params, app);
  const universalScheme = generateUpiUrl(params, 'universal');
  const packageIntent = (app === 'phonepe' || app === 'gpay' || app === 'paytm') 
    ? getAppSpecificIntent(params, app) 
    : universalScheme;

  // Direct trigger via hidden anchor and window location
  const executeLaunch = (url: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('rel', 'noopener noreferrer');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 300);
    } catch {
      // Fallback
    }

    try {
      window.location.assign(url);
    } catch {
      // Ignore navigation aborts
    }
  };

  // 1. Direct App Scheme (iOS & Android supported deep-links)
  executeLaunch(customScheme);

  // 2. Package-specific Android Intent for Android mobile browsers (Chrome / Samsung Internet / Firefox)
  if (app === 'phonepe' || app === 'gpay' || app === 'paytm') {
    setTimeout(() => {
      executeLaunch(packageIntent);
    }, 150);
  }

  // 3. Universal UPI fallback handler
  setTimeout(() => {
    executeLaunch(universalScheme);
  }, 400);
}
