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
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ role: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ISettings | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
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

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
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
    </div>
  );
}
