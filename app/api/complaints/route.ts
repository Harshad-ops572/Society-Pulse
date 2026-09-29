import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  createComplaint,
  getAllComplaints,
  getComplaintByReadableId,
  getRecentWingComplaints,
  getSettings,
  updateComplaint,
} from '@/lib/dataStore';
import { triageComplaint } from '@/lib/ai';
import { complaintSubmitSchema } from '@/lib/validators';
import { generateComplaintId } from '@/lib/utils';
import { getSessionFromRequest } from '@/lib/auth';
import ComplaintModel from '@/models/Complaint';
import { UrgencyLevel } from '@/types';

// Rate limiting in-memory map (IP-based, 10 submissions per 10 minutes)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Idempotency map to prevent duplicate submissions on network retries
const idempotencyMap = new Map<string, { complaint: any; createdAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (record.count >= 15) {
    return false;
  }
  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a few minutes before submitting again.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Spam honeypot protection
    if (body.honeypot && body.honeypot.trim() !== '') {
      return NextResponse.json({ error: 'Spam detected' }, { status: 400 });
    }

    const parsed = complaintSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      text,
      wing,
      flatNumber,
      commonArea,
      residentName,
      phone,
      photoUrl,
      attachmentId,
      voiceTranscript,
      confirmedCategory,
      reportSeparately,
      idempotencyKey,
    } = parsed.data;

    // Check Idempotency key to prevent duplicate tickets on network retries
    if (idempotencyKey && idempotencyMap.has(idempotencyKey)) {
      const existing = idempotencyMap.get(idempotencyKey)!;
      return NextResponse.json({
        success: true,
        complaint: existing.complaint,
        isIdempotent: true,
        message: `Complaint retrieved. Your ID is ${existing.complaint.complaintId}`,
      });
    }

    // 1. Check for rapid duplicate submission with identical text & flat in the last 5 minutes
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicateRecent = await ComplaintModel.findOne({
      flatNumber,
      originalText: text.trim(),
      createdAt: { $gte: fiveMinsAgo },
    }).lean();

    if (duplicateRecent) {
      return NextResponse.json({
        success: true,
        complaint: duplicateRecent,
        isIdempotent: true,
        message: `Identical complaint recently submitted from flat ${flatNumber}. Your ID is ${duplicateRecent.complaintId}`,
      });
    }

    // 2. Fetch recent open complaints in this wing for duplicate detection
    const recentWingComplaints = await getRecentWingComplaints(wing);

    // 3. Run AI Triage with 8-second timeout
    let triageResult;
    let needsManualTriage = false;
    try {
      const triagePromise = triageComplaint(
        text,
        wing,
        flatNumber,
        commonArea,
        recentWingComplaints
      );
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI triage timed out (>8s)')), 8000)
      );
      triageResult = await Promise.race([triagePromise, timeoutPromise]);
    } catch (err) {
      console.error('Triage error, using manual fallback:', err);
      needsManualTriage = true;
      triageResult = {
        language: 'en' as const,
        translatedText: text,
        summary: text.slice(0, 60),
        category: confirmedCategory || ('other' as const),
        urgency: 'medium' as const,
        urgencyScore: 50,
        urgencyReason: 'AI triage timeout - flagged for manual review',
        isSafetyRisk: false,
        confidence: 0.5,
        location: commonArea || `Wing ${wing} Flat ${flatNumber}`,
        duplicateOfId: null,
        duplicateConfidence: 0,
        suggestedAssigneeRole: 'committee' as const,
        suggestedAction: 'Manual committee review',
      };
    }

    // 3. Generate sequential Complaint ID
    const allComplaints = await getAllComplaints();
    const nextSeq = allComplaints.length + 1;
    const complaintId = generateComplaintId(nextSeq);

    // 4. Calculate SLA Due Date
    const settings = await getSettings();
    const slaHoursMap = settings.slaHours || { critical: 2, high: 6, medium: 24, low: 72 };
    const urgencyKey = (triageResult.urgency || 'medium') as UrgencyLevel;
    const hours = slaHoursMap[urgencyKey] || 24;
    const slaDueAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    // 5. Duplicate handling (honour resident's reportSeparately choice)
    let duplicateOf: string | null = null;
    if (triageResult.duplicateOfId && !reportSeparately) {
      const parent = await getComplaintByReadableId(triageResult.duplicateOfId);
      if (parent) {
        duplicateOf = parent.complaintId;
        // Bump parent report count and raise urgency if critical
        const newCount = (parent.reportCount || 1) + 1;
        const updates: Partial<typeof parent> = { reportCount: newCount };
        if (triageResult.isSafetyRisk && !parent.isSafetyRisk) {
          updates.isSafetyRisk = true;
          updates.urgency = 'critical';
          updates.urgencyScore = Math.max(parent.urgencyScore, 95);
        }
        await updateComplaint(parent.complaintId, updates);
      }
    }

    // Determine final category (honour confirmedCategory from resident)
    const finalCategory = confirmedCategory || triageResult.category || 'other';
    const isResidentOverride = Boolean(confirmedCategory && confirmedCategory !== triageResult.category);

    // 6. Create Complaint
    const newComplaint = await createComplaint({
      complaintId,
      originalText: text,
      translatedText: triageResult.translatedText || text,
      language: triageResult.language || 'en',
      summary: triageResult.summary || text.slice(0, 50),
      category: finalCategory,
      urgency: triageResult.urgency || 'medium',
      urgencyScore: triageResult.urgencyScore || 50,
      urgencyReason: triageResult.urgencyReason || '',
      isSafetyRisk: triageResult.isSafetyRisk || false,
      status: 'new',
      wing,
      flatNumber,
      commonArea: commonArea || '',
      residentName,
      phone: phone || '',
      photoUrl: photoUrl || '',
      attachmentId: attachmentId || null,
      voiceTranscript: voiceTranscript || '',
      duplicateOf,
      reportCount: 1,
      assignedTo: null,
      needsManualTriage,
      aiOverridden: isResidentOverride,
      originalAiCategory: isResidentOverride ? triageResult.category : undefined,
      overriddenBy: isResidentOverride ? 'Resident Confirmation' : undefined,
      slaDueAt,
      timeline: [
        {
          status: 'new',
          note: `Complaint submitted by ${residentName} (${flatNumber}). ${
            needsManualTriage
              ? 'Flagged for manual committee review.'
              : `AI triaged as ${triageResult.urgency.toUpperCase()} (${finalCategory}).`
          }`,
          by: needsManualTriage ? 'Resident (Manual Review Needed)' : 'Resident & AI Triage',
          at: new Date(),
        },
      ],
      internalNotes: [],
    });

    if (idempotencyKey) {
      idempotencyMap.set(idempotencyKey, {
        complaint: newComplaint,
        createdAt: Date.now(),
      });
    }

    const message = needsManualTriage
      ? `Saved. The committee will review it manually. Your ID is ${complaintId}`
      : `Complaint registered successfully. Your ID is ${complaintId}`;

    // Revalidate dashboard and public pages on complaint creation
    try {
      revalidatePath('/dashboard');
      revalidatePath('/');
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      complaint: newComplaint,
      triage: triageResult,
      needsManualTriage,
      message,
    });
  } catch (err) {
    console.error('Submit complaint route error:', err);
    return NextResponse.json(
      { error: 'Failed to submit complaint. Please try again.' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = (searchParams.get('scope') as 'active' | 'resolved' | 'all') || 'active';
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const urgency = searchParams.get('urgency') || undefined;
    const wing = searchParams.get('wing') || undefined;
    const search = searchParams.get('search') || undefined;
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const complaints = await getAllComplaints({
      scope,
      status,
      category,
      urgency,
      wing,
      search,
      includeArchived,
    });

    const session = getSessionFromRequest(req);
    const outputComplaints = session?.role === 'demo'
      ? complaints.map((c) => ({
          ...c,
          phone: c.phone ? c.phone.replace(/(\d{4,6})(\d{4})$/, '••••••$2') : '',
        }))
      : complaints;

    return NextResponse.json({
      success: true,
      complaints: outputComplaints,
      count: outputComplaints.length,
      scope,
    });
  } catch (err) {
    console.error('Get complaints error:', err);
    return NextResponse.json({ error: 'Failed to retrieve complaints' }, { status: 500 });
  }
}
