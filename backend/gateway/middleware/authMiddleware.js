import redis from "../shared/redis/redis.js"
import { verifyToken, signToken } from "../utils/jwt.js"

const protect = async (req, res, next) => {
    try {
        const sessionId = req.cookies?.session || req.headers['x-session-id'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');

        if (!sessionId) {
            return res.status(401).json({ message: "Unauthorized: No session token provided" });
        }

        let userData = null

        // 1. Try fast Redis lookup
        try {
            const session = await redis.get(`session-${sessionId}`);
            if (session) {
                userData = JSON.parse(session);
            }
        } catch (redisErr) {
            // Non-fatal, proceed to JWT verification
        }

        // 2. Resilient JWT self-verification fallback if Redis cache missed or timed out
        if (!userData) {
            const verified = verifyToken(sessionId);
            if (verified && (verified._id || verified.userId)) {
                userData = verified;
                // Re-populate Redis cache asynchronously
                redis.set(`session-${sessionId}`, JSON.stringify(verified), 'EX', 30 * 24 * 60 * 60).catch(() => {});
            }
        }

        if (!userData) {
            return res.status(401).json({ message: "Session expired or invalid" });
        }

        // 3. Permanent auto-renew: Refresh token seamlessly if within 10 days of expiry
        try {
            const nowSec = Math.floor(Date.now() / 1000);
            if (userData.exp && (userData.exp - nowSec < 10 * 24 * 60 * 60)) {
                const refreshedPayload = {
                    _id: userData._id,
                    userId: userData.userId || userData._id,
                    name: userData.name,
                    email: userData.email,
                    avatar: userData.avatar,
                    plan: userData.plan,
                    credits: userData.credits,
                    totalCredits: userData.totalCredits
                };
                const refreshedToken = signToken(refreshedPayload, 30 * 24 * 60 * 60);
                res.setHeader('x-refreshed-token', refreshedToken);
                res.setHeader('Access-Control-Expose-Headers', 'x-refreshed-token');
                redis.set(`session-${refreshedToken}`, JSON.stringify(refreshedPayload), 'EX', 30 * 24 * 60 * 60).catch(() => {});
            }
        } catch (renewErr) {
            // Non-fatal auto-renew warning
        }

        req.user = userData;
        next();
    } catch (error) {
        console.error("Protect Middleware Error:", error);
        return res.status(500).json({ message: "Protect Error" });
    }
};

export default protect