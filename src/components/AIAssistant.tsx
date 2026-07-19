import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, X, Send, Bot, Sparkles, AlertCircle, RefreshCw, 
  ChevronRight, Laptop, HelpCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Hello! Welcome to S-CODERS. I am your AI Consulting Agent, designed by Suhas Gowda and our engineering team in Bengaluru.\n\nHow can I assist you today? I can help you explore our AI Agent, mobile, and web development services, explain our tech stack, or outline our upcoming workshops!",
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    // Add user message
    const updatedMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: messages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to communicate with S-CODERS agent.");
      }

      setMessages([...updatedMessages, { role: 'model', content: data.response }]);
    } catch (err: any) {
      console.error(err);
      // Fallback response inside offline mode
      const offlineFallback = getOfflineResponse(text);
      setMessages([...updatedMessages, { role: 'model', content: offlineFallback }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper pre-curated responses if Gemini API keys are missing or network fails
  const getOfflineResponse = (query: string): string => {
    const lower = query.toLowerCase();
    if (lower.includes('price') || lower.includes('cost') || lower.includes('budget') || lower.includes('charge')) {
      return "S-CODERS designs every software asset on a customized basis. Standard webpage configurations start at ₹15,000 (~$200), high-end Next.js corporate engines at ₹40,000 (~$500), and full-scale iOS/Android React Native applications from ₹1,00,000 (~$1,200). Write your parameters on our **Services spec builder** to get a detailed PDF quote!";
    }
    if (lower.includes('workshops') || lower.includes('seminar') || lower.includes('teach') || lower.includes('college')) {
      return "We love community coding! S-CODERS hosts active workshops on n8n Workflow automation, Gemini model integration, and React Native. Recent sessions took place at **Microsoft Reactor Bangalore** and **RV College**. Leave feedback or drop an enquiry inside our Workshop segment below!";
    }
    if (lower.includes('team') || lower.includes('founder') || lower.includes('suhas') || lower.includes('who are you')) {
      return "S-CODERS was established by **Suhas Gowda (Chief AI Architect)** to engineer top-tier automation frameworks. Our core Bengaluru squad consists of Prathiksha R (Head of UX/UI), Manoj Kumar (Lead Full-Stack), and Aishwarya Shenoy (Workshop Lead). Check out the Crew section on our page!";
    }
    if (lower.includes('services') || lower.includes('build') || lower.includes('develop')) {
      return "We specialize in three main pillars:\n\n1. **AI Agent Development**: Custom LLM chaining, n8n automations, WhatsApp auto-bots.\n2. **Mobile App Dev**: Beautiful cross-platform apps using React Native and Firebase.\n3. **Web Platforms**: Pixel-perfect SaaS dashboards and highly interactive landing pages built in Next.js.\n\nUse our interactive buttons under the Services heading to register specs!";
    }
    return "S-CODERS AI Agent is currently operating in local demonstration mode because the host API keys are initializing. However, we are ready to build! S-CODERS provides premium AI Agent development, React Native mobile apps, and Next.js web applications in Bengaluru. Please fill out our contact form or ping us on WhatsApp so we can arrange an in-person tech demo.";
  };

  // Pre-scripted questions for faster visitor UX
  const suggestedQuestions = [
    "What services do you offer?",
    "Tell me about S-CODERS team.",
    "Details about Microsoft Reactor Workshop.",
    "Estimate budget for a React Native App.",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="fixed bottom-6 right-6 w-full max-w-md h-[550px] bg-brand-card/95 border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden backdrop-blur-xl"
        >
          {/* Header branding */}
          <div className="p-4 bg-brand-dark/80 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-brand-teal/10 rounded-lg text-brand-teal border border-brand-teal/20 animate-pulse">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono text-brand-teal uppercase tracking-widest font-bold">S-CODERS Agent</div>
                <div className="text-[10px] text-gray-500 font-sans">Active tech consultant</div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat workspace area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Visual icon for model */}
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-bold flex items-center justify-center shrink-0">
                    S
                  </div>
                )}
                
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm font-sans font-light leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-brand-teal text-brand-dark rounded-br-none font-medium'
                      : 'bg-white/5 text-gray-200 border border-white/5 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Spinner loading logic */}
            {isLoading && (
              <div className="flex gap-3 max-w-[80%] mr-auto">
                <div className="w-7 h-7 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-bold flex items-center justify-center shrink-0 animate-spin">
                  <RefreshCw className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-2xl rounded-bl-none text-xs text-gray-400 font-sans flex items-center gap-2">
                  <span>Drafting technical specs</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}

            <div ref={messageEndRef} />
          </div>

          {/* Suggested Prompts Grid */}
          {messages.length === 1 && !isLoading && (
            <div className="px-4 py-2 border-t border-white/5 bg-brand-dark/30 space-y-1.5">
              <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest pl-1">Suggested prompts:</div>
              <div className="grid grid-cols-2 gap-1.5">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="text-left px-2.5 py-1.5 bg-white/5 border border-white/5 hover:border-brand-teal/20 text-[10px] text-gray-300 rounded-lg font-sans font-light transition-all hover:bg-brand-teal/5 text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form input messaging controls */}
          <div className="p-4 bg-brand-dark/80 border-t border-white/5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask S-CODERS about services or tech..."
                className="flex-1 bg-brand-card border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal transition-colors"
              />
              <button
                type="submit"
                className="p-3 bg-brand-teal hover:bg-white text-brand-dark rounded-xl transition-all duration-300 shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
