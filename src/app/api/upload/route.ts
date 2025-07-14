import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const contentLength = request.headers.get('content-length');
    const maxSize = 50 * 1024 * 1024; // 50 MB limit

    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds limit' },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[]; // Specify File[] type
    const audio = formData.get('audio') as File | null; // Specify File or null type

    if (!files.length && !audio) {
      return NextResponse.json({ error: 'No files or audio uploaded' }, { status: 400 });
    }

    const fileUrls: string[] = [];
    let audioUrl: string | null = null;

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: `uploads/${Date.now()}-${file.name}`,
        Body: buffer,
        ContentType: file.type,
      };

      const command = new PutObjectCommand(uploadParams);
      await s3.send(command);

      const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
      fileUrls.push(fileUrl);
    }

    if (audio) {
      const audioBuffer = await audio.arrayBuffer();
      const buffer = Buffer.from(audioBuffer);

      const audioUploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: `uploads/audio/${Date.now()}-${audio.name}`,
        Body: buffer,
        ContentType: audio.type,
      };

      const audioCommand = new PutObjectCommand(audioUploadParams);
      await s3.send(audioCommand);

      audioUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${audioUploadParams.Key}`;
    }

    return NextResponse.json({ message: 'Files uploaded successfully', fileUrls, audioUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
  }
}
