import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Timetable from '@/models/timetable';

// Get a specific timetable entry
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    // Authenticate
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

      const entry = await Timetable.findById(params.id);

      if (!entry) {
        return NextResponse.json({ message: 'Timetable entry not found' }, { status: 404 });
      }

      return NextResponse.json(entry);

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching timetable entry:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a timetable entry
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

      // Validate required fields
      if (!data.sectionId || !data.day || !data.startTime || !data.endTime || !data.subject || !data.room) {
        return NextResponse.json(
          { message: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Check for scheduling conflicts (excluding this entry)
      const conflictingEntry = await Timetable.findOne({
        _id: { $ne: params.id },
        sectionId: data.sectionId,
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

      // Update the entry
      const updatedEntry = await Timetable.findByIdAndUpdate(
        params.id,
        {
          sectionId: data.sectionId,
          day: data.day,
          startTime: data.startTime,
          endTime: data.endTime,
          subject: data.subject,
          room: data.room
        },
        { new: true }
      );

      if (!updatedEntry) {
        return NextResponse.json({ message: 'Timetable entry not found' }, { status: 404 });
      }

      return NextResponse.json({
        message: 'Timetable entry updated successfully',
        entry: updatedEntry
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error updating timetable entry:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a timetable entry
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

      const deletedEntry = await Timetable.findByIdAndDelete(params.id);

      if (!deletedEntry) {
        return NextResponse.json({ message: 'Timetable entry not found' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Timetable entry deleted successfully' });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error deleting timetable entry:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
