import { NextRequest, NextResponse } from 'next/server';
import { getAllComplaints, updateComplaint } from '@/lib/dataStore';
import { TimelineEvent, UrgencyLevel } from '@/types';

export async function GET(req: NextRequest) {
  return handleEscalateCron(req);
}

export async function POST(req: NextRequest) {
  return handleEscalateCron(req);
}

async function handleEscalateCron(req: NextRequest) {
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
    const now = Date.now();
    const escalatedList = [];

    for (const c of complaints) {
      if (c.status === 'resolved' || c.status === 'rejected') continue;
      if (!c.slaDueAt) continue;

      const due = new Date(c.slaDueAt).getTime();
      if (due < now) {
        // SLA Breached! Check if needs escalation
        let newUrgency: UrgencyLevel = c.urgency;
        let newScore = c.urgencyScore;

        if (c.urgency === 'low') {
          newUrgency = 'medium';
          newScore = Math.max(c.urgencyScore, 55);
        } else if (c.urgency === 'medium') {
          newUrgency = 'high';
          newScore = Math.max(c.urgencyScore, 80);
        } else if (c.urgency === 'high') {
          newUrgency = 'critical';
          newScore = Math.max(c.urgencyScore, 95);
        }

        const hoursOverdue = Math.round((now - due) / (1000 * 60 * 60));
        const timeline: TimelineEvent[] = [...(c.timeline || [])];
        timeline.push({
          status: c.status,
          note: `⚠️ SLA breached by ${hoursOverdue} hours. Urgency escalated automatically to ${newUrgency.toUpperCase()} (Score: ${newScore}).`,
          by: 'System SLA Escalation Engine',
          at: new Date(),
        });

        await updateComplaint(c.complaintId, {
          urgency: newUrgency,
          urgencyScore: newScore,
          timeline,
        });

        escalatedList.push({
          complaintId: c.complaintId,
          prevUrgency: c.urgency,
          newUrgency,
          hoursOverdue,
        });
      }
    }

    return NextResponse.json({
      success: true,
      escalatedCount: escalatedList.length,
      escalated: escalatedList,
    });
  } catch (err) {
    console.error('Escalation Cron error:', err);
    return NextResponse.json({ error: 'Failed to run escalation cron' }, { status: 500 });
  }
}
