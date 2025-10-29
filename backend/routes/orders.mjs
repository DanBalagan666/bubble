import express from "express";
import { pool } from "../db.mjs";
const router = express.Router();
router.post("/", async (req, res) => {
  try {
    const { user_id, items, total, delivery_type } = req.body;
    const result = await pool.query(
      "INSERT INTO orders (user_id, items, total, delivery_type) VALUES ($1, $2, $3, $4) RETURNING *",
      [user_id, JSON.stringify(items), total, delivery_type]
    );
    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка при создании заказа" });
  }
});
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query("SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC", [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка при получении заказов" });
  }
});
export default router;
