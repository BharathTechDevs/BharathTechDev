/**
 * Official Razorpay Payment Integration Service for S-CODERS
 * 
 * Provides safe client-side loading of the Razorpay Checkout SDK,
 * communication with backend order creation and signature verification endpoints,
 * and robust error handling for success, pending, cancelled, and failed flows.
 * 
 * NOTE: The Razorpay Key Secret is NEVER exposed here or in any client-side code.
 */

export interface RazorpayCustomerInfo {
  name: string;
  email: string;
  contact?: string;
}

export interface CreateOrderParams {
  amount: number; // in INR (Rupees)
  currency?: string; // 'INR'
  receipt?: string;
  notes?: Record<string, string>;
  customer?: RazorpayCustomerInfo;
  purpose?: string;
  productId?: string;
  workshopId?: string;
}

export interface RazorpayOrderResponse {
  success: boolean;
  orderId: string;
  order_id?: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
  key_id?: string;
  merchantUpiId?: string;
  isLive?: boolean;
  error?: string;
}

export interface RazorpayPaymentSuccessData {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  amount: number; // In INR
  currency: string;
  email: string;
  clientName: string;
  purpose: string;
  method?: string;
}

export interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
  currency?: string;
  email: string;
  clientName: string;
  purpose?: string;
  merchantUpiId?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  verified: boolean;
  message?: string;
  paymentId?: string;
  orderId?: string;
  status?: 'PAID' | 'FAILED' | 'PENDING' | 'CANCELLED';
  emailSent?: boolean;
  error?: string;
}

export interface StandardCheckoutOptions {
  amount: number; // INR
  currency?: string;
  name?: string;
  description?: string;
  customer: RazorpayCustomerInfo;
  notes?: Record<string, string>;
  themeColor?: string;
  onSuccess: (data: RazorpayPaymentSuccessData, verificationResult: VerifyPaymentResponse) => void;
  onFailure?: (error: { code?: string; description?: string; reason?: string; step?: string }) => void;
  onDismiss?: () => void;
}

/**
 * Dynamically loads the official Razorpay Checkout SDK (checkout.js) safely.
 */
export async function loadRazorpaySDK(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // If already loaded on window
  if ((window as any).Razorpay) {
    return true;
  }

  // Check if script tag already in document
  const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
  if (existingScript) {
    return new Promise((resolve) => {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      // In case it already loaded
      setTimeout(() => {
        if ((window as any).Razorpay) resolve(true);
      }, 500);
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.error('Failed to load official Razorpay Checkout SDK script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Creates an order on the backend via Razorpay Orders API
 */
export async function createRazorpayOrder(params: CreateOrderParams): Promise<RazorpayOrderResponse> {
  try {
    const response = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency || 'INR',
        receipt: params.receipt || `rcpt_${Date.now()}`,
        notes: {
          clientName: params.customer?.name || 'Customer',
          email: params.customer?.email || '',
          purpose: params.purpose || 'Payment for S-CODERS Services',
          ...(params.notes || {}),
        },
        purpose: params.purpose,
        productId: params.productId,
        workshopId: params.workshopId,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      orderId: data.orderId || data.order_id,
      order_id: data.order_id || data.orderId,
      amount: data.amount,
      currency: data.currency || 'INR',
      keyId: data.keyId || data.key_id || 'rzp_live_scoders_ybl',
      key_id: data.key_id || data.keyId,
      merchantUpiId: data.merchantUpiId,
      isLive: data.isLive,
    };
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return {
      success: false,
      orderId: '',
      amount: Math.round(params.amount * 100),
      currency: params.currency || 'INR',
      keyId: '',
      error: error.message || 'Failed to initialize payment order',
    };
  }
}

/**
 * Verifies Razorpay payment signature and updates payment status on the backend.
 */
export async function verifyRazorpayPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResponse> {
  try {
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      return {
        success: false,
        verified: false,
        status: 'FAILED',
        error: data.error || 'Payment signature verification failed.',
      };
    }

    return {
      success: true,
      verified: true,
      status: 'PAID',
      paymentId: data.paymentId || params.razorpay_payment_id,
      orderId: data.orderId || params.razorpay_order_id,
      emailSent: data.emailSent,
      message: data.message || 'Payment verified successfully.',
    };
  } catch (error: any) {
    console.error('Payment verification request failed:', error);
    return {
      success: false,
      verified: false,
      status: 'FAILED',
      error: error.message || 'Network error during payment verification',
    };
  }
}

/**
 * Launches the official Razorpay Standard Checkout popup.
 * Handles the full end-to-end lifecycle:
 * 1. Loads SDK
 * 2. Creates Order on Backend
 * 3. Opens Checkout with Key ID, Amount, Currency, Order ID, Prefill & Theme
 * 4. Verifies Signature on Backend upon payment response
 * 5. Calls onSuccess only when verified
 */
export async function launchRazorpayCheckout(
  options: StandardCheckoutOptions,
  setLoadingState?: (loading: boolean, stage?: string) => void
): Promise<void> {
  if (setLoadingState) setLoadingState(true, 'Loading Razorpay SDK...');

  const isSdkReady = await loadRazorpaySDK();
  if (!isSdkReady || !(window as any).Razorpay) {
    if (setLoadingState) setLoadingState(false);
    options.onFailure?.({
      code: 'SDK_LOAD_FAILED',
      description: 'Razorpay Checkout script could not be loaded. Please check your internet connection.',
    });
    return;
  }

  if (setLoadingState) setLoadingState(true, 'Creating secure order...');

  const orderResult = await createRazorpayOrder({
    amount: options.amount,
    currency: options.currency || 'INR',
    customer: options.customer,
    purpose: options.description || 'S-CODERS Payment',
    notes: options.notes,
  });

  if (!orderResult.success || !orderResult.orderId) {
    if (setLoadingState) setLoadingState(false);
    options.onFailure?.({
      code: 'ORDER_CREATION_FAILED',
      description: orderResult.error || 'Could not create payment order with gateway.',
    });
    return;
  }

  if (setLoadingState) setLoadingState(false);

  const rzpOptions = {
    key: orderResult.keyId || 'rzp_live_scoders_ybl',
    amount: orderResult.amount, // in paise
    currency: orderResult.currency || 'INR',
    name: options.name || 'S-CODERS (Bharat Tech Developers)',
    description: options.description || 'Secure Service & Workshop Payment',
    image: '/favicon.ico',
    order_id: orderResult.orderId,
    prefill: {
      name: options.customer.name,
      email: options.customer.email,
      contact: options.customer.contact || '',
    },
    notes: {
      merchant_platform: 'S-CODERS Bharat Tech Developers',
      ...(options.notes || {}),
    },
    theme: {
      color: options.themeColor || '#22D3EE',
      backdrop_color: '#0B0F17',
    },
    modal: {
      backdropclose: false,
      escape: true,
      handleback: true,
      confirm_close: true,
      ondismiss: () => {
        console.log('Razorpay Checkout modal dismissed by user.');
        options.onDismiss?.();
      },
    },
    handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
      if (setLoadingState) setLoadingState(true, 'Verifying payment signature with server...');

      try {
        const verification = await verifyRazorpayPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          amount: options.amount,
          currency: options.currency || 'INR',
          email: options.customer.email,
          clientName: options.customer.name,
          purpose: options.description || 'Payment Verification',
        });

        if (setLoadingState) setLoadingState(false);

        if (verification.success && verification.verified) {
          options.onSuccess(
            {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: options.amount,
              currency: options.currency || 'INR',
              email: options.customer.email,
              clientName: options.customer.name,
              purpose: options.description || 'Service Payment',
              method: 'Razorpay Standard Checkout',
            },
            verification
          );
        } else {
          options.onFailure?.({
            code: 'SIGNATURE_VERIFICATION_FAILED',
            description: verification.error || 'Server signature verification failed.',
          });
        }
      } catch (err: any) {
        if (setLoadingState) setLoadingState(false);
        options.onFailure?.({
          code: 'VERIFICATION_ERROR',
          description: err.message || 'An error occurred during payment verification.',
        });
      }
    },
  };

  try {
    const razorpayInstance = new (window as any).Razorpay(rzpOptions);
    
    razorpayInstance.on('payment.failed', (response: any) => {
      console.warn('Razorpay payment failed:', response.error);
      
      // Notify backend of payment failure for audit / notification
      fetch('/api/razorpay/payment-failed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: options.customer.email,
          clientName: options.customer.name,
          purpose: options.description,
          amount: options.amount,
          currency: options.currency || 'INR',
          errorReason: response.error?.description || response.error?.reason || 'Payment failed at gateway',
          orderId: orderResult.orderId,
        }),
      }).catch((e) => console.warn('Payment failed notification error:', e));

      options.onFailure?.({
        code: response.error?.code,
        description: response.error?.description || 'Payment was declined or cancelled.',
        reason: response.error?.reason,
        step: response.error?.step,
      });
    });

    razorpayInstance.open();
  } catch (err: any) {
    console.error('Error opening Razorpay modal:', err);
    if (setLoadingState) setLoadingState(false);
    options.onFailure?.({
      code: 'MODAL_OPEN_FAILED',
      description: err.message || 'Could not open Razorpay checkout popup.',
    });
  }
}
