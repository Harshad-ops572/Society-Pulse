import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import ComplaintModel from '@/models/Complaint';
import { generateComplaintId } from '@/lib/utils';
import { z } from 'zod';
import { ComplaintCategory, UrgencyLevel, ComplaintStatus, TimelineEvent } from '@/types';

const ticketSchema = z.object({
  candidateId: z.string(),
  summary: z.string(),
  originalText: z.string(),
  category: z.enum(['water', 'lift', 'parking', 'noise', 'cleaning', 'electrical', 'security', 'other']),
  urgency: z.enum(['critical', 'high', 'medium', 'low']),
  urgencyScore: z.number().min(0).max(100),
  wing: z.string(),
  flatNumber: z.string(),
  residentName: z.string(),
  reportCount: z.number().default(1),
  likelyResolved: z.boolean().default(false),
  resolutionNote: z.string().optional(),
  isSafetyRisk: z.boolean().default(false),
  messages: z.array(z.string()).default([]),
});

const saveBatchSchema = z.object({
  batchId: z.string().min(5),
  tickets: z.array(ticketSchema).min(1, 'At least one ticket must be selected'),
});

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Committee login required.' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = saveBatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    await connectDB();

    const { batchId, tickets } = parsed.data;
    const now = new Date();
    const currentYear = now.getFullYear();

    // Find highest sequence number to avoid ID collisions
    const count = await ComplaintModel.countDocuments();
    let currentSeq = count + 1;

    const createdComplaints: any[] = [];

    for (const ticket of tickets) {
      const complaintId = generateComplaintId(currentSeq++, currentYear);

      // SLA hours calculation
      const slaHours = ticket.urgency === 'critical' ? 2 : ticket.urgency === 'high' ? 8 : ticket.urgency === 'medium' ? 24 : 48;
      const slaDueAt = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

      const status: ComplaintStatus = ticket.likelyResolved ? 'resolved' : 'new';

      const timeline: TimelineEvent[] = [
        {
          status: 'new',
          note: `Batch imported from WhatsApp chat export (${ticket.messages.length} messages aggregated)`,
          by: `${session.name} (${session.role})`,
          at: now,
        },
      ];

      if (ticket.likelyResolved) {
        timeline.push({
          status: 'resolved',
          note: ticket.resolutionNote || 'Marked as likely resolved in WhatsApp thread',
          by: 'AI Auto-Detect',
          at: new Date(now.getTime() + 1000),
        });
      }

      const doc = await ComplaintModel.create({
        complaintId,
        originalText: ticket.originalText,
        translatedText: ticket.summary,
        language: 'hinglish',
        summary: ticket.summary,
        category: ticket.category as ComplaintCategory,
        urgency: ticket.urgency as UrgencyLevel,
        urgencyScore: ticket.urgencyScore,
        urgencyReason: `Extracted from resident WhatsApp thread with ${ticket.reportCount} related message(s).`,
        isSafetyRisk: ticket.isSafetyRisk,
        status,
        wing: ticket.wing,
        flatNumber: ticket.flatNumber,
        residentName: ticket.residentName,
        phone: '',
        reportCount: ticket.reportCount,
        needsManualTriage: false,
        aiOverridden: false,
        slaDueAt,
        resolvedAt: ticket.likelyResolved ? now : null,
        isDemo: session.role === 'demo',
        importBatchId: batchId,
        timeline,
        internalNotes: ticket.messages.map((m) => ({
          note: m,
          author: 'WhatsApp Export',
          createdAt: now,
        })),
      });

      createdComplaints.push(doc);
    }

    return NextResponse.json({
      success: true,
      batchId,
      importedCount: createdComplaints.length,
      complaintIds: createdComplaints.map((c) => c.complaintId),
    });
  } catch (err) {
    console.error('Save WhatsApp import error:', err);
    return NextResponse.json({ error: 'Failed to save imported complaints' }, { status: 500 });
  }
}
