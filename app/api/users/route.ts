import { NextRequest, NextResponse } from "next/server";
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import { Types } from 'mongoose';

// Create user (POST)
export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const data = await request.json();
    // Force role to 'admin' for security
    const userData = { ...data, role: 'admin' };
    userData.createdAt = new Date();
    userData.updatedAt = new Date();
    const user = new User(userData);
    await user.save();
    const { password, ...safeUser } = user.toObject();
    return NextResponse.json({ success: true, user: safeUser }, { status: 201 });
  } catch (error) {
    console.error('Add admin error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}

// Get users (GET)
export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const filter: any = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    const allUsers = await User.find(filter);
    // Remove passwords from response
    const safeUsers = allUsers.map((user) => {
      const { password, ...rest } = user.toObject();
      return {
        ...rest,
        _id: user._id.toString(),
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
      };
    });
    return NextResponse.json({ success: true, users: safeUsers });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
  }
}

// Update admin user (PATCH)
export async function PATCH(request: NextRequest) {
  await dbConnect();
  try {
    const data = await request.json();
    const { _id, ...updateFields } = data;
    if (!_id) {
      return NextResponse.json({ success: false, error: "Missing user _id" }, { status: 400 });
    }
    updateFields.updatedAt = new Date();
    const result = await User.updateOne(
      { _id: new Types.ObjectId(_id), role: "admin" },
      { $set: updateFields }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Admin not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// Delete admin user (DELETE)
export async function DELETE(request: NextRequest) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("_id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing user _id" }, { status: 400 });
    }
    const result = await User.deleteOne({ _id: new Types.ObjectId(id), role: "admin" });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Admin not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, deletedCount: result.deletedCount }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
