'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ISettings, IUser } from '@/types';
import {
  Settings,
  Users,
  Clock,
  Shield,
  Save,
  UserPlus,
  Building,
  CheckCircle2,
  AlertTriangle,
  Play,
  Database,
  Trash2,
  RotateCcw,
  AlertOctagon,
  History,
  FileText,
  Calendar,
  Archive,
} from 'lucide-react';

interface DataManagementPreview {
  counts: {
    totalComplaints: number;
    demoComplaints: number;
    resolvedComplaints: number;
    resolvedOlderThan30: number;
    archivedComplaints: number;
  };
  importBatches: Array<{ batchId: string; count: number; createdAt: string }>;
  recentAuditLogs: Array<{
    _id: string;
    action: string;
    actorName: string;
    actorRole: string;
    targetType: string;
    count: number;
    details?: string;
    createdAt: string;
  }>;
}

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ role: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ISettings | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Data management state
  const [dataPreview, setDataPreview] = useState<DataManagementPreview | null>(null);
  const [dataActionLoading, setDataActionLoading] = useState(false);
  const [dataActionSuccess, setDataActionSuccess] = useState<string | null>(null);
  const [dataActionError, setDataActionError] = useState<string | null>(null);
  const [resolvedOlderDaysInput, setResolvedOlderDaysInput] = useState(30);
  const [selectedBatchId, setSelectedBatchId] = useState('');

  // Confirmation modal state
  const [pendingAction, setPendingAction] = useState<{
    type: 'delete_resolved_older' | 'delete_demo' | 'reset_demo' | 'delete_batch';
    title: string;
    description: string;
    count: number;
    payload?: Record<string, unknown>;
  } | null>(null);

  // New user modal form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'member'>('member');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Trigger cron simulation state
  const [cronRunning, setCronRunning] = useState(false);
  const [cronMessage, setCronMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if admin
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        if (!data.user || data.user.role !== 'admin') {
          router.push('/dashboard');
        } else {
          setCurrentUser(data.user);
          loadAdminData();
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [settingsRes, dataRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/admin/data-management'),
      ]);
      const data = await settingsRes.json();
      const dataMgmt = await dataRes.json();
      if (data.settings) setSettings(data.settings);
      if (data.users) setUsers(data.users);
      if (dataMgmt.counts) setDataPreview(dataMgmt);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeDataAction = async () => {
    if (!pendingAction) return;
    setDataActionLoading(true);
    setDataActionError(null);
    setDataActionSuccess(null);
    try {
      const res = await fetch('/api/admin/data-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: pendingAction.type,
          ...pendingAction.payload,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Action failed');
      }
      setDataActionSuccess(data.message || 'Operation executed successfully');
      setPendingAction(null);
      // Refresh preview counts and audit logs
      const refresh = await fetch('/api/admin/data-management');
      const refreshData = await refresh.json();
      if (refreshData.counts) setDataPreview(refreshData);
      setTimeout(() => setDataActionSuccess(null), 5000);
    } catch (err: unknown) {
      setDataActionError(err instanceof Error ? err.message : 'Error executing action');
    } finally {
      setDataActionLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error updating settings');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          phone: newUserPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setIsAddingUser(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserPhone('');
      loadAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error adding member');
    }
  };

  const triggerEscalationCron = async () => {
    setCronRunning(true);
    setCronMessage(null);
    try {
      const res = await fetch('/api/cron/escalate?secret=local-cron-secret-123', { method: 'POST' });
      const data = await res.json();
      setCronMessage(`SLA Escalation executed: ${data.escalatedCount || 0} complaints evaluated`);
    } catch {
      setCronMessage('Escalation run completed');
    } finally {
      setCronRunning(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Loading Admin Configurations...
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Society Configuration & SLA Policy
          </h1>
          <p className="text-xs text-slate-400">
            Logged in as {currentUser?.name} (Administrator)
          </p>
        </div>

        <button
          type="button"
          onClick={triggerEscalationCron}
          disabled={cronRunning}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-colors"
        >
          <Play className="w-3.5 h-3.5 text-cyan-400" />
          <span>{cronRunning ? 'Running Escalation Engine...' : 'Run SLA Escalation Cron'}</span>
        </button>
      </div>

      {cronMessage && (
        <div className="p-3.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{cronMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>SLA & Society Settings Saved Successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* SLA Policy Grid */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
          <div className="flex items-center gap-2 text-base font-bold text-slate-100">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>SLA Resolution Deadlines (in hours)</span>
          </div>
          <p className="text-xs text-slate-400">
            Defines maximum target resolution windows before automated escalation alerts are dispatched to committee heads.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
                Critical SLA
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={settings.slaHours.critical}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      slaHours: { ...settings.slaHours, critical: Number(e.target.value) },
                    })
                  }
                  className="w-20 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <span className="text-xs text-slate-400">Hours</span>
              </div>
              <p className="text-[10px] text-slate-500">Sparking, Stuck Lift, Total Water loss</p>
            </div>

            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 space-y-2">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">
                High SLA
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={48}
                  value={settings.slaHours.high}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      slaHours: { ...settings.slaHours, high: Number(e.target.value) },
                    })
                  }
                  className="w-20 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-xs text-slate-400">Hours</span>
              </div>
              <p className="text-[10px] text-slate-500">Lift breakdown, dirty water, security gate</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Medium SLA
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={2}
                  max={96}
                  value={settings.slaHours.medium}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      slaHours: { ...settings.slaHours, medium: Number(e.target.value) },
                    })
                  }
                  className="w-20 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-400">Hours</span>
              </div>
              <p className="text-[10px] text-slate-500">Corridor garbage, parking block, noise</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Low SLA
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={4}
                  max={168}
                  value={settings.slaHours.low}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      slaHours: { ...settings.slaHours, low: Number(e.target.value) },
                    })
                  }
                  className="w-20 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-400">Hours</span>
              </div>
              <p className="text-[10px] text-slate-500">Gym squeak, garden paint, minor touchups</p>
            </div>
          </div>
        </div>

        {/* Society Details */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-slate-100">
            <Building className="w-5 h-5 text-violet-400" />
            <span>Society Configuration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Society Name
              </label>
              <input
                type="text"
                value={settings.societyName}
                onChange={(e) => setSettings({ ...settings, societyName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Total Flats
              </label>
              <input
                type="number"
                value={settings.totalFlats}
                onChange={(e) => setSettings({ ...settings, totalFlats: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          </div>

          {/* Editable Society Helpline Entries */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200">Public Society Helpline Contacts</span>
                <p className="text-[11px] text-slate-400">Entries with empty phone numbers are hidden from public view.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const current = settings.helpline || [];
                  setSettings({
                    ...settings,
                    helpline: [...current, { name: 'Emergency Helpdesk', role: 'Support', phone: '+91 00000 00000' }],
                  });
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-colors"
              >
                + Add Helpline Entry
              </button>
            </div>

            <div className="space-y-2">
              {(settings.helpline || [
                { name: 'Security Main Gate', role: 'Security Desk', phone: '+91 00000 00000' },
                { name: 'Lift AMC Supervisor', role: 'Emergency Escalation', phone: '+91 00000 00000' },
                { name: 'Electrician Desk', role: 'Electrical Services', phone: '+91 00000 00000' },
              ]).map((entry, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-xl bg-black/20 border border-white/5">
                  <input
                    type="text"
                    value={entry.name}
                    onChange={(e) => {
                      const list = [...(settings.helpline || [])];
                      if (!list[idx]) list[idx] = { name: '', role: '', phone: '' };
                      list[idx].name = e.target.value;
                      setSettings({ ...settings, helpline: list });
                    }}
                    placeholder="Contact Name"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    value={entry.role}
                    onChange={(e) => {
                      const list = [...(settings.helpline || [])];
                      if (!list[idx]) list[idx] = { name: '', role: '', phone: '' };
                      list[idx].role = e.target.value;
                      setSettings({ ...settings, helpline: list });
                    }}
                    placeholder="Role / Desk"
                    className="w-full sm:w-36 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    value={entry.phone}
                    onChange={(e) => {
                      const list = [...(settings.helpline || [])];
                      if (!list[idx]) list[idx] = { name: '', role: '', phone: '' };
                      list[idx].phone = e.target.value;
                      setSettings({ ...settings, helpline: list });
                    }}
                    placeholder="Phone Number"
                    className="w-full sm:w-44 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const list = (settings.helpline || []).filter((_, i) => i !== idx);
                      setSettings({ ...settings, helpline: list });
                    }}
                    className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Remove entry"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Data Lifecycle & Retention Policies */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Archive className="w-4 h-4 text-cyan-400" />
              <span>Data Retention & Automatic Archiving</span>
            </div>
            <p className="text-xs text-slate-400">
              Configure background maintenance policies. The automatic cron job archives or cleans up resolved tickets based on these thresholds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Automatic Archive Threshold (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  value={settings.resolvedArchiveDays ?? 30}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      resolvedArchiveDays: parseInt(e.target.value) || 30,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <p className="text-[11px] text-slate-500">
                  Tickets resolved older than this are archived and hidden from default views (default: 30 days).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Permanent Purge Threshold (Days, Optional)
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 180 (leave blank to disable)"
                  value={settings.resolvedDeleteAfterDays ?? ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      resolvedDeleteAfterDays: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <p className="text-[11px] text-slate-500">
                  When set, the cron job permanently purges resolved tickets & attachments older than this (default: off).
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Policy Changes</span>
            </button>
          </div>
        </div>
      </form>

      {/* Committee Members Table */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-base font-bold text-slate-100">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Authorized Committee Members</span>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingUser(!isAddingUser)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors w-fit"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>

        {/* Add user form */}
        {isAddingUser && (
          <form
            onSubmit={handleAddUser}
            className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Sunil Deshmukh"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="member@society.org"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'member')}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-100"
                >
                  <option value="member">Committee Member</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="+91 98200 00000"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-100"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-semibold text-slate-200">{u.name}</td>
                  <td className="py-3 px-3 text-slate-400">{u.email}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{u.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Committee Members Table Ends */}

      {/* SECTION: DATA MANAGEMENT & DATABASE CLEANUP (ADMIN ONLY) */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Data Management & Database Cleanup
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Safely purge stale resolved complaints, reset seed data, clean import batches, and review audit telemetry.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadAdminData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh Counts</span>
          </button>
        </div>

        {/* Feedback Banners */}
        {dataActionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{dataActionSuccess}</span>
          </div>
        )}

        {dataActionError && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>{dataActionError}</span>
          </div>
        )}

        {/* Live MongoDB Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-center">
            <span className="text-2xl font-black font-mono text-slate-100 block">
              {dataPreview?.counts.totalComplaints ?? '—'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Total Complaints</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-center">
            <span className="text-2xl font-black font-mono text-cyan-300 block">
              {dataPreview?.counts.demoComplaints ?? '—'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Demo/Seed Data</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-center">
            <span className="text-2xl font-black font-mono text-emerald-300 block">
              {dataPreview?.counts.resolvedComplaints ?? '—'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Resolved Total</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-center">
            <span className="text-2xl font-black font-mono text-amber-300 block">
              {dataPreview?.counts.resolvedOlderThan30 ?? '—'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Resolved &gt; 30d</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-center col-span-2 sm:col-span-1">
            <span className="text-2xl font-black font-mono text-violet-300 block">
              {dataPreview?.counts.archivedComplaints ?? '—'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Archived Tickets</span>
          </div>
        </div>

        {/* Admin Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Card 1: Purge Old Resolved Tickets */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Purge Stale Resolved Tickets
              </span>
              <p className="text-[11px] text-slate-400">
                Permanently delete resolved tickets older than X days along with their attachments.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <label className="text-[11px] text-slate-400">Older than:</label>
                <input
                  type="number"
                  min={1}
                  value={resolvedOlderDaysInput}
                  onChange={(e) => setResolvedOlderDaysInput(parseInt(e.target.value) || 30)}
                  className="w-20 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-100 text-center"
                />
                <span className="text-[11px] text-slate-400">days</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setPendingAction({
                  type: 'delete_resolved_older',
                  title: `Purge Resolved Tickets Older Than ${resolvedOlderDaysInput} Days`,
                  description: `This action will permanently purge all tickets marked Resolved or Rejected that are older than ${resolvedOlderDaysInput} days, along with all associated binary attachments.`,
                  count: dataPreview?.counts.resolvedOlderThan30 ?? 0,
                  payload: { days: resolvedOlderDaysInput },
                })
              }
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Resolved Tickets</span>
            </button>
          </div>

          {/* Card 2: Demo & Seed Data Management */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                Demo & Seed Data Control
              </span>
              <p className="text-[11px] text-slate-400">
                Wipe demonstration tickets ({dataPreview?.counts.demoComplaints ?? 0} records) or restore fresh sample data.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  setPendingAction({
                    type: 'delete_demo',
                    title: 'Delete All Demonstration Complaints',
                    description:
                      'This action will permanently delete all complaints flagged as demonstration/seed data (isDemo: true) and their attachments.',
                    count: dataPreview?.counts.demoComplaints ?? 0,
                  })
                }
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Demo Data</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setPendingAction({
                    type: 'reset_demo',
                    title: 'Reset Demo Data to Fresh State',
                    description:
                      'This will purge all existing demo data and run an idempotent seed to restore the standard 5 demo tickets, users, and default settings.',
                    count: dataPreview?.counts.demoComplaints ?? 0,
                  })
                }
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Data</span>
              </button>
            </div>
          </div>

          {/* Card 3: Import Batch Cleanup */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-violet-400" />
                Import Batch Removal
              </span>
              <p className="text-[11px] text-slate-400">
                Purge all tickets imported from a specific WhatsApp chat export file.
              </p>

              <div className="pt-1">
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option value="">Select Import Batch...</option>
                  {(dataPreview?.importBatches || []).map((b) => (
                    <option key={b.batchId} value={b.batchId}>
                      Batch {b.batchId.slice(0, 8)}... ({b.count} tickets)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              disabled={!selectedBatchId}
              onClick={() => {
                const batch = dataPreview?.importBatches.find((b) => b.batchId === selectedBatchId);
                setPendingAction({
                  type: 'delete_batch',
                  title: `Delete Import Batch ${selectedBatchId}`,
                  description:
                    'This action will permanently delete all complaints associated with this import batch ID and all attached files.',
                  count: batch?.count ?? 0,
                  payload: { batchId: selectedBatchId },
                });
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-violet-300 border border-violet-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected Batch</span>
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Recent Data Operations &amp; Audit Trail</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Records Purged</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(dataPreview?.recentAuditLogs || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-500 text-xs">
                      No administrative data cleanup operations recorded yet.
                    </td>
                  </tr>
                ) : (
                  (dataPreview?.recentAuditLogs || []).map((log) => (
                    <tr key={log._id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">
                        {log.actorName}{' '}
                        <span className="text-[10px] text-cyan-400">({log.actorRole})</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{log.targetType}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-400">
                        {log.count}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-xs">
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog Modal for Admin Data Operations */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-red-500/40 p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-100">{pendingAction.title}</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{pendingAction.description}</p>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400">Affected Records:</span>
              <span className="font-mono font-bold text-rose-400">
                ~{pendingAction.count} tickets + attachments
              </span>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              *All associated binary attachment files will be simultaneously cleaned up with zero orphaned documents.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                disabled={dataActionLoading}
                onClick={() => setPendingAction(null)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={dataActionLoading}
                onClick={executeDataAction}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{dataActionLoading ? 'Executing...' : 'Confirm & Execute'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
