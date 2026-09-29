import { NextRequest, NextResponse } from 'next/server';
import { getComplaintByReadableId, updateComplaint } from '@/lib/dataStore';
import { residentCommentSchema } from '@/lib/validators';

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
    const parsed = residentCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid comment input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { comment, author } = parsed.data;
    const timeline = [...(complaint.timeline || [])];
    timeline.push({
      status: complaint.status,
      note: `Follow-up from ${author}: "${comment}"`,
      by: author,
      at: new Date(),
    });

    const updated = await updateComplaint(complaint.complaintId, { timeline });
    return NextResponse.json({ success: true, complaint: updated });
  } catch (err) {
    console.error('Add comment error:', err);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
