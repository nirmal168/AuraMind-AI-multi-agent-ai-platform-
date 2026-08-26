import redis from "../shared/redis/redis.js"

const protect = async (req, res, next) => {
    try {
        console.log("Reached middleware");

        console.log("Cookies:", req.cookies);

        const sessionId = req.cookies?.session || req.headers['x-session-id'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');

        if (!sessionId) {
            return res.status(401).json({ message: "Unauthorized: No session token provided" });
        }

        const session = await redis.get(`session-${sessionId}`);

        console.log("Redis Session:", session);

        if (!session) {
            return res.status(400).json({ message: "Session expired" });
        }

        req.user = JSON.parse(session);

        next();
    } catch (error) {
        console.log(error);

        return res.status(500).json({ message: "Protect Error" });
    }
};

export default protect