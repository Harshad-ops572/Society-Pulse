import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import AttachmentModel from '@/models/Attachment';
import fs from 'fs';
import path from 'path';

// Check magic bytes to securely verify genuine image formats
function detectImageType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF .... WEBP
  const isRiff =
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
  const isWebp =
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  if (isRiff && isWebp) {
    return 'image/webp';
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Enforce strict 1MB size limit
    const MAX_SIZE = 1024 * 1024; // 1 MB
    if (buffer.length > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Image size exceeds maximum allowed limit of 1MB' },
        { status: 400 }
      );
    }

    // 2. Verify magic bytes
    const detectedType = detectImageType(buffer);
    if (!detectedType) {
      return NextResponse.json(
        { error: 'Invalid file format. Only verified JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // 3. Save into MongoDB Attachment collection
    try {
      await connectDB();
      const attachment = await AttachmentModel.create({
        data: buffer,
        contentType: detectedType,
        size: buffer.length,
        filename: safeFilename,
      });

      const attachmentId = attachment._id.toString();
      const url = `/api/attachments/${attachmentId}`;

      return NextResponse.json({
        success: true,
        attachmentId,
        url,
      });
    } catch (dbErr) {
      console.warn('MongoDB attachment storage failed, falling back to filesystem/data URI:', dbErr);

      // Local / Offline fallback
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadsDir, safeFilename), buffer);

      return NextResponse.json({
        success: true,
        attachmentId: safeFilename,
        url: `/uploads/${safeFilename}`,
      });
    }
  } catch (err) {
    console.error('Upload handler error:', err);
    return NextResponse.json(
      { error: 'Failed to upload photo. Complaint will be saved without photo.' },
      { status: 500 }
    );
  }
}
