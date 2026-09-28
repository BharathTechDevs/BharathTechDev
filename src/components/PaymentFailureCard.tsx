import React from 'react';
import {
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  X,
  ShieldAlert,
  Smartphone,
  CreditCard,
  Building2,
  Wallet,
  QrCode,
  CheckCircle2,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { PaymentFailureDetails, PaymentState } from '../services/razorpay';

export type FallbackPaymentOption =
  | 'phonepe'
  | 'gpay'
  | 'paytm'
  | 'qr'
  | 'custom_vpa'
  | 'card'
  | 'netbanking'
  | 'wallet'
  | 'standard_checkout';

interface PaymentFailureCardProps {
  failure: PaymentFailureDetails;
  paymentState?: PaymentState;
  isCheckingStatus?: boolean;
  onTryAnotherMethod: (selectedAlternative?: FallbackPaymentOption) => void;
  onRetryPayment: () => void;
  onCancel: () => void;
  onCheckStatus?: () => void;
  compact?: boolean;
}

export default function PaymentFailureCard({
  failure,
  paymentState,
  isCheckingStatus = false,
  onTryAnotherMethod,
  onRetryPayment,
  onCancel,
  onCheckStatus,
  compact = false,
}: PaymentFailureCardProps) {
  const isAlreadyPaid = failure.state === 'ALREADY_PAID' || paymentState === 'ALREADY_PAID';
  const isUncertain = failure.state === 'UNKNOWN' || failure.isUncertain || paymentState === 'UNKNOWN';
  const isVerifying = paymentState === 'VERIFYING' || isCheckingStatus;

  const failedMethodLower = (failure.failedMethod || '').toLowerCase();

  // Build available Razorpay checkout fallback methods, excluding or de-emphasizing the method that just failed
  const alternativeMethods: Array<{
    id: FallbackPaymentOption;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
  }> = [
    ...(failedMethodLower.includes('gpay') || failedMethodLower.includes('google')
      ? []
      : [
          {
            id: 'gpay' as FallbackPaymentOption,
            label: 'Google Pay',
            sublabel: 'UPI App',
            icon: <Smartphone className="w-3.5 h-3.5 text-blue-400" />,
          },
        ]),
    ...(failedMethodLower.includes('phonepe')
      ? []
      : [
          {
            id: 'phonepe' as FallbackPaymentOption,
            label: 'PhonePe',
            sublabel: 'UPI App',
            icon: <Smartphone className="w-3.5 h-3.5 text-purple-400" />,
          },
        ]),
    ...(failedMethodLower.includes('paytm')
      ? []
      : [
          {
            id: 'paytm' as FallbackPaymentOption,
            label: 'Paytm UPI',
            sublabel: 'UPI App',
            icon: <Smartphone className="w-3.5 h-3.5 text-cyan-400" />,
          },
        ]),
    {
      id: 'qr',
      label: 'Scan UPI QR',
      sublabel: 'Any UPI App',
      icon: <QrCode className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      id: 'custom_vpa',
      label: 'Another UPI ID',
      sublabel: 'Enter VPA',
      icon: <Smartphone className="w-3.5 h-3.5 text-teal-400" />,
    },
    {
      id: 'card',
      label: 'Card',
      sublabel: 'Credit / Debit',
      icon: <CreditCard className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      id: 'netbanking',
      label: 'NetBanking',
      sublabel: 'All Major Banks',
      icon: <Building2 className="w-3.5 h-3.5 text-indigo-400" />,
    },
    {
      id: 'wallet',
      label: 'Wallets',
      sublabel: 'Supported Wallets',
      icon: <Wallet className="w-3.5 h-3.5 text-pink-400" />,
    },
  ];

  if (isAlreadyPaid) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5 space-y-4 text-left shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-extrabold text-base text-white">
              Payment already completed.
            </h4>
            <p className="text-xs text-gray-300 font-sans leading-relaxed">
              This order has already been paid and verified. Duplicate payments are blocked to protect your account.
            </p>
          </div>
        </div>
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (isUncertain || isVerifying) {
    return (
      <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-5 space-y-4 text-left shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
            {isVerifying ? (
              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
            ) : (
              <Clock className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/30 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider">
              {isVerifying ? 'Checking Payment Status' : 'Status Unconfirmed'}
            </span>
            <h4 className="font-display font-extrabold text-base text-white">
              {isVerifying ? 'Payment status is being checked.' : 'Payment status could not be confirmed yet.'}
            </h4>
            <p className="text-xs text-gray-200 font-sans leading-relaxed">
              {isVerifying
                ? 'Please wait while we verify the transaction status with the payment gateway.'
                : 'Payment status could not be confirmed yet. Please check your bank/UPI app before making another payment.'}
            </p>
            <div className="bg-black/40 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-200/90 font-sans flex items-start gap-2 mt-2">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                If money was debited from your bank or UPI app, please do not pay again immediately. Use the button below to re-check the payment status.
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          {onCheckStatus && (
            <button
              type="button"
              onClick={onCheckStatus}
              disabled={isVerifying}
              className="flex-1 min-w-[180px] py-3 px-4 bg-amber-500 hover:bg-amber-400 text-black font-display font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-amber-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Checking Status...' : 'Check Payment Status'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onTryAnotherMethod()}
            disabled={isVerifying}
            className="py-3 px-4 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            Try Another Payment Method
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-3.5 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-mono text-xs rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D182E] border border-red-500/35 rounded-2xl p-5 space-y-4 text-left shadow-2xl">
      {/* Top Failure Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0 mt-0.5">
            {failure.isBankSecurityDecline ? (
              <ShieldAlert className="w-5 h-5 text-red-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-display font-extrabold text-base sm:text-lg text-white">
                {failure.title || 'Payment unsuccessful'}
              </h4>
              {failure.failedMethod && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-red-300 font-bold uppercase">
                  {failure.failedMethod}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-gray-200 font-sans leading-relaxed">
              {failure.isBankSecurityDecline
                ? 'Your bank or UPI app declined this payment. Please try another payment method.'
                : failure.primaryMessage || 'Your bank or UPI app could not complete this payment.'}
            </p>

            <div className="pt-1 flex items-center gap-2 text-xs font-mono text-blue-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              <span>
                {failure.paymentCapturedConfirmedFalse
                  ? 'No payment has been confirmed. No payment was received for this attempt.'
                  : failure.confirmationNote || 'Please check your bank/UPI app before trying again.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Security / Limit Decline Guidance Banner */}
      {failure.isBankSecurityDecline && (
        <div className="bg-blue-950/50 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-200 font-sans leading-relaxed">
          UPI apps (such as PhonePe or Google Pay) or your issuing bank may occasionally decline a transaction due to daily UPI limits or bank security checks. Selecting another UPI app, scanning the UPI QR, or using a Card / NetBanking usually resolves this immediately.
        </div>
      )}

      {/* Alternative Payment Methods Quick Switcher */}
      {!compact && (
        <div className="space-y-2 pt-1 border-t border-white/10">
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block font-bold">
            Select Another Available Payment Method:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {alternativeMethods.slice(0, 8).map((alt) => (
              <button
                key={alt.id}
                type="button"
                onClick={() => onTryAnotherMethod(alt.id)}
                className="p-2.5 rounded-xl bg-black/30 hover:bg-blue-600/20 border border-white/10 hover:border-blue-400/50 transition-all flex items-center gap-2 text-left cursor-pointer group"
              >
                <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-blue-500/20 transition-colors shrink-0">
                  {alt.icon}
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-white block truncate">{alt.label}</span>
                  <span className="text-[9px] font-mono text-gray-400 block truncate">{alt.sublabel}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Primary Action Buttons: [ Try Another Payment Method ] [ Retry Payment ] [ Cancel ] */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={() => onTryAnotherMethod()}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-display font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Try Another Payment Method</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onRetryPayment}
          className="py-3 px-4 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-300" />
          <span>Retry Payment</span>
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="py-3 px-3.5 bg-transparent hover:bg-red-500/15 text-gray-400 hover:text-red-300 border border-transparent hover:border-red-500/30 font-mono text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
}
