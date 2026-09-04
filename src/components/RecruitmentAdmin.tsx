import React, { useState } from 'react';
import { 
  Briefcase, Search, RefreshCw, CheckCircle2, 
  Clock, AlertCircle, Trash2, Building2, User, Landmark, 
  FileText, ShieldCheck, Download, Sparkles
} from 'lucide-react';
import { CandidateApplication } from '../types';

interface RecruitmentAdminProps {
  applications: CandidateApplication[];
  onUpdateStatus: (id: string, newStatus: CandidateApplication['status'], notes?: string) => Promise<void> | void;
  onDeleteApplication: (id: string) => void;
  onRefresh: () => void;
}

const STATUS_COLORS: Record<CandidateApplication['status'], { bg: string; text: string; border: string }> = {
  'Submitted': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  'Under Review': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  'Shortlisted': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  'Technical Round': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'Offer Extended': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  'Hired': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'Archived': { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' }
};

export default function RecruitmentAdmin({
  applications,
  onUpdateStatus,
  onDeleteApplication,
  onRefresh
}: RecruitmentAdminProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSector, setFilterSector] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(() => applications[0]?.id || null);
  const [auditNote, setAuditNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);

  const selectedApp = applications.find(a => a.id === selectedAppId) || applications[0] || null;

  // Filtered applications
  const filteredApps = applications.filter(app => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      app.fullName?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q) ||
      app.phone?.toLowerCase().includes(q) ||
      app.sector?.toLowerCase().includes(q) ||
      app.agreementReferenceId?.toLowerCase().includes(q) ||
      app.panNumber?.toLowerCase().includes(q)
    );

    const matchesSector = filterSector === 'ALL' || app.sector === filterSector;
    const matchesStatus = filterStatus === 'ALL' || app.status === filterStatus;

    return matchesSearch && matchesSector && matchesStatus;
  });

  // Analytics counts
  const totalCount = applications.length;
  const underReviewCount = applications.filter(a => a.status === 'Under Review' || a.status === 'Submitted').length;
  const technicalCount = applications.filter(a => a.status === 'Technical Round' || a.status === 'Shortlisted').length;
  const hiredCount = applications.filter(a => a.status === 'Hired').length;

  const handleStatusChange = async (newStatus: CandidateApplication['status']) => {
    if (!selectedApp) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(selectedApp.id, newStatus, auditNote);
      setUpdateFeedback(`Status successfully advanced to "${newStatus}"`);
      setTimeout(() => setUpdateFeedback(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintAgreement = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-brand-dark/50 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-[10px] font-mono uppercase tracking-wider block">Total Applicants</span>
            <span className="text-2xl font-display font-black text-white mt-1 block">{totalCount}</span>
            <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">Induction agreements logged</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-brand-dark/50 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-[10px] font-mono uppercase tracking-wider block">Screening Queue</span>
            <span className="text-2xl font-display font-black text-blue-400 mt-1 block">{underReviewCount}</span>
            <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">Awaiting portfolio review</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-brand-dark/50 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-[10px] font-mono uppercase tracking-wider block">Technical Evaluations</span>
            <span className="text-2xl font-display font-black text-amber-400 mt-1 block">{technicalCount}</span>
            <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">Live coding / interview</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-brand-dark/50 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-[10px] font-mono uppercase tracking-wider block">Hired & Inducted</span>
            <span className="text-2xl font-display font-black text-emerald-400 mt-1 block">{hiredCount}</span>
            <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">Fully signed & onboarded</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-brand-dark/40 border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate by name, email, agreement ID, PAN, or sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-brand-card/70 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-teal"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sector Filter */}
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="px-3 py-2 bg-brand-card/80 border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-brand-teal"
          >
            <option value="ALL">All Sectors</option>
            <option value="Frontend Engineering">Frontend Engineering</option>
            <option value="Backend & AI Systems">Backend & AI Systems</option>
            <option value="Full Stack Development">Full Stack Development</option>
            <option value="Mobile App Development">Mobile App Development</option>
            <option value="DevOps & Cloud Systems">DevOps & Cloud Systems</option>
            <option value="UI/UX & Product Design">UI/UX & Product Design</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-brand-card/80 border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-brand-teal"
          >
            <option value="ALL">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Technical Round">Technical Round</option>
            <option value="Offer Extended">Offer Extended</option>
            <option value="Hired">Hired</option>
            <option value="Archived">Archived</option>
          </select>

          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            className="p-2 bg-brand-card/80 hover:bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-brand-teal transition-colors"
            title="Refresh Candidate Database"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left List of Candidates */}
        <div className="lg:col-span-4 bg-brand-dark/40 border border-white/5 rounded-2xl p-3 space-y-2 max-h-[850px] overflow-y-auto">
          <div className="px-3 py-2 flex items-center justify-between border-b border-white/5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
              Applications ({filteredApps.length})
            </span>
            <span className="text-[10px] font-mono text-brand-teal">Click to inspect</span>
          </div>

          {filteredApps.length === 0 ? (
            <div className="py-12 text-center text-gray-500 font-mono text-xs">
              No applications match current filters.
            </div>
          ) : (
            filteredApps.map((app) => {
              const isSelected = selectedApp?.id === app.id;
              const statusCfg = STATUS_COLORS[app.status] || STATUS_COLORS['Submitted'];

              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-teal/10 border-brand-teal/40 shadow-sm'
                      : 'bg-brand-card/40 border-white/5 hover:border-white/20 hover:bg-brand-card/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate max-w-[160px]">
                      {app.fullName}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-brand-teal/90">
                    <Briefcase className="w-3 h-3 shrink-0" />
                    <span className="truncate">{app.sector}</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                    <span className="truncate">Ref: {app.agreementReferenceId?.slice(-10) || app.id}</span>
                    <span>{new Date(app.submissionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-8 bg-brand-dark/40 border border-white/5 rounded-2xl p-6">
          {selectedApp ? (
            <div className="space-y-6">
              
              {/* Top Action & Status Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-display font-black text-white">
                      {selectedApp.fullName}
                    </h3>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                      STATUS_COLORS[selectedApp.status]?.bg || 'bg-brand-teal/10'
                    } ${
                      STATUS_COLORS[selectedApp.status]?.text || 'text-brand-teal'
                    } ${
                      STATUS_COLORS[selectedApp.status]?.border || 'border-brand-teal/30'
                    }`}>
                      {selectedApp.status}
                    </span>
                  </div>
                  <p className="text-xs text-brand-teal font-mono mt-0.5 flex items-center gap-2">
                    <span>{selectedApp.sector}</span>
                    <span>•</span>
                    <span>ID: {selectedApp.agreementReferenceId || selectedApp.id}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handlePrintAgreement}
                    className="px-3 py-1.5 bg-brand-card hover:bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Print / Save Full Legal Agreement"
                  >
                    <Download className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Print PDF</span>
                  </button>

                  <button
                    onClick={() => onDeleteApplication(selectedApp.id)}
                    className="px-3 py-1.5 bg-brand-card hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 rounded-xl text-xs font-mono text-gray-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Status Advancement Widget */}
              <div className="p-4 bg-brand-card/50 border border-brand-teal/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-gray-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-teal" />
                    Update Application Workflow Status
                  </span>
                  {updateFeedback && (
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                      {updateFeedback}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(['Submitted', 'Under Review', 'Shortlisted', 'Technical Round', 'Offer Extended', 'Hired', 'Archived'] as CandidateApplication['status'][]).map((st) => (
                    <button
                      key={st}
                      disabled={isUpdating || selectedApp.status === st}
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        selectedApp.status === st
                          ? 'bg-brand-teal text-brand-dark shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                    Internal HR / Tech Lead Evaluation Notes:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., Portfolio verified; approved by Bhuvan M. for round 2 technical review."
                      value={auditNote}
                      onChange={(e) => setAuditNote(e.target.value)}
                      className="flex-1 bg-brand-dark/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-teal"
                    />
                    <button
                      onClick={() => handleStatusChange(selectedApp.status)}
                      disabled={isUpdating || !auditNote.trim()}
                      className="px-3 py-2 bg-brand-teal/20 hover:bg-brand-teal/30 border border-brand-teal/40 text-brand-teal rounded-xl text-xs font-mono font-bold disabled:opacity-50 cursor-pointer"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              </div>

              {/* Part 1: Legal Agreement Details */}
              <div className="bg-brand-card/30 border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-brand-teal text-xs font-mono font-bold uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  <span>1. Agreement Identification</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">AGREEMENT TITLE</span>
                    <span className="text-white font-medium">{selectedApp.agreementTitle || 'Recruitment & Technical Induction Agreement'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">REFERENCE ID</span>
                    <span className="text-brand-teal font-mono font-bold">{selectedApp.agreementReferenceId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">EXECUTION DATE</span>
                    <span className="text-white">{selectedApp.agreementDate || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">EFFECTIVE COMMENCEMENT</span>
                    <span className="text-white">{selectedApp.effectiveDate || 'Immediate'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">DURATION / PROBATION</span>
                    <span className="text-white">{selectedApp.agreementDuration || '12 Months'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">LEGAL JURISDICTION</span>
                    <span className="text-white">{selectedApp.agreementJurisdiction || 'Bengaluru, Karnataka, India'}</span>
                  </div>
                </div>
              </div>

              {/* Part 2: S-CODERS Contracting Entity */}
              <div className="bg-brand-card/30 border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-brand-teal text-xs font-mono font-bold uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  <span>2. S-CODERS / Company Legal Information</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">LEGAL ENTITY</span>
                    <span className="text-white font-medium">{selectedApp.companyLegalName || 'S-CODERS INFOTECH PRIVATE LIMITED'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">CIN / REGISTRATION</span>
                    <span className="text-gray-300 font-mono">{selectedApp.companyCin || 'U72900KA2024PTC189021'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">GSTIN / PAN</span>
                    <span className="text-gray-300 font-mono">{selectedApp.companyGstin} / {selectedApp.companyPan}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-500 block text-[10px] font-mono">REGISTERED HEADQUARTERS</span>
                    <span className="text-white">{selectedApp.companyAddress}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">OFFICIAL TECH LEAD / REP</span>
                    <span className="text-emerald-400 font-bold">{selectedApp.companyAuthorizedRepresentative}</span>
                    <span className="text-[10px] text-gray-400 block">{selectedApp.companyRepresentativeDesignation}</span>
                  </div>
                </div>
              </div>

              {/* Part 3: Candidate Personal Demographics */}
              <div className="bg-brand-card/30 border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-brand-teal text-xs font-mono font-bold uppercase tracking-wider">
                  <User className="w-4 h-4" />
                  <span>3. Candidate Personal & Identification Data</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">LEGAL FULL NAME</span>
                    <span className="text-white font-bold">{selectedApp.candidateLegalName || selectedApp.fullName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">FATHER / GUARDIAN</span>
                    <span className="text-white">{selectedApp.guardianName || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">DOB & GENDER</span>
                    <span className="text-white">{selectedApp.dateOfBirth} • {selectedApp.gender}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">PAN NUMBER</span>
                    <span className="text-brand-teal font-mono font-bold">{selectedApp.panNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">AADHAAR CARD NO</span>
                    <span className="text-white font-mono">{selectedApp.aadhaarNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">COMMUNICATION</span>
                    <span className="text-white">{selectedApp.email}</span>
                    <span className="text-gray-400 block font-mono">{selectedApp.phone}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-500 block text-[10px] font-mono">PERMANENT RESIDENTIAL ADDRESS</span>
                    <span className="text-gray-300">{selectedApp.permanentAddress}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">EMERGENCY CONTACT</span>
                    <span className="text-white font-bold">{selectedApp.emergencyContactName}</span>
                    <span className="text-[10px] text-gray-400 block">{selectedApp.emergencyContactPhone}</span>
                  </div>
                </div>
              </div>

              {/* Part 4: Payroll & Bank Details */}
              <div className="bg-brand-card/30 border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-brand-teal text-xs font-mono font-bold uppercase tracking-wider">
                  <Landmark className="w-4 h-4" />
                  <span>4. Payroll Direct Deposit & Banking Coordinates</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">BANK NAME</span>
                    <span className="text-white font-bold">{selectedApp.bankName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">ACCOUNT BENEFICIARY</span>
                    <span className="text-white">{selectedApp.accountHolderName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">ACCOUNT NUMBER</span>
                    <span className="text-brand-teal font-mono font-bold">{selectedApp.accountNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">IFSC CODE</span>
                    <span className="text-white font-mono">{selectedApp.ifscCode}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-500 block text-[10px] font-mono">BRANCH JURISDICTION</span>
                    <span className="text-white">{selectedApp.branchName}</span>
                  </div>
                </div>
              </div>

              {/* Part 5: Digital Execution & Signatures */}
              <div className="bg-brand-card/30 border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-brand-teal text-xs font-mono font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>5. Digital Execution, Compliance & Timestamp</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-brand-dark/60 rounded-xl border border-white/5">
                    <span className="text-gray-500 block text-[10px] font-mono">CANDIDATE SIGNATURE</span>
                    <span className="font-serif italic text-base text-white block mt-1">
                      "{selectedApp.candidateDigitalSignature || selectedApp.fullName}"
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono mt-1 block">
                      Signed: {new Date(selectedApp.submissionDate).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 bg-brand-dark/60 rounded-xl border border-white/5">
                    <span className="text-gray-500 block text-[10px] font-mono">S-CODERS AUTHORIZED SIGNATORY</span>
                    <span className="font-serif italic text-base text-emerald-400 block mt-1">
                      "{selectedApp.companyAuthorizedRepresentative || 'Bhuvan M.'}"
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono mt-1 block">
                      Official Seal: S-CODERS INFOTECH SECURE SEAL [VERIFIED]
                    </span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="py-20 text-center text-gray-500 font-mono text-xs">
              Select an applicant from the list on the left to review their complete recruitment credentials and legal agreement.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
