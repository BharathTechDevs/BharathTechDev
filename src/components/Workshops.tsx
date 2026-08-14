import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, MapPin, Users, Award, Sparkles, MessageSquare, 
  Send, User, Star, CheckCircle, ArrowRight, Edit2, Save, X, Plus, Minus,
  Lock, Key, Copy, Code, Terminal, Download, Play, MessageCircle, Eye, Shield, Check, RefreshCw,
  ShieldCheck, CreditCard, Wallet, Upload, Clock, Wrench, BookOpen, Cpu, CheckSquare, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MarqueeTicker from './MarqueeTicker';
import { INITIAL_COMMENTS } from '../data';
import { getDynamicWorkshops, saveDynamicWorkshops } from '../utils/dynamicData';
import { WorkshopComment, WorkshopEvent, AppUser } from '../types';
import { DatabaseEngine, WorkshopRegistration, PaymentTransaction, ChatConversation, FileRecord } from '../utils/dbEngine';
import RazorpayModal, { RazorpayPaymentSuccessData } from './RazorpayModal';
import EmailNotificationModal, { EmailNotificationData } from './EmailNotificationModal';

interface WorkshopsProps {
  onBookWorkshop?: (details: { workshopId: string; title: string; seats: number; totalAmount: number }) => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  text: string;
  time: string;
  isSelf?: boolean;
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
    }
  }>(() => {
    const saved = localStorage.getItem('scoders_registered_workshops');
    return saved ? JSON.parse(saved) : {};
  });

  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('Developer');
  const [showRegModal, setShowRegModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [regSuccessKey, setRegSuccessKey] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState('');
  const [manualKeyError, setManualKeyError] = useState<string | null>(null);
  const [regMode, setRegMode] = useState<'register' | 'enterKey'>('register');

  // New Payment States inside Workshops Modal
  const [paymentStep, setPaymentStep] = useState(false);
  const [payTicketsCount, setPayTicketsCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'card' | 'bank'>('razorpay');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'generic' | null>(null);
  const [cardNo, setCardNo] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paymentSimulating, setPaymentSimulating] = useState(false);
  const [whatsappJoined, setWhatsappJoined] = useState(false);
  const [otpVerificationStep, setOtpVerificationStep] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [upiPendingStep, setUpiPendingStep] = useState(false);
  const [upiVerified, setUpiVerified] = useState(false);
  const [upiVerifying, setUpiVerifying] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);
  const [generatedWorkshopKey, setGeneratedWorkshopKey] = useState<string | null>(null);
  const [ruyTimer, setRuyTimer] = useState(300);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<any>(null);
  const [receiptName, setReceiptName] = useState('');
  const [upiUtrInput, setUpiUtrInput] = useState('');
  const [upiUtrError, setUpiUtrError] = useState<string | null>(null);
  const [isVerifyingUtr, setIsVerifyingUtr] = useState(false);

  // Razorpay Gateway Modal Integration States
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
    purpose: string;
    merchantUpiId: string;
  } | null>(null);

  // Email Notification Modal State (scoders82@gmail.com)
  const [showEmailNotice, setShowEmailNotice] = useState(false);
  const [emailNoticeData, setEmailNoticeData] = useState<EmailNotificationData | null>(null);

  // Active Workshop Classroom States
  const [activeTab, setActiveTab] = useState<'sandbox' | 'resources' | 'discussion'>('sandbox');
  
  // Sandbox State
  const [sandboxCode, setSandboxCode] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);

  // Download States
  const [downloadingItem, setDownloadingItem] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Discussion / Chatroom State
  const [chatInput, setChatInput] = useState('');
  const [chatroomMessages, setChatroomMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    window.addEventListener('scoders_auth_change', handleSyncAuth);
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

  // OTP Countdown Timer
  useEffect(() => {
    let timer: any;
    if (otpVerificationStep && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpVerificationStep, otpCountdown]);

  // Ruy Gateway Timer
  useEffect(() => {
    let interval: any;
    if (upiPendingStep && ruyTimer > 0) {
      interval = setInterval(() => {
        setRuyTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [upiPendingStep, ruyTimer]);

  // Listen to external database changes
  useEffect(() => {
    const reloadWorkshops = () => {
      setWorkshops(getDynamicWorkshops());
    };
    window.addEventListener('scoders_data_change', reloadWorkshops);
    return () => {
      window.removeEventListener('scoders_data_change', reloadWorkshops);
    };
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

  // Check if active workshop is registered
  const isRegistered = !!registeredKeys[activeWorkshop.id];
  const activeRegInfo = registeredKeys[activeWorkshop.id];

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
    setTerminalLogs([]);
  }, [selectedWorkshopId]);

  // Handle key creation & registration (starts payment flow)
  const handleRegisterWorkshop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regRole) return;
    setPaymentStep(true);
  };

  // Helper to generate the most robust device-specific UPI deep link
  const getUpiDeviceLink = (app: 'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'generic', address: string, name: string, amount: number, note: string) => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    const encodedName = encodeURIComponent(name);
    const encodedNote = encodeURIComponent(note);
    const params = `pa=${address}&pn=${encodedName}&am=${amount}&cu=INR&tn=${encodedNote}`;
    
    if (isAndroid) {
      if (app === 'phonepe') {
        return `intent://pay?${params}#Intent;scheme=upi;package=com.phonepe.app;end`;
      } else if (app === 'gpay') {
        return `intent://pay?${params}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
      } else if (app === 'paytm') {
        return `intent://pay?${params}#Intent;scheme=upi;package=net.one97.paytm;end`;
      } else if (app === 'bhim') {
        return `intent://pay?${params}#Intent;scheme=upi;package=in.org.npci.upiapp;end`;
      }
      return `upi://pay?${params}`;
    } else if (isIOS) {
      if (app === 'phonepe') {
        return `phonepe://pay?${params}`;
      } else if (app === 'gpay') {
        return `gpay://upi/pay?${params}`;
      } else if (app === 'paytm') {
        return `paytmmp://pay?${params}`;
      }
      return `upi://pay?${params}`;
    } else {
      return `upi://pay?${params}`;
    }
  };

  const handleInitiateUpiPayment = (app: 'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'generic') => {
    setSelectedUpiApp(app);
    setPaymentSimulating(true);
    setUpiVerified(false);
    setUpiVerifying(false);
    setRuyTimer(300); // 5 minutes
    
    // Construct real UPI URI
    const payeeAddress = 'scoders@ybl';
    const payeeName = 'S-CODERS Technologies';
    const payAmount = (activeWorkshop.price ?? 1499) * payTicketsCount;
    const note = `Workshop Pass: ${activeWorkshop.title.substring(0, 20)}`;
    
    const intentUri = getUpiDeviceLink(app, payeeAddress, payeeName, payAmount, note);

    // Try launching the deep link immediately
    try {
      window.location.href = intentUri;
    } catch (err) {
      console.warn("Could not launch custom deep link automatically:", err);
    }

    setTimeout(() => {
      setPaymentSimulating(false);
      setUpiPendingStep(true);
    }, 1500);
  };

  const mintAndCompleteWorkshopRegistration = (
    clientName: string,
    clientEmail: string,
    clientRole: string,
    totalAmount: number,
    payMethod: string,
    txnId: string
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

    // 2. Mint Unique Workshop Access Key
    const code = activeWorkshop.id.toUpperCase();
    const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
    const uniqueId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generatedKey = `BTD-WKSP-${code}-${timestamp}-${uniqueId}`;

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
        timestamp: new Date().toLocaleDateString()
      }
    };

    setRegisteredKeys(newKeys);
    localStorage.setItem('scoders_registered_workshops', JSON.stringify(newKeys));
    setRegSuccessKey(generatedKey);
    setGeneratedWorkshopKey(generatedKey);
    setIsPaymentVerified(true);

    // 4. Save to relational DatabaseEngine
    try {
      const regId = 'reg-wksp-' + Date.now();
      const mockPdfId = 'file-pdf-' + Date.now();
      const mockSrcId = 'file-src-' + Date.now();
      const mockChatId = 'chat-wksp-' + Date.now();

      const dbRegistration: WorkshopRegistration = {
        id: regId,
        participantProfile: {
          name: safeName,
          email: safeEmail,
          phone: '+91 99999 00000',
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
      const currentRegs = DatabaseEngine.getWorkshopRegistrations();
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
        messages: [
          { id: 'msg-wksp-1', sender: 'team', content: `Congratulations ${safeName}! You are officially registered for S-CODERS Workshop: '${activeWorkshop.title}'. Your learning materials, developer sandbox, and schedule access are unlocked.`, timestamp: new Date().toISOString() }
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
    } catch (err) {
      console.warn("DB engine workshop registration save error:", err);
    }

    // 5. Trigger automated backend email dispatch from scoders82@gmail.com
    try {
      fetch('/api/email/workshop-payment-verified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: safeEmail,
          clientName: safeName,
          workshopTitle: activeWorkshop.title,
          amount: totalAmount,
          uniqueKey: generatedKey,
          paymentId: txnId,
          actionUrl: `${window.location.origin}/?view=workshops&key=${generatedKey}`
        })
      }).catch(err => console.warn("Workshop email dispatch warning:", err));
    } catch (emailErr) {
      console.warn("Workshop email dispatch error:", emailErr);
    }

    // 6. Close the drawer modal immediately and clear inputs
    setShowRegModal(false);
    setPaymentStep(false);
    setOtpVerificationStep(false);
    setUpiPendingStep(false);
    setUpiUtrInput('');
    setCardNo('');
    setCardExpiry('');
    setCardCvv('');

    // 7. Pop up the official Email Notification Confirmation Modal
    setEmailNoticeData({
      type: 'workshop',
      recipientEmail: safeEmail,
      recipientName: safeName,
      subject: `🎓 Payment Done Successfully - S-CODERS Workshop Key (${generatedKey})`,
      title: activeWorkshop.title,
      uniqueKey: generatedKey,
      messageText: "Your payment has been done successfully and thank you for choosing S-CODERS Bharath tech developers. Your classroom sandbox, downloadable assets, and Zoom meeting access are now unlocked!",
      amount: totalAmount,
      actionText: "Enter Workshop & Sandbox",
      onAction: () => {
        setShowEmailNotice(false);
      }
    });
    setShowEmailNotice(true);
  };

  const handleReceiptMockUpload = () => {
    setReceiptName(`SCO_BANK_WIRE_RECEIPT_${Math.floor(1000 + Math.random() * 9000)}.pdf`);
    setReceiptFile({ size: 1450000 });
  };

  const handleInitiateBankPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      alert('Please upload or simulate a bank wire transfer receipt first.');
      return;
    }
    setPaymentSimulating(true);
    setTimeout(() => {
      setPaymentSimulating(false);
      const totalAmount = (activeWorkshop.price ?? 1499) * payTicketsCount;
      mintAndCompleteWorkshopRegistration(
        regName.trim() || currentUser?.name || 'Workshop Participant',
        regEmail.trim() || currentUser?.email || 'participant@scoders.com',
        regRole || 'Registered Developer',
        totalAmount,
        'Bank Transfer (NEFT/IMPS)',
        'BANK_WIRE_' + Date.now().toString(36).toUpperCase()
      );
    }, 1200);
  };

  const handleSimulateUpiSuccess = () => {
    setUpiVerifying(true);
    setTimeout(() => {
      setUpiVerifying(false);
      setUpiVerified(true);
    }, 1500);
  };

  const handleInitiateCardPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNo || !cardExpiry || !cardCvv) {
      alert('Please fill in valid card details.');
      return;
    }
    setPaymentSimulating(true);
    setTimeout(() => {
      setPaymentSimulating(false);
      setOtpVerificationStep(true);
      setOtpCountdown(60);
      setOtpValue('');
      setOtpError(null);
    }, 1200);
  };

  const handleGenerateUniqueKey = () => {
    const totalAmount = (activeWorkshop.price ?? 1499) * payTicketsCount;
    mintAndCompleteWorkshopRegistration(
      regName.trim() || currentUser?.name || 'Workshop Participant',
      regEmail.trim() || currentUser?.email || 'participant@scoders.com',
      regRole || 'Registered Developer',
      totalAmount,
      'Direct Key Gateway',
      'DIRECT_KEY_' + Date.now().toString(36).toUpperCase()
    );
  };

  const handleInitiateRazorpayWorkshop = async () => {
    const totalAmount = (activeWorkshop.price ?? 1499) * payTicketsCount;
    const participantName = (regName.trim() || currentUser?.name || 'Attendee').trim();
    const participantEmail = (regEmail.trim() || currentUser?.email || 'attendee@scoders.com').trim();

    try {
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'INR',
          receipt: `wksp_${activeWorkshop.id}_${Date.now()}`,
          notes: {
            workshopTitle: activeWorkshop.title,
            participantName: participantName,
            email: participantEmail,
            tickets: payTicketsCount
          }
        })
      });

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
        purpose: `Workshop Pass: ${activeWorkshop.title}`,
        merchantUpiId: 'scoders@ybl'
      });

      setShowRazorpayModal(true);
    } catch (err) {
      console.warn("Offline fallback for workshop razorpay order:", err);
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
        purpose: `Workshop Pass: ${activeWorkshop.title}`,
        merchantUpiId: 'scoders@ybl'
      });
      setShowRazorpayModal(true);
    }
  };

  const handleRazorpayWorkshopSuccess = (data: RazorpayPaymentSuccessData) => {
    setShowRazorpayModal(false);
    mintAndCompleteWorkshopRegistration(
      data.clientName || regName || currentUser?.name || 'Workshop Participant',
      data.email || regEmail || currentUser?.email || 'participant@scoders.com',
      regRole || 'Registered Developer',
      data.amount,
      'Razorpay Smart Gateway (scoders@ybl)',
      data.razorpay_payment_id || ('PAY_WKSP_' + Date.now().toString(36).toUpperCase())
    );
  };

  const handleDirectUpiWorkshopSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = upiUtrInput.trim();
    if (trimmed.length < 6) {
      setUpiUtrError('Please enter a valid 12-digit UPI reference (UTR) number');
      return;
    }
    setUpiUtrError(null);
    setIsVerifyingUtr(true);

    setTimeout(() => {
      setIsVerifyingUtr(false);
      const totalAmount = (activeWorkshop.price ?? 1499) * payTicketsCount;
      mintAndCompleteWorkshopRegistration(
        regName.trim() || currentUser?.name || 'Workshop Participant',
        regEmail.trim() || currentUser?.email || 'participant@scoders.com',
        regRole || 'Registered Developer',
        totalAmount,
        'Direct UPI (scoders@ybl)',
        'UPI_UTR_' + trimmed.toUpperCase()
      );
    }, 1200);
  };

  const handleVerifyOtpAndComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.trim() !== '123456' && otpValue.trim().length !== 6) {
      setOtpError('Invalid OTP. For test verification, enter the bank OTP code: 123456');
      return;
    }
    setPaymentSimulating(true);
    setTimeout(() => {
      setPaymentSimulating(false);
      const totalAmount = (activeWorkshop.price ?? 1499) * payTicketsCount;
      mintAndCompleteWorkshopRegistration(
        regName.trim() || currentUser?.name || 'Workshop Participant',
        regEmail.trim() || currentUser?.email || 'participant@scoders.com',
        regRole || 'Registered Developer',
        totalAmount,
        'Credit/Debit Card (Online)',
        'CARD_TXN_' + Date.now().toString(36).toUpperCase()
      );
    }, 1000);
  };

  const handleVerifyUpiPaymentAndComplete = () => {
    setPaymentSimulating(true);
    setTimeout(() => {
      setPaymentSimulating(false);
      const totalAmount = (activeWorkshop.price ?? 1499) * payTicketsCount;
      mintAndCompleteWorkshopRegistration(
        regName.trim() || currentUser?.name || 'Workshop Participant',
        regEmail.trim() || currentUser?.email || 'participant@scoders.com',
        regRole || 'Registered Developer',
        totalAmount,
        `UPI App (${selectedUpiApp || 'Ruy Pay'})`,
        'UPI_' + Date.now().toString(36).toUpperCase()
      );
    }, 1000);
  };

  const handleCompletePayment = () => {
    const totalAmount = (activeWorkshop.price ?? 1499) * payTicketsCount;
    mintAndCompleteWorkshopRegistration(
      regName.trim() || currentUser?.name || 'Workshop Participant',
      regEmail.trim() || currentUser?.email || 'participant@scoders.com',
      regRole || 'Registered Developer',
      totalAmount,
      'Direct Settle Gateway',
      'DIRECT_' + Date.now().toString(36).toUpperCase()
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
          actionUrl: `${window.location.origin}/?view=workshops`
        })
      }).catch(err => console.warn("Workshop failure email warning:", err));
    } catch (emailErr) {
      console.warn("Workshop failure email error:", emailErr);
    }
  };

  const handleVerifyManualKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualKey.trim()) return;

    const trimmed = manualKey.trim().toUpperCase();
    const code = activeWorkshop.id.toUpperCase();
    const expectedPrefix = `BTD-WKSP-${code}-`;

    if (trimmed.startsWith(expectedPrefix) && trimmed.length >= expectedPrefix.length + 4) {
      const newKeys = {
        ...registeredKeys,
        [activeWorkshop.id]: {
          key: trimmed,
          name: currentUser?.name || 'Manual Attendee',
          email: currentUser?.email || 'manual@wksp-pass.in',
          role: 'Registered Developer',
          timestamp: new Date().toLocaleDateString()
        }
      };
      setRegisteredKeys(newKeys);
      localStorage.setItem('scoders_registered_workshops', JSON.stringify(newKeys));
      setShowRegModal(false);
      setManualKey('');
      setManualKeyError(null);
    } else {
      setManualKeyError(`Invalid key format. Pass for this session must start with: ${expectedPrefix}`);
    }
  };

  const handleRemovePass = (id: string) => {
    const updated = { ...registeredKeys };
    delete updated[id];
    setRegisteredKeys(updated);
    localStorage.setItem('scoders_registered_workshops', JSON.stringify(updated));
  };

  const handleCopyKey = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // RUN CODE SANDBOX SIMULATION
  const handleRunSandbox = () => {
    setIsCompiling(true);
    setTerminalLogs([
      `🕒 [${new Date().toLocaleTimeString()}] COMPILING SOURCE FILES (TSX -> ESNext Node)...`,
      `⚙️ Checking dependencies map in package.json...`,
      `🔍 Resolving system import: "@google/genai"`
    ]);

    setTimeout(() => {
      setTerminalLogs(prev => [
        ...prev,
        `🔑 Verifying local keychain token auth: [${activeRegInfo?.key || 'MOCK_KEY'}]`,
        `🚀 Executing application server thread...`,
        `📟 [CONSOLE LOG]: Initializing Agent Core...`,
        `📡 Contacting Google Cloud Run server routing to Gemini endpoint...`,
      ]);
    }, 1000);

    setTimeout(() => {
      setTerminalLogs(prev => [
        ...prev,
        `📟 [CONSOLE LOG]: Gemini response fetched successfully!`,
        `📝 [RESPONSE TEXT]:\n   1. Analyze subject line triggers.\n   2. Map to dynamic categorization tags.\n   3. Forward split payloads via Webhook triggers.`,
        `✅ BUILD AND EXECUTION FINISHED SUCCESSFULLY (Status: 0, Time: 2.14s)`
      ]);
      setIsCompiling(false);
    }, 2200);
  };

  // RESOURCE MOCK DOWNLOAD
  const handleDownloadResource = (itemName: string) => {
    setDownloadingItem(itemName);
    setDownloadProgress(0);
  };

  useEffect(() => {
    if (!downloadingItem) return;
    if (downloadProgress < 100) {
      const timer = setTimeout(() => {
        setDownloadProgress(prev => Math.min(100, prev + Math.floor(Math.random() * 25) + 10));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => {
        setDownloadingItem(null);
        setDownloadProgress(0);
        alert(`Downloaded file assets for "${itemNameFormat(downloadingItem)}" safely!`);
      }, 500);
    }
  }, [downloadingItem, downloadProgress]);

  const itemNameFormat = (name: string) => {
    switch (name) {
      case 'json': return 'n8n_agent_pipeline_blueprint.json';
      case 'pdf_prompt': return 'gemini_prompt_architectures_cheat.pdf';
      case 'zip': return 'nextjs_15_multitenant_boilerplate.zip';
      case 'pdf_slides': return 'official_session_slides_v3.pdf';
      default: return 'workshop_asset.zip';
    }
  };

  // VERIFIED COMMUNITY CHATROOM FEED SIMULATOR
  useEffect(() => {
    // Initial messages set
    const mockMessages: ChatMessage[] = [
      { id: '1', sender: 'Aravind K', role: 'SDE-2, Swiggy', text: 'Wait, does the Gemini Node SDK support streaming responses out of the box?', time: '10:41 AM' },
      { id: '2', sender: 'Instructor Aishwarya', role: 'S-CODERS Lead', text: 'Yes, absolutely! Use `ai.models.generateContentStream` instead of `generateContent` for real-time output streams.', time: '10:42 AM' },
      { id: '3', sender: 'Nisha Hegde', role: 'Student, RVCE', text: 'The n8n custom WhatsApp webhook nodes worked perfectly on the sandbox. This is super fast.', time: '10:43 AM' },
      { id: '4', sender: 'Meghana R', role: 'Intern, Dell', text: 'Do we get a certification record of attendance once we finish the final sandbox test?', time: '10:44 AM' }
    ];
    setChatroomMessages(mockMessages);
  }, [selectedWorkshopId]);

  // Periodic incoming mock chats
  useEffect(() => {
    if (!isRegistered) return;

    const interval = setInterval(() => {
      const randomChats = [
        { sender: 'Bhuvan M', role: 'Founder, AgroSmart AI', text: 'Is anyone deploying sub-agents? What is your prompt strategy for avoiding loops?' },
        { sender: 'Instructor Aishwarya', role: 'S-CODERS Lead', text: 'Make sure your agent has a clear exit node or a system constraint specifying: Maximum 5 loop turns.' },
        { sender: 'Nithin Rao', role: 'Backend Dev, Zerodha', text: 'Just finished compiling the Postgres pool configurations. Working nicely!' },
        { sender: 'Suhas Gowda', role: 'Co-Founder', text: 'Amazing work everyone. Keep experimenting with the n8n webhook nodes!' }
      ];

      const chosen = randomChats[Math.floor(Math.random() * randomChats.length)];
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: chosen.sender,
        role: chosen.role,
        text: chosen.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatroomMessages(prev => [...prev, newMessage]);
    }, 15000);

    return () => clearInterval(interval);
  }, [isRegistered]);

  // Send message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: currentUser?.name || 'You (Developer)',
      role: currentUser?.role === 'admin' ? 'System Administrator' : 'Attendee Builder',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true
    };

    setChatroomMessages(prev => [...prev, newMessage]);
    setChatInput('');
  };

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatroomMessages]);

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

  return (
    <section id="workshops" className="py-24 bg-brand-dark relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute left-0 bottom-1/4 w-[400px] h-[400px] ambient-glow rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono mb-4">
            <Calendar className="w-3.5 h-3.5" />
            <span>COMMUNITY BUILDING</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight mb-6">
            Workshops & Classroom Portal
          </h2>
          <p className="text-gray-400 font-sans font-light text-lg">
            S-CODERS • Bharath Tech Developers is heavily active in Bengaluru's academic and development circles. View our seminars, register to access live sandboxes, and download blueprints.
          </p>
        </div>

        {/* Continuous Moving Animation Marquee for Workshop Options */}
        <div className="mb-12">
          <MarqueeTicker badgeText="EXPLORE WORKSHOP TOPICS & MODULES" />
        </div>

        {/* Selected Workshop Visual Showcase Billboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 items-start">
          
          {/* LEFT: Workshop selector buttons & brief timeline */}
          <div className="lg:col-span-4 space-y-4">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2 pl-2">Select Workshop Event Option</div>
            {workshops.map((w) => {
              const isSelected = selectedWorkshopId === w.id;
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
                  <div className="flex items-center justify-between mb-1 z-10">
                    <span className="text-[10px] font-mono text-brand-teal uppercase tracking-widest font-bold">{w.category}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/30">
                        ₹{(w.price ?? 1499).toLocaleString()}
                      </span>
                      {registeredKeys[w.id] ? (
                        <span className="text-[8px] font-mono px-2 py-0.5 bg-brand-teal/10 border border-brand-teal/30 text-brand-teal rounded-full font-bold uppercase animate-pulse">Unlocked</span>
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
                          'Receive official S-CODERS • Bharath Tech Developers Certification'
                        ]).map((outcome, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-gray-300 font-sans">
                            <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* GATE CONTROL: If registered, reveal interactive classroom. If not, show Register banner */}
                  {isRegistered ? (
                    <div className="pt-8 mt-8 border-t border-white/5 space-y-6">
                      <div className="bg-brand-dark/80 p-5 rounded-2xl border border-brand-teal/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-brand-teal/10 rounded-xl text-brand-teal border border-brand-teal/20">
                            <Shield className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-brand-teal uppercase tracking-widest font-bold">Keychain Active</span>
                            <h4 className="text-sm font-bold text-white font-sans">Attending Live Session</h4>
                            <p className="text-[11px] text-gray-500 font-mono mt-0.5">Secure Key: {activeRegInfo.key}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopyKey(activeRegInfo.key)}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer border border-white/5"
                            title="Copy Key"
                          >
                            {copiedKey ? <Check className="w-4 h-4 text-brand-teal" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleRemovePass(activeWorkshop.id)}
                            className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-mono text-[10px] uppercase font-bold transition-all cursor-pointer border border-red-500/15"
                          >
                            Revoke Pass
                          </button>
                        </div>
                      </div>

                      {/* --- HIGH FIDELITY CLASSROOM TABBED CONTAINER --- */}
                      <div className="bg-brand-dark/35 border border-white/5 rounded-2xl overflow-hidden mt-6">
                        {/* Tab Headers */}
                        <div className="grid grid-cols-3 bg-brand-dark/80 border-b border-white/5 p-1">
                          {[
                            { id: 'sandbox', label: 'Sandbox IDE', icon: Code },
                            { id: 'resources', label: 'Downloads', icon: Download },
                            { id: 'discussion', label: 'Discussion Live', icon: MessageCircle },
                          ].map(t => (
                            <button
                              key={t.id}
                              onClick={() => setActiveTab(t.id as any)}
                              className={`py-2 px-2.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                activeTab === t.id
                                  ? 'bg-brand-teal text-brand-dark'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              <t.icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden sm:inline">{t.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* Tab Panels */}
                        <div className="p-5 min-h-[35vh]">
                          
                          {/* TAB 1: SANDBOX IDE */}
                          {activeTab === 'sandbox' && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                                <span>main.ts (Read-Write Environment)</span>
                                <span className="text-brand-teal">Interactive Sandbox Core</span>
                              </div>
                              <div className="border border-white/5 rounded-xl overflow-hidden bg-brand-dark/95">
                                <textarea
                                  value={sandboxCode}
                                  onChange={(e) => setSandboxCode(e.target.value)}
                                  className="w-full bg-transparent text-xs p-4 text-emerald-300 font-mono focus:outline-none h-44 resize-none leading-relaxed"
                                  placeholder="// Write your custom workspace code here..."
                                />
                              </div>

                              <div className="flex justify-between items-center gap-3">
                                <button
                                  onClick={handleRunSandbox}
                                  disabled={isCompiling}
                                  className="px-5 py-2.5 bg-brand-teal hover:bg-white text-brand-dark font-display font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                                >
                                  {isCompiling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                  Run Code Sandbox
                                </button>
                                <span className="text-[10px] text-gray-500 font-mono">Status: Connected</span>
                              </div>

                              {/* Terminal Display */}
                              {terminalLogs.length > 0 && (
                                <div className="bg-[#010309] border border-white/5 rounded-xl p-4 font-mono text-[10px] space-y-1.5 text-emerald-400 max-h-36 overflow-y-auto">
                                  {terminalLogs.map((log, i) => (
                                    <div key={i} className={log.includes('📟') ? 'text-white' : log.includes('✅') ? 'text-emerald-300 font-extrabold' : ''}>
                                      {log}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* TAB 2: DOWNLOADS TRACKER */}
                          {activeTab === 'resources' && (
                            <div className="space-y-3">
                              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold mb-1">Developer Assets Locker</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                  { id: 'json', title: 'n8n Workflow Blueprints', type: 'JSON Specification', size: '24 KB' },
                                  { id: 'pdf_prompt', title: 'Gemini System Prompts', type: 'System Cheat-sheet PDF', size: '180 KB' },
                                  { id: 'zip', title: 'SaaS Multitenant Boilerplate', type: 'TypeScript React Zip', size: '1.4 MB' },
                                  { id: 'pdf_slides', title: 'Session Deck & Exercises', type: 'Slide Presentation PDF', size: '3.6 MB' },
                                ].map(item => (
                                  <div key={item.id} className="bg-brand-dark/40 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4">
                                    <div className="overflow-hidden">
                                      <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{item.type} • {item.size}</p>
                                    </div>

                                    {downloadingItem === item.id ? (
                                      <div className="w-20 text-right space-y-1">
                                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                          <div className="h-full bg-brand-teal transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                                        </div>
                                        <span className="text-[8px] font-mono text-brand-teal">{downloadProgress}%</span>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleDownloadResource(item.id)}
                                        className="p-2 bg-white/5 hover:bg-brand-teal/20 text-gray-400 hover:text-brand-teal rounded-lg transition-all border border-white/5 cursor-pointer"
                                        title="Download"
                                      >
                                        <Download className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* TAB 3: DISCUSSION LIVE CHATROOM */}
                          {activeTab === 'discussion' && (
                            <div className="flex flex-col h-[40vh] justify-between space-y-4">
                              <div className="flex-grow bg-[#010309] border border-white/5 rounded-xl p-4 overflow-y-auto space-y-3 max-h-56">
                                {chatroomMessages.map((msg, idx) => (
                                  <div key={msg.id || idx} className={`flex flex-col max-w-[85%] ${msg.isSelf ? 'ml-auto items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-gray-500 mb-0.5">
                                      <span className={msg.isSelf ? 'text-brand-teal font-bold' : 'text-gray-300 font-medium'}>{msg.sender}</span>
                                      <span>•</span>
                                      <span>{msg.role}</span>
                                    </div>
                                    <div className={`p-2.5 rounded-2xl text-xs ${msg.isSelf ? 'bg-brand-teal text-brand-dark rounded-tr-none font-medium' : 'bg-white/5 text-gray-300 rounded-tl-none'}`}>
                                      {msg.text}
                                    </div>
                                    <span className="text-[8px] font-mono text-gray-600 mt-0.5">{msg.time}</span>
                                  </div>
                                ))}
                                <div ref={chatEndRef} />
                              </div>

                              <form onSubmit={handleSendChat} className="flex gap-2 font-mono">
                                <input
                                  type="text"
                                  value={chatInput}
                                  onChange={(e) => setChatInput(e.target.value)}
                                  placeholder="Type question or comment to the live community..."
                                  className="flex-grow bg-brand-dark/70 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all"
                                />
                                <button
                                  type="submit"
                                  className="p-2 bg-brand-teal hover:bg-white text-brand-dark rounded-xl transition-colors cursor-pointer shrink-0"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              </form>
                            </div>
                          )}

                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="pt-8 mt-8 border-t border-white/5 space-y-6">
                      <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-6 text-center space-y-3">
                        <div className="w-10 h-10 bg-amber-400/10 rounded-full flex items-center justify-center mx-auto text-amber-400 border border-amber-400/20">
                          <Lock className="w-5 h-5" />
                        </div>
                        <h4 className="font-display font-bold text-white text-base">Classroom & Deliverables Locked</h4>
                        <p className="text-gray-400 text-xs font-sans max-w-md mx-auto leading-relaxed">
                          Developer sandboxes, session codes, slides, and simulated attendee discussion streams are restricted. Please register to obtain your session key.
                        </p>

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
                              setShowRegModal(true);
                              setRegMode('register');
                              setRegSuccessKey(null);
                              setPayTicketsCount(seatCount);
                            }}
                            className="px-6 py-3 bg-brand-teal hover:bg-white text-brand-dark font-display font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-brand-teal/20"
                          >
                            <Key className="w-4 h-4" />
                            Register & Pay ₹{(activeWorkshop.price ?? 1499).toLocaleString()}
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
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            </AnimatePresence>
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
                      placeholder="e.g. Suhas Gowda"
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

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-3 bg-brand-teal hover:bg-white text-brand-dark font-bold rounded-lg transition-colors text-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    Send Testimonial
                    <Send className="w-4 h-4" />
                  </button>
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
                setPaymentStep(false); 
                setOtpVerificationStep(false); 
                setUpiPendingStep(false); 
                setUpiVerified(false);
                setUpiVerifying(false);
                setIsPaymentVerified(false);
                setGeneratedWorkshopKey(null);
                setRegSuccessKey(null);
              }}
              className="absolute inset-0 bg-brand-dark/85 backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-brand-card border border-brand-teal/20 rounded-3xl p-5 sm:p-6 shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Glow filter */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-teal/5 blur-3xl rounded-full pointer-events-none" />

              {/* Sticky Top Header with Close Button */}
              <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-4 shrink-0 relative z-20">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-brand-teal" />
                  <span className="text-[10px] font-mono text-brand-teal uppercase tracking-widest font-bold">Session Pass Gateway</span>
                </div>
                <button
                  type="button"
                  onClick={() => { 
                    setShowRegModal(false); 
                    setPaymentStep(false); 
                    setOtpVerificationStep(false); 
                    setUpiPendingStep(false); 
                    setUpiVerified(false);
                    setUpiVerifying(false);
                    setIsPaymentVerified(false);
                    setGeneratedWorkshopKey(null);
                    setRegSuccessKey(null);
                  }}
                  className="p-1.5 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer relative z-20"
                  id="close-workshop-modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-brand-teal/20 scrollbar-track-transparent">
                {regSuccessKey ? (
                  // SUCCESS STATE
                  <div className="text-center py-4 font-sans">
                    <div className="w-14 h-14 bg-brand-teal/10 border border-brand-teal/25 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-teal">
                      <Sparkles className="w-7 h-7 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-display font-extrabold text-white mb-2">Registration Complete!</h3>
                    <p className="text-gray-400 text-xs font-light max-w-sm mx-auto mb-5 leading-relaxed">
                      Your attendance pass for <strong className="text-white font-semibold">{activeWorkshop.title}</strong> has been secured.
                    </p>

                    {/* WhatsApp Group Link Section */}
                    <div className="bg-brand-teal/5 border border-brand-teal/20 p-4 rounded-2xl flex flex-col items-center gap-3 text-center mb-5 max-w-sm mx-auto">
                      <div className="p-2 bg-[#25D366]/10 rounded-full text-[#25D366] border border-[#25D366]/20">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Join S-CODERS Announcements Group</h4>
                        <p className="text-gray-400 text-[10px] mt-1 leading-normal">
                          Click below to join the official read-only S-CODERS WhatsApp channel. The live Zoom meeting link, schedules, and code files will be shared there.
                        </p>
                      </div>
                      <a 
                        href="https://chat.whatsapp.com/dummy-scoders-group"
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => setWhatsappJoined(true)}
                        className="w-full py-2 bg-[#25D366] hover:bg-emerald-400 text-[#0c0d14] font-mono text-[11px] uppercase font-bold tracking-wider rounded-xl transition-all block text-center"
                      >
                        Join S-CODERS WhatsApp Channel
                      </a>
                    </div>

                    <div className="bg-brand-dark/95 border border-brand-teal/20 rounded-2xl p-4 mb-6 max-w-sm mx-auto text-center space-y-1 relative">
                      <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest block font-bold">Your Unique Attendance Key</span>
                      <span className="font-mono text-sm font-black text-brand-teal select-all block py-1.5 truncate">{regSuccessKey}</span>
                      <button
                        onClick={() => handleCopyKey(regSuccessKey)}
                        className="absolute right-2 top-2 p-1 bg-white/5 hover:bg-brand-teal/20 rounded text-gray-400 hover:text-brand-teal transition-all flex items-center gap-1 text-[9px] font-mono cursor-pointer border border-white/5"
                      >
                        {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedKey ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <button
                      onClick={() => { setShowRegModal(false); setPaymentStep(false); }}
                      className="w-full py-3 bg-brand-teal hover:bg-white text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Enter Classroom Workspace
                    </button>
                  </div>
                ) : otpVerificationStep ? (
                  // BANK OTP SECURITY STEP
                  <form onSubmit={handleVerifyOtpAndComplete} className="space-y-4 font-sans py-2">
                    <div className="text-center space-y-2 mb-4">
                      <div className="w-12 h-12 bg-brand-teal/10 border border-brand-teal/25 rounded-full flex items-center justify-center mx-auto text-brand-teal">
                        <Lock className="w-6 h-6 animate-pulse" />
                      </div>
                      <h4 className="text-base font-extrabold text-white">Bank Security Verification</h4>
                      <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto">
                        A secure 6-digit passcode has been transmitted by your card's issuing bank to your authenticated mobile number.
                      </p>
                    </div>

                    <div className="bg-brand-dark/40 border border-white/5 p-4 rounded-xl text-center text-xs space-y-1">
                      <p className="text-gray-400">Total Charged Amount:</p>
                      <p className="text-lg font-black text-brand-teal">₹{((activeWorkshop.price ?? 1499) * payTicketsCount).toLocaleString()}</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest text-center">Enter 6-Digit bank OTP code</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpValue}
                        onChange={(e) => {
                          setOtpValue(e.target.value.replace(/\D/g, ''));
                          setOtpError(null);
                        }}
                        placeholder="e.g. 123456"
                        className="w-full text-center tracking-widest text-lg font-mono bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all"
                      />
                      <p className="text-center text-[10px] text-brand-teal/70 font-mono mt-1">Hint: For simulation testing, type the secure code <strong className="text-white">123456</strong></p>
                    </div>

                    {otpError && (
                      <p className="text-red-400 text-xs text-center font-mono">{otpError}</p>
                    )}

                    <div className="flex gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => { setOtpVerificationStep(false); setPaymentStep(true); }}
                        className="w-1/3 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-mono uppercase font-bold transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={paymentSimulating}
                        className="flex-grow py-3 bg-brand-teal text-brand-dark hover:bg-white rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {paymentSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm Payment'}
                      </button>
                    </div>

                    <div className="text-center text-[10px] text-gray-500 font-mono mt-2">
                      Resend code in {otpCountdown > 0 ? `${otpCountdown}s` : <span className="text-brand-teal hover:underline cursor-pointer" onClick={() => { setOtpCountdown(60); setOtpValue(''); }}>Resend OTP</span>}
                    </div>
                  </form>
                ) : upiPendingStep ? (
                  // UPI PENDING CLEARANCE STEP
                  <div className="space-y-6 text-center py-4 font-sans">
                    <div className="w-16 h-16 bg-brand-teal/10 border border-brand-teal/30 rounded-full flex items-center justify-center mx-auto animate-pulse text-brand-teal">
                      <ShieldCheck className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono uppercase tracking-wider font-bold">
                        Awaiting Gateway Authorization
                      </span>
                      <h4 className="text-lg font-display font-black text-white">
                        Ruy Pay Secure Connection Active
                      </h4>
                      <p className="text-gray-400 text-xs max-w-md mx-auto leading-relaxed">
                        {selectedUpiApp === 'generic' 
                          ? 'Your default system UPI application has been invoked with the pre-filled parameters.'
                          : `Ruy Secure Link has launched the ${selectedUpiApp === 'phonepe' ? 'PhonePe' : selectedUpiApp === 'gpay' ? 'Google Pay' : selectedUpiApp === 'paytm' ? 'Paytm' : 'BHIM UPI'} application on your device.`
                        } Please authorize the payment of <strong className="text-brand-teal font-bold">₹{((activeWorkshop.price ?? 1499) * payTicketsCount).toLocaleString()}</strong> inside your app.
                      </p>
                    </div>

                    {/* Premium PhonePe Merchant Scanner Card (Matching User Image) */}
                    <div className="bg-white text-black p-5 rounded-[2rem] shadow-2xl border border-gray-100 max-w-xs w-full mx-auto relative overflow-hidden flex flex-col items-center my-2">
                      {/* Header: Bank of Baroda branding */}
                      <div className="flex items-center gap-3 w-full mb-4 border-b border-gray-100 pb-3 justify-center">
                        {/* Bank of Baroda Logo */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#fe5104] to-[#f37021] flex items-center justify-center shadow-md shrink-0">
                          <span className="text-white font-sans font-black text-[9px] tracking-tighter">BOB</span>
                        </div>
                        <div className="text-left">
                          <span className="text-[8px] font-mono text-gray-400 block uppercase font-bold tracking-wider leading-none">Settlement Bank</span>
                          <span className="text-xs font-sans font-bold text-gray-800">Bank Of Baroda - 2145</span>
                        </div>
                      </div>

                      {/* QR Code Container */}
                      <div className="relative p-1.5 bg-white rounded-2xl border border-gray-100 shadow-inner group">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                            `upi://pay?pa=scoders@ybl&pn=S-CODERS%20Technologies&am=${(activeWorkshop.price ?? 1499) * payTicketsCount}&cu=INR&tn=${encodeURIComponent(`S-CODERS Workshop: ${activeWorkshop.title}`)}`
                          )}`}
                          alt="UPI Payment QR Code"
                          className="w-40 h-40 object-contain"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* PhonePe logo in the absolute center of the QR code */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-9 h-9 rounded-full bg-[#5f259f] border-2 border-white flex items-center justify-center shadow-md">
                            <span className="text-white font-sans text-xs font-black tracking-tighter">पे</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer: View UPI details */}
                      <div className="mt-4 text-center">
                        <span className="text-[#5f259f] hover:text-[#4b1c7f] font-sans font-extrabold text-xs tracking-tight flex items-center gap-1 transition-colors cursor-pointer justify-center">
                          View UPI details
                        </span>
                        <span className="text-[8px] font-mono text-gray-400 block mt-1 uppercase tracking-widest font-bold">Merchant ID: scoders@ybl</span>
                      </div>
                    </div>

                    {/* Timer details */}
                    <div className="bg-brand-dark/40 border border-white/5 rounded-2xl p-4 max-w-xs mx-auto text-center space-y-1">
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">Checkout Session Timer</span>
                      <span className="font-mono text-2xl font-black text-brand-teal block">
                        {Math.floor(ruyTimer / 60)}:{(ruyTimer % 60).toString().padStart(2, '0')}
                      </span>
                      <span className="text-[9px] text-gray-400 block">Do not refresh or close this modal</span>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto pt-4">
                      {!upiVerified ? (
                        <>
                          {upiVerifying ? (
                            <div className="py-3 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center gap-2.5 text-xs font-mono text-amber-400">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Confirming transaction signature...</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSimulateUpiSuccess}
                              className="w-full py-4 bg-brand-teal text-brand-dark font-display font-black text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all shadow-lg shadow-brand-teal/10 cursor-pointer flex items-center justify-center gap-2"
                            >
                              Simulate Instant Ruy Pay Settle
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div className="py-2.5 px-3.5 bg-emerald-400/10 border border-emerald-400/20 rounded-2xl text-emerald-400 font-mono text-xs inline-flex items-center gap-2 mx-auto justify-center w-full">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                            <span>Payment Received & Verified!</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={handleVerifyUpiPaymentAndComplete}
                            disabled={paymentSimulating}
                            className="w-full py-4 bg-brand-teal text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-lg shadow-brand-teal/10"
                          >
                            {paymentSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify Payment & Mint Key'}
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setUpiPendingStep(false);
                          setPaymentStep(true);
                          setUpiVerified(false);
                          setUpiVerifying(false);
                        }}
                        className="w-full py-2 bg-transparent text-gray-500 hover:text-white font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        ← Choose different app / Cancel
                      </button>
                    </div>
                  </div>
                ) : paymentStep ? (
                  // PAYMENT STEP STATE
                  <div>
                    {/* Header bar matching Payments.tsx secure gateway */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-5 font-sans">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-brand-teal/10 border border-brand-teal/20 rounded-2xl text-brand-teal">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-brand-teal uppercase tracking-widest block font-bold leading-none">Ruy Pay Integrated Platform</span>
                          <h3 className="font-display font-black text-xl text-white mt-1">Workshop Booking Payment</h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 shrink-0 w-fit">
                        <Lock className="w-3.5 h-3.5 text-brand-teal" />
                        <span className="text-[10px] font-mono text-gray-400">SSL 256-Bit Encrypted</span>
                      </div>
                    </div>

                    {paymentSimulating ? (
                      <div className="text-center py-12 space-y-4 font-sans">
                        <RefreshCw className="w-10 h-10 text-brand-teal animate-spin mx-auto" />
                        <p className="text-white font-sans font-semibold text-sm">Locking Transaction Ledger...</p>
                        <p className="text-gray-400 text-xs max-w-xs mx-auto leading-relaxed">
                          Securing transaction blocks, creating permanent cryptographic record keys, and notifying attendee registry.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-5 font-sans">
                        {/* Selected Workshop details review */}
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-[11px] text-gray-300 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-mono">WORKSHOP:</span>
                            <span className="text-white font-bold text-right truncate max-w-[200px]">{activeWorkshop.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-mono">ATTENDEE:</span>
                            <span className="text-white font-bold">{regName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-mono">EMAIL ID:</span>
                            <span className="text-white font-mono truncate max-w-[150px]">{regEmail}</span>
                          </div>
                        </div>

                        {/* Number of Seats Ajuster & Pricing */}
                        <div className="bg-brand-dark/40 border border-white/5 p-4 rounded-2xl space-y-3.5">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="block text-xs font-bold text-white font-display">Number of Reserved Seats</span>
                              <span className="text-[9px] text-gray-400 font-sans block">Adjust seats for you or teammates</span>
                            </div>
                            <div className="flex items-center gap-3 bg-brand-dark border border-white/10 px-2.5 py-1.5 rounded-lg">
                              <button 
                                type="button" 
                                onClick={() => setPayTicketsCount(prev => Math.max(1, prev - 1))} 
                                className="p-1 text-gray-400 hover:text-white cursor-pointer transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-mono font-bold text-white text-xs min-w-[12px] text-center">{payTicketsCount}</span>
                              <button 
                                type="button" 
                                onClick={() => setPayTicketsCount(prev => prev + 1)} 
                                className="p-1 text-gray-400 hover:text-white cursor-pointer transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between border-t border-white/5 pt-3 text-[11px]">
                            <span className="text-gray-400 font-mono">Total Price Due:</span>
                            <span className="text-brand-teal font-black text-base">₹{((activeWorkshop.price ?? 1499) * payTicketsCount).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Payment Method Selector Grid - Matches Payments.tsx */}
                        <div className="grid grid-cols-4 bg-brand-dark/50 border border-white/5 rounded-xl overflow-hidden font-display font-bold">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('razorpay')}
                            className={`py-3 text-center border-r border-white/5 text-[10px] font-bold tracking-wider uppercase transition-all flex flex-col items-center gap-1 cursor-pointer ${
                              paymentMethod === 'razorpay'
                                ? 'bg-brand-card text-brand-teal shadow-inner'
                                : 'text-gray-500 hover:text-white'
                            }`}
                          >
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            Razorpay
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('upi')}
                            className={`py-3 text-center border-r border-white/5 text-[10px] font-bold tracking-wider uppercase transition-all flex flex-col items-center gap-1 cursor-pointer ${
                              paymentMethod === 'upi'
                                ? 'bg-brand-card text-brand-teal shadow-inner'
                                : 'text-gray-500 hover:text-white'
                            }`}
                          >
                            <Shield className="w-4 h-4" />
                            Ruy UPI
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('card')}
                            className={`py-3 text-center border-r border-white/5 text-[10px] font-bold tracking-wider uppercase transition-all flex flex-col items-center gap-1 cursor-pointer ${
                              paymentMethod === 'card'
                                ? 'bg-brand-card text-brand-teal shadow-inner'
                                : 'text-gray-500 hover:text-white'
                            }`}
                          >
                            <CreditCard className="w-4 h-4" />
                            Card
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('bank')}
                            className={`py-3 text-center text-[10px] font-bold tracking-wider uppercase transition-all flex flex-col items-center gap-1 cursor-pointer ${
                              paymentMethod === 'bank'
                                ? 'bg-brand-card text-brand-teal shadow-inner'
                                : 'text-gray-500 hover:text-white'
                            }`}
                          >
                            <Wallet className="w-4 h-4" />
                            NetBanking
                          </button>
                        </div>

                        {/* Method 0: Razorpay Fast Checkout */}
                        {paymentMethod === 'razorpay' && (
                          <div className="space-y-4">
                            <div className="bg-cyan-500/10 border border-cyan-500/30 p-4 rounded-xl text-center space-y-2">
                              <div className="flex items-center justify-center gap-2">
                                <span className="font-black text-cyan-400 text-sm">RAZORPAY</span>
                                <span className="text-white text-xs font-mono font-bold">Smart Gateway (scoders@ybl)</span>
                              </div>
                              <p className="text-[11px] text-gray-300">
                                Instant auto-verified pass keys & immediate ticket generation. Supports UPI QR, Cards, NetBanking, and Wallets.
                              </p>
                              <div className="text-[10px] font-mono text-cyan-300">
                                Merchant: <strong>scoders@ybl</strong> • Instant Dispatch from <strong>scoders82@gmail.com</strong>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={handleInitiateRazorpayWorkshop}
                              className="w-full py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                            >
                              <Sparkles className="w-4 h-4" />
                              Pay ₹{((activeWorkshop.price ?? 1499) * payTicketsCount).toLocaleString()} with Razorpay
                            </button>
                          </div>
                        )}

                        {/* Method A: UPI */}
                        {paymentMethod === 'upi' && (
                          <div className="space-y-4">
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest text-center">Select active Ruy Secured UPI application</p>
                            
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'phonepe', name: 'PhonePe' },
                                { id: 'gpay', name: 'Google Pay' },
                                { id: 'paytm', name: 'Paytm' },
                                { id: 'bhim', name: 'BHIM UPI' }
                              ].map((app) => (
                                <button
                                  type="button"
                                  key={app.id}
                                  onClick={() => handleInitiateUpiPayment(app.id as any)}
                                  className="py-3 px-2 bg-white/5 hover:bg-brand-teal/20 hover:border-brand-teal/40 border border-white/5 rounded-xl text-xs font-mono uppercase font-bold text-gray-300 hover:text-white transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
                                >
                                  {app.name}
                                </button>
                              ))}
                            </div>

                            {/* Divider with QR/Address */}
                            <div className="flex items-center gap-3 py-1">
                              <div className="h-px bg-white/5 flex-grow" />
                              <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">or scan & verify UTR</span>
                              <div className="h-px bg-white/5 flex-grow" />
                            </div>

                            {/* Small quick layout BOB Card */}
                            <div className="bg-white text-black p-4 rounded-2xl border border-gray-100 max-w-[240px] w-full mx-auto relative overflow-hidden flex flex-col items-center shadow-lg">
                              <div className="flex items-center gap-2 w-full mb-2 border-b border-gray-100 pb-2 justify-center">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#fe5104] to-[#f37021] flex items-center justify-center shrink-0">
                                  <span className="text-white font-sans font-black text-[6px]">BOB</span>
                                </div>
                                <span className="text-[9px] font-sans font-extrabold text-gray-800">Bank Of Baroda QR</span>
                              </div>
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                                  `upi://pay?pa=scoders@ybl&pn=S-CODERS%20Technologies&am=${(activeWorkshop.price ?? 1499) * payTicketsCount}&cu=INR&tn=${encodeURIComponent(`S-CODERS Workshop: ${activeWorkshop.title}`)}`
                                )}`}
                                alt="UPI Payment QR Code"
                                className="w-28 h-28 object-contain"
                                referrerPolicy="no-referrer"
                              />
                              <span className="text-[7px] font-mono text-gray-400 mt-1 uppercase tracking-wider block">Merchant: scoders@ybl</span>
                            </div>

                            {/* UPI ID Details manual copy */}
                            <div className="bg-brand-dark/50 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                              <div className="text-left">
                                <span className="text-[9px] font-mono text-gray-500 block uppercase">RUY VIRTUAL PAYMENT ADDRESS</span>
                                <span className="text-xs font-mono font-bold text-white block">scoders@ybl</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy('scoders@ybl', 'upi')}
                                className="p-2 bg-white/5 border border-white/10 hover:border-brand-teal text-gray-400 hover:text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                {copiedField === 'upi' ? (
                                  <Check className="w-3.5 h-3.5 text-brand-teal" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {/* Direct UTR Confirmation form */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2.5 text-left">
                              <label className="block text-[9px] font-mono text-gray-400 uppercase tracking-widest font-bold">
                                Enter 12-Digit UPI Ref / UTR No:
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  maxLength={16}
                                  value={upiUtrInput}
                                  onChange={(e) => setUpiUtrInput(e.target.value)}
                                  placeholder="e.g. 423987112233"
                                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDirectUpiWorkshopSubmit()}
                                  disabled={isVerifyingUtr}
                                  className="px-4 py-2 bg-brand-teal text-brand-dark font-display text-xs font-bold rounded-lg hover:bg-white transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
                                >
                                  {isVerifyingUtr ? (
                                    <div className="w-3.5 h-3.5 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <>Verify & Unlock <ArrowRight className="w-3.5 h-3.5" /></>
                                  )}
                                </button>
                              </div>
                              {upiUtrError && (
                                <p className="text-[10px] text-red-400 font-mono">{upiUtrError}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Method B: Interactive Card Form */}
                        {paymentMethod === 'card' && (
                          <form onSubmit={handleInitiateCardPayment} className="space-y-4">
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1 font-bold">Card Number</label>
                                <input
                                  type="text"
                                  required
                                  value={cardNo}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                                    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
                                    setCardNo(formatted);
                                  }}
                                  placeholder="4111 2222 3333 4444"
                                  className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all font-mono"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1 font-bold">Expiry Date</label>
                                  <input
                                    type="text"
                                    required
                                    value={cardExpiry}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, '').substring(0, 4);
                                      if (val.length >= 2) {
                                        setCardExpiry(`${val.substring(0, 2)}/${val.substring(2, 4)}`);
                                      } else {
                                        setCardExpiry(val);
                                      }
                                    }}
                                    placeholder="MM/YY"
                                    className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1 font-bold">CVV</label>
                                  <input
                                    type="password"
                                    required
                                    maxLength={3}
                                    value={cardCvv}
                                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                    placeholder="123"
                                    className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all font-mono"
                                  />
                                </div>
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="w-full py-3.5 bg-brand-teal text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              Pay ₹{((activeWorkshop.price ?? 1499) * payTicketsCount).toLocaleString()} Securely
                            </button>
                          </form>
                        )}

                        {/* Method C: Ruy NetBanking wire / transfer - Matches Payments.tsx */}
                        {paymentMethod === 'bank' && (
                          <form onSubmit={handleInitiateBankPayment} className="space-y-4">
                            <div className="text-center max-w-md mx-auto space-y-1">
                              <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">Direct NEFT / IMPS Bank Transfer</h4>
                              <p className="text-gray-500 text-[10px]">
                                Settle tickets balance via corporate wire. Then, upload or simulate receipt scan to secure pass key instantly.
                              </p>
                            </div>

                            {/* Bank details grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-brand-dark/50 border border-white/5 p-3 rounded-xl flex flex-col justify-between">
                                <div>
                                  <span className="text-[7px] font-mono text-gray-500 block uppercase">BANK NAME</span>
                                  <span className="text-[10px] font-display font-bold text-white block mt-0.5">HDFC Bank Ltd</span>
                                </div>
                                <div className="flex justify-between items-center mt-2.5">
                                  <span className="text-[7px] font-mono text-gray-500 block">BRANCH</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy('HDFC Bank, Bengaluru', 'branch')}
                                    className="p-1 text-gray-500 hover:text-white transition-colors cursor-pointer"
                                  >
                                    {copiedField === 'branch' ? <Check className="w-3 h-3 text-brand-teal" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>

                              <div className="bg-brand-dark/50 border border-white/5 p-3 rounded-xl flex flex-col justify-between">
                                <div>
                                  <span className="text-[7px] font-mono text-gray-500 block uppercase">ACCOUNT NO</span>
                                  <span className="text-[10px] font-mono font-bold text-white block mt-0.5">50200088994433</span>
                                </div>
                                <div className="flex justify-between items-center mt-2.5">
                                  <div>
                                    <span className="text-[7px] font-mono text-gray-500 block uppercase">IFSC CODE</span>
                                    <span className="text-[9px] font-mono text-brand-teal block">HDFC0000104</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy('50200088994433', 'acc')}
                                    className="p-1 text-gray-500 hover:text-white transition-colors cursor-pointer"
                                  >
                                    {copiedField === 'acc' ? <Check className="w-3 h-3 text-brand-teal" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Receipt upload box simulator */}
                            <div className="border border-dashed border-white/10 rounded-xl p-5 text-center bg-brand-dark/20 space-y-3">
                              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-400">
                                <Upload className="w-4 h-4" />
                              </div>
                              
                              {receiptFile ? (
                                <div>
                                  <span className="text-xs font-mono text-brand-teal block font-semibold truncate max-w-[200px] mx-auto">{receiptName}</span>
                                  <span className="text-[9px] text-gray-500 block mt-1">Receipt scanned and uploaded successfully.</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReceiptFile(null);
                                      setReceiptName('');
                                    }}
                                    className="text-[9px] text-brand-coral font-mono hover:underline mt-1.5 cursor-pointer"
                                  >
                                    Remove file
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-[11px] text-gray-400 font-sans leading-normal">
                                    Drag your wire transfer receipt, or{' '}
                                    <button
                                      type="button"
                                      onClick={handleReceiptMockUpload}
                                      className="text-brand-teal font-medium hover:underline cursor-pointer"
                                    >
                                      click to browse simulator
                                    </button>
                                  </p>
                                  <span className="text-[8px] text-gray-600 block mt-0.5 font-mono">Supports PNG, JPG, PDF up to 5MB</span>
                                </div>
                              )}
                            </div>

                            <button
                              type="submit"
                              disabled={!receiptFile}
                              className="w-full py-3.5 bg-brand-teal text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                            >
                              Verify Wire Logs & Complete pass key
                            </button>
                          </form>
                        )}

                        <button
                          type="button"
                          onClick={() => setPaymentStep(false)}
                          className="w-full text-center text-[10px] font-mono text-gray-500 hover:text-white transition-colors py-1.5 uppercase tracking-wider block cursor-pointer"
                        >
                          ← Back to registration details
                        </button>
                      </div>
                    )}
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
                    <div className="grid grid-cols-2 bg-brand-dark/50 p-1 rounded-xl mb-5 border border-white/5">
                      <button
                        onClick={() => { setRegMode('register'); setManualKeyError(null); }}
                        className={`py-1.5 text-[11px] font-mono rounded-lg transition-all uppercase cursor-pointer ${
                          regMode === 'register' ? 'bg-brand-teal text-brand-dark font-bold shadow' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Register New Pass
                      </button>
                      <button
                        onClick={() => { setRegMode('enterKey'); setManualKeyError(null); }}
                        className={`py-1.5 text-[11px] font-mono rounded-lg transition-all uppercase cursor-pointer ${
                          regMode === 'enterKey' ? 'bg-brand-teal text-brand-dark font-bold shadow' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Enter Existing Pass
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

                        {currentUser && (
                          <div className="bg-brand-teal/5 border border-brand-teal/20 rounded-xl p-2.5 text-[10px] text-brand-teal flex items-center gap-2 mb-1 font-mono">
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>Pre-authenticating from active user session.</span>
                          </div>
                        )}

                        <div>
                          <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Full Name *</label>
                          <input
                            type="text"
                            required
                            disabled={!!currentUser}
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="e.g. Suhas Gowda"
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all disabled:opacity-60"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Email Address *</label>
                          <input
                            type="email"
                            required
                            disabled={!!currentUser}
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="e.g. student@college.edu"
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all disabled:opacity-60"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Your Technical Role / College (or Workplace) *</label>
                          <input
                            type="text"
                            required
                            value={regRole}
                            onChange={(e) => setRegRole(e.target.value)}
                            placeholder="e.g. Student, PESU / SDE-1, Swiggy"
                            className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-all"
                          />
                        </div>

                        <div className="pt-1">
                          <button
                            type="submit"
                            className="w-full py-3.5 bg-brand-teal text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4 fill-current animate-pulse" />
                            Proceed to Pay ₹{((activeWorkshop.price ?? 1499) * payTicketsCount).toLocaleString()} Securely
                          </button>
                        </div>
                      </form>
                    ) : isPaymentVerified ? (
                      <div className="space-y-4 font-sans py-2">
                        {!generatedWorkshopKey ? (
                          <div className="text-center py-4 space-y-4">
                            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                              <Check className="w-7 h-7" />
                            </div>
                            <div>
                              <h3 className="text-base font-extrabold text-white">Payment Verified Successfully!</h3>
                              <p className="text-gray-400 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                                Your payment is fully cleared. Click below to enter this option and mint your unique, personalized Workshop Access Key.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleGenerateUniqueKey}
                              className="w-full py-3.5 bg-brand-teal text-brand-dark font-display font-black text-xs uppercase tracking-wider rounded-xl hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-teal/20"
                            >
                              <Sparkles className="w-4 h-4 fill-current animate-pulse" />
                              Generate Unique Workshop Access Key
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-5">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-brand-teal/10 border border-brand-teal/25 rounded-full flex items-center justify-center mx-auto mb-2 text-brand-teal">
                                <Sparkles className="w-6 h-6 animate-pulse" />
                              </div>
                              <h3 className="text-base font-extrabold text-white">Access Key Minted!</h3>
                              <p className="text-gray-400 text-[11px] mt-0.5">
                                Every participant receives a different, unique crypt-signed access key.
                              </p>
                            </div>

                            {/* Generated Key Card */}
                            <div className="bg-brand-dark/90 border border-brand-teal/20 rounded-2xl p-4 text-center space-y-1 relative">
                              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest block font-bold">Your Unique Attendance Key</span>
                              <span className="font-mono text-xs font-black text-brand-teal select-all block py-1 truncate">{generatedWorkshopKey}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyKey(generatedWorkshopKey)}
                                className="absolute right-2 top-2 p-1.5 bg-white/5 hover:bg-brand-teal/20 rounded text-gray-400 hover:text-brand-teal transition-all flex items-center gap-1 text-[9px] font-mono cursor-pointer border border-white/5"
                              >
                                {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copiedKey ? 'Copied' : 'Copy'}
                              </button>
                            </div>

                            {/* WhatsApp Group Box */}
                            <div className="bg-[#25D366]/5 border border-[#25D366]/20 p-4 rounded-2xl space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#25D366]/10 rounded-xl text-[#25D366] border border-[#25D366]/20 shrink-0">
                                  <Users className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-white">Official WhatsApp Announcement Group</h4>
                                  <p className="text-gray-400 text-[10px] mt-0.5 leading-normal">
                                    Join our read-only channel to receive Zoom schedules and resources.
                                  </p>
                                </div>
                              </div>

                              {/* Alert details for Group settings */}
                              <div className="bg-brand-dark/40 border border-white/5 p-2.5 rounded-xl text-[9px] font-mono text-gray-400 leading-normal">
                                <span className="text-amber-400 font-bold">📢 Group Policy:</span> This group is configured as <strong>announcement-only (Admins Only can post)</strong>. Participants can join and view updates, but cannot write messages. This ensures zero spam.
                              </div>

                              <a 
                                href="https://chat.whatsapp.com/dummy-scoders-group"
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={() => setWhatsappJoined(true)}
                                className="w-full py-2.5 bg-[#25D366] hover:bg-emerald-400 text-[#0c0d14] font-mono text-xs uppercase font-extrabold tracking-wider rounded-xl transition-all block text-center cursor-pointer shadow-md shadow-[#25D366]/10"
                              >
                                Join S-CODERS WhatsApp Channel
                              </a>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setShowRegModal(false);
                                setPaymentStep(false);
                                setIsPaymentVerified(false);
                                setGeneratedWorkshopKey(null);
                              }}
                              className="w-full py-3 bg-brand-teal hover:bg-white text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center block"
                            >
                              Enter Classroom Workspace
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleVerifyManualKey} className="space-y-3.5 font-sans">
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

                        <div className="pt-1">
                          <button
                            type="submit"
                            className="w-full py-3 bg-brand-teal text-brand-dark font-display font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5" />
                            Verify & Unlock Session
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
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
          onClose={() => {
            setShowRazorpayModal(false);
            setPaymentSimulating(false);
          }}
          onFailure={(reason) => {
            setShowRazorpayModal(false);
            setPaymentSimulating(false);
            setOtpError(reason || 'Payment incomplete or cancelled. No workshop pass was issued.');
          }}
          onSuccess={handleRazorpayWorkshopSuccess}
          orderData={razorpayOrderData}
          paymentDetails={razorpayPaymentDetails}
        />
      )}
    </section>
  );
}
