declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export {}; // Ensure it is treated as a module
