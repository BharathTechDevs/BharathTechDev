import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, RefreshCcw, Truck, FileText, Lock, Info, Mail, 
  Building, Phone, Youtube, Twitter, Instagram, Clock, ClipboardCheck,
  Globe, Cpu, GraduationCap, AlertTriangle, CheckCircle2, HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface PoliciesProps {
  initialTab?: string;
}

export default function Policies({ initialTab = 'terms' }: PoliciesProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const tabs = [
    { id: 'about-brand', label: '🏢 About Us & Info', icon: Info, desc: 'Trade Name, Legal Name, and Business Scope' },
    { id: 'terms', label: '📜 Terms & Conditions', icon: FileText, desc: 'Website rules, licenses, and intellectual property' },
    { id: 'privacy', label: '🔒 Privacy Policy', icon: Lock, desc: 'Data security, storage, and customer confidentiality' },
    { id: 'refund', label: '💸 Return & Refund Policy', icon: RefreshCcw, desc: 'Services non-refundability & 3-day workshop rules' },
    { id: 'cancellation', label: '🚫 Cancellation Policy', icon: ShieldAlert, desc: 'Order cancellations and duplicate payment resolution' },
    { id: 'shipping', label: '🚚 Delivery Policy', icon: Truck, desc: 'Instant email delivery & digital asset handoffs' },
    { id: 'contact-info', label: '📞 Corporate & Contact', icon: Mail, desc: 'Official company details, email support & SLA' }
  ];

  return (
    <section className="py-20 bg-brand-dark/95 relative overflow-hidden min-h-screen">
      {/* Background Lights & Glows */}
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-brand-teal/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-brand-coral/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono mb-4">
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>LEGAL & POLICY CENTER</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight mb-4">
            Rules & <span className="text-brand-teal">Policies</span> ⚖️
          </h2>
          <p className="text-gray-400 font-sans font-light text-base sm:text-lg">
            Review the official business guidelines, terms of service, payment policies, and refund frameworks for <strong className="text-white">S-CODERS</strong>.
          </p>
        </div>

        {/* Dynamic Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar Tabs Selector */}
          <div className="lg:col-span-4 space-y-2 bg-brand-card/40 border border-white/5 p-4 rounded-3xl backdrop-blur-md">
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider pl-2 mb-2">POLICIES INDEX</p>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-2xl text-left transition-all duration-300 focus:outline-none cursor-pointer group ${
                    isActive 
                      ? 'bg-brand-teal/10 border border-brand-teal/20 text-white' 
                      : 'border border-transparent hover:bg-white/[2%] text-gray-400 hover:text-white'
                  }`}
                >
                  <div>
                    <h4 className="font-display font-bold text-sm tracking-wide">{tab.label}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{tab.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Policy Content Panel */}
          <div className="lg:col-span-8 bg-brand-card/30 border border-white/5 rounded-3xl p-6 sm:p-10 backdrop-blur-md relative min-h-[500px]">
            
            {/* ABOUT US & BUSINESS INFO */}
            {activeTab === 'about-brand' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-white/5">
                  <div>
                    <h3 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                      🏢 About Us & Business Information
                    </h3>
                    <p className="text-brand-teal font-mono text-[11px] tracking-widest uppercase mt-1">S-CODERS Official Business Identity</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono text-[10px] w-fit">
                    <Clock className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Last Updated: August 2026</span>
                  </div>
                </div>

                <div className="text-gray-300 font-sans text-sm leading-relaxed space-y-6">
                  {/* Business Card */}
                  <div className="bg-brand-dark/50 border border-white/10 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-mono text-brand-teal uppercase tracking-widest font-bold">🏢 Official Business Parameters</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500 block font-mono uppercase text-[10px]">Trade Name:</span>
                        <strong className="text-white text-sm">S-CODERS</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block font-mono uppercase text-[10px]">Legal Name:</span>
                        <strong className="text-white text-sm">Shreyas.M</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block font-mono uppercase text-[10px]">Business Category:</span>
                        <strong className="text-white text-sm">Digital Products & Services</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block font-mono uppercase text-[10px]">Website URL:</span>
                        <a href="https://www.s-coders.com" target="_blank" rel="noopener noreferrer" className="text-brand-teal font-mono font-bold hover:underline text-sm">
                          www.s-coders.com
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span>👋 Who We Are</span>
                    </h4>
                    <p className="text-gray-400 leading-relaxed">
                      <strong className="text-white">S-CODERS</strong> is a high-velocity software engineering studio and digital products platform founded in Bengaluru, India. Directed by tech-savvy engineers, we specialize in building modern web platforms, mobile applications, AI agent systems, n8n workflow automations, and hosting live developer masterclasses.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span>🎯 Our Mission</span>
                    </h4>
                    <p className="text-gray-400 leading-relaxed">
                      We believe that powerful software tools should be elegant, high-performing, and accessible. Our mission is to engineer robust software architectures, automate complex workflows, and deliver hands-on technical masterclasses that help creators, students, and businesses achieve maximum efficiency with zero friction.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span>💼 Nature of Business</span>
                    </h4>
                    <p className="text-gray-400 leading-relaxed">
                      <strong className="text-white">S-CODERS</strong> deals exclusively in digital products, software engineering services, custom web/app builds, and live technical workshops delivered electronically. <strong className="text-brand-teal">No physical merchandise is sold or shipped.</strong>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span>📦 What We Offer</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="bg-white/5 border border-white/5 p-3.5 rounded-xl">
                        <div className="font-bold text-white text-xs mb-1">🛠️ Software & AI Engineering Services</div>
                        <p className="text-gray-400 text-xs">Custom Web Platforms, Mobile Apps, n8n Automation, & Gemini AI Workflows.</p>
                      </div>
                      <div className="bg-white/5 border border-white/5 p-3.5 rounded-xl">
                        <div className="font-bold text-white text-xs mb-1">🎓 Tech Workshops & Masterclasses</div>
                        <p className="text-gray-400 text-xs">Live interactive developer sessions, n8n blueprints, and hands-on coding bootcamps.</p>
                      </div>
                      <div className="bg-white/5 border border-white/5 p-3.5 rounded-xl">
                        <div className="font-bold text-white text-xs mb-1">⚡ Digital Resources & Templates</div>
                        <p className="text-gray-400 text-xs">Starter kits, architecture diagrams, and downloadable developer starter packs.</p>
                      </div>
                      <div className="bg-white/5 border border-white/5 p-3.5 rounded-xl">
                        <div className="font-bold text-white text-xs mb-1">🌟 Dedicated Support</div>
                        <p className="text-gray-400 text-xs">Direct technical support and step-by-step guidance for every enrolled client.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TERMS & CONDITIONS */}
            {activeTab === 'terms' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-white/5">
                  <div>
                    <h3 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                      📜 Terms & Conditions
                    </h3>
                    <p className="text-brand-teal font-mono text-[11px] tracking-widest uppercase mt-1">Official Terms of Service for S-CODERS</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono text-[10px] w-fit">
                    <Clock className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Last Updated: August 2026</span>
                  </div>
                </div>

                <div className="text-gray-300 font-sans text-sm leading-relaxed space-y-6">
                  <p className="italic text-gray-400">
                    Welcome to <strong className="text-white">S-CODERS</strong> (www.s-coders.com). These terms and conditions outline the rules and regulations for using our website, digital products, software services, and live technical workshops.
                  </p>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">1.</span> Acceptance of Terms
                    </h4>
                    <p className="text-gray-400 pl-6">
                      By accessing this website or purchasing/booking any digital product, workshop, or software service from S-CODERS, you accept and agree to be bound by these Terms & Conditions. If you do not agree with any part, please do not continue using our website or services.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">2.</span> Corporate Parameters
                    </h4>
                    <div className="pl-6 space-y-1 text-xs text-gray-300 bg-white/5 p-4 rounded-xl border border-white/5">
                      <p><strong className="text-white">Trade Name:</strong> S-CODERS</p>
                      <p><strong className="text-white">Legal Name:</strong> Shreyas.M</p>
                      <p><strong className="text-white">Business Category:</strong> Digital Products & Services</p>
                      <p><strong className="text-white">Website:</strong> www.s-coders.com</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">3.</span> Intellectual Property & Licensing
                    </h4>
                    <div className="text-gray-400 pl-6 space-y-2">
                      <p>
                        Unless otherwise stated, S-CODERS owns the intellectual property rights for all material, course curriculum, automation blueprints, and digital templates on this website. Products purchased are licensed for personal or agreed commercial use only:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-300 pl-2">
                        <li>You <strong className="text-brand-coral">may NOT</strong> redistribute, resell, or share workshop templates or digital assets.</li>
                        <li>You <strong className="text-brand-coral">may NOT</strong> claim S-CODERS templates or codebases as your uncredited original work.</li>
                        <li>You <strong className="text-brand-teal">MAY</strong> modify purchased code or templates for your internal personal or business use.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">4.</span> User Accounts & Registrations
                    </h4>
                    <p className="text-gray-400 pl-6">
                      When claiming free digital resources, registering for masterclasses, or submitting project briefs, you agree to provide accurate, complete information including a valid email address and contact details.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">5.</span> Secure Payments
                    </h4>
                    <p className="text-gray-400 pl-6">
                      All payments are processed securely through verified payment gateways (Razorpay, UPI, PhonePe, GPay). Prices are displayed in Indian Rupees (INR) unless explicitly stated otherwise.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">6.</span> Limitation of Liability
                    </h4>
                    <p className="text-gray-400 pl-6">
                      S-CODERS shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use our products, software builds, or website services.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">7.</span> Governing Law & Jurisdiction
                    </h4>
                    <p className="text-gray-400 pl-6">
                      These terms shall be governed by and construed in accordance with the laws of India, and any legal disputes shall be subject to the exclusive jurisdiction of the courts located in <strong className="text-white">Bengaluru, Karnataka</strong>.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PRIVACY POLICY */}
            {activeTab === 'privacy' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-white/5">
                  <div>
                    <h3 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                      🔒 Privacy Policy
                    </h3>
                    <p className="text-brand-teal font-mono text-[11px] tracking-widest uppercase mt-1">S-CODERS Data Protection & Privacy Shield</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono text-[10px] w-fit">
                    <Clock className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Last Updated: August 2026</span>
                  </div>
                </div>

                <div className="text-gray-300 font-sans text-sm leading-relaxed space-y-6">
                  <p className="italic text-gray-400">
                    At <strong className="text-white">S-CODERS</strong> (accessible from www.s-coders.com), one of our main priorities is the privacy and security of our visitors and clients. This Privacy Policy explains how we collect, use, and safeguard your personal information.
                  </p>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">1.</span> Information We Collect
                    </h4>
                    <div className="pl-6 space-y-3 text-gray-400">
                      <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
                        <strong className="text-white block mb-1">👤 Personal Information:</strong>
                        Name, email address, mobile phone number, and company name provided when claiming free templates, submitting project briefs, or making a purchase.
                      </div>
                      <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
                        <strong className="text-white block mb-1">💳 Payment Information:</strong>
                        Processed securely through Razorpay / official payment gateways. <strong className="text-brand-teal">S-CODERS does not store or view your credit card details, CVV, or bank credentials.</strong>
                      </div>
                      <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
                        <strong className="text-white block mb-1">📊 Usage & Analytics Data:</strong>
                        Pages visited, device type, time spent on site, and system log data used purely for performance optimization.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">2.</span> How We Use Your Information
                    </h4>
                    <div className="pl-6 space-y-1.5 text-gray-400">
                      <p>We use the collected information strictly to:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-300">
                        <li>Process and fulfill your workshop registrations and software service orders.</li>
                        <li>Send instant download links, access keys, and course joining credentials.</li>
                        <li>Respond to your technical inquiries and customer support requests.</li>
                        <li>Improve our software products, website performance, and user experience.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">3.</span> Data Storage & Security
                    </h4>
                    <p className="text-gray-400 pl-6">
                      Your data is stored securely on modern cloud infrastructure (Microsoft Azure / Google Cloud). We implement industry-standard security measures including SSL encryption, secure API access controls, and strict data privacy protocols.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">4.</span> Your Rights
                    </h4>
                    <div className="pl-6 space-y-1 text-gray-300">
                      <p>You have the full right to:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-400">
                        <li>Access your personal data held by us.</li>
                        <li>Request correction of inaccurate or outdated information.</li>
                        <li>Request deletion of your data from our active databases.</li>
                      </ul>
                      <p className="pt-2 text-xs text-gray-500">To exercise these rights, email us at <strong className="text-brand-teal font-mono">scoders82@gmail.com</strong>.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-amber-300 flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">5.</span> Ticket Management & User Deletion Responsibility Clause
                    </h4>
                    <div className="pl-6 bg-amber-500/10 border-l-4 border-amber-400 p-4 rounded-r-2xl space-y-2 text-gray-300">
                      <p className="font-semibold text-white">
                        "If in the case the client will delete their ticket from the ticket option by mistakenly then it will be their responsibility if they will delete purposely or by mistakenly."
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        S-CODERS provides self-service ticket options within your events dashboard allowing participants to view and remove event passes. Once a client deletes their entry pass or ticket record, the QR validation record is wiped from the client's local keychain. S-CODERS bears zero liability for lost, removed, or accidentally deleted passes.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* RETURN & REFUND POLICY */}
            {activeTab === 'refund' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-white/5">
                  <div>
                    <h3 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                      💸 Return & Refund Policy
                    </h3>
                    <p className="text-brand-teal font-mono text-[11px] tracking-widest uppercase mt-1">Strict Rules for Services vs. Live Workshops</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono text-[10px] w-fit">
                    <Clock className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Last Updated: August 2026</span>
                  </div>
                </div>

                <div className="text-gray-300 font-sans text-sm leading-relaxed space-y-6">
                  <p className="font-semibold text-white">
                    Thank you for choosing S-CODERS. Please read our specific refund terms carefully prior to completing any transaction.
                  </p>

                  {/* SERVICE SECTION - STRICT NO REFUND */}
                  <div className="bg-brand-coral/10 border border-brand-coral/30 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-brand-coral font-bold text-base">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <span>🛠️ SERVICE SECTION — STRICT NO REFUND POLICY</span>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      All payments for custom software development, mobile app builds, web platform engineering, n8n automations, AI integrations, or technical consulting booked under our Service section are <strong className="text-white underline">STRICTLY NON-REFUNDABLE ONCE BOOKED</strong>.
                    </p>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      <strong className="text-white">Why No Refunds for Services?</strong> Software engineering involves immediate cognitive allocation, dedicated developer hours, server environment setup, and architecture drafting immediately upon order placement. Therefore, once a service booking or startup deposit is made, <strong className="text-brand-coral">no money will be refunded under any circumstances</strong>.
                    </p>
                  </div>

                  {/* WORKSHOP SECTION - 3-DAY NOTICE RULE */}
                  <div className="bg-brand-teal/10 border border-brand-teal/30 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-brand-teal font-bold text-base">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>🎓 WORKSHOP SECTION — 3-DAY NOTICE REFUND RULE</span>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      For live workshops and developer masterclasses, money will <strong className="text-white underline">ONLY be refunded if the participant contacts or informs S-CODERS at least 3 DAYS (72 HOURS)</strong> prior to the scheduled live workshop start date and time.
                    </p>
                    <div className="bg-brand-dark/60 p-3.5 rounded-xl border border-white/10 space-y-2 text-xs">
                      <p className="text-brand-coral font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Strict Notice Limit:
                      </p>
                      <p className="text-gray-300">
                        If a participant requests a cancellation/refund less than 3 days prior to the event (even if delayed by just 1 day, e.g. 2 days or 1 day before the workshop), <strong className="text-brand-coral">THEIR MONEY WILL NOT BE REFUNDED</strong>.
                      </p>
                      <p className="text-gray-400">
                        <strong className="text-white">Seat Transfer Option:</strong> If you miss the 3-day notice window, you may transfer your active seat to a friend or colleague by notifying support at <span className="text-brand-teal font-mono">scoders82@gmail.com</span> prior to session kick-off.
                      </p>
                    </div>
                  </div>

                  {/* PAYMENT GATEWAY & TECHNICAL FAILURE RESPONSIBILITIES */}
                  <div className="bg-brand-card/50 border border-white/10 p-5 rounded-2xl space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      💳 Payment Gateways & Failure Responsibilities
                    </h4>

                    {/* Case A: Debit on PhonePe/GPay but S-CODERS hasn't received */}
                    <div className="space-y-1.5 bg-white/5 p-4 rounded-xl border border-white/5">
                      <h5 className="font-bold text-xs text-brand-coral flex items-center gap-1.5">
                        <span>📱 Case 1: Amount Debited on PhonePe / GPay / Bank App but NOT Received by S-CODERS</span>
                      </h5>
                      <p className="text-gray-300 text-xs leading-relaxed">
                        If your PhonePe, Google Pay, PayTM, UPI, or Bank app shows that the amount is debited/paid, but <strong className="text-white">S-CODERS has NOT received the payment</strong> in our merchant dashboard (e.g. money stuck in bank clearance or pending gateway hold):
                      </p>
                      <p className="text-brand-coral text-xs font-bold pt-1">
                        👉 This is the customer's and their issuing bank / payment provider's responsibility, NOT S-CODERS'.
                      </p>
                      <p className="text-gray-400 text-[11px]">
                        S-CODERS cannot issue refunds or grant access for transactions where funds have not settled into our official account. In such cases, please contact your issuing bank or UPI app support with the UTR number for an automatic banking reversal.
                      </p>
                    </div>

                    {/* Case B: Unable to pay on website */}
                    <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
                      <h5 className="font-bold text-xs text-brand-teal flex items-center gap-1.5">
                        <span>🌐 Case 2: Technical Payment Failure On Our Website Itself</span>
                      </h5>
                      <p className="text-gray-300 text-xs leading-relaxed">
                        If you are <strong className="text-white">unable to complete the payment on the website itself</strong> due to a website bug, portal breakdown, or checkout error:
                      </p>
                      <p className="text-brand-teal text-xs font-bold pt-1">
                        👉 Please reach out to Customer Care (`scoders82@gmail.com`) or join our Official WhatsApp Support Group. In this scenario, S-CODERS takes FULL RESPONSIBILITY.
                      </p>
                      <p className="text-gray-400 text-[11px]">
                        Our customer care team will verify your account details, guide you through an alternate verified booking channel, or ensure your seat/service is logged without any extra charge.
                      </p>
                      <div className="pt-2">
                        <a
                          href="https://chat.whatsapp.com/Dp1kVXukz0B3KXQq3FTuId?s=cl&p=a&mlu=4"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-emerald-400 text-black rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Join Customer Care WhatsApp Group</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="font-display font-bold text-sm text-white">Need Assistance With a Booking?</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      For any questions regarding our return and refund policy, email us with your order/claim ID at <strong className="text-brand-teal font-mono">scoders82@gmail.com</strong> or contact our customer support team directly via our <a href="https://chat.whatsapp.com/Dp1kVXukz0B3KXQq3FTuId?s=cl&p=a&mlu=4" target="_blank" rel="noopener noreferrer" className="text-[#25D366] font-bold hover:underline">Official WhatsApp Community</a>.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CANCELLATION POLICY */}
            {activeTab === 'cancellation' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-white/5">
                  <div>
                    <h3 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                      🚫 Cancellation Policy
                    </h3>
                    <p className="text-brand-teal font-mono text-[11px] tracking-widest uppercase mt-1">Cancellation Windows & Duplicate Order Guidelines</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono text-[10px] w-fit">
                    <Clock className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Last Updated: August 2026</span>
                  </div>
                </div>

                <div className="text-gray-300 font-sans text-sm leading-relaxed space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">1.</span> Service Order Cancellations
                    </h4>
                    <p className="text-gray-400 pl-6">
                      Because our custom software development services begin immediate resource allocation and architecture drafting upon payment, <strong className="text-brand-coral">service orders cannot be cancelled for a refund once processed</strong>.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">2.</span> Workshop Cancellations Duration
                    </h4>
                    <p className="text-gray-400 pl-6">
                      Workshop cancellations must be submitted <strong className="text-white">at least 3 days (72 hours) before the event</strong> to qualify for a full refund. Cancellation requests received within 3 days of the workshop start time cannot be processed or refunded.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">3.</span> Duplicate Orders
                    </h4>
                    <p className="text-gray-400 pl-6">
                      If you accidentally place a duplicate order for the exact same workshop or digital product, please contact us immediately at <strong className="text-brand-teal font-mono">scoders82@gmail.com</strong> with your transaction receipts and claim IDs within 24 hours for a duplicate payment reversal.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">4.</span> Contact Before Purchase
                    </h4>
                    <p className="text-gray-400 pl-6">
                      Please ensure you review your selection, course topics, or project scope carefully before completing payment. For pre-purchase clarifications, reach out to <strong className="text-brand-teal font-mono">scoders82@gmail.com</strong>.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DELIVERY POLICY */}
            {activeTab === 'shipping' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-white/5">
                  <div>
                    <h3 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                      🚚 Delivery Policy
                    </h3>
                    <p className="text-brand-teal font-mono text-[11px] tracking-widest uppercase mt-1">Instant Electronic Handoff & Zero Shipping Fees</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono text-[10px] w-fit">
                    <Clock className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Last Updated: August 2026</span>
                  </div>
                </div>

                <div className="text-gray-300 font-sans text-sm leading-relaxed space-y-6">
                  <p className="italic text-gray-400">
                    <strong className="text-white">S-CODERS</strong> deals exclusively in digital goods, software architectures, downloadable assets, and live technical coaching. Zero physical merchandise shipping is required.
                  </p>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">1.</span> Delivery Method
                    </h4>
                    <p className="text-gray-400 pl-6">
                      All products and workshop accesses are delivered digitally via email or direct repository transfer. Upon successful payment or claim, you receive an email containing:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 pl-8">
                      <li>A secure, verified access or download link / joining credential</li>
                      <li>Detailed instructions for accessing your workshop live room or code assets</li>
                      <li>Your official order/claim ID for future reference</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">2.</span> Delivery Duration
                    </h4>
                    <p className="text-gray-400 pl-6">
                      <strong className="text-white">Instant Electronic Delivery:</strong> Most customers receive their workshop confirmation email and access links within <strong className="text-brand-teal">5 to 10 minutes</strong> of a successful transaction.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">3.</span> Zero Shipping Costs
                    </h4>
                    <p className="text-gray-400 pl-6">
                      Since all products and services are 100% digital, there are <strong className="text-white">zero shipping costs</strong> associated with any purchase on our website.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">4.</span> Help With Electronic Delivery
                    </h4>
                    <div className="text-gray-400 pl-6 space-y-2">
                      <p>If you don't receive your access email within 15 minutes of payment:</p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-300 pl-2">
                        <li>Check your email spam/junk folder.</li>
                        <li>Verify that the email address entered during checkout was correct.</li>
                        <li>Contact us at <strong className="text-brand-teal font-mono">scoders82@gmail.com</strong> with your order ID or payment screenshot for immediate manual dispatch.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CORPORATE & CONTACT */}
            {activeTab === 'contact-info' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-white/5">
                  <div>
                    <h3 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                      📞 Corporate Information & Contact Us
                    </h3>
                    <p className="text-brand-teal font-mono text-[11px] tracking-widest uppercase mt-1">Official Coordinates & Support Desk</p>
                  </div>
                </div>

                <div className="text-gray-300 font-sans text-sm leading-relaxed space-y-6">
                  
                  {/* Corporate Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-brand-dark/50 border border-white/10 p-5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-brand-teal">
                        <Building className="w-5 h-5 shrink-0" />
                        <h4 className="font-display font-bold text-sm text-white">📍 Business Information</h4>
                      </div>
                      <div className="text-xs text-gray-300 space-y-1.5 font-mono">
                        <p><span className="text-gray-500 uppercase">Trade Name:</span> S-CODERS</p>
                        <p><span className="text-gray-500 uppercase">Legal Name:</span> Shreyas.M</p>
                        <p><span className="text-gray-500 uppercase">Category:</span> Digital Products & Services</p>
                        <p><span className="text-gray-500 uppercase">Website:</span> www.s-coders.com</p>
                        <p><span className="text-gray-500 uppercase">Location:</span> Bengaluru, Karnataka, India</p>
                      </div>
                    </div>

                    <div className="bg-brand-dark/50 border border-white/10 p-5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-brand-teal">
                        <Mail className="w-5 h-5 shrink-0" />
                        <h4 className="font-display font-bold text-sm text-white">📧 Get In Touch</h4>
                      </div>
                      <div className="text-xs text-gray-300 space-y-1.5 font-mono">
                        <p>
                          <span className="text-gray-500 uppercase block">Official Email:</span>
                          <a href="mailto:scoders82@gmail.com" className="text-brand-teal font-bold hover:underline">scoders82@gmail.com</a>
                        </p>
                        <p>
                          <span className="text-gray-500 uppercase block">Official WhatsApp Group:</span>
                          <a href="https://chat.whatsapp.com/Dp1kVXukz0B3KXQq3FTuId?s=cl&p=a&mlu=4" target="_blank" rel="noopener noreferrer" className="text-[#25D366] font-bold hover:underline">Join S-CODERS WhatsApp Channel</a>
                        </p>
                        <p>
                          <span className="text-gray-500 uppercase block">Response Time:</span>
                          <span className="text-white">Within 24 business hours</span>
                        </p>
                        <p>
                          <span className="text-gray-500 uppercase block">Primary Contact / WhatsApp:</span>
                          <a href="https://chat.whatsapp.com/Dp1kVXukz0B3KXQq3FTuId?s=cl&p=a&mlu=4" target="_blank" rel="noopener noreferrer" className="text-brand-teal font-bold hover:underline">+91 6363905989</a>
                        </p>
                        <p>
                          <span className="text-gray-500 uppercase block">Second Number / Direct Line:</span>
                          <a href="tel:+918310463417" className="text-brand-teal font-bold hover:underline">+91 8310463417</a>
                        </p>
                        <p>
                          <span className="text-gray-500 uppercase block">YouTube Channel:</span>
                          <a href="https://www.youtube.com/@S-CODERS" target="_blank" rel="noopener noreferrer" className="text-white hover:text-brand-teal">@S-CODERS</a>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Checklist Before Contacting */}
                  <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-3">
                    <h4 className="font-display font-bold text-sm text-white flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-brand-teal" />
                      📋 Before Contacting Us For Support
                    </h4>
                    <p className="text-xs text-gray-400">For faster resolution of your inquiry, please include:</p>
                    <ul className="list-disc list-inside text-xs text-gray-300 space-y-1 pl-2">
                      <li>Your Order or Claim ID (if applicable)</li>
                      <li>Email address used during purchase/checkout</li>
                      <li>Clear description of your question or issue (with screenshot if payment related)</li>
                    </ul>
                  </div>

                  {/* Verified Social Handles */}
                  <div className="pt-4 border-t border-white/5">
                    <h4 className="font-display font-bold text-sm text-white mb-3">Verified S-CODERS Channels</h4>
                    <div className="flex flex-wrap gap-3">
                      <a 
                        href="https://www.youtube.com/@S-CODERS" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-brand-teal/10 hover:text-brand-teal border border-white/5 rounded-xl text-xs font-mono transition-all duration-300"
                      >
                        <Youtube className="w-4 h-4 text-red-500" />
                        <span>YouTube (@S-CODERS)</span>
                      </a>
                      <a 
                        href="https://www.instagram.com/scoders2025?igsh=Ym1jcG01czR1MHdj" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-brand-teal/10 hover:text-brand-teal border border-white/5 rounded-xl text-xs font-mono transition-all duration-300"
                      >
                        <Instagram className="w-4 h-4 text-pink-500" />
                        <span>Instagram (@scoders2025)</span>
                      </a>
                      <a 
                        href="https://x.com/SCODERSozws" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-brand-teal/10 hover:text-brand-teal border border-white/5 rounded-xl text-xs font-mono transition-all duration-300"
                      >
                        <Twitter className="w-4 h-4 text-sky-400" />
                        <span>X / Twitter (@SCODERSozws)</span>
                      </a>
                      <a 
                        href="https://chat.whatsapp.com/Dp1kVXukz0B3KXQq3FTuId?s=cl&p=a&mlu=4" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-black border border-[#25D366]/30 rounded-xl text-xs font-mono font-bold transition-all duration-300"
                      >
                        <Phone className="w-4 h-4 text-[#25D366]" />
                        <span>WhatsApp Official Community Group</span>
                      </a>
                      <a 
                        href="https://wa.me/918310463417" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-brand-teal/10 hover:text-brand-teal border border-white/5 rounded-xl text-xs font-mono transition-all duration-300"
                      >
                        <Phone className="w-4 h-4 text-brand-teal" />
                        <span>Second Line (8310463417)</span>
                      </a>
                      <a 
                        href="mailto:scoders82@gmail.com" 
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-brand-teal/10 hover:text-brand-teal border border-white/5 rounded-xl text-xs font-mono transition-all duration-300 text-white"
                      >
                        <Mail className="w-4 h-4 text-brand-teal" />
                        <span>scoders82@gmail.com</span>
                      </a>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
