'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';
import { IComplaint } from '@/types';
import {
  formatDate,
  getSlaCountdown,
  getStatusBadgeStyle,
  getUrgencyBadgeStyle,
} from '@/lib/utils';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Send,
  MessageSquare,
  ShieldCheck,
  Building,
  User,
  Calendar,
  Sparkles,
} from 'lucide-react';

function TrackContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();

  const [complaintIdInput, setComplaintIdInput] = useState('');
  const [flatNumberInput, setFlatNumberInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [complaint, setComplaint] = useState<IComplaint | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Follow-up comment state
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  // Resolution confirmation state
  const [confirming, setConfirming] = useState(false);
  const [confirmNotice, setConfirmNotice] = useState<string | null>(null);

  const fetchComplaint = async (id: string, flat?: string) => {
    if (!id || id.trim() === '') return;
    setLoading(true);
    setErrorMessage(null);
    setConfirmNotice(null);

    try {
      const url = `/api/track?id=${encodeURIComponent(id.trim())}${
        flat ? `&flat=${encodeURIComponent(flat.trim())}` : ''
      }`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to locate complaint');
      }

      setComplaint(data.complaint);
      setCommentAuthor(data.complaint.residentName || '');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error finding complaint');
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search if URL query has params
  useEffect(() => {
    const qId = searchParams.get('id');
    const qFlat = searchParams.get('flat');
    if (qId) {
      setComplaintIdInput(qId);
      if (qFlat) setFlatNumberInput(qFlat);
      fetchComplaint(qId, qFlat || undefined);
    }
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaint(complaintIdInput, flatNumberInput);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !commentText.trim()) return;

    setCommenting(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.complaintId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: commentText.trim(),
          author: commentAuthor || complaint.residentName || 'Resident',
        }),
      });
      const data = await res.json();
      if (data.success && data.complaint) {
        setComplaint(data.complaint);
        setCommentText('');
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setCommenting(false);
    }
  };

  const handleConfirmResolution = async (resolved: boolean) => {
    if (!complaint) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.complaintId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolved,
          feedback: resolved ? 'Confirmed resolved by resident' : 'Issue reopened by resident: problem persists',
        }),
      });
      const data = await res.json();
      if (data.success && data.complaint) {
        setComplaint(data.complaint);
        setConfirmNotice(data.message);
      }
    } catch (err) {
      console.error('Confirm error:', err);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider">
          <Search className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'लाइव ट्रैकिंग' : 'Live Status Tracking'}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">{t.trackTitle}</h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">{t.trackSubtitle}</p>
      </div>

      {/* Search Bar Box */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl border border-white/10">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.trackIdLabel}
            </label>
            <input
              type="text"
              value={complaintIdInput}
              onChange={(e) => setComplaintIdInput(e.target.value)}
              placeholder="e.g. SP-2026-0001"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-slate-100 placeholder:text-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.trackFlatLabel} (Optional)
            </label>
            <input
              type="text"
              value={flatNumberInput}
              onChange={(e) => setFlatNumberInput(e.target.value)}
              placeholder="e.g. B-101"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={loading || !complaintIdInput.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{t.trackButton}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Complaint Detail & Timeline */}
      {complaint && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Status Header Card */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-mono font-extrabold text-cyan-300">
                    {complaint.complaintId}
                  </span>
                  {(() => {
                    const statusBadge = getStatusBadgeStyle(complaint.status);
                    return (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusBadge.bg} ${statusBadge.text}`}
                      >
                        {statusBadge.label}
                      </span>
                    );
                  })()}
                </div>
                <h2 className="text-lg font-bold text-slate-100 mt-2">{complaint.summary}</h2>
              </div>

              {/* SLA Status Countdown */}
              {complaint.status !== 'resolved' && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-right sm:text-left">
                  <span className="text-[11px] text-slate-400 block font-medium">SLA Resolution Target</span>
                  {(() => {
                    const countdown = getSlaCountdown(complaint.slaDueAt);
                    return (
                      <div
                        className={`text-sm font-bold flex items-center gap-1.5 ${
                          countdown.isOverdue ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        <span>{countdown.text}</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Location</span>
                </span>
                <p className="font-semibold text-slate-200">
                  Wing {complaint.wing} — {complaint.flatNumber}
                  {complaint.commonArea ? ` (${complaint.commonArea})` : ''}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>Category</span>
                </span>
                <p className="font-semibold text-slate-200 uppercase tracking-wider">
                  {complaint.category}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Urgency</span>
                </span>
                {(() => {
                  const uStyle = getUrgencyBadgeStyle(complaint.urgency);
                  return (
                    <span className={`font-bold uppercase ${uStyle.text}`}>
                      {complaint.urgency} ({complaint.urgencyScore}/100)
                    </span>
                  );
                })()}
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Assigned To</span>
                </span>
                <p className="font-semibold text-slate-200">
                  {complaint.assignedTo || 'Pending Assignment'}
                </p>
              </div>
            </div>

            {/* Original Text Box */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs space-y-1.5">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Original Resident Report ({complaint.language}):
              </span>
              <p className="text-slate-200 leading-relaxed italic">&ldquo;{complaint.originalText}&rdquo;</p>
              {complaint.translatedText && complaint.language !== 'en' && (
                <div className="pt-2 border-t border-white/5 text-slate-400">
                  <span className="text-cyan-400 font-medium">English Translation: </span>
                  <span>{complaint.translatedText}</span>
                </div>
              )}
            </div>

            {/* Photo preview if attached */}
            {complaint.photoUrl && (
              <div>
                <span className="text-xs text-slate-400 font-semibold block mb-2">Attached Photo:</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={complaint.photoUrl}
                  alt="Complaint evidence"
                  className="rounded-xl border border-white/10 max-h-60 object-cover"
                />
              </div>
            )}
          </div>

          {/* Resolution Confirmation Card (If Resolved) */}
          {complaint.status === 'resolved' && (
            <motion.div
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              className="glass-panel rounded-2xl p-6 border border-emerald-500/30 bg-emerald-950/20 space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <CheckCircle2 className="w-5 h-5" />
                <span>{language === 'hi' ? 'समस्या हल के रूप में चिह्नित है' : 'Issue Marked As Resolved'}</span>
              </div>
              <p className="text-xs text-slate-300">{t.confirmResolution}</p>

              {confirmNotice ? (
                <div className="p-3 rounded-xl bg-white/10 text-emerald-300 font-semibold text-xs">
                  {confirmNotice}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    disabled={confirming}
                    onClick={() => handleConfirmResolution(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.btnYesResolved}</span>
                  </button>

                  <button
                    type="button"
                    disabled={confirming}
                    onClick={() => handleConfirmResolution(false)}
                    className="px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t.btnNotResolved}</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Reopened Banner */}
          {complaint.status === 'reopened' && (
            <div className="p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-3">
              <RotateCcw className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{t.reopenedAlert}</span>
            </div>
          )}

          {/* Resolution Timeline */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>{t.timelineTitle}</span>
            </h3>

            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-2.5 sm:before:left-3.5 before:w-0.5 before:bg-white/15">
              {complaint.timeline && complaint.timeline.length > 0 ? (
                complaint.timeline.map((event, idx) => (
                  <div key={idx} className="relative group">
                    {/* Timeline dot */}
                    <div className="absolute -left-[27px] sm:-left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-cyan-500 border-2 border-[#0B1020] shadow-[0_0_8px_#06b6d4]" />
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                        <span className="font-bold text-slate-200 capitalize">
                          {event.by} — <span className="text-cyan-400 uppercase">{event.status}</span>
                        </span>
                        <span className="text-slate-500 text-[11px]">{formatDate(event.at)}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{event.note}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No timeline updates recorded yet.</p>
              )}
            </div>
          </div>

          {/* Follow-up Note Box */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-400" />
              <span>{t.addCommentTitle}</span>
            </h4>

            {commentSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                Comment added to timeline!
              </div>
            )}

            <form onSubmit={handleAddComment} className="space-y-3">
              <textarea
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t.addCommentPlaceholder}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />

              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  placeholder="Your Name"
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 w-44"
                />

                <button
                  type="submit"
                  disabled={commenting || !commentText.trim()}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold text-xs shadow-md shadow-violet-500/20 transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t.sendComment}</span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
          Loading Complaint Tracker...
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
