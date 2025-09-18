import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string;
if (!uri) throw new Error("Missing MONGODB_URI in environment variables");

let client: MongoClient | null = null;

async function getDb() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db("smart_parking"); // DB name is now fixed
}

// Create a booking (POST)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate data
    if (!data.slotId || !data.userId) {
      return NextResponse.json({ success: false, error: "slotId and userId are required" }, { status: 400 });
    }

    const db = await getDb();
    const bookings = db.collection("bookings");

    const bookingData = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await bookings.insertOne(bookingData);

    // Return full booking so UI can update immediately
    return NextResponse.json(
      { 
        success: true, 
        booking: { 
          ...bookingData, 
          _id: result.insertedId.toString() 
        } 
      }, 
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// Get all bookings (GET)
export async function GET() {
  try {
    const db = await getDb();
    const bookings = db.collection("bookings");

    const allBookings = await bookings.find({}).toArray();

    // Convert ObjectId/Date to string so frontend can handle it
    const safeBookings = allBookings.map((b) => ({
      ...b,
      _id: b._id.toString(),
      createdAt: b.createdAt?.toISOString(),
      updatedAt: b.updatedAt?.toISOString(),
    }));

    return NextResponse.json({ success: true, bookings: safeBookings }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// Update a booking (PATCH)
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { _id, ...updateFields } = data;

    if (!_id) {
      return NextResponse.json({ success: false, error: "Missing booking _id" }, { status: 400 });
    }

    const db = await getDb();
    const bookings = db.collection("bookings");

    updateFields.updatedAt = new Date();

    const result = await bookings.updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
