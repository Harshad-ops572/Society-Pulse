import { NextRequest, NextResponse } from 'next/server';
import { getComplaintByReadableId } from '@/lib/dataStore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit('track', ip, 30, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many status lookups. Please wait a minute.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const flat = searchParams.get('flat');

    if (!id || id.trim() === '') {
      return NextResponse.json({ error: 'Complaint ID is required' }, { status: 400 });
    }

    // Reject NoSQL injection characters ($)
    if (id.includes('$') || (flat && flat.includes('$'))) {
      return NextResponse.json({ error: 'Invalid search parameters' }, { status: 400 });
    }

    const complaint = await getComplaintByReadableId(id.trim());
    if (!complaint) {
      return NextResponse.json(
        { error: 'No complaint found with this ID. Please double check the ID format (e.g. SP-2026-0001).' },
        { status: 404 }
      );
    }

    // If flat number is provided, verify it matches
    if (flat && flat.trim() !== '') {
      const cleanFlat = flat.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const complaintFlat = complaint.flatNumber.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (!complaintFlat.includes(cleanFlat) && !cleanFlat.includes(complaintFlat)) {
        return NextResponse.json(
          {
            error: `Flat number does not match record for ${complaint.complaintId}. Please enter the correct flat number.`,
          },
          { status: 403 }
        );
      }
    }

    // Strip internal notes and phone numbers for public tracking
    const sanitizedComplaint = {
      ...complaint,
      phone: '',
      internalNotes: [],
    };

    return NextResponse.json({
      success: true,
      complaint: sanitizedComplaint,
    });
  } catch (err) {
    console.error('Track API error:', err);
    return NextResponse.json({ error: 'Failed to look up complaint' }, { status: 500 });
  }
}

