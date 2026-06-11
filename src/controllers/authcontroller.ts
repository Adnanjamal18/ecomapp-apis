import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";
import bcrypt, { compare } from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
//when you use post req you are usually tyring to create data in your database 

const register = async (req: Request, res: Response) => { // the way you send data to db from your client is through req.body
    const { name, email, password } = req.body as any;  // Yeh request body se data le rahi hai

    //check if user already exists
    const userexists = await prisma.user.findUnique({ // Yeh user ko find karti hai
        where: {
            email: email
        }
    })

    if (userexists) { // Yeh check karti hai ki user already exists hai ya nahi
        return res
            .status(400)
            .json({ error: "user already exists with this email" })
    }

    //hash the password
    const salt = await bcrypt.genSalt(10) // Yeh password ko hash karti hai
    const hashedPassword = await bcrypt.hash(password, salt) // Yeh password ko hash karti hai

    // Creeate User
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        wallet: {
          create: {
            balance: 6000,
          },
        },
      },
    });
    const token = generateToken(user.id, res);
    res.status(201).json({
        staus: "success", // Yeh status ko print karti hai
        data: {
            user: { // Yeh user ko print karti hai
                id: user.id,
                name: name,
                email: email,
            },
            token
        }
    })
};

//jwt token generate
const login = async (req: Request, res: Response) => {
    const { email, password } = req.body as any;
    //* check is user exists in user table

    const user = await prisma.user.findUnique({
        where: { email: email },
    });

    if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(
        password, user.password //?compares plaintext password with encrypted/hashed password
    );
    if (!isPasswordValid) {
        return res.status(401).json({ error: "invalid email or password" })
    }
    //Generate Jwt TOken
    const token = generateToken(user.id, res);



    res.status(201).json({
        status: "success", // Yeh status ko print karti hai
        data: {
            user: { // Yeh user ko print karti hai
                id: user.id,
                email: email,
            },
            token,
            // javaScript me ek swag feature hota hai:
            // Agar key aur variable ka naam same ho,
            // to tu short me likh sakta hai: //! token: token ➡️ becomes: token
        }
    })
};

const logout = async (req: Request, res: Response) => {
    res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({
        status: "success",
        message: "loged out successfully",
    });
};

export { register, login, logout };