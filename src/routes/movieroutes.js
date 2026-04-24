//const express =require('express');
import express from "express";


const router = express.Router()

router.get("/moi", (req, res) => {
    res.json({ httpMethod: "get" });
});
router.put("/", (req, res) => {
    res.json({ httpMethod: "put" });
});
router.post("/", (req, res) => {
    res.json({ httpMethod: "post" });
});
router.delete("/", (req, res) => {
    res.json({ httpMethod: "delete" });
});

export default router;