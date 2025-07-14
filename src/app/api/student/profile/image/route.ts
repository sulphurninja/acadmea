import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Student from '@/models/Student';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    // Authenticate student
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded: any = jwtDecode(token);

      if (decoded.exp * 1000 < Date.now()) {
        return NextResponse.json({ message: 'Token expired' }, { status: 401 });
      }

      if (decoded.role !== 'student') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const studentId = decoded.id;
      const formData = await request.formData();
      const file = formData.get('image') as File;

      if (!file) {
        return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({
          message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
        }, { status: 400 });
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({
          message: 'File size too large. Maximum 5MB allowed.'
        }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create unique filename
      const timestamp = Date.now();
      const extension = path.extname(file.name);
      const filename = `student-${studentId}-${timestamp}${extension}`;

      // Save to public/uploads/students directory
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'students');
      const filePath = path.join(uploadDir, filename);

      try {
        await writeFile(filePath, buffer);
      } catch (error) {
        console.error('Error writing file:', error);
        return NextResponse.json({
          message: 'Failed to save file'
        }, { status: 500 });
      }

      const imageUrl = `/uploads/students/${filename}`;

      // Update student profile with new image URL
      await Student.findByIdAndUpdate(studentId, { img: imageUrl });

      return NextResponse.json({
        message: 'Image uploaded successfully',
        imageUrl
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
