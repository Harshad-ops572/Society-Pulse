'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useLanguage } from '@/components/LanguageContext';
import { compressImage } from '@/lib/compressImage';
import { heuristicTriage } from '@/lib/ai';
import { getUrgencyBadgeStyle } from '@/lib/utils';
import { ComplaintCategory, UrgencyLevel } from '@/types';
import {
  Mic,
  MicOff,
  Image as ImageIcon,
  X,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  Building,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
}

export default function ReportPage() {
  const { t, language } = useLanguage();

  // Wizard Step: 1 | 2 | 3 | 4 (success)
  const [step, setStep] = useState<number>(1);

  // Form State
  const [text, setText] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceLang, setVoiceLang] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // Location & Resident
  const [wing, setWing] = useState('A');
  const [flatNumber, setFlatNumber] = useState('');
  const [commonArea, setCommonArea] = useState('');
  const [residentName, setResidentName] = useState('');
  const [phone, setPhone] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // AI Classification override in step 3
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory>('other');
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel>('medium');
  const [aiDetected, setAiDetected] = useState<{
    category: ComplaintCategory;
    urgency: UrgencyLevel;
    urgencyScore: number;
    isSafetyRisk: boolean;
    summary: string;
    translatedText: string;
  } | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Read URL query parameter for prefilled complaint text from demo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const prefill = params.get('text');
      if (prefill) {
        setText(prefill);
      }
    }
  }, []);

  // Check speech recognition support
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Compute AI heuristic preview whenever text, wing, flat changes
  useEffect(() => {
    if (text.trim().length >= 4) {
      const triage = heuristicTriage(text, wing, flatNumber, commonArea);
      setAiDetected({
        category: triage.category,
        urgency: triage.urgency,
        urgencyScore: triage.urgencyScore,
        isSafetyRisk: triage.isSafetyRisk,
        summary: triage.summary,
        translatedText: triage.translatedText,
      });
      setSelectedCategory(triage.category);
      setSelectedUrgency(triage.urgency);
    }
  }, [text, wing, flatNumber, commonArea]);

  // Voice recording toggle / hold
  const startRecording = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      alert(t.speechNotSupported);
      return;
    }

    try {
      const recognition: SpeechRecognitionInstance = new SpeechRecognitionClass();
      recognition.lang = voiceLang;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentTranscript = '';
        for (let i = 0; i < Object.keys(event.results).length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setVoiceTranscript(currentTranscript.trim());
        setText((prev) => {
          if (!prev.includes(currentTranscript.trim())) {
            return prev ? `${prev} ${currentTranscript.trim()}` : currentTranscript.trim();
          }
          return prev;
        });
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition notice:', e.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsRecording(false);
    }
  };

  // Photo Handling with client compression
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      // Client-side compression to <= 1MB
      const compressed = await compressImage(file, 1024 * 1024);
      setPhotoFile(compressed);

      const objectUrl = URL.createObjectURL(compressed);
      setPhotoPreview(objectUrl);

      // Pre-upload to server
      const formData = new FormData();
      formData.append('file', compressed);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setPhotoUrl(data.url);
      }
    } catch (err) {
      console.error('Photo compression/upload error:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setPhotoUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (honeypot.trim() !== '') return;
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const fullFlat = flatNumber.toUpperCase().startsWith(`${wing}-`)
        ? flatNumber.toUpperCase()
        : `${wing}-${flatNumber.replace(/[^0-9]/g, '')}`;

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          wing,
          flatNumber: fullFlat,
          commonArea,
          residentName,
          phone,
          photoUrl,
          voiceTranscript,
          honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit complaint');
      }

      setSubmittedId(data.complaint.complaintId);
      setStep(4);

      // Trigger celebration confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'],
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!submittedId) return;
    navigator.clipboard.writeText(submittedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      {/* Step Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? '30 सेकंड रिपोर्टिंग' : '30-Second Fast Report'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          {language === 'hi' ? 'सोसायटी समस्या दर्ज करें' : 'Report a Society Issue'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {language === 'hi'
            ? 'हिंदी, हिंग्लिश या अंग्रेजी में बोलें या लिखें। एआई तुरंत वर्गीकृत करेगा।'
            : 'Type or speak in Hindi, Hinglish, or English. AI classifies and alerts the team instantly.'}
        </p>

        {/* Progress bar */}
        {step < 4 && (
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className={step >= 1 ? 'text-cyan-400 font-bold' : ''}>1. {t.wizardStep1.split('. ')[1]}</span>
              <span className={step >= 2 ? 'text-cyan-400 font-bold' : ''}>2. {t.wizardStep2.split('. ')[1]}</span>
              <span className={step >= 3 ? 'text-cyan-400 font-bold' : ''}>3. {t.wizardStep3.split('. ')[1]}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden border border-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-violet-600 rounded-full"
                initial={{ width: '33%' }}
                animate={{ width: `${(step / 3) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Glass Wizard Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: What happened? */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-200">
                    {language === 'hi' ? 'समस्या का विवरण दें' : 'Describe the Issue'}
                    <span className="text-cyan-400 ml-1">*</span>
                  </label>
                  <span className="text-xs text-slate-400">English / हिंदी / Hinglish</span>
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t.textPlaceholder}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-sm leading-relaxed"
                  />
                  {text && (
                    <button
                      type="button"
                      onClick={() => setText('')}
                      className="absolute top-3 right-3 text-slate-400 hover:text-white"
                      title="Clear text"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Voice Recorder Section */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300">
                      {language === 'hi' ? 'बोलकर दर्ज करें' : 'Hold-to-Record Voice'}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      Web Speech API
                    </span>
                  </div>

                  {/* Speech Language Toggle */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 text-[11px]">{t.languageToggleLabel}</span>
                    <button
                      type="button"
                      onClick={() => setVoiceLang(voiceLang === 'hi-IN' ? 'en-IN' : 'hi-IN')}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-cyan-300 text-xs font-bold transition-colors"
                    >
                      {voiceLang === 'hi-IN' ? '🇮🇳 हिंदी / Hinglish' : '🇬🇧 English'}
                    </button>
                  </div>
                </div>

                {speechSupported ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                    <button
                      type="button"
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                      className={`relative flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all select-none w-full sm:w-auto ${
                        isRecording
                          ? 'bg-red-500 text-white animate-voice-ripple'
                          : 'bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-95 text-white shadow-lg shadow-cyan-500/20'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
                      <span>{isRecording ? t.recording : t.holdToRecord}</span>
                    </button>

                    {/* Animated waveform visualizer during recording */}
                    {isRecording ? (
                      <div className="flex items-center gap-1 h-6">
                        {[40, 75, 100, 60, 90, 45, 80, 50, 95, 70].map((h, i) => (
                          <motion.span
                            key={i}
                            className="w-1 bg-red-400 rounded-full"
                            animate={{ height: [`${h * 0.2}%`, `${h}%`, `${h * 0.3}%`] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.05 }}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        {language === 'hi'
                          ? 'बटन दबाकर रखें और अपनी समस्या बोलें'
                          : 'Press & hold the mic button while speaking in Hindi or English'}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-amber-400">{t.speechNotSupported}</p>
                )}

                {voiceTranscript && (
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 text-xs text-slate-300">
                    <span className="font-semibold text-cyan-400">Captured transcript:</span> {voiceTranscript}
                  </div>
                )}
              </div>

              {/* Photo Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  {t.photoUploadTitle}
                </label>

                {!photoPreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/15 hover:border-cyan-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.05]"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoSelect}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
                    <p className="text-sm font-medium text-slate-200">{t.photoUploadHint}</p>
                    <p className="text-xs text-slate-500 mt-1">Supports JPEG, PNG, WEBP (Camera or Gallery)</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-white/20 max-w-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="Complaint attachment preview"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                      title={t.removePhoto}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-[10px] text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isUploadingPhoto ? 'Compressing...' : 'Compressed ≤ 1 MB'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Nav */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={text.trim().length < 5}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-md shadow-cyan-500/20"
                >
                  <span>{language === 'hi' ? 'आगे बढ़ें (स्थान और विवरण)' : 'Next: Location & Info'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Where & who? */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Wing */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    {t.wingLabel} <span className="text-cyan-400">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['A', 'B', 'C', 'D'].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setWing(w)}
                        className={`py-2.5 rounded-xl font-bold text-sm border transition-all ${
                          wing === w
                            ? 'bg-cyan-500 text-white border-cyan-400 shadow-md shadow-cyan-500/30'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        Wing {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flat Number */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    {t.flatLabel} <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={flatNumber}
                      onChange={(e) => setFlatNumber(e.target.value)}
                      placeholder="e.g. 402 or B-402"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Common Area Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  {t.commonAreaLabel}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Entrance Lobby',
                    'Elevator Shaft',
                    'Basement 1 Parking',
                    'Basement 2 Parking',
                    'Terrace',
                    'Society Garden',
                    'Security Gate 1',
                    'Security Gate 2',
                    'Clubhouse / Gym',
                    'Swimming Pool',
                    'Pump Room',
                    'Staircase Corridor',
                  ].map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setCommonArea(commonArea === area ? '' : area)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        commonArea === area
                          ? 'bg-violet-600 text-white border-violet-400'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resident Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    {t.nameLabel} <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={residentName}
                    onChange={(e) => setResidentName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    {t.phoneLabel}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.phonePlaceholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm font-medium"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    {language === 'hi'
                      ? 'निजी रहेगा। केवल स्थिति अपडेट के लिए प्रयोग किया जाएगा।'
                      : 'Never displayed publicly. Used strictly for status alerts.'}
                  </p>
                </div>
              </div>

              {/* Hidden Spam Honeypot */}
              <input
                type="text"
                name="society_check_website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Navigation */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{language === 'hi' ? 'पीछे' : 'Back'}</span>
                </button>

                <button
                  type="button"
                  disabled={!flatNumber.trim() || !residentName.trim()}
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-md shadow-cyan-500/20"
                >
                  <span>{language === 'hi' ? 'समीक्षा करें' : 'Next: Review & Submit'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Review & Submit */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* AI Triage Preview Card */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-950/40 via-violet-950/20 to-slate-900 border border-cyan-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-slate-100">{t.aiPreviewTitle}</span>
                  </div>
                  <span className="text-[11px] text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30 font-semibold">
                    Realtime AI Analysis
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{t.aiPreviewDesc}</p>

                {aiDetected?.isSafetyRisk && (
                  <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="font-semibold">{t.safetyRiskNotice}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-400 block mb-1">{t.detectedCategory}:</span>
                    <span className="font-bold text-cyan-300 uppercase tracking-wider text-sm">
                      {selectedCategory}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-400 block mb-1">{t.urgencyLevel}:</span>
                    {(() => {
                      const style = getUrgencyBadgeStyle(selectedUrgency);
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase border ${style.bg} ${style.border}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                          {selectedUrgency}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {aiDetected?.translatedText && aiDetected.translatedText !== text && (
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs">
                    <span className="text-slate-400 block mb-1">English Translation for Committee:</span>
                    <span className="text-slate-200 italic font-medium">{aiDetected.translatedText}</span>
                  </div>
                )}
              </div>

              {/* Resident Summary Verification */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Location:</span>
                  <span className="font-semibold text-slate-200">
                    Wing {wing} — Flat {flatNumber} {commonArea ? `(${commonArea})` : ''}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Reporter:</span>
                  <span className="font-semibold text-slate-200">{residentName} {phone ? `(${phone})` : ''}</span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-400 block mb-1">Complaint Content:</span>
                  <p className="text-slate-200 italic">&ldquo;{text}&rdquo;</p>
                </div>
                {photoPreview && (
                  <div className="pt-2 flex items-center gap-2 text-cyan-400">
                    <ImageIcon className="w-4 h-4" />
                    <span>Photo attached (compressed to &le; 1MB)</span>
                  </div>
                )}
              </div>

              {/* Submission CTA */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{language === 'hi' ? 'पीछे' : 'Back'}</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t.submitting}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{t.submitButton}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Success Screen */}
          {step === 4 && submittedId && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-6 space-y-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-100">{t.complaintSubmitted}</h2>
                <p className="text-sm text-slate-400 mt-1">
                  {language === 'hi'
                    ? 'आपकी शिकायत पंजीकृत हो गई है और समिति को सूचित कर दिया गया है।'
                    : 'Your complaint has been triaged, SLA has been set, and assigned for committee review.'}
                </p>
              </div>

              {/* Complaint ID Badge */}
              <div className="p-6 rounded-2xl bg-black/40 border border-cyan-500/30 max-w-sm mx-auto space-y-2">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  {t.yourComplaintId}
                </span>
                <div className="text-3xl font-mono font-extrabold text-cyan-300 tracking-wider">
                  {submittedId}
                </div>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-200 transition-colors mt-2"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t.copied : t.copyId}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href={`/track?id=${submittedId}&flat=${flatNumber}`}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>{t.trackNow}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setText('');
                    setVoiceTranscript('');
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    setSubmittedId(null);
                    setStep(1);
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold border border-white/10 transition-colors"
                >
                  {t.submitAnother}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
