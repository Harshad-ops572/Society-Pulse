export type ComplaintCategory =
  | 'water'
  | 'lift'
  | 'parking'
  | 'noise'
  | 'cleaning'
  | 'electrical'
  | 'security'
  | 'other';

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

export type ComplaintStatus =
  | 'new'
  | 'triaged'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'reopened';

export type UserRole = 'admin' | 'member' | 'demo';

export interface TimelineEvent {
  status: ComplaintStatus;
  note: string;
  by: string;
  at: Date | string;
}

export interface InternalNote {
  id?: string;
  note: string;
  author: string;
  createdAt: Date | string;
}

export interface IComplaint {
  _id?: string;
  complaintId: string; // e.g. "SP-2026-0042"
  originalText: string;
  translatedText: string;
  language: 'en' | 'hi' | 'hinglish';
  summary: string;
  category: ComplaintCategory;
  urgency: UrgencyLevel;
  urgencyScore: number; // 0-100
  urgencyReason: string;
  isSafetyRisk: boolean;
  status: ComplaintStatus;
  wing: string; // e.g. "A", "B", "C", "D"
  flatNumber: string; // e.g. "A-402"
  commonArea?: string; // e.g. "Lobby", "Basement Parking", "Terrace", "Lift B"
  residentName: string;
  phone?: string;
  photoUrl?: string;
  attachmentId?: string | null;
  voiceTranscript?: string;
  duplicateOf?: string | null; // complaintId or ID of parent
  reportCount: number;
  assignedTo?: string | null; // e.g. "Ramesh (Plumber)" or committee user name
  needsManualTriage: boolean;
  aiOverridden: boolean;
  originalAiCategory?: string | null;
  originalAiUrgency?: string | null;
  overriddenBy?: string | null;
  slaDueAt: Date | string;
  resolvedAt?: Date | string | null;
  residentConfirmed?: boolean | null; // true: resolved, false: reopened
  satisfactionRating?: number | null;
  isDemo?: boolean;
  importBatchId?: string | null;
  archivedAt?: Date | string | null;
  seedKey?: string | null;
  reopenedCount?: number;
  timeline: TimelineEvent[];
  internalNotes: InternalNote[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IAuditLog {
  _id?: string;
  action: string;
  actorName: string;
  actorRole: UserRole;
  details: string;
  count: number;
  targetType: 'complaint' | 'attachment' | 'demo' | 'batch';
  createdAt: Date | string;
}

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  createdAt: Date | string;
}

export interface IDigestRow {
  complaintId: string;
  summary: string;
  urgency: UrgencyLevel;
  category: ComplaintCategory;
  flatNumber: string;
  wing: string;
  status: ComplaintStatus;
  isSafetyRisk: boolean;
  suggestedAction: string;
}

export interface IDigest {
  _id?: string;
  date: string; // YYYY-MM-DD
  stats: {
    urgentCount: number;
    newCount: number;
    overdueCount: number;
    mergedDuplicatesCount: number;
    totalOpenCount: number;
  };
  summaryHeadline: string;
  rows: IDigestRow[];
  createdAt: Date | string;
}

export interface IHelplineEntry {
  name: string;
  role: string;
  phone: string;
}

export interface ISettings {
  _id?: string;
  slaHours: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  categories: string[];
  wings: string[];
  societyName: string;
  totalFlats: number;
  helpline?: IHelplineEntry[];
  resolvedArchiveDays?: number;
  resolvedDeleteAfterDays?: number | null;
}

export interface AITriageResult {
  language: 'en' | 'hi' | 'hinglish';
  translatedText: string;
  summary: string;
  category: ComplaintCategory;
  urgency: UrgencyLevel;
  urgencyScore: number;
  urgencyReason: string;
  isSafetyRisk: boolean;
  confidence: number; // 0.0 to 1.0 confidence score
  location: string;
  duplicateOfId: string | null;
  duplicateConfidence: number;
  suggestedAssigneeRole: 'plumber' | 'electrician' | 'housekeeping' | 'security' | 'committee';
  suggestedAction: string;
  isSample?: boolean;
}
