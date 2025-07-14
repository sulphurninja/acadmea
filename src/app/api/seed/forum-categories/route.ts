import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ForumCategory from '@/models/ForumCategory';

const categories = [
  {
    _id: 'general-discussion',
    name: 'General Discussion',
    description: 'General discussions and announcements',
    icon: 'users',
    color: '#3B82F6',
    gradeIds: ['1', '2', '3', '4', '5'], // You'll need to replace these with actual grade IDs
    subjectIds: [],
    allowStudentPosts: true,
    requireModeration: false
  },
  {
    _id: 'homework-help',
    name: 'Homework Help',
    description: 'Get help with homework and assignments',
    icon: 'book',
    color: '#10B981',
    gradeIds: ['1', '2', '3', '4', '5'],
    subjectIds: [],
    allowStudentPosts: true,
    requireModeration: false
  },
  {
    _id: 'announcements',
    name: 'Announcements',
    description: 'Important announcements from teachers',
    icon: 'megaphone',
    color: '#F59E0B',
    gradeIds: ['1', '2', '3', '4', '5'],
    subjectIds: [],
    allowStudentPosts: false,
    requireModeration: false
  },
  {
    _id: 'doubts-queries',
    name: 'Doubts & Queries',
    description: 'Ask questions and clear your doubts',
    icon: 'help',
    color: '#8B5CF6',
    gradeIds: ['1', '2', '3', '4', '5'],
    subjectIds: [],
    allowStudentPosts: true,
    requireModeration: false
  }
];

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    // First, let's get actual grade IDs from your database
    const Grade = (await import('@/models/Grade')).default;
    const grades = await Grade.find({}, '_id name');
    const gradeIds = grades.map(grade => grade._id);

    // Update categories with real grade IDs
    const updatedCategories = categories.map(category => ({
      ...category,
      gradeIds: gradeIds
    }));

    const results = [];

    for (const category of updatedCategories) {
      const result = await ForumCategory.findByIdAndUpdate(
        category._id,
        category,
        { upsert: true, new: true }
      );
      results.push(result);
    }

    return NextResponse.json({
      message: 'Forum categories seeded successfully',
      categories: results
    });

  } catch (error) {
    console.error('Error seeding forum categories:', error);
    return NextResponse.json(
      { message: 'Error seeding forum categories', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();

    const categories = await ForumCategory.find({})
      .populate('gradeIds', 'name')
      .populate('subjectIds', 'name');

    return NextResponse.json({
      message: 'Forum categories retrieved successfully',
      categories
    });

  } catch (error) {
    console.error('Error retrieving forum categories:', error);
    return NextResponse.json(
      { message: 'Error retrieving forum categories', error: error.message },
      { status: 500 }
    );
  }
}
