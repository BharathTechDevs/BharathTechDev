# Razorpay Payment Integration & Setup Guide

This guide walks you through configuring, testing, and going live with **Razorpay Standard Checkout** on the **S-CODERS (Bharat Tech Developers)** platform.

---

## 1. Overview of Architecture

The payment system uses **Razorpay Standard Checkout** with strict server-side signature verification:

1. **Order Creation (`POST /api/payments/create-order`)**:
   - The frontend requests an order for the service or workshop.
   - The server validates the amount, converts INR to paise, and creates an order via the official Razorpay Node.js SDK.
   - Returns only public credentials (`order_id`, `key_id`, `amount`, `currency`).
   - **`RAZORPAY_KEY_SECRET` is never sent to the client.**

2. **Checkout Execution (`checkout.js`)**:
   - The official Razorpay Checkout SDK is loaded dynamically and securely.
   - The customer enters payment details (UPI, Cards, NetBanking, Wallets).
   - Upon completion, Razorpay returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.

3. **Signature Verification (`POST /api/payments/verify`)**:
   - The frontend forwards payment tokens to the server.
   - The server computes the expected HMAC SHA256 signature using `RAZORPAY_KEY_SECRET` and `crypto.createHmac`.
   - **Only after matching verification is the order transitioned to `PAID` / `Successful`.**
   - Stores the verified payment in the application database (`db_payments`) and triggers receipt emails.

4. **Webhooks (`POST /api/payments/webhook`)**:
   - Handles asynchronous events (`order.paid`, `payment.captured`, `payment.failed`) verified against `RAZORPAY_WEBHOOK_SECRET`.

---

## 2. Step-by-Step Setup Instructions

### Step 1: Create or Log in to Razorpay
1. Visit [https://dashboard.razorpay.com](https://dashboard.razorpay.com) and log in or create an account.
2. Complete your business profile if required.

### Step 2: Enable Test Mode
1. In the top-right / left navigation of the Razorpay Dashboard, toggle the mode from **Live Mode** to **Test Mode**.
2. A yellow "Test Mode" indicator will be displayed across the dashboard.

### Step 3: Generate Test API Keys
1. Go to **Settings** → **API Keys**.
2. Click **Generate Test Key** (or **Regenerate Key**).
3. Copy both credentials:
   - **Key ID** (starts with `rzp_test_...`)
   - **Key Secret** (a confidential alphanumeric string)

### Step 4: Configure Server-Side Environment Variables
Add the credentials to your server environment variables or `.env` file (never commit `.env` to public repositories):

```env
# Razorpay Credentials (TEST MODE)
RAZORPAY_KEY_ID=rzp_test_YourTestKeyIdHere
RAZORPAY_KEY_SECRET=YourTestKeySecretHere

# Optional: Razorpay Webhook Secret
RAZORPAY_WEBHOOK_SECRET=YourWebhookSecretHere
```

> **Security Note:** `RAZORPAY_KEY_SECRET` is used exclusively on the Node.js Express server (`server.ts`). It is never bundled into the client build, HTML, or Vite client environment.

### Step 5: Configure Webhooks (Optional for Async Sync)
1. In the Razorpay Dashboard, navigate to **Settings** → **Webhooks**.
2. Click **Add New Webhook**.
3. Set Webhook URL to: `https://your-domain.com/api/payments/webhook`.
4. Choose Secret and add it to `RAZORPAY_WEBHOOK_SECRET`.
5. Select active events:
   - `order.paid`
   - `payment.captured`
   - `payment.failed`

---

## 3. Testing the Checkout Flow

1. Start the application:
   ```bash
   npm run dev
   ```
2. Navigate to **Payments** or **Events / Workshops** in the navigation bar.
3. Select an invoice, service scope, or event ticket.
4. Click **Pay via Razorpay** or **Launch Popup**.
5. When the Razorpay Standard Checkout opens:
   - Use test UPI IDs (e.g. `success@razorpay`) or test card details provided by Razorpay.
   - For Cards: Use any 16-digit card number provided in [Razorpay Test Card docs](https://razorpay.com/docs/payments/payments/test-card-details/), any future expiry date (e.g., `12/28`), and CVV `123`.
6. Complete the test payment:
   - The server verifies HMAC SHA256.
   - Transaction status updates to **Successful**.
   - Receipt modal appears with instant email notification confirmation.

---

## 4. Switching to Production (Live Mode)

When you are ready to accept real payments:

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Toggle from **Test Mode** to **Live Mode**.
3. Go to **Settings** → **API Keys** and generate **Live API Keys**.
4. Update your production environment variables:
   ```env
   RAZORPAY_KEY_ID=rzp_live_YourProductionKeyIdHere
   RAZORPAY_KEY_SECRET=YourProductionKeySecretHere
   RAZORPAY_WEBHOOK_SECRET=YourLiveWebhookSecretHere
   ```
5. Restart your server. **No code or architecture changes are required**—the application dynamically switches to live processing based on the provided keys!

---

## 5. Security & Verification Checklist

- [x] **Zero Secret Leakage:** `RAZORPAY_KEY_SECRET` is never exposed in React code or Vite browser bundles.
- [x] **Server-authoritative Pricing:** Amount calculations are verified on the backend.
- [x] **HMAC SHA256 Signature Verification:** Payments are only marked `PAID` after cryptographic verification.
- [x] **Graceful Error Handling:** Handled states for user cancellation, gateway timeouts, declined cards, and network errors.
- [x] **Persistent Tracking:** Verified transactions are recorded in the system state (`db_payments`) with audit timestamps and IDs.
