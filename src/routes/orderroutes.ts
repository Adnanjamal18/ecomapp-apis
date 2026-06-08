import express from "express";
import { createOrder, getMyOrders } from "../controllers/ordercontroller.js";
import { authmiddleware } from "../middlewares/authmiddleware.js";

// ============================================================
// 🛒 ORDER ROUTES
// ============================================================
// Dono routes pe sirf authmiddleware hai
// Kyunki koi bhi logged-in user order place kar sakta hai
// Admin restriction yahan nahi chahiye
//
// POST /orders → Order place karo (body mein { "productId": "..." })
// GET  /orders → Apne saare orders dekho
// ============================================================

const router = express.Router();

router.use(authmiddleware);

// POST /orders → Product khareedn
router.post("/createorder", createOrder);

// GET /orders → Apne orders dekho
router.get("/getorder", getMyOrders);

export default router;
