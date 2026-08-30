/**
 * Cross-platform UPI & Payment App deep link dispatcher.
 * Handles iframe breakouts, multiple protocol schemes for Android/iOS/Desktop,
 * intent fallback schemes, and payment redirects.
 */

export interface UpiIntentParams {
  pa: string; // Payee address (e.g. scoders@ybl)
  pn: string; // Payee name
  am: number | string; // Amount in INR
  cu?: string; // Currency, defaults to INR
  tn?: string; // Transaction note
  tr?: string; // Transaction reference / Order ID
}

export function generateUpiUrl(
  params: UpiIntentParams, 
  scheme: 'universal' | 'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'intent' = 'universal'
): string {
  const currency = params.cu || 'INR';
  const cleanAmount = typeof params.am === 'number' ? params.am.toFixed(2) : parseFloat(params.am || '0').toFixed(2);
  const cleanNote = (params.tn || 'S-CODERS Tech').replace(/[^a-zA-Z0-9 -]/g, '').slice(0, 30);
  const cleanTr = (params.tr || `TRX${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '').slice(-12);
  const cleanPn = encodeURIComponent(params.pn || 'S-CODERS Technologies');
  
  const queryString = `pa=${params.pa}&pn=${cleanPn}&am=${cleanAmount}&cu=${currency}&tn=${encodeURIComponent(cleanNote)}&tr=${cleanTr}`;

  switch (scheme) {
    case 'phonepe':
      return `phonepe://pay?${queryString}`;
    case 'gpay':
      return `tez://upi/pay?${queryString}`;
    case 'paytm':
      return `paytmmp://pay?${queryString}`;
    case 'bhim':
      return `bhim://pay?${queryString}`;
    case 'intent':
      // Android Native Intent URL format that guarantees launching target package or web fallback
      return `intent://pay?${queryString}#Intent;scheme=upi;action=android.intent.action.VIEW;end;`;
    case 'universal':
    default:
      return `upi://pay?${queryString}`;
  }
}

/**
 * Returns specific Android package intent URLs for direct app launching
 */
export function getAppSpecificIntent(params: UpiIntentParams, app: 'phonepe' | 'gpay' | 'paytm'): string {
  const currency = params.cu || 'INR';
  const cleanAmount = typeof params.am === 'number' ? params.am.toFixed(2) : parseFloat(params.am || '0').toFixed(2);
  const cleanNote = (params.tn || 'S-CODERS Tech').replace(/[^a-zA-Z0-9 -]/g, '').slice(0, 30);
  const cleanTr = (params.tr || `TRX${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '').slice(-12);
  const cleanPn = encodeURIComponent(params.pn || 'S-CODERS Technologies');
  const queryString = `pa=${params.pa}&pn=${cleanPn}&am=${cleanAmount}&cu=${currency}&tn=${encodeURIComponent(cleanNote)}&tr=${cleanTr}`;

  if (app === 'phonepe') {
    return `intent://pay?${queryString}#Intent;scheme=upi;package=com.phonepe.app;action=android.intent.action.VIEW;end;`;
  } else if (app === 'gpay') {
    return `intent://pay?${queryString}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;action=android.intent.action.VIEW;end;`;
  } else if (app === 'paytm') {
    return `intent://pay?${queryString}#Intent;scheme=upi;package=net.one97.paytm;action=android.intent.action.VIEW;end;`;
  }
  return `upi://pay?${queryString}`;
}

/**
 * Dispatches a deep link safely from within web apps, mobile browsers, or iframe sandboxes.
 * Ensures the user is immediately redirected / prompted by their target app.
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
  const triggerUrl = (url: string) => {
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.setAttribute('target', '_top');
      anchor.setAttribute('rel', 'noopener noreferrer');
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        if (document.body.contains(anchor)) {
          document.body.removeChild(anchor);
        }
      }, 300);
    } catch {
      window.location.href = url;
    }
  };

  // 1. Try specialized app scheme (e.g. phonepe://, tez://, paytmmp://)
  triggerUrl(customScheme);

  // 2. Try Android intent wrapper if on mobile
  if (app !== 'universal') {
    setTimeout(() => {
      triggerUrl(packageIntent);
    }, 250);
  }

  // 3. Fallback to standard universal UPI intent
  setTimeout(() => {
    triggerUrl(universalScheme);
  }, 600);
}
