import { triageComplaint } from '../lib/ai';
import { IComplaint } from '../types';

const testSamples = [
  {
    name: 'Critical Electrical Sparking (Hinglish)',
    text: 'Wing B meter box se continuous sparks nikal rahe hain aur plastic jalne ki smell aa rahi hai!',
    wing: 'B',
    flat: 'B-101',
    area: 'Ground Floor Meter Room',
  },
  {
    name: 'Lift Breakdown (Hinglish)',
    text: 'Lift B band hai subah se, elderly people staircase nahi chadh sakte.',
    wing: 'B',
    flat: 'B-702',
    area: 'Wing B Elevator',
  },
  {
    name: 'Lift Duplicate Report (Hinglish)',
    text: 'Lift B nahi chal rahi hai, ground floor par atki hai.',
    wing: 'B',
    flat: 'B-404',
    area: 'Wing B Elevator',
  },
  {
    name: 'Total Water Outage (Hinglish)',
    text: 'Wing A me subah se nalke sukhe hain, pani kab aayega tanker mangwao!',
    wing: 'A',
    flat: 'A-201',
    area: 'Wing A Line',
  },
  {
    name: 'Staircase Garbage (Hinglish)',
    text: 'Corridor cleaning nahi hui 3 din se, kachra pada hai B wing staircase pe badbu aa rahi hai.',
    wing: 'B',
    flat: 'B-302',
    area: 'Wing B 3rd Floor Stairs',
  },
  {
    name: 'Parking Obstruction (Hinglish)',
    text: 'Basement parking slot B-12 me koi unknown car park kar gaya hai, meri gaadi bahar khadi hai.',
    wing: 'B',
    flat: 'B-104',
    area: 'Basement Parking',
  },
  {
    name: 'Loud Late Night Music (Hinglish)',
    text: 'Flat 402 se bahut tej music aur shor ho raha hai raat ko 1 baje tak.',
    wing: 'A',
    flat: 'A-401',
    area: '4th Floor Corridor',
  },
  {
    name: 'Broken Security Lock (Hinglish)',
    text: 'Terrace door ka lock toota hua hai, security guard ko bola par koi sun nahi raha.',
    wing: 'C',
    flat: 'C-801',
    area: 'Terrace Gate',
  },
  {
    name: 'Water Seepage Leakage (Hinglish)',
    text: 'Terrace tanki se pani tapak raha hai continuous aur ceiling me seepage ho rahi hai.',
    wing: 'C',
    flat: 'C-702',
    area: 'Terrace Line',
  },
  {
    name: 'Kids Play Area Damage (Hinglish)',
    text: 'Garden me bacchon ka jhoola toota hua hai, kisi bacche ko chot lag sakti hai.',
    wing: 'D',
    flat: 'D-101',
    area: 'Children Play Area',
  },
];

async function runTests() {
  console.log('🧪 Testing AI Triage on 10 Hinglish Complaints...\n');

  const existingComplaintsMock: IComplaint[] = [
    {
      complaintId: 'SP-2026-0002',
      originalText: 'Lift B band hai subah se',
      translatedText: 'Lift B broken since morning',
      language: 'hinglish',
      summary: 'Wing B elevator breakdown',
      category: 'lift',
      urgency: 'high',
      urgencyScore: 84,
      urgencyReason: 'Elevator breakdown',
      isSafetyRisk: false,
      status: 'assigned',
      wing: 'B',
      flatNumber: 'B-702',
      commonArea: 'Wing B Elevator',
      residentName: 'Kavita Joshi',
      reportCount: 1,
      duplicateOf: null,
      needsManualTriage: false,
      aiOverridden: false,
      slaDueAt: new Date(),
      timeline: [],
      internalNotes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  let passed = 0;

  for (let i = 0; i < testSamples.length; i++) {
    const sample = testSamples[i];
    console.log(`[Test ${i + 1}/10] ${sample.name}`);
    console.log(`  Input: "${sample.text}"`);

    const result = await triageComplaint(
      sample.text,
      sample.wing,
      sample.flat,
      sample.area,
      existingComplaintsMock
    );

    console.log(`  -> Language: ${result.language}`);
    console.log(`  -> Category: ${result.category}`);
    console.log(`  -> Urgency: ${result.urgency} (Score: ${result.urgencyScore})`);
    console.log(`  -> Safety Risk: ${result.isSafetyRisk ? '⚠️ YES' : 'No'}`);
    console.log(`  -> Translation: "${result.translatedText}"`);
    console.log(`  -> Summary: "${result.summary}"`);
    console.log(`  -> Suggested Role: ${result.suggestedAssigneeRole}`);
    if (result.duplicateOfId) {
      console.log(`  -> 🔗 DUPLICATE DETECTED: Linked to ${result.duplicateOfId} (Conf: ${result.duplicateConfidence})`);
    }
    console.log('------------------------------------------------------------');

    if (result.category && result.urgency && result.summary) {
      passed++;
    }
  }

  console.log(`\n🎉 Triage Test Results: ${passed}/10 tests succeeded!`);
}

runTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Test error:', e);
    process.exit(1);
  });
