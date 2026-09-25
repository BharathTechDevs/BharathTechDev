import React, { useState } from 'react';
import { 
  Video, Calendar, Clock, Plus, Trash2, Edit2, 
  CheckCircle2, ExternalLink, Save, MessageSquare, 
  Globe, Radio, Play, AlertCircle, RefreshCw, Check, Copy
} from 'lucide-react';
import { DepartmentConfig, DepartmentMeeting } from '../../types';
import { 
  getStoredDepartmentMeetings, 
  saveStoredDepartmentMeetings, 
  getStoredDepartmentConfigs, 
  saveStoredDepartmentConfigs, 
  getStoredMainWhatsAppCommunity, 
  saveStoredMainWhatsAppCommunity,
  DEFAULT_DEPARTMENTS 
} from '../../utils/departmentData';

interface DepartmentMeetingsAdminProps {
  onUpdateFeedback: (msg: string) => void;
}

export default function DepartmentMeetingsAdmin({ onUpdateFeedback }: DepartmentMeetingsAdminProps) {
  const [subTab, setSubTab] = useState<'meetings' | 'links'>('meetings');

  // Meetings State
  const [meetings, setMeetings] = useState<DepartmentMeeting[]>(() => getStoredDepartmentMeetings());
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Meeting Form Fields
  const [topic, setTopic] = useState('');
  const [department, setDepartment] = useState('Front-End Developer');
  const [instructions, setInstructions] = useState('Interactive screen sharing, live code walkthrough, and team sprint review.');
  const [meetingDate, setMeetingDate] = useState('2026-09-28');
  const [meetingTime, setMeetingTime] = useState('04:30 PM IST');
  const [zoomLink, setZoomLink] = useState('https://zoom.us/j/scoders-work-hub');
  const [status, setStatus] = useState<'Upcoming' | 'Live Now' | 'Completed' | 'Cancelled'>('Upcoming');

  // Links State
  const [deptConfigs, setDeptConfigs] = useState<DepartmentConfig[]>(() => getStoredDepartmentConfigs());
  const [mainCommunityLink, setMainCommunityLink] = useState<string>(() => getStoredMainWhatsAppCommunity());
  const [isSavingConfigs, setIsSavingConfigs] = useState(false);

  const handleOpenNew = () => {
    setEditingId(null);
    setTopic('');
    setDepartment('Front-End Developer');
    setInstructions('Interactive screen sharing, live code walkthrough, and team sprint review.');
    setMeetingDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setMeetingTime('04:00 PM IST');
    setZoomLink('https://zoom.us/j/scoders-work-hub');
    setStatus('Upcoming');
    setShowModal(true);
  };

  const handleEdit = (m: DepartmentMeeting) => {
    setEditingId(m.id);
    setTopic(m.topic);
    setDepartment(m.department);
    setInstructions(m.instructions);
    setMeetingDate(m.meetingDate);
    setMeetingTime(m.meetingTime);
    setZoomLink(m.zoomLink);
    setStatus(m.status);
    setShowModal(true);
  };

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !zoomLink.trim()) {
      alert('Please provide meeting topic and Zoom meeting link.');
      return;
    }

    const meetingRecord: DepartmentMeeting = {
      id: editingId || `meet-${Date.now().toString(36)}`,
      department,
      topic: topic.trim(),
      instructions: instructions.trim(),
      meetingDate,
      meetingTime,
      zoomLink: zoomLink.trim(),
      status,
      createdAt: new Date().toISOString()
    };

    try {
      await fetch('/api/careers/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingRecord)
      });
    } catch (e) {
      console.warn('Remote meeting save error:', e);
    }

    const filtered = meetings.filter(m => m.id !== meetingRecord.id);
    const updated = [meetingRecord, ...filtered];
    setMeetings(updated);
    saveStoredDepartmentMeetings(updated);

    setShowModal(false);
    onUpdateFeedback(`✓ Meeting "${topic}" successfully saved.`);
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    try {
      await fetch(`/api/careers/meetings/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn('Remote meeting delete error:', e);
    }

    const updated = meetings.filter(m => m.id !== id);
    setMeetings(updated);
    saveStoredDepartmentMeetings(updated);
    onUpdateFeedback('Meeting deleted.');
  };

  const handleToggleLive = async (m: DepartmentMeeting) => {
    const newStatus = m.status === 'Live Now' ? 'Upcoming' : 'Live Now';
    const updatedRecord = { ...m, status: newStatus as any };

    try {
      await fetch('/api/careers/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRecord)
      });
    } catch (e) {}

    const updated = meetings.map(item => item.id === m.id ? updatedRecord : item);
    setMeetings(updated);
    saveStoredDepartmentMeetings(updated);
    onUpdateFeedback(`Meeting status switched to ${newStatus}.`);
  };

  const handleSaveConfigs = async () => {
    setIsSavingConfigs(true);
    saveStoredDepartmentConfigs(deptConfigs);
    saveStoredMainWhatsAppCommunity(mainCommunityLink);

    try {
      await fetch('/api/careers/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departments: deptConfigs })
      });
    } catch (e) {
      console.warn('Remote config save error:', e);
    } finally {
      setIsSavingConfigs(false);
      onUpdateFeedback('✓ All WhatsApp Subgroup links & Zoom links saved.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Subtab Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('meetings')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'meetings'
                ? 'bg-sky-500 text-brand-dark shadow-md shadow-sky-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Scheduled Online Meetings ({meetings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('links')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'links'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Department WhatsApp & Zoom Links ({deptConfigs.length})</span>
          </button>
        </div>

        {subTab === 'meetings' && (
          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2.5 bg-brand-teal text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer shadow-md hover:brightness-110"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Online Work Meeting</span>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ONLINE MEETINGS LIST */}
      {/* ============================================================== */}
      {subTab === 'meetings' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-300 font-sans">
            These online meetings are displayed directly to verified candidates under their approved department in <strong>Section 4: Department WhatsApp Group & Online Work</strong>.
          </p>

          <div className="grid grid-cols-1 gap-4">
            {meetings.map(m => (
              <div
                key={m.id}
                className="bg-black/50 border border-white/10 hover:border-sky-500/40 rounded-2xl p-5 backdrop-blur-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                      m.status === 'Live Now'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                        : m.status === 'Upcoming'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : 'bg-white/10 text-gray-400 border-white/20'
                    }`}>
                      {m.status === 'Live Now' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                      <span>{m.status}</span>
                    </span>

                    <span className="text-xs font-mono text-brand-teal bg-brand-teal/10 px-2.5 py-0.5 rounded-md border border-brand-teal/20">
                      {m.department}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-display font-bold text-white">
                    {m.topic}
                  </h4>

                  <p className="text-xs text-gray-300 font-sans leading-relaxed">
                    {m.instructions}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-mono text-gray-400 pt-1">
                    <span className="flex items-center gap-1 text-white">
                      <Calendar className="w-3.5 h-3.5 text-brand-teal" />
                      <span>{m.meetingDate}</span>
                    </span>
                    <span className="flex items-center gap-1 text-white">
                      <Clock className="w-3.5 h-3.5 text-brand-teal" />
                      <span>{m.meetingTime}</span>
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-sky-400 truncate max-w-md">
                    Zoom Link: <a href={m.zoomLink} target="_blank" rel="noreferrer" className="underline">{m.zoomLink}</a>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleToggleLive(m)}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer ${
                      m.status === 'Live Now'
                        ? 'bg-amber-500 text-brand-dark hover:bg-amber-400'
                        : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-brand-dark border border-emerald-500/30'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>{m.status === 'Live Now' ? 'Stop Live' : 'Go Live Now'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEdit(m)}
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl border border-white/10 cursor-pointer"
                    title="Edit Meeting"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteMeeting(m.id)}
                    className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 cursor-pointer"
                    title="Delete Meeting"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: DEPARTMENT WHATSAPP & ZOOM LINKS CONFIGURATION */}
      {/* ============================================================== */}
      {subTab === 'links' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-black/40 border border-white/10 rounded-2xl">
            <div className="space-y-1">
              <h4 className="text-sm font-mono font-bold uppercase text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-teal" />
                <span>Main WhatsApp Group / Community Hub Link</span>
              </h4>
              <p className="text-xs text-gray-400">
                Shared parent community containing all department subgroups.
              </p>
            </div>

            <input
              type="text"
              value={mainCommunityLink}
              onChange={(e) => setMainCommunityLink(e.target.value)}
              className="w-full sm:w-96 bg-black/80 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-brand-teal font-mono focus:outline-none focus:border-brand-teal"
              placeholder="https://chat.whatsapp.com/..."
            />
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-mono font-bold uppercase text-white">
              Department Subgroups & Zoom Meeting Links (11 Tracks)
            </h4>

            <div className="grid grid-cols-1 gap-3">
              {deptConfigs.map((dept, idx) => (
                <div
                  key={dept.id}
                  className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">
                        {dept.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-teal/20 text-brand-teal font-bold border border-brand-teal/30">
                        {dept.referenceFormat}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-gray-400">
                      Prefix: <strong className="text-white">{dept.codePrefix}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">
                        WhatsApp Subgroup Link:
                      </label>
                      <input
                        type="text"
                        value={dept.whatsappSubgroupLink}
                        onChange={(e) => {
                          const updated = [...deptConfigs];
                          updated[idx] = { ...updated[idx], whatsappSubgroupLink: e.target.value };
                          setDeptConfigs(updated);
                        }}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-teal"
                        placeholder="https://chat.whatsapp.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">
                        Department Zoom Work Link:
                      </label>
                      <input
                        type="text"
                        value={dept.zoomMeetingLink}
                        onChange={(e) => {
                          const updated = [...deptConfigs];
                          updated[idx] = { ...updated[idx], zoomMeetingLink: e.target.value };
                          setDeptConfigs(updated);
                        }}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400"
                        placeholder="https://zoom.us/j/..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                disabled={isSavingConfigs}
                onClick={handleSaveConfigs}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-brand-teal text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl flex items-center gap-2 cursor-pointer hover:brightness-110"
              >
                <Save className="w-4 h-4" />
                <span>Save All Department Links</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE / EDIT ONLINE MEETING MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveMeeting}
            className="bg-brand-dark border border-brand-teal/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white font-display font-bold text-lg">
                <Video className="w-5 h-5 text-brand-teal" />
                <span>{editingId ? 'Edit Online Work Meeting' : 'Schedule New Online Work Meeting'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-300 mb-1">
                  Department / Target Group:
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-teal"
                >
                  <option value="All Departments / All-Hands">All Departments / All-Hands</option>
                  {DEFAULT_DEPARTMENTS.map(d => (
                    <option key={d.id} value={d.name}>{d.name} ({d.codePrefix})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-300 mb-1">
                  Meeting Topic / Focus Area:
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Front-End Sprint: UI Design System & Component Library"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-teal"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-300 mb-1">
                  Instructions / Agenda (Screen sharing, live work, discussion):
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Instructions for participants, setup requirements, screen sharing details..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-300 mb-1">
                    Meeting Date:
                  </label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-gray-300 mb-1">
                    Meeting Time:
                  </label>
                  <input
                    type="text"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    placeholder="e.g. 04:30 PM IST"
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-300 mb-1">
                  Zoom Meeting Link:
                </label>
                <input
                  type="text"
                  value={zoomLink}
                  onChange={(e) => setZoomLink(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-sky-300 font-mono focus:outline-none focus:border-sky-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-300 mb-1">
                  Status:
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-teal"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Live Now">Live Now</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-gray-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-brand-teal text-brand-dark font-mono font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:bg-white shadow-md"
              >
                <span>Save Meeting</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
