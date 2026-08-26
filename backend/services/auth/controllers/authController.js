import { getAuth } from 'firebase-admin/auth'
import { app } from '../config/firebase.js'
import User from '../models/user.model.js'
import redis from '../shared/redis/redis.js'
import crypto from 'crypto'

export const login = async (req, res) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ message: 'Token is required' })
    }

    let decoded = null
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

    if (!decoded || !decoded.uid) {
      return res.status(400).json({ message: 'Invalid authentication token' })
    }

    let user = await User.findOne({
      firebaseUid: decoded.uid
    })
    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        name: decoded.name || 'User',
        email: decoded.email,
        avatar: decoded.picture || ''
      })
    }

    const sessionId = crypto.randomUUID()
    await redis.set(
      `user-session-${user._id}`,
      sessionId,
      'EX',
      7 * 24 * 60 * 60
    )
    const check = await redis.get( `user-session-${user._id}`)
    console.log("check session" , check)
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

    res.cookie('session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return res.status(200).json({
      ...user.toObject(),
      sessionId
    })
  } catch (error) {
    console.log(error)
    return res
      .status(500)
      .json({ message: `login failed due to internal server error ${error}` })
  }
}

export const logOut = async (req, res) => {
  try {
    const sessionId = req.cookies?.session
    await redis.del(`session-${sessionId}`)
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
