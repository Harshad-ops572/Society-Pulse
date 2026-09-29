'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from './LanguageContext';
import { Sparkles, PhoneCall, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const { t, language } = useLanguage();
  const [helplineList, setHelplineList] = React.useState<Array<{ name: string; role: string; phone: string }>>([
    { name: 'Security Main Gate', role: 'Security Desk', phone: '+91 00000 00000' },
    { name: 'Lift AMC Supervisor', role: 'Emergency Escalation', phone: '+91 00000 00000' },
    { name: 'Electrician Desk', role: 'Electrical Services', phone: '+91 00000 00000' },
  ]);

  React.useEffect(() => {
    fetch('/api/public/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.helpline) && data.helpline.length > 0) {
          setHelplineList(data.helpline);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-white/10 bg-[#080c18] text-slate-400 text-xs py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-base text-slate-100">{t.appName}</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              {language === 'hi'
                ? 'हाउसिंग सोसाइटी प्रबंधन के लिए अगली पीढ़ी का एआई ट्राइएज प्लेटफॉर्म।'
                : 'Next-generation AI triage platform replacing chaotic WhatsApp groups for housing societies.'}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{language === 'hi' ? 'एआई ट्राइएज सक्रिय है' : 'AI Triage Engine Active'}</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-2">
            <p className="text-slate-200 font-semibold text-xs tracking-wider uppercase">
              {language === 'hi' ? 'त्वरित लिंक' : 'Quick Actions'}
            </p>
            <ul className="space-y-1.5">
              <li>
                <Link href="/report" className="hover:text-cyan-400 transition-colors">
                  {t.navReport}
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-cyan-400 transition-colors">
                  {t.navTrack}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">
                  {t.navDashboard}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-cyan-400 transition-colors">
                  {t.navLogin}
                </Link>
              </li>
            </ul>
          </div>

          {/* Emergency contacts */}
          <div className="space-y-2">
            <p className="text-slate-200 font-semibold text-xs tracking-wider uppercase">
              {language === 'hi' ? 'आपातकालीन संपर्क' : 'Society Helpline'}
            </p>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              {helplineList
                .filter((h) => h.phone && h.phone.trim() !== '')
                .map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <PhoneCall className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>
                      {item.name}: <strong className="text-slate-300 font-mono">{item.phone}</strong>
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          {/* Society Notice */}
          <div className="space-y-2">
            <p className="text-slate-200 font-semibold text-xs tracking-wider uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {language === 'hi' ? 'कमेटी सूचना' : 'Resident Privacy'}
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              {language === 'hi'
                ? 'शिकायतें केवल अधिकृत समिति सदस्यों और तकनीशियनों द्वारा ही देखी जाती हैं। सार्वजनिक रूप से केवल समग्र आंकड़े साझा किए जाते हैं।'
                : 'Complaints are triaged strictly for authorized society committee members and technicians. Phone numbers remain private.'}
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} SocietyPulse. Built for residential communities.</p>
          <p className="flex items-center gap-1">
            <span>Empowering volunteer committees with AI.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
