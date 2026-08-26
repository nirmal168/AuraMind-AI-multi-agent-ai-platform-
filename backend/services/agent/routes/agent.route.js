import express from "express"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import { agent } from "../controllers/agent.controller.js";
import multer from "../config/multer.js";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router();

router.post("/chat", multer.single("file"), agent)

router.get("/download/:filename", (req, res) => {
  try {
    const filename = req.params.filename
    const safeFilename = path.basename(filename)
    const filePath = path.join(__dirname, "../temp", safeFilename)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found or expired" })
    }

    const ext = path.extname(safeFilename).toLowerCase()
    let contentType = "application/octet-stream"
    if (ext === ".pptx") contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    else if (ext === ".pdf") contentType = "application/pdf"

    res.setHeader("Content-Type", contentType)
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`)

    const stream = fs.createReadStream(filePath)
    stream.pipe(res)
  } catch (err) {
    console.error("Download error:", err)
    res.status(500).json({ message: "Download failed" })
  }
})

export default router