import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/dataStore';
import { archiveOldResolvedComplaints, deleteOldResolvedComplaints } from '@/lib/data/complaints';
import { connectDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'societypulse-cron-secret-key-1234';

    if (authHeader !== `Bearer ${cronSecret}` && req.headers.get('x-cron-secret') !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid cron secret' }, { status: 401 });
    }

    await connectDB();
    const settings = await getSettings();

    // 1. Auto-archive resolved complaints older than N days (default 30)
    const archiveDays =
      Number(process.env.RESOLVED_ARCHIVE_DAYS) || settings.resolvedArchiveDays || 30;
    const archivedCount = await archiveOldResolvedComplaints(archiveDays);

    // 2. Optional permanent deletion if RESOLVED_DELETE_AFTER_DAYS is configured
    let deletedCount = 0;
    let attachmentCount = 0;
    const deleteDays =
      Number(process.env.RESOLVED_DELETE_AFTER_DAYS) || settings.resolvedDeleteAfterDays;

    if (deleteDays && deleteDays > 0) {
      const deleteRes = await deleteOldResolvedComplaints(deleteDays, {
        name: 'System Cron (Data Lifecycle)',
        role: 'admin',
      });
      deletedCount = deleteRes.deletedCount;
      attachmentCount = deleteRes.attachmentCount;
    }

    return NextResponse.json({
      success: true,
      archivedCount,
      archiveDays,
      deletedCount,
      attachmentCount,
      deleteDays: deleteDays || 'disabled',
    });
  } catch (err) {
    console.error('Cron cleanup error:', err);
    return NextResponse.json({ error: 'Failed to run data cleanup cron' }, { status: 500 });
  }
}
