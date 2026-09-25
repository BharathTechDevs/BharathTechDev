import React, { useState } from 'react';
import { 
  Users, Search, CheckCircle2, Clock, AlertCircle, 
  Copy, Check, ExternalLink, RefreshCw, Sparkles, MessageSquare, 
  Video, XCircle, Send, Hash, Building2, User, Landmark, ChevronRight
} from 'lucide-react';
import { CandidateApplication } from '../../types';
import { DatabaseEngine } from '../../utils/dbEngine';
import { generateDepartmentReferenceId, getDepartmentPrefix, DEFAULT_DEPARTMENTS } from '../../utils/departmentData';

interface DepartmentVerificationsAdminProps {
  applications: CandidateApplication[];
  onRefresh: () => void;
  onUpdateFeedback: (msg: string) => void;
}

export default function DepartmentVerificationsAdmin({
  applications,
  onRefresh,
  onUpdateFeedback
}: DepartmentVerificationsAdminProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  // Approval Modal State
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [candidateToApprove, setCandidateToApprove] = useState<CandidateApplication | null>(null);
  const [assignedDeptName, setAssignedDeptName] = useState('');
  const [assignedDeptRefId, setAssignedDeptRefId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [candidateToReject, setCandidateToReject] = useState<CandidateApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Qualifications or selected department do not match current openings.');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, keyName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Filter applications that have reached onboarding or requested department
  const relevantApps = applications.filter(app => {
    // Has submitted Step 1 and either completed Step 2 or selected a department
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      app.fullName?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q) ||
      app.id?.toLowerCase().includes(q) ||
      app.agreementReferenceId?.toLowerCase().includes(q) ||
      app.departmentReferenceId?.toLowerCase().includes(q) ||
      app.departmentSelection?.toLowerCase().includes(q) ||
      app.sector?.toLowerCase().includes(q)
    );

    const deptStatus = app.departmentStatus || (app.status === 'Onboarding Completed' ? 'Pending Verification' : 'Not Requested');
    const matchesStatus = statusFilter === 'ALL' || deptStatus === statusFilter;

    const candDept = app.departmentSelection || app.sector || '';
    const matchesDept = selectedDeptFilter === 'ALL' || candDept.toLowerCase().includes(selectedDeptFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesDept;
  });

  const pendingCount = applications.filter(a => a.departmentStatus === 'Pending Verification').length;
  const approvedCount = applications.filter(a => a.departmentStatus === 'Approved').length;

  const handleOpenApproveModal = (app: CandidateApplication) => {
    setCandidateToApprove(app);
    const dept = app.departmentSelection || app.sector || 'Front-End Developer';
    setAssignedDeptName(dept);
    
    // Generate unique Department Reference ID (e.g. GHZ-2026-A17)
    const existingIds = applications.map(a => a.departmentReferenceId || '');
    const generated = generateDepartmentReferenceId(dept, existingIds);
    setAssignedDeptRefId(app.departmentReferenceId || generated);
    setShowApproveModal(true);
  };

  const handleConfirmApproval = async () => {
    if (!candidateToApprove) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/careers/verify-department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: candidateToApprove.id,
          status: 'Approved',
          departmentReferenceId: assignedDeptRefId.trim().toUpperCase(),
          approvedBy: 'Recruitment Admin Desk'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.candidate) {
          DatabaseEngine.addCandidateApplication(data.candidate);
        }
      } else {
        DatabaseEngine.updateCandidateDepartmentVerification(
          candidateToApprove.id,
          'Approved',
          assignedDeptRefId.trim().toUpperCase(),
          assignedDeptName,
          undefined,
          'Recruitment Admin Desk'
        );
      }

      onUpdateFeedback(
        `✓ Department approved for ${candidateToApprove.fullName}! Reference ID [${assignedDeptRefId}] generated & email notice dispatched.`
      );
      onRefresh();
    } catch (e: any) {
      console.error(e);
      DatabaseEngine.updateCandidateDepartmentVerification(
        candidateToApprove.id,
        'Approved',
        assignedDeptRefId.trim().toUpperCase(),
        assignedDeptName,
        undefined,
        'Recruitment Admin Desk'
      );
      onRefresh();
    } finally {
      setIsProcessing(false);
      setShowApproveModal(false);
      setCandidateToApprove(null);
    }
  };

  const handleConfirmRejection = async () => {
    if (!candidateToReject) return;
    setIsProcessing(true);

    try {
      await fetch('/api/careers/verify-department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: candidateToReject.id,
          status: 'Rejected',
          rejectionReason,
          approvedBy: 'Recruitment Admin Desk'
        })
      });

      DatabaseEngine.updateCandidateDepartmentVerification(
        candidateToReject.id,
        'Rejected',
        undefined,
        candidateToReject.departmentSelection,
        rejectionReason,
        'Recruitment Admin Desk'
      );

      onUpdateFeedback(`✓ Department request declined for ${candidateToReject.fullName}.`);
      onRefresh();
    } catch (e: any) {
      console.error(e);
      DatabaseEngine.updateCandidateDepartmentVerification(
        candidateToReject.id,
        'Rejected',
        undefined,
        candidateToReject.departmentSelection,
        rejectionReason,
        'Recruitment Admin Desk'
      );
      onRefresh();
    } finally {
      setIsProcessing(false);
      setShowRejectModal(false);
      setCandidateToReject(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-gray-400">Total Department Queue</span>
            <span className="text-xl font-display font-black text-white block mt-0.5">{relevantApps.length}</span>
          </div>
          <Users className="w-8 h-8 text-brand-teal p-1.5 bg-brand-teal/10 rounded-xl" />
        </div>

        <div className="p-4 bg-black/40 border border-amber-500/30 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-amber-300">Pending Verification</span>
            <span className="text-xl font-display font-black text-amber-400 block mt-0.5">{pendingCount}</span>
          </div>
          <Clock className="w-8 h-8 text-amber-400 p-1.5 bg-amber-500/10 rounded-xl animate-pulse" />
        </div>

        <div className="p-4 bg-black/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-emerald-300">Approved & Active</span>
            <span className="text-xl font-display font-black text-emerald-400 block mt-0.5">{approvedCount}</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400 p-1.5 bg-emerald-500/10 rounded-xl" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-black/50 border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate name, email, 1st Ref ID, 2nd Ref ID, or Dept Ref ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-brand-card/70 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-brand-card border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-emerald-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending Verification">Pending Verification ({pendingCount})</option>
            <option value="Approved">Approved ({approvedCount})</option>
            <option value="Rejected">Rejected</option>
            <option value="Not Requested">Not Requested</option>
          </select>

          {/* Department Filter */}
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="px-3 py-2 bg-brand-card border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-emerald-400"
          >
            <option value="ALL">All Departments</option>
            {DEFAULT_DEPARTMENTS.map(d => (
              <option key={d.id} value={d.name}>{d.name} ({d.codePrefix})</option>
            ))}
          </select>

          <button
            onClick={onRefresh}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Candidate Verifications Cards */}
      <div className="space-y-3">
        {relevantApps.length > 0 ? (
          relevantApps.map(app => {
            const currentDeptStatus = app.departmentStatus || (app.status === 'Onboarding Completed' ? 'Pending Verification' : 'Not Requested');
            const targetDept = app.departmentSelection || app.sector || 'Front-End Developer';
            const deptPrefix = getDepartmentPrefix(targetDept);

            return (
              <div
                key={app.id}
                className="bg-black/50 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-5 backdrop-blur-md transition-all space-y-4"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-display font-extrabold text-white">
                        {app.candidateLegalName || app.fullName}
                      </h4>
                      <span className="text-xs font-mono text-gray-400">
                        {app.email} • {app.phone}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs text-gray-300 font-sans">
                      <span>Applied Role: <strong className="text-white">{app.roleTitle}</strong></span>
                      <span>•</span>
                      <span>Target Department: <strong className="text-brand-teal">{targetDept}</strong></span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
                      currentDeptStatus === 'Approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : currentDeptStatus === 'Pending Verification'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                          : currentDeptStatus === 'Rejected'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-white/10 text-gray-400 border-white/20'
                    }`}>
                      {currentDeptStatus === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {currentDeptStatus === 'Pending Verification' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{currentDeptStatus}</span>
                    </span>
                  </div>
                </div>

                {/* 3-Tier Reference IDs Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  {/* First Reference ID */}
                  <div className="p-3 bg-brand-dark/80 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">1st Ref ID (Initial)</span>
                      <span className="text-white font-bold block mt-0.5">{app.id}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(app.id, `fst_${app.id}`)}
                      className="p-1.5 text-gray-400 hover:text-white"
                      title="Copy First Reference ID"
                    >
                      {copiedKey === `fst_${app.id}` ? <Check className="w-3.5 h-3.5 text-brand-teal" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Second Reference ID */}
                  <div className="p-3 bg-brand-dark/80 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">2nd Ref ID (Joining)</span>
                      <span className="text-brand-teal font-bold block mt-0.5">{app.agreementReferenceId || 'Pending Stage 2'}</span>
                    </div>
                    {app.agreementReferenceId && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(app.agreementReferenceId || '', `sec_${app.id}`)}
                        className="p-1.5 text-gray-400 hover:text-white"
                        title="Copy Second Reference ID"
                      >
                        {copiedKey === `sec_${app.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Department Reference ID */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    app.departmentReferenceId
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-brand-dark/80 border-white/5 text-gray-400'
                  }`}>
                    <div>
                      <span className="text-[10px] uppercase block font-bold">Dept-Specific Ref ID</span>
                      <span className="font-extrabold block mt-0.5 text-sm">
                        {app.departmentReferenceId || `${deptPrefix}-2026-???`}
                      </span>
                    </div>
                    {app.departmentReferenceId && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(app.departmentReferenceId || '', `dept_${app.id}`)}
                        className="p-1.5 text-emerald-400 hover:text-white"
                        title="Copy Department Reference ID"
                      >
                        {copiedKey === `dept_${app.id}` ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="text-xs text-gray-400 font-sans">
                    {app.departmentApprovedAt ? (
                      <span>Approved on {new Date(app.departmentApprovedAt).toLocaleDateString()} by {app.departmentApprovedBy || 'Admin Desk'}</span>
                    ) : app.departmentRequestedAt ? (
                      <span className="text-amber-300">Requested on {new Date(app.departmentRequestedAt).toLocaleDateString()}</span>
                    ) : (
                      <span>Candidate ready for department allocation</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <a
                      href="https://chat.whatsapp.com/BwGu8qFYW7yHA9v0NUd84Q"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-black border border-[#25D366]/40 font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Open Department WhatsApp Group"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Group</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {currentDeptStatus !== 'Approved' && (
                      <button
                        type="button"
                        onClick={() => handleOpenApproveModal(app)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-brand-teal hover:brightness-110 text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verify & Approve ID</span>
                      </button>
                    )}

                    {currentDeptStatus === 'Approved' && (
                      <button
                        type="button"
                        onClick={() => handleOpenApproveModal(app)}
                        className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-mono text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Update ID</span>
                      </button>
                    )}

                    {currentDeptStatus !== 'Rejected' && (
                      <button
                        type="button"
                        onClick={() => {
                          setCandidateToReject(app);
                          setShowRejectModal(true);
                        }}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-black/40 rounded-2xl border border-white/5 space-y-2">
            <Users className="w-8 h-8 text-gray-500 mx-auto" />
            <p className="text-sm font-semibold text-white">No candidates matching filter</p>
            <p className="text-xs text-gray-400">Try changing the status or search query above.</p>
          </div>
        )}
      </div>

      {/* APPROVE & ISSUE DEPARTMENT REFERENCE ID MODAL */}
      {showApproveModal && candidateToApprove && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-dark border-2 border-emerald-500/50 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-emerald-400 font-display font-bold text-lg">
                <Sparkles className="w-5 h-5" />
                <span>Verify & Issue Department Reference ID</span>
              </div>
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-1 font-mono">
                <p><span className="text-gray-400">Candidate:</span> <strong className="text-white">{candidateToApprove.fullName}</strong></p>
                <p><span className="text-gray-400">Official Email:</span> <strong className="text-white">{candidateToApprove.email}</strong></p>
                <p><span className="text-gray-400">Second Reference ID:</span> <strong className="text-brand-teal">{candidateToApprove.agreementReferenceId || candidateToApprove.id}</strong></p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                  Confirm Department:
                </label>
                <select
                  value={assignedDeptName}
                  onChange={(e) => {
                    const newDept = e.target.value;
                    setAssignedDeptName(newDept);
                    const existing = applications.map(a => a.departmentReferenceId || '');
                    setAssignedDeptRefId(generateDepartmentReferenceId(newDept, existing));
                  }}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  {DEFAULT_DEPARTMENTS.map(d => (
                    <option key={d.id} value={d.name}>{d.name} ({d.codePrefix})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>Unique Department Reference ID:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const existing = applications.map(a => a.departmentReferenceId || '');
                      setAssignedDeptRefId(generateDepartmentReferenceId(assignedDeptName, existing));
                    }}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Regenerate Unique Code</span>
                  </button>
                </label>
                <input
                  type="text"
                  value={assignedDeptRefId}
                  onChange={(e) => setAssignedDeptRefId(e.target.value.toUpperCase())}
                  placeholder="e.g. GHZ-2026-A17"
                  className="w-full bg-black/80 border border-emerald-500/50 rounded-xl px-4 py-3 font-mono font-bold text-sm text-emerald-400 focus:outline-none focus:border-emerald-400 uppercase tracking-wider"
                />
                <p className="text-[11px] text-gray-400 font-mono mt-1">
                  Prefix: <strong className="text-white">{getDepartmentPrefix(assignedDeptName)}</strong> • Year: <strong className="text-white">2026</strong> • Unique Candidate Code: <strong className="text-white">{assignedDeptRefId.split('-')[2] || 'XXX'}</strong>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Approving will immediately unlock WhatsApp subgroup and department Zoom links for candidate, and send confirmation email.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-mono text-gray-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing || !assignedDeptRefId}
                onClick={handleConfirmApproval}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-brand-teal text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Issuing...' : 'Approve & Issue ID'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DECLINE DEPARTMENT REQUEST MODAL */}
      {showRejectModal && candidateToReject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-dark border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-display font-bold">
                <XCircle className="w-5 h-5" />
                <span>Decline Department Request</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Decline department request for <strong>{candidateToReject.fullName}</strong>. They will be notified to select an alternate department or re-apply.
            </p>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1">
                Reason / Note:
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-gray-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmRejection}
                className="px-5 py-2 bg-rose-500 text-white font-mono font-bold text-xs uppercase rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-rose-400 shadow-md"
              >
                <span>{isProcessing ? 'Declining...' : 'Decline Request'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
