import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { parseWhatsAppExport, ParsedWhatsAppMessage } from '@/lib/whatsappParser';
import { heuristicTriage } from '@/lib/ai';
import { ComplaintCategory, UrgencyLevel } from '@/types';
import { z } from 'zod';

const importInputSchema = z.object({
  text: z.string().min(10, 'Chat text must contain at least 10 characters'),
});

export interface CandidateImportTicket {
  candidateId: string;
  summary: string;
  originalText: string;
  category: ComplaintCategory;
  urgency: UrgencyLevel;
  urgencyScore: number;
  wing: string;
  flatNumber: string;
  residentName: string;
  reportCount: number;
  likelyResolved: boolean;
  resolutionNote?: string;
  isSafetyRisk: boolean;
  messages: string[];
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Committee login required.' }, { status: 401 });
    }

    const body = await req.json();
    const parsedInput = importInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsedInput.error.issues }, { status: 400 });
    }

    // 1. Parse and sanitize messages
    const messages = parseWhatsAppExport(parsedInput.data.text);
    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'No valid user messages found in chat export. Please check format.' },
        { status: 400 }
      );
    }

    // 2. Identify noise vs complaint keywords
    const noiseKeywords = [
      'good morning',
      'good night',
      'happy',
      'namaste',
      'radhe radhe',
      'ram ram',
      'diwali',
      'congrats',
      'thank you',
      'thanks',
      'anyone knows',
      'courier',
    ];

    const resolutionKeywords = [
      'fixed',
      'done now',
      'removed car',
      'water restored',
      'paani aa gaya',
      'staff dispatched',
      'resolved',
      'working now',
      'turned off power',
      'valve opened',
    ];

    // 3. Group and extract candidate complaints
    const candidateMap = new Map<string, CandidateImportTicket>();
    let candidateIndex = 1;

    for (const msg of messages) {
      const lowerText = msg.text.toLowerCase();

      // Check if message is a resolution confirmation for a previous issue
      const isResolution = resolutionKeywords.some((k) => lowerText.includes(k));

      // Extract sender wing & flat if in format "Name (B-402)" or "A-302"
      let wing = 'A';
      let flat = 'Common';
      let residentName = msg.sender;

      const flatMatch = msg.sender.match(/\b([A-D])\s*[-/]?\s*(\d{2,4})\b/i);
      if (flatMatch) {
        wing = flatMatch[1].toUpperCase();
        flat = `${wing}-${flatMatch[2]}`;
        residentName = msg.sender.replace(/\([^)]*\)/, '').trim();
      }

      // Check if message is purely conversational noise
      const isNoise = noiseKeywords.some((k) => lowerText.includes(k));
      if (isNoise && !lowerText.includes('lift') && !lowerText.includes('water') && !lowerText.includes('spark')) {
        continue;
      }

      // Run fast NLP heuristic classification
      const triage = heuristicTriage(msg.text, wing, flat);

      // Filter out low urgency "other" conversational chatter
      if (triage.category === 'other' && triage.urgencyScore < 45 && !triage.isSafetyRisk) {
        continue;
      }

      // Duplicate clustering key by Category + Wing (e.g. "lift-B", "water-A")
      const clusterKey = `${triage.category}-${wing}`;

      if (candidateMap.has(clusterKey)) {
        const existing = candidateMap.get(clusterKey)!;
        existing.reportCount += 1;
        existing.messages.push(`${msg.sender} (${msg.timestamp}): ${msg.text}`);
        existing.urgencyScore = Math.min(100, Math.max(existing.urgencyScore, triage.urgencyScore + 5));
        if (triage.isSafetyRisk) {
          existing.isSafetyRisk = true;
          existing.urgency = 'critical';
        }
        if (isResolution) {
          existing.likelyResolved = true;
          existing.resolutionNote = `Follow-up from ${msg.sender}: "${msg.text}"`;
        }
      } else {
        const candidate: CandidateImportTicket = {
          candidateId: `CAND-${String(candidateIndex++).padStart(3, '0')}`,
          summary: triage.summary || msg.text.slice(0, 60),
          originalText: msg.text,
          category: triage.category,
          urgency: triage.urgency,
          urgencyScore: triage.urgencyScore,
          wing,
          flatNumber: flat,
          residentName,
          reportCount: 1,
          likelyResolved: isResolution,
          resolutionNote: isResolution ? `Follow-up note: "${msg.text}"` : undefined,
          isSafetyRisk: triage.isSafetyRisk,
          messages: [`${msg.sender} (${msg.timestamp}): ${msg.text}`],
        };
        candidateMap.set(clusterKey, candidate);
      }
    }

    const candidates = Array.from(candidateMap.values()).sort(
      (a, b) => b.urgencyScore - a.urgencyScore
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalMessages: messages.length,
        complaintsFound: candidates.length,
        criticalCount: candidates.filter((c) => c.urgency === 'critical').length,
        duplicatesMerged: messages.length - candidates.length,
      },
      candidates,
    });
  } catch (err) {
    console.error('WhatsApp chat import error:', err);
    return NextResponse.json({ error: 'Failed to process WhatsApp chat import' }, { status: 500 });
  }
}
