import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, ExternalLink, Edit2, Trash2, Check, X, Shield, Lock, 
  MessageCircle, CheckCheck, Link2, Search, User, Sparkles, RefreshCw,
  LogOut, ShieldCheck, ChevronRight, ArrowLeft
} from 'lucide-react';
import { Service, AppUser } from '../types';
import { DatabaseEngine, ChatConversation, ChatMessageItem } from '../utils/dbEngine';

interface ServiceChatRoomProps {
  activeService: Service;
  activeRegInfo?: {
    key: string;
    name: string;
    email?: string;
    budget?: string;
    timeline?: string;
    role?: string;
    requirements?: string;
    timestamp?: string;
  };
  isRegistered?: boolean;
  isAdmin: boolean;
  currentUser: AppUser | null;
}

export default function ServiceChatRoom({
  activeService,
  activeRegInfo,
  isRegistered = true,
  isAdmin,
  currentUser
}: ServiceChatRoomProps) {
  // Client Identity
  const clientName = activeRegInfo?.name || currentUser?.name || 'Service Client';
  const clientEmail = (activeRegInfo?.email || currentUser?.email || 'client@scoders.dev').toLowerCase().trim();
  const clientKey = activeRegInfo?.key || 'PASS-SVC-KEY';

  // Determine stable individual chat ID for this client + service
  const clientChatId = useMemo(() => {
    try {
      const serviceRegs = DatabaseEngine.getServiceRegistrations();
      const match = serviceRegs.find(r => 
        (r.serviceId === activeService.id || r.selectedServiceTitle === activeService.title) &&
        (
          (activeRegInfo?.key && r.uniqueKey === activeRegInfo.key) ||
          (clientEmail && r.clientProfile?.email?.toLowerCase() === clientEmail) ||
          (currentUser?.email && r.clientProfile?.email?.toLowerCase() === currentUser.email.toLowerCase())
        )
      );
      if (match?.chatId) return match.chatId;
      if (match?.id) return `chat-svc-${match.id}`;
    } catch (e) {}

    if (activeRegInfo?.key) {
      return `chat-svc-${activeService.id}-${activeRegInfo.key}`;
    }

    const sanitizedEmail = clientEmail.replace(/[^a-zA-Z0-9]/g, '_');
    return `chat-svc-${activeService.id}-${sanitizedEmail}`;
  }, [activeService.id, activeService.title, clientEmail, clientKey, activeRegInfo, currentUser]);

  // Mode: 'client' (their own private WhatsApp chat) vs 'team' (S-CODERS team management portal)
  const [activeMode, setActiveMode] = useState<'client' | 'team'>('client');
  const [isTeamAuthorized, setIsTeamAuthorized] = useState(() => isAdmin);

  // Team passkey authorization modal
  const [showTeamAuthModal, setShowTeamAuthModal] = useState(false);
  const [teamPasscodeInput, setTeamPasscodeInput] = useState('');
  const [teamAuthError, setTeamAuthError] = useState<string | null>(null);

  // In team mode: all registered client conversations
  const [teamConversations, setTeamConversations] = useState<ChatConversation[]>([]);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [teamSelectedChatId, setTeamSelectedChatId] = useState<string>(clientChatId);
  const [teamSenderIdentity, setTeamSenderIdentity] = useState<'shreyas' | 'bhuvan' | 'team'>('shreyas');

  // Currently viewed conversation state
  const currentChatId = activeMode === 'team' ? teamSelectedChatId : clientChatId;
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Chat input and action states
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [linkTitleInput, setLinkTitleInput] = useState('');

  // Scroll Container Ref (Stationary container scroll, NO scrollIntoView jumps!)
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef(false);
  const prevMessagesCountRef = useRef(0);

  // Sync admin state
  useEffect(() => {
    if (isAdmin) {
      setIsTeamAuthorized(true);
    }
  }, [isAdmin]);

  // Handle user manual scroll inside container
  const handleContainerScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    // If distance from bottom is greater than 80px, user has manually scrolled up
    isUserScrolledUpRef.current = (scrollHeight - scrollTop - clientHeight) > 80;
  };

  // Safe container scroll to bottom (scoped strictly to div, zero window jumping)
  const scrollToBottomSafely = (force = false) => {
    if (!chatScrollContainerRef.current) return;
    if (force || !isUserScrolledUpRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    }
  };

  // Fetch or initialize active conversation with permanent message merging
  const loadConversation = async (chatId: string) => {
    try {
      const queryParams = new URLSearchParams({
        clientName,
        clientEmail,
        registrationId: chatId,
        serviceId: activeService.id,
        reference: activeService.title
      });

      const res = await fetch(`/api/services/chats/${encodeURIComponent(chatId)}?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.conversation) {
          // Merge local DB messages if any exist
          try {
            const allChats = DatabaseEngine.getChats();
            const localMatch = allChats.find(c => c.id === chatId || c.clientEmail?.toLowerCase() === clientEmail);
            if (localMatch && localMatch.messages && localMatch.messages.length > data.conversation.messages.length) {
              data.conversation.messages = localMatch.messages;
            }
          } catch (e) {}

          setCurrentConversation(data.conversation);
          setMessages(data.conversation.messages || []);
          return;
        }
      }
    } catch (err) {
      console.warn('Network chat fetch failed, checking local database:', err);
    }

    // Fallback and permanent merging to DatabaseEngine
    try {
      const allChats = DatabaseEngine.getChats();
      let match = allChats.find(c => c.id === chatId || (c.clientEmail && c.clientEmail.toLowerCase() === clientEmail));
      
      const altMatches = allChats.filter(c => c.id !== chatId && c.clientEmail && c.clientEmail.toLowerCase() === clientEmail);
      let mergedMessages: ChatMessageItem[] = match?.messages || [];
      for (const alt of altMatches) {
        if (alt.messages && Array.isArray(alt.messages)) {
          for (const m of alt.messages) {
            if (!mergedMessages.some(existing => existing.id === m.id || (existing.content === m.content && existing.timestamp === m.timestamp))) {
              mergedMessages.push(m);
            }
          }
        }
      }

      mergedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      if (!match) {
        match = {
          id: chatId,
          clientName,
          clientEmail,
          registrationId: chatId,
          reference: activeService.title,
          serviceId: activeService.id,
          uniqueAccessKey: clientKey,
          messages: mergedMessages.length > 0 ? mergedMessages : [
            {
              id: `msg-svc-init-${Date.now()}`,
              sender: 'team',
              senderName: 'S-CODERS Lead Team',
              senderRole: 'S-CODERS Founder & CEO',
              content: `Welcome ${clientName}! This is your private, permanent WhatsApp-style workspace for '${activeService.title}'. All messages, files, and doubts are securely stored and will remain available whenever you return.`,
              timestamp: new Date().toISOString()
            }
          ],
          lastUpdated: new Date().toISOString()
        };
        DatabaseEngine.saveChats([match, ...allChats.filter(c => c.id !== chatId)]);
      } else {
        match.messages = mergedMessages;
        match.lastUpdated = new Date().toISOString();
        DatabaseEngine.saveChats(allChats);
      }

      setCurrentConversation(match);
      setMessages(match.messages || []);
    } catch (dbErr) {
      console.error('Error reading local chats:', dbErr);
    }
  };

  // Fetch all chats for team management mode
  const loadTeamConversations = async () => {
    try {
      const res = await fetch(`/api/services/chats?serviceId=${encodeURIComponent(activeService.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.chats)) {
          setTeamConversations(data.chats);
          if (data.chats.length > 0 && (!teamSelectedChatId || !data.chats.some((c: any) => c.id === teamSelectedChatId))) {
            setTeamSelectedChatId(data.chats[0].id);
          }
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch team conversations from server:', e);
    }

    // Fallback from DatabaseEngine
    try {
      const allChats = DatabaseEngine.getChats();
      const serviceChats = allChats.filter(c => 
        c.id?.includes('svc') || 
        c.registrationId?.includes('svc') || 
        c.serviceId === activeService.id ||
        (!c.id?.includes('wksp') && !c.reference?.toLowerCase().includes('workshop'))
      );
      setTeamConversations(serviceChats);
    } catch (e) {}
  };

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    loadConversation(currentChatId).finally(() => {
      setIsLoading(false);
      setTimeout(() => scrollToBottomSafely(true), 150);
    });
  }, [currentChatId, activeService.id]);

  // Periodic gentle polling for new messages (every 3.5s) without disturbing scroll
  useEffect(() => {
    const timer = setInterval(() => {
      loadConversation(currentChatId);
      if (activeMode === 'team') {
        loadTeamConversations();
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [currentChatId, activeMode]);

  // When messages array updates, adjust scroll safely only if user wasn't scrolled up
  useEffect(() => {
    if (messages.length > prevMessagesCountRef.current) {
      scrollToBottomSafely(false);
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages]);

  // Send Message Handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanContent = messageInput.trim();
    if (!cleanContent || isSending) return;

    setIsSending(true);

    const isTeam = activeMode === 'team';
    let senderName = clientName;
    let senderRole = 'Client Partner';

    if (isTeam) {
      if (teamSenderIdentity === 'shreyas') {
        senderName = 'Shreyas M.';
        senderRole = 'S-CODERS Founder & CEO';
      } else if (teamSenderIdentity === 'bhuvan') {
        senderName = 'Bhuvan M.';
        senderRole = 'S-CODERS Tech Lead';
      } else {
        senderName = 'S-CODERS Engineering Team';
        senderRole = 'Official Support';
      }
    }

    const payload = {
      content: cleanContent,
      sender: isTeam ? 'team' : 'client',
      senderName,
      senderRole,
      clientName: currentConversation?.clientName || clientName,
      clientEmail: currentConversation?.clientEmail || clientEmail,
      reference: activeService.title
    };

    try {
      const res = await fetch(`/api/services/chats/${encodeURIComponent(currentChatId)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.message) {
          setMessages(prev => [...prev, data.message]);
          setMessageInput('');
          isUserScrolledUpRef.current = false;
          setTimeout(() => scrollToBottomSafely(true), 50);
          setIsSending(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Direct API post failed, falling back to local DB engine:', err);
    }

    // Local DB fallback
    const localNewMessage: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      sender: isTeam ? 'team' : 'client',
      senderName,
      senderRole,
      content: cleanContent,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, localNewMessage];
    setMessages(updatedMessages);
    setMessageInput('');

    try {
      const allChats = DatabaseEngine.getChats();
      const updated = allChats.map(c => {
        if (c.id === currentChatId) {
          return { ...c, messages: updatedMessages, lastUpdated: new Date().toISOString() };
        }
        return c;
      });
      DatabaseEngine.saveChats(updated);
    } catch (e) {}

    isUserScrolledUpRef.current = false;
    setTimeout(() => scrollToBottomSafely(true), 50);
    setIsSending(false);
  };

  // Edit Message Handler
  const handleSaveEdit = async (messageId: string) => {
    const cleanContent = editContent.trim();
    if (!cleanContent) return;

    try {
      const res = await fetch(`/api/services/chats/${encodeURIComponent(currentChatId)}/messages/${encodeURIComponent(messageId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: cleanContent })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: cleanContent, edited: true, editedAt: new Date().toISOString() } : m));
          setEditingMessageId(null);
          setEditContent('');
          return;
        }
      }
    } catch (e) {}

    // Local fallback
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: cleanContent, edited: true, editedAt: new Date().toISOString() } : m));
    setEditingMessageId(null);
    setEditContent('');
  };

  // Delete Message Handler
  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      const res = await fetch(`/api/services/chats/${encodeURIComponent(currentChatId)}/messages/${encodeURIComponent(messageId)}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        return;
      }
    } catch (e) {}

    // Local fallback
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  // Insert Link Helper
  const handleInsertLink = () => {
    if (!linkUrlInput.trim()) return;
    let url = linkUrlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const title = linkTitleInput.trim();
    const linkText = title ? `${title} (${url})` : url;
    
    setMessageInput(prev => prev ? `${prev} ${linkText}` : linkText);
    setLinkUrlInput('');
    setLinkTitleInput('');
    setShowLinkModal(false);
  };

  // Team Portal Authorization Check
  const handleOpenTeamPortal = () => {
    if (isTeamAuthorized) {
      setActiveMode('team');
      loadTeamConversations();
    } else {
      setShowTeamAuthModal(true);
      setTeamAuthError(null);
      setTeamPasscodeInput('');
    }
  };

  const handleVerifyTeamPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = teamPasscodeInput.trim();
    const validCodes = ['SCODERS2026', 'SCODERS@HQ', 'scoders82@gmail.com', 'ADMIN2026', 'BHUVAN2026', 'SHREYAS2026'];
    
    if (validCodes.includes(clean) || clean.toLowerCase() === 'scoders82@gmail.com') {
      setIsTeamAuthorized(true);
      setShowTeamAuthModal(false);
      setActiveMode('team');
      loadTeamConversations();
    } else {
      setTeamAuthError('Invalid team access passcode. Please contact S-CODERS HQ.');
    }
  };

  // URL parser & Clickable Link Formatter
  const renderMessageContent = (content: string) => {
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    const parts = content.split(urlPattern);

    return parts.map((part, index) => {
      if (part.match(urlPattern)) {
        const fullHref = part.startsWith('http') ? part : `https://${part}`;
        return (
          <a
            key={index}
            href={fullHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-100 underline decoration-cyan-400 font-semibold break-all transition-colors mx-1 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30"
            title={`Open ${fullHref}`}
          >
            <span>{part}</span>
            <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-80" />
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Filter team conversations by search query
  const filteredTeamConversations = useMemo(() => {
    if (!teamSearchQuery.trim()) return teamConversations;
    const q = teamSearchQuery.toLowerCase();
    return teamConversations.filter(c => 
      c.clientName?.toLowerCase().includes(q) ||
      c.clientEmail?.toLowerCase().includes(q) ||
      c.uniqueAccessKey?.toLowerCase().includes(q) ||
      c.reference?.toLowerCase().includes(q)
    );
  }, [teamConversations, teamSearchQuery]);

  return (
    <div className="flex flex-col h-[520px] bg-[#070B12] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative font-sans">
      
      {/* ========================================================
          TOP HEADER: WhatsApp-Style Status Bar
          ======================================================== */}
      <div className="px-4 py-3 bg-[#0d1424] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-teal/30 to-emerald-500/20 border border-brand-teal/40 flex items-center justify-center text-brand-teal font-display font-bold">
              {activeMode === 'team' ? <Shield className="w-5 h-5 text-brand-teal" /> : <Sparkles className="w-5 h-5 text-brand-teal" />}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0d1424]" title="Leads Online" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white truncate">
                {activeMode === 'team' 
                  ? `S-CODERS Client Service Desk • ${currentConversation?.clientName || 'Client Chat'}`
                  : 'S-CODERS Lead Developers (Shreyas & Bhuvan)'}
              </h4>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shrink-0">
                VERIFIED
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400 truncate">
              {activeMode === 'team' ? (
                <span>Client: {currentConversation?.clientEmail || clientEmail} • Pass: {currentConversation?.uniqueAccessKey || clientKey}</span>
              ) : (
                <>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Online
                  </span>
                  <span>•</span>
                  <span className="truncate">Private 1-on-1 Engineering Channel</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side status badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-gray-300">
            <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
            <span className="hidden sm:inline">Direct Developer Channel</span>
            <span className="sm:hidden">Online</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          BODY: Split View in Team Mode VS Single View in Client Mode
          ======================================================== */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* TEAM MODE: Client Directory Sidebar */}
        {activeMode === 'team' && (
          <div className="w-64 sm:w-72 border-r border-white/10 bg-[#080d18] flex flex-col shrink-0">
            <div className="p-2.5 border-b border-white/10 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  placeholder="Search client or pass key..."
                  className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal font-sans"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 px-1">
                <span>Registered Clients ({filteredTeamConversations.length})</span>
                <button
                  type="button"
                  onClick={loadTeamConversations}
                  className="hover:text-brand-teal transition-colors"
                  title="Refresh client chats"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filteredTeamConversations.length === 0 ? (
                <div className="p-4 text-center text-xs font-mono text-gray-500">
                  No matching clients registered yet.
                </div>
              ) : (
                filteredTeamConversations.map((conv) => {
                  const isSelected = conv.id === teamSelectedChatId;
                  const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setTeamSelectedChatId(conv.id)}
                      className={`w-full p-3 text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                        isSelected ? 'bg-brand-teal/15 border-l-4 border-brand-teal' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-brand-teal font-bold text-xs shrink-0 mt-0.5">
                        {conv.clientName ? conv.clientName.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-brand-teal' : 'text-white'}`}>
                            {conv.clientName || 'Service Client'}
                          </span>
                          <span className="text-[10px] font-mono text-gray-500 shrink-0">
                            {lastMsg?.timestamp ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-gray-400 truncate">{conv.clientEmail}</p>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {lastMsg ? (lastMsg.sender === 'team' ? 'You: ' : '') + lastMsg.content : 'No messages'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            MAIN CHAT DESK (Messages Container + Input)
            ======================================================== */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#040810]">
          
          {/* Privacy & WhatsApp Security Banner */}
          <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-400 shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                {activeMode === 'team'
                  ? `S-CODERS Lead Desk • Responding to ${currentConversation?.clientName || 'Client'}`
                  : `Private 1-on-1 Chat with S-CODERS • Pass: ${clientKey}`}
              </span>
            </div>
            <span className="text-emerald-400 font-bold shrink-0 hidden sm:inline">
              ✓ Database Stored Permanently
            </span>
          </div>

          {/* Messages Scrollable Area */}
          <div
            ref={chatScrollContainerRef}
            onScroll={handleContainerScroll}
            className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#03060c] select-text"
          >
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs font-mono text-gray-500 gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-brand-teal" />
                <span>Loading your encrypted private conversation...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-bold text-white">Start your private conversation</h5>
                <p className="text-xs text-gray-400 max-w-sm font-sans">
                  Drop your requirements, share Figma or GitHub links, or discuss timelines directly with Shreyas and Bhuvan.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isClient = msg.sender === 'client';
                const isSelf = activeMode === 'team' ? !isClient : isClient;
                const canModify = activeMode === 'team' ? !isClient : isClient;
                const formattedTime = msg.timestamp 
                  ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[88%] sm:max-w-[78%] group relative ${
                      isSelf ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    {/* Sender Identity Tag */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-400 mb-1 px-1">
                      <span className={isSelf ? 'text-brand-teal font-bold' : 'text-gray-200 font-semibold'}>
                        {isSelf ? (activeMode === 'team' ? 'You (S-CODERS Lead)' : 'You') : (msg.senderName || (msg.sender === 'team' ? 'S-CODERS Lead' : 'Client'))}
                      </span>
                      {msg.senderRole && (
                        <>
                          <span>•</span>
                          <span className="text-[10px] text-gray-500">{msg.senderRole}</span>
                        </>
                      )}
                      {msg.sender === 'team' && (
                        <span className="text-[9px] bg-brand-teal/20 text-brand-teal px-1 py-0.2 rounded font-bold">
                          TEAM
                        </span>
                      )}
                    </div>

                    {/* WhatsApp-Style Message Bubble */}
                    <div
                      className={`relative p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed transition-all shadow-md ${
                        isSelf
                          ? 'bg-[#005c4b]/80 border border-[#005c4b] text-white rounded-tr-none'
                          : 'bg-[#202c33] border border-white/10 text-gray-200 rounded-tl-none'
                      }`}
                    >
                      {/* Message Content with Parsed Links */}
                      {editingMessageId === msg.id ? (
                        <div className="space-y-2 min-w-[240px]">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            className="w-full p-2 bg-black/50 border border-brand-teal/40 rounded-lg text-xs text-white focus:outline-none focus:border-brand-teal font-sans"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingMessageId(null)}
                              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3 h-3" /> Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(msg.id)}
                              className="px-2.5 py-1 bg-emerald-500 text-black font-bold hover:bg-emerald-400 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap break-words">
                          {renderMessageContent(msg.content)}
                        </div>
                      )}

                      {/* Bubble Footer: Time, Edited Badge, Double Checkmark */}
                      <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] font-mono text-gray-400">
                        {msg.edited && (
                          <span className="text-gray-400 italic text-[9px]">(edited)</span>
                        )}
                        <span>{formattedTime}</span>
                        {isSelf && (
                          <span title="Delivered & Saved in Database">
                            <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />
                          </span>
                        )}
                      </div>

                      {/* Quick Edit/Delete Hover Controls (for author) */}
                      {canModify && editingMessageId !== msg.id && (
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/80 rounded-md px-1.5 py-0.5 border border-white/10 shadow-sm">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditContent(msg.content);
                            }}
                            className="p-1 hover:text-brand-teal text-gray-400 transition-colors cursor-pointer"
                            title="Edit message"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1 hover:text-red-400 text-gray-400 transition-colors cursor-pointer"
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* TEAM MODE SENDER IDENTITY SWITCHER */}
          {activeMode === 'team' && (
            <div className="px-4 py-2 bg-[#0d1424] border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">Replying as:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTeamSenderIdentity('shreyas')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    teamSenderIdentity === 'shreyas'
                      ? 'bg-brand-teal text-brand-dark font-extrabold shadow-sm'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  Shreyas M. (CEO)
                </button>
                <button
                  type="button"
                  onClick={() => setTeamSenderIdentity('bhuvan')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    teamSenderIdentity === 'bhuvan'
                      ? 'bg-brand-teal text-brand-dark font-extrabold shadow-sm'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  Bhuvan M. (Tech Lead)
                </button>
                <button
                  type="button"
                  onClick={() => setTeamSenderIdentity('team')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    teamSenderIdentity === 'team'
                      ? 'bg-brand-teal text-brand-dark font-extrabold shadow-sm'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  Engineering Support
                </button>
              </div>
            </div>
          )}

          {/* INPUT BAR */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-[#0a101d] border-t border-white/10 flex items-center gap-2 shrink-0"
          >
            {/* Share Link Button */}
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="p-2.5 bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white rounded-xl transition-colors cursor-pointer border border-white/10"
              title="Share a clickable link (Website, Figma, GitHub, etc.)"
            >
              <Link2 className="w-4 h-4 text-brand-teal" />
            </button>

            {/* Main Message Input */}
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={
                activeMode === 'team'
                  ? `Message ${currentConversation?.clientName || 'Client'} directly...`
                  : "Type a message or paste any link (https://...)"
              }
              className="flex-1 bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal font-sans"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isSending || !messageInput.trim()}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black rounded-xl font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>

      {/* ========================================================
          LINK SHARING MODAL
          ======================================================== */}
      {showLinkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b101d] border border-white/15 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl font-sans text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-brand-teal font-bold text-sm">
                <Link2 className="w-4 h-4" />
                <span>Share Clickable Link</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-mono mb-1">Link URL (required) *</label>
                <input
                  type="url"
                  required
                  value={linkUrlInput}
                  onChange={(e) => setLinkUrlInput(e.target.value)}
                  placeholder="https://github.com/org/repo or https://example.com"
                  className="w-full p-2.5 bg-black/60 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-mono mb-1">Link Title / Label (optional)</label>
                <input
                  type="text"
                  value={linkTitleInput}
                  onChange={(e) => setLinkTitleInput(e.target.value)}
                  placeholder="e.g. Frontend Wireframes / Repository Demo"
                  className="w-full p-2.5 bg-black/60 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl text-xs font-mono cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                disabled={!linkUrlInput.trim()}
                className="px-4 py-1.5 bg-brand-teal hover:bg-brand-teal/90 text-brand-dark font-bold rounded-xl text-xs font-mono cursor-pointer disabled:opacity-40"
              >
                Add Link to Chat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
