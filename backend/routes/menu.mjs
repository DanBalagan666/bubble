import express from "express";
import { pool } from "../db.mjs";
const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM menu ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка при получении меню" });
  }
});
export default router;
