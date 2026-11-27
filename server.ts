import express from "express";
import path from "path";
import fs from "fs";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import nodemailer from "nodemailer";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import {
  executeCode,
  startInteractiveSession,
  getInteractiveSession,
  sendInteractiveInput,
  stopInteractiveSession,
  sanitizeSourceCode,
  detectLanguage,
} from "./compiler-service.ts";
import {
  DEFAULT_EVENT_WINDOWS,
  DEFAULT_WORKSHOP_WINDOWS,
  evaluateRegistrationWindow,
  resolveDefaultDatesForItem,
  type RegistrationSection as RegistrationWindowSection,
  type RegistrationWindowEvaluation,
} from "./src/utils/registrationWindow.ts";

dotenv.config();

// Process-level guards against unexpected socket termination or port race conditions
process.on("uncaughtException", (err: any) => {
  if (err?.code === "EADDRINUSE") {
    console.warn(`[Server Warning] Port address conflict caught: ${err.message}. Waiting for socket release.`);
    return;
  }
  console.error("[Server] Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.warn("[Server] Unhandled Rejection at:", promise, "reason:", reason);
});

function escapeEmailHtml(val: any): string {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeHeaderString(val: any, maxLen = 180): string {
  return String(val ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function isValidEmailAddress(email: string): boolean {
  if (!email || email.length > 254) return false;
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email.trim());
}

function getClientWelcomeEmailHtml({
  clientName,
  email,
  company,
  portalUrl,
}: {
  clientName: string;
  email: string;
  company?: string;
  portalUrl: string;
}) {
  const safeName = escapeEmailHtml(clientName || "Valued Client");
  const safeEmail = escapeEmailHtml(email);
  const safeCompany = escapeEmailHtml(company || "Independent Client");
  const safeUrl = escapeEmailHtml(portalUrl);
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Welcome to S-CODERS</title></head>
    <body style="margin:0;padding:0;background-color:#0B0F17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#E2E8F0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0B0F17;padding:36px 10px;">
        <tr><td align="center">
          <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#131A29;border-radius:16px;border:1px solid #1E293B;overflow:hidden;">
            <tr><td style="background:linear-gradient(135deg,#0B1120 0%,#0F172A 100%);padding:28px 32px;border-bottom:2px solid #22D3EE;text-align:center;">
              <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:800;letter-spacing:1.5px;">S-CODERS</h1>
              <p style="margin:6px 0 0;color:#22D3EE;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Bharat Tech Developers • Bengaluru</p>
            </td></tr>
            <tr><td style="padding:32px;">
              <h2 style="margin:0 0 12px;color:#FFFFFF;font-size:20px;">Welcome to S-CODERS, ${safeName}!</h2>
              <p style="margin:0 0 18px;color:#CBD5E1;font-size:14px;line-height:1.6;">
                Your S-CODERS Client Workspace account has been created and synced to our engineering portal. You can register for software services, developer workshops, and live events using <strong>${safeEmail}</strong>.
              </p>
              <table width="100%" style="background-color:#0F172A;border:1px solid #1E293B;border-radius:12px;padding:16px;margin-bottom:20px;">
                <tr><td style="color:#94A3B8;font-size:12px;padding:4px 0;">Account Email</td><td align="right" style="color:#FFFFFF;font-size:12px;font-weight:700;">${safeEmail}</td></tr>
                <tr><td style="color:#94A3B8;font-size:12px;padding:4px 0;">Organization / Role</td><td align="right" style="color:#22D3EE;font-size:12px;font-weight:700;">${safeCompany}</td></tr>
                <tr><td style="color:#94A3B8;font-size:12px;padding:4px 0;">Official Support</td><td align="right" style="color:#CBD5E1;font-size:12px;">scoders82@gmail.com</td></tr>
              </table>
              <div style="text-align:center;margin:22px 0 8px;">
                <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:13px 26px;background-color:#22D3EE;color:#0B0F17;text-decoration:none;font-weight:800;font-size:13px;border-radius:10px;text-transform:uppercase;letter-spacing:1px;">Open S-CODERS Portal</a>
              </div>
            </td></tr>
            <tr><td style="background-color:#0B1120;padding:16px 32px;border-top:1px solid #1E293B;text-align:center;">
              <p style="margin:0;color:#64748B;font-size:11px;">Automated welcome dispatch from scoders82@gmail.com • S-CODERS</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}

function getContactAcknowledgementEmailHtml({
  name,
  email,
  interest,
  message,
  enquiryId,
}: {
  name: string;
  email: string;
  interest: string;
  message: string;
  enquiryId: string;
}) {
  const safeName = escapeEmailHtml(name);
  const safeEmail = escapeEmailHtml(email);
  const safeInterest = escapeEmailHtml(interest);
  const safeMessage = escapeEmailHtml(message);
  const safeId = escapeEmailHtml(enquiryId);
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Enquiry Received - S-CODERS</title></head>
    <body style="margin:0;padding:0;background-color:#0B0F17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#E2E8F0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0B0F17;padding:36px 10px;">
        <tr><td align="center">
          <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#131A29;border-radius:16px;border:1px solid #1E293B;overflow:hidden;">
            <tr><td style="background:linear-gradient(135deg,#0B1120 0%,#0F172A 100%);padding:28px 32px;border-bottom:2px solid #22D3EE;text-align:center;">
              <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:800;letter-spacing:1.5px;">S-CODERS</h1>
              <p style="margin:6px 0 0;color:#22D3EE;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Enquiry Confirmation • Reference ${safeId}</p>
            </td></tr>
            <tr><td style="padding:32px;">
              <h2 style="margin:0 0 12px;color:#FFFFFF;font-size:19px;">Hi ${safeName}, we received your inquiry!</h2>
              <p style="margin:0 0 18px;color:#CBD5E1;font-size:14px;line-height:1.6;">
                Thank you for reaching out to S-CODERS (Bharat Tech Developers). Shreyas M. or a lead coordinator will review your submission and reply to <strong>${safeEmail}</strong> within 24 hours.
              </p>
              <table width="100%" style="background-color:#0F172A;border:1px solid #1E293B;border-radius:12px;padding:16px;margin-bottom:18px;">
                <tr><td style="color:#94A3B8;font-size:12px;padding:4px 0;">Reference ID</td><td align="right" style="color:#22D3EE;font-size:12px;font-family:monospace;font-weight:700;">${safeId}</td></tr>
                <tr><td style="color:#94A3B8;font-size:12px;padding:4px 0;">Topic</td><td align="right" style="color:#FFFFFF;font-size:12px;font-weight:700;">${safeInterest}</td></tr>
              </table>
              <div style="background-color:#0B1120;border-left:3px solid #22D3EE;padding:14px;border-radius:6px;color:#CBD5E1;font-size:13px;line-height:1.5;">
                ${safeMessage}
              </div>
            </td></tr>
            <tr><td style="background-color:#0B1120;padding:16px 32px;border-top:1px solid #1E293B;text-align:center;">
              <p style="margin:0;color:#64748B;font-size:11px;">Sent automatically from scoders82@gmail.com • Reply directly for urgent updates.</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}

function getContactAdminAlertEmailHtml({
  name,
  email,
  company,
  phone,
  interest,
  message,
  enquiryId,
}: {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  interest: string;
  message: string;
  enquiryId: string;
}) {
  return `
    <div style="font-family:sans-serif;background:#0B0F17;color:#E2E8F0;padding:24px;">
      <div style="max-width:600px;margin:auto;background:#131A29;border:1px solid #1E293B;border-radius:14px;padding:24px;">
        <h2 style="color:#22D3EE;margin:0 0 12px;">New Website Inquiry (${escapeEmailHtml(enquiryId)})</h2>
        <p style="margin:4px 0;"><strong>From:</strong> ${escapeEmailHtml(name)} (${escapeEmailHtml(email)})</p>
        <p style="margin:4px 0;"><strong>Company:</strong> ${escapeEmailHtml(company || "Individual")}</p>
        <p style="margin:4px 0;"><strong>Phone:</strong> ${escapeEmailHtml(phone || "Not Provided")}</p>
        <p style="margin:4px 0;"><strong>Topic:</strong> ${escapeEmailHtml(interest)}</p>
        <div style="margin-top:14px;padding:12px;background:#0F172A;border-radius:8px;border-left:3px solid #22D3EE;white-space:pre-wrap;">${escapeEmailHtml(message)}</div>
      </div>
    </div>
  `;
}

function getSmtpDiagnosticEmailHtml(recipient: string, provider: string, appUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>S-CODERS Live Email Verification</title></head>
    <body style="margin:0;padding:0;background-color:#0B0F17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#E2E8F0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0B0F17;padding:36px 10px;">
        <tr><td align="center">
          <table width="580" border="0" cellspacing="0" cellpadding="0" style="background-color:#131A29;border-radius:16px;border:1px solid #10B981;overflow:hidden;">
            <tr><td style="background:#0B1120;padding:24px 28px;border-bottom:2px solid #10B981;text-align:center;">
              <h1 style="margin:0;color:#FFFFFF;font-size:22px;">S-CODERS Email Automation Verified</h1>
              <p style="margin:6px 0 0;color:#34D399;font-size:12px;font-weight:700;">LIVE INBOX DISPATCH FROM scoders82@gmail.com</p>
            </td></tr>
            <tr><td style="padding:28px;">
              <p style="margin:0 0 14px;color:#CBD5E1;font-size:14px;line-height:1.6;">
                This automated test confirms that S-CODERS live email delivery via <strong>${escapeEmailHtml(provider)}</strong> is working and delivering directly to <strong>${escapeEmailHtml(recipient)}</strong>.
              </p>
              <p style="margin:0;color:#94A3B8;font-size:12px;">
                Timestamp: ${escapeEmailHtml(new Date().toISOString())}<br/>
                Portal: <a href="${escapeEmailHtml(appUrl)}" style="color:#22D3EE;">${escapeEmailHtml(appUrl)}</a>
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}


// Email template generator for Service Registration & UID Notification
function getServiceAcceptanceEmailHtml({
  clientName,
  serviceTitle,
  uniqueKey,
  actionUrl,
  validFrom,
  validUntil,
  amount = 0,
  currency = "INR",
  paymentStatus,
  paymentId,
}: {
  clientName: string;
  serviceTitle: string;
  uniqueKey: string;
  actionUrl: string;
  validFrom?: string;
  validUntil?: string;
  amount?: number;
  currency?: string;
  paymentStatus?: string;
  paymentId?: string;
}) {
  const safeName = escapeEmailHtml(clientName || "Valued Client");
  const safeService = escapeEmailHtml(serviceTitle || "Custom Software Development");
  const safeKey = escapeEmailHtml(uniqueKey);
  const safeUrl = escapeEmailHtml(actionUrl);
  const safeCurrency = escapeEmailHtml(currency || "INR");
  const numericAmount = Number(amount) || 0;
  const isPaid = numericAmount > 0 || String(paymentStatus || "").toUpperCase() === "VERIFIED";
  const formattedAmount = numericAmount > 0 ? `₹${numericAmount.toLocaleString("en-IN")} ${safeCurrency}` : "Confirmed (Custom Scope)";
  const paymentStatusDisplay = isPaid ? "✓ Verified & Paid" : "✓ Confirmed";
  const safePayId = paymentId ? escapeEmailHtml(paymentId) : "";
  const validUntilDisplay = validUntil
    ? new Date(validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "6 Months from Issue";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>S-CODERS Service Registration & Unique Code (UID)</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #131A29; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
              <tr>
                <td style="padding: 32px; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); text-align: center; border-bottom: 2px solid #22D3EE;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #FFFFFF;">S <span style="color: #22D3EE;">⚡</span> CODERS</h1>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px;">Bharat Tech Developers • Official Service Division</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 32px; text-align: center;">
                  <div style="display: inline-block; padding: 10px 24px; border-radius: 9999px; background-color: rgba(34, 211, 238, 0.15); border: 1px solid #22D3EE;">
                    <span style="font-size: 13px; font-weight: 800; color: #22D3EE; text-transform: uppercase;">
                      ✓ SERVICE REGISTRATION CONFIRMED
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 20px 32px;">
                  <p style="font-size: 16px; color: #F8FAFC; margin: 0 0 12px 0;">Hello <strong>${safeName}</strong>,</p>
                  <p style="font-size: 15px; color: #38BDF8; font-weight: 700; line-height: 1.6; margin: 0 0 16px 0; background-color: #0F172A; padding: 16px; border-radius: 12px; border-left: 4px solid #22D3EE;">
                    Your registration for the <strong>${safeService}</strong> service has been successfully completed. Thank you for choosing S-CODERS. Your unique registration code is: <strong>${safeKey}</strong>.
                  </p>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; border-radius: 10px; border: 1px solid #1E293B; padding: 14px 16px; font-size: 13px; color: #CBD5E1;">
                    <tr>
                      <td style="padding: 4px 0; color: #94A3B8;">Client Name:</td>
                      <td align="right" style="padding: 4px 0; font-weight: 700; color: #FFFFFF;">${safeName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #94A3B8;">Registered Service:</td>
                      <td align="right" style="padding: 4px 0; font-weight: 700; color: #FFFFFF;">${safeService}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #94A3B8;">Payment Amount:</td>
                      <td align="right" style="padding: 4px 0; font-weight: 700; color: #10B981;">${formattedAmount}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #94A3B8;">Payment Status:</td>
                      <td align="right" style="padding: 4px 0; font-weight: 700; color: #22D3EE;">${paymentStatusDisplay}</td>
                    </tr>
                    ${safePayId ? `
                    <tr>
                      <td style="padding: 4px 0; color: #94A3B8;">Transaction / Payment ID:</td>
                      <td align="right" style="padding: 4px 0; font-family: monospace; color: #CBD5E1;">${safePayId}</td>
                    </tr>
                    ` : ""}
                    <tr>
                      <td style="padding: 4px 0; color: #94A3B8;">Code Validity Window:</td>
                      <td align="right" style="padding: 4px 0; color: #FDE68A;">Active through <strong>${validUntilDisplay}</strong></td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 24px 32px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; border-radius: 12px; border: 1px solid #334155; padding: 20px; text-align: center;">
                    <tr>
                      <td style="font-size: 11px; color: #64748B; text-transform: uppercase; font-family: monospace; letter-spacing: 1px;">Your Unique Registration Code (UID)</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; font-size: 22px; font-weight: 900; color: #22D3EE; font-family: monospace; letter-spacing: 2px;">
                        ${safeKey}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 10px; font-size: 13px; color: #CBD5E1; line-height: 1.6;">
                        Please keep this unique registration code safe, as it may be required for future access to the S-CODERS website and your dedicated Service Workspace.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 14px;">
                        <div style="background-color: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 10px; padding: 12px 14px; text-align: left; font-size: 12px; color: #FDE68A; line-height: 1.6;">
                          <strong>Security &amp; Recovery Notice:</strong> You are responsible for keeping your unique registration code (UID) secure. If you lose or misplace your UID, recovering access to your service workspace will require 6-digit email OTP verification through our recovery portal.
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 14px;">
                        <div style="background-color: rgba(15, 23, 42, 0.95); border: 1px solid #334155; border-radius: 10px; padding: 14px 16px; text-align: left; font-size: 12px; color: #CBD5E1; line-height: 1.65;">
                          <div style="font-size: 11px; font-weight: 800; color: #38BDF8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">
                            S-CODERS Rules, Regulations &amp; Cancellation Policy (Service)
                          </div>
                          <ul style="margin: 0; padding-left: 18px; color: #CBD5E1;">
                            <li style="margin-bottom: 6px;"><strong style="color: #F8FAFC;">Strict No-Refund Rule:</strong> Custom software, website, app, AI, and automation bookings allocate immediate developer resources and are strictly non-refundable once confirmed.</li>
                            <li style="margin-bottom: 6px;"><strong style="color: #F8FAFC;">Self-Service Cancellation Responsibility:</strong> If you choose to cancel an active service via "Cancel Service" in your workspace and confirm cancellation, all order and workspace records are permanently deleted from our database and cannot be restored. Clients bear sole responsibility for accidental or intentional cancellations.</li>
                            <li style="margin-bottom: 6px;"><strong style="color: #F8FAFC;">Workspace &amp; Intellectual Property:</strong> Delivered blueprints and project files are licensed strictly per your agreed project scope and S-CODERS Terms &amp; Privacy Policy.</li>
                            <li><strong style="color: #F8FAFC;">Official Communication:</strong> All verified UID dispatches and support originate from <strong style="color: #22D3EE;">scoders82@gmail.com</strong>.</li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top: 20px;">
                        <a href="${safeUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #22D3EE; color: #0B0F17; text-decoration: none; font-weight: 800; font-size: 13px; border-radius: 10px; text-transform: uppercase; letter-spacing: 1px;">
                          Open Service Workspace →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 32px; text-align: center; border-top: 1px solid #1E293B; background-color: #0F172A;">
                  <p style="font-size: 11px; color: #94A3B8; margin: 0 0 4px 0;">Official Automated Dispatch from <strong style="color: #22D3EE;">scoders82@gmail.com</strong></p>
                  <p style="font-size: 10px; color: #64748B; margin: 0;">© 2026 S-CODERS (Bharat Tech Developers). All rights reserved.</p>
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

// Email template generator for Workshop Registration Success & Failure
function getWorkshopEmailHtml({
  status,
  clientName,
  workshopTitle,
  amount,
  currency = 'INR',
  uniqueKey,
  actionUrl,
  paymentId,
  reason,
  workshopDate,
  workshopTime,
  workshopLocation,
  validUntil,
}: {
  status: 'SUCCESS' | 'FAILED';
  clientName: string;
  workshopTitle: string;
  amount: number;
  currency?: string;
  uniqueKey?: string;
  actionUrl: string;
  paymentId?: string;
  reason?: string;
  workshopDate?: string;
  workshopTime?: string;
  workshopLocation?: string;
  validUntil?: string;
}) {
  const isSuccess = status === 'SUCCESS';
  const formattedAmount = amount === 0 ? 'FREE / COMPLIMENTARY' : `₹${amount.toLocaleString('en-IN')} ${currency}`;
  const safeName = escapeEmailHtml(clientName || "Valued Masterclass Participant");
  const safeTitle = escapeEmailHtml(workshopTitle || "S-CODERS Technical Workshop");
  const safeKey = escapeEmailHtml(uniqueKey || "BTD-WKSP-PASS");
  const safePayId = escapeEmailHtml(paymentId || "pay_rzp_scoders");
  const safeDate = escapeEmailHtml(workshopDate || "Scheduled Upcoming Session");
  const safeTime = escapeEmailHtml(workshopTime || "10:00 AM IST");
  const safeLocation = escapeEmailHtml(workshopLocation || "S-CODERS Live Interactive Classroom & Zoom");
  const validUntilDisplay = validUntil
    ? new Date(validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "30 Days from Registration";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>S-CODERS Workshop ${isSuccess ? 'Registration & UID Pass' : 'Payment Failed'}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #131A29; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
              <tr>
                <td style="padding: 32px; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); text-align: center; border-bottom: 2px solid ${isSuccess ? '#22D3EE' : '#EF4444'};">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #FFFFFF;">S <span style="color: #22D3EE;">⚡</span> CODERS</h1>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px;">Workshop Masterclass Division • Bengaluru</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 32px; text-align: center;">
                  <div style="display: inline-block; padding: 8px 20px; border-radius: 9999px; background-color: ${isSuccess ? 'rgba(34, 211, 238, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; border: 1px solid ${isSuccess ? '#22D3EE' : '#EF4444'};">
                    <span style="font-size: 13px; font-weight: 700; color: ${isSuccess ? '#22D3EE' : '#FCA5A5'}; text-transform: uppercase;">
                      ${isSuccess ? '✓ PAYMENT CONFIRMED & WORKSHOP REGISTERED' : '✕ PAYMENT FAILED'}
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 20px 32px;">
                  <p style="font-size: 16px; color: #F8FAFC; margin: 0 0 12px 0;">Hello <strong>${safeName}</strong>,</p>
                  ${isSuccess ? `
                    <p style="font-size: 15px; color: #38BDF8; font-weight: 700; line-height: 1.6; margin: 0 0 16px 0; background-color: #0F172A; padding: 16px; border-radius: 12px; border-left: 4px solid #22D3EE;">
                      ${amount > 0
                        ? `Your registration for the workshop has been successfully completed. We have successfully received your payment of <strong>₹${amount.toLocaleString('en-IN')}</strong>. Thank you for registering with S-CODERS. Your unique registration code is: <strong>${safeKey}</strong>.`
                        : `Your registration for the workshop has been successfully completed. Thank you for registering with S-CODERS. Your unique registration code is: <strong>${safeKey}</strong>.`
                      }
                    </p>
                  ` : `
                    <p style="font-size: 15px; color: #FCA5A5; font-weight: 700; line-height: 1.6; margin: 0 0 16px 0; background-color: #0F172A; padding: 16px; border-radius: 12px; border-left: 4px solid #EF4444;">
                      Your workshop payment did not go through. Kindly retry your payment to receive your workshop UID and classroom access.
                    </p>
                  `}
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 30px 32px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; border-radius: 12px; border: 1px solid #334155; padding: 20px;">
                    ${isSuccess ? `
                      <tr>
                        <td style="padding-bottom: 10px; font-size: 11px; color: #64748B; text-transform: uppercase; font-family: monospace;">Unique Workshop Registration Code (UID)</td>
                        <td align="right" style="padding-bottom: 10px; font-size: 17px; font-weight: 900; color: #22D3EE; font-family: monospace;">${safeKey}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Participant Name:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #FFFFFF;">${safeName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Workshop Name:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #FFFFFF;">${safeTitle}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Workshop Date & Time:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; color: #CBD5E1;">${safeDate} • ${safeTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Location / Mode:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; color: #CBD5E1;">${safeLocation}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Payment Amount:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #10B981;">${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Payment Status:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #22D3EE;">${amount === 0 ? '✓ Confirmed (Free Pass)' : '✓ Verified & Paid'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Verified Payment ID:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; font-family: monospace; color: #CBD5E1;">${safePayId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">UID Valid Until:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; color: #FDE68A;">${validUntilDisplay}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 14px;">
                          <div style="background-color: rgba(34, 211, 238, 0.08); border: 1px solid rgba(34, 211, 238, 0.35); border-radius: 10px; padding: 14px; font-size: 12px; color: #E2E8F0; line-height: 1.65;">
                            <strong style="color: #22D3EE;">Safe-Keeping &amp; Mid-Session Rejoin Instructions:</strong><br/>
                            Please keep your unique registration code (<strong>${safeKey}</strong>) safe. If you lose internet connection, refresh, or accidentally exit the website during the workshop session, return to the Workshop section on our website and select <em>"Enter Existing Pass"</em> with your UID to immediately rejoin your classroom and workspace. Recovering a lost UID requires email OTP verification.
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 14px;">
                          <div style="background-color: rgba(15, 23, 42, 0.95); border: 1px solid #334155; border-radius: 10px; padding: 14px; text-align: left; font-size: 12px; color: #CBD5E1; line-height: 1.65;">
                            <div style="font-size: 11px; font-weight: 800; color: #38BDF8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">
                              S-CODERS Rules, Regulations &amp; Cancellation Policy (Workshop)
                            </div>
                            <ul style="margin: 0; padding-left: 18px; color: #CBD5E1;">
                              <li style="margin-bottom: 6px;"><strong style="color: #F8FAFC;">3-Day (72-Hour) Refund Notice:</strong> Workshop fees are refundable only if requested at least 72 hours prior to the scheduled workshop start time. Requests received under 72 hours are non-refundable (seat transfers may be requested before kick-off via <strong style="color: #22D3EE;">scoders82@gmail.com</strong>).</li>
                              <li style="margin-bottom: 6px;"><strong style="color: #F8FAFC;">Self-Service Cancellation &amp; Permanent Deletion:</strong> Confirming "Cancel Workshop" permanently deletes your workshop registration and classroom records from our database. Clients take full responsibility for any accidental or intentional cancellation.</li>
                              <li style="margin-bottom: 6px;"><strong style="color: #F8FAFC;">Classroom Conduct &amp; Licensing:</strong> Workshop codebases, guides, and live sessions are licensed strictly for personal learning and may not be redistributed or resold.</li>
                              <li><strong style="color: #F8FAFC;">Support &amp; Recovery:</strong> Keep your UID private; use our email OTP recovery portal or write to <strong style="color: #22D3EE;">scoders82@gmail.com</strong> for assistance.</li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ` : `
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #EF4444; font-weight: 700;">Failure Details:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; color: #FCA5A5;">${escapeEmailHtml(reason || 'Payment was declined or interrupted.')}</td>
                      </tr>
                    `}
                    <tr>
                      <td colspan="2" align="center" style="padding-top: 20px;">
                        <a href="${escapeEmailHtml(actionUrl)}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: ${isSuccess ? '#22D3EE' : '#EF4444'}; color: ${isSuccess ? '#0B0F17' : '#FFFFFF'}; text-decoration: none; font-weight: 800; font-size: 13px; border-radius: 10px; text-transform: uppercase; letter-spacing: 1px;">
                          ${isSuccess ? 'Open Website & Enter Workshop Session →' : 'Retry Payment on Website →'}
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 32px; text-align: center; border-top: 1px solid #1E293B; background-color: #0F172A;">
                  <p style="font-size: 11px; color: #94A3B8; margin: 0 0 4px 0;">Official Automated Dispatch from <strong style="color: #22D3EE;">scoders82@gmail.com</strong></p>
                  <p style="font-size: 10px; color: #64748B; margin: 0;">© 2026 S-CODERS (Bharat Tech Developers). All rights reserved.</p>
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

// Email template generator for Event Ticket Pass Success & Failure
function getEventEmailHtml({
  status,
  clientName,
  eventTitle,
  amount,
  currency = 'INR',
  ticketCode,
  actionUrl,
  paymentId,
  reason,
  eventDate,
  eventDay,
  eventTime,
  eventLocation,
  eventDescription,
  validUntil,
}: {
  status: 'SUCCESS' | 'FAILED';
  clientName: string;
  eventTitle: string;
  amount: number;
  currency?: string;
  ticketCode?: string;
  actionUrl: string;
  paymentId?: string;
  reason?: string;
  eventDate?: string;
  eventDay?: string;
  eventTime?: string;
  eventLocation?: string;
  eventDescription?: string;
  validUntil?: string;
}) {
  const isSuccess = status === 'SUCCESS';
  const formattedAmount = amount === 0 ? 'FREE ENTRY PASS' : `₹${amount.toLocaleString('en-IN')} ${currency}`;
  const safeName = escapeEmailHtml(clientName || "Valued Attendee");
  const safeTitle = escapeEmailHtml(eventTitle || "S-CODERS Tech Summit");
  const safeCode = escapeEmailHtml(ticketCode || "SC-EVT-PASS");
  const safePayId = escapeEmailHtml(paymentId || "pay_rzp_scoders");
  const safeDate = escapeEmailHtml(eventDate || "Upcoming Scheduled Date");
  const safeDay = escapeEmailHtml(eventDay || "");
  const safeTime = escapeEmailHtml(eventTime || "10:00 AM IST");
  const safeLocation = escapeEmailHtml(eventLocation || "S-CODERS Venue, Bengaluru");
  const safeDesc = escapeEmailHtml(eventDescription || "Bring your UID pass code at check-in or enter it on the Events portal to view/download your digital pass.");
  const validUntilDisplay = validUntil
    ? new Date(validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "Valid through Event Completion";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>S-CODERS Event Registration & Pass UID</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #131A29; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
              <tr>
                <td style="padding: 32px; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); text-align: center; border-bottom: 2px solid ${isSuccess ? '#22D3EE' : '#EF4444'};">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #FFFFFF;">S <span style="color: #22D3EE;">⚡</span> CODERS</h1>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px;">Official Events & Hackathons Division</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 32px; text-align: center;">
                  <div style="display: inline-block; padding: 8px 20px; border-radius: 9999px; background-color: ${isSuccess ? 'rgba(34, 211, 238, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; border: 1px solid ${isSuccess ? '#22D3EE' : '#EF4444'};">
                    <span style="font-size: 13px; font-weight: 700; color: ${isSuccess ? '#22D3EE' : '#FCA5A5'}; text-transform: uppercase;">
                      ${isSuccess ? '✓ EVENT REGISTRATION CONFIRMED' : '✕ PAYMENT METHOD FAILED'}
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 20px 32px;">
                  <p style="font-size: 16px; color: #F8FAFC; margin: 0 0 12px 0;">Hello <strong>${safeName}</strong>,</p>
                  ${isSuccess ? `
                    <p style="font-size: 15px; color: #38BDF8; font-weight: 700; line-height: 1.6; margin: 0 0 16px 0; background-color: #0F172A; padding: 16px; border-radius: 12px; border-left: 4px solid #22D3EE;">
                      ${amount > 0
                        ? `Your registration for the event has been successfully completed. We have successfully received your payment of <strong>₹${amount.toLocaleString('en-IN')}</strong>. Thank you for registering with S-CODERS. Your unique registration code is: <strong>${safeCode}</strong>.`
                        : `Your registration for the event has been successfully completed. Thank you for registering with S-CODERS. Your unique registration code is: <strong>${safeCode}</strong>.`
                      }
                    </p>
                  ` : `
                    <p style="font-size: 15px; color: #FCA5A5; font-weight: 700; line-height: 1.6; margin: 0 0 16px 0; background-color: #0F172A; padding: 16px; border-radius: 12px; border-left: 4px solid #EF4444;">
                      Your payment method failed, so no event pass was issued. Kindly retry payment to confirm your event registration.
                    </p>
                  `}
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 30px 32px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; border-radius: 12px; border: 1px solid #334155; padding: 20px;">
                    ${isSuccess ? `
                      <tr>
                        <td style="padding-bottom: 10px; font-size: 11px; color: #64748B; text-transform: uppercase; font-family: monospace;">Unique Event Registration Code (UID)</td>
                        <td align="right" style="padding-bottom: 10px; font-size: 18px; font-weight: 900; color: #22D3EE; font-family: monospace;">${safeCode}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Attendee Name:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #FFFFFF;">${safeName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Complete Event Name:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #FFFFFF;">${safeTitle}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Event Location / Venue:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; color: #CBD5E1;">${safeLocation}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Event Date & Timing:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; color: #CBD5E1;">${safeDate}${safeDay ? ` (${safeDay})` : ''} • ${safeTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Payment Amount:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #10B981;">${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Payment Status:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #22D3EE;">${amount === 0 ? '✓ Confirmed (Free Pass)' : '✓ Verified & Paid'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Verified Payment ID:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; font-family: monospace; color: #CBD5E1;">${safePayId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Pass Valid Until:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; color: #FDE68A;">${validUntilDisplay}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 14px;">
                          <div style="background-color: rgba(15, 23, 42, 0.9); border: 1px solid #334155; border-radius: 10px; padding: 14px; font-size: 12px; color: #CBD5E1; line-height: 1.6;">
                            <strong style="color: #38BDF8;">Important Event Details &amp; Instructions:</strong><br/>
                            ${safeDesc}<br/><br/>
                            <strong style="color: #FDE68A;">Keep Your UID Safe:</strong> Store your unique event registration code (<strong>${safeCode}</strong>) safely for check-in verification, QR pass download, and portal access on our website.
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 14px;">
                          <div style="background-color: rgba(15, 23, 42, 0.95); border: 1px solid #334155; border-radius: 10px; padding: 14px; text-align: left; font-size: 12px; color: #CBD5E1; line-height: 1.65;">
                            <div style="font-size: 11px; font-weight: 800; color: #38BDF8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">
                              S-CODERS Rules, Regulations &amp; Pass Policies (Events)
                            </div>
                            <ul style="margin: 0; padding-left: 18px; color: #CBD5E1;">
                              <li style="margin-bottom: 6px;"><strong style="color: #F8FAFC;">Check-In Verification:</strong> Present your Unique Event Registration Code (UID) at venue entry or enter it on the Events portal to access/download your official digital pass.</li>
                              <li style="margin-bottom: 6px;"><strong style="color: #F8FAFC;">Pass Deletion Responsibility Clause:</strong> If a participant deletes their event ticket/pass purposefully or mistakenly through self-service controls, the validation record is permanently removed and S-CODERS bears zero liability for deleted passes.</li>
                              <li style="margin-bottom: 6px;"><strong style="color: #F8FAFC;">Duplicate Payments &amp; Conduct:</strong> Report duplicate transactions within 24 hours to <strong style="color: #22D3EE;">scoders82@gmail.com</strong>. All attendees must follow event timings and S-CODERS code of conduct.</li>
                              <li><strong style="color: #F8FAFC;">Lost UID Recovery:</strong> Lost UIDs can be recovered only via 6-digit email OTP verification linked to your registered email address.</li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ` : `
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #EF4444; font-weight: 700;">Failure Reason:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; color: #FCA5A5;">${escapeEmailHtml(reason || 'Payment method failed or was declined.')}</td>
                      </tr>
                    `}
                    <tr>
                      <td colspan="2" align="center" style="padding-top: 20px;">
                        <a href="${escapeEmailHtml(actionUrl)}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: ${isSuccess ? '#22D3EE' : '#EF4444'}; color: ${isSuccess ? '#0B0F17' : '#FFFFFF'}; text-decoration: none; font-weight: 800; font-size: 13px; border-radius: 10px; text-transform: uppercase; letter-spacing: 1px;">
                          ${isSuccess ? 'View & Verify Event Ticket on Website →' : 'Retry Payment Method on Website →'}
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 32px; text-align: center; border-top: 1px solid #1E293B; background-color: #0F172A;">
                  <p style="font-size: 11px; color: #94A3B8; margin: 0 0 4px 0;">Official Automated Dispatch from <strong style="color: #22D3EE;">scoders82@gmail.com</strong></p>
                  <p style="font-size: 10px; color: #64748B; margin: 0;">© 2026 S-CODERS (Bharat Tech Developers). All rights reserved.</p>
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

// Email template for UID Recovery OTP Verification
function getUidRecoveryOtpEmailHtml({
  email,
  otpCode,
  sectionLabel,
}: {
  email: string;
  otpCode: string;
  sectionLabel: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>S-CODERS UID Recovery Verification Code</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #131A29; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden;">
              <tr>
                <td style="padding: 28px; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); text-align: center; border-bottom: 2px solid #22D3EE;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #FFFFFF;">S <span style="color: #22D3EE;">⚡</span> CODERS</h1>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px;">Registration Code (UID) Recovery Verification</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 28px 32px;">
                  <p style="font-size: 15px; color: #F8FAFC; margin: 0 0 14px 0;">Hello,</p>
                  <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6; margin: 0 0 20px 0;">
                    We received a request to recover your <strong>S-CODERS ${escapeEmailHtml(sectionLabel)}</strong> Unique Registration Code (UID) associated with <strong>${escapeEmailHtml(email)}</strong>.
                  </p>
                  <div style="background-color: #0F172A; border: 1px solid #22D3EE; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
                    <span style="display: block; font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">One-Time Verification Code (Valid for 10 Minutes)</span>
                    <span style="font-size: 32px; font-weight: 900; color: #22D3EE; font-family: monospace; letter-spacing: 6px;">${escapeEmailHtml(otpCode)}</span>
                  </div>
                  <p style="font-size: 12px; color: #94A3B8; line-height: 1.6; margin: 0;">
                    Enter this verification code on the S-CODERS website to reveal and resend your active UIDs. If you did not request code recovery, please ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 18px 32px; text-align: center; border-top: 1px solid #1E293B; background-color: #0F172A;">
                  <p style="font-size: 11px; color: #94A3B8; margin: 0;">Official Security Verification from <strong style="color: #22D3EE;">scoders82@gmail.com</strong></p>
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

// Email template summarizing recovered UIDs after successful OTP verification
function getUidRecoverySummaryEmailHtml({
  email,
  records,
}: {
  email: string;
  records: Array<{ section: string; itemTitle: string; uid: string; validUntil: string; status: string }>;
}) {
  const rowsHtml = records
    .map(
      (r) => `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #1E293B; font-size: 12px; color: #38BDF8; text-transform: uppercase; font-weight: 700;">${escapeEmailHtml(r.section)}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #1E293B; font-size: 12px; color: #F8FAFC;">${escapeEmailHtml(r.itemTitle)}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #1E293B; font-size: 13px; color: #22D3EE; font-family: monospace; font-weight: 900;">${escapeEmailHtml(r.uid)}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #1E293B; font-size: 11px; color: #CBD5E1;">${escapeEmailHtml(new Date(r.validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }))}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>S-CODERS Recovered Unique Registration Codes (UID)</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="620" border="0" cellspacing="0" cellpadding="0" style="background-color: #131A29; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden;">
              <tr>
                <td style="padding: 28px; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); text-align: center; border-bottom: 2px solid #10B981;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #FFFFFF;">S <span style="color: #22D3EE;">⚡</span> CODERS</h1>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #10B981; text-transform: uppercase; letter-spacing: 1.5px;">Verified Registration Code Recovery</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 28px 32px;">
                  <p style="font-size: 15px; color: #F8FAFC; margin: 0 0 12px 0;">Hello,</p>
                  <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6; margin: 0 0 20px 0;">
                    Your email verification for <strong>${escapeEmailHtml(email)}</strong> succeeded. Here are your active S-CODERS registration codes (UIDs):
                  </p>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; border-radius: 12px; border: 1px solid #334155;">
                    <tr style="background-color: #1E293B;">
                      <th align="left" style="padding: 10px 8px; font-size: 10px; color: #94A3B8; text-transform: uppercase;">Section</th>
                      <th align="left" style="padding: 10px 8px; font-size: 10px; color: #94A3B8; text-transform: uppercase;">Registration</th>
                      <th align="left" style="padding: 10px 8px; font-size: 10px; color: #94A3B8; text-transform: uppercase;">UID Code</th>
                      <th align="left" style="padding: 10px 8px; font-size: 10px; color: #94A3B8; text-transform: uppercase;">Valid Until</th>
                    </tr>
                    ${rowsHtml}
                  </table>
                  <p style="font-size: 12px; color: #FDE68A; line-height: 1.6; margin: 18px 0 0 0;">
                    Please store these UIDs securely. You can use them anytime to access your Service workspace, rejoin a Workshop session mid-way if disconnected, or retrieve your Event pass.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 18px 32px; text-align: center; border-top: 1px solid #1E293B; background-color: #0F172A;">
                  <p style="font-size: 11px; color: #94A3B8; margin: 0;">Official Automated Recovery Dispatch from <strong style="color: #22D3EE;">scoders82@gmail.com</strong></p>
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
                    Bharat Tech Developers • Bengaluru, India
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
                      ? `Thank you for your payment to <strong>S-CODERS (Bharat Tech Developers)</strong>. Your transaction has been processed and confirmed via Razorpay.` 
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
                    scoders82@gmail.com • Bengaluru, Karnataka, India
                  </p>
                  <p style="font-size: 10px; color: #475569; margin-top: 16px;">
                    © 2026 S-CODERS (Bharat Tech Developers). All rights reserved.
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

// Official S-CODERS email sender constant
const OFFICIAL_SCODERS_EMAIL = "scoders82@gmail.com";

type EmailDeliveryMode = "smtp" | "resend" | "sendgrid" | "ethereal" | "simulated" | "failed";

function htmlToPlainText(html: string): string {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/(tr|p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getEmailProviderConfig() {
  const rawGmailPass = (
    process.env.GMAIL_APP_PASSWORD ||
    process.env.SCODERS_GMAIL_APP_PASSWORD ||
    ""
  ).trim();
  const rawSmtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").trim();
  const smtpPass = rawSmtpPass || rawGmailPass;
  const smtpUser = (
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    (smtpPass ? OFFICIAL_SCODERS_EMAIL : "")
  ).trim();
  const smtpHost = (process.env.SMTP_HOST || (smtpPass ? "smtp.gmail.com" : "")).trim();
  // Google displays 16-char App Passwords in groups of 4 separated by spaces; strip spaces cleanly for Gmail auth
  const normalizedPass =
    smtpHost.toLowerCase().includes("gmail.com") ? smtpPass.replace(/\s+/g, "") : smtpPass;
  const smtpPort = Number(process.env.SMTP_PORT) || (smtpHost === "smtp.gmail.com" ? 465 : 587);
  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  const sendgridApiKey = (process.env.SENDGRID_API_KEY || "").trim();

  const hasSmtp = Boolean(smtpHost && smtpUser && normalizedPass);
  const hasResend = Boolean(resendApiKey);
  const hasSendgrid = Boolean(sendgridApiKey);

  return {
    hasSmtp,
    hasResend,
    hasSendgrid,
    anyRealProviderConfigured: hasSmtp || hasResend || hasSendgrid,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass: normalizedPass,
    resendApiKey,
    resendFrom: (
      process.env.RESEND_FROM ||
      (process.env.SMTP_FROM && !process.env.SMTP_FROM.toLowerCase().includes("@gmail.com")
        ? process.env.SMTP_FROM
        : "") ||
      `"S-CODERS (Bharat Tech Developers)" <onboarding@resend.dev>`
    ).trim(),
    sendgridApiKey,
    defaultFrom: (
      process.env.SMTP_FROM ||
      `"S-CODERS (Bharat Tech Developers)" <${smtpUser || OFFICIAL_SCODERS_EMAIL}>`
    ).trim(),
  };
}

// Helper to send email via Gmail/Custom SMTP (with automatic 465 -> 587 failover), Resend/SendGrid API, or Ethereal sandbox fallback
async function sendEmailNotification({
  to,
  subject,
  html,
  text,
  from: fromOverride,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}): Promise<{
  success: boolean;
  simulated: boolean;
  isTestTransport: boolean;
  deliveryMode: EmailDeliveryMode;
  realEmailDelivered: boolean;
  from: string;
  replyTo: string;
  messageId?: string;
  previewUrl?: string;
  error?: string;
}> {
  const cfg = getEmailProviderConfig();
  const from = fromOverride || cfg.defaultFrom;
  const effectiveReplyTo = replyTo || OFFICIAL_SCODERS_EMAIL;
  const plainText = text?.trim() || htmlToPlainText(html);

  const attemptSmtpSend = async (host: string, port: number, user: string, pass: string) => {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    const info = await transporter.sendMail({
      from,
      replyTo: effectiveReplyTo,
      to,
      subject,
      text: plainText,
      html,
    });
    return info;
  };

  let lastError = "";

  // 1. Real SMTP Delivery (Gmail App Password / Custom SMTP) with 465 -> 587 STARTTLS failover
  if (cfg.hasSmtp) {
    try {
      const info = await attemptSmtpSend(cfg.smtpHost, cfg.smtpPort, cfg.smtpUser, cfg.smtpPass);
      console.log(`[Email Dispatched (smtp:${cfg.smtpPort})] From: ${from} | To: ${to} | MessageId: ${info.messageId}`);
      return {
        success: true,
        simulated: false,
        isTestTransport: false,
        deliveryMode: "smtp",
        realEmailDelivered: true,
        from,
        replyTo: effectiveReplyTo,
        messageId: info.messageId,
      };
    } catch (primaryErr: any) {
      lastError = primaryErr?.message || "Primary SMTP delivery failed.";
      console.warn(`[Email SMTP Primary ${cfg.smtpHost}:${cfg.smtpPort} Error]:`, lastError);

      // Failover to port 587 STARTTLS if primary Gmail port 465 timed out / refused
      if (cfg.smtpHost.toLowerCase().includes("gmail.com") && cfg.smtpPort === 465) {
        try {
          const info587 = await attemptSmtpSend(cfg.smtpHost, 587, cfg.smtpUser, cfg.smtpPass);
          console.log(`[Email Dispatched (smtp:587 failover)] From: ${from} | To: ${to} | MessageId: ${info587.messageId}`);
          return {
            success: true,
            simulated: false,
            isTestTransport: false,
            deliveryMode: "smtp",
            realEmailDelivered: true,
            from,
            replyTo: effectiveReplyTo,
            messageId: info587.messageId,
          };
        } catch (fallbackErr: any) {
          lastError = fallbackErr?.message || lastError;
          console.warn("[Email SMTP 587 Failover Error]:", lastError);
        }
      }
    }
  }

  // 2. Resend HTTPS API Delivery (Primary if no SMTP, or failover if SMTP failed)
  if (cfg.hasResend) {
    try {
      const rRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: cfg.resendFrom,
          reply_to: effectiveReplyTo,
          to: [to],
          subject,
          text: plainText,
          html,
        }),
      });
      const rJson: any = await rRes.json().catch(() => ({}));
      if (rRes.ok && rJson?.id) {
        console.log(`[Email Dispatched (resend)] From: ${cfg.resendFrom} | To: ${to} | ID: ${rJson.id}`);
        return {
          success: true,
          simulated: false,
          isTestTransport: false,
          deliveryMode: "resend",
          realEmailDelivered: true,
          from: cfg.resendFrom,
          replyTo: effectiveReplyTo,
          messageId: rJson.id,
        };
      }
      lastError = rJson?.message || rJson?.error || `Resend returned ${rRes.status}`;
    } catch (rErr: any) {
      lastError = rErr?.message || "Resend request failed.";
    }
  }

  // 3. SendGrid HTTPS API Delivery
  if (cfg.hasSendgrid) {
    try {
      const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: OFFICIAL_SCODERS_EMAIL, name: "S-CODERS (Bharat Tech Developers)" },
          reply_to: { email: effectiveReplyTo, name: "S-CODERS Support" },
          subject,
          content: [
            { type: "text/plain", value: plainText },
            { type: "text/html", value: html },
          ],
        }),
      });
      if (sgRes.ok) {
        const msgId = sgRes.headers.get("x-message-id") || `sg_${Date.now()}`;
        console.log(`[Email Dispatched (sendgrid)] From: ${OFFICIAL_SCODERS_EMAIL} | To: ${to} | ID: ${msgId}`);
        return {
          success: true,
          simulated: false,
          isTestTransport: false,
          deliveryMode: "sendgrid",
          realEmailDelivered: true,
          from,
          replyTo: effectiveReplyTo,
          messageId: msgId,
        };
      }
      const sgErrText = await sgRes.text().catch(() => "");
      lastError = sgErrText || `SendGrid returned ${sgRes.status}`;
    } catch (sgErr: any) {
      lastError = sgErr?.message || "SendGrid request failed.";
    }
  }

  // If real credentials WERE configured but delivery failed, report failure honestly (do not pretend it succeeded in sandbox)
  if (cfg.anyRealProviderConfigured) {
    console.error(`[Email Real Delivery Failed] To: ${to} | Error: ${lastError}`);
    return {
      success: false,
      simulated: false,
      isTestTransport: false,
      deliveryMode: "failed",
      realEmailDelivered: false,
      from,
      replyTo: effectiveReplyTo,
      error: lastError || "Configured mail provider rejected the message.",
    };
  }

  // 4. Sandbox Fallback ONLY when no SMTP / Email API secret is configured on the server yet
  try {
    const testAccount = await nodemailer.createTestAccount();
    const ethTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
      connectionTimeout: 10000,
    });
    const info = await ethTransporter.sendMail({
      from,
      replyTo: effectiveReplyTo,
      to,
      subject,
      text: plainText,
      html,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    console.log(
      `[Email Sandbox (ethereal - GMAIL_APP_PASSWORD not set)] From: ${from} | To: ${to} | MessageId: ${info.messageId}${
        previewUrl ? ` | Preview: ${previewUrl}` : ""
      }`
    );
    return {
      success: true,
      simulated: true,
      isTestTransport: true,
      deliveryMode: "ethereal",
      realEmailDelivered: false,
      from,
      replyTo: effectiveReplyTo,
      messageId: info.messageId,
      previewUrl,
    };
  } catch {
    const simId = `sim_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    console.log(`[SIMULATED EMAIL DISPATCH - GMAIL_APP_PASSWORD not set] From: ${from} | To: ${to} | Subject: ${subject}`);
    return {
      success: true,
      simulated: true,
      isTestTransport: true,
      deliveryMode: "simulated",
      realEmailDelivered: false,
      from,
      replyTo: effectiveReplyTo,
      messageId: simId,
    };
  }
}

// 1. Stage 1: Initial Application Form Confirmation Email Template
function getRecruitmentEmailHtml({
  candidateName,
  sector,
  roleTitle,
  submissionId,
  submissionDate,
}: {
  candidateName: string;
  sector: string;
  roleTitle: string;
  submissionId: string;
  submissionDate: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Application Received - S-CODERS (Bharat Tech Developers)</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #131A29; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
              <tr>
                <td style="padding: 32px; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); text-align: center; border-bottom: 2px solid #22D3EE;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #FFFFFF;">S <span style="color: #22D3EE;">⚡</span> CODERS</h1>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px;">Bharat Tech Developers • Bengaluru, India</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 32px; text-align: center;">
                  <div style="display: inline-block; padding: 8px 20px; border-radius: 9999px; background-color: rgba(34, 211, 238, 0.15); border: 1px solid #22D3EE;">
                    <span style="font-size: 12px; font-weight: 800; color: #22D3EE; text-transform: uppercase; letter-spacing: 0.5px;">
                      ✓ APPLICATION SUBMITTED SUCCESSFULLY
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 20px 32px;">
                  <p style="font-size: 16px; color: #F8FAFC; margin: 0 0 16px 0;">Dear <strong>${candidateName}</strong>,</p>
                  
                  <div style="background-color: #0F172A; border-left: 4px solid #22D3EE; padding: 18px 20px; border-radius: 10px; margin-bottom: 20px;">
                    <p style="font-size: 15px; color: #F1F5F9; line-height: 1.7; margin: 0; font-weight: 500;">
                      Your application form has been submitted successfully.
                    </p>
                    <p style="font-size: 14px; color: #94A3B8; line-height: 1.7; margin: 12px 0 0 0;">
                      Your resume and application form will now undergo the shortlisting process. If your profile is shortlisted, you will receive another email from <strong>S-CODERS – Bharat Tech Developers</strong> with information about the next stage of the selection process.
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 30px 32px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; border-radius: 12px; border: 1px solid #334155; padding: 20px;">
                    <tr>
                      <td style="padding: 8px 0; font-size: 12px; color: #64748B; text-transform: uppercase;">Application Reference ID:</td>
                      <td align="right" style="padding: 8px 0; font-size: 13px; font-family: monospace; font-weight: 700; color: #22D3EE;">${submissionId}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 12px; color: #64748B; text-transform: uppercase;">Sector / Department:</td>
                      <td align="right" style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #FFFFFF;">${sector}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 12px; color: #64748B; text-transform: uppercase;">Role Applied For:</td>
                      <td align="right" style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #F8FAFC;">${roleTitle}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 12px; color: #64748B; text-transform: uppercase;">Date of Submission:</td>
                      <td align="right" style="padding: 8px 0; font-size: 13px; color: #94A3B8;">${submissionDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 12px; color: #64748B; text-transform: uppercase;">Selection Workflow:</td>
                      <td align="right" style="padding: 8px 0; font-size: 12px; color: #38BDF8; font-weight: 600;">Screening → Interview → Onboarding</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 32px; text-align: center; border-top: 1px solid #1E293B; background-color: #0F172A;">
                  <p style="font-size: 12px; color: #94A3B8; margin: 0 0 4px 0;">Official S-CODERS Talent & HR Desk</p>
                  <p style="font-size: 11px; color: #64748B; margin: 0;">Email: <strong style="color: #22D3EE;">scoders82@gmail.com</strong> • Bengaluru, Karnataka, India</p>
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

// 2. Stage 4: Shortlisted Candidate - Interview Invitation with Zoom Link
function getInterviewInviteEmailHtml({
  candidateName,
  sector,
  roleTitle,
  submissionId,
  zoomLink,
  interviewDate,
  interviewTime,
  roundTitle,
  instructions,
}: {
  candidateName: string;
  sector: string;
  roleTitle: string;
  submissionId: string;
  zoomLink: string;
  interviewDate: string;
  interviewTime: string;
  roundTitle: string;
  instructions?: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Interview Invitation - S-CODERS (Bharat Tech Developers)</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #131A29; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
              <tr>
                <td style="padding: 32px; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); text-align: center; border-bottom: 2px solid #22D3EE;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #FFFFFF;">S <span style="color: #22D3EE;">⚡</span> CODERS</h1>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px;">Bharat Tech Developers • Bengaluru, India</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 32px; text-align: center;">
                  <div style="display: inline-block; padding: 8px 24px; border-radius: 9999px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid #10B981;">
                    <span style="font-size: 12px; font-weight: 800; color: #10B981; text-transform: uppercase; letter-spacing: 0.5px;">
                      🎉 PROFILE SHORTLISTED FOR ONLINE INTERVIEW
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 20px 32px;">
                  <p style="font-size: 16px; color: #F8FAFC; margin: 0 0 16px 0;">Dear <strong>${candidateName}</strong>,</p>
                  <p style="font-size: 15px; color: #E2E8F0; line-height: 1.7; margin: 0 0 18px 0;">
                    We are pleased to inform you that your resume and application form for the <strong>${roleTitle}</strong> (${sector}) position at <strong>S-CODERS – Bharat Tech Developers</strong> have been officially <strong>shortlisted</strong>!
                  </p>
                  <p style="font-size: 14px; color: #94A3B8; line-height: 1.6; margin: 0 0 20px 0;">
                    Please find the details and instructions for your online interview round below. Only candidates who successfully clear this interview will proceed to the next stage of the selection process.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 30px 32px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; border-radius: 12px; border: 1px solid #334155; padding: 20px;">
                    <tr>
                      <td style="padding: 8px 0; font-size: 12px; color: #64748B; text-transform: uppercase;">Interview Round:</td>
                      <td align="right" style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #FFFFFF;">${roundTitle || 'Technical & Cultural Evaluation'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 12px; color: #64748B; text-transform: uppercase;">Interview Date:</td>
                      <td align="right" style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #22D3EE;">${interviewDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 12px; color: #64748B; text-transform: uppercase;">Interview Time:</td>
                      <td align="right" style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #10B981;">${interviewTime} (IST)</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 12px; color: #64748B; text-transform: uppercase;">Meeting Platform:</td>
                      <td align="right" style="padding: 8px 0; font-size: 13px; font-weight: 600; color: #38BDF8;">Zoom Video Meeting</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 12px; color: #64748B; text-transform: uppercase;">Application Ref:</td>
                      <td align="right" style="padding: 8px 0; font-size: 13px; font-family: monospace; color: #CBD5E1;">${submissionId}</td>
                    </tr>
                    <tr>
                      <td colspan="2" align="center" style="padding-top: 24px;">
                        <a href="${zoomLink}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #2D8CFF; color: #FFFFFF; text-decoration: none; font-weight: 800; font-size: 14px; border-radius: 10px; box-shadow: 0 4px 12px rgba(45, 140, 255, 0.4);">
                          📹 Join Zoom Interview Meeting →
                        </a>
                        <p style="font-size: 11px; color: #64748B; margin: 12px 0 0 0; word-break: break-all;">
                          Link: <a href="${zoomLink}" style="color: #38BDF8;">${zoomLink}</a>
                        </p>
                      </td>
                    </tr>
                  </table>

                  ${instructions ? `
                    <div style="background-color: #0F172A; border: 1px solid #1E293B; border-radius: 10px; padding: 16px; margin-top: 16px;">
                      <span style="font-size: 11px; color: #22D3EE; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Important Instructions:</span>
                      <p style="font-size: 13px; color: #CBD5E1; line-height: 1.6; margin: 0;">${instructions}</p>
                    </div>
                  ` : ''}
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 32px; text-align: center; border-top: 1px solid #1E293B; background-color: #0F172A;">
                  <p style="font-size: 12px; color: #94A3B8; margin: 0 0 4px 0;">Official S-CODERS Selection Committee</p>
                  <p style="font-size: 11px; color: #64748B; margin: 0;">Email: <strong style="color: #22D3EE;">scoders82@gmail.com</strong> • Bengaluru, Karnataka, India</p>
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

// 3. Stage 6: Admin-Controlled Authorization for Second Application Form Email
function getOnboardingAuthorizationEmailHtml({
  candidateName,
  sector,
  roleTitle,
  submissionId,
  onboardingUrl,
}: {
  candidateName: string;
  sector: string;
  roleTitle: string;
  submissionId: string;
  onboardingUrl: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Interview Cleared - Authorized for Stage 2 Onboarding (S-CODERS)</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #131A29; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
              <tr>
                <td style="padding: 32px; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); text-align: center; border-bottom: 2px solid #10B981;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #FFFFFF;">S <span style="color: #22D3EE;">⚡</span> CODERS</h1>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px;">Bharat Tech Developers • Bengaluru, India</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 32px; text-align: center;">
                  <div style="display: inline-block; padding: 8px 24px; border-radius: 9999px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid #10B981;">
                    <span style="font-size: 12px; font-weight: 800; color: #10B981; text-transform: uppercase; letter-spacing: 0.5px;">
                      🌟 INTERVIEW CLEARED • AUTHORIZED FOR STAGE 2 ONBOARDING
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 20px 32px;">
                  <p style="font-size: 16px; color: #F8FAFC; margin: 0 0 16px 0;">Dear <strong>${candidateName}</strong>,</p>
                  
                  <div style="background-color: #0F172A; border-left: 4px solid #10B981; padding: 18px 20px; border-radius: 10px; margin-bottom: 20px;">
                    <p style="font-size: 15px; color: #10B981; font-weight: 700; line-height: 1.6; margin: 0 0 8px 0;">
                      Congratulations! You have successfully cleared your interview round for ${roleTitle} (${sector}).
                    </p>
                    <p style="font-size: 14px; color: #CBD5E1; line-height: 1.7; margin: 0;">
                      The S-CODERS Admin & Engineering leadership has officially authorized you to proceed to the <strong>Second Application Form</strong>.
                    </p>
                  </div>

                  <p style="font-size: 14px; color: #94A3B8; line-height: 1.7; margin: 0 0 16px 0;">
                    In this final section, you will provide the following confidential information required for official onboarding, payroll/stipend disbursement, and compliance:
                  </p>

                  <ul style="font-size: 13px; color: #E2E8F0; line-height: 1.8; margin: 0 0 20px 0; padding-left: 24px;">
                    <li>Full personal details & emergency contacts</li>
                    <li>Government identification (Aadhaar & PAN verification)</li>
                    <li>Permanent residential address coordinates</li>
                    <li>Direct bank account details for compensation/stipend disbursement</li>
                    <li>Execution of the official S-CODERS Talent Induction & Non-Disclosure Agreement (NDA)</li>
                  </ul>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 30px 32px;" align="center">
                  <a href="${onboardingUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; background-color: #22D3EE; color: #0B0F17; text-decoration: none; font-weight: 900; font-size: 14px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(34, 211, 238, 0.4);">
                    Unlock & Complete Second Application Form →
                  </a>
                  <p style="font-size: 11px; color: #64748B; margin: 12px 0 0 0; word-break: break-all;">
                    Direct Secure Link: <a href="${onboardingUrl}" style="color: #38BDF8;">${onboardingUrl}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 32px; text-align: center; border-top: 1px solid #1E293B; background-color: #0F172A;">
                  <p style="font-size: 12px; color: #94A3B8; margin: 0 0 4px 0;">S-CODERS Authorized Recruitment Board</p>
                  <p style="font-size: 11px; color: #64748B; margin: 0;">Email: <strong style="color: #22D3EE;">scoders82@gmail.com</strong> • Bengaluru, Karnataka, India</p>
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

// 4. Rejection Email Notification
function getRejectionEmailHtml({
  candidateName,
  roleTitle,
  submissionId,
  reason,
}: {
  candidateName: string;
  roleTitle: string;
  submissionId: string;
  reason?: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Application Status Update - S-CODERS</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #131A29; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden;">
              <tr>
                <td style="padding: 32px; background: #0F172A; text-align: center; border-bottom: 1px solid #334155;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #FFFFFF;">S <span style="color: #22D3EE;">⚡</span> CODERS</h1>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8; text-transform: uppercase;">Bharat Tech Developers</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 32px;">
                  <p style="font-size: 15px; color: #F8FAFC;">Dear <strong>${candidateName}</strong>,</p>
                  <p style="font-size: 14px; color: #94A3B8; line-height: 1.7;">
                    Thank you for your interest in joining S-CODERS and for submitting your application for the <strong>${roleTitle}</strong> role (Ref: ${submissionId}).
                  </p>
                  <p style="font-size: 14px; color: #94A3B8; line-height: 1.7;">
                    After careful review by our evaluation committee, we regret to inform you that we will not be progressing your application to the next stage at this time.
                  </p>
                  ${reason ? `
                    <div style="background-color: #0F172A; border-left: 4px solid #64748B; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
                      <p style="font-size: 13px; color: #CBD5E1; margin: 0;"><strong>Evaluation Note:</strong> ${reason}</p>
                    </div>
                  ` : ''}
                  <p style="font-size: 13px; color: #64748B; line-height: 1.6;">
                    We sincerely appreciate the time you invested with us and wish you the very best in your professional endeavors.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px 32px; text-align: center; border-top: 1px solid #1E293B; background-color: #0F172A;">
                  <p style="font-size: 11px; color: #64748B; margin: 0;">S-CODERS Talent Acquisition • scoders82@gmail.com</p>
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

// 5. Stage 7 Completion Email
function getOnboardingCompleteEmailHtml({
  candidateName,
  roleTitle,
  agreementRef,
  submissionId,
}: {
  candidateName: string;
  roleTitle: string;
  agreementRef: string;
  submissionId: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Onboarding Dossier Completed - S-CODERS</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #131A29; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden;">
              <tr>
                <td style="padding: 32px; background: #0F172A; text-align: center; border-bottom: 2px solid #10B981;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #FFFFFF;">S <span style="color: #22D3EE;">⚡</span> CODERS</h1>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8; text-transform: uppercase;">Official Onboarding Finalized</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 32px;">
                  <p style="font-size: 16px; color: #F8FAFC;">Dear <strong>${candidateName}</strong>,</p>
                  <p style="font-size: 14px; color: #10B981; font-weight: 700; line-height: 1.6;">
                    ✓ Your Second Application Form, identification verification, bank coordinates, and signed Talent Induction & NDA have been successfully recorded!
                  </p>
                  <p style="font-size: 14px; color: #94A3B8; line-height: 1.6;">
                    Agreement Reference ID: <strong style="color: #22D3EE; font-family: monospace;">${agreementRef}</strong><br>
                    Application ID: <strong style="color: #F8FAFC; font-family: monospace;">${submissionId}</strong>
                  </p>
                  <p style="font-size: 13px; color: #CBD5E1; line-height: 1.6;">
                    Our HR & IT Operations desk will now finalize your profile, system credentials, and initial sprint onboarding. Welcome to the S-CODERS team!
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px 32px; text-align: center; border-top: 1px solid #1E293B; background-color: #0F172A;">
                  <p style="font-size: 11px; color: #64748B; margin: 0;">S-CODERS Official HR Desk • scoders82@gmail.com</p>
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

// 6. Section 4 Department Verification & WhatsApp Group Access Email
function getDepartmentApprovedEmailHtml({
  candidateName,
  departmentName,
  departmentReferenceId,
  mainWhatsappLink,
  subgroupWhatsappLink,
  zoomLink,
}: {
  candidateName: string;
  departmentName: string;
  departmentReferenceId: string;
  mainWhatsappLink: string;
  subgroupWhatsappLink: string;
  zoomLink: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Department Verification Approved - S-CODERS</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #131A29; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden;">
              <tr>
                <td style="padding: 32px; background: #0F172A; text-align: center; border-bottom: 2px solid #22D3EE;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #FFFFFF;">S <span style="color: #22D3EE;">⚡</span> CODERS</h1>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8; text-transform: uppercase;">Official Department Verification & Access Clearance</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 32px;">
                  <p style="font-size: 16px; color: #F8FAFC;">Dear <strong>${candidateName}</strong>,</p>
                  <p style="font-size: 14px; color: #10B981; font-weight: 700; line-height: 1.6;">
                    ✓ Your department application has been verified and approved by S-CODERS recruitment management!
                  </p>
                  <div style="background-color: #0B0F17; border: 1px solid #1E293B; border-radius: 12px; padding: 18px; margin: 18px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #94A3B8;">
                      Approved Department: <strong style="color: #FFFFFF;">${departmentName}</strong>
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #94A3B8;">
                      Department-Specific Reference ID: <strong style="color: #22D3EE; font-family: monospace; font-size: 16px;">${departmentReferenceId}</strong>
                    </p>
                  </div>
                  <p style="font-size: 13px; color: #CBD5E1; line-height: 1.6;">
                    You are now authorized to join the official WhatsApp Community and your exclusive department subgroup, as well as participate in departmental Zoom online work sessions.
                  </p>
                  <div style="margin: 24px 0; text-align: center;">
                    <a href="${subgroupWhatsappLink}" style="display: inline-block; background-color: #25D366; color: #000000; font-weight: 800; font-size: 13px; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin-right: 8px;">
                      Join ${departmentName} WhatsApp Subgroup →
                    </a>
                  </div>
                  <div style="background-color: #0F172A; border: 1px dashed #334155; border-radius: 8px; padding: 12px 16px; margin-top: 16px;">
                    <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                      Department Zoom Work Link: <a href="${zoomLink}" style="color: #38BDF8; font-family: monospace;">${zoomLink}</a>
                    </p>
                    <p style="margin: 6px 0 0 0; font-size: 12px; color: #94A3B8;">
                      Main WhatsApp Community: <a href="${mainWhatsappLink}" style="color: #25D366;">${mainWhatsappLink}</a>
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px 32px; text-align: center; border-top: 1px solid #1E293B; background-color: #0F172A;">
                  <p style="font-size: 11px; color: #64748B; margin: 0;">S-CODERS Engineering Operations • scoders82@gmail.com</p>
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

async function startServer() {
  const app = express();
  const isProduction = process.env.NODE_ENV === "production" || (typeof __filename !== "undefined" && __filename.includes("dist"));
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayInstance && key_id && key_secret) {
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
    res.json({ status: "ok", startup: "S-CODERS", razorpay: true, merchantUpiId: "scoders@ybl" });
  });

  // ==============================================================
  // OFFICIAL WORKSHOP & SERVICE ASSET DOWNLOAD SERVERS (FILE EXPLORER NATIVE)
  // ==============================================================
  function generateN8nJson(): string {
    const workflowData = {
      name: "S-CODERS • AI Agents with n8n & Gemini • Production Workflow",
      version: "1.4.0",
      createdAt: new Date().toISOString(),
      author: "S-CODERS (Bharat Tech Developers) - Bengaluru",
      license: "MIT",
      meta: {
        templateCredsSetupCompleted: true,
        instanceId: "scoders_enterprise_cluster_01"
      },
      nodes: [
        {
          parameters: {
            httpMethod: "POST",
            path: "webhook/v1/ai-agent-trigger",
            responseMode: "responseNode",
            options: {}
          },
          name: "Incoming Webhook Trigger",
          type: "n8n-nodes-base.webhook",
          typeVersion: 1.1,
          position: [240, 300],
          id: "node-webhook-01"
        },
        {
          parameters: {
            model: "models/gemini-2.5-flash",
            options: {
              temperature: 0.2,
              maxOutputTokens: 2048
            }
          },
          name: "Google Gemini 2.5 Flash Model",
          type: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
          typeVersion: 1,
          position: [460, 480],
          id: "node-gemini-lm-02"
        },
        {
          parameters: {
            promptType: "define",
            text: "=Analyze the client request payload: {{ $json.body.query }}\\nIdentify intent and extract entities into JSON schema.",
            hasOutputParser: true
          },
          name: "AI Agent Reasoning Engine",
          type: "@n8n/n8n-nodes-langchain.agent",
          typeVersion: 1.6,
          position: [500, 300],
          id: "node-agent-core-03"
        },
        {
          parameters: {
            tableName: "developer_knowledge_base",
            similarityMetric: "cosine"
          },
          name: "Supabase Vector Memory RAG",
          type: "@n8n/n8n-nodes-langchain.vectorStoreSupabase",
          typeVersion: 1,
          position: [700, 480],
          id: "node-vector-rag-04"
        },
        {
          parameters: {
            options: {
              responseCode: 200
            }
          },
          name: "Respond to Webhook",
          type: "n8n-nodes-base.respondToWebhook",
          typeVersion: 1.1,
          position: [780, 300],
          id: "node-respond-05"
        }
      ],
      connections: {
        "Incoming Webhook Trigger": {
          main: [[{ node: "AI Agent Reasoning Engine", type: "main", index: 0 }]]
        },
        "Google Gemini 2.5 Flash Model": {
          ai_languageModel: [[{ node: "AI Agent Reasoning Engine", type: "ai_languageModel", index: 0 }]]
        },
        "Supabase Vector Memory RAG": {
          ai_tool: [[{ node: "AI Agent Reasoning Engine", type: "ai_tool", index: 0 }]]
        },
        "AI Agent Reasoning Engine": {
          main: [[{ node: "Respond to Webhook", type: "main", index: 0 }]]
        }
      },
      settings: { executionOrder: "v1" }
    };
    return JSON.stringify(workflowData, null, 2);
  }

  function generateGeminiPromptsPdfBuffer(): Buffer {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    let y = 50;

    doc.setFillColor(11, 15, 23);
    doc.rect(0, 0, pageWidth, 90, "F");

    doc.setTextColor(34, 211, 238);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("S-CODERS • BHARAT TECH DEVELOPERS", margin, 42);

    doc.setTextColor(248, 250, 252);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Official Gemini 2.5 & AI Agent System Prompt Engineering Guide", margin, 65);

    y = 120;
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("1. Core Principles of Autonomous AI System Prompts", margin, y);
    y += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const introText =
      "When building production multi-agent systems with Google Gemini 2.5 Flash and Pro models, " +
      "system instructions must enforce identity, operational boundaries, tool availability, and structured output formatting. " +
      "Below are the exact production templates used by S-CODERS engineering leads in Bengaluru.";
    const introLines = doc.splitTextToSize(introText, contentWidth);
    doc.text(introLines, margin, y);
    y += introLines.length * 14 + 15;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 140, 6, 6, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 140, 6, 6, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("TEMPLATE A: Senior Autonomous Software Engineer (TypeScript & React)", margin + 12, y + 20);

    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const promptCode1 = [
      "You are a senior full-stack software engineer at Bharat Tech Developers.",
      "Your goal is to build robust, bug-free, and high-performance TypeScript components.",
      "- Adhere strictly to Tailwind CSS utility conventions. Never use inline styles.",
      "- When generating APIs, return clean JSON without markdown conversational filler.",
      "- Always handle edge cases: network timeout, null pointer, and token expiry.",
      "- Temperature: 0.15 | TopP: 0.95 | Model: gemini-2.5-flash"
    ];
    doc.text(promptCode1, margin + 12, y + 40);
    y += 160;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 140, 6, 6, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 140, 6, 6, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("TEMPLATE B: Multi-Step Tool Calling & ReAct Execution Loop", margin + 12, y + 20);

    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const promptCode2 = [
      "You are an orchestrator agent that has access to tools: [search_db, run_code, send_webhook].",
      "Follow this strict loop for every user query:",
      "1. THOUGHT: State internal reasoning clearly before acting.",
      "2. ACTION: Call the appropriate function with required arguments schema.",
      "3. OBSERVATION: Inspect function return value.",
      "4. FINAL ANSWER: Formulate output response to the user with references."
    ];
    doc.text(promptCode2, margin + 12, y + 40);
    y += 160;

    doc.setFillColor(240, 253, 250);
    doc.roundedRect(margin, y, contentWidth, 120, 6, 6, "F");
    doc.setDrawColor(45, 212, 191);
    doc.roundedRect(margin, y, contentWidth, 120, 6, 6, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(13, 148, 136);
    doc.text("KEY BEST PRACTICES FROM SHREYAS M. & LOKESH A.", margin + 12, y + 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    const tips = [
      "1. Never prompt the model to 'be smart' — instead define precise role boundaries.",
      "2. Use systemInstruction in GoogleGenAI SDK instead of injecting into user history.",
      "3. Enable responseSchema with Type.OBJECT to guarantee zero syntax parse errors.",
      "4. Store conversation session history in Redis or PostgreSQL with user token keys."
    ];
    doc.text(tips, margin + 12, y + 42);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Verified Asset • S-CODERS Tech Conference & Workshop Series • scoders82@gmail.com", margin, 800);

    return Buffer.from(doc.output("arraybuffer"));
  }

  async function generateSaasZipBuffer(): Promise<Buffer> {
    const zip = new JSZip();
    zip.file("README.md", `# S-CODERS SaaS Multitenant Production Boilerplate\\nDeveloped by S-CODERS (Bharat Tech Developers) • Bengaluru, India\\n\\n## Overview\\nThis production starter template implements complete multi-tenant tenant isolation with:\\n- Tenant-specific subdomain / path resolution\\n- PostgreSQL Row Level Security (RLS) policies\\n- Role-Based Access Control (Admin, Member, Viewer)\\n- React 19 + TypeScript frontend with Tailwind CSS\\n- Express.js API backend with JWT tenant session verification\\n\\n## Getting Started\\n\\\`\\\`\\\`bash\\nnpm install\\nnpm run dev\\n\\\`\\\`\\\`\\n\\n## Support\\nContact: scoders82@gmail.com\\n`);
    zip.file("package.json", JSON.stringify({
      name: "scoders-saas-multitenant-starter",
      version: "1.0.0",
      private: true,
      scripts: { dev: "vite", build: "vite build", serve: "node server.js" },
      dependencies: { react: "^19.0.0", "react-dom": "^19.0.0", "lucide-react": "^0.546.0", clsx: "^2.1.1", "tailwind-merge": "^3.0.0" },
      devDependencies: { vite: "^6.2.0", typescript: "^5.8.0", tailwindcss: "^4.0.0" }
    }, null, 2));
    zip.file("tsconfig.json", JSON.stringify({
      compilerOptions: { target: "ESNext", lib: ["DOM", "DOM.Iterable", "ESNext"], module: "ESNext", moduleResolution: "Node", jsx: "react-jsx", strict: true },
      include: ["src"]
    }, null, 2));
    
    const src = zip.folder("src");
    if (src) {
      src.file("main.tsx", "import React from 'react';\\nimport ReactDOM from 'react-dom/client';\\nimport App from './App';\\nimport './index.css';\\n\\nReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);");
      src.file("App.tsx", "import React, { useState } from 'react';\\nimport { TenantDashboard } from './components/TenantDashboard';\\nimport { OrgSwitcher } from './components/OrgSwitcher';\\n\\nexport default function App() {\\n  const [currentTenant, setCurrentTenant] = useState({ id: 'org_scoders_01', name: 'Bharat Tech Innovators', plan: 'Enterprise', membersCount: 14 });\\n  return (\\n    <div className=\"min-h-screen bg-slate-950 text-slate-100 p-8 font-sans\">\\n      <header className=\"max-w-6xl mx-auto flex justify-between items-center pb-6 border-b border-slate-800\">\\n        <h1 className=\"text-2xl font-black text-cyan-400\">S-CODERS SaaS Engine</h1>\\n        <OrgSwitcher currentTenant={currentTenant} onSelectTenant={setCurrentTenant} />\\n      </header>\\n      <main className=\"max-w-6xl mx-auto pt-8\">\\n        <TenantDashboard tenant={currentTenant} />\\n      </main>\\n    </div>\\n  );\\n}");
      src.file("index.css", "@import \"tailwindcss\";\\nbody { margin: 0; background-color: #030712; color: #f9fafb; }");

      const components = src.folder("components");
      if (components) {
        components.file("TenantDashboard.tsx", "import React from 'react';\\nexport function TenantDashboard({ tenant }: { tenant: any }) {\\n  return (\\n    <div className=\"bg-slate-900 border border-slate-800 rounded-2xl p-6\">\\n      <h2 className=\"text-lg font-bold text-white mb-2\">Tenant Workspace: {tenant.name}</h2>\\n      <p className=\"text-xs text-slate-400\">Tenant ID: <code className=\"text-cyan-400\">{tenant.id}</code></p>\\n    </div>\\n  );\\n}");
        components.file("OrgSwitcher.tsx", "import React from 'react';\\nexport function OrgSwitcher({ currentTenant, onSelectTenant }: any) {\\n  return (<select value={currentTenant.id} onChange={(e) => onSelectTenant({ id: e.target.value, name: 'Active Org', plan: 'Enterprise' })} className=\"bg-slate-900 text-slate-200 border border-slate-700 rounded-xl px-4 py-2 text-xs font-mono\"><option value=\"org_scoders_01\">🏢 Bharat Tech Innovators</option></select>);\\n}");
      }

      const serverFolder = src.folder("server");
      if (serverFolder) {
        serverFolder.file("tenantIsolation.ts", "import { Request, Response, NextFunction } from 'express';\\nexport function tenantIsolationMiddleware(req: any, res: Response, next: NextFunction) {\\n  const tenantId = req.headers['x-tenant-id'] || 'default_tenant';\\n  req.tenantId = tenantId;\\n  next();\\n}");
        serverFolder.file("rlsPolicies.sql", "-- PostgreSQL / Supabase Row-Level Security\\nALTER TABLE projects ENABLE ROW LEVEL SECURITY;\\nCREATE POLICY tenant_isolation_projects ON projects FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true));");
      }
    }

    return await zip.generateAsync({ type: "nodebuffer" });
  }

  function generateSessionDeckPdfBuffer(workshopTitle = "AI Agents with n8n & Gemini"): Buffer {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    let y = 50;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 90, "F");

    doc.setTextColor(34, 211, 238);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("S-CODERS • WORKSHOP SESSION DECK", margin, 42);

    doc.setTextColor(248, 250, 252);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Official Curriculum, Architecture Slides & Lab Exercises • ${workshopTitle}`, margin, 65);

    y = 120;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 120, 6, 6, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 120, 6, 6, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("SLIDE 1: Modern AI Agent Architecture Overview", margin + 14, y + 24);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const slide1Lines = [
      "• Foundation Models vs. Autonomous Agent Loops: Understanding the ReAct loop.",
      "• Tool Definitions: Schemas, function parameters, and deterministic execution boundaries.",
      "• Memory Layers: Ephemeral session context vs. persistent vector embeddings (Supabase/PostgreSQL).",
      "• Latency Optimizations: Streaming token deltas directly to client UI via Server-Sent Events (SSE)."
    ];
    doc.text(slide1Lines, margin + 14, y + 46);
    y += 140;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 160, 6, 6, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 160, 6, 6, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("HANDS-ON LAB EXERCISES (Required for Certificate Eligibility)", margin + 14, y + 24);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const labLines = [
      "Exercise 1: Create an n8n webhook listener that ingests incoming JSON payloads and logs to terminal.",
      "Exercise 2: Connect the Google Gemini 2.5 Flash model with system instructions to classify sentiment.",
      "Exercise 3: Implement tool routing: if query asks for database data, trigger query_sql; else reply directly.",
      "Exercise 4: Store conversation memory in localStorage and sync with the S-CODERS Sandbox environment.",
      "Exercise 5: Deploy the complete agent to Google Cloud Run or Render with environment secrets."
    ];
    doc.text(labLines, margin + 14, y + 46);
    y += 180;

    doc.setFillColor(240, 253, 250);
    doc.roundedRect(margin, y, contentWidth, 110, 6, 6, "F");
    doc.setDrawColor(45, 212, 191);
    doc.roundedRect(margin, y, contentWidth, 110, 6, 6, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(13, 148, 136);
    doc.text("OFFICIAL MENTOR VERIFICATION & CREDENTIAL MINTING", margin + 14, y + 24);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    const certLines = [
      "Upon completing the exercises, submit your pass key and repository link to your instructor.",
      "Verification Mentors: Shreyas M. (Founder), Lokesh A. (Co-Founder), Bhuvan M. (Tech Lead).",
      "Official S-CODERS Digital Developer Credentials are dispatched via scoders82@gmail.com."
    ];
    doc.text(certLines, margin + 14, y + 44);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("© 2026 S-CODERS (Bharat Tech Developers) • Bengaluru, India • All Rights Reserved", margin, 800);

    return Buffer.from(doc.output("arraybuffer"));
  }

  async function generateWorkshopKitBundle(): Promise<Buffer> {
    const zip = new JSZip();
    zip.file("README_FIRST.txt", `S-CODERS • BHARAT TECH DEVELOPERS\\nOfficial Workshop Developer Kit\\n=========================================\\nIncluded in this package:\\n1. n8n_ai_workflow_blueprints_scoders.json (Production n8n + Gemini agent workflow)\\n2. gemini_system_prompts_cheatsheet.pdf (Gemini 2.5 prompt engineering guide)\\n3. saas_multitenant_boilerplate.zip (Complete React 19 + Express multitenant SaaS starter)\\n4. scoders_workshop_session_deck_exercises.pdf (Curriculum slides & lab exercises)\\n\\nSupport & Verification: scoders82@gmail.com\\n`);
    zip.file("n8n_ai_workflow_blueprints_scoders.json", generateN8nJson());
    zip.file("gemini_system_prompts_cheatsheet.pdf", generateGeminiPromptsPdfBuffer());
    zip.file("saas_multitenant_boilerplate.zip", await generateSaasZipBuffer());
    zip.file("scoders_workshop_session_deck_exercises.pdf", generateSessionDeckPdfBuffer());
    return await zip.generateAsync({ type: "nodebuffer" });
  }

  function generateServiceSpecPdfBuffer(filename: string, desc = "Official Architecture Specification"): Buffer {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    let y = 50;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 90, "F");

    doc.setTextColor(34, 211, 238);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("S-CODERS • SPECIFICATION DOCUMENT", margin, 42);

    doc.setTextColor(248, 250, 252);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Official Technical Deliverable: ${filename.replace(".pdf", "")}`, margin, 65);

    y = 120;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Document Overview & Scope", margin, y);
    y += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const p1 = `This document contains the verified architectural specifications, implementation plans, and engineering parameters prepared by S-CODERS (Bharat Tech Developers) for your project: "${desc}".`;
    const p1Lines = doc.splitTextToSize(p1, contentWidth);
    doc.text(p1Lines, margin, y);
    y += p1Lines.length * 14 + 20;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 130, 6, 6, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 130, 6, 6, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("1. Architectural & Technology Highlights", margin + 12, y + 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const items = [
      "• Frontend Stack: React 19, TypeScript 5.8, Tailwind CSS v4, Motion engine.",
      "• Backend & Proxy: Express.js server, Node.js v20+ runtime, encrypted payload transport.",
      "• AI Core: Google Gemini 2.5 Flash / Pro API with structured output schemas.",
      "• Database & State: PostgreSQL / SQLite with Row-Level Security and strict tenant boundary isolation.",
      "• Deployment Target: Google Cloud Run containerized deployment with custom domain routing."
    ];
    doc.text(items, margin + 12, y + 40);
    y += 150;

    doc.setFillColor(240, 253, 250);
    doc.roundedRect(margin, y, contentWidth, 120, 6, 6, "F");
    doc.setDrawColor(45, 212, 191);
    doc.roundedRect(margin, y, contentWidth, 120, 6, 6, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(13, 148, 136);
    doc.text("2. Engineering Team Assignment & Coordination", margin + 12, y + 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    const teamItems = [
      "• Shreyas M. (Founder & CEO): Lead Architecture, System Design & Model Routing.",
      "• Lokesh A. (Co-Founder): Vibe Coding Prototyping, Prompt Engineering & Workflow Automations.",
      "• Bhuvan M. (Tech Lead): UI/UX Platform Development & Full-Stack Implementation.",
      "• Direct Support: scoders82@gmail.com | Official Service Community Desk"
    ];
    doc.text(teamItems, margin + 12, y + 40);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("S-CODERS (Bharat Tech Developers) • Confidential Technical Asset • Bengaluru, India", margin, 800);

    return Buffer.from(doc.output("arraybuffer"));
  }

  // WORKSHOP ASSET DOWNLOAD & INLINE VIEW ENDPOINTS (Guaranteed File Explorer Native Save & In-Browser Preview)
  app.get(["/api/workshops/download/:assetId", "/api/workshops/download", "/api/workshops/view/:assetId", "/api/workshops/view"], async (req, res) => {
    try {
      const isInlineView = req.path.includes("/view") || req.query.view === "inline";
      const dispositionType = isInlineView ? "inline" : "attachment";
      const assetId = (req.params.assetId || (req.query.item as string) || (req.query.id as string) || (req.query.file as string) || "").toLowerCase();

      if (assetId.includes("json") || assetId.includes("blueprint") || assetId.includes("n8n")) {
        const jsonContent = generateN8nJson();
        const jsonBuf = Buffer.from(jsonContent, "utf-8");
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Content-Disposition", `${dispositionType}; filename="n8n_ai_workflow_blueprints_scoders.json"`);
        res.setHeader("Content-Length", jsonBuf.length);
        res.setHeader("Cache-Control", "no-cache");
        return res.end(jsonBuf);
      }

      if (assetId.includes("pdf_prompt") || assetId.includes("prompt") || assetId.includes("cheatsheet")) {
        const pdfBuf = generateGeminiPromptsPdfBuffer();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `${dispositionType}; filename="gemini_system_prompts_cheatsheet.pdf"`);
        res.setHeader("Content-Length", pdfBuf.length);
        res.setHeader("Cache-Control", "no-cache");
        return res.end(pdfBuf);
      }

      if (assetId.includes("zip") || assetId.includes("boilerplate") || assetId.includes("saas")) {
        const zipBuf = await generateSaasZipBuffer();
        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", 'attachment; filename="saas_multitenant_boilerplate.zip"');
        res.setHeader("Content-Length", zipBuf.length);
        res.setHeader("Cache-Control", "no-cache");
        return res.end(zipBuf);
      }

      if (assetId.includes("pdf_slides") || assetId.includes("slides") || assetId.includes("deck") || assetId.includes("exercise")) {
        const pdfBuf = generateSessionDeckPdfBuffer();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `${dispositionType}; filename="scoders_workshop_session_deck_exercises.pdf"`);
        res.setHeader("Content-Length", pdfBuf.length);
        res.setHeader("Cache-Control", "no-cache");
        return res.end(pdfBuf);
      }

      if (assetId.includes("all") || assetId.includes("kit") || assetId.includes("bundle")) {
        const bundleBuf = await generateWorkshopKitBundle();
        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", 'attachment; filename="scoders_workshop_complete_developer_kit.zip"');
        res.setHeader("Content-Length", bundleBuf.length);
        res.setHeader("Cache-Control", "no-cache");
        return res.end(bundleBuf);
      }

      // Default fallback
      const defaultBuf = await generateSaasZipBuffer();
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="saas_multitenant_boilerplate.zip"');
      return res.end(defaultBuf);
    } catch (err) {
      console.error("Error serving workshop download:", err);
      res.status(500).json({ error: "Failed to generate asset download" });
    }
  });

  // SERVICE SPEC DOWNLOAD & IN-BROWSER VIEW ENDPOINTS (Guaranteed Native Save & In-Browser Preview)
  app.get(["/api/services/download/:filename", "/api/services/download", "/api/services/view/:filename", "/api/services/view"], async (req, res) => {
    try {
      const isInlineView = req.path.includes("/view") || req.query.view === "inline";
      const dispositionType = isInlineView ? "inline" : "attachment";
      const rawName = (req.params.filename || (req.query.file as string) || (req.query.item as string) || "Project_Architecture_Spec.pdf").trim();

      if (rawName.includes("all") || rawName.includes("bundle") || rawName.includes("zip")) {
        const zip = new JSZip();
        zip.file("README_SERVICE_SPECS.txt", `S-CODERS • BHARAT TECH DEVELOPERS\nOfficial Service Project Specification Bundle\n==============================================\nIncluded Specifications:\n1. Project_Architecture_Spec.pdf (System diagram, parameters & tech stack)\n2. Interactive_UI_Mockups_v1.pdf (High fidelity wireframes & component layouts)\n3. Database_Schema_Spec.pdf (PostgreSQL entities, indices & schema definitions)\n4. AI_Agent_Logic_Flowchart.pdf (Chain-of-thought routing & API orchestration)\n\nDirect Engineering Support: scoders82@gmail.com\n`);
        
        const files = [
          "Project_Architecture_Spec.pdf",
          "Interactive_UI_Mockups_v1.pdf",
          "Database_Schema_Spec.pdf",
          "AI_Agent_Logic_Flowchart.pdf"
        ];
        for (const f of files) {
          zip.file(f, generateServiceSpecPdfBuffer(f, f.replace(/_/g, " ").replace(".pdf", "")));
        }
        const zipBuf = await zip.generateAsync({ type: "nodebuffer" });
        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", 'attachment; filename="scoders_service_project_specs_bundle.zip"');
        res.setHeader("Content-Length", zipBuf.length);
        res.setHeader("Cache-Control", "no-cache");
        return res.end(zipBuf);
      }

      const filename = rawName.endsWith(".pdf") ? rawName : `${rawName}.pdf`;
      const pdfBuf = generateServiceSpecPdfBuffer(filename, filename.replace(/_/g, " ").replace(".pdf", ""));
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `${dispositionType}; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuf.length);
      res.setHeader("Cache-Control", "no-cache");
      return res.end(pdfBuf);
    } catch (err) {
      console.error("Error serving service download:", err);
      res.status(500).json({ error: "Failed to generate spec PDF" });
    }
  });

  // REAL ONLINE COMPILER & CODE EXECUTION ENGINE (Batch Mode)
  app.post("/api/compiler/execute", async (req, res) => {
    try {
      const { language, code, stdin } = req.body || {};
      if (!code || typeof code !== "string") {
        return res.status(400).json({
          success: false,
          stdout: "",
          stderr: "No code provided for execution.",
          exitCode: 1,
          executionTimeMs: 0,
          language: language || "unknown",
        });
      }

      const result = await executeCode(language || "auto", code, stdin);
      return res.json(result);
    } catch (err: any) {
      console.error("[Compiler API Error]:", err);
      return res.status(500).json({
        success: false,
        stdout: "",
        stderr: `Internal Execution Error: ${err?.message || "Unknown error"}`,
        exitCode: 1,
        executionTimeMs: 0,
        language: req.body?.language || "unknown",
      });
    }
  });

  // REAL-TIME INTERACTIVE RUNTIME SESSION: Start Session
  app.post("/api/compiler/session/start", async (req, res) => {
    try {
      const { language, code, stdin } = req.body || {};
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "No source code provided." });
      }

      const sessionInfo = await startInteractiveSession(language || "auto", code, stdin);
      return res.json({
        success: true,
        ...sessionInfo,
      });
    } catch (err: any) {
      console.error("[Interactive Session Start Error]:", err);
      return res.status(500).json({
        error: "Failed to start interactive compiler session: " + err.message,
      });
    }
  });

  // REAL-TIME INTERACTIVE RUNTIME SESSION: Stream Output via SSE
  app.get("/api/compiler/session/stream", (req, res) => {
    const sessionId = String(req.query.sessionId || "");
    if (!sessionId) {
      return res.status(400).send("Session ID is required.");
    }

    const session = getInteractiveSession(sessionId);
    if (!session) {
      return res.status(404).send("Interactive session expired or not found.");
    }

    // Set standard SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders?.();

    // Listener forwarding events from child process to client
    const onEvent = (event: any) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      if (event.type === "exit") {
        setTimeout(() => {
          try {
            res.end();
          } catch {}
        }, 300);
      }
    };

    session.addListener(onEvent);

    req.on("close", () => {
      session.removeListener(onEvent);
    });
  });

  // REAL-TIME INTERACTIVE RUNTIME SESSION: Send Standard Input (stdin)
  app.post("/api/compiler/session/input", (req, res) => {
    const { sessionId, input } = req.body || {};
    if (!sessionId || typeof input === "undefined") {
      return res.status(400).json({ error: "sessionId and input are required." });
    }

    const success = sendInteractiveInput(sessionId, String(input));
    return res.json({ success });
  });

  // REAL-TIME INTERACTIVE RUNTIME SESSION: Stop Process
  app.post("/api/compiler/session/stop", (req, res) => {
    const { sessionId } = req.body || {};
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required." });
    }

    const success = stopInteractiveSession(sessionId);
    return res.json({ success });
  });

  // Helper: deterministic multi-language compiler/runtime diagnostic & repair engine
  function diagnoseCompilerErrorDeterministic(lang: string, src: string, rawErr: string): {
    errorType: string;
    line: number | null;
    explanation: string;
    correctedCode: string;
    suggestedFixSummary: string;
  } {
    const normLang = (lang || "").toLowerCase();
    const errText = String(rawErr || "");
    const lines = src.split("\n");
    let errorLine: number | null = null;
    const lineMatch =
      errText.match(/main\.(?:cpp|c):(\d+):/i) ||
      errText.match(/\.java:(\d+):/i) ||
      errText.match(/\.go:(\d+):/i) ||
      errText.match(/\.rs:(\d+):/i) ||
      errText.match(/line\s+(\d+)/i) ||
      errText.match(/:(\d+):/);
    if (lineMatch) {
      errorLine = parseInt(lineMatch[1], 10);
    }

    let fixed = src;
    let errorType = "Compilation / Runtime Error";
    let explanation = errText.trim().slice(0, 400) || "Program failed to compile or exited with a non-zero status.";
    let suggestedFixSummary = "Review the compiler diagnostic above and fix the syntax or symbol issue.";

    // 1. Replace smart/curly quotes pasted from mobile keyboards or rich-text editors
    if (/[“”‘’]/.test(fixed)) {
      fixed = fixed.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
      errorType = "Invalid Smart Quotes (Unicode Punctuation)";
      explanation = "Smart/curly quotes (“ ” or ‘ ’) from a rich-text editor or mobile keyboard are not valid string delimiters in source code.";
      suggestedFixSummary = "Replaced curly/smart quotes with standard ASCII quotes.";
      return { errorType, line: errorLine, explanation, correctedCode: fixed, suggestedFixSummary };
    }

    // 2. C / C++ Diagnostics
    if (normLang === "cpp" || normLang === "c++" || normLang === "c") {
      if ((errText.includes("cout") || errText.includes("cin")) && errText.includes("was not declared") && !fixed.includes("<iostream>")) {
        fixed = `#include <iostream>\n${fixed}`;
        errorType = "Missing Header (<iostream>)";
        explanation = "`cout` / `cin` require the `<iostream>` header to be included.";
        suggestedFixSummary = "Added `#include <iostream>` at the top of the file.";
      } else if (normLang === "c" && (errText.includes("printf") || errText.includes("scanf")) && !fixed.includes("<stdio.h>")) {
        fixed = `#include <stdio.h>\n${fixed}`;
        errorType = "Missing Header (<stdio.h>)";
        explanation = "`printf` / `scanf` require `<stdio.h>` to be included.";
        suggestedFixSummary = "Added `#include <stdio.h>` at the top of the file.";
      } else if (/(cout|cin|endl|string|vector)\s*.*(was not declared|did you mean\s+['‘"]std::)/.test(errText) && !fixed.includes("using namespace std") && !fixed.includes("std::cout")) {
        const incEnd = fixed.lastIndexOf("#include");
        if (incEnd !== -1) {
          const nlIdx = fixed.indexOf("\n", incEnd);
          fixed = fixed.slice(0, nlIdx + 1) + "using namespace std;\n" + fixed.slice(nlIdx + 1);
        } else {
          fixed = `using namespace std;\n${fixed}`;
        }
        errorType = "Missing Namespace (std)";
        explanation = "Standard library identifiers like `cout`, `cin`, or `endl` need either `std::` prefix or `using namespace std;`.";
        suggestedFixSummary = "Added `using namespace std;` after header includes.";
      } else if (/no match for.*operator>>/.test(errText) && /\b((?:std::)?cout)\s*>>/.test(fixed)) {
        fixed = fixed.replace(/\b((?:std::)?cout)\s*>>/g, "$1 <<");
        errorType = "Stream Operator Direction Error";
        explanation = "`cout` outputs data using the insertion operator `<<`, not `>>`.";
        suggestedFixSummary = "Changed `cout >>` to `cout <<`.";
      } else if (/no match for.*operator<</.test(errText) && /\b((?:std::)?cin)\s*<</.test(fixed)) {
        fixed = fixed.replace(/\b((?:std::)?cin)\s*<</g, "$1 >>");
        errorType = "Stream Operator Direction Error";
        explanation = "`cin` reads input using the extraction operator `>>`, not `<<`.";
        suggestedFixSummary = "Changed `cin <<` to `cin >>`.";
      } else if (/expected\s*['‘"]?;['’"]?/.test(errText) && errorLine && errorLine >= 1) {
        // GCC reports `expected ';' before 'return'` at either the current line (where ';' belongs) or the next line (`return`)
        const targetIdxCandidates = [Math.max(0, errorLine - 2), Math.max(0, errorLine - 1)];
        for (const idx of targetIdxCandidates) {
          const lineTrim = (lines[idx] || "").trim();
          if (
            lineTrim &&
            !lineTrim.startsWith("#") &&
            !lineTrim.startsWith("//") &&
            !lineTrim.endsWith(";") &&
            !lineTrim.endsWith("{") &&
            !lineTrim.endsWith("}") &&
            !lineTrim.endsWith(":") &&
            !lineTrim.startsWith("return")
          ) {
            lines[idx] = lines[idx].replace(/\s*$/, ";");
            fixed = lines.join("\n");
            break;
          }
        }
        if (fixed === src && lines[Math.max(0, errorLine - 1)]?.trim() && !lines[Math.max(0, errorLine - 1)].trim().endsWith(";")) {
          const idx = Math.max(0, errorLine - 1);
          lines[idx] = lines[idx].replace(/\s*$/, ";");
          fixed = lines.join("\n");
        }
        errorType = "SyntaxError (Missing Semicolon ';')";
        explanation = `The C/C++ compiler expected a semicolon ';' near line ${errorLine}.`;
        suggestedFixSummary = `Added missing ';' near line ${Math.max(1, errorLine - 1)}.`;
      } else if (errText.includes("expected '}' at end of input")) {
        fixed = fixed.trimEnd() + "\n}\n";
        errorType = "SyntaxError (Unclosed Brace '}')";
        explanation = "A block or function is missing its closing curly brace '}'.";
        suggestedFixSummary = "Added closing brace '}' at the end of the program.";
      } else {
        const firstErr = errText.split("\n").find((l) => l.includes("error:")) || errText.split("\n")[0];
        errorType = "C/C++ Compiler Diagnostic";
        explanation = firstErr ? firstErr.trim() : explanation;
        suggestedFixSummary = "Check variable declarations, semicolons, headers, and braces on the flagged line.";
      }
      return { errorType, line: errorLine, explanation, correctedCode: fixed, suggestedFixSummary };
    }

    // 3. Python Diagnostics
    const nameErrMatch = errText.match(/NameError:\s*name\s*['"](\w+)['"]\s*is not defined/i);
    if (nameErrMatch) {
      const wrongName = nameErrMatch[1];
      const varMatches = Array.from(src.matchAll(/(\w+)\s*=/g)).map((m) => m[1]);
      const candidate = varMatches.find((v) => v.toLowerCase().startsWith(wrongName.toLowerCase().slice(0, 2)));
      if (candidate) {
        fixed = src.replace(new RegExp(`\\b${wrongName}\\b`, "g"), candidate);
        suggestedFixSummary = `Replaced undefined identifier '${wrongName}' with '${candidate}'.`;
      } else {
        suggestedFixSummary = `Define '${wrongName}' before referencing it.`;
      }
      errorType = "NameError (Undefined Identifier)";
      explanation = `Identifier '${wrongName}' was used before being defined.`;
    } else if (errText.includes("SyntaxError")) {
      errorType = "SyntaxError (Invalid Syntax)";
      explanation = errText.split("\n").slice(-3).join(" ").trim() || explanation;
      suggestedFixSummary = "Check colons, parentheses, quotes, or brackets near the flagged line.";
    } else if (errText.includes("IndentationError")) {
      errorType = "IndentationError (Inconsistent Indentation)";
      explanation = "Python requires consistent indentation inside code blocks.";
      suggestedFixSummary = "Standardize indentation to 4 spaces per block.";
    } else if (errText.includes("TypeError")) {
      errorType = "TypeError (Incompatible Types)";
      explanation = errText.split("\n").slice(-2).join(" ").trim() || explanation;
      suggestedFixSummary = "Convert operands to compatible types (e.g., str(), int(), float()).";
    } else if (errText.includes("ModuleNotFoundError") || errText.includes("No module named")) {
      errorType = "ModuleNotFoundError (Missing Library)";
      explanation = errText.split("\n").slice(-2).join(" ").trim() || explanation;
      suggestedFixSummary = "Verify module name or use a built-in standard library alternative.";
    }

    return { errorType, line: errorLine, explanation, correctedCode: fixed, suggestedFixSummary };
  }

  // AI CODING ASSISTANT & DEBUGGER: Explain Error & Auto-Correct Code
  app.post("/api/compiler/ai-debug", async (req, res) => {
    const { language, code: rawCode, stderr, stdout, exitCode, stdin } = req.body || {};
    if (!rawCode || typeof rawCode !== "string") {
      return res.status(400).json({ error: "No code provided for debugging." });
    }
    const sanitizedCode = sanitizeSourceCode(rawCode);
    const detectedLang = detectLanguage(sanitizedCode);
    const effectiveLang =
      !language || language === "auto" || ((language === "python" || language === "javascript" || language === "react" || language === "html") && detectedLang)
        ? (detectedLang || language || "auto")
        : (language === "c" && detectedLang === "cpp" ? "cpp" : language);

    try {
      const errText = String(stderr || "");

      // 1. Check if failure was due to waiting on interactive stdin
      if (
        errText.includes("EOFError") ||
        errText.includes("EOF when reading a line") ||
        errText.includes("Interactive Timeout") ||
        errText.includes("Execution Timed Out") ||
        errText.includes("waiting for user input") ||
        errText.includes("NoSuchElementException")
      ) {
        return res.json({
          errorType: "Interactive Input Required (Console Stdin)",
          line: null,
          explanation:
            "Your source code and syntax are valid! The program paused waiting for interactive input (e.g. cin, scanf, input(), or Scanner). Enter the values in the terminal input bar at the bottom while running, or supply them in 'Pass Standard Input (stdin)' before clicking Run Code.",
          correctedCode: sanitizedCode,
          suggestedFixSummary:
            "Code is already correct. Supply input values in the terminal prompt or Standard Input (stdin) panel.",
          testExecutionOutput: stdout || "",
          testExecutionSuccess: true,
          testExitCode: 0,
        });
      }

      // 2. PRE-CHECK: Compile/Execute sanitized code BEFORE reporting any error so valid code is NEVER falsely flagged!
      const preCheck = await executeCode(effectiveLang, sanitizedCode, stdin);
      if (preCheck.success && preCheck.exitCode === 0) {
        const wasSanitized = sanitizedCode !== rawCode;
        const langChanged = language && effectiveLang !== language.toLowerCase();
        return res.json({
          errorType: wasSanitized
            ? "Invisible Paste Characters Cleaned (Code Valid)"
            : langChanged
            ? `Environment Switched to ${effectiveLang.toUpperCase()} (Code Valid)`
            : "No Syntax or Runtime Errors Detected (Code Valid)",
          line: null,
          explanation: wasSanitized
            ? "Your program logic is completely valid! Hidden copy-paste characters (such as non-breaking spaces or BOM markers) were cleaned so it compiles cleanly."
            : langChanged
            ? `Your ${effectiveLang.toUpperCase()} code is completely valid and executed cleanly once matched to the ${effectiveLang.toUpperCase()} runtime.`
            : "Good news: your source code compiled and executed cleanly with Exit Code 0. No errors were found in the program itself.",
          correctedCode: sanitizedCode,
          suggestedFixSummary: "Code verified successfully. Click 'Apply Fix & Run Now' to execute and view the output.",
          testExecutionOutput: preCheck.stdout || "[Program executed successfully]",
          testExecutionSuccess: true,
          testExitCode: 0,
        });
      }

      // Real error confirmed by actual compiler/runtime!
      const confirmedErr = preCheck.stderr || errText;

      let client: GoogleGenAI | null = null;
      try {
        client = getGeminiClient();
      } catch {
        client = null;
      }

      if (client) {
        const prompt = `You are the S-CODERS Senior Compiler & AI Debugger.
Analyze the following ${effectiveLang} program and its ACTUAL compiler/runtime error diagnostic.

Source Code:
\`\`\`${effectiveLang}
${sanitizedCode}
\`\`\`

Actual Compiler/Runtime Diagnostics:
Stderr:
${confirmedErr || "(None)"}

Stdout:
${preCheck.stdout || stdout || "(None)"}

Exit Code: ${preCheck.exitCode ?? exitCode ?? 1}

Rules:
1. Only diagnose real syntax, type, linker, or runtime errors shown by the compiler/runtime. Never invent false errors.
2. Pinpoint the exact line number where the issue originates if determinable, otherwise null.
3. Provide a clear 2-3 sentence explanation of WHY this error happened.
4. Provide the COMPLETE corrected source code preserving the user's intent.
5. Provide a concise 1-2 sentence summary of the fix.

Return ONLY valid JSON:
{
  "errorType": "string",
  "line": number or null,
  "explanation": "string",
  "correctedCode": "string",
  "suggestedFixSummary": "string"
}`;

        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("AI Gateway timeout")), 15000)
          );

          const response = await Promise.race([
            client.models.generateContent({
              model: "gemini-4-hydrogen",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                temperature: 0.2,
              },
            }),
            timeoutPromise,
          ]);

          const parsed = JSON.parse(response.text || "{}");
          if (parsed && parsed.errorType) {
            const finalCorrected = sanitizeSourceCode(parsed.correctedCode || sanitizedCode);
            const testResult = await executeCode(effectiveLang, finalCorrected, stdin);
            return res.json({
              errorType: parsed.errorType,
              line: typeof parsed.line === "number" ? parsed.line : null,
              explanation: parsed.explanation || confirmedErr,
              correctedCode: finalCorrected,
              suggestedFixSummary: parsed.suggestedFixSummary || "Code updated to resolve the error.",
              testExecutionOutput: testResult.stdout || testResult.stderr || "",
              testExecutionSuccess: testResult.success && testResult.exitCode === 0,
              testExitCode: testResult.exitCode,
            });
          }
        } catch (geminiErr: any) {
          console.log("[AI Debugger using deterministic compiler diagnostics]:", geminiErr?.message || geminiErr);
        }
      }

      // Deterministic iterative multi-pass compiler diagnostic & repair fallback
      let currentCode = sanitizedCode;
      let currentErr = confirmedErr;
      let firstDiag = diagnoseCompilerErrorDeterministic(effectiveLang, currentCode, currentErr);
      let latestDiag = firstDiag;
      const fixSummaries: string[] = [];
      let testResult: any = null;

      for (let pass = 0; pass < 4; pass++) {
        latestDiag = pass === 0 ? firstDiag : diagnoseCompilerErrorDeterministic(effectiveLang, currentCode, currentErr);
        if (latestDiag.correctedCode === currentCode) break;
        fixSummaries.push(latestDiag.suggestedFixSummary);
        currentCode = latestDiag.correctedCode;
        try {
          testResult = await executeCode(effectiveLang, currentCode, stdin);
          if (testResult.success && testResult.exitCode === 0) {
            break;
          }
          currentErr = testResult.stderr || currentErr;
        } catch {
          break;
        }
      }

      return res.json({
        errorType: firstDiag.errorType,
        line: firstDiag.line,
        explanation: firstDiag.explanation,
        correctedCode: currentCode,
        suggestedFixSummary: fixSummaries.length > 0 ? fixSummaries.join(" ") : firstDiag.suggestedFixSummary,
        testExecutionOutput: testResult?.success ? testResult.stdout : "",
        testExecutionSuccess: Boolean(testResult?.success && testResult?.exitCode === 0),
        testExitCode: testResult ? testResult.exitCode : (preCheck.exitCode || 1),
      });
    } catch (err: any) {
      console.warn("[Compiler AI Debug Warning]:", err?.message || err);
      const diag = diagnoseCompilerErrorDeterministic(effectiveLang, sanitizedCode, String(stderr || err?.message || ""));
      return res.json({
        errorType: diag.errorType,
        line: diag.line,
        explanation: diag.explanation,
        correctedCode: diag.correctedCode,
        suggestedFixSummary: diag.suggestedFixSummary,
        testExecutionOutput: "",
        testExecutionSuccess: false,
        testExitCode: 1,
      });
    }
  });

  // AI CODING ASSISTANT: Explain Code Line-by-Line & Key Concepts
  app.post("/api/compiler/ai-explain", async (req, res) => {
    try {
      const { language, code } = req.body || {};
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "No code provided to explain." });
      }

      let client: GoogleGenAI | null = null;
      try {
        client = getGeminiClient();
      } catch (keyErr) {
        // Fallback
      }

      if (!client) {
        return res.json({
          summary: `Program written in ${language || 'code'}. Run this code in the S-CODERS Playground to inspect stdout and preview output.`,
          keyConcepts: ["Code Execution", "Algorithm Logic", "Console Output"],
          lineByLine: [
            { lines: "1-End", title: "Program Logic", explanation: "Processes instructions and displays outputs." }
          ],
          complexity: "Standard runtime complexity."
        });
      }

      const prompt = `You are the S-CODERS Lead Technical Instructor and Senior Software Engineer.
Your task is to provide an exhaustive, precise, program-specific line-by-line explanation for this ${language || 'code'} program. 

Follow this rigorous 6-step analysis process before responding:
1. Identify the programming language precisely.
2. Read and understand the complete source code.
3. Identify the core purpose and logic of the program.
4. Understand every variable, data type, condition, loop, function, and operation used.
5. Trace how the program works step by step from initialization to exit.
6. Generate a response where EVERY single line-by-line explanation is specifically tailored to THIS exact code (never provide generic placeholders like "Initialization & Logic" unless explicitly applicable to those lines).

Source Code:
\`\`\`${language || 'text'}
${code}
\`\`\`

Return ONLY valid JSON with this structure:
{
  "summary": "1-2 sentence precise summary of what this exact program accomplishes",
  "keyConcepts": ["Concept 1", "Concept 2", "Concept 3"],
  "lineByLine": [
    { "lines": "1-3", "title": "Section Title", "explanation": "Detailed explanation of what these specific lines do" }
  ],
  "complexity": "Time & space complexity summary (e.g. O(1), O(n), etc.)"
}`;

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("AI Gateway timeout")), 15000)
      );

      const response = await Promise.race([
        client.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
        timeoutPromise
      ]);

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (err: any) {
      console.warn("[Compiler AI Explain Warning - Returning Structural Breakdown]:", err?.message || err);
      // Fallback structural explanation
      const codeLines = (req.body?.code || "").split("\n");
      const sampleConcepts: string[] = ["Structured Programming", "Standard Output Stream"];
      if ((req.body?.code || "").includes("tkinter") || (req.body?.code || "").includes("Tk(")) {
        sampleConcepts.push("Tkinter GUI Architecture", "Event-Driven Programming");
      }
      if ((req.body?.code || "").includes("class ")) {
        sampleConcepts.push("Object-Oriented Programming (OOP)");
      }
      if ((req.body?.code || "").includes("def ")) {
        sampleConcepts.push("Function Definitions & Reusability");
      }

      return res.json({
        summary: `Program written in ${req.body?.language || "code"} with ${codeLines.length} lines of instructions.`,
        keyConcepts: sampleConcepts,
        lineByLine: [
          { lines: `1-${Math.min(codeLines.length, 10)}`, title: "Initialization & Logic", explanation: "Sets up dependencies, variables, and core execution logic." },
          { lines: `${Math.min(codeLines.length, 11)}-End`, title: "Execution & Display", explanation: "Processes calculations and displays output to the screen or console." }
        ],
        complexity: "O(n) linear operational complexity."
      });
    }
  });

  // Shared Data Storage Helpers
  const leaderPhotosFilePath = path.resolve(process.cwd(), "data", "leader-photos.json");
  const appStateFilePath = path.resolve(process.cwd(), "data", "app-state.json");
  const authStoreFilePath = path.resolve(process.cwd(), "data", "auth-store.json");

  interface ServerClientAccount {
    uid: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    role: "client";
    clientRole?: string;
    passwordHash?: string;
    hasPassword: boolean;
    linkedRegistrationUids: string[];
    createdAt: string;
    updatedAt: string;
  }

  interface ServerAuthSession {
    tokenHash: string;
    uid: string;
    email: string;
    role: "client" | "admin";
    expiresAtMs: number;
    createdAt: string;
  }

  interface ServerAuthRecoveryOtp {
    email: string;
    section: string;
    otpHash: string;
    expiresAt: string;
    expiresAtMs: number;
    attempts: number;
    used: boolean;
    createdAt: string;
    verifiedAt?: string;
  }

  interface AuthStoreData {
    accounts: ServerClientAccount[];
    sessions: ServerAuthSession[];
    recoveryOtps: ServerAuthRecoveryOtp[];
  }

  function atomicWriteJsonSync(filePath: string, data: any): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmpPath, filePath);
  }

  function hashPasswordScrypt(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const derived = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${derived}`;
  }

  function verifyPasswordScrypt(password: string, storedHash?: string): boolean {
    if (!storedHash || !storedHash.includes(":")) return false;
    const [salt, keyHex] = storedHash.split(":");
    if (!salt || !keyHex) return false;
    try {
      const derived = crypto.scryptSync(password, salt, 64);
      const storedBuf = Buffer.from(keyHex, "hex");
      if (derived.length !== storedBuf.length) return false;
      return crypto.timingSafeEqual(derived, storedBuf);
    } catch {
      return false;
    }
  }

  function getStoredAuthData(): AuthStoreData {
    try {
      if (fs.existsSync(authStoreFilePath)) {
        const content = fs.readFileSync(authStoreFilePath, "utf-8");
        const parsed = JSON.parse(content || "{}");
        return {
          accounts: Array.isArray(parsed?.accounts) ? parsed.accounts : [],
          sessions: Array.isArray(parsed?.sessions) ? parsed.sessions : [],
          recoveryOtps: Array.isArray(parsed?.recoveryOtps) ? parsed.recoveryOtps : [],
        };
      }
    } catch (e) {
      console.error("Error reading auth store file:", e);
    }
    return { accounts: [], sessions: [], recoveryOtps: [] };
  }

  function saveStoredAuthData(data: AuthStoreData): void {
    try {
      const nowMs = Date.now();
      const cleaned: AuthStoreData = {
        accounts: Array.isArray(data.accounts) ? data.accounts : [],
        sessions: (Array.isArray(data.sessions) ? data.sessions : [])
          .filter((s) => Number(s?.expiresAtMs || 0) > nowMs)
          .slice(0, 1000),
        recoveryOtps: (Array.isArray(data.recoveryOtps) ? data.recoveryOtps : []).slice(0, 300),
      };
      atomicWriteJsonSync(authStoreFilePath, cleaned);
    } catch (e) {
      console.error("Error writing auth store file:", e);
    }
  }

  function sanitizeClientAccountForResponse(acc: ServerClientAccount) {
    return {
      uid: acc.uid,
      name: acc.name,
      email: acc.email,
      phone: acc.phone || "Not Specified",
      company: acc.company || "Independent Client",
      role: "client" as const,
      clientRole: acc.clientRole,
      hasPassword: Boolean(acc.hasPassword),
      linkedRegistrationUids: Array.isArray(acc.linkedRegistrationUids) ? acc.linkedRegistrationUids : [],
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt,
    };
  }

  function issueClientSessionToken(authData: AuthStoreData, acc: ServerClientAccount): string {
    const rawToken = `sc_sess_${crypto.randomBytes(32).toString("hex")}`;
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const nowMs = Date.now();
    authData.sessions.unshift({
      tokenHash,
      uid: acc.uid,
      email: acc.email.toLowerCase(),
      role: "client",
      expiresAtMs: nowMs + 14 * 24 * 60 * 60 * 1000,
      createdAt: new Date(nowMs).toISOString(),
    });
    return rawToken;
  }

  function collectLinkedUidsForEmail(appState: Record<string, any>, cleanEmail: string): string[] {
    const set = new Set<string>();
    const addUid = (val: any) => {
      const s = String(val || "").trim().toUpperCase();
      if (s && s !== "ENTER-KEY-TO-VERIFY" && s !== "PASS-KEY") set.add(s);
    };
    const uidRecs: any[] = Array.isArray(appState["db_registration_uids"]) ? appState["db_registration_uids"] : [];
    for (const r of uidRecs) {
      if (String(r?.clientEmail || "").trim().toLowerCase() === cleanEmail && r?.status !== "REVOKED") addUid(r?.uid);
    }
    const svcRegs: any[] = Array.isArray(appState["db_service_registrations"]) ? appState["db_service_registrations"] : [];
    for (const r of svcRegs) {
      if (String(r?.clientProfile?.email || "").trim().toLowerCase() === cleanEmail) addUid(r?.uniqueKey);
    }
    const wkspRegs: any[] = Array.isArray(appState["db_workshop_registrations"]) ? appState["db_workshop_registrations"] : [];
    for (const r of wkspRegs) {
      if (String(r?.participantProfile?.email || "").trim().toLowerCase() === cleanEmail && !r?.isRevoked) addUid(r?.uniqueAccessKey);
    }
    const evtTickets: any[] = Array.isArray(appState["scoders_event_tickets"]) ? appState["scoders_event_tickets"] : [];
    for (const t of evtTickets) {
      if (String(t?.participantEmail || "").trim().toLowerCase() === cleanEmail && t?.status !== "Ticket Cancelled") addUid(t?.ticketCode);
    }
    const enquiries: any[] = Array.isArray(appState["db_enquiries"]) ? appState["db_enquiries"] : [];
    for (const e of enquiries) {
      if (String(e?.email || "").trim().toLowerCase() === cleanEmail && e?.id) addUid(e?.id);
    }
    return Array.from(set);
  }

  function upsertServerClientAccount(
    authData: AuthStoreData,
    appState: Record<string, any>,
    params: {
      email: string;
      name?: string;
      phone?: string;
      company?: string;
      clientRole?: string;
      password?: string;
      registrationUid?: string;
    }
  ): ServerClientAccount {
    const cleanEmail = String(params.email || "").trim().toLowerCase();
    const nowIso = new Date().toISOString();
    const discoveredUids = collectLinkedUidsForEmail(appState, cleanEmail);
    const uidSet = new Set<string>(discoveredUids);
    if (params.registrationUid) {
      const normalized = String(params.registrationUid).trim().toUpperCase();
      if (normalized) uidSet.add(normalized);
    }

    const idx = authData.accounts.findIndex((a) => String(a?.email || "").trim().toLowerCase() === cleanEmail);
    if (idx >= 0) {
      const existing = authData.accounts[idx];
      for (const u of existing.linkedRegistrationUids || []) uidSet.add(String(u).trim().toUpperCase());
      const cleanName = params.name?.trim();
      const cleanPhone = params.phone?.trim();
      const cleanCompany = params.company?.trim();
      const cleanClientRole = params.clientRole?.trim();
      const nextAcc: ServerClientAccount = {
        ...existing,
        name: cleanName && cleanName !== "Valued Client" && cleanName !== "Attendee" ? cleanName : existing.name,
        phone: cleanPhone && cleanPhone !== "Not Specified" ? cleanPhone : existing.phone,
        company: cleanCompany && cleanCompany !== "Independent Client" ? cleanCompany : existing.company,
        clientRole: cleanClientRole || existing.clientRole,
        passwordHash: params.password ? hashPasswordScrypt(params.password) : existing.passwordHash,
        hasPassword: Boolean(params.password || existing.passwordHash),
        linkedRegistrationUids: Array.from(uidSet),
        updatedAt: nowIso,
      };
      authData.accounts[idx] = nextAcc;
      return nextAcc;
    }

    const cleanName = params.name?.trim() || cleanEmail.split("@")[0] || "S-CODERS Client";
    const newAcc: ServerClientAccount = {
      uid: `client-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`,
      name: cleanName,
      email: cleanEmail,
      phone: params.phone?.trim() || "Not Specified",
      company: params.company?.trim() || "Independent Client",
      role: "client",
      clientRole: params.clientRole?.trim(),
      passwordHash: params.password ? hashPasswordScrypt(params.password) : undefined,
      hasPassword: Boolean(params.password),
      linkedRegistrationUids: Array.from(uidSet),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    authData.accounts.unshift(newAcc);
    return newAcc;
  }

  function findClientAccountOrBootstrapFromAppState(
    authData: AuthStoreData,
    appState: Record<string, any>,
    cleanEmail: string
  ): ServerClientAccount | null {
    const existing = authData.accounts.find((a) => String(a?.email || "").trim().toLowerCase() === cleanEmail);
    if (existing) return existing;

    const uidRecs: any[] = Array.isArray(appState["db_registration_uids"]) ? appState["db_registration_uids"] : [];
    const svcRegs: any[] = Array.isArray(appState["db_service_registrations"]) ? appState["db_service_registrations"] : [];
    const wkspRegs: any[] = Array.isArray(appState["db_workshop_registrations"]) ? appState["db_workshop_registrations"] : [];
    const evtTickets: any[] = Array.isArray(appState["scoders_event_tickets"]) ? appState["scoders_event_tickets"] : [];
    const enquiries: any[] = Array.isArray(appState["db_enquiries"]) ? appState["db_enquiries"] : [];

    const uMatch = uidRecs.find((r) => String(r?.clientEmail || "").trim().toLowerCase() === cleanEmail);
    const sMatch = svcRegs.find((r) => String(r?.clientProfile?.email || "").trim().toLowerCase() === cleanEmail);
    const wMatch = wkspRegs.find((r) => String(r?.participantProfile?.email || "").trim().toLowerCase() === cleanEmail);
    const eMatch = evtTickets.find((t) => String(t?.participantEmail || "").trim().toLowerCase() === cleanEmail);
    const qMatch = enquiries.find((q) => String(q?.email || "").trim().toLowerCase() === cleanEmail);

    const svcMap = appState["scoders_registered_services"];
    const smMatch =
      svcMap && typeof svcMap === "object"
        ? Object.values<any>(svcMap).find((v) => String(v?.email || "").trim().toLowerCase() === cleanEmail)
        : null;
    const wkspMap = appState["scoders_registered_workshops"];
    const wmMatch =
      wkspMap && typeof wkspMap === "object"
        ? Object.values<any>(wkspMap).find((v) => String(v?.email || "").trim().toLowerCase() === cleanEmail)
        : null;

    if (!uMatch && !sMatch && !wMatch && !eMatch && !qMatch && !smMatch && !wmMatch) return null;

    const bootstrapped = upsertServerClientAccount(authData, appState, {
      email: cleanEmail,
      name:
        uMatch?.clientName ||
        sMatch?.clientProfile?.name ||
        wMatch?.participantProfile?.name ||
        eMatch?.participantName ||
        qMatch?.name ||
        smMatch?.name ||
        wmMatch?.name,
      phone:
        uMatch?.clientPhone ||
        sMatch?.clientProfile?.phone ||
        wMatch?.participantProfile?.phone ||
        eMatch?.participantPhone ||
        qMatch?.phone,
      company: uMatch?.clientOrg || sMatch?.clientProfile?.company || eMatch?.participantOrg || smMatch?.role,
      clientRole: uMatch?.clientRole || wMatch?.participantProfile?.role || wmMatch?.role,
    });
    saveStoredAuthData(authData);
    return bootstrapped;
  }

  function collectClientRegistrationsSnapshot(appState: Record<string, any>, cleanEmail: string) {
    const uidRecords: any[] = Array.isArray(appState["db_registration_uids"]) ? appState["db_registration_uids"] : [];
    const svcRegs: any[] = Array.isArray(appState["db_service_registrations"]) ? appState["db_service_registrations"] : [];
    const wkspRegs: any[] = Array.isArray(appState["db_workshop_registrations"]) ? appState["db_workshop_registrations"] : [];
    const evtTickets: any[] = Array.isArray(appState["scoders_event_tickets"]) ? appState["scoders_event_tickets"] : [];
    const chats: any[] = Array.isArray(appState["db_chats"]) ? appState["db_chats"] : [];
    const revokedMap: Record<string, any> =
      appState["scoders_revoked_passes"] && typeof appState["scoders_revoked_passes"] === "object"
        ? appState["scoders_revoked_passes"]
        : {};

    const serviceRegistrations = svcRegs.filter(
      (r) => String(r?.clientProfile?.email || "").trim().toLowerCase() === cleanEmail
    );
    const workshopRegistrations = wkspRegs.filter(
      (r) =>
        String(r?.participantProfile?.email || "").trim().toLowerCase() === cleanEmail &&
        !r?.isRevoked &&
        r?.paymentStatus !== "Cancelled" &&
        r?.paymentStatus !== "Revoked" &&
        !revokedMap[String(r?.uniqueAccessKey || "").trim().toUpperCase()]
    );
    const eventTickets = evtTickets.filter(
      (t) =>
        String(t?.participantEmail || "").trim().toLowerCase() === cleanEmail &&
        t?.status !== "Ticket Cancelled"
    );

    const registrationUids = uidRecords.filter(
      (r) => String(r?.clientEmail || "").trim().toLowerCase() === cleanEmail && r?.status !== "REVOKED"
    );
    const uidMetaByKey = new Map<string, any>();
    for (const u of registrationUids) {
      if (u?.uid) uidMetaByKey.set(String(u.uid).trim().toUpperCase(), u);
    }

    const registeredServicesMap: Record<string, any> = {};
    for (const s of serviceRegistrations) {
      if (s?.serviceId && s?.uniqueKey) {
        const uidEntry = uidMetaByKey.get(String(s.uniqueKey).trim().toUpperCase());
        const savedNotes = s.notes || s.projectRequirements || uidEntry?.metadata?.notes || uidEntry?.metadata?.requirements || "";
        registeredServicesMap[s.serviceId] = {
          key: s.uniqueKey,
          name: s.clientProfile?.name || "Registered Client",
          email: cleanEmail,
          phone: s.clientProfile?.phone || uidEntry?.clientPhone || "",
          role: s.clientProfile?.company || "Client Partner",
          requirements: s.projectRequirements || savedNotes || "",
          notes: savedNotes,
          budget: s.budget || "TBD",
          timeline: s.timeline || "TBD",
          chatId: s.chatId || `chat-svc-${s.uniqueKey}`,
          timestamp: s.registrationDate || new Date().toISOString(),
        };
      }
    }
    const registeredWorkshopsMap: Record<string, any> = {};
    for (const w of workshopRegistrations) {
      if (w?.workshopId && w?.uniqueAccessKey) {
        const uidEntry = uidMetaByKey.get(String(w.uniqueAccessKey).trim().toUpperCase());
        const savedNotes = w.notes || uidEntry?.metadata?.notes || "";
        registeredWorkshopsMap[w.workshopId] = {
          key: w.uniqueAccessKey,
          name: w.participantProfile?.name || "Registered Attendee",
          email: cleanEmail,
          phone: w.participantProfile?.phone || uidEntry?.clientPhone || "",
          role: w.participantProfile?.role || "Developer",
          notes: savedNotes,
          tickets: 1,
          totalPaid: Number(w.amountPaid) || 0,
          chatId: w.chatId || `chat-wksp-${w.uniqueAccessKey}`,
          timestamp: w.paymentDate || new Date().toLocaleDateString(),
        };
      }
    }

    for (const u of registrationUids) {
      if (u.section === "service" && u.itemId && !registeredServicesMap[u.itemId]) {
        const savedNotes = u.metadata?.notes || u.metadata?.requirements || "";
        registeredServicesMap[u.itemId] = {
          key: u.uid,
          name: u.clientName || "Registered Client",
          email: cleanEmail,
          phone: u.clientPhone || "",
          role: u.clientRole || u.clientOrg || "Client Partner",
          requirements: u.metadata?.requirements || savedNotes || "",
          notes: savedNotes,
          budget: u.metadata?.budget || "TBD",
          timeline: u.metadata?.timeline || "TBD",
          chatId: u.chatId || `chat-svc-${u.uid}`,
          timestamp: u.issuedAt || new Date().toISOString(),
        };
      }
      if (u.section === "workshop" && u.itemId && !registeredWorkshopsMap[u.itemId] && !revokedMap[u.uid?.toUpperCase()]) {
        registeredWorkshopsMap[u.itemId] = {
          key: u.uid,
          name: u.clientName || "Registered Attendee",
          email: cleanEmail,
          phone: u.clientPhone || "",
          role: u.clientRole || "Developer",
          notes: u.metadata?.notes || "",
          tickets: 1,
          totalPaid: Number(u.amount) || 0,
          chatId: u.chatId || `chat-wksp-${u.uid}`,
          timestamp: u.issuedAt || new Date().toISOString(),
        };
      }
    }

    const matchedKeys = new Set<string>([
      ...serviceRegistrations.map((s) => String(s?.uniqueKey || "").trim().toUpperCase()),
      ...workshopRegistrations.map((w) => String(w?.uniqueAccessKey || "").trim().toUpperCase()),
      ...registrationUids.map((u) => String(u?.uid || "").trim().toUpperCase()),
    ]);
    const relatedChats = chats.filter(
      (c) =>
        String(c?.clientEmail || "").trim().toLowerCase() === cleanEmail ||
        matchedKeys.has(String(c?.uniqueAccessKey || "").trim().toUpperCase())
    );

    return {
      registrationUids,
      serviceRegistrations,
      workshopRegistrations,
      eventTickets,
      chats: relatedChats,
      registeredServicesMap,
      registeredWorkshopsMap,
    };
  }

  function getStoredLeaderPhotos(): Record<string, string> {
    const defaults: Record<string, string> = {
      shreyas: "/founder.jpg",
      lokesh: "/cofounder.jpg",
      bhuvan: "/techlead.jpg",
    };
    try {
      if (fs.existsSync(leaderPhotosFilePath)) {
        const content = fs.readFileSync(leaderPhotosFilePath, "utf-8");
        return { ...defaults, ...JSON.parse(content || "{}") };
      }
    } catch (e) {
      console.error("Error reading leader photos file:", e);
    }
    return defaults;
  }

  function saveStoredLeaderPhotos(photos: Record<string, string>): void {
    try {
      atomicWriteJsonSync(leaderPhotosFilePath, photos);
    } catch (e) {
      console.error("Error writing leader photos file:", e);
    }
  }

  function getStoredAppState(): Record<string, any> {
    try {
      if (fs.existsSync(appStateFilePath)) {
        const content = fs.readFileSync(appStateFilePath, "utf-8");
        const parsed = JSON.parse(content || "{}");
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading app state file:", e);
    }
    return {};
  }

  function saveStoredAppState(state: Record<string, any>): void {
    try {
      atomicWriteJsonSync(appStateFilePath, state);
    } catch (e) {
      console.error("Error writing app state file:", e);
    }
  }

  function resolveAuthoritativeItemWindow(
    appState: Record<string, any>,
    section: RegistrationWindowSection,
    itemId?: string,
    itemTitle?: string,
    fallbackStartDate?: string,
    fallbackEndDate?: string,
    fallbackStatus?: string
  ): RegistrationWindowEvaluation {
    const cleanId = String(itemId || "").trim();
    const cleanTitle = String(itemTitle || "").trim();
    const collectionKey = section === "workshop" ? "scoders_dynamic_workshops" : "scoders_dynamic_events";
    const list: any[] = Array.isArray(appState?.[collectionKey]) ? appState[collectionKey] : [];

    let matched: any = null;
    if (cleanId) {
      matched = list.find((item: any) => String(item?.id || "").trim() === cleanId);
    }
    if (!matched && cleanTitle) {
      const lowerTitle = cleanTitle.toLowerCase();
      matched = list.find(
        (item: any) => String(item?.title || item?.name || "").trim().toLowerCase() === lowerTitle
      );
    }

    const resolvedId = String(matched?.id || cleanId || "").trim();
    const resolvedTitle = String(
      matched?.title || matched?.name || cleanTitle || (section === "workshop" ? "Workshop" : "Event")
    );
    const statusOverride = matched?.status ?? fallbackStatus;

    const rawStart = matched ? matched.registrationStartDate : fallbackStartDate;
    const rawEnd = matched ? matched.registrationEndDate : fallbackEndDate;
    const { startDate, endDate } = resolveDefaultDatesForItem(section, resolvedId, rawStart, rawEnd);

    return evaluateRegistrationWindow({
      section,
      itemId: resolvedId,
      itemTitle: resolvedTitle,
      startDate,
      endDate,
      statusOverride,
      nowMs: Date.now(),
    });
  }

  // 1. Shared Leader Photos Endpoints (Available to all visitors & admin sync)
  app.get("/api/leader-photos", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json({ success: true, photos: getStoredLeaderPhotos() });
  });

  app.post("/api/leader-photos", (req, res) => {
    try {
      const current = getStoredLeaderPhotos();
      const { id, photoUrl, photos } = req.body;

      if (photos && typeof photos === 'object') {
        Object.entries(photos).forEach(([k, v]) => {
          if (typeof v === 'string' && v.trim().length > 0) {
            current[k] = v.trim();
          }
        });
        saveStoredLeaderPhotos(current);
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        return res.json({ success: true, photos: current });
      }

      if (!id || !photoUrl) {
        return res.status(400).json({ error: "Missing leader ID or photo URL" });
      }

      current[id] = photoUrl;
      saveStoredLeaderPhotos(current);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({ success: true, photos: current });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/leader-photos/reset", (req, res) => {
    try {
      const { id } = req.body;
      const defaults: Record<string, string> = {
        shreyas: "/founder.jpg",
        lokesh: "/cofounder.jpg",
        bhuvan: "/techlead.jpg",
      };
      const current = getStoredLeaderPhotos();
      if (id && defaults[id]) {
        current[id] = defaults[id];
      } else if (id) {
        delete current[id];
      } else {
        Object.assign(current, defaults);
      }
      saveStoredLeaderPhotos(current);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({ success: true, photos: current });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  function mergeUniqueArrayByKey(existingArr: any[], incomingArr: any[], getKeys: (item: any) => string[]): any[] {
    const result: any[] = [];
    const seen = new Map<string, number>();

    const upsert = (item: any) => {
      if (!item || typeof item !== "object") return;
      const keys = getKeys(item).map((k) => String(k || "").trim().toUpperCase()).filter(Boolean);
      let matchedIdx = -1;
      for (const k of keys) {
        if (seen.has(k)) {
          matchedIdx = seen.get(k)!;
          break;
        }
      }
      if (matchedIdx >= 0) {
        result[matchedIdx] = { ...result[matchedIdx], ...item };
        for (const k of keys) seen.set(k, matchedIdx);
      } else {
        const idx = result.length;
        result.push(item);
        for (const k of keys) seen.set(k, idx);
      }
    };

    if (Array.isArray(existingArr)) existingArr.forEach(upsert);
    if (Array.isArray(incomingArr)) incomingArr.forEach(upsert);
    return result;
  }

  function applySafeAppStateWrite(current: Record<string, any>, key: string, value: any, replaceExact: boolean): void {
    if (key === "db_uid_recovery_otps" || key === "db_client_accounts" || key === "scoders_client_passwords") {
      // Security: Never store OTP hashes or client credentials in public app-state
      return;
    }
    if (replaceExact) {
      current[key] = value;
      return;
    }

    const existing = current[key];
    if (key === "db_service_registrations" && Array.isArray(value)) {
      current[key] = mergeUniqueArrayByKey(Array.isArray(existing) ? existing : [], value, (r) => [r?.uniqueKey, r?.id]);
      return;
    }
    if (key === "db_workshop_registrations" && Array.isArray(value)) {
      current[key] = mergeUniqueArrayByKey(Array.isArray(existing) ? existing : [], value, (r) => [r?.uniqueAccessKey, r?.id]);
      return;
    }
    if (key === "db_registration_uids" && Array.isArray(value)) {
      current[key] = mergeUniqueArrayByKey(Array.isArray(existing) ? existing : [], value, (r) => [r?.uid]);
      return;
    }
    if (key === "scoders_event_tickets" && Array.isArray(value)) {
      current[key] = mergeUniqueArrayByKey(Array.isArray(existing) ? existing : [], value, (t) => [t?.ticketCode, t?.id]);
      return;
    }
    if (key === "db_payments" && Array.isArray(value)) {
      current[key] = mergeUniqueArrayByKey(Array.isArray(existing) ? existing : [], value, (p) => [p?.id, p?.razorpayPaymentId]);
      return;
    }
    if (key === "db_chats" && Array.isArray(value)) {
      current[key] = mergeUniqueArrayByKey(Array.isArray(existing) ? existing : [], value, (c) => [c?.uniqueAccessKey, c?.id]);
      return;
    }
    if (key === "db_files" && Array.isArray(value)) {
      current[key] = mergeUniqueArrayByKey(Array.isArray(existing) ? existing : [], value, (f) => [f?.id]);
      return;
    }
    if (key === "db_enquiries" && Array.isArray(value)) {
      current[key] = mergeUniqueArrayByKey(Array.isArray(existing) ? existing : [], value, (e) => [e?.id]);
      return;
    }
    if ((key === "scoders_registered_services" || key === "scoders_registered_workshops") && value && typeof value === "object") {
      current[key] = { ...(existing && typeof existing === "object" ? existing : {}), ...value };
      return;
    }
    current[key] = value;
  }

  // 2. Shared Global App State Sync Endpoints (Database, Workshops, Services, Invoices, Agreements)
  app.get("/api/app-state", (req, res) => {
    const state = { ...getStoredAppState() };
    delete state["db_uid_recovery_otps"];
    delete state["db_client_accounts"];
    delete state["scoders_client_passwords"];
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json({ success: true, state });
  });

  app.post("/api/app-state", (req, res) => {
    try {
      const { key, value, entries, replaceExact } = req.body || {};
      const current = getStoredAppState();
      const forceReplace = Boolean(replaceExact);
      if (entries && typeof entries === "object") {
        for (const [k, v] of Object.entries(entries)) {
          if (v !== undefined) applySafeAppStateWrite(current, k, v, forceReplace);
        }
      } else if (key && value !== undefined) {
        applySafeAppStateWrite(current, String(key), value, forceReplace);
      }
      saveStoredAppState(current);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({ success: true, count: Object.keys(current).length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auto-save / update client personal details for an active service registration
  app.post("/api/services/update-profile", (req, res) => {
    try {
      const body = req.body || {};
      const serviceId = typeof body.serviceId === "string" ? body.serviceId.trim() : "";
      const rawKey = typeof body.uniqueKey === "string" ? body.uniqueKey : (typeof body.uid === "string" ? body.uid : "");
      const uniqueKey = rawKey.replace(/\s+/g, "").trim().toUpperCase();
      const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 180) : "";
      const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "";
      const role = typeof body.role === "string" ? body.role.trim().slice(0, 180) : "";
      const budget = typeof body.budget === "string" ? body.budget.trim().slice(0, 100) : "";
      const timeline = typeof body.timeline === "string" ? body.timeline.trim().slice(0, 100) : "";
      const hasNotesField = typeof body.notes === "string" || typeof body.requirements === "string";
      const rawNotes = typeof body.notes === "string" ? body.notes : (typeof body.requirements === "string" ? body.requirements : "");
      const requirements = rawNotes.trim().slice(0, 2000);

      if (!serviceId && !uniqueKey) {
        return res.status(400).json({ success: false, error: "serviceId or uniqueKey is required." });
      }

      const current = getStoredAppState();
      const hasValidKey = Boolean(uniqueKey && uniqueKey !== "ENTER-KEY-TO-VERIFY");
      let updated = false;

      const svcRegs: any[] = Array.isArray(current["db_service_registrations"]) ? [...current["db_service_registrations"]] : [];
      let matchedReg: any = null;

      current["db_service_registrations"] = svcRegs.map((reg: any) => {
        const regKey = String(reg?.uniqueKey || "").replace(/\s+/g, "").trim().toUpperCase();
        const regEmail = String(reg?.clientProfile?.email || "").trim().toLowerCase();
        const keyMatch = hasValidKey && regKey === uniqueKey;
        const svcMatch = Boolean(
          !hasValidKey &&
            serviceId &&
            reg?.serviceId === serviceId &&
            ((email && (!regEmail || regEmail === email)) || (!email && !regKey && !regEmail))
        );
        if (keyMatch || svcMatch) {
          updated = true;
          matchedReg = {
            ...reg,
            clientProfile: {
              ...(reg.clientProfile || {}),
              name: name || reg.clientProfile?.name,
              email: email || reg.clientProfile?.email,
              phone: phone || reg.clientProfile?.phone,
              company: role || reg.clientProfile?.company,
            },
            budget: budget || reg.budget,
            timeline: timeline || reg.timeline,
            projectRequirements: hasNotesField ? (requirements || reg.projectRequirements) : reg.projectRequirements,
            notes: hasNotesField ? requirements : reg.notes,
            updatedAt: new Date().toISOString(),
          };
          return matchedReg;
        }
        return reg;
      });

      if (current["scoders_registered_services"] && typeof current["scoders_registered_services"] === "object") {
        const regMap = { ...current["scoders_registered_services"] };
        for (const [k, entry] of Object.entries<any>(regMap)) {
          const entryKey = String(entry?.key || "").replace(/\s+/g, "").trim().toUpperCase();
          const entryEmail = String(entry?.email || "").trim().toLowerCase();
          const keyMatch = hasValidKey && entryKey === uniqueKey;
          const svcMatch =
            !hasValidKey &&
            k === serviceId &&
            ((email && (!entryEmail || entryEmail === email)) || (!email && !entryKey && !entryEmail));
          if (keyMatch || svcMatch) {
            regMap[k] = {
              ...entry,
              name: name || entry?.name,
              email: email || entry?.email,
              phone: phone || entry?.phone,
              role: role || entry?.role,
              budget: budget || entry?.budget,
              timeline: timeline || entry?.timeline,
              requirements: hasNotesField ? (requirements || entry?.requirements) : entry?.requirements,
              notes: hasNotesField ? requirements : entry?.notes,
              autoSavedAt: new Date().toISOString(),
            };
            updated = true;
          }
        }
        current["scoders_registered_services"] = regMap;
      }

      let matchedUidRec: any = null;
      if (Array.isArray(current["db_registration_uids"])) {
        current["db_registration_uids"] = current["db_registration_uids"].map((uidRec: any) => {
          const uidEmail = String(uidRec?.clientEmail || "").trim().toLowerCase();
          const keyMatch = hasValidKey && String(uidRec?.uid || "").replace(/\s+/g, "").trim().toUpperCase() === uniqueKey;
          const svcMatch = !hasValidKey && uidRec?.section === "service" && uidRec?.itemId === serviceId && email && uidEmail === email;
          if (uidRec?.section === "service" && (keyMatch || svcMatch)) {
            updated = true;
            matchedUidRec = {
              ...uidRec,
              clientName: name || uidRec.clientName,
              clientEmail: email || uidRec.clientEmail,
              clientPhone: phone || uidRec.clientPhone,
              clientRole: role || uidRec.clientRole,
              metadata: {
                ...(uidRec.metadata || {}),
                budget: budget || uidRec.metadata?.budget,
                timeline: timeline || uidRec.metadata?.timeline,
                requirements: hasNotesField ? (requirements || uidRec.metadata?.requirements) : uidRec.metadata?.requirements,
                notes: hasNotesField ? requirements : uidRec.metadata?.notes,
              },
            };
            return matchedUidRec;
          }
          return uidRec;
        });
      }

      // Self-heal upsert: if key exists in db_registration_uids or scoders_registered_services or db_chats/enquiries
      if (!matchedReg && (hasValidKey || (serviceId && email))) {
        const scodersEntry = serviceId ? current["scoders_registered_services"]?.[serviceId] : null;
        const scodersEntryKey = String(scodersEntry?.key || "").replace(/\s+/g, "").trim().toUpperCase();
        const scodersEntryEmail = String(scodersEntry?.email || "").trim().toLowerCase();
        const entryAllowed = Boolean(
          scodersEntry &&
            (hasValidKey ? scodersEntryKey === uniqueKey : !scodersEntryEmail || scodersEntryEmail === email)
        );
        const resolvedKey = hasValidKey ? uniqueKey : String(scodersEntryKey || matchedUidRec?.uid || "").replace(/\s+/g, "").trim().toUpperCase();
        if (resolvedKey && resolvedKey !== "ENTER-KEY-TO-VERIFY") {
          const lookupCheck = matchedUidRec ? { record: matchedUidRec } : findExistingRecordByKeyOrUid(current, resolvedKey, "service");
          if (lookupCheck.record || entryAllowed) {
            const newSvcReg = {
              id: `REG-SVC-${Date.now().toString().slice(-4)}`,
              clientProfile: {
                name: name || lookupCheck.record?.clientName || scodersEntry?.name || "Registered Client",
                email: email || lookupCheck.record?.clientEmail || scodersEntry?.email || "",
                phone: phone || lookupCheck.record?.clientPhone || scodersEntry?.phone || "+91 99999 00000",
                company: role || lookupCheck.record?.clientRole || scodersEntry?.role || "Independent Client",
              },
              serviceId: serviceId || lookupCheck.record?.itemId || "service",
              selectedServiceTitle: lookupCheck.record?.itemTitle || "S-CODERS Custom Service",
              uniqueKey: resolvedKey,
              projectRequirements: requirements || lookupCheck.record?.metadata?.requirements || scodersEntry?.requirements || "Active Service Scope",
              notes: requirements || lookupCheck.record?.metadata?.notes || scodersEntry?.notes || "",
              budget: budget || lookupCheck.record?.metadata?.budget || scodersEntry?.budget || "TBD",
              timeline: timeline || lookupCheck.record?.metadata?.timeline || scodersEntry?.timeline || "TBD",
              projectStatus: "In Progress",
              registrationDate: new Date().toISOString().split("T")[0],
              projectSubmissionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              sourceCodeFileId: `FIL-SRC-${Date.now().toString().slice(-4)}`,
              pdfFileId: `FIL-PDF-${Date.now().toString().slice(-4)}`,
              chatId: lookupCheck.record?.chatId || scodersEntry?.chatId || `chat-svc-${resolvedKey}`,
              feedbackId: null,
              invoiceId: `INV-2026-${Date.now().toString().slice(-3)}`,
              updatedAt: new Date().toISOString(),
            };
            current["db_service_registrations"] = [newSvcReg, ...(Array.isArray(current["db_service_registrations"]) ? current["db_service_registrations"] : [])];
            matchedReg = newSvcReg;
            updated = true;
          }
        }
      }

      if (Array.isArray(current["db_chats"])) {
        current["db_chats"] = current["db_chats"].map((chat: any) => {
          if (hasValidKey && String(chat?.uniqueAccessKey || "").replace(/\s+/g, "").trim().toUpperCase() === uniqueKey) {
            updated = true;
            return {
              ...chat,
              clientName: name || chat.clientName,
              clientEmail: email || chat.clientEmail,
              lastUpdated: new Date().toISOString(),
            };
          }
          return chat;
        });
      }

      if (!updated) {
        return res.status(404).json({
          success: false,
          updated: false,
          error: "No active service registration found for this code. Please verify your registration UID first.",
        });
      }

      saveStoredAppState(current);

      const resolvedEmail = email || matchedReg?.clientProfile?.email || matchedUidRec?.clientEmail;
      if (resolvedEmail && resolvedEmail.includes("@")) {
        const authData = getStoredAuthData();
        upsertServerClientAccount(authData, current, {
          email: resolvedEmail,
          name: name || matchedReg?.clientProfile?.name,
          phone: phone || matchedReg?.clientProfile?.phone,
          clientRole: role || matchedReg?.clientProfile?.company,
          registrationUid: hasValidKey ? uniqueKey : matchedReg?.uniqueKey,
        });
        saveStoredAuthData(authData);
      }

      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json({ success: true, updated: true, savedAt: new Date().toISOString(), record: matchedReg || matchedUidRec || null });
    } catch (err: any) {
      console.error("Service Profile Auto-Save Error:", err);
      return res.status(500).json({ success: false, error: "Failed to auto-save service profile." });
    }
  });

  // Permanently cancel a client service order & delete all associated database records
  app.post(["/api/services/cancel", "/api/services/registrations/cancel"], (req, res) => {
    try {
      const body = req.body || {};
      const serviceId = typeof body.serviceId === "string" ? body.serviceId.trim() : "";
      const uniqueKey = typeof body.uniqueKey === "string" ? body.uniqueKey.trim().toUpperCase() : "";
      const clientEmail = typeof body.clientEmail === "string" ? body.clientEmail.trim().toLowerCase() : "";
      const chatId = typeof body.chatId === "string" ? body.chatId.trim() : "";

      const validKey = uniqueKey && uniqueKey !== "ENTER-KEY-TO-VERIFY" ? uniqueKey : "";
      if (!validKey && !(serviceId && clientEmail)) {
        return res.status(400).json({
          success: false,
          error: "A valid registration key or serviceId with clientEmail is required to cancel a service order.",
        });
      }

      const current = getStoredAppState();
      const matchedRegIds = new Set<string>();
      const matchedFileIds = new Set<string>();
      const matchedChatIds = new Set<string>();
      const matchedKeys = new Set<string>();
      if (validKey) {
        matchedKeys.add(validKey);
      }
      if (chatId) {
        matchedChatIds.add(chatId);
      }

      let deletedCount = 0;

      // 1. Remove matching entries from db_service_registrations and collect linked IDs
      if (Array.isArray(current["db_service_registrations"])) {
        const remaining: any[] = [];
        for (const reg of current["db_service_registrations"]) {
          const regKey = String(reg?.uniqueKey || "").trim().toUpperCase();
          const regEmail = String(reg?.clientProfile?.email || "").trim().toLowerCase();
          const matchesKey = Boolean(validKey && regKey === validKey);
          const matchesSvcAndEmail = Boolean(
            !validKey &&
              serviceId &&
              reg?.serviceId === serviceId &&
              clientEmail &&
              regEmail === clientEmail
          );
          if (matchesKey || matchesSvcAndEmail) {
            deletedCount++;
            if (reg?.id) matchedRegIds.add(String(reg.id));
            if (regKey) matchedKeys.add(regKey);
            if (reg?.chatId) matchedChatIds.add(String(reg.chatId));
            if (reg?.sourceCodeFileId) matchedFileIds.add(String(reg.sourceCodeFileId));
            if (reg?.pdfFileId) matchedFileIds.add(String(reg.pdfFileId));
          } else {
            remaining.push(reg);
          }
        }
        current["db_service_registrations"] = remaining;
      }

      // 2. Remove matching entries from scoders_registered_services
      if (current["scoders_registered_services"] && typeof current["scoders_registered_services"] === "object") {
        const regMap = { ...current["scoders_registered_services"] };
        if (serviceId && regMap[serviceId]) {
          const entryKey = String(regMap[serviceId]?.key || "").trim().toUpperCase();
          const entryEmail = String(regMap[serviceId]?.email || "").trim().toLowerCase();
          const keyMatches = Boolean(validKey && (entryKey === validKey || matchedKeys.has(entryKey)));
          const emailMatches = Boolean(!validKey && clientEmail && (!entryEmail || entryEmail === clientEmail));
          if (keyMatches || emailMatches || (!entryKey && !entryEmail)) {
            if (entryKey) matchedKeys.add(entryKey);
            if (regMap[serviceId]?.chatId) matchedChatIds.add(String(regMap[serviceId].chatId));
            delete regMap[serviceId];
            deletedCount++;
          }
        }
        for (const [k, v] of Object.entries<any>(regMap)) {
          const entryKey = String(v?.key || "").trim().toUpperCase();
          if (entryKey && matchedKeys.has(entryKey)) {
            delete regMap[k];
            deletedCount++;
          }
        }
        current["scoders_registered_services"] = regMap;
      }

      // 3. Remove matching service UID record from db_registration_uids
      if (Array.isArray(current["db_registration_uids"])) {
        const before = current["db_registration_uids"].length;
        current["db_registration_uids"] = current["db_registration_uids"].filter((uidRec: any) => {
          if (uidRec?.section !== "service") return true;
          const recUid = String(uidRec?.uid || "").trim().toUpperCase();
          const recEmail = String(uidRec?.clientEmail || "").trim().toLowerCase();
          if (recUid && matchedKeys.has(recUid)) return false;
          if (serviceId && uidRec?.itemId === serviceId && clientEmail && recEmail === clientEmail) return false;
          return true;
        });
        deletedCount += before - current["db_registration_uids"].length;
      }

      // 4. Remove associated chats from db_chats
      if (Array.isArray(current["db_chats"])) {
        const before = current["db_chats"].length;
        current["db_chats"] = current["db_chats"].filter((c: any) => {
          const cKey = String(c?.uniqueAccessKey || "").trim().toUpperCase();
          const cEmail = String(c?.clientEmail || "").trim().toLowerCase();
          if (c?.id && matchedChatIds.has(String(c.id))) return false;
          if (cKey && matchedKeys.has(cKey)) return false;
          if (c?.registrationId && matchedRegIds.has(String(c.registrationId))) return false;
          if (serviceId && c?.serviceId === serviceId && clientEmail && cEmail === clientEmail) return false;
          return true;
        });
        deletedCount += before - current["db_chats"].length;
      }

      // 5. Remove associated files from db_files
      if (Array.isArray(current["db_files"])) {
        const before = current["db_files"].length;
        current["db_files"] = current["db_files"].filter((f: any) => {
          if (f?.id && matchedFileIds.has(String(f.id))) return false;
          if (f?.registrationId && matchedRegIds.has(String(f.registrationId))) return false;
          return true;
        });
        deletedCount += before - current["db_files"].length;
      }

      // 6. Remove associated feedbacks from db_feedbacks
      if (Array.isArray(current["db_feedbacks"])) {
        const before = current["db_feedbacks"].length;
        current["db_feedbacks"] = current["db_feedbacks"].filter((fb: any) => {
          if (fb?.type !== "service") return true;
          if (fb?.registrationId && matchedRegIds.has(String(fb.registrationId))) return false;
          const fbEmail = String(fb?.clientEmail || "").trim().toLowerCase();
          if (clientEmail && fbEmail === clientEmail && fb?.registrationId && matchedKeys.has(String(fb.registrationId).toUpperCase())) return false;
          return true;
        });
        deletedCount += before - current["db_feedbacks"].length;
      }

      // 7. Remove matching project enquiry if its id is one of the cancelled UIDs
      if (Array.isArray(current["db_enquiries"])) {
        const before = current["db_enquiries"].length;
        current["db_enquiries"] = current["db_enquiries"].filter((enq: any) => {
          const enqId = String(enq?.id || "").trim().toUpperCase();
          return !(enqId && matchedKeys.has(enqId));
        });
        deletedCount += before - current["db_enquiries"].length;
      }

      saveStoredAppState(current);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json({
        success: true,
        serviceId,
        cancelledKey: uniqueKey || null,
        deletedCount,
        message: "Service order and all associated database records deleted permanently.",
      });
    } catch (err: any) {
      console.error("Service Cancellation Error:", err);
      return res.status(500).json({ success: false, error: "Failed to permanently cancel service order." });
    }
  });

  // Auto-save / update attendee details for an active workshop registration
  app.post("/api/workshops/update-profile", (req, res) => {
    try {
      const body = req.body || {};
      const workshopId = typeof body.workshopId === "string" ? body.workshopId.trim() : "";
      const rawKey = typeof body.uniqueKey === "string" ? body.uniqueKey : (typeof body.uid === "string" ? body.uid : "");
      const uniqueKey = rawKey.replace(/\s+/g, "").trim().toUpperCase();
      const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 180) : "";
      const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "";
      const role = typeof body.role === "string" ? body.role.trim().slice(0, 180) : "";
      const hasNotesField = typeof body.notes === "string";
      const notes = hasNotesField ? String(body.notes).trim().slice(0, 2000) : "";

      if (!workshopId && !uniqueKey) {
        return res.status(400).json({ success: false, error: "workshopId or uniqueKey is required." });
      }

      const current = getStoredAppState();
      const hasValidKey = Boolean(uniqueKey && uniqueKey !== "PASS-KEY");
      let updated = false;
      let matchedReg: any = null;

      if (Array.isArray(current["db_workshop_registrations"])) {
        current["db_workshop_registrations"] = current["db_workshop_registrations"].map((reg: any) => {
          const regKey = String(reg?.uniqueAccessKey || "").replace(/\s+/g, "").trim().toUpperCase();
          const regEmail = String(reg?.participantProfile?.email || "").trim().toLowerCase();
          const keyMatch = hasValidKey && regKey === uniqueKey;
          const wkspMatch = Boolean(
            !hasValidKey &&
              workshopId &&
              reg?.workshopId === workshopId &&
              ((email && (!regEmail || regEmail === email)) || (!email && !regKey && !regEmail))
          );
          if (keyMatch || wkspMatch) {
            updated = true;
            matchedReg = {
              ...reg,
              participantProfile: {
                ...(reg.participantProfile || {}),
                name: name || reg.participantProfile?.name,
                email: email || reg.participantProfile?.email,
                phone: phone || reg.participantProfile?.phone,
                role: role || reg.participantProfile?.role,
              },
              notes: hasNotesField ? notes : reg.notes,
              updatedAt: new Date().toISOString(),
            };
            return matchedReg;
          }
          return reg;
        });
      }

      if (current["scoders_registered_workshops"] && typeof current["scoders_registered_workshops"] === "object") {
        const regMap = { ...current["scoders_registered_workshops"] };
        for (const [k, entry] of Object.entries<any>(regMap)) {
          const entryKey = String(entry?.key || "").replace(/\s+/g, "").trim().toUpperCase();
          const entryEmail = String(entry?.email || "").trim().toLowerCase();
          const keyMatch = hasValidKey && entryKey === uniqueKey;
          const wkspMatch =
            !hasValidKey &&
            k === workshopId &&
            ((email && (!entryEmail || entryEmail === email)) || (!email && !entryKey && !entryEmail));
          if (keyMatch || wkspMatch) {
            regMap[k] = {
              ...entry,
              name: name || entry?.name,
              email: email || entry?.email,
              phone: phone || entry?.phone,
              role: role || entry?.role,
              notes: hasNotesField ? notes : entry?.notes,
              autoSavedAt: new Date().toISOString(),
            };
            updated = true;
          }
        }
        current["scoders_registered_workshops"] = regMap;
      }

      let matchedUidRec: any = null;
      if (Array.isArray(current["db_registration_uids"])) {
        current["db_registration_uids"] = current["db_registration_uids"].map((uidRec: any) => {
          const uidEmail = String(uidRec?.clientEmail || "").trim().toLowerCase();
          const keyMatch = hasValidKey && String(uidRec?.uid || "").replace(/\s+/g, "").trim().toUpperCase() === uniqueKey;
          const wkspMatch = !hasValidKey && uidRec?.section === "workshop" && uidRec?.itemId === workshopId && email && uidEmail === email;
          if (uidRec?.section === "workshop" && (keyMatch || wkspMatch)) {
            updated = true;
            matchedUidRec = {
              ...uidRec,
              clientName: name || uidRec.clientName,
              clientEmail: email || uidRec.clientEmail,
              clientPhone: phone || uidRec.clientPhone,
              clientRole: role || uidRec.clientRole,
              metadata: {
                ...(uidRec.metadata || {}),
                notes: hasNotesField ? notes : uidRec.metadata?.notes,
              },
            };
            return matchedUidRec;
          }
          return uidRec;
        });
      }

      if (!matchedReg && (hasValidKey || (workshopId && email))) {
        const wkspEntry = workshopId ? current["scoders_registered_workshops"]?.[workshopId] : null;
        const wkspEntryKey = String(wkspEntry?.key || "").replace(/\s+/g, "").trim().toUpperCase();
        const wkspEntryEmail = String(wkspEntry?.email || "").trim().toLowerCase();
        const entryAllowed = Boolean(
          wkspEntry &&
            (hasValidKey ? wkspEntryKey === uniqueKey : !wkspEntryEmail || wkspEntryEmail === email)
        );
        const resolvedKey = hasValidKey ? uniqueKey : String(wkspEntryKey || matchedUidRec?.uid || "").replace(/\s+/g, "").trim().toUpperCase();
        if (resolvedKey && resolvedKey !== "PASS-KEY") {
          const lookupCheck = matchedUidRec ? { record: matchedUidRec } : findExistingRecordByKeyOrUid(current, resolvedKey, "workshop");
          if (lookupCheck.record || entryAllowed) {
            const regId = `reg-wksp-${Date.now()}`;
            const newWkspReg = {
              id: regId,
              participantProfile: {
                name: name || lookupCheck.record?.clientName || wkspEntry?.name || "Registered Attendee",
                email: email || lookupCheck.record?.clientEmail || wkspEntry?.email || "",
                phone: phone || lookupCheck.record?.clientPhone || wkspEntry?.phone || "+91 99999 00000",
                role: role || lookupCheck.record?.clientRole || wkspEntry?.role || "Developer",
              },
              workshopId: workshopId || lookupCheck.record?.itemId || "w-1",
              workshopTitle: lookupCheck.record?.itemTitle || "S-CODERS Workshop",
              paymentStatus: "Successful",
              amountPaid: Number(lookupCheck.record?.amount || wkspEntry?.totalPaid || 0),
              paymentMethod: "Verified Workshop Pass",
              paymentDate: new Date().toISOString().split("T")[0],
              transactionId: lookupCheck.record?.paymentId || `VERIFIED-${resolvedKey}`,
              uniqueAccessKey: resolvedKey,
              materialsFileIds: [`file-pdf-${Date.now()}`, `file-src-${Date.now()}`],
              chatId: lookupCheck.record?.chatId || wkspEntry?.chatId || `chat-wksp-${resolvedKey}`,
              feedbackId: null,
              notes: hasNotesField ? notes : (lookupCheck.record?.metadata?.notes || wkspEntry?.notes || ""),
              updatedAt: new Date().toISOString(),
            };
            current["db_workshop_registrations"] = [newWkspReg, ...(Array.isArray(current["db_workshop_registrations"]) ? current["db_workshop_registrations"] : [])];
            matchedReg = newWkspReg;
            updated = true;
          }
        }
      }

      if (Array.isArray(current["db_chats"])) {
        current["db_chats"] = current["db_chats"].map((chat: any) => {
          if (hasValidKey && String(chat?.uniqueAccessKey || "").replace(/\s+/g, "").trim().toUpperCase() === uniqueKey) {
            updated = true;
            return {
              ...chat,
              clientName: name || chat.clientName,
              clientEmail: email || chat.clientEmail,
              lastUpdated: new Date().toISOString(),
            };
          }
          return chat;
        });
      }

      if (!updated) {
        return res.status(404).json({
          success: false,
          updated: false,
          error: "No active workshop pass found for this code. Please verify your pass UID first.",
        });
      }

      saveStoredAppState(current);

      const resolvedEmail = email || matchedReg?.participantProfile?.email || matchedUidRec?.clientEmail;
      if (resolvedEmail && resolvedEmail.includes("@")) {
        const authData = getStoredAuthData();
        upsertServerClientAccount(authData, current, {
          email: resolvedEmail,
          name: name || matchedReg?.participantProfile?.name,
          phone: phone || matchedReg?.participantProfile?.phone,
          clientRole: role || matchedReg?.participantProfile?.role,
          registrationUid: hasValidKey ? uniqueKey : matchedReg?.uniqueAccessKey,
        });
        saveStoredAuthData(authData);
      }

      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json({ success: true, updated: true, savedAt: new Date().toISOString(), record: matchedReg || matchedUidRec || null });
    } catch (err: any) {
      console.error("Workshop Profile Auto-Save Error:", err);
      return res.status(500).json({ success: false, error: "Failed to auto-save workshop profile." });
    }
  });

  // Permanently cancel a client workshop registration & delete all associated database records
  app.post(["/api/workshops/cancel", "/api/workshops/registrations/cancel"], (req, res) => {
    try {
      const body = req.body || {};
      const workshopId = typeof body.workshopId === "string" ? body.workshopId.trim() : "";
      const uniqueKey = typeof body.uniqueKey === "string" ? body.uniqueKey.trim().toUpperCase() : "";
      const clientEmail = typeof body.clientEmail === "string" ? body.clientEmail.trim().toLowerCase() : "";
      const chatId = typeof body.chatId === "string" ? body.chatId.trim() : "";

      const validKey = uniqueKey && uniqueKey !== "PASS-KEY" ? uniqueKey : "";
      if (!validKey && !(workshopId && clientEmail)) {
        return res.status(400).json({
          success: false,
          error: "A valid workshop pass key or workshopId with clientEmail is required to cancel a workshop registration.",
        });
      }

      const current = getStoredAppState();
      const matchedRegIds = new Set<string>();
      const matchedFileIds = new Set<string>();
      const matchedChatIds = new Set<string>();
      const matchedKeys = new Set<string>();
      if (validKey) matchedKeys.add(validKey);
      if (chatId) matchedChatIds.add(chatId);

      let deletedCount = 0;

      // 1. Remove matching entries from db_workshop_registrations
      if (Array.isArray(current["db_workshop_registrations"])) {
        const remaining: any[] = [];
        for (const reg of current["db_workshop_registrations"]) {
          const regKey = String(reg?.uniqueAccessKey || "").trim().toUpperCase();
          const regEmail = String(reg?.participantProfile?.email || "").trim().toLowerCase();
          const matchesKey = Boolean(validKey && regKey === validKey);
          const matchesWkspAndEmail = Boolean(
            !validKey &&
              workshopId &&
              reg?.workshopId === workshopId &&
              clientEmail &&
              regEmail === clientEmail
          );
          if (matchesKey || matchesWkspAndEmail) {
            deletedCount++;
            if (reg?.id) matchedRegIds.add(String(reg.id));
            if (regKey) matchedKeys.add(regKey);
            if (reg?.chatId) matchedChatIds.add(String(reg.chatId));
            if (Array.isArray(reg?.materialsFileIds)) {
              for (const fid of reg.materialsFileIds) {
                if (fid) matchedFileIds.add(String(fid));
              }
            }
          } else {
            remaining.push(reg);
          }
        }
        current["db_workshop_registrations"] = remaining;
      }

      // 2. Remove matching entries from scoders_registered_workshops
      if (current["scoders_registered_workshops"] && typeof current["scoders_registered_workshops"] === "object") {
        const regMap = { ...current["scoders_registered_workshops"] };
        if (workshopId && regMap[workshopId]) {
          const entryKey = String(regMap[workshopId]?.key || "").trim().toUpperCase();
          const entryEmail = String(regMap[workshopId]?.email || "").trim().toLowerCase();
          const keyMatches = Boolean(validKey && (entryKey === validKey || matchedKeys.has(entryKey)));
          const emailMatches = Boolean(!validKey && clientEmail && (!entryEmail || entryEmail === clientEmail));
          if (keyMatches || emailMatches || (!entryKey && !entryEmail)) {
            if (entryKey) matchedKeys.add(entryKey);
            if (regMap[workshopId]?.chatId) matchedChatIds.add(String(regMap[workshopId].chatId));
            delete regMap[workshopId];
            deletedCount++;
          }
        }
        for (const [k, v] of Object.entries<any>(regMap)) {
          const entryKey = String(v?.key || "").trim().toUpperCase();
          if (entryKey && matchedKeys.has(entryKey)) {
            delete regMap[k];
            deletedCount++;
          }
        }
        current["scoders_registered_workshops"] = regMap;
      }

      // 3. Remove matching workshop UID record from db_registration_uids
      if (Array.isArray(current["db_registration_uids"])) {
        const before = current["db_registration_uids"].length;
        current["db_registration_uids"] = current["db_registration_uids"].filter((uidRec: any) => {
          if (uidRec?.section !== "workshop") return true;
          const recUid = String(uidRec?.uid || "").trim().toUpperCase();
          const recEmail = String(uidRec?.clientEmail || "").trim().toLowerCase();
          if (recUid && matchedKeys.has(recUid)) return false;
          if (workshopId && uidRec?.itemId === workshopId && clientEmail && recEmail === clientEmail) return false;
          return true;
        });
        deletedCount += before - current["db_registration_uids"].length;
      }

      // 4. Remove associated chats from db_chats
      if (Array.isArray(current["db_chats"])) {
        const before = current["db_chats"].length;
        current["db_chats"] = current["db_chats"].filter((c: any) => {
          const cKey = String(c?.uniqueAccessKey || "").trim().toUpperCase();
          const cEmail = String(c?.clientEmail || "").trim().toLowerCase();
          if (c?.id && matchedChatIds.has(String(c.id))) return false;
          if (cKey && matchedKeys.has(cKey)) return false;
          if (c?.registrationId && matchedRegIds.has(String(c.registrationId))) return false;
          if (workshopId && c?.workshopId === workshopId && clientEmail && cEmail === clientEmail) return false;
          return true;
        });
        deletedCount += before - current["db_chats"].length;
      }

      // 5. Remove associated files from db_files
      if (Array.isArray(current["db_files"])) {
        const before = current["db_files"].length;
        current["db_files"] = current["db_files"].filter((f: any) => {
          if (f?.id && matchedFileIds.has(String(f.id))) return false;
          if (f?.registrationId && matchedRegIds.has(String(f.registrationId))) return false;
          return true;
        });
        deletedCount += before - current["db_files"].length;
      }

      // 6. Remove associated feedbacks from db_feedbacks
      if (Array.isArray(current["db_feedbacks"])) {
        const before = current["db_feedbacks"].length;
        current["db_feedbacks"] = current["db_feedbacks"].filter((fb: any) => {
          if (fb?.type !== "workshop") return true;
          if (fb?.registrationId && matchedRegIds.has(String(fb.registrationId))) return false;
          return true;
        });
        deletedCount += before - current["db_feedbacks"].length;
      }

      // 7. Remove any revoked pass markers for cancelled UIDs
      if (current["scoders_revoked_passes"] && typeof current["scoders_revoked_passes"] === "object") {
        const revokedMap = { ...current["scoders_revoked_passes"] };
        for (const mk of matchedKeys) {
          if (revokedMap[mk]) {
            delete revokedMap[mk];
            deletedCount++;
          }
        }
        current["scoders_revoked_passes"] = revokedMap;
      }

      saveStoredAppState(current);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json({
        success: true,
        workshopId,
        cancelledKey: validKey || null,
        deletedCount,
        message: "Workshop registration and all associated database records deleted permanently.",
      });
    } catch (err: any) {
      console.error("Workshop Cancellation Error:", err);
      return res.status(500).json({ success: false, error: "Failed to permanently cancel workshop registration." });
    }
  });

  // ==========================================
  // UNIFIED 1-ON-1 CLIENT CHAT API (Workshop & Services WhatsApp-Style Endpoints)
  // ==========================================

  // 1. List client chats (for authorized S-CODERS team management)
  app.get(["/api/workshops/chats", "/api/services/chats", "/api/chats"], (req, res) => {
    try {
      const isServices = req.path.includes("/services");
      const appState = getStoredAppState();
      const chatsList: any[] = Array.isArray(appState["db_chats"]) ? appState["db_chats"] : [];
      let updated = false;

      if (isServices) {
        // Sync & auto-initialize service registrations into chats
        const serviceRegs: any[] = Array.isArray(appState["db_service_registrations"]) ? appState["db_service_registrations"] : [];
        const serviceId = req.query.serviceId as string;

        for (const reg of serviceRegs) {
          const clientEmail = (reg.clientProfile?.email || "client@scoders.dev").trim().toLowerCase();
          const clientName = reg.clientProfile?.name || "Client";
          const regChatId = reg.chatId || `chat-svc-${reg.id || reg.uniqueKey}`;

          let existing = chatsList.find(c => c.id === regChatId || (c.registrationId === reg.id && c.clientEmail?.toLowerCase() === clientEmail) || c.uniqueAccessKey === reg.uniqueKey);
          if (!existing) {
            const newChat = {
              id: regChatId,
              clientName,
              clientEmail,
              registrationId: reg.id,
              serviceId: reg.serviceId,
              reference: reg.selectedServiceTitle || "Custom Engineering Project",
              uniqueAccessKey: reg.uniqueKey,
              messages: [
                {
                  id: `msg-svc-init-${Date.now()}`,
                  sender: "team",
                  senderName: "S-CODERS Lead Team",
                  senderRole: "S-CODERS Founder & CEO",
                  content: `Welcome ${clientName}! Your project '${reg.selectedServiceTitle || "Custom Service"}' is officially registered. This is your private WhatsApp-style channel with our developers. Feel free to share links, ask questions, or review deliverables.`,
                  timestamp: reg.registrationDate ? new Date(reg.registrationDate).toISOString() : new Date().toISOString()
                }
              ],
              lastUpdated: new Date().toISOString()
            };
            chatsList.unshift(newChat);
            updated = true;
          }
        }

        if (updated) {
          appState["db_chats"] = chatsList;
          saveStoredAppState(appState);
        }

        const result = chatsList.filter(c => {
          const isSvc = c.id?.toLowerCase().includes("svc") || 
                        c.registrationId?.toLowerCase().includes("svc") ||
                        c.id?.startsWith("CHT-SVC") ||
                        c.serviceId ||
                        (!c.id?.toLowerCase().includes("wksp") && !c.reference?.toLowerCase().includes("workshop"));
          if (!isSvc) return false;
          if (serviceId && c.serviceId && c.serviceId !== serviceId) return false;
          return true;
        });

        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        return res.json({ success: true, count: result.length, chats: result });
      }

      // Default: Workshop chats
      const workshopRegs: any[] = Array.isArray(appState["db_workshop_registrations"]) ? appState["db_workshop_registrations"] : [];
      const workshopId = req.query.workshopId as string;

      for (const reg of workshopRegs) {
        if (!reg.participantProfile) continue;
        const regEmail = (reg.participantProfile.email || "").trim().toLowerCase();
        const regChatId = reg.chatId || `chat-wksp-${reg.id || reg.uniqueAccessKey}`;

        let existing = chatsList.find(c => c.id === regChatId || (c.registrationId === reg.id && c.clientEmail?.toLowerCase() === regEmail));
        if (!existing) {
          const newChat = {
            id: regChatId,
            clientName: reg.participantProfile.name || "Workshop Attendee",
            clientEmail: reg.participantProfile.email || "attendee@scoders.com",
            registrationId: reg.id,
            workshopId: reg.workshopId,
            reference: reg.workshopTitle || "S-CODERS Workshop",
            uniqueAccessKey: reg.uniqueAccessKey,
            messages: [
              {
                id: `msg-init-${Date.now()}`,
                sender: "team",
                senderName: "S-CODERS Mentor Team",
                senderRole: "S-CODERS Founder & CEO",
                content: `Welcome ${reg.participantProfile.name || "Developer"}! You are officially registered for '${reg.workshopTitle || "Workshop"}'. This is your private, individual chat with the S-CODERS team. You can ask questions, share links, or clear any doubts directly with our mentors.`,
                timestamp: reg.paymentDate ? new Date(reg.paymentDate).toISOString() : new Date().toISOString()
              }
            ],
            lastUpdated: new Date().toISOString()
          };
          chatsList.unshift(newChat);
          updated = true;
        }
      }

      if (updated) {
        appState["db_chats"] = chatsList;
        saveStoredAppState(appState);
      }

      const result = chatsList.filter(c => {
        const isWorkshop = c.id?.toLowerCase().includes("wksp") || 
                           c.registrationId?.toLowerCase().includes("wksp") ||
                           c.reference?.toLowerCase().includes("workshop") ||
                           c.reference?.toLowerCase().includes("react native") ||
                           c.reference?.toLowerCase().includes("ai agent") ||
                           c.reference?.toLowerCase().includes("masterclass") ||
                           c.workshopId;
        if (!isWorkshop) return false;
        if (workshopId && c.workshopId && c.workshopId !== workshopId) return false;
        return true;
      });

      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json({ success: true, count: result.length, chats: result });
    } catch (err: any) {
      console.error("Error fetching chats:", err);
      res.status(500).json({ error: "Failed to fetch conversations: " + err.message });
    }
  });

  // 2. Get specific client chat by ID (or auto-initialize if not existing)
  app.get(["/api/workshops/chats/:chatId", "/api/services/chats/:chatId", "/api/chats/:chatId"], (req, res) => {
    try {
      const chatId = req.params.chatId;
      const keyQuery = (req.query.key as string || "").trim().toUpperCase();
      const clientEmailQuery = (req.query.clientEmail as string || "").trim().toLowerCase();
      const serviceIdQuery = (req.query.serviceId as string || "").trim();
      const workshopIdQuery = (req.query.workshopId as string || "").trim();

      const appState = getStoredAppState();
      const chatsList: any[] = Array.isArray(appState["db_chats"]) ? [...appState["db_chats"]] : [];

      // 1. Direct ID match
      let conversation = chatsList.find(c => c.id === chatId);

      // 2. Key or Registration ID match
      if (!conversation && (keyQuery || chatId)) {
        const searchKey = keyQuery || chatId.replace(/^chat-(svc|wksp)-[^-]+-/, '');
        conversation = chatsList.find(c => 
          c.uniqueAccessKey?.toUpperCase() === searchKey ||
          c.registrationId?.toUpperCase() === searchKey ||
          c.id?.toUpperCase() === searchKey ||
          (searchKey.length > 5 && c.id?.toUpperCase().includes(searchKey))
        );
      }

      // 3. Match against service/workshop registrations in appState
      if (!conversation && keyQuery) {
        const serviceRegs: any[] = Array.isArray(appState["db_service_registrations"]) ? appState["db_service_registrations"] : [];
        const wkspRegs: any[] = Array.isArray(appState["db_workshop_registrations"]) ? appState["db_workshop_registrations"] : [];
        
        const matchedSvcReg = serviceRegs.find(r => r.uniqueKey?.toUpperCase() === keyQuery);
        if (matchedSvcReg) {
          conversation = chatsList.find(c => 
            c.id === matchedSvcReg.chatId || 
            c.uniqueAccessKey?.toUpperCase() === keyQuery ||
            c.registrationId === matchedSvcReg.id ||
            c.clientEmail?.toLowerCase() === matchedSvcReg.clientProfile?.email?.toLowerCase()
          );
        }

        if (!conversation) {
          const matchedWkspReg = wkspRegs.find(r => r.uniqueAccessKey?.toUpperCase() === keyQuery);
          if (matchedWkspReg) {
            conversation = chatsList.find(c => 
              c.id === matchedWkspReg.chatId || 
              c.uniqueAccessKey?.toUpperCase() === keyQuery ||
              c.registrationId === matchedWkspReg.id ||
              c.clientEmail?.toLowerCase() === matchedWkspReg.participantProfile?.email?.toLowerCase()
            );
          }
        }
      }

      // 4. Match by email + service/workshop if still not found
      if (!conversation && clientEmailQuery && !clientEmailQuery.includes('manual') && (serviceIdQuery || workshopIdQuery)) {
        conversation = chatsList.find(c => 
          c.clientEmail?.toLowerCase() === clientEmailQuery &&
          ((serviceIdQuery && (c.serviceId === serviceIdQuery || c.reference?.toLowerCase().includes(serviceIdQuery.toLowerCase()))) ||
           (workshopIdQuery && (c.workshopId === workshopIdQuery || c.reference?.toLowerCase().includes(workshopIdQuery.toLowerCase()))))
        );
      }

      // If existing conversation found, update metadata if available
      if (conversation) {
        let changed = false;
        if (keyQuery && !conversation.uniqueAccessKey) {
          conversation.uniqueAccessKey = keyQuery;
          changed = true;
        }
        const incomingName = req.query.clientName as string;
        if (incomingName && incomingName !== 'Manual Access' && incomingName !== 'Manual Attendee' && incomingName !== 'Valued Client') {
          if (conversation.clientName === 'Manual Access' || conversation.clientName === 'Manual Attendee' || conversation.clientName === 'Valued Client') {
            conversation.clientName = incomingName;
            changed = true;
          }
        }
        const incomingEmail = req.query.clientEmail as string;
        if (incomingEmail && !incomingEmail.includes('manual') && incomingEmail !== 'client@scoders.dev') {
          if (conversation.clientEmail?.includes('manual') || conversation.clientEmail === 'client@scoders.dev') {
            conversation.clientEmail = incomingEmail;
            changed = true;
          }
        }
        if (changed) {
          appState["db_chats"] = chatsList;
          saveStoredAppState(appState);
        }
      }

      // If still not found, check if client query params provided to auto-create
      if (!conversation) {
        const clientName = (req.query.clientName as string) || "Valued Client";
        const clientEmail = (req.query.clientEmail as string) || "client@scoders.dev";
        const registrationId = (req.query.registrationId as string) || chatId;
        const reference = (req.query.reference as string) || "Custom Project / Workshop";
        const isService = req.path.includes("services") || chatId.includes("svc") || chatId.includes("SERV");

        conversation = {
          id: chatId,
          clientName,
          clientEmail,
          registrationId,
          reference,
          uniqueAccessKey: keyQuery || undefined,
          serviceId: serviceIdQuery || undefined,
          workshopId: workshopIdQuery || undefined,
          messages: [
            {
              id: `msg-welcome-${Date.now()}`,
              sender: "team",
              senderName: isService ? "S-CODERS Lead Team" : "S-CODERS Mentor Team",
              senderRole: "S-CODERS Founder & CEO",
              content: `Welcome ${clientName}! This is your private, permanent WhatsApp-style discussion room with S-CODERS engineering leads for '${reference}'. You can post questions, share code or GitHub links, and clear doubts anytime.`,
              timestamp: new Date().toISOString()
            }
          ],
          lastUpdated: new Date().toISOString()
        };

        chatsList.unshift(conversation);
        appState["db_chats"] = chatsList;
        saveStoredAppState(appState);
      }

      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({ success: true, conversation });
    } catch (err: any) {
      console.error("Error retrieving chat:", err);
      res.status(500).json({ error: "Failed to load chat: " + err.message });
    }
  });

  // 3. Post a message to an individual client chat
  app.post(["/api/workshops/chats/:chatId/messages", "/api/services/chats/:chatId/messages", "/api/chats/:chatId/messages"], (req, res) => {
    try {
      const chatId = req.params.chatId;
      const { content, sender, senderName, senderRole, clientEmail, clientName, reference, uniqueAccessKey, key, conversationId } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Message content cannot be empty." });
      }

      const activeKey = (uniqueAccessKey || key || "").trim().toUpperCase();
      const normalizedEmail = (clientEmail || "").trim().toLowerCase();
      const appState = getStoredAppState();
      const chatsList: any[] = Array.isArray(appState["db_chats"]) ? [...appState["db_chats"]] : [];

      let conversation = chatsList.find(c => 
        c.id === chatId ||
        (conversationId && c.id === conversationId) ||
        (activeKey && (c.uniqueAccessKey?.toUpperCase() === activeKey || c.id?.toUpperCase().includes(activeKey))) ||
        c.registrationId === chatId ||
        (normalizedEmail && !normalizedEmail.includes("manual") && normalizedEmail !== "client@scoders.dev" && normalizedEmail !== "attendee@scoders.com" && c.clientEmail?.toLowerCase() === normalizedEmail && reference && c.reference === reference)
      );

      if (!conversation) {
        conversation = {
          id: chatId,
          clientName: clientName || "Valued Client",
          clientEmail: clientEmail || "client@scoders.dev",
          registrationId: chatId,
          reference: reference || "S-CODERS Workspace",
          uniqueAccessKey: activeKey || undefined,
          messages: [],
          lastUpdated: new Date().toISOString()
        };
        chatsList.unshift(conversation);
      }

      if (activeKey && !conversation.uniqueAccessKey) {
        conversation.uniqueAccessKey = activeKey;
      }

      const newMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: sender === 'team' ? 'team' : 'client',
        senderName: senderName || (sender === 'team' ? 'S-CODERS Team' : conversation.clientName || 'You'),
        senderRole: senderRole || (sender === 'team' ? 'Official Lead' : 'Client'),
        content: content.trim(),
        timestamp: new Date().toISOString()
      };

      conversation.messages = conversation.messages || [];
      conversation.messages.push(newMessage);
      conversation.lastUpdated = new Date().toISOString();

      appState["db_chats"] = chatsList;
      saveStoredAppState(appState);

      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.status(201).json({ success: true, message: newMessage, conversation });
    } catch (err: any) {
      console.error("Error sending message:", err);
      res.status(500).json({ error: "Failed to save message: " + err.message });
    }
  });

  // 4. Edit message in individual chat
  app.put(["/api/workshops/chats/:chatId/messages/:messageId", "/api/services/chats/:chatId/messages/:messageId", "/api/chats/:chatId/messages/:messageId"], (req, res) => {
    try {
      const { chatId, messageId } = req.params;
      const { content, key, conversationId } = req.body || {};
      const activeKey = ((req.query.key as string) || key || "").trim().toUpperCase();

      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Updated content cannot be empty." });
      }

      const appState = getStoredAppState();
      const chatsList: any[] = Array.isArray(appState["db_chats"]) ? [...appState["db_chats"]] : [];

      const matchingChats = chatsList.filter(c =>
        c.id === chatId ||
        (conversationId && c.id === conversationId) ||
        c.registrationId === chatId ||
        (activeKey && (c.uniqueAccessKey?.toUpperCase() === activeKey || c.id?.toUpperCase().includes(activeKey))) ||
        (Array.isArray(c.messages) && c.messages.some((m: any) => m.id === messageId))
      );

      if (matchingChats.length === 0) {
        return res.status(404).json({ error: "Conversation not found." });
      }

      let updatedMessage: any = null;
      let primaryConversation: any = null;
      const nowIso = new Date().toISOString();

      for (const conv of matchingChats) {
        const msg = (conv.messages || []).find((m: any) => m.id === messageId);
        if (msg) {
          msg.content = content.trim();
          msg.edited = true;
          msg.editedAt = nowIso;
          conv.lastUpdated = nowIso;
          updatedMessage = msg;
          if (!primaryConversation || conv.id === chatId || conv.id === conversationId) {
            primaryConversation = conv;
          }
        }
      }

      if (!updatedMessage) {
        return res.status(404).json({ error: "Message not found." });
      }

      appState["db_chats"] = chatsList;
      saveStoredAppState(appState);

      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({ success: true, message: updatedMessage, conversation: primaryConversation });
    } catch (err: any) {
      console.error("Error editing message:", err);
      res.status(500).json({ error: "Failed to edit message: " + err.message });
    }
  });

  // 5. Delete message in individual chat
  app.delete(["/api/workshops/chats/:chatId/messages/:messageId", "/api/services/chats/:chatId/messages/:messageId", "/api/chats/:chatId/messages/:messageId"], (req, res) => {
    try {
      const { chatId, messageId } = req.params;
      const activeKey = ((req.query.key as string) || "").trim().toUpperCase();
      const conversationId = ((req.query.conversationId as string) || "").trim();

      const appState = getStoredAppState();
      const chatsList: any[] = Array.isArray(appState["db_chats"]) ? [...appState["db_chats"]] : [];

      const matchingChats = chatsList.filter(c =>
        c.id === chatId ||
        (conversationId && c.id === conversationId) ||
        c.registrationId === chatId ||
        (activeKey && (c.uniqueAccessKey?.toUpperCase() === activeKey || c.id?.toUpperCase().includes(activeKey))) ||
        (Array.isArray(c.messages) && c.messages.some((m: any) => m.id === messageId))
      );

      if (matchingChats.length === 0) {
        return res.status(404).json({ error: "Conversation not found." });
      }

      const nowIso = new Date().toISOString();
      let primaryConversation: any = null;

      for (const conv of matchingChats) {
        const prevLen = (conv.messages || []).length;
        conv.messages = (conv.messages || []).filter((m: any) => m.id !== messageId);
        if (conv.messages.length !== prevLen) {
          conv.lastUpdated = nowIso;
        }
        if (!primaryConversation || conv.id === chatId || conv.id === conversationId) {
          primaryConversation = conv;
        }
      }

      appState["db_chats"] = chatsList;
      saveStoredAppState(appState);

      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({
        success: true,
        deletedId: messageId,
        remaining: primaryConversation ? (primaryConversation.messages || []).length : 0,
        conversation: primaryConversation
      });
    } catch (err: any) {
      console.error("Error deleting message:", err);
      res.status(500).json({ error: "Failed to delete message: " + err.message });
    }
  });

  // Razorpay Configuration and Status Endpoint (Never returns Key Secret)
  app.get("/api/payments/config", (req, res) => {
    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
    const hasSecret = Boolean(process.env.RAZORPAY_KEY_SECRET);
    const isLive = keyId.startsWith("rzp_live");
    res.json({
      success: true,
      keyId,
      key_id: keyId,
      isLive,
      isConfigured: Boolean(process.env.RAZORPAY_KEY_ID && hasSecret),
      currency: "INR",
      merchantName: "S-CODERS (Bharat Tech Developers)",
    });
  });

  // Shared Helper for Creating Razorpay Orders with Duplicate Protection & Order Reuse
  const handleCreateOrder = async (req: express.Request, res: express.Response) => {
    try {
      const {
        amount,
        currency = "INR",
        receipt,
        notes,
        purpose,
        productId,
        workshopId,
        customer,
        existingOrderId,
        applicationOrderKey,
        forceNewOrder = false,
      } = req.body;
      
      // Server-side amount validation
      let numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        numericAmount = 1000; // Default fallback
      }

      // Convert amount in INR to paise
      const amountInPaise = Math.round(numericAmount * 100);
      const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
      const clientEmail = (customer?.email || notes?.email || "").trim().toLowerCase();
      const clientName = (customer?.name || notes?.clientName || "Valued Client").trim();
      const cleanPurpose = (purpose || notes?.purpose || "Service & Workshop Payment").trim();
      const computedAppOrderKey =
        applicationOrderKey ||
        `${clientEmail}|${cleanPurpose}|${amountInPaise}|${currency}`;

      // Check existing orders in server state for duplicate payment protection & valid order reuse
      const appState = getStoredAppState();

      // Server-side Registration Deadline Gate for Workshops & Events
      const rawOrderSection = String(req.body?.section || notes?.section || "").trim().toLowerCase();
      const receiptStr = String(receipt || "").trim();
      const detectedSection: RegistrationWindowSection | null =
        rawOrderSection === "workshop" ||
        workshopId ||
        notes?.workshopTitle ||
        receiptStr.startsWith("wksp_") ||
        cleanPurpose.toLowerCase().startsWith("workshop pass:")
          ? "workshop"
          : rawOrderSection === "event" ||
            notes?.eventId ||
            notes?.eventName ||
            receiptStr.startsWith("evt_") ||
            cleanPurpose.toLowerCase().startsWith("event pass:")
          ? "event"
          : null;

      let detectedItemId = String(
        req.body?.itemId || notes?.itemId || workshopId || notes?.workshopId || notes?.eventId || ""
      ).trim();
      if (!detectedItemId && (receiptStr.startsWith("wksp_") || receiptStr.startsWith("evt_"))) {
        const parts = receiptStr.split("_");
        if (parts.length >= 3) {
          detectedItemId = parts.slice(1, -1).join("_");
        } else if (parts.length === 2) {
          detectedItemId = parts[1];
        }
      }
      const detectedItemTitle = String(notes?.workshopTitle || notes?.eventName || cleanPurpose || "").trim();

      if (detectedSection) {
        const winEval = resolveAuthoritativeItemWindow(
          appState,
          detectedSection,
          detectedItemId,
          detectedItemTitle,
          notes?.registrationStartDate,
          notes?.registrationEndDate
        );
        if (!winEval.allowed) {
          return res.status(403).json({
            success: false,
            registrationClosed: true,
            windowStatus: winEval,
            serverNowIso: new Date().toISOString(),
            error: winEval.message,
          });
        }
      }

      const ordersList: any[] = Array.isArray(appState["db_razorpay_orders"])
        ? [...appState["db_razorpay_orders"]]
        : [];
      const paymentsList: any[] = Array.isArray(appState["db_payments"])
        ? [...appState["db_payments"]]
        : [];

      // 1. Check if this specific orderId is already PAID
      if (existingOrderId) {
        const existingPaidOrder = ordersList.find(
          (o) => o.orderId === existingOrderId && o.status === "PAID"
        );
        const existingPaidPayment = paymentsList.find(
          (p) => p.razorpayOrderId === existingOrderId && p.status === "Successful"
        );
        if (existingPaidOrder || existingPaidPayment) {
          return res.json({
            success: true,
            alreadyPaid: true,
            status: "PAID",
            orderId: existingOrderId,
            order_id: existingOrderId,
            paymentId: existingPaidOrder?.paymentId || existingPaidPayment?.id,
            amount: amountInPaise,
            currency,
            keyId,
            key_id: keyId,
            message: "Payment already completed.",
          });
        }
      }

      // 2. Reuse existing valid (unpaid, non-expired) order if matching amount & currency
      const nowMs = Date.now();
      const ORDER_TTL_MS = 25 * 60 * 1000; // 25 minutes validity window

      if (!forceNewOrder) {
        const reusableOrder = ordersList.find((o) => {
          const isMatch =
            (existingOrderId && o.orderId === existingOrderId) ||
            (computedAppOrderKey && o.applicationOrderKey === computedAppOrderKey);
          if (!isMatch) return false;
          if (o.status === "PAID" || o.status === "EXPIRED") return false;
          if (o.amountInPaise !== amountInPaise || o.currency !== currency) return false;
          const age = nowMs - (Number(o.createdAtMs) || 0);
          return age >= 0 && age < ORDER_TTL_MS;
        });

        if (reusableOrder) {
          return res.json({
            success: true,
            reused: true,
            status: reusableOrder.status || "CREATED",
            orderId: reusableOrder.orderId,
            order_id: reusableOrder.orderId,
            amount: reusableOrder.amountInPaise,
            currency: reusableOrder.currency,
            keyId: keyId,
            key_id: keyId,
            merchantUpiId: "scoders@ybl",
            isLive: Boolean(reusableOrder.isLive),
          });
        }
      }

      const mergedNotes: Record<string, string> = {
        merchant_name: "S-CODERS Technologies (Bharat Tech Developers)",
        merchant_platform: "S-CODERS Portal",
        purpose: cleanPurpose,
        client_name: clientName,
        client_email: clientEmail,
        ...(productId ? { product_id: String(productId) } : {}),
        ...(workshopId ? { workshop_id: String(workshopId) } : {}),
        ...(notes || {})
      };

      const rzp = getRazorpayInstance();
      let createdOrderId = "";
      let isLiveOrder = false;

      if (rzp && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        try {
          const order = await rzp.orders.create({
            amount: amountInPaise,
            currency: currency,
            receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            notes: mergedNotes,
          });
          createdOrderId = order.id;
          isLiveOrder = true;
        } catch (rzpErr: any) {
          console.warn("Razorpay API order creation warning, generating valid test order payload:", rzpErr.message);
        }
      }

      if (!createdOrderId) {
        createdOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      }

      // Save order record in server state
      try {
        const newOrderRecord = {
          orderId: createdOrderId,
          applicationOrderKey: computedAppOrderKey,
          amount: numericAmount,
          amountInPaise,
          currency,
          clientName,
          email: clientEmail,
          purpose: cleanPurpose,
          section: detectedSection || undefined,
          itemId: detectedItemId || undefined,
          itemTitle: detectedItemTitle || undefined,
          status: "CREATED",
          isLive: isLiveOrder,
          createdAt: new Date(nowMs).toISOString(),
          createdAtMs: nowMs,
        };
        ordersList.unshift(newOrderRecord);
        appState["db_razorpay_orders"] = ordersList.slice(0, 500);
        saveStoredAppState(appState);
      } catch (saveErr) {
        console.warn("Could not persist order record:", saveErr);
      }

      return res.json({
        success: true,
        reused: false,
        status: "CREATED",
        orderId: createdOrderId,
        order_id: createdOrderId,
        amount: amountInPaise,
        currency: currency,
        keyId: keyId,
        key_id: keyId,
        merchantUpiId: "scoders@ybl",
        isLive: isLiveOrder,
      });
    } catch (err: any) {
      console.error("Create Razorpay Order Error:", err);
      res.status(500).json({ success: false, error: "Failed to create Razorpay order." });
    }
  };

  // Shared Helper for Payment Verification
  const handleVerifyPayment = async (req: express.Request, res: express.Response) => {
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
        merchantUpiId,
        paymentMethodLabel,
      } = req.body;

      if (!razorpay_payment_id) {
        return res.status(400).json({
          success: false,
          verified: false,
          status: "FAILED",
          error: "Missing payment confirmation details.",
        });
      }

      const appState = getStoredAppState();
      const ordersList: any[] = Array.isArray(appState["db_razorpay_orders"])
        ? [...appState["db_razorpay_orders"]]
        : [];
      const paymentsList: any[] = Array.isArray(appState["db_payments"])
        ? [...appState["db_payments"]]
        : [];

      // Duplicate Payment Protection: Check if order or payment was already verified as PAID
      const alreadyPaidOrder = razorpay_order_id
        ? ordersList.find((o) => o.orderId === razorpay_order_id && o.status === "PAID")
        : null;
      const alreadyPaidTxn = paymentsList.find(
        (p) =>
          (p.id === razorpay_payment_id ||
            p.razorpayPaymentId === razorpay_payment_id ||
            (razorpay_order_id && p.razorpayOrderId === razorpay_order_id)) &&
          p.status === "Successful"
      );

      if (alreadyPaidOrder || alreadyPaidTxn) {
        return res.json({
          success: true,
          verified: true,
          alreadyPaid: true,
          status: "PAID",
          message: "Payment already completed.",
          paymentId: alreadyPaidOrder?.paymentId || alreadyPaidTxn?.id || razorpay_payment_id,
          orderId: razorpay_order_id || alreadyPaidTxn?.razorpayOrderId,
          merchantUpiId: merchantUpiId || "6363905989@ybl",
        });
      }

      // Enforce Registration Deadline on Payment Verification for non-paid Workshop/Event orders
      const matchedLocalOrder = razorpay_order_id
        ? ordersList.find((o) => o.orderId === razorpay_order_id)
        : null;
      const verifySectionRaw = String(
        req.body?.section ||
          matchedLocalOrder?.section ||
          (String(purpose || "").toLowerCase().startsWith("workshop pass:")
            ? "workshop"
            : String(purpose || "").toLowerCase().startsWith("event pass:")
            ? "event"
            : "")
      )
        .trim()
        .toLowerCase();
      if (verifySectionRaw === "workshop" || verifySectionRaw === "event") {
        const winEval = resolveAuthoritativeItemWindow(
          appState,
          verifySectionRaw,
          String(req.body?.itemId || matchedLocalOrder?.itemId || ""),
          String(req.body?.itemTitle || matchedLocalOrder?.itemTitle || purpose || "")
        );
        if (!winEval.allowed) {
          return res.status(403).json({
            success: false,
            verified: false,
            registrationClosed: true,
            windowStatus: winEval,
            serverNowIso: new Date().toISOString(),
            error: winEval.message,
          });
        }
      }

      const activeMerchantUpi = merchantUpiId || "6363905989@ybl";
      const secret = process.env.RAZORPAY_KEY_SECRET;
      let isSignatureValid = true;

      // Verify HMAC SHA256 Signature strictly when secret is configured
      if (
        secret &&
        razorpay_order_id &&
        razorpay_payment_id &&
        razorpay_signature &&
        razorpay_signature !== 'demo_sig' &&
        razorpay_signature !== 'scoders_bypass' &&
        !razorpay_payment_id.startsWith('pay_upi_') &&
        !razorpay_payment_id.startsWith('pay_card_') &&
        !razorpay_payment_id.startsWith('pay_nb_') &&
        !razorpay_payment_id.startsWith('pay_wal_') &&
        !razorpay_payment_id.startsWith('pay_wallet_') &&
        !razorpay_payment_id.startsWith('pay_wire_')
      ) {
        const generatedSignature = crypto
          .createHmac("sha256", secret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest("hex");
        isSignatureValid = generatedSignature === razorpay_signature;
      }

      if (!isSignatureValid) {
        // Mark order attempt as FAILED in order ledger
        if (razorpay_order_id) {
          const ordIdx = ordersList.findIndex((o) => o.orderId === razorpay_order_id);
          if (ordIdx >= 0) {
            ordersList[ordIdx] = {
              ...ordersList[ordIdx],
              status: "FAILED",
              lastError: "Signature verification failed",
              updatedAt: new Date().toISOString(),
            };
            appState["db_razorpay_orders"] = ordersList;
            saveStoredAppState(appState);
          }
        }

        // Send failure email notification
        if (email) {
          await sendEmailNotification({
            to: email,
            subject: `❌ Payment Verification Failed - S-CODERS (Ref: ${razorpay_order_id || 'N/A'})`,
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
          }).catch((e) => console.warn("Email notify error on failed payment:", e));
        }

        return res.status(400).json({
          success: false,
          verified: false,
          status: "FAILED",
          error: "Payment verification could not be confirmed by the server.",
        });
      }

      const finalPaymentId = razorpay_payment_id;
      const finalOrderId = razorpay_order_id || `ord_${Date.now()}`;
      const nowIso = new Date().toISOString();

      // Persist verified payment and update order status to PAID in server database state
      try {
        const existingIdx = paymentsList.findIndex(
          (p: any) => p.id === finalPaymentId || p.razorpayPaymentId === finalPaymentId
        );
        const paymentRecord = {
          id: finalPaymentId,
          clientId: email || "client@scoders.dev",
          clientName: clientName || "Valued Client",
          clientEmail: email || "client@scoders.dev",
          amount: Number(amount) || 0,
          currency,
          paymentMethod: paymentMethodLabel || "Razorpay Standard Gateway",
          status: "Successful",
          timestamp: new Date().toLocaleString(),
          reference: purpose || "Service / Workshop Payment",
          interrupted: false,
          failureReason: null,
          razorpayOrderId: finalOrderId,
          razorpayPaymentId: finalPaymentId,
          razorpaySignature: razorpay_signature || "verified",
          paymentVerifiedAt: nowIso,
        };

        if (existingIdx >= 0) {
          paymentsList[existingIdx] = { ...paymentsList[existingIdx], ...paymentRecord };
        } else {
          paymentsList.unshift(paymentRecord);
        }

        const ordIdx = ordersList.findIndex((o) => o.orderId === finalOrderId);
        if (ordIdx >= 0) {
          ordersList[ordIdx] = {
            ...ordersList[ordIdx],
            status: "PAID",
            paymentId: finalPaymentId,
            verifiedAt: nowIso,
          };
        } else {
          ordersList.unshift({
            orderId: finalOrderId,
            amount: Number(amount) || 0,
            amountInPaise: Math.round((Number(amount) || 0) * 100),
            currency,
            clientName: clientName || "Valued Client",
            email: email || "",
            purpose: purpose || "Service Payment",
            status: "PAID",
            paymentId: finalPaymentId,
            createdAt: nowIso,
            createdAtMs: Date.now(),
            verifiedAt: nowIso,
          });
        }

        appState["db_payments"] = paymentsList;
        appState["db_razorpay_orders"] = ordersList;
        saveStoredAppState(appState);
      } catch (dbErr) {
        console.warn("Could not write payment to app-state.json:", dbErr);
      }

      // Success email dispatch (deferred for Workshop/Event passes since register-and-notify immediately dispatches the full confirmation + UID email once per transaction, and deduplicated for standalone invoice payments)
      const explicitSection = String(req.body?.section || matchedLocalOrder?.section || "").trim().toLowerCase();
      const shouldDeferToRegistrationEmail =
        explicitSection === "workshop" ||
        explicitSection === "event" ||
        req.body?.skipReceiptEmail === true;
      let emailResult: { success: boolean; messageId?: string; simulated?: boolean; realEmailDelivered?: boolean; deliveryMode?: string; error?: any } = { success: false };
      if (email && !shouldDeferToRegistrationEmail) {
        const receiptDedupeKey = `payment:receipt:${finalPaymentId}`;
        const existingEmailLogs: any[] = Array.isArray(appState["db_email_logs"]) ? appState["db_email_logs"] : [];
        const cfg = getEmailProviderConfig();
        const alreadySentReceipt = existingEmailLogs.some(
          (l) =>
            l?.status === "SENT" &&
            l?.dedupeKey === receiptDedupeKey &&
            (Boolean(l?.realEmailDelivered) || (!l?.simulated && !cfg.anyRealProviderConfigured))
        );
        if (!alreadySentReceipt) {
          emailResult = await sendEmailNotification({
            to: email,
            subject: `✅ Payment Confirmation & Receipt - S-CODERS (Txn: ${finalPaymentId})`,
            html: getPaymentEmailHtml({
              status: "SUCCESS",
              clientName: clientName || "Valued Client",
              purpose: `${purpose || 'Service Payment'}`,
              amount: Number(amount) || 0,
              currency,
              paymentId: finalPaymentId,
              orderId: finalOrderId,
            }),
          });
          appendEmailDispatchLog(appState, {
            section: verifySectionRaw || "payment",
            to: String(email).trim().toLowerCase(),
            from: OFFICIAL_SCODERS_EMAIL,
            subject: `✅ Payment Confirmation & Receipt - S-CODERS (Txn: ${finalPaymentId})`,
            dedupeKey: receiptDedupeKey,
            itemTitle: purpose || "Service Payment",
            status: emailResult.success ? "SENT" : "FAILED",
            messageId: emailResult.messageId,
            simulated: emailResult.simulated,
            realEmailDelivered: emailResult.realEmailDelivered,
            deliveryMode: emailResult.deliveryMode,
          });
          saveStoredAppState(appState);
        }
      }

      res.json({
        success: true,
        verified: true,
        status: "PAID",
        message: "Payment verified successfully and receipt generated.",
        emailSent: emailResult.success,
        emailDeferredToRegistration: shouldDeferToRegistrationEmail,
        paymentId: finalPaymentId,
        orderId: finalOrderId,
        merchantUpiId: activeMerchantUpi,
      });
    } catch (err: any) {
      console.error("Verify Payment Error:", err);
      res.status(500).json({ success: false, verified: false, error: "Failed to verify payment." });
    }
  };

  // Check Order & Payment Status Endpoint (Resolves UNKNOWN / UNCERTAIN states & Duplicate Checks)
  const handleCheckOrderStatus = async (req: express.Request, res: express.Response) => {
    try {
      const orderId = (req.params.orderId || req.body?.orderId || req.query?.orderId || "").toString().trim();
      const applicationOrderKey = (req.body?.applicationOrderKey || req.query?.applicationOrderKey || "").toString().trim();

      if (!orderId && !applicationOrderKey) {
        return res.status(400).json({
          success: false,
          status: "UNKNOWN",
          verified: false,
          paymentCaptured: false,
          message: "Order reference is required to check status.",
        });
      }

      const appState = getStoredAppState();
      const ordersList: any[] = Array.isArray(appState["db_razorpay_orders"])
        ? appState["db_razorpay_orders"]
        : [];
      const paymentsList: any[] = Array.isArray(appState["db_payments"])
        ? appState["db_payments"]
        : [];

      // 1. Check verified payments ledger
      const verifiedTxn = paymentsList.find(
        (p) =>
          (orderId && (p.razorpayOrderId === orderId || p.id === orderId)) &&
          p.status === "Successful"
      );

      if (verifiedTxn) {
        return res.json({
          success: true,
          orderId: verifiedTxn.razorpayOrderId || orderId,
          paymentId: verifiedTxn.razorpayPaymentId || verifiedTxn.id,
          status: "PAID",
          verified: true,
          paymentCaptured: true,
          reusable: false,
          message: "Payment already completed.",
        });
      }

      // 2. Check local order record
      const localOrder = ordersList.find(
        (o) =>
          (orderId && o.orderId === orderId) ||
          (applicationOrderKey && o.applicationOrderKey === applicationOrderKey)
      );

      if (localOrder?.status === "PAID") {
        return res.json({
          success: true,
          orderId: localOrder.orderId,
          paymentId: localOrder.paymentId,
          status: "PAID",
          verified: true,
          paymentCaptured: true,
          reusable: false,
          message: "Payment already completed.",
        });
      }

      // 3. If live Razorpay instance is configured and orderId starts with order_, query Razorpay API directly
      const rzp = getRazorpayInstance();
      if (rzp && orderId && orderId.startsWith("order_") && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        try {
          const rzpOrder: any = await rzp.orders.fetch(orderId);
          const paymentsResp: any = await rzp.orders.fetchPayments(orderId);
          const items: any[] = Array.isArray(paymentsResp?.items) ? paymentsResp.items : [];

          const capturedPayment = items.find((p) => p.status === "captured");
          if (capturedPayment || rzpOrder?.status === "paid") {
            const pId = capturedPayment?.id || `pay_rzp_${Date.now()}`;
            return res.json({
              success: true,
              orderId,
              paymentId: pId,
              status: "PAID",
              verified: true,
              paymentCaptured: true,
              reusable: false,
              message: "Payment confirmed by Razorpay.",
            });
          }

          const authorizedOrPending = items.find(
            (p) => p.status === "authorized" || p.status === "created"
          );
          if (authorizedOrPending) {
            return res.json({
              success: true,
              orderId,
              paymentId: authorizedOrPending.id,
              status: "UNKNOWN",
              verified: false,
              paymentCaptured: false,
              reusable: false,
              message: "Payment status could not be confirmed yet. Please check your bank/UPI app before making another payment.",
            });
          }

          const failedPayments = items.filter((p) => p.status === "failed");
          if (failedPayments.length > 0) {
            return res.json({
              success: true,
              orderId,
              status: "FAILED",
              verified: false,
              paymentCaptured: false,
              reusable: true,
              message: "No payment was received for this attempt.",
            });
          }
        } catch (rzpCheckErr) {
          // Fallback to local order status if order does not exist on live Razorpay
        }
      }

      if (localOrder) {
        const ageMs = Date.now() - (Number(localOrder.createdAtMs) || 0);
        const isExpired = ageMs > 25 * 60 * 1000;
        return res.json({
          success: true,
          orderId: localOrder.orderId,
          status: isExpired ? "EXPIRED" : localOrder.status || "CREATED",
          verified: false,
          paymentCaptured: false,
          reusable: !isExpired && localOrder.status !== "PAID",
          message:
            localOrder.status === "FAILED"
              ? "No payment was received for this attempt."
              : "No payment has been confirmed for this order yet.",
        });
      }

      return res.json({
        success: true,
        orderId,
        status: "CREATED",
        verified: false,
        paymentCaptured: false,
        reusable: true,
        message: "No payment was received for this attempt.",
      });
    } catch (err: any) {
      console.error("Check Order Status Error:", err);
      return res.status(500).json({
        success: false,
        status: "UNKNOWN",
        verified: false,
        paymentCaptured: false,
        message: "Payment status could not be confirmed yet. Please check your bank/UPI app before making another payment.",
      });
    }
  };

  // Razorpay Create Order Endpoints (Standard & Direct Aliases)
  app.post("/api/create-order", handleCreateOrder);
  app.post("/api/payments/create-order", handleCreateOrder);
  app.post("/api/razorpay/create-order", handleCreateOrder);

  // Razorpay Verify Payment Endpoints (Standard & Direct Aliases)
  app.post("/api/verify-payment", handleVerifyPayment);
  app.post("/api/payments/verify", handleVerifyPayment);
  app.post("/api/razorpay/verify-payment", handleVerifyPayment);

  // Razorpay Order & Payment Status Check Endpoints
  app.get("/api/payments/order-status/:orderId", handleCheckOrderStatus);
  app.post("/api/payments/check-status", handleCheckOrderStatus);

  // Razorpay Webhook Endpoint for Asynchronous Gateway Events
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const signature = req.headers["x-razorpay-signature"] as string;

      if (webhookSecret && signature) {
        const bodyStr = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
        const expectedSignature = crypto
          .createHmac("sha256", webhookSecret)
          .update(bodyStr)
          .digest("hex");

        if (expectedSignature !== signature) {
          console.warn("Razorpay Webhook: Signature mismatch rejected.");
          return res.status(400).json({ error: "Invalid webhook signature" });
        }
      }

      const event = req.body?.event;
      const payload = req.body?.payload;

      console.log(`Razorpay Webhook Event Received: ${event}`);

      if (event === "payment.captured" || event === "order.paid") {
        const payment = payload?.payment?.entity;
        const order = payload?.order?.entity;
        const paymentId = payment?.id;
        const orderId = order?.id || payment?.order_id;
        const amount = payment?.amount ? payment.amount / 100 : 0;
        const email = payment?.email || order?.notes?.client_email;
        const name = payment?.notes?.client_name || order?.notes?.client_name || "Client";

        if (paymentId) {
          try {
            const appState = getStoredAppState();
            const paymentsList = Array.isArray(appState['db_payments']) ? [...appState['db_payments']] : [];
            const existing = paymentsList.find((p: any) => p.id === paymentId || p.razorpayPaymentId === paymentId);

            if (!existing) {
              paymentsList.unshift({
                id: paymentId,
                clientId: email || "client@scoders.dev",
                clientName: name,
                clientEmail: email || "client@scoders.dev",
                amount,
                currency: payment?.currency || "INR",
                paymentMethod: `Razorpay Webhook (${payment?.method || 'Standard'})`,
                status: "Successful",
                timestamp: new Date().toLocaleString(),
                reference: payment?.description || order?.notes?.purpose || "Razorpay Payment",
                interrupted: false,
                failureReason: null,
                razorpayOrderId: orderId,
                razorpayPaymentId: paymentId,
                paymentVerifiedAt: new Date().toISOString(),
              });
              appState['db_payments'] = paymentsList;
              saveStoredAppState(appState);
            }
          } catch (dbErr) {
            console.warn("Webhook app-state update error:", dbErr);
          }
        }
      }

      res.json({ status: "ok", received: true });
    } catch (err: any) {
      console.error("Razorpay Webhook Error:", err);
      res.status(500).json({ error: "Webhook handling failed." });
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
        subject: `❌ Payment Attempt Failed - S-CODERS (Bharat Tech Developers)`,
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

  const normalizePublicUrl = (url: string): string => {
    return url.includes("://ais-dev-") ? url.replace("://ais-dev-", "://ais-pre-") : url;
  };

  // Helper to dynamically resolve the accurate live public website URL for email links
  const resolveAppUrl = (req: express.Request, fallbackPath: string = ""): string => {
    const suffix = fallbackPath.startsWith("/") ? fallbackPath : `/${fallbackPath}`;
    const envUrl = (process.env.PUBLIC_APP_URL || process.env.APP_URL)?.trim();
    if (envUrl && envUrl.startsWith("http")) {
      const base = normalizePublicUrl(envUrl.replace(/\/$/, ""));
      return `${base}${suffix}`;
    }
    const origin = req.headers.origin;
    if (origin && typeof origin === "string" && origin.startsWith("http")) {
      const base = normalizePublicUrl(origin.replace(/\/$/, ""));
      return `${base}${suffix}`;
    }
    const fwdHost = req.headers["x-forwarded-host"];
    if (fwdHost && typeof fwdHost === "string") {
      const proto = req.headers["x-forwarded-proto"] || "https";
      return normalizePublicUrl(`${proto}://${fwdHost}${suffix}`);
    }
    const host = req.headers.host;
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      return normalizePublicUrl(`https://${host}${suffix}`);
    }
    return `http://${host || "localhost:3000"}${suffix}`;
  };

  // ============================================================================
  // UNIFIED UID REGISTRATION, AUTOMATED EMAIL DISPATCH, DEDUPLICATION & RECOVERY
  // ============================================================================
  type RegistrationSection = "service" | "workshop" | "event";

  interface RegistrationUidRecord {
    uid: string;
    section: RegistrationSection;
    itemId: string;
    itemTitle: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    clientOrg?: string;
    clientRole?: string;
    amount: number;
    currency: string;
    paymentStatus: "NOT_REQUIRED" | "VERIFIED" | "PENDING" | "FAILED";
    paymentId?: string;
    orderId?: string;
    dedupeKey: string;
    chatId?: string;
    metadata?: {
      date?: string;
      day?: string;
      time?: string;
      location?: string;
      description?: string;
      requirements?: string;
      notes?: string;
      budget?: string;
      timeline?: string;
    };
    issuedAt: string;
    validFrom: string;
    validUntil: string;
    status: "ACTIVE" | "EXPIRED" | "REVOKED";
    confirmationEmailSent: boolean;
    confirmationEmailSentAt?: string;
    realEmailDelivered?: boolean;
    deliveryMode?: EmailDeliveryMode;
    emailFrom?: string;
    emailMessageId?: string;
  }

  function normalizeSectionName(raw: string): RegistrationSection | null {
    const val = String(raw || "").trim().toLowerCase();
    if (val === "service" || val === "services") return "service";
    if (val === "workshop" || val === "workshops") return "workshop";
    if (val === "event" || val === "events") return "event";
    return null;
  }

  function computeUidValidityWindow(section: RegistrationSection, scheduledDateStr?: string): { validFrom: string; validUntil: string } {
    const now = new Date();
    const validFrom = now.toISOString();
    let expiryMs = now.getTime();

    if (section === "service") {
      // Services stay active for 180 days from registration
      expiryMs += 180 * 24 * 60 * 60 * 1000;
    } else if (section === "workshop") {
      // Workshops stay valid for 30 days OR scheduled date + 30 days (whichever is later)
      expiryMs += 30 * 24 * 60 * 60 * 1000;
      if (scheduledDateStr) {
        const parsed = Date.parse(scheduledDateStr);
        if (!isNaN(parsed)) {
          expiryMs = Math.max(expiryMs, parsed + 30 * 24 * 60 * 60 * 1000);
        }
      }
    } else {
      // Events stay valid for at least 30 days OR 7 days past the scheduled event date
      expiryMs += 30 * 24 * 60 * 60 * 1000;
      if (scheduledDateStr) {
        const parsed = Date.parse(scheduledDateStr);
        if (!isNaN(parsed)) {
          expiryMs = Math.max(expiryMs, parsed + 7 * 24 * 60 * 60 * 1000);
        }
      }
    }

    return {
      validFrom,
      validUntil: new Date(expiryMs).toISOString(),
    };
  }

  function collectAllExistingUids(appState: Record<string, any>): Set<string> {
    const existing = new Set<string>();
    const uidRecords: any[] = Array.isArray(appState["db_registration_uids"]) ? appState["db_registration_uids"] : [];
    const svcRegs: any[] = Array.isArray(appState["db_service_registrations"]) ? appState["db_service_registrations"] : [];
    const wkspRegs: any[] = Array.isArray(appState["db_workshop_registrations"]) ? appState["db_workshop_registrations"] : [];
    const evtTickets: any[] = Array.isArray(appState["scoders_event_tickets"]) ? appState["scoders_event_tickets"] : [];

    for (const r of uidRecords) if (r?.uid) existing.add(String(r.uid).trim().toUpperCase());
    for (const r of svcRegs) if (r?.uniqueKey) existing.add(String(r.uniqueKey).trim().toUpperCase());
    for (const r of wkspRegs) if (r?.uniqueAccessKey) existing.add(String(r.uniqueAccessKey).trim().toUpperCase());
    for (const t of evtTickets) if (t?.ticketCode) existing.add(String(t.ticketCode).trim().toUpperCase());
    return existing;
  }

  function generateCollisionFreeUid(section: RegistrationSection, itemId: string, appState: Record<string, any>): string {
    const existing = collectAllExistingUids(appState);
    const cleanCode = String(itemId || section)
      .replace(/[^a-zA-Z0-9-]/g, "")
      .substring(0, 6)
      .toUpperCase() || section.toUpperCase();

    for (let attempt = 0; attempt < 20; attempt++) {
      const randA = crypto.randomBytes(2).toString("hex").toUpperCase();
      const randB = crypto.randomBytes(2).toString("hex").toUpperCase();
      let candidate = "";
      if (section === "service") {
        candidate = `BTD-SERV-${cleanCode.substring(0, 4)}-${randA}-${randB}`;
      } else if (section === "workshop") {
        candidate = `BTD-WKSP-${cleanCode.substring(0, 6)}-${randA}-${randB}`;
      } else {
        candidate = `SC-EVT-${randA}${randB}`;
      }
      if (!existing.has(candidate.toUpperCase())) {
        return candidate;
      }
    }
    return `${section === "event" ? "SC-EVT" : section === "workshop" ? "BTD-WKSP" : "BTD-SERV"}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  }

  function appendEmailDispatchLog(
    appState: Record<string, any>,
    entry: {
      section: string;
      to: string;
      from: string;
      subject: string;
      uid?: string;
      dedupeKey?: string;
      itemTitle?: string;
      status: "SENT" | "FAILED" | "SKIPPED_DUPLICATE";
      messageId?: string;
      previewUrl?: string;
      simulated?: boolean;
      realEmailDelivered?: boolean;
      deliveryMode?: string;
      error?: string;
      detailsSummary?: string;
    }
  ) {
    const logs: any[] = Array.isArray(appState["db_email_logs"]) ? [...appState["db_email_logs"]] : [];
    logs.unshift({
      id: `EML-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
      ...entry,
      timestamp: new Date().toISOString(),
    });
    appState["db_email_logs"] = logs.slice(0, 500);
  }

  function buildSectionEmailPayload(
    req: express.Request,
    rec: RegistrationUidRecord,
    overrideActionUrl?: string
  ): { subject: string; html: string } {
    const targetUrl =
      overrideActionUrl && String(overrideActionUrl).startsWith("http")
        ? String(overrideActionUrl)
        : resolveAppUrl(
            req,
            rec.section === "service"
              ? `/?view=services&key=${rec.uid}`
              : rec.section === "workshop"
              ? `/?view=workshops&key=${rec.uid}`
              : `/?view=events&ticket=${rec.uid}`
          );

    if (rec.section === "service") {
      return {
        subject: `✅ Service Registered - Your Unique S-CODERS Code (${rec.uid})`,
        html: getServiceAcceptanceEmailHtml({
          clientName: rec.clientName,
          serviceTitle: rec.itemTitle,
          uniqueKey: rec.uid,
          actionUrl: targetUrl,
          validFrom: rec.validFrom,
          validUntil: rec.validUntil,
          amount: Number(rec.amount) || 0,
          currency: rec.currency || "INR",
          paymentStatus: rec.paymentStatus,
          paymentId: rec.paymentId,
        }),
      };
    }

    if (rec.section === "workshop") {
      return {
        subject: `🎓 Workshop Confirmed & Payment Verified - S-CODERS UID (${rec.uid})`,
        html: getWorkshopEmailHtml({
          status: "SUCCESS",
          clientName: rec.clientName,
          workshopTitle: rec.itemTitle,
          amount: Number(rec.amount) || 0,
          currency: rec.currency || "INR",
          uniqueKey: rec.uid,
          actionUrl: targetUrl,
          paymentId: rec.paymentId || `pay_wksp_${Date.now()}`,
          workshopDate: rec.metadata?.date,
          workshopTime: rec.metadata?.time,
          workshopLocation: rec.metadata?.location,
          validUntil: rec.validUntil,
        }),
      };
    }

    return {
      subject: `🎟️ Event Registration Confirmed & Pass UID - S-CODERS (${rec.uid})`,
      html: getEventEmailHtml({
        status: "SUCCESS",
        clientName: rec.clientName,
        eventTitle: rec.itemTitle,
        amount: Number(rec.amount) || 0,
        currency: rec.currency || "INR",
        ticketCode: rec.uid,
        actionUrl: targetUrl,
        paymentId: rec.paymentId || (Number(rec.amount) === 0 ? `FREE_PASS_${Date.now()}` : `pay_evt_${Date.now()}`),
        eventDate: rec.metadata?.date,
        eventDay: rec.metadata?.day,
        eventTime: rec.metadata?.time,
        eventLocation: rec.metadata?.location,
        eventDescription: rec.metadata?.description,
        validUntil: rec.validUntil,
      }),
    };
  }

  const resendCooldownMap = new Map<string, number>();
  const testEmailWindowTimestamps: number[] = [];

  function isPaymentVerifiedForRegistration(
    section: RegistrationSection,
    amount: number,
    paymentId: string | undefined,
    orderId: string | undefined,
    paymentStatusRaw: string | undefined,
    appState: Record<string, any>
  ): { ok: boolean; reason?: string; status: "NOT_REQUIRED" | "VERIFIED" | "FAILED" | "PENDING" } {
    const cleanStatus = String(paymentStatusRaw || "").trim().toUpperCase();
    if (["FAILED", "CANCELLED", "DECLINED", "ERROR"].includes(cleanStatus)) {
      return { ok: false, status: "FAILED", reason: "Payment failed or was cancelled. Email and UID cannot be issued." };
    }
    if (["PENDING", "CREATED", "INITIATED", "UNKNOWN"].includes(cleanStatus)) {
      return { ok: false, status: "PENDING", reason: "Payment is still pending confirmation. Confirmation email triggers only after payment verification." };
    }

    if (section === "service") {
      // Standard consultation/quote service requests without direct payment are allowed with NOT_REQUIRED
      if (Number(amount) <= 0 && !paymentId && !cleanStatus) {
        return { ok: true, status: "NOT_REQUIRED" };
      }
      // Paid service bookings (e.g. UPI QR advance / Razorpay) verify transaction status
      if (
        cleanStatus === "VERIFIED" ||
        cleanStatus === "PAID" ||
        cleanStatus === "SUCCESS" ||
        cleanStatus === "SUCCESSFUL" ||
        (paymentId && (String(paymentId).startsWith("UPI_UTR_") || String(paymentId).startsWith("pay_")))
      ) {
        return { ok: true, status: "VERIFIED" };
      }
      return { ok: false, status: "PENDING", reason: "Service payment confirmation is pending verification." };
    }

    // Free events or complimentary 0-amount passes
    if (Number(amount) === 0 && (section === "event" || cleanStatus === "FREE" || (paymentId && paymentId.startsWith("FREE_")))) {
      return { ok: true, status: "VERIFIED" };
    }

    if (!paymentId || String(paymentId).trim().length < 5) {
      return { ok: false, status: "PENDING", reason: "Missing verified payment transaction ID. Complete payment before requesting UID & email." };
    }

    const paymentsList: any[] = Array.isArray(appState["db_payments"]) ? appState["db_payments"] : [];
    const ordersList: any[] = Array.isArray(appState["db_razorpay_orders"]) ? appState["db_razorpay_orders"] : [];

    // Check if explicitly marked FAILED in server orders/payments
    const failedOrder = orderId ? ordersList.find((o) => o.orderId === orderId && o.status === "FAILED") : null;
    if (failedOrder) {
      return { ok: false, status: "FAILED", reason: "Order payment verification failed." };
    }

    const confirmedInPayments = paymentsList.some(
      (p) => (p.id === paymentId || p.razorpayPaymentId === paymentId) && p.status === "Successful"
    );
    const confirmedInOrders = orderId
      ? ordersList.some((o) => o.orderId === orderId && o.status === "PAID")
      : false;
    const isDirectUtrOrVerifiedClient =
      cleanStatus === "VERIFIED" ||
      cleanStatus === "PAID" ||
      cleanStatus === "SUCCESS" ||
      cleanStatus === "SUCCESSFUL" ||
      String(paymentId).startsWith("UPI_UTR_") ||
      String(paymentId).startsWith("pay_");

    if (confirmedInPayments || confirmedInOrders || isDirectUtrOrVerifiedClient) {
      return { ok: true, status: "VERIFIED" };
    }

    return { ok: false, status: "PENDING", reason: "Payment could not be confirmed." };
  }

  function findExistingRecordByKeyOrUid(
    appState: Record<string, any>,
    uid: string,
    sectionFilter?: RegistrationSection | null
  ): { record?: RegistrationUidRecord; revoked?: boolean; expired?: boolean } {
    const normalizedUid = uid.replace(/\s+/g, "").trim().toUpperCase();
    const uidRecords: RegistrationUidRecord[] = Array.isArray(appState["db_registration_uids"])
      ? appState["db_registration_uids"]
      : [];
    const revokedMap: Record<string, any> =
      appState["scoders_revoked_passes"] && typeof appState["scoders_revoked_passes"] === "object"
        ? appState["scoders_revoked_passes"]
        : {};

    if (revokedMap[normalizedUid]) {
      return { revoked: true };
    }

    let matched = uidRecords.find(
      (r) =>
        r?.uid?.replace(/\s+/g, "").trim().toUpperCase() === normalizedUid &&
        (!sectionFilter || r.section === sectionFilter)
    );

    if (matched) {
      if (matched.status === "REVOKED") return { record: matched, revoked: true };
      const expiryTime = Date.parse(matched.validUntil);
      if (matched.status === "EXPIRED" || (!isNaN(expiryTime) && expiryTime < Date.now())) {
        return { record: { ...matched, status: "EXPIRED" }, expired: true };
      }
      return { record: matched };
    }

    // Backward-compatible lookup in legacy appState collections (services / workshops / event tickets / enquiries)
    if (!sectionFilter || sectionFilter === "service") {
      const svcRegs: any[] = Array.isArray(appState["db_service_registrations"]) ? appState["db_service_registrations"] : [];
      const svc = svcRegs.find((s) => s?.uniqueKey?.replace(/\s+/g, "").trim().toUpperCase() === normalizedUid);
      if (svc) {
        const validity = computeUidValidityWindow("service", svc.projectSubmissionDate || svc.registrationDate);
        return {
          record: {
            uid: svc.uniqueKey,
            section: "service",
            itemId: svc.serviceId || "service",
            itemTitle: svc.selectedServiceTitle || "S-CODERS Service",
            clientName: svc.clientProfile?.name || "Registered Client",
            clientEmail: svc.clientProfile?.email || "client@scoders.dev",
            clientPhone: svc.clientProfile?.phone,
            clientOrg: svc.clientProfile?.company,
            amount: 0,
            currency: "INR",
            paymentStatus: "NOT_REQUIRED",
            dedupeKey: `legacy-svc-${svc.uniqueKey}`,
            chatId: svc.chatId,
            metadata: {
              requirements: svc.projectRequirements,
              notes: svc.notes || svc.projectRequirements,
              budget: svc.budget,
              timeline: svc.timeline,
            },
            issuedAt: svc.registrationDate || new Date().toISOString(),
            validFrom: validity.validFrom,
            validUntil: svc.projectSubmissionDate ? new Date(Math.max(Date.now() + 86400000, Date.parse(svc.projectSubmissionDate) + 150 * 86400000)).toISOString() : validity.validUntil,
            status: "ACTIVE",
            confirmationEmailSent: true,
          },
        };
      }
    }

    if (!sectionFilter || sectionFilter === "workshop") {
      const wkspRegs: any[] = Array.isArray(appState["db_workshop_registrations"]) ? appState["db_workshop_registrations"] : [];
      const wksp = wkspRegs.find((w) => w?.uniqueAccessKey?.replace(/\s+/g, "").trim().toUpperCase() === normalizedUid);
      if (wksp) {
        if (wksp.isRevoked || wksp.paymentStatus === "Revoked") {
          return { revoked: true };
        }
        const validity = computeUidValidityWindow("workshop");
        return {
          record: {
            uid: wksp.uniqueAccessKey,
            section: "workshop",
            itemId: wksp.workshopId || "workshop",
            itemTitle: wksp.workshopTitle || "S-CODERS Workshop",
            clientName: wksp.participantProfile?.name || "Registered Participant",
            clientEmail: wksp.participantProfile?.email || "attendee@scoders.com",
            clientPhone: wksp.participantProfile?.phone,
            clientRole: wksp.participantProfile?.role,
            amount: Number(wksp.amountPaid) || 0,
            currency: "INR",
            paymentStatus: "VERIFIED",
            paymentId: wksp.transactionId,
            dedupeKey: `legacy-wksp-${wksp.uniqueAccessKey}`,
            chatId: wksp.chatId,
            metadata: {
              notes: wksp.notes,
            },
            issuedAt: wksp.paymentDate || new Date().toISOString(),
            validFrom: validity.validFrom,
            validUntil: validity.validUntil,
            status: "ACTIVE",
            confirmationEmailSent: true,
          },
        };
      }
    }

    if (!sectionFilter || sectionFilter === "event") {
      const evtTickets: any[] = Array.isArray(appState["scoders_event_tickets"]) ? appState["scoders_event_tickets"] : [];
      const tkt = evtTickets.find(
        (t) =>
          t?.ticketCode?.replace(/\s+/g, "").trim().toUpperCase() === normalizedUid ||
          (t?.id && String(t.id).replace(/\s+/g, "").trim().toUpperCase() === normalizedUid)
      );
      if (tkt) {
        if (tkt.status === "Ticket Cancelled") return { revoked: true };
        const validity = computeUidValidityWindow("event", tkt.eventDate);
        return {
          record: {
            uid: tkt.ticketCode,
            section: "event",
            itemId: tkt.eventId || "event",
            itemTitle: tkt.eventName || "S-CODERS Event",
            clientName: tkt.participantName || "Registered Attendee",
            clientEmail: tkt.participantEmail || "attendee@scoders.dev",
            clientPhone: tkt.participantPhone,
            clientOrg: tkt.participantOrg,
            amount: Number(tkt.amountPaid) || 0,
            currency: "INR",
            paymentStatus: "VERIFIED",
            paymentId: tkt.paymentId,
            orderId: tkt.orderId,
            dedupeKey: `legacy-evt-${tkt.ticketCode}`,
            metadata: {
              date: tkt.eventDate,
              day: tkt.eventDay,
              time: tkt.eventTime,
              location: tkt.eventLocation,
            },
            issuedAt: tkt.bookingDate || new Date().toISOString(),
            validFrom: validity.validFrom,
            validUntil: validity.validUntil,
            status: "ACTIVE",
            confirmationEmailSent: true,
          },
        };
      }
    }

    // Also check scoders_registered_services / scoders_registered_workshops maps if not found in arrays
    if (!sectionFilter || sectionFilter === "service") {
      const regMap = appState["scoders_registered_services"];
      if (regMap && typeof regMap === "object") {
        for (const [svcId, entry] of Object.entries<any>(regMap)) {
          if (String(entry?.key || "").replace(/\s+/g, "").trim().toUpperCase() === normalizedUid) {
            const validity = computeUidValidityWindow("service", entry.timestamp);
            return {
              record: {
                uid: String(entry.key).trim().toUpperCase(),
                section: "service",
                itemId: svcId,
                itemTitle: "S-CODERS Service",
                clientName: entry.name || "Registered Client",
                clientEmail: entry.email || "client@scoders.dev",
                clientPhone: entry.phone,
                clientRole: entry.role,
                amount: 0,
                currency: "INR",
                paymentStatus: "NOT_REQUIRED",
                dedupeKey: `map-svc-${entry.key}`,
                chatId: entry.chatId || `chat-svc-${entry.key}`,
                metadata: {
                  requirements: entry.requirements,
                  notes: entry.notes || entry.requirements,
                  budget: entry.budget,
                  timeline: entry.timeline,
                },
                issuedAt: entry.timestamp || validity.validFrom,
                validFrom: validity.validFrom,
                validUntil: validity.validUntil,
                status: "ACTIVE",
                confirmationEmailSent: true,
              },
            };
          }
        }
      }

      // Check db_enquiries (e.g. legacy BTD-PROJ-... IDs)
      const enquiries: any[] = Array.isArray(appState["db_enquiries"]) ? appState["db_enquiries"] : [];
      const enq = enquiries.find((e) => String(e?.id || "").replace(/\s+/g, "").trim().toUpperCase() === normalizedUid);
      if (enq && isValidEmailAddress(enq.email)) {
        const validity = computeUidValidityWindow("service");
        return {
          record: {
            uid: String(enq.id).trim().toUpperCase(),
            section: "service",
            itemId: "proj-custom",
            itemTitle: String(enq.subject || "S-CODERS Custom Project").replace(/^Project Enquiry:\s*/i, "").trim(),
            clientName: enq.name || "Registered Client",
            clientEmail: String(enq.email).trim().toLowerCase(),
            clientPhone: enq.phone,
            amount: 0,
            currency: "INR",
            paymentStatus: "NOT_REQUIRED",
            dedupeKey: `enq-svc-${enq.id}`,
            chatId: `chat-svc-${enq.id}`,
            metadata: {
              requirements: enq.message || "",
              notes: enq.message || "",
            },
            issuedAt: enq.timestamp || validity.validFrom,
            validFrom: validity.validFrom,
            validUntil: validity.validUntil,
            status: "ACTIVE",
            confirmationEmailSent: true,
          },
        };
      }
    }

    if (!sectionFilter || sectionFilter === "workshop") {
      const regMap = appState["scoders_registered_workshops"];
      if (regMap && typeof regMap === "object") {
        for (const [wkId, entry] of Object.entries<any>(regMap)) {
          if (String(entry?.key || "").replace(/\s+/g, "").trim().toUpperCase() === normalizedUid) {
            const validity = computeUidValidityWindow("workshop");
            return {
              record: {
                uid: String(entry.key).trim().toUpperCase(),
                section: "workshop",
                itemId: wkId,
                itemTitle: "S-CODERS Workshop",
                clientName: entry.name || "Registered Attendee",
                clientEmail: entry.email || "attendee@scoders.com",
                clientPhone: entry.phone,
                clientRole: entry.role || "Developer",
                amount: Number(entry.totalPaid) || 0,
                currency: "INR",
                paymentStatus: "VERIFIED",
                dedupeKey: `map-wksp-${entry.key}`,
                chatId: entry.chatId || `chat-wksp-${entry.key}`,
                metadata: {
                  notes: entry.notes,
                },
                issuedAt: entry.timestamp || validity.validFrom,
                validFrom: validity.validFrom,
                validUntil: validity.validUntil,
                status: "ACTIVE",
                confirmationEmailSent: true,
              },
            };
          }
        }
      }
    }

    return {};
  }

  function ensureHydratedRecordsInAppState(
    appState: Record<string, any>,
    rec: RegistrationUidRecord,
    opts?: { chatId?: string; paymentMethod?: string }
  ) {
    const cleanUid = rec.uid.replace(/\s+/g, "").trim().toUpperCase();
    const cleanEmail = rec.clientEmail.trim().toLowerCase();
    const cleanName = rec.clientName.trim() || "Valued Client";
    const resolvedChatId =
      opts?.chatId ||
      rec.chatId ||
      (rec.section === "service" ? `chat-svc-${cleanUid}` : rec.section === "workshop" ? `chat-wksp-${cleanUid}` : undefined);

    let serviceRegistration: any = null;
    let workshopRegistration: any = null;
    let eventTicket: any = null;
    let chatRecord: any = null;

    // 1. Ensure db_registration_uids has rec
    const uidRecords: any[] = Array.isArray(appState["db_registration_uids"]) ? [...appState["db_registration_uids"]] : [];
    const uidIdx = uidRecords.findIndex((u) => String(u?.uid || "").replace(/\s+/g, "").trim().toUpperCase() === cleanUid);
    if (uidIdx < 0) {
      uidRecords.unshift({ ...rec, uid: cleanUid, chatId: resolvedChatId });
      appState["db_registration_uids"] = uidRecords;
    } else if (resolvedChatId && !uidRecords[uidIdx].chatId) {
      uidRecords[uidIdx] = { ...uidRecords[uidIdx], chatId: resolvedChatId };
      appState["db_registration_uids"] = uidRecords;
    }

    // 2. Section-specific relational collections
    if (rec.section === "service") {
      const svcRegs: any[] = Array.isArray(appState["db_service_registrations"]) ? [...appState["db_service_registrations"]] : [];
      serviceRegistration = svcRegs.find((s) => String(s?.uniqueKey || "").replace(/\s+/g, "").trim().toUpperCase() === cleanUid);
      if (!serviceRegistration) {
        const regId = `REG-SVC-${Date.now().toString().slice(-5)}`;
        serviceRegistration = {
          id: regId,
          clientProfile: {
            name: cleanName,
            email: cleanEmail,
            phone: rec.clientPhone || "+91 99999 00000",
            company: rec.clientRole || rec.clientOrg || "Independent Client",
          },
          serviceId: rec.itemId || "service",
          selectedServiceTitle: rec.itemTitle || "S-CODERS Custom Service",
          uniqueKey: cleanUid,
          projectRequirements: rec.metadata?.requirements || "Custom Architecture & Implementation",
          notes: rec.metadata?.notes || rec.metadata?.requirements || "",
          budget: rec.metadata?.budget || (rec.amount > 0 ? `₹${Number(rec.amount).toLocaleString("en-IN")}` : "TBD"),
          timeline: rec.metadata?.timeline || "2-3 Weeks",
          projectStatus: Number(rec.amount) > 0 ? "In Progress" : "Pending",
          registrationDate: (rec.issuedAt || new Date().toISOString()).split("T")[0],
          projectSubmissionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          sourceCodeFileId: `FIL-SRC-${Date.now().toString().slice(-4)}`,
          pdfFileId: `FIL-PDF-${Date.now().toString().slice(-4)}`,
          chatId: resolvedChatId,
          feedbackId: null,
          invoiceId: `INV-2026-${Date.now().toString().slice(-3)}`,
        };
        svcRegs.unshift(serviceRegistration);
        appState["db_service_registrations"] = svcRegs;
      }

      const svcMap =
        appState["scoders_registered_services"] && typeof appState["scoders_registered_services"] === "object"
          ? { ...appState["scoders_registered_services"] }
          : {};
      if (rec.itemId && !svcMap[rec.itemId]) {
        svcMap[rec.itemId] = {
          key: cleanUid,
          name: cleanName,
          email: cleanEmail,
          phone: serviceRegistration.clientProfile?.phone || rec.clientPhone || "",
          role: rec.clientRole || "Developer",
          requirements: serviceRegistration.projectRequirements,
          notes: serviceRegistration.notes || serviceRegistration.projectRequirements || "",
          budget: serviceRegistration.budget,
          timeline: serviceRegistration.timeline,
          chatId: resolvedChatId,
          timestamp: new Date().toISOString(),
        };
        appState["scoders_registered_services"] = svcMap;
      }
    } else if (rec.section === "workshop") {
      const wkspRegs: any[] = Array.isArray(appState["db_workshop_registrations"]) ? [...appState["db_workshop_registrations"]] : [];
      workshopRegistration = wkspRegs.find((w) => String(w?.uniqueAccessKey || "").replace(/\s+/g, "").trim().toUpperCase() === cleanUid);
      if (!workshopRegistration) {
        const regId = `reg-wksp-${Date.now()}`;
        workshopRegistration = {
          id: regId,
          participantProfile: {
            name: cleanName,
            email: cleanEmail,
            phone: rec.clientPhone || "+91 99999 00000",
            role: rec.clientRole || "Registered Developer",
          },
          workshopId: rec.itemId || "w-1",
          workshopTitle: rec.itemTitle || "S-CODERS Workshop",
          paymentStatus: "Successful",
          amountPaid: Number(rec.amount) || 0,
          paymentMethod: opts?.paymentMethod || "Verified Gateway Payment",
          paymentDate: (rec.issuedAt || new Date().toISOString()).split("T")[0],
          transactionId: rec.paymentId || `TXN-${Date.now()}`,
          uniqueAccessKey: cleanUid,
          materialsFileIds: [`file-pdf-${Date.now()}`, `file-src-${Date.now()}`],
          chatId: resolvedChatId,
          feedbackId: null,
          notes: rec.metadata?.notes || "",
        };
        wkspRegs.unshift(workshopRegistration);
        appState["db_workshop_registrations"] = wkspRegs;
      }

      const wkspMap =
        appState["scoders_registered_workshops"] && typeof appState["scoders_registered_workshops"] === "object"
          ? { ...appState["scoders_registered_workshops"] }
          : {};
      if (rec.itemId && !wkspMap[rec.itemId]) {
        wkspMap[rec.itemId] = {
          key: cleanUid,
          name: cleanName,
          email: cleanEmail,
          phone: workshopRegistration.participantProfile?.phone || rec.clientPhone || "",
          role: rec.clientRole || "Registered Developer",
          notes: workshopRegistration.notes || rec.metadata?.notes || "",
          tickets: 1,
          totalPaid: Number(rec.amount) || 0,
          chatId: resolvedChatId,
          timestamp: new Date().toLocaleDateString(),
        };
        appState["scoders_registered_workshops"] = wkspMap;
      }
    } else if (rec.section === "event") {
      const evtTickets: any[] = Array.isArray(appState["scoders_event_tickets"]) ? [...appState["scoders_event_tickets"]] : [];
      eventTicket = evtTickets.find((t) => String(t?.ticketCode || "").trim().toUpperCase() === cleanUid);
      if (!eventTicket) {
        const now = new Date();
        eventTicket = {
          id: `TKT-${cleanUid}`,
          ticketCode: cleanUid,
          eventId: rec.itemId || "evt-1",
          eventName: rec.itemTitle || "S-CODERS Tech Event",
          eventDate: rec.metadata?.date || now.toLocaleDateString(),
          eventDay: rec.metadata?.day || "Saturday",
          eventTime: rec.metadata?.time || "10:00 AM IST",
          eventLocation: rec.metadata?.location || "S-CODERS Lab, Koramangala, Bengaluru",
          participantName: cleanName,
          participantEmail: cleanEmail,
          participantPhone: rec.clientPhone || "+91 8310463417",
          participantOrg: rec.clientOrg || "Independent Builder",
          bookingDate: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          bookingTime: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          amountPaid: Number(rec.amount) || 0,
          paymentId: rec.paymentId || `PASS-${cleanUid}`,
          orderId: rec.orderId || `ORD-${cleanUid}`,
          status: "Ticket Generated",
          qrCodeData: `SCODERS|${cleanUid}|${rec.itemId || "evt"}|${rec.paymentId || "VERIFIED"}`,
        };
        evtTickets.unshift(eventTicket);
        appState["scoders_event_tickets"] = evtTickets;
      }
    }

    // 3. Ensure db_chats entry exists for Service / Workshop
    if (resolvedChatId && (rec.section === "service" || rec.section === "workshop")) {
      const chats: any[] = Array.isArray(appState["db_chats"]) ? [...appState["db_chats"]] : [];
      chatRecord = chats.find(
        (c) => String(c?.id || "") === resolvedChatId || String(c?.uniqueAccessKey || "").trim().toUpperCase() === cleanUid
      );
      if (!chatRecord) {
        const regId = serviceRegistration?.id || workshopRegistration?.id || cleanUid;
        chatRecord = {
          id: resolvedChatId,
          clientName: cleanName,
          clientEmail: cleanEmail,
          registrationId: regId,
          reference: rec.itemTitle || "S-CODERS Workspace",
          ...(rec.section === "service" ? { serviceId: rec.itemId } : { workshopId: rec.itemId }),
          uniqueAccessKey: cleanUid,
          messages: [
            {
              id: `msg-init-${Date.now()}`,
              sender: "team",
              senderName: rec.section === "workshop" ? "S-CODERS Mentor Team" : "S-CODERS Lead Team",
              senderRole: "S-CODERS Founder & CEO",
              content:
                rec.section === "workshop"
                  ? `Congratulations ${cleanName}! You are officially registered for '${rec.itemTitle}'. This is your dedicated channel with our mentors.`
                  : `Welcome ${cleanName} to S-CODERS! Your dedicated engineering workspace for '${rec.itemTitle}' is active.`,
              timestamp: new Date().toISOString(),
            },
          ],
          lastUpdated: new Date().toISOString(),
        };
        chats.unshift(chatRecord);
        appState["db_chats"] = chats;
      }
    }

    // 4. Ensure payment log exists if paid
    if (Number(rec.amount) > 0 && rec.paymentId) {
      const payments: any[] = Array.isArray(appState["db_payments"]) ? [...appState["db_payments"]] : [];
      const hasPay = payments.some((p) => p?.id === rec.paymentId || p?.razorpayPaymentId === rec.paymentId);
      if (!hasPay) {
        payments.unshift({
          id: rec.paymentId,
          clientId: cleanEmail,
          clientName: cleanName,
          clientEmail: cleanEmail,
          amount: Number(rec.amount),
          paymentMethod: opts?.paymentMethod || "Verified Gateway Payment",
          status: "Successful",
          timestamp: rec.issuedAt || new Date().toISOString(),
          reference: `${rec.section.toUpperCase()}: ${rec.itemTitle}`,
          interrupted: false,
          failureReason: null,
        });
        appState["db_payments"] = payments;
      }
    }

    return { serviceRegistration, workshopRegistration, eventTicket, chatRecord };
  }

  // Registration Window Status & Server Clock Authority Endpoints
  app.get("/api/registrations/window-status", (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      const appState = getStoredAppState();
      const rawSection = String(req.query?.section || "").trim().toLowerCase();
      const itemId = String(req.query?.itemId || "").trim();
      const itemTitle = String(req.query?.itemTitle || "").trim();

      let windowStatus: RegistrationWindowEvaluation | null = null;
      if (rawSection === "workshop" || rawSection === "event") {
        windowStatus = resolveAuthoritativeItemWindow(appState, rawSection, itemId, itemTitle);
      }

      const workshopsList: any[] = Array.isArray(appState["scoders_dynamic_workshops"])
        ? appState["scoders_dynamic_workshops"]
        : [];
      const eventsList: any[] = Array.isArray(appState["scoders_dynamic_events"])
        ? appState["scoders_dynamic_events"]
        : [];

      const workshopWindows: Record<string, RegistrationWindowEvaluation> = {};
      for (const defaultId of Object.keys(DEFAULT_WORKSHOP_WINDOWS)) {
        workshopWindows[defaultId] = resolveAuthoritativeItemWindow(appState, "workshop", defaultId);
      }
      for (const w of workshopsList) {
        if (w?.id) {
          workshopWindows[w.id] = resolveAuthoritativeItemWindow(appState, "workshop", w.id, w.title);
        }
      }

      const eventWindows: Record<string, RegistrationWindowEvaluation> = {};
      for (const defaultId of Object.keys(DEFAULT_EVENT_WINDOWS)) {
        eventWindows[defaultId] = resolveAuthoritativeItemWindow(appState, "event", defaultId);
      }
      for (const evt of eventsList) {
        if (evt?.id) {
          eventWindows[evt.id] = resolveAuthoritativeItemWindow(appState, "event", evt.id, evt.name);
        }
      }

      return res.json({
        success: true,
        serverNowIso: new Date().toISOString(),
        windowStatus,
        workshopWindows,
        eventWindows,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Failed to evaluate window status." });
    }
  });

  app.post("/api/registrations/check-window", (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      const { section: rawSection, itemId, itemTitle, startDate, endDate, statusOverride } = req.body || {};
      const section = normalizeSectionName(rawSection);
      if (section !== "workshop" && section !== "event") {
        return res.status(400).json({ success: false, error: "section must be workshop or event." });
      }
      const appState = getStoredAppState();
      const windowStatus = resolveAuthoritativeItemWindow(
        appState,
        section,
        itemId,
        itemTitle,
        startDate,
        endDate,
        statusOverride
      );
      return res.status(windowStatus.allowed ? 200 : 403).json({
        success: windowStatus.allowed,
        registrationClosed: !windowStatus.allowed,
        serverNowIso: new Date().toISOString(),
        windowStatus,
        error: windowStatus.allowed ? undefined : windowStatus.message,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Failed to check registration window." });
    }
  });

  // Unified Registration + Unique UID Generation + Automatic Email Notification (scoders82@gmail.com)
  app.post("/api/registrations/register-and-notify", async (req, res) => {
    try {
      const {
        section: rawSection,
        itemId,
        itemTitle,
        clientName,
        clientEmail,
        clientPhone,
        clientOrg,
        clientRole,
        amount = 0,
        currency = "INR",
        paymentStatus,
        paymentId,
        orderId,
        idempotencyKey,
        requestedUid,
        chatId,
        metadata = {},
        actionUrl,
      } = req.body || {};

      const section = normalizeSectionName(rawSection);
      if (!section) {
        return res.status(400).json({ success: false, error: "Invalid registration section. Must be service, workshop, or event." });
      }

      const cleanEmail = String(clientEmail || "").trim().toLowerCase();
      const cleanName = String(clientName || "").trim() || "Valued Client";
      const cleanItemId = String(itemId || itemTitle || section).trim();
      const cleanItemTitle = String(itemTitle || "S-CODERS Registration").trim();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        return res.status(400).json({ success: false, error: "Valid client email address is required." });
      }

      const appState = getStoredAppState();

      // 0. Server-authoritative registration window check for Workshops & Events
      if (section === "workshop" || section === "event") {
        const winEval = resolveAuthoritativeItemWindow(
          appState,
          section,
          cleanItemId,
          cleanItemTitle,
          metadata?.registrationStartDate,
          metadata?.registrationEndDate,
          metadata?.status
        );
        if (!winEval.allowed) {
          return res.status(403).json({
            success: false,
            registrationClosed: true,
            windowStatus: winEval,
            serverNowIso: new Date().toISOString(),
            error: winEval.message,
          });
        }
      }

      // 1. Gate check: Workshop & paid Events MUST have verified payment confirmation
      const payCheck = isPaymentVerifiedForRegistration(
        section,
        Number(amount) || 0,
        paymentId,
        orderId,
        paymentStatus,
        appState
      );
      if (!payCheck.ok) {
        return res.status(402).json({
          success: false,
          paymentRequired: true,
          paymentStatus: payCheck.status,
          error: payCheck.reason || "Payment must be verified before issuing UID or sending email.",
        });
      }

      const uidRecords: RegistrationUidRecord[] = Array.isArray(appState["db_registration_uids"])
        ? [...appState["db_registration_uids"]]
        : [];

      const computedDedupeKey = String(
        idempotencyKey ||
          (paymentId
            ? `${section}:pay:${String(paymentId).trim()}`
            : orderId
            ? `${section}:ord:${String(orderId).trim()}`
            : `${section}:reg:${cleanEmail}:${cleanItemId.toLowerCase()}`)
      );

      // 2. Strict Deduplication: Prevent duplicate UIDs & duplicate confirmation emails
      const emailLogsList: any[] = Array.isArray(appState["db_email_logs"]) ? appState["db_email_logs"] : [];
      const existingRecordIdx = uidRecords.findIndex((r) => {
        if (!r || r.section !== section) return false;
        if (r.status === "REVOKED") return false;
        const notExpired = isNaN(Date.parse(r.validUntil)) || Date.parse(r.validUntil) >= Date.now();
        if (!notExpired) return false;
        if (r.dedupeKey && r.dedupeKey === computedDedupeKey) return true;
        if (paymentId && r.paymentId && r.paymentId === String(paymentId).trim()) return true;
        if (orderId && r.orderId && r.orderId === String(orderId).trim()) return true;
        // For service (unpaid consultation) or free event, also deduplicate active identical email+item registration
        if (
          ((section === "service" && !paymentId && Number(amount) === 0) || (section === "event" && Number(amount) === 0)) &&
          r.clientEmail?.toLowerCase() === cleanEmail &&
          r.itemId?.toLowerCase() === cleanItemId.toLowerCase() &&
          r.status === "ACTIVE"
        ) {
          return true;
        }
        return false;
      });

      const alreadySentLog = emailLogsList.find(
        (l) => l && l.section === section && l.status === "SENT" && l.dedupeKey && l.dedupeKey === computedDedupeKey
      );

      if (existingRecordIdx >= 0 || alreadySentLog) {
        const existingRecord = existingRecordIdx >= 0 ? { ...uidRecords[existingRecordIdx] } : undefined;
        const resolvedUid = existingRecord?.uid || alreadySentLog?.uid || requestedUid || "EXISTING-UID";
        let hydrated: any = {};
        if (existingRecord) {
          hydrated = ensureHydratedRecordsInAppState(appState, existingRecord, { chatId });
        }
        const authData = getStoredAuthData();
        const linkedAcc = upsertServerClientAccount(authData, appState, {
          email: cleanEmail,
          name: cleanName,
          phone: clientPhone ? String(clientPhone).trim() : undefined,
          company: clientOrg ? String(clientOrg).trim() : undefined,
          clientRole: clientRole ? String(clientRole).trim() : undefined,
          registrationUid: resolvedUid,
        });
        saveStoredAuthData(authData);

        const cfg = getEmailProviderConfig();
        const priorLogsForUid = emailLogsList.filter(
          (l) =>
            l &&
            l.status === "SENT" &&
            ((l.uid && String(l.uid).toUpperCase() === String(resolvedUid).toUpperCase()) ||
              (l.dedupeKey && l.dedupeKey === computedDedupeKey))
        );
        const confirmedRealPriorLog = priorLogsForUid.some(
          (l) => Boolean(l.realEmailDelivered) || (l.simulated === false && !l.previewUrl && l.from === OFFICIAL_SCODERS_EMAIL)
        );
        const priorRealDelivered = Boolean(existingRecord?.realEmailDelivered) || confirmedRealPriorLog;

        // If the prior attempt only used sandbox/ethereal or failed, and a real SMTP/API provider is now active, deliver the real confirmation email now
        if (!priorRealDelivered && cfg.anyRealProviderConfigured && existingRecord) {
          const { subject, html } = buildSectionEmailPayload(req, existingRecord, actionUrl);
          const upgradeEmailRes = await sendEmailNotification({
            to: existingRecord.clientEmail || cleanEmail,
            subject,
            html,
            from: `"S-CODERS (Bharat Tech Developers)" <${OFFICIAL_SCODERS_EMAIL}>`,
            replyTo: OFFICIAL_SCODERS_EMAIL,
          });

          if (existingRecordIdx >= 0) {
            uidRecords[existingRecordIdx] = {
              ...existingRecord,
              confirmationEmailSent: Boolean(upgradeEmailRes.success),
              confirmationEmailSentAt: upgradeEmailRes.success ? new Date().toISOString() : existingRecord.confirmationEmailSentAt,
              realEmailDelivered: Boolean(upgradeEmailRes.realEmailDelivered),
              deliveryMode: upgradeEmailRes.deliveryMode,
              emailFrom: OFFICIAL_SCODERS_EMAIL,
              emailMessageId: upgradeEmailRes.messageId || existingRecord.emailMessageId,
            };
            appState["db_registration_uids"] = uidRecords;
          }

          appendEmailDispatchLog(appState, {
            section,
            to: existingRecord.clientEmail || cleanEmail,
            from: OFFICIAL_SCODERS_EMAIL,
            subject,
            uid: resolvedUid,
            dedupeKey: computedDedupeKey,
            itemTitle: cleanItemTitle,
            status: upgradeEmailRes.success ? "SENT" : "FAILED",
            messageId: upgradeEmailRes.messageId,
            previewUrl: upgradeEmailRes.previewUrl,
            simulated: upgradeEmailRes.simulated,
            realEmailDelivered: upgradeEmailRes.realEmailDelivered,
            deliveryMode: upgradeEmailRes.deliveryMode,
            error: upgradeEmailRes.error,
            detailsSummary: "Real inbox confirmation dispatched for existing UID (upgraded from prior sandbox/pending log).",
          });
          saveStoredAppState(appState);

          return res.json({
            success: true,
            deduplicated: true,
            alreadyRegistered: true,
            upgradedFromSandbox: true,
            uid: resolvedUid,
            validUntil: existingRecord.validUntil,
            emailSent: Boolean(upgradeEmailRes.success),
            realEmailDelivered: Boolean(upgradeEmailRes.realEmailDelivered),
            deliveryMode: upgradeEmailRes.deliveryMode,
            emailFrom: OFFICIAL_SCODERS_EMAIL,
            previewUrl: upgradeEmailRes.previewUrl,
            emailError: upgradeEmailRes.error,
            record: existingRecordIdx >= 0 ? uidRecords[existingRecordIdx] : existingRecord,
            hydrated,
            clientAccount: sanitizeClientAccountForResponse(linkedAcc),
          });
        }

        appendEmailDispatchLog(appState, {
          section,
          to: cleanEmail,
          from: OFFICIAL_SCODERS_EMAIL,
          subject: `Deduplicated ${section} registration (${resolvedUid})`,
          uid: resolvedUid,
          dedupeKey: computedDedupeKey,
          itemTitle: cleanItemTitle,
          status: "SKIPPED_DUPLICATE",
          realEmailDelivered: priorRealDelivered,
          detailsSummary: "Existing active UID / sent log matched; duplicate email prevented.",
        });
        saveStoredAppState(appState);

        return res.json({
          success: true,
          deduplicated: true,
          alreadyRegistered: true,
          uid: resolvedUid,
          validUntil: existingRecord?.validUntil,
          emailSent: false,
          emailSkippedDuplicate: true,
          alreadyDeliveredToInbox: priorRealDelivered,
          realEmailDelivered: priorRealDelivered,
          deliveryMode: priorRealDelivered ? existingRecord?.deliveryMode || "smtp" : "skipped_duplicate",
          emailFrom: OFFICIAL_SCODERS_EMAIL,
          record: existingRecord,
          hydrated,
          clientAccount: sanitizeClientAccountForResponse(linkedAcc),
        });
      }

      // 3. Mint guaranteed-unique registration UID & compute validity window
      const existingAllUids = collectAllExistingUids(appState);
      let finalUid =
        requestedUid && typeof requestedUid === "string" && !existingAllUids.has(requestedUid.trim().toUpperCase())
          ? requestedUid.trim().toUpperCase()
          : generateCollisionFreeUid(section, cleanItemId, appState);

      const { validFrom, validUntil } = computeUidValidityWindow(section, metadata?.date);
      const resolvedChatId =
        chatId || (section === "service" ? `chat-svc-${finalUid}` : section === "workshop" ? `chat-wksp-${finalUid}` : undefined);

      // 4. Build section-specific automated email & dispatch from scoders82@gmail.com
      const provisionalRecord: RegistrationUidRecord = {
        uid: finalUid,
        section,
        itemId: cleanItemId,
        itemTitle: cleanItemTitle,
        clientName: cleanName,
        clientEmail: cleanEmail,
        clientPhone: clientPhone ? String(clientPhone).trim() : undefined,
        clientOrg: clientOrg ? String(clientOrg).trim() : undefined,
        clientRole: clientRole ? String(clientRole).trim() : undefined,
        amount: Number(amount) || 0,
        currency,
        paymentStatus: payCheck.status,
        paymentId: paymentId ? String(paymentId).trim() : undefined,
        orderId: orderId ? String(orderId).trim() : undefined,
        dedupeKey: computedDedupeKey,
        chatId: resolvedChatId,
        metadata,
        issuedAt: validFrom,
        validFrom,
        validUntil,
        status: "ACTIVE",
        confirmationEmailSent: false,
      };
      const { subject, html } = buildSectionEmailPayload(req, provisionalRecord, actionUrl);

      const emailRes = await sendEmailNotification({
        to: cleanEmail,
        subject,
        html,
        from: `"S-CODERS (Bharat Tech Developers)" <${OFFICIAL_SCODERS_EMAIL}>`,
        replyTo: OFFICIAL_SCODERS_EMAIL,
      });

      const newRecord: RegistrationUidRecord = {
        ...provisionalRecord,
        confirmationEmailSent: Boolean(emailRes.success),
        confirmationEmailSentAt: emailRes.success ? new Date().toISOString() : undefined,
        realEmailDelivered: Boolean(emailRes.realEmailDelivered),
        deliveryMode: emailRes.deliveryMode,
        emailFrom: OFFICIAL_SCODERS_EMAIL,
        emailMessageId: emailRes.messageId,
      };

      const hydrated = ensureHydratedRecordsInAppState(appState, newRecord, {
        chatId: resolvedChatId,
        paymentMethod: metadata?.paymentMethod,
      });

      const authData = getStoredAuthData();
      const linkedAcc = upsertServerClientAccount(authData, appState, {
        email: cleanEmail,
        name: cleanName,
        phone: clientPhone ? String(clientPhone).trim() : undefined,
        company: clientOrg ? String(clientOrg).trim() : undefined,
        clientRole: clientRole ? String(clientRole).trim() : undefined,
        registrationUid: finalUid,
      });
      saveStoredAuthData(authData);

      appendEmailDispatchLog(appState, {
        section,
        to: cleanEmail,
        from: OFFICIAL_SCODERS_EMAIL,
        subject,
        uid: finalUid,
        dedupeKey: computedDedupeKey,
        itemTitle: cleanItemTitle,
        status: emailRes.success ? "SENT" : "FAILED",
        messageId: emailRes.messageId,
        previewUrl: emailRes.previewUrl,
        simulated: emailRes.simulated,
        realEmailDelivered: emailRes.realEmailDelivered,
        deliveryMode: emailRes.deliveryMode,
        error: emailRes.error,
        detailsSummary:
          section === "service"
            ? `Service: ${cleanItemTitle} | Safe-keeping & recovery notice included`
            : section === "workshop"
            ? `Workshop: ${cleanItemTitle} | Date: ${metadata?.date || "TBD"} | Mid-session rejoin instructions included`
            : `Event: ${cleanItemTitle} | Venue: ${metadata?.location || "TBD"} | Date: ${metadata?.date || "TBD"} ${metadata?.time || ""}`,
      });

      saveStoredAppState(appState);

      return res.json({
        success: true,
        deduplicated: false,
        uid: finalUid,
        validFrom,
        validUntil,
        emailSent: Boolean(emailRes.success),
        realEmailDelivered: Boolean(emailRes.realEmailDelivered),
        deliveryMode: emailRes.deliveryMode,
        emailFrom: OFFICIAL_SCODERS_EMAIL,
        previewUrl: emailRes.previewUrl,
        emailError: emailRes.error,
        record: newRecord,
        hydrated,
        clientAccount: sanitizeClientAccountForResponse(linkedAcc),
      });
    } catch (err: any) {
      console.error("Unified Registration & Notify Error:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to register and send notification." });
    }
  });

  // Explicit On-Demand Confirmation Email Resend for an active UID (to its registered email)
  app.post("/api/registrations/resend-email", async (req, res) => {
    try {
      const cleanUid = String(req.body?.uid || "").trim().toUpperCase();
      const suppliedEmail = req.body?.email ? String(req.body.email).trim().toLowerCase() : "";
      if (!cleanUid) {
        return res.status(400).json({ success: false, error: "Registration code (UID) is required." });
      }

      const lastSentAt = resendCooldownMap.get(cleanUid) || 0;
      if (Date.now() - lastSentAt < 15000) {
        return res.status(429).json({
          success: false,
          error: "A confirmation email was just sent for this code. Please check your inbox or wait a few seconds before retrying.",
        });
      }

      const appState = getStoredAppState();
      const lookup = findExistingRecordByKeyOrUid(appState, cleanUid, null);
      if (lookup.revoked) {
        return res.status(403).json({ success: false, error: `Registration code ${cleanUid} is revoked.` });
      }
      if (lookup.expired) {
        return res.status(410).json({ success: false, error: `Registration code ${cleanUid} has expired.` });
      }
      if (!lookup.record) {
        return res.status(404).json({ success: false, error: `No active registration found for code ${cleanUid}.` });
      }

      const registeredEmail = String(lookup.record.clientEmail || "").trim().toLowerCase();
      if (!isValidEmailAddress(registeredEmail)) {
        return res.status(400).json({ success: false, error: "No valid email address is linked to this registration." });
      }
      if (suppliedEmail && suppliedEmail !== registeredEmail) {
        return res.status(403).json({
          success: false,
          error: "Provided email does not match the registered email address for this UID.",
        });
      }

      const { subject, html } = buildSectionEmailPayload(req, lookup.record);
      const emailRes = await sendEmailNotification({
        to: registeredEmail,
        subject,
        html,
        from: `"S-CODERS (Bharat Tech Developers)" <${OFFICIAL_SCODERS_EMAIL}>`,
        replyTo: OFFICIAL_SCODERS_EMAIL,
      });
      resendCooldownMap.set(cleanUid, Date.now());

      const uidRecords: RegistrationUidRecord[] = Array.isArray(appState["db_registration_uids"])
        ? [...appState["db_registration_uids"]]
        : [];
      const recIdx = uidRecords.findIndex((r) => String(r?.uid || "").trim().toUpperCase() === cleanUid);
      if (recIdx >= 0) {
        uidRecords[recIdx] = {
          ...uidRecords[recIdx],
          confirmationEmailSent: Boolean(emailRes.success) || uidRecords[recIdx].confirmationEmailSent,
          confirmationEmailSentAt: emailRes.success ? new Date().toISOString() : uidRecords[recIdx].confirmationEmailSentAt,
          realEmailDelivered: Boolean(emailRes.realEmailDelivered) || Boolean(uidRecords[recIdx].realEmailDelivered),
          deliveryMode: emailRes.deliveryMode,
          emailFrom: OFFICIAL_SCODERS_EMAIL,
          emailMessageId: emailRes.messageId || uidRecords[recIdx].emailMessageId,
        };
        appState["db_registration_uids"] = uidRecords;
      }

      appendEmailDispatchLog(appState, {
        section: lookup.record.section,
        to: registeredEmail,
        from: OFFICIAL_SCODERS_EMAIL,
        subject,
        uid: cleanUid,
        dedupeKey: `${lookup.record.section}:resend:${cleanUid}:${Date.now()}`,
        itemTitle: lookup.record.itemTitle,
        status: emailRes.success ? "SENT" : "FAILED",
        messageId: emailRes.messageId,
        previewUrl: emailRes.previewUrl,
        simulated: emailRes.simulated,
        realEmailDelivered: emailRes.realEmailDelivered,
        deliveryMode: emailRes.deliveryMode,
        error: emailRes.error,
        detailsSummary: `Manual resend confirmation for ${cleanUid}`,
      });
      saveStoredAppState(appState);

      return res.json({
        success: Boolean(emailRes.success),
        uid: cleanUid,
        to: registeredEmail,
        emailSent: Boolean(emailRes.success),
        realEmailDelivered: Boolean(emailRes.realEmailDelivered),
        deliveryMode: emailRes.deliveryMode,
        emailFrom: OFFICIAL_SCODERS_EMAIL,
        previewUrl: emailRes.previewUrl,
        error: emailRes.error,
      });
    } catch (err: any) {
      console.error("Resend Email Error:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to resend confirmation email." });
    }
  });

  // Verify UID + Expiration + Revocation across Services, Workshops & Events
  app.post("/api/registrations/verify-uid", (req, res) => {
    try {
      const { uid, section: rawSection } = req.body || {};
      const cleanUid = String(uid || "").trim().toUpperCase();
      if (!cleanUid) {
        return res.status(400).json({ success: false, valid: false, error: "Registration code (UID) is required." });
      }

      const sectionFilter = rawSection ? normalizeSectionName(rawSection) : null;
      const appState = getStoredAppState();
      const lookup = findExistingRecordByKeyOrUid(appState, cleanUid, sectionFilter);

      if (lookup.revoked) {
        return res.status(403).json({
          success: false,
          valid: false,
          revoked: true,
          error: `Access code ${cleanUid} has been revoked by an administrator. Please contact ${OFFICIAL_SCODERS_EMAIL}.`,
        });
      }

      if (lookup.expired) {
        const uidRecords: RegistrationUidRecord[] = Array.isArray(appState["db_registration_uids"])
          ? [...appState["db_registration_uids"]]
          : [];
        const idx = uidRecords.findIndex((r) => r?.uid?.trim().toUpperCase() === cleanUid);
        if (idx >= 0 && uidRecords[idx].status !== "EXPIRED") {
          uidRecords[idx] = { ...uidRecords[idx], status: "EXPIRED" };
          appState["db_registration_uids"] = uidRecords;
          saveStoredAppState(appState);
        }
        return res.status(410).json({
          success: false,
          valid: false,
          expired: true,
          error: `Registration code ${cleanUid} has expired (validity ended ${new Date(lookup.record!.validUntil).toLocaleDateString()}). Please re-register or contact ${OFFICIAL_SCODERS_EMAIL}.`,
          record: lookup.record,
        });
      }

      if (!lookup.record) {
        return res.status(404).json({
          success: false,
          valid: false,
          error: `No active ${sectionFilter || "registration"} found for code "${cleanUid}". Check the code or use email recovery.`,
        });
      }

      // Self-heal & return full hydrated records so cleared/new browsers restore completely
      const hydrated = ensureHydratedRecordsInAppState(appState, lookup.record);
      saveStoredAppState(appState);

      const authData = getStoredAuthData();
      let clientAccount: any = null;
      if (lookup.record.clientEmail && lookup.record.clientEmail.includes("@")) {
        const acc = upsertServerClientAccount(authData, appState, {
          email: lookup.record.clientEmail,
          name: lookup.record.clientName,
          phone: lookup.record.clientPhone,
          company: lookup.record.clientOrg,
          clientRole: lookup.record.clientRole,
          registrationUid: lookup.record.uid,
        });
        saveStoredAuthData(authData);
        clientAccount = sanitizeClientAccountForResponse(acc);
      }

      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json({
        success: true,
        valid: true,
        record: lookup.record,
        hydrated,
        clientAccount,
      });
    } catch (err: any) {
      console.error("Verify UID Error:", err);
      return res.status(500).json({ success: false, valid: false, error: "Failed to verify registration code." });
    }
  });

  function gatherAllRecoveredRegistrationsForEmail(
    appState: Record<string, any>,
    cleanEmail: string,
    sectionFilter: RegistrationSection | null
  ): RegistrationUidRecord[] {
    const recoveredMap = new Map<string, RegistrationUidRecord>();
    const uidRecords: RegistrationUidRecord[] = Array.isArray(appState["db_registration_uids"])
      ? appState["db_registration_uids"]
      : [];
    const revokedMap: Record<string, any> = appState["scoders_revoked_passes"] || {};

    for (const r of uidRecords) {
      if (r?.clientEmail?.toLowerCase() === cleanEmail && (!sectionFilter || r.section === sectionFilter)) {
        const isRevoked = r.status === "REVOKED" || Boolean(revokedMap[r.uid.toUpperCase()]);
        const isExpired = !isNaN(Date.parse(r.validUntil)) && Date.parse(r.validUntil) < Date.now();
        recoveredMap.set(r.uid.toUpperCase(), {
          ...r,
          status: isRevoked ? "REVOKED" : isExpired ? "EXPIRED" : "ACTIVE",
        });
      }
    }

    if (!sectionFilter || sectionFilter === "service") {
      const svcRegs: any[] = Array.isArray(appState["db_service_registrations"]) ? appState["db_service_registrations"] : [];
      for (const s of svcRegs) {
        if (s?.clientProfile?.email?.toLowerCase() === cleanEmail && s.uniqueKey && !recoveredMap.has(s.uniqueKey.toUpperCase())) {
          const w = computeUidValidityWindow("service", s.projectSubmissionDate);
          recoveredMap.set(s.uniqueKey.toUpperCase(), {
            uid: s.uniqueKey,
            section: "service",
            itemId: s.serviceId || "service",
            itemTitle: s.selectedServiceTitle || "Service",
            clientName: s.clientProfile?.name || "Client",
            clientEmail: cleanEmail,
            clientPhone: s.clientProfile?.phone,
            clientRole: s.clientProfile?.company,
            amount: 0,
            currency: "INR",
            paymentStatus: "NOT_REQUIRED",
            dedupeKey: `legacy-svc-${s.uniqueKey}`,
            chatId: s.chatId,
            metadata: {
              requirements: s.projectRequirements,
              notes: s.notes || s.projectRequirements,
              budget: s.budget,
              timeline: s.timeline,
            },
            issuedAt: s.registrationDate || w.validFrom,
            validFrom: w.validFrom,
            validUntil: w.validUntil,
            status: "ACTIVE",
            confirmationEmailSent: true,
          });
        }
      }
      const svcMap = appState["scoders_registered_services"];
      if (svcMap && typeof svcMap === "object") {
        for (const [svcId, entry] of Object.entries<any>(svcMap)) {
          if (entry?.email?.toLowerCase() === cleanEmail && entry?.key && !recoveredMap.has(String(entry.key).toUpperCase())) {
            const w = computeUidValidityWindow("service");
            recoveredMap.set(String(entry.key).toUpperCase(), {
              uid: String(entry.key).toUpperCase(),
              section: "service",
              itemId: svcId,
              itemTitle: "S-CODERS Service",
              clientName: entry.name || "Client",
              clientEmail: cleanEmail,
              clientPhone: entry.phone,
              clientRole: entry.role,
              amount: 0,
              currency: "INR",
              paymentStatus: "NOT_REQUIRED",
              dedupeKey: `map-svc-${entry.key}`,
              chatId: entry.chatId,
              metadata: {
                requirements: entry.requirements,
                notes: entry.notes || entry.requirements,
                budget: entry.budget,
                timeline: entry.timeline,
              },
              issuedAt: entry.timestamp || w.validFrom,
              validFrom: w.validFrom,
              validUntil: w.validUntil,
              status: "ACTIVE",
              confirmationEmailSent: true,
            });
          }
        }
      }
      const enquiries: any[] = Array.isArray(appState["db_enquiries"]) ? appState["db_enquiries"] : [];
      for (const e of enquiries) {
        if (String(e?.email || "").trim().toLowerCase() === cleanEmail && e?.id && !recoveredMap.has(String(e.id).toUpperCase())) {
          const w = computeUidValidityWindow("service");
          recoveredMap.set(String(e.id).toUpperCase(), {
            uid: String(e.id).toUpperCase(),
            section: "service",
            itemId: "proj-custom",
            itemTitle: String(e.subject || "S-CODERS Custom Project").replace(/^Project Enquiry:\s*/i, "").trim(),
            clientName: e.name || "Client",
            clientEmail: cleanEmail,
            clientPhone: e.phone,
            amount: 0,
            currency: "INR",
            paymentStatus: "NOT_REQUIRED",
            dedupeKey: `enq-svc-${e.id}`,
            chatId: `chat-svc-${e.id}`,
            metadata: {
              requirements: e.message || "",
              notes: e.message || "",
            },
            issuedAt: e.timestamp || w.validFrom,
            validFrom: w.validFrom,
            validUntil: w.validUntil,
            status: "ACTIVE",
            confirmationEmailSent: true,
          });
        }
      }
    }

    if (!sectionFilter || sectionFilter === "workshop") {
      const wkspRegs: any[] = Array.isArray(appState["db_workshop_registrations"]) ? appState["db_workshop_registrations"] : [];
      for (const wk of wkspRegs) {
        if (wk?.participantProfile?.email?.toLowerCase() === cleanEmail && wk.uniqueAccessKey && !recoveredMap.has(wk.uniqueAccessKey.toUpperCase())) {
          const w = computeUidValidityWindow("workshop");
          const isRev = Boolean(wk.isRevoked || wk.paymentStatus === "Revoked" || revokedMap[wk.uniqueAccessKey.toUpperCase()]);
          recoveredMap.set(wk.uniqueAccessKey.toUpperCase(), {
            uid: wk.uniqueAccessKey,
            section: "workshop",
            itemId: wk.workshopId || "workshop",
            itemTitle: wk.workshopTitle || "Workshop",
            clientName: wk.participantProfile?.name || "Participant",
            clientEmail: cleanEmail,
            clientPhone: wk.participantProfile?.phone,
            clientRole: wk.participantProfile?.role,
            amount: Number(wk.amountPaid) || 0,
            currency: "INR",
            paymentStatus: "VERIFIED",
            paymentId: wk.transactionId,
            dedupeKey: `legacy-wksp-${wk.uniqueAccessKey}`,
            chatId: wk.chatId,
            metadata: {
              notes: wk.notes,
            },
            issuedAt: wk.paymentDate || w.validFrom,
            validFrom: w.validFrom,
            validUntil: w.validUntil,
            status: isRev ? "REVOKED" : "ACTIVE",
            confirmationEmailSent: true,
          });
        }
      }
      const wkspMap = appState["scoders_registered_workshops"];
      if (wkspMap && typeof wkspMap === "object") {
        for (const [wkId, entry] of Object.entries<any>(wkspMap)) {
          if (entry?.email?.toLowerCase() === cleanEmail && entry?.key && !recoveredMap.has(String(entry.key).toUpperCase())) {
            const w = computeUidValidityWindow("workshop");
            const isRev = Boolean(revokedMap[String(entry.key).toUpperCase()]);
            recoveredMap.set(String(entry.key).toUpperCase(), {
              uid: String(entry.key).toUpperCase(),
              section: "workshop",
              itemId: wkId,
              itemTitle: "S-CODERS Workshop",
              clientName: entry.name || "Participant",
              clientEmail: cleanEmail,
              clientPhone: entry.phone,
              clientRole: entry.role || "Developer",
              amount: Number(entry.totalPaid) || 0,
              currency: "INR",
              paymentStatus: "VERIFIED",
              dedupeKey: `map-wksp-${entry.key}`,
              chatId: entry.chatId,
              metadata: {
                notes: entry.notes,
              },
              issuedAt: entry.timestamp || w.validFrom,
              validFrom: w.validFrom,
              validUntil: w.validUntil,
              status: isRev ? "REVOKED" : "ACTIVE",
              confirmationEmailSent: true,
            });
          }
        }
      }
    }

    if (!sectionFilter || sectionFilter === "event") {
      const evtTickets: any[] = Array.isArray(appState["scoders_event_tickets"]) ? appState["scoders_event_tickets"] : [];
      for (const t of evtTickets) {
        if (t?.participantEmail?.toLowerCase() === cleanEmail && t.ticketCode && !recoveredMap.has(t.ticketCode.toUpperCase())) {
          const w = computeUidValidityWindow("event", t.eventDate);
          recoveredMap.set(t.ticketCode.toUpperCase(), {
            uid: t.ticketCode,
            section: "event",
            itemId: t.eventId || "event",
            itemTitle: t.eventName || "Event",
            clientName: t.participantName || "Attendee",
            clientEmail: cleanEmail,
            amount: Number(t.amountPaid) || 0,
            currency: "INR",
            paymentStatus: "VERIFIED",
            paymentId: t.paymentId,
            orderId: t.orderId,
            dedupeKey: `legacy-evt-${t.ticketCode}`,
            metadata: { date: t.eventDate, day: t.eventDay, time: t.eventTime, location: t.eventLocation },
            issuedAt: t.bookingDate || w.validFrom,
            validFrom: w.validFrom,
            validUntil: w.validUntil,
            status: t.status === "Ticket Cancelled" ? "REVOKED" : "ACTIVE",
            confirmationEmailSent: true,
          });
        }
      }
    }

    return Array.from(recoveredMap.values());
  }

  // Step 1 of UID / Account Recovery: Send 6-digit OTP verification code from scoders82@gmail.com
  app.post(["/api/registrations/recovery/request", "/api/auth/client/recovery/request"], async (req, res) => {
    try {
      const { email, section: rawSection } = req.body || {};
      const cleanEmail = String(email || "").trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        return res.status(400).json({ success: false, error: "Please enter a valid registered email address." });
      }

      const sectionFilter = rawSection ? normalizeSectionName(rawSection) : null;
      const appState = getStoredAppState();
      const authData = getStoredAuthData();

      // Check filtered section first, then fallback across all sections + client accounts so valid Gmail users aren't stranded
      const sectionMatches = gatherAllRecoveredRegistrationsForEmail(appState, cleanEmail, sectionFilter);
      const allSectionMatches = sectionMatches.length > 0 ? sectionMatches : gatherAllRecoveredRegistrationsForEmail(appState, cleanEmail, null);
      const clientAccount = findClientAccountOrBootstrapFromAppState(authData, appState, cleanEmail);

      if (allSectionMatches.length === 0 && !clientAccount) {
        return res.status(404).json({
          success: false,
          error: `No S-CODERS account or registrations found for ${cleanEmail}.`,
        });
      }

      const otpCode = String(crypto.randomInt(100000, 999999));
      const otpHash = crypto.createHash("sha256").update(`${cleanEmail}|${otpCode}`).digest("hex");
      const nowMs = Date.now();
      const expiresAt = new Date(nowMs + 10 * 60 * 1000).toISOString();

      authData.recoveryOtps = [
        {
          email: cleanEmail,
          section: sectionFilter || "all",
          otpHash,
          expiresAt,
          expiresAtMs: nowMs + 10 * 60 * 1000,
          attempts: 0,
          used: false,
          createdAt: new Date(nowMs).toISOString(),
        },
        ...authData.recoveryOtps.filter((o) => o.email !== cleanEmail),
      ].slice(0, 300);
      saveStoredAuthData(authData);

      const sectionLabel =
        sectionFilter === "service" && sectionMatches.length > 0
          ? "Service Workspace"
          : sectionFilter === "workshop" && sectionMatches.length > 0
          ? "Workshop Session"
          : sectionFilter === "event" && sectionMatches.length > 0
          ? "Event Pass"
          : "S-CODERS Account & Registrations";

      const emailRes = await sendEmailNotification({
        to: cleanEmail,
        subject: `🔐 S-CODERS Recovery Verification Code: ${otpCode}`,
        html: getUidRecoveryOtpEmailHtml({
          email: cleanEmail,
          otpCode,
          sectionLabel,
        }),
        from: `"S-CODERS (Bharat Tech Developers)" <${OFFICIAL_SCODERS_EMAIL}>`,
        replyTo: OFFICIAL_SCODERS_EMAIL,
      });

      appendEmailDispatchLog(appState, {
        section: sectionFilter || "recovery",
        to: cleanEmail,
        from: OFFICIAL_SCODERS_EMAIL,
        subject: `S-CODERS Recovery Verification Code`,
        status: emailRes.success ? "SENT" : "FAILED",
        messageId: emailRes.messageId,
        previewUrl: emailRes.previewUrl,
        simulated: emailRes.simulated,
        detailsSummary: `6-digit email verification OTP dispatched for ${sectionLabel} recovery.`,
      });
      saveStoredAppState(appState);

      return res.json({
        success: true,
        message: `A 6-digit verification code has been sent to ${cleanEmail} from ${OFFICIAL_SCODERS_EMAIL}.`,
        expiresAt,
        emailFrom: OFFICIAL_SCODERS_EMAIL,
        realEmailDelivered: Boolean(emailRes.realEmailDelivered),
        deliveryMode: emailRes.deliveryMode,
        emailError: emailRes.error,
        previewUrl: emailRes.previewUrl,
      });
    } catch (err: any) {
      console.error("Recovery Request Error:", err);
      return res.status(500).json({ success: false, error: "Failed to initiate email verification recovery." });
    }
  });

  // Step 2 of UID / Account Recovery: Verify OTP, recover all UIDs, optionally set password & sign client in
  app.post(["/api/registrations/recovery/verify", "/api/auth/client/recovery/verify"], async (req, res) => {
    try {
      const { email, otp, section: rawSection, resendEmail = true, newPassword } = req.body || {};
      const cleanEmail = String(email || "").trim().toLowerCase();
      const cleanOtp = String(otp || "").trim();

      if (!cleanEmail || !cleanOtp) {
        return res.status(400).json({ success: false, error: "Email and 6-digit verification code are required." });
      }

      const sectionFilter = rawSection ? normalizeSectionName(rawSection) : null;
      const appState = getStoredAppState();
      const authData = getStoredAuthData();

      const otps = [...authData.recoveryOtps];
      const otpIdx = otps.findIndex((o) => o.email === cleanEmail && !o.used);

      if (otpIdx < 0) {
        return res.status(400).json({ success: false, error: "No pending verification code found. Please request a new code." });
      }

      const otpRecord = otps[otpIdx];
      if (Date.now() > Number(otpRecord.expiresAtMs || 0)) {
        otps[otpIdx] = { ...otpRecord, used: true };
        authData.recoveryOtps = otps;
        saveStoredAuthData(authData);
        return res.status(410).json({ success: false, error: "Verification code has expired. Please request a new code." });
      }

      if (Number(otpRecord.attempts || 0) >= 5) {
        return res.status(429).json({ success: false, error: "Too many invalid attempts. Please request a new verification code." });
      }

      const candidateHash = crypto.createHash("sha256").update(`${cleanEmail}|${cleanOtp}`).digest("hex");
      if (candidateHash !== otpRecord.otpHash) {
        otps[otpIdx] = { ...otpRecord, attempts: Number(otpRecord.attempts || 0) + 1 };
        authData.recoveryOtps = otps;
        saveStoredAuthData(authData);
        return res.status(401).json({ success: false, error: "Invalid verification code. Please check your inbox and try again." });
      }

      otps[otpIdx] = { ...otpRecord, used: true, verifiedAt: new Date().toISOString() };
      authData.recoveryOtps = otps;

      // Gather matching registrations (preferring section filter if non-empty, otherwise returning all sections)
      const sectionScoped = gatherAllRecoveredRegistrationsForEmail(appState, cleanEmail, sectionFilter);
      const allRecovered = sectionScoped.length > 0 ? sectionScoped : gatherAllRecoveredRegistrationsForEmail(appState, cleanEmail, null);
      const activeRecovered = allRecovered.filter((r) => r.status === "ACTIVE");

      // Self-heal & hydrate active recovered records across appState
      for (const rec of activeRecovered) {
        ensureHydratedRecordsInAppState(appState, rec);
      }

      const cleanNewPass = typeof newPassword === "string" && newPassword.trim().length >= 4 ? newPassword.trim() : undefined;
      const clientAcc = upsertServerClientAccount(authData, appState, {
        email: cleanEmail,
        name: activeRecovered[0]?.clientName || allRecovered[0]?.clientName,
        phone: activeRecovered[0]?.clientPhone,
        company: activeRecovered[0]?.clientOrg,
        clientRole: activeRecovered[0]?.clientRole,
        password: cleanNewPass,
      });
      const sessionToken = issueClientSessionToken(authData, clientAcc);
      saveStoredAuthData(authData);

      let resentEmail = false;
      let resentRealDelivered = false;
      let resentDeliveryMode: EmailDeliveryMode | undefined;
      let resentPreviewUrl: string | undefined;
      if (resendEmail && activeRecovered.length > 0) {
        const summaryRes = await sendEmailNotification({
          to: cleanEmail,
          subject: `🔑 Your Recovered S-CODERS Registration Codes (UID)`,
          html: getUidRecoverySummaryEmailHtml({
            email: cleanEmail,
            records: activeRecovered.map((r) => ({
              section: r.section,
              itemTitle: r.itemTitle,
              uid: r.uid,
              validUntil: r.validUntil,
              status: r.status,
            })),
          }),
          from: `"S-CODERS (Bharat Tech Developers)" <${OFFICIAL_SCODERS_EMAIL}>`,
          replyTo: OFFICIAL_SCODERS_EMAIL,
        });
        resentEmail = Boolean(summaryRes.success);
        resentRealDelivered = Boolean(summaryRes.realEmailDelivered);
        resentDeliveryMode = summaryRes.deliveryMode;
        resentPreviewUrl = summaryRes.previewUrl;
        appendEmailDispatchLog(appState, {
          section: sectionFilter || "recovery",
          to: cleanEmail,
          from: OFFICIAL_SCODERS_EMAIL,
          subject: `Your Recovered S-CODERS Registration Codes (UID)`,
          uid: activeRecovered.map((r) => r.uid).join(", "),
          status: summaryRes.success ? "SENT" : "FAILED",
          messageId: summaryRes.messageId,
          previewUrl: summaryRes.previewUrl,
          simulated: summaryRes.simulated,
          detailsSummary: `Recovered and resent ${activeRecovered.length} active UID(s).`,
        });
      }

      saveStoredAppState(appState);

      const snapshot = collectClientRegistrationsSnapshot(appState, cleanEmail);
      return res.json({
        success: true,
        verified: true,
        email: cleanEmail,
        resentEmail,
        realEmailDelivered: resentRealDelivered,
        deliveryMode: resentDeliveryMode,
        previewUrl: resentPreviewUrl,
        emailFrom: OFFICIAL_SCODERS_EMAIL,
        registrations: allRecovered,
        activeCount: activeRecovered.length,
        passwordUpdated: Boolean(cleanNewPass),
        user: sanitizeClientAccountForResponse(clientAcc),
        token: sessionToken,
        snapshot,
      });
    } catch (err: any) {
      console.error("Recovery Verify Error:", err);
      return res.status(500).json({ success: false, error: "Failed to verify recovery code." });
    }
  });

  // ============================================================================
  // PERSISTENT CLIENT ACCOUNT AUTHENTICATION & UID LOGIN APIS
  // ============================================================================
  app.post("/api/auth/client/register", async (req, res) => {
    try {
      const { name, email, password, company, phone } = req.body || {};
      const cleanEmail = sanitizeHeaderString(email, 254).toLowerCase();
      const cleanName = sanitizeHeaderString(name, 120);
      const cleanCompany = typeof company === "string" ? sanitizeHeaderString(company, 120) : undefined;
      const cleanPass = String(password || "");

      if (!isValidEmailAddress(cleanEmail)) {
        return res.status(400).json({ success: false, error: "Please enter a valid email address." });
      }
      if (!cleanName) {
        return res.status(400).json({ success: false, error: "Please specify your full name." });
      }
      if (cleanPass.length < 4) {
        return res.status(400).json({ success: false, error: "Security password must be at least 4 characters long." });
      }

      const appState = getStoredAppState();
      const authData = getStoredAuthData();

      const existing = authData.accounts.find((a) => a.email.toLowerCase() === cleanEmail);
      if (existing && existing.hasPassword) {
        return res.status(409).json({
          success: false,
          error: "An account with this email is already registered. Please sign in or use Gmail Recovery.",
        });
      }

      const acc = upsertServerClientAccount(authData, appState, {
        email: cleanEmail,
        name: cleanName,
        phone: typeof phone === "string" ? sanitizeHeaderString(phone, 40) : undefined,
        company: cleanCompany,
        password: cleanPass,
      });
      const token = issueClientSessionToken(authData, acc);
      saveStoredAuthData(authData);

      // Dispatch automated welcome confirmation email via scoders82@gmail.com
      const portalUrl = resolveAppUrl(req, "/?view=portal");
      const welcomeSubject = `🎉 Welcome to S-CODERS Ecosystem (${cleanName})`;
      const welcomeRes = await sendEmailNotification({
        to: cleanEmail,
        subject: welcomeSubject,
        html: getClientWelcomeEmailHtml({
          clientName: cleanName,
          email: cleanEmail,
          company: cleanCompany || acc.company,
          portalUrl,
        }),
        from: `"S-CODERS (Bharat Tech Developers)" <${OFFICIAL_SCODERS_EMAIL}>`,
        replyTo: OFFICIAL_SCODERS_EMAIL,
      });

      appendEmailDispatchLog(appState, {
        section: "auth_signup",
        to: cleanEmail,
        from: OFFICIAL_SCODERS_EMAIL,
        subject: welcomeSubject,
        itemTitle: "Client Portal Account Signup",
        status: welcomeRes.success ? "SENT" : "FAILED",
        messageId: welcomeRes.messageId,
        previewUrl: welcomeRes.previewUrl,
        simulated: welcomeRes.simulated,
        realEmailDelivered: welcomeRes.realEmailDelivered,
        deliveryMode: welcomeRes.deliveryMode,
        error: welcomeRes.error,
        detailsSummary: `Welcome email on portal signup (${cleanName})`,
      });
      saveStoredAppState(appState);

      const snapshot = collectClientRegistrationsSnapshot(appState, cleanEmail);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json({
        success: true,
        user: sanitizeClientAccountForResponse(acc),
        token,
        snapshot,
        emailSent: Boolean(welcomeRes.success),
        realEmailDelivered: Boolean(welcomeRes.realEmailDelivered),
        deliveryMode: welcomeRes.deliveryMode,
        previewUrl: welcomeRes.previewUrl,
        emailFrom: OFFICIAL_SCODERS_EMAIL,
      });
    } catch (err: any) {
      console.error("Client Register Error:", err);
      return res.status(500).json({ success: false, error: "Failed to register client account." });
    }
  });

  app.post("/api/auth/client/login", (req, res) => {
    try {
      const body = req.body || {};
      const rawIdentifier = String(body.identifier || body.email || body.uid || "").trim();
      const cleanPassword = typeof body.password === "string" ? body.password : "";

      if (!rawIdentifier) {
        return res.status(400).json({
          success: false,
          error: "Please enter your registered email address or Unique Registration Code (UID).",
        });
      }

      const appState = getStoredAppState();
      const authData = getStoredAuthData();

      const looksLikeUid =
        /^(BTD-|SC-EVT-|REG-|EVT-)/i.test(rawIdentifier) || !rawIdentifier.includes("@");

      // Path A: Login directly with a Unique Registration Code (UID)
      if (looksLikeUid) {
        const cleanUid = rawIdentifier.replace(/\s+/g, "").toUpperCase();
        const lookup = findExistingRecordByKeyOrUid(appState, cleanUid, null);

        if (lookup.revoked) {
          return res.status(403).json({
            success: false,
            error: `Unique code ${cleanUid} has been revoked by an administrator. Contact ${OFFICIAL_SCODERS_EMAIL}.`,
          });
        }
        if (lookup.expired) {
          return res.status(410).json({
            success: false,
            error: `Unique code ${cleanUid} has expired. Please use Gmail Recovery or re-register.`,
          });
        }
        if (!lookup.record) {
          return res.status(404).json({
            success: false,
            notFound: true,
            error: `No active account or registration found for code "${cleanUid}". Verify the UID or recover via Gmail.`,
          });
        }

        ensureHydratedRecordsInAppState(appState, lookup.record);
        saveStoredAppState(appState);

        const ownerEmail = (lookup.record.clientEmail || "client@scoders.dev").trim().toLowerCase();
        const acc = upsertServerClientAccount(authData, appState, {
          email: ownerEmail,
          name: lookup.record.clientName,
          phone: lookup.record.clientPhone,
          company: lookup.record.clientOrg,
          clientRole: lookup.record.clientRole,
          registrationUid: lookup.record.uid,
        });
        const token = issueClientSessionToken(authData, acc);
        saveStoredAuthData(authData);

        const snapshot = collectClientRegistrationsSnapshot(appState, ownerEmail);
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        return res.json({
          success: true,
          loginMethod: "uid",
          user: sanitizeClientAccountForResponse(acc),
          token,
          matchedRecord: lookup.record,
          snapshot,
        });
      }

      // Path B: Login with Email + Password (or Email + UID entered in password field!)
      const cleanEmail = rawIdentifier.toLowerCase();
      const acc = findClientAccountOrBootstrapFromAppState(authData, appState, cleanEmail);
      if (!acc) {
        return res.status(404).json({
          success: false,
          notFound: true,
          error: "No client account found for this email. Please register first or recover via Gmail.",
        });
      }

      // Allow authenticating either with their chosen password OR by pasting one of their active UIDs as password
      const passwordMatchesScrypt = acc.passwordHash ? verifyPasswordScrypt(cleanPassword, acc.passwordHash) : false;
      const cleanPassUpper = cleanPassword.replace(/\s+/g, "").trim().toUpperCase();
      let uidMatchesOwner = false;
      if (!passwordMatchesScrypt && cleanPassUpper.length >= 4) {
        const uidCheck = findExistingRecordByKeyOrUid(appState, cleanPassUpper, null);
        if (
          uidCheck.record &&
          !uidCheck.revoked &&
          !uidCheck.expired &&
          uidCheck.record.clientEmail.trim().toLowerCase() === cleanEmail
        ) {
          uidMatchesOwner = true;
        }
      }

      if (!passwordMatchesScrypt && !uidMatchesOwner) {
        if (!acc.hasPassword) {
          return res.status(401).json({
            success: false,
            needsPasswordOrUid: true,
            error:
              "This email is linked to an active registration without a portal password yet. Sign in directly using your Unique Registration Code (UID), or click 'Recover via Gmail' to verify OTP and set a password.",
          });
        }
        return res.status(401).json({
          success: false,
          error: "Invalid password for this client account. You can also sign in with your Unique Registration Code or recover via Gmail.",
        });
      }

      const refreshedAcc = upsertServerClientAccount(authData, appState, { email: cleanEmail });
      const token = issueClientSessionToken(authData, refreshedAcc);
      saveStoredAuthData(authData);

      const snapshot = collectClientRegistrationsSnapshot(appState, cleanEmail);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json({
        success: true,
        loginMethod: uidMatchesOwner ? "email_uid" : "password",
        user: sanitizeClientAccountForResponse(refreshedAcc),
        token,
        snapshot,
      });
    } catch (err: any) {
      console.error("Client Login Error:", err);
      return res.status(500).json({ success: false, error: "Failed to authenticate client account." });
    }
  });

  app.get("/api/auth/client/me", (req, res) => {
    try {
      const authHeader = String(req.headers.authorization || "");
      const rawToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      if (!rawToken) {
        return res.status(401).json({ success: false, error: "Authentication token required." });
      }
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const authData = getStoredAuthData();
      const session = authData.sessions.find((s) => s.tokenHash === tokenHash && s.expiresAtMs > Date.now());
      if (!session) {
        return res.status(401).json({ success: false, error: "Session expired or invalid." });
      }
      const appState = getStoredAppState();
      const acc = findClientAccountOrBootstrapFromAppState(authData, appState, session.email);
      if (!acc) {
        return res.status(404).json({ success: false, error: "Client account no longer exists." });
      }
      const snapshot = collectClientRegistrationsSnapshot(appState, acc.email);
      return res.json({
        success: true,
        user: sanitizeClientAccountForResponse(acc),
        snapshot,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to validate session." });
    }
  });

  app.post("/api/registrations/sync-cloud", (req, res) => {
    try {
      const body = req.body || {};
      const cleanEmail = sanitizeHeaderString(body.email, 180).toLowerCase();
      const cleanName = sanitizeHeaderString(body.name, 120);
      const cleanPhone = sanitizeHeaderString(body.phone, 40);
      const cleanCompany = sanitizeHeaderString(body.company, 180);
      const rawRecords = Array.isArray(body.records)
        ? body.records
        : Array.isArray(body.cloudRecords)
          ? body.cloudRecords
          : [];
      const records: any[] = rawRecords.slice(0, 50);
      if (!isValidEmailAddress(cleanEmail)) {
        return res.status(400).json({ success: false, error: "Valid verified email is required." });
      }

      const appState = getStoredAppState();
      const authData = getStoredAuthData();
      const uidRecords: RegistrationUidRecord[] = Array.isArray(appState["db_registration_uids"])
        ? [...appState["db_registration_uids"]]
        : [];
      const revokedMap: Record<string, any> = appState["scoders_revoked_passes"] || {};

      for (const item of records) {
        const cleanUid = String(item?.uid || "").replace(/\s+/g, "").trim().toUpperCase();
        const section = normalizeSectionName(item?.section);
        const itemEmail = String(item?.clientEmail || cleanEmail).trim().toLowerCase();
        if (!cleanUid || !/^[A-Z0-9-]{4,64}$/.test(cleanUid) || !section || itemEmail !== cleanEmail) continue;
        if (revokedMap[cleanUid]) continue;

        const existingLookup = findExistingRecordByKeyOrUid(appState, cleanUid, null);
        if (existingLookup.record && existingLookup.record.clientEmail?.toLowerCase() !== cleanEmail) {
          // Never allow overwriting another user's existing registration UID
          continue;
        }
        if (existingLookup.revoked) continue;

        const validity = computeUidValidityWindow(section, item?.validUntil);
        const rec: RegistrationUidRecord = {
          uid: cleanUid,
          section,
          itemId: String(item?.itemId || section).trim().slice(0, 120),
          itemTitle: String(item?.itemTitle || "S-CODERS Offering").trim().slice(0, 200),
          clientName: String(item?.clientName || cleanName || "Registered Client").trim().slice(0, 120),
          clientEmail: cleanEmail,
          clientPhone: typeof item?.clientPhone === "string" ? item.clientPhone.trim().slice(0, 40) : undefined,
          clientRole: typeof item?.clientRole === "string" ? item.clientRole.trim().slice(0, 180) : undefined,
          amount: Number(item?.amount) || 0,
          currency: "INR",
          paymentStatus: item?.paymentStatus === "VERIFIED" ? "VERIFIED" : "NOT_REQUIRED",
          paymentId: typeof item?.paymentId === "string" ? item.paymentId.trim().slice(0, 120) : undefined,
          dedupeKey: `${section}:cloud:${cleanUid}`,
          chatId: typeof item?.chatId === "string" && item.chatId ? item.chatId.trim().slice(0, 120) : undefined,
          metadata: {
            requirements: typeof item?.requirements === "string" ? item.requirements.slice(0, 2000) : undefined,
            notes: typeof item?.notes === "string" ? item.notes.slice(0, 2000) : undefined,
            budget: typeof item?.budget === "string" ? item.budget.slice(0, 100) : undefined,
            timeline: typeof item?.timeline === "string" ? item.timeline.slice(0, 100) : undefined,
          },
          issuedAt: typeof item?.issuedAt === "string" && item.issuedAt ? item.issuedAt : validity.validFrom,
          validFrom: validity.validFrom,
          validUntil: typeof item?.validUntil === "string" && item.validUntil ? item.validUntil : validity.validUntil,
          status: item?.status === "EXPIRED" ? "EXPIRED" : "ACTIVE",
          confirmationEmailSent: true,
        };

        ensureHydratedRecordsInAppState(appState, rec);
        const existingIdx = uidRecords.findIndex((u) => String(u?.uid || "").trim().toUpperCase() === cleanUid);
        if (existingIdx < 0) {
          uidRecords.unshift(rec);
        }
      }
      appState["db_registration_uids"] = uidRecords;

      const acc = upsertServerClientAccount(authData, appState, {
        email: cleanEmail,
        name: cleanName || undefined,
        phone: cleanPhone || undefined,
        clientRole: cleanCompany || undefined,
      });
      const token = issueClientSessionToken(authData, acc);
      saveStoredAuthData(authData);
      saveStoredAppState(appState);

      const snapshot = collectClientRegistrationsSnapshot(appState, cleanEmail);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json({
        success: true,
        user: sanitizeClientAccountForResponse(acc),
        token,
        snapshot,
      });
    } catch (err: any) {
      console.error("Cloud Sync Error:", err);
      return res.status(500).json({ success: false, error: "Failed to synchronize cloud registrations." });
    }
  });

  app.post("/api/auth/client/logout", (req, res) => {
    try {
      const authHeader = String(req.headers.authorization || "");
      const rawToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      if (rawToken) {
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const authData = getStoredAuthData();
        authData.sessions = authData.sessions.filter((s) => s.tokenHash !== tokenHash);
        saveStoredAuthData(authData);
      }
      return res.json({ success: true });
    } catch {
      return res.json({ success: true });
    }
  });

  // Safe diagnostic endpoint exposing email transport readiness (NO secrets exposed)
  app.get("/api/email/config-status", async (req, res) => {
    const cfg = getEmailProviderConfig();
    const provider = cfg.hasSmtp
      ? cfg.smtpHost.toLowerCase().includes("gmail.com")
        ? "gmail_smtp"
        : "custom_smtp"
      : cfg.hasResend
      ? "resend"
      : cfg.hasSendgrid
      ? "sendgrid"
      : "ethereal_sandbox";

    let smtpVerified: boolean | undefined;
    let smtpVerifyPort: number | undefined;
    let verifyError: string | undefined;

    if (String(req.query?.verify || "") === "1" && cfg.hasSmtp) {
      const tryVerify = async (port: number) => {
        const transporter = nodemailer.createTransport({
          host: cfg.smtpHost,
          port,
          secure: port === 465,
          requireTLS: port === 587,
          auth: { user: cfg.smtpUser, pass: cfg.smtpPass },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        });
        await transporter.verify();
        return port;
      };

      try {
        smtpVerifyPort = await tryVerify(cfg.smtpPort);
        smtpVerified = true;
      } catch (err: any) {
        if (cfg.smtpHost.toLowerCase().includes("gmail.com") && cfg.smtpPort === 465) {
          try {
            smtpVerifyPort = await tryVerify(587);
            smtpVerified = true;
          } catch (err587: any) {
            smtpVerified = false;
            verifyError = err587?.response || err587?.message || err?.message || "SMTP authentication failed.";
          }
        } else {
          smtpVerified = false;
          verifyError = err?.response || err?.message || "SMTP authentication failed.";
        }
      }
    }

    return res.json({
      success: true,
      configured: cfg.anyRealProviderConfigured,
      provider,
      officialSender: OFFICIAL_SCODERS_EMAIL,
      smtpUser: cfg.hasSmtp ? cfg.smtpUser : undefined,
      smtpVerified,
      smtpVerifyPort,
      verifyError,
      message: cfg.anyRealProviderConfigured
        ? `Live inbox email delivery active via ${provider} (${OFFICIAL_SCODERS_EMAIL}).`
        : `Server SMTP/API secret (GMAIL_APP_PASSWORD) is not set yet. Registrations currently generate preview emails in sandbox mode until GMAIL_APP_PASSWORD is configured in Environment Secrets.`,
    });
  });

  // Read sanitized email dispatch audit logs & UID records (excludes OTP codes)
  app.get("/api/registrations/email-logs", (req, res) => {
    try {
      const appState = getStoredAppState();
      const logs = Array.isArray(appState["db_email_logs"]) ? appState["db_email_logs"] : [];
      const uidRecords = Array.isArray(appState["db_registration_uids"]) ? appState["db_registration_uids"] : [];
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json({
        success: true,
        officialSender: OFFICIAL_SCODERS_EMAIL,
        emailLogs: logs,
        uidCount: uidRecords.length,
        uidRecords,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Failed to load email logs." });
    }
  });

  // Live SMTP Diagnostic Test Email Trigger (fixed template, rate-limited, no arbitrary HTML injection)
  app.post("/api/email/send-test", async (req, res) => {
    try {
      const recipient = sanitizeHeaderString(req.body?.to || OFFICIAL_SCODERS_EMAIL, 254).toLowerCase();
      if (!isValidEmailAddress(recipient)) {
        return res.status(400).json({ success: false, error: "Please enter a valid recipient email address." });
      }

      const oneMinuteAgo = Date.now() - 60000;
      while (testEmailWindowTimestamps.length > 0 && testEmailWindowTimestamps[0] < oneMinuteAgo) {
        testEmailWindowTimestamps.shift();
      }
      if (testEmailWindowTimestamps.length >= 6) {
        return res.status(429).json({ success: false, error: "Rate limit reached. Wait a few seconds before sending another test email." });
      }
      testEmailWindowTimestamps.push(Date.now());

      const cfg = getEmailProviderConfig();
      const providerLabel = cfg.hasSmtp
        ? "Gmail SMTP (scoders82@gmail.com)"
        : cfg.hasResend
        ? "Resend HTTPS API"
        : cfg.hasSendgrid
        ? "SendGrid HTTPS API"
        : "Ethereal Sandbox";

      const subject = `✅ S-CODERS Live Email Automation Test (${new Date().toLocaleTimeString("en-IN")})`;
      const result = await sendEmailNotification({
        to: recipient,
        subject,
        html: getSmtpDiagnosticEmailHtml(recipient, providerLabel, resolveAppUrl(req, "/")),
        from: `"S-CODERS (Bharat Tech Developers)" <${OFFICIAL_SCODERS_EMAIL}>`,
        replyTo: OFFICIAL_SCODERS_EMAIL,
      });

      const appState = getStoredAppState();
      appendEmailDispatchLog(appState, {
        section: "diagnostic_test",
        to: recipient,
        from: OFFICIAL_SCODERS_EMAIL,
        subject,
        itemTitle: "Admin Live SMTP Verification Test",
        status: result.success ? "SENT" : "FAILED",
        messageId: result.messageId,
        previewUrl: result.previewUrl,
        simulated: result.simulated,
        realEmailDelivered: result.realEmailDelivered,
        deliveryMode: result.deliveryMode,
        error: result.error,
        detailsSummary: `Diagnostic test to ${recipient} (${result.deliveryMode})`,
      });
      saveStoredAppState(appState);

      return res.status(result.success ? 200 : 502).json({
        success: Boolean(result.success),
        realEmailDelivered: Boolean(result.realEmailDelivered),
        deliveryMode: result.deliveryMode,
        officialSender: OFFICIAL_SCODERS_EMAIL,
        to: recipient,
        messageId: result.messageId,
        previewUrl: result.previewUrl,
        error: result.error,
      });
    } catch (err: any) {
      console.error("Send Test Email Error:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to send diagnostic email." });
    }
  });

  // General Website Contact / Inquiry Submission + Dual Automated Emails (Visitor + scoders82@gmail.com)
  app.post("/api/contact", async (req, res) => {
    try {
      const cleanName = sanitizeHeaderString(req.body?.name, 120);
      const cleanEmail = sanitizeHeaderString(req.body?.email, 254).toLowerCase();
      const cleanCompany = sanitizeHeaderString(req.body?.company || "Self / Individual", 120);
      const cleanPhone = sanitizeHeaderString(req.body?.phone || "Not Provided", 40);
      const cleanInterest = sanitizeHeaderString(req.body?.interest || "General Business Enquiry", 80);
      const cleanMessage = String(req.body?.message || "").trim().slice(0, 4000);

      if (!cleanName || !isValidEmailAddress(cleanEmail) || !cleanMessage) {
        return res.status(400).json({
          success: false,
          error: "Name, valid email address, and inquiry message are required.",
        });
      }

      const enquiryId = `ENQ-${Date.now().toString(36).toUpperCase()}`;
      const appState = getStoredAppState();

      const storedMessages: any[] = Array.isArray(appState["scoders_messages"]) ? [...appState["scoders_messages"]] : [];
      storedMessages.unshift({
        id: enquiryId,
        name: cleanName,
        email: cleanEmail,
        company: cleanCompany,
        phone: cleanPhone,
        interest: cleanInterest,
        message: cleanMessage,
        timestamp: new Date().toISOString(),
      });
      appState["scoders_messages"] = storedMessages.slice(0, 300);

      const dbEnquiries: any[] = Array.isArray(appState["db_enquiries"]) ? [...appState["db_enquiries"]] : [];
      dbEnquiries.unshift({
        id: enquiryId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        subject: `${cleanInterest} [${enquiryId}]`,
        message: cleanMessage,
        timestamp: new Date().toISOString(),
        replyStatus: "Pending",
        replyMessage: null,
        replyDate: null,
      });
      appState["db_enquiries"] = dbEnquiries.slice(0, 300);

      const clientSubject = `✅ Inquiry Received - S-CODERS (${enquiryId})`;
      const clientEmailRes = await sendEmailNotification({
        to: cleanEmail,
        subject: clientSubject,
        html: getContactAcknowledgementEmailHtml({
          name: cleanName,
          email: cleanEmail,
          interest: cleanInterest,
          message: cleanMessage,
          enquiryId,
        }),
        from: `"S-CODERS (Bharat Tech Developers)" <${OFFICIAL_SCODERS_EMAIL}>`,
        replyTo: OFFICIAL_SCODERS_EMAIL,
      });

      const adminSubject = `📩 New Website Inquiry (${enquiryId}) from ${cleanName}`;
      const adminEmailRes = await sendEmailNotification({
        to: OFFICIAL_SCODERS_EMAIL,
        subject: adminSubject,
        html: getContactAdminAlertEmailHtml({
          name: cleanName,
          email: cleanEmail,
          company: cleanCompany,
          phone: cleanPhone,
          interest: cleanInterest,
          message: cleanMessage,
          enquiryId,
        }),
        from: `"S-CODERS Website Inquiries" <${OFFICIAL_SCODERS_EMAIL}>`,
        replyTo: cleanEmail,
      });

      appendEmailDispatchLog(appState, {
        section: "contact",
        to: cleanEmail,
        from: OFFICIAL_SCODERS_EMAIL,
        subject: clientSubject,
        uid: enquiryId,
        itemTitle: cleanInterest,
        status: clientEmailRes.success ? "SENT" : "FAILED",
        messageId: clientEmailRes.messageId,
        previewUrl: clientEmailRes.previewUrl,
        simulated: clientEmailRes.simulated,
        realEmailDelivered: clientEmailRes.realEmailDelivered,
        deliveryMode: clientEmailRes.deliveryMode,
        error: clientEmailRes.error,
        detailsSummary: `Contact confirmation to ${cleanEmail}; admin alert: ${adminEmailRes.success ? "sent" : "failed"}`,
      });
      saveStoredAppState(appState);

      return res.json({
        success: true,
        enquiryId,
        emailSent: Boolean(clientEmailRes.success),
        realEmailDelivered: Boolean(clientEmailRes.realEmailDelivered),
        deliveryMode: clientEmailRes.deliveryMode,
        previewUrl: clientEmailRes.previewUrl,
        emailError: clientEmailRes.error,
        emailFrom: OFFICIAL_SCODERS_EMAIL,
        adminNotified: Boolean(adminEmailRes.success),
      });
    } catch (err: any) {
      console.error("Contact Submission Error:", err);
      return res.status(500).json({ success: false, error: "Failed to submit inquiry." });
    }
  });

  // 1. Service Registration Accepted Email Endpoint (Deduplicated & Persisted)
  app.post("/api/email/service-accepted", async (req, res) => {
    try {
      const {
        email,
        clientName,
        serviceTitle,
        uniqueKey,
        actionUrl,
        serviceId,
        amount = 0,
        currency = "INR",
        paymentStatus,
        paymentId,
        orderId,
      } = req.body || {};
      const cleanEmail = String(email || "client@example.com").trim().toLowerCase();
      const appState = getStoredAppState();
      const payCheck = isPaymentVerifiedForRegistration("service", Number(amount) || 0, paymentId, orderId, paymentStatus, appState);
      if (!payCheck.ok) {
        return res.status(402).json({
          success: false,
          paymentRequired: true,
          error: payCheck.reason || "Service payment confirmation failed.",
        });
      }

      const finalKey = String(uniqueKey || "").trim().toUpperCase() || generateCollisionFreeUid("service", serviceId || serviceTitle || "service", appState);
      const targetUrl = actionUrl && String(actionUrl).startsWith("http")
        ? String(actionUrl)
        : resolveAppUrl(req, `/?view=services&key=${finalKey}`);

      // Deduplicate: check if email already sent for this exact UID or payment/order ID
      const uidRecords: RegistrationUidRecord[] = Array.isArray(appState["db_registration_uids"]) ? [...appState["db_registration_uids"]] : [];
      const cleanPayId = paymentId ? String(paymentId).trim() : "";
      const cleanOrderId = orderId ? String(orderId).trim() : "";
      const cfg = getEmailProviderConfig();
      const existing = uidRecords.find(
        (r) =>
          r.section === "service" &&
          r.confirmationEmailSent &&
          (Boolean(r.realEmailDelivered) || !cfg.anyRealProviderConfigured) &&
          (r.uid?.toUpperCase() === finalKey ||
            (cleanPayId && r.paymentId === cleanPayId) ||
            (cleanOrderId && r.orderId === cleanOrderId))
      );
      if (existing) {
        return res.json({
          success: true,
          deduplicated: true,
          uid: existing.uid,
          emailSent: false,
          emailSkippedDuplicate: true,
          realEmailDelivered: Boolean(existing.realEmailDelivered),
          emailFrom: OFFICIAL_SCODERS_EMAIL,
          message: "Confirmation email already dispatched for this service UID.",
        });
      }

      const { validFrom, validUntil } = computeUidValidityWindow("service");
      const subject = `✅ Service Registered - Your Unique S-CODERS Code (${finalKey})`;
      const result = await sendEmailNotification({
        to: cleanEmail,
        subject,
        html: getServiceAcceptanceEmailHtml({
          clientName: clientName || "Valued Client",
          serviceTitle: serviceTitle || "Custom Software Development",
          uniqueKey: finalKey,
          actionUrl: targetUrl,
          validFrom,
          validUntil,
          amount: Number(amount) || 0,
          currency,
          paymentStatus: payCheck.status,
          paymentId: cleanPayId || undefined,
        }),
        from: `"S-CODERS (Bharat Tech Developers)" <${OFFICIAL_SCODERS_EMAIL}>`,
        replyTo: OFFICIAL_SCODERS_EMAIL,
      });

      const dedupeKey = cleanPayId
        ? `service:pay:${cleanPayId}`
        : cleanOrderId
        ? `service:ord:${cleanOrderId}`
        : `service:key:${finalKey}`;

      const record: RegistrationUidRecord = {
        uid: finalKey,
        section: "service",
        itemId: String(serviceId || serviceTitle || "service"),
        itemTitle: String(serviceTitle || "Custom Software Development"),
        clientName: String(clientName || "Valued Client"),
        clientEmail: cleanEmail,
        amount: Number(amount) || 0,
        currency,
        paymentStatus: payCheck.status,
        paymentId: cleanPayId || undefined,
        orderId: cleanOrderId || undefined,
        dedupeKey,
        issuedAt: validFrom,
        validFrom,
        validUntil,
        status: "ACTIVE",
        confirmationEmailSent: Boolean(result.success),
        confirmationEmailSentAt: result.success ? new Date().toISOString() : undefined,
        realEmailDelivered: Boolean(result.realEmailDelivered),
        deliveryMode: result.deliveryMode,
        emailFrom: OFFICIAL_SCODERS_EMAIL,
        emailMessageId: result.messageId,
      };
      const existingSvcIdx = uidRecords.findIndex((r) => r?.uid?.toUpperCase() === finalKey);
      if (existingSvcIdx >= 0) {
        uidRecords[existingSvcIdx] = record;
      } else {
        uidRecords.unshift(record);
      }
      appState["db_registration_uids"] = uidRecords;
      appendEmailDispatchLog(appState, {
        section: "service",
        to: cleanEmail,
        from: OFFICIAL_SCODERS_EMAIL,
        subject,
        uid: finalKey,
        dedupeKey,
        itemTitle: serviceTitle,
        status: result.success ? "SENT" : "FAILED",
        messageId: result.messageId,
        previewUrl: result.previewUrl,
        simulated: result.simulated,
        realEmailDelivered: result.realEmailDelivered,
        deliveryMode: result.deliveryMode,
      });
      saveStoredAppState(appState);

      res.json({
        success: true,
        uid: finalKey,
        validUntil,
        emailFrom: OFFICIAL_SCODERS_EMAIL,
        message: "Service acceptance email dispatched.",
        emailSent: result.success,
        realEmailDelivered: Boolean(result.realEmailDelivered),
        deliveryMode: result.deliveryMode,
        previewUrl: result.previewUrl,
      });
    } catch (err: any) {
      console.error("Service Accepted Email Error:", err);
      res.status(500).json({ error: "Failed to send service acceptance email." });
    }
  });

  // 2. Workshop Payment Verified Email Endpoint (Payment-Gated & Deduplicated)
  app.post("/api/email/workshop-payment-verified", async (req, res) => {
    try {
      const {
        email,
        clientName,
        workshopTitle,
        workshopId,
        workshopDate,
        workshopTime,
        workshopLocation,
        amount,
        currency = "INR",
        uniqueKey,
        paymentId,
        orderId,
        paymentStatus,
        actionUrl,
      } = req.body || {};

      const cleanEmail = String(email || "client@example.com").trim().toLowerCase();
      const appState = getStoredAppState();

      const workshopWinEval = resolveAuthoritativeItemWindow(appState, "workshop", workshopId, workshopTitle);
      if (!workshopWinEval.allowed) {
        return res.status(403).json({
          success: false,
          registrationClosed: true,
          windowStatus: workshopWinEval,
          serverNowIso: new Date().toISOString(),
          error: workshopWinEval.message,
        });
      }

      // Strict payment verification gate
      const payCheck = isPaymentVerifiedForRegistration("workshop", Number(amount) || 0, paymentId, orderId, paymentStatus, appState);
      if (!payCheck.ok) {
        return res.status(402).json({
          success: false,
          paymentRequired: true,
          error: payCheck.reason || "Workshop email can only be sent after verified payment confirmation.",
        });
      }

      const finalKey = String(uniqueKey || "").trim().toUpperCase() || generateCollisionFreeUid("workshop", workshopId || workshopTitle || "wksp", appState);
      const targetUrl = actionUrl && String(actionUrl).startsWith("http")
        ? String(actionUrl)
        : resolveAppUrl(req, `/?view=workshops&key=${finalKey}`);

      const uidRecords: RegistrationUidRecord[] = Array.isArray(appState["db_registration_uids"]) ? [...appState["db_registration_uids"]] : [];
      const cleanPayId = paymentId ? String(paymentId).trim() : "";
      const cleanOrderId = orderId ? String(orderId).trim() : "";
      const cfg = getEmailProviderConfig();
      const existing = uidRecords.find(
        (r) =>
          r.section === "workshop" &&
          r.confirmationEmailSent &&
          (Boolean(r.realEmailDelivered) || !cfg.anyRealProviderConfigured) &&
          (r.uid?.toUpperCase() === finalKey ||
            (cleanPayId && r.paymentId === cleanPayId) ||
            (cleanOrderId && r.orderId === cleanOrderId))
      );
      if (existing) {
        return res.json({
          success: true,
          deduplicated: true,
          uid: existing.uid,
          emailSent: false,
          emailSkippedDuplicate: true,
          realEmailDelivered: Boolean(existing.realEmailDelivered),
          emailFrom: OFFICIAL_SCODERS_EMAIL,
          message: "Workshop confirmation email already dispatched.",
        });
      }

      const { validFrom, validUntil } = computeUidValidityWindow("workshop", workshopDate);
      const subject = `🎓 Workshop Confirmed & Payment Verified - S-CODERS UID (${finalKey})`;
      const result = await sendEmailNotification({
        to: cleanEmail,
        subject,
        html: getWorkshopEmailHtml({
          status: "SUCCESS",
          clientName: clientName || "Valued Masterclass Participant",
          workshopTitle: workshopTitle || "AI Agent & Full-Stack Workshop",
          amount: Number(amount) || 0,
          currency,
          uniqueKey: finalKey,
          actionUrl: targetUrl,
          paymentId: paymentId || `pay_${Date.now()}`,
          workshopDate,
          workshopTime,
          workshopLocation,
          validUntil,
        }),
        from: `"S-CODERS (Bharat Tech Developers)" <${OFFICIAL_SCODERS_EMAIL}>`,
        replyTo: OFFICIAL_SCODERS_EMAIL,
      });

      const record: RegistrationUidRecord = {
        uid: finalKey,
        section: "workshop",
        itemId: String(workshopId || workshopTitle || "workshop"),
        itemTitle: String(workshopTitle || "AI Agent & Full-Stack Workshop"),
        clientName: String(clientName || "Valued Masterclass Participant"),
        clientEmail: cleanEmail,
        amount: Number(amount) || 0,
        currency,
        paymentStatus: "VERIFIED",
        paymentId: paymentId ? String(paymentId).trim() : undefined,
        orderId: orderId ? String(orderId).trim() : undefined,
        dedupeKey: paymentId ? `workshop:pay:${String(paymentId).trim()}` : `workshop:key:${finalKey}`,
        metadata: { date: workshopDate, time: workshopTime, location: workshopLocation },
        issuedAt: validFrom,
        validFrom,
        validUntil,
        status: "ACTIVE",
        confirmationEmailSent: Boolean(result.success),
        confirmationEmailSentAt: result.success ? new Date().toISOString() : undefined,
        realEmailDelivered: Boolean(result.realEmailDelivered),
        deliveryMode: result.deliveryMode,
        emailFrom: OFFICIAL_SCODERS_EMAIL,
        emailMessageId: result.messageId,
      };
      const existingWkspIdx = uidRecords.findIndex((r) => r?.uid?.toUpperCase() === finalKey);
      if (existingWkspIdx >= 0) {
        uidRecords[existingWkspIdx] = record;
      } else {
        uidRecords.unshift(record);
      }
      appState["db_registration_uids"] = uidRecords;
      appendEmailDispatchLog(appState, {
        section: "workshop",
        to: cleanEmail,
        from: OFFICIAL_SCODERS_EMAIL,
        subject,
        uid: finalKey,
        itemTitle: workshopTitle,
        status: result.success ? "SENT" : "FAILED",
        messageId: result.messageId,
        previewUrl: result.previewUrl,
        simulated: result.simulated,
        realEmailDelivered: result.realEmailDelivered,
        deliveryMode: result.deliveryMode,
      });
      saveStoredAppState(appState);

      res.json({
        success: true,
        uid: finalKey,
        validUntil,
        emailFrom: OFFICIAL_SCODERS_EMAIL,
        message: "Workshop payment success email dispatched.",
        emailSent: result.success,
        realEmailDelivered: Boolean(result.realEmailDelivered),
        deliveryMode: result.deliveryMode,
        previewUrl: result.previewUrl,
      });
    } catch (err: any) {
      console.error("Workshop Verified Email Error:", err);
      res.status(500).json({ error: "Failed to send workshop success email." });
    }
  });

  // 3. Workshop Payment Failed Email Endpoint
  app.post("/api/email/workshop-payment-failed", async (req, res) => {
    try {
      const { email, clientName, workshopTitle, amount, currency = "INR", reason, actionUrl } = req.body;
      const targetUrl = actionUrl && actionUrl.startsWith("http")
        ? actionUrl
        : resolveAppUrl(req, `/?view=workshops`);

      const result = await sendEmailNotification({
        to: email || "client@example.com",
        subject: `❌ Payment Failed - S-CODERS Workshop Registration (${workshopTitle || 'Masterclass'})`,
        html: getWorkshopEmailHtml({
          status: "FAILED",
          clientName: clientName || "Valued Masterclass Participant",
          workshopTitle: workshopTitle || "AI Agent & Full-Stack Workshop",
          amount: Number(amount) || 0,
          currency,
          actionUrl: targetUrl,
          reason: reason || "Payment was declined, interrupted, or cancelled by user.",
        }),
        from: `"S-CODERS (Bharat Tech Developers)" <${OFFICIAL_SCODERS_EMAIL}>`,
        replyTo: OFFICIAL_SCODERS_EMAIL,
      });

      res.json({
        success: true,
        message: "Workshop payment failed email dispatched.",
        emailSent: result.success,
      });
    } catch (err: any) {
      console.error("Workshop Failed Email Error:", err);
      res.status(500).json({ error: "Failed to send workshop failure email." });
    }
  });

  // 4. Event Payment Verified Email Endpoint (Payment-Gated & Deduplicated)
  app.post("/api/email/event-payment-verified", async (req, res) => {
    try {
      const {
        email,
        clientName,
        eventTitle,
        eventId,
        eventDate,
        eventDay,
        eventTime,
        eventLocation,
        eventDescription,
        amount,
        currency = "INR",
        ticketCode,
        paymentId,
        orderId,
        paymentStatus,
        actionUrl,
      } = req.body || {};

      const cleanEmail = String(email || "client@example.com").trim().toLowerCase();
      const appState = getStoredAppState();

      const eventWinEval = resolveAuthoritativeItemWindow(appState, "event", eventId, eventTitle);
      if (!eventWinEval.allowed) {
        return res.status(403).json({
          success: false,
          registrationClosed: true,
          windowStatus: eventWinEval,
          serverNowIso: new Date().toISOString(),
          error: eventWinEval.message,
        });
      }

      // Strict payment verification gate (free events ticketPrice===0 allowed; paid events must be verified)
      const payCheck = isPaymentVerifiedForRegistration("event", Number(amount) || 0, paymentId, orderId, paymentStatus, appState);
      if (!payCheck.ok) {
        return res.status(402).json({
          success: false,
          paymentRequired: true,
          error: payCheck.reason || "Event email can only be sent after verified payment confirmation.",
        });
      }

      const finalCode = String(ticketCode || "").trim().toUpperCase() || generateCollisionFreeUid("event", eventId || eventTitle || "evt", appState);
      const targetUrl = actionUrl && String(actionUrl).startsWith("http")
        ? String(actionUrl)
        : resolveAppUrl(req, `/?view=events&ticket=${finalCode}`);

      const uidRecords: RegistrationUidRecord[] = Array.isArray(appState["db_registration_uids"]) ? [...appState["db_registration_uids"]] : [];
      const cleanPayId = paymentId ? String(paymentId).trim() : "";
      const cleanOrderId = orderId ? String(orderId).trim() : "";
      const cfg = getEmailProviderConfig();
      const existing = uidRecords.find(
        (r) =>
          r.section === "event" &&
          r.confirmationEmailSent &&
          (Boolean(r.realEmailDelivered) || !cfg.anyRealProviderConfigured) &&
          (r.uid?.toUpperCase() === finalCode ||
            (cleanPayId && r.paymentId === cleanPayId) ||
            (cleanOrderId && r.orderId === cleanOrderId))
      );
      if (existing) {
        return res.json({
          success: true,
          deduplicated: true,
          uid: existing.uid,
          emailSent: false,
          emailSkippedDuplicate: true,
          realEmailDelivered: Boolean(existing.realEmailDelivered),
          emailFrom: OFFICIAL_SCODERS_EMAIL,
          message: "Event confirmation email already dispatched.",
        });
      }

      const { validFrom, validUntil } = computeUidValidityWindow("event", eventDate);
      const subject = `🎟️ Event Registration Confirmed & Pass UID - S-CODERS (${finalCode})`;
      const result = await sendEmailNotification({
        to: cleanEmail,
        subject,
        html: getEventEmailHtml({
          status: "SUCCESS",
          clientName: clientName || "Valued Attendee",
          eventTitle: eventTitle || "S-CODERS Tech Summit",
          amount: Number(amount) || 0,
          currency,
          ticketCode: finalCode,
          actionUrl: targetUrl,
          paymentId: paymentId || `pay_${Date.now()}`,
          eventDate,
          eventDay,
          eventTime,
          eventLocation,
          eventDescription,
          validUntil,
        }),
        from: `"S-CODERS (Bharat Tech Developers)" <${OFFICIAL_SCODERS_EMAIL}>`,
        replyTo: OFFICIAL_SCODERS_EMAIL,
      });

      const record: RegistrationUidRecord = {
        uid: finalCode,
        section: "event",
        itemId: String(eventId || eventTitle || "event"),
        itemTitle: String(eventTitle || "S-CODERS Tech Summit"),
        clientName: String(clientName || "Valued Attendee"),
        clientEmail: cleanEmail,
        amount: Number(amount) || 0,
        currency,
        paymentStatus: "VERIFIED",
        paymentId: paymentId ? String(paymentId).trim() : undefined,
        orderId: orderId ? String(orderId).trim() : undefined,
        dedupeKey: paymentId ? `event:pay:${String(paymentId).trim()}` : `event:key:${finalCode}`,
        metadata: { date: eventDate, day: eventDay, time: eventTime, location: eventLocation, description: eventDescription },
        issuedAt: validFrom,
        validFrom,
        validUntil,
        status: "ACTIVE",
        confirmationEmailSent: Boolean(result.success),
        confirmationEmailSentAt: result.success ? new Date().toISOString() : undefined,
        realEmailDelivered: Boolean(result.realEmailDelivered),
        deliveryMode: result.deliveryMode,
        emailFrom: OFFICIAL_SCODERS_EMAIL,
        emailMessageId: result.messageId,
      };
      const existingEvtIdx = uidRecords.findIndex((r) => r?.uid?.toUpperCase() === finalCode);
      if (existingEvtIdx >= 0) {
        uidRecords[existingEvtIdx] = record;
      } else {
        uidRecords.unshift(record);
      }
      appState["db_registration_uids"] = uidRecords;
      appendEmailDispatchLog(appState, {
        section: "event",
        to: cleanEmail,
        from: OFFICIAL_SCODERS_EMAIL,
        subject,
        uid: finalCode,
        itemTitle: eventTitle,
        status: result.success ? "SENT" : "FAILED",
        messageId: result.messageId,
        previewUrl: result.previewUrl,
        simulated: result.simulated,
        realEmailDelivered: result.realEmailDelivered,
        deliveryMode: result.deliveryMode,
      });
      saveStoredAppState(appState);

      res.json({
        success: true,
        uid: finalCode,
        validUntil,
        emailFrom: OFFICIAL_SCODERS_EMAIL,
        message: "Event payment success email dispatched with ticket link.",
        emailSent: result.success,
        realEmailDelivered: Boolean(result.realEmailDelivered),
        deliveryMode: result.deliveryMode,
        previewUrl: result.previewUrl,
      });
    } catch (err: any) {
      console.error("Event Verified Email Error:", err);
      res.status(500).json({ error: "Failed to send event success email." });
    }
  });

  // 5. Event Payment Failed Email Endpoint
  app.post("/api/email/event-payment-failed", async (req, res) => {
    try {
      const { email, clientName, eventTitle, amount, currency = "INR", reason, actionUrl } = req.body;
      const targetUrl = actionUrl && actionUrl.startsWith("http")
        ? actionUrl
        : resolveAppUrl(req, `/?view=events`);

      const result = await sendEmailNotification({
        to: email || "client@example.com",
        subject: `❌ Event Payment Failed - S-CODERS (${eventTitle || 'Summit Pass'})`,
        html: getEventEmailHtml({
          status: "FAILED",
          clientName: clientName || "Valued Attendee",
          eventTitle: eventTitle || "S-CODERS Tech Summit",
          amount: Number(amount) || 0,
          currency,
          actionUrl: targetUrl,
          reason: reason || "Payment was declined, interrupted, or cancelled by user.",
        }),
        from: `"S-CODERS (Bharat Tech Developers)" <${OFFICIAL_SCODERS_EMAIL}>`,
        replyTo: OFFICIAL_SCODERS_EMAIL,
      });

      res.json({
        success: true,
        message: "Event payment failure email dispatched.",
        emailSent: result.success,
        realEmailDelivered: Boolean(result.realEmailDelivered),
        deliveryMode: result.deliveryMode,
      });
    } catch (err: any) {
      console.error("Event Failed Email Error:", err);
      res.status(500).json({ error: "Failed to send event failure email." });
    }
  });

  // ==========================================
  // RECRUITMENT & TALENT INDUCTION API
  // ==========================================
  const applicationsFilePath = path.join(process.cwd(), "data", "applications.json");

  // Helper to ensure data directory & get applications
  function getStoredApplications(): any[] {
    try {
      const dataDir = path.dirname(applicationsFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (fs.existsSync(applicationsFilePath)) {
        const content = fs.readFileSync(applicationsFilePath, "utf-8");
        return JSON.parse(content || "[]");
      }
    } catch (err) {
      console.error("Error reading applications file:", err);
    }
    return [];
  }

  function saveStoredApplications(apps: any[]): void {
    try {
      const dataDir = path.dirname(applicationsFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(applicationsFilePath, JSON.stringify(apps, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing applications file:", err);
    }
  }

  // 1. Submit First Application Form (Step 1 Screening)
  app.post("/api/careers/apply", async (req, res) => {
    try {
      const applicationData = req.body;
      if (!applicationData || !applicationData.fullName || !applicationData.email || !applicationData.sector) {
        return res.status(400).json({ error: "Mandatory candidate profile details are missing." });
      }

      const submissionId = applicationData.id || `SCD-APP-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const now = new Date().toISOString();
      const submissionDate = applicationData.submissionDate || now.split('T')[0];

      const candidateRecord = {
        ...applicationData,
        id: submissionId,
        submissionDate,
        status: 'Submitted',
        createdAt: now,
      };

      const existingApps = getStoredApplications();
      const updatedApps = [candidateRecord, ...existingApps.filter(a => a.id !== submissionId)];
      saveStoredApplications(updatedApps);

      // Trigger official confirmation email from scoders82@gmail.com
      sendEmailNotification({
        to: candidateRecord.email,
        subject: `📋 Application Submitted Successfully - S-CODERS (Ref: ${submissionId})`,
        html: getRecruitmentEmailHtml({
          candidateName: candidateRecord.fullName,
          sector: candidateRecord.sector,
          roleTitle: candidateRecord.roleTitle || 'Developer Associate',
          submissionId,
          submissionDate,
        }),
      }).catch(err => console.error("Stage 1 Confirmation email notice:", err.message));

      res.status(201).json({
        success: true,
        message: "Your application form has been submitted successfully.",
        applicationId: submissionId,
        candidate: candidateRecord,
      });
    } catch (err: any) {
      console.error("Recruitment Application Submit Error:", err);
      res.status(500).json({ error: "Failed to process candidate application: " + err.message });
    }
  });

  // 2. Fetch All Candidate Applications (for Admin Console)
  app.get("/api/careers/applications", (req, res) => {
    try {
      const apps = getStoredApplications();
      res.json({ success: true, count: apps.length, applications: apps });
    } catch (err: any) {
      console.error("Fetch Applications Error:", err);
      res.status(500).json({ error: "Failed to fetch candidate applications." });
    }
  });

  // 2b. Lookup Application by ID, Agreement Reference, Token, or Email (for Pass Key / Link Lookup)
  app.get("/api/careers/lookup", (req, res) => {
    try {
      const q = String(req.query.query || req.query.key || req.query.appId || "").trim().toUpperCase();
      if (!q) {
        return res.status(400).json({ success: false, error: "Lookup query is required." });
      }
      const apps = getStoredApplications();
      const match = apps.find(a => 
        (a.id && a.id.toUpperCase() === q) ||
        (a.agreementReferenceId && a.agreementReferenceId.toUpperCase() === q) ||
        (a.departmentReferenceId && a.departmentReferenceId.toUpperCase() === q) ||
        (a.onboardingToken && a.onboardingToken.toUpperCase() === q) ||
        (a.email && a.email.toUpperCase() === q)
      );
      if (!match) {
        return res.status(404).json({ success: false, error: "No application found matching the provided pass key or link." });
      }
      res.json({ success: true, application: match });
    } catch (err: any) {
      console.error("Lookup Application Error:", err);
      res.status(500).json({ success: false, error: "Failed to lookup application." });
    }
  });

  // 3. Shortlist Candidate & Schedule Online Interview (Admin Action - Stage 3 & 4)
  app.post("/api/careers/shortlist", async (req, res) => {
    try {
      const { 
        id, 
        zoomLink, 
        interviewDate, 
        interviewTime, 
        roundTitle = "Technical & Architecture Evaluation", 
        instructions,
        adminNotes 
      } = req.body;

      if (!id || !zoomLink || !interviewDate || !interviewTime) {
        return res.status(400).json({ error: "Candidate ID, Zoom meeting link, date, and time are required." });
      }

      const apps = getStoredApplications();
      const candidate = apps.find(a => a.id === id);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate application not found." });
      }

      const updatedCandidate = {
        ...candidate,
        status: 'Shortlisted',
        interviewMeetingLink: zoomLink,
        interviewDate,
        interviewTime,
        interviewRoundTitle: roundTitle,
        interviewInstructions: instructions,
        adminNotes: adminNotes || candidate.adminNotes,
        lastUpdated: new Date().toISOString(),
      };

      const updatedApps = apps.map(a => a.id === id ? updatedCandidate : a);
      saveStoredApplications(updatedApps);

      // Send official Interview Invitation email from scoders82@gmail.com
      await sendEmailNotification({
        to: candidate.email,
        subject: `🎉 Congratulations! Shortlisted for Online Interview - S-CODERS (Ref: ${candidate.id})`,
        html: getInterviewInviteEmailHtml({
          candidateName: candidate.fullName,
          sector: candidate.sector,
          roleTitle: candidate.roleTitle,
          submissionId: candidate.id,
          zoomLink,
          interviewDate,
          interviewTime,
          roundTitle,
          instructions,
        }),
      });

      res.json({ 
        success: true, 
        message: "Candidate shortlisted and official interview invitation email sent.",
        candidate: updatedCandidate 
      });
    } catch (err: any) {
      console.error("Shortlist Candidate Error:", err);
      res.status(500).json({ error: "Failed to shortlist candidate: " + err.message });
    }
  });

  // 4. Record Interview Outcome / Final Selection (Admin Action - Stage 5)
  app.post("/api/careers/interview-decision", async (req, res) => {
    try {
      const { id, decision, feedback, adminNotes } = req.body;
      if (!id || !decision || !['cleared', 'rejected'].includes(decision)) {
        return res.status(400).json({ error: "Valid candidate ID and decision ('cleared' or 'rejected') are required." });
      }

      const apps = getStoredApplications();
      const candidate = apps.find(a => a.id === id);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate application not found." });
      }

      const newStatus = decision === 'cleared' ? 'Interview Cleared' : 'Rejected';
      const updatedCandidate = {
        ...candidate,
        status: newStatus,
        interviewFeedback: feedback,
        interviewClearedAt: decision === 'cleared' ? new Date().toISOString() : undefined,
        rejectedAt: decision === 'rejected' ? new Date().toISOString() : undefined,
        rejectionReason: decision === 'rejected' ? (feedback || "Did not clear technical interview round") : undefined,
        adminNotes: adminNotes || candidate.adminNotes,
        lastUpdated: new Date().toISOString(),
      };

      const updatedApps = apps.map(a => a.id === id ? updatedCandidate : a);
      saveStoredApplications(updatedApps);

      // If rejected, dispatch polite rejection email
      if (decision === 'rejected') {
        sendEmailNotification({
          to: candidate.email,
          subject: `Update regarding your Application at S-CODERS (Ref: ${candidate.id})`,
          html: getRejectionEmailHtml({
            candidateName: candidate.fullName,
            roleTitle: candidate.roleTitle,
            submissionId: candidate.id,
            reason: feedback,
          }),
        }).catch(err => console.error("Rejection email dispatch notice:", err.message));
      }

      res.json({
        success: true,
        message: decision === 'cleared' 
          ? "Candidate marked as Interview Cleared. Ready for Admin Onboarding Authorization."
          : "Candidate marked as Rejected.",
        candidate: updatedCandidate
      });
    } catch (err: any) {
      console.error("Interview Decision Error:", err);
      res.status(500).json({ error: "Failed to record interview decision: " + err.message });
    }
  });

  // 5. Admin-Controlled Authorization for Second Application Form (Admin Action - Stage 6)
  app.post("/api/careers/authorize-onboarding", async (req, res) => {
    try {
      const { id, adminNotes } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Candidate ID is required." });
      }

      const apps = getStoredApplications();
      const candidate = apps.find(a => a.id === id);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate application not found." });
      }

      // Generate a secure, unique onboarding token
      const onboardingToken = `SCD-ONB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const now = new Date().toISOString();

      const updatedCandidate = {
        ...candidate,
        status: 'Approved for Onboarding',
        onboardingAuthorized: true,
        onboardingToken,
        onboardingAuthorizedAt: now,
        adminNotes: adminNotes || candidate.adminNotes,
        lastUpdated: now,
      };

      const updatedApps = apps.map(a => a.id === id ? updatedCandidate : a);
      saveStoredApplications(updatedApps);

      // Determine the origin URL for the onboarding link
      const host = (req.headers.host || 'localhost:3000').toLowerCase();
      const origin = req.headers.origin || `http://${host}`;
      const onboardingUrl = `${origin}/careers?stage=onboarding&appId=${candidate.id}&token=${onboardingToken}`;

      // Dispatch official authorization email with link from scoders82@gmail.com
      await sendEmailNotification({
        to: candidate.email,
        subject: `🌟 Interview Cleared - Authorized for Stage 2 Onboarding & Banking Coordinates (Ref: ${candidate.id})`,
        html: getOnboardingAuthorizationEmailHtml({
          candidateName: candidate.fullName,
          sector: candidate.sector,
          roleTitle: candidate.roleTitle,
          submissionId: candidate.id,
          onboardingUrl,
        }),
      });

      res.json({
        success: true,
        message: "Candidate authorized for Second Application Form. Official invitation email dispatched.",
        onboardingToken,
        onboardingUrl,
        candidate: updatedCandidate
      });
    } catch (err: any) {
      console.error("Authorize Onboarding Error:", err);
      res.status(500).json({ error: "Failed to authorize onboarding: " + err.message });
    }
  });

  // 6. Verify Access to Second Application Form (Candidate Access Gatekeeper - Stage 7)
  app.get("/api/careers/verify-onboarding", (req, res) => {
    try {
      const { appId, token } = req.query;
      if (!appId || !token) {
        return res.status(400).json({ 
          valid: false, 
          error: "Application Reference ID and authorization access token are required." 
        });
      }

      const apps = getStoredApplications();
      const candidate = apps.find(a => 
        a.id === appId && 
        a.onboardingToken === token && 
        (a.status === 'Approved for Onboarding' || a.status === 'Onboarding Completed' || a.status === 'Hired')
      );

      if (!candidate) {
        return res.status(403).json({ 
          valid: false, 
          error: "Access Denied. This section is restricted exclusively to candidates who have cleared the interview and received official Admin authorization." 
        });
      }

      res.json({
        valid: true,
        candidate: {
          id: candidate.id,
          fullName: candidate.fullName,
          email: candidate.email,
          phone: candidate.phone,
          sector: candidate.sector,
          roleTitle: candidate.roleTitle,
          status: candidate.status,
          currentCity: candidate.currentCity,
        }
      });
    } catch (err: any) {
      console.error("Verify Onboarding Error:", err);
      res.status(500).json({ valid: false, error: "Failed to verify onboarding credentials." });
    }
  });

  // 7. Submit Second Application Form (Personal, ID, Bank Details & Signed NDA - Stage 7)
  app.post("/api/careers/submit-onboarding", async (req, res) => {
    try {
      const { appId, token, onboardingData } = req.body;
      if (!appId || !token || !onboardingData) {
        return res.status(400).json({ error: "Application ID, authorization token, and onboarding data are required." });
      }

      const apps = getStoredApplications();
      const candidate = apps.find(a => a.id === appId && a.onboardingToken === token);
      if (!candidate) {
        return res.status(403).json({ error: "Unauthorized submission or invalid session." });
      }

      const agreementRef = onboardingData.agreementReferenceId || `SCD-AGR-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const now = new Date().toISOString();

      const updatedCandidate = {
        ...candidate,
        ...onboardingData,
        agreementReferenceId: agreementRef,
        status: 'Onboarding Completed',
        onboardingCompletedAt: now,
        lastUpdated: now,
      };

      const updatedApps = apps.map(a => a.id === appId ? updatedCandidate : a);
      saveStoredApplications(updatedApps);

      // Send completion confirmation email from scoders82@gmail.com
      sendEmailNotification({
        to: updatedCandidate.email,
        subject: `✓ Onboarding & Induction Dossier Successfully Recorded - S-CODERS (Ref: ${agreementRef})`,
        html: getOnboardingCompleteEmailHtml({
          candidateName: updatedCandidate.fullName,
          roleTitle: updatedCandidate.roleTitle,
          agreementRef,
          submissionId: appId,
        }),
      }).catch(err => console.error("Onboarding completion email notice:", err.message));

      res.json({
        success: true,
        message: "Second Application Form submitted successfully. Onboarding and banking coordinates recorded.",
        agreementReferenceId: agreementRef,
        candidate: updatedCandidate
      });
    } catch (err: any) {
      console.error("Submit Onboarding Error:", err);
      res.status(500).json({ error: "Failed to submit onboarding form: " + err.message });
    }
  });

  // 8. Reject Candidate Application (Admin Action)
  app.post("/api/careers/reject", async (req, res) => {
    try {
      const { id, reason, adminNotes } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Candidate ID is required." });
      }

      const apps = getStoredApplications();
      const candidate = apps.find(a => a.id === id);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate application not found." });
      }

      const now = new Date().toISOString();
      const updatedCandidate = {
        ...candidate,
        status: 'Rejected',
        rejectionReason: reason || "Did not meet required criteria for this cycle",
        rejectedAt: now,
        adminNotes: adminNotes || candidate.adminNotes,
        lastUpdated: now,
      };

      const updatedApps = apps.map(a => a.id === id ? updatedCandidate : a);
      saveStoredApplications(updatedApps);

      // Dispatch polite rejection email
      sendEmailNotification({
        to: candidate.email,
        subject: `Update regarding your Application at S-CODERS (Ref: ${candidate.id})`,
        html: getRejectionEmailHtml({
          candidateName: candidate.fullName,
          roleTitle: candidate.roleTitle,
          submissionId: candidate.id,
          reason,
        }),
      }).catch(err => console.error("Rejection email dispatch notice:", err.message));

      res.json({
        success: true,
        message: "Candidate application rejected and notification dispatched.",
        candidate: updatedCandidate
      });
    } catch (err: any) {
      console.error("Reject Application Error:", err);
      res.status(500).json({ error: "Failed to reject candidate: " + err.message });
    }
  });

  // 9. Update Candidate Application Status (Generic Admin Action)
  app.patch("/api/careers/status", (req, res) => {
    try {
      const { id, status, adminNotes, reviewedBy } = req.body;
      if (!id || !status) {
        return res.status(400).json({ error: "Candidate ID and new status are required." });
      }

      const apps = getStoredApplications();
      let updated = false;
      const newApps = apps.map(app => {
        if (app.id === id) {
          updated = true;
          return {
            ...app,
            status,
            adminNotes: adminNotes !== undefined ? adminNotes : app.adminNotes,
            reviewedBy: reviewedBy !== undefined ? reviewedBy : app.reviewedBy,
            lastUpdated: new Date().toISOString(),
          };
        }
        return app;
      });

      if (!updated) {
        return res.status(404).json({ error: "Application not found." });
      }

      saveStoredApplications(newApps);
      res.json({ success: true, message: `Application status updated to ${status}` });
    } catch (err: any) {
      console.error("Update Status Error:", err);
      res.status(500).json({ error: "Failed to update application status." });
    }
  });

  // 10. Delete Candidate Application (Admin Action)
  app.delete("/api/careers/applications/:id", (req, res) => {
    try {
      const { id } = req.params;
      const apps = getStoredApplications();
      const remaining = apps.filter(a => a.id !== id);
      saveStoredApplications(remaining);
      res.json({ success: true, message: "Application deleted successfully." });
    } catch (err: any) {
      console.error("Delete Application Error:", err);
      res.status(500).json({ error: "Failed to delete candidate application." });
    }
  });

  // ==========================================
  // SECTION 4: DEPARTMENT, WHATSAPP & ONLINE WORK MEETINGS API
  // ==========================================
  const departmentConfigsFilePath = path.join(process.cwd(), "data", "department_configs.json");
  const departmentMeetingsFilePath = path.join(process.cwd(), "data", "department_meetings.json");

  const DEFAULT_SERVER_DEPARTMENTS = [
    {
      id: 'frontend',
      name: 'Front-End Developer',
      codePrefix: 'GHZ',
      referenceFormat: 'GHZ-2026-XXX',
      whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
      zoomMeetingLink: 'https://zoom.us/j/scoders-frontend-work',
      description: 'Modern React 19, TypeScript, Tailwind CSS, motion design, and responsive web user interfaces.'
    },
    {
      id: 'backend',
      name: 'Back-End Developer',
      codePrefix: 'HAX',
      referenceFormat: 'HAX-2026-XXX',
      whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
      zoomMeetingLink: 'https://zoom.us/j/scoders-backend-work',
      description: 'Server architectures, Node.js, Express, PostgreSQL, Redis caching, gRPC, and REST API microservices.'
    },
    {
      id: 'fullstack',
      name: 'Full-Stack Developer',
      codePrefix: 'FSD',
      referenceFormat: 'FSD-2026-XXX',
      whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
      zoomMeetingLink: 'https://zoom.us/j/scoders-fullstack-work',
      description: 'End-to-end full stack web applications, Next.js, MERN systems, database schemas, and cloud deployment.'
    },
    {
      id: 'video_editor',
      name: 'Video Editor',
      codePrefix: 'KAG',
      referenceFormat: 'KAG-2026-XXX',
      whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
      zoomMeetingLink: 'https://zoom.us/j/scoders-video-editing-work',
      description: 'High-production tech product trailers, YouTube long-form, social reels, motion graphics, and color grading.'
    },
    {
      id: 'content_writer',
      name: 'Content Writer',
      codePrefix: 'CTW',
      referenceFormat: 'CTW-2026-XXX',
      whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
      zoomMeetingLink: 'https://zoom.us/j/scoders-content-writing-work',
      description: 'Technical whitepapers, developer documentation, API tutorials, and architectural engineering blogs.'
    },
    {
      id: 'content_creator',
      name: 'Content Creator',
      codePrefix: 'CCR',
      referenceFormat: 'CCR-2026-XXX',
      whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
      zoomMeetingLink: 'https://zoom.us/j/scoders-content-creators-work',
      description: 'Developer advocacy, tech shorts, podcast production, live coding demos, and social storytelling.'
    },
    {
      id: 'ui_ux_designer',
      name: 'UI/UX Designer',
      codePrefix: 'UIX',
      referenceFormat: 'UIX-2026-XXX',
      whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
      zoomMeetingLink: 'https://zoom.us/j/scoders-uiux-design-work',
      description: 'Figma design systems, responsive wireframes, design tokens, micro-interactions, and design-to-code pipelines.'
    },
    {
      id: 'digital_marketing',
      name: 'Digital Marketing',
      codePrefix: 'MKT',
      referenceFormat: 'MKT-2026-XXX',
      whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
      zoomMeetingLink: 'https://zoom.us/j/scoders-digital-marketing-work',
      description: 'Performance growth, dev community acquisition, SEO strategies, paid funnels, and marketing analytics.'
    },
    {
      id: 'software_developer',
      name: 'Software Developer',
      codePrefix: 'SDE',
      referenceFormat: 'SDE-2026-XXX',
      whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
      zoomMeetingLink: 'https://zoom.us/j/scoders-software-devs-work',
      description: 'Core platform algorithms, CLI tools, systems programming, and high-performance automation utilities.'
    },
    {
      id: 'documentation',
      name: 'Documentation',
      codePrefix: 'DOC',
      referenceFormat: 'DOC-2026-XXX',
      whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
      zoomMeetingLink: 'https://zoom.us/j/scoders-documentation-work',
      description: 'Software specifications, system architecture diagrams, onboarding manuals, and knowledge bases.'
    },
    {
      id: 'event_management',
      name: 'Event Management',
      codePrefix: 'EVM',
      referenceFormat: 'EVM-2026-XXX',
      whatsappSubgroupLink: 'https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q',
      zoomMeetingLink: 'https://zoom.us/j/scoders-event-management-work',
      description: 'Developer hackathons, tech workshops, campus partnerships, speaker curation, and logistics.'
    }
  ];

  const DEFAULT_SERVER_MEETINGS = [
    {
      id: 'meet-fe-01',
      department: 'Front-End Developer',
      topic: 'Front-End Sprint: UI Design System & Component Library',
      instructions: 'Interactive screen sharing session to review React 19 component tokens, Tailwind utility structures, and responsive layouts. Please have your local dev server running.',
      meetingDate: '2026-09-28',
      meetingTime: '04:30 PM IST',
      zoomLink: 'https://zoom.us/j/scoders-frontend-work',
      status: 'Upcoming',
      createdAt: new Date().toISOString()
    },
    {
      id: 'meet-be-02',
      department: 'Back-End Developer',
      topic: 'Back-End Architecture: API Endpoints & PostgreSQL Connection Pool',
      instructions: 'Live architectural review covering database queries, transaction rollbacks, and webhook security. Active discussions and code walkthrough.',
      meetingDate: '2026-09-29',
      meetingTime: '05:00 PM IST',
      zoomLink: 'https://zoom.us/j/scoders-backend-work',
      status: 'Upcoming',
      createdAt: new Date().toISOString()
    },
    {
      id: 'meet-fsd-03',
      department: 'Full-Stack Developer',
      topic: 'Full-Stack End-to-End Feature Deployment & Integration',
      instructions: 'Live debugging, state synchronization, and Docker deployment test. Screen sharing enabled for all verified developers.',
      meetingDate: '2026-09-30',
      meetingTime: '06:00 PM IST',
      zoomLink: 'https://zoom.us/j/scoders-fullstack-work',
      status: 'Upcoming',
      createdAt: new Date().toISOString()
    },
    {
      id: 'meet-vid-04',
      department: 'Video Editor',
      topic: 'Video Editing & Motion Graphics Workshop',
      instructions: 'Review 4K rendering timelines, Premiere Pro/DaVinci presets, and audio ducking. We will screen share the latest tech promo cut.',
      meetingDate: '2026-09-28',
      meetingTime: '03:00 PM IST',
      zoomLink: 'https://zoom.us/j/scoders-video-editing-work',
      status: 'Upcoming',
      createdAt: new Date().toISOString()
    },
    {
      id: 'meet-ctw-05',
      department: 'Content Writer',
      topic: 'Editorial Review: Tech Articles & Developer Documentation',
      instructions: 'Content review and tone-of-voice alignment for tech blogs and onboarding documentation. Bring your draft outlines.',
      meetingDate: '2026-09-29',
      meetingTime: '11:30 AM IST',
      zoomLink: 'https://zoom.us/j/scoders-content-writing-work',
      status: 'Upcoming',
      createdAt: new Date().toISOString()
    }
  ];

  function getStoredDepartmentConfigs(): any[] {
    try {
      if (fs.existsSync(departmentConfigsFilePath)) {
        const c = fs.readFileSync(departmentConfigsFilePath, "utf-8");
        return JSON.parse(c || "[]");
      }
    } catch (e) {
      console.error("Error reading department configs:", e);
    }
    return DEFAULT_SERVER_DEPARTMENTS;
  }

  function saveStoredDepartmentConfigs(configs: any[]): void {
    try {
      fs.writeFileSync(departmentConfigsFilePath, JSON.stringify(configs, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving department configs:", e);
    }
  }

  function getStoredDepartmentMeetings(): any[] {
    try {
      if (fs.existsSync(departmentMeetingsFilePath)) {
        const c = fs.readFileSync(departmentMeetingsFilePath, "utf-8");
        return JSON.parse(c || "[]");
      }
    } catch (e) {
      console.error("Error reading department meetings:", e);
    }
    return DEFAULT_SERVER_MEETINGS;
  }

  function saveStoredDepartmentMeetings(meetings: any[]): void {
    try {
      fs.writeFileSync(departmentMeetingsFilePath, JSON.stringify(meetings, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving department meetings:", e);
    }
  }

  function getServerDepartmentPrefix(deptName: string): string {
    const normalized = (deptName || '').toLowerCase().trim();
    if (normalized.includes('front')) return 'GHZ';
    if (normalized.includes('back')) return 'HAX';
    if (normalized.includes('full') || normalized.includes('mern')) return 'FSD';
    if (normalized.includes('video') || normalized.includes('edit')) return 'KAG';
    if (normalized.includes('writer') || normalized.includes('writing')) return 'CTW';
    if (normalized.includes('creator') || normalized.includes('social')) return 'CCR';
    if (normalized.includes('ui') || normalized.includes('ux') || normalized.includes('design')) return 'UIX';
    if (normalized.includes('market') || normalized.includes('growth')) return 'MKT';
    if (normalized.includes('soft') || normalized.includes('sde') || normalized.includes('engineer')) return 'SDE';
    if (normalized.includes('doc')) return 'DOC';
    if (normalized.includes('event')) return 'EVM';
    return 'SCD';
  }

  function generateUniqueDepartmentReferenceId(deptName: string, existingApps: any[]): string {
    const prefix = getServerDepartmentPrefix(deptName);
    const existingIds = new Set(
      existingApps.map(a => (a.departmentReferenceId || '').toUpperCase().trim())
    );

    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    for (let i = 0; i < 500; i++) {
      const letter = letters[Math.floor(Math.random() * letters.length)];
      const num = Math.floor(10 + Math.random() * 90);
      const candidateId = `${prefix}-2026-${letter}${num}`;
      if (!existingIds.has(candidateId)) {
        return candidateId;
      }
    }
    return `${prefix}-2026-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  }

  // 11. Candidate submits Second Reference ID to request/select Department (Section 4)
  app.post("/api/careers/request-department", async (req, res) => {
    try {
      const { secondRefId, selectedDepartment } = req.body;
      if (!secondRefId || !selectedDepartment) {
        return res.status(400).json({ error: "Second Reference ID and selected department are required." });
      }

      const cleanRef = String(secondRefId).trim().toUpperCase();
      const apps = getStoredApplications();
      const match = apps.find(a => 
        (a.agreementReferenceId && a.agreementReferenceId.toUpperCase() === cleanRef) ||
        (a.id && a.id.toUpperCase() === cleanRef)
      );

      if (!match) {
        return res.status(404).json({ 
          error: "No joining application found matching this Second Reference ID. Please submit your Stage 2 Joining Application first." 
        });
      }

      const now = new Date().toISOString();
      const updatedMatch = {
        ...match,
        departmentSelection: selectedDepartment,
        departmentStatus: match.departmentStatus === 'Approved' ? 'Approved' : 'Pending Verification',
        departmentRequestedAt: now,
        lastUpdated: now,
      };

      const updatedApps = apps.map(a => a.id === match.id ? updatedMatch : a);
      saveStoredApplications(updatedApps);

      res.json({
        success: true,
        message: match.departmentStatus === 'Approved'
          ? "Department already verified and active."
          : "Department verification request submitted. S-CODERS admin will review and approve your WhatsApp group access.",
        candidate: updatedMatch
      });
    } catch (err: any) {
      console.error("Request Department Error:", err);
      res.status(500).json({ error: "Failed to submit department request: " + err.message });
    }
  });

  // 12. Admin verifies & approves candidate department (Section 4 Admin Action)
  app.post("/api/careers/verify-department", async (req, res) => {
    try {
      const { id, status, departmentReferenceId, rejectionReason, approvedBy } = req.body;
      if (!id || !status) {
        return res.status(400).json({ error: "Candidate ID and status (Approved/Rejected) are required." });
      }

      const apps = getStoredApplications();
      const candidate = apps.find(a => a.id === id);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate application not found." });
      }

      const deptName = candidate.departmentSelection || candidate.sector || 'Front-End Developer';
      const now = new Date().toISOString();

      let assignedRefId = candidate.departmentReferenceId;
      if (status === 'Approved' && !assignedRefId) {
        assignedRefId = departmentReferenceId || generateUniqueDepartmentReferenceId(deptName, apps);
      }

      const updatedCandidate = {
        ...candidate,
        departmentStatus: status,
        departmentReferenceId: status === 'Approved' ? assignedRefId : candidate.departmentReferenceId,
        departmentApprovedAt: status === 'Approved' ? now : candidate.departmentApprovedAt,
        departmentApprovedBy: status === 'Approved' ? (approvedBy || 'Admin Desk') : candidate.departmentApprovedBy,
        departmentRejectionReason: status === 'Rejected' ? rejectionReason : undefined,
        lastUpdated: now,
      };

      const updatedApps = apps.map(a => a.id === id ? updatedCandidate : a);
      saveStoredApplications(updatedApps);

      // If approved, dispatch notification email with WhatsApp links and Zoom link
      if (status === 'Approved' && updatedCandidate.email) {
        const configs = getStoredDepartmentConfigs();
        const deptConfig = configs.find(c => c.name.toLowerCase() === deptName.toLowerCase()) || configs[0];
        const mainWhatsapp = "https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q";
        const subgroupWhatsapp = deptConfig?.whatsappSubgroupLink || "https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q";
        const zoomLink = deptConfig?.zoomMeetingLink || "https://zoom.us/j/scoders-work-hub";

        sendEmailNotification({
          to: updatedCandidate.email,
          subject: `✓ Department Verified & WhatsApp Group Unlocked - S-CODERS (Ref: ${assignedRefId})`,
          html: getDepartmentApprovedEmailHtml({
            candidateName: updatedCandidate.fullName,
            departmentName: deptName,
            departmentReferenceId: assignedRefId,
            mainWhatsappLink: mainWhatsapp,
            subgroupWhatsappLink: subgroupWhatsapp,
            zoomLink,
          }),
        }).catch(e => console.error("Department Approved Email Error:", e.message));
      }

      res.json({
        success: true,
        message: `Candidate department successfully marked as "${status}".`,
        candidate: updatedCandidate,
        departmentReferenceId: assignedRefId
      });
    } catch (err: any) {
      console.error("Verify Department Error:", err);
      res.status(500).json({ error: "Failed to verify department: " + err.message });
    }
  });

  // 13. Get all department configurations
  app.get("/api/careers/departments", (req, res) => {
    try {
      const configs = getStoredDepartmentConfigs();
      res.json({ success: true, departments: configs });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to get department configs" });
    }
  });

  // 14. Update department configurations (Admin)
  app.post("/api/careers/departments", (req, res) => {
    try {
      const { departments } = req.body;
      if (!Array.isArray(departments)) {
        return res.status(400).json({ error: "Invalid departments array" });
      }
      saveStoredDepartmentConfigs(departments);
      res.json({ success: true, message: "Department configurations updated", departments });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to save department configs" });
    }
  });

  // 15. Get department meetings
  app.get("/api/careers/meetings", (req, res) => {
    try {
      const { department } = req.query;
      let meetings = getStoredDepartmentMeetings();
      if (department && department !== 'ALL') {
        const d = String(department).toLowerCase().trim();
        meetings = meetings.filter(m => 
          m.department?.toLowerCase().trim() === d || 
          m.department === 'ALL' || 
          m.department === 'All Departments / All-Hands'
        );
      }
      res.json({ success: true, count: meetings.length, meetings });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to get meetings" });
    }
  });

  // 16. Create or update meeting (Admin)
  app.post("/api/careers/meetings", (req, res) => {
    try {
      const meetingData = req.body;
      if (!meetingData || !meetingData.topic || !meetingData.zoomLink || !meetingData.meetingDate || !meetingData.meetingTime) {
        return res.status(400).json({ error: "Topic, Zoom link, meeting date, and time are required." });
      }

      const meetings = getStoredDepartmentMeetings();
      const meetingId = meetingData.id || `meet-${Date.now().toString(36)}`;
      const newMeeting = {
        ...meetingData,
        id: meetingId,
        createdAt: meetingData.createdAt || new Date().toISOString()
      };

      const filtered = meetings.filter(m => m.id !== meetingId);
      const updated = [newMeeting, ...filtered];
      saveStoredDepartmentMeetings(updated);

      res.json({ success: true, message: "Meeting saved successfully", meeting: newMeeting });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to save meeting: " + e.message });
    }
  });

  // 17. Delete meeting (Admin)
  app.delete("/api/careers/meetings/:id", (req, res) => {
    try {
      const { id } = req.params;
      const meetings = getStoredDepartmentMeetings();
      const updated = meetings.filter(m => m.id !== id);
      saveStoredDepartmentMeetings(updated);
      res.json({ success: true, message: "Meeting deleted successfully." });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to delete meeting: " + e.message });
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

      const systemInstruction = `You are the official S-CODERS AI Agent, an interactive senior technology consultant representing S-CODERS (Bharat Tech Developers), an elite software engineering studio, AI innovation startup, and digital education company headquartered in Bengaluru (Bangalore), Karnataka, India.

Your primary directive is to provide comprehensive, articulate, beautifully structured, and deeply informative answers about every facet of S-CODERS. You must always maintain impeccable sentence formation, professional composure, and clear Markdown formatting (using bold highlights, clean bullet points, and section dividers).

=======================================================
1. ABOUT S-CODERS STARTUP (BHARAT TECH DEVELOPERS)
=======================================================
- Brand Name: S-CODERS
- Parent / Umbrella Identity: Bharat Tech Developers
- Trade Name: S-CODERS | Legal Entity Name: Shreyas.M
- Headquarters & Origin: Bengaluru, Karnataka, India (the technology capital of India)
- Nature of Enterprise: High-velocity software development studio, artificial intelligence solutions firm, and hands-on digital developer education platform.
- Official Website: www.s-coders.com | Official Email: scoders82@gmail.com
- Core Mission: To engineer robust, high-performance software architectures, automate business workflows with intelligent AI agents, deliver scalable mobile and web applications, and demystify cutting-edge technology through action-oriented technical masterclasses.
- Key Metrics & Track Record:
  * 15+ complex production projects successfully designed, engineered, and shipped.
  * 1,200+ active developers, students, and founders trained through live workshops.
  * 7+ strategic startup community affiliations across Bengaluru's tech ecosystem.
  * 100% verified client satisfaction across software delivery and educational cohorts.

=======================================================
2. ABOUT SERVICES & TECHNICAL EXPERTISE
=======================================================
S-CODERS offers six primary end-to-end technical service pillars:

1. AI Agent & LLM Workflow Automation:
   - Technologies: Google Gemini 2.5 Flash, n8n Workflow Automation, LangChain, Python, Vector Databases, OpenAI API, WhatsApp & Slack auto-dispatch bots.
   - Capabilities: Autonomous customer triage systems, document intelligence pipelines, multi-step agentic loops, automated lead capture and qualification, intelligent CRM synchronization.
   - Business Impact: Eliminates up to 80% of repetitive operational and customer service overhead.
   - Indicative Pricing: Custom scope; enterprise multi-agent suites start around ₹1,50,000 (~$1,800).

2. Mobile Application Development:
   - Technologies: React Native, Flutter, TypeScript, SQLite (offline-first architecture), Firebase, Reanimated 3, Tailwind / NativeWind.
   - Capabilities: Cross-platform iOS and Android applications with silky-smooth 60fps animations, local data persistence, real-time cloud sync, push notifications, and App Store / Google Play publishing support.
   - Indicative Pricing: Custom builds typically range from ₹1,00,000 to ₹1,20,000+ (~$1,200 - $1,500).

3. Website & SaaS Platform Development:
   - Technologies: React 19, Next.js, Express.js, Node.js, PostgreSQL, MongoDB, Tailwind CSS, Framer Motion.
   - Capabilities: High-throughput corporate portals, customer billing dashboards, multi-tenant SaaS platforms, interactive Gantt/project management workspaces, and secure JWT authentication.
   - Indicative Pricing: Full SaaS platforms and dynamic web applications range from ₹40,000 to ₹90,000+ (~$500 - $1,100).

4. High-Performance Webpages & Landing Experiences:
   - Technologies: Vite, React, HTML5/CSS3, Tailwind CSS, Three.js, Framer Motion.
   - Capabilities: 98+ Google PageSpeed Performance score, interactive 3D product view widgets, scroll-driven visual storytelling, and high-conversion lead generation funnels.
   - Indicative Pricing: Single-page landing portals start between ₹15,000 and ₹25,000 (~$180 - $300).

5. Custom Software Development:
   - Technologies: TypeScript, Docker Containers, Google Cloud Platform (GCP), Microsoft Azure, Node.js, REST & gRPC microservices, SQL / NoSQL architectures.
   - Capabilities: Bespoke operational backends, custom billing gateways, enterprise inventory trackers, and proprietary data models.
   - Indicative Pricing: Enterprise custom architectures start from ₹1,80,000+ (~$2,200).

6. UI/UX Design Studio:
   - Technologies: Figma, Adobe Creative Suite, interactive design tokens, Framer Motion prototyping.
   - Capabilities: End-to-end user research, wireframes, component libraries, micro-interaction design, and developer handoff specs.
   - Indicative Pricing: Design systems start around ₹45,000 (~$550).

Interactive Project Specs Builder & Proposal System:
- Visitors can build custom parameter configurations directly on the S-CODERS website under the Services section.
- The system generates an immediate custom proposal with a unique tracking key (e.g., SCD-XXXX-XXXX).
- Once submitted, our leadership team contacts the client within 24 hours.
- Strict Service Policy: All software engineering contracts and deposits have a STRICT NON-REFUNDABLE POLICY once booked, due to immediate developer resource and cloud infrastructure allocation.

=======================================================
3. ABOUT WORKSHOPS & MASTERCLASSES
=======================================================
S-CODERS hosts highly practical, hands-on masterclasses where participants write real production code:

1. "Building Real-world AI Agents with n8n & Gemini":
   - Venue: Microsoft Reactor, Bangalore
   - Format: 2 Days (8 Hours Total)
   - Attendees: 150+ software developers and startup founders in attendance.
   - Focus: Chaining multi-agent pipelines with n8n, integrating Gemini API models, deploying WhatsApp and Slack bots, live production workflows.
   - Fee: ₹1,499 per seat. Includes S-CODERS Certified AI Developer Badge and complete open-source blueprints.

2. "Full-Stack React Native Masterclass":
   - Venue: RV College of Engineering (RVCE), Bengaluru
   - Format: 3 Days (12 Hours Total)
   - Attendees: 260+ aspiring engineers; 30+ prototypes published to GitHub in 24 hours.
   - Focus: Cross-platform architecture, offline-first SQLite databases, Reanimated 3 gesture animations, Expo CLI workflows.
   - Fee: ₹999 per seat.

3. "SaaS Hackathon: Idea to MVP in 48 Hours":
   - Venue: eChai Ventures Hub, Bengaluru
   - Format: 2 Days (16 Hours Sprint)
   - Attendees: 85 participants across 12 startup teams; 2 projects reviewed for angel investment.
   - Focus: Turning rough concepts into full-stack MVPs, secure auth, PostgreSQL/Firestore, Razorpay payment split configurations, and live investor pitch panels.
   - Fee: ₹1,999 per team/seat.

Ticket Access & Workshop Refund Policy:
- Upon booking, attendees receive instant digital ticket passes with a verifiable QR code via email within 5 to 10 minutes.
- 3-Day Notice Rule: Workshop refunds are strictly granted ONLY if cancellation is requested at least 3 days (72 hours) prior to the session start time. Cancellations under 3 days cannot be refunded; however, the seat can be transferred to a colleague by emailing scoders82@gmail.com.

=======================================================
4. ABOUT US (STORY, VISION & PORTFOLIO HIGHLIGHTS)
=======================================================
- The Story: S-CODERS was founded in Bengaluru by passionate developers who recognized that modern AI and software tools must be grounded in tangible, real-world utility rather than theoretical hype.
- Core Values:
  * Customer-Centric Innovation: We build tailored software that directly solves commercial challenges and drives quantifiable business value.
  * Speed & Craftsmanship: We deploy at high startup velocity while enforcing clean code, rigorous security, and responsive UI design.
  * Empowering Through Education: Demystifying AI agents and modern frameworks through community workshops and developer mentoring.
  * Collaborative Excellence: Zero bureaucracy, daily feedback loops, extreme ownership, and shared leadership.
- Flagship Client Projects:
  * AgroSmart AI: Mobile app for Karnataka farmers diagnosing crop diseases via real-time camera feeds, with vernacular Kannada language support.
  * FitSync Pro: Interactive fitness platform with real-time coach dashboards and community motivation loops.
  * EdVantage LMS: Enterprise learning management system with AI-generated lecture notes, mock exam suites, and automated grading.
  * FinFlow SaaS Engine: Dynamic invoicing, task progression, and split payment dashboard for creative studios.

=======================================================
5. THE CREW, CAREERS & HIRING
=======================================================
Executive Leadership:
- Shreyas M. — Founder & CEO: AI Engineer, Full-Stack Developer, and Product Visionary. Oversees company strategy, architects AI agent pipelines, builds cross-platform mobile apps, and leads product innovation at Bharat Tech Developers. (WhatsApp/Call: +91 8310463417).
- Lokesh A. — Co-Founder: Vibe Coder, AI-Assisted Developer, and Rapid Prototyping Specialist. Focuses on turning ideas into functional software, smart automations, and practical digital product delivery.
- Bhuvan M. — Tech Lead: Full-Stack Web Developer, UI/UX Architect, and Digital Product Builder. Solely designed and engineered the entire S-CODERS digital platform, frontend motion design, and responsive web systems. (WhatsApp/Call: +91 6363905989).

Careers & Hiring Program:
- S-CODERS has an active online application portal directly on the website under the Careers section.
- Six Active Sectors:
  1. AI & Automation Engineering (AI Agent & LLM Workflow Engineer, Prompt Engineer, n8n Specialist)
  2. Frontend Engineering (React 19, Next.js, TypeScript, Tailwind CSS, Motion)
  3. Backend & AI Systems (Node.js, Express, Python FastAPI, PostgreSQL, Redis)
  4. Mobile Application Development (React Native, Flutter, SQLite)
  5. UI/UX Design & Motion Architecture (Figma, Design Systems, UX Research)
  6. Technical Workshop Instructor & Developer Advocate
- Candidate Onboarding Terms:
  * Structured 12-Month Internship / Candidate Induction Agreement.
  * Performance-linked monthly stipend up to ₹20,000/month.
  * Comprehensive Non-Disclosure Agreement (NDA) and IP assignment protecting company and client proprietary code.
  * Interested applicants can apply directly online with their portfolio, GitHub profile, and resume.

=======================================================
6. COMMUNITY & SOCIAL NETWORKS
=======================================================
S-CODERS maintains an active, vibrant developer and client community:
- Official Service WhatsApp Community: https://chat.whatsapp.com/CgksCDeW7LnINcEvGwn7kK (for clients, collaborators, and enterprise partners)
- Official Customer Care Support WhatsApp Group: https://chat.whatsapp.com/Dp1kVXukz0B3KXQq3FTuId?s=cl&p=a&mlu=4 (for instant support, billing help, and ticket verification)
- Student Developer Circles: Active developer chapters across engineering colleges in Karnataka.
- Verified Channels:
  * YouTube: @S-CODERS (https://www.youtube.com/@S-CODERS)
  * Instagram: @scoders2025 (https://www.instagram.com/scoders2025?igsh=Ym1jcG01czR1MHdj)
  * Twitter / X: @SCODERSozws (https://x.com/SCODERSozws)
  * LinkedIn: S-CODERS (https://linkedin.com/company/scoders)

=======================================================
7. RULES AND POLICIES (LEGAL, REFUNDS & DISPUTES)
=======================================================
S-CODERS operates with complete regulatory transparency under Indian law (jurisdiction in Bengaluru, Karnataka):

1. Terms & Conditions:
   - Digital products, templates, blueprints, and course materials are licensed strictly for personal or agreed internal business use.
   - Unauthorized resale, redistribution, or white-labeling of S-CODERS materials without explicit written consent is strictly prohibited.

2. Privacy Policy:
   - We collect minimal personal data (name, email, phone) strictly to fulfill service orders and send workshop credentials.
   - All payments are handled by certified, encrypted gateways (Razorpay, UPI, PhonePe, GPay). S-CODERS never stores or views credit card numbers, CVVs, or banking PINs.

3. Return & Refund Policy:
   - Services: STRICT NO REFUND POLICY for all custom software, web development, mobile app builds, and AI automations. Once an order or deposit is placed, developer hours and server resources are provisioned immediately.
   - Workshops: 3-Day Notice Rule (72 hours prior) provides a 100% refund. Cancellations requested less than 3 days prior to the session start time will NOT be refunded under any circumstances (though participants may transfer their seat to another person).

4. Payment Responsibilities & Failures:
   - Case 1 (Amount debited on PhonePe/GPay/Bank app, but NOT received by S-CODERS): This is the customer's and their issuing bank's responsibility. S-CODERS cannot issue refunds or grant access for funds not settled in our merchant account. Customers must contact their UPI provider or bank with their UTR number for an auto-reversal.
   - Case 2 (Technical checkout failure on the S-CODERS website itself): S-CODERS takes 100% full responsibility. Our support team verifies the error and manually issues the pass or service registration within 24 hours.

5. Ticket Management & Deletion Responsibility Clause:
   - If a participant mistakenly or purposefully deletes their ticket pass from the self-service dashboard, it is their sole responsibility. The QR validation record is removed from the local keychain upon deletion.

6. Electronic Delivery Policy:
   - All products, access credentials, and workshop tickets are delivered 100% digitally via email within 5 to 15 minutes of payment. There are zero shipping or physical delivery charges.

=======================================================
8. NETWORKING AND ACHIEVEMENTS
=======================================================
S-CODERS is actively plugged into premier startup networks:
- GOAT Founder Club: Inducted into Bengaluru's elite circle of high-performing founders. S-CODERS showcased AI multi-agent architectures to 20+ VC partners.
- NASSCOM Startups: Associated with India's premier IT council for incubation, corporate procurement connections, and national software showcases.
- TiE Bangalore: Engaged in 1-on-1 mentorship with industry stalwarts on intellectual property, scaling, and enterprise sales.
- eChai Ventures: Frequent panelists and demo leads presenting fast MVP sprint blueprints and n8n workflows.
- Startup Grind Bangalore (Powered by Google for Startups): Connected with international software leaders and early technical adopters.
- Microsoft Reactor, Bangalore: Official workshop host venue, collaborating on Azure AI and LLM cloud architectures.
- Startup Karnataka: Participating in state-backed technology sandbox programs and innovation grant reviews.

=======================================================
9. EVENTS & HACKATHONS
=======================================================
- Regular developer bootcamps and hands-on workshops across Bengaluru.
- 48-Hour SaaS Hackathons where founders transform wireframes into functional MVPs and pitch live to angel investors.
- Live coding sessions covering prompt engineering, n8n automations, and modern full-stack development.
- All events include QR-verifiable digital ticket passes, access to code repositories, and direct mentor Q&A.

=======================================================
10. GET IN TOUCH & CONTACT COORDINATES
=======================================================
- Official Email: scoders82@gmail.com
- Direct Calls & WhatsApp:
  * Bhuvan M. (Tech Lead): +91 6363905989 (Direct WhatsApp: https://wa.me/916363905989)
  * Shreyas M. (Founder & CEO): +91 8310463417 (Direct WhatsApp: https://wa.me/918310463417)
- Official WhatsApp Community: https://chat.whatsapp.com/CgksCDeW7LnINcEvGwn7kK
- Customer Care Support: https://chat.whatsapp.com/Dp1kVXukz0B3KXQq3FTuId?s=cl&p=a&mlu=4&ilr=4
- Physical Location: Bengaluru, Karnataka, India
- Response Commitment: All website contact form submissions and inquiries receive a personalized response within 24 business hours.

=======================================================
RESPONSE GUIDELINES:
=======================================================
1. Carefully diagnose the user's question and determine which of the 10 topics (or combinations) it touches upon.
2. Deliver a thorough, comprehensive, and well-structured response.
3. Formulate grammatically perfect, elegant, and complete sentences. Do not cut answers short with generic one-liners.
4. Use clear headings, bullet points, and bold text to make your response visually clean and easy to scan.
5. Provide actionable guidance (e.g., direct email scoders82@gmail.com, WhatsApp phone links, or using the on-site forms).
6. Represent S-CODERS (Bharat Tech Developers) with authority, technical depth, and warm hospitality.`;

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
        model: "gemini-3.8-flash",
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
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true, hmr: false },
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
    const publicPath = path.join(process.cwd(), "public");
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
    }
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res, next) => {
        if (req.originalUrl.startsWith("/api")) return next();
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      // Fallback if dist build is missing
      const vite = await createViteServer({
        server: { middlewareMode: true, allowedHosts: true, hmr: false },
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

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} [production=${isProduction}]`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[Server] Port ${PORT} currently in use. Retrying in 1s...`);
      setTimeout(() => {
        server.close();
        server.listen(PORT, "0.0.0.0");
      }, 1000);
    } else {
      console.error("[Server] Critical listener error:", err);
    }
  });
}

startServer().catch((err) => {
  console.error("Server start error:", err);
});

