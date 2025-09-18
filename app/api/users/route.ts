import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string;
if (!uri) throw new Error("Missing MONGODB_URI in environment variables");

// Use a global variable to preserve the client across hot reloads in development
let globalWithMongo = global as typeof globalThis & { _mongoClient?: MongoClient };
let client: MongoClient;

if (process.env.NODE_ENV === "development") {
  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri);
  }
  client = globalWithMongo._mongoClient;
} else {
  client = new MongoClient(uri);
}

async function getDb() {
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }
  return client.db("smart_parking"); // use your actual db name
}

// Create user (POST)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // Force role to 'admin' for security
    const userData = { ...data, role: 'admin' };
    const db = await getDb();
    const users = db.collection("users");
    userData.createdAt = new Date();
    userData.updatedAt = new Date();
    const result = await users.insertOne(userData);
    const { password, ...safeUser } = userData;
    safeUser._id = result.insertedId.toString();
    return NextResponse.json({ success: true, user: safeUser }, { status: 201 });
  } catch (error) {
    console.error('Add admin error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}

// Get users (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const filter: any = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const db = await getDb();
    const users = db.collection("users");
    const allUsers = await users.find(filter).toArray();

    // Remove passwords from response
    const safeUsers = allUsers.map(({ password, ...user }) => ({
      ...user,
      _id: user._id?.toString(),
      createdAt: user.createdAt?.toISOString?.(),
      updatedAt: user.updatedAt?.toISOString?.(),
    }));

    return NextResponse.json({
      success: true,
      users: safeUsers,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
  }
}

// Update admin user (PATCH)
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { _id, ...updateFields } = data;
    if (!_id) {
      return NextResponse.json({ success: false, error: "Missing user _id" }, { status: 400 });
    }
    const db = await getDb();
    const users = db.collection("users");
    updateFields.updatedAt = new Date();
    const result = await users.updateOne(
      { _id: new ObjectId(_id), role: "admin" },
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
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("_id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing user _id" }, { status: 400 });
    }
    const db = await getDb();
    const users = db.collection("users");
    const result = await users.deleteOne({ _id: new ObjectId(id), role: "admin" });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Admin not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, deletedCount: result.deletedCount }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
