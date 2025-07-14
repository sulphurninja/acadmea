import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';

// Get a single event by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

      const id = parseInt(params.id);

      if (isNaN(id)) {
        return NextResponse.json(
          { message: 'Invalid event ID' },
          { status: 400 }
        );
      }

      const event = await Event.findById(id).populate('classId', 'name');

      if (!event) {
        return NextResponse.json(
          { message: 'Event not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        event: {
          id: event._id,
          title: event.title,
          description: event.description,
          startTime: event.startTime,
          endTime: event.endTime,
          classId: event.classId?._id || event.classId,
          className: event.classId?.name || 'All Classes'
        }
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update an event
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

      // Only admins can update events
      if (decoded.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const id = parseInt(params.id);

      if (isNaN(id)) {
        return NextResponse.json(
          { message: 'Invalid event ID' },
          { status: 400 }
        );
      }

      const event = await Event.findById(id);

      if (!event) {
        return NextResponse.json(
          { message: 'Event not found' },
          { status: 404 }
        );
      }

      const data = await request.json();

      // Validate dates if provided
      if (data.startTime && data.endTime) {
        const startTime = new Date(data.startTime);
        const endTime = new Date(data.endTime);

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          return NextResponse.json(
            { message: 'Invalid date format' },
            { status: 400 }
          );
        }

        if (startTime >= endTime) {
          return NextResponse.json(
            { message: 'End time must be after start time' },
            { status: 400 }
          );
        }
      }

      // Update the event
      const updatedEvent = await Event.findByIdAndUpdate(
        id,
        {
          title: data.title || event.title,
          description: data.description || event.description,
          startTime: data.startTime ? new Date(data.startTime) : event.startTime,
          endTime: data.endTime ? new Date(data.endTime) : event.endTime,
          classId: data.classId !== undefined ? (data.classId ? parseInt(data.classId) : null) : event.classId
        },
        { new: true }
      ).populate('classId', 'name');

      return NextResponse.json({
        message: 'Event updated successfully',
        event: {
          id: updatedEvent._id,
          title: updatedEvent.title,
          description: updatedEvent.description,
          startTime: updatedEvent.startTime,
          endTime: updatedEvent.endTime,
          classId: updatedEvent.classId?._id || updatedEvent.classId,
          className: updatedEvent.classId?.name || 'All Classes'
        }
      });

    } catch (error) {
      console.error('JWT verification or event update error:', error);
      return NextResponse.json({
        message: 'Invalid token or event update failed',
        error: error.message
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// Delete an event
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

      // Only admins can delete events
      if (decoded.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const id = parseInt(params.id);

      if (isNaN(id)) {
        return NextResponse.json(
          { message: 'Invalid event ID' },
          { status: 400 }
        );
      }

      const event = await Event.findByIdAndDelete(id);

      if (!event) {
        return NextResponse.json(
          { message: 'Event not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Event deleted successfully'
      });

    } catch (error) {
      console.error('JWT verification or event deletion error:', error);
      return NextResponse.json({
        message: 'Invalid token or event deletion failed',
        error: error.message
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
