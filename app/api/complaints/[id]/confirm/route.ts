import { NextRequest, NextResponse } from 'next/server';
import { getComplaintByReadableId, updateComplaint } from '@/lib/dataStore';
import { residentConfirmSchema } from '@/lib/validators';
import { ComplaintStatus, TimelineEvent } from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const complaint = await getComplaintByReadableId(id);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = residentConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid confirmation payload', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { resolved, feedback } = parsed.data;
    const timeline: TimelineEvent[] = [...(complaint.timeline || [])];

    if (resolved) {
      timeline.push({
        status: 'resolved',
        note: `Resident confirmed resolution: "${feedback || 'Satisfied with resolution'}"`,
        by: complaint.residentName,
        at: new Date(),
      });

      const updated = await updateComplaint(complaint.complaintId, {
        residentConfirmed: true,
        timeline,
      });

      return NextResponse.json({
        success: true,
        status: 'resolved',
        message: 'Thank you for confirming the resolution!',
        complaint: updated,
      });
    } else {
      // Reopen complaint automatically!
      const newStatus: ComplaintStatus = 'reopened';
      timeline.push({
        status: newStatus,
        note: `Resident reported NOT resolved: "${feedback || 'Issue persists'}". Automatically reopened.`,
        by: complaint.residentName,
        at: new Date(),
      });

      // Elevate urgency score if low
      const newScore = Math.max(complaint.urgencyScore, 75);
      const updated = await updateComplaint(complaint.complaintId, {
        status: newStatus,
        residentConfirmed: false,
        urgency: 'high',
        urgencyScore: newScore,
        timeline,
      });

      return NextResponse.json({
        success: true,
        status: 'reopened',
        message: 'Complaint has been reopened. The committee has been notified.',
        complaint: updated,
      });
    }
  } catch (err) {
    console.error('Resident confirmation error:', err);
    return NextResponse.json({ error: 'Failed to process confirmation' }, { status: 500 });
  }
}
