'use client';

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { IComplaint } from '@/types';
import { Layers, RotateCcw, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SocietyMapProps {
  complaints: IComplaint[];
  selectedWing: string | null;
  onSelectWing: (wing: string | null) => void;
}

// Compute wing severity: 'red' (critical), 'amber' (high), 'yellow' (medium), 'green' (clean)
function getWingHealth(wing: string, complaints: IComplaint[]) {
  const wingComplaints = complaints.filter(
    (c) => c.wing === wing && c.status !== 'resolved' && c.status !== 'rejected'
  );

  const hasCritical = wingComplaints.some((c) => c.urgency === 'critical');
  const hasHigh = wingComplaints.some((c) => c.urgency === 'high');
  const hasMedium = wingComplaints.some((c) => c.urgency === 'medium');

  let color = '#22c55e'; // Green
  let statusText = 'Normal';
  if (hasCritical) {
    color = '#ef4444'; // Red
    statusText = 'Critical Alert';
  } else if (hasHigh) {
    color = '#f97316'; // Amber / Orange
    statusText = 'High Attention';
  } else if (hasMedium) {
    color = '#eab308'; // Yellow
    statusText = 'Moderate Issues';
  }

  return {
    color,
    statusText,
    count: wingComplaints.length,
    complaints: wingComplaints,
  };
}

function InteractiveTower({
  wing,
  position,
  height,
  selected,
  onClick,
  health,
}: {
  wing: string;
  position: [number, number, number];
  height: number;
  selected: boolean;
  onClick: () => void;
  health: { color: string; count: number };
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Tower Body */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[1.8, height, 1.8]} />
        <meshStandardMaterial
          color={selected ? '#38bdf8' : hovered ? '#1e293b' : '#111827'}
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>

      {/* Health Glow Rim on Rooftop */}
      <mesh position={[0, height + 0.1, 0]}>
        <boxGeometry args={[1.9, 0.2, 1.9]} />
        <meshStandardMaterial
          color={health.color}
          emissive={health.color}
          emissiveIntensity={hovered || selected ? 2.5 : 1.2}
        />
      </mesh>

      {/* Rooftop Water Tank */}
      <mesh position={[0, height + 0.45, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.5, 12]} />
        <meshStandardMaterial color="#0284c7" />
      </mesh>

      {/* Label Text */}
      <Text
        position={[0, height + 0.9, 0]}
        fontSize={0.4}
        color={selected ? '#38bdf8' : '#f8fafc'}
        anchorX="center"
        anchorY="middle"
      >
        {`Wing ${wing}`}
      </Text>

      {health.count > 0 && (
        <Text
          position={[0, height + 0.55, 1]}
          fontSize={0.25}
          color={health.color}
          anchorX="center"
          anchorY="middle"
        >
          {`${health.count} open`}
        </Text>
      )}

      {/* Point Light casting ambient glow */}
      <pointLight
        position={[0, height + 0.3, 0]}
        color={health.color}
        intensity={selected ? 2 : 0.8}
        distance={4}
      />
    </group>
  );
}

export default function SocietyMap({
  complaints,
  selectedWing,
  onSelectWing,
}: SocietyMapProps) {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  const wings = ['A', 'B', 'C', 'D'];
  const towerConfigs = [
    { wing: 'A', position: [-2.4, 0, -1] as [number, number, number], height: 3.8 },
    { wing: 'B', position: [0, 0, -2.2] as [number, number, number], height: 5.2 },
    { wing: 'C', position: [2.4, 0, -1] as [number, number, number], height: 4.2 },
    { wing: 'D', position: [0, 0, 1.5] as [number, number, number], height: 3.2 },
  ];

  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4 relative overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-slate-100">
              Interactive Society Digital Twin
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Realtime severity telemetry. Click any tower to filter complaint queue.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {selectedWing && (
            <button
              onClick={() => onSelectWing(null)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-300 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Filter (Wing {selectedWing})</span>
            </button>
          )}

          <button
            onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
            className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Switch to {viewMode === '3d' ? '2D View' : '3D Twin'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas / 2D Container */}
      <div className="w-full h-72 sm:h-80 rounded-xl bg-[#070b14] border border-white/5 relative overflow-hidden">
        {viewMode === '3d' ? (
          <Canvas
            camera={{ position: [0, 6, 8], fov: 45 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.4} color="#581c87" />
            <directionalLight position={[5, 10, 5]} intensity={1.8} color="#06b6d4" />
            <directionalLight position={[-5, 8, -5]} intensity={1.2} color="#ec4899" />

            {/* Ground Plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
              <planeGeometry args={[14, 14]} />
              <meshStandardMaterial color="#0d1424" roughness={0.8} />
            </mesh>

            {/* Towers */}
            {towerConfigs.map((t) => {
              const health = getWingHealth(t.wing, complaints);
              return (
                <InteractiveTower
                  key={t.wing}
                  wing={t.wing}
                  position={t.position}
                  height={t.height}
                  selected={selectedWing === t.wing}
                  onClick={() => onSelectWing(selectedWing === t.wing ? null : t.wing)}
                  health={health}
                />
              );
            })}

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              maxPolarAngle={Math.PI / 2.2}
              minPolarAngle={Math.PI / 5}
            />
          </Canvas>
        ) : (
          /* 2D Fallback Map */
          <div className="w-full h-full p-6 flex flex-col justify-center">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto w-full">
              {wings.map((w) => {
                const health = getWingHealth(w, complaints);
                const isSelected = selectedWing === w;
                return (
                  <button
                    key={w}
                    onClick={() => onSelectWing(isSelected ? null : w)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: health.color, boxShadow: `0 0 10px ${health.color}` }}
                    />
                    <span className="font-bold text-slate-100 text-sm block">Tower Wing {w}</span>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {health.count} Active Issues
                    </span>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider block mt-1"
                      style={{ color: health.color }}
                    >
                      {health.statusText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend strip overlay */}
        <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
              <span>Critical Alert</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316]" />
              <span>High</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#22c55e]" />
              <span>Normal</span>
            </span>
          </div>
          <span className="hidden sm:inline text-slate-500 text-[10px]">
            Hover & Click to filter
          </span>
        </div>
      </div>
    </div>
  );
}
