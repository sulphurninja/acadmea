import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Timetable from '@/models/timetable';
import Class from '@/models/Class';
import Grade from '@/models/Grade';
import { startOfWeek, addDays, format, parse } from 'date-fns';

// Get schedule
export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // Authenticate user
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

      // Get URL parameters
      const url = new URL(request.url);
      const weekParam = url.searchParams.get('week');
      const sectionId = url.searchParams.get('sectionId');
      const teacherId = url.searchParams.get('teacherId');

      // Build query
      const query: any = {};

      if (sectionId) {
        query.sectionId = parseInt(sectionId);
      }

      if (teacherId) {
        // If we had a teacher-subject relationship, we could filter by teacher here
        // For now, we'll just return all timetable entries
      }

      // Fetch timetable entries
      const timetableEntries = await Timetable.find(query).sort({ day: 1, startTime: 1 });

      // Populate section details
      const populatedEntries = await Promise.all(timetableEntries.map(async (entry) => {
        const section = await Class.findById(entry.sectionId);
        const grade = section ? await Grade.findById(section.gradeId) : null;

        return {
          id: entry._id,
          day: entry.day,
          startTime: entry.startTime,
          endTime: entry.endTime,
          subject: entry.subject,
          className: grade ? grade.level.toString() : 'Unknown',
          section: section ? section.name.split('-')[1] || section.name : 'Unknown',
          teacherName: entry.teacherName
        };
      }));

      // Group by day
      const weeklySchedule: { [key: string]: any[] } = {};

      // Initialize all days
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      days.forEach(day => {
        weeklySchedule[day] = [];
      });

      // Fill in the schedule
      populatedEntries.forEach(entry => {
        if (days.includes(entry.day)) {
          weeklySchedule[entry.day].push(entry);
        }
      });

      // Sort each day's entries by start time
      Object.keys(weeklySchedule).forEach(day => {
        weeklySchedule[day].sort((a, b) => {
          return a.startTime.localeCompare(b.startTime);
        });
      });

      return NextResponse.json(weeklySchedule);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create timetable entry
export async function POST(request: Request) {
  try {
    await connectToDatabase();

    // Authenticate admin
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

      if (decoded.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const data = await request.json();
      console.log("Creating timetable entry with data:", data);

      // Validate required fields
      if (!data.classId || !data.day || !data.startTime || !data.endTime || !data.subject || !data.teacherName) {
        return NextResponse.json(
          { message: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Validate time format (HH:MM)
      const timeFormat = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeFormat.test(data.startTime) || !timeFormat.test(data.endTime)) {
        return NextResponse.json(
          { message: 'Time must be in 24-hour format (HH:MM)' },
          { status: 400 }
        );
      }

      // Validate day
      const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      if (!validDays.includes(data.day)) {
        return NextResponse.json(
          { message: 'Invalid day' },
          { status: 400 }
        );
      }

      // Check if section exists
      const section = await Class.findById(parseInt(data.classId));
      if (!section) {
        return NextResponse.json(
          { message: 'Section not found' },
          { status: 404 }
        );
      }

      // Check for scheduling conflicts
      const conflictingEntry = await Timetable.findOne({
        sectionId: data.classId,
        day: data.day,
        $or: [
          // New class starts during an existing class
          {
            startTime: { $lte: data.startTime },
            endTime: { $gt: data.startTime }
          },
          // New class ends during an existing class
          {
            startTime: { $lt: data.endTime },
            endTime: { $gte: data.endTime }
          },
          // New class completely contains an existing class
          {
            startTime: { $gte: data.startTime },
            endTime: { $lte: data.endTime }
          }
        ]
      });

      if (conflictingEntry) {
        return NextResponse.json(
          { message: 'There is a scheduling conflict with another class at this time' },
          { status: 400 }
        );
      }

      // Create new timetable entry
      const newEntry = new Timetable({
        sectionId: parseInt(data.classId),
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        subject: data.subject,
        teacherName: data.teacherName
      });

      await newEntry.save();

      return NextResponse.json(
        { message: 'Timetable entry created successfully', entry: newEntry },
        { status: 201 }
      );

    } catch (error) {
      console.error('JWT verification or timetable creation error:', error);
      return NextResponse.json({
        message: 'Invalid token or timetable creation failed',
        error: error.message
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating timetable entry:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
