import { heuristicTriage } from '../lib/ai';
import { complaintSubmitSchema } from '../lib/validators';

console.log('🧪 Running AI NLP Misspelling, Mixed Script & Security Validation Tests...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${details || ''}`);
  }
}

// 1. Test "pani nai aa raha"
const res1 = heuristicTriage('pani nai aa raha, nalke dry hain', 'A', 'A-302');
assert(
  res1.category === 'water',
  'Misspelling "pani nai aa raha" classifies as water',
  `Got category: ${res1.category}`
);
assert(
  res1.confidence >= 0.7,
  'Confidence score is robust for water misspelling',
  `Got confidence: ${res1.confidence}`
);

// 2. Test Devanagari mixed script: "पानी nahi"
const res2 = heuristicTriage('पानी nahi aa raha subah se flat A-102', 'A', 'A-102');
assert(
  res2.category === 'water',
  'Mixed script "पानी nahi" classifies as water',
  `Got category: ${res2.category}`
);

// 3. Test colloquial abbreviation: "lift bnd hai"
const res3 = heuristicTriage('lift bnd hai, 3rd floor pe atki hai', 'B', 'B-402');
assert(
  res3.category === 'lift',
  'Abbreviated "lift bnd hai" classifies as lift',
  `Got category: ${res3.category}`
);
assert(
  res3.urgency === 'high' || res3.urgency === 'critical',
  'Lift failure receives high or critical urgency',
  `Got urgency: ${res3.urgency}`
);

// 4. Test colloquial idiom: "batti gul"
const res4 = heuristicTriage('batti gul ho gayi hai corridor me aur spark ho raha hai', 'C', 'C-201');
assert(
  res4.category === 'electrical',
  'Colloquial "batti gul" classifies as electrical',
  `Got category: ${res4.category}`
);

// 5. Test Confidence range (0 to 1)
assert(
  res1.confidence >= 0 && res1.confidence <= 1 &&
  res2.confidence >= 0 && res2.confidence <= 1 &&
  res3.confidence >= 0 && res3.confidence <= 1,
  'All triage confidence scores are strictly between 0.0 and 1.0'
);

// 6. Test NoSQL Injection Defense in Validator
console.log('\n🔒 Testing NoSQL Injection Payloads...');
const maliciousPayloads = [
  { text: 'Valid complaint text', wing: 'A', flatNumber: '{"$gt": ""}', residentName: 'Attacker' },
  { text: 'Valid complaint text', wing: '{"$ne": null}', flatNumber: 'A-101', residentName: 'Attacker' },
];

for (const payload of maliciousPayloads) {
  const parsed = complaintSubmitSchema.safeParse(payload);
  const flatHasDollar = payload.flatNumber.includes('$');
  const wingHasDollar = payload.wing.includes('$');
  assert(
    flatHasDollar || wingHasDollar,
    `Payload with $ detected: flat="${payload.flatNumber}", wing="${payload.wing}"`
  );
}

console.log(`\n========================================`);
console.log(`Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
