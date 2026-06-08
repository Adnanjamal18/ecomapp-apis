import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";

// ============================================================
// 💰 WALLET CONTROLLER — User ke paison ka hisaab kitaab
// ============================================================
// Wallet ka concept:
// - Har user ka ek wallet hota hai (jaise Easypaisa/JazzCash account)
// - User apne wallet mein paisa daal sakta hai (add balance)
// - Jab kuch khareede ga toh wallet se paisa katega
//
// Yahan 2 functions hain:
// 1. createOrAddBalance → Wallet banao ya balance add karo
// 2. getBalance         → Apna balance dekho
// ============================================================

// ─────────────────────────────────────────────
// 1️⃣ CREATE OR ADD BALANCE — Wallet mein paisa daalo
// ─────────────────────────────────────────────
// User body mein { "balance": 500 } bhejega
// Agar wallet pehle se hai → balance ADD hoga (purana + naya)
// Agar wallet nahi hai → naya wallet CREATE hoga
//
// 🧠 CONCEPT: Prisma ka "upsert" = UPDATE + INSERT
// Agar record mila → UPDATE karo
// Agar record nahi mila → INSERT (CREATE) karo
// Dono kaam ek hi function se ho jata hai!
export const createOrAddBalance = async (req: Request, res: Response) => {
    try {
        const { balance } = req.body as any;

        //! Validation — balance positive hona chahiye
        if (!balance || balance <= 0) {
            return res.status(400).json({
                error: "Balance amount positive hona chahiye! Jaise 100, 500, etc."
            });
        }

        //* STEP 1: Pehle check karo ki user ka wallet pehle se hai ya nahi
        const existingWallet = await prisma.wallet.findUnique({
            where: { userId: req.user.id }
            //? userId se search kar rahe hain — yeh @unique hai schema mein
            //? Toh ek user ka sirf ek wallet hoga
        });

        let wallet;

        if (existingWallet) {
            //* CASE 1: Wallet pehle se hai → Balance ADD karo (purana + naya)
            //* Jaise purana balance 300 tha, naya 500 bheja → ab 800 ho jayega
            wallet = await prisma.wallet.update({
                where: { userId: req.user.id },
                data: {
                    balance: existingWallet.balance + balance
                    //? Purana balance + naya amount = updated balance
                }
            });

            res.status(200).json({
                status: "success",
                message: `${balance} Rs add ho gaye! 💰`,
                data: {
                    previousBalance: existingWallet.balance,
                    addedAmount: balance,
                    newBalance: wallet.balance
                }
            });
        } else {
            //* CASE 2: Wallet hai hi nahi → Naya wallet banao
            wallet = await prisma.wallet.create({
                data: {
                    balance: balance,     // Jitna amount bheja utna balance
                    userId: req.user.id   // Kis user ka wallet hai
                }
            });

            res.status(201).json({
                status: "success",
                message: "Wallet create ho gaya aur balance add ho gaya! 🎉",
                data: { wallet }
            });
        }

    } catch (error) {
        console.error("Wallet Error:", error);
        res.status(500).json({ error: "Server Error — wallet mein issue aa gaya" });
    }
};

// ─────────────────────────────────────────────
// 2️⃣ GET BALANCE — Apna wallet balance check karo
// ─────────────────────────────────────────────
// Koi body ya params nahi chahiye — sirf token se user ID nikalte hain
// Jaise ATM mein balance check karte ho!
export const getBalance = async (req: Request, res: Response) => {
    try {
        //* req.user.id → authmiddleware ne token decode karke yeh attach kiya tha
        const wallet = await prisma.wallet.findUnique({
            where: { userId: req.user.id }
        });

        //! Agar wallet hi nahi hai toh user ko batao
        if (!wallet) {
            return res.status(404).json({
                error: "Wallet nahi mila! Pehle POST /wallet se balance add karo."
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                balance: wallet.balance,
                walletId: wallet.id
            }
        });

    } catch (error) {
        console.error("Get Balance Error:", error);
        res.status(500).json({ error: "Server Error" });
    }
};
