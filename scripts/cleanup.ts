import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { connectDB } from '../lib/db';
import ComplaintModel from '../models/Complaint';
import AttachmentModel from '../models/Attachment';
import { deleteComplaintsWithAttachments, RESOLVED_STATUSES } from '../lib/data/complaints';

async function main() {
  const args = process.argv.slice(2);
  const isDemo = args.includes('--demo');
  const isConfirm = args.includes('--confirm');

  let resolvedDays: number | null = null;
  for (const arg of args) {
    if (arg.startsWith('--resolved-older-than=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (!isNaN(val) && val > 0) {
        resolvedDays = val;
      }
    }
  }

  if (!isDemo && resolvedDays === null) {
    console.log(`
SocietyPulse Data Cleanup Utility
==================================
Usage:
  npm run cleanup -- --demo                     Dry-run preview of demo data cleanup
  npm run cleanup -- --demo --confirm           Permanently delete all demo data & attachments
  npm run cleanup -- --resolved-older-than=30   Dry-run preview of resolved tickets older than 30 days
  npm run cleanup -- --resolved-older-than=30 --confirm   Permanently delete resolved tickets older than 30 days
    `);
    process.exit(0);
  }

  console.log('🔄 Connecting to MongoDB database...');
  await connectDB();

  const filter: Record<string, any> = {};

  if (isDemo) {
    filter.isDemo = true;
  }
  if (resolvedDays !== null) {
    const cutOff = new Date(Date.now() - resolvedDays * 24 * 60 * 60 * 1000);
    filter.status = { $in: RESOLVED_STATUSES };
    filter.resolvedAt = { $lte: cutOff };
  }

  // 1. Identify target complaints
  const targets = await ComplaintModel.find(filter).select('complaintId attachmentId status isDemo').lean();
  const attachmentIds = targets
    .map((t) => t.attachmentId)
    .filter((id): id is string => Boolean(id && typeof id === 'string' && id.trim().length > 0));

  const totalAttachments = attachmentIds.length > 0
    ? await AttachmentModel.countDocuments({ _id: { $in: attachmentIds } })
    : 0;

  console.log(`\n📋 Target Records Found:`);
  console.log(`   - Filter: ${JSON.stringify(filter)}`);
  console.log(`   - Complaints Matched: ${targets.length}`);
  console.log(`   - Linked Attachments Matched: ${totalAttachments}`);

  if (!isConfirm) {
    console.log(`\n⚠️  [DRY RUN MODE]: No records were modified or deleted.`);
    console.log(`   To execute permanent deletion, append the '--confirm' flag:`);
    console.log(`   npm run cleanup -- ${args.join(' ')} --confirm\n`);
    process.exit(0);
  }

  // 2. Execute deletion
  console.log(`\n⚡ Executing permanent deletion with orphan cleanup...`);
  const result = await deleteComplaintsWithAttachments(
    filter,
    { name: 'CLI Administrator', role: 'admin' },
    `CLI data cleanup (${isDemo ? 'demo records' : ''} ${resolvedDays ? `resolved older than ${resolvedDays} days` : ''})`,
    isDemo ? 'demo' : 'complaint'
  );

  console.log(`\n✅ Deletion Complete!`);
  console.log(`   - Complaints Deleted: ${result.deletedCount}`);
  console.log(`   - Attachments Purged: ${result.attachmentCount}`);
  console.log(`   - Audit log recorded successfully.\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Cleanup script error:', err);
  process.exit(1);
});
