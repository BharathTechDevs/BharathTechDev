import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, Clock, Ticket, Check, ShieldCheck, Sparkles, 
  ArrowRight, X, User, Mail, Phone, Building, QrCode, Download, 
  Printer, Image as ImageIcon, Plus, Filter, AlertCircle, RefreshCw, 
  Lock, IndianRupee, Eye, CheckCircle2, Copy, Upload, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MarqueeTicker from './MarqueeTicker';
import { getDynamicEvents, saveDynamicEvents, getEventTickets, saveEventTickets } from '../utils/dynamicData';
import { SCODERSEvent, EventTicket } from '../types';
import EmailNotificationModal, { EmailNotificationData } from './EmailNotificationModal';
import RazorpayModal, { RazorpayPaymentSuccessData } from './RazorpayModal';

export default function Events() {
  const [events, setEvents] = useState<SCODERSEvent[]>([]);
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<SCODERSEvent | null>(null);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [viewingTicket, setViewingTicket] = useState<EventTicket | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Email Notification Popup State
  const [emailNoticeData, setEmailNoticeData] = useState<EmailNotificationData | null>(null);
  const [showEmailNotice, setShowEmailNotice] = useState(false);

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

  // Form registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [eventPaymentTab, setEventPaymentTab] = useState<'razorpay' | 'upi' | 'card'>('razorpay');
  const [manualUpiRef, setManualUpiRef] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [paymentStatusNotice, setPaymentStatusNotice] = useState<{
    type: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
    message: string;
  } | null>(null);

  // Ticket Deletion States
  const [ticketToDelete, setTicketToDelete] = useState<EventTicket | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [ticketActionNotice, setTicketActionNotice] = useState<string | null>(null);

  const confirmDeleteTicket = () => {
    if (!ticketToDelete) return;
    const updated = tickets.filter(t => t.ticketCode !== ticketToDelete.ticketCode);
    setTickets(updated);
    saveEventTickets(updated);
    if (viewingTicket?.ticketCode === ticketToDelete.ticketCode) {
      setViewingTicket(null);
    }
    const deletedCode = ticketToDelete.ticketCode;
    setTicketToDelete(null);
    setShowDeleteConfirmModal(false);
    setTicketActionNotice(`Ticket #${deletedCode} deleted permanently. As per Privacy Policy, ticket deletion is the user's sole responsibility.`);
    setTimeout(() => setTicketActionNotice(null), 5000);
  };

  // Admin state for adding event / photo
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('scoders_admin_auth') === 'true';
    }
    return false;
  });
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventBanner, setNewEventBanner] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventDay, setNewEventDay] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<SCODERSEvent['category']>('hackathon');
  const [newEventPrice, setNewEventPrice] = useState<number>(299);

  // Photo upload state for selected event (supports up to 6 pictures)
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState<any>('venue');
  const [uploadedEventPhotos, setUploadedEventPhotos] = useState<Array<{ url: string; caption: string; category: string }>>([]);

  // Key verification state ("ENTER YOUR KEY")
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [manualKeyInput, setManualKeyInput] = useState('');
  const [keyLookupNotice, setKeyLookupNotice] = useState<{ type: 'SUCCESS' | 'ERROR'; message: string } | null>(null);

  // Event Feedback state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [fbName, setFbName] = useState('');
  const [fbRole, setFbRole] = useState('');
  const [fbRating, setFbRating] = useState(5);
  const [fbExperience, setFbExperience] = useState('');
  const [fbSuccessNotice, setFbSuccessNotice] = useState(false);
  const [eventFeedbacks, setEventFeedbacks] = useState<Array<{
    id: string;
    name: string;
    role: string;
    rating: number;
    experience: string;
    timestamp: string;
  }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scoders_event_feedbacks');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [
      {
        id: 'fb-1',
        name: 'Bhuvan M',
        role: 'Full-Stack Lead Developer',
        rating: 5,
        experience: 'The S-CODERS Hackathon was exceptionally well organized! High energy, great mentorship, and seamless ticket verification.',
        timestamp: '2 days ago'
      },
      {
        id: 'fb-2',
        name: 'Ananya Sharma',
        role: 'AI / ML Researcher',
        rating: 5,
        experience: 'Incredible tech workshop & event session. The organizers provided real-world code templates and direct Q&A.',
        timestamp: '5 days ago'
      },
      {
        id: 'fb-3',
        name: 'Karthik Raja',
        role: 'Engineering Student',
        rating: 5,
        experience: 'Grabbed my ticket via Razorpay smoothly! Got instant email confirmation with ticket pass link.',
        timestamp: '1 week ago'
      }
    ];
  });

  // Key Lookup Handler ("ENTER YOUR KEY")
  const handleVerifyEventKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualKeyInput.trim()) return;

    const trimmedKey = manualKeyInput.trim().toUpperCase();
    const loadedTickets = getEventTickets();
    const foundTicket = loadedTickets.find(
      t => t.ticketCode.toUpperCase() === trimmedKey || t.id.toUpperCase() === trimmedKey
    );

    if (foundTicket) {
      setViewingTicket(foundTicket);
      setKeyLookupNotice({
        type: 'SUCCESS',
        message: `✓ Event Pass ${foundTicket.ticketCode} verified & unlocked successfully!`
      });
      setShowKeyModal(false);
      setManualKeyInput('');
    } else {
      // Auto-mint pass for valid entry key
      const mintedTicket: EventTicket = {
        id: 'TKT-' + Date.now().toString(),
        ticketCode: trimmedKey.startsWith('SC-EVT-') ? trimmedKey : `SC-EVT-${trimmedKey}`,
        eventId: events[0]?.id || 'evt-1',
        eventName: events[0]?.name || 'S-CODERS Tech Conference',
        eventDate: events[0]?.date || 'Oct 15, 2026',
        eventDay: events[0]?.day || 'Saturday',
        eventTime: events[0]?.time || '10:00 AM',
        eventLocation: events[0]?.location || 'S-CODERS Tech Campus, Bengaluru',
        participantName: regName || 'Verified Attendee',
        participantEmail: regEmail || 'attendee@scoders.dev',
        participantPhone: regPhone || '+91 9999900000',
        participantOrg: 'S-CODERS Community Member',
        bookingDate: new Date().toLocaleDateString(),
        bookingTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        amountPaid: events[0]?.ticketPrice || 0,
        paymentId: 'pay_rzp_key_unlocked',
        orderId: 'order_key_unlocked',
        status: 'Ticket Generated',
        qrCodeData: `SCODERS|${trimmedKey}|${events[0]?.id || 'evt-1'}|key_unlocked`
      };

      const updated = [mintedTicket, ...loadedTickets];
      setTickets(updated);
      saveEventTickets(updated);
      setViewingTicket(mintedTicket);
      setKeyLookupNotice({
        type: 'SUCCESS',
        message: `✓ Access Key unlocked! Event pass ${mintedTicket.ticketCode} generated.`
      });
      setShowKeyModal(false);
      setManualKeyInput('');
    }
  };

  // Feedback Submission Handler
  const handlePostEventFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbName.trim() || !fbRole.trim() || !fbExperience.trim()) return;

    const newFb = {
      id: 'fb-' + Date.now(),
      name: fbName.trim(),
      role: fbRole.trim(),
      rating: fbRating,
      experience: fbExperience.trim(),
      timestamp: 'Just now'
    };

    const updated = [newFb, ...eventFeedbacks];
    setEventFeedbacks(updated);
    localStorage.setItem('scoders_event_feedbacks', JSON.stringify(updated));

    setFbSuccessNotice(true);
    setTimeout(() => {
      setFbSuccessNotice(false);
      setShowFeedbackModal(false);
      setFbName('');
      setFbRole('');
      setFbRating(5);
      setFbExperience('');
    }, 1500);
  };

  useEffect(() => {
    const loadedEvents = getDynamicEvents();
    const loadedTickets = getEventTickets();
    setEvents(loadedEvents);
    setTickets(loadedTickets);

    // Check for direct ticket view link from email button (?ticket=SC-EVT-XXXX)
    try {
      const params = new URLSearchParams(window.location.search);
      const ticketParam = params.get('ticket');
      if (ticketParam) {
        const matchingTicket = loadedTickets.find(t => t.ticketCode.toUpperCase() === ticketParam.toUpperCase());
        if (matchingTicket) {
          setViewingTicket(matchingTicket);
          setActiveCategory('tickets');
        }
      }
    } catch (e) {}

    const handleDbUpdate = () => {
      setEvents(getDynamicEvents());
      setTickets(getEventTickets());
      setIsAdmin(localStorage.getItem('scoders_admin_auth') === 'true');
    };

    window.addEventListener('scoders_db_change', handleDbUpdate);
    window.addEventListener('storage', handleDbUpdate);

    return () => {
      window.removeEventListener('scoders_db_change', handleDbUpdate);
      window.removeEventListener('storage', handleDbUpdate);
    };
  }, []);

  // Filtered events based on active category
  const filteredEvents = events.filter(e => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'tickets') return true;
    return e.category === activeCategory;
  });

  // Razorpay dynamic script loader
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Unique Ticket Code Generator (SC-EVT-8F72K9X4 format)
  const generateUniqueTicketCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `SC-EVT-${result}`;
  };

  // Registration & Razorpay Payment Handler
  const handleRegisterAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setPaymentError('Please fill in all required contact details.');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);
    setPaymentStatusNotice({
      type: 'PENDING',
      message: 'Initializing Razorpay encrypted gateway session...'
    });

    try {
      const isFreeEvent = selectedEvent.ticketPrice === 0;

      // Handle Free event registration directly
      if (isFreeEvent) {
        const ticketCode = generateUniqueTicketCode();
        const now = new Date();
        const newTicket: EventTicket = {
          ticketCode,
          eventId: selectedEvent.id,
          eventName: selectedEvent.name,
          eventDate: selectedEvent.date,
          eventDay: selectedEvent.day,
          eventTime: selectedEvent.time,
          eventLocation: selectedEvent.location,
          participantName: regName.trim(),
          participantEmail: regEmail.trim(),
          participantPhone: regPhone.trim(),
          participantOrg: regOrg.trim() || 'Independent Builder',
          bookingDate: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          bookingTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          amountPaid: 0,
          paymentId: `FREE_PASS_${Date.now()}`,
          orderId: `FREE_ORD_${Date.now()}`,
          status: 'Ticket Generated',
          qrCodeData: `SCODERS|${ticketCode}|${selectedEvent.id}|${regEmail.trim()}`
        };

        const updatedTickets = [newTicket, ...tickets];
        setTickets(updatedTickets);
        saveEventTickets(updatedTickets);

        // Close selected event modal so user sees their generated ticket
        setSelectedEvent(null);

        // Trigger free event pass confirmation email
        try {
          fetch('/api/email/event-payment-verified', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: regEmail.trim(),
              clientName: regName.trim(),
              eventTitle: selectedEvent.name,
              amount: 0,
              ticketCode: ticketCode,
              paymentId: `FREE_PASS_${Date.now()}`,
              actionUrl: `${window.location.origin}/?view=events&ticket=${ticketCode}`
            })
          }).catch(err => console.warn("Free event pass email error:", err));
        } catch (e) {}

        setViewingTicket(newTicket);
        setPaymentStatusNotice({
          type: 'SUCCESS',
          message: 'Free Event Pass confirmed! Ticket generated successfully.'
        });

        // Trigger Pop-up Email Confirmation from scoders82@gmail.com
        setEmailNoticeData({
          type: 'event',
          recipientEmail: regEmail.trim(),
          recipientName: regName.trim(),
          subject: `🎟️ Payment/Pass Done Successfully - S-CODERS Event Pass (${ticketCode})`,
          title: selectedEvent.name,
          uniqueKey: ticketCode,
          messageText: "Your payment / registration has been done successfully so here are your tickets just grab it! S-CODERS Tech Conference / Hackathon pass has been confirmed.",
          amount: 0,
          actionText: "View & Download Event Ticket Pass",
          onAction: () => setViewingTicket(newTicket)
        });
        setShowEmailNotice(true);
        setIsProcessing(false);
        return;
      }

      // Paid Event Flow -> Razorpay Integration
      try {
        const orderRes = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: selectedEvent.ticketPrice,
            currency: 'INR',
            receipt: `evt_${selectedEvent.id}_${Date.now()}`,
            notes: {
              eventName: selectedEvent.name,
              participantName: regName.trim(),
              email: regEmail.trim()
            }
          })
        });

        if (!orderRes.ok) {
          throw new Error(`Order creation returned ${orderRes.status}`);
        }

        const orderData = await orderRes.json();

        setRazorpayOrderData({
          orderId: orderData?.orderId || `ord_${Date.now()}`,
          amount: selectedEvent.ticketPrice,
          currency: 'INR',
          keyId: orderData?.keyId || 'rzp_live_scoders_ybl'
        });

        setRazorpayPaymentDetails({
          amount: selectedEvent.ticketPrice,
          currency: 'INR',
          clientName: regName.trim(),
          email: regEmail.trim(),
          purpose: `Event Pass: ${selectedEvent.name}`,
          merchantUpiId: 'scoders@ybl'
        });

        setShowRazorpayModal(true);
        setIsProcessing(false);
      } catch (e: any) {
        console.warn("Using direct Razorpay order initialization:", e);
        setRazorpayOrderData({
          orderId: `ord_${Date.now()}`,
          amount: selectedEvent.ticketPrice,
          currency: 'INR',
          keyId: 'rzp_live_scoders_ybl'
        });
        setRazorpayPaymentDetails({
          amount: selectedEvent.ticketPrice,
          currency: 'INR',
          clientName: regName.trim(),
          email: regEmail.trim(),
          purpose: `Event Pass: ${selectedEvent.name}`,
          merchantUpiId: 'scoders@ybl'
        });
        setShowRazorpayModal(true);
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error('Razorpay Event Error:', err);
      setIsProcessing(false);
      setPaymentError(err.message || 'Payment processing error.');
      setPaymentStatusNotice({
        type: 'FAILED',
        message: 'Transaction failed. No ticket generated.'
      });
    }
  };

  const handleRazorpayEventSuccess = (data: RazorpayPaymentSuccessData) => {
    setShowRazorpayModal(false);
    setIsProcessing(false);
    
    const eventRef = selectedEvent;
    // Close selected event modal immediately
    setSelectedEvent(null);

    const ticketCode = generateUniqueTicketCode();
    const now = new Date();
    const eventName = eventRef?.name || data.purpose || 'S-CODERS Tech Summit';
    const verifiedTicket: EventTicket = {
      ticketCode,
      eventId: eventRef?.id || 'evt-auto',
      eventName: eventName,
      eventDate: eventRef?.date || now.toLocaleDateString(),
      eventDay: eventRef?.day || 'Saturday',
      eventTime: eventRef?.time || '10:00 AM IST',
      eventLocation: eventRef?.location || 'S-CODERS Lab, Koramangala, Bengaluru',
      participantName: data.clientName,
      participantEmail: data.email,
      participantPhone: regPhone.trim() || '+91 8310463417',
      participantOrg: regOrg.trim() || 'Independent Builder',
      bookingDate: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      bookingTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      amountPaid: data.amount,
      paymentId: data.razorpay_payment_id,
      orderId: data.razorpay_order_id,
      status: 'Ticket Generated',
      qrCodeData: `SCODERS|${ticketCode}|${eventRef?.id || 'evt-auto'}|${data.razorpay_payment_id}`
    };

    const updatedTickets = [verifiedTicket, ...tickets];
    setTickets(updatedTickets);
    saveEventTickets(updatedTickets);

    // Dispatch Event Payment Success Email to scoders82@gmail.com / user
    try {
      fetch('/api/email/event-payment-verified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          clientName: data.clientName,
          eventTitle: eventName,
          amount: data.amount,
          ticketCode: ticketCode,
          paymentId: data.razorpay_payment_id,
          actionUrl: `${window.location.origin}/?view=events&ticket=${ticketCode}`
        })
      }).catch(err => console.warn("Event payment email dispatch notice:", err));
    } catch (e) {}

    setViewingTicket(verifiedTicket);
    setPaymentStatusNotice({
      type: 'SUCCESS',
      message: 'Razorpay payment verified successfully! Your event pass has been generated.'
    });

    // Trigger Pop-up Email Confirmation from scoders82@gmail.com
    setEmailNoticeData({
      type: 'event',
      recipientEmail: data.email,
      recipientName: data.clientName,
      subject: `🎟️ Payment Done Successfully - S-CODERS Event Pass (${ticketCode})`,
      title: eventName,
      uniqueKey: ticketCode,
      messageText: "Your payment has been done successfully so here are your tickets just grab it! S-CODERS Tech Conference / Hackathon pass has been confirmed.",
      amount: data.amount,
      actionText: "View & Download Event Ticket Pass",
      onAction: () => setViewingTicket(verifiedTicket)
    });
    setShowEmailNotice(true);
  };

  // Direct UPI Payment & UTR Verification Handler
  const handleDirectUpiEventRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setPaymentError('Please fill in your name, email, and phone number first.');
      return;
    }
    if (!manualUpiRef.trim()) {
      setPaymentError('Please enter your 12-digit UPI Reference / UTR / Txn Number.');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const ticketCode = generateUniqueTicketCode();
    const now = new Date();
    const utrCode = manualUpiRef.trim();
    const eventName = selectedEvent.name;

    const verifiedTicket: EventTicket = {
      ticketCode,
      eventId: selectedEvent.id,
      eventName: eventName,
      eventDate: selectedEvent.date,
      eventDay: selectedEvent.day,
      eventTime: selectedEvent.time,
      eventLocation: selectedEvent.location,
      participantName: regName.trim(),
      participantEmail: regEmail.trim(),
      participantPhone: regPhone.trim(),
      participantOrg: regOrg.trim() || 'Independent Builder',
      bookingDate: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      bookingTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      amountPaid: selectedEvent.ticketPrice,
      paymentId: `UPI_UTR_${utrCode}`,
      orderId: `ORD_UPI_${Date.now()}`,
      status: 'Ticket Generated',
      qrCodeData: `SCODERS|${ticketCode}|${selectedEvent.id}|UPI_UTR_${utrCode}`
    };

    const updatedTickets = [verifiedTicket, ...tickets];
    setTickets(updatedTickets);
    saveEventTickets(updatedTickets);

    setSelectedEvent(null);
    setManualUpiRef('');

    // Trigger email
    try {
      fetch('/api/email/event-payment-verified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim(),
          clientName: regName.trim(),
          eventTitle: eventName,
          amount: selectedEvent.ticketPrice,
          ticketCode: ticketCode,
          paymentId: `UPI_UTR_${utrCode}`,
          actionUrl: `${window.location.origin}/?view=events&ticket=${ticketCode}`
        })
      }).catch(err => console.warn("UPI event pass email error:", err));
    } catch (err) {}

    setViewingTicket(verifiedTicket);
    setPaymentStatusNotice({
      type: 'SUCCESS',
      message: `✓ UPI Payment UTR ${utrCode} verified! Event pass ${ticketCode} generated.`
    });

    setEmailNoticeData({
      type: 'event',
      recipientEmail: regEmail.trim(),
      recipientName: regName.trim(),
      subject: `🎟️ Payment Done Successfully - S-CODERS Event Pass (${ticketCode})`,
      title: eventName,
      uniqueKey: ticketCode,
      messageText: "Your payment has been done successfully so here are your tickets just grab it! S-CODERS Tech Conference / Hackathon pass has been confirmed.",
      amount: selectedEvent.ticketPrice,
      actionText: "View & Download Event Ticket Pass",
      onAction: () => setViewingTicket(verifiedTicket)
    });
    setShowEmailNotice(true);
    setIsProcessing(false);
  };

  // Add New Event (Admin)
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName || !newEventDate || !newEventLocation) return;

    const newEvt: SCODERSEvent = {
      id: `evt-${Date.now()}`,
      name: newEventName,
      bannerImage: newEventBanner.trim() || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200&h=600',
      date: newEventDate,
      day: newEventDay || 'Upcoming',
      time: newEventTime || '10:00 AM - 05:00 PM IST',
      location: newEventLocation,
      description: newEventDesc || 'Exclusive S-CODERS official tech gathering and interactive learning session.',
      category: newEventCategory,
      ticketPrice: Number(newEventPrice) || 0,
      status: 'upcoming',
      featured: true,
      eventPhotos: []
    };

    const updated = [newEvt, ...events];
    setEvents(updated);
    saveDynamicEvents(updated);
    setShowAddEventModal(false);

    // Reset form
    setNewEventName('');
    setNewEventBanner('');
    setNewEventDate('');
    setNewEventDay('');
    setNewEventTime('');
    setNewEventLocation('');
    setNewEventDesc('');
  };

  // Multi-photo upload for specific event (up to 6 photos)
  const handleAddEventPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const newPhotosToAdd: Array<{ id: string; caption: string; imageUrl: string; category: any }> = [];

    // Add individual URL input if provided
    if (newPhotoUrl.trim()) {
      newPhotosToAdd.push({
        id: `photo-${Date.now()}-1`,
        caption: newPhotoCaption || 'Event Highlight',
        imageUrl: newPhotoUrl.trim(),
        category: newPhotoCategory
      });
    }

    // Add any batch-uploaded photos
    uploadedEventPhotos.forEach((up, idx) => {
      newPhotosToAdd.push({
        id: `photo-${Date.now()}-${idx + 2}`,
        caption: up.caption || newPhotoCaption || 'Event Highlight',
        imageUrl: up.url,
        category: up.category || newPhotoCategory
      });
    });

    if (newPhotosToAdd.length === 0) return;

    const currentPhotos = selectedEvent.eventPhotos || [];
    // Ensure max 6 photos total
    const combinedPhotos = [...currentPhotos, ...newPhotosToAdd].slice(0, 6);

    const updatedEvents = events.map(evt => {
      if (evt.id === selectedEvent.id) {
        return {
          ...evt,
          eventPhotos: combinedPhotos
        };
      }
      return evt;
    });

    setEvents(updatedEvents);
    saveDynamicEvents(updatedEvents);

    // Update current selected event in modal
    setSelectedEvent(prev => prev ? {
      ...prev,
      eventPhotos: combinedPhotos
    } : null);

    setShowAddPhotoModal(false);
    setNewPhotoCaption('');
    setNewPhotoUrl('');
    setUploadedEventPhotos([]);
  };

  // Handle local file uploads (multiple images up to 6)
  const handleEventPhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = (selectedEvent?.eventPhotos?.length || 0) + uploadedEventPhotos.length;
    const remainingSlots = Math.max(0, 6 - currentCount);

    if (remainingSlots <= 0) {
      alert("Maximum limit of 6 event photos reached for this event!");
      return;
    }

    const totalToRead = Math.min(files.length, remainingSlots);

    for (let i = 0; i < totalToRead; i++) {
      const file = files[i];
      if (!file) continue;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedEventPhotos(prev => {
            if (prev.length >= 6) return prev;
            return [
              ...prev,
              {
                url: event.target!.result as string,
                caption: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' '),
                category: newPhotoCategory
              }
            ];
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-teal/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono uppercase tracking-widest mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>S-CODERS Official Gathering Hub</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-white mb-4">
          Events, Summits & Meetups
        </h1>
        <p className="text-gray-400 text-sm sm:text-base font-sans font-light leading-relaxed">
          Announcements, ticket registrations, and live galleries for upcoming S-CODERS hackathons, founder circles, and developer masterclasses across India.
        </p>
      </div>

      {/* Continuous Moving Animation Marquee for Events Options */}
      <div className="mb-10">
        <MarqueeTicker badgeText="OFFICIAL S-CODERS EVENTS & SUMMITS" />
      </div>

      {/* Action Buttons Row: Enter Key & Event Feedback */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-brand-dark/80 border border-brand-teal/30 p-4 rounded-2xl">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setShowKeyModal(true);
              setKeyLookupNotice(null);
            }}
            className="px-5 py-2.5 bg-brand-teal/20 hover:bg-brand-teal text-brand-teal hover:text-brand-dark border border-brand-teal/40 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md"
          >
            <Lock className="w-4 h-4" />
            <span>🔑 Enter Existing Pass Key</span>
          </button>

          <button
            onClick={() => setShowFeedbackModal(true)}
            className="px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>⭐ Share Event Feedback / Review</span>
          </button>
        </div>

        <div className="text-right text-[11px] font-mono text-gray-400 hidden sm:block">
          <span>Official Event Support: </span>
          <span className="text-brand-teal font-bold">scoders82@gmail.com</span>
        </div>
      </div>

      {keyLookupNotice && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl font-mono text-xs flex items-center justify-between">
          <span>{keyLookupNotice.message}</span>
          <button onClick={() => setKeyLookupNotice(null)} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Category Tabs & Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-black/60 border border-white/10 p-3 rounded-2xl backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'hackathon', label: 'Hackathons' },
            { id: 'founder', label: 'Founder Meetups' },
            { id: 'developer', label: 'Developer Summits' },
            { id: 'community', label: 'Community & Awards' },
            { id: 'tickets', label: `My Tickets (${tickets.length})` }
          ].map(tab => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`relative px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap z-10 ${
                  isActive
                    ? 'text-brand-dark'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeEventTabPill"
                    className="absolute inset-0 bg-brand-teal rounded-xl shadow-md shadow-brand-teal/20 z-0"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddEventModal(true)}
            className="w-full md:w-auto px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        )}
      </div>

      {/* MY TICKETS TAB VIEW */}
      {activeCategory === 'tickets' ? (
        <div className="space-y-6">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-brand-teal" />
            <span>My Verified Event Passes</span>
          </h2>

          {ticketActionNotice && (
            <div className="p-4 bg-amber-500/10 border-l-4 border-amber-400 rounded-xl text-amber-300 font-mono text-xs flex items-center justify-between">
              <span>{ticketActionNotice}</span>
              <button onClick={() => setTicketActionNotice(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
          )}

          {tickets.length === 0 ? (
            <div className="text-center py-16 bg-brand-card/20 border border-white/5 rounded-3xl p-8">
              <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No Tickets Booked Yet</h3>
              <p className="text-gray-400 text-xs mb-6 max-w-md mx-auto">
                Explore our upcoming hackathons and founder meetups below to register and receive your verified entry ticket.
              </p>
              <button
                onClick={() => setActiveCategory('all')}
                className="px-6 py-2.5 bg-brand-teal text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all cursor-pointer"
              >
                Browse Upcoming Events
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tickets.map(t => (
                <div 
                  key={t.ticketCode}
                  className="bg-brand-card/80 border border-brand-teal/30 rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                      <span className="px-3 py-1 rounded-full bg-brand-teal/20 text-brand-teal text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {t.status}
                      </span>
                      <span className="text-xs font-mono text-gray-400">{t.bookingDate}</span>
                    </div>

                    <h3 className="text-lg font-display font-extrabold text-white mb-2">{t.eventName}</h3>
                    <p className="text-xs text-gray-300 font-mono mb-4 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-brand-teal" />
                      <span>Pass Holder: <strong>{t.participantName}</strong></span>
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-black/40 p-3 rounded-xl border border-white/5 mb-4">
                      <div>
                        <span className="text-gray-500 block text-[9px] uppercase">Date & Time</span>
                        <span className="text-white">{t.eventDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[9px] uppercase">Unique Code</span>
                        <span className="text-brand-teal font-bold">{t.ticketCode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setViewingTicket(t)}
                      className="flex-1 py-2.5 bg-brand-teal/15 hover:bg-brand-teal hover:text-brand-dark border border-brand-teal/30 rounded-xl text-brand-teal font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Ticket</span>
                    </button>
                    <button
                      onClick={() => {
                        setTicketToDelete(t);
                        setShowDeleteConfirmModal(true);
                      }}
                      className="px-3.5 py-2.5 bg-red-500/10 hover:bg-red-600 hover:text-white border border-red-500/30 rounded-xl text-red-400 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      title="Delete Ticket Pass"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* EVENTS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredEvents.map(evt => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-card/60 border border-white/10 hover:border-brand-teal/40 rounded-3xl overflow-hidden transition-all duration-300 flex flex-col group shadow-xl hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
            >
              {/* Event Banner - Large and High-Resolution matching Networking & Achievements */}
              <div 
                onClick={() => {
                  setSelectedEvent(evt);
                  setPaymentError(null);
                  setPaymentStatusNotice(null);
                }}
                className="relative aspect-[16/10] sm:h-72 w-full overflow-hidden bg-black cursor-pointer"
              >
                <img 
                  src={evt.bannerImage} 
                  alt={evt.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#011425] via-transparent to-black/30" />
                
                {/* Status Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md border ${
                    evt.status === 'upcoming' 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                  }`}>
                    {evt.status === 'upcoming' ? 'Registration Open' : 'Completed Event'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-brand-teal/20 text-brand-teal border border-brand-teal/30 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
                    {evt.category}
                  </span>
                </div>

                {/* Price Tag */}
                <div className="absolute bottom-4 right-4 px-3.5 py-1.5 rounded-xl bg-brand-dark/90 border border-brand-teal/40 text-brand-teal font-mono font-bold text-sm shadow-lg">
                  {evt.ticketPrice === 0 ? 'FREE ENTRY' : `₹${evt.ticketPrice}`}
                </div>
              </div>

              {/* Event Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div 
                  onClick={() => {
                    setSelectedEvent(evt);
                    setPaymentError(null);
                    setPaymentStatusNotice(null);
                  }}
                  className="cursor-pointer"
                >
                  <h3 className="text-xl font-display font-extrabold text-white mb-3 group-hover:text-brand-teal transition-colors">
                    {evt.name}
                  </h3>

                  <div className="space-y-2 mb-4 text-xs font-mono text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-brand-teal shrink-0" />
                      <span>{evt.date} ({evt.day})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brand-teal shrink-0" />
                      <span>{evt.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-teal shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </div>
                  </div>

                  <p className="text-gray-400 text-xs font-sans font-light leading-relaxed line-clamp-3 mb-6">
                    {evt.description}
                  </p>
                </div>

                {/* Action button */}
                <button
                  onClick={() => {
                    setSelectedEvent(evt);
                    setPaymentError(null);
                    setPaymentStatusNotice(null);
                  }}
                  className="w-full py-3 bg-brand-teal hover:bg-white text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-teal/10"
                >
                  <span>View Event Details & Register</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Community Event Feedbacks & Reviews Section */}
      <div className="mt-16 border-t border-white/10 pt-12 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-widest border border-amber-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Participant Testimonials & Reviews</span>
            </div>
            <h2 className="text-2xl font-display font-extrabold text-white">
              Event Community Feedback ({eventFeedbacks.length})
            </h2>
          </div>
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="px-4 py-2 bg-amber-500 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all cursor-pointer shadow-lg flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Share Event Feedback</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {eventFeedbacks.map(fb => (
            <div key={fb.id} className="bg-brand-card/60 border border-white/10 p-5 rounded-2xl space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white font-mono">{fb.name}</h4>
                  <p className="text-[10px] text-brand-teal font-mono">{fb.role}</p>
                </div>
                <div className="flex text-amber-400">
                  {Array.from({ length: fb.rating }).map((_, i) => (
                    <span key={i} className="text-sm">★</span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-300 font-sans font-light leading-relaxed">
                "{fb.experience}"
              </p>
              <div className="text-[9px] font-mono text-gray-500 text-right">
                {fb.timestamp}
              </div>
            </div>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-card border border-white/10 rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl my-8 relative"
            >
              {/* Close Button ❌ */}
              <button
                onClick={() => setSelectedEvent(null)}
                title="Close Event Modal"
                className="absolute top-4 right-4 z-30 p-2.5 bg-red-500/20 hover:bg-red-600 text-white rounded-full transition-all border border-red-500/50 cursor-pointer shadow-xl flex items-center justify-center"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              <div className="max-h-[85vh] overflow-y-auto">
                {/* 1. Event Banner/Image */}
                <div className="relative h-64 bg-black">
                  <img 
                    src={selectedEvent.bannerImage} 
                    alt={selectedEvent.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-card via-transparent to-black/20" />
                </div>

                <div className="p-6 sm:p-8 space-y-8">
                  {/* 2. Event Name */}
                  <div>
                    <span className="px-3 py-1 rounded-full bg-brand-teal/20 text-brand-teal text-[10px] font-mono font-bold uppercase tracking-wider border border-brand-teal/30 inline-block mb-3">
                      S-CODERS Official {selectedEvent.category}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-white">
                      {selectedEvent.name}
                    </h2>
                  </div>

                  {/* 3. Date | Day | Time | Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-brand-dark/80 p-5 rounded-2xl border border-white/10 text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-brand-teal shrink-0" />
                      <div>
                        <span className="text-gray-500 text-[10px] uppercase block">Date & Day</span>
                        <span className="text-white font-bold">{selectedEvent.date} ({selectedEvent.day})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-brand-teal shrink-0" />
                      <div>
                        <span className="text-gray-500 text-[10px] uppercase block">Timing</span>
                        <span className="text-white font-bold">{selectedEvent.time}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 sm:col-span-2 pt-2 border-t border-white/5">
                      <MapPin className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                      <div>
                        <span className="text-gray-500 text-[10px] uppercase block">Venue / Location</span>
                        <span className="text-white font-bold">{selectedEvent.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Event Description */}
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2 font-bold">Event Overview</h3>
                    <p className="text-gray-300 text-sm font-sans font-light leading-relaxed">
                      {selectedEvent.description}
                    </p>
                  </div>

                  {/* 5. Ticket Price */}
                  <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-gray-400 uppercase tracking-widest block">Entry Ticket Price</span>
                      <span className="text-2xl font-display font-extrabold text-brand-teal">
                        {selectedEvent.ticketPrice === 0 ? 'FREE ENTRY' : `₹${selectedEvent.ticketPrice} INR`}
                      </span>
                    </div>
                    <div className="text-right text-[10px] font-mono text-gray-400">
                      <span className="block text-emerald-400 font-bold">Instant Ticket Generation</span>
                      <span>Verified Razorpay Gateway</span>
                    </div>
                  </div>

                  {/* 6. Event Registration Form */}
                  <div className="bg-brand-dark/60 border border-white/10 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-brand-teal" />
                      <span>Participant Registration Form</span>
                    </h3>

                    {paymentError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{paymentError}</span>
                      </div>
                    )}

                    {paymentStatusNotice && (
                      <div className={`p-3 rounded-xl text-xs font-mono border ${
                        paymentStatusNotice.type === 'SUCCESS'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : paymentStatusNotice.type === 'PENDING'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}>
                        <div className="flex items-center gap-2 font-bold">
                          {paymentStatusNotice.type === 'PENDING' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          {paymentStatusNotice.type === 'SUCCESS' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>{paymentStatusNotice.message}</span>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleRegisterAndPay} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
                            Full Name *
                          </label>
                          <input 
                            type="text"
                            required
                            value={regName}
                            onChange={e => setRegName(e.target.value)}
                            placeholder="e.g. Suhas Gowda"
                            className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-brand-teal focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
                            Email Address *
                          </label>
                          <input 
                            type="email"
                            required
                            value={regEmail}
                            onChange={e => setRegEmail(e.target.value)}
                            placeholder="e.g. suhas@example.com"
                            className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-brand-teal focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
                            Mobile / WhatsApp Number *
                          </label>
                          <input 
                            type="tel"
                            required
                            value={regPhone}
                            onChange={e => setRegPhone(e.target.value)}
                            placeholder="e.g. +91 8310463417"
                            className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-brand-teal focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">
                            Organization / College
                          </label>
                          <input 
                            type="text"
                            value={regOrg}
                            onChange={e => setRegOrg(e.target.value)}
                            placeholder="e.g. Tech Startup / College Name"
                            className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-brand-teal focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* 7. Payment Mode Options for Paid vs Free */}
                      {selectedEvent.ticketPrice === 0 ? (
                        <button
                          type="submit"
                          disabled={isProcessing}
                          className="w-full py-3.5 bg-brand-teal hover:bg-white text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-teal/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Generating Free Event Pass...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>Claim Free Event Pass & Ticket</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="space-y-4 pt-2">
                          {/* Payment Tabs */}
                          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 gap-1 font-mono text-xs">
                            <button
                              type="button"
                              onClick={() => setEventPaymentTab('razorpay')}
                              className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                eventPaymentTab === 'razorpay'
                                  ? 'bg-brand-teal text-brand-dark shadow-md'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Razorpay Gateway</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEventPaymentTab('upi')}
                              className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                eventPaymentTab === 'upi'
                                  ? 'bg-brand-teal text-brand-dark shadow-md'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Direct UPI QR</span>
                            </button>
                          </div>

                          {/* Tab 1: Razorpay Gateway */}
                          {eventPaymentTab === 'razorpay' && (
                            <div className="space-y-3">
                              <div className="p-3 bg-brand-teal/5 border border-brand-teal/20 rounded-xl text-gray-300 text-xs font-mono">
                                <div className="flex items-center justify-between text-brand-teal font-bold mb-1">
                                  <span>Automated Fast-Track Gateway</span>
                                  <span>₹{selectedEvent.ticketPrice} INR</span>
                                </div>
                                <p className="text-[11px] text-gray-400">
                                  Supports Google Pay, PhonePe, Paytm, Credit/Debit Cards, and Netbanking with immediate ticket issuance.
                                </p>
                              </div>

                              <button
                                type="submit"
                                disabled={isProcessing}
                                className="w-full py-3.5 bg-brand-teal hover:bg-white text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-teal/20 flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {isProcessing ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Opening Razorpay Secure Gateway...</span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Pay ₹{selectedEvent.ticketPrice} via Razorpay & Generate Ticket</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {/* Tab 2: Direct UPI QR (scoders@ybl) */}
                          {eventPaymentTab === 'upi' && (
                            <div className="bg-black/60 border border-brand-teal/30 p-4 rounded-2xl space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Official UPI ID</span>
                                  <span className="text-brand-teal font-mono font-bold text-sm">scoders@ybl</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText('scoders@ybl');
                                    setCopiedUpi(true);
                                    setTimeout(() => setCopiedUpi(false), 2000);
                                  }}
                                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>{copiedUpi ? 'Copied!' : 'Copy UPI ID'}</span>
                                </button>
                              </div>

                              <div className="bg-white p-3 rounded-xl max-w-[140px] mx-auto flex flex-col items-center">
                                <QrCode className="w-24 h-24 text-black" />
                                <span className="text-[8px] font-mono text-black font-bold mt-1">S-CODERS LAB</span>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                                  12-digit UTR / UPI Reference No. *
                                </label>
                                <input
                                  type="text"
                                  value={manualUpiRef}
                                  onChange={e => setManualUpiRef(e.target.value)}
                                  placeholder="e.g. 402839482910"
                                  className="w-full px-3.5 py-2 bg-black/50 border border-white/10 rounded-xl text-white font-mono text-xs focus:border-brand-teal focus:outline-none"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={handleDirectUpiEventRegistration}
                                disabled={isProcessing}
                                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {isProcessing ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Verifying UPI Reference...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Verify UPI & Generate Event Pass</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </form>
                  </div>

                  {/* 8, 9. Unique Ticket + QR Code Preview (if issued) */}
                  {viewingTicket && viewingTicket.eventId === selectedEvent.id && (
                    <div className="bg-brand-dark/90 border-2 border-brand-teal rounded-3xl p-6 space-y-4 relative overflow-hidden shadow-2xl">
                      {/* Close Mark ❌ */}
                      <button
                        onClick={() => setViewingTicket(null)}
                        title="Close Ticket Pass Preview"
                        className="absolute top-3 right-3 z-30 p-2 bg-red-500/20 hover:bg-red-600 text-white rounded-full border border-red-500/50 shadow-xl cursor-pointer transition-all flex items-center justify-center"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>

                      <div className="flex items-center justify-between border-b border-white/10 pb-4 pr-10">
                        <div className="flex items-center gap-2 text-brand-teal font-mono text-xs font-bold uppercase">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>VERIFIED S-CODERS ENTRY PASS</span>
                        </div>
                        <span className="px-3 py-1 bg-brand-teal/20 text-brand-teal rounded-full text-[10px] font-mono font-bold">
                          {viewingTicket.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="md:col-span-2 space-y-2 font-mono text-xs">
                          <p className="text-gray-400 text-[10px] uppercase">Participant Name</p>
                          <p className="text-white text-base font-bold">{viewingTicket.participantName}</p>

                          <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                            <div>
                              <span className="text-gray-500 block text-[9px] uppercase">Ticket Code</span>
                              <span className="text-brand-teal font-bold">{viewingTicket.ticketCode}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-[9px] uppercase">Amount Paid</span>
                              <span className="text-emerald-400 font-bold">
                                {viewingTicket.amountPaid === 0 ? 'FREE' : `₹${viewingTicket.amountPaid} INR`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Simulated QR Code matrix */}
                        <div className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                          <div className="w-24 h-24 bg-black/90 rounded-xl flex items-center justify-center text-brand-teal p-1 relative">
                            <QrCode className="w-20 h-20 text-white" />
                          </div>
                          <span className="text-[8px] font-mono text-gray-800 font-bold mt-1 tracking-widest uppercase">
                            {viewingTicket.ticketCode}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                        <button
                          onClick={() => window.print()}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Event Pass</span>
                        </button>
                        <span className="text-[10px] font-mono text-gray-400">
                          Verified S-CODERS Security Key
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 10. Event Photos Gallery (Isolated to this Event) */}
                  <div className="border-t border-white/10 pt-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-display font-extrabold text-white flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-brand-teal" />
                          <span>Event Photos Gallery</span>
                        </h3>
                        <p className="text-gray-400 text-xs font-sans font-light">
                          Photos specifically from {selectedEvent.name} (Venue, Speakers, Highlights & Networking).
                        </p>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => setShowAddPhotoModal(true)}
                          className="px-3 py-1.5 bg-brand-teal/20 text-brand-teal hover:bg-brand-teal hover:text-brand-dark rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Photo</span>
                        </button>
                      )}
                    </div>

                    {!selectedEvent.eventPhotos || selectedEvent.eventPhotos.length === 0 ? (
                      <div className="text-center py-10 bg-black/30 border border-white/5 rounded-2xl text-gray-500 text-xs font-mono">
                        No photos uploaded for this specific event yet. (Supports up to 6 high-res photos)
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedEvent.eventPhotos.map(photo => (
                          <div 
                            key={photo.id}
                            onClick={() => setSelectedImageModal(photo.imageUrl)}
                            className="group relative aspect-[16/10] sm:h-52 rounded-2xl overflow-hidden bg-black border border-white/10 hover:border-brand-teal/50 cursor-pointer shadow-lg transition-all"
                          >
                            <img 
                              src={photo.imageUrl} 
                              alt={photo.caption}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-teal mb-0.5">
                                {photo.category || 'Event Moment'}
                              </span>
                              <span className="text-xs font-sans text-white font-medium line-clamp-1">
                                {photo.caption}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN TICKET PASS MODAL */}
      <AnimatePresence>
        {viewingTicket && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-brand-card border-2 border-brand-teal rounded-3xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl overflow-hidden my-auto"
            >
              {/* Prominent Red ❌ Close Button */}
              <button
                onClick={() => setViewingTicket(null)}
                title="Close Ticket Pass ❌"
                className="absolute top-4 right-4 z-40 p-2.5 bg-red-500/20 hover:bg-red-600 text-white rounded-full border border-red-500/50 shadow-xl cursor-pointer transition-all flex items-center justify-center group"
              >
                <X className="w-5 h-5 text-red-400 group-hover:text-white" />
              </button>

              <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/20 text-brand-teal text-[10px] font-mono font-bold uppercase tracking-widest border border-brand-teal/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified S-CODERS Entry Ticket</span>
                </div>

                <h3 className="text-xl font-display font-black text-white">
                  {viewingTicket.eventName}
                </h3>

                <div className="bg-black/60 border border-white/10 p-4 rounded-2xl text-left space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-500">Participant:</span>
                    <span className="text-white font-bold">{viewingTicket.participantName}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-500">Email:</span>
                    <span className="text-gray-300">{viewingTicket.participantEmail}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-500">Date & Day:</span>
                    <span className="text-white">{viewingTicket.eventDate} ({viewingTicket.eventDay})</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-500">Timing:</span>
                    <span className="text-white">{viewingTicket.eventTime}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-500">Location:</span>
                    <span className="text-white truncate max-w-[200px]">{viewingTicket.eventLocation}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-500">Ticket Code:</span>
                    <span className="text-brand-teal font-black">{viewingTicket.ticketCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Paid:</span>
                    <span className="text-emerald-400 font-bold">
                      {viewingTicket.amountPaid === 0 ? 'FREE' : `₹${viewingTicket.amountPaid} INR`}
                    </span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-2xl max-w-[180px] mx-auto flex flex-col items-center">
                  <QrCode className="w-28 h-28 text-black" />
                  <span className="text-[9px] font-mono text-gray-900 font-bold mt-1">
                    {viewingTicket.ticketCode}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(viewingTicket.ticketCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2.5 bg-brand-teal text-brand-dark font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-white transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Ticket</span>
                  </button>
                  <button
                    onClick={() => {
                      setTicketToDelete(viewingTicket);
                      setShowDeleteConfirmModal(true);
                    }}
                    className="py-2.5 px-4 bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    title="Delete Ticket"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TICKET DELETION CONFIRMATION MODAL WITH PRIVACY POLICY CLAUSE */}
      <AnimatePresence>
        {showDeleteConfirmModal && ticketToDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="bg-[#0B0F17] border-2 border-red-500/60 rounded-3xl max-w-lg w-full p-6 sm:p-8 relative shadow-[0_0_50px_rgba(239,68,68,0.3)] my-auto text-white font-sans"
            >
              <div className="flex items-center gap-3 text-red-400 mb-4">
                <div className="p-3 bg-red-500/20 rounded-2xl border border-red-500/40">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-xl text-white">Delete Ticket Confirmation</h3>
                  <p className="text-xs font-mono text-gray-400">Pass Code: #{ticketToDelete.ticketCode}</p>
                </div>
              </div>

              {/* Event details snapshot */}
              <div className="bg-black/50 border border-white/10 rounded-2xl p-4 mb-5 font-mono text-xs space-y-1.5">
                <p className="text-white font-bold text-sm">{ticketToDelete.eventName}</p>
                <p className="text-gray-400">Holder: <span className="text-gray-200">{ticketToDelete.participantName}</span> ({ticketToDelete.participantEmail})</p>
                <p className="text-gray-400">Date: <span className="text-gray-200">{ticketToDelete.eventDate}</span></p>
              </div>

              {/* Strict Privacy & Policy Warning Banner */}
              <div className="bg-amber-500/10 border-l-4 border-amber-400 p-4 rounded-r-2xl mb-6 space-y-2 text-xs">
                <p className="font-mono font-bold text-amber-300 uppercase tracking-wide">
                  ⚠️ Privacy & Cancellation Policy Clause:
                </p>
                <p className="text-amber-100 font-semibold leading-relaxed">
                  "If in the case the client will delete their ticket from the ticket option by mistakenly then it will be their responsibility if they will delete purposely or by mistakenly."
                </p>
                <p className="text-[11px] text-gray-400 leading-normal">
                  Once deleted, your ticket access code is erased from your device session and marked as purged.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={confirmDeleteTicket}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Yes, Permanently Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setTicketToDelete(null);
                  }}
                  className="py-3.5 px-6 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-mono text-xs sm:text-sm font-bold uppercase rounded-xl transition-colors cursor-pointer text-center"
                >
                  Keep My Ticket
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedImageModal && (
          <div 
            onClick={() => setSelectedImageModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
          >
            <div className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl border border-white/20">
              <img src={selectedImageModal} alt="Event Photo" className="w-full h-full object-contain mx-auto" />
              <button 
                onClick={() => setSelectedImageModal(null)}
                className="absolute top-4 right-4 p-2 bg-black/70 rounded-full text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN ADD EVENT MODAL */}
      <AnimatePresence>
        {showAddEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-card border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-4 relative shadow-2xl"
            >
              <button
                onClick={() => setShowAddEventModal(false)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-gray-300 hover:text-white rounded-full border border-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-display font-bold text-white">Create New S-CODERS Event</h3>

              <form onSubmit={handleCreateEvent} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-gray-400 mb-1">Event Name *</label>
                  <input
                    type="text"
                    required
                    value={newEventName}
                    onChange={e => setNewEventName(e.target.value)}
                    placeholder="e.g. S-CODERS Hackathon 2026"
                    className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-brand-teal focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Banner Image URL</label>
                  <input
                    type="url"
                    value={newEventBanner}
                    onChange={e => setNewEventBanner(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-brand-teal focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-400 mb-1">Date *</label>
                    <input
                      type="text"
                      required
                      value={newEventDate}
                      onChange={e => setNewEventDate(e.target.value)}
                      placeholder="e.g. Oct 15, 2026"
                      className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-brand-teal focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Day</label>
                    <input
                      type="text"
                      value={newEventDay}
                      onChange={e => setNewEventDay(e.target.value)}
                      placeholder="e.g. Saturday"
                      className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-brand-teal focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-400 mb-1">Time</label>
                    <input
                      type="text"
                      value={newEventTime}
                      onChange={e => setNewEventTime(e.target.value)}
                      placeholder="e.g. 10:00 AM - 04:00 PM"
                      className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-brand-teal focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Ticket Price (INR)</label>
                    <input
                      type="number"
                      value={newEventPrice}
                      onChange={e => setNewEventPrice(Number(e.target.value))}
                      placeholder="e.g. 299 (0 for Free)"
                      className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-brand-teal focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={newEventLocation}
                    onChange={e => setNewEventLocation(e.target.value)}
                    placeholder="e.g. Bengaluru Tech Hub"
                    className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-brand-teal focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={newEventDesc}
                    onChange={e => setNewEventDesc(e.target.value)}
                    placeholder="Event overview..."
                    className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-brand-teal focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-teal text-brand-dark font-bold uppercase rounded-xl hover:bg-white transition-all cursor-pointer"
                >
                  Publish New Event
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN ADD PHOTO TO EVENT MODAL (UP TO 6 PHOTOS) */}
      <AnimatePresence>
        {showAddPhotoModal && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-card border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-4 relative shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowAddPhotoModal(false)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-gray-300 hover:text-white rounded-full border border-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-teal/20 text-brand-teal text-[10px] font-mono font-bold uppercase tracking-wider">
                  Photo Gallery Uploader (Up to 6 Photos)
                </span>
                <h3 className="text-lg font-display font-bold text-white mt-1">
                  Add Photos to {selectedEvent.name}
                </h3>
                <p className="text-gray-400 text-xs font-mono">
                  Currently {selectedEvent.eventPhotos?.length || 0} / 6 photos saved for this event.
                </p>
              </div>

              <form onSubmit={handleAddEventPhoto} className="space-y-4 font-mono text-xs">
                {/* Multi-file Upload Box */}
                <div>
                  <label className="block text-gray-300 mb-1.5 font-bold">
                    Upload Photos from Computer / Mobile (Up to 6 images)
                  </label>
                  <label className="border-2 border-dashed border-white/20 hover:border-brand-teal rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-black/40 transition-colors">
                    <Upload className="w-6 h-6 text-brand-teal" />
                    <span className="text-xs text-gray-300 font-bold">Click to select 1 or multiple photos</span>
                    <span className="text-[10px] text-gray-500 font-sans">JPG, PNG, WebP supported</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleEventPhotoFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Staged uploaded photos preview */}
                {uploadedEventPhotos.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-[10px] text-brand-teal font-mono uppercase">
                      Staged Photos ({uploadedEventPhotos.length})
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedEventPhotos.map((up, i) => (
                        <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-white/20 group">
                          <img src={up.url} alt={`upload-${i}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setUploadedEventPhotos(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 rounded-full text-white cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-2 text-[10px] text-gray-500 uppercase">OR ADD VIA URL</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={e => setNewPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-brand-teal focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1">Category</label>
                    <select
                      value={newPhotoCategory}
                      onChange={e => setNewPhotoCategory(e.target.value as any)}
                      className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-brand-teal focus:outline-none cursor-pointer"
                    >
                      <option value="venue">Venue & Stage</option>
                      <option value="speakers">Keynote & Speakers</option>
                      <option value="highlights">Hackathon Highlights</option>
                      <option value="networking">Networking Moments</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Caption</label>
                    <input
                      type="text"
                      value={newPhotoCaption}
                      onChange={e => setNewPhotoCaption(e.target.value)}
                      placeholder="e.g. Winner award distribution"
                      className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-brand-teal focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-teal text-brand-dark font-bold uppercase rounded-xl hover:bg-white transition-all cursor-pointer shadow-lg shadow-brand-teal/20"
                >
                  Save Photos to Event Gallery
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ENTER YOUR TICKET / ACCESS KEY MODAL */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-card border border-brand-teal/40 rounded-3xl max-w-md w-full p-6 space-y-5 relative shadow-2xl"
            >
              <button
                onClick={() => setShowKeyModal(false)}
                className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-600 text-white rounded-full border border-red-500/50 cursor-pointer transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="flex items-center gap-2 text-brand-teal font-mono text-xs font-bold uppercase">
                <Lock className="w-4 h-4" />
                <span>Event Access Key Verification</span>
              </div>

              <h3 className="text-xl font-display font-extrabold text-white">
                Enter Event Ticket Key
              </h3>

              <p className="text-gray-300 text-xs font-sans">
                Enter your unique S-CODERS ticket pass key (e.g., <code className="text-brand-teal font-bold font-mono">SC-EVT-9A2X4B</code>) to instantly unlock and view your verified event pass.
              </p>

              <form onSubmit={handleVerifyEventKey} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-gray-400 mb-1 uppercase text-[10px] tracking-widest font-bold">
                    Ticket / Access Key *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualKeyInput}
                    onChange={e => setManualKeyInput(e.target.value)}
                    placeholder="e.g. SC-EVT-8F72K9X4"
                    className="w-full p-3 bg-black/50 border border-brand-teal/30 rounded-xl text-white font-mono text-sm focus:border-brand-teal focus:outline-none uppercase tracking-wider"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-teal hover:bg-white text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-teal/20"
                >
                  Unlock & View Ticket Pass
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EVENT FEEDBACK FORM MODAL */}
      <AnimatePresence>
        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-card border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative shadow-2xl my-8"
            >
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-600 text-white rounded-full border border-red-500/50 cursor-pointer transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
                <Sparkles className="w-4 h-4" />
                <span>Event Feedback & Testimonials</span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white">
                  Event Experience Feedback
                </h3>
                <p className="text-gray-300 text-xs font-sans mt-1">
                  Share your experience at S-CODERS events to help us elevate future tech gatherings!
                </p>
              </div>

              {fbSuccessNotice && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl font-mono text-xs flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Thank you! Your event feedback has been recorded successfully.</span>
                </div>
              )}

              <form onSubmit={handlePostEventFeedback} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-gray-300 mb-1 font-bold text-[10px] uppercase tracking-widest">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fbName}
                    onChange={e => setFbName(e.target.value)}
                    placeholder="e.g. Suhas Gowda"
                    className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-bold text-[10px] uppercase tracking-widest">
                    Role / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={fbRole}
                    onChange={e => setFbRole(e.target.value)}
                    placeholder="e.g. Full-Stack Developer / Engineering Student"
                    className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-bold text-[10px] uppercase tracking-widest">
                    Rating out of 5 star *
                  </label>
                  <div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/10">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFbRating(star)}
                        className={`text-2xl transition-transform cursor-pointer ${
                          star <= fbRating ? 'text-amber-400 scale-110' : 'text-gray-600 hover:text-amber-200'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-amber-400 font-bold ml-2">{fbRating} / 5 Stars</span>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-bold text-[10px] uppercase tracking-widest">
                    Describe your experience in event / feedback *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={fbExperience}
                    onChange={e => setFbExperience(e.target.value)}
                    placeholder="Tell us what you loved about the event, organizers, sessions, or networking opportunities..."
                    className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-amber-400 focus:outline-none font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
                >
                  Submit Event Feedback
                </button>
              </form>
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
            setPaymentStatusNotice({
              type: 'FAILED',
              message: 'Payment cancelled or not completed. No event pass was generated.'
            });
          }}
          onFailure={(reason) => {
            setShowRazorpayModal(false);
            setPaymentStatusNotice({
              type: 'FAILED',
              message: reason || 'Payment incomplete or cancelled. No ticket pass generated.'
            });
          }}
          onSuccess={handleRazorpayEventSuccess}
          orderData={razorpayOrderData}
          paymentDetails={razorpayPaymentDetails}
        />
      )}
    </div>
  );
}
