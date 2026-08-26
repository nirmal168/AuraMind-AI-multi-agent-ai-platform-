import { cert, initializeApp, getApps } from "firebase-admin/app"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let credential = null

// 1. Try reading from FIREBASE_SERVICE_ACCOUNT environment variable (JSON string or base64)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim()
    const jsonStr = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8")
    credential = cert(JSON.parse(jsonStr))
  } catch (err) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:", err.message)
  }
}

// 2. Try reading from file path specified in FIREBASE_SERVICE_ACCOUNT_PATH or default locations
if (!credential) {
  const possiblePaths = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    path.resolve(__dirname, "../serviceAccountKey.json"),
    path.resolve(process.cwd(), "serviceAccountKey.json")
  ].filter(Boolean)

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const rawData = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "")
        credential = cert(JSON.parse(rawData))
        console.log(`✅ Loaded Firebase Service Account from: ${filePath}`)
        break
      } catch (err) {
        console.error(`❌ Error reading Firebase Service Account from ${filePath}:`, err.message)
      }
    }
  }
}

if (!credential) {
  console.warn("⚠️ Warning: Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT in your .env or place serviceAccountKey.json in the auth service folder.")
}

export const app = getApps().length === 0 && credential
  ? initializeApp({ credential })
  : (getApps()[0] || null)

