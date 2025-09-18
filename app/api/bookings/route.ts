import { NextRequest, NextResponse } from 'next/server';import { NextRequest, NextResponse } from 'next/server';import { NextRequest, NextResponse } from 'next/server'import { NextRequest, NextResponse } from 'next/server'import { NextRequest, NextResponse } from 'next/server';

import dbConnect from '../../../lib/dbConnect';

import Booking from '../../../models/Booking';import dbConnect from '../../../lib/dbConnect';

import ParkingSlot from '../../../models/ParkingSlot';

import Booking from '../../../models/Booking';import dbConnect from '../../../lib/dbConnect'

export async function POST(request: NextRequest) {

  await dbConnect();import ParkingSlot from '../../../models/ParkingSlot';

  try {

    const data = await request.json();import Booking from '../../../models/Booking'import dbConnect from '../../../lib/dbConnect'import dbConnect from '../../../lib/dbConnect';

    

    if (!data.userId || !data.slotId || !data.vehicleNumber) {// Create a new booking (POST)

      return NextResponse.json(

        { success: false, error: "Missing required fields" },export async function POST(request: NextRequest) {import ParkingSlot from '../../../models/ParkingSlot'

        { status: 400 }

      );  await dbConnect();

    }

  try {import Booking from '../../../models/Booking'import Booking from '../../../models/Booking';

    const slot = await ParkingSlot.findById(data.slotId);

    if (!slot || slot.status !== 'available') {    const data = await request.json();

      return NextResponse.json(

        { success: false, error: "Slot not available" },    // Create a new booking (POST)

        { status: 400 }

      );    // Validate required fields

    }

    const requiredFields = ['userId', 'slotId', 'vehicleNumber', 'vehicleType', 'startTime', 'duration', 'userDetails'];export async function POST(request: NextRequest) {import ParkingSlot from '../../../models/ParkingSlot'

    const startTime = new Date(data.startTime);

    const endTime = new Date(startTime.getTime() + (data.duration * 60 * 60 * 1000));    for (const field of requiredFields) {

    const totalAmount = data.duration * slot.hourlyRate;

      if (!data[field]) {  await dbConnect()

    const booking = new Booking({

      ...data,        return NextResponse.json(

      slotNumber: slot.number,

      startTime,          { success: false, error: `${field} is required` },  try {// Create a booking (POST)

      endTime,

      totalAmount,          { status: 400 }

      status: 'confirmed'

    });        );    const data = await request.json()



    await booking.save();      }



    return NextResponse.json({ success: true, booking }, { status: 201 });    }    // Create a new booking (POST)export async function POST(request: NextRequest) {



  } catch (error) {

    return NextResponse.json(

      { success: false, error: (error as Error).message },    // Validate user details    // Validate required fields

      { status: 500 }

    );    if (!data.userDetails.name || !data.userDetails.email || !data.userDetails.phone) {

  }

}      return NextResponse.json(    const requiredFields = ['userId', 'slotId', 'vehicleNumber', 'vehicleType', 'startTime', 'duration', 'userDetails']export async function POST(request: NextRequest) {  await dbConnect();



export async function GET(request: NextRequest) {        { success: false, error: "User details (name, email, phone) are required" },

  await dbConnect();

  try {        { status: 400 }    for (const field of requiredFields) {

    const { searchParams } = new URL(request.url);

    const userId = searchParams.get('userId');      );

    

    const query: any = {};    }      if (!data[field]) {  await dbConnect()  try {

    if (userId) query.userId = userId;



    const bookings = await Booking.find(query)

      .populate('slotId', 'number section type hourlyRate')    // Find the parking slot        return NextResponse.json(

      .sort({ createdAt: -1 });

    const slot = await ParkingSlot.findById(data.slotId);

    return NextResponse.json({ success: true, bookings });

    if (!slot) {          { success: false, error: `${field} is required` },  try {    const data = await request.json();

  } catch (error) {

    return NextResponse.json(      return NextResponse.json(

      { success: false, error: (error as Error).message },

      { status: 500 }        { success: false, error: "Parking slot not found" },          { status: 400 }

    );

  }        { status: 404 }

}
      );        )    const data = await request.json()    // Validate data

    }

      }

    // Check if slot is available

    if (slot.status !== 'available') {    }        if (!data.slotId || !data.userId) {

      return NextResponse.json(

        { success: false, error: "Parking slot is not available" },

        { status: 400 }

      );    // Validate user details    // Validate required fields      return NextResponse.json({ success: false, error: "slotId and userId are required" }, { status: 400 });

    }

    if (!data.userDetails.name || !data.userDetails.email || !data.userDetails.phone) {

    // Calculate end time

    const startTime = new Date(data.startTime);      return NextResponse.json(    const requiredFields = ['userId', 'slotId', 'vehicleNumber', 'vehicleType', 'startTime', 'duration', 'userDetails']    }

    const endTime = new Date(startTime.getTime() + (data.duration * 60 * 60 * 1000));

        { success: false, error: "User details (name, email, phone) are required" },

    // Calculate total amount

    const totalAmount = data.duration * slot.hourlyRate;        { status: 400 }    for (const field of requiredFields) {    const booking = new Booking({



    // Create booking      )

    const bookingData = {

      ...data,    }      if (!data[field]) {      ...data,

      slotNumber: slot.number,

      startTime,

      endTime,

      totalAmount,    // Find the parking slot        return NextResponse.json(      createdAt: new Date(),

      status: 'confirmed'

    };    const slot = await ParkingSlot.findById(data.slotId)



    const booking = new Booking(bookingData);    if (!slot) {          { success: false, error: `${field} is required` },      updatedAt: new Date(),

    await booking.save();

      return NextResponse.json(

    // Update slot status if booking is immediate

    const now = new Date();        { success: false, error: "Parking slot not found" },          { status: 400 }    });

    if (startTime <= now) {

      slot.status = 'occupied';        { status: 404 }

      slot.bookedBy = data.userDetails.name;

      slot.vehicleNumber = data.vehicleNumber;      )        )    await booking.save();

      slot.bookedAt = now;

      slot.bookedByUserId = data.userId;    }

      await slot.save();

    }      }    return NextResponse.json({ success: true, booking }, { status: 201 });



    return NextResponse.json({     // Check if slot is available

      success: true, 

      booking: {    if (slot.status !== 'available') {    }  } catch (error) {

        ...booking.toObject(),

        slot: {      return NextResponse.json(

          number: slot.number,

          section: slot.section,        { success: false, error: "Parking slot is not available" },    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });

          type: slot.type,

          hourlyRate: slot.hourlyRate        { status: 400 }

        }

      }      )    // Validate user details  }

    }, { status: 201 });

    }

  } catch (error) {

    console.error('Booking creation error:', error);    if (!data.userDetails.name || !data.userDetails.email || !data.userDetails.phone) {}

    return NextResponse.json(

      { success: false, error: (error as Error).message },    // Calculate end time

      { status: 500 }

    );    const startTime = new Date(data.startTime)      return NextResponse.json(

  }

}    const endTime = new Date(startTime.getTime() + (data.duration * 60 * 60 * 1000))



// Get bookings (GET)        { success: false, error: "User details (name, email, phone) are required" },// Get all bookings (GET)

export async function GET(request: NextRequest) {

  await dbConnect();    // Check for conflicting bookings

  try {

    const { searchParams } = new URL(request.url);    const conflictingBooking = await Booking.findOne({        { status: 400 }export async function GET() {

    const userId = searchParams.get('userId');

    const status = searchParams.get('status');      slotId: data.slotId,

    const page = parseInt(searchParams.get('page') || '1');

    const limit = parseInt(searchParams.get('limit') || '10');      status: { $in: ['confirmed', 'active'] },      )  await dbConnect();



    // Build query      $or: [

    const query: any = {};

    if (userId) query.userId = userId;        { startTime: { $lt: endTime }, endTime: { $gt: startTime } },    }  try {

    if (status) query.status = status;

        { startTime: { $gte: startTime, $lt: endTime } }

    // Get bookings with pagination

    const bookings = await Booking.find(query)      ]    const allBookings = await Booking.find().sort({ createdAt: -1 });

      .populate('slotId', 'number section type hourlyRate')

      .sort({ createdAt: -1 })    })

      .limit(limit)

      .skip((page - 1) * limit);    // Find the parking slot    // Convert _id and dates to string for frontend



    // Get total count for pagination    if (conflictingBooking) {

    const total = await Booking.countDocuments(query);

      return NextResponse.json(    const slot = await ParkingSlot.findById(data.slotId)    const safeBookings = allBookings.map((b) => ({

    return NextResponse.json({

      success: true,        { success: false, error: "Slot is already booked for the selected time period" },

      bookings,

      pagination: {        { status: 400 }    if (!slot) {      ...b.toObject(),

        page,

        limit,      )

        total,

        pages: Math.ceil(total / limit)    }      return NextResponse.json(      _id: b._id.toString(),

      }

    });



  } catch (error) {    // Calculate total amount        { success: false, error: "Parking slot not found" },      createdAt: b.createdAt?.toISOString(),

    console.error('Get bookings error:', error);

    return NextResponse.json(    const totalAmount = data.duration * slot.hourlyRate

      { success: false, error: (error as Error).message },

      { status: 500 }        { status: 404 }      updatedAt: b.updatedAt?.toISOString(),

    );

  }    // Create booking

}
    const bookingData = {      )    }));

      ...data,

      slotNumber: slot.number,    }    return NextResponse.json({ success: true, bookings: safeBookings }, { status: 200 });

      startTime,

      endTime,  } catch (error) {

      totalAmount,

      status: 'confirmed'    // Check if slot is available    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });

    }

    if (slot.status !== 'available') {  }

    const booking = new Booking(bookingData)

    await booking.save()      return NextResponse.json(}



    // Update slot status if booking is immediate        { success: false, error: "Parking slot is not available" },

    const now = new Date()

    if (startTime <= now) {        { status: 400 }// Update a booking (PATCH)

      slot.status = 'occupied'

      slot.bookedBy = data.userDetails.name      )export async function PATCH(request: NextRequest) {

      slot.vehicleNumber = data.vehicleNumber

      slot.bookedAt = now    }  await dbConnect();

      slot.bookedByUserId = data.userId

      await slot.save()  try {

    }

    // Calculate end time    const data = await request.json();

    return NextResponse.json({ 

      success: true,     const startTime = new Date(data.startTime)    const { _id, ...updateFields } = data;

      booking: {

        ...booking.toObject(),    const endTime = new Date(startTime.getTime() + (data.duration * 60 * 60 * 1000))    if (!_id) {

        slot: {

          number: slot.number,      return NextResponse.json({ success: false, error: "Missing booking _id" }, { status: 400 });

          section: slot.section,

          type: slot.type,    // Check for conflicting bookings    }

          hourlyRate: slot.hourlyRate

        }    const conflictingBooking = await Booking.findOne({    updateFields.updatedAt = new Date();

      }

    }, { status: 201 })      slotId: data.slotId,    const result = await Booking.updateOne(



  } catch (error) {      status: { $in: ['confirmed', 'active'] },      { _id },

    console.error('Booking creation error:', error)

    return NextResponse.json(      $or: [      { $set: updateFields }

      { success: false, error: (error as Error).message },

      { status: 500 }        { startTime: { $lt: endTime }, endTime: { $gt: startTime } },    );

    )

  }        { startTime: { $gte: startTime, $lt: endTime } }    if (result.matchedCount === 0) {

}

      ]      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });

// Get bookings (GET)

export async function GET(request: NextRequest) {    })    }

  await dbConnect()

  try {    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount }, { status: 200 });

    const { searchParams } = new URL(request.url)

    const userId = searchParams.get('userId')    if (conflictingBooking) {  } catch (error) {

    const status = searchParams.get('status')

    const slotId = searchParams.get('slotId')      return NextResponse.json(    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });

    const page = parseInt(searchParams.get('page') || '1')

    const limit = parseInt(searchParams.get('limit') || '10')        { success: false, error: "Slot is already booked for the selected time period" },  }



    // Build query        { status: 400 }}

    const query: any = {}

    if (userId) query.userId = userId      )

    if (status) query.status = status    }

    if (slotId) query.slotId = slotId

    // Calculate total amount

    // Get bookings with pagination    const totalAmount = data.duration * slot.hourlyRate

    const bookings = await Booking.find(query)

      .populate('slotId', 'number section type hourlyRate')    // Create booking

      .sort({ createdAt: -1 })    const bookingData = {

      .limit(limit)      ...data,

      .skip((page - 1) * limit)      slotNumber: slot.number,

      startTime,

    // Get total count for pagination      endTime,

    const total = await Booking.countDocuments(query)      totalAmount,

      status: 'confirmed' // Auto-confirm for now

    return NextResponse.json({    }

      success: true,

      bookings,    const booking = new Booking(bookingData)

      pagination: {    await booking.save()

        page,

        limit,    // Update slot status to reserved if booking is immediate

        total,    const now = new Date()

        pages: Math.ceil(total / limit)    if (startTime <= now) {

      }      slot.status = 'occupied'

    })      slot.bookedBy = data.userDetails.name

      slot.vehicleNumber = data.vehicleNumber

  } catch (error) {      slot.bookedAt = now

    console.error('Get bookings error:', error)      slot.bookedByUserId = data.userId

    return NextResponse.json(      await slot.save()

      { success: false, error: (error as Error).message },    }

      { status: 500 }

    )    return NextResponse.json({ 

  }      success: true, 

}      booking: {
        ...booking.toObject(),
        slot: {
          number: slot.number,
          section: slot.section,
          type: slot.type,
          hourlyRate: slot.hourlyRate
        }
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Booking creation error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}

// Get bookings (GET)
export async function GET(request: NextRequest) {
  await dbConnect()
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const slotId = searchParams.get('slotId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build query
    const query: any = {}
    if (userId) query.userId = userId
    if (status) query.status = status
    if (slotId) query.slotId = slotId

    // Get bookings with pagination
    const bookings = await Booking.find(query)
      .populate('slotId', 'number section type hourlyRate')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)

    // Get total count for pagination
    const total = await Booking.countDocuments(query)

    return NextResponse.json({
      success: true,
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get bookings error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}

// Update booking (PATCH)
export async function PATCH(request: NextRequest) {
  await dbConnect()
  try {
    const data = await request.json()
    const { _id, ...updateFields } = data

    if (!_id) {
      return NextResponse.json(
        { success: false, error: "Booking ID is required" },
        { status: 400 }
      )
    }

    const booking = await Booking.findById(_id)
    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    // Handle status changes
    if (updateFields.status) {
      const slot = await ParkingSlot.findById(booking.slotId)
      
      if (updateFields.status === 'cancelled') {
        // Free up the slot if booking is cancelled
        if (slot && slot.status === 'occupied' && slot.bookedByUserId === booking.userId) {
          slot.status = 'available'
          slot.bookedBy = null
          slot.vehicleNumber = null
          slot.bookedAt = null
          slot.bookedByUserId = null
          await slot.save()
        }
      } else if (updateFields.status === 'active') {
        // Mark slot as occupied when booking becomes active
        if (slot && slot.status === 'available') {
          slot.status = 'occupied'
          slot.bookedBy = booking.userDetails.name
          slot.vehicleNumber = booking.vehicleNumber
          slot.bookedAt = new Date()
          slot.bookedByUserId = booking.userId
          await slot.save()
        }
        // Set actual start time
        updateFields.actualStartTime = new Date()
      } else if (updateFields.status === 'completed') {
        // Set actual end time and free up slot
        updateFields.actualEndTime = new Date()
        if (slot && slot.status === 'occupied' && slot.bookedByUserId === booking.userId) {
          slot.status = 'available'
          slot.bookedBy = null
          slot.vehicleNumber = null
          slot.bookedAt = null
          slot.bookedByUserId = null
          await slot.save()
        }
      }
    }

    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      _id,
      { $set: updateFields },
      { new: true }
    ).populate('slotId', 'number section type hourlyRate')

    return NextResponse.json({
      success: true,
      booking: updatedBooking
    })

  } catch (error) {
    console.error('Update booking error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}

// Delete/Cancel booking (DELETE)
export async function DELETE(request: NextRequest) {
  await dbConnect()
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('_id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Booking ID is required" },
        { status: 400 }
      )
    }

    const booking = await Booking.findById(id)
    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    // Can only cancel pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return NextResponse.json(
        { success: false, error: "Cannot cancel this booking" },
        { status: 400 }
      )
    }

    // Update booking status to cancelled
    booking.status = 'cancelled'
    await booking.save()

    // Free up the slot if it was occupied
    const slot = await ParkingSlot.findById(booking.slotId)
    if (slot && slot.status === 'occupied' && slot.bookedByUserId === booking.userId) {
      slot.status = 'available'
      slot.bookedBy = null
      slot.vehicleNumber = null
      slot.bookedAt = null
      slot.bookedByUserId = null
      await slot.save()
    }

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully"
    })

  } catch (error) {
    console.error('Cancel booking error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}