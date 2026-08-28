/**
 * Cross-platform UPI & Payment App deep link dispatcher.
 * Handles iframe breakouts, multiple protocol schemes for Android/iOS,
 * and reliable fallback handling for PhonePe, Google Pay, Paytm, and BHIM UPI.
 */

export interface UpiIntentParams {
  pa: string; // Payee address (e.g. scoders@ybl)
  pn: string; // Payee name
  am: number | string; // Amount in INR
  cu?: string; // Currency, defaults to INR
  tn?: string; // Transaction note
  tr?: string; // Transaction reference / Order ID
}

export function generateUpiUrl(params: UpiIntentParams, scheme: 'universal' | 'phonepe' | 'gpay' | 'paytm' | 'bhim' = 'universal'): string {
  const currency = params.cu || 'INR';
  const cleanAmount = typeof params.am === 'number' ? params.am.toFixed(2) : parseFloat(params.am || '0').toFixed(2);
  const cleanNote = (params.tn || 'S-CODERS Payment').replace(/[^a-zA-Z0-9 -]/g, '').slice(0, 30);
  const cleanTr = (params.tr || `TRX${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '').slice(-12);
  const cleanPn = encodeURIComponent(params.pn || 'S-CODERS Technologies');
  
  const queryString = `pa=${params.pa}&pn=${cleanPn}&am=${cleanAmount}&cu=${currency}&tn=${encodeURIComponent(cleanNote)}&tr=${cleanTr}`;

  switch (scheme) {
    case 'phonepe':
      return `phonepe://pay?${queryString}`;
    case 'gpay':
      // tez://upi/pay is standard Android Google Pay URI, gpay:// is alternative
      return `tez://upi/pay?${queryString}`;
    case 'paytm':
      return `paytmmp://pay?${queryString}`;
    case 'bhim':
      return `bhim://pay?${queryString}`;
    case 'universal':
    default:
      return `upi://pay?${queryString}`;
  }
}

/**
 * Dispatches a deep link safely from within web apps or iframe sandboxes.
 * Tries window.top, window.location, and <a> element click.
 */
export function openUpiApp(params: UpiIntentParams, app: 'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'universal' = 'universal') {
  const deepLink = generateUpiUrl(params, app);
  const universalLink = generateUpiUrl(params, 'universal');

  try {
    // Priority 1: If top window is accessible, assign location
    if (window.top && window.top !== window) {
      try {
        window.top.location.href = deepLink;
        return;
      } catch {
        // Sandboxed top access blocked by cross-origin policy, fallback to standard click
      }
    }

    // Priority 2: Standard anchor click simulation
    const anchor = document.createElement('a');
    anchor.href = deepLink;
    anchor.target = '_top';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      if (document.body.contains(anchor)) {
        document.body.removeChild(anchor);
      }
    }, 100);

    // Fallback: If specialized scheme fails after timeout, trigger universal UPI intent
    if (app !== 'universal') {
      setTimeout(() => {
        try {
          const fallbackAnchor = document.createElement('a');
          fallbackAnchor.href = universalLink;
          fallbackAnchor.target = '_top';
          fallbackAnchor.rel = 'noopener noreferrer';
          document.body.appendChild(fallbackAnchor);
          fallbackAnchor.click();
          setTimeout(() => {
            if (document.body.contains(fallbackAnchor)) {
              document.body.removeChild(fallbackAnchor);
            }
          }, 100);
        } catch (e) {
          console.warn("Universal UPI fallback trigger error:", e);
        }
      }, 700);
    }
  } catch (err) {
    console.warn("Direct UPI execution error:", err);
    // Direct window location fallback
    window.location.href = deepLink;
  }
}
