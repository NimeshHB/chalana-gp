import Booking, { IBooking } from '../models/Booking';

/**
 * Creates a new booking in the database.
 * @param data - The data for the new booking.
 * @returns The saved booking document.
 */
export async function createBooking(data: Partial<IBooking>) {
  const booking = new Booking(data)
  return await booking.save()
}

/**
 * Retrieves all bookings from the database, sorted by start time.
 * @returns A promise that resolves to an array of booking documents.
 */
export async function getAllBookings() {
  return await Booking.find().sort({ createdAt: -1 })
}