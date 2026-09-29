'use client';

import React from 'react';

export default function HeroPoster() {
  return (
    <div
      className="w-full h-full relative overflow-hidden bg-[#070b16] flex items-center justify-center select-none pointer-events-none"
      aria-label="3D Society Digital Twin architectural skyline preview"
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Futuristic Skyline Vector Silhouette */}
      <svg
        className="w-full h-full max-w-4xl max-h-[500px] opacity-80"
        viewBox="0 0 1000 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="towerAGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0B1020" />
          </linearGradient>
          <linearGradient id="towerBGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#312e81" />
            <stop offset="100%" stopColor="#0B1020" />
          </linearGradient>
          <linearGradient id="towerCGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#134e4a" />
            <stop offset="100%" stopColor="#0B1020" />
          </linearGradient>
          <linearGradient id="towerDGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#0B1020" />
          </linearGradient>
          <filter id="neonCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="neonVioletGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ground grid horizon */}
        <line x1="50" y1="520" x2="950" y2="520" stroke="#334155" strokeWidth="1" strokeDasharray="6 6" />
        <line x1="150" y1="540" x2="850" y2="540" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />

        {/* Tower A (Left - Cyan Accent) */}
        <g transform="translate(180, 180)">
          <rect x="0" y="0" width="130" height="340" rx="4" fill="url(#towerAGrad)" stroke="#06b6d4" strokeWidth="1.5" strokeOpacity="0.4" />
          {/* Rooftop Parapet */}
          <rect x="-5" y="-12" width="140" height="12" rx="2" fill="#0f172a" stroke="#06b6d4" strokeWidth="1" />
          <circle cx="65" cy="-22" r="14" fill="#0284c7" />
          <circle cx="65" cy="-22" r="4" fill="#38bdf8" filter="url(#neonCyanGlow)" />
          {/* Lit Windows */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((row) => (
            <g key={row}>
              <rect x="20" y={30 + row * 38} width="22" height="14" rx="2" fill="#06b6d4" opacity={row % 2 === 0 ? 0.85 : 0.25} />
              <rect x="54" y={30 + row * 38} width="22" height="14" rx="2" fill="#06b6d4" opacity={row % 3 === 0 ? 0.9 : 0.3} />
              <rect x="88" y={30 + row * 38} width="22" height="14" rx="2" fill="#38bdf8" opacity={row % 2 === 1 ? 0.75 : 0.2} />
            </g>
          ))}
          {/* Wing Badge */}
          <text x="65" y="325" textAnchor="middle" fill="#06b6d4" fontSize="12" fontWeight="bold" letterSpacing="1">WING A</text>
        </g>

        {/* Tower B (Center Back - Tallest, Violet Accent) */}
        <g transform="translate(420, 100)">
          <rect x="0" y="0" width="160" height="420" rx="4" fill="url(#towerBGrad)" stroke="#8b5cf6" strokeWidth="1.5" strokeOpacity="0.5" />
          {/* Rooftop Structure */}
          <rect x="-6" y="-16" width="172" height="16" rx="2" fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="1" />
          <rect x="55" y="-36" width="50" height="20" rx="3" fill="#6d28d9" />
          <circle cx="80" cy="-44" r="5" fill="#a78bfa" filter="url(#neonVioletGlow)" />
          {/* Lit Windows */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((row) => (
            <g key={row}>
              <rect x="24" y={25 + row * 38} width="26" height="14" rx="2" fill="#8b5cf6" opacity={row % 2 === 0 ? 0.8 : 0.2} />
              <rect x="67" y={25 + row * 38} width="26" height="14" rx="2" fill="#a78bfa" opacity={row % 3 === 1 ? 0.9 : 0.25} />
              <rect x="110" y={25 + row * 38} width="26" height="14" rx="2" fill="#8b5cf6" opacity={row % 2 === 1 ? 0.85 : 0.3} />
            </g>
          ))}
          {/* Wing Badge */}
          <text x="80" y="405" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="bold" letterSpacing="1">WING B</text>
        </g>

        {/* Tower C (Right - Emerald Accent) */}
        <g transform="translate(680, 150)">
          <rect x="0" y="0" width="140" height="370" rx="4" fill="url(#towerCGrad)" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.4" />
          {/* Rooftop Parapet */}
          <rect x="-5" y="-14" width="150" height="14" rx="2" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
          <circle cx="70" cy="-24" r="14" fill="#047857" />
          <circle cx="70" cy="-24" r="4" fill="#34d399" />
          {/* Lit Windows */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
            <g key={row}>
              <rect x="22" y={28 + row * 38} width="24" height="14" rx="2" fill="#10b981" opacity={row % 2 === 0 ? 0.85 : 0.2} />
              <rect x="58" y={28 + row * 38} width="24" height="14" rx="2" fill="#34d399" opacity={row % 3 === 2 ? 0.9 : 0.3} />
              <rect x="94" y={28 + row * 38} width="24" height="14" rx="2" fill="#10b981" opacity={row % 2 === 1 ? 0.75 : 0.25} />
            </g>
          ))}
          {/* Wing Badge */}
          <text x="70" y="355" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="bold" letterSpacing="1">WING C</text>
        </g>
      </svg>
    </div>
  );
}
