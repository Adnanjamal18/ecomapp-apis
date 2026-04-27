import express from "express";
import { getAllUsers, getUser, updateUser, deleteUser } from "../controllers/usercontroller.js";
import { authmiddleware } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.use(authmiddleware);

router.route("/")
    .get(getAllUsers);

router.route("/:id")
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser);

export default router;
