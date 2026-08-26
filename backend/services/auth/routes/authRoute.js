import express from "express"
import { deductCredit, login, logOut, updateUserPayment } from "../controllers/authController.js"

const router = express.Router()

router.post("/login",login)
router.get("/logout",logOut)
router.post("/update-plan",updateUserPayment)
router.post("/deduct-credits",deductCredit)
export default router;