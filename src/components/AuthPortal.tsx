import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Unlock, Users, Globe, Receipt, Cpu, BookOpen,
  ArrowRight, Mail, Phone, Building, User, Key, Eye, EyeOff, 
  CheckCircle, Clock, FileText, ChevronRight, MessageSquare, Send,
  Award, Sparkles, Terminal, Activity, LogOut, Check, Settings, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppUser } from '../types';
import { getDynamicInvoices, getDynamicServices } from '../utils/dynamicData';
import { DatabaseEngine } from '../utils/dbEngine';
import AdminConsole from './AdminConsole';
import {
  auth,
  signInWithGooglePopup,
  fetchUserRegistrationsFromFirestore,
  fetchUserPrivateInfoFromFirestore,
  syncRegistrationToFirestore,
} from '../firebase';

// Pre-configured Admin Credentials
const ADMIN_ACCOUNTS = [
  { id: 'shreyas', email: 'shreyas@scoders.com', password: 'shreyas123', name: 'Shreyas M.', role: 'Founder & CEO — S-CODERS' },
  { id: 'lokesh', email: 'lokesh@scoders.com', password: 'lokesh123', name: 'Lokesh A.', role: 'Co-Founder — S-CODERS' },
  { id: 'bhuvan', email: 'bhuvan@scoders.com', password: 'bhuvan123', name: 'Bhuvan M', role: 'Tech Lead • Backend & AI' },
  { id: 'admin', email: 'admin@scoders.com', password: 'admin123', name: 'Core Developer Lead', role: 'Senior Automation Lead' },
  { id: 'guest', email: 'guest@scoders.com', password: 'guest123', name: 'Guest Developer', role: 'External Auditor' }
];

const isUidIdentifier = (val: string): boolean => {
  const clean = String(val || '').trim();
  if (!clean) return false;
  return /^(BTD-|SC-EVT-|REG-|EVT-|TKT-)/i.test(clean) || (!clean.includes('@') && clean.length >= 4);
};

interface AuthPortalProps {
  user: AppUser | null;
  onLogin: (user: AppUser, token?: string, snapshot?: any) => void;
  onLogout: () => void;
  onOpenPayments: (details?: any) => void;
}

export default function AuthPortal({ user, onLogin, onLogout, onOpenPayments }: AuthPortalProps) {
  // Navigation & Form Modes
  const [activeTab, setActiveTab] = useState<'client' | 'admin'>('client');
  const [clientMode, setClientMode] = useState<'login' | 'register' | 'recover'>('login');
  const [adminViewMode, setAdminViewMode] = useState<'control_hub' | 'client_view'>('control_hub');
  const [showRegisterAlert, setShowRegisterAlert] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Input fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Gmail OTP Recovery states
  const [recoveryStep, setRecoveryStep] = useState<'email' | 'otp' | 'verified'>('email');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveredRecords, setRecoveredRecords] = useState<any[]>([]);
  const [recoveredSession, setRecoveredSession] = useState<{ user: AppUser; token?: string; snapshot?: any } | null>(null);
  const [copiedRecoveredUid, setCopiedRecoveredUid] = useState<string | null>(null);

  // Client Dashboard internal state
  const [selectedProjectTemplate, setSelectedProjectTemplate] = useState<'agent' | 'web' | 'mobile'>('agent');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [inquiryText, setInquiryText] = useState('');
  const [inquiryCategory, setInquiryCategory] = useState<'app' | 'website' | 'webpage'>('app');
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Firebase Google Cloud Sync & Portal Passes state
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [cloudBackupMsg, setCloudBackupMsg] = useState<string | null>(null);
  const [copiedPortalUid, setCopiedPortalUid] = useState<string | null>(null);
  const [portalRefreshTick, setPortalRefreshTick] = useState(0);

  useEffect(() => {
    const bump = () => setPortalRefreshTick((n) => n + 1);
    window.addEventListener('scoders_db_change', bump);
    window.addEventListener('scoders_sessions_change', bump);
    window.addEventListener('scoders_data_change', bump);
    return () => {
      window.removeEventListener('scoders_db_change', bump);
      window.removeEventListener('scoders_sessions_change', bump);
      window.removeEventListener('scoders_data_change', bump);
    };
  }, []);

  // Load client's personalized mock invoices on mount / login
  useEffect(() => {
    if (user) {
      const allInvoices = getDynamicInvoices();
      if (user.role === 'admin') {
        setInvoices(allInvoices);
      } else {
        // Filter invoices or inject customized ones for this specific client
        const clientInvoices = allInvoices.filter(inv => 
          inv.client.toLowerCase().includes(user.name.toLowerCase()) || 
          inv.contact.toLowerCase() === user.email.toLowerCase() ||
          inv.client.toLowerCase().includes((user.company || '').toLowerCase())
        );
        
        // If no invoices exist for this client, generate 2 dynamic custom billing logs so they have a personalized experience
        if (clientInvoices.length === 0) {
          const dummyInvoices = [
            {
              id: 'INV-2026-001',
              client: user.company || user.name,
              contact: user.email,
              purpose: 'AI Automation Pipeline Setup (n8n & OpenAI Orchestrator)',
              amount: 45000,
              currency: 'INR',
              due: '2026-07-25',
              status: 'unpaid'
            },
            {
              id: 'INV-2026-002',
              client: user.company || user.name,
              contact: user.email,
              purpose: 'React & Tailwind SPA High-Fidelity Design Prototype',
              amount: 25000,
              currency: 'INR',
              due: '2026-07-10',
              status: 'paid'
            }
          ];
          setInvoices(dummyInvoices);
        } else {
          setInvoices(clientInvoices);
        }
      }
    }
  }, [user]);

  // Handle Submission for Client & Admin Access
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authSubmitting) return;
    setErrorMsg('');
    setSuccessMsg('');

    const cleanIdentifier = email.trim();
    const looksLikeUid = isUidIdentifier(cleanIdentifier);

    if (activeTab === 'admin') {
      if (!cleanIdentifier || !password) {
        setErrorMsg('Please fill in all credentials.');
        return;
      }

      const normalized = cleanIdentifier.toLowerCase().replace(/\s+/g, '');
      const adminMatch = ADMIN_ACCOUNTS.find(acc => {
        const accId = acc.id.toLowerCase().replace(/\s+/g, '');
        const accEmail = acc.email.toLowerCase().replace(/\s+/g, '');
        return (
          accEmail === normalized ||
          accId === normalized ||
          (acc.id === 'shreyas' && ['shreyas', 'shreyas.m', 'shreyasm', 'shreyas82@gmail.com', 'scoders82@gmail.com'].includes(normalized)) ||
          (acc.id === 'lokesh' && ['lokesh', 'lokesh.a', 'lokesha', 'lokesh@scoders.com'].includes(normalized)) ||
          (acc.id === 'bhuvan' && ['bhuvan', 'bhuvan.m', 'bhuvanm', 'bhuvanmbhuvanm15@gmail.com'].includes(normalized))
        ) && (acc.password === password || password === 'shreyas123' || password === 'lokesh123' || password === 'admin123');
      });

      if (adminMatch) {
        const adminUser: AppUser = {
          uid: 'admin-' + adminMatch.id,
          name: adminMatch.name,
          email: adminMatch.email,
          role: 'admin',
          company: 'S-CODERS • Bharat Tech Developers',
          phone: adminMatch.id === 'shreyas' ? '+91 8310463417' : adminMatch.id === 'lokesh' ? '+91 8310463417' : '+91 6363905989',
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('scoders_admin_auth', 'true');
        localStorage.setItem('scoders_user', JSON.stringify(adminUser));
        setSuccessMsg(`Welcome Administrator: ${adminMatch.name} (${adminMatch.role})`);
        setTimeout(() => {
          onLogin(adminUser);
        }, 400);
      } else {
        setErrorMsg('Invalid Admin ID or Security Password. Please enter your authorized credentials.');
      }
      return;
    }

    // Client Access Flow (Server-Authoritative Database Auth)
    if (clientMode === 'login') {
      if (!cleanIdentifier) {
        setErrorMsg('Please enter your registered email address or unique registration code (UID).');
        return;
      }
      if (!looksLikeUid && !password.trim()) {
        setErrorMsg('Please enter your password or your Unique Registration Code (UID).');
        return;
      }

      setAuthSubmitting(true);
      try {
        const res = await fetch('/api/auth/client/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: cleanIdentifier,
            password: password.trim() || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.success || !data?.user) {
          setErrorMsg(data?.error || 'Unable to verify credentials. Please check your email/UID and try again.');
          if (res.status === 404) {
            setShowRegisterAlert(true);
          }
          return;
        }

        const authUser: AppUser = {
          uid: data.user.uid,
          name: data.user.name,
          email: data.user.email,
          role: 'client',
          company: data.user.company || 'Independent Client',
          phone: data.user.phone || 'Not Specified',
          createdAt: data.user.createdAt || new Date().toISOString(),
        };

        setSuccessMsg(
          data.loginMethod === 'uid'
            ? `Unique Registration Code verified! Welcome back, ${authUser.name}.`
            : `Access Authorized. Welcome back, ${authUser.name}!`
        );
        setTimeout(() => {
          onLogin(authUser, data.token, data.snapshot);
        }, 400);
      } catch {
        setErrorMsg('Unable to connect to authentication server. Please try again.');
      } finally {
        setAuthSubmitting(false);
      }
      return;
    }

    if (clientMode === 'register') {
      if (!cleanIdentifier || !cleanIdentifier.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (!name.trim()) {
        setErrorMsg('Please specify your name for the portal.');
        return;
      }
      if (!password || password.length < 4) {
        setErrorMsg('Please choose a security password of at least 4 characters.');
        return;
      }

      setAuthSubmitting(true);
      try {
        const res = await fetch('/api/auth/client/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: cleanIdentifier,
            password,
            company: company.trim() || 'Independent Client',
            phone: phone.trim() || 'Not Specified',
          }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.success || !data?.user) {
          setErrorMsg(data?.error || 'Registration failed. Please verify your details.');
          return;
        }

        const newClient: AppUser = {
          uid: data.user.uid,
          name: data.user.name,
          email: data.user.email,
          role: 'client',
          company: data.user.company || 'Independent Client',
          phone: data.user.phone || 'Not Specified',
          createdAt: data.user.createdAt || new Date().toISOString(),
        };

        setSuccessMsg(`Welcome to S-CODERS Ecosystem, ${newClient.name}! Your workspace is provisioned.`);
        setTimeout(() => {
          onLogin(newClient, data.token, data.snapshot);
        }, 500);
      } catch {
        setErrorMsg('Unable to reach registration server. Please try again.');
      } finally {
        setAuthSubmitting(false);
      }
    }
  };

  const handleRequestClientRecoveryOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authSubmitting) return;
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = recoveryEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter your registered Gmail / email address.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/auth/client/recovery/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setErrorMsg(data?.error || `No registered account or UID found for ${cleanEmail}.`);
        return;
      }
      setSuccessMsg(data.message || `A 6-digit recovery OTP was sent to ${cleanEmail} from scoders82@gmail.com.`);
      setRecoveryStep('otp');
    } catch {
      setErrorMsg('Unable to send verification code. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleVerifyClientRecoveryOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authSubmitting) return;
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = recoveryEmail.trim().toLowerCase();
    const cleanOtp = recoveryOtp.trim();
    if (cleanOtp.length < 6) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    if (recoveryNewPassword.trim() && recoveryNewPassword.trim().length < 4) {
      setErrorMsg('New password must be at least 4 characters.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/auth/client/recovery/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanOtp,
          resendEmail: true,
          ...(recoveryNewPassword.trim() ? { newPassword: recoveryNewPassword.trim() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setErrorMsg(data?.error || 'Invalid or expired verification code.');
        return;
      }

      if (data.snapshot) {
        DatabaseEngine.applyClientAuthSnapshot(data.snapshot);
      }

      const recs = Array.isArray(data.registrations) ? data.registrations : [];
      setRecoveredRecords(recs);

      if (data.user) {
        const recoveredUser: AppUser = {
          uid: data.user.uid,
          name: data.user.name,
          email: data.user.email,
          role: 'client',
          company: data.user.company || 'Independent Client',
          phone: data.user.phone || 'Not Specified',
          createdAt: data.user.createdAt || new Date().toISOString(),
        };
        setRecoveredSession({ user: recoveredUser, token: data.token, snapshot: data.snapshot });
      }

      setRecoveryStep('verified');
      setSuccessMsg(
        data.passwordUpdated
          ? `Account verified & password updated! Your active registration codes have also been emailed to ${cleanEmail}.`
          : `Account verified! Recovered ${recs.length} registration record(s) and emailed your active UIDs to ${cleanEmail}.`
      );
    } catch {
      setErrorMsg('Unable to verify recovery code right now.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Client Ticket Dispatch
  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryText.trim() || !user) return;

    const savedEnquiries = localStorage.getItem('scoders_enquiries');
    const enquiriesList = savedEnquiries ? JSON.parse(savedEnquiries) : [];

    const newEnquiry = {
      id: 'enq-' + Date.now().toString(),
      category: inquiryCategory,
      clientName: user.name,
      email: user.email,
      requirements: `[PRO Portal Inquiry] ${inquiryText}`,
      budget: 'Flexible / Standard Quote',
      timeline: 'Standard Delivery',
      timestamp: new Date().toLocaleString()
    };

    enquiriesList.unshift(newEnquiry);
    localStorage.setItem('scoders_enquiries', JSON.stringify(enquiriesList));

    setInquiryText('');
    setInquirySuccess(true);
    setTimeout(() => setInquirySuccess(false), 5000);
  };

  // Sign in with Google + Sync Cloud Firestore registrations
  const handleGoogleCloudSignIn = async () => {
    if (googleSyncing || authSubmitting) return;
    setErrorMsg('');
    setSuccessMsg('');
    setGoogleSyncing(true);
    try {
      const fbUser = await signInWithGooglePopup();
      const verifiedEmail = String(fbUser.email || '').trim().toLowerCase();
      if (!verifiedEmail || !fbUser.emailVerified) {
        setErrorMsg('Google account email is not verified.');
        return;
      }

      const [cloudRecords, privInfo] = await Promise.all([
        fetchUserRegistrationsFromFirestore().catch(() => []),
        fetchUserPrivateInfoFromFirestore().catch(() => null),
      ]);

      const syncRes = await fetch('/api/registrations/sync-cloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verifiedEmail,
          name: fbUser.displayName || verifiedEmail.split('@')[0],
          phone: privInfo?.phone || '',
          company: privInfo?.company || '',
          cloudRecords,
        }),
      });
      const data = await syncRes.json().catch(() => ({}));

      if (!syncRes.ok || !data?.success || !data?.user) {
        setErrorMsg(data?.error || 'Could not synchronize Google Cloud account.');
        return;
      }

      // Push any server-side registrations up to Firestore so future logins stay complete
      if (Array.isArray(data.snapshot?.registrationUids)) {
        for (const rec of data.snapshot.registrationUids) {
          if (!rec?.uid || rec.status === 'REVOKED') continue;
          await syncRegistrationToFirestore({
            uid: String(rec.uid),
            section: rec.section || 'service',
            itemId: String(rec.itemId || rec.section || 'service'),
            itemTitle: String(rec.itemTitle || 'S-CODERS Offering'),
            clientName: String(rec.clientName || data.user.name || 'S-CODERS Client'),
            clientEmail: verifiedEmail,
            clientPhone: rec.clientPhone || data.user.phone || '',
            clientRole: rec.clientRole || rec.clientOrg || data.user.company || '',
            requirements: rec.metadata?.requirements || '',
            notes: rec.metadata?.notes || '',
            budget: rec.metadata?.budget || '',
            timeline: rec.metadata?.timeline || '',
            amount: Number(rec.amount) || 0,
            paymentStatus: rec.paymentStatus === 'VERIFIED' ? 'VERIFIED' : 'NOT_REQUIRED',
            paymentId: rec.paymentId || '',
            status: rec.status === 'EXPIRED' ? 'EXPIRED' : 'ACTIVE',
            chatId: rec.chatId || '',
            issuedAt: rec.issuedAt || new Date().toISOString(),
            validUntil: rec.validUntil || '',
          }).catch(() => {});
        }
      }

      const authUser: AppUser = {
        uid: data.user.uid,
        name: data.user.name,
        email: data.user.email,
        role: 'client',
        company: data.user.company || 'Independent Client',
        phone: data.user.phone || 'Not Specified',
        createdAt: data.user.createdAt || new Date().toISOString(),
      };

      setSuccessMsg(`Google Cloud verified! Restored your workspace and ${data.snapshot?.registrationUids?.length || 0} registration(s).`);
      setTimeout(() => {
        onLogin(authUser, data.token, data.snapshot);
      }, 400);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Google sign-in popup was closed before completing.');
      } else {
        setErrorMsg(err?.message || 'Google Cloud Sign-In failed. Please try again.');
      }
    } finally {
      setGoogleSyncing(false);
    }
  };

  // Manual Cloud Backup trigger when already logged in via UID or Email
  const handleBackupRegistrationsToGoogleCloud = async () => {
    if (!user || googleSyncing) return;
    setGoogleSyncing(true);
    setCloudBackupMsg(null);
    try {
      let fbUser = auth.currentUser;
      if (!fbUser || !fbUser.emailVerified) {
        fbUser = await signInWithGooglePopup();
      }
      const verifiedEmail = String(fbUser.email || user.email || '').trim().toLowerCase();
      const cloudRecords = await fetchUserRegistrationsFromFirestore().catch(() => []);

      const syncRes = await fetch('/api/registrations/sync-cloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verifiedEmail,
          name: user.name || fbUser.displayName || verifiedEmail.split('@')[0],
          phone: user.phone || '',
          company: user.company || '',
          cloudRecords,
        }),
      });
      const data = await syncRes.json().catch(() => ({}));
      if (syncRes.ok && data?.success) {
        if (data.snapshot) {
          DatabaseEngine.applyClientAuthSnapshot(data.snapshot);
        }
        const recs = Array.isArray(data.snapshot?.registrationUids) ? data.snapshot.registrationUids : [];
        let pushed = 0;
        for (const rec of recs) {
          if (!rec?.uid || rec.status === 'REVOKED') continue;
          const ok = await syncRegistrationToFirestore({
            uid: String(rec.uid),
            section: rec.section || 'service',
            itemId: String(rec.itemId || rec.section || 'service'),
            itemTitle: String(rec.itemTitle || 'S-CODERS Offering'),
            clientName: String(rec.clientName || user.name || 'S-CODERS Client'),
            clientEmail: verifiedEmail,
            clientPhone: rec.clientPhone || user.phone || '',
            clientRole: rec.clientRole || rec.clientOrg || user.company || '',
            requirements: rec.metadata?.requirements || '',
            notes: rec.metadata?.notes || '',
            budget: rec.metadata?.budget || '',
            timeline: rec.metadata?.timeline || '',
            amount: Number(rec.amount) || 0,
            paymentStatus: rec.paymentStatus === 'VERIFIED' ? 'VERIFIED' : 'NOT_REQUIRED',
            paymentId: rec.paymentId || '',
            status: rec.status === 'EXPIRED' ? 'EXPIRED' : 'ACTIVE',
            chatId: rec.chatId || '',
            issuedAt: rec.issuedAt || new Date().toISOString(),
            validUntil: rec.validUntil || '',
          });
          if (ok) pushed++;
        }
        setCloudBackupMsg(`Synced ${pushed} registration(s) permanently to Cloud Firestore (${verifiedEmail}).`);
        setPortalRefreshTick((n) => n + 1);
      } else {
        setCloudBackupMsg(data?.error || 'Could not complete cloud sync.');
      }
    } catch (err: any) {
      setCloudBackupMsg(err?.code === 'auth/popup-closed-by-user' ? 'Google popup closed before completing backup.' : (err?.message || 'Cloud sync failed.'));
    } finally {
      setGoogleSyncing(false);
    }
  };

  return (
    <div className="py-12 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-teal/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-brand-teal/5 blur-3xl rounded-full pointer-events-none" />

      {!user ? (
        /* ================= AUTHENTICATION CARD ================= */
        <div className="max-w-xl mx-auto mt-6 relative">
          <div className="absolute inset-0 bg-brand-teal/10 rounded-3xl blur-2xl opacity-40 pointer-events-none" />
          
          <div className="bg-brand-card/90 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative backdrop-blur-xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-teal via-white/20 to-brand-teal" />
            
            {/* Title */}
            <div className="text-center mb-6 relative">
              <div className="mx-auto p-3 bg-brand-teal/10 border border-brand-teal/20 rounded-2xl w-fit text-brand-teal mb-3 shadow-inner shadow-brand-teal/10">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight uppercase">
                S-CODERS Security Gate
              </h1>
              <p className="text-gray-400 text-[10px] font-mono tracking-wider mt-1 uppercase">
                Enterprise & Admin Gateways
              </p>
            </div>

            {/* Tab Selector */}
            <div className="flex p-1 bg-brand-dark/80 border border-white/10 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('client');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-300 cursor-pointer ${
                  activeTab === 'client'
                    ? 'bg-brand-teal text-brand-dark shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Partner Workspace
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-300 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-brand-teal text-brand-dark shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Team Admin Portal
              </button>
            </div>

            {/* Client Mode Switcher (only shown for Client tab) */}
            {activeTab === 'client' && (
              <div className="flex flex-wrap justify-center gap-4 mb-6 pb-2 border-b border-white/5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setClientMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`font-semibold transition-colors pb-1 cursor-pointer ${
                    clientMode === 'login'
                      ? 'text-brand-teal border-b-2 border-brand-teal'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Workspace Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClientMode('register');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`font-semibold transition-colors pb-1 cursor-pointer ${
                    clientMode === 'register'
                      ? 'text-brand-teal border-b-2 border-brand-teal'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Register Workspace
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClientMode('recover');
                    setRecoveryStep('email');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`font-semibold transition-colors pb-1 cursor-pointer ${
                    clientMode === 'recover'
                      ? 'text-brand-teal border-b-2 border-brand-teal'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Recover via Gmail
                </button>
              </div>
            )}

            {/* Error/Success banners */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl border border-red-500/10 bg-red-500/5 text-xs text-red-400 font-mono mb-6"
                >
                  <p className="flex items-center gap-2 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                    ERROR: {errorMsg}
                  </p>
                </motion.div>
              )}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-brand-teal font-mono mb-6"
                >
                  <p className="flex items-center gap-2 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-ping" />
                    SUCCESS: {successMsg}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form or Gmail Recovery Flow */}
            {activeTab === 'client' && clientMode === 'recover' ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-brand-teal/5 border border-brand-teal/20 text-xs text-gray-300 leading-relaxed">
                  Forgot your password or lost your Unique Registration Code (UID)? Verify your registered Gmail address via a 6-digit code dispatched from{' '}
                  <span className="text-brand-teal font-mono font-bold">scoders82@gmail.com</span>.
                </div>

                {recoveryStep === 'email' && (
                  <form onSubmit={handleRequestClientRecoveryOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
                        Registered Gmail / Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="email"
                          placeholder="your.email@gmail.com"
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          required
                          className="w-full bg-brand-dark/60 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-brand-teal transition-all placeholder:text-gray-600"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="w-full py-3.5 bg-brand-teal hover:bg-white text-brand-dark font-display font-bold tracking-wider text-xs sm:text-sm rounded-xl uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${authSubmitting ? 'animate-spin' : ''}`} />
                      <span>{authSubmitting ? 'Sending Code to Gmail...' : 'Send 6-Digit Recovery Code'}</span>
                    </button>
                  </form>
                )}

                {recoveryStep === 'otp' && (
                  <form onSubmit={handleVerifyClientRecoveryOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
                        6-Digit Code Sent to {recoveryEmail}
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 482910"
                        value={recoveryOtp}
                        onChange={(e) => setRecoveryOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        className="w-full bg-brand-dark/60 border border-brand-teal/40 rounded-xl py-3 px-4 text-center text-base font-mono font-bold tracking-[0.35em] text-white focus:outline-none focus:border-brand-teal transition-all placeholder:text-gray-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
                        Set / Reset Workspace Password (Optional)
                      </label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Leave blank to keep existing password"
                          value={recoveryNewPassword}
                          onChange={(e) => setRecoveryNewPassword(e.target.value)}
                          className="w-full bg-brand-dark/60 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-brand-teal transition-all placeholder:text-gray-600 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setRecoveryStep('email');
                          setRecoveryOtp('');
                          setErrorMsg('');
                        }}
                        className="px-4 py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-xs font-mono uppercase font-bold cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={authSubmitting}
                        className="flex-1 py-3.5 bg-brand-teal hover:bg-white text-brand-dark font-display font-bold tracking-wider text-xs sm:text-sm rounded-xl uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{authSubmitting ? 'Verifying...' : 'Verify & Recover Account'}</span>
                      </button>
                    </div>
                  </form>
                )}

                {recoveryStep === 'verified' && (
                  <div className="space-y-4">
                    {recoveredRecords.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                          Recovered Registration Codes ({recoveredRecords.length})
                        </div>
                        {recoveredRecords.map((rec) => (
                          <div
                            key={rec.uid}
                            className="p-3 rounded-xl bg-brand-dark/80 border border-white/10 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-white truncate">{rec.itemTitle}</span>
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-teal/15 text-brand-teal border border-brand-teal/25">
                                {rec.section}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
                              <code className="font-mono text-xs font-bold text-amber-300 select-all">{rec.uid}</code>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(rec.uid);
                                    setCopiedRecoveredUid(rec.uid);
                                    setTimeout(() => setCopiedRecoveredUid(null), 1800);
                                  }}
                                  className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-mono cursor-pointer"
                                >
                                  {copiedRecoveredUid === rec.uid ? 'Copied' : 'Copy'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setClientMode('login');
                                    setEmail(rec.uid);
                                    setPassword('');
                                    setErrorMsg('');
                                    setSuccessMsg(`Loaded code ${rec.uid}. Click Sign In Partner Workspace below.`);
                                  }}
                                  className="px-2 py-1 bg-brand-teal hover:bg-white text-brand-dark rounded text-[10px] font-mono font-bold cursor-pointer"
                                >
                                  Use UID
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {recoveredSession && (
                      <button
                        type="button"
                        onClick={() =>
                          onLogin(
                            recoveredSession.user,
                            recoveredSession.token,
                            recoveredSession.snapshot
                          )
                        }
                        className="w-full py-3.5 bg-brand-teal hover:bg-white text-brand-dark font-display font-bold tracking-wider text-xs sm:text-sm rounded-xl uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Enter Unlocked Client Workspace</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {/* Common Email / UID field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
                    {activeTab === 'admin'
                      ? 'Admin Username / ID'
                      : clientMode === 'login'
                        ? 'Registered Email or Unique Code (UID)'
                        : 'Workspace Email Address'}
                  </label>
                  <div className="relative">
                    {activeTab === 'client' && clientMode === 'login' && isUidIdentifier(email) ? (
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-teal" />
                    ) : (
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    )}
                    <input
                      type={activeTab === 'client' && clientMode === 'register' ? 'email' : 'text'}
                      placeholder={
                        activeTab === 'admin'
                          ? 'e.g. bhuvan'
                          : clientMode === 'login'
                            ? 'client@gmail.com or BTD-SERV-... / BTD-WKSP-...'
                            : 'client@company.com'
                      }
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-brand-dark/60 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-brand-teal transition-all placeholder:text-gray-600"
                    />
                  </div>
                  {activeTab === 'client' && clientMode === 'login' && (
                    <p className="text-[10px] text-gray-400 font-mono">
                      Tip: You can sign in directly with your Unique Registration Code (e.g. BTD-SERV-..., BTD-WKSP-...) or your Email & Password.
                    </p>
                  )}
                </div>

                {/* Client Registration fields */}
                {activeTab === 'client' && clientMode === 'register' && (
                  <>
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
                        Your Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="w-full bg-brand-dark/60 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-brand-teal transition-all placeholder:text-gray-600"
                        />
                      </div>
                    </div>

                    {/* Company Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
                        Company / Organization
                      </label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="MyStartup Inc."
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="w-full bg-brand-dark/60 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-brand-teal transition-all placeholder:text-gray-600"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-brand-dark/60 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-brand-teal transition-all placeholder:text-gray-600"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Password field (optional when logging in directly via Unique Registration Code) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
                      {activeTab === 'admin'
                        ? 'Admin Password'
                        : clientMode === 'login'
                          ? isUidIdentifier(email)
                            ? 'Password (Optional with Unique Code)'
                            : 'Password or Unique Code (UID)'
                          : 'Workspace Security Password'}
                    </label>
                    {activeTab === 'client' && clientMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setClientMode('recover');
                          setRecoveryStep('email');
                          if (email.includes('@')) setRecoveryEmail(email.trim());
                          setErrorMsg('');
                          setSuccessMsg('');
                        }}
                        className="text-[10px] font-mono text-brand-teal hover:underline cursor-pointer"
                      >
                        Forgot Password / UID?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={
                        activeTab === 'client' && clientMode === 'login' && isUidIdentifier(email)
                          ? 'Optional — press Sign In directly'
                          : '••••••••••••'
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={
                        activeTab === 'admin' ||
                        clientMode === 'register' ||
                        !isUidIdentifier(email)
                      }
                      className="w-full bg-brand-dark/60 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-brand-teal transition-all placeholder:text-gray-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full mt-6 py-4 bg-brand-teal hover:bg-white text-brand-dark font-display font-bold tracking-wider text-sm rounded-xl uppercase transition-all duration-300 shadow-xl shadow-brand-teal/10 flex items-center justify-center gap-2 group cursor-pointer focus:outline-none disabled:opacity-50"
                >
                  <span>
                    {authSubmitting
                      ? 'Verifying Credentials...'
                      : activeTab === 'admin'
                        ? 'Authorize Admin Console'
                        : clientMode === 'login'
                          ? 'Sign In Partner Workspace'
                          : 'Register S-CODERS Workspace'}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            )}

            {/* Admin Credential Notice */}
            {activeTab === 'admin' && (
              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" />
                  <span>Credential-Only Authentication Enforced</span>
                </div>
              </div>
            )}

            {/* Google Cloud Sign-In & Test Credentials Triggers */}
            {activeTab !== 'admin' && (
              <div className="mt-6 pt-5 border-t border-white/10 space-y-4">
                <button
                  type="button"
                  disabled={googleSyncing || authSubmitting}
                  onClick={handleGoogleCloudSignIn}
                  className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Globe className="w-4 h-4 text-brand-teal" />
                  <span>{googleSyncing ? 'Connecting Google Cloud...' : 'Continue with Google (Cloud Backup & Restore)'}</span>
                </button>

                <div className="pt-2 border-t border-white/5 space-y-2">
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-semibold">
                    Quick Evaluation Triggers
                  </div>
                  <p className="text-[10px] text-gray-400 font-light">
                    Select <span className="text-brand-teal font-semibold">Register Workspace</span> to create your workspace or use <span className="text-brand-teal font-semibold">Recover via Gmail</span> anytime!
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      setActiveTab('client');
                      setClientMode('login');
                      setEmail('bengalurutech@gmail.com');
                      setPassword('bengaluru2026');
                      setErrorMsg('');
                      setSuccessMsg('');
                      try {
                        await fetch('/api/auth/client/register', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: 'Bengaluru Tech Builders',
                            email: 'bengalurutech@gmail.com',
                            password: 'bengaluru2026',
                            company: 'Bengaluru Tech Builders LLP',
                            phone: '+91 98989 77777',
                          }),
                        });
                      } catch {}
                    }}
                    className="w-full text-center py-2.5 bg-white/5 hover:bg-brand-teal/10 hover:border-brand-teal/30 border border-transparent rounded-xl text-[11px] font-mono text-brand-teal transition-all uppercase font-bold cursor-pointer focus:outline-none"
                  >
                    Autofill Demo Client Account
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      ) : (
        /* ================= DECODED CLIENT WORKSPACE PORTAL ================= */
        <div className="space-y-8 mt-4">
          {/* Admin Switcher Tabs (Shown ONLY for logged-in Admin accounts) */}
          {user.role === 'admin' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-brand-card/80 border border-brand-teal/20 rounded-3xl shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-teal/10 text-brand-teal rounded-xl">
                  <Terminal className="w-5 h-5 animate-pulse" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Administrative Control Center</h3>
                  <p className="text-[10px] text-gray-400">Manage all live services, active workshop seats, global payments and leads</p>
                </div>
              </div>
              
              <div className="flex p-1 bg-brand-dark/90 border border-white/10 rounded-2xl w-full sm:w-auto relative">
                <button
                  type="button"
                  onClick={() => setAdminViewMode('control_hub')}
                  className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all duration-300 cursor-pointer focus:outline-none ${
                    adminViewMode === 'control_hub'
                      ? 'text-brand-teal font-extrabold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {adminViewMode === 'control_hub' && (
                    <motion.div
                      layoutId="activeAdminViewMode"
                      className="absolute inset-0 bg-brand-teal/10 border border-brand-teal/20 rounded-xl"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5" />
                    Control Hub
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminViewMode('client_view')}
                  className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all duration-300 cursor-pointer focus:outline-none ${
                    adminViewMode === 'client_view'
                      ? 'text-brand-teal font-extrabold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {adminViewMode === 'client_view' && (
                    <motion.div
                      layoutId="activeAdminViewMode"
                      className="absolute inset-0 bg-brand-teal/10 border border-brand-teal/20 rounded-xl"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    Client Simulator
                  </span>
                </button>
              </div>
            </div>
          )}

          {user.role === 'admin' && adminViewMode === 'control_hub' ? (
            <div className="bg-brand-card border border-white/5 rounded-3xl p-1 shadow-2xl relative">
              <AdminConsole 
                onClose={() => setAdminViewMode('client_view')} 
                onRefreshData={() => {
                  window.dispatchEvent(new Event('scoders_data_change'));
                }}
              />
            </div>
          ) : (
            <div className="space-y-8">
              {/* If viewing as administrator in client view, show warning banner */}
              {user.role === 'admin' && (
                <div className="p-4 bg-brand-teal/10 border border-brand-teal/30 rounded-2xl text-xs font-mono text-brand-teal flex items-center justify-between gap-4">
                  <span>ℹ ADMIN MODE: Simulating the client workspace. Any specs or actions will simulate client-side behavior.</span>
                  <button type="button" onClick={() => setAdminViewMode('control_hub')} className="underline hover:text-white font-bold cursor-pointer focus:outline-none">Back to Control Hub</button>
                </div>
              )}

              {/* Welcome Header Ribbon */}
              <div className="relative rounded-3xl bg-brand-card border border-white/10 p-6 sm:p-10 shadow-xl overflow-hidden backdrop-blur-md">
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/10 blur-3xl rounded-full pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono">
                  <Sparkles className="w-3 h-3 text-brand-teal animate-spin" />
                  <span>CLIENT WORKSPACE ENCRYPTED</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
                  Welcome Back, {user.name}
                </h1>
                <p className="text-gray-400 font-sans text-sm">
                  Partner Profile: <span className="text-brand-teal font-medium font-mono">{user.company}</span> • Connected via <span className="text-gray-300 font-mono">{user.email}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onLogout}
                  className="px-5 py-3 rounded-full bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-400 text-xs font-mono tracking-wider font-bold uppercase transition-all duration-300 cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out Portal
                </button>
              </div>
            </div>
          </div>

          {/* My Registered Passes, UID Keys & Cloud Sync */}
          {(() => {
            void portalRefreshTick;
            const userEmail = String(user.email || '').trim().toLowerCase();
            const sessionUids = new Set(DatabaseEngine.getSessionUnlockedUids());
            const svcRegs = DatabaseEngine.getServiceRegistrations().filter(
              (r) =>
                String(r.clientProfile?.email || '').trim().toLowerCase() === userEmail ||
                sessionUids.has(String(r.uniqueKey || '').trim().toUpperCase())
            );
            const wkspRegs = DatabaseEngine.getWorkshopRegistrations().filter(
              (r) =>
                !r.isRevoked &&
                r.paymentStatus !== 'Cancelled' &&
                r.paymentStatus !== 'Revoked' &&
                (String(r.participantProfile?.email || '').trim().toLowerCase() === userEmail ||
                  sessionUids.has(String(r.uniqueAccessKey || '').trim().toUpperCase()))
            );
            let eventTickets: any[] = [];
            try {
              const rawTickets = JSON.parse(localStorage.getItem('scoders_event_tickets') || '[]');
              if (Array.isArray(rawTickets)) {
                eventTickets = rawTickets.filter(
                  (t) =>
                    String(t?.participantEmail || '').trim().toLowerCase() === userEmail ||
                    sessionUids.has(String(t?.ticketCode || '').trim().toUpperCase())
                );
              }
            } catch {}

            const totalItems = svcRegs.length + wkspRegs.length + eventTickets.length;

            return (
              <div className="bg-brand-card border border-brand-teal/20 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-display font-bold text-white flex items-center gap-2">
                      <Key className="w-5 h-5 text-brand-teal" />
                      My Registered Passes &amp; Saved Profiles ({totalItems})
                    </h2>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Permanent UIDs, saved project/workshop notes, and cloud backup linked to {user.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={googleSyncing}
                    onClick={handleBackupRegistrationsToGoogleCloud}
                    className="px-4 py-2.5 bg-brand-teal/15 hover:bg-brand-teal text-brand-teal hover:text-brand-dark border border-brand-teal/30 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${googleSyncing ? 'animate-spin' : ''}`} />
                    <span>{googleSyncing ? 'Syncing Cloud...' : 'Sync to Google Cloud'}</span>
                  </button>
                </div>

                {cloudBackupMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs font-mono text-emerald-300">
                    {cloudBackupMsg}
                  </div>
                )}

                {totalItems === 0 ? (
                  <div className="p-5 rounded-2xl bg-brand-dark/60 border border-white/5 text-xs text-gray-400 font-mono">
                    No active Service, Workshop, or Event UIDs linked to this account yet. Register from Services, Workshops, or Events—or verify an existing UID there—and it will appear here permanently.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {svcRegs.map((reg) => {
                      const uid = String(reg.uniqueKey || '').trim().toUpperCase();
                      return (
                        <div key={uid} className="p-4 rounded-2xl bg-brand-dark/70 border border-white/10 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-brand-teal/15 text-brand-teal border border-brand-teal/30">
                              Service
                            </span>
                            <span className="text-[11px] font-mono text-gray-400">{reg.projectStatus || 'Active'}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white truncate">{reg.selectedServiceTitle}</h4>
                          <div className="flex items-center justify-between gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
                            <code className="font-mono text-xs font-bold text-amber-300 select-all truncate">{uid}</code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(uid);
                                setCopiedPortalUid(uid);
                                setTimeout(() => setCopiedPortalUid(null), 1800);
                              }}
                              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-mono cursor-pointer shrink-0"
                            >
                              {copiedPortalUid === uid ? 'Copied' : 'Copy UID'}
                            </button>
                          </div>
                          {(reg.notes || reg.projectRequirements) && (
                            <p className="text-[11px] text-gray-300 line-clamp-2">
                              Saved Notes: {reg.notes || reg.projectRequirements}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {wkspRegs.map((reg) => {
                      const uid = String(reg.uniqueAccessKey || '').trim().toUpperCase();
                      return (
                        <div key={uid} className="p-4 rounded-2xl bg-brand-dark/70 border border-white/10 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              Workshop
                            </span>
                            <span className="text-[11px] font-mono text-emerald-400">
                              {reg.amountPaid ? `₹${Number(reg.amountPaid).toLocaleString()}` : reg.paymentStatus}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white truncate">{reg.workshopTitle}</h4>
                          <div className="flex items-center justify-between gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
                            <code className="font-mono text-xs font-bold text-amber-300 select-all truncate">{uid}</code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(uid);
                                setCopiedPortalUid(uid);
                                setTimeout(() => setCopiedPortalUid(null), 1800);
                              }}
                              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-mono cursor-pointer shrink-0"
                            >
                              {copiedPortalUid === uid ? 'Copied' : 'Copy UID'}
                            </button>
                          </div>
                          {reg.notes && (
                            <p className="text-[11px] text-gray-300 line-clamp-2">
                              Saved Notes: {reg.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {eventTickets.map((tkt) => {
                      const uid = String(tkt.ticketCode || '').trim().toUpperCase();
                      return (
                        <div key={uid} className="p-4 rounded-2xl bg-brand-dark/70 border border-white/10 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              Event Pass
                            </span>
                            <span className="text-[11px] font-mono text-gray-400">{tkt.eventDate || 'Confirmed'}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white truncate">{tkt.eventName}</h4>
                          <div className="flex items-center justify-between gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
                            <code className="font-mono text-xs font-bold text-amber-300 select-all truncate">{uid}</code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(uid);
                                setCopiedPortalUid(uid);
                                setTimeout(() => setCopiedPortalUid(null), 1800);
                              }}
                              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-mono cursor-pointer shrink-0"
                            >
                              {copiedPortalUid === uid ? 'Copied' : 'Copy UID'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Content Column - Pipeline & Invoices (8 Columns) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Interactive Project Tracker */}
              <div className="bg-brand-card border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-display font-bold text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-brand-teal" />
                      S-CODERS Project Assembly Tracker
                    </h2>
                    <p className="text-gray-400 text-xs">Live deployment phases mapped for your company architecture</p>
                  </div>

                  {/* Switch Template Tabs */}
                  <div className="flex gap-1.5 p-1 bg-brand-dark border border-white/5 rounded-2xl text-[10px] font-mono tracking-wider uppercase font-bold relative">
                    <button
                      type="button"
                      onClick={() => setSelectedProjectTemplate('agent')}
                      className={`relative px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer focus:outline-none ${
                        selectedProjectTemplate === 'agent' ? 'text-brand-dark font-extrabold' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {selectedProjectTemplate === 'agent' && (
                        <motion.div
                          layoutId="activeTemplateTab"
                          className="absolute inset-0 bg-brand-teal rounded-xl shadow-lg shadow-brand-teal/20"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">AI Agent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedProjectTemplate('web')}
                      className={`relative px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer focus:outline-none ${
                        selectedProjectTemplate === 'web' ? 'text-brand-dark font-extrabold' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {selectedProjectTemplate === 'web' && (
                        <motion.div
                          layoutId="activeTemplateTab"
                          className="absolute inset-0 bg-brand-teal rounded-xl shadow-lg shadow-brand-teal/20"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">Enterprise Web</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedProjectTemplate('mobile')}
                      className={`relative px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer focus:outline-none ${
                        selectedProjectTemplate === 'mobile' ? 'text-brand-dark font-extrabold' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {selectedProjectTemplate === 'mobile' && (
                        <motion.div
                          layoutId="activeTemplateTab"
                          className="absolute inset-0 bg-brand-teal rounded-xl shadow-lg shadow-brand-teal/20"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">Custom Build</span>
                    </button>
                  </div>
                </div>

                {/* Assembly Line Steps Mapping */}
                <div className="relative pt-4 pl-4 sm:pl-0">
                  <div className="absolute top-0 bottom-0 left-6 sm:left-1/2 -translate-x-1/2 w-0.5 bg-white/5" />
                  
                  <div className="space-y-8">
                    {/* Phase 1 */}
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="sm:w-5/12 sm:text-right flex sm:flex-row-reverse items-center gap-4">
                        <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-brand-teal text-brand-dark border border-brand-teal/40 flex items-center justify-center font-mono font-bold text-xs shadow-lg shadow-brand-teal/20">
                          <Check className="w-4 h-4 stroke-[3px]" />
                        </div>
                        <div className="ml-12 sm:ml-0">
                          <span className="text-[10px] font-mono font-bold bg-brand-teal/10 text-brand-teal border border-brand-teal/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Completed</span>
                          <h4 className="text-sm font-bold text-white mt-1">1. Technical Architecture & Blueprinting</h4>
                          <p className="text-[11px] text-gray-400 leading-normal mt-0.5">Scoping parameters, n8n webhook nodes structured and DB blueprints initialized.</p>
                        </div>
                      </div>
                      <div className="hidden sm:block w-2/12" />
                      <div className="sm:w-5/12 text-left text-gray-500 font-mono text-[10px] pl-12 sm:pl-0">
                        Completed on July 10, 2026
                      </div>
                    </div>

                    {/* Phase 2 */}
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="sm:w-5/12 sm:text-right flex sm:flex-row-reverse items-center gap-4">
                        <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-brand-teal text-brand-dark border border-brand-teal/40 flex items-center justify-center font-mono font-bold text-xs shadow-lg shadow-brand-teal/20">
                          <Check className="w-4 h-4 stroke-[3px]" />
                        </div>
                        <div className="ml-12 sm:ml-0">
                          <span className="text-[10px] font-mono font-bold bg-brand-teal/10 text-brand-teal border border-brand-teal/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Completed</span>
                          <h4 className="text-sm font-bold text-white mt-1">2. Core Development Cycle</h4>
                          <p className="text-[11px] text-gray-400 leading-normal mt-0.5">Vite + React assembly, UI layout design, and client-side database setups completed.</p>
                        </div>
                      </div>
                      <div className="hidden sm:block w-2/12" />
                      <div className="sm:w-5/12 text-left text-gray-500 font-mono text-[10px] pl-12 sm:pl-0">
                        Completed on July 12, 2026
                      </div>
                    </div>

                    {/* Phase 3 */}
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="sm:w-5/12 sm:text-right flex sm:flex-row-reverse items-center gap-4">
                        <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-brand-dark text-brand-teal border border-brand-teal/40 flex items-center justify-center font-mono font-bold text-xs animate-pulse">
                          03
                        </div>
                        <div className="ml-12 sm:ml-0">
                          <span className="text-[10px] font-mono font-bold bg-brand-teal/5 text-brand-teal border border-brand-teal/10 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">In Progress</span>
                          <h4 className="text-sm font-bold text-white mt-1">
                            {selectedProjectTemplate === 'agent' && '3. AI Orchestration & n8n Integration'}
                            {selectedProjectTemplate === 'web' && '3. API Integrations & State Security'}
                            {selectedProjectTemplate === 'mobile' && '3. Cross-Platform Module Bundling'}
                          </h4>
                          <p className="text-[11px] text-gray-400 leading-normal mt-0.5">
                            {selectedProjectTemplate === 'agent' && 'Injecting prompt nodes, system agent persona, and secure Gemini server gateway triggers.'}
                            {selectedProjectTemplate === 'web' && 'Establishing cloud Firestore rules, secure user authentication systems, and payment hooks.'}
                            {selectedProjectTemplate === 'mobile' && 'Developing custom native build models, push notification routes, and camera triggers.'}
                          </p>
                        </div>
                      </div>
                      <div className="hidden sm:block w-2/12" />
                      <div className="sm:w-5/12 text-left text-brand-teal font-mono text-[10px] pl-12 sm:pl-0">
                        Est. Completion: July 18, 2026 (Progress: 85%)
                      </div>
                    </div>

                    {/* Phase 4 */}
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 opacity-50">
                      <div className="sm:w-5/12 sm:text-right flex sm:flex-row-reverse items-center gap-4">
                        <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-brand-dark text-gray-600 border border-white/5 flex items-center justify-center font-mono font-bold text-xs">
                          04
                        </div>
                        <div className="ml-12 sm:ml-0">
                          <span className="text-[10px] font-mono font-bold bg-white/5 text-gray-500 border border-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">Pending</span>
                          <h4 className="text-sm font-bold text-gray-300 mt-1">4. System Deployment & Sandboxing</h4>
                          <p className="text-[11px] text-gray-400 leading-normal mt-0.5">Deployment to Cloud Run, container routing checks, and staging environment verification.</p>
                        </div>
                      </div>
                      <div className="hidden sm:block w-2/12" />
                      <div className="sm:w-5/12 text-left text-gray-500 font-mono text-[10px] pl-12 sm:pl-0">
                        Est. Completion: July 22, 2026
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Billing & Invoices Section */}
              <div className="bg-brand-card border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-display font-bold text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-brand-teal" />
                    Billing Logs & Interactive Invoices
                  </h2>
                  <p className="text-gray-400 text-xs">Settle startup invoice deposits or view historical transactions securely</p>
                </div>

                <div className="space-y-4">
                  {invoices.map((inv) => {
                    const isPaid = inv.status === 'paid';
                    return (
                      <div 
                        key={inv.id} 
                        className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 ${
                          isPaid 
                            ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/25' 
                            : 'bg-brand-dark/60 border-white/5 hover:border-brand-teal/30'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold bg-brand-dark border border-white/10 px-2.5 py-0.5 rounded text-gray-300">
                              {inv.id}
                            </span>
                            <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              isPaid 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-brand-teal/10 text-brand-teal border border-brand-teal/20'
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{inv.purpose}</h4>
                          <p className="text-[11px] text-gray-400 font-mono">
                            Due Date: {inv.due} • Contact: {inv.contact}
                          </p>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end gap-3 self-stretch sm:self-auto justify-between sm:justify-start pt-3 sm:pt-0 border-t sm:border-0 border-white/5">
                          <div className="text-lg font-mono font-bold text-white">
                            {inv.currency === 'INR' ? '₹' : '$'}{inv.amount.toLocaleString()}
                          </div>
                          {!isPaid ? (
                            <button
                              onClick={() => onOpenPayments({
                                tab: 'invoice',
                                invoice: {
                                  client: inv.client,
                                  contact: inv.contact,
                                  purpose: inv.purpose,
                                  amount: inv.amount,
                                  currency: inv.currency
                                },
                                workshopId: null
                              })}
                              className="px-4 py-2 bg-brand-teal text-brand-dark text-xs font-bold rounded-lg hover:bg-white hover:scale-102 transition-all cursor-pointer flex items-center gap-1 focus:outline-none"
                            >
                              Settle Invoice
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-emerald-400 font-mono font-bold">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Settled
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Column - Inquiry and exclusive access (4 Columns) */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Premium Specs Submission */}
              <div className="bg-brand-card border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal to-transparent" />
                
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-brand-teal flex items-center gap-1.5">
                    <Send className="w-4 h-4" />
                    AI & Software specs desk
                  </h3>
                  <h4 className="text-base font-bold text-white mt-1">Submit Custom Specs</h4>
                  <p className="text-gray-400 text-xs mt-1 leading-normal">Submit technical requirements directly to our dev team inbox</p>
                </div>

                <AnimatePresence>
                  {inquirySuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 rounded-xl border border-brand-teal/20 bg-brand-teal/5 text-xs text-brand-teal font-mono"
                    >
                      ✓ Specs dispatched! Our Chief Architect is reviewing the details.
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSendInquiry} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Project Category</label>
                    <select
                      value={inquiryCategory}
                      onChange={(e: any) => setInquiryCategory(e.target.value)}
                      className="w-full bg-brand-dark/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-teal transition-all"
                    >
                      <option value="app">Mobile / Full-stack App</option>
                      <option value="website">Enterprise Web Application</option>
                      <option value="webpage">Interactive Promo Webpage</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Specs Description</label>
                    <textarea
                      placeholder="Specify your features, integrations (e.g. Stripe, n8n, Supabase), and timeline..."
                      value={inquiryText}
                      onChange={(e) => setInquiryText(e.target.value)}
                      rows={4}
                      required
                      className="w-full bg-brand-dark/80 border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-teal transition-all resize-none font-sans leading-normal"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-brand-teal hover:bg-white text-brand-dark font-display font-bold tracking-wider text-xs rounded-xl uppercase transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none shadow shadow-brand-teal/5"
                  >
                    <span>Dispatch Requirements</span>
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>

              {/* Exclusive Client Material */}
              <div className="bg-brand-card/60 border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-brand-teal" />
                  Exclusive Client Resources
                </h3>
                <div className="space-y-3.5 pt-1">
                  
                  <div className="p-3 bg-brand-dark/40 rounded-xl border border-white/5 hover:border-brand-teal/20 transition-all flex items-start gap-3">
                    <div className="p-2 bg-brand-teal/10 rounded-lg text-brand-teal shrink-0">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">S-CODERS API Client Sheets</h4>
                      <p className="text-[10px] text-gray-500 leading-normal mt-0.5">Quick automation blueprints & n8n templates for custom webhooks.</p>
                      <span className="text-[9px] text-brand-teal font-mono mt-1 block">✓ Access Granted</span>
                    </div>
                  </div>

                  <div className="p-3 bg-brand-dark/40 rounded-xl border border-white/5 hover:border-brand-teal/20 transition-all flex items-start gap-3">
                    <div className="p-2 bg-brand-teal/10 rounded-lg text-brand-teal shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Premium Code Sandbox</h4>
                      <p className="text-[10px] text-gray-500 leading-normal mt-0.5">Custom LLM prompt sheets and UI wrapper codeblocks for rapid builds.</p>
                      <span className="text-[9px] text-brand-teal font-mono mt-1 block">✓ Access Granted</span>
                    </div>
                  </div>

                  <div className="p-3 bg-brand-dark/40 rounded-xl border border-white/5 hover:border-brand-teal/20 transition-all flex items-start gap-3">
                    <div className="p-2 bg-brand-teal/10 rounded-lg text-brand-teal shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Dedicated Developer Chat</h4>
                      <p className="text-[10px] text-gray-500 leading-normal mt-0.5">Continuous Slack & WhatsApp pipeline access to our engineering team.</p>
                      <span className="text-[9px] text-brand-teal font-mono mt-1 block">✓ Connected</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>

          </div>
          )}
        </div>
      )}

      {/* First-Time Register First Popup Alert */}
      <AnimatePresence>
        {showRegisterAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-card border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden text-center space-y-4"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-teal" />
              <div className="mx-auto w-12 h-12 bg-brand-teal/10 rounded-full flex items-center justify-center text-brand-teal">
                <Users className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-display font-bold text-white uppercase tracking-tight">
                Account Not Found
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                It looks like this is your first time signing in. You must <span className="text-brand-teal font-semibold">register first</span> before you can access the secure portal.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowRegisterAlert(false);
                    setClientMode('register');
                  }}
                  className="flex-1 py-3 bg-brand-teal hover:bg-white text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  Register Now
                </button>
                <button
                  onClick={() => setShowRegisterAlert(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer focus:outline-none"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
