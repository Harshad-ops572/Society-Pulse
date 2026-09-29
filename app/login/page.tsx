'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const { language } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Login
  const loginAsDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleLogin(undefined, demoEmail, demoPass);
  };

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 max-w-md mx-auto flex flex-col justify-center">
      <div className="text-center mb-8 space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/25">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          {language === 'hi' ? 'कमेटी सदस्य लॉगिन' : 'Committee Portal Login'}
        </h1>
        <p className="text-xs text-slate-400">
          {language === 'hi'
            ? 'अधिकृत हाउसिंग सोसायटी प्रबंधन पोर्टल'
            : 'Authorized access for Managing Committee & Technical staff'}
        </p>
      </div>

      {/* Main Glass Form */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@society.org"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Fast Demo Logins */}
        <div className="pt-4 border-t border-white/10 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>1-Tap Demo Credentials</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => loginAsDemo('admin@society.org', 'admin123')}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left text-xs text-slate-300 flex items-center justify-between group transition-colors"
            >
              <div>
                <span className="font-bold text-cyan-300">Vikram Malhotra</span>
                <span className="text-slate-400 ml-1.5">(Admin / President)</span>
                <p className="text-[11px] text-slate-500">admin@society.org</p>
              </div>
              <UserCheck className="w-4 h-4 text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              type="button"
              onClick={() => loginAsDemo('secretary@society.org', 'member123')}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left text-xs text-slate-300 flex items-center justify-between group transition-colors"
            >
              <div>
                <span className="font-bold text-violet-300">Ananya Deshmukh</span>
                <span className="text-slate-400 ml-1.5">(Secretary / Member)</span>
                <p className="text-[11px] text-slate-500">secretary@society.org</p>
              </div>
              <UserCheck className="w-4 h-4 text-violet-400 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
