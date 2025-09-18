import mongoose from 'mongoose';

const parkingSchema = new mongoose.Schema({
  _id: String,
  name: String,
  type: String,
  occupied: Boolean,
  currentBooking: { type: String, default: null },
  createdAt: Date,
  updatedAt: Date
});

export default mongoose.models.Parking || mongoose.model('Parking', parkingSchema);