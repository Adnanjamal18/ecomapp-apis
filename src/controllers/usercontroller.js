import { prisma } from "../config/db.js";

// Get all users
export const getAllUsers = async (req, res) => {
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
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
};

// Get single user
export const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, createdAt: true }
        });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.status(200).json({ status: "success", data: { user } });
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
};

// Update user
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        let dataToUpdate = {};
        if (name) dataToUpdate.name = name;
        if (email) dataToUpdate.email = email;

        const user = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
            select: { id: true, name: true, email: true, createdAt: true }
        });

        res.status(200).json({ status: "success", data: { user } });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ error: "User not found" });
        res.status(500).json({ error: "Server Error" });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.user.delete({
            where: { id }
        });

        res.status(200).json({
            status: "success",
            message: "user deleted successfully"
        });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ error: "User not found" });
        res.status(500).json({ error: "Server Error" });
    }
};
