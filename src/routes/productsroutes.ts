import express from "express";
import {
    createProduct,
    getAllProducts,
    getProduct,
    updateProduct,
    deleteProduct
} from "../controllers/productcontroller.js";
import { authmiddleware } from "../middlewares/authmiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";

// ============================================================
// 🛣️ PRODUCT ROUTES — Yeh file decide karti hai ki kaun sa URL kaun sa function chalayega
// ============================================================
//
// ROLE-BASED ACCESS CONTROL (RBAC) ka concept:
// ─────────────────────────────────────────────
// Soch ek building hai:
// 1. authmiddleware = Building ka main gate (token chahiye = logged in hona chahiye)
// 2. adminMiddleware = VIP room ka darwaza (sirf ADMIN role wale enter kar sakte hain)
//
// GET routes     → Sirf main gate (authmiddleware) chahiye — koi bhi logged-in user dekh sakta
// POST/PUT/DELETE → Main gate + VIP room (authmiddleware + adminMiddleware) — sirf ADMIN
// ============================================================

const router = express.Router();

//? router.use(authmiddleware) → Yeh SABSE PEHLE lagaya hai
//? Iska matlab: is file ki SAARI routes pe pehle yeh chalega
//? Toh chahe GET ho ya POST, pehle user ka token check hoga
router.use(authmiddleware);

// ─────────────────────────────────────────────
// 📖 READ ROUTES — Koi bhi logged-in user dekh sakta hai
// ─────────────────────────────────────────────
// GET /products        → Saare products lao
// GET /products/:id    → Ek product lao by ID
//
// Yahan adminMiddleware NAHI lagaya kyunki USER ko bhi products dekhne hain!

router.get("/getproducts", getAllProducts);
router.get("/:id", getProduct);

// ─────────────────────────────────────────────
// 🔒 ADMIN-ONLY ROUTES — Sirf Admin Create/Update/Delete kar sakta hai
// ─────────────────────────────────────────────
// POST   /products      → Naya product banao
// PUT    /products/:id  → Product update karo
// DELETE /products/:id  → Product delete karo
//
//? adminMiddleware is function ke PEHLE lagaya hai (middleware chaining)
//? Flow: Request → authmiddleware (token check) → adminMiddleware (role check) → Controller
//? Agar user ADMIN nahi hai → 403 "Access denied" milega, controller tak pahunchega hi nahi!

router.post("/create", adminMiddleware, createProduct);
router.put("/:id", adminMiddleware, updateProduct);
router.delete("/:id", adminMiddleware, deleteProduct);

export default router;