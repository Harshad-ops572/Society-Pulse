import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { triageComplaint, heuristicTriage } from '@/lib/ai';

export const dynamic = 'force-dynamic';

// In-memory sliding-window IP rate limiter: 5 requests per 60s
const ipRateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 5;

  const timestamps = (ipRateLimitMap.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    return false;
  }

  timestamps.push(now);
  ipRateLimitMap.set(ip, timestamps);
  return true;
}

// Zod schema enforcing 300 character cap
const triageDemoSchema = z.object({
  text: z
    .string()
    .min(3, 'Please enter at least 3 characters')
    .max(300, 'Complaint description capped at 300 characters for demo'),
});

// Prompt injection sanitization defense
function sanitizeUntrustedInput(raw: string): string {
  // Strip control chars & common prompt-injection / role-override tokens
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/(system prompt|ignore previous instructions|disregard all previous|you are now|as an ai language model|override safety)/gi, '[sanitized]')
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP identification & Rate Limiting
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded: Maximum 5 triage demonstrations per minute. Please try again in 60 seconds.',
        },
        { status: 429 }
      );
    }

    // 2. Validate input with Zod
    const body = await req.json().catch(() => ({}));
    const parseResult = triageDemoSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: parseResult.error.issues[0]?.message || 'Invalid complaint text',
        },
        { status: 400 }
      );
    }

    const cleanText = sanitizeUntrustedInput(parseResult.data.text);

    // 3. Run triage function (does NOT save anything to database)
    let isSample = false;
    let triageResult;

    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');

    if (!hasGeminiKey) {
      // Heuristic rule-based fallback labeled as Sample result
      triageResult = heuristicTriage(cleanText, 'B', '101');
      isSample = true;
    } else {
      try {
        triageResult = await triageComplaint(cleanText, 'B', '101');
      } catch (geminiErr) {
        console.warn('Gemini triage demo failed, falling back to rule-based mock:', geminiErr);
        triageResult = heuristicTriage(cleanText, 'B', '101');
        isSample = true;
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        language: triageResult.language,
        translatedText: triageResult.translatedText,
        summary: triageResult.summary,
        category: triageResult.category,
        urgency: triageResult.urgency,
        urgencyScore: triageResult.urgencyScore,
        urgencyReason: triageResult.urgencyReason,
        isSafetyRisk: triageResult.isSafetyRisk,
        suggestedAssigneeRole: triageResult.suggestedAssigneeRole,
        suggestedAction: triageResult.suggestedAction,
        isSample,
      },
    });
  } catch (err) {
    console.error('Triage demo endpoint error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during AI triage demonstration' },
      { status: 500 }
    );
  }
}
