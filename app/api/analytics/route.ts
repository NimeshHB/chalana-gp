import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { Db } from 'mongodb'

interface UserRegistration {
  _id: number
  count: number
}

interface MonthlyBooking {
  _id: number
  bookings: number
  revenue: number
}

interface ActiveUser {
  _id: number
  activeUsers: number
}

interface WeeklyBooking {
  _id: number
  bookings: number
  users: number
  avgDuration: number
}

interface UserType {
  _id: string
  count: number
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'monthly'

    switch (type) {
      case 'monthly':
        return await getMonthlyAnalytics(db)
      case 'weekly':
        return await getWeeklyAnalytics(db)
      case 'userTypes':
        return await getUserTypeAnalytics(db)
      case 'revenue':
        return await getRevenueAnalytics(db)
      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

async function getMonthlyAnalytics(db: Db) {
  const currentYear = new Date().getFullYear()
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  // Get monthly user registrations
  const userRegistrations = await db.collection('users').aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${currentYear}-01-01`),
          $lt: new Date(`${currentYear + 1}-01-01`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 }
      }
    }
  ]).toArray() as UserRegistration[]

  // Get monthly bookings
  const monthlyBookings = await db.collection('bookings').aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${currentYear}-01-01`),
          $lt: new Date(`${currentYear + 1}-01-01`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        bookings: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    }
  ]).toArray() as MonthlyBooking[]

  // Get active users per month
  const activeUsers = await db.collection('users').aggregate([
    {
      $match: {
        lastLogin: {
          $gte: new Date(`${currentYear}-01-01`),
          $lt: new Date(`${currentYear + 1}-01-01`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$lastLogin' },
        activeUsers: { $sum: 1 }
      }
    }
  ]).toArray() as ActiveUser[]

  // Combine data for each month
  const monthlyData = months.map((month, index) => {
    const monthNum = index + 1
    const userReg = userRegistrations.find((u: UserRegistration) => u._id === monthNum)
    const bookings = monthlyBookings.find((b: MonthlyBooking) => b._id === monthNum)
    const active = activeUsers.find((a: ActiveUser) => a._id === monthNum)

    return {
      month,
      newUsers: userReg?.count || 0,
      activeUsers: active?.activeUsers || 0,
      bookings: bookings?.bookings || 0,
      revenue: bookings?.revenue || 0
    }
  })

  return NextResponse.json({ data: monthlyData })
}

async function getWeeklyAnalytics(db: Db) {
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const weeklyBookings = await db.collection('bookings').aggregate([
    {
      $match: {
        createdAt: { $gte: startOfWeek }
      }
    },
    {
      $group: {
        _id: { $dayOfWeek: '$createdAt' },
        bookings: { $sum: 1 },
        users: { $addToSet: '$userId' },
        avgDuration: { $avg: '$actualDuration' }
      }
    },
    {
      $addFields: {
        users: { $size: '$users' }
      }
    }
  ]).toArray() as WeeklyBooking[]

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weeklyData = days.map((day, index) => {
    const dayData = weeklyBookings.find((w: WeeklyBooking) => w._id === index + 1)
    return {
      day,
      bookings: dayData?.bookings || 0,
      users: dayData?.users || 0,
      avgDuration: dayData?.avgDuration || 0
    }
  })

  return NextResponse.json({ data: weeklyData })
}

async function getUserTypeAnalytics(db: Db) {
  const userTypes = await db.collection('users').aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]).toArray() as UserType[]

  const colors: Record<string, string> = {
    user: '#8884d8',
    admin: '#82ca9d',
    attendant: '#ffc658'
  }

  const userTypeData = userTypes.map((type: UserType) => ({
    name: type._id.charAt(0).toUpperCase() + type._id.slice(1) + 's',
    value: type.count,
    color: colors[type._id] || '#ff7300'
  }))

  return NextResponse.json({ data: userTypeData })
}

async function getRevenueAnalytics(db: Db) {
  const currentMonth = new Date()
  currentMonth.setDate(1)
  currentMonth.setHours(0, 0, 0, 0)

  const revenueData = await db.collection('bookings').aggregate([
    {
      $match: {
        createdAt: { $gte: currentMonth },
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalBookings: { $sum: 1 },
        avgBookingValue: { $avg: '$totalAmount' }
      }
    }
  ]).toArray()

  return NextResponse.json({ 
    data: revenueData[0] || { 
      totalRevenue: 0, 
      totalBookings: 0, 
      avgBookingValue: 0 
    }
  })
}
