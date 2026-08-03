import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, RefreshCcw, Truck, FileText, Lock, Info, Mail, 
  Building, Phone, Youtube, Twitter, Instagram, ChevronRight, Clock, ClipboardCheck,
  Globe, Cpu, GraduationCap, CheckCircle
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
    { id: 'terms', label: 'Terms & Conditions', icon: FileText, desc: 'Usage rights, project codes, and intellectual property' },
    { id: 'privacy', label: 'Privacy Policy', icon: Lock, desc: 'Data security, storage, and partner confidentiality' },
    { id: 'refund', label: 'Return & Refund', icon: RefreshCcw, desc: 'Software sprints, deposits, and workshop seats transfer' },
    { id: 'cancellation', label: 'Cancellation Policy', icon: ShieldAlert, desc: 'Project milestone holds and scheduling guidelines' },
    { id: 'shipping', label: 'Delivery Policy', icon: Truck, desc: 'Digital repository transfers and live workshop access' },
    { id: 'about-brand', label: 'About BTD', icon: Info, desc: 'Founder info, engineering values, and our vision' },
    { id: 'contact-info', label: 'Corporate & Contact', icon: Mail, desc: 'Official company coordinates and support SLA' }
  ];

  return (
    <section className="py-20 bg-brand-dark/95 relative overflow-hidden min-h-screen">
      {/* Lights & Effects */}
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-brand-teal/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-brand-coral/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-mono mb-4">
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>LEGAL CENTER</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight mb-4">
            Rules & <span className="text-brand-teal">Policies</span>
          </h2>
          <p className="text-gray-400 font-sans font-light text-base sm:text-lg">
            Review the official legal framework, business guidelines, and digital products terms of service for S-CODERS • Bharath Tech Developers.
          </p>
        </div>

        {/* Dynamic Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar Tabs Selector */}
          <div className="lg:col-span-4 space-y-3 bg-brand-card/40 border border-white/5 p-4 rounded-3xl backdrop-blur-md">
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider pl-2 mb-2">POLICIES INDEX</p>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl text-left transition-all duration-300 focus:outline-none cursor-pointer group ${
                    isActive 
                      ? 'bg-brand-teal/10 border border-brand-teal/20 text-white' 
                      : 'border border-transparent hover:bg-white/[2%] text-gray-400 hover:text-white'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-colors shrink-0 ${
                    isActive ? 'bg-brand-teal/20 text-brand-teal' : 'bg-white/5 text-gray-500 group-hover:text-gray-300'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
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
            
            {activeTab === 'terms' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-white/5">
                  <div>
                    <h3 className="font-display font-bold text-2xl text-white">Terms & Conditions</h3>
                    <p className="text-brand-teal font-mono text-[11px] tracking-widest uppercase mt-1">Official BTD Engineering Terms of Service</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono text-[10px] w-fit">
                    <Clock className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Last Updated: July 18, 2026</span>
                  </div>
                </div>

                <div className="text-gray-300 font-sans text-sm leading-relaxed space-y-6">
                  <p className="italic text-gray-400">
                    This website is operated by S-CODERS (Bharath Tech Developers). Welcome to our platform! These terms and conditions outline the rules and regulations for using our digital products, services, custom engineering tools, and masterclasses.
                  </p>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">1.</span> Acceptance of Terms
                    </h4>
                    <p className="text-gray-400 pl-6">
                      By accessing this website, booking masterclass workshops, or registering client workspace keys for S-CODERS software services, you accept and agree to be bound by these Terms & Conditions. If you do not agree to all of the terms stated on this page, please do not continue using our services.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">2.</span> Corporate Parameters
                    </h4>
                    <div className="pl-6 space-y-1">
                      <p><strong className="text-gray-300">Trade Name & Identity:</strong> S-CODERS • Bharath Tech Developers</p>
                      <p><strong className="text-gray-300">Legal Name:</strong> Bharath Tech Developers (S-CODERS)</p>
                      <p><strong className="text-gray-300">Founder & Chief Architect:</strong> Suhas Gowda</p>
                      <p><strong className="text-gray-300">Service Category:</strong> Software Development, AI Orchestration, Tech Training, & Automation Systems</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">3.</span> Custom Engineering Scope
                    </h4>
                    <p className="text-gray-400 pl-6">
                      All custom software architectures, full-stack React Native apps, n8n integrations, or automated systems engineered by S-CODERS • Bharath Tech Developers are subject to individual Statement of Work (SOW) guidelines. Key generation triggers a dedicated client workspace where dynamic invoices can be tracked.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">4.</span> Intellectual Property Ownership
                    </h4>
                    <div className="text-gray-400 pl-6 space-y-3">
                      <p>
                        Unless explicitly specified under written client agreements, all course material, proprietary automation frameworks, workshop templates, and custom toolsets published by S-CODERS are intellectual properties of S-CODERS • Bharath Tech Developers:
                      </p>
                      <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-300">
                        <li>You <strong className="text-brand-coral">may NOT</strong> duplicate, redistribute, or resell S-CODERS masterclass curriculum.</li>
                        <li>Source codes delivered for custom client projects are governed by individual repository transfer agreements.</li>
                        <li>You <strong className="text-brand-teal">may modify</strong> templates and training models for internal personal or business use.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">5.</span> Client Accounts & Key Registrations
                    </h4>
                    <p className="text-gray-400 pl-6">
                      Clients registering services or masterclasses are issued secure system keys (`BTD-SERV-...` or `BTD-WKSH-...`). You are fully responsible for preserving the confidentiality of your workspace credentials and key keys.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">6.</span> Payment Gateways
                    </h4>
                    <p className="text-gray-400 pl-6">
                      Payments for tech consulting, milestone deposits, and masterclass seats are securely processed through verified, UPI-enabled payment gateways or direct bank transfer logs. All prices are listed in Indian Rupees (INR) unless designated otherwise.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">7.</span> Governing Law
                    </h4>
                    <p className="text-gray-400 pl-6">
                      These Terms & Conditions are governed by the laws of India. Any disputes or resolutions shall be subject to the exclusive jurisdiction of the courts located in <strong className="text-white">Bengaluru, Karnataka</strong>.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-white/5">
                  <div>
                    <h3 className="font-display font-bold text-2xl text-white">Privacy Policy</h3>
                    <p className="text-brand-teal font-mono text-[11px] tracking-widest uppercase mt-1">S-CODERS Data & Privacy Shield</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono text-[10px] w-fit">
                    <Clock className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Last Updated: July 18, 2026</span>
                  </div>
                </div>

                <div className="text-gray-300 font-sans text-sm leading-relaxed space-y-6">
                  <p className="italic text-gray-400">
                    At S-CODERS (Bharath Tech Developers), accessible from S-CODERS portals, one of our main priorities is protecting client source code, project parameters, and personal contact details. This Privacy Policy details the metrics we compile, save, and defend.
                  </p>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">1.</span> Information We Collect & Guard
                    </h4>
                    <div className="pl-6 space-y-4 text-gray-400">
                      <p>We process the following info strictly to ensure seamless software delivery and billing integrity:</p>
                      <ul className="space-y-3">
                        <li>
                          <strong className="text-gray-200 block mb-1">● Personal & Corporate Details:</strong>
                          Your legal name, active business email, contact phone number, company name, and project specifications when you file a service request or register an interactive workspace.
                        </li>
                        <li>
                          <strong className="text-gray-200 block mb-1">● Custom Credentials & Workspace Data:</strong>
                          Client estimation formulas, project milestone targets, dynamic invoice histories, and team contact details mapped to your unique system keys.
                        </li>
                        <li>
                          <strong className="text-gray-200 block mb-1">● Financial Integrity:</strong>
                          All invoice transactions are logged strictly using secure UPI, Razorpay, or direct banking receipt audits. S-CODERS never retains or views your credit card PINs, bank credentials, or secure UPI authentication parameters.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">2.</span> How S-CODERS Employs Data
                    </h4>
                    <div className="pl-6 space-y-2 text-gray-400">
                      <p>Collected coordinates are used exclusively to:</p>
                      <ul className="list-disc list-inside space-y-1.5 text-gray-300">
                        <li>Construct and provision your custom client workspaces on demand.</li>
                        <li>Verify deposit milestones and approve dynamic financial invoices.</li>
                        <li>Fulfill live digital workshop registrations and issue masterclass access.</li>
                        <li>Provide premium developer support and debug custom integration systems.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">3.</span> Enterprise Security Safeguards
                    </h4>
                    <p className="text-gray-400 pl-6">
                      All client databases, invoice tables, and secure keys are housed in certified, high-encryption environments. We execute strict security matrices—including end-to-end TLS encryption, secure database partitioning, and tokenized session logins—to insulate your confidential systems.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'refund' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-white/5">
                  <div>
                    <h3 className="font-display font-bold text-2xl text-white">Return & Refund Policy</h3>
                    <p className="text-brand-teal font-mono text-[11px] tracking-widest uppercase mt-1">Service Deposits & Seat Cancellations</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono text-[10px] w-fit">
                    <Clock className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Last Updated: July 18, 2026</span>
                  </div>
                </div>

                <div className="text-gray-300 font-sans text-sm leading-relaxed space-y-6">
                  <p className="font-semibold text-white">
                    Thank you for choosing S-CODERS for your advanced engineering requirements.
                  </p>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">1.</span> Custom Software Milestone Deposits
                    </h4>
                    <p className="text-gray-400 pl-6">
                      All startup deposits, initial sprint payments, or contract milestone settlements paid toward custom software architectures, n8n automations, and full-stack app configurations are <strong className="text-brand-coral">non-refundable</strong> once engineering sprints, schema designs, or repository allocations have commenced.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">2.</span> Why Are Software Sprints Non-Refundable?
                    </h4>
                    <p className="text-gray-400 pl-6">
                      Software engineering represents dedicated cognitive, technical, and resource allocations (including custom cloud infrastructure provisioning, API endpoints, and system architecture mapping). Therefore, completed sprints and custom code pipelines are non-refundable.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">3.</span> S-CODERS Live Masterclasses & Workshops
                    </h4>
                    <p className="text-gray-400 pl-6">
                      Payments for masterclass bookings (such as n8n, Gemini API, or React Native sessions) are final. S-CODERS <strong className="text-brand-coral">does not issue cash refunds</strong> for no-shows or last-minute cancellations. However, we offer highly accommodating client-centric options:
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 pl-6 text-gray-400">
                      <li><strong className="text-brand-teal">Seat Transfer:</strong> You may transfer your active seat coordinates to a colleague or teammate at any point before the session starts.</li>
                      <li><strong className="text-brand-teal">Future Credit:</strong> You can apply your payment as credit toward any subsequent S-CODERS tech cohort or interactive workshop upon notifying our desk at least 48 hours prior.</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'cancellation' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-white/5">
                  <div>
                    <h3 className="font-display font-bold text-2xl text-white">Cancellation Policy</h3>
                    <p className="text-brand-teal font-mono text-[11px] tracking-widest uppercase mt-1">Project holds and masterclass rescheduling</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono text-[10px] w-fit">
                    <Clock className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Last Updated: July 18, 2026</span>
                  </div>
                </div>

                <div className="text-gray-300 font-sans text-sm leading-relaxed space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">1.</span> Engineering Milestone Cancellations
                    </h4>
                    <p className="text-gray-400 pl-6">
                      Clients wish to pause, hold, or cancel active software engineering contracts must issue a written request to S-CODERS. Work completed up to the date of cancellation will be billed accordingly based on active SOW sprint milestones.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">2.</span> Live Workshop Rescheduling
                    </h4>
                    <p className="text-gray-400 pl-6">
                      To cancel or reschedule your attendance in an active S-CODERS masterclass, please contact us at least <strong className="text-white">48 hours</strong> before the scheduled kick-off time. This enables us to reallocate the seat to waitlisted developers.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">3.</span> S-CODERS Right to Cancel
                    </h4>
                    <p className="text-gray-400 pl-6">
                      In the rare event of severe network disruptions, technical outages, or force majeure events preventing S-CODERS from hosting a scheduled masterclass, we will immediately communicate with registered developers and offer choice of an alternative slot or direct fee resolution.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'shipping' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-white/5">
                  <div>
                    <h3 className="font-display font-bold text-2xl text-white">Delivery Policy</h3>
                    <p className="text-brand-teal font-mono text-[11px] tracking-widest uppercase mt-1">Digital Delivery, Repo Transfers & Credentials</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono text-[10px] w-fit">
                    <Clock className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Last Updated: July 18, 2026</span>
                  </div>
                </div>

                <div className="text-gray-300 font-sans text-sm leading-relaxed space-y-6">
                  <p className="italic text-gray-400">
                    S-CODERS • Bharath Tech Developers deals exclusively in digital architectures, custom source codes, API keys, and live technical coaching. S-CODERS has no physical merchandise shipping requirements.
                  </p>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">1.</span> Custom Software Delivery Speed
                    </h4>
                    <p className="text-gray-400 pl-6">
                      Custom software builds are delivered online via private GitHub/GitLab repository handoffs, secure AWS/Google Cloud deployments, and digital transfers of documentation assets. Delivery schedules are mapped to the milestones agreed upon in the contract.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">2.</span> Live Tech Masterclasses Access
                    </h4>
                    <p className="text-gray-400 pl-6">
                      Upon a successful workshop booking, your enrollment is validated instantly. S-CODERS automatically dispatches the live room access links (Google Meet / Zoom), pre-class materials, and calendar invites directly to your email address within <strong className="text-white">5 to 10 minutes</strong>.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-brand-teal font-mono text-sm">3.</span> Instant Key Allocation
                    </h4>
                    <p className="text-gray-400 pl-6">
                      Client registered workspace keys are assigned instantly through the interface upon registering a service contract. This allows immediate client login and dashboard access without any system delay.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'about-brand' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-white/5">
                  <div>
                    <h3 className="font-display font-bold text-2xl text-white">About S-CODERS</h3>
                    <p className="text-brand-teal font-mono text-[11px] tracking-widest uppercase mt-1">Our engineering footprint and leader</p>
                  </div>
                </div>

                <div className="text-gray-300 font-sans text-sm leading-relaxed space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-brand-dark/40 p-6 rounded-2xl border border-white/5">
                    <div>
                      <h4 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">FOUNDER & CHIEF ARCHITECT</h4>
                      <h5 className="font-display font-extrabold text-white text-lg">Suhas Gowda</h5>
                      <p className="text-brand-teal text-xs font-mono mt-0.5">Bengaluru, India</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">OUR MANDATE</h4>
                      <p className="text-gray-300 text-xs">
                        Democratizing complex n8n workflows, full-stack builds, customized LLMs, and custom AI agents.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white">Who We Are</h4>
                    <p className="text-gray-400">
                      <strong className="text-white">S-CODERS • Bharath Tech Developers</strong> is an elite software development consultancy and technical training firm based in the heart of Bengaluru, India. Directed by <strong className="text-white">Suhas Gowda</strong>, our team designs production-grade software architectures, automates legacy processes using AI orchestrators, and hosts deep-tech masterclasses for modern engineers and tech businesses.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white">Our Visual Identity</h4>
                    <p className="text-gray-400">
                      Our core brand, **S-CODERS**, is visually framed by the concept of **Symmetrical Sockets / Linked Capabilities** (S 🔗 CODERS), symbolizing our expertise in connecting legacy APIs to advanced AI platforms, orchestrating robust pipelines, and bridging technology with seamless operational efficiency.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-white">Our Pillars</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white/[1%] border border-white/5 p-4 rounded-xl">
                        <Cpu className="w-5 h-5 text-brand-teal mb-2" />
                        <h5 className="font-display font-bold text-sm text-white mb-1.5">Elite Software</h5>
                        <p className="text-gray-500 text-xs leading-relaxed">Developing tailored SaaS backends, custom database networks, and premium React interfaces.</p>
                      </div>
                      <div className="bg-white/[1%] border border-white/5 p-4 rounded-xl">
                        <Globe className="w-5 h-5 text-brand-teal mb-2" />
                        <h5 className="font-display font-bold text-sm text-white mb-1.5">AI Agents</h5>
                        <p className="text-gray-500 text-xs leading-relaxed">Integrating Gemini models, fine-tuned vectors, and advanced multi-channel conversational nodes.</p>
                      </div>
                      <div className="bg-white/[1%] border border-white/5 p-4 rounded-xl">
                        <GraduationCap className="w-5 h-5 text-brand-teal mb-2" />
                        <h5 className="font-display font-bold text-sm text-white mb-1.5">Masterclasses</h5>
                        <p className="text-gray-500 text-xs leading-relaxed">Training developers in complex system patterns, live automation suites, and deployment tools.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'contact-info' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-white/5">
                  <div>
                    <h3 className="font-display font-bold text-2xl text-white">Contact & Corporate Information</h3>
                    <p className="text-brand-teal font-mono text-[11px] tracking-widest uppercase mt-1">Official Coordinates & Channels</p>
                  </div>
                </div>

                <div className="text-gray-300 font-sans text-sm leading-relaxed space-y-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-brand-dark/40 border border-white/5 p-5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-3 text-brand-teal">
                        <Building className="w-5 h-5 shrink-0" />
                        <h4 className="font-display font-bold text-sm text-white">Registered Office</h4>
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <p><strong className="text-gray-300">Trade Name & Company:</strong> S-CODERS • Bharath Tech Developers</p>
                        <p><strong className="text-gray-300">Headquarters:</strong> Bengaluru, Karnataka, India</p>
                      </div>
                    </div>

                    <div className="bg-brand-dark/40 border border-white/5 p-5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-3 text-brand-teal">
                        <Phone className="w-5 h-5 shrink-0" />
                        <h4 className="font-display font-bold text-sm text-white">Support Channels</h4>
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <p><strong className="text-gray-300">Communications:</strong> <a href="mailto:connect@bharathtechdevelopers.com" className="hover:underline text-brand-teal font-mono">connect@bharathtechdevelopers.com</a></p>
                        <p><strong className="text-gray-300">Support SLA:</strong> <a href="mailto:support@bharathtechdevelopers.com" className="hover:underline text-brand-teal font-mono">support@bharathtechdevelopers.com</a></p>
                        <p><strong className="text-gray-300">Inquiries:</strong> 24 to 48 hours resolution SLA</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-white">SLA Resolution Commitment</h4>
                    <p className="text-gray-400">
                      We value our client workflows and engineering pipelines. S-CODERS developer relations staff aim to resolve active portal key concerns, masterclass seat transfers, or client billing receipt audits within <strong className="text-white">24 business hours</strong>.
                    </p>
                  </div>

                  {/* Social Handles */}
                  <div className="pt-6 border-t border-white/5">
                    <h4 className="font-display font-bold text-sm text-white mb-3">Our Verified Channels</h4>
                    <div className="flex flex-wrap gap-4">
                      <a 
                        href="https://youtube.com/@scoders" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-brand-teal/10 hover:text-brand-teal border border-white/5 rounded-xl text-xs font-mono transition-all duration-300"
                      >
                        <Youtube className="w-4 h-4 text-red-500" />
                        <span>YouTube</span>
                      </a>
                      <a 
                        href="https://twitter.com/s_coders" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-brand-teal/10 hover:text-brand-teal border border-white/5 rounded-xl text-xs font-mono transition-all duration-300"
                      >
                        <Twitter className="w-4 h-4 text-sky-400" />
                        <span>Twitter / X</span>
                      </a>
                      <a 
                        href="https://instagram.com/s_coders" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-brand-teal/10 hover:text-brand-teal border border-white/5 rounded-xl text-xs font-mono transition-all duration-300"
                      >
                        <Instagram className="w-4 h-4 text-pink-500" />
                        <span>Instagram</span>
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
