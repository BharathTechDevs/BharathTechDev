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
export const DEFAULT_PAYEE_NAME = 'BHUVAN M';

export function getBankingNameForUpi(vpa: string): string {
  if (vpa.includes('6363905989')) return 'BHUVAN M';
  if (vpa.includes('8310463417')) return 'SHREYAS M';
  return 'BHUVAN M';
}

export function getPhoneNumberForUpi(vpa: string): string {
  if (vpa.includes('8310463417')) return DEFAULT_SHREYAS_PHONE;
  return DEFAULT_BHUVAN_PHONE;
}

export function getActiveMerchantUpi(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('scoders_merchant_upi') || DEFAULT_BHUVAN_UPI;
  }
  return DEFAULT_BHUVAN_UPI;
}

export function setActiveMerchantUpi(upi: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('scoders_merchant_upi', upi);
    window.dispatchEvent(new CustomEvent('scoders_merchant_upi_changed', { detail: { upi } }));
  }
}

export interface UpiIntentParams {
  pa?: string; // Payee VPA address (e.g. 6363905989@ybl)
  pn?: string; // Payee Name (defaults to CBS registered name)
  am: number | string; // Amount in INR
  cu?: string; // Currency (INR)
  tn?: string; // Transaction note
  tr?: string; // Transaction reference / Order ID
  mc?: string; // Merchant category code
}

/**
 * Builds standard RFC / NPCI compliant UPI query strings.
 * CRITICAL FIX: For P2P personal VPAs (e.g. @ybl):
 * - Payee name (pn) MUST match the registered CBS bank name (BHUVAN M / SHREYAS M). Mismatches trigger "Security reasons decline".
 * - Transaction Reference (tr) is strictly prohibited on P2P addresses by NPCI/ICICI Bank. Including &tr= causes "Exceeded bank limit for this payment".
 */
export function buildUpiQueryString(params: UpiIntentParams): string {
  const currency = params.cu || 'INR';
  const cleanAmount = typeof params.am === 'number' ? params.am.toFixed(2) : parseFloat(params.am || '0').toFixed(2);
  const cleanNote = (params.tn || 'SCODERS Event Pass').replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 25);
  const paAddress = params.pa || getActiveMerchantUpi();
  
  // Use registered bank name matching CBS to avoid security flags in PhonePe/GPay
  const registeredName = getBankingNameForUpi(paAddress);
  const cleanPn = encodeURIComponent(registeredName);
  
  let query = `pa=${paAddress}&pn=${cleanPn}&am=${cleanAmount}&cu=${currency}&tn=${encodeURIComponent(cleanNote)}`;

  // Only append &tr= if explicit merchant category code exists or verified merchant account
  if (params.mc) {
    query += `&mc=${encodeURIComponent(params.mc)}`;
    if (params.tr) {
      const cleanTr = params.tr.replace(/[^a-zA-Z0-9]/g, '').slice(-12);
      query += `&tr=${cleanTr}`;
    }
  }

  return query;
}

/**
 * Generates direct URI schemes for specific payment providers with platform detection
 */
export function generateUpiUrl(
  params: UpiIntentParams, 
  scheme: 'universal' | 'phonepe' | 'gpay' | 'paytm' | 'bhim' = 'universal'
): string {
  return getAppropriateUpiLink(params, scheme);
}

/**
 * Returns platform-optimized UPI link (Android Intent vs iOS custom scheme vs universal fallback)
 */
export function getAppropriateUpiLink(
  params: UpiIntentParams,
  app: 'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'universal' = 'universal'
): string {
  const qs = buildUpiQueryString(params);
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isAndroid) {
    switch (app) {
      case 'phonepe':
        return `intent://pay?${qs}#Intent;scheme=upi;package=com.phonepe.app;action=android.intent.action.VIEW;end;`;
      case 'gpay':
        return `intent://pay?${qs}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;action=android.intent.action.VIEW;end;`;
      case 'paytm':
        return `intent://pay?${qs}#Intent;scheme=upi;package=net.one97.paytm;action=android.intent.action.VIEW;end;`;
      case 'bhim':
        return `intent://pay?${qs}#Intent;scheme=upi;package=in.org.npci.upiapp;action=android.intent.action.VIEW;end;`;
      default:
        return `upi://pay?${qs}`;
    }
  }

  if (isIOS) {
    switch (app) {
      case 'phonepe':
        return `phonepe://pay?${qs}`;
      case 'gpay':
        return `tez://upi/pay?${qs}`;
      case 'paytm':
        return `paytmmp://pay?${qs}`;
      case 'bhim':
        return `bhim://pay?${qs}`;
      default:
        return `upi://pay?${qs}`;
    }
  }

  return `upi://pay?${qs}`;
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
 * Handles Android Intent, iOS deep schemes, auto-copies UPI ID, and safely informs desktop users.
 */
export function openUpiApp(
  params: UpiIntentParams, 
  app: 'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'universal' = 'universal'
) {
  const targetVpa = params.pa || getActiveMerchantUpi();
  const targetPhone = getPhoneNumberForUpi(targetVpa);
  const targetName = getBankingNameForUpi(targetVpa);

  // Guarantee matching CBS banking name & target address
  params.pa = targetVpa;
  params.pn = targetName;

  // 1. Auto-copy UPI ID to clipboard as immediate convenience
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(targetVpa).catch(() => {});
    }
  } catch {
    // Ignore clipboard error
  }

  // 2. Dispatch event so UI can display helpful guidance toast
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('scoders_upi_launched', {
      detail: {
        app,
        vpa: targetVpa,
        phone: targetPhone,
        name: targetName,
        amount: params.am
      }
    }));
  }

  // 3. Determine single target URL based on device OS
  const targetUrl = getAppropriateUpiLink(params, app);

  // 4. Launch intent on mobile devices
  if (typeof window !== 'undefined') {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) {
      // On desktop, opening custom mobile schemas fails silently;
      // UPI ID is already copied and QR code is rendered for mobile scan.
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = targetUrl;
      link.setAttribute('rel', 'noopener noreferrer');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 500);
    } catch {
      try {
        window.location.href = targetUrl;
      } catch {
        // Ignore fallback
      }
    }
  }
}
