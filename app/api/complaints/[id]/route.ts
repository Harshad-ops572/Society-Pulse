import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getComplaintByReadableId, updateComplaint } from '@/lib/dataStore';
import { complaintUpdateSchema } from '@/lib/validators';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import { ComplaintStatus, IComplaint, TimelineEvent } from '@/types';
import ComplaintModel from '@/models/Complaint';
import { deleteComplaintsWithAttachments, ACTIVE_STATUSES } from '@/lib/data/complaints';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

        // Cascade resolve to any linked duplicate child reports (Requirement 4)
        try {
          await ComplaintModel.updateMany(
            {
              duplicateOf: complaint.complaintId,
              status: { $in: ACTIVE_STATUSES },
            },
            {
              $set: {
                status: 'resolved',
                resolvedAt: new Date(),
              },
              $push: {
                timeline: {
                  status: 'resolved',
                  note: `Auto-resolved: primary incident ${complaint.complaintId} was resolved by committee (${
                    actorName || session.name
                  }).`,
                  by: 'AI Auto-Sync',
                  at: new Date(),
                },
              },
            }
          );
        } catch (e) {
          console.error('Error cascading duplicate resolution:', e);
        }
      } else if (status === 'reopened') {
        updates.resolvedAt = null;
        updates.archivedAt = null;
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

    try {
      revalidatePath('/dashboard');
      revalidatePath('/');
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, complaint: saved });
  } catch (err) {
    console.error('Update complaint error:', err);
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 });
  }
}

/**
 * DELETE single complaint (admin only, demo role strictly prohibited)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireRole(req, ['admin']);
    if (!auth.authorized || !auth.session) {
      return auth.response!;
    }

    const { id } = await params;
    const complaint = await getComplaintByReadableId(id);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const result = await deleteComplaintsWithAttachments(
      { complaintId: complaint.complaintId },
      { name: auth.session.name, role: auth.session.role },
      `Deleted ticket ${complaint.complaintId} by administrator ${auth.session.name}`,
      'complaint'
    );

    try {
      revalidatePath('/dashboard');
      revalidatePath('/');
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: `Ticket ${complaint.complaintId} and linked attachments permanently deleted.`,
      deletedCount: result.deletedCount,
      attachmentCount: result.attachmentCount,
    });
  } catch (err) {
    console.error('Delete complaint error:', err);
    return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 });
  }
}
