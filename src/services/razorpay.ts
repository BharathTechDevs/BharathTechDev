/**
 * Official Razorpay Payment Integration Service for S-CODERS
 * 
 * Provides safe client-side loading of the Razorpay Checkout SDK,
 * authoritative payment state management, communication with backend order creation,
 * order reuse & duplicate payment protection, server-side signature verification,
 * and structured handling for PhonePe, Google Pay, Paytm/UPI, Cards, NetBanking, and Wallets.
 * 
 * NOTE: The Razorpay Key Secret is NEVER exposed here or in any client-side code.
 */

export type PaymentState =
  | 'IDLE'
  | 'CREATING_ORDER'
  | 'CHECKOUT_OPEN'
  | 'PROCESSING'
  | 'VERIFYING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'UNKNOWN'
  | 'ALREADY_PAID';

export type PaymentFailureCategory =
  | 'BANK_SECURITY_OR_LIMIT'
  | 'UPI_OR_APP_DECLINE'
  | 'USER_CANCELLED'
  | 'NETWORK_OR_UNCERTAIN'
  | 'ALREADY_PAID'
  | 'GENERAL_DECLINE';

export interface PaymentFailureDetails {
  state: 'FAILED' | 'CANCELLED' | 'UNKNOWN' | 'ALREADY_PAID';
  category: PaymentFailureCategory;
  title: string;
  primaryMessage: string;
  confirmationNote: string;
  failedMethod?: string;
  orderId?: string;
  paymentCapturedConfirmedFalse: boolean;
  isUncertain: boolean;
  isBankSecurityDecline: boolean;
}

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
  existingOrderId?: string;
  applicationOrderKey?: string;
  forceNewOrder?: boolean;
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
  reused?: boolean;
  alreadyPaid?: boolean;
  paymentId?: string;
  status?: string;
  message?: string;
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
  paymentMethodLabel?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  verified: boolean;
  alreadyPaid?: boolean;
  isUncertain?: boolean;
  message?: string;
  paymentId?: string;
  orderId?: string;
  status?: 'PAID' | 'FAILED' | 'PENDING' | 'CANCELLED' | 'UNKNOWN';
  emailSent?: boolean;
  error?: string;
}

export interface OrderStatusCheckResponse {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  status: 'PAID' | 'FAILED' | 'CREATED' | 'ATTEMPTED' | 'UNKNOWN' | 'EXPIRED';
  verified: boolean;
  paymentCaptured: boolean;
  reusable?: boolean;
  message: string;
}

export interface StandardCheckoutOptions {
  amount: number; // INR
  currency?: string;
  name?: string;
  description?: string;
  customer: RazorpayCustomerInfo;
  notes?: Record<string, string>;
  themeColor?: string;
  existingOrderId?: string;
  applicationOrderKey?: string;
  forceNewOrder?: boolean;
  preferredMethod?: 'upi' | 'card' | 'netbanking' | 'wallet';
  onStateChange?: (state: PaymentState, stageMessage?: string) => void;
  onOrderCreated?: (order: RazorpayOrderResponse) => void;
  onSuccess: (data: RazorpayPaymentSuccessData, verificationResult: VerifyPaymentResponse) => void;
  onFailure?: (
    error: { code?: string; description?: string; reason?: string; step?: string; orderId?: string },
    structuredFailure: PaymentFailureDetails
  ) => void;
  onDismiss?: (orderId?: string, statusResult?: OrderStatusCheckResponse) => void;
  onUncertain?: (details: PaymentFailureDetails) => void;
  onAlreadyPaid?: (details: { orderId: string; paymentId?: string; message: string }) => void;
}

/**
 * Classifies any bank, UPI (PhonePe / Google Pay / Paytm), or Razorpay error
 * into a safe, professional, customer-friendly PaymentFailureDetails object.
 * Never exposes raw stack traces, internal IDs, or server errors.
 */
export function classifyPaymentFailure(params: {
  rawReason?: string;
  code?: string;
  step?: string;
  failedMethod?: string;
  orderId?: string;
  isCancelled?: boolean;
  isUncertain?: boolean;
  paymentCapturedConfirmedFalse?: boolean;
}): PaymentFailureDetails {
  const raw = (params.rawReason || '').toLowerCase();
  const code = (params.code || '').toLowerCase();
  const methodLabel = params.failedMethod || 'UPI / Payment App';

  if (params.isUncertain) {
    return {
      state: 'UNKNOWN',
      category: 'NETWORK_OR_UNCERTAIN',
      title: 'Payment status is being checked',
      primaryMessage:
        'Payment status could not be confirmed yet. Please check your bank/UPI app before making another payment.',
      confirmationNote: 'Please check your bank/UPI app before trying again.',
      failedMethod: methodLabel,
      orderId: params.orderId,
      paymentCapturedConfirmedFalse: false,
      isUncertain: true,
      isBankSecurityDecline: false,
    };
  }

  if (params.isCancelled || raw.includes('cancel') || raw.includes('dismiss')) {
    return {
      state: 'CANCELLED',
      category: 'USER_CANCELLED',
      title: 'Payment unsuccessful',
      primaryMessage: 'The payment was cancelled before completion.',
      confirmationNote:
        params.paymentCapturedConfirmedFalse !== false
          ? 'No payment was received for this attempt.'
          : 'No payment has been confirmed.',
      failedMethod: methodLabel,
      orderId: params.orderId,
      paymentCapturedConfirmedFalse: params.paymentCapturedConfirmedFalse !== false,
      isUncertain: false,
      isBankSecurityDecline: false,
    };
  }

  // Detect bank security, risk check, or bank/UPI limit errors
  const isBankSecurityOrLimit =
    raw.includes('security') ||
    raw.includes('limit') ||
    raw.includes('exceeded') ||
    raw.includes('risk') ||
    raw.includes('fraud') ||
    raw.includes('blocked') ||
    raw.includes('bank_decline') ||
    raw.includes('declined by bank') ||
    raw.includes('declined for security');

  if (isBankSecurityOrLimit) {
    return {
      state: 'FAILED',
      category: 'BANK_SECURITY_OR_LIMIT',
      title: 'Payment unsuccessful',
      primaryMessage: 'Your bank or UPI app declined this payment. Please try another payment method.',
      confirmationNote:
        params.paymentCapturedConfirmedFalse !== false
          ? 'No payment was received for this attempt.'
          : 'No payment has been confirmed.',
      failedMethod: methodLabel,
      orderId: params.orderId,
      paymentCapturedConfirmedFalse: params.paymentCapturedConfirmedFalse !== false,
      isUncertain: false,
      isBankSecurityDecline: true,
    };
  }

  // General UPI / PhonePe / GPay / Paytm / Card / NetBanking decline
  const isDeclineOrFailure =
    raw.includes('decline') ||
    raw.includes('failed') ||
    raw.includes('could not be completed') ||
    raw.includes('upi') ||
    raw.includes('phonepe') ||
    raw.includes('google pay') ||
    raw.includes('gpay') ||
    raw.includes('paytm') ||
    code.includes('bad_request') ||
    code.includes('gateway_error') ||
    code.includes('payment_failed');

  return {
    state: 'FAILED',
    category: isDeclineOrFailure ? 'UPI_OR_APP_DECLINE' : 'GENERAL_DECLINE',
    title: 'Payment unsuccessful',
    primaryMessage: 'Your bank or UPI app could not complete this payment.',
    confirmationNote:
      params.paymentCapturedConfirmedFalse !== false
        ? 'No payment was received for this attempt.'
        : 'No payment has been confirmed.',
    failedMethod: methodLabel,
    orderId: params.orderId,
    paymentCapturedConfirmedFalse: params.paymentCapturedConfirmedFalse !== false,
    isUncertain: false,
    isBankSecurityDecline: false,
  };
}

/**
 * Dynamically loads the official Razorpay Checkout SDK (checkout.js) safely.
 */
export async function loadRazorpaySDK(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if ((window as any).Razorpay) {
    return true;
  }

  const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
  if (existingScript) {
    return new Promise((resolve) => {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
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
 * Creates or reuses a valid Razorpay order on the backend via Razorpay Orders API
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
        customer: params.customer,
        purpose: params.purpose,
        productId: params.productId,
        workshopId: params.workshopId,
        existingOrderId: params.existingOrderId,
        applicationOrderKey: params.applicationOrderKey,
        forceNewOrder: params.forceNewOrder,
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
      reused: data.reused,
      alreadyPaid: data.alreadyPaid,
      paymentId: data.paymentId,
      status: data.status,
      message: data.message,
    };
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return {
      success: false,
      orderId: '',
      amount: Math.round(params.amount * 100),
      currency: params.currency || 'INR',
      keyId: '',
      error: 'Unable to initialize payment order at the moment. Please try again.',
    };
  }
}

/**
 * Checks the authoritative status of a Razorpay order with the backend
 * (Used when payment status is UNKNOWN / UNCERTAIN or before creating duplicate orders)
 */
export async function checkRazorpayOrderStatus(
  orderId?: string,
  applicationOrderKey?: string
): Promise<OrderStatusCheckResponse> {
  try {
    const response = await fetch('/api/payments/check-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, applicationOrderKey }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      return {
        success: false,
        orderId,
        status: 'UNKNOWN',
        verified: false,
        paymentCaptured: false,
        message:
          'Payment status could not be confirmed yet. Please check your bank/UPI app before making another payment.',
      };
    }

    return {
      success: true,
      orderId: data.orderId || orderId,
      paymentId: data.paymentId,
      status: data.status || 'UNKNOWN',
      verified: Boolean(data.verified),
      paymentCaptured: Boolean(data.paymentCaptured),
      reusable: Boolean(data.reusable),
      message:
        data.message ||
        (data.status === 'PAID'
          ? 'Payment already completed.'
          : 'No payment was received for this attempt.'),
    };
  } catch (err) {
    return {
      success: false,
      orderId,
      status: 'UNKNOWN',
      verified: false,
      paymentCaptured: false,
      message:
        'Payment status could not be confirmed yet. Please check your bank/UPI app before making another payment.',
    };
  }
}

/**
 * Verifies Razorpay payment signature and updates payment status on the backend.
 * Distinguishes between explicit signature failure (FAILED) and network interruption (UNKNOWN).
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

    if (response.status >= 500) {
      return {
        success: false,
        verified: false,
        isUncertain: true,
        status: 'UNKNOWN',
        orderId: params.razorpay_order_id,
        paymentId: params.razorpay_payment_id,
        error:
          'Payment status could not be confirmed yet. Please check your bank/UPI app before making another payment.',
      };
    }

    if (!response.ok || !data.success || !data.verified) {
      return {
        success: false,
        verified: false,
        isUncertain: false,
        status: 'FAILED',
        error: data.error || 'Payment verification could not be confirmed.',
      };
    }

    return {
      success: true,
      verified: true,
      alreadyPaid: Boolean(data.alreadyPaid),
      status: 'PAID',
      paymentId: data.paymentId || params.razorpay_payment_id,
      orderId: data.orderId || params.razorpay_order_id,
      emailSent: data.emailSent,
      message: data.message || 'Payment verified successfully.',
    };
  } catch (error: any) {
    console.error('Payment verification network error:', error);
    return {
      success: false,
      verified: false,
      isUncertain: true,
      status: 'UNKNOWN',
      orderId: params.razorpay_order_id,
      paymentId: params.razorpay_payment_id,
      error:
        'Payment status could not be confirmed yet. Please check your bank/UPI app before making another payment.',
    };
  }
}

/**
 * Launches the official Razorpay Standard Checkout popup.
 * Handles the full end-to-end lifecycle:
 * 1. Checks / Reuses valid order or creates new Order on Backend (CREATING_ORDER)
 * 2. Prevents duplicate payment if order is already PAID (ALREADY_PAID)
 * 3. Loads SDK & opens Checkout (CHECKOUT_OPEN)
 * 4. Handles callback events: payment.failed, modal.ondismiss, and handler
 * 5. Verifies Signature on Backend upon payment response (VERIFYING -> SUCCESS or UNKNOWN/FAILED)
 * 6. Calls onSuccess ONLY after server-side verification succeeds.
 */
export async function launchRazorpayCheckout(
  options: StandardCheckoutOptions,
  setLoadingState?: (loading: boolean, stage?: string) => void
): Promise<void> {
  options.onStateChange?.('CREATING_ORDER', 'Checking order status & initializing checkout...');
  if (setLoadingState) setLoadingState(true, 'Loading Razorpay SDK...');

  const isSdkReady = await loadRazorpaySDK();
  if (!isSdkReady || !(window as any).Razorpay) {
    if (setLoadingState) setLoadingState(false);
    const structured = classifyPaymentFailure({
      rawReason: 'Could not load payment gateway. Please check your network connection.',
      code: 'SDK_LOAD_FAILED',
      paymentCapturedConfirmedFalse: true,
    });
    options.onStateChange?.('FAILED', structured.primaryMessage);
    options.onFailure?.(
      {
        code: 'SDK_LOAD_FAILED',
        description: structured.primaryMessage,
      },
      structured
    );
    return;
  }

  if (setLoadingState) setLoadingState(true, 'Preparing secure payment order...');

  const orderResult = await createRazorpayOrder({
    amount: options.amount,
    currency: options.currency || 'INR',
    customer: options.customer,
    purpose: options.description || 'S-CODERS Payment',
    notes: options.notes,
    existingOrderId: options.existingOrderId,
    applicationOrderKey: options.applicationOrderKey,
    forceNewOrder: options.forceNewOrder,
  });

  if (orderResult.alreadyPaid) {
    if (setLoadingState) setLoadingState(false);
    options.onStateChange?.('ALREADY_PAID', 'Payment already completed.');
    options.onAlreadyPaid?.({
      orderId: orderResult.orderId,
      paymentId: orderResult.paymentId,
      message: 'Payment already completed.',
    });
    return;
  }

  if (!orderResult.success || !orderResult.orderId) {
    if (setLoadingState) setLoadingState(false);
    const structured = classifyPaymentFailure({
      rawReason: orderResult.error || 'Could not initialize payment order.',
      code: 'ORDER_CREATION_FAILED',
      paymentCapturedConfirmedFalse: true,
    });
    options.onStateChange?.('FAILED', structured.primaryMessage);
    options.onFailure?.(
      {
        code: 'ORDER_CREATION_FAILED',
        description: structured.primaryMessage,
      },
      structured
    );
    return;
  }

  options.onOrderCreated?.(orderResult);

  if (setLoadingState) setLoadingState(false);
  options.onStateChange?.('CHECKOUT_OPEN', 'Razorpay Checkout opened');

  let paymentResolvedOrFailed = false;

  const rzpOptions: Record<string, any> = {
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
      ...(options.preferredMethod ? { method: options.preferredMethod } : {}),
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
      ondismiss: async () => {
        if (paymentResolvedOrFailed) return;
        // Before assuming cancelled or failed, check order status on backend
        options.onStateChange?.('VERIFYING', 'Payment status is being checked.');
        if (setLoadingState) setLoadingState(true, 'Payment status is being checked.');

        const statusCheck = await checkRazorpayOrderStatus(
          orderResult.orderId,
          options.applicationOrderKey
        );

        if (setLoadingState) setLoadingState(false);

        if (statusCheck.status === 'PAID' && statusCheck.verified) {
          paymentResolvedOrFailed = true;
          options.onStateChange?.('SUCCESS', 'Payment verified.');
          options.onSuccess(
            {
              razorpay_payment_id: statusCheck.paymentId || `pay_${Date.now()}`,
              razorpay_order_id: orderResult.orderId,
              razorpay_signature: 'verified_by_order_status',
              amount: options.amount,
              currency: options.currency || 'INR',
              email: options.customer.email,
              clientName: options.customer.name,
              purpose: options.description || 'Service Payment',
              method: 'Razorpay Standard Checkout',
            },
            {
              success: true,
              verified: true,
              status: 'PAID',
              paymentId: statusCheck.paymentId,
              orderId: orderResult.orderId,
              message: statusCheck.message,
            }
          );
          return;
        }

        if (statusCheck.status === 'UNKNOWN') {
          const uncertainDetails = classifyPaymentFailure({
            isUncertain: true,
            orderId: orderResult.orderId,
          });
          options.onStateChange?.('UNKNOWN', uncertainDetails.primaryMessage);
          options.onUncertain?.(uncertainDetails);
          options.onDismiss?.(orderResult.orderId, statusCheck);
          return;
        }

        options.onStateChange?.('CANCELLED', 'The payment was cancelled.');
        options.onDismiss?.(orderResult.orderId, statusCheck);
      },
    },
    handler: async (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => {
      paymentResolvedOrFailed = true;
      options.onStateChange?.('VERIFYING', 'Payment status is being checked.');
      if (setLoadingState) setLoadingState(true, 'Payment status is being checked...');

      try {
        const verification = await verifyRazorpayPayment({
          razorpay_order_id: response.razorpay_order_id || orderResult.orderId,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          amount: options.amount,
          currency: options.currency || 'INR',
          email: options.customer.email,
          clientName: options.customer.name,
          purpose: options.description || 'Payment Verification',
          paymentMethodLabel: 'Razorpay Standard Checkout',
        });

        if (setLoadingState) setLoadingState(false);

        if (verification.success && verification.verified) {
          options.onStateChange?.('SUCCESS', 'Payment verified successfully.');
          options.onSuccess(
            {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id || orderResult.orderId,
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
        } else if (verification.isUncertain) {
          const uncertainDetails = classifyPaymentFailure({
            isUncertain: true,
            orderId: response.razorpay_order_id || orderResult.orderId,
          });
          options.onStateChange?.('UNKNOWN', uncertainDetails.primaryMessage);
          options.onUncertain?.(uncertainDetails);
        } else {
          const structured = classifyPaymentFailure({
            rawReason: verification.error || 'Payment verification could not be completed.',
            code: 'SIGNATURE_VERIFICATION_FAILED',
            orderId: response.razorpay_order_id || orderResult.orderId,
            paymentCapturedConfirmedFalse: false,
          });
          options.onStateChange?.('FAILED', structured.primaryMessage);
          options.onFailure?.(
            {
              code: 'SIGNATURE_VERIFICATION_FAILED',
              description: structured.primaryMessage,
              orderId: response.razorpay_order_id || orderResult.orderId,
            },
            structured
          );
        }
      } catch (err: any) {
        if (setLoadingState) setLoadingState(false);
        const uncertainDetails = classifyPaymentFailure({
          isUncertain: true,
          orderId: response.razorpay_order_id || orderResult.orderId,
        });
        options.onStateChange?.('UNKNOWN', uncertainDetails.primaryMessage);
        options.onUncertain?.(uncertainDetails);
      }
    },
  };

  try {
    const razorpayInstance = new (window as any).Razorpay(rzpOptions);

    razorpayInstance.on('payment.failed', (response: any) => {
      paymentResolvedOrFailed = true;
      const errObj = response?.error || {};
      const methodUsed = errObj?.metadata?.method || options.preferredMethod || 'UPI / Payment Method';
      const rawDesc =
        errObj?.description || errObj?.reason || 'Your bank or UPI app could not complete this payment.';

      const structured = classifyPaymentFailure({
        rawReason: `${rawDesc} ${errObj?.reason || ''} ${errObj?.code || ''}`,
        code: errObj?.code,
        step: errObj?.step,
        failedMethod: methodUsed,
        orderId: orderResult.orderId,
        paymentCapturedConfirmedFalse: true,
      });

      options.onStateChange?.('FAILED', structured.primaryMessage);

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
          errorReason: structured.primaryMessage,
          orderId: orderResult.orderId,
        }),
      }).catch(() => {});

      options.onFailure?.(
        {
          code: errObj?.code,
          description: structured.primaryMessage,
          reason: errObj?.reason,
          step: errObj?.step,
          orderId: orderResult.orderId,
        },
        structured
      );
    });

    razorpayInstance.open();
  } catch (err: any) {
    if (setLoadingState) setLoadingState(false);
    const structured = classifyPaymentFailure({
      rawReason: 'Could not open Razorpay checkout popup.',
      code: 'MODAL_OPEN_FAILED',
      orderId: orderResult.orderId,
      paymentCapturedConfirmedFalse: true,
    });
    options.onStateChange?.('FAILED', structured.primaryMessage);
    options.onFailure?.(
      {
        code: 'MODAL_OPEN_FAILED',
        description: structured.primaryMessage,
        orderId: orderResult.orderId,
      },
      structured
    );
  }
}
