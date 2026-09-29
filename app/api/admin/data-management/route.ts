import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { connectDB } from '@/lib/db';
import ComplaintModel from '@/models/Complaint';
import AuditLogModel from '@/models/AuditLog';
import { deleteComplaintsWithAttachments, RESOLVED_STATUSES } from '@/lib/data/complaints';
import { runDatabaseSeed } from '@/lib/seedData';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

function verifyOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (!origin || !host) return true; // allow same-host CLI or internal calls
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

// 1. GET: Preview counts for confirmation modals & recent audit logs
export async function GET(req: NextRequest) {
  try {
    const auth = requireRole(req, ['admin']);
    if (!auth.authorized || !auth.session) {
      return auth.response!;
    }

    await connectDB();

    const now = new Date();
    const cutOff30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalComplaints,
      demoComplaints,
      resolvedComplaints,
      resolvedOlderThan30,
      archivedComplaints,
      batches,
      recentAuditLogs,
    ] = await Promise.all([
      ComplaintModel.countDocuments(),
      ComplaintModel.countDocuments({ isDemo: true }),
      ComplaintModel.countDocuments({ status: { $in: RESOLVED_STATUSES } }),
      ComplaintModel.countDocuments({
        status: { $in: RESOLVED_STATUSES },
        resolvedAt: { $lte: cutOff30 },
      }),
      ComplaintModel.countDocuments({ archivedAt: { $ne: null } }),
      ComplaintModel.aggregate([
        { $match: { importBatchId: { $ne: null } } },
        { $group: { _id: '$importBatchId', count: { $sum: 1 }, createdAt: { $first: '$createdAt' } } },
        { $sort: { createdAt: -1 } },
      ]),
      AuditLogModel.find().sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    return NextResponse.json({
      success: true,
      counts: {
        totalComplaints,
        demoComplaints,
        resolvedComplaints,
        resolvedOlderThan30,
        archivedComplaints,
      },
      importBatches: batches.map((b) => ({ batchId: b._id, count: b.count, createdAt: b.createdAt })),
      recentAuditLogs,
    });
  } catch (err) {
    console.error('Data management preview error:', err);
    return NextResponse.json({ error: 'Failed to retrieve data preview' }, { status: 500 });
  }
}

const actionSchema = z.object({
  action: z.enum([
    'delete_single',
    'delete_resolved_older',
    'delete_demo',
    'reset_demo',
    'delete_batch',
  ]),
  complaintId: z.string().optional(),
  days: z.number().int().min(1).optional(),
  batchId: z.string().optional(),
});

// 2. POST: Execute authenticated admin data deletion / reset
export async function POST(req: NextRequest) {
  try {
    // A. Role check (Admin only, demo strictly rejected with 403)
    const auth = requireRole(req, ['admin']);
    if (!auth.authorized || !auth.session) {
      return auth.response!;
    }

    // B. Rate limit check (10 requests per minute)
    const ip = getClientIp(req);
    const rl = checkRateLimit('admin-cleanup', ip, 10, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute before running data operations.' },
        { status: 429 }
      );
    }

    // C. Origin check (CSRF defense)
    if (!verifyOrigin(req)) {
      return NextResponse.json({ error: 'Forbidden: Invalid request origin' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid cleanup request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    await connectDB();
    const { action, complaintId, days, batchId } = parsed.data;
    const actor = { name: auth.session.name, role: auth.session.role };

    let deletedCount = 0;
    let attachmentCount = 0;
    let message = '';

    switch (action) {
      case 'delete_single': {
        if (!complaintId || complaintId.trim() === '') {
          return NextResponse.json({ error: 'complaintId is required to delete single ticket' }, { status: 400 });
        }
        const res = await deleteComplaintsWithAttachments(
          { complaintId: complaintId.trim() },
          actor,
          `Admin deletion of single complaint ${complaintId.trim()}`,
          'complaint'
        );
        deletedCount = res.deletedCount;
        attachmentCount = res.attachmentCount;
        message = `Successfully deleted ticket ${complaintId} and ${attachmentCount} linked attachment(s).`;
        break;
      }

      case 'delete_resolved_older': {
        const thresholdDays = days || 30;
        const cutOff = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);
        const res = await deleteComplaintsWithAttachments(
          {
            status: { $in: RESOLVED_STATUSES },
            resolvedAt: { $lte: cutOff },
          },
          actor,
          `Admin deletion of resolved tickets older than ${thresholdDays} days`,
          'complaint'
        );
        deletedCount = res.deletedCount;
        attachmentCount = res.attachmentCount;
        message = `Successfully purged ${deletedCount} resolved tickets older than ${thresholdDays} days and ${attachmentCount} attachment(s).`;
        break;
      }

      case 'delete_demo': {
        const res = await deleteComplaintsWithAttachments(
          { isDemo: true },
          actor,
          'Admin purged all demo and seed records',
          'demo'
        );
        deletedCount = res.deletedCount;
        attachmentCount = res.attachmentCount;
        message = `Successfully purged ${deletedCount} demo records and ${attachmentCount} attachment(s).`;
        break;
      }

      case 'reset_demo': {
        // Delete all demo data, then re-seed
        const deleteRes = await deleteComplaintsWithAttachments(
          { isDemo: true },
          actor,
          'Admin reset demo data',
          'demo'
        );
        await runDatabaseSeed();
        deletedCount = deleteRes.deletedCount;
        attachmentCount = deleteRes.attachmentCount;
        message = `Successfully purged ${deletedCount} demo records and re-seeded fresh ~30 realistic complaints.`;
        break;
      }

      case 'delete_batch': {
        if (!batchId || batchId.trim() === '') {
          return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
        }
        const res = await deleteComplaintsWithAttachments(
          { importBatchId: batchId.trim() },
          actor,
          `Admin deletion of import batch ${batchId.trim()}`,
          'batch'
        );
        deletedCount = res.deletedCount;
        attachmentCount = res.attachmentCount;
        message = `Successfully removed batch ${batchId} (${deletedCount} tickets, ${attachmentCount} attachments).`;
        break;
      }
    }

    try {
      revalidatePath('/dashboard');
      revalidatePath('/');
      revalidatePath('/admin');
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      action,
      message,
      deletedCount,
      attachmentCount,
    });
  } catch (err) {
    console.error('Data cleanup execution error:', err);
    return NextResponse.json({ error: 'Failed to execute data cleanup operation' }, { status: 500 });
  }
}
