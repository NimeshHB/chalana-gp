import { NextRequest, NextResponse } from "next/server";
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// Create user (POST)
export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const data = await request.json();
    
    // Validation
    if (!data.name || !data.email || !data.password) {
      return NextResponse.json({ 
        success: false, 
        error: "Name, email, and password are required" 
      }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid email format" 
      }, { status: 400 });
    }

    // Password validation
    if (data.password.length < 6) {
      return NextResponse.json({ 
        success: false, 
        error: "Password must be at least 6 characters long" 
      }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Email already exists" 
      }, { status: 400 });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Force role to 'admin' for security and set defaults
    const userData = { 
      ...data, 
      password: hashedPassword,
      role: 'admin',
      adminLevel: data.adminLevel || 'manager',
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      status: data.status || 'active',
      isVerified: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const user = new User(userData);
    await user.save();
    
    // Return safe user data (without password)
    const { password, verificationToken, verificationTokenExpires, ...safeUser } = user.toObject();
    return NextResponse.json({ 
      success: true, 
      user: {
        ...safeUser,
        _id: safeUser._id.toString(),
        createdAt: safeUser.createdAt?.toISOString(),
        updatedAt: safeUser.updatedAt?.toISOString(),
        lastLogin: safeUser.lastLogin?.toISOString() || null
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Add admin error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ 
        success: false, 
        error: "Email already exists" 
      }, { status: 400 });
    }
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
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
    const { _id, password, ...updateFields } = data;
    
    if (!_id) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing user _id" 
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(_id)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid user ID format" 
      }, { status: 400 });
    }

    // Email validation if email is being updated
    if (updateFields.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateFields.email)) {
        return NextResponse.json({ 
          success: false, 
          error: "Invalid email format" 
        }, { status: 400 });
      }

      // Check if email already exists (excluding current user)
      const existingUser = await User.findOne({ 
        email: updateFields.email, 
        _id: { $ne: new Types.ObjectId(_id) } 
      });
      if (existingUser) {
        return NextResponse.json({ 
          success: false, 
          error: "Email already exists" 
        }, { status: 400 });
      }
    }

    // Handle password update if provided
    if (password && password.trim()) {
      if (password.length < 6) {
        return NextResponse.json({ 
          success: false, 
          error: "Password must be at least 6 characters long" 
        }, { status: 400 });
      }
      const saltRounds = 12;
      updateFields.password = await bcrypt.hash(password, saltRounds);
    }

    // Validate permissions if provided
    if (updateFields.permissions && !Array.isArray(updateFields.permissions)) {
      return NextResponse.json({ 
        success: false, 
        error: "Permissions must be an array" 
      }, { status: 400 });
    }

    updateFields.updatedAt = new Date();
    
    const result = await User.updateOne(
      { _id: new Types.ObjectId(_id), role: "admin" },
      { $set: updateFields }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Admin not found" 
      }, { status: 404 });
    }

    // Get updated user data (without password)
    const updatedUser = await User.findById(_id).select('-password -verificationToken -verificationTokenExpires');
    
    return NextResponse.json({ 
      success: true, 
      modifiedCount: result.modifiedCount,
      user: {
        ...updatedUser?.toObject(),
        _id: updatedUser?._id.toString(),
        createdAt: updatedUser?.createdAt?.toISOString(),
        updatedAt: updatedUser?.updatedAt?.toISOString(),
        lastLogin: updatedUser?.lastLogin?.toISOString() || null
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Update admin error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ 
        success: false, 
        error: "Email already exists" 
      }, { status: 400 });
    }
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

// Delete admin user (DELETE)
export async function DELETE(request: NextRequest) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("_id");
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing user _id" 
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid user ID format" 
      }, { status: 400 });
    }

    // Check if user exists and is an admin
    const userToDelete = await User.findOne({ 
      _id: new Types.ObjectId(id), 
      role: "admin" 
    });
    
    if (!userToDelete) {
      return NextResponse.json({ 
        success: false, 
        error: "Admin not found" 
      }, { status: 404 });
    }

    // Prevent deletion of super admin if it's the last one
    if (userToDelete.adminLevel === 'super') {
      const superAdminCount = await User.countDocuments({ 
        role: 'admin', 
        adminLevel: 'super', 
        status: 'active' 
      });
      
      if (superAdminCount <= 1) {
        return NextResponse.json({ 
          success: false, 
          error: "Cannot delete the last active super admin" 
        }, { status: 400 });
      }
    }

    const result = await User.deleteOne({ 
      _id: new Types.ObjectId(id), 
      role: "admin" 
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Admin not found or could not be deleted" 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount,
      message: "Admin deleted successfully"
    }, { status: 200 });
  } catch (error: any) {
    console.error('Delete admin error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
