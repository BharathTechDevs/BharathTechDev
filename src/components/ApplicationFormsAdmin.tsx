import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Key, ShieldCheck, Trash2, Eye, Copy, Check, 
  ExternalLink, ArrowRight, RefreshCw, Plus, Download, Printer, 
  X, CheckCircle2, AlertCircle, Building2, User, Landmark, Mail, Phone, Calendar, Lock
} from 'lucide-react';
import { CandidateApplication } from '../types';
import { DatabaseEngine } from '../utils/dbEngine';
import { 
  getSavedCandidateApplications, 
  saveCandidateApplications, 
  addSavedCandidateApplication, 
  removeSavedCandidateApplication 
} from '../utils/dynamicData';
import UpiQrCanvas from './UpiQrCanvas';

interface ApplicationFormsAdminProps {
  onRefreshParent?: () => void;
}

export default function ApplicationFormsAdmin({ onRefreshParent }: ApplicationFormsAdminProps) {
  const [savedApplications, setSavedApplications] = useState<CandidateApplication[]>(() => {
    return getSavedCandidateApplications();
  });
  const [allDbApplications, setAllDbApplications] = useState<CandidateApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSector, setFilterSector] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [viewingApp, setViewingApp] = useState<CandidateApplication | null>(null);
  const [appToDelete, setAppToDelete] = useState<CandidateApplication | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupFeedback, setLookupFeedback] = useState<{ type: 'SUCCESS' | 'ERROR'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadData = () => {
    const saved = getSavedCandidateApplications();
    setSavedApplications(saved);
    const dbApps = DatabaseEngine.getCandidateApplications();
    setAllDbApplications(dbApps);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('scoders_saved_applications_change', handleUpdate);
    window.addEventListener('scoders_db_change', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('scoders_saved_applications_change', handleUpdate);
      window.removeEventListener('scoders_db_change', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Merge saved applications with db applications to ensure admin has access to all forms
  const combinedApplications = React.useMemo(() => {
    const map = new Map<string, CandidateApplication>();
    // First add all applications from DB
    allDbApplications.forEach(app => map.set(app.id, app));
    // Then overlay with any saved applications on device
    savedApplications.forEach(app => map.set(app.id, app));
    return Array.from(map.values()).sort((a, b) => {
      return (b.submissionDate || '').localeCompare(a.submissionDate || '');
    });
  }, [savedApplications, allDbApplications]);

  const sectors = React.useMemo(() => {
    const set = new Set<string>();
    combinedApplications.forEach(a => {
      if (a.sector) set.add(a.sector);
    });
    return Array.from(set);
  }, [combinedApplications]);

  const filteredApplications = React.useMemo(() => {
    return combinedApplications.filter(app => {
      const matchesSearch = 
        !searchQuery ||
        app.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.roleTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.sector?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.keySkills?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSector = filterSector === 'ALL' || app.sector === filterSector;
      const matchesStatus = filterStatus === 'ALL' || app.status === filterStatus;

      return matchesSearch && matchesSector && matchesStatus;
    });
  }, [combinedApplications, searchQuery, filterSector, filterStatus]);

  const handleLookupAndAdd = async () => {
    const raw = manualInput.trim();
    if (!raw) return;

    setIsLookingUp(true);
    setLookupFeedback(null);

    try {
      let targetId = raw;
      // Handle pasted URL
      if (raw.includes('appId=')) {
        try {
          const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
          targetId = url.searchParams.get('appId') || targetId;
        } catch {
          // fallback to regex
          const match = raw.match(/appId=([^&]+)/);
          if (match) targetId = decodeURIComponent(match[1]);
        }
      }

      // Check DB
      const dbApps = DatabaseEngine.getCandidateApplications();
      let found = dbApps.find(a => 
        a.id.toLowerCase() === targetId.toLowerCase() || 
        a.email.toLowerCase() === targetId.toLowerCase() ||
        (a.onboardingToken && a.onboardingToken.toLowerCase() === targetId.toLowerCase())
      );

      // Also check server API if not found
      if (!found) {
        try {
          const res = await fetch(`/api/careers/applications/${encodeURIComponent(targetId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.application) {
              found = data.application;
            }
          }
        } catch (e) {
          console.warn('API lookup warning:', e);
        }
      }

      if (found) {
        addSavedCandidateApplication(found);
        setSavedApplications(getSavedCandidateApplications());
        setLookupFeedback({
          type: 'SUCCESS',
          message: `Application #${found.id} for "${found.fullName}" successfully added and saved to Admin forms collection!`
        });
        setManualInput('');
        setTimeout(() => {
          setShowKeyModal(false);
          setLookupFeedback(null);
        }, 1500);
      } else {
        setLookupFeedback({
          type: 'ERROR',
          message: `No application form found matching "${raw}". Please check the ID or paste the direct application link.`
        });
      }
    } catch (err: any) {
      setLookupFeedback({
        type: 'ERROR',
        message: `Error verifying application form: ${err?.message || 'Unknown error'}`
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (!appToDelete) return;
    removeSavedCandidateApplication(appToDelete.id);
    setSavedApplications(getSavedCandidateApplications());
    // Also remove from DB if user confirmed
    const remainingDb = DatabaseEngine.getCandidateApplications().filter(c => c.id !== appToDelete.id);
    DatabaseEngine.saveCandidateApplications(remainingDb);
    loadData();
    if (onRefreshParent) onRefreshParent();
    setActionNotice(`Application form #${appToDelete.id} removed successfully.`);
    setTimeout(() => setActionNotice(null), 3000);
    setShowDeleteModal(false);
    setAppToDelete(null);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusChange = async (appId: string, newStatus: CandidateApplication['status']) => {
    DatabaseEngine.updateCandidateApplicationStatus(appId, newStatus);
    const updatedSaved = savedApplications.map(a => a.id === appId ? { ...a, status: newStatus } : a);
    saveCandidateApplications(updatedSaved);
    setSavedApplications(updatedSaved);
    if (viewingApp && viewingApp.id === appId) {
      setViewingApp({ ...viewingApp, status: newStatus });
    }
    loadData();
    if (onRefreshParent) onRefreshParent();
    setActionNotice(`Status updated to "${newStatus}" for Application #${appId}.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div className="space-y-6 text-white font-sans animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-brand-card/70 border border-brand-teal/30 p-6 sm:p-8 rounded-3xl backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-teal/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/30 text-brand-teal text-xs font-mono font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-brand-teal" />
              <span>Admin Protected Workspace • Candidate Dossiers</span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-3">
              <FileText className="w-8 h-8 text-brand-teal" />
              <span>My Saved Application Forms</span>
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm font-sans leading-relaxed">
              Centrally inspect, verify, print, and manage all candidate application forms, signed induction agreements, and background verification records. Restricted exclusively to authenticated administrators.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setShowKeyModal(true)}
              className="flex-1 sm:flex-initial px-5 py-3 bg-brand-teal hover:bg-white text-brand-dark rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-brand-teal/20"
            >
              <Plus className="w-4 h-4" />
              <span>+ Paste Link to Add Form</span>
            </button>
            <button
              type="button"
              onClick={loadData}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
              title="Refresh Application Forms"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-black/40 border border-white/5 p-3.5 rounded-2xl">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Total Forms</span>
            <span className="text-2xl font-display font-extrabold text-white mt-1 block">{combinedApplications.length}</span>
          </div>
          <div className="bg-black/40 border border-white/5 p-3.5 rounded-2xl">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">Submitted / Review</span>
            <span className="text-2xl font-display font-extrabold text-cyan-300 mt-1 block">
              {combinedApplications.filter(a => a.status === 'Submitted' || a.status === 'Under Review').length}
            </span>
          </div>
          <div className="bg-black/40 border border-white/5 p-3.5 rounded-2xl">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">Onboarding Approved</span>
            <span className="text-2xl font-display font-extrabold text-amber-300 mt-1 block">
              {combinedApplications.filter(a => a.status === 'Approved for Onboarding').length}
            </span>
          </div>
          <div className="bg-black/40 border border-white/5 p-3.5 rounded-2xl">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block">Hired / Onboarded</span>
            <span className="text-2xl font-display font-extrabold text-emerald-300 mt-1 block">
              {combinedApplications.filter(a => a.status === 'Onboarding Completed' || a.status === 'Hired').length}
            </span>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-2xl font-mono text-xs flex items-center justify-between gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filtering Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-black/40 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, ID, role, skills, email..."
            className="w-full pl-10 pr-4 py-2.5 bg-transparent text-xs font-mono text-white placeholder-gray-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="px-3 py-2 bg-brand-card border border-white/10 rounded-xl text-xs font-mono text-gray-300 focus:outline-none cursor-pointer flex-1 sm:flex-initial"
          >
            <option value="ALL">All Sectors ({combinedApplications.length})</option>
            {sectors.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-brand-card border border-white/10 rounded-xl text-xs font-mono text-gray-300 focus:outline-none cursor-pointer flex-1 sm:flex-initial"
          >
            <option value="ALL">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Approved for Onboarding">Approved for Onboarding</option>
            <option value="Onboarding Completed">Onboarding Completed</option>
            <option value="Hired">Hired</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Application Cards Grid */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-16 bg-brand-card/40 border border-white/10 rounded-3xl p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-display font-bold text-white">No Application Forms Found</h3>
          <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-sans">
            {searchQuery || filterSector !== 'ALL' || filterStatus !== 'ALL'
              ? 'No application forms match your active search and filter criteria.'
              : 'No candidate applications have been saved or submitted yet. Use "+ Paste Link to Add Form" to paste any candidate passkey or application URL.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => setShowKeyModal(true)}
              className="px-5 py-2.5 bg-brand-teal text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all cursor-pointer shadow-lg shadow-brand-teal/20"
            >
              + Paste Link or Key to Add Form
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              className="bg-brand-card/90 border border-brand-teal/30 hover:border-brand-teal/60 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-2xl flex flex-col justify-between space-y-6 transition-all group"
            >
              <div className="space-y-4 relative z-10">
                {/* Header: Status Badge + Submission Date + Delete */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3 gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    app.status === 'Onboarding Completed' || app.status === 'Hired'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : app.status === 'Approved for Onboarding'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : app.status === 'Shortlisted'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{app.status || 'Submitted'}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-gray-400">{app.submissionDate || 'Recent'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppToDelete(app);
                        setShowDeleteModal(true);
                      }}
                      title="Remove from saved forms"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Role Title & Sector */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-brand-teal font-bold tracking-wider block mb-1">
                    {app.sector}
                  </span>
                  <h3 className="text-xl font-display font-extrabold text-white tracking-tight">
                    {app.roleTitle || 'Candidate Application'}
                  </h3>
                </div>

                {/* Candidate Snapshot Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-black/40 p-3.5 rounded-xl border border-white/5">
                  <div>
                    <span className="text-gray-500 text-[10px] block uppercase">Applicant Name</span>
                    <span className="text-white font-bold truncate block">{app.fullName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block uppercase">Contact Email</span>
                    <span className="text-gray-300 truncate block">{app.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block uppercase">Phone / WhatsApp</span>
                    <span className="text-gray-300">{app.whatsapp || app.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block uppercase">Expected Salary</span>
                    <span className="text-brand-teal font-bold">{app.expectedCompensation || 'As per norms'}</span>
                  </div>
                </div>

                {/* Reference ID and Passkey */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="space-y-1.5 text-xs font-mono flex-1 min-w-0">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Application Reference ID:</div>
                    <div className="flex items-center gap-2">
                      <code className="text-brand-teal font-bold text-xs bg-black/60 px-2.5 py-1 rounded border border-brand-teal/30 truncate">
                        {app.id}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyId(app.id)}
                        className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all shrink-0"
                        title="Copy ID"
                      >
                        {copiedId === app.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {app.onboardingToken && (
                      <div className="text-[10px] text-amber-300 pt-0.5">
                        Security Token: <code className="text-white bg-black/40 px-1 rounded">{app.onboardingToken}</code>
                      </div>
                    )}
                  </div>

                  {/* QR Code Canvas */}
                  <div className="bg-white p-2 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-md text-black">
                    <UpiQrCanvas upiString={`${window.location.origin}/careers?appId=${app.id}`} size={64} />
                    <span className="text-[7px] font-mono text-gray-700 font-bold mt-0.5 uppercase tracking-tighter">
                      Scan Dossier
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-white/10 relative z-10">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingApp(app)}
                    className="py-2.5 px-3 rounded-xl bg-brand-teal text-brand-dark font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Form Dossier</span>
                  </button>

                  <a
                    href={`/careers?appId=${encodeURIComponent(app.id)}${app.onboardingToken ? `&token=${encodeURIComponent(app.onboardingToken)}&stage=onboarding` : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-white/15 cursor-pointer text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Open Live Link</span>
                  </a>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const directLink = `${window.location.origin}/careers?appId=${encodeURIComponent(app.id)}`;
                      navigator.clipboard.writeText(directLink);
                      setActionNotice(`✓ Direct link for Application #${app.id} copied to clipboard!`);
                      setTimeout(() => setActionNotice(null), 3000);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-mono text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-brand-teal" />
                    <span>Copy Link</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `*S-CODERS Candidate Application Form Dossier*\n\n` +
                      `*Applicant:* ${app.fullName}\n` +
                      `*Role:* ${app.roleTitle || app.sector}\n` +
                      `*Application ID:* ${app.id}\n` +
                      `*Status:* ${app.status}\n\n` +
                      `*Direct Access Link:* ${window.location.origin}/careers?appId=${app.id}\n\n` +
                      `Official HR: scoders82@gmail.com`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-mono text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-emerald-500/20 text-center"
                  >
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>Share WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULL CANDIDATE APPLICATION FORM DOSSIER MODAL */}
      {viewingApp && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-brand-dark border border-brand-teal/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fadeIn">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-brand-card/90 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-teal/10 border border-brand-teal/30 flex items-center justify-center text-brand-teal">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-lg sm:text-xl text-white">
                    Candidate Application Form Dossier
                  </h3>
                  <p className="text-xs font-mono text-gray-400">
                    ID: <span className="text-brand-teal font-bold">{viewingApp.id}</span> • Submitted: {viewingApp.submissionDate || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Print / Save PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Print / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingApp(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 font-sans text-xs sm:text-sm text-gray-300">
              {/* Quick Status Bar with Quick Changer */}
              <div className="p-4 bg-brand-card/60 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Current Application Status:</span>
                  <span className="font-mono font-bold text-sm text-brand-teal">{viewingApp.status}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Change Status:</span>
                  <select
                    value={viewingApp.status}
                    onChange={(e) => handleStatusChange(viewingApp.id, e.target.value as any)}
                    className="px-3 py-1.5 bg-black/60 border border-brand-teal/40 rounded-xl text-xs font-mono text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interview Scheduled">Interview Scheduled</option>
                    <option value="Interview Cleared">Interview Cleared</option>
                    <option value="Approved for Onboarding">Approved for Onboarding</option>
                    <option value="Onboarding Completed">Onboarding Completed</option>
                    <option value="Hired">Hired</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* SECTION 1: Personal & Candidate Info */}
              <div className="space-y-3">
                <h4 className="font-mono text-xs uppercase tracking-widest text-brand-teal font-bold flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>1. Applicant Profile & Contact Information</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-black/40 border border-white/5 rounded-2xl text-xs font-mono">
                  <div>
                    <span className="text-gray-500 uppercase text-[10px] block">Full Legal Name:</span>
                    <span className="text-white font-bold text-sm">{viewingApp.fullName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 uppercase text-[10px] block">Contact Email:</span>
                    <span className="text-gray-200">{viewingApp.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 uppercase text-[10px] block">Phone / WhatsApp:</span>
                    <span className="text-gray-200">{viewingApp.whatsapp || viewingApp.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 uppercase text-[10px] block">Current City / Location:</span>
                    <span className="text-gray-200">{viewingApp.currentCity || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 uppercase text-[10px] block">Employment Type:</span>
                    <span className="text-brand-teal">{viewingApp.employmentType || 'Full-Time'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 uppercase text-[10px] block">Expected Compensation:</span>
                    <span className="text-brand-teal font-bold">{viewingApp.expectedCompensation || 'Standard'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Role & Department */}
              <div className="space-y-3">
                <h4 className="font-mono text-xs uppercase tracking-widest text-brand-teal font-bold flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>2. Role Applied & Technical Qualifications</span>
                </h4>
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-500 uppercase text-[10px] block">Sector / Department:</span>
                      <span className="text-white font-bold">{viewingApp.sector}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 uppercase text-[10px] block">Role Designation:</span>
                      <span className="text-brand-teal font-bold">{viewingApp.roleTitle}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 uppercase text-[10px] block">Highest Qualification:</span>
                      <span className="text-gray-200">{viewingApp.highestQualification || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 uppercase text-[10px] block">Institution / College:</span>
                      <span className="text-gray-200">{viewingApp.institutionName || 'N/A'} ({viewingApp.yearOfGraduation || 'N/A'})</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500 uppercase text-[10px] block mb-1">Key Technical Skills:</span>
                    <div className="p-2.5 bg-black/60 rounded-xl text-gray-200 border border-white/5 break-words">
                      {viewingApp.keySkills || 'Not specified'}
                    </div>
                  </div>

                  {viewingApp.previousProjects && (
                    <div>
                      <span className="text-gray-500 uppercase text-[10px] block mb-1">Projects & Experience:</span>
                      <div className="p-2.5 bg-black/60 rounded-xl text-gray-200 border border-white/5 whitespace-pre-wrap">
                        {viewingApp.previousProjects}
                      </div>
                    </div>
                  )}

                  {viewingApp.whyJoinScoders && (
                    <div>
                      <span className="text-gray-500 uppercase text-[10px] block mb-1">Motivation / Why S-CODERS:</span>
                      <div className="p-2.5 bg-black/60 rounded-xl text-gray-200 border border-white/5 whitespace-pre-wrap">
                        {viewingApp.whyJoinScoders}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: Resume & Links */}
              <div className="space-y-3">
                <h4 className="font-mono text-xs uppercase tracking-widest text-brand-teal font-bold flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>3. Verified Portfolio, Resume & Online Profiles</span>
                </h4>
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-wrap items-center gap-3">
                  {viewingApp.resumeLink && (
                    <a
                      href={viewingApp.resumeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-brand-teal text-brand-dark rounded-xl font-mono text-xs font-bold flex items-center gap-2 hover:bg-white transition-all shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>Open Candidate Resume / CV</span>
                    </a>
                  )}
                  {viewingApp.githubUrl && (
                    <a
                      href={viewingApp.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-mono text-xs flex items-center gap-1.5 border border-white/10 transition-all"
                    >
                      <span>GitHub Profile</span>
                    </a>
                  )}
                  {viewingApp.linkedinUrl && (
                    <a
                      href={viewingApp.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-[#38bdf8] rounded-xl font-mono text-xs flex items-center gap-1.5 border border-white/10 transition-all"
                    >
                      <span>LinkedIn Profile</span>
                    </a>
                  )}
                  {viewingApp.portfolioUrl && (
                    <a
                      href={viewingApp.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-brand-coral rounded-xl font-mono text-xs flex items-center gap-1.5 border border-white/10 transition-all"
                    >
                      <span>Live Portfolio</span>
                    </a>
                  )}
                </div>
              </div>

              {/* SECTION 4: Stage 2 Talent Induction Agreement (If completed or authorized) */}
              {(viewingApp.candidateLegalName || viewingApp.onboardingToken) && (
                <div className="space-y-3">
                  <h4 className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>4. Legal Induction Agreement & Onboarding Verification</span>
                  </h4>
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3 text-xs font-mono">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <span className="text-gray-500 uppercase text-[10px] block">Induction Pass Token:</span>
                        <code className="text-white bg-black/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          {viewingApp.onboardingToken || 'N/A'}
                        </code>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase text-[10px] block">Agreement Signed Name:</span>
                        <span className="text-emerald-300 font-bold">{viewingApp.candidateLegalName || viewingApp.fullName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase text-[10px] block">Signature Date:</span>
                        <span className="text-gray-300">{viewingApp.agreementDate || viewingApp.effectiveDate || 'Verified'}</span>
                      </div>
                    </div>

                    {viewingApp.bankAccountNumber && (
                      <div className="pt-2 border-t border-emerald-500/20">
                        <span className="text-emerald-400 font-bold uppercase text-[10px] block mb-1">
                          Verified Banking & Payroll Details:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-black/40 p-3 rounded-xl">
                          <div>
                            <span className="text-gray-500 uppercase text-[9px] block">Bank Name:</span>
                            <span className="text-white">{viewingApp.bankName || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 uppercase text-[9px] block">Account Number:</span>
                            <span className="text-brand-teal font-mono">{viewingApp.bankAccountNumber}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 uppercase text-[9px] block">IFSC Code / UPI:</span>
                            <span className="text-gray-300">{viewingApp.bankIfsc} {viewingApp.upiId ? `• ${viewingApp.upiId}` : ''}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-brand-card/90 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs font-mono text-gray-400">
                S-CODERS Human Capital & Legal Records
              </span>
              <button
                type="button"
                onClick={() => setViewingApp(null)}
                className="px-5 py-2.5 bg-brand-teal hover:bg-white text-brand-dark rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASTE LINK / UNIQUE KEY MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-brand-dark border border-brand-teal/40 rounded-3xl w-full max-w-lg p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-teal/10 border border-brand-teal/30 flex items-center justify-center text-brand-teal">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-lg text-white">Add Application Form</h3>
                  <p className="text-xs font-mono text-gray-400">Paste Link or Enter Reference ID</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowKeyModal(false);
                  setLookupFeedback(null);
                }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-300 text-xs font-sans leading-relaxed">
              Enter any candidate application ID (e.g. <code className="text-brand-teal font-bold font-mono">SCD-APP-2026-XXXX</code>) or paste the complete link to look up and save the form directly into this Admin Forms collection.
            </p>

            {lookupFeedback && (
              <div className={`p-3.5 rounded-xl font-mono text-xs flex items-start gap-2.5 ${
                lookupFeedback.type === 'SUCCESS' 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {lookupFeedback.type === 'SUCCESS' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <span>{lookupFeedback.message}</span>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleLookupAndAdd(); }} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-gray-400 mb-1.5 uppercase text-[10px] tracking-widest font-bold">
                  Application ID, Pass Key, or Full URL Link *
                </label>
                <input
                  type="text"
                  required
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  placeholder="Paste link or e.g. SCD-APP-2026-X8Y2Z"
                  className="w-full p-3.5 bg-black/60 border border-brand-teal/40 rounded-xl text-white font-mono text-xs sm:text-sm focus:border-brand-teal focus:outline-none tracking-wider"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowKeyModal(false);
                    setLookupFeedback(null);
                  }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLookingUp || !manualInput.trim()}
                  className="flex-1 py-3 bg-brand-teal hover:bg-white text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-teal/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLookingUp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Verify & Save Form</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {showDeleteModal && appToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-brand-dark border border-rose-500/40 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-display font-extrabold text-lg text-white">Remove Application Form?</h3>
              <p className="text-xs font-mono text-gray-400">
                Are you sure you want to remove application form #{appToDelete.id} for <strong className="text-white">{appToDelete.fullName}</strong>?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setAppToDelete(null);
                }}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-500/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
