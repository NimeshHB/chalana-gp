import mongoose from 'mongoose';
import fs from 'fs';
import Parking from './lib/models/parking';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedParkingData() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const parkingData = JSON.parse(fs.readFileSync('sample-parking-data-100.json', 'utf8'));
  await Parking.insertMany(parkingData);

  await mongoose.connection.close();
  console.log('100 parking data ඇතුලත් කිරීම සාර්ථකයි');
}

seedParkingData().catch(console.error);