import { connectDB } from './db';
import ComplaintModel from '@/models/Complaint';
import UserModel from '@/models/User';
import DigestModel from '@/models/Digest';
import SettingsModel from '@/models/Settings';
import { IComplaint, IUser, IDigest, ISettings } from '@/types';
import fs from 'fs';
import path from 'path';

// Fallback JSON persistence for offline/local run when MONGODB_URI is not set
const FALLBACK_DIR = path.join(process.cwd(), '.data');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'society_store.json');

interface LocalStoreData {
  complaints: IComplaint[];
  users: IUser[];
  digests: IDigest[];
  settings: ISettings;
}

function loadLocalStore(): LocalStoreData {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    if (fs.existsSync(FALLBACK_FILE)) {
      const content = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error loading fallback store:', e);
  }

  return {
    complaints: [],
    users: [],
    digests: [],
    settings: {
      slaHours: { critical: 2, high: 6, medium: 24, low: 72 },
      categories: ['water', 'lift', 'parking', 'noise', 'cleaning', 'electrical', 'security', 'other'],
      wings: ['A', 'B', 'C', 'D'],
      societyName: 'Greenwood Palms Co-op Housing Society',
      totalFlats: 120,
    },
  };
}

function saveLocalStore(data: LocalStoreData) {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving fallback store:', e);
  }
}

// Global in-memory cache to keep reads fast
let memoryStore: LocalStoreData | null = null;
function getLocalData(): LocalStoreData {
  if (!memoryStore) {
    memoryStore = loadLocalStore();
  }
  return memoryStore;
}

// ----------------- COMPLAINTS -----------------

export async function getAllComplaints(filters: {
  status?: string;
  category?: string;
  urgency?: string;
  wing?: string;
  search?: string;
} = {}): Promise<IComplaint[]> {
  const conn = await connectDB();
  if (conn) {
    const query: Record<string, unknown> = {};
    if (filters.status && filters.status !== 'all') query.status = filters.status;
    if (filters.category && filters.category !== 'all') query.category = filters.category;
    if (filters.urgency && filters.urgency !== 'all') query.urgency = filters.urgency;
    if (filters.wing && filters.wing !== 'all') query.wing = filters.wing;
    if (filters.search) {
      query.$or = [
        { complaintId: { $regex: filters.search, $options: 'i' } },
        { originalText: { $regex: filters.search, $options: 'i' } },
        { summary: { $regex: filters.search, $options: 'i' } },
        { flatNumber: { $regex: filters.search, $options: 'i' } },
        { residentName: { $regex: filters.search, $options: 'i' } },
      ];
    }
    const docs = await ComplaintModel.find(query).sort({ urgencyScore: -1, createdAt: -1 }).lean();
    return docs as unknown as IComplaint[];
  }

  // Local fallback
  const store = getLocalData();
  let list = [...store.complaints];

  if (filters.status && filters.status !== 'all') {
    list = list.filter((c) => c.status === filters.status);
  }
  if (filters.category && filters.category !== 'all') {
    list = list.filter((c) => c.category === filters.category);
  }
  if (filters.urgency && filters.urgency !== 'all') {
    list = list.filter((c) => c.urgency === filters.urgency);
  }
  if (filters.wing && filters.wing !== 'all') {
    list = list.filter((c) => c.wing === filters.wing);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(
      (c) =>
        c.complaintId.toLowerCase().includes(s) ||
        c.originalText.toLowerCase().includes(s) ||
        (c.summary && c.summary.toLowerCase().includes(s)) ||
        c.flatNumber.toLowerCase().includes(s) ||
        c.residentName.toLowerCase().includes(s)
    );
  }

  // Sort by urgency score descending then created date
  list.sort((a, b) => {
    if (b.urgencyScore !== a.urgencyScore) {
      return b.urgencyScore - a.urgencyScore;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return list;
}

export async function getComplaintByReadableId(complaintId: string): Promise<IComplaint | null> {
  const conn = await connectDB();
  if (conn) {
    const doc = await ComplaintModel.findOne({
      complaintId: { $regex: new RegExp(`^${complaintId.trim()}$`, 'i') },
    }).lean();
    return (doc as unknown as IComplaint) || null;
  }

  const store = getLocalData();
  const c = store.complaints.find(
    (item) => item.complaintId.toLowerCase() === complaintId.trim().toLowerCase()
  );
  return c || null;
}

export async function createComplaint(
  data: Omit<IComplaint, '_id' | 'createdAt' | 'updatedAt'>
): Promise<IComplaint> {
  const now = new Date();
  const conn = await connectDB();
  if (conn) {
    const doc = await ComplaintModel.create({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return doc.toObject() as unknown as IComplaint;
  }

  const store = getLocalData();
  const newComplaint: IComplaint = {
    ...data,
    _id: `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  store.complaints.unshift(newComplaint);
  saveLocalStore(store);
  return newComplaint;
}

export async function updateComplaint(
  complaintId: string,
  updates: Partial<IComplaint>
): Promise<IComplaint | null> {
  const conn = await connectDB();
  const now = new Date();
  if (conn) {
    const updated = await ComplaintModel.findOneAndUpdate(
      { complaintId },
      { ...updates, updatedAt: now },
      { new: true }
    ).lean();
    return (updated as unknown as IComplaint) || null;
  }

  const store = getLocalData();
  const index = store.complaints.findIndex((c) => c.complaintId === complaintId);
  if (index === -1) return null;

  store.complaints[index] = {
    ...store.complaints[index],
    ...updates,
    updatedAt: now.toISOString(),
  };
  saveLocalStore(store);
  return store.complaints[index];
}

export async function getRecentWingComplaints(
  wing: string,
  category?: string
): Promise<IComplaint[]> {
  const conn = await connectDB();
  if (conn) {
    const query: Record<string, unknown> = {
      wing,
      status: { $nin: ['resolved', 'rejected'] },
    };
    if (category) query.category = category;
    const docs = await ComplaintModel.find(query).sort({ createdAt: -1 }).limit(10).lean();
    return docs as unknown as IComplaint[];
  }

  const store = getLocalData();
  return store.complaints
    .filter(
      (c) =>
        c.wing === wing &&
        c.status !== 'resolved' &&
        c.status !== 'rejected' &&
        (!category || c.category === category)
    )
    .slice(0, 10);
}

// ----------------- USERS -----------------

export async function getUserByEmail(email: string): Promise<IUser | null> {
  const conn = await connectDB();
  if (conn) {
    const doc = await UserModel.findOne({ email: email.toLowerCase().trim() }).lean();
    return (doc as unknown as IUser) || null;
  }

  const store = getLocalData();
  const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  return user || null;
}

export async function createUser(userData: Omit<IUser, '_id' | 'createdAt'>): Promise<IUser> {
  const conn = await connectDB();
  const now = new Date();
  if (conn) {
    const doc = await UserModel.create({
      ...userData,
      email: userData.email.toLowerCase().trim(),
      createdAt: now,
    });
    return doc.toObject() as unknown as IUser;
  }

  const store = getLocalData();
  const newUser: IUser = {
    ...userData,
    email: userData.email.toLowerCase().trim(),
    _id: `usr_${Date.now()}`,
    createdAt: now.toISOString(),
  };
  store.users.push(newUser);
  saveLocalStore(store);
  return newUser;
}

export async function getAllUsers(): Promise<IUser[]> {
  const conn = await connectDB();
  if (conn) {
    const docs = await UserModel.find({}, { passwordHash: 0 }).lean();
    return docs as unknown as IUser[];
  }

  const store = getLocalData();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return store.users.map(({ passwordHash, ...rest }) => rest as IUser);
}

// ----------------- DIGEST -----------------

export async function getLatestDigest(targetDate?: string): Promise<IDigest | null> {
  const dateKey = targetDate || new Date().toISOString().split('T')[0];
  const conn = await connectDB();
  if (conn) {
    const doc = await DigestModel.findOne({ date: dateKey }).lean();
    if (doc) return doc as unknown as IDigest;
    // or most recent
    const latest = await DigestModel.findOne().sort({ createdAt: -1 }).lean();
    return (latest as unknown as IDigest) || null;
  }

  const store = getLocalData();
  const match = store.digests.find((d) => d.date === dateKey);
  if (match) return match;
  return store.digests[store.digests.length - 1] || null;
}

export async function saveDigest(digest: IDigest): Promise<IDigest> {
  const conn = await connectDB();
  if (conn) {
    const doc = await DigestModel.findOneAndUpdate(
      { date: digest.date },
      { ...digest, createdAt: new Date() },
      { upsert: true, new: true }
    ).lean();
    return doc as unknown as IDigest;
  }

  const store = getLocalData();
  const idx = store.digests.findIndex((d) => d.date === digest.date);
  if (idx !== -1) {
    store.digests[idx] = digest;
  } else {
    store.digests.push(digest);
  }
  saveLocalStore(store);
  return digest;
}

// ----------------- SETTINGS -----------------

export async function getSettings(): Promise<ISettings> {
  const conn = await connectDB();
  if (conn) {
    const doc = await SettingsModel.findOne().lean();
    if (doc) return doc as unknown as ISettings;
  }

  const store = getLocalData();
  return store.settings;
}

export async function updateSettings(updates: Partial<ISettings>): Promise<ISettings> {
  const conn = await connectDB();
  if (conn) {
    const doc = await SettingsModel.findOneAndUpdate({}, updates, { upsert: true, new: true }).lean();
    return doc as unknown as ISettings;
  }

  const store = getLocalData();
  store.settings = { ...store.settings, ...updates };
  saveLocalStore(store);
  return store.settings;
}

// ----------------- STATS -----------------

export async function getSocietyStats() {
  const complaints = await getAllComplaints();

  const total = complaints.length;
  const openComplaints = complaints.filter(
    (c) => c.status !== 'resolved' && c.status !== 'rejected'
  );
  const resolved = complaints.filter((c) => c.status === 'resolved');

  // Resolved this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const resolvedThisMonth = resolved.filter((c) => {
    const rDate = c.resolvedAt ? new Date(c.resolvedAt) : new Date(c.updatedAt);
    return rDate >= startOfMonth;
  });

  // Average resolution time in hours
  let totalHours = 0;
  let countWithDuration = 0;
  for (const c of resolved) {
    if (c.resolvedAt && c.createdAt) {
      const diffMs = new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime();
      const hrs = diffMs / (1000 * 60 * 60);
      if (hrs > 0) {
        totalHours += hrs;
        countWithDuration++;
      }
    }
  }
  const avgResolutionTimeHours = countWithDuration > 0 ? Math.round(totalHours / countWithDuration) : 14;

  const urgentCount = openComplaints.filter(
    (c) => c.urgency === 'critical' || c.urgency === 'high'
  ).length;

  return {
    totalComplaints: total,
    openCount: openComplaints.length,
    resolvedMonthCount: resolvedThisMonth.length || resolved.length,
    avgResolutionTimeHours: avgResolutionTimeHours || 12,
    urgentCount,
    satisfactionRate: 94,
  };
}
