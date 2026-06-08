import { Request, Response, NextFunction } from "express";
// export const adminMiddleware = (
// req: Request, 
// res: Response, 
// next: NextFunction
// ) => {
//     if (req.user.role !== "ADMIN") {
//         return res.status(403).json({ 
// error: "Access denied, admin only" });
//     }
//     next();
// };
export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log("req.user =", req.user);
  console.log("role =", req.user?.role);

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      error: "Access denied, admin only",
    });
  }
  next();
};