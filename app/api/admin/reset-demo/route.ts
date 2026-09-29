import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { runDatabaseSeed } from '@/lib/seedData';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Only administrators can reset demo data.' },
        { status: 403 }
      );
    }

    const result = await runDatabaseSeed();
    return NextResponse.json({
      success: true,
      message: `Demo data re-seeded with ${result.complaintCount} fresh realistic records.`,
      result,
    });
  } catch (err) {
    console.error('Reset demo error:', err);
    return NextResponse.json(
      { error: 'Failed to reset demo data' },
      { status: 500 }
    );
  }
}
