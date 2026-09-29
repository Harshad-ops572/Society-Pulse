'use client';

import React, { useState } from 'react';
import { IComplaint, ComplaintStatus, ComplaintCategory, UrgencyLevel } from '@/types';
import { formatDate, getSlaCountdown, getStatusBadgeStyle, getUrgencyBadgeStyle } from '@/lib/utils';
import {
  X,
  Sparkles,
  Flame,
  Clock,
  User,
  Building,
  Save,
  Send,
  Lock,
  MessageSquare,
  CheckCircle2,
  CopyCheck,
  RotateCcw,
  Trash2,
  AlertOctagon,
} from 'lucide-react';

interface DrawerProps {
  complaint: IComplaint | null;
  currentUser?: { name: string; role: string } | null;
  onClose: () => void;
  onUpdate: (updatedComplaint: IComplaint) => void;
  onDelete?: (complaintId: string) => void;
}

export default function ComplaintDetailDrawer({
  complaint,
  currentUser,
  onClose,
  onUpdate,
  onDelete,
}: DrawerProps) {
  if (!complaint) return null;

  // Local state for edits
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [assignedTo, setAssignedTo] = useState<string>(complaint.assignedTo || '');
  const [category, setCategory] = useState<ComplaintCategory>(complaint.category);
  const [urgency, setUrgency] = useState<UrgencyLevel>(complaint.urgency);
  const [urgencyScore, setUrgencyScore] = useState<number>(complaint.urgencyScore);
  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [residentUpdateNote, setResidentUpdateNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Admin delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/complaints/${complaint.complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          assignedTo: assignedTo.trim() || null,
          category,
          urgency,
          urgencyScore,
          internalNote: internalNoteInput.trim() || undefined,
          timelineNote: residentUpdateNote.trim() || undefined,
          actorName: currentUser?.name || 'Committee Member',
        }),
      });

      const data = await res.json();
      if (data.success && data.complaint) {
        onUpdate(data.complaint);
        setInternalNoteInput('');
        setResidentUpdateNote('');
        setSaveSuccess(true);
        // If ticket was resolved, close drawer immediately so active view updates
        if (status === 'resolved' || status === 'rejected') {
          setTimeout(() => {
            onClose();
          }, 300);
        } else {
          setTimeout(() => setSaveSuccess(false), 2500);
        }
      }
    } catch (err) {
      console.error('Update drawer error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (deleteConfirmId.trim() !== complaint.complaintId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/complaints/${complaint.complaintId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete complaint');
      }
      setShowDeleteModal(false);
      onDelete?.(complaint.complaintId);
      onClose();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Error deleting complaint');
    } finally {
      setDeleting(false);
    }
  };

  const urgencyBadge = getUrgencyBadgeStyle(urgency);
  const statusBadge = getStatusBadgeStyle(status);
  const sla = getSlaCountdown(complaint.slaDueAt);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-[#0d1322] border-l border-white/10 h-full overflow-y-auto flex flex-col shadow-2xl p-6 space-y-6">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-extrabold text-cyan-300">
              {complaint.complaintId}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${statusBadge.bg} ${statusBadge.text}`}
            >
              {statusBadge.label}
            </span>
            {complaint.aiOverridden && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                Committee Overridden
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Human Override Log Note */}
        {complaint.aiOverridden && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Human Override:</strong> AI suggested{' '}
              <span className="underline font-bold">
                {complaint.originalAiCategory || complaint.originalAiUrgency || 'previous classification'}
              </span>
              , changed by {complaint.overriddenBy || 'Committee Volunteer'}
            </span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Changes and notes saved successfully!</span>
          </div>
        )}

        {/* Safety Risk Alert */}
        {complaint.isSafetyRisk && (
          <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <span className="font-bold block">Safety Hazard Flagged</span>
              <span className="text-[11px] text-red-300">
                This issue involves severe electrical, structural, elevator, or water risks.
              </span>
            </div>
          </div>
        )}

        {/* Original Report Box */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Resident Report ({complaint.language.toUpperCase()}):
            </span>
            <span>{formatDate(complaint.createdAt)}</span>
          </div>
          <p className="text-slate-100 text-sm italic font-medium leading-relaxed">
            &ldquo;{complaint.originalText}&rdquo;
          </p>
          {complaint.translatedText && complaint.language !== 'en' && (
            <div className="pt-2 border-t border-white/5 text-xs text-slate-400">
              <span className="text-cyan-400 font-semibold">English Translation: </span>
              <span className="text-slate-200">{complaint.translatedText}</span>
            </div>
          )}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-white/5">
            <span>
              Reported by: <strong className="text-slate-200">{complaint.residentName}</strong> ({complaint.phone || 'No phone'})
            </span>
            <span>
              Flat: <strong className="text-slate-200">{complaint.wing}-{complaint.flatNumber}</strong>
            </span>
          </div>
        </div>

        {/* Photo Attachment */}
        {complaint.photoUrl && (
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400 font-semibold block">Attached Evidence:</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={complaint.photoUrl}
              alt="Complaint attachment"
              className="rounded-xl border border-white/10 max-h-56 object-cover"
            />
          </div>
        )}

        {/* AI Triage & Override Controls */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/20 to-violet-950/20 border border-cyan-500/20 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-100">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI Triage Reasoning & Override</span>
            </div>
            <span className="text-[11px] text-cyan-300 font-semibold">
              Score: {urgencyScore}/100
            </span>
          </div>

          <p className="text-slate-300 italic">{complaint.urgencyReason}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-slate-400 mb-1">Category Override</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="water">Water</option>
                <option value="lift">Lift</option>
                <option value="parking">Parking</option>
                <option value="noise">Noise</option>
                <option value="cleaning">Cleaning</option>
                <option value="electrical">Electrical</option>
                <option value="security">Security</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Urgency Override</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status & Assignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Status Stage</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
              <option value="reopened">Reopened</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Assign To</label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="e.g. Ramesh (Plumber) / Otis AMC"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Send update to resident note */}
        <div className="space-y-2 text-xs">
          <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span>Send Progress Update to Resident (Visible on Tracking page)</span>
          </label>
          <textarea
            rows={2}
            value={residentUpdateNote}
            onChange={(e) => setResidentUpdateNote(e.target.value)}
            placeholder="e.g., Plumber has been dispatched and will arrive between 3-4 PM."
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Internal Committee Notes (Private) */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Internal Notes (Hidden from Residents)</span>
          </div>

          {complaint.internalNotes && complaint.internalNotes.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {complaint.internalNotes.map((note, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-white/5 border border-white/5 space-y-0.5">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">{note.author}</span>
                    <span>{formatDate(note.createdAt)}</span>
                  </div>
                  <p className="text-slate-200">{note.note}</p>
                </div>
              ))}
            </div>
          )}

          <textarea
            rows={2}
            value={internalNoteInput}
            onChange={(e) => setInternalNoteInput(e.target.value)}
            placeholder="Add confidential notes, contractor invoices, quotes, or internal discussion..."
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
          />
        </div>

        {/* Timeline History */}
        <div className="space-y-2 text-xs">
          <span className="font-bold text-slate-300 block">Activity History</span>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {complaint.timeline.map((ev, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-white/5 border border-white/5 space-y-0.5">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-300">{ev.by}</span>
                  <span>{formatDate(ev.at)}</span>
                </div>
                <p className="text-slate-200">{ev.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Save & Actions CTA */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmId('');
                  setDeleteError(null);
                  setShowDeleteModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors cursor-pointer"
                title="Permanently delete ticket (Admin only)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Ticket</span>
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>

        {/* Admin Confirmation Modal for Ticket Deletion */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-red-500/40 p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2.5 text-red-400">
                <AlertOctagon className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold text-slate-100">Confirm Ticket Deletion</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                This action is <strong className="text-red-400">permanent and irreversible</strong>. It will permanently purge complaint <span className="font-mono font-bold text-cyan-300">{complaint.complaintId}</span> and all linked binary attachments from MongoDB, and create an audit log entry.
              </p>

              <div className="space-y-1.5 text-xs">
                <label className="block text-slate-400">
                  Please type <span className="font-mono font-bold text-slate-200 select-all">{complaint.complaintId}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmId}
                  onChange={(e) => setDeleteConfirmId(e.target.value)}
                  placeholder={complaint.complaintId}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-slate-100 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              {deleteError && (
                <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTicket}
                  disabled={deleteConfirmId.trim() !== complaint.complaintId || deleting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleting ? 'Deleting...' : 'Permanently Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
