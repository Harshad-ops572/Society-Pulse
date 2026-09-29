import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import AttachmentModel from '@/models/Attachment';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid attachment ID' }, { status: 400 });
    }

    await connectDB();
    const attachment = await AttachmentModel.findById(id).lean();

    if (!attachment || !attachment.data) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const isThumb = searchParams.get('thumb') === '1';

    // Set immutable caching headers
    const headers = new Headers();
    headers.set('Content-Type', attachment.contentType || 'image/webp');
    headers.set('Content-Length', attachment.size.toString());
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('X-Content-Type-Options', 'nosniff');

    const buffer = Buffer.isBuffer(attachment.data)
      ? attachment.data
      : Buffer.from((attachment.data as any).buffer || attachment.data);

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('Fetch attachment error:', err);
    return NextResponse.json({ error: 'Failed to retrieve attachment' }, { status: 500 });
  }
}
