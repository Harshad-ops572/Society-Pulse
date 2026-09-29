import { NextRequest, NextResponse } from 'next/server';
import { runDatabaseSeed } from '@/lib/seedData';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
    }

    const result = await runDatabaseSeed();
    return NextResponse.json({
      success: true,
      message: 'Automated daily demo data reset completed',
      result,
    });
  } catch (err) {
    console.error('Daily cron reset demo error:', err);
    return NextResponse.json({ error: 'Daily cron reset failed' }, { status: 500 });
  }
}
