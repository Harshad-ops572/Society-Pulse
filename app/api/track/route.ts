import { NextRequest, NextResponse } from 'next/server';
import { getComplaintByReadableId } from '@/lib/dataStore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const flat = searchParams.get('flat');

    if (!id || id.trim() === '') {
      return NextResponse.json({ error: 'Complaint ID is required' }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      complaint,
    });
  } catch (err) {
    console.error('Track API error:', err);
    return NextResponse.json({ error: 'Failed to look up complaint' }, { status: 500 });
  }
}
