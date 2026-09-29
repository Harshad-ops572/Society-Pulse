'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  FileText,
  ListOrdered,
  Kanban,
  MapPin,
  TrendingUp,
} from 'lucide-react';

const TOUR_STEPS = [
  {
    step: 1,
    title: "1. Today's 5-Minute Digest",
    description:
      'Autonomous daily summary for committee members. Highlights safety hazards, auto-merged duplicate reports, and critical tasks needing authorization.',
    icon: FileText,
    accent: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  },
  {
    step: 2,
    title: '2. Priority Triage Queue',
    description:
      'Incoming complaints in Hindi, Hinglish, or English are ranked by urgency score (0-100) with automatic SLA countdown timers and technician suggestions.',
    icon: ListOrdered,
    accent: 'text-violet-400 bg-violet-500/20 border-violet-500/30',
  },
  {
    step: 3,
    title: '3. Interactive Kanban Workflow',
    description:
      'Move tickets smoothly from New → Triaged → Assigned → In Progress → Resolved using drag-and-drop or accessible keyboard buttons.',
    icon: Kanban,
    accent: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
  },
  {
    step: 4,
    title: '4. 3D Society Digital Twin',
    description:
      'Interactive low-poly twin of your housing towers. Wings glow red, amber, or green based on worst open severity. Click any tower to instantly filter complaints.',
    icon: MapPin,
    accent: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  },
  {
    step: 5,
    title: '5. Committee Insights & Time Saved',
    description:
      'Track operational efficiency: estimated hours saved, recurring issues (e.g. Lift B repeat breakdowns), and committee override accuracy telemetry.',
    icon: TrendingUp,
    accent: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
  },
];

export default function GuidedTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('society_tour_dismissed');
      if (!dismissed) {
        // Show after brief delay on first visit
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('society_tour_dismissed', 'true');
    }
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!visible) return null;

  const stepData = TOUR_STEPS[currentStep];
  const StepIcon = stepData.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-lg rounded-3xl bg-[#0d1527] border border-cyan-500/30 shadow-2xl p-6 sm:p-8 space-y-6"
        >
          {/* Header with pill & Close */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Platform Tour ({currentStep + 1} of 5)</span>
            </div>

            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close tour"
              aria-label="Close tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step Body */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl border ${stepData.accent}`}>
                <StepIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight">
                {stepData.title}
              </h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
              {stepData.description}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-7 bg-cyan-400 shadow-md shadow-cyan-400/50'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-200 font-semibold px-2 py-1"
            >
              Skip tour
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-95 text-white font-extrabold flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 transition-all"
              >
                <span>{currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
