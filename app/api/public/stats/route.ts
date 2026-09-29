import { NextResponse } from 'next/server';
import { getAllComplaints, getSettings } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [complaints, settings] = await Promise.all([
      getAllComplaints(),
      getSettings(),
    ]);

    // 1. Unresolved complaints
    const unresolved = complaints.filter(
      (c) => c.status !== 'resolved' && c.status !== 'rejected'
    );
    const activeIssues = unresolved.length;

    // 2. Counts by category over unresolved complaints
    const validCategories = [
      'water',
      'lift',
      'parking',
      'noise',
      'cleaning',
      'electrical',
      'security',
      'other',
    ] as const;

    const countsByCategory: Record<string, number> = {
      water: 0,
      lift: 0,
      parking: 0,
      noise: 0,
      cleaning: 0,
      electrical: 0,
      security: 0,
      other: 0,
    };

    for (const c of unresolved) {
      const cat = c.category && (validCategories as readonly string[]).includes(c.category)
        ? c.category
        : 'other';
      countsByCategory[cat] = (countsByCategory[cat] || 0) + 1;
    }

    // 3. Resolved this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const resolvedComplaints = complaints.filter((c) => c.status === 'resolved');
    const resolvedThisMonthComplaints = resolvedComplaints.filter((c) => {
      const rDate = c.resolvedAt ? new Date(c.resolvedAt) : new Date(c.updatedAt);
      return rDate >= startOfMonth;
    });
    const resolvedThisMonth = resolvedThisMonthComplaints.length;

    // 4. Average resolution time (hours)
    let totalHours = 0;
    let countWithDuration = 0;
    for (const c of resolvedComplaints) {
      if (c.resolvedAt && c.createdAt) {
        const diffMs = new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime();
        const hrs = diffMs / (1000 * 60 * 60);
        if (hrs > 0) {
          totalHours += hrs;
          countWithDuration++;
        }
      }
    }
    const avgResolutionHours =
      countWithDuration > 0 ? Math.round(totalHours / countWithDuration) : null;

    // 5. Satisfaction percentage (strictly computed from real ratings)
    let ratingsCount = 0;
    let positiveRatings = 0;
    for (const c of complaints) {
      if (typeof c.satisfactionRating === 'number' && c.satisfactionRating > 0) {
        ratingsCount++;
        if (c.satisfactionRating >= 4) positiveRatings++;
      } else if (c.residentConfirmed !== null && c.residentConfirmed !== undefined) {
        ratingsCount++;
        if (c.residentConfirmed === true) positiveRatings++;
      }
    }
    const satisfactionPercent =
      ratingsCount > 0 ? Math.round((positiveRatings / ratingsCount) * 100) : null;

    // 6. Demo data flag: true if all present records are flagged isDemo
    const isDemoData =
      complaints.length > 0 && complaints.every((c) => c.isDemo === true);

    // 7. Helpline numbers
    const helpline =
      settings?.helpline && settings.helpline.length > 0
        ? settings.helpline
        : [
            { name: 'Security Main Gate', role: 'Security Desk', phone: '+91 00000 00000' },
            { name: 'Lift AMC Supervisor', role: 'Emergency Escalation', phone: '+91 00000 00000' },
            { name: 'Electrician Desk', role: 'Electrical Services', phone: '+91 00000 00000' },
          ];

    return NextResponse.json(
      {
        success: true,
        activeIssues,
        resolvedThisMonth,
        avgResolutionHours,
        satisfactionPercent,
        countsByCategory,
        isDemoData,
        helpline,
        totalComplaints: complaints.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (err) {
    console.error('Public stats error:', err);
    return NextResponse.json(
      { error: 'Failed to compute public statistics' },
      { status: 500 }
    );
  }
}
