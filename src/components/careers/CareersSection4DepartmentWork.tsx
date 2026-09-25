import React, { useState, useEffect } from 'react';
import { 
  Users, MessageSquare, Video, ShieldCheck, CheckCircle2, AlertCircle, 
  Clock, ArrowRight, Copy, Check, ExternalLink, RefreshCw, Sparkles, 
  Lock, Calendar, Play, Radio, ChevronRight, User, Hash, Globe,
  Terminal, Layout, Film, PenTool, Award, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CandidateApplication, DepartmentConfig, DepartmentMeeting } from '../../types';
import { DatabaseEngine } from '../../utils/dbEngine';
import { 
  getStoredDepartmentConfigs, 
  getStoredDepartmentMeetings, 
  getStoredMainWhatsAppCommunity, 
  detectCandidateDepartment,
  getDepartmentPrefix
} from '../../utils/departmentData';

interface Section4DepartmentWorkProps {
  initialSecondRefId?: string;
  candidateRecord?: CandidateApplication | null;
  onNavigateTab?: (step: 1 | 2 | 3 | 4) => void;
}

export default function CareersSection4DepartmentWork({
  initialSecondRefId = '',
  candidateRecord: initialCandidateRecord = null,
  onNavigateTab
}: Section4DepartmentWorkProps) {
  // Input & Verification State
  const [secondRefInput, setSecondRefInput] = useState(initialSecondRefId);
  const [candidate, setCandidate] = useState<CandidateApplication | null>(initialCandidateRecord);
  const [isVerifyingRef, setIsVerifyingRef] = useState(false);
  const [refVerifyError, setRefVerifyError] = useState<string | null>(null);

  // Department Selection State
  const [selectedDeptName, setSelectedDeptName] = useState<string>('');
  const [isSubmittingDept, setIsSubmittingDept] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Department Configs & Meetings
  const [departmentConfigs, setDepartmentConfigs] = useState<DepartmentConfig[]>(() => getStoredDepartmentConfigs());
  const [mainWhatsAppCommunity, setMainWhatsAppCommunity] = useState<string>(() => getStoredMainWhatsAppCommunity());
  const [meetings, setMeetings] = useState<DepartmentMeeting[]>(() => getStoredDepartmentMeetings());
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync department data & meetings
  const reloadData = () => {
    setDepartmentConfigs(getStoredDepartmentConfigs());
    setMainWhatsAppCommunity(getStoredMainWhatsAppCommunity());
    setMeetings(getStoredDepartmentMeetings());
  };

  useEffect(() => {
    reloadData();
    window.addEventListener('scoders_departments_change', reloadData);
    window.addEventListener('scoders_meetings_change', reloadData);
    window.addEventListener('scoders_db_change', reloadData);
    return () => {
      window.removeEventListener('scoders_departments_change', reloadData);
      window.removeEventListener('scoders_meetings_change', reloadData);
      window.removeEventListener('scoders_db_change', reloadData);
    };
  }, []);

  // Auto-verify if initialSecondRefId is provided
  useEffect(() => {
    if (initialSecondRefId && initialSecondRefId.trim()) {
      handleVerifySecondRef(initialSecondRefId);
    } else if (initialCandidateRecord) {
      setCandidate(initialCandidateRecord);
      const preselect = initialCandidateRecord.departmentSelection || detectCandidateDepartment(initialCandidateRecord.sector, initialCandidateRecord.roleTitle);
      setSelectedDeptName(preselect);
    }
  }, [initialSecondRefId, initialCandidateRecord]);

  const copyToClipboard = (text: string, keyName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Verify Second Reference ID
  const handleVerifySecondRef = async (overrideId?: string) => {
    const q = (overrideId || secondRefInput).trim().toUpperCase();
    if (!q) {
      setRefVerifyError('Please enter your Second Reference ID generated upon submitting Section 2 (e.g. SCD-JOIN-2026-XXXX).');
      return;
    }

    setIsVerifyingRef(true);
    setRefVerifyError(null);

    try {
      // 1. Check local db
      const localApps = DatabaseEngine.getCandidateApplications();
      let match = localApps.find(a => 
        (a.agreementReferenceId && a.agreementReferenceId.toUpperCase() === q) ||
        (a.id && a.id.toUpperCase() === q) ||
        (a.departmentReferenceId && a.departmentReferenceId.toUpperCase() === q)
      );

      // 2. Check remote server
      if (!match) {
        const res = await fetch(`/api/careers/lookup?query=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (res.ok && data.success && data.application) {
          match = data.application;
          DatabaseEngine.addCandidateApplication(match);
        }
      }

      if (match) {
        setCandidate(match);
        // Pre-select department if already chosen, or detect from profile
        const detected = match.departmentSelection || detectCandidateDepartment(match.sector, match.roleTitle);
        setSelectedDeptName(detected);

        // Fetch fresh status from server if pending or approved
        refreshCandidateStatus(match.id);
      } else {
        setRefVerifyError(`No candidate record found matching "${q}". Please ensure you enter your Second Reference ID received after completing Section 2.`);
        setCandidate(null);
      }
    } catch (e: any) {
      setRefVerifyError('Network error while verifying Reference ID. Please retry.');
    } finally {
      setIsVerifyingRef(false);
    }
  };

  // Refresh single candidate from server
  const refreshCandidateStatus = async (appId?: string) => {
    const idToRefresh = appId || candidate?.id;
    if (!idToRefresh) return;
    setIsRefreshingStatus(true);
    try {
      const res = await fetch(`/api/careers/lookup?query=${encodeURIComponent(idToRefresh)}`);
      const data = await res.json();
      if (res.ok && data.success && data.application) {
        setCandidate(data.application);
        DatabaseEngine.addCandidateApplication(data.application);
        if (data.application.departmentSelection) {
          setSelectedDeptName(data.application.departmentSelection);
        }
      }
    } catch (e) {
      console.warn('Status refresh error:', e);
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  // Submit Department Selection for Admin Verification
  const handleSubmitDepartment = async () => {
    if (!candidate) return;
    if (!selectedDeptName) {
      setRefVerifyError('Please select a department from the options below.');
      return;
    }

    setIsSubmittingDept(true);
    setRefVerifyError(null);
    setActionSuccessNotice(null);

    const secondRefId = candidate.agreementReferenceId || candidate.id;

    try {
      // 1. Send to server
      const res = await fetch('/api/careers/request-department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secondRefId,
          selectedDepartment: selectedDeptName
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.candidate) {
          setCandidate(data.candidate);
          DatabaseEngine.addCandidateApplication(data.candidate);
        }
        setActionSuccessNotice(
          `✓ Department "${selectedDeptName}" submitted for verification. S-CODERS admin will review and issue your unique Department Reference ID.`
        );
      } else {
        // Fallback local update
        const updated = DatabaseEngine.updateCandidateDepartmentVerification(
          candidate.id,
          candidate.departmentStatus === 'Approved' ? 'Approved' : 'Pending Verification',
          candidate.departmentReferenceId,
          selectedDeptName
        );
        const match = updated.find(a => a.id === candidate.id);
        if (match) setCandidate(match);
        setActionSuccessNotice(`✓ Department "${selectedDeptName}" submitted for verification.`);
      }
    } catch (e: any) {
      console.error('Request department failed:', e);
      // Local fallback
      DatabaseEngine.updateCandidateDepartmentVerification(
        candidate.id,
        'Pending Verification',
        undefined,
        selectedDeptName
      );
      setActionSuccessNotice(`✓ Department selection recorded locally.`);
    } finally {
      setIsSubmittingDept(false);
    }
  };

  // Find department config matching candidate's approved or selected department
  const approvedDeptConfig = departmentConfigs.find(
    d => d.name.toLowerCase() === (candidate?.departmentSelection || selectedDeptName).toLowerCase()
  ) || departmentConfigs[0];

  // Filter meetings for candidate's approved department (or all-hands)
  const candidateMeetings = meetings.filter(m => {
    if (!candidate || candidate.departmentStatus !== 'Approved') return false;
    const targetDept = (candidate.departmentSelection || selectedDeptName).toLowerCase().trim();
    const meetDept = (m.department || '').toLowerCase().trim();
    return meetDept === targetDept || meetDept === 'all' || meetDept.includes('all departments');
  });

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-brand-card/80 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold mb-3 uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Section 4: Department WhatsApp Group & Online Work</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
              Department Induction & <span className="text-emerald-400">Online Work Hub</span>
            </h2>
            <p className="text-gray-300 text-sm sm:text-base mt-2 max-w-2xl font-light leading-relaxed">
              Enter your <strong>Second Reference ID</strong> to identify your applied role, select your department, request admin verification, and unlock your exclusive <strong>Department WhatsApp subgroup</strong> and <strong>Department-Specific Zoom Work Link</strong>.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0 w-full sm:w-auto">
            <div className="px-4 py-3 rounded-2xl bg-black/50 border border-white/10 w-full sm:w-auto text-left sm:text-right">
              <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Department Reference Format</p>
              <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">Prefix-2026-XXX (e.g. GHZ-2026-A17)</p>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Enter Second Reference ID Gatekeeper Card */}
      <div className="bg-brand-card/70 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            <span>Step 1: Enter Second Reference ID</span>
          </div>
          {candidate && (
            <button
              type="button"
              onClick={() => refreshCandidateStatus()}
              disabled={isRefreshingStatus}
              className="text-xs font-mono text-gray-400 hover:text-emerald-400 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStatus ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh Status</span>
            </button>
          )}
        </div>

        <h3 className="text-lg sm:text-xl font-display font-bold text-white mb-2">
          Validate Candidate Onboarding Credentials
        </h3>
        <p className="text-gray-300 text-xs sm:text-sm font-light leading-relaxed mb-6">
          Access to department WhatsApp communities and live Zoom work links is restricted to candidates who have submitted their Section 2 Legal & Induction Agreement form.
        </p>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleVerifySecondRef();
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
            disabled={isVerifyingRef}
            className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-brand-dark font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50 shrink-0"
          >
            {isVerifyingRef ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying ID...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify Second Reference ID</span>
              </>
            )}
          </button>
        </form>

        {refVerifyError && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-200">Invalid or Missing Second Reference ID</p>
              <p>{refVerifyError}</p>
            </div>
          </div>
        )}

        {actionSuccessNotice && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>{actionSuccessNotice}</p>
          </div>
        )}
      </div>

      {/* 2. Candidate Verified Card & Identified Department */}
      {candidate && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Identified Profile & Role Banner */}
          <div className="bg-black/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                  ✓ Validated Second Reference ID
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {candidate.agreementReferenceId || candidate.id}
                </span>
              </div>
              <h3 className="text-xl font-display font-extrabold text-white">
                {candidate.candidateLegalName || candidate.fullName}
              </h3>
              <p className="text-xs text-gray-300 font-sans">
                <strong>Applied Sector / Track:</strong> <span className="text-brand-teal">{candidate.sector}</span> • <strong>Role:</strong> <span className="text-white">{candidate.roleTitle}</span>
              </p>
            </div>

            {/* Verification Status Pill */}
            <div className="shrink-0 flex flex-col items-start md:items-end gap-1.5 w-full md:w-auto">
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Department Verification Status</p>
              <div className={`px-4 py-2 rounded-xl border font-mono text-xs font-extrabold flex items-center gap-2 ${
                candidate.departmentStatus === 'Approved'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : candidate.departmentStatus === 'Pending Verification'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : candidate.departmentStatus === 'Rejected'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-white/10 border-white/20 text-gray-300'
              }`}>
                {candidate.departmentStatus === 'Approved' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>APPROVED & ACCESS GRANTED</span>
                  </>
                ) : candidate.departmentStatus === 'Pending Verification' ? (
                  <>
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>PENDING ADMIN VERIFICATION</span>
                  </>
                ) : candidate.departmentStatus === 'Rejected' ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>VERIFICATION DECLINED</span>
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>NOT SUBMITTED YET</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Direct WhatsApp Group Channel for Candidate's Department */}
          <div className="p-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase text-[#25D366]">Official Department WhatsApp Channel</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {candidate.departmentSelection || selectedDeptName} Official WhatsApp Community & Work Group
              </p>
              <p className="text-xs text-gray-300 font-light">
                Direct WhatsApp access for onboarding announcements, peer networking, and sprint leads.
              </p>
            </div>

            <a
              href={approvedDeptConfig.whatsappSubgroupLink || "https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 bg-[#25D366] hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#25D366]/20 shrink-0"
            >
              <MessageSquare className="w-4 h-4 fill-black" />
              <span>Join {candidate.departmentSelection || selectedDeptName} WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* ============================================================== */}
          {/* APPROVED STATE: DEPARTMENT REFERENCE ID & WHATSAPP ACCESS */}
          {/* ============================================================== */}
          {candidate.departmentStatus === 'Approved' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-b from-brand-card to-black/80 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden"
            >
              {/* Background ambient badge glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Department-Specific Reference ID Highlight Box */}
              <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Official Department-Specific Reference ID</span>
                  </div>
                  <h4 className="text-sm text-gray-300 font-sans">
                    Issued exclusively for your approved department: <strong className="text-white">{candidate.departmentSelection || selectedDeptName}</strong>
                  </h4>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-mono text-2xl sm:text-4xl font-black text-white tracking-wider text-emerald-400 select-all">
                      {candidate.departmentReferenceId || 'GHZ-2026-A17'}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(candidate.departmentReferenceId || 'GHZ-2026-A17', 'deptRefId')}
                      className="p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 cursor-pointer border border-emerald-500/40 transition-all"
                      title="Copy Department Reference ID"
                    >
                      {copiedKey === 'deptRefId' ? <Check className="w-5 h-5 text-emerald-300" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-gray-400 mt-1.5">
                    Format: Prefix (<strong className="text-white">{getDepartmentPrefix(candidate.departmentSelection || selectedDeptName)}</strong>) • Year (<strong className="text-white">2026</strong>) • Unique Candidate Code (<strong className="text-white">{(candidate.departmentReferenceId || 'GHZ-2026-A17').split('-')[2] || 'A17'}</strong>)
                  </p>
                </div>

                <div className="px-5 py-4 rounded-xl bg-black/60 border border-white/10 text-xs font-mono space-y-1">
                  <p className="text-[10px] uppercase text-gray-400 tracking-wider">Approval Verification Stamp</p>
                  <p className="text-emerald-400 font-bold">✓ Verified by: {candidate.departmentApprovedBy || 'Admin Desk'}</p>
                  <p className="text-gray-400 text-[11px]">{candidate.departmentApprovedAt ? new Date(candidate.departmentApprovedAt).toLocaleString() : 'Active'}</p>
                </div>
              </div>

              {/* WhatsApp Community & Subgroup Access Section */}
              <div className="space-y-4">
                <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                  <h4 className="text-base sm:text-lg font-display font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#25D366]" />
                    <span>WhatsApp Group & Community Access</span>
                  </h4>
                  <span className="text-xs font-mono text-[#25D366] bg-[#25D366]/10 px-2.5 py-0.5 rounded-full border border-[#25D366]/30">
                    Permissions Active
                  </span>
                </div>

                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  As per company governance, S-CODERS operates <strong>one main WhatsApp group/community</strong>, with separate <strong>department-based subgroups</strong> inside it. You have been granted access strictly to your approved department subgroup.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Subgroup Link Card */}
                  <div className="bg-[#25D366]/10 border border-[#25D366]/40 rounded-2xl p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#25D366] bg-[#25D366]/20 px-2 py-0.5 rounded-full">
                          Approved Subgroup
                        </span>
                      </div>
                      <h5 className="text-base font-display font-bold text-white">
                        {candidate.departmentSelection || selectedDeptName} Subgroup
                      </h5>
                      <p className="text-xs text-gray-300 mt-1 font-light leading-relaxed">
                        Collaborate with fellow {candidate.departmentSelection || selectedDeptName} builders, sprint leads, and technical mentors.
                      </p>
                    </div>

                    <a
                      href={approvedDeptConfig.whatsappSubgroupLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 bg-[#25D366] hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#25D366]/20"
                    >
                      <MessageSquare className="w-4 h-4 fill-black" />
                      <span>Join {candidate.departmentSelection || selectedDeptName} Subgroup</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Main Community Link Card */}
                  <div className="bg-black/50 border border-white/15 rounded-2xl p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">
                          All-Hands Community
                        </span>
                      </div>
                      <h5 className="text-base font-display font-bold text-white">
                        S-CODERS Main WhatsApp Community
                      </h5>
                      <p className="text-xs text-gray-300 mt-1 font-light leading-relaxed">
                        Stay connected with company-wide announcements, weekly townhalls, hackathons, and product releases.
                      </p>
                    </div>

                    <a
                      href={mainWhatsAppCommunity}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-brand-teal" />
                      <span>Join Main Community Hub</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Department-Specific Zoom Link Card */}
              <div className="space-y-4">
                <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                  <h4 className="text-base sm:text-lg font-display font-bold text-white flex items-center gap-2">
                    <Video className="w-5 h-5 text-sky-400" />
                    <span>Department-Specific Zoom Meeting Link</span>
                  </h4>
                  <span className="text-xs font-mono text-sky-400 bg-sky-400/10 px-2.5 py-0.5 rounded-full border border-sky-400/30">
                    Department Exclusive
                  </span>
                </div>

                <div className="bg-sky-950/30 border border-sky-500/40 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-sky-300 uppercase tracking-wider font-bold">
                      {candidate.departmentSelection || selectedDeptName} Dedicated Room
                    </p>
                    <p className="text-sm font-semibold text-white truncate font-mono select-all">
                      {approvedDeptConfig.zoomMeetingLink}
                    </p>
                    <p className="text-[11px] text-gray-400 font-sans">
                      Only verified candidates in {candidate.departmentSelection || selectedDeptName} are admitted to this link.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(approvedDeptConfig.zoomMeetingLink, 'zoomLink')}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                      title="Copy Zoom Meeting Link"
                    >
                      {copiedKey === 'zoomLink' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <a
                      href={approvedDeptConfig.zoomMeetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-brand-dark font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-500/20"
                    >
                      <Video className="w-4 h-4" />
                      <span>Open Department Zoom</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* ONLINE WORK & MEETINGS / ZOOM MEETINGS SECTION */}
              {/* ============================================================== */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2">
                  <div>
                    <h4 className="text-lg font-display font-bold text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-brand-teal" />
                      <span>Online Meetings & Zoom Work Sessions</span>
                    </h4>
                    <p className="text-xs text-gray-400 font-light mt-0.5">
                      Participate in online work, screen sharing, discussions, training, interviews, and team sprint projects.
                    </p>
                  </div>

                  <span className="text-xs font-mono text-gray-400 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    {candidateMeetings.length} Scheduled Meeting{candidateMeetings.length === 1 ? '' : 's'}
                  </span>
                </div>

                {candidateMeetings.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {candidateMeetings.map(meeting => (
                      <div
                        key={meeting.id}
                        className="bg-black/60 border border-white/15 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-brand-teal/40 transition-all"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                              meeting.status === 'Live Now'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                                : meeting.status === 'Upcoming'
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                  : 'bg-white/10 text-gray-400 border border-white/20'
                            }`}>
                              {meeting.status === 'Live Now' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                              <span>{meeting.status}</span>
                            </span>

                            <span className="text-[11px] font-mono text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded-md border border-brand-teal/20">
                              {meeting.department}
                            </span>
                          </div>

                          <h5 className="text-base sm:text-lg font-display font-bold text-white">
                            {meeting.topic}
                          </h5>

                          <p className="text-xs text-gray-300 leading-relaxed font-sans">
                            {meeting.instructions}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-400 pt-1">
                            <span className="flex items-center gap-1.5 text-white">
                              <Calendar className="w-3.5 h-3.5 text-brand-teal" />
                              <span>{meeting.meetingDate}</span>
                            </span>
                            <span className="flex items-center gap-1.5 text-white">
                              <Clock className="w-3.5 h-3.5 text-brand-teal" />
                              <span>{meeting.meetingTime}</span>
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 w-full md:w-auto flex flex-col gap-2">
                          <a
                            href={meeting.zoomLink || approvedDeptConfig.zoomMeetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full md:w-auto px-6 py-3.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                              meeting.status === 'Live Now'
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-brand-dark shadow-emerald-500/30 animate-pulse'
                                : 'bg-brand-teal hover:bg-white text-brand-dark shadow-brand-teal/20'
                            }`}
                          >
                            <Video className="w-4 h-4" />
                            <span>{meeting.status === 'Live Now' ? 'Join Live Online Work' : 'Join Zoom Meeting'}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <p className="text-[10px] font-mono text-center text-gray-400">
                            Screen sharing & audio enabled
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-black/40 border border-dashed border-white/15 text-center space-y-2">
                    <Video className="w-8 h-8 mx-auto text-gray-500" />
                    <p className="text-sm font-semibold text-white">No active meetings scheduled right now</p>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                      Online work sessions, architectural syncs, and training sprints are posted by administration. You can access your permanent department room anytime using the Zoom link above.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ============================================================== */}
          {/* PENDING VERIFICATION NOTICE */}
          {/* ============================================================== */}
          {candidate.departmentStatus === 'Pending Verification' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 space-y-4"
            >
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-lg font-display font-bold text-white">
                    Department Verification in Progress
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-300 font-sans leading-relaxed">
                    Your request for <strong>{candidate.departmentSelection || selectedDeptName}</strong> has been submitted to S-CODERS recruitment management. An administrator will verify your profile and approve your department access shortly.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono">
                <div>
                  <span className="text-gray-400">Requested Department:</span>{' '}
                  <strong className="text-white">{candidate.departmentSelection || selectedDeptName}</strong>
                  <br />
                  <span className="text-gray-400">Target Reference Prefix:</span>{' '}
                  <strong className="text-amber-400">{getDepartmentPrefix(candidate.departmentSelection || selectedDeptName)}-2026-XXX</strong>
                </div>

                <button
                  type="button"
                  onClick={() => refreshCandidateStatus()}
                  disabled={isRefreshingStatus}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-brand-dark font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer hover:bg-amber-400 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
                  <span>Check Verification Status</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================== */}
          {/* DEPARTMENT SELECTION GRID (Shown if not yet requested or changing) */}
          {/* ============================================================== */}
          {(!candidate.departmentStatus || candidate.departmentStatus === 'Not Requested' || candidate.departmentStatus === 'Rejected' || candidate.departmentStatus === 'Pending Verification') && (
            <div className="space-y-6 bg-brand-card/60 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <h4 className="text-lg sm:text-xl font-display font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-teal" />
                    <span>Select Your Applied Department Group</span>
                  </h4>
                  <p className="text-xs text-gray-300 font-light mt-1">
                    Select the department corresponding to your applied role. Each department receives its own unique prefix and subgroup access upon admin verification.
                  </p>
                </div>

                <span className="text-xs font-mono text-brand-teal bg-brand-teal/10 px-3 py-1 rounded-full border border-brand-teal/30">
                  {departmentConfigs.length} Department Tracks
                </span>
              </div>

              {/* Department Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {departmentConfigs.map(dept => {
                  const isSelected = selectedDeptName.toLowerCase() === dept.name.toLowerCase();
                  return (
                    <div
                      key={dept.id}
                      onClick={() => setSelectedDeptName(dept.name)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left relative overflow-hidden ${
                        isSelected
                          ? 'bg-brand-teal/15 border-brand-teal shadow-lg shadow-brand-teal/15 ring-1 ring-brand-teal'
                          : 'bg-black/50 border-white/10 hover:border-white/25 hover:bg-white/5'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-teal/20 text-brand-teal border border-brand-teal/30">
                            {dept.referenceFormat}
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-brand-teal text-brand-dark flex items-center justify-center font-bold text-xs">
                              ✓
                            </span>
                          )}
                        </div>

                        <h5 className="font-display font-bold text-sm sm:text-base text-white mt-1">
                          {dept.name}
                        </h5>

                        <p className="text-xs text-gray-300 line-clamp-2 font-light leading-relaxed">
                          {dept.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 text-[11px] font-mono text-gray-400">
                        <span>Prefix: <strong className="text-white">{dept.codePrefix}</strong></span>
                        <a
                          href={dept.whatsappSubgroupLink || "https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q"}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-black font-mono font-bold text-[10px] uppercase flex items-center gap-1 transition-all border border-[#25D366]/30 shadow-sm shrink-0"
                          title={`Join ${dept.name} WhatsApp Group`}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit for Admin Verification CTA */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
                <div className="text-xs font-mono text-gray-300">
                  Selected: <strong className="text-brand-teal">{selectedDeptName || 'None selected'}</strong>{' '}
                  (Target Reference ID: <span className="text-white font-bold">{getDepartmentPrefix(selectedDeptName)}-2026-XXX</span>)
                </div>

                <button
                  type="button"
                  onClick={handleSubmitDepartment}
                  disabled={isSubmittingDept || !selectedDeptName}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-brand-teal text-brand-dark font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-brand-teal/25 hover:brightness-110 disabled:opacity-50"
                >
                  {isSubmittingDept ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Department for Admin Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
