import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";
import e from "cors";

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
            }
        });
        res.status(200).json({ status: "success", data: { users } });
    } catch (error: any) {
        res.status(500).json({ error: "Server Error" });
    }
};

// Get single user
export const getUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string; //?. req.params = URL ke andar chipka hua data , req.body = body andar bheja hua data (hidden payload)
        //!  Ek important condition (ye log bhool jaate hain)

        //! Agar ye line nahi likhi:

        //! app.use(express.json());

        //!  to req.body undefined ho jayega
        //!  kyunki Express ko samajh hi nahi aayega JSON ko parse kaise kare
        const user = await prisma.user.findUnique({
            where: { id },
            select: { 
                id: true, 
                name: true, 
                email: true, 
                createdAt: true,
                wallet:true,
                _count:{
                    select: {
                     orders: true
                    }
                }
             }
        });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.status(200).json({ status: "success", data: { user } });
    } catch (error: any) {
        res.status(500).json({ error: "Server Error" });
    }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, email } = req.body as any;

        // let dataToUpdate: any = {};
        // if (name) dataToUpdate.name = name;
        // if (email) dataToUpdate.email = email;

        const user = await prisma.user.update({
            where: { id },
            data: {
                ...name&& {name},
                ...email&& {email}
            },
            select: { id: true, name: true, email: true, createdAt: true }
            //! Notice: select use kiya hai taaki password kabhi response mein na jaye — only safe fields return hoti hain.
        });

        res.status(200).json({ status: "success", data: { user } });
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ error: "User not found" });
        res.status(500).json({ error: "Server Error" });
    }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        await prisma.user.delete({
            where: { id }
        });

        res.status(200).json({
            status: "success",
            message: "user deleted successfully"
        });
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ error: "User not found" });
        res.status(500).json({ error: "Server Error" });
    }
};
