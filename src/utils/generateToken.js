import jwt from 'jsonwebtoken';

export const generateToken = (userId, res) => {
   const payload = { id: userId }
   const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
   })
   res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      samesite: "strict",
      maxAge: (1000 * 60 * 60 * 24) * 7,
   })
   return token;
};
//?jwt is used to identify user is not faking who he is but the user who he claims he is
//?for in this func that we use sa part of user ie his id then its going to sign jwt with our own personal server's secret key so people cant fake a jwt from their part