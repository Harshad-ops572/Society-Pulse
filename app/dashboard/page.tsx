'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { IComplaint, IDigest, ComplaintStatus } from '@/types';
import DailyDigestCard from '@/components/dashboard/DailyDigestCard';
import KanbanBoard from '@/components/dashboard/KanbanBoard';
import PriorityQueueTable from '@/components/dashboard/PriorityQueueTable';
import ComplaintDetailDrawer from '@/components/dashboard/ComplaintDetailDrawer';
import InsightsCharts from '@/components/dashboard/InsightsCharts';
import {
  LayoutDashboard,
  Kanban,
  TableProperties,
  BarChart3,
  RefreshCw,
  Plus,
  Building,
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

export default function DashboardPage() {
  const router = useRouter();

  // Authentication check
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data states
  const [complaints, setComplaints] = useState<IComplaint[]>([]);
  const [digest, setDigest] = useState<IDigest | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'kanban' | 'insights'>('kanban');

  // Filter & Drawer state
  const [selectedWing, setSelectedWing] = useState<string | null>(null);
  const [activeDrawerComplaint, setActiveDrawerComplaint] = useState<IComplaint | null>(null);

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

  const loadDashboardData = async () => {
    try {
      setDataLoading(true);

      const [complaintsRes, digestRes] = await Promise.all([
        fetch('/api/complaints'),
        fetch('/api/digest'),
      ]);

      const complaintsData = await complaintsRes.json();
      const digestData = await digestRes.json();

      if (complaintsData.complaints) {
        setComplaints(complaintsData.complaints);
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

  // Quick Action from Daily Digest
  const handleQuickAction = async (
    complaintId: string,
    nextStatus: 'assigned' | 'in_progress' | 'resolved'
  ) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          timelineNote: `Status updated to ${nextStatus.toUpperCase()} via 1-Tap Daily Digest`,
        }),
      });
      const data = await res.json();
      if (data.success && data.complaint) {
        setComplaints((prev) =>
          prev.map((c) => (c.complaintId === complaintId ? data.complaint : c))
        );
      }
    } catch (err) {
      console.error('Quick action error:', err);
    }
  };

  // Status Change from Kanban
  const handleUpdateStatus = async (complaintId: string, nextStatus: ComplaintStatus) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          timelineNote: `Stage moved to ${nextStatus.toUpperCase()} on Kanban board`,
        }),
      });
      const data = await res.json();
      if (data.success && data.complaint) {
        setComplaints((prev) =>
          prev.map((c) => (c.complaintId === complaintId ? data.complaint : c))
        );
      }
    } catch (err) {
      console.error('Kanban status error:', err);
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Authenticating Committee Session...
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
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
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Greenwood Palms Co-op Housing Society • Welcome back, {currentUser?.name}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={dataLoading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
            title="Refresh Complaints"
          >
            <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
          </button>

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
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
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
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
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
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
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
          <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
            <Building className="w-3.5 h-3.5" />
            <span>Filtering by Wing {selectedWing}</span>
          </span>
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

      {activeTab === 'insights' && <InsightsCharts complaints={complaints} />}

      {/* Slide-over Complaint Detail Drawer */}
      <ComplaintDetailDrawer
        complaint={activeDrawerComplaint}
        onClose={() => setActiveDrawerComplaint(null)}
        onUpdate={(updated) => {
          setComplaints((prev) =>
            prev.map((c) => (c.complaintId === updated.complaintId ? updated : c))
          );
          setActiveDrawerComplaint(updated);
        }}
      />
    </div>
  );
}
