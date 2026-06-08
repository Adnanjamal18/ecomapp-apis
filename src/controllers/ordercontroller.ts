import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";

// ============================================================
// 🛒 ORDER CONTROLLER — User product khareedta hai yahan
// ============================================================
// Yeh SABSE interesting part hai kyunki yahan bohat kuch ek saath hota hai:
// 1. Product ki details check karo (price, stock)
// 2. User ka wallet check karo (balance enough hai?)
// 3. Wallet se paisa kaato
// 4. Order create karo
// 5. Product ka stock kam karo
//
// 🧠 CONCEPT: PRISMA TRANSACTION ($transaction)
// ─────────────────────────────────────────────
// Transaction ka matlab hai: "Ya toh sab kaam ho, ya koi bhi na ho"
// Soch bank transfer:
//   - Tera account se 500 kate
//   - Doosre ke account mein 500 aaye
// Agar beech mein light chali jaye toh?
//   - Bina transaction: tere 500 kat gaye lekin doosre ko nahi mile 😰
//   - Transaction ke saath: agar koi bhi step fail ho → sab rollback (wapas) ✅
// ============================================================

// ─────────────────────────────────────────────
// 1️⃣ CREATE ORDER — Product khareedn
// ─────────────────────────────────────────────
// User body mein { "productId": "abc-123" } bhejega
// Optionally { "productId": "abc-123", "quantity": 2 }
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { productId, quantity = 1 } = req.body as any;
    //? quantity = 1 → agar user quantity na bheje toh default 1 hoga

    //! Validation
    if (!productId) {
      return res.status(400).json({
        error: "productId dena zaruri hai! Kaun sa product khareedna hai?",
      });
    }

    if (quantity <= 0) {
      return res
        .status(400)
        .json({ error: "Quantity 1 ya usse zyada honi chahiye!" });
    }

    //
    // STEP 1: Product find karo — kya yeh product exist karta hai?
    // ─────────────────────────────────────
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res
        .status(404)
        .json({ error: "Product nahi mila! Check karo productId." });
    }

    //? Product ki stock check karo — kya itne items available hain?
    if (product.stock < quantity) {
      return res.status(400).json({
        error: `Stock mein sirf ${product.stock} items hain, tum ${quantity} maang rahe ho!`,
      });
    }

    // ─────────────────────────────────────
    // STEP 2: Total price calculate karo
    // ─────────────────────────────────────
    //? Jaise product Rs.500 ka hai aur quantity 2 hai → total = 1000
    const totalPrice = product.price * quantity;

    // ─────────────────────────────────────
    // STEP 3: User ka wallet find karo
    // ─────────────────────────────────────
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.id },
    });

    if (!wallet) {
      return res.status(400).json({
        error: "Wallet nahi hai! Pehle POST /wallet se balance add karo.",
      });
    }

    // ─────────────────────────────────────
    // STEP 4: Balance check karo — paisa enough hai?
    // ─────────────────────────────────────
    //! Yeh sabse IMPORTANT check hai!
    //! Agar wallet mein 300 hain aur product 500 ka hai → ERROR!
    if (wallet.balance < totalPrice) {
      return res.status(400).json({
        error: `Wallet mein Rs.${wallet.balance} hain, lekin total price Rs.${totalPrice} hai. Balance kam hai! 💸`,
        required: totalPrice,
        currentBalance: wallet.balance,
        shortBy: totalPrice - wallet.balance,
      });
    }

    // ─────────────────────────────────────
    // STEP 5: SAB KUCH EK SAATH KARO (TRANSACTION) 🔄
    // ─────────────────────────────────────
    //* prisma.$transaction() → Ya toh teenon kaam honge, ya koi nahi hoga
    //* 1. Wallet se paisa kaato
    //* 2. Order create karo
    //* 3. Product ka stock kam karo
    //*
    //* Agar beech mein kuch fail ho → sab ROLLBACK (wapas original state)
    //* Yeh isliye important hai taaki:
    //*   - Paisa kate lekin order na bane — YEH NA HO ❌
    //*   - Order bane lekin stock na gire — YEH BHI NA HO ❌

    const [updatedWallet, order, updatedProduct] = await prisma.$transaction([
      //? Transaction mein ek array bhejte hain jisme saare Prisma operations hain
      //? Sab ek saath execute honge atomically (all or nothing)

      // 1️⃣ Wallet se paisa kaato
      prisma.wallet.update({
        where: { userId: req.user.id },
        data: { balance: wallet.balance - totalPrice },
        //? Purana balance - product ka price = naya balance
      }),

      // 2️⃣ Order create karo
      prisma.order.create({
        data: {
          userId: req.user.id, // Kis user ne order kiya
          productId: productId, // Kaun sa product khareeda
          quantity: quantity, // Kitne items
          totalPrice: totalPrice, // Total kitne paise lage
        },
      }),

      // 3️⃣ Product ka stock kam karo
      prisma.product.update({
        where: { id: productId },
        data: { stock: product.stock - quantity },
        //? Purana stock - jo khareeda = naya stock
      }),
    ]);

    //* Sab successful! 🎉
    res.status(201).json({
      status: "success",
      message: "Order successfully place ho gaya! 🛒✅",
      data: {
        order: {
          orderId: order.id,
          product: product.name,
          quantity: order.quantity,
          totalPrice: order.totalPrice,
          orderDate: order.createdAt,
        },
        wallet: {
          previousBalance: wallet.balance,
          deducted: totalPrice,
          remainingBalance: updatedWallet.balance,
        },
      },
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ error: "Server Error — order place nahi ho paya" });
  }
};

// ─────────────────────────────────────────────
// 2️⃣ GET MY ORDERS — Apne saare orders dekho
// ─────────────────────────────────────────────
// User ko sirf APNE orders dikhenge (doosron ke nahi)
// req.user.id se filter hoga — yeh authmiddleware se aata hai
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    //* findMany with where → sirf is user ke orders laao
    //* include: { product: ... } → order ke saath product ki details bhi laao
    //* Jaise SQL mein JOIN hota hai waise Prisma mein include karte hain
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id }, // Sirf MERI orders
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" }, // Newest orders pehle aayenge
    });

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: { orders },
    });
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};
