import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';

export const generateToken = (userId: string, res: Response) => {
   const payload = { id: userId }
   const options: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any,
   };
   const token = jwt.sign(payload, process.env.JWT_SECRET as string, options)
   res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: (1000 * 60 * 60 * 24) * 7,
   })
   return token;
};
//?jwt is used to identify user is not faking who he is but the user who he claims he is