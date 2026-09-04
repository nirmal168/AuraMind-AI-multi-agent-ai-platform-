import express from "express"
import dotenv from "dotenv"
import proxy from "express-http-proxy"
import cors from "cors"
import protect from "./middleware/authMiddleware.js"
import { getCurrentUser } from "./controllers/userController.js"
import cookieParser from "cookie-parser";
import { proxyWithHeader } from "./utils/proxyWithHeader.js"
import morgan from "morgan"
dotenv.config()

const port = process.env.PORT

const app = express()
app.use(cors({
    origin: (origin, callback) => {
        // Dynamically allow origin (Vercel, localhost, custom domains) with credentials
        callback(null, origin || true);
    },
    credentials: true
}))
app.use(morgan("dev"))
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

const authProxy = proxy(process.env.AUTH_SERVICE || "http://localhost:5001", {
  timeout: 120000,
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    const cookies = proxyRes.headers["set-cookie"]
    if (cookies) {
      userRes.setHeader("Set-Cookie", cookies)
    }
    return proxyResData
  },
  proxyErrorHandler: (err, res, next) => {
    console.error("Auth Proxy Error:", err?.message);
    res.status(502).json({ message: "Auth service connection error. Please verify AUTH_SERVICE URL in Gateway environment variables." });
  }
})

app.use("/api/auth", authProxy)

// Public direct binary file downloads (PPTX, PDF)
app.use("/api/agent/download", proxy(process.env.AGENT_SERVICE, {
  proxyReqPathResolver: (req) => `/download${req.url}`
}))

app.use("/api/chat",protect,proxyWithHeader(process.env.CHAT_SERVICE))
app.use("/api/agent",protect,proxyWithHeader(process.env.AGENT_SERVICE))
app.use("/api/billing",protect,proxyWithHeader(process.env.BILLING_SERVICE))
app.get("/", (req, res) => {
    res.status(200).json({
        status: "OK",
        service: "gateway"
    });
});
app.get("/api/me",protect,getCurrentUser)

app.listen(port,()=>{
    console.log(`gateway started at ${port}`)

    // Permanent 24/7 keep-alive heartbeat: Pings all microservices every 9 minutes to prevent Render free-tier sleep
    const PING_INTERVAL = 9 * 60 * 1000;
    const servicesToPing = [
      process.env.AUTH_SERVICE,
      process.env.CHAT_SERVICE,
      process.env.AGENT_SERVICE,
      "https://auramind-ai-multi-agent-ai-platform-1.onrender.com"
    ].filter(Boolean);

    setInterval(async () => {
      for (const service of servicesToPing) {
        try {
          fetch(service).catch(() => {});
        } catch (e) {}
      }
    }, PING_INTERVAL);
})
