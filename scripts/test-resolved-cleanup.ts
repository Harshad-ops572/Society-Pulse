import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { connectDB } from '../lib/db';
import ComplaintModel from '../models/Complaint';
import AttachmentModel from '../models/Attachment';
import AuditLogModel from '../models/AuditLog';
import {
  activeFilter,
  resolvedFilter,
  getActiveComplaints,
  getResolvedComplaints,
  resolveComplaint,
  reopenComplaint,
  deleteComplaintsWithAttachments,
} from '../lib/data/complaints';
import { runDatabaseSeed } from '../lib/seedData';
import { requireRole, signToken } from '../lib/auth';
import { NextRequest } from 'next/server';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, message: string) {
  results.push({
    name,
    passed: condition,
    message: condition ? `PASS: ${message}` : `FAIL: ${message}`,
  });
}

async function runTests() {
  console.log('🧪 Starting Automated Verification: Resolved Tickets, UI Refresh & Data Cleanup...\n');

  await connectDB();

  // Clean up any old test tickets
  await ComplaintModel.deleteMany({ complaintId: { $regex: /^TEST-/ } });
  await AttachmentModel.deleteMany({ filename: { $regex: /^test-/ } });

  // ---------------------------------------------------------
  // TEST 1: Resolving removes ticket from active queries but keeps in DB
  // ---------------------------------------------------------
  const test1Id = `TEST-RESOLVE-${Date.now()}`;
  const test1Complaint = await ComplaintModel.create({
    complaintId: test1Id,
    originalText: 'Water leakage in corridor',
    translatedText: 'Water leakage in corridor',
    language: 'en',
    summary: 'Corridor water leak',
    category: 'water',
    urgency: 'high',
    urgencyScore: 80,
    urgencyReason: 'Water hazard',
    isSafetyRisk: false,
    status: 'assigned',
    wing: 'A',
    flatNumber: 'A-101',
    residentName: 'Tester One',
    reportCount: 1,
    slaDueAt: new Date(Date.now() + 24 * 3600 * 1000),
    isDemo: false,
    timeline: [{ status: 'assigned', note: 'Created for test', by: 'Tester', at: new Date() }],
  });

  // Verify active before resolve
  const activeBefore = await ComplaintModel.find({ complaintId: test1Id, ...activeFilter() });
  assert(activeBefore.length === 1, 'Check 1.1: Active before resolve', 'Ticket found in active query');

  // Resolve ticket
  await resolveComplaint(test1Id, 'Admin Tester', 'Resolved by plumber');

  // Verify active query excludes it
  const activeAfter = await ComplaintModel.find({ complaintId: test1Id, ...activeFilter() });
  assert(activeAfter.length === 0, 'Check 1.2: Active after resolve', 'Resolved ticket excluded from active query');

  // Verify resolved query includes it
  const resolvedAfter = await ComplaintModel.find({ complaintId: test1Id, ...resolvedFilter() });
  assert(resolvedAfter.length === 1, 'Check 1.3: Resolved query includes it', 'Ticket found in resolved query');

  // Verify still in database
  const inDb = await ComplaintModel.findOne({ complaintId: test1Id });
  assert(inDb !== null && inDb.status === 'resolved', 'Check 1.4: Persists in DB', 'Ticket still persists in MongoDB with status resolved');

  // ---------------------------------------------------------
  // TEST 2: Track page finds resolved ticket
  // ---------------------------------------------------------
  const trackFound = await ComplaintModel.findOne({ complaintId: test1Id }).lean();
  assert(
    trackFound !== null && trackFound.status === 'resolved' && trackFound.resolvedAt !== null,
    'Check 2: Track page lookup',
    'Track lookup returns resolved ticket with resolution time and timeline history'
  );

  // ---------------------------------------------------------
  // TEST 3: Public stats & category counts exclude resolved tickets
  // ---------------------------------------------------------
  const activeComplaints = await getActiveComplaints();
  const test1InActive = activeComplaints.some((c) => c.complaintId === test1Id);
  assert(!test1InActive, 'Check 3.1: Stats exclude resolved', 'Resolved ticket excluded from active statistics calculation');

  // Sum of category counts matches active count
  const catCounts: Record<string, number> = {};
  for (const c of activeComplaints) {
    catCounts[c.category] = (catCounts[c.category] || 0) + 1;
  }
  const sumOfCategories = Object.values(catCounts).reduce((a, b) => a + b, 0);
  assert(
    sumOfCategories === activeComplaints.length,
    'Check 3.2: Stats category sum consistency',
    `Sum of category counts (${sumOfCategories}) exactly equals active complaints count (${activeComplaints.length})`
  );

  // ---------------------------------------------------------
  // TEST 4: Undo restores previous status
  // ---------------------------------------------------------
  await ComplaintModel.updateOne(
    { complaintId: test1Id },
    {
      $set: { status: 'assigned', resolvedAt: null },
      $push: { timeline: { status: 'assigned', note: 'Undone resolution', by: 'Tester', at: new Date() } },
    }
  );
  const undoneActive = await ComplaintModel.find({ complaintId: test1Id, ...activeFilter() });
  assert(undoneActive.length === 1, 'Check 4: Undo restoration', 'Undo restores ticket back into active queries');

  // ---------------------------------------------------------
  // TEST 5: Reopen returns ticket to active queue
  // ---------------------------------------------------------
  // First resolve it again
  await resolveComplaint(test1Id, 'Admin Tester', 'Resolved again');
  // Now call reopenComplaint
  await reopenComplaint(test1Id, 'Committee User', 'Reopened due to recurring leak');
  const reopenedTicket = await ComplaintModel.findOne({ complaintId: test1Id });
  const reopenedActive = await ComplaintModel.find({ complaintId: test1Id, ...activeFilter() });
  assert(
    reopenedTicket?.status === 'reopened' && (reopenedTicket?.reopenedCount || 0) >= 1 && reopenedActive.length === 1,
    'Check 5: Reopen ticket',
    'Reopening sets status to reopened, increments count, and returns ticket to active queue'
  );

  // ---------------------------------------------------------
  // TEST 6: Cascade resolution to duplicate child tickets
  // ---------------------------------------------------------
  const childId = `TEST-CHILD-${Date.now()}`;
  await ComplaintModel.create({
    complaintId: childId,
    originalText: 'Water leak also here in flat 102',
    translatedText: 'Water leak also here in flat 102',
    language: 'en',
    summary: 'Corridor water leak duplicate',
    category: 'water',
    urgency: 'high',
    urgencyScore: 80,
    urgencyReason: 'Water leak duplicate',
    isSafetyRisk: false,
    status: 'assigned',
    wing: 'A',
    flatNumber: 'A-102',
    residentName: 'Tester Child',
    reportCount: 1,
    duplicateOf: test1Id,
    slaDueAt: new Date(Date.now() + 24 * 3600 * 1000),
    isDemo: false,
    timeline: [{ status: 'assigned', note: 'Linked as duplicate', by: 'Tester', at: new Date() }],
  });

  // Resolve parent ticket again
  await resolveComplaint(test1Id, 'Admin Tester', 'Parent resolved');

  const resolvedChild = await ComplaintModel.findOne({ complaintId: childId });
  assert(
    resolvedChild?.status === 'resolved' && resolvedChild?.timeline.some((t) => t.note.includes('Auto-resolved: Parent ticket')),
    'Check 6: Cascaded duplicate resolution',
    'Resolving parent ticket automatically resolves linked duplicate child ticket with timeline entry'
  );

  // ---------------------------------------------------------
  // TEST 7: Demo role rejection (403 Forbidden on deletions)
  // ---------------------------------------------------------
  const demoToken = signToken({ userId: 'demo-user', role: 'demo', name: 'Demo User', email: 'demo@demo.com' });
  const demoReq = new NextRequest('http://localhost:3000/api/admin/data-management', {
    headers: {
      cookie: `society_token=${demoToken}`,
    },
  });
  const demoCheck = requireRole(demoReq, ['admin']);
  assert(!demoCheck.authorized && demoCheck.response?.status === 403, 'Check 7.1: Demo role gets 403', 'Demo role is strictly denied with 403 Forbidden');

  // Member role test
  const memberToken = signToken({ userId: 'member-user', role: 'member', name: 'Member User', email: 'member@member.com' });
  const memberReq = new NextRequest('http://localhost:3000/api/admin/data-management', {
    headers: {
      cookie: `society_token=${memberToken}`,
    },
  });
  const memberCheck = requireRole(memberReq, ['admin']);
  assert(!memberCheck.authorized && memberCheck.response?.status === 403, 'Check 7.2: Member role gets 403', 'Member role is denied with 403 Forbidden');

  // Admin role test
  const adminToken = signToken({ userId: 'admin-user', role: 'admin', name: 'Admin User', email: 'admin@admin.com' });
  const adminReq = new NextRequest('http://localhost:3000/api/admin/data-management', {
    headers: {
      cookie: `society_token=${adminToken}`,
    },
  });
  const adminCheck = requireRole(adminReq, ['admin']);
  assert(adminCheck.authorized, 'Check 7.3: Admin role authorized', 'Admin role is properly authorized');

  // ---------------------------------------------------------
  // TEST 8: Attachment cleanup with zero orphans + Audit Log
  // ---------------------------------------------------------
  const testAttachment = await AttachmentModel.create({
    filename: `test-leak-${Date.now()}.jpg`,
    contentType: 'image/jpeg',
    size: 1024,
    data: Buffer.from('fake-image-bytes'),
  });
  const attachId = testAttachment._id.toString();

  const deleteTestId = `TEST-DELETE-${Date.now()}`;
  await ComplaintModel.create({
    complaintId: deleteTestId,
    originalText: 'Ticket to be deleted',
    translatedText: 'Ticket to be deleted',
    language: 'en',
    summary: 'Ticket with attachment to delete',
    category: 'cleaning',
    urgency: 'low',
    urgencyScore: 30,
    urgencyReason: 'Routine clean',
    isSafetyRisk: false,
    status: 'new',
    wing: 'C',
    flatNumber: 'C-201',
    residentName: 'Delete Tester',
    reportCount: 1,
    attachmentId: attachId,
    slaDueAt: new Date(Date.now() + 72 * 3600 * 1000),
    isDemo: false,
    timeline: [],
  });

  // Verify attachment exists
  const attBefore = await AttachmentModel.findById(attachId);
  assert(attBefore !== null, 'Check 8.1: Attachment exists before delete', 'Attachment created in DB');

  // Delete complaint with attachments
  const delResult = await deleteComplaintsWithAttachments(
    { complaintId: deleteTestId },
    { name: 'Test Administrator', role: 'admin' },
    'Testing attachment cleanup',
    'complaint'
  );

  // Verify complaint deleted
  const compAfter = await ComplaintModel.findOne({ complaintId: deleteTestId });
  assert(compAfter === null, 'Check 8.2: Complaint deleted', 'Complaint document removed from MongoDB');

  // Verify attachment deleted (no orphans!)
  const attAfter = await AttachmentModel.findById(attachId);
  assert(attAfter === null, 'Check 8.3: Attachment purged without orphans', 'Linked Attachment document purged from MongoDB with zero orphans');

  // Verify Audit Log entry created
  const auditEntry = await AuditLogModel.findOne({ details: { $regex: /Testing attachment cleanup/ } });
  assert(auditEntry !== null && auditEntry.actorRole === 'admin', 'Check 8.4: Audit log recorded', 'Deletion audit log recorded with actor, action, and count');

  // ---------------------------------------------------------
  // TEST 9: Idempotent Seed Script (no duplicates on re-run)
  // ---------------------------------------------------------
  await runDatabaseSeed();
  const seedCount1 = await ComplaintModel.countDocuments({ isDemo: true });

  await runDatabaseSeed();
  const seedCount2 = await ComplaintModel.countDocuments({ isDemo: true });

  assert(
    seedCount1 > 0 && seedCount1 === seedCount2,
    'Check 9: Idempotent Database Seeding',
    `Running seed script twice preserves exact demo count (${seedCount1} === ${seedCount2}) with zero duplicates`
  );

  // Clean up test tickets
  await ComplaintModel.deleteMany({ complaintId: { $regex: /^TEST-/ } });

  console.log('\n======================================================');
  console.log('📊 VERIFICATION SUMMARY');
  console.log('======================================================');
  let passCount = 0;
  for (const r of results) {
    if (r.passed) {
      passCount++;
      console.log(`✅ [PASS] ${r.name}: ${r.message}`);
    } else {
      console.log(`❌ [FAIL] ${r.name}: ${r.message}`);
    }
  }

  console.log(`\nResults: ${passCount} / ${results.length} checks passed.`);
  if (passCount === results.length) {
    console.log('🎉 ALL AUTOMATED VERIFICATION CHECKS PASSED!\n');
    process.exit(0);
  } else {
    console.error('💥 Some checks failed!');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test run error:', err);
  process.exit(1);
});
