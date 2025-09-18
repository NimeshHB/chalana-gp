import Slot, { ISlot } from '../models/Slot'

// Create a new slot
export async function createSlot(data: Partial<ISlot>) {
  const slot = new Slot(data)
  return await slot.save()
}

// Get all slots
export async function getAllSlots() {
  return await Slot.find().sort({ date: -1 })
}
