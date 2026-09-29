import { NextRequest, NextResponse } from 'next/server';
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
import { UrgencyLevel } from '@/types';

// Rate limiting in-memory map (IP-based, 10 submissions per 10 minutes)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

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
      voiceTranscript,
    } = parsed.data;

    // 1. Fetch recent open complaints in this wing for duplicate detection
    const recentWingComplaints = await getRecentWingComplaints(wing);

    // 2. Run AI Triage
    let triageResult;
    let needsManualTriage = false;
    try {
      triageResult = await triageComplaint(
        text,
        wing,
        flatNumber,
        commonArea,
        recentWingComplaints
      );
    } catch (err) {
      console.error('Triage error, using fallback:', err);
      needsManualTriage = true;
      triageResult = {
        language: 'en' as const,
        translatedText: text,
        summary: text.slice(0, 60),
        category: 'other' as const,
        urgency: 'medium' as const,
        urgencyScore: 50,
        urgencyReason: 'AI triage timeout - flagged for manual review',
        isSafetyRisk: false,
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

    // 5. Duplicate handling
    let duplicateOf: string | null = null;
    if (triageResult.duplicateOfId) {
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

    // 6. Create Complaint
    const newComplaint = await createComplaint({
      complaintId,
      originalText: text,
      translatedText: triageResult.translatedText || text,
      language: triageResult.language || 'en',
      summary: triageResult.summary || text.slice(0, 50),
      category: triageResult.category || 'other',
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
      voiceTranscript: voiceTranscript || '',
      duplicateOf,
      reportCount: 1,
      assignedTo: null,
      needsManualTriage,
      aiOverridden: false,
      slaDueAt,
      timeline: [
        {
          status: 'new',
          note: `Complaint submitted by ${residentName} (${flatNumber}). AI triaged as ${triageResult.urgency.toUpperCase()} (${triageResult.category}).`,
          by: 'Resident & AI Triage',
          at: new Date(),
        },
      ],
      internalNotes: [],
    });

    return NextResponse.json({
      success: true,
      complaint: newComplaint,
      triage: triageResult,
    });
  } catch (err) {
    console.error('Submit complaint route error:', err);
    return NextResponse.json(
      { error: 'Failed to submit complaint. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const urgency = searchParams.get('urgency') || undefined;
    const wing = searchParams.get('wing') || undefined;
    const search = searchParams.get('search') || undefined;

    const complaints = await getAllComplaints({
      status,
      category,
      urgency,
      wing,
      search,
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
    });
  } catch (err) {
    console.error('Get complaints error:', err);
    return NextResponse.json({ error: 'Failed to retrieve complaints' }, { status: 500 });
  }
}
