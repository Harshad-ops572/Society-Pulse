import { NextResponse } from 'next/server';
import { getAllComplaints, getLatestDigest, saveDigest } from '@/lib/dataStore';
import { generateDailyDigest } from '@/lib/ai';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    let digest = await getLatestDigest(today);

    if (!digest) {
      // Auto-generate fresh digest from open complaints
      const complaints = await getAllComplaints({ status: 'all' });
      const openComplaints = complaints.filter(
        (c) => c.status !== 'resolved' && c.status !== 'rejected'
      );
      const generated = await generateDailyDigest(openComplaints);
      digest = await saveDigest({
        ...generated,
        date: today,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, digest });
  } catch (err) {
    console.error('Digest API error:', err);
    return NextResponse.json({ error: 'Failed to retrieve daily digest' }, { status: 500 });
  }
}
