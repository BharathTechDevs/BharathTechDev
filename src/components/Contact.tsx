import React, { useState } from 'react';
import { 
  Mail, MessageSquare, Send, CheckCircle, ChevronDown, ChevronUp,
  Instagram, MessageCircle, Youtube, Twitter, Linkedin, Github, MapPin, 
  Sparkles, ShieldCheck, Phone, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FAQS } from '../data';
import { GeneralMessage } from '../types';

export default function Contact() {
  // FAQs Accordion state
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState('project');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [savedMessages, setSavedMessages] = useState<GeneralMessage[]>(() => {
    const saved = localStorage.getItem('scoders_messages');
    return saved ? JSON.parse(saved) : [];
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    const newMessage: GeneralMessage = {
      id: Date.now().toString(),
      name,
      email,
      company: company || 'Self / Individual',
      phone: phone || 'Not Provided',
      message,
      interest,
      timestamp: new Date().toLocaleDateString(),
    };

    const updated = [newMessage, ...savedMessages];
    setSavedMessages(updated);
    localStorage.setItem('scoders_messages', JSON.stringify(updated));

    setSubmitted(true);
    
    // Reset Form
    setName('');
    setEmail('');
    setCompany('');
    setPhone('');
    setMessage('');
    setInterest('project');
  };

  const socialLinks = [
    { name: 'Service WhatsApp Group', icon: <MessageCircle className="w-5 h-5" />, href: 'https://chat.whatsapp.com/CgksCDeW7LnINcEvGwn7kK', color: 'hover:text-[#25d366] hover:border-[#25d366] text-[#25d366]' },
    { name: 'Customer Care Support', icon: <MessageCircle className="w-5 h-5" />, href: 'https://chat.whatsapp.com/Dp1kVXukz0B3KXQq3FTuId?s=cl&p=a&mlu=4&ilr=4', color: 'hover:text-[#25d366] hover:border-[#25d366] text-[#25d366]' },
    { name: 'Email Support', icon: <Mail className="w-5 h-5" />, href: 'mailto:scoders82@gmail.com', color: 'hover:text-brand-teal hover:border-brand-teal' },
    { name: 'WhatsApp (Bhuvan)', icon: <MessageCircle className="w-5 h-5" />, href: 'https://wa.me/916363905989', color: 'hover:text-[#25d366] hover:border-[#25d366]' },
    { name: 'WhatsApp (Shreyas)', icon: <MessageCircle className="w-5 h-5" />, href: 'https://wa.me/918310463417', color: 'hover:text-[#25d366] hover:border-[#25d366]' },
    { name: 'Instagram', icon: <Instagram className="w-5 h-5" />, href: 'https://www.instagram.com/scoders2025?igsh=Ym1jcG01czR1MHdj', color: 'hover:text-[#e4405f] hover:border-[#e4405f]' },
    { name: 'YouTube', icon: <Youtube className="w-5 h-5" />, href: 'https://www.youtube.com/@S-CODERS', color: 'hover:text-[#ff0000] hover:border-[#ff0000]' },
    { name: 'Twitter / X', icon: <Twitter className="w-5 h-5" />, href: 'https://x.com/SCODERSozws', color: 'hover:text-[#1da1f2] hover:border-[#1da1f2]' },
    { name: 'LinkedIn', icon: <Linkedin className="w-5 h-5" />, href: 'https://linkedin.com/company/scoders', color: 'hover:text-[#0a66c2] hover:border-[#0a66c2]' },
  ];

  const interestOptions = [
    { value: 'project', label: 'Custom Software Development' },
    { value: 'collaboration', label: 'Technical Collaboration' },
    { value: 'workshop', label: 'Host a Workshop' },
    { value: 'internship', label: 'Apply for Internship / Team' },
    { value: 'enquiry', label: 'General Business Enquiry' },
  ];

  return (
    <section id="contact" className="py-24 bg-brand-dark relative overflow-hidden">
      {/* Lights & Effects */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] ambient-glow rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[300px] h-[300px] ambient-coral-glow rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono mb-4">
            <Mail className="w-3.5 h-3.5" />
            <span>CONNECT WITH S-CODERS • BHARAT TECH DEVELOPERS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight mb-6">
            Let’s Engineer Your <span className="text-brand-teal">Next Breakthrough</span>
          </h2>
          <p className="text-gray-400 font-sans font-light text-lg">
            Have an application concept, a custom automation criteria, or want to host a coding session? Reach out to Shreyas & the S-CODERS • Bharat Tech Developers team.
          </p>
        </div>

        {/* Contact info grid & Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-24">
          
          {/* LEFT: Contact Coordinates & Platforms */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Quick Pitch card */}
            <div className="glass-panel p-8 rounded-3xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 text-brand-teal/10">
                <Sparkles className="w-16 h-16" />
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-4">S-CODERS • BHARAT TECH HQ</h3>
              <p className="text-gray-400 font-sans font-light text-sm sm:text-base leading-relaxed mb-6">
                Based out of the tech capital of India, S-CODERS • Bharat Tech Developers operates inside Bengaluru’s vibrant startup network.
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-3 text-sm font-sans font-light text-gray-300">
                  <MapPin className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                  <span>Bengaluru, Karnataka, India</span>
                </div>
                
                {/* Bhuvan M - Tech Lead */}
                <div className="flex gap-3 text-sm font-sans text-gray-300">
                  <Phone className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-mono uppercase text-brand-teal font-bold block">Bhuvan M • Tech Lead (+91 6363905989)</span>
                    <div className="flex items-center gap-3 mt-0.5">
                      <a href="tel:+916363905989" className="hover:text-brand-teal font-bold font-mono transition-colors">+91 6363905989</a>
                      <a href="https://wa.me/916363905989" target="_blank" rel="noopener noreferrer" className="text-[#25D366] text-xs font-mono hover:underline flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>Chat on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Shreyas M - Founder & CEO */}
                <div className="flex gap-3 text-sm font-sans text-gray-300">
                  <Phone className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-mono uppercase text-gray-400 font-bold block">Shreyas M • Founder & CEO (+91 8310463417)</span>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <a href="tel:+918310463417" className="hover:text-brand-teal font-mono transition-colors">+91 8310463417</a>
                      <a href="https://wa.me/918310463417" target="_blank" rel="noopener noreferrer" className="text-[#25D366] text-xs font-mono hover:underline flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>Chat on WhatsApp</span>
                      </a>
                      <a href="https://github.com/shreyasshreyas40858-max/Chaturya" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white text-xs font-mono hover:underline flex items-center gap-1">
                        <Github className="w-3 h-3 text-white" />
                        <span>GitHub</span>
                      </a>
                      <a href="https://www.linkedin.com/in/shreyas-shreyas-97187638b?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noopener noreferrer" className="text-[#38bdf8] text-xs font-mono hover:underline flex items-center gap-1">
                        <Linkedin className="w-3 h-3" />
                        <span>LinkedIn</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 text-sm font-sans font-light text-gray-300">
                  <Mail className="w-5 h-5 text-brand-coral shrink-0 mt-0.5" />
                  <a href="mailto:scoders82@gmail.com" className="hover:text-brand-teal transition-colors">scoders82@gmail.com</a>
                </div>

                {/* Instant Service WhatsApp Group & Support Card */}
                <div className="pt-2">
                  <a
                    href="https://chat.whatsapp.com/CgksCDeW7LnINcEvGwn7kK"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-[#25D366] hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-black" />
                    <span>Service WhatsApp Group</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Official social platforms links */}
            <div className="space-y-4">
              <h4 className="font-display font-bold text-sm uppercase tracking-widest text-gray-400 pl-2">Official Platforms</h4>
              <div className="grid grid-cols-2 gap-3">
                {socialLinks.map((link, idx) => (
                  <motion.a
                    key={idx}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 bg-brand-card/40 hover:bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3 text-sm font-medium text-gray-300 transition-all duration-300 ${link.color} cursor-pointer`}
                  >
                    <div className="shrink-0">{link.icon}</div>
                    <span>{link.name}</span>
                  </motion.a>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT: Elegant interactive Enquiry & Contact Form */}
          <div className="lg:col-span-7">
            <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/5 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal via-brand-accent to-brand-coral" />
              
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-10"
                >
                  <div className="w-16 h-16 bg-brand-teal/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-teal/20">
                    <CheckCircle className="w-8 h-8 text-brand-teal" />
                  </div>
                  <h3 className="font-display font-extrabold text-white text-2xl mb-3">Enquiry Registered!</h3>
                  <p className="text-gray-400 text-sm font-sans font-light max-w-md mx-auto mb-6">
                    Your request has been successfully saved to our Bengaluru dispatch database. Shreyas M. or an S-CODERS • Bharat Tech Developers lead coordinator will reach out to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 bg-brand-teal text-brand-dark font-bold text-xs rounded-full font-mono uppercase tracking-wider hover:bg-white transition-colors"
                  >
                    Submit Another Inquiry
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div>
                    <h3 className="font-display font-bold text-xl text-white mb-2">Submit an Inquiry</h3>
                    <p className="text-gray-500 text-xs font-sans">Fill out the fields to discuss integrations, workshop collaborations, or career opportunities.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rohan Hegde"
                        className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. rohan@gmail.com"
                        className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Company / Institution (Optional)</label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. eChai Ventures"
                        className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Phone / WhatsApp (Optional)</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">What are you looking to discuss? *</label>
                    <select
                      value={interest}
                      onChange={(e) => setInterest(e.target.value)}
                      className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-teal transition-colors cursor-pointer"
                    >
                      {interestOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-brand-card text-white">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Your Message & Context *</label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Give us a brief description of your project scope, ideal timelines, or proposed collaboration targets..."
                      className="w-full bg-brand-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal transition-colors resize-none"
                    />
                  </div>

                  {/* Security Compliance badge info */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-sans">
                    <ShieldCheck className="w-4 h-4 text-brand-teal shrink-0" />
                    <span>Your data is securely locked. We respect direct developer-to-client privacy guidelines.</span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full px-6 py-4 bg-brand-teal text-brand-dark font-bold rounded-xl hover:bg-white active:scale-95 transition-all duration-300 text-sm flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      Transmit Proposal
                      <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>

        {/* FAQS ACCORDION */}
        <div className="max-w-4xl mx-auto pt-16 border-t border-white/5">
          <div className="text-center mb-12">
            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white">Frequently Answered Queries</h3>
            <p className="text-gray-500 text-xs font-mono uppercase tracking-wider mt-1">Instant details regarding S-CODERS operations</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="glass-panel rounded-2xl border border-white/5 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between text-white hover:text-brand-teal transition-colors font-display font-bold text-sm sm:text-base cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {openFaqIdx === idx ? (
                    <ChevronUp className="w-5 h-5 text-brand-teal" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {openFaqIdx === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-6 pb-6 pt-1 text-gray-400 font-sans font-light text-sm leading-relaxed border-t border-white/5">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
