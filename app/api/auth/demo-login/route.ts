import { NextResponse } from 'next/server';
import { signToken, setAuthCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Demo login must only work when DEMO_MODE=true
    const isDemoEnabled = process.env.DEMO_MODE === 'true';

    if (!isDemoEnabled) {
      return NextResponse.json(
        {
          error:
            'One-click demo login is disabled. To enable it, set DEMO_MODE=true in environment variables.',
        },
        { status: 403 }
      );
    }

    const payload = {
      userId: 'demo-judge-id',
      name: 'Judge (Demo Committee)',
      email: 'demo@societypulse.app',
      role: 'demo' as const,
    };

    const token = signToken(payload);
    const response = NextResponse.json({
      success: true,
      user: {
        name: payload.name,
        email: payload.email,
        role: payload.role,
      },
    });

    setAuthCookie(response, token);
    return response;
  } catch (err) {
    console.error('Demo login error:', err);
    return NextResponse.json({ error: 'Failed to authenticate demo role' }, { status: 500 });
  }
}
