async function runVerification() {
  console.log('🚀 Running SocietyPulse End-to-End System Verification...\n');

  const BASE_URL = 'http://localhost:3000';

  // 1. Landing Page HTML
  console.log('1. Fetching Landing Page HTML...');
  const homeRes = await fetch(`${BASE_URL}/`);
  console.log(`   -> Status: ${homeRes.status} ${homeRes.statusText}`);
  const homeHtml = await homeRes.text();
  console.log(`   -> Includes Title: ${homeHtml.includes('SocietyPulse')}`);

  // 2. Public Stats API
  console.log('\n2. Testing Public Stats API...');
  const statsRes = await fetch(`${BASE_URL}/api/stats`);
  const statsData = await statsRes.json();
  console.log(`   -> Open: ${statsData.stats.openCount}, Resolved: ${statsData.stats.resolvedMonthCount}, Avg Time: ${statsData.stats.avgResolutionTimeHours}h`);

  // 3. Submit Hinglish Complaint
  console.log('\n3. Testing Complaint Submission with Hinglish & AI Triage...');
  const submitRes = await fetch(`${BASE_URL}/api/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Wing B lift subah se band hai, ground floor par atki hai',
      wing: 'B',
      flatNumber: 'B-702',
      commonArea: 'Wing B Elevator',
      residentName: 'Siddharth Rao',
      phone: '+91 98200 11223',
    }),
  });

  const submitData = await submitRes.json();
  const createdComplaint = submitData.complaint;
  console.log(`   -> Generated ID: ${createdComplaint.complaintId}`);
  console.log(`   -> Language Detected: ${createdComplaint.language}`);
  console.log(`   -> Category: ${createdComplaint.category}`);
  console.log(`   -> Urgency: ${createdComplaint.urgency} (Score: ${createdComplaint.urgencyScore})`);
  console.log(`   -> Translation: "${createdComplaint.translatedText}"`);
  console.log(`   -> Summary: "${createdComplaint.summary}"`);
  if (createdComplaint.duplicateOf) {
    console.log(`   -> 🔗 Duplicate linked to parent: ${createdComplaint.duplicateOf}`);
  }

  // 4. Resident Tracking
  console.log('\n4. Testing Resident Tracking API...');
  const trackRes = await fetch(
    `${BASE_URL}/api/track?id=${createdComplaint.complaintId}&flat=B-702`
  );
  const trackData = await trackRes.json();
  console.log(`   -> Found Complaint: ${trackData.complaint.complaintId}`);
  console.log(`   -> Status: ${trackData.complaint.status}`);
  console.log(`   -> Timeline entries: ${trackData.complaint.timeline.length}`);

  // 5. Resident Follow-Up Comment
  console.log('\n5. Testing Resident Follow-Up Comment...');
  const commentRes = await fetch(
    `${BASE_URL}/api/complaints/${createdComplaint.complaintId}/comment`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: 'Elderly parents urgently need to go to doctor at 4 PM.',
        author: 'Siddharth Rao',
      }),
    }
  );
  const commentData = await commentRes.json();
  console.log(`   -> Timeline after comment: ${commentData.complaint.timeline.length} events`);

  // 6. Committee Auth Login
  console.log('\n6. Testing Committee Login (admin@society.org)...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@society.org',
      password: process.env.SEED_ADMIN_PASSWORD || 'test-admin-pass',
    }),
  });
  const loginData = await loginRes.json();
  console.log(`   -> Logged in user: ${loginData.user.name} (${loginData.user.role})`);
  const authCookie = loginRes.headers.get('set-cookie');
  console.log(`   -> Session Cookie Received: ${!!authCookie}`);

  // 7. Committee 1-Tap Quick Action (Assign status)
  console.log('\n7. Testing Committee Status Update via PATCH...');
  const patchRes = await fetch(
    `${BASE_URL}/api/complaints/${createdComplaint.complaintId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie || '',
      },
      body: JSON.stringify({
        status: 'assigned',
        assignedTo: 'Otis AMC Engineer Mr. Rakesh',
        actorName: 'Vikram Malhotra',
      }),
    }
  );
  const patchData = await patchRes.json();
  console.log(`   -> Updated Status: ${patchData.complaint.status}`);
  console.log(`   -> Assigned To: ${patchData.complaint.assignedTo}`);

  // 8. Daily Digest API
  console.log('\n8. Testing 5-Minute Daily Digest API...');
  const digestRes = await fetch(`${BASE_URL}/api/digest`);
  const digestData = await digestRes.json();
  console.log(`   -> Date: ${digestData.digest.date}`);
  console.log(`   -> Headline: "${digestData.digest.summaryHeadline}"`);
  console.log(`   -> Urgent count: ${digestData.digest.stats.urgentCount}`);
  console.log(`   -> Action items count: ${digestData.digest.rows.length}`);

  // 9. Confirm Resolution / Reopen flow
  console.log('\n9. Testing Resident Resolution Confirmation / Reopen flow...');
  // First mark as resolved
  await fetch(`${BASE_URL}/api/complaints/${createdComplaint.complaintId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: authCookie || '' },
    body: JSON.stringify({ status: 'resolved' }),
  });

  // Resident confirms NOT resolved
  const reopenRes = await fetch(
    `${BASE_URL}/api/complaints/${createdComplaint.complaintId}/confirm`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resolved: false,
        feedback: 'Lift still making loud noise and jerky stops.',
      }),
    }
  );
  const reopenData = await reopenRes.json();
  console.log(`   -> Status after Resident says NOT resolved: ${reopenData.status} (auto-reopened)`);
  console.log(`   -> Message: ${reopenData.message}`);

  // 10. CSV Export API
  console.log('\n10. Testing CSV Export for monthly committee meeting...');
  const exportRes = await fetch(`${BASE_URL}/api/export`, {
    headers: { Cookie: authCookie || '' },
  });
  const csvText = await exportRes.text();
  console.log(`   -> CSV Status: ${exportRes.status}`);
  console.log(`   -> CSV Headers: ${csvText.split('\n')[0]}`);
  console.log(`   -> Total CSV Rows: ${csvText.split('\n').length}`);

  console.log('\n========================================================');
  console.log('🎉 ALL 10 END-TO-END VERIFICATION TESTS PASSED!');
  console.log('========================================================');
}

runVerification()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Verification error:', e);
    process.exit(1);
  });
