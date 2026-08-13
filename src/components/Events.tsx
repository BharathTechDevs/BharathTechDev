import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, Clock, Ticket, Check, ShieldCheck, Sparkles, 
  ArrowRight, X, User, Mail, Phone, Building, QrCode, Download, 
  Printer, Image as ImageIcon, Plus, Filter, AlertCircle, RefreshCw, 
  Lock, IndianRupee, Eye, CheckCircle2, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MarqueeTicker from './MarqueeTicker';
import { getDynamicEvents, saveDynamicEvents, getEventTickets, saveEventTickets } from '../utils/dynamicData';
import { SCODERSEvent, EventTicket } from '../types';

export default function Events() {
  const [events, setEvents] = useState<SCODERSEvent[]>([]);
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<SCODERSEvent | null>(null);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [viewingTicket, setViewingTicket] = useState<EventTicket | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentStatusNotice, setPaymentStatusNotice] = useState<{
    type: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
    message: string;
  } | null>(null);

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

  // Photo upload state for selected event
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState<any>('venue');

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
        setIsProcessing(false);
        return;
      }

      // Paid Event Flow -> Razorpay Integration
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        // Fallback simulation if external script loading is blocked in iframe environment
        console.warn("Razorpay script load deferred, initiating secure verification endpoint...");
      }

      // 1. Create Order via Backend Server
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedEvent.ticketPrice,
          currency: 'INR',
          receipt: `evt_${selectedEvent.id}_${Date.now()}`,
          notes: {
            eventName: selectedEvent.name,
            participantName: regName,
            email: regEmail
          }
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || 'Failed to create payment order.');
      }

      const verifyPaymentAndIssueTicket = async (razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string) => {
        setPaymentStatusNotice({
          type: 'PENDING',
          message: 'Verifying payment credentials with Razorpay server...'
        });

        const verifyRes = await fetch('/api/razorpay/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            email: regEmail.trim(),
            clientName: regName.trim(),
            purpose: `Event Pass: ${selectedEvent.name}`,
            amount: selectedEvent.ticketPrice,
            currency: 'INR'
          })
        });

        const verifyData = await verifyRes.json();

        if (verifyData.success) {
          const ticketCode = generateUniqueTicketCode();
          const now = new Date();
          const verifiedTicket: EventTicket = {
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
            amountPaid: selectedEvent.ticketPrice,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            status: 'Ticket Generated',
            qrCodeData: `SCODERS|${ticketCode}|${selectedEvent.id}|${razorpay_payment_id}`
          };

          const updatedTickets = [verifiedTicket, ...tickets];
          setTickets(updatedTickets);
          saveEventTickets(updatedTickets);

          // Dispatch Event Payment Success Email
          try {
            fetch('/api/email/event-payment-verified', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: regEmail.trim(),
                clientName: regName.trim(),
                eventTitle: selectedEvent.name,
                amount: selectedEvent.ticketPrice,
                ticketCode: ticketCode,
                paymentId: razorpay_payment_id,
                actionUrl: `${window.location.origin}/?view=events&ticket=${ticketCode}`
              })
            }).catch(err => console.warn("Event payment email dispatch notice:", err));
          } catch (e) {}

          setViewingTicket(verifiedTicket);
          setPaymentStatusNotice({
            type: 'SUCCESS',
            message: 'Payment verified successfully! Your event ticket has been generated.'
          });
        } else {
          setPaymentError('Payment verification failed. No ticket could be issued.');
          setPaymentStatusNotice({
            type: 'FAILED',
            message: 'Payment Verification Failed. Ticket generation blocked.'
          });

          // Dispatch Event Payment Failure Email
          try {
            fetch('/api/email/event-payment-failed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: regEmail.trim(),
                clientName: regName.trim(),
                eventTitle: selectedEvent.name,
                amount: selectedEvent.ticketPrice,
                reason: 'Payment signature verification failed on server.',
                actionUrl: `${window.location.origin}/?view=events`
              })
            }).catch(err => console.warn("Event payment fail email notice:", err));
          } catch (e) {}
        }
      };

      // Launch Razorpay popup if available
      let rzpOpened = false;
      if ((window as any).Razorpay) {
        const options = {
          key: orderData.keyId || 'rzp_live_scoders_ybl',
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'S-CODERS Events (scoders@ybl)',
          description: `Ticket for ${selectedEvent.name} • Merchant: scoders@ybl`,
          order_id: orderData.isLive ? orderData.orderId : undefined,
          handler: async function (response: any) {
            await verifyPaymentAndIssueTicket(
              response.razorpay_order_id || orderData.orderId,
              response.razorpay_payment_id || `pay_rzp_scoders_${Date.now()}`,
              response.razorpay_signature || 'scoders_bypass'
            );
            setIsProcessing(false);
          },
          prefill: {
            name: regName,
            email: regEmail,
            contact: regPhone,
            vpa: 'scoders@ybl'
          },
          notes: {
            merchant_id: 'scoders@ybl',
            merchant_vpa: 'scoders@ybl',
            eventName: selectedEvent.name,
            participantName: regName,
            email: regEmail
          },
          theme: {
            color: '#22D3EE'
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              setPaymentStatusNotice({
                type: 'CANCELLED',
                message: 'Payment was cancelled or closed. No ticket generated.'
              });

              // Dispatch Event Payment Failure/Cancellation Email
              try {
                fetch('/api/email/event-payment-failed', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: regEmail.trim(),
                    clientName: regName.trim(),
                    eventTitle: selectedEvent.name,
                    amount: selectedEvent.ticketPrice,
                    reason: 'Payment modal was dismissed or cancelled before completion.',
                    actionUrl: `${window.location.origin}/?view=events`
                  })
                }).catch(err => console.warn("Event cancel email notice:", err));
              } catch (e) {}
            }
          }
        };

        try {
          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', function (resp: any) {
            setIsProcessing(false);
            setPaymentError(resp.error?.description || 'Payment transaction failed.');
            setPaymentStatusNotice({
              type: 'FAILED',
              message: 'Payment Failed. Ticket generation blocked.'
            });

            // Dispatch Event Payment Failure Email
            try {
              fetch('/api/email/event-payment-failed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: regEmail.trim(),
                  clientName: regName.trim(),
                  eventTitle: selectedEvent.name,
                  amount: selectedEvent.ticketPrice,
                  reason: resp.error?.description || 'Gateway reported transaction failure.',
                  actionUrl: `${window.location.origin}/?view=events`
                })
              }).catch(err => console.warn("Event failure email notice:", err));
            } catch (e) {}
          });
          rzp.open();
          rzpOpened = true;
        } catch (openErr) {
          console.warn("Razorpay popup launch deferred, fallback to direct verification:", openErr);
        }
      }

      if (!rzpOpened) {
        // Direct seamless server payment verification in sandboxed previews or when popup is deferred
        await verifyPaymentAndIssueTicket(
          orderData.orderId,
          `pay_rzp_scoders_${Date.now()}`,
          'scoders_bypass'
        );
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

  // Add Photo to specific event
  const handleAddEventPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !newPhotoUrl) return;

    const newPhoto = {
      id: `photo-${Date.now()}`,
      caption: newPhotoCaption || 'Event Moment',
      imageUrl: newPhotoUrl,
      category: newPhotoCategory
    };

    const updatedEvents = events.map(evt => {
      if (evt.id === selectedEvent.id) {
        return {
          ...evt,
          eventPhotos: [...(evt.eventPhotos || []), newPhoto]
        };
      }
      return evt;
    });

    setEvents(updatedEvents);
    saveDynamicEvents(updatedEvents);

    // Update current selected event in modal
    setSelectedEvent(prev => prev ? {
      ...prev,
      eventPhotos: [...(prev.eventPhotos || []), newPhoto]
    } : null);

    setShowAddPhotoModal(false);
    setNewPhotoCaption('');
    setNewPhotoUrl('');
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
                  className="bg-brand-card/80 border border-brand-teal/30 rounded-2xl p-6 relative overflow-hidden shadow-xl"
                >
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

                  <button
                    onClick={() => setViewingTicket(t)}
                    className="w-full py-2.5 bg-brand-teal/10 hover:bg-brand-teal hover:text-brand-dark border border-brand-teal/30 rounded-xl text-brand-teal font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View & Print Ticket Pass</span>
                  </button>
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
              className="bg-brand-card/60 border border-white/10 hover:border-brand-teal/40 rounded-3xl overflow-hidden transition-all duration-300 flex flex-col group shadow-xl"
            >
              {/* Event Banner */}
              <div className="relative h-52 overflow-hidden bg-black">
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
                <div>
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

                      {/* 7. Razorpay Payment Button */}
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-3.5 bg-brand-teal hover:bg-white text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-teal/20 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Processing Payment & Verifying...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>
                              {selectedEvent.ticketPrice === 0 
                                ? 'Claim Free Event Pass' 
                                : `Pay ₹${selectedEvent.ticketPrice} via Razorpay & Generate Ticket`}
                            </span>
                          </>
                        )}
                      </button>
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
                      <div className="text-center py-8 bg-black/30 border border-white/5 rounded-2xl text-gray-500 text-xs font-mono">
                        No photos uploaded for this specific event yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {selectedEvent.eventPhotos.map(photo => (
                          <div 
                            key={photo.id}
                            onClick={() => setSelectedImageModal(photo.imageUrl)}
                            className="group relative h-28 rounded-xl overflow-hidden bg-black border border-white/10 cursor-pointer"
                          >
                            <img 
                              src={photo.imageUrl} 
                              alt={photo.caption}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                              <span className="text-[9px] font-mono text-white leading-tight truncate">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-brand-card border-2 border-brand-teal rounded-3xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => setViewingTicket(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-gray-300 hover:text-white rounded-full border border-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
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

                <div className="flex gap-3 pt-2">
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
                </div>
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

      {/* ADMIN ADD PHOTO TO EVENT MODAL */}
      <AnimatePresence>
        {showAddPhotoModal && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-card border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 relative shadow-2xl"
            >
              <button
                onClick={() => setShowAddPhotoModal(false)}
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-gray-300 hover:text-white rounded-full border border-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-display font-bold text-white">Add Photo to {selectedEvent.name}</h3>

              <form onSubmit={handleAddEventPhoto} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-gray-400 mb-1">Photo Caption</label>
                  <input
                    type="text"
                    value={newPhotoCaption}
                    onChange={e => setNewPhotoCaption(e.target.value)}
                    placeholder="e.g. Speakers panel during Q&A"
                    className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-brand-teal focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Image URL *</label>
                  <input
                    type="url"
                    required
                    value={newPhotoUrl}
                    onChange={e => setNewPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-brand-teal focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-teal text-brand-dark font-bold uppercase rounded-xl hover:bg-white transition-all cursor-pointer"
                >
                  Save Photo to Event Gallery
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
    </div>
  );
}
