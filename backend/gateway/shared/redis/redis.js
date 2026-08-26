import Redis from "ioredis"
import dotenv from "dotenv"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CACHE_FILE = path.join(__dirname, ".shared_cache.json")

class InMemoryStore {
  constructor() {
    this.cacheFile = CACHE_FILE
  }

  _readStore() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const raw = fs.readFileSync(this.cacheFile, "utf-8")
        return JSON.parse(raw) || {}
      }
    } catch (e) {
      // ignore read errors
    }
    return {}
  }

  _writeStore(data) {
    try {
      fs.writeFileSync(this.cacheFile, JSON.stringify(data, null, 2), "utf-8")
    } catch (e) {
      // ignore write errors
    }
  }

  async get(key) {
    const store = this._readStore()
    const item = store[key]
    if (!item) return null
    if (item.expiry && item.expiry < Date.now()) {
      delete store[key]
      this._writeStore(store)
      return null
    }
    return item.value
  }

  async set(key, value, mode, seconds) {
    const store = this._readStore()
    if (value === undefined || value === null || value === "undefined") {
      delete store[key]
      this._writeStore(store)
      return "OK"
    }
    const expiry = (mode === "EX" && seconds) ? Date.now() + (seconds * 1000) : null
    store[key] = { value: String(value), expiry }
    this._writeStore(store)
    return "OK"
  }

  async del(key) {
    const store = this._readStore()
    delete store[key]
    this._writeStore(store)
    return 1
  }

  async incr(key) {
    const store = this._readStore()
    const item = store[key]
    let currentVal = 0
    let expiry = null
    if (item) {
      if (item.expiry && item.expiry < Date.now()) {
        currentVal = 0
      } else {
        currentVal = parseInt(item.value, 10) || 0
        expiry = item.expiry
      }
    }
    const newVal = currentVal + 1
    store[key] = { value: String(newVal), expiry }
    this._writeStore(store)
    return newVal
  }

  async expire(key, seconds) {
    const store = this._readStore()
    if (store[key]) {
      store[key].expiry = Date.now() + (seconds * 1000)
      this._writeStore(store)
      return 1
    }
    return 0
  }

  async ttl(key) {
    const store = this._readStore()
    const item = store[key]
    if (!item) return -2
    if (!item.expiry) return -1
    const remaining = Math.ceil((item.expiry - Date.now()) / 1000)
    if (remaining <= 0) {
      delete store[key]
      this._writeStore(store)
      return -2
    }
    return remaining
  }

  on() {}
}

const memStore = new InMemoryStore()
let redisClient = null

try {
  const url = process.env.REDIS_URL || "redis://127.0.0.1:6379"
  redisClient = new Redis(url, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
    connectTimeout: 1500,
    enableOfflineQueue: false
  })

  redisClient.on("connect", () => {
    console.log("✅ Redis connected successfully")
  })

  redisClient.on("error", (err) => {
    // Silent fallback to shared store
  })
} catch (err) {
  redisClient = null
}

const redis = new Proxy(memStore, {
  get(target, prop) {
    if (redisClient && redisClient.status === "ready" && typeof redisClient[prop] === "function") {
      return redisClient[prop].bind(redisClient)
    }
    if (typeof memStore[prop] === "function") {
      return memStore[prop].bind(memStore)
    }
    return target[prop]
  }
})

export default redis