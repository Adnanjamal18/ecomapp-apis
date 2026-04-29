import jwt from 'jsonwebtoken';
import { prisma } from "../config/db.js";

///READ THE TOKEN FORM THE REQUEST 
// CHECK IF TOKEN IS VALID
//? WE ARE NOW GONNA REQUIRE THAT THE PERSON MAKING REQUEST SENDS IN THE JWT THROUGH THE HEADERS 
/// WHY NOT THROUGH THE BODY 
//* WELL COZ THE HEADERS ARE DESIGNED FOR AUTHENTICATION WHILE THE BODY IS ACTULLY DESIGNED FOR CONTENT OF THE REQUEST
export const authmiddleware = async (req, res, next) => {
    console.log("auth middleware reached");
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1] //?"bearer" , "fvyfvwyfgwyf" splits based on the space and we grab the second element in array the jwt via 1 index
    }
    else if (req.cookies?.jwt) {
        token = req.cookies.jwt;
    }
    //? Step 1: Token dhundho
    //? ├── Headers mein check karo: "Bearer <token>"
    // ?├── Ya cookies mein check karo
    // ?└── Agar token nahi mila → 401 "Not authorized, no token"
    if (!token) {
        return res.status(401).json({ error: "Not authorized, no token provided" });
    }
    //? Step 2: Token verify karo
    //? ├── jwt.verify() se decode karo
    //? ├── Decoded token se user ID nikalo
    //? └── Agar token invalid/expired → 401 "Token failed
    try {
        // Verify token and extract the user Id
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ?Step 3: User database mein hai?
        //? ├── prisma.user.findUnique() se check karo
        //?├── Agar user delete ho chuka → 401 "User no longer exists"
        //?└── Agar sab sahi hai ↓
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
        });

        if (!user) {
            return res.status(401).json({ error: "User no longer exists" });
        }
        //? Step 4: req.user = user (user info attach karo request pe)
        //? Step 5: next() → Agla controller function chala do
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Not authorized, token failed" });
    }
}; 