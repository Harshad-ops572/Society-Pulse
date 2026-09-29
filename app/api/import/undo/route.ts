import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import ComplaintModel from '@/models/Complaint';
import { z } from 'zod';

const undoSchema = z.object({
  batchId: z.string().min(5),
});

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Committee login required.' }, { status: 401 });
    }

    // Role check: Demo users are not permitted to delete data per Section 8
    if (session.role === 'demo') {
      return NextResponse.json(
        { error: 'Demo accounts have read-and-triage privileges only and cannot delete imported data.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = undoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid batch ID', details: parsed.error.issues }, { status: 400 });
    }

    await connectDB();

    const { batchId } = parsed.data;
    const deleteResult = await ComplaintModel.deleteMany({ importBatchId: batchId });

    return NextResponse.json({
      success: true,
      message: `Successfully undone import batch ${batchId}.`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (err) {
    console.error('Undo WhatsApp import error:', err);
    return NextResponse.json({ error: 'Failed to undo import batch' }, { status: 500 });
  }
}
