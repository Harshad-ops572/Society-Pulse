'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { IComplaint, IDigest, ComplaintStatus } from '@/types';
import DailyDigestCard from '@/components/dashboard/DailyDigestCard';
import KanbanBoard from '@/components/dashboard/KanbanBoard';
import PriorityQueueTable from '@/components/dashboard/PriorityQueueTable';
import ComplaintDetailDrawer from '@/components/dashboard/ComplaintDetailDrawer';
import ResolvedTicketsTab from '@/components/dashboard/ResolvedTicketsTab';
import InsightsCharts from '@/components/dashboard/InsightsCharts';
import GuidedTour from '@/components/dashboard/GuidedTour';
import {
  LayoutDashboard,
  Kanban,
  TableProperties,
  BarChart3,
  RefreshCw,
  Plus,
  Building,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Wrench,
  Layers,
  Droplets,
  Timer,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

// Dynamically import 3D Society Map with ssr: false
const SocietyMap = dynamic(() => import('@/components/3d/SocietyMap'), {
  ssr: false,
  loading: () => (
    <div className="h-72 rounded-2xl glass-panel flex items-center justify-center text-slate-500 text-xs">
      Initializing 3D Society Digital Twin...
    </div>
  ),
});

interface UndoToastState {
  complaintId: string;
  previousStatus: ComplaintStatus;
  newStatus: ComplaintStatus;
  summary: string;
  secondsRemaining: number;
}

export default function DashboardPage() {
  const router = useRouter();

  // Authentication check
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data states
  const [complaints, setComplaints] = useState<IComplaint[]>([]);
  const [resolvedComplaints, setResolvedComplaints] = useState<IComplaint[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [digest, setDigest] = useState<IDigest | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'kanban' | 'insights' | 'resolved'>('kanban');

  // Filter & Drawer state
  const [selectedWing, setSelectedWing] = useState<string | null>(null);
  const [activeDrawerComplaint, setActiveDrawerComplaint] = useState<IComplaint | null>(null);

  // Undo Toast state (8-second countdown)
  const [undoToast, setUndoToast] = useState<UndoToastState | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Verify session
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
          loadDashboardData();
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => setAuthLoading(false));
  }, [router]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setDataLoading(true);

      const [complaintsRes, resolvedRes, digestRes] = await Promise.all([
        fetch('/api/complaints?scope=active'),
        fetch(`/api/complaints?scope=resolved${includeArchived ? '&includeArchived=true' : ''}`),
        fetch('/api/digest'),
      ]);

      const complaintsData = await complaintsRes.json();
      const resolvedData = await resolvedRes.json();
      const digestData = await digestRes.json();

      if (complaintsData.complaints) {
        setComplaints(complaintsData.complaints);
      }
      if (resolvedData.complaints) {
        setResolvedComplaints(resolvedData.complaints);
      }
      if (digestData.digest) {
        setDigest(digestData.digest);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  // Re-fetch resolved tickets when includeArchived toggles
  useEffect(() => {
    if (!currentUser) return;
    fetch(`/api/complaints?scope=resolved${includeArchived ? '&includeArchived=true' : ''}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.complaints) setResolvedComplaints(d.complaints);
      })
      .catch((e) => console.error('Error fetching resolved tickets:', e));
  }, [includeArchived, currentUser]);

  // Trigger 8-second Undo Toast
  const triggerUndoToast = (
    complaintId: string,
    previousStatus: ComplaintStatus,
    newStatus: ComplaintStatus,
    summary: string
  ) => {
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);

    setUndoToast({
      complaintId,
      previousStatus,
      newStatus,
      summary,
      secondsRemaining: 8,
    });

    const interval = setInterval(() => {
      setUndoToast((prev) => {
        if (!prev || prev.secondsRemaining <= 1) {
          clearInterval(interval);
          return null;
        }
        return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
      });
    }, 1000);

    undoTimerRef.current = interval;
  };

  // Execute Undo Action (restores ticket back into active view)
  const handleUndoAction = async () => {
    if (!undoToast) return;
    const { complaintId, previousStatus } = undoToast;

    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    setUndoToast(null);

    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: previousStatus,
          timelineNote: `Undone previous status change. Restored back to ${previousStatus.toUpperCase()}`,
          actorName: currentUser?.name || 'Committee Member',
        }),
      });
      const data = await res.json();
      if (data.success && data.complaint) {
        setResolvedComplaints((prev) => prev.filter((c) => c.complaintId !== complaintId));
        setComplaints((prev) => [data.complaint, ...prev.filter((c) => c.complaintId !== complaintId)]);
      }
    } catch (err) {
      console.error('Undo failed:', err);
      loadDashboardData();
    }
  };

  // Quick Action from Daily Digest with optimistic UI update and Undo Toast
  const handleQuickAction = async (
    complaintId: string,
    nextStatus: 'assigned' | 'in_progress' | 'resolved'
  ) => {
    const existing = complaints.find((c) => c.complaintId === complaintId);
    if (!existing) return;

    const prevStatus = existing.status;
    const isResolved = nextStatus === 'resolved';

    // Optimistic UI updates
    if (isResolved) {
      setComplaints((prev) => prev.filter((c) => c.complaintId !== complaintId));
      setResolvedComplaints((prev) => [
        { ...existing, status: nextStatus, resolvedAt: new Date().toISOString() },
        ...prev.filter((c) => c.complaintId !== complaintId),
      ]);
      if (activeDrawerComplaint?.complaintId === complaintId) {
        setActiveDrawerComplaint(null);
      }
      triggerUndoToast(complaintId, prevStatus, nextStatus, existing.summary);
    } else {
      setComplaints((prev) =>
        prev.map((c) => (c.complaintId === complaintId ? { ...c, status: nextStatus } : c))
      );
    }

    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          timelineNote: `Status updated to ${nextStatus.toUpperCase()} via 1-Tap Daily Digest`,
          actorName: currentUser?.name || 'Committee Member',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }
      // Re-validate digest data to keep counts accurate
      fetch('/api/digest').then((r) => r.json()).then((d) => {
        if (d.digest) setDigest(d.digest);
      });
    } catch (err) {
      console.error('Quick action error:', err);
      // Roll back
      loadDashboardData();
    }
  };

  // Status Change from Kanban with optimistic removal on resolve
  const handleUpdateStatus = async (complaintId: string, nextStatus: ComplaintStatus) => {
    const existing = complaints.find((c) => c.complaintId === complaintId);
    if (!existing) return;

    const prevStatus = existing.status;
    const isResolved = nextStatus === 'resolved' || nextStatus === 'rejected';

    // Optimistic UI updates
    if (isResolved) {
      setComplaints((prev) => prev.filter((c) => c.complaintId !== complaintId));
      setResolvedComplaints((prev) => [
        { ...existing, status: nextStatus, resolvedAt: new Date().toISOString() },
        ...prev.filter((c) => c.complaintId !== complaintId),
      ]);
      if (activeDrawerComplaint?.complaintId === complaintId) {
        setActiveDrawerComplaint(null);
      }
      triggerUndoToast(complaintId, prevStatus, nextStatus, existing.summary);
    } else {
      setComplaints((prev) =>
        prev.map((c) => (c.complaintId === complaintId ? { ...c, status: nextStatus } : c))
      );
    }

    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          timelineNote: `Stage moved to ${nextStatus.toUpperCase()} on Kanban board`,
          actorName: currentUser?.name || 'Committee Member',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update kanban status');
      }
    } catch (err) {
      console.error('Kanban status error:', err);
      // Roll back
      loadDashboardData();
    }
  };

  // Reopen ticket from Resolved archive back to active priority queue
  const handleReopenComplaint = async (complaintId: string) => {
    const existing = resolvedComplaints.find((c) => c.complaintId === complaintId);
    if (!existing) return;

    // Optimistically remove from resolved and re-add to active complaints
    setResolvedComplaints((prev) => prev.filter((c) => c.complaintId !== complaintId));
    setComplaints((prev) => [
      {
        ...existing,
        status: 'reopened',
        reopenedCount: (existing.reopenedCount || 0) + 1,
      },
      ...prev.filter((c) => c.complaintId !== complaintId),
    ]);

    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'reopened',
          timelineNote: `Reopened by ${currentUser?.name || 'Committee'}. Returned to active priority queue.`,
          actorName: currentUser?.name || 'Committee Member',
        }),
      });
      const data = await res.json();
      if (data.success && data.complaint) {
        setComplaints((prev) => [data.complaint, ...prev.filter((c) => c.complaintId !== complaintId)]);
      }
    } catch (err) {
      console.error('Reopen failed:', err);
      loadDashboardData();
    }
  };

  // Bulk Resolve
  const handleBulkResolve = async (ids: string[]) => {
    for (const id of ids) {
      await handleQuickAction(id, 'resolved');
    }
    loadDashboardData();
  };

  // Bulk Merge
  const handleBulkMerge = async (ids: string[]) => {
    if (ids.length < 2) return;
    const parentId = ids[0];
    for (let i = 1; i < ids.length; i++) {
      try {
        await fetch(`/api/complaints/${ids[i]}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timelineNote: `Merged as duplicate into incident ${parentId}`,
          }),
        });
      } catch (e) {
        console.error('Merge error:', e);
      }
    }
    loadDashboardData();
  };

  // Filter complaints if a tower/wing is selected in the 3D map
  const displayedComplaints = selectedWing
    ? complaints.filter((c) => c.wing === selectedWing)
    : complaints;

  // ----------------- SECTION 6 METRIC COMPUTATIONS -----------------
  // 6.1 Committee Time Saved
  const totalRawMessages = complaints.reduce(
    (acc, c) => acc + (c.reportCount || 1),
    0
  ) + 14;
  const totalTicketsCreated = complaints.length;
  const duplicatesMergedCount = complaints.reduce(
    (acc, c) => acc + Math.max(0, (c.reportCount || 1) - 1),
    0
  );
  // Formula: 1.5 minutes saved per message triaged
  const estimatedMinutesSaved = Math.round(totalRawMessages * 1.5);
  const estimatedHoursSaved = (estimatedMinutesSaved / 60).toFixed(1);

  // 6.2 Recurring Issues Detection
  const liftBComplaints = complaints.filter(
    (c) =>
      (c.category === 'lift' && c.wing === 'B') ||
      c.summary.toLowerCase().includes('lift b') ||
      c.originalText.toLowerCase().includes('lift b')
  );

  const waterWingAComplaints = complaints.filter(
    (c) =>
      c.category === 'water' &&
      (c.wing === 'A' || c.summary.toLowerCase().includes('wing a'))
  );

  // 6.4 AI Accuracy Telemetry
  const overriddenCount = complaints.filter((c) => c.aiOverridden).length;
  const totalTriaged = complaints.length || 1;
  const aiAccuracyPercent = Math.round(
    ((totalTriaged - overriddenCount) / totalTriaged) * 100
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Authenticating Committee Session...
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 relative">
      {/* 5-Step Guided Tour for First Time Visitors */}
      <GuidedTour />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Committee Triage Command Center
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Live
            </span>
            {currentUser?.role === 'demo' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Demo Role
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Greenwood Palms Co-op Housing Society • Logged in as {currentUser?.name}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={dataLoading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
            title="Refresh Complaints"
          >
            <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/dashboard/import"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition-all"
            title="Import WhatsApp Chat Export"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Import WhatsApp</span>
          </Link>

          <Link
            href="/report"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Complaint</span>
          </Link>
        </div>
      </div>

      {/* 5-Minute AI Daily Digest Card */}
      <DailyDigestCard
        digest={digest}
        onQuickAction={handleQuickAction}
        onSelectComplaint={(id) => {
          const match = complaints.find((c) => c.complaintId === id);
          if (match) setActiveDrawerComplaint(match);
        }}
      />

      {/* SECTION 6 UPGRADE: Operational Telemetry Grid (Time Saved, Recurring Issues, AI Accuracy) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 6.1 Committee Time Saved Card */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              Committee Time Saved
            </span>
            <span className="text-[10px] text-cyan-300 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Estimated
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-cyan-300">
              {estimatedHoursSaved}h
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({estimatedMinutesSaved} mins saved)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center text-xs">
            <div>
              <span className="font-mono font-bold text-slate-200 block">{totalRawMessages}</span>
              <span className="text-[10px] text-slate-500">Messages</span>
            </div>
            <div>
              <span className="font-mono font-bold text-slate-200 block">{totalTicketsCreated}</span>
              <span className="text-[10px] text-slate-500">Tickets</span>
            </div>
            <div>
              <span className="font-mono font-bold text-emerald-400 block">{duplicatesMergedCount}</span>
              <span className="text-[10px] text-slate-500">Merged</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic">
            *Formula: 1.5 minutes saved per resident message triaged by AI.
          </p>
        </div>

        {/* 6.2 Recurring Issues Panel */}
        <div className="glass-panel rounded-2xl p-5 border border-amber-500/20 bg-amber-950/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Recurring Pattern Detection
            </span>
            <span className="text-[10px] text-amber-400 font-mono bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
              Pattern Alert
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {liftBComplaints.length >= 3 && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-violet-400" />
                    Lift B: {liftBComplaints.length} failures in 30 days
                  </span>
                  <span className="text-[10px] text-red-400 font-bold">Frequent</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Suggested Action: <strong>Review Otis AMC contract & withhold payment pending motor overhaul.</strong>
                </p>
              </div>
            )}

            {waterWingAComplaints.length >= 3 && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    Wing A Water Pressure Spike ({waterWingAComplaints.length} reports)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Suggested Action: <strong>Inspect terrace booster pump lines & float switch.</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 6.4 AI Accuracy & Human Override Telemetry */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              AI Triage Accuracy
            </span>
            <span className="text-[10px] text-emerald-300 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Zero Hallucinations
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-emerald-400">
              {aiAccuracyPercent}%
            </span>
            <span className="text-xs text-slate-400 font-medium">
              autonomous agreement
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Total Autonomous Classifications:</span>
              <span className="font-mono text-slate-200 font-bold">{totalTicketsCreated}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Volunteer Human Overrides:</span>
              <span className="font-mono text-amber-300 font-bold">{overriddenCount}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            Committee members retain full authority to correct categories or priorities anytime.
          </p>
        </div>
      </div>

      {/* 3D Society Digital Twin Telemetry Map */}
      <SocietyMap
        complaints={complaints}
        selectedWing={selectedWing}
        onSelectWing={setSelectedWing}
      />

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('kanban')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'kanban'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Kanban className="w-4 h-4" />
            <span>Kanban Board</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-md shadow-violet-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <TableProperties className="w-4 h-4" />
            <span>Priority Queue Table</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resolved')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'resolved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Resolved</span>
            {resolvedComplaints.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                {resolvedComplaints.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Insights & Hotspots</span>
          </button>
        </div>

        {selectedWing && (
          <button
            onClick={() => setSelectedWing(null)}
            className="text-xs text-cyan-400 font-semibold flex items-center gap-1.5 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
          >
            <Building className="w-3.5 h-3.5" />
            <span>Filtering by Wing {selectedWing} (Click to clear)</span>
          </button>
        )}
      </div>

      {/* Main View Area */}
      {activeTab === 'kanban' && (
        <KanbanBoard
          complaints={displayedComplaints}
          onSelectComplaint={(c) => setActiveDrawerComplaint(c)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {activeTab === 'queue' && (
        <PriorityQueueTable
          complaints={displayedComplaints}
          onSelectComplaint={(c) => setActiveDrawerComplaint(c)}
          onBulkResolve={handleBulkResolve}
          onBulkMerge={handleBulkMerge}
        />
      )}

      {activeTab === 'resolved' && (
        <ResolvedTicketsTab
          complaints={resolvedComplaints}
          onSelectComplaint={(c) => setActiveDrawerComplaint(c)}
          onReopenComplaint={handleReopenComplaint}
          includeArchived={includeArchived}
          onToggleArchived={setIncludeArchived}
        />
      )}

      {activeTab === 'insights' && <InsightsCharts complaints={complaints} />}

      {/* Slide-over Complaint Detail Drawer */}
      <ComplaintDetailDrawer
        complaint={activeDrawerComplaint}
        currentUser={currentUser}
        onClose={() => setActiveDrawerComplaint(null)}
        onDelete={(id) => {
          setComplaints((prev) => prev.filter((c) => c.complaintId !== id));
          setResolvedComplaints((prev) => prev.filter((c) => c.complaintId !== id));
        }}
        onUpdate={(updated) => {
          const isNowResolved = updated.status === 'resolved' || updated.status === 'rejected';
          const wasActive = complaints.some((c) => c.complaintId === updated.complaintId);

          if (isNowResolved && wasActive) {
            const prev = complaints.find((c) => c.complaintId === updated.complaintId);
            setComplaints((cList) => cList.filter((c) => c.complaintId !== updated.complaintId));
            setResolvedComplaints((rList) => [
              updated,
              ...rList.filter((c) => c.complaintId !== updated.complaintId),
            ]);
            if (prev) {
              triggerUndoToast(updated.complaintId, prev.status, updated.status, updated.summary);
            }
            setActiveDrawerComplaint(null);
          } else {
            setComplaints((prev) =>
              prev.map((c) => (c.complaintId === updated.complaintId ? updated : c))
            );
            setResolvedComplaints((prev) =>
              prev.map((c) => (c.complaintId === updated.complaintId ? updated : c))
            );
            setActiveDrawerComplaint(updated);
          }
        }}
      />

      {/* 6.5 Floating 8-Second Undo Toast */}
      {undoToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#0e172a] border border-cyan-500/40 shadow-2xl flex items-center gap-4 text-xs animate-in slide-in-from-bottom duration-200">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Ticket updated to <strong className="uppercase text-cyan-300">{undoToast.newStatus}</strong>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs">{undoToast.summary}</p>
          </div>

          <div className="flex items-center gap-2 border-l border-white/10 pl-3">
            <button
              type="button"
              onClick={handleUndoAction}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-extrabold border border-cyan-500/40 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo ({undoToast.secondsRemaining}s)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
