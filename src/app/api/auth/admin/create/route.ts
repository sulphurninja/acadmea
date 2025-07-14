import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Admin from '@/models/Admin';
import mongoose from 'mongoose';

// Create a new admin without token verification (for initial setup)
export async function POST(request: Request) {
  try {
    console.log("Starting admin creation process");
    await connectToDatabase();
    console.log("Connected to database");

    // Parse the request body
    let data;
    try {
      data = await request.json();
      console.log("Received data:", JSON.stringify(data));
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
    }

    const { username, password, name, email, superAdmin = false } = data;

    // Validate input
    if (!username || !password || !name) {
      console.log("Validation failed: Missing required fields");
      return NextResponse.json(
        { message: 'Username, password, and name are required' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log(`Username ${username} already exists`);
      return NextResponse.json({ message: 'Username already exists' }, { status: 400 });
    }

    try {
      // Create admin ID
      const adminId = new mongoose.Types.ObjectId().toString();
      console.log(`Generated admin ID: ${adminId}`);

      // Create user with admin role
      const adminUser = new User({
        _id: adminId,
        username,
        password, // This will be hashed automatically by the model pre-save hook
        role: 'admin',
        isActive: true
      });

      console.log("Saving user document...");
      await adminUser.save();
      console.log("User document saved successfully");

      // Create admin profile
      const admin = new Admin({
        _id: adminId,
        username,
        name,
        email,
        superAdmin
      });

      console.log("Saving admin document...");
      await admin.save();
      console.log("Admin document saved successfully");

      return NextResponse.json(
        { message: 'Admin user created successfully', adminId },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error in creation process:", error);
      // Check for validation errors
      if (error instanceof mongoose.Error.ValidationError) {
        const validationErrors = Object.keys(error.errors).map(field => ({
          field,
          message: error.errors[field].message
        }));
        console.log("Validation errors:", validationErrors);
        return NextResponse.json(
          { message: 'Validation error', errors: validationErrors },
          { status: 400 }
        );
      }
      throw error; // Let the outer catch block handle other errors
    }
  } catch (error: any) {
    console.error('Error creating admin:', error);
    // Return the specific error message to help with debugging
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
