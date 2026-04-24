import express from "express";
import { config } from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";

// Import Routes
import movieRoutes from "./routes/movieroutes.js";
import authRoutes from "./routes/authroutes.js";
// import watchlistRoutes from "./routes/watchlistRoutes.js";

config();// Yeh .env process karti hai
connectDB();// Yeh database connect karti hai

const app = express(); // Yeh express app banati hai

// Body parsing middlwares
app.use(express.json()); // when ever some json format is sent through body it will parse it and make it available in req.body
app.use(express.urlencoded({ extended: true })); // when ever some url encoded format is sent through body it will parse it and make it available in req.body

// API Routes
app.use("/movies", movieRoutes); // Yeh movies routes ko handle karti hai
app.use("/auth", authRoutes); // Yeh auth routes ko handle karti hai
// app.use("/watchlist", watchlistRoutes); // Yeh watchlist routes ko handle karti hai

const PORT = 5001; // Yeh port number hai

const server = app.listen(PORT, () => {
  console.log("ENV:", process.env.DATABASE_URL); // Yeh database URL ko print karti hai
  console.log(`Server running on PORT ${PORT}`); // Yeh server running ko print karti hai
});

// Handle unhandled promise rejections  (e.g., database connection errors)
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err); // Yeh unhandled promise rejections ko print karti hai
  server.close(async () => {
    await disconnectDB(); // Yeh database ko disconnect karti hai
    process.exit(1); // Yeh process ko exit karti hai
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err); // Yeh uncaught exceptions ko print karti hai
  await disconnectDB(); // Yeh database ko disconnect karti hai
  process.exit(1); // Yeh process ko exit karti hai
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully"); // Yeh SIGTERM ko print karti hai
  server.close(async () => {
    await disconnectDB(); // Yeh database ko disconnect karti hai
    process.exit(0); // Yeh process ko exit karti hai
  });
});
