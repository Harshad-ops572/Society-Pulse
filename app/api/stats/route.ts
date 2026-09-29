import { NextResponse } from 'next/server';
import { getSocietyStats } from '@/lib/dataStore';

export async function GET() {
  try {
    const stats = await getSocietyStats();
    return NextResponse.json({ success: true, stats });
  } catch (err) {
    console.error('Stats error:', err);
    return NextResponse.json({ error: 'Failed to retrieve stats' }, { status: 500 });
  }
}
