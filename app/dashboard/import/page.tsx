'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Upload,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { SAMPLE_WHATSAPP_CHAT } from '@/lib/whatsappParser';
import { CandidateImportTicket } from '@/app/api/import/whatsapp/route';
import { ComplaintCategory, UrgencyLevel } from '@/types';

export default function WhatsAppImportPage() {
  const router = useRouter();

  // Input states
  const [chatText, setChatText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Review states
  const [candidates, setCandidates] = useState<CandidateImportTicket[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalMessages: number;
    complaintsFound: number;
    criticalCount: number;
    duplicatesMerged: number;
  } | null>(null);

  // Persistence & Undo states
  const [isSaving, setIsSaving] = useState(false);
  const [savedBatchId, setSavedBatchId] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoSuccess, setUndoSuccess] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  // Drag and drop handler
  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.txt')) {
      setParseError('Please upload a plain text (.txt) WhatsApp export file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setChatText(content);
        setParseError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleParse = async (retryCount = 0) => {
    if (!chatText.trim()) {
      setParseError('Please paste your WhatsApp chat export or load the sample chat.');
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const res = await fetch('/api/import/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chatText }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Automatic retry once per prompt requirement
        if (retryCount === 0) {
          console.warn('First parse attempt failed, retrying once...');
          return handleParse(1);
        }
        throw new Error(data.error || 'Failed to extract complaints from chat export.');
      }

      setCandidates(data.candidates);
      setStats(data.stats);
      // Select all candidate tickets by default
      setSelectedIds(new Set(data.candidates.map((c: CandidateImportTicket) => c.candidateId)));
    } catch (err: any) {
      setParseError(err.message || 'Error communicating with AI parser. Your text is safely preserved.');
    } finally {
      setIsParsing(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map((c) => c.candidateId)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const updateCandidateField = (id: string, field: keyof CandidateImportTicket, value: any) => {
    setCandidates((prev) =>
      prev.map((c) => (c.candidateId === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSaveImport = async () => {
    const selectedTickets = candidates.filter((c) => selectedIds.has(c.candidateId));
    if (selectedTickets.length === 0) {
      alert('Please select at least one ticket to import.');
      return;
    }

    setIsSaving(true);
    const batchId = `BATCH-${Date.now().toString(36).toUpperCase()}`;

    try {
      const res = await fetch('/api/import/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          tickets: selectedTickets,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to persist imported complaints');
      }

      setSavedBatchId(batchId);
      setSavedCount(data.importedCount);
    } catch (err: any) {
      alert(err.message || 'Import failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUndoImport = async () => {
    if (!savedBatchId) return;
    setIsUndoing(true);

    try {
      const res = await fetch('/api/import/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: savedBatchId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to rollback import');
      }

      setUndoSuccess(true);
      setUndoMessage(data.message || 'Batch successfully removed from system.');
    } catch (err: any) {
      alert(err.message || 'Could not undo import.');
    } finally {
      setIsUndoing(false);
    }
  };

  const resetForm = () => {
    setCandidates([]);
    setSelectedIds(new Set());
    setStats(null);
    setSavedBatchId(null);
    setSavedCount(0);
    setUndoSuccess(false);
    setUndoMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-cyan-400 font-mono mb-1">
              <Link href="/dashboard" className="hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </Link>
              <span>/</span>
              <span>Committee Tools</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-emerald-400" /> WhatsApp Chat Importer
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Turn messy resident chat exports into clean, deduplicated committee tickets in seconds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setChatText(SAMPLE_WHATSAPP_CHAT)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Load Sample Chat (42 msgs)
            </button>
          </div>
        </div>

        {/* Success / Undo State */}
        {savedBatchId && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Import Complete!</h3>
                  <p className="text-xs text-slate-300">
                    {savedCount} complaints created and linked under batch ID{' '}
                    <span className="font-mono text-cyan-300">{savedBatchId}</span>.
                  </p>
                </div>
              </div>

              {!undoSuccess ? (
                <button
                  onClick={handleUndoImport}
                  disabled={isUndoing}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {isUndoing ? 'Undoing...' : 'Undo This Import'}
                </button>
              ) : (
                <span className="text-xs text-amber-300 font-mono">
                  {undoMessage || 'Batch rolled back.'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5"
              >
                Go to Dashboard Queue <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={resetForm}
                className="px-4 py-2 text-xs font-medium rounded-lg text-slate-300 hover:bg-slate-800 transition"
              >
                Import Another Chat
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Chat Input Area */}
        {candidates.length === 0 && !savedBatchId && (
          <div className="space-y-6">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-2xl p-6 transition-colors bg-slate-900/40 space-y-4"
            >
              <div className="flex flex-col items-center justify-center text-center space-y-2 py-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-white">
                  Drag & drop WhatsApp export (.txt) or paste below
                </h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Supports Android & iOS timestamps, 12h/24h formats. Phone numbers are automatically masked for privacy.
                </p>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition">
                  <FileText className="w-3.5 h-3.5" /> Browse File
                  <input
                    type="file"
                    accept=".txt"
                    className="hidden"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                  />
                </label>
              </div>

              <div className="relative">
                <textarea
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Paste WhatsApp chat export here... (e.g. 29/09/2026, 08:12 - Priya (B-301): Lift B firse band hai!)"
                  rows={10}
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 p-4 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <div className="absolute bottom-3 right-4 text-[10px] text-slate-500 font-mono">
                  {chatText.split('\n').filter((l) => l.trim()).length} lines | {chatText.length} characters
                </div>
              </div>
            </div>

            {parseError && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{parseError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setChatText('')}
                disabled={!chatText || isParsing}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition disabled:opacity-30"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleParse(0)}
                disabled={!chatText.trim() || isParsing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-semibold shadow-lg shadow-emerald-500/10 flex items-center gap-2 disabled:opacity-50 transition"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting Complaints with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Extract & Triage Complaints
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review Screen (42 messages -> 9 complaints) */}
        {candidates.length > 0 && !savedBatchId && (
          <div className="space-y-6">
            {/* Banner */}
            {stats && (
              <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 to-cyan-950/30 p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-cyan-400 font-mono font-semibold">
                    Clarity Extracted
                  </span>
                  <div className="text-2xl font-extrabold text-white flex items-center gap-2 mt-0.5">
                    <span>{stats.totalMessages} WhatsApp messages</span>
                    <span className="text-cyan-400">→</span>
                    <span className="text-emerald-400">{stats.complaintsFound} Actionable Tickets</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Filtered noise greetings, merged {stats.duplicatesMerged} duplicates, and flagged{' '}
                    {stats.criticalCount} critical incident(s).
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveImport}
                    disabled={isSaving || selectedIds.size === 0}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Import Selected ({selectedIds.size})
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Candidate Tickets Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectedIds.size === candidates.length && candidates.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  />
                  <label htmlFor="selectAll" className="text-xs font-medium text-slate-300 cursor-pointer">
                    Select All ({selectedIds.size} / {candidates.length} selected)
                  </label>
                </div>

                <span className="text-xs text-slate-400">
                  Sorted by Urgency Score • Click row to edit inline
                </span>
              </div>

              <div className="divide-y divide-slate-800/80">
                {candidates.map((ticket) => {
                  const isSelected = selectedIds.has(ticket.candidateId);
                  const isExpanded = expandedId === ticket.candidateId;

                  const urgencyColor =
                    ticket.urgency === 'critical'
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : ticket.urgency === 'high'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : ticket.urgency === 'medium'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/30';

                  return (
                    <div
                      key={ticket.candidateId}
                      className={`p-4 transition-colors ${
                        isSelected ? 'bg-slate-900/40' : 'bg-slate-950/40 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(ticket.candidateId)}
                          className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                        />

                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2 justify-between">
                            <div className="flex items-center gap-2">
                              {/* Urgency Badge */}
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase border ${urgencyColor}`}
                              >
                                {ticket.urgency} ({ticket.urgencyScore}%)
                              </span>

                              {/* Category Dropdown */}
                              <select
                                value={ticket.category}
                                onChange={(e) =>
                                  updateCandidateField(
                                    ticket.candidateId,
                                    'category',
                                    e.target.value as ComplaintCategory
                                  )
                                }
                                className="bg-slate-800 border border-slate-700 rounded text-xs px-2 py-0.5 text-slate-200 capitalize focus:outline-none"
                              >
                                {['water', 'lift', 'parking', 'noise', 'cleaning', 'electrical', 'security', 'other'].map(
                                  (cat) => (
                                    <option key={cat} value={cat}>
                                      {cat}
                                    </option>
                                  )
                                )}
                              </select>

                              {/* Report Count */}
                              {ticket.reportCount > 1 && (
                                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                                  <Layers className="w-3 h-3" /> {ticket.reportCount} reports merged
                                </span>
                              )}

                              {/* Likely Resolved Badge */}
                              {ticket.likelyResolved && (
                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Likely Resolved in Chat
                                </span>
                              )}

                              {ticket.isSafetyRisk && (
                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/10 text-red-300 border border-red-500/30 flex items-center gap-1">
                                  <ShieldAlert className="w-3 h-3" /> Safety Risk
                                </span>
                              )}
                            </div>

                            {/* Wing & Flat inline edits */}
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500">Flat:</span>
                              <input
                                type="text"
                                value={ticket.flatNumber}
                                onChange={(e) =>
                                  updateCandidateField(ticket.candidateId, 'flatNumber', e.target.value)
                                }
                                className="w-20 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white"
                              />
                            </div>
                          </div>

                          {/* Editable Summary */}
                          <div>
                            <input
                              type="text"
                              value={ticket.summary}
                              onChange={(e) =>
                                updateCandidateField(ticket.candidateId, 'summary', e.target.value)
                              }
                              className="w-full bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 rounded-lg px-3 py-1.5 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                          </div>

                          {/* Resolution Note if applicable */}
                          {ticket.resolutionNote && (
                            <div className="text-[11px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded p-2">
                              {ticket.resolutionNote}
                            </div>
                          )}

                          {/* Raw messages accordion */}
                          <div className="text-xs">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(isExpanded ? null : ticket.candidateId)
                              }
                              className="text-slate-400 hover:text-cyan-400 flex items-center gap-1 text-[11px]"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3 h-3" /> Hide {ticket.messages.length} WhatsApp message(s)
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" /> View {ticket.messages.length} underlying WhatsApp message(s)
                                </>
                              )}
                            </button>

                            {isExpanded && (
                              <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-slate-700 text-[11px] font-mono text-slate-300">
                                {ticket.messages.map((m, idx) => (
                                  <div key={idx} className="bg-slate-900/80 p-2 rounded border border-slate-800">
                                    {m}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
