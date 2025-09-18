import mongoose, { Schema, Document } from 'mongoose'

export interface ISlot extends Document {
  date: Date
  time: string
  duration: number
  service: string
  // Add more fields if needed
}

const SlotSchema: Schema = new Schema({
  date: { type: Date, required: true },
  time: { type: String, required: true },
  duration: { type: Number, required: true },
  service: { type: String, required: true },
  // Add more fields if needed
})

export default mongoose.models.Slot || mongoose.model<ISlot>('Slot', SlotSchema)
