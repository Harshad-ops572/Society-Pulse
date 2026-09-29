import { NextRequest, NextResponse } from 'next/server';
import { getAllComplaints } from '@/lib/dataStore';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const complaints = await getAllComplaints();

    const headers = [
      'Complaint ID',
      'Created Date',
      'Wing',
      'Flat',
      'Common Area',
      'Resident Name',
      'Phone',
      'Category',
      'Urgency',
      'Urgency Score',
      'Safety Risk',
      'Status',
      'Assigned To',
      'Summary',
      'Original Text',
      'Duplicate Of',
      'Report Count',
      'SLA Due At',
      'Resolved At',
    ];

    const escapeCsv = (str: string | number | boolean | null | undefined): string => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = complaints.map((c) => [
      escapeCsv(c.complaintId),
      escapeCsv(new Date(c.createdAt).toISOString()),
      escapeCsv(c.wing),
      escapeCsv(c.flatNumber),
      escapeCsv(c.commonArea),
      escapeCsv(c.residentName),
      escapeCsv(c.phone),
      escapeCsv(c.category),
      escapeCsv(c.urgency),
      escapeCsv(c.urgencyScore),
      escapeCsv(c.isSafetyRisk ? 'Yes' : 'No'),
      escapeCsv(c.status),
      escapeCsv(c.assignedTo),
      escapeCsv(c.summary),
      escapeCsv(c.originalText),
      escapeCsv(c.duplicateOf),
      escapeCsv(c.reportCount),
      escapeCsv(c.slaDueAt ? new Date(c.slaDueAt).toISOString() : ''),
      escapeCsv(c.resolvedAt ? new Date(c.resolvedAt).toISOString() : ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="SocietyPulse_Complaints_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (err) {
    console.error('CSV Export error:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
