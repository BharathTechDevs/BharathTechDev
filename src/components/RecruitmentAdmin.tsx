import React, { useState } from 'react';
import { 
  Briefcase, Search, RefreshCw, CheckCircle2, 
  Clock, AlertCircle, Trash2, Building2, User, Landmark, 
  FileText, ShieldCheck, Download, Sparkles,
  Mail, Key, Lock, Check, Copy, ExternalLink, Calendar, Video, ThumbsUp, ThumbsDown, XCircle, Send
} from 'lucide-react';
import { CandidateApplication } from '../types';
import { DatabaseEngine } from '../utils/dbEngine';

interface RecruitmentAdminProps {
  applications: CandidateApplication[];
  onUpdateStatus: (id: string, newStatus: CandidateApplication['status'], notes?: string) => Promise<void> | void;
  onDeleteApplication: (id: string) => void;
  onRefresh: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Submitted': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  'Under Review': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  'Shortlisted': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  'Interview Scheduled': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  'Interview Cleared': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'Approved for Onboarding': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'Onboarding Completed': { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/30' },
  'Technical Round': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'Offer Extended': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  'Hired': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'Rejected': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
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

  // 7-Stage Workflow Modal States
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewMeetingLink, setInterviewMeetingLink] = useState('https://meet.google.com/scoders-tech-interview');
  const [interviewNotes, setInterviewNotes] = useState('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Qualifications and profile did not align with immediate project requirements.');

  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedOnboardingLink, setCopiedOnboardingLink] = useState(false);

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

    const matchesSector = filterSector === 'ALL' || 
      app.sector === filterSector ||
      (filterSector === 'Backend & AI Systems' && (app.sector === 'AI & Automation Engineering' || app.sector === 'Backend & AI Systems')) ||
      (filterSector === 'Full-Stack Web Development' && (app.sector === 'Full-Stack Web Development' || app.sector === 'Full Stack Development')) ||
      (filterSector === 'Video Editing' && (app.sector === 'Video Editing' || app.sector === 'Video Editing & Multimedia')) ||
      (filterSector === 'Content Writing' && (app.sector === 'Content Writing' || app.sector === 'Content Writing & Copywriting')) ||
      (filterSector === 'Digital Marketing' && (app.sector === 'Digital Marketing' || app.sector === 'Digital Marketing & Growth')) ||
      (filterSector === 'Startup & Business' && (app.sector === 'Startup & Business' || app.sector === 'Business Development & Operations')) ||
      (filterSector === 'Event Management' && (app.sector === 'Event Management' || app.sector === 'Tech Workshops & Community Growth')) ||
      (filterSector === 'DevOps & Cloud Systems' && (app.sector === 'Cloud & Infrastructure' || app.sector === 'DevOps & Cloud Systems'));
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

  const handleShortlistSubmit = async () => {
    if (!selectedApp) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/careers/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedApp.id,
          interviewDate: interviewDate || 'Within 2-3 business days (to be coordinated)',
          interviewMeetingLink: interviewMeetingLink || 'https://meet.google.com/scoders-tech-interview',
          notes: interviewNotes
        })
      });
      const data = await res.json();
      if (res.ok && data.candidate) {
        DatabaseEngine.addCandidateApplication(data.candidate);
        setUpdateFeedback(`✓ Candidate shortlisted! Interview invitation email dispatched from scoders82@gmail.com.`);
        setShowShortlistModal(false);
        onRefresh();
      } else {
        alert(data.error || 'Failed to shortlist candidate.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error communicating with recruitment server.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInterviewDecision = async (decision: 'Cleared' | 'Not Cleared') => {
    if (!selectedApp) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/careers/interview-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedApp.id,
          decision,
          feedback: auditNote || (decision === 'Cleared' ? 'Candidate passed technical assessment and showed strong architectural acumen.' : 'Candidate did not meet criteria for the role.')
        })
      });
      const data = await res.json();
      if (res.ok && data.candidate) {
        DatabaseEngine.addCandidateApplication(data.candidate);
        setUpdateFeedback(decision === 'Cleared' 
          ? `✓ Interview Cleared! Candidate can now be authorized for Stage 2 induction.`
          : `Interview outcome recorded: Not Cleared.`
        );
        onRefresh();
      } else {
        alert(data.error || 'Failed to record interview decision.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error updating interview outcome.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAuthorizeOnboarding = async () => {
    if (!selectedApp) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/careers/authorize-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedApp.id,
          notes: auditNote || 'Approved for Legal Induction, Government ID verification, and Banking details.'
        })
      });
      const data = await res.json();
      if (res.ok && data.candidate) {
        DatabaseEngine.addCandidateApplication(data.candidate);
        setUpdateFeedback(`✓ Onboarding Token [${data.token}] generated & dispatch email sent from scoders82@gmail.com!`);
        onRefresh();
      } else {
        alert(data.error || 'Failed to authorize onboarding.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error authorizing onboarding.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedApp) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/careers/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedApp.id,
          reason: rejectionReason
        })
      });
      const data = await res.json();
      if (res.ok && data.candidate) {
        DatabaseEngine.addCandidateApplication(data.candidate);
        setUpdateFeedback(`Candidate status updated to Rejected. Formal notification dispatched from scoders82@gmail.com.`);
        setShowRejectModal(false);
        onRefresh();
      } else {
        alert(data.error || 'Failed to record rejection.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error processing rejection.');
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
            <option value="AI & Automation Engineering">AI & Automation Engineering</option>
            <option value="Frontend Engineering">Frontend Engineering</option>
            <option value="Backend & AI Systems">Backend & AI Systems</option>
            <option value="Full-Stack Web Development">Full-Stack Web Development</option>
            <option value="Mobile App Development">Mobile App Development</option>
            <option value="Video Editing">Video Editing</option>
            <option value="Content Writing">Content Writing</option>
            <option value="Digital Marketing">Digital Marketing</option>
            <option value="Startup & Business">Startup & Business</option>
            <option value="Event Management">Event Management</option>
            <option value="UI/UX & Product Design">UI/UX & Product Design</option>
            <option value="DevOps & Cloud Systems">DevOps & Cloud Systems</option>
            <option value="QA & Software Testing">QA & Software Testing</option>
            <option value="Tech Workshops & Community Growth">Tech Workshops & Community Growth</option>
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

              {/* 7-Stage Workflow Action Center */}
              <div className="p-5 bg-brand-card/60 border border-brand-teal/30 rounded-2xl space-y-4 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-teal" />
                    <span className="text-xs font-mono uppercase tracking-wider text-white font-bold">
                      7-Stage Recruitment Workflow Pipeline
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${STATUS_COLORS[selectedApp.status]?.bg || 'bg-white/5'} ${STATUS_COLORS[selectedApp.status]?.text || 'text-white'} ${STATUS_COLORS[selectedApp.status]?.border || 'border-white/10'}`}>
                      {selectedApp.status}
                    </span>
                  </div>
                  {updateFeedback && (
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5 animate-fadeIn">
                      <Check className="w-3.5 h-3.5" />
                      {updateFeedback}
                    </span>
                  )}
                </div>

                {/* Stage Tracker Visual */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs font-mono">
                  <div className={`p-2.5 rounded-xl border text-center ${
                    selectedApp.status ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-400'
                  }`}>
                    <span className="text-[10px] block text-gray-400">STAGE 1</span>
                    <span className="font-bold text-[11px] block mt-0.5">Form 1 Received</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border text-center ${
                    selectedApp.status === 'Shortlisted' || selectedApp.status === 'Interview Scheduled' || selectedApp.status === 'Interview Cleared' || selectedApp.status === 'Approved for Onboarding' || selectedApp.status === 'Onboarding Completed' || selectedApp.status === 'Hired'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : selectedApp.status === 'Under Review'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}>
                    <span className="text-[10px] block text-gray-400">STAGE 2</span>
                    <span className="font-bold text-[11px] block mt-0.5">Screening</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border text-center ${
                    selectedApp.interviewCleared || selectedApp.status === 'Interview Cleared' || selectedApp.status === 'Approved for Onboarding' || selectedApp.status === 'Onboarding Completed' || selectedApp.status === 'Hired'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : selectedApp.status === 'Shortlisted' || selectedApp.status === 'Interview Scheduled' || selectedApp.status === 'Technical Round'
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}>
                    <span className="text-[10px] block text-gray-400">STAGE 3 & 4</span>
                    <span className="font-bold text-[11px] block mt-0.5">Interview</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border text-center ${
                    selectedApp.onboardingAuthorized || selectedApp.onboardingToken || selectedApp.status === 'Approved for Onboarding' || selectedApp.status === 'Onboarding Completed' || selectedApp.status === 'Hired'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}>
                    <span className="text-[10px] block text-gray-400">STAGE 5</span>
                    <span className="font-bold text-[11px] block mt-0.5">Stage 2 Access</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border text-center ${
                    selectedApp.status === 'Onboarding Completed' || selectedApp.status === 'Hired'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}>
                    <span className="text-[10px] block text-gray-400">STAGE 6</span>
                    <span className="font-bold text-[11px] block mt-0.5">NDA & Banking</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border text-center ${
                    selectedApp.status === 'Hired'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                      : selectedApp.status === 'Rejected'
                      ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}>
                    <span className="text-[10px] block text-gray-400">STAGE 7</span>
                    <span className="font-bold text-[11px] block mt-0.5">Decision</span>
                  </div>
                </div>

                {/* Specific Action Buttons for Current Workflow State */}
                <div className="bg-brand-dark/50 p-4 rounded-xl border border-white/10 space-y-3">
                  <div className="text-xs font-mono uppercase text-gray-400 font-semibold">
                    Recommended Next Action for {selectedApp.fullName}:
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* If Under Review or Submitted: Option to shortlist or mark review */}
                    {(selectedApp.status === 'Submitted' || selectedApp.status === 'Under Review') && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setInterviewDate(new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16));
                            setShowShortlistModal(true);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-brand-dark font-mono font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Shortlist & Schedule Technical Interview</span>
                        </button>

                        {selectedApp.status !== 'Under Review' && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleStatusChange('Under Review')}
                            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 font-mono text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            <span>Mark as Under Review</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* If Shortlisted / Technical Round: Record Interview Decision */}
                    {(selectedApp.status === 'Shortlisted' || selectedApp.status === 'Interview Scheduled' || selectedApp.status === 'Technical Round') && (
                      <div className="w-full space-y-2.5">
                        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-cyan-400" />
                            <span><strong>Interview Scheduled:</strong> {selectedApp.interviewDate || 'Pending Date Confirmation'}</span>
                          </div>
                          {selectedApp.interviewMeetingLink && (
                            <a
                              href={selectedApp.interviewMeetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] underline flex items-center gap-1 text-cyan-200 hover:text-white"
                            >
                              <span>Open Google Meet</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleInterviewDecision('Cleared')}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-brand-dark font-mono font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Technical Interview Cleared (Pass)</span>
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleInterviewDecision('Not Cleared')}
                            className="px-3.5 py-2 bg-white/5 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            <span>Interview Not Cleared</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* If Interview Cleared: Authorize Stage 2 */}
                    {selectedApp.status === 'Interview Cleared' && (
                      <div className="w-full space-y-2">
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Candidate passed technical interview! You can now authorize access to Step 2 (Legal NDA & Bank Details).</span>
                        </div>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={handleAuthorizeOnboarding}
                          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-brand-teal to-emerald-400 hover:from-white hover:to-teal-200 text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-brand-teal/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                        >
                          <Key className="w-4 h-4" />
                          <span>Generate Security Token & Authorize Stage 2 (Dispatches Email)</span>
                        </button>
                      </div>
                    )}

                    {/* If Approved for Onboarding or Token is Generated: Display Token & Link */}
                    {(selectedApp.onboardingToken || selectedApp.status === 'Approved for Onboarding') && (
                      <div className="w-full p-4 bg-brand-dark/90 border border-brand-teal/40 rounded-xl space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-mono font-bold text-brand-teal uppercase flex items-center gap-1.5">
                            <Key className="w-4 h-4" />
                            Active Onboarding Access Token & Secure Gatekeeper Link:
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            Sent to candidate via <code className="text-cyan-300">scoders82@gmail.com</code>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-brand-card rounded-lg border border-white/10 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono text-gray-400 block">TOKEN CODE</span>
                              <span className="font-mono text-sm font-bold text-white select-all">
                                {selectedApp.onboardingToken}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedApp.onboardingToken || '');
                                setCopiedToken(true);
                                setTimeout(() => setCopiedToken(false), 2000);
                              }}
                              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white cursor-pointer"
                              title="Copy Token"
                            >
                              {copiedToken ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>

                          <div className="p-3 bg-brand-card rounded-lg border border-white/10 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] font-mono text-gray-400 block">DIRECT ONBOARDING LINK</span>
                              <span className="font-mono text-xs text-brand-teal truncate block">
                                {window.location.origin}/careers?stage=onboarding&appId={selectedApp.id}&token={selectedApp.onboardingToken}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const link = `${window.location.origin}/careers?stage=onboarding&appId=${selectedApp.id}&token=${selectedApp.onboardingToken}`;
                                  navigator.clipboard.writeText(link);
                                  setCopiedOnboardingLink(true);
                                  setTimeout(() => setCopiedOnboardingLink(false), 2000);
                                }}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white cursor-pointer"
                                title="Copy Direct URL"
                              >
                                {copiedOnboardingLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              </button>
                              <a
                                href={`/careers?stage=onboarding&appId=${selectedApp.id}&token=${selectedApp.onboardingToken}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-brand-teal hover:text-white cursor-pointer"
                                title="Open Form in New Tab"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>

                        {selectedApp.status !== 'Onboarding Completed' && selectedApp.status !== 'Hired' && (
                          <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                            <span>Awaiting candidate submission of government identity, permanent address, and bank account details.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* If Onboarding Completed: Mark as Hired */}
                    {selectedApp.status === 'Onboarding Completed' && (
                      <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                        <div className="flex items-center gap-2 text-xs text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Candidate has submitted bank details, PAN/Aadhaar & signed the Legal Agreement!</span>
                        </div>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange('Hired')}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-brand-dark font-mono font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark as Hired / Offer Confirmed</span>
                        </button>
                      </div>
                    )}

                    {/* Rejection Option (courteous email) */}
                    {selectedApp.status !== 'Rejected' && selectedApp.status !== 'Hired' && (
                      <button
                        type="button"
                        onClick={() => setShowRejectModal(true)}
                        className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-mono text-xs rounded-xl flex items-center gap-1.5 cursor-pointer ml-auto"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Send Polite Rejection</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Status Override Chips */}
                <div className="pt-2 border-t border-white/10">
                  <span className="text-[10px] font-mono text-gray-400 uppercase block mb-1.5">
                    Manual Workflow Status Override:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['Submitted', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Interview Cleared', 'Approved for Onboarding', 'Onboarding Completed', 'Hired', 'Rejected', 'Archived'] as CandidateApplication['status'][]).map((st) => (
                      <button
                        key={st}
                        disabled={isUpdating || selectedApp.status === st}
                        onClick={() => handleStatusChange(st)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                          selectedApp.status === st
                            ? 'bg-brand-teal text-brand-dark shadow-sm font-bold'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Internal HR / Tech Lead Evaluation Notes */}
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
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">BRANCH JURISDICTION</span>
                    <span className="text-white">{selectedApp.branchName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] font-mono">UPI ID</span>
                    <span className="text-brand-teal font-mono font-bold">
                      {selectedApp.upiId || (selectedApp.onboardingAuthorized ? 'Not provided' : 'Pending Stage 2 Onboarding')}
                    </span>
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

      {/* SHORTLIST & INTERVIEW SCHEDULING MODAL */}
      {showShortlistModal && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-dark border border-brand-teal/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-brand-teal font-display font-bold text-lg">
                <Calendar className="w-5 h-5" />
                <span>Shortlist & Schedule Technical Interview</span>
              </div>
              <button
                type="button"
                onClick={() => setShowShortlistModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-300 space-y-1">
              <p>Candidate: <strong className="text-white">{selectedApp.fullName}</strong> ({selectedApp.email})</p>
              <p>Role / Sector: <span className="text-cyan-300 font-mono">{selectedApp.sector}</span></p>
              <p className="text-gray-400 pt-1">
                Submitting this will advance status to <strong>"Interview Scheduled"</strong> and immediately dispatch a formal technical invitation from <code className="text-cyan-300 font-mono">scoders82@gmail.com</code>.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1">
                  Interview Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full bg-brand-card border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-teal font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1">
                  Google Meet / Video Link
                </label>
                <input
                  type="url"
                  value={interviewMeetingLink}
                  onChange={(e) => setInterviewMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full bg-brand-card border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-teal font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1">
                  Custom Message / Interview Scope:
                </label>
                <textarea
                  rows={3}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="e.g. Please be ready with your GitHub portfolio and walk us through your architecture."
                  className="w-full bg-brand-card border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-teal"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowShortlistModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-gray-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleShortlistSubmit}
                className="px-5 py-2.5 bg-brand-teal hover:bg-white text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-brand-teal/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isUpdating ? 'Dispatching...' : 'Dispatch Interview Email'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT CANDIDATE MODAL */}
      {showRejectModal && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-dark border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-rose-400 font-display font-bold text-lg">
                <XCircle className="w-5 h-5" />
                <span>Send Polite Rejection Notice</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-300 space-y-1">
              <p>Candidate: <strong className="text-white">{selectedApp.fullName}</strong> ({selectedApp.email})</p>
              <p className="text-gray-400 pt-1">
                A formal, respectful notification thanking them for their time will be dispatched from <code className="text-cyan-300 font-mono">scoders82@gmail.com</code>.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1">
                  Reason / Constructive Feedback:
                </label>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide respectful context..."
                  className="w-full bg-brand-card border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-gray-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleRejectSubmit}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isUpdating ? 'Sending...' : 'Confirm Rejection Email'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
