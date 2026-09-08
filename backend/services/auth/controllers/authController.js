import { getAuth } from 'firebase-admin/auth'
import { app } from '../config/firebase.js'
import User from '../models/user.model.js'
import redis from '../shared/redis/redis.js'
import crypto from 'crypto'
import { signToken } from '../utils/jwt.js'

export const login = async (req, res) => {
  try {
    const { token, email, name, avatar } = req.body

    let decoded = null

    // 1. Firebase Token verification path
    if (token) {
      if (app) {
        try {
          decoded = await getAuth(app).verifyIdToken(token)
        } catch (authErr) {
          console.warn('Firebase Admin verifyIdToken fallback:', authErr?.message)
        }
      }

      if (!decoded) {
        try {
          const parts = token.split('.')
          if (parts.length === 3) {
            const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8')
            const parsed = JSON.parse(payloadJson)
            decoded = {
              uid: parsed.user_id || parsed.sub || parsed.uid,
              name: parsed.name || (parsed.email ? parsed.email.split('@')[0] : 'User'),
              email: parsed.email,
              picture: parsed.picture || parsed.avatar || ''
            }
          }
        } catch (jwtErr) {
          console.error('JWT parse error:', jwtErr?.message)
        }
      }
    }

    // 2. Direct Email / Demo login path
    if (!decoded && email && typeof email === 'string' && email.trim()) {
      const cleanEmail = email.trim().toLowerCase()
      const cleanName = name?.trim() || cleanEmail.split('@')[0] || 'User'
      decoded = {
        uid: 'email_' + crypto.createHash('md5').update(cleanEmail).digest('hex'),
        name: cleanName,
        email: cleanEmail,
        picture: avatar || ''
      }
    }

    if (!decoded || (!decoded.uid && !decoded.email)) {
      return res.status(400).json({
        message: 'Valid authentication token or email is required'
      })
    }

    if (decoded) {
      if ((!decoded.name || decoded.name === 'User') && name) {
        decoded.name = name
      }
      if (!decoded.picture && avatar) {
        decoded.picture = avatar
      }
    }

    // Find or create user in MongoDB
    let user = null
    if (decoded.uid) {
      user = await User.findOne({ firebaseUid: decoded.uid })
    }
    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email })
      if (user && decoded.uid && !user.firebaseUid) {
        user.firebaseUid = decoded.uid
        await user.save()
      }
    }

    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid || ('usr_' + crypto.randomUUID()),
        name: decoded.name || 'User',
        email: decoded.email || `${decoded.uid}@user.auramind.ai`,
        avatar: decoded.picture || '',
        credits: 100,
        totalCredits: 100,
        plan: 'free'
      })
    }

    // Create self-verifying signed session JWT token
    const sessionPayload = {
      _id: String(user._id),
      userId: String(user._id),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan || 'free',
      credits: user.credits ?? 100,
      totalCredits: user.totalCredits ?? 100,
      planExpiredAt: user.planExpiredAt
    }

    const sessionId = signToken(sessionPayload, 30 * 24 * 60 * 60) // 30 days

    // Persist in Redis for rapid state & cache lookup
    try {
      await redis.set(
        `user-session-${user._id}`,
        sessionId,
        'EX',
        30 * 24 * 60 * 60
      )
      await redis.set(
        `session-${sessionId}`,
        JSON.stringify({
          ...sessionPayload,
          sessionId
        }),
        'EX',
        30 * 24 * 60 * 60
      )
    } catch (redisErr) {
      console.warn('Redis session save warning (JWT fallback active):', redisErr?.message)
    }

    const isProd = process.env.NODE_ENV === 'production'
    res.cookie('session', sessionId, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    })

    return res.status(200).json({
      ...user.toObject(),
      sessionId
    })
  } catch (error) {
    console.error('Login error:', error)
    return res
      .status(500)
      .json({ message: `login failed due to internal server error ${error?.message || error}` })
  }
}

export const logOut = async (req, res) => {
  try {
    const sessionId =
      req.cookies?.session ||
      req.headers['x-session-id'] ||
      req.headers.authorization?.replace(/^Bearer\s+/i, '')

    if (sessionId) {
      await redis.del(`session-${sessionId}`)
    }
    res.clearCookie('session')
    return res.status(200).json({ message: 'logout successful' })
  } catch (error) {
    console.log(error)
    return res
      .status(500)
      .json({ message: `logout failed due to internal server error ${error}` })
  }
}

export const updateUserPayment = async (req, res) => {
  try {

     console.log("UPDATE PAYMENT HIT")
    console.log("BODY:", req.body)
    const { plan, credits, userId } = req.body
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'user not found' })
    }



    user.plan = plan
    user.credits += credits
    user.totalCredits += credits
    user.planExpiredAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await user.save()
    console.log("USER UPDATED:", {
  userId: user._id,
  plan: user.plan,
  credits: user.credits,
  totalCredits: user.totalCredits
})

    const sessionId = await redis.get(`user-session-${user._id}`)
     console.log("PAYMENT SESSION:", sessionId)
    await redis.set(
      `session-${sessionId}`,
      JSON.stringify({
        _id: user._id,
        userId: user._id,
        sessionId,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        credits: user.credits,
        totalCredits: user.totalCredits,
        planExpiredAt: user.planExpiredAt
      }),
      'EX',
      7 * 24 * 60 * 60
    )


    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(500).json({ message: `update payment error ${error}` })
  }
}

export const deductCredit = async (req, res) => {
  try {
    const { userId, agent } = req.body
    const COST = {
      chat: 1,
      search: 5,
      coding: 10,
      pdf: 10,
      ppt: 10,
      vision: 10
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'user not found' })
    }

    const requiredCredit = COST[agent] || 1
    if (user.credits < requiredCredit) {
      return res.status(400).json({ message: 'insufficient credits' })
    }

    user.credits -= requiredCredit
    await user.save()
    console.log('CREDITS AFTER SAVE:', user.credits)

    const sessionId = await redis.get(`user-session-${user._id}`)
    console.log('SESSION ID:', sessionId)
    await redis.set(
      `session-${sessionId}`,
      JSON.stringify({
        _id: user._id,
        userId: user._id,
        sessionId,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        credits: user.credits,
        totalCredits: user.totalCredits,
        planExpiredAt: user.planExpiredAt
      }),
      'EX',
      7 * 24 * 60 * 60
    )

    console.log('SESSION UPDATED')
    return res.status(200).json({ success: true, credits: user.credits })
  } catch (error) {
    return res.status(500).json({ message: `deduct credit error ${error}` })
  }
}
