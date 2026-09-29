import { connectDB } from '@/lib/db';
import ComplaintModel from '@/models/Complaint';
import AttachmentModel from '@/models/Attachment';
import AuditLogModel from '@/models/AuditLog';
import { IComplaint, ComplaintStatus, UserRole } from '@/types';

export const ACTIVE_STATUSES: ComplaintStatus[] = [
  'new',
  'triaged',
  'assigned',
  'in_progress',
  'reopened',
];

export const RESOLVED_STATUSES: ComplaintStatus[] = ['resolved', 'rejected'];

/**
 * Shared MongoDB query filter for Active complaints
 * Excludes resolved, rejected, and archived complaints
 */
export function activeFilter(additional: Record<string, any> = {}): Record<string, any> {
  return {
    status: { $in: ACTIVE_STATUSES },
    archivedAt: null,
    ...additional,
  };
}

/**
 * Shared MongoDB query filter for Resolved complaints
 */
export function resolvedFilter(
  includeArchived: boolean = false,
  additional: Record<string, any> = {}
): Record<string, any> {
  return {
    status: { $in: RESOLVED_STATUSES },
    ...(includeArchived ? {} : { archivedAt: null }),
    ...additional,
  };
}

export interface ComplaintQueryFilters {
  status?: string;
  category?: string;
  urgency?: string;
  wing?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

/**
 * Fetch active complaints only (Queue, Kanban, Map, Digest)
 */
export async function getActiveComplaints(
  filters: ComplaintQueryFilters = {}
): Promise<IComplaint[]> {
  await connectDB();

  const query: Record<string, any> = activeFilter();

  if (filters.status && filters.status !== 'all' && (ACTIVE_STATUSES as string[]).includes(filters.status)) {
    query.status = filters.status;
  }
  if (filters.category && filters.category !== 'all') {
    query.category = filters.category;
  }
  if (filters.urgency && filters.urgency !== 'all') {
    query.urgency = filters.urgency;
  }
  if (filters.wing && filters.wing !== 'all') {
    query.wing = filters.wing;
  }
  if (filters.search && filters.search.trim()) {
    const s = filters.search.trim();
    query.$or = [
      { complaintId: { $regex: s, $options: 'i' } },
      { summary: { $regex: s, $options: 'i' } },
      { originalText: { $regex: s, $options: 'i' } },
      { flatNumber: { $regex: s, $options: 'i' } },
      { residentName: { $regex: s, $options: 'i' } },
    ];
  }

  const docs = await ComplaintModel.find(query)
    .sort({ urgencyScore: -1, createdAt: -1 })
    .lean();

  return docs as unknown as IComplaint[];
}

/**
 * Fetch resolved and rejected complaints (Resolved Tab)
 */
export async function getResolvedComplaints(
  filters: ComplaintQueryFilters = {},
  includeArchived: boolean = false
): Promise<IComplaint[]> {
  await connectDB();

  const query: Record<string, any> = resolvedFilter(includeArchived);

  if (filters.status && filters.status !== 'all' && (RESOLVED_STATUSES as string[]).includes(filters.status)) {
    query.status = filters.status;
  }
  if (filters.category && filters.category !== 'all') {
    query.category = filters.category;
  }
  if (filters.wing && filters.wing !== 'all') {
    query.wing = filters.wing;
  }
  if (filters.fromDate || filters.toDate) {
    const dateQuery: Record<string, any> = {};
    if (filters.fromDate) dateQuery.$gte = new Date(filters.fromDate);
    if (filters.toDate) {
      const end = new Date(filters.toDate);
      end.setHours(23, 59, 59, 999);
      dateQuery.$lte = end;
    }
    query.resolvedAt = dateQuery;
  }
  if (filters.search && filters.search.trim()) {
    const s = filters.search.trim();
    query.$or = [
      { complaintId: { $regex: s, $options: 'i' } },
      { summary: { $regex: s, $options: 'i' } },
      { originalText: { $regex: s, $options: 'i' } },
      { flatNumber: { $regex: s, $options: 'i' } },
      { residentName: { $regex: s, $options: 'i' } },
    ];
  }

  const docs = await ComplaintModel.find(query)
    .sort({ resolvedAt: -1, updatedAt: -1 })
    .lean();

  return docs as unknown as IComplaint[];
}

/**
 * Mark complaint resolved and cascade resolution to linked duplicate reports
 */
export async function resolveComplaint(
  complaintId: string,
  actorName: string = 'Committee Admin',
  actorRoleOrNote?: UserRole | string,
  note?: string
) {
  await connectDB();
  const now = new Date();

  let actorRole: UserRole = 'admin';
  let resolvedNote = note;

  if (actorRoleOrNote) {
    if (actorRoleOrNote === 'admin' || actorRoleOrNote === 'member' || actorRoleOrNote === 'demo') {
      actorRole = actorRoleOrNote;
    } else {
      resolvedNote = actorRoleOrNote;
    }
  }

  // 1. Resolve primary complaint
  const complaint = await ComplaintModel.findOneAndUpdate(
    { complaintId },
    {
      $set: {
        status: 'resolved',
        resolvedAt: now,
      },
      $push: {
        timeline: {
          status: 'resolved',
          note: resolvedNote || `Marked as resolved by ${actorName} (${actorRole})`,
          by: actorName,
          at: now,
        },
      },
    },
    { returnDocument: 'after' }
  ).lean();

  if (!complaint) return null;

  // 2. Cascade resolve to linked duplicates (Requirement 4)
  const duplicatesResult = await ComplaintModel.updateMany(
    {
      duplicateOf: complaintId,
      status: { $in: ACTIVE_STATUSES },
    },
    {
      $set: {
        status: 'resolved',
        resolvedAt: now,
      },
      $push: {
        timeline: {
          status: 'resolved',
          note: `Auto-resolved: Parent ticket ${complaintId} was resolved by committee (${actorName}).`,
          by: 'AI Auto-Sync',
          at: now,
        },
      },
    }
  );

  return {
    complaint: complaint as unknown as IComplaint,
    resolvedDuplicatesCount: duplicatesResult.modifiedCount,
  };
}

/**
 * Reopen a resolved complaint and return it to active triage
 */
export async function reopenComplaint(
  complaintId: string,
  actorName: string = 'Committee Member',
  actorRoleOrNote?: UserRole | string,
  note?: string
) {
  await connectDB();
  const now = new Date();

  let actorRole: UserRole = 'member';
  let reopenNote = note;

  if (actorRoleOrNote) {
    if (actorRoleOrNote === 'admin' || actorRoleOrNote === 'member' || actorRoleOrNote === 'demo') {
      actorRole = actorRoleOrNote;
    } else {
      reopenNote = actorRoleOrNote;
    }
  }

  const complaint = await ComplaintModel.findOneAndUpdate(
    { complaintId },
    {
      $set: {
        status: 'reopened',
        resolvedAt: null,
        archivedAt: null,
      },
      $inc: {
        reopenedCount: 1,
      },
      $push: {
        timeline: {
          status: 'reopened',
          note: reopenNote || `Complaint reopened by ${actorName} (${actorRole})`,
          by: actorName,
          at: now,
        },
      },
    },
    { returnDocument: 'after' }
  ).lean();

  return complaint as unknown as IComplaint | null;
}

/**
 * Delete complaints and permanently clean up all linked attachments without orphans
 */
export async function deleteComplaintsWithAttachments(
  filter: Record<string, any>,
  actor: { name: string; role: UserRole },
  reason: string,
  targetType: 'complaint' | 'attachment' | 'demo' | 'batch' = 'complaint'
) {
  await connectDB();

  // 1. Identify all matching complaints
  const complaintsToDelete = await ComplaintModel.find(filter).select('_id complaintId attachmentId').lean();
  if (complaintsToDelete.length === 0) {
    return { deletedCount: 0, attachmentCount: 0 };
  }

  // 2. Collect attachment IDs
  const attachmentIds = complaintsToDelete
    .map((c) => c.attachmentId)
    .filter((id): id is string => Boolean(id && typeof id === 'string' && id.trim().length > 0));

  let attachmentCount = 0;
  if (attachmentIds.length > 0) {
    const attachRes = await AttachmentModel.deleteMany({
      _id: { $in: attachmentIds },
    });
    attachmentCount = attachRes.deletedCount;
  }

  // 3. Delete complaints
  const deleteRes = await ComplaintModel.deleteMany(filter);
  const deletedCount = deleteRes.deletedCount;

  // 4. Log in Audit Log
  await AuditLogModel.create({
    action: 'delete_records',
    actorName: actor.name,
    actorRole: actor.role,
    details: `${reason}. Cleaned up ${deletedCount} complaint(s) and ${attachmentCount} linked attachment(s).`,
    count: deletedCount,
    targetType,
  });

  return { deletedCount, attachmentCount };
}

/**
 * Auto-archive resolved complaints older than N days
 */
export async function archiveOldResolvedComplaints(days: number = 30) {
  await connectDB();
  const cutOff = new Date();
  cutOff.setDate(cutOff.getDate() - days);

  const res = await ComplaintModel.updateMany(
    {
      status: { $in: RESOLVED_STATUSES },
      archivedAt: null,
      resolvedAt: { $lte: cutOff },
    },
    {
      $set: { archivedAt: new Date() },
    }
  );

  return res.modifiedCount;
}

/**
 * Permanently delete resolved complaints older than N days and their attachments
 */
export async function deleteOldResolvedComplaints(
  days: number,
  actor: { name: string; role: UserRole }
) {
  await connectDB();
  const cutOff = new Date();
  cutOff.setDate(cutOff.getDate() - days);

  const filter = {
    status: { $in: RESOLVED_STATUSES },
    resolvedAt: { $lte: cutOff },
  };

  return deleteComplaintsWithAttachments(
    filter,
    actor,
    `Permanent deletion of resolved complaints older than ${days} days`,
    'complaint'
  );
}
