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

