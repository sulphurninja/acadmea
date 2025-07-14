import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Class from '@/models/Class';
import Subject from '@/models/Subject';
import Event from '@/models/Event';
import Announcement from '@/models/Announcement';

export async function GET() {
  try {
    await connectToDatabase();

    // Count total documents in each collection
    const students = await User.countDocuments({ role: 'student' });
    const teachers = await User.countDocuments({ role: 'teacher' });
    const parents = await User.countDocuments({ role: 'parent' });
    const classes = await Class.countDocuments();
    const subjects = await Subject.countDocuments();
    const events = await Event.countDocuments();
    const announcements = await Announcement.countDocuments();

    return NextResponse.json({
      students,
      teachers,
      parents,
      classes,
      subjects,
      events,
      announcements
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
