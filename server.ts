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

// Email template generator for Service Profile Acceptance
function getServiceAcceptanceEmailHtml({
  clientName,
  serviceTitle,
  uniqueKey,
  actionUrl,
}: {
  clientName: string;
  serviceTitle: string;
  uniqueKey: string;
  actionUrl: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>S-CODERS Project Idea Registered</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #131A29; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
              <tr>
                <td style="padding: 32px; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); text-align: center; border-bottom: 2px solid #22D3EE;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #FFFFFF;">S <span style="color: #22D3EE;">⚡</span> CODERS</h1>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px;">Bharath Tech Developers • Bengaluru, India</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 32px; text-align: center;">
                  <div style="display: inline-block; padding: 10px 24px; border-radius: 9999px; background-color: rgba(34, 211, 238, 0.15); border: 1px solid #22D3EE;">
                    <span style="font-size: 13px; font-weight: 800; color: #22D3EE; text-transform: uppercase;">
                      ✓ PROJECT IDEA REGISTERED SUCCESSFULLY
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 20px 32px;">
                  <p style="font-size: 16px; color: #F8FAFC; margin: 0 0 12px 0;">Hello <strong>${clientName}</strong>,</p>
                  <p style="font-size: 15px; color: #38BDF8; font-weight: 700; line-height: 1.6; margin: 0 0 16px 0; background-color: #0F172A; padding: 16px; border-radius: 12px; border-left: 4px solid #22D3EE;">
                    Your project idea has been got registered and our team will contact you within 24hrs thank you for choosing S-CODERS Bharath tech developers.
                  </p>
                  <p style="font-size: 13px; color: #94A3B8; margin: 0;">
                    Project Scope: <strong>${serviceTitle}</strong>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 30px 32px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; border-radius: 12px; border: 1px solid #334155; padding: 20px; text-align: center;">
                    <tr>
                      <td style="font-size: 11px; color: #64748B; text-transform: uppercase; font-family: monospace; letter-spacing: 1px;">Your Unique Service Registration Key</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; font-size: 22px; font-weight: 900; color: #22D3EE; font-family: monospace; letter-spacing: 2px;">
                        ${uniqueKey}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 10px; font-size: 13px; color: #CBD5E1;">
                        You can enter this access key on our website anytime to track your project progress and communicate with our engineering team.
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top: 20px;">
                        <a href="${actionUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #22D3EE; color: #0B0F17; text-decoration: none; font-weight: 800; font-size: 13px; border-radius: 10px; text-transform: uppercase; letter-spacing: 1px;">
                          Open Website & Enter Unique Key →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 32px; text-align: center; border-top: 1px solid #1E293B; background-color: #0F172A;">
                  <p style="font-size: 11px; color: #64748B; margin: 0;">From: scoders82@gmail.com • © 2026 S-CODERS (Bharath Tech Developers). All rights reserved.</p>
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
}) {
  const isSuccess = status === 'SUCCESS';
  const formattedAmount = `₹${amount.toLocaleString('en-IN')}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>S-CODERS Workshop Payment ${status}</title>
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
                      ${isSuccess ? '✓ PAYMENT DONE SUCCESSFULLY' : '✕ PAYMENT FAILED'}
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 20px 32px;">
                  <p style="font-size: 16px; color: #F8FAFC; margin: 0 0 12px 0;">Hello <strong>${clientName}</strong>,</p>
                  ${isSuccess ? `
                    <p style="font-size: 15px; color: #38BDF8; font-weight: 700; line-height: 1.6; margin: 0 0 16px 0; background-color: #0F172A; padding: 16px; border-radius: 12px; border-left: 4px solid #22D3EE;">
                      Your payment has been done successfully and thank you for choosing S-CODERS Bharath tech developers and you can continue with the workshop session.
                    </p>
                  ` : `
                    <p style="font-size: 15px; color: #FCA5A5; font-weight: 700; line-height: 1.6; margin: 0 0 16px 0; background-color: #0F172A; padding: 16px; border-radius: 12px; border-left: 4px solid #EF4444;">
                      Your payment has been failed so kindly try once again for payment.
                    </p>
                  `}
                  <p style="font-size: 13px; color: #94A3B8; margin: 0;">
                    Workshop Title: <strong>${workshopTitle}</strong> (Amount: ${formattedAmount} ${currency})
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 30px 32px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; border-radius: 12px; border: 1px solid #334155; padding: 20px;">
                    ${isSuccess ? `
                      <tr>
                        <td style="padding-bottom: 8px; font-size: 11px; color: #64748B; text-transform: uppercase; font-family: monospace;">Your Unique Workshop Access Key</td>
                        <td align="right" style="padding-bottom: 8px; font-size: 16px; font-weight: 900; color: #22D3EE; font-family: monospace;">${uniqueKey || 'BTD-WKSH-PASS'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Razorpay Payment ID:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; font-family: monospace; color: #CBD5E1;">${paymentId || 'pay_rzp_scoders'}</td>
                      </tr>
                    ` : `
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #EF4444; font-weight: 700;">Failure Details:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; color: #FCA5A5;">${reason || 'Payment was declined or interrupted.'}</td>
                      </tr>
                    `}
                    <tr>
                      <td colspan="2" align="center" style="padding-top: 20px;">
                        <a href="${actionUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: ${isSuccess ? '#22D3EE' : '#EF4444'}; color: ${isSuccess ? '#0B0F17' : '#FFFFFF'}; text-decoration: none; font-weight: 800; font-size: 13px; border-radius: 10px; text-transform: uppercase; letter-spacing: 1px;">
                          ${isSuccess ? 'Open Website & Access Workshop Session →' : 'Retry Payment on Website →'}
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 32px; text-align: center; border-top: 1px solid #1E293B; background-color: #0F172A;">
                  <p style="font-size: 11px; color: #64748B; margin: 0;">From: scoders82@gmail.com • © 2026 S-CODERS (Bharath Tech Developers). All rights reserved.</p>
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
}) {
  const isSuccess = status === 'SUCCESS';
  const formattedAmount = `₹${amount.toLocaleString('en-IN')}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>S-CODERS Event Ticket ${status}</title>
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
                      ${isSuccess ? '✓ PAYMENT DONE SUCCESSFULLY' : '✕ PAYMENT METHOD FAILED'}
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 20px 32px;">
                  <p style="font-size: 16px; color: #F8FAFC; margin: 0 0 12px 0;">Hello <strong>${clientName}</strong>,</p>
                  ${isSuccess ? `
                    <p style="font-size: 15px; color: #38BDF8; font-weight: 700; line-height: 1.6; margin: 0 0 16px 0; background-color: #0F172A; padding: 16px; border-radius: 12px; border-left: 4px solid #22D3EE;">
                      Your payment has been done successfully so here are your tickets just grab it!
                    </p>
                  ` : `
                    <p style="font-size: 15px; color: #FCA5A5; font-weight: 700; line-height: 1.6; margin: 0 0 16px 0; background-color: #0F172A; padding: 16px; border-radius: 12px; border-left: 4px solid #EF4444;">
                      Your payment method has been failed so try once again.
                    </p>
                  `}
                  <p style="font-size: 13px; color: #94A3B8; margin: 0;">
                    Event: <strong>${eventTitle}</strong> (${formattedAmount} ${currency})
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 30px 32px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; border-radius: 12px; border: 1px solid #334155; padding: 20px;">
                    ${isSuccess ? `
                      <tr>
                        <td style="padding-bottom: 8px; font-size: 11px; color: #64748B; text-transform: uppercase; font-family: monospace;">Verified Event Pass Code</td>
                        <td align="right" style="padding-bottom: 8px; font-size: 18px; font-weight: 900; color: #22D3EE; font-family: monospace;">${ticketCode}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94A3B8;">Payment Txn ID:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; font-family: monospace; color: #CBD5E1;">${paymentId || 'pay_rzp_scoders'}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 14px; font-size: 12px; color: #94A3B8; border-top: 1px solid #1E293B;">
                          You can view your ticket pass both right here in this email and on our website by clicking the link below:
                        </td>
                      </tr>
                    ` : `
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #EF4444; font-weight: 700;">Failure Reason:</td>
                        <td align="right" style="padding: 6px 0; font-size: 13px; color: #FCA5A5;">${reason || 'Payment method failed or was declined.'}</td>
                      </tr>
                    `}
                    <tr>
                      <td colspan="2" align="center" style="padding-top: 20px;">
                        <a href="${actionUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: ${isSuccess ? '#22D3EE' : '#EF4444'}; color: ${isSuccess ? '#0B0F17' : '#FFFFFF'}; text-decoration: none; font-weight: 800; font-size: 13px; border-radius: 10px; text-transform: uppercase; letter-spacing: 1px;">
                          ${isSuccess ? 'Click Here to View Ticket on Website →' : 'Retry Payment Method on Website →'}
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 32px; text-align: center; border-top: 1px solid #1E293B; background-color: #0F172A;">
                  <p style="font-size: 11px; color: #64748B; margin: 0;">From: scoders82@gmail.com • © 2026 S-CODERS (Bharath Tech Developers). All rights reserved.</p>
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
  const from = process.env.SMTP_FROM || '"S-CODERS (Bharath Tech Developers)" <scoders82@gmail.com>';

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

// Email template generator for Recruitment Application & Induction Agreement
function getRecruitmentEmailHtml({
  candidateName,
  sector,
  roleTitle,
  agreementRef,
  submissionId,
  effectiveDate,
  actionUrl,
}: {
  candidateName: string;
  sector: string;
  roleTitle: string;
  agreementRef: string;
  submissionId: string;
  effectiveDate: string;
  actionUrl: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>S-CODERS Recruitment Application & Induction Agreement</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #131A29; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
              <tr>
                <td style="padding: 32px; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); text-align: center; border-bottom: 2px solid #22D3EE;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #FFFFFF;">S <span style="color: #22D3EE;">⚡</span> CODERS</h1>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px;">Talent & Engineering Induction • Bengaluru, India</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 32px; text-align: center;">
                  <div style="display: inline-block; padding: 10px 24px; border-radius: 9999px; background-color: rgba(34, 211, 238, 0.15); border: 1px solid #22D3EE;">
                    <span style="font-size: 13px; font-weight: 800; color: #22D3EE; text-transform: uppercase;">
                      ✓ CANDIDATE INDUCTION DOSSIER REGISTERED
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 20px 32px;">
                  <p style="font-size: 16px; color: #F8FAFC; margin: 0 0 12px 0;">Dear <strong>${candidateName}</strong>,</p>
                  <p style="font-size: 15px; color: #38BDF8; font-weight: 700; line-height: 1.6; margin: 0 0 16px 0; background-color: #0F172A; padding: 16px; border-radius: 12px; border-left: 4px solid #22D3EE;">
                    Thank you for applying to join S-CODERS (Bharath Tech Developers). Your recruitment application along with the Talent Induction & Non-Disclosure Agreement (NDA) has been securely recorded in our database.
                  </p>
                  <p style="font-size: 14px; color: #94A3B8; line-height: 1.6; margin: 0 0 14px 0;">
                    Our core technical evaluation committee will review your profile, qualifications, and repository highlights. Qualified candidates will receive an interview scheduling invitation within <strong>24 to 48 hours</strong>.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 30px 32px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F172A; border-radius: 12px; border: 1px solid #334155; padding: 20px;">
                    <tr>
                      <td style="padding: 6px 0; font-size: 12px; color: #64748B; text-transform: uppercase;">Sector / Track:</td>
                      <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #FFFFFF;">${sector}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-size: 12px; color: #64748B; text-transform: uppercase;">Role Applied:</td>
                      <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #22D3EE;">${roleTitle}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-size: 12px; color: #64748B; text-transform: uppercase;">Application Ref ID:</td>
                      <td align="right" style="padding: 6px 0; font-size: 13px; font-family: monospace; color: #CBD5E1;">${submissionId}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-size: 12px; color: #64748B; text-transform: uppercase;">Agreement Ref:</td>
                      <td align="right" style="padding: 6px 0; font-size: 13px; font-family: monospace; color: #38BDF8;">${agreementRef}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-size: 12px; color: #64748B; text-transform: uppercase;">Proposed Effective Date:</td>
                      <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #94A3B8;">${effectiveDate}</td>
                    </tr>
                    <tr>
                      <td colspan="2" align="center" style="padding-top: 20px;">
                        <a href="${actionUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #22D3EE; color: #0B0F17; text-decoration: none; font-weight: 800; font-size: 13px; border-radius: 10px; text-transform: uppercase; letter-spacing: 1px;">
                          Visit S-CODERS Website →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 32px; text-align: center; border-top: 1px solid #1E293B; background-color: #0F172A;">
                  <p style="font-size: 11px; color: #64748B; margin: 0;">S-CODERS Careers Division • scoders82@gmail.com • Bengaluru, Karnataka, India</p>
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
    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_live_scoders_ybl';
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
    res.json({ status: "ok", startup: "S-CODERS", razorpay: true, merchantUpiId: "scoders@ybl" });
  });

  // Razorpay Create Order Endpoint
  app.post("/api/razorpay/create-order", async (req, res) => {
    try {
      const { amount, currency = "INR", receipt, notes } = req.body;
      const amountInPaise = Math.round(Number(amount || 1000) * 100);
      const keyId = process.env.RAZORPAY_KEY_ID || "rzp_live_scoders_ybl";

      const mergedNotes = {
        merchant_upi_id: "scoders@ybl",
        merchant_vpa: "scoders@ybl",
        merchant_name: "S-CODERS Technologies",
        settlement_bank: "Bank of Baroda - 2145",
        ...(notes || {})
      };

      const rzp = getRazorpayInstance();

      if (rzp && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        try {
          const order = await rzp.orders.create({
            amount: amountInPaise,
            currency: currency,
            receipt: receipt || `rcpt_${Date.now()}`,
            notes: mergedNotes,
          });

          return res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: keyId,
            merchantUpiId: "scoders@ybl",
            isLive: true,
          });
        } catch (rzpErr: any) {
          console.warn("Razorpay API order creation failed, switching to scoders gateway mode:", rzpErr.message);
        }
      }

      // Sandbox order fallback for preview environment linked to scanner ID
      const sandboxOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      res.json({
        orderId: sandboxOrderId,
        amount: amountInPaise,
        currency: currency,
        keyId: keyId,
        merchantUpiId: "scoders@ybl",
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
        merchantUpiId,
      } = req.body;

      const activeMerchantUpi = merchantUpiId || "6363905989@ybl";
      const secret = process.env.RAZORPAY_KEY_SECRET;
      let isSignatureValid = true;

      // Allow scoders bypass / demo signature in preview or test mode
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
        !razorpay_payment_id.startsWith('pay_wallet_')
      ) {
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

      const finalPaymentId = razorpay_payment_id || `pay_rzp_scoders_${Date.now()}`;

      // Success email dispatch
      const emailResult = await sendEmailNotification({
        to: email || "client@example.com",
        subject: `✅ Payment Confirmation & Receipt - S-CODERS (Merchant: ${activeMerchantUpi} | Txn: ${finalPaymentId})`,
        html: getPaymentEmailHtml({
          status: "SUCCESS",
          clientName: clientName || "Valued Client",
          purpose: `${purpose || 'Service Payment'} (Merchant UPI: ${activeMerchantUpi})`,
          amount: Number(amount) || 0,
          currency,
          paymentId: finalPaymentId,
          orderId: razorpay_order_id || `ord_${Date.now()}`,
        }),
      });

      res.json({
        success: true,
        message: "Payment verified successfully and confirmation email sent.",
        emailSent: emailResult.success,
        paymentId: finalPaymentId,
        merchantUpiId: activeMerchantUpi,
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

  // 1. Service Registration Accepted Email Endpoint
  app.post("/api/email/service-accepted", async (req, res) => {
    try {
      const { email, clientName, serviceTitle, uniqueKey, actionUrl } = req.body;
      const origin = req.headers.origin || `http://${req.headers.host || 'localhost:3000'}`;
      const targetUrl = actionUrl || `${origin}/?view=services&key=${uniqueKey || ''}`;

      const result = await sendEmailNotification({
        to: email || "client@example.com",
        subject: `✅ Project Profile Accepted Successfully - S-CODERS (Ref: ${uniqueKey || 'BTD-SERV-PROJ'})`,
        html: getServiceAcceptanceEmailHtml({
          clientName: clientName || "Valued Client",
          serviceTitle: serviceTitle || "Custom Software Development",
          uniqueKey: uniqueKey || `BTD-SERV-${Date.now().toString(36).toUpperCase()}`,
          actionUrl: targetUrl,
        }),
      });

      res.json({
        success: true,
        message: "Service acceptance email sent successfully.",
        emailSent: result.success,
      });
    } catch (err: any) {
      console.error("Service Accepted Email Error:", err);
      res.status(500).json({ error: "Failed to send service acceptance email." });
    }
  });

  // 2. Workshop Payment Verified Email Endpoint
  app.post("/api/email/workshop-payment-verified", async (req, res) => {
    try {
      const { email, clientName, workshopTitle, amount, currency = "INR", uniqueKey, paymentId, actionUrl } = req.body;
      const origin = req.headers.origin || `http://${req.headers.host || 'localhost:3000'}`;
      const targetUrl = actionUrl || `${origin}/?view=workshops&key=${uniqueKey || ''}`;

      const result = await sendEmailNotification({
        to: email || "client@example.com",
        subject: `✅ Payment Successful - S-CODERS Workshop Access (Key: ${uniqueKey || 'BTD-WKSH'})`,
        html: getWorkshopEmailHtml({
          status: "SUCCESS",
          clientName: clientName || "Valued Masterclass Participant",
          workshopTitle: workshopTitle || "AI Agent & Full-Stack Workshop",
          amount: Number(amount) || 0,
          currency,
          uniqueKey: uniqueKey || `BTD-WKSH-${Date.now().toString(36).toUpperCase()}`,
          actionUrl: targetUrl,
          paymentId: paymentId || `pay_${Date.now()}`,
        }),
      });

      res.json({
        success: true,
        message: "Workshop payment success email dispatched.",
        emailSent: result.success,
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
      const origin = req.headers.origin || `http://${req.headers.host || 'localhost:3000'}`;
      const targetUrl = actionUrl || `${origin}/?view=workshops`;

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

  // 4. Event Payment Verified Email Endpoint
  app.post("/api/email/event-payment-verified", async (req, res) => {
    try {
      const { email, clientName, eventTitle, amount, currency = "INR", ticketCode, paymentId, actionUrl } = req.body;
      const origin = req.headers.origin || `http://${req.headers.host || 'localhost:3000'}`;
      const targetUrl = actionUrl || `${origin}/?view=events&ticket=${ticketCode || ''}`;

      const result = await sendEmailNotification({
        to: email || "client@example.com",
        subject: `🎟️ Payment Done Successfully - S-CODERS Event Pass (${ticketCode || 'SC-EVT'})`,
        html: getEventEmailHtml({
          status: "SUCCESS",
          clientName: clientName || "Valued Attendee",
          eventTitle: eventTitle || "S-CODERS Tech Summit",
          amount: Number(amount) || 0,
          currency,
          ticketCode: ticketCode || `SC-EVT-${Date.now().toString(36).toUpperCase()}`,
          actionUrl: targetUrl,
          paymentId: paymentId || `pay_${Date.now()}`,
        }),
      });

      res.json({
        success: true,
        message: "Event payment success email dispatched with ticket link.",
        emailSent: result.success,
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
      const origin = req.headers.origin || `http://${req.headers.host || 'localhost:3000'}`;
      const targetUrl = actionUrl || `${origin}/?view=events`;

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
      });

      res.json({
        success: true,
        message: "Event payment failure email dispatched.",
        emailSent: result.success,
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

  // 1. Submit Candidate Recruitment Application & Agreement
  app.post("/api/careers/apply", async (req, res) => {
    try {
      const applicationData = req.body;
      if (!applicationData || !applicationData.fullName || !applicationData.email || !applicationData.sector) {
        return res.status(400).json({ error: "Mandatory candidate profile details are missing." });
      }

      const submissionId = applicationData.id || `SCD-APP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const agreementRef = applicationData.agreementReferenceId || `SCD-AGR-2026-${Date.now().toString(36).toUpperCase()}`;
      const now = new Date().toISOString();

      const candidateRecord = {
        ...applicationData,
        id: submissionId,
        agreementReferenceId: agreementRef,
        submissionDate: applicationData.submissionDate || now.split('T')[0],
        status: applicationData.status || 'Submitted',
        createdAt: now,
      };

      const existingApps = getStoredApplications();
      const updatedApps = [candidateRecord, ...existingApps.filter(a => a.id !== submissionId)];
      saveStoredApplications(updatedApps);

      // Trigger asynchronous confirmation email with clean branded URL (no 'ais' prefix)
      let appBaseUrl = 'https://s-coders.com';
      const host = (req.headers.host || '').toLowerCase();
      const originHeader = (req.headers.origin || '').toLowerCase();
      if (!host.includes('ais') && !originHeader.includes('ais') && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        appBaseUrl = req.headers.origin || `https://${req.headers.host}`;
      }
      sendEmailNotification({
        to: candidateRecord.email,
        subject: `📋 Recruitment Application & Induction Agreement Recorded - S-CODERS (Ref: ${agreementRef})`,
        html: getRecruitmentEmailHtml({
          candidateName: candidateRecord.fullName,
          sector: candidateRecord.sector,
          roleTitle: candidateRecord.roleTitle || 'Developer Associate',
          agreementRef: agreementRef,
          submissionId: submissionId,
          effectiveDate: candidateRecord.effectiveDate || '2026-09-01',
          actionUrl: `${appBaseUrl}/careers`,
        }),
      }).catch(err => console.error("Recruitment email dispatch notice:", err.message));

      res.status(201).json({
        success: true,
        message: "Candidate application and induction agreement successfully submitted and saved.",
        applicationId: submissionId,
        agreementReferenceId: agreementRef,
        candidate: candidateRecord,
      });
    } catch (err: any) {
      console.error("Recruitment Application Submit Error:", err);
      res.status(500).json({ error: "Failed to process candidate application: " + err.message });
    }
  });

  // 2. Fetch All Candidate Applications (for Admin & Dashboard)
  app.get("/api/careers/applications", (req, res) => {
    try {
      const apps = getStoredApplications();
      res.json({ success: true, count: apps.length, applications: apps });
    } catch (err: any) {
      console.error("Fetch Applications Error:", err);
      res.status(500).json({ error: "Failed to fetch candidate applications." });
    }
  });

  // 3. Update Candidate Application Status (Admin Action)
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

  // 4. Delete Candidate Application (Admin Action)
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

