import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Key, ShieldCheck, CheckCircle2, AlertCircle, 
  ArrowRight, ArrowLeft, Copy, Check, ExternalLink, RefreshCw, 
  Building2, User, Landmark, Mail, Phone, Calendar, Lock, Sparkles,
  Award, Globe, Terminal, Briefcase, ChevronRight, Hash, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CandidateApplication } from '../../types';
import { DatabaseEngine } from '../../utils/dbEngine';

interface Section3ReferenceIdsProps {
  initialFirstRefId?: string;
  initialSecondRefId?: string;
  onProceedToSection4?: (secondRefId: string, candidate?: CandidateApplication) => void;
  onProceedToSection2?: (appId: string, token?: string) => void;
  onNavigateTab?: (step: 1 | 2 | 3 | 4) => void;
}

export default function CareersSection3ReferenceIds({
  initialFirstRefId = '',
  initialSecondRefId = '',
  onProceedToSection4,
  onProceedToSection2,
  onNavigateTab
}: Section3ReferenceIdsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'second_ref' | 'first_ref'>('second_ref');
  
  // First Reference ID State (Initial Application)
  const [firstRefInput, setFirstRefInput] = useState(initialFirstRefId);
  const [firstAppRecord, setFirstAppRecord] = useState<CandidateApplication | null>(null);
  const [isSearchingFirst, setIsSearchingFirst] = useState(false);
  const [firstSearchError, setFirstSearchError] = useState<string | null>(null);
  
  // Second Reference ID State (Joining Application)
  const [secondRefInput, setSecondRefInput] = useState(initialSecondRefId);
  const [secondAppRecord, setSecondAppRecord] = useState<CandidateApplication | null>(null);
  const [isSearchingSecond, setIsSearchingSecond] = useState(false);
  const [secondSearchError, setSecondSearchError] = useState<string | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Auto-lookup if initial IDs are provided
  useEffect(() => {
    if (initialSecondRefId && initialSecondRefId.trim()) {
      handleSearchSecond(initialSecondRefId);
    } else if (initialFirstRefId && initialFirstRefId.trim()) {
      handleSearchFirst(initialFirstRefId);
      setActiveSubTab('first_ref');
    }
  }, [initialFirstRefId, initialSecondRefId]);

  const copyToClipboard = (text: string, keyName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // 1. Fetch Initial Application using First Reference ID
  const handleSearchFirst = async (overrideId?: string) => {
    const q = (overrideId || firstRefInput).trim().toUpperCase();
    if (!q) {
      setFirstSearchError('Please enter your First Reference ID (e.g. SCD-APP-2026-XXXX) or registered email.');
      return;
    }

    setIsSearchingFirst(true);
    setFirstSearchError(null);

    try {
      const localApps = DatabaseEngine.getCandidateApplications();
      let match = localApps.find(a => 
        (a.id && a.id.toUpperCase() === q) ||
        (a.email && a.email.toUpperCase() === q)
      );

      if (!match) {
        const res = await fetch(`/api/careers/lookup?query=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (res.ok && data.success && data.application) {
          match = data.application;
          DatabaseEngine.addCandidateApplication(match);
        }
      }

      if (match) {
        setFirstAppRecord(match);
      } else {
        setFirstSearchError(`No initial application found matching "${q}". Please verify your First Reference ID received after submitting Step 1.`);
        setFirstAppRecord(null);
      }
    } catch (e: any) {
      setFirstSearchError('Network error while looking up application. Please retry.');
    } finally {
      setIsSearchingFirst(false);
    }
  };

  // 2. Fetch Joining Application using Second Reference ID
  const handleSearchSecond = async (overrideId?: string) => {
    const q = (overrideId || secondRefInput).trim().toUpperCase();
    if (!q) {
      setSecondSearchError('Please enter your Second Reference ID (e.g. SCD-JOIN-2026-XXXX or SCD-AGR-2026-XXXX).');
      return;
    }

    setIsSearchingSecond(true);
    setSecondSearchError(null);

    try {
      const localApps = DatabaseEngine.getCandidateApplications();
      let match = localApps.find(a => 
        (a.agreementReferenceId && a.agreementReferenceId.toUpperCase() === q) ||
        (a.id && a.id.toUpperCase() === q) ||
        (a.departmentReferenceId && a.departmentReferenceId.toUpperCase() === q)
      );

      if (!match) {
        const res = await fetch(`/api/careers/lookup?query=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (res.ok && data.success && data.application) {
          match = data.application;
          DatabaseEngine.addCandidateApplication(match);
        }
      }

      if (match) {
        // Check if joining application is actually completed
        const hasJoining = Boolean(
          match.agreementReferenceId || 
          match.bankName || 
          match.candidateDigitalSignature || 
          match.status === 'Onboarding Completed' || 
          match.status === 'Hired'
        );

        if (hasJoining) {
          setSecondAppRecord(match);
        } else {
          setSecondAppRecord(match);
          setSecondSearchError(`Found profile #${match.id}, but the Step 2 Joining Application has not been executed yet. Complete Step 2 first to receive your official Second Reference ID.`);
        }
      } else {
        setSecondSearchError(`No joining application found matching Second Reference ID "${q}". Please check the ID or submit Step 2.`);
        setSecondAppRecord(null);
      }
    } catch (e: any) {
      setSecondSearchError('Network error while looking up joining application. Please retry.');
    } finally {
      setIsSearchingSecond(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-brand-card/80 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/30 text-brand-teal text-xs font-mono font-bold mb-3 uppercase tracking-wider">
              <Hash className="w-3.5 h-3.5" />
              <span>Section 3: Application & Department Reference IDs</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
              Candidate Credential & <span className="text-brand-teal">Reference Portal</span>
            </h2>
            <p className="text-gray-300 text-sm sm:text-base mt-2 max-w-2xl font-light leading-relaxed">
              Retrieve your official dossier using your assigned Reference IDs. Access your <strong>Initial Application</strong> with your First Reference ID, or access your <strong>Joining Application</strong> with your Second Reference ID to proceed directly to Department WhatsApp & Online Work.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0 w-full sm:w-auto">
            <div className="px-4 py-3 rounded-2xl bg-black/50 border border-white/10 w-full sm:w-auto text-left sm:text-right">
              <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Reference ID Workflow</p>
              <p className="text-xs font-mono font-bold text-white mt-0.5">1st Ref ID → 2nd Ref ID → Dept Ref ID</p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => setActiveSubTab('second_ref')}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'second_ref'
                ? 'bg-emerald-500 text-brand-dark shadow-lg shadow-emerald-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Second Reference ID (Joining Application)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 font-mono">Section 2</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('first_ref')}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'first_ref'
                ? 'bg-brand-teal text-brand-dark shadow-lg shadow-brand-teal/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>First Reference ID (Initial Application)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 font-mono">Section 1</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: SECOND REFERENCE ID (JOINING APPLICATION) */}
      {/* ============================================================== */}
      {activeSubTab === 'second_ref' && (
        <div className="space-y-6">
          {/* Lookup Input Card */}
          <div className="bg-brand-card/70 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Fetch Joining Application Dossier</span>
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">
              Enter Your Second Reference ID
            </h3>
            <p className="text-gray-300 text-xs sm:text-sm font-light leading-relaxed mb-6">
              Your Second Reference ID was generated upon submitting the Section 2 Legal & Induction Agreement form (e.g. <span className="font-mono text-emerald-400">SCD-JOIN-2026-XXXX</span>). Entering this fetches your verified induction coordinates and allows you to proceed directly to the <strong>Department & WhatsApp Group</strong> section.
            </p>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchSecond();
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={secondRefInput}
                  onChange={(e) => setSecondRefInput(e.target.value)}
                  placeholder="Enter Second Reference ID (e.g. SCD-JOIN-2026-XXXX)"
                  className="w-full bg-black/60 border border-emerald-500/40 rounded-xl px-4 py-3.5 text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 uppercase transition-all shadow-inner"
                />
                {secondRefInput && (
                  <button
                    type="button"
                    onClick={() => setSecondRefInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSearchingSecond}
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-brand-dark font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50 shrink-0"
              >
                {isSearchingSecond ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Fetching Dossier...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Fetch Joining Application</span>
                  </>
                )}
              </button>
            </form>

            {secondSearchError && (
              <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-rose-200">Joining Application Not Found</p>
                  <p>{secondSearchError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Render Second Reference Application Details */}
          {secondAppRecord && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-card/90 border border-emerald-500/40 rounded-3xl p-6 sm:p-10 backdrop-blur-md space-y-8 shadow-2xl relative overflow-hidden"
            >
              {/* Highlight Status Top Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Joining Application Dossier</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white">
                    {secondAppRecord.candidateLegalName || secondAppRecord.fullName}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    Official Email: {secondAppRecord.officialEmail || secondAppRecord.email} • Mobile: {secondAppRecord.phone}
                  </p>
                </div>

                {/* Primary Action Button: Proceed to Section 4 */}
                <button
                  type="button"
                  onClick={() => {
                    const refId = secondAppRecord.agreementReferenceId || secondAppRecord.id;
                    if (onProceedToSection4) {
                      onProceedToSection4(refId, secondAppRecord);
                    } else if (onNavigateTab) {
                      onNavigateTab(4);
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-brand-teal text-brand-dark font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-emerald-500/25 hover:brightness-110"
                >
                  <span>Proceed to Section 4: WhatsApp & Online Work</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Reference ID Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Second Reference ID Card */}
                <div className="bg-black/50 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
                      Second Reference ID (Joining)
                    </p>
                    <p className="text-sm sm:text-base font-mono font-extrabold text-white mt-0.5">
                      {secondAppRecord.agreementReferenceId || 'Pending Stage 2'}
                    </p>
                  </div>
                  {secondAppRecord.agreementReferenceId && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(secondAppRecord.agreementReferenceId || '', 'secRef')}
                      className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 cursor-pointer"
                      title="Copy Second Reference ID"
                    >
                      {copiedKey === 'secRef' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* First Reference ID Card */}
                <div className="bg-black/50 border border-brand-teal/30 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-brand-teal uppercase tracking-wider font-bold">
                      First Reference ID (Initial)
                    </p>
                    <p className="text-sm sm:text-base font-mono font-bold text-white mt-0.5">
                      {secondAppRecord.id}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(secondAppRecord.id, 'fstRef')}
                    className="p-2 rounded-lg bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal cursor-pointer"
                    title="Copy First Reference ID"
                  >
                    {copiedKey === 'fstRef' ? <Check className="w-4 h-4 text-brand-teal" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Department Status Card */}
                <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">
                      Department Group Status
                    </p>
                    <p className={`text-xs font-mono font-bold mt-1 ${
                      secondAppRecord.departmentStatus === 'Approved'
                        ? 'text-emerald-400'
                        : secondAppRecord.departmentStatus === 'Pending Verification'
                          ? 'text-amber-400'
                          : 'text-gray-300'
                    }`}>
                      {secondAppRecord.departmentStatus === 'Approved'
                        ? `✓ Approved (${secondAppRecord.departmentReferenceId || 'Active'})`
                        : secondAppRecord.departmentStatus === 'Pending Verification'
                          ? '⏳ Verification Pending in Sec. 4'
                          : 'Not Selected Yet'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const refId = secondAppRecord.agreementReferenceId || secondAppRecord.id;
                      if (onProceedToSection4) onProceedToSection4(refId, secondAppRecord);
                      else if (onNavigateTab) onNavigateTab(4);
                    }}
                    className="text-xs font-mono text-brand-teal hover:underline flex items-center gap-1"
                  >
                    <span>Manage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Department WhatsApp Group Channel */}
              <div className="p-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                    <span className="text-xs font-mono font-bold uppercase text-[#25D366]">Official Department WhatsApp Group</span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {secondAppRecord.departmentSelection || secondAppRecord.sector} Department WhatsApp Work Group
                  </p>
                  <p className="text-xs text-gray-300 font-light">
                    Join the department WhatsApp group to collaborate with project leads and team members.
                  </p>
                </div>

                <a
                  href="https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#25D366] hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#25D366]/20 shrink-0"
                >
                  <MessageSquare className="w-4 h-4 fill-black" />
                  <span>Join {secondAppRecord.departmentSelection || secondAppRecord.sector} WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Induction & Coordinates Summary */}
              <div className="space-y-4">
                <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2 border-b border-white/10 pb-2">
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  <span>Executed Induction Coordinates & Bank Settlement</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs font-sans">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                    <p className="text-[10px] font-mono uppercase text-gray-400">Sector / Track</p>
                    <p className="font-semibold text-white mt-0.5">{secondAppRecord.sector}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                    <p className="text-[10px] font-mono uppercase text-gray-400">Designation / Role</p>
                    <p className="font-semibold text-white mt-0.5">{secondAppRecord.roleTitle}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                    <p className="text-[10px] font-mono uppercase text-gray-400">PAN & Aadhaar</p>
                    <p className="font-mono font-semibold text-white mt-0.5">
                      PAN: {secondAppRecord.panNumber || 'Provided'} • Aadhaar: ••••{secondAppRecord.aadhaarNumber?.slice(-4) || '••••'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                    <p className="text-[10px] font-mono uppercase text-gray-400">Bank Name & Branch</p>
                    <p className="font-semibold text-white mt-0.5">{secondAppRecord.bankName || 'HDFC Bank'} ({secondAppRecord.branchName || 'Bengaluru'})</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                    <p className="text-[10px] font-mono uppercase text-gray-400">Account & IFSC</p>
                    <p className="font-mono font-semibold text-white mt-0.5">A/C: {secondAppRecord.accountNumber || '••••••••'} (IFSC: {secondAppRecord.ifscCode || 'HDFC0000123'})</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                    <p className="text-[10px] font-mono uppercase text-gray-400">Digital Signature</p>
                    <p className="font-mono font-semibold text-emerald-400 mt-0.5">
                      ✓ Executed by {secondAppRecord.candidateDigitalSignature || secondAppRecord.candidateLegalName || secondAppRecord.fullName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Call-to-Action to Section 4 */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-brand-teal/10 to-transparent border border-emerald-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-display font-bold text-white">
                    Ready to enter your Department WhatsApp Group?
                  </h4>
                  <p className="text-xs text-gray-300 mt-1 font-light leading-relaxed">
                    Use your Second Reference ID (<span className="font-mono text-emerald-400 font-bold">{secondAppRecord.agreementReferenceId || secondAppRecord.id}</span>) to unlock your department selection, admin verification, exclusive WhatsApp subgroup, and department Zoom link.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const refId = secondAppRecord.agreementReferenceId || secondAppRecord.id;
                    if (onProceedToSection4) {
                      onProceedToSection4(refId, secondAppRecord);
                    } else if (onNavigateTab) {
                      onNavigateTab(4);
                    }
                  }}
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-brand-dark font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 shrink-0"
                >
                  <span>Proceed to Section 4</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: FIRST REFERENCE ID (INITIAL APPLICATION) */}
      {/* ============================================================== */}
      {activeSubTab === 'first_ref' && (
        <div className="space-y-6">
          {/* Lookup Input Card */}
          <div className="bg-brand-card/70 border border-brand-teal/30 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2 text-brand-teal font-mono text-xs font-bold uppercase tracking-wider">
              <Briefcase className="w-4 h-4" />
              <span>Fetch Initial Application Dossier</span>
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">
              Enter Your First Reference ID
            </h3>
            <p className="text-gray-300 text-xs sm:text-sm font-light leading-relaxed mb-6">
              Your First Reference ID was generated upon submitting your initial application profile (e.g. <span className="font-mono text-brand-teal">SCD-APP-2026-XXXX</span>). Entering this fetches your application screening status, interview schedule, and authorization link for Section 2.
            </p>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchFirst();
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={firstRefInput}
                  onChange={(e) => setFirstRefInput(e.target.value)}
                  placeholder="Enter First Reference ID (e.g. SCD-APP-2026-XXXX) or registered email"
                  className="w-full bg-black/60 border border-brand-teal/40 rounded-xl px-4 py-3.5 text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal uppercase transition-all shadow-inner"
                />
                {firstRefInput && (
                  <button
                    type="button"
                    onClick={() => setFirstRefInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSearchingFirst}
                className="px-6 py-3.5 rounded-xl bg-brand-teal hover:bg-white text-brand-dark font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-brand-teal/20 disabled:opacity-50 shrink-0"
              >
                {isSearchingFirst ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Fetching Profile...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Fetch Initial Application</span>
                  </>
                )}
              </button>
            </form>

            {firstSearchError && (
              <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-rose-200">Application Record Not Found</p>
                  <p>{firstSearchError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Render First Reference Record Details */}
          {firstAppRecord && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-card/90 border border-brand-teal/40 rounded-3xl p-6 sm:p-10 backdrop-blur-md space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/30 text-brand-teal text-xs font-mono font-bold mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Initial Application Screening Record</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white">
                    {firstAppRecord.fullName}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {firstAppRecord.email} • {firstAppRecord.phone} • {firstAppRecord.currentCity || 'India'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-1.5 rounded-full border border-brand-teal/30 bg-brand-teal/10 text-brand-teal font-mono text-xs font-bold">
                    Status: {firstAppRecord.status}
                  </div>
                </div>
              </div>

              {/* ID & Date Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-black/50 border border-brand-teal/30 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-brand-teal uppercase tracking-wider font-bold">
                      First Reference ID
                    </p>
                    <p className="text-sm sm:text-base font-mono font-bold text-white mt-0.5">
                      {firstAppRecord.id}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(firstAppRecord.id, 'fstOnly')}
                    className="p-2 rounded-lg bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal cursor-pointer"
                  >
                    {copiedKey === 'fstOnly' ? <Check className="w-4 h-4 text-brand-teal" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-black/50 border border-white/10">
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Submission Date</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{firstAppRecord.submissionDate}</p>
                </div>

                <div className="p-4 rounded-2xl bg-black/50 border border-white/10">
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Applied Track</p>
                  <p className="text-sm font-semibold text-white mt-0.5 truncate">{firstAppRecord.sector}</p>
                </div>
              </div>

              {/* Candidate Info Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs font-sans">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <p className="text-[10px] font-mono uppercase text-gray-400">Designation / Role</p>
                  <p className="font-semibold text-white mt-0.5">{firstAppRecord.roleTitle || 'Developer'}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <p className="text-[10px] font-mono uppercase text-gray-400">Key Skills</p>
                  <p className="font-semibold text-white mt-0.5 truncate">{firstAppRecord.keySkills || 'Full-Stack / React / Node.js'}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <p className="text-[10px] font-mono uppercase text-gray-400">Notice & Availability</p>
                  <p className="font-semibold text-white mt-0.5">{firstAppRecord.availabilityNotice || 'Immediate'}</p>
                </div>
              </div>

              {/* Department WhatsApp Group Channel */}
              <div className="p-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                    <span className="text-xs font-mono font-bold uppercase text-[#25D366]">Official Department WhatsApp Channel</span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {firstAppRecord.sector} Department WhatsApp Work Group
                  </p>
                  <p className="text-xs text-gray-300 font-light">
                    Stay connected with {firstAppRecord.sector} team members and receive interview schedule alerts.
                  </p>
                </div>

                <a
                  href="https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#25D366] hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#25D366]/20 shrink-0"
                >
                  <MessageSquare className="w-4 h-4 fill-black" />
                  <span>Join {firstAppRecord.sector} WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Conditional Action: If authorized for Stage 2, show button */}
              {(firstAppRecord.onboardingAuthorized || firstAppRecord.onboardingToken || firstAppRecord.status === 'Approved for Onboarding') && (
                <div className="p-4 rounded-2xl bg-brand-teal/10 border border-brand-teal/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-brand-teal shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">Interview Cleared & Authorized for Stage 2!</p>
                      <p className="text-xs text-gray-300">You have been granted access to execute the Section 2 Legal & Induction Agreement.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onProceedToSection2) {
                        onProceedToSection2(firstAppRecord.id, firstAppRecord.onboardingToken);
                      } else if (onNavigateTab) {
                        onNavigateTab(2);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-brand-teal hover:bg-white text-brand-dark font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <span>Go to Section 2 Form</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* If candidate already has Second Reference ID */}
              {firstAppRecord.agreementReferenceId && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-emerald-300">Second Reference ID Available</p>
                    <p className="text-xs text-gray-300 font-mono mt-0.5">
                      Your Joining Application is recorded under <strong className="text-white">{firstAppRecord.agreementReferenceId}</strong>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSecondRefInput(firstAppRecord.agreementReferenceId || '');
                      setActiveSubTab('second_ref');
                      handleSearchSecond(firstAppRecord.agreementReferenceId);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-brand-dark font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>View Joining Dossier</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
