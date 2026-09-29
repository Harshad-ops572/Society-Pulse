import { NextRequest, NextResponse } from 'next/server';
import { getAllComplaints, saveDigest } from '@/lib/dataStore';
import { generateDailyDigest } from '@/lib/ai';

export async function GET(req: NextRequest) {
  return handleDigestCron(req);
}

export async function POST(req: NextRequest) {
  return handleDigestCron(req);
}

async function handleDigestCron(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const secret =
      req.nextUrl.searchParams.get('secret') ||
      (authHeader && authHeader.replace('Bearer ', ''));

    const expectedSecret = process.env.CRON_SECRET || 'local-cron-secret-123';
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
    }

    const complaints = await getAllComplaints({ status: 'all' });
    const openComplaints = complaints.filter(
      (c) => c.status !== 'resolved' && c.status !== 'rejected'
    );

    const generated = await generateDailyDigest(openComplaints);
    const today = new Date().toISOString().split('T')[0];

    const saved = await saveDigest({
      ...generated,
      date: today,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Daily 8 AM IST Digest generated successfully',
      digest: saved,
    });
  } catch (err) {
    console.error('Digest Cron error:', err);
    return NextResponse.json({ error: 'Failed to run digest cron' }, { status: 500 });
  }
}
