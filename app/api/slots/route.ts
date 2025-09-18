import { NextRequest, NextResponse } from 'next/server'
import { createSlot, getAllSlots } from '../../../services/slotService'
import dbConnect from '../../../lib/dbConnect'

export async function POST(req: NextRequest) {
  await dbConnect()
  try {
    const data = await req.json()
    const slot = await createSlot(data)
    return NextResponse.json({ success: true, slot }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 })
  }
}

export async function GET() {
  await dbConnect()
  try {
    const slots = await getAllSlots()
    return NextResponse.json({ success: true, slots })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
