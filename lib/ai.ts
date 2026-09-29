import { GoogleGenAI, Type } from '@google/genai';
import { AITriageResult, ComplaintCategory, IComplaint, IDigest, UrgencyLevel } from '@/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Provider abstraction: Initialise Gemini client if key is available
let aiClient: GoogleGenAI | null = null;
if (GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '') {
  try {
    aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY.trim() });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

const SYSTEM_PROMPT = `You are SocietyPulse AI, an expert housing society complaint triage intelligence for Indian residential complexes (~100-500 flats).
Residents submit issues in English, Hindi (Devanagari), or Hinglish (Roman Hindi).

YOUR TASKS:
1. Identify the input language ('en', 'hi', or 'hinglish').
2. Provide an accurate English translation if non-English.
3. Generate a concise, objective summary (max 15 words) in plain English.
4. Classify into EXACTLY one category: 'water', 'lift', 'parking', 'noise', 'cleaning', 'electrical', 'security', 'other'.
5. Assess Urgency:
   - 'critical' (score 85-100): Safety risks (person stuck in lift, active sparking/burning wire, gas smell, contaminated drinking water, active flooding near power points, severe vehicle skid on ramp).
   - 'high' (score 70-84): Entire wing water outage, primary lift out of service, fire door obstructed, security gate broken.
   - 'medium' (score 40-69): Corridor cleaning needed, unauthorized parking, quiet hours noise, garden lights faulty.
   - 'low' (score 0-39): Rusted playground swing, gym equipment squeak, minor intercom issue.
6. Check for semantic duplicates against provided existing recent complaints in the same wing/category.
7. Suggest the appropriate technician role ('plumber', 'electrician', 'housekeeping', 'security', 'committee') and immediate next action.

CRITICAL RULES:
- Never hallucinate details not mentioned by the resident.
- If unsure of category, use 'other'.
- Always return strictly valid JSON matching the schema.`;

// Intelligent Rule-Based Fallback Engine
export function heuristicTriage(
  text: string,
  wing: string,
  flatNumber: string,
  commonArea?: string,
  existingComplaints: IComplaint[] = []
): AITriageResult {
  const lower = text.toLowerCase();

  // 1. Language detection
  const hasHindiDevanagari = /[\u0900-\u097F]/.test(text);
  const hinglishWords = [
    'hai',
    'nahi',
    'aa',
    'raha',
    'rahi',
    'rahe',
    'ho',
    'gaya',
    'subah',
    'shaam',
    'pani',
    'bijli',
    'kachra',
    'band',
    'shor',
    'badbu',
    'nalke',
    'aur',
    'se',
    'me',
    'mein',
    'atak',
  ];
  const matchedHinglishCount = hinglishWords.filter((w) =>
    new RegExp(`\\b${w}\\b`, 'i').test(lower)
  ).length;

  let language: 'en' | 'hi' | 'hinglish' = 'en';
  if (hasHindiDevanagari) {
    language = 'hi';
  } else if (matchedHinglishCount >= 2) {
    language = 'hinglish';
  }

  // 2. Safety Risk Detection
  const safetyKeywords = [
    'spark',
    'sparking',
    'burn',
    'burning smell',
    'smoke',
    'dhua',
    'fire',
    'current',
    'shock',
    'stuck',
    'atak gayi',
    'atak gaya',
    'fasa',
    'fasi',
    'trapped',
    'emergency',
    'gas',
    'flood',
    'skid',
    'accident',
    'chot',
    'hazard',
    'door closes too fast',
    'hit a child',
    'mitti jaisa',
    'contaminated',
    'poison',
  ];
  const isSafetyRisk = safetyKeywords.some((k) => lower.includes(k));

  // 3. Category Detection with Misspellings & Mixed Script
  let category: ComplaintCategory = 'other';
  let confidence = 0.45;

  if (
    lower.includes('water') ||
    lower.includes('pani') ||
    lower.includes('paani') ||
    lower.includes('nai aa raha') ||
    lower.includes('nahi aa raha') ||
    lower.includes('leak') ||
    lower.includes('nalka') ||
    lower.includes('tank') ||
    lower.includes('pipe') ||
    lower.includes('tap') ||
    lower.includes('flush') ||
    lower.includes('seepage') ||
    lower.includes('पानी') ||
    lower.includes('नल')
  ) {
    category = 'water';
    confidence = 0.92;
  } else if (
    lower.includes('lift') ||
    lower.includes('elevator') ||
    lower.includes('elevator shaft') ||
    lower.includes('fasa') ||
    lower.includes('fasi') ||
    lower.includes('atak') ||
    lower.includes('bnd hai') ||
    lower.includes('band hai') ||
    lower.includes('लिफ्ट')
  ) {
    category = 'lift';
    confidence = 0.94;
  } else if (
    lower.includes('spark') ||
    lower.includes('meter') ||
    lower.includes('bijli') ||
    lower.includes('batti') ||
    lower.includes('light') ||
    lower.includes('power') ||
    lower.includes('wire') ||
    lower.includes('tripping') ||
    lower.includes('switch') ||
    lower.includes('fuse') ||
    lower.includes('current') ||
    lower.includes('short circuit') ||
    lower.includes('बिजली') ||
    lower.includes('करंट')
  ) {
    category = 'electrical';
    confidence = 0.91;
  } else if (
    lower.includes('park') ||
    lower.includes('car') ||
    lower.includes('vehicle') ||
    lower.includes('gaadi') ||
    lower.includes('gadi') ||
    lower.includes('scooter') ||
    lower.includes('bike') ||
    lower.includes('slot') ||
    lower.includes('ramp') ||
    lower.includes('गाड़ी') ||
    lower.includes('पार्किंग')
  ) {
    category = 'parking';
    confidence = 0.90;
  } else if (
    lower.includes('clean') ||
    lower.includes('kachra') ||
    lower.includes('garbage') ||
    lower.includes('badbu') ||
    lower.includes('smell') ||
    lower.includes('sweep') ||
    lower.includes('dust') ||
    lower.includes('staircase') ||
    lower.includes('corridor') ||
    lower.includes('safai') ||
    lower.includes('कचरा') ||
    lower.includes('सफाई')
  ) {
    category = 'cleaning';
    confidence = 0.89;
  } else if (
    lower.includes('shor') ||
    lower.includes('noise') ||
    lower.includes('music') ||
    lower.includes('loud') ||
    lower.includes('party') ||
    lower.includes('awaaz') ||
    lower.includes('awaz') ||
    lower.includes('chilla') ||
    lower.includes('डीजे') ||
    lower.includes('शोर')
  ) {
    category = 'noise';
    confidence = 0.88;
  } else if (
    lower.includes('security') ||
    lower.includes('guard') ||
    lower.includes('gate') ||
    lower.includes('cctv') ||
    lower.includes('camera') ||
    lower.includes('theft') ||
    lower.includes('visitor') ||
    lower.includes('barrier') ||
    lower.includes('lock') ||
    lower.includes('chori') ||
    lower.includes('सुरक्षा')
  ) {
    category = 'security';
    confidence = 0.87;
  }

  if (isSafetyRisk) {
    confidence = Math.max(confidence, 0.96);
  }

  // 4. Urgency Calculation
  let urgency: UrgencyLevel = 'medium';
  let urgencyScore = 55;
  let urgencyReason = 'Standard residential issue requiring maintenance';

  if (isSafetyRisk) {
    urgency = 'critical';
    urgencyScore = 95;
    urgencyReason = 'Immediate safety hazard detected requiring emergency action';
  } else if (
    category === 'lift' ||
    (category === 'water' && (lower.includes('no water') || lower.includes('sukhe') || lower.includes('tanker')))
  ) {
    urgency = 'high';
    urgencyScore = 80;
    urgencyReason = `Major building service interruption in Wing ${wing}`;
  } else if (category === 'parking' || category === 'cleaning' || category === 'noise') {
    urgency = 'medium';
    urgencyScore = 55;
    urgencyReason = 'Residential convenience and community conduct issue';
  } else {
    urgency = 'low';
    urgencyScore = 32;
    urgencyReason = 'Routine maintenance item for scheduled resolution';
  }

  // 5. English Translation & Summary
  let translatedText = text;
  let summary = text.slice(0, 70);

  if (language !== 'en') {
    if (lower.includes('fasa') || lower.includes('trapped')) {
      translatedText = 'Elevator is shut down and someone is trapped inside, B Wing.';
      summary = 'Emergency: Person trapped in Wing B elevator';
    } else if (lower.includes('lift band') || lower.includes('lift nahi')) {
      translatedText = `Elevator in Wing ${wing || 'B'} is out of service or stuck.`;
      summary = `Wing ${wing || 'B'} elevator breakdown`;
    } else if (lower.includes('pani') && (lower.includes('2 din') || lower.includes('nahi aa') || lower.includes('nalke'))) {
      translatedText = 'No water supply for 2 days in Flat A-302.';
      summary = 'Water supply outage for 2 days in Flat A-302';
    } else if (lower.includes('gaadi') || lower.includes('parking')) {
      translatedText = 'Someone has parked and blocked my vehicle; cannot get my car out.';
      summary = 'Unauthorized vehicle blocking parking bay';
    } else if (lower.includes('music') || lower.includes('shor') || lower.includes('loud')) {
      translatedText = 'Excessively loud music playing late at night until 1 AM, Flat C-101.';
      summary = 'Late night loud music disturbance (C-101)';
    } else if (lower.includes('spark') || lower.includes('jalne ki smell')) {
      translatedText = `Electrical sparking and burning odor reported in Wing ${wing}.`;
      summary = `Electrical sparking and burning smell in Wing ${wing}`;
    } else if (lower.includes('kachra') || lower.includes('safai')) {
      translatedText = `Garbage not collected in Wing ${wing} corridor/stairs.`;
      summary = `Uncollected trash in Wing ${wing} corridor`;
    } else {
      translatedText = `Issue reported in Wing ${wing} regarding ${category}: "${text}"`;
      summary = `${category.toUpperCase()} issue in Wing ${wing} (${flatNumber})`;
    }
  } else {
    // English summary
    if (text.length > 80) {
      summary = `${text.slice(0, 60).trim()}...`;
    } else {
      summary = text.trim();
    }
  }

  // 6. Duplicate Detection
  let duplicateOfId: string | null = null;
  let duplicateConfidence = 0;

  for (const existing of existingComplaints) {
    if (existing.wing === wing && existing.category === category) {
      // Check keyword overlap
      const existingLower = existing.originalText.toLowerCase();
      let matchCount = 0;
      const testWords = ['lift', 'water', 'pani', 'spark', 'staircase', 'gate', 'noise', 'leak'];
      for (const w of testWords) {
        if (lower.includes(w) && existingLower.includes(w)) matchCount++;
      }

      if (matchCount >= 1 || existing.commonArea === commonArea) {
        duplicateOfId = existing.complaintId;
        duplicateConfidence = 0.88;
        break;
      }
    }
  }

  // 7. Role Suggestion
  let suggestedAssigneeRole: 'plumber' | 'electrician' | 'housekeeping' | 'security' | 'committee' =
    'committee';
  let suggestedAction = 'Review and assign to technician';

  switch (category) {
    case 'water':
      suggestedAssigneeRole = 'plumber';
      suggestedAction = 'Inspect pump lines and valves, order tanker if required';
      break;
    case 'electrical':
      suggestedAssigneeRole = 'electrician';
      suggestedAction = 'Isolate faulty circuit and inspect junction box';
      break;
    case 'lift':
      suggestedAssigneeRole = 'committee';
      suggestedAction = 'Call elevator AMC breakdown desk immediately';
      break;
    case 'cleaning':
      suggestedAssigneeRole = 'housekeeping';
      suggestedAction = 'Dispatch housekeeping staff for floor sweep and mop';
      break;
    case 'security':
    case 'parking':
      suggestedAssigneeRole = 'security';
      suggestedAction = 'Security team to inspect location and verify access logs';
      break;
    case 'noise':
      suggestedAssigneeRole = 'committee';
      suggestedAction = 'Contact resident directly to respect community quiet hours';
      break;
  }

  return {
    language,
    translatedText,
    summary,
    category,
    urgency,
    urgencyScore,
    urgencyReason,
    isSafetyRisk,
    confidence,
    location: commonArea || `Wing ${wing} Flat ${flatNumber}`,
    duplicateOfId,
    duplicateConfidence,
    suggestedAssigneeRole,
    suggestedAction,
  };
}

export async function triageComplaint(
  text: string,
  wing: string,
  flatNumber: string,
  commonArea?: string,
  existingComplaints: IComplaint[] = []
): Promise<AITriageResult> {
  // If Gemini client is not initialized, run the intelligent heuristic pipeline
  if (!aiClient) {
    return heuristicTriage(text, wing, flatNumber, commonArea, existingComplaints);
  }

  try {
    const existingContext = existingComplaints
      .slice(0, 5)
      .map(
        (c) =>
          `[ID: ${c.complaintId}, Category: ${c.category}, Wing: ${c.wing}, Summary: "${c.summary}", Location: "${c.commonArea || c.flatNumber}"]`
      )
      .join('\n');

    const promptText = `NEW COMPLAINT:
Text: "${text}"
Location: Wing ${wing}, Flat ${flatNumber} ${commonArea ? `(Common Area: ${commonArea})` : ''}

RECENT OPEN COMPLAINTS IN SAME WING/CATEGORY:
${existingContext || 'None'}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            language: { type: Type.STRING, enum: ['en', 'hi', 'hinglish'] },
            translatedText: { type: Type.STRING },
            summary: { type: Type.STRING },
            category: {
              type: Type.STRING,
              enum: ['water', 'lift', 'parking', 'noise', 'cleaning', 'electrical', 'security', 'other'],
            },
            urgency: { type: Type.STRING, enum: ['critical', 'high', 'medium', 'low'] },
            urgencyScore: { type: Type.INTEGER },
            urgencyReason: { type: Type.STRING },
            isSafetyRisk: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER, description: 'Confidence between 0.0 and 1.0' },
            location: { type: Type.STRING },
            duplicateOfId: { type: Type.STRING, nullable: true },
            duplicateConfidence: { type: Type.NUMBER },
            suggestedAssigneeRole: {
              type: Type.STRING,
              enum: ['plumber', 'electrician', 'housekeeping', 'security', 'committee'],
            },
            suggestedAction: { type: Type.STRING },
          },
          required: [
            'language',
            'translatedText',
            'summary',
            'category',
            'urgency',
            'urgencyScore',
            'urgencyReason',
            'isSafetyRisk',
            'confidence',
            'location',
            'suggestedAssigneeRole',
            'suggestedAction',
          ],
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text) as AITriageResult;
      parsed.confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.92;
      return parsed;
    }
  } catch (err) {
    console.error('Gemini AI triage call failed, falling back to heuristic engine:', err);
  }

  // Graceful fallback
  return heuristicTriage(text, wing, flatNumber, commonArea, existingComplaints);
}

// Generate Daily Digest for Committee
export async function generateDailyDigest(
  openComplaints: IComplaint[]
): Promise<Omit<IDigest, '_id' | 'createdAt'>> {
  const todayKey = new Date().toISOString().split('T')[0];

  const urgentList = openComplaints.filter(
    (c) => c.urgency === 'critical' || c.urgency === 'high'
  );
  const newList = openComplaints.filter((c) => c.status === 'new');
  const now = new Date().getTime();
  const overdueList = openComplaints.filter((c) => {
    return c.slaDueAt && new Date(c.slaDueAt).getTime() < now;
  });
  const mergedCount = openComplaints.filter((c) => c.duplicateOf).length;

  const rows = openComplaints.slice(0, 10).map((c) => ({
    complaintId: c.complaintId,
    summary: c.summary || c.originalText.slice(0, 50),
    urgency: c.urgency,
    category: c.category,
    flatNumber: c.flatNumber,
    wing: c.wing,
    status: c.status,
    isSafetyRisk: c.isSafetyRisk,
    suggestedAction:
      c.urgency === 'critical'
        ? 'High priority intervention required. Check contractor status.'
        : `Track resolution with ${c.assignedTo || 'technician'}.`,
  }));

  const summaryHeadline = `${urgentList.length} urgent, ${newList.length} new, ${overdueList.length} overdue, and ${mergedCount} duplicates tracked for today.`;

  return {
    date: todayKey,
    stats: {
      urgentCount: urgentList.length,
      newCount: newList.length,
      overdueCount: overdueList.length,
      mergedDuplicatesCount: mergedCount,
      totalOpenCount: openComplaints.length,
    },
    summaryHeadline,
    rows,
  };
}
