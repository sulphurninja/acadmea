import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';
import mongoose from 'mongoose';

// Get all events with filtering options
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

      // Get URL params for pagination and filtering
      const url = new URL(request.url);
      const classId = url.searchParams.get('classId');
      const searchQuery = url.searchParams.get('search');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      // Build query
      const query: any = {};
      if (classId) query.classId = parseInt(classId);
      if (searchQuery) query.title = { $regex: searchQuery, $options: 'i' };

      // Date range filtering
      if (startDate || endDate) {
        query.startTime = {};
        if (startDate) query.startTime.$gte = new Date(startDate);
        if (endDate) query.startTime.$lte = new Date(endDate);
      }

      // Get total count for pagination
      const total = await Event.countDocuments(query);

      // Get events with pagination
      const events = await Event.find(query)
        .sort({ startTime: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('classId', 'name');

      // Format the response
      const formattedEvents = events.map(event => ({
        id: event._id,
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        classId: event.classId?._id || event.classId,
        className: event.classId?.name || 'All Classes'
      }));

      return NextResponse.json({
        events: formattedEvents,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new event
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

      // Only admins can create events
      if (decoded.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }

      const data = await request.json();

      // Validate required fields
      if (!data.title || !data.startTime || !data.endTime) {
        return NextResponse.json(
          { message: 'Title, start time, and end time are required' },
          { status: 400 }
        );
      }

      // Validate dates
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

      // Generate a new ID
      const lastEvent = await Event.findOne().sort({ _id: -1 });
      const newId = lastEvent ? (lastEvent._id as number) + 1 : 1;

      // Create the new event
      const newEvent = new Event({
        _id: newId,
        title: data.title,
        description: data.description || '',
        startTime: startTime,
        endTime: endTime,
        classId: data.classId ? parseInt(data.classId) : null
      });

      await newEvent.save();

      return NextResponse.json(
        {
          message: 'Event created successfully',
          event: {
            id: newEvent._id,
            title: newEvent.title,
            description: newEvent.description,
            startTime: newEvent.startTime,
            endTime: newEvent.endTime,
            classId: newEvent.classId,
            className: data.className || 'All Classes'
          }
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('JWT verification or event creation error:', error);
      return NextResponse.json({
        message: 'Invalid token or event creation failed',
        error: error.message
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
