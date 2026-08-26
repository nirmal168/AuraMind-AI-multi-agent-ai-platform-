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
        if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            callback(null, true);
        } else {
            callback(null, origin === process.env.FRONTEND_URL);
        }
    },
    credentials: true
}))
app.use(morgan("dev"))
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

const authProxy = proxy(process.env.AUTH_SERVICE, {
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    const cookies = proxyRes.headers["set-cookie"]

    console.log("AUTH RESPONSE COOKIES:", cookies)

    if (cookies) {
      userRes.setHeader("Set-Cookie", cookies)
    }

    return proxyResData
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
})
