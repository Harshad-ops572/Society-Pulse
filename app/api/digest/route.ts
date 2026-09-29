import { NextResponse } from 'next/server';
import { getLatestDigest, saveDigest } from '@/lib/dataStore';
import { getActiveComplaints, ACTIVE_STATUSES } from '@/lib/data/complaints';
import { generateDailyDigest } from '@/lib/ai';
import ComplaintModel from '@/models/Complaint';
import { connectDB } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();
    const today = new Date().toISOString().split('T')[0];
    let digest = await getLatestDigest(today);

    if (!digest) {
      // Auto-generate fresh digest strictly from active complaints
      const openComplaints = await getActiveComplaints();
      const generated = await generateDailyDigest(openComplaints);
      digest = await saveDigest({
        ...generated,
        date: today,
        createdAt: new Date().toISOString(),
      });
    } else {
      // Filter out any rows whose complaint was subsequently marked resolved or rejected
      const activeDocs = await ComplaintModel.find({
        status: { $in: ACTIVE_STATUSES },
        archivedAt: null,
      })
        .select('complaintId')
        .lean();

      const activeIds = new Set(activeDocs.map((c) => c.complaintId));

      digest = {
        ...digest,
        rows: digest.rows.filter((r) => activeIds.has(r.complaintId)),
      };
    }

    return NextResponse.json({ success: true, digest });
  } catch (err) {
    console.error('Digest API error:', err);
    return NextResponse.json({ error: 'Failed to retrieve daily digest' }, { status: 500 });
  }
}
