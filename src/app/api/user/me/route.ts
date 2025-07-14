import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { authenticated } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const userData = await authenticated(req);
    if (!userData.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get user data
    const user = await User.findById(userData.id).select('-password');
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        bandwidth: user.bandwidth,
        walletAddress: user.walletAddress,
        role: user.role,
        inviteCode: user.inviteCode,
        transactions: user.transactions
      }
    });
  } catch (error: any) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
