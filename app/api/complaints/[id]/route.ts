import { NextRequest, NextResponse } from 'next/server';
import { getComplaintByReadableId, updateComplaint } from '@/lib/dataStore';
import { complaintUpdateSchema } from '@/lib/validators';
import { getSessionFromRequest } from '@/lib/auth';
import { ComplaintStatus, IComplaint, TimelineEvent } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const complaint = await getComplaintByReadableId(id);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const session = getSessionFromRequest(req);
    let outputComplaint = { ...complaint };
    if (!session) {
      outputComplaint.phone = '';
      outputComplaint.internalNotes = [];
    } else if (session.role === 'demo') {
      outputComplaint.phone = complaint.phone
        ? complaint.phone.replace(/(\d{4,6})(\d{4})$/, '••••••$2')
        : '';
    }

    return NextResponse.json({ success: true, complaint: outputComplaint });
  } catch (err) {
    console.error('Get complaint by ID error:', err);
    return NextResponse.json({ error: 'Failed to fetch complaint' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getSessionFromRequest(req);
    // Committee action requires auth
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const complaint = await getComplaintByReadableId(id);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = complaintUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      status,
      assignedTo,
      category,
      urgency,
      urgencyScore,
      internalNote,
      timelineNote,
      actorName,
    } = parsed.data;

    const updates: Partial<IComplaint> = {};
    const updatedTimeline: TimelineEvent[] = [...(complaint.timeline || [])];
    const updatedInternalNotes = [...(complaint.internalNotes || [])];

    let aiOverridden = complaint.aiOverridden;
    if (category && category !== complaint.category) {
      updates.category = category;
      updates.originalAiCategory = complaint.originalAiCategory || complaint.category;
      updates.overriddenBy = actorName || session.name;
      aiOverridden = true;
    }
    if (urgency && urgency !== complaint.urgency) {
      updates.urgency = urgency;
      updates.originalAiUrgency = complaint.originalAiUrgency || complaint.urgency;
      updates.overriddenBy = actorName || session.name;
      aiOverridden = true;
    }
    if (urgencyScore !== undefined) {
      updates.urgencyScore = urgencyScore;
    }
    updates.aiOverridden = aiOverridden;

    if (assignedTo !== undefined) {
      updates.assignedTo = assignedTo;
      if (assignedTo) {
        updatedTimeline.push({
          status: (status || complaint.status) as ComplaintStatus,
          note: `Assigned to ${assignedTo} by ${actorName || session.name}`,
          by: actorName || session.name,
          at: new Date(),
        });
      }
    }

    if (status && status !== complaint.status) {
      updates.status = status;
      if (status === 'resolved') {
        updates.resolvedAt = new Date();
      }
      updatedTimeline.push({
        status,
        note:
          timelineNote ||
          `Status changed from ${complaint.status.toUpperCase()} to ${status.toUpperCase()} by ${
            actorName || session.name
          }`,
        by: actorName || session.name,
        at: new Date(),
      });
    } else if (timelineNote) {
      updatedTimeline.push({
        status: complaint.status,
        note: timelineNote,
        by: actorName || session.name,
        at: new Date(),
      });
    }

    if (internalNote && internalNote.trim() !== '') {
      updatedInternalNotes.push({
        note: internalNote.trim(),
        author: session.name,
        createdAt: new Date(),
      });
    }

    updates.timeline = updatedTimeline;
    updates.internalNotes = updatedInternalNotes;

    const saved = await updateComplaint(complaint.complaintId, updates);
    return NextResponse.json({ success: true, complaint: saved });
  } catch (err) {
    console.error('Update complaint error:', err);
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 });
  }
}
