import express from "express";
import { createOrAddBalance, getBalance } from "../controllers/walletcontroller.js";
import { authmiddleware } from "../middlewares/authmiddleware.js";

// ============================================================
// 💰 WALLET ROUTES
// ============================================================
// Dono routes pe sirf authmiddleware hai (adminMiddleware NAHI)
// Kyunki wallet har user ka apna hai — admin restriction nahi chahiye
//
// POST /wallet → Balance add karo (body mein { "balance": 500 })
// GET  /wallet → Apna balance check karo
// ============================================================

const router = express.Router();

//? router.use(authmiddleware) → Pehle token check hoga
//? Bina login ke wallet access nahi kar sakte
router.use(authmiddleware);

// POST /wallet → Wallet create ya balance add
router.post("/", createOrAddBalance);

// GET /wallet → Balance check karo
router.get("/", getBalance);

export default router;
