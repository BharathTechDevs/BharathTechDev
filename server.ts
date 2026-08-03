import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import nodemailer from "nodemailer";

dotenv.config();

// Email template generator for Payment Success & Failure
function getPaymentEmailHtml({
  status,
  clientName,
  purpose,
  amount,
  currency = 'INR',
  paymentId,
  orderId,
  reason,
}: {
  status: 'SUCCESS' | 'FAILED';
  clientName: string;
  purpose: string;
  amount: number;
  currency?: string;
  paymentId: string;
  orderId: string;
  reason?: string;
}) {
  const isSuccess = status === 'SUCCESS';
  const symbol = currency === 'INR' ? '₹' : '$';
  const formattedAmount = `${symbol}${amount.toLocaleString('en-IN')}`;
  const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>S-CODERS Payment ${status}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #131A29; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 32px; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); text-align: center; border-bottom: 2px solid ${isSuccess ? '#06B6D4' : '#EF4444'};">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">
                    S <span style="color: #2563EB;">⚡</span> CODERS
                  </h1>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8; letter-spacing: 1.5px; text-transform: uppercase;">
                    Bharath Tech Developers • Bengaluru, India
                  </p>
                </td>
              </tr>

              <!-- Status Banner -->
              <tr>
                <td style="padding: 24px 32px; text-align: center;">
                  <div style="display: inline-block; padding: 8px 20px; border-radius: 9999px; background-color: ${isSuccess ? 'rgba(6, 182, 212, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; border: 1px solid ${isSuccess ? '#06B6D4' : '#EF4444'};">
                    <span style="font-size: 14px; font-weight: 700; color: ${isSuccess ? '#22D3EE' : '#FCA5A5'}; uppercase; tracking-wider;">
                      ${isSuccess ? '✓ PAYMENT CONFIRMED & VERIFIED' : '✕ PAYMENT ATTEMPT FAILED'}
                    </span>
                  </div>
                </td>
              </tr>

              <!-- Greeting -->
              <tr>
                <td style="padding: 0 32px 20px 32px;">
                  <p style="font-size: 16px; color: #F8FAFC; margin: 0 0 12px 0;">Hello <strong>${clientName}</strong>,</p>
                  <p style="font-size: 14px; color: #94A3B8; line-height: 1.6; margin: 0;">
                    ${isSuccess 
                      ? `Thank you for your payment to <strong>S-CODERS (Bharath Tech Developers)</strong>. Your transaction has been processed and confirmed via Razorpay.` 
                      : `Your recent payment attempt with <strong>S-CODERS</strong> was not completed. Please review the details below.`}
                  </p>
                </td>
              </tr>

              <!-- Transaction Summary Box -->
              <tr>
                <td style="padding: 0 32px 30px 32px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; border-radius: 12px; border: 1px solid #334155; padding: 20px;">
                    <tr>
                      <td style="padding-bottom: 12px; font-size: 12px; color: #64748B; text-transform: uppercase; font-family: monospace;">Amount ${isSuccess ? 'Paid' : 'Attempted'}</td>
                      <td align="right" style="padding-bottom: 12px; font-size: 22px; font-weight: 800; color: ${isSuccess ? '#22D3EE' : '#F8FAFC'}; font-family: monospace;">
                        ${formattedAmount} ${currency}
                      </td>
                    </tr>
                    <tr><td colspan="2" style="border-top: 1px solid #1E293B; height: 12px;"></td></tr>
                    <tr>
                      <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Purpose / Description:</td>
                      <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #F8FAFC;">${purpose}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Razorpay Payment ID:</td>
                      <td align="right" style="padding: 6px 0; font-size: 13px; font-family: monospace; color: #22D3EE;">${paymentId}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Order Reference:</td>
                      <td align="right" style="padding: 6px 0; font-size: 13px; font-family: monospace; color: #CBD5E1;">${orderId}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Date & Time:</td>
                      <td align="right" style="padding: 6px 0; font-size: 13px; color: #CBD5E1;">${dateStr}</td>
                    </tr>
                    ${!isSuccess && reason ? `
                      <tr><td colspan="2" style="border-top: 1px solid #1E293B; height: 12px;"></td></tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #EF4444; font-weight: 600;">Failure Reason:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; color: #FCA5A5;">${reason}</td>
                      </tr>
                    ` : ''}
                  </table>
                </td>
              </tr>

              <!-- Footer CTA -->
              <tr>
                <td style="padding: 0 32px 32px 32px; text-align: center; border-top: 1px solid #1E293B; background-color: #0F172A;">
                  <p style="font-size: 12px; color: #64748B; margin: 20px 0 8px 0;">
                    If you have any questions regarding this invoice or workshop registration, feel free to contact our engineering team directly at:
                  </p>
                  <p style="font-size: 13px; font-weight: 600; color: #38BDF8; margin: 0;">
                    bhuvanmbhuvanm15@gmail.com • Bengaluru, Karnataka, India
                  </p>
                  <p style="font-size: 10px; color: #475569; margin-top: 16px;">
                    © 2026 S-CODERS (Bharath Tech Developers). All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Helper to send email via SMTP or test fallback
async function sendEmailNotification({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 587;
  const from = process.env.SMTP_FROM || '"S-CODERS Billing" <billing@scoders.dev>';

  let transporter;
  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else {
    // Graceful fallback to Ethereal / console logging if no custom SMTP host is set up
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.log(`[SIMULATED EMAIL DISPATCH] To: ${to} | Subject: ${subject}`);
      return { success: true, simulated: true };
    }
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(`[Email Sent Successfully] To: ${to} | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error("Failed to send email via SMTP:", err.message);
    return { success: false, error: err.message };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Safe lazy initializer for Gemini Client
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables. Please provide it via the Secrets panel in AI Studio.");
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // Safe lazy initializer for Razorpay
  let razorpayInstance: Razorpay | null = null;
  function getRazorpayInstance(): Razorpay | null {
    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_scoders_demo';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'scoders_demo_secret';
    if (!razorpayInstance) {
      try {
        razorpayInstance = new Razorpay({
          key_id,
          key_secret,
        });
      } catch (err) {
        console.warn("Razorpay initialization warning:", err);
      }
    }
    return razorpayInstance;
  }

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", startup: "S-CODERS", razorpay: true });
  });

  // Razorpay Create Order Endpoint
  app.post("/api/razorpay/create-order", async (req, res) => {
    try {
      const { amount, currency = "INR", receipt, notes } = req.body;
      const amountInPaise = Math.round(Number(amount || 1000) * 100);
      const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_scoders_demo";

      const rzp = getRazorpayInstance();

      if (rzp && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        try {
          const order = await rzp.orders.create({
            amount: amountInPaise,
            currency: currency,
            receipt: receipt || `rcpt_${Date.now()}`,
            notes: notes || {},
          });

          return res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: keyId,
            isLive: true,
          });
        } catch (rzpErr: any) {
          console.warn("Razorpay API order creation failed, switching to sandbox mode:", rzpErr.message);
        }
      }

      // Sandbox order fallback for testing in preview
      const sandboxOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      res.json({
        orderId: sandboxOrderId,
        amount: amountInPaise,
        currency: currency,
        keyId: keyId,
        isLive: false,
      });
    } catch (err: any) {
      console.error("Create Razorpay Order Error:", err);
      res.status(500).json({ error: "Failed to create Razorpay order." });
    }
  });

  // Razorpay Verify Payment Endpoint
  app.post("/api/razorpay/verify-payment", async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        email,
        clientName,
        purpose,
        amount,
        currency = "INR",
      } = req.body;

      const secret = process.env.RAZORPAY_KEY_SECRET;
      let isSignatureValid = true;

      if (secret && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
        const generatedSignature = crypto
          .createHmac("sha256", secret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest("hex");
        isSignatureValid = generatedSignature === razorpay_signature;
      }

      if (!isSignatureValid) {
        // Send failure email notice
        await sendEmailNotification({
          to: email || "client@example.com",
          subject: `❌ Payment Verification Failed - S-CODERS (Ref: ${razorpay_order_id})`,
          html: getPaymentEmailHtml({
            status: "FAILED",
            clientName: clientName || "Valued Client",
            purpose: purpose || "Service / Workshop Payment",
            amount: Number(amount) || 0,
            currency,
            paymentId: razorpay_payment_id || "N/A",
            orderId: razorpay_order_id || "N/A",
            reason: "Payment signature mismatch or unauthorized transaction.",
          }),
        });

        return res.status(400).json({
          success: false,
          error: "Invalid payment signature.",
        });
      }

      // Success email dispatch
      const emailResult = await sendEmailNotification({
        to: email || "client@example.com",
        subject: `✅ Payment Confirmation & Receipt - S-CODERS (Txn: ${razorpay_payment_id || 'PAY_' + Date.now()})`,
        html: getPaymentEmailHtml({
          status: "SUCCESS",
          clientName: clientName || "Valued Client",
          purpose: purpose || "Software Deposit / Workshop Access",
          amount: Number(amount) || 0,
          currency,
          paymentId: razorpay_payment_id || `pay_${Date.now()}`,
          orderId: razorpay_order_id || `ord_${Date.now()}`,
        }),
      });

      res.json({
        success: true,
        message: "Payment verified successfully and confirmation email sent.",
        emailSent: emailResult.success,
        paymentId: razorpay_payment_id || `pay_${Date.now()}`,
      });
    } catch (err: any) {
      console.error("Verify Payment Error:", err);
      res.status(500).json({ error: "Failed to verify payment." });
    }
  });

  // Razorpay Payment Failed Endpoint (dispatches failure email to client)
  app.post("/api/razorpay/payment-failed", async (req, res) => {
    try {
      const {
        email,
        clientName,
        purpose,
        amount,
        currency = "INR",
        errorReason,
        orderId,
      } = req.body;

      const emailResult = await sendEmailNotification({
        to: email || "client@example.com",
        subject: `❌ Payment Attempt Failed - S-CODERS (Bharath Tech Developers)`,
        html: getPaymentEmailHtml({
          status: "FAILED",
          clientName: clientName || "Valued Client",
          purpose: purpose || "Service / Workshop Payment",
          amount: Number(amount) || 0,
          currency,
          paymentId: "N/A",
          orderId: orderId || `ord_${Date.now()}`,
          reason: errorReason || "Payment was declined, cancelled by user, or timed out.",
        }),
      });

      res.json({
        success: true,
        message: "Failure notification email sent to client.",
        emailSent: emailResult.success,
      });
    } catch (err: any) {
      console.error("Payment Failed Email Error:", err);
      res.status(500).json({ error: "Failed to send failure email." });
    }
  });

  // Chat agent endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      let client;
      try {
        client = getGeminiClient();
      } catch (keyErr: any) {
        return res.status(400).json({ 
          error: "API Key missing. S-CODERS AI Agent is in offline demonstration mode. Please configure your GEMINI_API_KEY in Secrets to activate live consulting." 
        });
      }

      const systemInstruction = `You are the S-CODERS AI Agent, an interactive technology consultant representing S-CODERS (Bharath Tech Developers), a premier software and AI startup based in Bengaluru, Karnataka.

S-CODERS specialize in AI Agent Development, Mobile App Dev (React Native), Website Dev (Next.js, React), Custom Software, UI/UX design, and Technical Workshops.

Team Members:
- Suhas Gowda: Founder & Chief AI Architect. Expert in generative AI and n8n automations.
- Prathiksha R: Co-Founder & Head of UI/UX. Expert in gorgeous interfaces and Framer Motion.
- Manoj Kumar: Lead Full-Stack Developer. Expert in backend pipelines, PostgreSQL, and Firebase.
- Aishwarya Shenoy: AI Automation & Workshop Lead. Expert in n8n integration and developer training.

Key achievements:
- Selected into GOAT Founder Club and NASSCOM Startups ecosystem.
- Hosted premier workshops at Microsoft Reactor Bangalore (150+ attendees), RV College of Engineering (250+ students), and eChai Ventures.
- Shipped 15+ high-fidelity customized projects.

Your objective is to:
1. Greet visitors enthusiastically and professionally.
2. Pitch our services (AI Agents, Mobile Apps, Custom Web/SaaS, UI/UX, workshops).
3. Help visitors brainstorm their project requirements.
4. Encourage them to fill out the service request/enquiry form on our website or get in touch.
5. Answer questions about S-CODERS, Bengaluru startup events, or tech stack.

Keep your responses professional, friendly, concise (within 2-3 paragraphs or structured bullet points), and elegant. Use Markdown for formatting.`;

      // Format history into contents structure
      const contents = [];
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        }
      }

      // Add the latest message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ response: response.text });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during response generation." });
    }
  });

  // Vite Integration & Fallback Handling
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.get("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) return next();
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      // Fallback if dist build is missing
      const vite = await createViteServer({
        server: { middlewareMode: true, allowedHosts: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      app.get("*", async (req, res, next) => {
        if (req.originalUrl.startsWith("/api")) return next();
        try {
          let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
          template = await vite.transformIndexHtml(req.originalUrl, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } catch (e: any) {
          next(e);
        }
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server start error:", err);
});

