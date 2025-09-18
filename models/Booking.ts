import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IBooking extends Document {
  userId: Types.ObjectId
  slotId: Types.ObjectId
  slotNumber: string
  vehicleNumber: string
  vehicleType: string
  startTime: Date
  endTime: Date
  expectedDuration: number
  actualDuration: number
  hourlyRate: number
  totalAmount: number
  status: string
  paymentStatus: string
  createdAt: Date
  updatedAt: Date
}

const BookingSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  slotId: { type: Schema.Types.ObjectId, ref: 'Slot', required: true },
  slotNumber: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  vehicleType: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  expectedDuration: { type: Number, required: true },
  actualDuration: { type: Number, required: true },
  hourlyRate: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, required: true },
  paymentStatus: { type: String, required: true },
}, { timestamps: true })

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema)
