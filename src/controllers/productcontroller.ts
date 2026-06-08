import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";

// ============================================================
// 📦 PRODUCT CONTROLLER — Yeh file product se related sab kaam karti hai
// ============================================================
// Yahan 5 functions hain:
// 1. createProduct   → Naya product banao (sirf ADMIN)
// 2. getAllProducts   → Saare products dekho (koi bhi logged-in user)
// 3. getProduct       → Ek product dekho by ID (koi bhi logged-in user)
// 4. updateProduct   → Product update karo (sirf ADMIN)
// 5. deleteProduct   → Product delete karo (sirf ADMIN)
// ============================================================

// ─────────────────────────────────────────────
// 1️⃣ CREATE PRODUCT — Naya product banana
// ─────────────────────────────────────────────
// Sirf ADMIN hi yeh kar sakta hai (adminMiddleware routes mein check karega)
// req.body se product ki details aayengi (name, price, etc.)
// req.user.id se pata chalega ki kis admin ne banaya — yeh authmiddleware attach karta hai
export const createProduct = async (req: Request, res: Response) => {
    try {
        //? req.body se saari product details nikaal rahe hain
        //? Jaise Postman mein body mein { "name": "iPhone", "price": 999 } bhejoge
        const { name, description, price, stock, imageUrl } = req.body as any;

        //! Validation — check karo ki zaruri fields hain ya nahi
        //! Agar name ya price nahi bheja toh error do
        if (!name || price === undefined) {
            return res.status(400).json({
                error: "Name aur price dena zaruri hai!"
            });
        }

        //* Ab database mein product create karo
        //* prisma.product.create() ek naya row INSERT karta hai Product table mein
        //* createdBy: req.user.id — yeh batata hai ki kis admin ne yeh product banaya
        //* req.user kahan se aaya? → authmiddleware ne token decode karke attach kiya tha!
        const product = await prisma.product.create({
            data: {
                name,           // Product ka naam
                description,    // Product ki description (optional hai, ? schema mein)
                price,          // Product ki price
                stock: stock || 0,  // Kitne items available hain, default 0
                imageUrl,       // Product ki image URL (optional)
                createdBy: (req as any).user.id  //! IMPORTANT: Yeh admin ka ID hai jo token se aaya
            }
        });

        //* 201 = "Created" — successfully naya resource ban gaya
        res.status(201).json({
            status: "success",
            message: "Product created successfully! 🎉",
            data: { product }
        });

    } catch (error: any) {
        console.error("Create Product Error:", error);
        res.status(500).json({ error: "Server Error — product nahi ban paya" });
    }
};

// ─────────────────────────────────────────────
// 2️⃣ GET ALL PRODUCTS — Saare products lao
// ─────────────────────────────────────────────
// Koi bhi logged-in user (USER ya ADMIN) yeh dekh sakta hai
// prisma.product.findMany() se SAARE products aate hain
export const getAllProducts = async (req: Request, res: Response) => {
    try {
        //* findMany() = SELECT * FROM products
        //* Yeh saare products laata hai database se
        //* include: { creator: ... } ka matlab hai ki product ke saath
        //* uska creator (admin) ka naam bhi laao — yeh JOIN jaisa kaam karta hai
        const products = await prisma.product.findMany({
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true  // Sirf creator ka naam chahiye, password nahi!
                    }
                }
            }
        });

        res.status(200).json({
            status: "success",
            results: products.length,  // Kitne products mile — helpful for frontend
            data: { products }
        });

    } catch (error: any) {
        console.error("Get All Products Error:", error);
        res.status(500).json({ error: "Server Error — products nahi aa paye" });
    }
};

// ─────────────────────────────────────────────
// 3️⃣ GET SINGLE PRODUCT — Ek product lao by ID
// ─────────────────────────────────────────────
// URL mein ID aayegi jaise: GET /products/abc-123
// req.params.id se woh ID milegi
export const getProduct = async (req: Request, res: Response) => {
    try {
        //? req.params.id = URL mein jo :id hai woh
        //? Jaise GET /products/abc-123 → req.params.id = "abc-123"
        const id = req.params.id as string;

        //* findUnique() = SELECT * FROM products WHERE id = '...'
        //* Yeh SIRF ek product laata hai jo match kare
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                creator: {
                    select: { id: true, name: true }
                }
            }
        });

        //! Agar product nahi mila toh 404 error do
        if (!product) {
            return res.status(404).json({ error: "Product nahi mila!" });
        }

        res.status(200).json({
            status: "success",
            data: { product }
        });

    } catch (error: any) {
        console.error("Get Product Error:", error);
        res.status(500).json({ error: "Server Error" });
    }
};

// ─────────────────────────────────────────────
// 4️⃣ UPDATE PRODUCT — Product update karo (sirf ADMIN)
// ─────────────────────────────────────────────
// Admin URL mein ID bhejega aur body mein updated data
// Jaise: PUT /products/abc-123 with body { "price": 1299 }
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, description, price, stock, imageUrl } = req.body as any;

        //* Ek object banao jisme sirf wohi fields hain jo user ne bhejin
        //* Matlab agar sirf price bheja toh sirf price update hoga, baaki same rahega
        let dataToUpdate: any = {};
        if (name) dataToUpdate.name = name;
        if (description !== undefined) dataToUpdate.description = description;
        if (price !== undefined) dataToUpdate.price = price;
        if (stock !== undefined) dataToUpdate.stock = stock;
        if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl;

        //* prisma.product.update() = UPDATE products SET ... WHERE id = '...'
        const product = await prisma.product.update({
            where: { id },
            data: dataToUpdate,
        });

        res.status(200).json({
            status: "success",
            message: "Product updated successfully! ✏️",
            data: { product }
        });

    } catch (error: any) {
        //! P2025 = Prisma error code jab record nahi milta
        //! Matlab koi aisi ID bhej raha jo exist nahi karti
        if (error.code === 'P2025') {
            return res.status(404).json({ error: "Product nahi mila for update!" });
        }
        console.error("Update Product Error:", error);
        res.status(500).json({ error: "Server Error" });
    }
};

// ─────────────────────────────────────────────
// 5️⃣ DELETE PRODUCT — Product delete karo (sirf ADMIN)
// ─────────────────────────────────────────────
// Admin URL mein ID bhejega: DELETE /products/abc-123
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        //* prisma.product.delete() = DELETE FROM products WHERE id = '...'
        await prisma.product.delete({
            where: { id }
        });

        res.status(200).json({
            status: "success",
            message: "Product deleted successfully! 🗑️"
        });

    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: "Product nahi mila for delete!" });
        }
        console.error("Delete Product Error:", error);
        res.status(500).json({ error: "Server Error" });
    }
};
