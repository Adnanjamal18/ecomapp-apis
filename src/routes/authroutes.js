import express from "express";
import { register, login, logout } from "../controllers/authcontroller.js"
const router = express.Router();

router.post("/register", register) // Yeh register route hai
router.post("/login", login)
router.post("/Logout", logout)

export default router;
