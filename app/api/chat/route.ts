import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

interface ChatMessage {
  _id?: ObjectId
  conversationId: string
  senderId: ObjectId
  senderName: string
  senderType: 'admin' | 'user'
  message: string
  timestamp: Date
  read: boolean
}

interface Conversation {
  _id?: ObjectId
  userId: ObjectId
  userName: string
  adminId?: ObjectId
  adminName?: string
  status: 'active' | 'closed'
  lastMessage?: string
  lastMessageTime?: Date
  createdAt: Date
  updatedAt: Date
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const userId = searchParams.get('userId')

    if (conversationId) {
      // Get messages for a specific conversation
      const messages = await db.collection('chat_messages')
        .find({ conversationId })
        .sort({ timestamp: 1 })
        .toArray()

      return NextResponse.json({ messages })
    } else if (userId) {
      // Get or create conversation for a user
      let conversation = await db.collection('conversations')
        .findOne({ userId: new ObjectId(userId) })

      if (!conversation) {
        // Create new conversation
        const newConversation: Conversation = {
          userId: new ObjectId(userId),
          userName: 'User', // This should be fetched from user data
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const result = await db.collection('conversations').insertOne(newConversation)
        conversation = { ...newConversation, _id: result.insertedId }
      }

      return NextResponse.json({ conversation })
    } else {
      // Get all active conversations for admin
      const conversations = await db.collection('conversations')
        .find({ status: 'active' })
        .sort({ lastMessageTime: -1 })
        .toArray()

      return NextResponse.json({ conversations })
    }
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase()
    const body = await request.json()
    const { conversationId, senderId, senderName, senderType, message } = body

    if (!conversationId || !senderId || !senderName || !senderType || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create new message
    const newMessage: ChatMessage = {
      conversationId,
      senderId: new ObjectId(senderId),
      senderName,
      senderType,
      message,
      timestamp: new Date(),
      read: false
    }

    const result = await db.collection('chat_messages').insertOne(newMessage)

    // Update conversation with last message
    await db.collection('conversations').updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: {
          lastMessage: message,
          lastMessageTime: new Date(),
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({ 
      message: { ...newMessage, _id: result.insertedId },
      success: true 
    })
  } catch (error) {
    console.error('Chat POST API error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDatabase()
    const body = await request.json()
    const { conversationId, action } = body

    if (action === 'markAsRead') {
      // Mark all messages in conversation as read
      await db.collection('chat_messages').updateMany(
        { conversationId },
        { $set: { read: true } }
      )

      return NextResponse.json({ success: true })
    } else if (action === 'closeConversation') {
      // Close the conversation
      await db.collection('conversations').updateOne(
        { _id: new ObjectId(conversationId) },
        { 
          $set: { 
            status: 'closed',
            updatedAt: new Date()
          } 
        }
      )

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Chat PUT API error:', error)
    return NextResponse.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    )
  }
}
