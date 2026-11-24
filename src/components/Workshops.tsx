import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Calendar, MapPin, Users, Award, Sparkles, MessageSquare, 
  Send, User, Star, CheckCircle, ArrowRight, Edit2, Save, X, Plus, Minus,
  Lock, Key, Copy, Code, Terminal, Download, Play, MessageCircle, Eye, Shield, Check, RefreshCw,
  ShieldCheck, CreditCard, Wallet, Upload, Clock, Wrench, BookOpen, Cpu, CheckSquare, HelpCircle,
  ExternalLink, Linkedin, Github, Phone, Mail, AlertTriangle, CheckCircle2, Trash2, CalendarX2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MarqueeTicker from './MarqueeTicker';
import { INITIAL_COMMENTS } from '../data';
import { getDynamicWorkshops, saveDynamicWorkshops } from '../utils/dynamicData';
import { WorkshopComment, WorkshopEvent, AppUser } from '../types';
import { DatabaseEngine, WorkshopRegistration, PaymentTransaction, ChatConversation, FileRecord } from '../utils/dbEngine';
import RazorpayModal, { RazorpayPaymentSuccessData } from './RazorpayModal';
import EmailNotificationModal, { EmailNotificationData } from './EmailNotificationModal';
import { getActiveMerchantUpi, DEFAULT_BHUVAN_UPI } from '../utils/paymentLinks';
import { getLeaderPhoto } from '../utils/leaderPhotos';
import { 
  downloadN8nWorkflowBlueprint, 
  downloadGeminiSystemPromptsPdf, 
  downloadSaasBoilerplateZip, 
  downloadSessionDeckExercisesPdf,
  downloadWorkshopKitBundle,
  triggerFileDownload
} from '../utils/workshopAssetGenerator';
import WorkshopChatRoom from './WorkshopChatRoom';
import { OnlineCodePlayground } from './OnlineCodePlayground';
import UidRecoveryPanel from './UidRecoveryPanel';
import RegistrationClosedModal from './RegistrationClosedModal';
import {
  evaluateRegistrationWindow,
  checkServerRegistrationWindow,
  syncServerClock,
  getAuthoritativeNowMs,
  getTodayIsoDateIst,
  normalizeIsoDateOnly,
  RegistrationWindowEvaluation,
} from '../utils/registrationWindow';
import { buildPublicShareUrl } from '../utils/shareUrl';
import { getWorkshopWhatsappGroup, sanitizeWhatsappUrl } from '../utils/workshopWhatsapp';

interface WorkshopsProps {
  onBookWorkshop?: (details: { workshopId: string; title: string; seats: number; totalAmount: number }) => void;
}

export default function Workshops({ onBookWorkshop }: WorkshopsProps) {
  const [workshops, setWorkshops] = useState(getDynamicWorkshops);
  
  const initialWorkshopId = workshops.length > 0 ? workshops[0].id : '';
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string>(initialWorkshopId);
  const [seatCount, setSeatCount] = useState<number>(1);
  
  // Comments state with localStorage persistence
  const [comments, setComments] = useState<WorkshopComment[]>(() => {
    const saved = localStorage.getItem('scoders_comments');
    if (saved) return JSON.parse(saved);
    return INITIAL_COMMENTS;
  });

  // Comment Form States
  const [authorName, setAuthorName] = useState('');
  const [role, setRole] = useState('Attendee');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Admin and Dynamic Sync States
  const [editingWorkshopId, setEditingWorkshopId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [editingWaGroup, setEditingWaGroup] = useState(false);
  const [waGroupNameDraft, setWaGroupNameDraft] = useState('');
  const [waGroupLinkDraft, setWaGroupLinkDraft] = useState('');
  const [waGroupSavedToast, setWaGroupSavedToast] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('scoders_admin_auth') === 'true';
  });

  // Access control state persistence
  const [registeredKeys, setRegisteredKeys] = useState<{
    [workshopId: string]: {
      key: string;
      name: string;
      email: string;
      role: string;
      timestamp: string;
      chatId?: string;
    }
  }>(() => {
    let keys: Record<string, any> = {};
    const saved = localStorage.getItem('scoders_registered_workshops');
    if (saved) {
      try {
        keys = JSON.parse(saved) || {};
      } catch (e) {}
    }
    try {
      const dbRegs = DatabaseEngine.getWorkshopRegistrations();
      if (Array.isArray(dbRegs)) {
        for (const reg of dbRegs) {
          if (reg.workshopId && reg.uniqueAccessKey && !keys[reg.workshopId]) {
            keys[reg.workshopId] = {
              key: reg.uniqueAccessKey,
              name: reg.participantProfile?.name || 'Registered Attendee',
              email: reg.participantProfile?.email || '',
              role: reg.participantProfile?.role || 'Attendee',
              chatId: reg.chatId || `chat-wksp-${reg.uniqueAccessKey}`,
              timestamp: reg.paymentDate || new Date().toISOString()
            };
          }
        }
      }
    } catch (e) {}
    return keys;
  });

  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('Developer');
  const [showRegModal, setShowRegModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [regSuccessKey, setRegSuccessKey] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState('');
  const [manualKeyError, setManualKeyError] = useState<string | null>(null);
  const [verifyingManualKey, setVerifyingManualKey] = useState(false);
  const [regMode, setRegMode] = useState<'register' | 'enterKey' | 'recover'>('register');
  const [payTicketsCount, setPayTicketsCount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Razorpay Gateway Modal Integration States (Active Payment Method)
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState<{
    orderId: string;
    amount: number;
    currency: string;
    keyId?: string;
  } | null>(null);
  const [razorpayPaymentDetails, setRazorpayPaymentDetails] = useState<{
    amount: number;
    currency: string;
    clientName: string;
    email: string;
    phone?: string;
    purpose: string;
    merchantUpiId: string;
  } | null>(null);

  // Email Notification Modal State (scoders82@gmail.com)
  const [showEmailNotice, setShowEmailNotice] = useState(false);
  const [emailNoticeData, setEmailNoticeData] = useState<EmailNotificationData | null>(null);

  // Cancel Workshop Confirmation Pop-Up & Auto-Save States
  const [showCancelWorkshopConfirm, setShowCancelWorkshopConfirm] = useState(false);
  const [isCancellingWorkshop, setIsCancellingWorkshop] = useState(false);
  const [cancelWorkshopError, setCancelWorkshopError] = useState<string | null>(null);
  const [cancelWorkshopNotice, setCancelWorkshopNotice] = useState<string | null>(null);
  const [cancelTargetWorkshop, setCancelTargetWorkshop] = useState<{
    workshopId: string;
    workshopTitle: string;
    key?: string;
    email?: string;
    chatId?: string;
  } | null>(null);
  const [wkspAutoSaveStatus, setWkspAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [wkspManualSaveFlash, setWkspManualSaveFlash] = useState(false);
  const wkspDraftFirstRenderRef = useRef(true);

  // Registration Window Deadline & Admin Date Edit States
  const [windowTickNowMs, setWindowTickNowMs] = useState<number>(() => getAuthoritativeNowMs());
  const [closedModalEval, setClosedModalEval] = useState<RegistrationWindowEvaluation | null>(null);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [editingWkspDates, setEditingWkspDates] = useState(false);
  const [wkspRegStartDraft, setWkspRegStartDraft] = useState('');
  const [wkspRegEndDraft, setWkspRegEndDraft] = useState('');
  const [wkspDateDraftError, setWkspDateDraftError] = useState<string | null>(null);

  // Active Workshop Classroom States
  const [activeTab, setActiveTab] = useState<'sandbox' | 'resources' | 'discussion'>('sandbox');
  const [activeWorkspaceWorkshop, setActiveWorkspaceWorkshop] = useState<WorkshopEvent | null>(null);
  
  // Sandbox State
  const [sandboxCode, setSandboxCode] = useState('');
  const [showTrialPlayground, setShowTrialPlayground] = useState(false);

  // Download States
  const [downloadingItem, setDownloadingItem] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<string | null>(null);
  const [lastDownloadedItem, setLastDownloadedItem] = useState<{ id: string; filename: string } | null>(null);


  // Sync current user state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('scoders_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const handleSyncAuth = () => {
      setIsAdmin(localStorage.getItem('scoders_admin_auth') === 'true');
      const savedUser = localStorage.getItem('scoders_user');
      setCurrentUser(savedUser ? JSON.parse(savedUser) : null);
    };
    const handleSyncKeys = () => {
      const saved = localStorage.getItem('scoders_registered_workshops');
      setRegisteredKeys(saved ? JSON.parse(saved) : {});
    };
    window.addEventListener('scoders_auth_change', handleSyncAuth);
    window.addEventListener('scoders_registered_workshops_changed', handleSyncKeys);
    window.addEventListener('scoders_pass_revoked', handleSyncKeys);
    window.addEventListener('scoders_pass_restored', handleSyncKeys);
    window.addEventListener('focus', handleSyncAuth);

    // Check for direct key link from email button (?key=BTD-WKSP-XXXX)
    try {
      const params = new URLSearchParams(window.location.search);
      const keyParam = params.get('key') || params.get('workshopKey');
      if (keyParam) {
        setManualKey(keyParam.toUpperCase());
        setRegMode('enterKey');
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('scoders_auth_change', handleSyncAuth);
      window.removeEventListener('scoders_registered_workshops_changed', handleSyncKeys);
      window.removeEventListener('scoders_pass_revoked', handleSyncKeys);
      window.removeEventListener('scoders_pass_restored', handleSyncKeys);
      window.removeEventListener('focus', handleSyncAuth);
    };
  }, []);

  // Pre-populate fields if logged in
  useEffect(() => {
    if (currentUser) {
      setRegName(currentUser.name || '');
      setRegEmail(currentUser.email || '');
    }
  }, [currentUser, showRegModal]);

  // Leader photos state
  const [leaderPhotos, setLeaderPhotos] = useState<Record<string, string>>({
    shreyas: getLeaderPhoto('shreyas'),
    lokesh: getLeaderPhoto('lokesh'),
    bhuvan: getLeaderPhoto('bhuvan')
  });

  // Listen to external database changes and photo updates
  useEffect(() => {
    const reloadWorkshops = () => {
      setWorkshops(getDynamicWorkshops());
      try {
        const saved = localStorage.getItem('scoders_registered_workshops');
        setRegisteredKeys(saved ? JSON.parse(saved) : {});
      } catch {}
    };
    const updatePhotos = () => {
      setLeaderPhotos({
        shreyas: getLeaderPhoto('shreyas'),
        lokesh: getLeaderPhoto('lokesh'),
        bhuvan: getLeaderPhoto('bhuvan')
      });
    };
    window.addEventListener('scoders_data_change', reloadWorkshops);
    window.addEventListener('scoders_db_change', reloadWorkshops);
    window.addEventListener('scoders_leader_photo_updated', updatePhotos);
    window.addEventListener('storage', reloadWorkshops);
    return () => {
      window.removeEventListener('scoders_data_change', reloadWorkshops);
      window.removeEventListener('scoders_db_change', reloadWorkshops);
      window.removeEventListener('scoders_leader_photo_updated', updatePhotos);
      window.removeEventListener('storage', reloadWorkshops);
    };
  }, []);

  useEffect(() => {
    syncServerClock(true).then((ms) => setWindowTickNowMs(ms)).catch(() => {});
    const interval = setInterval(() => {
      setWindowTickNowMs(getAuthoritativeNowMs());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSavePrice = (id: string) => {
    const updated = workshops.map(w => w.id === id ? { ...w, price: tempPrice } : w);
    setWorkshops(updated);
    saveDynamicWorkshops(updated);
    setEditingWorkshopId(null);
    window.dispatchEvent(new Event('scoders_data_change'));
  };

  // Filter comments for currently active/selected workshop
  const activeWorkshopComments = comments.filter(c => c.workshopId === selectedWorkshopId);
  
  const activeWorkshop = workshops.find(w => w.id === selectedWorkshopId) || workshops[0] || {
    id: 'w-1',
    title: 'No Workshops Scheduled',
    date: 'TBA',
    location: 'Remote',
    summary: 'Check back soon for upcoming advanced developer workshops!',
    category: 'N/A',
    attendees: 0,
    achievements: [],
    photo: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800&h=500',
    price: 1499
  };

  // Check if active workshop is registered and not revoked by admin
  const activeRegInfo = registeredKeys[activeWorkshop.id];
  const isPassRevoked = activeRegInfo ? DatabaseEngine.isPassRevoked(activeRegInfo.key) : false;
  const isRegistered = !!activeRegInfo && !isPassRevoked;

  const activeWorkshopWindow = evaluateRegistrationWindow({
    section: 'workshop',
    itemId: activeWorkshop.id,
    itemTitle: activeWorkshop.title,
    startDate: activeWorkshop.registrationStartDate,
    endDate: activeWorkshop.registrationEndDate,
    nowMs: windowTickNowMs,
  });

  const handleSaveInlineWorkshopDates = (e: React.FormEvent) => {
    e.preventDefault();
    const normStart = normalizeIsoDateOnly(wkspRegStartDraft);
    const normEnd = normalizeIsoDateOnly(wkspRegEndDraft);
    if (normStart && normEnd && normEnd < normStart) {
      setWkspDateDraftError('Registration Closing Date must be on or after the Registration Start Date.');
      return;
    }
    const updated = workshops.map((w) =>
      w.id === activeWorkshop.id
        ? {
            ...w,
            registrationStartDate: normStart || undefined,
            registrationEndDate: normEnd || undefined,
          }
        : w
    );
    setWorkshops(updated);
    saveDynamicWorkshops(updated);
    setEditingWkspDates(false);
    setWkspDateDraftError(null);
  };

  // Load sandbox initial code template based on selected workshop
  useEffect(() => {
    if (activeWorkshop.id === 'w-1') {
      setSandboxCode(`// WORKSHOP 1: Building AI Agents with n8n & Gemini
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startAgent() {
  console.log("Initializing Agent Core...");
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Create an action-plan for managing incoming emails.",
  });

  console.log("Gemini response fetched successfully!");
  console.log(response.text);
}

startAgent();`);
    } else {
      setSandboxCode(`// WORKSHOP 2: SaaS React Multi-Tenant Architectures
import React, { useState } from 'react';

export default function TenantDashboard() {
  const [tenant, setTenant] = useState('AgroSmart_Tenant');
  
  return (
    <div className="p-6 bg-slate-900 rounded-xl text-white">
      <h3 className="font-bold text-brand-teal">SaaS Multi-Tenant Frame</h3>
      <p className="text-xs text-gray-400 mt-2">Active: {tenant}</p>
    </div>
  );
}`);
    }
  }, [selectedWorkshopId]);

  // Handle key creation & registration (starts Razorpay payment flow)
  const handleRegisterWorkshop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regRole) return;
    handleInitiateRazorpayWorkshop();
  };

  const mintAndCompleteWorkshopRegistration = async (
    clientName: string,
    clientEmail: string,
    clientRole: string,
    totalAmount: number,
    payMethod: string,
    txnId: string,
    verifiedOrderId?: string
  ) => {
    const safeName = (clientName || regName || currentUser?.name || 'Workshop Participant').trim();
    const safeEmail = (clientEmail || regEmail || currentUser?.email || 'participant@scoders.com').trim().toLowerCase();
    const safeRole = (clientRole || regRole || 'Registered Developer').trim();

    // 1. Auto-login or register client in session
    let activeClient = currentUser;
    if (!activeClient || activeClient.email.toLowerCase() !== safeEmail) {
      const newClient: AppUser = {
        uid: 'client-' + Date.now().toString(),
        name: safeName,
        email: safeEmail,
        role: 'client',
        company: 'Independent Client',
        phone: 'Not Specified',
        createdAt: new Date().toISOString()
      };
      
      const registeredClientsStr = localStorage.getItem('scoders_registered_clients');
      const clients: AppUser[] = registeredClientsStr ? JSON.parse(registeredClientsStr) : [];
      if (!clients.some(c => c.email.toLowerCase() === safeEmail)) {
        clients.push(newClient);
        localStorage.setItem('scoders_registered_clients', JSON.stringify(clients));
      }

      const passwordsMap = JSON.parse(localStorage.getItem('scoders_client_passwords') || '{}');
      if (!passwordsMap[safeEmail]) {
        passwordsMap[safeEmail] = 'password';
        localStorage.setItem('scoders_client_passwords', JSON.stringify(passwordsMap));
      }

      localStorage.setItem('scoders_user', JSON.stringify(newClient));
      setCurrentUser(newClient);
      activeClient = newClient;
      window.dispatchEvent(new Event('scoders_auth_change'));
    }

    // 2. Mint collision-free UID & dispatch scoders82@gmail.com confirmation email via unified backend
    const code = activeWorkshop.id.toUpperCase();
    const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
    const uniqueId = Math.random().toString(36).substring(2, 6).toUpperCase();
    let generatedKey = `BTD-WKSP-${code}-${timestamp}-${uniqueId}`;
    let validUntil: string | undefined;
    let dispatchedViaUnified = false;
    let emailDeliveryMode: string | undefined;
    let emailRealDelivered: boolean | undefined;
    let emailDeliveryError: string | undefined;
    let emailPreviewUrl: string | undefined;

    try {
      const regRes = await fetch('/api/registrations/register-and-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'workshop',
          itemId: activeWorkshop.id,
          itemTitle: activeWorkshop.title,
          clientName: safeName,
          clientEmail: safeEmail,
          clientPhone: regPhone,
          clientRole: safeRole,
          amount: totalAmount,
          paymentStatus: 'VERIFIED',
          paymentId: txnId,
          orderId: verifiedOrderId || razorpayOrderData?.orderId,
          metadata: {
            date: activeWorkshop.date,
            time: (activeWorkshop as any).time || (activeWorkshop as any).startTime || '10:00 AM IST',
            location: activeWorkshop.location,
            registrationStartDate: activeWorkshop.registrationStartDate,
            registrationEndDate: activeWorkshop.registrationEndDate,
          },
          actionUrl: buildPublicShareUrl('/?view=workshops'),
        }),
      });
      if (regRes.status === 403) {
        const errData = await regRes.json().catch(() => ({}));
        if (errData?.registrationClosed) {
          setShowRegModal(false);
          setPaymentError(errData.error || 'Workshop registration deadline has expired.');
          setClosedModalEval(errData.windowStatus || activeWorkshopWindow);
          setShowClosedModal(true);
          return;
        }
      }
      if (regRes.ok) {
        const regData = await regRes.json();
        if (regData?.success && regData?.uid) {
          generatedKey = regData.uid;
          validUntil = regData.validUntil || regData.record?.validUntil;
          emailDeliveryMode = regData.deliveryMode;
          emailRealDelivered = Boolean(regData.realEmailDelivered);
          emailDeliveryError = regData.emailError;
          emailPreviewUrl = regData.previewUrl;
          dispatchedViaUnified = true;
        }
      }
    } catch (apiErr) {
      console.warn("Unified workshop registration fallback:", apiErr);
    }

    const mockChatId = `chat-wksp-${generatedKey}`;

    // 3. Save to localStorage registered workshops
    const newKeys = {
      ...registeredKeys,
      [activeWorkshop.id]: {
        key: generatedKey,
        name: safeName,
        email: safeEmail,
        role: safeRole,
        tickets: payTicketsCount,
        totalPaid: totalAmount,
        chatId: mockChatId,
        timestamp: new Date().toLocaleDateString()
      }
    };

    setRegisteredKeys(newKeys);
    localStorage.setItem('scoders_registered_workshops', JSON.stringify(newKeys));
    setRegSuccessKey(generatedKey);

    // 4. Save to relational DatabaseEngine (dedupe check on key)
    try {
      const currentRegs = DatabaseEngine.getWorkshopRegistrations();
      const alreadyStored = currentRegs.some(
        r => r.uniqueAccessKey?.trim().toUpperCase() === generatedKey.toUpperCase()
      );
      if (!alreadyStored) {
        const regId = 'reg-wksp-' + Date.now();
        const mockPdfId = 'file-pdf-' + Date.now();
        const mockSrcId = 'file-src-' + Date.now();

        const dbRegistration: WorkshopRegistration = {
          id: regId,
          participantProfile: {
            name: safeName,
            email: safeEmail,
            phone: regPhone.trim() || '+91 99999 00000',
            role: safeRole
          },
          workshopId: activeWorkshop.id,
          workshopTitle: activeWorkshop.title,
          paymentStatus: 'Successful',
          amountPaid: totalAmount,
          paymentMethod: payMethod,
          paymentDate: new Date().toISOString().split('T')[0],
          transactionId: txnId,
          uniqueAccessKey: generatedKey,
          materialsFileIds: [mockPdfId, mockSrcId],
          chatId: mockChatId,
          feedbackId: null
        };
        DatabaseEngine.saveWorkshopRegistrations([dbRegistration, ...currentRegs]);

        const dbTx: PaymentTransaction = {
          id: txnId,
          clientId: safeEmail,
          clientName: safeName,
          clientEmail: safeEmail,
          amount: totalAmount,
          paymentMethod: payMethod,
          status: 'Successful',
          timestamp: new Date().toISOString(),
          reference: `Workshop Pass: ${activeWorkshop.title}`,
          interrupted: false,
          failureReason: null
        };
        const currentPayments = DatabaseEngine.getPayments();
        DatabaseEngine.savePayments([dbTx, ...currentPayments]);

        const dbChat: ChatConversation = {
          id: mockChatId,
          clientName: safeName,
          clientEmail: safeEmail,
          registrationId: regId,
          reference: activeWorkshop.title,
          workshopId: activeWorkshop.id,
          uniqueAccessKey: generatedKey,
          messages: [
            { 
              id: `msg-wksp-1-${Date.now()}`, 
              sender: 'team', 
              senderName: 'S-CODERS Mentor Team',
              senderRole: 'S-CODERS Founder & CEO',
              content: `Congratulations ${safeName}! You are officially registered for S-CODERS Workshop: '${activeWorkshop.title}'. Your learning materials, developer sandbox, and schedule access are unlocked. This is your private, individual chat with our mentors—feel free to ask questions or share links!`, 
              timestamp: new Date().toISOString() 
            }
          ],
          lastUpdated: new Date().toISOString()
        };
        const currentChats = DatabaseEngine.getChats();
        DatabaseEngine.saveChats([dbChat, ...currentChats]);

        const dbPdfFile: FileRecord = {
          id: mockPdfId,
          name: `scoders_workshop_${activeWorkshop.id.replace('wksp-', '')}_guide.pdf`,
          type: 'workshop_pdf',
          url: '#download-guide-pdf',
          size: '1.4 MB',
          clientId: safeEmail,
          registrationId: regId,
          uploadDate: new Date().toISOString().split('T')[0]
        };
        const dbSrcFile: FileRecord = {
          id: mockSrcId,
          name: `scoders_workshop_${activeWorkshop.id.replace('wksp-', '')}_boilerplate.zip`,
          type: 'workshop_source_code',
          url: '#download-boilerplate-zip',
          size: '890 KB',
          clientId: safeEmail,
          registrationId: regId,
          uploadDate: new Date().toISOString().split('T')[0]
        };
        const currentFiles = DatabaseEngine.getFiles();
        DatabaseEngine.saveFiles([dbPdfFile, dbSrcFile, ...currentFiles]);
      }
    } catch (err) {
      console.warn("DB engine workshop registration save error:", err);
    }

    // 5. Fallback email trigger ONLY if unified backend endpoint failed on network
    if (!dispatchedViaUnified) {
      try {
        const fbRes = await fetch('/api/email/workshop-payment-verified', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: safeEmail,
            clientName: safeName,
            workshopTitle: activeWorkshop.title,
            amount: totalAmount,
            uniqueKey: generatedKey,
            paymentId: txnId,
            actionUrl: buildPublicShareUrl(`/?view=workshops&key=${generatedKey}`)
          })
        });
        if (fbRes.ok) {
          const fbData = await fbRes.json().catch(() => null);
          if (fbData) {
            emailDeliveryMode = fbData.deliveryMode;
            emailRealDelivered = Boolean(fbData.realEmailDelivered);
            emailPreviewUrl = fbData.previewUrl;
          }
        }
      } catch (emailErr) {
        console.warn("Workshop email dispatch error:", emailErr);
      }
    }

    // 6. Close the drawer modal immediately
    setShowRegModal(false);

    // 7. Pop up the official Email Notification Confirmation Modal with this workshop's dedicated WhatsApp group
    const activeWaGroup = getWorkshopWhatsappGroup(activeWorkshop, generatedKey);
    setEmailNoticeData({
      type: 'workshop',
      recipientEmail: safeEmail,
      recipientName: safeName,
      subject: `🎓 Workshop Confirmed & Payment Verified - S-CODERS UID (${generatedKey})`,
      title: activeWorkshop.title,
      uniqueKey: generatedKey,
      validUntil,
      deliveryMode: emailDeliveryMode,
      realEmailDelivered: emailRealDelivered,
      emailError: emailDeliveryError,
      previewUrl: emailPreviewUrl,
      whatsappGroupLink: activeWaGroup.href,
      whatsappGroupName: activeWaGroup.groupName,
      messageText: emailRealDelivered
        ? `Your payment has been verified and an official email from scoders82@gmail.com has been delivered directly to ${safeEmail} containing your workshop details, rules & regulations, and Unique Registration Code (${generatedKey}).`
        : `Your payment has been verified and your registration email from scoders82@gmail.com with workshop details, rules & regulations, and Unique Registration Code (${generatedKey}) is ready for ${safeEmail}.`,
      amount: totalAmount,
      actionText: "Enter Workshop & Sandbox",
      onAction: () => {
        setShowEmailNotice(false);
        setActiveWorkspaceWorkshop(activeWorkshop);
      }
    });
    setShowEmailNotice(true);
  };

  const handleInitiateRazorpayWorkshop = async () => {
    setIsProcessing(true);
    setPaymentError(null);

    const serverWin = await checkServerRegistrationWindow({
      section: 'workshop',
      itemId: activeWorkshop.id,
      itemTitle: activeWorkshop.title,
      startDate: activeWorkshop.registrationStartDate,
      endDate: activeWorkshop.registrationEndDate,
    });
    setWindowTickNowMs(getAuthoritativeNowMs());
    if (!serverWin.allowed) {
      setIsProcessing(false);
      setShowRegModal(false);
      setPaymentError(serverWin.message);
      setClosedModalEval(serverWin);
      setShowClosedModal(true);
      return;
    }

    const totalAmount = (activeWorkshop.price ?? 1499) * payTicketsCount;
    const participantName = (regName.trim() || (currentUser?.name && currentUser.name !== 'Attendee' ? currentUser.name : '')).trim();
    const participantEmail = (regEmail.trim() || (currentUser?.email && currentUser.email !== 'attendee@scoders.com' ? currentUser.email : '')).trim();

    try {
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'workshop',
          itemId: activeWorkshop.id,
          workshopId: activeWorkshop.id,
          amount: totalAmount,
          currency: 'INR',
          receipt: `wksp_${activeWorkshop.id}_${Date.now()}`,
          notes: {
            section: 'workshop',
            itemId: activeWorkshop.id,
            workshopId: activeWorkshop.id,
            workshopTitle: activeWorkshop.title,
            participantName: participantName,
            email: participantEmail,
            tickets: payTicketsCount,
            registrationStartDate: activeWorkshop.registrationStartDate,
            registrationEndDate: activeWorkshop.registrationEndDate,
          }
        })
      });

      if (orderRes.status === 403) {
        const errData = await orderRes.json().catch(() => ({}));
        if (errData?.registrationClosed) {
          setIsProcessing(false);
          setShowRegModal(false);
          setPaymentError(errData.error || serverWin.message);
          setClosedModalEval(errData.windowStatus || serverWin);
          setShowClosedModal(true);
          return;
        }
      }

      const orderData = await orderRes.json();

      setRazorpayOrderData({
        orderId: orderData?.orderId || `ord_${Date.now()}`,
        amount: totalAmount,
        currency: 'INR',
        keyId: orderData?.keyId || 'rzp_live_scoders_ybl'
      });

      setRazorpayPaymentDetails({
        amount: totalAmount,
        currency: 'INR',
        clientName: participantName,
        email: participantEmail,
        phone: regPhone.trim(),
        purpose: `Workshop Pass: ${activeWorkshop.title}`,
        merchantUpiId: getActiveMerchantUpi()
      });

      setIsProcessing(false);
      setShowRazorpayModal(true);
    } catch (err) {
      console.warn("Offline fallback for workshop razorpay order:", err);
      const offlineWin = evaluateRegistrationWindow({
        section: 'workshop',
        itemId: activeWorkshop.id,
        itemTitle: activeWorkshop.title,
        startDate: activeWorkshop.registrationStartDate,
        endDate: activeWorkshop.registrationEndDate,
        nowMs: getAuthoritativeNowMs(),
      });
      if (!offlineWin.allowed) {
        setIsProcessing(false);
        setShowRegModal(false);
        setClosedModalEval(offlineWin);
        setShowClosedModal(true);
        return;
      }

      setRazorpayOrderData({
        orderId: `ord_${Date.now()}`,
        amount: totalAmount,
        currency: 'INR',
        keyId: 'rzp_live_scoders_ybl'
      });
      setRazorpayPaymentDetails({
        amount: totalAmount,
        currency: 'INR',
        clientName: participantName,
        email: participantEmail,
        phone: regPhone.trim(),
        purpose: `Workshop Pass: ${activeWorkshop.title}`,
        merchantUpiId: getActiveMerchantUpi()
      });
      setIsProcessing(false);
      setShowRazorpayModal(true);
    }
  };

  const handleRazorpayWorkshopSuccess = (data: RazorpayPaymentSuccessData) => {
    setShowRazorpayModal(false);
    void mintAndCompleteWorkshopRegistration(
      data.clientName || regName || currentUser?.name || 'Workshop Participant',
      data.email || regEmail || currentUser?.email || 'participant@scoders.com',
      regRole || 'Registered Developer',
      data.amount,
      `Razorpay Gateway (${getActiveMerchantUpi()})`,
      data.razorpay_payment_id || ('PAY_WKSP_' + Date.now().toString(36).toUpperCase()),
      data.razorpay_order_id
    );
  };

  const handleSimulatePaymentFailure = (reason: string = "Payment cancelled or declined by user") => {
    try {
      fetch('/api/email/workshop-payment-failed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail || currentUser?.email || 'attendee@scoders.com',
          clientName: regName || currentUser?.name || 'Valued Participant',
          workshopTitle: activeWorkshop.title,
          amount: (activeWorkshop.price ?? 1499) * payTicketsCount,
          reason: reason,
          actionUrl: buildPublicShareUrl('/?view=workshops')
        })
      }).catch(err => console.warn("Workshop failure email warning:", err));
    } catch (emailErr) {
      console.warn("Workshop failure email error:", emailErr);
    }
  };

  const handleVerifyManualKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualKey.trim() || verifyingManualKey) return;

    const trimmed = manualKey.trim().toUpperCase();

    // Check if pass has been revoked by admin
    if (DatabaseEngine.isPassRevoked(trimmed)) {
      setManualKeyError(`⛔ Pass Revoked: Pass key ${trimmed} has been revoked by an administrator. Access is restricted. Please contact scoders82@gmail.com for assistance.`);
      return;
    }

    const code = activeWorkshop.id.toUpperCase();
    const expectedPrefix = `BTD-WKSP-${code}-`;

    const unlockWorkshopFromDetails = (
      targetWorkshop: WorkshopEvent,
      restoredName: string,
      restoredEmail: string,
      restoredRole: string,
      restoredPaid: number,
      restoredChatId: string
    ) => {
      const newKeys = {
        ...registeredKeys,
        [targetWorkshop.id]: {
          key: trimmed,
          name: restoredName,
          email: restoredEmail,
          role: restoredRole,
          tickets: 1,
          totalPaid: restoredPaid,
          chatId: restoredChatId,
          timestamp: new Date().toLocaleDateString()
        }
      };
      setRegisteredKeys(newKeys);
      localStorage.setItem('scoders_registered_workshops', JSON.stringify(newKeys));

      try {
        const existingChats = DatabaseEngine.getChats();
        if (!existingChats.some(c => c.id === restoredChatId || c.uniqueAccessKey === trimmed)) {
          const manualChat: ChatConversation = {
            id: restoredChatId,
            clientName: restoredName,
            clientEmail: restoredEmail,
            registrationId: trimmed,
            workshopId: targetWorkshop.id,
            reference: targetWorkshop.title,
            uniqueAccessKey: trimmed,
            messages: [
              {
                id: `msg-wksp-${Date.now()}`,
                sender: 'team',
                senderName: 'S-CODERS Mentor Team',
                senderRole: 'S-CODERS Founder & CEO',
                content: `Welcome to the private discussion channel for '${targetWorkshop.title}'! You can clear your technical doubts and share URLs directly with our engineering mentors here.`,
                timestamp: new Date().toISOString()
              }
            ],
            lastUpdated: new Date().toISOString()
          };
          DatabaseEngine.saveChats([manualChat, ...existingChats]);
        }
      } catch {}

      setShowRegModal(false);
      setManualKey('');
      setManualKeyError(null);
      setActiveWorkspaceWorkshop(targetWorkshop);
    };

    setVerifyingManualKey(true);
    setManualKeyError(null);

    try {
      const verifyRes = await fetch('/api/registrations/verify-uid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: trimmed, section: 'workshop' }),
      });
      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData?.valid && verifyData?.record) {
        const rec = verifyData.record;
        const matchedWorkshop = workshops.find(w => w.id === rec.itemId) || activeWorkshop;
        const workshopRegs = DatabaseEngine.getWorkshopRegistrations();
        const existingReg = workshopRegs.find(r => r.uniqueAccessKey?.trim().toUpperCase() === trimmed);
        const allChats = DatabaseEngine.getChats();
        const existingChat = allChats.find(c => c.uniqueAccessKey?.trim().toUpperCase() === trimmed || c.id?.toUpperCase().includes(trimmed));

        unlockWorkshopFromDetails(
          matchedWorkshop,
          rec.clientName || existingReg?.participantProfile?.name || existingChat?.clientName || currentUser?.name || 'Registered Attendee',
          rec.clientEmail || existingReg?.participantProfile?.email || existingChat?.clientEmail || currentUser?.email || 'attendee@scoders.com',
          rec.clientRole || existingReg?.participantProfile?.role || 'Registered Developer',
          Number(rec.amount) || existingReg?.amountPaid || matchedWorkshop.price || 1499,
          rec.chatId || existingReg?.chatId || existingChat?.id || `chat-wksp-${trimmed}`
        );
        return;
      }

      if (verifyRes.status === 403 || verifyRes.status === 410) {
        setManualKeyError(verifyData?.error || 'This workshop registration UID is no longer active.');
        return;
      }

      // Check local DB before rejecting
      const workshopRegs = DatabaseEngine.getWorkshopRegistrations();
      const existingReg = workshopRegs.find(r => r.uniqueAccessKey?.trim().toUpperCase() === trimmed);
      const allChats = DatabaseEngine.getChats();
      const existingChat = allChats.find(c => c.uniqueAccessKey?.trim().toUpperCase() === trimmed || c.id?.toUpperCase().includes(trimmed));

      if (existingReg || existingChat) {
        const matchedWorkshop = workshops.find(w => w.id === existingReg?.workshopId) || activeWorkshop;
        unlockWorkshopFromDetails(
          matchedWorkshop,
          existingReg?.participantProfile?.name || existingChat?.clientName || currentUser?.name || 'Registered Attendee',
          existingReg?.participantProfile?.email || existingChat?.clientEmail || currentUser?.email || 'attendee@scoders.com',
          existingReg?.participantProfile?.role || 'Registered Developer',
          existingReg?.amountPaid || matchedWorkshop.price || 1499,
          existingReg?.chatId || existingChat?.id || `chat-wksp-${trimmed}`
        );
        return;
      }

      setManualKeyError(
        verifyData?.error ||
          `No active workshop pass found for UID "${trimmed}". Check your code or recover via email.`
      );
    } catch {
      // Offline fallback with prefix verification
      if (trimmed.startsWith(expectedPrefix) && trimmed.length >= expectedPrefix.length + 4) {
        const workshopRegs = DatabaseEngine.getWorkshopRegistrations();
        const existingReg = workshopRegs.find(r => r.uniqueAccessKey?.trim().toUpperCase() === trimmed);
        const allChats = DatabaseEngine.getChats();
        const existingChat = allChats.find(c => c.uniqueAccessKey?.trim().toUpperCase() === trimmed || c.id?.toUpperCase().includes(trimmed));

        unlockWorkshopFromDetails(
          activeWorkshop,
          existingReg?.participantProfile?.name || existingChat?.clientName || currentUser?.name || 'Registered Attendee',
          existingReg?.participantProfile?.email || existingChat?.clientEmail || currentUser?.email || 'attendee@scoders.com',
          existingReg?.participantProfile?.role || 'Registered Developer',
          existingReg?.amountPaid || activeWorkshop.price || 1499,
          existingReg?.chatId || existingChat?.id || `chat-wksp-${trimmed}`
        );
      } else {
        setManualKeyError(`Invalid key format. Pass for this session must start with: ${expectedPrefix}`);
      }
    } finally {
      setVerifyingManualKey(false);
    }
  };

  // Revoke Pass is strictly controlled by Admin, not by client
  const handleAdminRevokePass = (workshopId: string, passKey: string, attendeeName: string) => {
    if (!isAdmin) {
      alert("Unauthorized: Pass revocation can only be performed by administrators.");
      return;
    }
    const reason = window.prompt(
      `[ADMIN ACTION: REVOKE PASS]\n\nPass Key: ${passKey}\nAttendee: ${attendeeName}\nWorkshop: ${activeWorkshop.title}\n\nEnter reason for revoking pass:`,
      "Administrative Revocation"
    );
    if (reason !== null) {
      const res = DatabaseEngine.revokeWorkshopPass(workshopId, passKey, reason || 'Administrative Revocation', currentUser?.name || 'Admin');
      alert(res.message);
      const saved = localStorage.getItem('scoders_registered_workshops');
      setRegisteredKeys(saved ? JSON.parse(saved) : {});
    }
  };

  const handleCopyKey = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // RESOURCE DOWNLOAD HANDLER: Generates real, verified files and saves directly to user's File Explorer / Downloads
  const handleDownloadResource = async (itemName: string, customFileName?: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (downloadingItem) return; // Prevent concurrent multiple downloads

    setDownloadingItem(itemName);
    setDownloadProgress(20);
    setDownloadSuccessNotice(null);

    const savedName = customFileName || itemNameFormat(itemName);

    // Progress tick animation
    const progressTimer = setInterval(() => {
      setDownloadProgress((prev) => (prev >= 85 ? 85 : prev + 15));
    }, 120);

    try {
      // 1. Fetch exact binary from backend endpoint
      const response = await fetch(`/api/workshops/download/${encodeURIComponent(itemName)}`);
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Received empty download buffer');
      }

      clearInterval(progressTimer);
      setDownloadProgress(95);

      // 2. Save the single, validated binary blob into File Explorer
      triggerFileDownload(blob, savedName);

      setDownloadProgress(100);
      setLastDownloadedItem({ id: itemName, filename: savedName });
      setDownloadSuccessNotice(`"${savedName}" saved directly to your Downloads folder in File Explorer!`);
      setTimeout(() => setDownloadSuccessNotice(null), 10000);
    } catch (networkErr) {
      console.warn('Backend download endpoint fetch failed, falling back to local asset generator:', networkErr);
      try {
        // High-fidelity client-side fallback if offline or server unreachable
        if (itemName === 'json') {
          await downloadN8nWorkflowBlueprint(activeWorkshop?.title);
        } else if (itemName === 'pdf_prompt') {
          await downloadGeminiSystemPromptsPdf();
        } else if (itemName === 'zip') {
          await downloadSaasBoilerplateZip();
        } else if (itemName === 'pdf_slides') {
          await downloadSessionDeckExercisesPdf(activeWorkshop?.title);
        } else if (itemName === 'all') {
          await downloadWorkshopKitBundle(activeWorkshop?.title);
        }

        clearInterval(progressTimer);
        setDownloadProgress(100);
        setLastDownloadedItem({ id: itemName, filename: savedName });
        setDownloadSuccessNotice(`"${savedName}" saved directly to your Downloads folder in File Explorer!`);
        setTimeout(() => setDownloadSuccessNotice(null), 10000);
      } catch (genErr) {
        console.error('All download methods failed:', genErr);
        clearInterval(progressTimer);
        setDownloadSuccessNotice(`Failed to generate "${savedName}". Please check your internet connection and try again.`);
      }
    } finally {
      clearInterval(progressTimer);
      setTimeout(() => {
        setDownloadingItem(null);
        setDownloadProgress(0);
      }, 800);
    }
  };

  const itemNameFormat = (name: string) => {
    switch (name) {
      case 'json': return 'n8n_ai_workflow_blueprints_scoders.json';
      case 'pdf_prompt': return 'gemini_system_prompts_cheatsheet.pdf';
      case 'zip': return 'saas_multitenant_boilerplate.zip';
      case 'pdf_slides': return 'scoders_workshop_session_deck_exercises.pdf';
      default: return 'scoders_workshop_asset.zip';
    }
  };


  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;

    const newComment: WorkshopComment = {
      id: Date.now().toString(),
      workshopId: selectedWorkshopId,
      authorName: authorName.trim(),
      role: role.trim(),
      content: content.trim(),
      timestamp: new Date().toISOString().split('T')[0],
      rating: rating,
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    localStorage.setItem('scoders_comments', JSON.stringify(updated));

    // Reset Form
    setAuthorName('');
    setRole('Attendee');
    setContent('');
    setRating(5);
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 3000);
  };

  // Permanent Profile & Registration Persistence on Mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('scoders_user');
      if (savedUser && !regName) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser?.name && parsedUser.name !== 'Attendee') {
          setRegName(parsedUser.name);
          setRegEmail(parsedUser.email || '');
        }
      }

      // Check if any workshop registration exists in DatabaseEngine or localStorage for current user
      const workshopRegs = DatabaseEngine.getWorkshopRegistrations();
      if (workshopRegs.length > 0) {
        const currentKeys = { ...registeredKeys };
        let updated = false;
        for (const reg of workshopRegs) {
          if (reg.participantProfile && reg.workshopId && !currentKeys[reg.workshopId]) {
            const email = (reg.participantProfile.email || '').toLowerCase().trim();
            if (!currentUser || email === currentUser.email?.toLowerCase()) {
              currentKeys[reg.workshopId] = {
                key: reg.uniqueAccessKey || 'BTD-WKSP-RESTORED',
                name: reg.participantProfile.name || 'Verified Attendee',
                email: reg.participantProfile.email || 'attendee@scoders.com',
                role: reg.participantProfile.role || 'Developer',
                timestamp: reg.paymentDate || new Date().toLocaleDateString()
              };
              updated = true;
            }
          }
        }
        if (updated) {
          setRegisteredKeys(currentKeys);
          localStorage.setItem('scoders_registered_workshops', JSON.stringify(currentKeys));
        }
      }
    } catch (e) {}
  }, []);

  // Determine currently active registered client name for badge
  const activeRegisteredAttendeeName = useMemo(() => {
    if (activeRegInfo?.name) return activeRegInfo.name;
    const allRegs = Object.values(registeredKeys);
    if (allRegs.length > 0 && allRegs[0].name) return allRegs[0].name;
    if (currentUser?.name && currentUser.name !== 'Attendee') return currentUser.name;
    return null;
  }, [activeRegInfo, registeredKeys, currentUser]);

  // Hydrate Auto-Save draft per workshop
  useEffect(() => {
    wkspDraftFirstRenderRef.current = true;
    try {
      const savedDraftRaw = localStorage.getItem(`scoders_workshop_draft_${selectedWorkshopId}`);
      if (savedDraftRaw) {
        const draft = JSON.parse(savedDraftRaw);
        if (typeof draft.authorName === 'string') setAuthorName(draft.authorName);
        if (typeof draft.role === 'string') setRole(draft.role);
        if (typeof draft.content === 'string') setContent(draft.content);
        if (typeof draft.rating === 'number') setRating(draft.rating);
        return;
      }
    } catch {}
    if (activeRegInfo) {
      setAuthorName(activeRegInfo.name || '');
      setRole(activeRegInfo.role || 'Attendee');
    }
  }, [selectedWorkshopId]);

  const persistWorkshopClientDraft = (syncProfile: boolean = true) => {
    try {
      localStorage.setItem(
        `scoders_workshop_draft_${selectedWorkshopId}`,
        JSON.stringify({
          authorName,
          role,
          content,
          rating,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {}

    if (syncProfile && isRegistered && activeRegInfo && (authorName.trim() || role.trim())) {
      DatabaseEngine.updateWorkshopClientProfile({
        workshopId: activeWorkshop.id,
        uniqueKey: activeRegInfo.key,
        name: authorName.trim() || activeRegInfo.name,
        email: activeRegInfo.email,
        role: role.trim() || activeRegInfo.role,
      });
    }
  };

  // Automatic Auto-Save (400ms debounce) for workshop attendee form/details
  useEffect(() => {
    if (wkspDraftFirstRenderRef.current) {
      wkspDraftFirstRenderRef.current = false;
      return;
    }
    setWkspAutoSaveStatus('saving');
    const timer = setTimeout(() => {
      persistWorkshopClientDraft(true);
      setWkspAutoSaveStatus('saved');
    }, 400);
    return () => clearTimeout(timer);
  }, [authorName, role, content, rating, selectedWorkshopId]);

  const handleManualSaveWorkshop = () => {
    persistWorkshopClientDraft(true);
    setWkspAutoSaveStatus('saved');
    setWkspManualSaveFlash(true);
    setTimeout(() => setWkspManualSaveFlash(false), 2000);
  };

  const openCancelWorkshopModal = (workshopObj: WorkshopEvent, regObj: any) => {
    setCancelWorkshopError(null);
    setCancelTargetWorkshop({
      workshopId: workshopObj.id,
      workshopTitle: workshopObj.title,
      key: regObj?.key,
      email: regObj?.email || currentUser?.email,
      chatId: regObj?.chatId,
    });
    setShowCancelWorkshopConfirm(true);
  };

  const handleConfirmCancelWorkshop = async () => {
    if (!cancelTargetWorkshop || isCancellingWorkshop) return;
    setIsCancellingWorkshop(true);
    setCancelWorkshopError(null);
    try {
      const result = await DatabaseEngine.cancelWorkshopOrder({
        workshopId: cancelTargetWorkshop.workshopId,
        uniqueKey: cancelTargetWorkshop.key,
        clientEmail: cancelTargetWorkshop.email,
        chatId: cancelTargetWorkshop.chatId,
      });
      if (!result.success) {
        setCancelWorkshopError(result.error || 'Could not cancel workshop registration. Please try again.');
        setIsCancellingWorkshop(false);
        return;
      }

      try {
        const saved = localStorage.getItem('scoders_registered_workshops');
        setRegisteredKeys(saved ? JSON.parse(saved) : {});
      } catch {
        setRegisteredKeys({});
      }

      setRegSuccessKey(null);
      setActiveWorkspaceWorkshop(null);
      setShowCancelWorkshopConfirm(false);
      setIsCancellingWorkshop(false);
      setCancelWorkshopNotice(
        `Workshop registration for "${cancelTargetWorkshop.workshopTitle}" has been permanently cancelled and deleted from our database.`
      );
      setCancelTargetWorkshop(null);
      setTimeout(() => setCancelWorkshopNotice(null), 9000);
    } catch (err: any) {
      setCancelWorkshopError(err?.message || 'Unexpected error while cancelling workshop registration.');
      setIsCancellingWorkshop(false);
    }
  };

  // Shared spacious classroom tabbed workspace (matches Service Workspace width & padding)
  const renderWorkshopClassroomTabs = (targetWorkshop: WorkshopEvent, regInfo: any) => (
    <div className="bg-brand-dark/60 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
      {/* Tab Headers */}
      <div className="grid grid-cols-3 bg-brand-dark/90 border-b border-white/10 p-1.5 sm:p-2">
        {[
          { id: 'sandbox', label: 'Sandbox IDE', shortLabel: 'IDE', icon: Code },
          { id: 'resources', label: 'Downloads Locker', shortLabel: 'Files', icon: Download },
          { id: 'discussion', label: 'Live Discussion', shortLabel: 'Chat', icon: MessageCircle },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-mono font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === t.id
                ? 'bg-brand-teal text-brand-dark shadow-md font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels - Matching Service Workspace spacing & width */}
      <div className="p-2.5 sm:p-6 min-h-[480px] transition-all">
        {/* TAB 1: REAL ONLINE COMPILER & PLAYGROUND IDE */}
        {activeTab === 'sandbox' && (
          <div className="w-full space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-gray-400 pb-2 border-b border-white/10">
              <span className="font-semibold text-gray-300">{targetWorkshop.title} Live Compiler & Sandbox</span>
              <span className="text-brand-teal font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
                Classroom IDE Active
              </span>
            </div>
            <OnlineCodePlayground
              workshopTitle={targetWorkshop.title}
              initialLanguage={targetWorkshop.id === 'w-1' ? 'python' : 'react'}
              initialCode={sandboxCode}
              onCodeChange={setSandboxCode}
            />
          </div>
        )}

        {/* TAB 2: DOWNLOADS TRACKER */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest block font-bold">
                  Verified Developer Assets Locker
                </span>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Direct save to your computer's File Explorer (Downloads folder)</span>
                </span>
              </div>

              {/* Master Download All Button */}
              <button
                type="button"
                onClick={(e) => handleDownloadResource('all', 'scoders_workshop_complete_developer_kit.zip', e)}
                disabled={downloadingItem !== null}
                className="px-4 py-2.5 bg-brand-teal/20 hover:bg-brand-teal hover:text-brand-dark text-brand-teal border border-brand-teal/40 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shrink-0 disabled:opacity-50"
                title="Download all workshop resources in a single zip archive"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingItem === 'all' ? 'Downloading Kit...' : 'Download All Assets (.ZIP)'}</span>
              </button>
            </div>

            {/* File Explorer Instructions Tip */}
            <div className="p-4 sm:p-5 bg-white/5 border border-white/10 rounded-2xl text-xs font-mono text-gray-300 space-y-3">
              <div className="flex items-center gap-2 text-brand-teal font-bold text-xs uppercase tracking-wider">
                <span>💡 File Explorer Guide</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] pt-1 leading-relaxed">
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-start gap-2.5">
                  <span className="text-brand-teal font-bold shrink-0">1.</span>
                  <span>Click <strong className="text-white">Download</strong> to save the verified file directly to your system's <strong className="text-white">Downloads</strong> folder.</span>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-start gap-2.5">
                  <span className="text-brand-teal font-bold shrink-0">2.</span>
                  <span>In File Explorer, open <code className="text-cyan-300 bg-white/10 px-1 py-0.5 rounded">Downloads</code> or press <kbd className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded border border-white/20">Ctrl + J</kbd> in your browser.</span>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-start gap-2.5">
                  <span className="text-brand-teal font-bold shrink-0">3.</span>
                  <span>Click <strong className="text-brand-teal">Open</strong> to preview documents immediately in your browser tab.</span>
                </div>
              </div>
            </div>

            {downloadSuccessNotice && (
              <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-emerald-500/10">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{downloadSuccessNotice}</span>
                </div>
                {lastDownloadedItem && (lastDownloadedItem.id === 'pdf_prompt' || lastDownloadedItem.id === 'pdf_slides' || lastDownloadedItem.id === 'json') && (
                  <a
                    href={`/api/workshops/view/${lastDownloadedItem.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-400 text-black hover:bg-emerald-300 font-bold rounded-lg transition-all text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open / View in Browser</span>
                  </a>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { id: 'json', title: 'n8n Workflow Blueprints', type: 'JSON Specification', size: '24 KB', filename: 'n8n_ai_workflow_blueprints_scoders.json' },
                { id: 'pdf_prompt', title: 'Gemini System Prompts', type: 'System Cheat-sheet PDF', size: '180 KB', filename: 'gemini_system_prompts_cheatsheet.pdf' },
                { id: 'zip', title: 'SaaS Multitenant Boilerplate', type: 'TypeScript React Zip', size: '1.4 MB', filename: 'saas_multitenant_boilerplate.zip' },
                { id: 'pdf_slides', title: 'Session Deck & Exercises', type: 'Slide Presentation PDF', size: '3.6 MB', filename: 'scoders_workshop_session_deck_exercises.pdf' },
              ].map(item => (
                <div key={item.id} className="bg-brand-dark/50 border border-white/10 hover:border-brand-teal/30 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all group">
                  <div className="overflow-hidden min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-white truncate group-hover:text-brand-teal transition-colors">{item.title}</p>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-white/10 text-gray-300 shrink-0">{item.size}</span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono mt-1 truncate">{item.type}</p>
                    <span className="text-[10px] text-gray-500 font-mono block mt-1 truncate">{item.filename}</span>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                    {downloadingItem === item.id ? (
                      <div className="w-full space-y-1.5 py-1">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-teal transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                        </div>
                        <div className="flex justify-between text-[11px] font-mono text-brand-teal font-bold">
                          <span>Saving to File Explorer...</span>
                          <span>{downloadProgress}%</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleDownloadResource(item.id, item.filename, e)}
                          disabled={downloadingItem !== null}
                          className="flex-1 py-2.5 px-3 bg-brand-teal/15 hover:bg-brand-teal hover:text-brand-dark text-brand-teal hover:font-bold rounded-xl transition-all border border-brand-teal/30 hover:border-brand-teal cursor-pointer shadow-sm flex items-center justify-center gap-1.5 font-mono text-xs disabled:opacity-50"
                          title={`Download ${item.title} directly into File Explorer`}
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" />
                          <span>Download</span>
                        </button>

                        {item.id !== 'zip' ? (
                          <a
                            href={`/api/workshops/view/${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2.5 px-3.5 bg-white/5 hover:bg-white/15 text-gray-200 hover:text-white rounded-xl transition-all border border-white/10 cursor-pointer shadow-sm flex items-center justify-center gap-1.5 font-mono text-xs shrink-0"
                            title={`Open and view ${item.title} directly in browser`}
                          >
                            <Eye className="w-3.5 h-3.5 text-brand-teal" />
                            <span>Open</span>
                          </a>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DISCUSSION LIVE CHATROOM - WhatsApp-Style Individual Persistent Private Chat & S-CODERS Team Portal */}
        {activeTab === 'discussion' && (
          <WorkshopChatRoom
            activeWorkshop={targetWorkshop}
            activeRegInfo={regInfo}
            isRegistered={isRegistered}
            isAdmin={isAdmin}
            currentUser={currentUser}
          />
        )}
      </div>

      {/* Bottom Action Bar: Auto-Save Status, Cancel Workshop, Save, and Close */}
      <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-brand-dark/90 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{wkspAutoSaveStatus === 'saving' ? 'Auto-saving details...' : 'Auto-Save Active: Workshop notes & profile saved'}</span>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => openCancelWorkshopModal(targetWorkshop, regInfo)}
            className="flex-1 sm:flex-none py-2.5 px-4 bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/35 hover:border-red-500 text-xs font-mono font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Cancel Workshop</span>
          </button>

          <button
            type="button"
            onClick={handleManualSaveWorkshop}
            className="flex-1 sm:flex-none py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-mono font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            {wkspManualSaveFlash ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-brand-teal" />
                <span>Save</span>
              </>
            )}
          </button>

          {activeWorkspaceWorkshop && (
            <button
              type="button"
              onClick={() => {
                persistWorkshopClientDraft(true);
                setActiveWorkspaceWorkshop(null);
              }}
              className="flex-1 sm:flex-none py-2.5 px-4 bg-brand-teal hover:bg-white text-brand-dark text-xs font-display font-bold uppercase rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-brand-teal/20 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-24 bg-brand-dark relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute left-0 bottom-1/4 w-[400px] h-[400px] ambient-glow rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header with Persistent Registered Name Badge */}
        <div className="text-center max-w-3xl mx-auto mb-16 relative">
          {activeRegisteredAttendeeName && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold mb-4 shadow-lg shadow-emerald-500/10"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active Account Profile: <strong className="text-white underline decoration-emerald-400">{activeRegisteredAttendeeName}</strong> (Permanently Saved)</span>
            </motion.div>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono mb-4">
            <Calendar className="w-3.5 h-3.5" />
            <span>COMMUNITY BUILDING</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight mb-6">
            Workshops & Classroom Portal
          </h2>
          <p className="text-gray-400 font-sans font-light text-lg">
            S-CODERS • Bharat Tech Developers is heavily active in Bengaluru's academic and development circles. View our seminars, register to access live sandboxes, and download blueprints.
          </p>
        </div>

        {/* OFFICIAL S-CODERS WORKSHOP WHATSAPP COMMUNITY & CLASSROOM HUB */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-teal/30 bg-[#060a16]/90 shadow-2xl mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-brand-teal/10 blur-3xl rounded-full pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-xs font-mono font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
                Official Workshop Community Channel
              </div>
              <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
                Join the S-CODERS Workshop WhatsApp Group
              </h3>
              <p className="text-gray-300 font-sans text-sm sm:text-base leading-relaxed">
                Connect directly with our instructors, speakers, and fellow student developers. Receive instant Zoom meeting invitations, workshop schedules, sandbox tokens, code repositories, and technical mentor assistance.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-gray-400">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white">
                  <span className="text-[#25D366]">✓</span> Live Zoom Links & Recordings
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white">
                  <span className="text-[#25D366]">✓</span> Code Repositories & Blueprints
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white">
                  <span className="text-[#25D366]">✓</span> Mentor Q&A Support
                </span>
              </div>
            </div>

            {/* Official Workshop WhatsApp Group Button */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <a
                href="https://chat.whatsapp.com/Dn2rD4GVvJw9DtKUIcBs1F"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[#25D366] hover:bg-emerald-400 text-[#0c0d14] font-mono font-bold text-sm uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-[#25D366]/25 flex items-center justify-center gap-3 cursor-pointer active:scale-95"
              >
                <Users className="w-5 h-5" />
                <span>Join Workshop WhatsApp Group</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Continuous Moving Animation Marquee for Workshop Options */}
        <div className="mb-12">
          <MarqueeTicker badgeText="EXPLORE WORKSHOP TOPICS & MODULES" />
        </div>

        {cancelWorkshopNotice && (
          <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/35 text-amber-200 text-xs sm:text-sm font-mono flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{cancelWorkshopNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setCancelWorkshopNotice(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Selected Workshop Visual Showcase Billboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 items-start">
          
          {/* LEFT: Workshop selector buttons & brief timeline */}
          <div className="lg:col-span-4 space-y-4">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2 pl-2">Select Workshop Event Option</div>
            {workshops.map((w) => {
              const isSelected = selectedWorkshopId === w.id;
              const wWin = evaluateRegistrationWindow({
                section: 'workshop',
                itemId: w.id,
                itemTitle: w.title,
                startDate: w.registrationStartDate,
                endDate: w.registrationEndDate,
                nowMs: windowTickNowMs,
              });
              return (
                <button
                  key={w.id}
                  onClick={() => setSelectedWorkshopId(w.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col cursor-pointer group ${
                    isSelected
                      ? 'bg-brand-card border-brand-teal/60 shadow-xl shadow-brand-teal/10 scale-[1.02]'
                      : 'bg-brand-card/30 border-white/5 hover:border-white/20 hover:bg-brand-card/50'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeWorkshopOptionBorder"
                      className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-teal rounded-r"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div className="flex items-center justify-between mb-1 z-10 gap-2">
                    <span className="text-[10px] font-mono text-brand-teal uppercase tracking-widest font-bold">{w.category}</span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/30">
                        ₹{(w.price ?? 1499).toLocaleString()}
                      </span>
                      {registeredKeys[w.id] ? (
                        <span className="text-[8px] font-mono px-2 py-0.5 bg-brand-teal/10 border border-brand-teal/30 text-brand-teal rounded-full font-bold uppercase animate-pulse">Unlocked</span>
                      ) : !wWin.allowed ? (
                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border ${
                          wWin.status === 'NOT_STARTED'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-red-500/15 border-red-500/35 text-red-300'
                        }`}>
                          {wWin.status === 'NOT_STARTED' ? 'Opens Soon' : 'Reg Closed'}
                        </span>
                      ) : (
                        <span className="text-[8px] font-mono px-2 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-400 rounded-full font-bold uppercase">Locked</span>
                      )}
                    </div>
                  </div>
                  <span className="font-display font-bold text-white text-base sm:text-lg leading-snug mb-2 group-hover:text-brand-teal transition-colors z-10">
                    {w.title}
                  </span>
                  <div className="flex items-center justify-between text-xs text-gray-400 font-mono mt-auto flex-wrap gap-y-1 z-10">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-coral" />
                      {w.date}
                    </span>
                    <span className="flex items-center gap-1 text-amber-400 font-bold text-[10px]">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {w.startTime || '10:00 AM IST'} • {w.duration || '2 Days'}
                    </span>
                  </div>
                  {(wWin.startDate || wWin.endDate) && (
                    <div className={`mt-2 pt-2 border-t border-white/5 text-[10px] font-mono flex items-center justify-between z-10 ${
                      wWin.status === 'OPEN'
                        ? 'text-emerald-300'
                        : wWin.status === 'NOT_STARTED'
                        ? 'text-amber-300'
                        : 'text-red-300'
                    }`}>
                      <span>Reg: {wWin.startDateShort} – {wWin.endDateShort}</span>
                      <span className="uppercase font-bold">
                        {wWin.status === 'OPEN' ? 'Open' : wWin.status === 'NOT_STARTED' ? 'Soon' : 'Closed'}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
            {workshops.length === 0 && (
              <p className="text-gray-500 text-xs font-mono p-4">No active workshops found.</p>
            )}
          </div>

          {/* RIGHT: High-fidelity active workshop details billboard */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeWorkshop.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-xl"
              >
                {/* Visual Header Image */}
                <div className="h-64 sm:h-80 overflow-hidden relative">
                  <img
                    src={activeWorkshop.photo}
                    alt={activeWorkshop.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-brand-dark/30 to-transparent" />
                  
                  {/* Badge & Meta overlay */}
                  <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-xs font-mono text-white flex-wrap">
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-brand-dark/90 backdrop-blur-md rounded border border-emerald-400/40 text-emerald-300 font-mono font-black text-xs shadow-lg">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        Amount: ₹{(activeWorkshop.price ?? 1499).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-dark/80 backdrop-blur-md rounded border border-brand-teal/30 text-brand-teal font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-brand-teal" />
                        {activeWorkshop.date}
                      </span>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-dark/80 backdrop-blur-md rounded border border-amber-400/30 text-amber-300 font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Start: {activeWorkshop.startTime || '10:00 AM IST'}
                      </span>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-dark/80 backdrop-blur-md rounded border border-white/10">
                        <MapPin className="w-3.5 h-3.5 text-brand-coral" />
                        {activeWorkshop.location}
                      </span>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-dark/80 backdrop-blur-md rounded border border-white/10 text-gray-300">
                        <Users className="w-3.5 h-3.5 text-brand-teal" />
                        {activeWorkshop.attendees}+ Attendees
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Summary Details */}
                <div className="p-8 sm:p-10">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-brand-teal uppercase tracking-widest">{activeWorkshop.category}</span>
                      <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded border border-emerald-400/30">
                        Fee: ₹{(activeWorkshop.price ?? 1499).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-amber-400/90 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      Duration: {activeWorkshop.duration || '2 Days (8 Hours Total)'}
                    </span>
                  </div>
                  <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight mb-4">
                    {activeWorkshop.title}
                  </h3>
                  <p className="text-gray-300 font-sans font-light text-base leading-relaxed mb-8">
                    {activeWorkshop.summary}
                  </p>

                  {/* Achievements Checklist */}
                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-sm uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <Award className="w-4 h-4 text-brand-teal" />
                      Milestones & Key Moments
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeWorkshop.achievements && activeWorkshop.achievements.map((ach, idx) => (
                        <div key={idx} className="flex gap-3 bg-white/5 border border-white/5 p-4 rounded-xl items-start">
                          <CheckCircle className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                          <p className="text-gray-300 text-xs sm:text-sm font-sans font-light leading-relaxed">{ach}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WORKSHOP DETAILS: Tools Used & Useful Learning Outcomes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                    {/* BEFORE YOU JOIN: INCLUDE & WHAT YOU'LL NEED */}
                    <div className="bg-brand-dark/60 border border-white/10 rounded-2xl p-5 space-y-3">
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider text-brand-teal flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-brand-teal" />
                        Before You Join — Include & What You'll Need
                      </h4>
                      <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                        Tech stack, frameworks, & tools used during hands-on sessions:
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(activeWorkshop.toolsUsed || ['React', 'TypeScript', 'Node.js', 'n8n', 'Gemini API']).map((tool, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono rounded-lg flex items-center gap-1.5 font-semibold">
                            <Cpu className="w-3 h-3 text-brand-teal shrink-0" />
                            {tool}
                          </span>
                        ))}
                      </div>
                      {activeWorkshop.prerequisites && (
                        <div className="pt-2 border-t border-white/5 mt-3">
                          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1">Prerequisites Needed:</span>
                          <p className="text-xs text-gray-300 font-sans leading-relaxed">{activeWorkshop.prerequisites}</p>
                        </div>
                      )}
                    </div>

                    {/* WHAT WILL BE USEFUL OF THE WORKSHOP */}
                    <div className="bg-brand-dark/60 border border-white/10 rounded-2xl p-5 space-y-3">
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-amber-400" />
                        What Will Be Useful / Key Learning Benefits
                      </h4>
                      <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                        Career growth, practical skills & outcomes you acquire:
                      </p>
                      <ul className="space-y-2 pt-1">
                        {(activeWorkshop.usefulness || [
                          'Master core full-stack software development workflows',
                          'Build real-world production prototypes live during class',
                          'Receive official S-CODERS • Bharat Tech Developers Certification'
                        ]).map((outcome, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-gray-300 font-sans">
                            <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Notice if pass is revoked */}
                  {isPassRevoked && (
                    <div className="pt-8 mt-8 border-t border-white/5">
                      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-red-300 font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-500/20 text-red-400 rounded-xl">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-red-400 uppercase tracking-widest font-bold">Pass Status: Revoked</span>
                            <h4 className="text-sm font-bold text-white font-sans">Session Pass Revoked by Administrator</h4>
                            <p className="text-[11px] text-red-300/80 font-mono mt-0.5">Key: {activeRegInfo?.key} • Pass access was revoked by administrative policy.</p>
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-400">
                          For questions regarding revocation, contact <span className="text-white font-bold">scoders82@gmail.com</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GATE CONTROL: If registered, show active pass & Launch Workspace CTA; full classroom renders spaciously below or in full-screen console */}
                  {isRegistered ? (
                    <div className="pt-8 mt-8 border-t border-white/5 space-y-4">
                      <div className="bg-brand-dark/80 p-5 sm:p-6 rounded-2xl border border-brand-teal/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-brand-teal/10 rounded-xl text-brand-teal border border-brand-teal/20 shrink-0">
                            <Shield className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-brand-teal uppercase tracking-widest font-bold block">Keychain Active</span>
                            <h4 className="text-sm sm:text-base font-bold text-white font-sans">Attending Live Session</h4>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">Secure Key: <span className="text-brand-teal font-bold">{activeRegInfo.key}</span></p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handleCopyKey(activeRegInfo.key)}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-all cursor-pointer border border-white/10 flex items-center gap-1.5 text-xs font-mono"
                            title="Copy Pass Key"
                          >
                            {copiedKey ? <Check className="w-3.5 h-3.5 text-brand-teal" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                          </button>
                          <span className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-mono text-[10px] uppercase font-bold flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Pass Active
                          </span>
                          <button
                            type="button"
                            onClick={() => openCancelWorkshopModal(activeWorkshop, activeRegInfo)}
                            className="px-3 py-2 bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/35 hover:border-red-500 rounded-xl font-mono text-[10px] uppercase font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Cancel Workshop Registration"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Cancel Workshop</span>
                          </button>
                          {/* Revoke Pass is strictly controlled by Admin, not by client */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleAdminRevokePass(activeWorkshop.id, activeRegInfo.key, activeRegInfo.name)}
                              className="px-3 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl font-mono text-[10px] uppercase font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Admin Control: Revoke this pass"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Admin: Revoke Pass</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveWorkspaceWorkshop(activeWorkshop)}
                        className="w-full py-3.5 px-6 bg-brand-teal hover:bg-white text-brand-dark font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer shadow-lg shadow-brand-teal/15"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Launch Classroom Workspace</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  ) : (
                    <div className="pt-8 mt-8 border-t border-white/5 space-y-6">
                      <div className={`border rounded-2xl p-6 text-center space-y-3 ${
                        activeWorkshopWindow.allowed
                          ? 'bg-amber-400/5 border-amber-400/20'
                          : 'bg-red-500/5 border-red-500/25'
                      }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto border ${
                          activeWorkshopWindow.allowed
                            ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }`}>
                          {activeWorkshopWindow.allowed ? <Lock className="w-5 h-5" /> : <CalendarX2 className="w-5 h-5" />}
                        </div>
                        <h4 className="font-display font-bold text-white text-base">
                          {activeWorkshopWindow.allowed
                            ? 'Classroom & Deliverables Locked'
                            : activeWorkshopWindow.headline}
                        </h4>
                        <p className="text-gray-400 text-xs font-sans max-w-md mx-auto leading-relaxed">
                          {activeWorkshopWindow.allowed
                            ? 'Developer sandboxes, session codes, slides, and simulated attendee discussion streams are restricted. Please register to obtain your session key.'
                            : activeWorkshopWindow.message}
                        </p>

                        {/* Registration Timeline Box (Always Visible Before Registration / Payment) */}
                        <div className={`max-w-md mx-auto rounded-xl p-3 border text-left font-mono text-[11px] flex flex-col gap-1.5 ${
                          activeWorkshopWindow.status === 'OPEN'
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
                            : activeWorkshopWindow.status === 'NOT_STARTED'
                            ? 'bg-amber-500/10 border-amber-500/25 text-amber-200'
                            : 'bg-red-500/10 border-red-500/30 text-red-200'
                        }`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold uppercase tracking-wider text-[10px]">
                              Registration Schedule
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                activeWorkshopWindow.status === 'OPEN'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : activeWorkshopWindow.status === 'NOT_STARTED'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}>
                                {activeWorkshopWindow.status === 'OPEN'
                                  ? 'Open'
                                  : activeWorkshopWindow.status === 'NOT_STARTED'
                                  ? 'Opens Soon'
                                  : 'Closed'}
                              </span>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWkspRegStartDraft(normalizeIsoDateOnly(activeWorkshop.registrationStartDate) || getTodayIsoDateIst());
                                    setWkspRegEndDraft(normalizeIsoDateOnly(activeWorkshop.registrationEndDate) || '');
                                    setWkspDateDraftError(null);
                                    setEditingWkspDates(!editingWkspDates);
                                  }}
                                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-brand-teal hover:text-brand-dark text-white text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                  <span>Edit</span>
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-[9px] text-gray-400 uppercase block">Starts</span>
                              <span className="text-white font-bold">{activeWorkshopWindow.startDateDisplay}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-gray-400 uppercase block">Closes</span>
                              <span className="text-white font-bold">{activeWorkshopWindow.endDateDisplay}</span>
                            </div>
                          </div>
                          {isAdmin && editingWkspDates && (
                            <form onSubmit={handleSaveInlineWorkshopDates} className="pt-2 mt-1 border-t border-white/10 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[9px] text-gray-300 uppercase mb-0.5">Start Date</label>
                                  <input
                                    type="date"
                                    required
                                    value={wkspRegStartDraft}
                                    onChange={(e) => { setWkspRegStartDraft(e.target.value); setWkspDateDraftError(null); }}
                                    className="w-full px-2 py-1.5 rounded-lg bg-black/50 border border-white/15 text-white text-[11px]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] text-gray-300 uppercase mb-0.5">Closing Date</label>
                                  <input
                                    type="date"
                                    required
                                    min={wkspRegStartDraft || undefined}
                                    value={wkspRegEndDraft}
                                    onChange={(e) => { setWkspRegEndDraft(e.target.value); setWkspDateDraftError(null); }}
                                    className="w-full px-2 py-1.5 rounded-lg bg-black/50 border border-white/15 text-white text-[11px]"
                                  />
                                </div>
                              </div>
                              {wkspDateDraftError && (
                                <p className="text-[10px] text-red-400">{wkspDateDraftError}</p>
                              )}
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  className="flex-1 py-1.5 bg-brand-teal text-brand-dark rounded-lg font-bold text-[10px] uppercase cursor-pointer"
                                >
                                  Save Schedule
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingWkspDates(false)}
                                  className="px-3 py-1.5 bg-white/10 text-gray-300 rounded-lg font-bold text-[10px] uppercase cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}
                        </div>

                        {/* Workshop Amount Callout Box */}
                        <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-2xl p-3 max-w-sm mx-auto flex items-center justify-between my-2">
                          <div className="text-left">
                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block font-bold">Workshop Ticket Fee</span>
                            <span className="text-lg font-display font-black text-emerald-400">₹{(activeWorkshop.price ?? 1499).toLocaleString()} <span className="text-xs text-gray-400 font-normal font-sans">/ seat</span></span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-400/20 px-2.5 py-1 rounded font-bold">All Inclusive</span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                          <button
                            onClick={() => {
                              setPayTicketsCount(seatCount);
                              handleInitiateRazorpayWorkshop();
                            }}
                            className={`px-6 py-3 font-display font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-black/40 ${
                              activeWorkshopWindow.allowed
                                ? 'bg-[#521714] hover:bg-[#681e1a] active:bg-[#401210] text-[#ffded9]'
                                : 'bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40'
                            }`}
                          >
                            {activeWorkshopWindow.allowed ? (
                              <>
                                <Key className="w-4 h-4" />
                                <span>Register & Pay ₹{(activeWorkshop.price ?? 1499).toLocaleString()}</span>
                              </>
                            ) : (
                              <>
                                <CalendarX2 className="w-4 h-4" />
                                <span>
                                  {activeWorkshopWindow.status === 'NOT_STARTED'
                                    ? `Registration Opens ${activeWorkshopWindow.startDateShort}`
                                    : 'Registration Closed'}
                                </span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowRegModal(true);
                              setRegMode('enterKey');
                              setRegSuccessKey(null);
                            }}
                            className="px-4 py-2.5 bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl font-mono text-xs uppercase font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-4 h-4" />
                            Enter Existing Pass Key
                          </button>
                        </div>

                        {/* Direct Trial Playground Toggle */}
                        <div className="pt-3 border-t border-white/5 mt-3">
                          <button
                            type="button"
                            onClick={() => setShowTrialPlayground(!showTrialPlayground)}
                            className="text-xs font-mono text-brand-teal hover:text-white px-4 py-2 bg-brand-teal/10 hover:bg-brand-teal/20 border border-brand-teal/30 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
                          >
                            <Code className="w-4 h-4 text-brand-teal" />
                            <span>{showTrialPlayground ? 'Hide Online Code Playground' : '⚡ Open Online Compiler & Playground Sandbox'}</span>
                          </button>

                          {showTrialPlayground && (
                            <div className="mt-5 text-left">
                              <OnlineCodePlayground
                                workshopTitle={`${activeWorkshop.title} (Playground Sandbox)`}
                                initialLanguage={activeWorkshop.id === 'w-1' ? 'python' : 'react'}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">

        {/* WHO'S RUNNING IT / your hosts Section - Full-Width Showcase */}
        <div className="glass-panel p-6 sm:p-8 md:p-10 rounded-3xl border border-white/10 relative overflow-hidden space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-brand-teal uppercase tracking-widest font-bold block mb-1">
                WHO'S RUNNING IT
              </span>
              <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
                Your Workshop Mentors & Hosts
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm font-sans mt-1">
                Live with the engineering leads who architected the platforms, not a slideshow reader.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-300 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>3 Verified Mentors Live</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Host 1: Shreyas M. (Founder & CEO) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative bg-gradient-to-b from-[#181926]/90 to-[#0e1017]/95 border border-white/10 hover:border-[#f87171]/50 rounded-2xl p-6 transition-all duration-300 shadow-xl hover:shadow-[#f87171]/10 flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#f87171] to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-4">
                {/* Identity Header */}
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-[#f87171]/60 bg-[#f87171]/10 shadow-lg shadow-[#f87171]/20">
                      <img 
                        src={getLeaderPhoto('shreyas')} 
                        alt="Shreyas M." 
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const t = e.currentTarget as HTMLImageElement;
                          if (!t.src.endsWith('/founder.jpg')) t.src = '/founder.jpg';
                        }}
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0e1017]" title="Active" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-display font-bold text-white text-xl sm:text-2xl tracking-tight group-hover:text-[#f87171] transition-colors truncate">
                      Shreyas M.
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-[#f87171]/15 text-[#f87171] border border-[#f87171]/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                        Founder & CEO
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-gray-400 mt-1 truncate">
                      Architecture · Workshops · 1:1
                    </p>
                  </div>
                </div>

                {/* Bio Description */}
                <p className="text-gray-300 text-xs sm:text-sm font-sans leading-relaxed">
                  Founder of S-CODERS (Bharat Tech Developers). Shipped multiple production systems and AI agents. Teaches practical software architecture, scalable workflows, and high-impact developer tooling.
                </p>
              </div>

              {/* Social Profiles & Contact */}
              <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-white/10">
                <a
                  href="https://github.com/Shreyas-73"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl text-gray-200 hover:text-white text-xs font-mono transition-all cursor-pointer shadow-sm"
                >
                  <Github className="w-3.5 h-3.5 text-white" />
                  <span>GitHub</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/shreyas-shreyas-97187638b?utm_source=share_via&utm_content=profile&utm_medium=member_android"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0077b5]/10 hover:bg-[#0077b5]/20 border border-[#0077b5]/30 hover:border-[#0077b5]/60 rounded-xl text-[#38bdf8] hover:text-white text-xs font-mono transition-all cursor-pointer shadow-sm"
                >
                  <Linkedin className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </motion.div>

            {/* Host 2: Lokesh A. (Co-Founder) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative bg-gradient-to-b from-[#181926]/90 to-[#0e1017]/95 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 transition-all duration-300 shadow-xl hover:shadow-purple-500/10 flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-4">
                {/* Identity Header */}
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-purple-500/60 bg-purple-500/10 shadow-lg shadow-purple-500/20">
                      <img 
                        src={getLeaderPhoto('lokesh')} 
                        alt="Lokesh A." 
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const t = e.currentTarget as HTMLImageElement;
                          if (!t.src.endsWith('/cofounder.jpg')) t.src = '/cofounder.jpg';
                        }}
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0e1017]" title="Active" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-display font-bold text-white text-xl sm:text-2xl tracking-tight group-hover:text-purple-400 transition-colors truncate">
                      Lokesh A.
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                        Co-Founder
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-gray-400 mt-1 truncate">
                      Vibe Coding · AI Labs · Prototyping
                    </p>
                  </div>
                </div>

                {/* Bio Description */}
                <p className="text-gray-300 text-xs sm:text-sm font-sans leading-relaxed">
                  Co-Founder, S-CODERS (Bharat Tech Developers). Conducts interactive sessions on vibe coding, rapid full-stack prototyping, and creative AI prompt architectures for high-speed software delivery.
                </p>
              </div>

              {/* Social Profiles & Contact */}
              <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-white/10">
                <a
                  href="https://github.com/lokeee1307-source"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl text-gray-200 hover:text-white text-xs font-mono transition-all cursor-pointer shadow-sm"
                >
                  <Github className="w-3.5 h-3.5 text-white" />
                  <span>GitHub</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/lokesh-a-281069404"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0077b5]/10 hover:bg-[#0077b5]/20 border border-[#0077b5]/30 hover:border-[#0077b5]/60 rounded-xl text-[#38bdf8] hover:text-white text-xs font-mono transition-all cursor-pointer shadow-sm"
                >
                  <Linkedin className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </motion.div>

            {/* Host 3: Bhuvan M. (Tech Lead) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group relative bg-gradient-to-b from-[#181926]/90 to-[#0e1017]/95 border border-white/10 hover:border-brand-teal/50 rounded-2xl p-6 transition-all duration-300 shadow-xl hover:shadow-brand-teal/10 flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-teal to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-4">
                {/* Identity Header */}
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-brand-teal/60 bg-brand-teal/10 shadow-lg shadow-brand-teal/20">
                      <img 
                        src={getLeaderPhoto('bhuvan')} 
                        alt="Bhuvan M." 
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const t = e.currentTarget as HTMLImageElement;
                          if (!t.src.endsWith('/techlead.jpg') && !t.src.endsWith('/bhuvan.jpg')) t.src = '/techlead.jpg';
                        }}
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0e1017]" title="Active" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-display font-bold text-white text-xl sm:text-2xl tracking-tight group-hover:text-brand-teal transition-colors truncate">
                      Bhuvan M.
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-brand-teal/15 text-brand-teal border border-brand-teal/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                        Tech Lead
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-gray-400 mt-1 truncate">
                      Full-Stack · UI/UX · Architecture
                    </p>
                  </div>
                </div>

                {/* Bio Description */}
                <p className="text-gray-300 text-xs sm:text-sm font-sans leading-relaxed">
                  Tech Lead at S-CODERS. Full-Stack Developer & UI/UX enthusiast. Architected and developed the complete S-CODERS digital platform, responsive applications, and interactive experiences.
                </p>
              </div>

              {/* Social Profiles */}
              <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-white/10">
                <a
                  href="https://github.com/Gowda487"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl text-gray-200 hover:text-white text-xs font-mono transition-all cursor-pointer shadow-sm"
                >
                  <Github className="w-3.5 h-3.5 text-white" />
                  <span>GitHub</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/bhuvan-m-102835326/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0077b5]/10 hover:bg-[#0077b5]/20 border border-[#0077b5]/30 hover:border-[#0077b5]/60 rounded-xl text-[#38bdf8] hover:text-white text-xs font-mono transition-all cursor-pointer shadow-sm"
                >
                  <Linkedin className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* SOCIAL PROOF: Dynamic comments section below the active workshop detail billboard */}
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 ambient-glow opacity-30 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-brand-teal/10 rounded-xl text-brand-teal border border-brand-teal/20">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-white">Attendee Reviews & Feedback</h3>
                <p className="text-gray-500 text-xs font-sans">Verified testimonials for "{activeWorkshop.title}"</p>
              </div>
            </div>

            {/* List of active workshop comments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <AnimatePresence mode="popLayout">
                {activeWorkshopComments.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-2 text-center py-8 bg-white/5 border border-white/5 rounded-2xl"
                  >
                    <p className="text-gray-500 text-sm font-sans font-light">No feedback left for this session yet. Be the first to share your learning experience!</p>
                  </motion.div>
                ) : (
                  activeWorkshopComments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-brand-dark/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between"
                    >
                      <div>
                        {/* Rating stars display */}
                        <div className="flex gap-1 text-brand-teal mb-3">
                          {Array.from({ length: comment.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <p className="text-gray-300 text-sm font-sans font-light italic leading-relaxed mb-4">
                          "{comment.content}"
                        </p>
                      </div>

                      {/* Author Details */}
                      <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                        <div className="w-8 h-8 rounded-full bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal text-xs font-bold font-mono">
                          {comment.authorName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">{comment.authorName}</div>
                          <div className="text-[10px] font-mono text-gray-500">{comment.role}</div>
                        </div>
                        <span className="text-[10px] font-mono text-gray-600 ml-auto">{comment.timestamp}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Post a feedback review form */}
            <div className="bg-brand-dark/40 border border-white/5 rounded-2xl p-6 sm:p-8">
              <h4 className="font-display font-bold text-base text-white mb-2">Have you attended S-CODERS sessions? Leave Feedback!</h4>
              <p className="text-gray-500 text-xs font-sans mb-6">Your reviews help us design better-tailored technical workshops and guides.</p>

              <form onSubmit={handlePostComment} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-brand-dark/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Your Professional Role / College</label>
                    <input
                      type="text"
                      required
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Student, RVCE / Backend Developer"
                      className="w-full bg-brand-dark/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Rating out of 5</label>
                    <div className="flex gap-1 py-1 text-gray-600">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`p-1 hover:scale-110 transition-all cursor-pointer ${
                            rating >= star ? 'text-brand-teal' : 'text-gray-700'
                          }`}
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Describe Your Feedback / Experience</label>
                  <textarea
                    required
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Describe what you learned or built during the workshop. Mention any specific modules or tools (n8n, Gemini) that helped!"
                    className="w-full bg-brand-dark/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors resize-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{wkspAutoSaveStatus === 'saving' ? 'Auto-saving...' : 'Auto-Save Active'}</span>
                  </div>

                  <div className="flex items-center gap-2.5 ml-auto">
                    <button
                      type="button"
                      onClick={handleManualSaveWorkshop}
                      className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/15 font-mono font-bold rounded-lg transition-colors text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                    >
                      {wkspManualSaveFlash ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Saved!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 text-brand-teal" />
                          <span>Save</span>
                        </>
                      )}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-3 bg-brand-teal hover:bg-white text-brand-dark font-bold rounded-lg transition-colors text-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      Send Testimonial
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>

              {submitSuccess && (
                <div className="mt-4 p-3 bg-brand-teal/10 rounded-lg border border-brand-teal/20 text-xs text-brand-teal text-center font-semibold">
                  Feedback logged successfully! It has been posted to our local community review board.
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* --- WORKSHOP REGISTRATION MODAL --- */}
      <AnimatePresence>
        {showRegModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { 
                setShowRegModal(false); 
                setRegSuccessKey(null);
                setManualKeyError(null);
                setIsProcessing(false);
                setPaymentError(null);
              }}
              className="absolute inset-0 bg-brand-dark/85 backdrop-blur-md"
            />

            {/* Modal Container - Expanded Layout */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-[#10121d] border border-brand-teal/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 overflow-hidden max-h-[92vh] flex flex-col"
            >
              {/* Glow filter */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-brand-teal/10 blur-3xl rounded-full pointer-events-none" />

              {/* Sticky Top Header with Close Button */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-5 shrink-0 relative z-20">
                <div className="flex items-center gap-2.5">
                  <Key className="w-5 h-5 text-brand-teal" />
                  <span className="text-xs font-mono text-brand-teal uppercase tracking-widest font-bold">Session Pass Gateway</span>
                </div>
                <button
                  type="button"
                  onClick={() => { 
                    setShowRegModal(false); 
                    setRegSuccessKey(null);
                    setManualKeyError(null);
                    setIsProcessing(false);
                    setPaymentError(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer relative z-20"
                  id="close-workshop-modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-brand-teal/20 scrollbar-track-transparent">
                {regSuccessKey ? (
                  // SUCCESS STATE
                  <div className="text-center py-6 font-sans max-w-2xl mx-auto space-y-6">
                    <div className="w-16 h-16 bg-brand-teal/15 border border-brand-teal/30 rounded-full flex items-center justify-center mx-auto text-brand-teal shadow-lg shadow-brand-teal/20">
                      <Sparkles className="w-8 h-8 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white mb-2">Registration Complete!</h3>
                      <p className="text-gray-300 text-sm sm:text-base font-light max-w-md mx-auto leading-relaxed">
                        Your attendance pass for <strong className="text-white font-bold">{activeWorkshop.title}</strong> has been secured.
                      </p>
                    </div>

                    {/* Dedicated Per-Workshop WhatsApp Group Link Section */}
                    {(() => {
                      const regWaGroup = getWorkshopWhatsappGroup(activeWorkshop, regSuccessKey || undefined);
                      return (
                        <div className="bg-brand-teal/10 border border-brand-teal/30 p-6 rounded-3xl flex flex-col items-center gap-4 text-center shadow-lg">
                          <div className="p-3 bg-[#25D366]/20 rounded-full text-[#25D366] border border-[#25D366]/30">
                            <Users className="w-7 h-7" />
                          </div>
                          <div>
                            <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-[#25D366] font-bold mb-1">
                              {regWaGroup.groupCode} • Dedicated Workshop Group
                            </span>
                            <h4 className="text-base sm:text-lg font-bold text-white">Join {regWaGroup.groupName}</h4>
                            <p className="text-gray-300 text-xs sm:text-sm mt-1.5 leading-relaxed max-w-lg">
                              Click below to join the dedicated WhatsApp group created specifically for <strong className="text-white">{activeWorkshop.title}</strong>. Session links, schedules, and code files are shared inside this batch group.
                            </p>
                          </div>
                          <a 
                            href={regWaGroup.href}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-8 py-3.5 bg-[#25D366] hover:bg-emerald-400 text-[#0c0d14] font-mono text-xs sm:text-sm uppercase font-extrabold tracking-wider rounded-2xl transition-all block text-center shadow-lg shadow-[#25D366]/25 cursor-pointer active:scale-95"
                          >
                            Join WhatsApp Group
                          </a>
                        </div>
                      );
                    })()}

                    {/* Unique Attendance Key Display Box - Non-overlapping Responsive Card */}
                    <div className="bg-brand-dark/95 border border-brand-teal/30 rounded-2xl p-5 sm:p-6 text-left space-y-3.5 shadow-inner">
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                        <span className="text-[11px] sm:text-xs font-mono text-gray-300 uppercase tracking-widest font-bold">
                          Your Unique Attendance Key
                        </span>
                        <span className="text-[10px] font-mono text-brand-teal bg-brand-teal/10 px-2.5 py-0.5 rounded-full border border-brand-teal/20 font-bold">
                          VERIFIED PASS
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-black/60 p-3.5 sm:p-4 rounded-xl border border-white/10">
                        <span className="font-mono text-base sm:text-lg md:text-xl font-black text-brand-teal select-all text-center sm:text-left tracking-wider break-all sm:break-normal py-1">
                          {regSuccessKey}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyKey(regSuccessKey)}
                          className="px-5 py-3 bg-brand-teal hover:bg-white text-brand-dark rounded-xl font-mono text-xs sm:text-sm font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md active:scale-95"
                          title="Copy Attendance Key to Clipboard"
                        >
                          {copiedKey ? <Check className="w-4 h-4 text-brand-dark" /> : <Copy className="w-4 h-4 text-brand-dark" />}
                          <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowRegModal(false);
                        setActiveWorkspaceWorkshop(activeWorkshop);
                      }}
                      className="w-full py-4 bg-brand-teal hover:bg-white text-brand-dark font-display font-extrabold text-sm uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-lg shadow-brand-teal/20 active:scale-95"
                    >
                      Enter Classroom Workspace
                    </button>
                  </div>
                ) : (
                  // FORM STATE
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 bg-brand-teal/10 rounded-2xl border border-brand-teal/20 text-brand-teal">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-brand-teal uppercase tracking-widest font-bold">Session Pass Gateway</span>
                        <h3 className="font-display font-extrabold text-lg text-white">Join "{activeWorkshop.category}"</h3>
                      </div>
                    </div>

                    {/* Toggle Modes */}
                    <div className="grid grid-cols-3 bg-brand-dark/50 p-1 rounded-xl mb-5 border border-white/5 gap-1">
                      <button
                        type="button"
                        onClick={() => { setRegMode('register'); setManualKeyError(null); }}
                        className={`py-1.5 text-[10px] font-mono rounded-lg transition-all uppercase cursor-pointer ${
                          regMode === 'register' ? 'bg-brand-teal text-brand-dark font-bold shadow' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Register New Pass
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRegMode('enterKey'); setManualKeyError(null); }}
                        className={`py-1.5 text-[10px] font-mono rounded-lg transition-all uppercase cursor-pointer ${
                          regMode === 'enterKey' ? 'bg-brand-teal text-brand-dark font-bold shadow' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Enter Existing Pass
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRegMode('recover'); setManualKeyError(null); }}
                        className={`py-1.5 text-[10px] font-mono rounded-lg transition-all uppercase cursor-pointer ${
                          regMode === 'recover' ? 'bg-brand-teal text-brand-dark font-bold shadow' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Recover UID
                      </button>
                    </div>

                    {regMode === 'register' ? (
                      <form onSubmit={handleRegisterWorkshop} className="space-y-3.5">
                        {/* Workshop Fee summary card */}
                        <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-xl p-3 text-left flex items-center justify-between mb-2">
                          <div>
                            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Workshop Ticket Amount</span>
                            <span className="text-base font-display font-black text-emerald-400">₹{(activeWorkshop.price ?? 1499).toLocaleString()} <span className="text-[10px] text-gray-400 font-sans font-normal">per seat</span></span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-400/20 px-2 py-1 rounded font-bold">Verified Rate</span>
                        </div>

                        {(activeWorkshopWindow.startDate || activeWorkshopWindow.endDate) && (
                          <div className={`rounded-xl p-2.5 border text-[11px] font-mono ${
                            activeWorkshopWindow.allowed
                              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
                              : 'bg-red-500/10 border-red-500/30 text-red-200'
                          }`}>
                            <span className="font-bold block">
                              {activeWorkshopWindow.headline}: {activeWorkshopWindow.startDateDisplay} – {activeWorkshopWindow.endDateDisplay}
                            </span>
                          </div>
                        )}

                        {paymentError && (
                          <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl text-red-400 text-xs font-mono">
                            {paymentError}
                          </div>
                        )}

                        {currentUser && (
                          <div className="bg-brand-teal/5 border border-brand-teal/20 rounded-xl p-2.5 text-[10px] text-brand-teal flex items-center gap-2 mb-1 font-mono">
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>Pre-authenticating from active user session ({currentUser.email}).</span>
                          </div>
                        )}

                        <div>
                          <label className="block text-[9px] font-mono text-gray-400 uppercase tracking-widest mb-1">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-mono text-gray-400 uppercase tracking-widest mb-1">Email Address *</label>
                          <input
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-mono text-gray-400 uppercase tracking-widest mb-1">Mobile / WhatsApp Number</label>
                          <input
                            type="tel"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10-digit mobile number"
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-all font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-mono text-gray-400 uppercase tracking-widest mb-1">Your Technical Role / College (or Workplace) *</label>
                          <input
                            type="text"
                            required
                            value={regRole}
                            onChange={(e) => setRegRole(e.target.value)}
                            placeholder="Enter your role / college or organization"
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-all"
                          />
                        </div>

                        <div className="pt-1">
                          <button
                            type="submit"
                            disabled={isProcessing}
                            className="w-full py-3.5 bg-brand-teal text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className="w-4 h-4 fill-current animate-pulse" />
                            {isProcessing ? 'Opening Razorpay Gateway...' : `Proceed to Pay ₹${((activeWorkshop.price ?? 1499) * payTicketsCount).toLocaleString()} with Razorpay`}
                          </button>
                        </div>
                      </form>
                    ) : regMode === 'enterKey' ? (
                      <form onSubmit={handleVerifyManualKey} className="space-y-3.5 font-sans">
                        <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-3 text-[11px] text-blue-200 leading-relaxed">
                          Lost connection, refreshed, or exited mid-session? Enter the Unique Registration Code emailed to you from <strong className="font-mono text-brand-teal">scoders82@gmail.com</strong> to rejoin immediately.
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Enter Session Pass Key *</label>
                          <input
                            type="text"
                            required
                            value={manualKey}
                            onChange={(e) => {
                              setManualKey(e.target.value);
                              setManualKeyError(null);
                            }}
                            placeholder="Type or paste your unique pass key"
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all font-mono"
                          />
                        </div>

                        {manualKeyError && (
                          <p className="text-red-400 text-[11px] font-mono">{manualKeyError}</p>
                        )}

                        <div className="pt-1 space-y-2.5">
                          <button
                            type="submit"
                            disabled={verifyingManualKey}
                            className="w-full py-3 bg-brand-teal text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Key className="w-3.5 h-3.5" />
                            {verifyingManualKey ? 'Verifying Pass...' : 'Verify & Rejoin Session'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRegMode('recover'); setManualKeyError(null); }}
                            className="w-full text-center text-[11px] font-mono text-brand-teal hover:underline cursor-pointer"
                          >
                            Forgot your pass UID? Verify email & recover →
                          </button>
                        </div>
                      </form>
                    ) : (
                      <UidRecoveryPanel
                        section="workshop"
                        defaultEmail={regEmail || currentUser?.email || ''}
                        onRecoveredKeySelect={(uid) => {
                          setManualKey(uid);
                          setRegMode('enterKey');
                          setManualKeyError(null);
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ACTIVE WORKSHOP WORKSPACE (CONSOLE) OVERLAY MODAL — MATCHES SERVICE WORKSPACE DIMENSIONS --- */}
      <AnimatePresence>
        {activeWorkspaceWorkshop && (() => {
          const wkspRegInfo = registeredKeys[activeWorkspaceWorkshop.id] || activeRegInfo || {
            key: 'PASS-KEY',
            name: currentUser?.name || 'Registered Attendee',
            email: currentUser?.email || 'attendee@scoders.com',
            role: 'Registered Developer',
            timestamp: new Date().toLocaleDateString()
          };

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 md:p-6">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-brand-dark/95 backdrop-blur-lg"
              />

              {/* Workspace Layout Container - Identical width, height & spacing to Service Workspace */}
              <motion.div
                initial={{ scale: 0.98, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.98, opacity: 0, y: 10 }}
                className="relative w-full max-w-[1440px] h-[100dvh] sm:h-[94vh] sm:max-h-[96dvh] bg-[#020516] border-0 sm:border sm:border-white/10 sm:rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col"
              >
                {/* Visual Header - Compact & Responsive */}
                <div className="px-3.5 py-2.5 sm:px-6 sm:py-3.5 bg-brand-dark/90 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="p-2 sm:p-2.5 bg-brand-teal/15 rounded-xl border border-brand-teal/30 text-brand-teal shrink-0">
                      <Code className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] sm:text-[10px] font-mono text-brand-teal uppercase tracking-widest font-bold block truncate">
                        ACTIVE WORKSHOP CONSOLE
                      </span>
                      <h3 className="font-display font-extrabold text-sm sm:text-lg text-white leading-tight truncate">
                        {activeWorkspaceWorkshop.title} Workspace
                      </h3>
                    </div>
                  </div>

                  {/* Key and Close controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyKey(wkspRegInfo.key)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-1.5 flex items-center gap-1.5 text-xs font-mono text-brand-teal transition-all cursor-pointer"
                      title="Click to copy your unique pass key"
                    >
                      <Shield className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                      <span className="font-bold tracking-wide truncate max-w-[100px] sm:max-w-none">{wkspRegInfo.key}</span>
                      <Copy className="w-3 h-3 text-gray-400 ml-1 shrink-0 hidden sm:inline" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveWorkspaceWorkshop(null)}
                      className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/15 rounded-xl text-gray-300 hover:text-white transition-colors cursor-pointer border border-white/10 flex items-center gap-1"
                      title="Close Console"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-[11px] font-mono uppercase font-bold sm:hidden">Close</span>
                    </button>
                  </div>
                </div>

                {/* Main Content Area - Spacious scrolling matching Service Workspace */}
                <div className="flex-1 overflow-y-auto p-2 sm:p-5 md:p-6 bg-brand-dark/40 scrollbar-thin scrollbar-thumb-brand-teal/20 scrollbar-track-transparent">
                  <div className="space-y-4 sm:space-y-6 text-white font-sans w-full max-w-[1380px] mx-auto pb-6">
                    {/* Top Status Banner with Individual Per-Workshop WhatsApp Group */}
                    {(() => {
                      const workspaceWaGroup = getWorkshopWhatsappGroup(activeWorkspaceWorkshop, wkspRegInfo.key);
                      const handleSaveWorkspaceWaGroup = (e: React.FormEvent) => {
                        e.preventDefault();
                        const cleanName = waGroupNameDraft.trim();
                        const cleanUrl = sanitizeWhatsappUrl(waGroupLinkDraft);
                        const updatedList = workshops.map((w) =>
                          w.id === activeWorkspaceWorkshop.id
                            ? {
                                ...w,
                                whatsappGroupName: cleanName || w.whatsappGroupName,
                                whatsappGroupLink: cleanUrl || undefined,
                              }
                            : w
                        );
                        setWorkshops(updatedList);
                        saveDynamicWorkshops(updatedList);
                        const updatedActive = updatedList.find((w) => w.id === activeWorkspaceWorkshop.id) || activeWorkspaceWorkshop;
                        setActiveWorkspaceWorkshop(updatedActive);
                        setEditingWaGroup(false);
                        setWaGroupSavedToast('Dedicated WhatsApp group saved for this workshop!');
                        setTimeout(() => setWaGroupSavedToast(null), 3000);
                      };

                      return (
                        <div className="space-y-3">
                          <div className="bg-[#25d366]/10 border border-[#25d366]/30 px-4 py-3 sm:px-6 sm:py-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#25d366] animate-pulse shrink-0" />
                                <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-[#25d366]">
                                  WORKSHOP SESSION ACTIVE
                                </span>
                              </div>
                              <span className="text-gray-500 text-xs hidden sm:inline">•</span>
                              <span className="text-[11px] font-mono text-emerald-200/90 truncate">
                                Group: <strong className="text-white">{workspaceWaGroup.groupName}</strong> ({workspaceWaGroup.groupCode})
                              </span>
                              <span className="text-gray-500 text-xs hidden lg:inline">•</span>
                              <span className="text-xs text-gray-300 hidden lg:inline truncate">
                                Schedule: <strong className="text-white">{activeWorkspaceWorkshop.date}</strong> ({activeWorkspaceWorkshop.startTime || '10:00 AM IST'}) • Location: <strong className="text-white">{activeWorkspaceWorkshop.location}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={workspaceWaGroup.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Open ${workspaceWaGroup.groupName}`}
                                className="px-3.5 py-1.5 bg-[#25D366] hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-[#25D366]/20 cursor-pointer active:scale-95"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-black" />
                                <span>Join WhatsApp Group</span>
                              </a>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWaGroupNameDraft(workspaceWaGroup.groupName);
                                    setWaGroupLinkDraft(activeWorkspaceWorkshop.whatsappGroupLink || '');
                                    setEditingWaGroup((prev) => !prev);
                                  }}
                                  className="p-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-gray-200 hover:text-white transition-colors cursor-pointer"
                                  title="Admin: Configure dedicated WhatsApp invite link for this workshop"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {waGroupSavedToast && (
                            <div className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-mono">
                              ✓ {waGroupSavedToast}
                            </div>
                          )}

                          {isAdmin && editingWaGroup && (
                            <form
                              onSubmit={handleSaveWorkspaceWaGroup}
                              className="bg-brand-dark/90 border border-[#25D366]/35 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                            >
                              <div className="sm:col-span-4">
                                <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                                  Workshop Group Name ({activeWorkspaceWorkshop.id})
                                </label>
                                <input
                                  type="text"
                                  value={waGroupNameDraft}
                                  onChange={(e) => setWaGroupNameDraft(e.target.value)}
                                  placeholder="e.g. React Native Batch Group"
                                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#25D366]"
                                />
                              </div>
                              <div className="sm:col-span-6">
                                <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                                  Dedicated WhatsApp Invite Link (https://chat.whatsapp.com/...)
                                </label>
                                <input
                                  type="url"
                                  value={waGroupLinkDraft}
                                  onChange={(e) => setWaGroupLinkDraft(e.target.value)}
                                  placeholder="https://chat.whatsapp.com/..."
                                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#25D366]"
                                />
                              </div>
                              <div className="sm:col-span-2 flex gap-2">
                                <button
                                  type="submit"
                                  className="flex-1 py-2 px-3 bg-[#25D366] hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase rounded-xl cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingWaGroup(false)}
                                  className="py-2 px-2.5 bg-white/10 hover:bg-white/20 text-gray-300 font-mono text-xs rounded-xl cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      );
                    })()}

                    {renderWorkshopClassroomTabs(activeWorkspaceWorkshop, wkspRegInfo)}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Official S-CODERS Dispatch Email Popup Notification Modal */}
      <EmailNotificationModal
        isOpen={showEmailNotice}
        onClose={() => setShowEmailNotice(false)}
        data={emailNoticeData}
      />

      {/* Official Razorpay Gateway Modal */}
      {razorpayPaymentDetails && (
        <RazorpayModal
          isOpen={showRazorpayModal}
          initialStep="all_options"
          onClose={() => {
            setShowRazorpayModal(false);
            setIsProcessing(false);
          }}
          onFailure={(reason, details) => {
            setShowRazorpayModal(false);
            setIsProcessing(false);
            if (details?.registrationClosed) {
              const ev =
                details.windowStatus ||
                (activeWorkshop
                  ? evaluateRegistrationWindow({
                      section: 'workshop',
                      itemId: activeWorkshop.id,
                      itemTitle: activeWorkshop.title,
                      startDate: activeWorkshop.registrationStartDate,
                      endDate: activeWorkshop.registrationEndDate,
                      nowMs: getAuthoritativeNowMs(),
                    })
                  : null);
              if (ev) {
                setClosedModalEval(ev);
                setShowClosedModal(true);
              }
              setShowRegModal(false);
              return;
            }
            setPaymentError(reason || 'Payment incomplete or cancelled. No workshop pass was issued.');
            handleSimulatePaymentFailure(reason || 'Payment cancelled or declined by user');
          }}
          onSuccess={handleRazorpayWorkshopSuccess}
          orderData={razorpayOrderData}
          paymentDetails={razorpayPaymentDetails}
        />
      )}

      {/* Confirmation Pop-Up Modal for Permanent Workshop Cancellation */}
      <AnimatePresence>
        {showCancelWorkshopConfirm && cancelTargetWorkshop && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!isCancellingWorkshop) setShowCancelWorkshopConfirm(false); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              className="relative z-10 w-full max-w-lg bg-[#121422] border border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold block">
                      Permanent Workshop Cancellation
                    </span>
                    <h3 className="text-lg sm:text-xl font-display font-extrabold text-white leading-tight">
                      Cancel "{cancelTargetWorkshop.workshopTitle}"?
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isCancellingWorkshop}
                  onClick={() => setShowCancelWorkshopConfirm(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  title="Close warning"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 space-y-3 text-xs sm:text-sm text-gray-200 leading-relaxed">
                <p className="text-gray-100 leading-relaxed">
                  Are you sure you want to cancel this order/registration? Once you confirm the cancellation, your order/registration and associated information will be permanently deleted from our database. Please note that if you cancel by mistake or intentionally, you will be solely responsible for your decision. S-CODERS and its team will not be held responsible for cancellations made by you. Do you wish to proceed?
                </p>
                {cancelTargetWorkshop.key && (
                  <p className="text-[11px] font-mono text-red-300 pt-1 border-t border-red-500/20">
                    Registration Pass: <span className="text-white font-bold">{cancelTargetWorkshop.key}</span> • Permanent database removal cannot be undone.
                  </p>
                )}
              </div>

              {cancelWorkshopError && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-mono">
                  {cancelWorkshopError}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                <button
                  type="button"
                  disabled={isCancellingWorkshop}
                  onClick={() => setShowCancelWorkshopConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  disabled={isCancellingWorkshop}
                  onClick={handleConfirmCancelWorkshop}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 cursor-pointer disabled:opacity-60"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isCancellingWorkshop ? 'Deleting Registration...' : 'Confirm Cancellation'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Registration Closed / Not Started Modal */}
      <RegistrationClosedModal
        isOpen={showClosedModal}
        onClose={() => setShowClosedModal(false)}
        evaluation={closedModalEval}
      />
    </section>
  );
}
