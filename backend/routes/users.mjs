import express from "express";
import { pool } from "../db.mjs";
const router = express.Router();
router.post("/login", async (req, res) => {
  try {
    const { phone } = req.body;
    let user = await pool.query("SELECT * FROM users WHERE phone=$1", [phone]);
    if (user.rows.length === 0) {
      user = await pool.query(
        "INSERT INTO users (phone, bonus_count) VALUES ($1, 0) RETURNING *",
        [phone]
      );
    }
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка при авторизации" });
  }
});
router.post("/bonus", async (req, res) => {
  try {
    const { user_id, coffees } = req.body;
    // coffees: number of coffees in order
    await pool.query("UPDATE users SET bonus_count = bonus_count + $1 WHERE id=$2", [coffees, user_id]);
    const user = await pool.query("SELECT * FROM users WHERE id=$1", [user_id]);
    const bonus = user.rows[0].bonus_count;
    const free = bonus >= 7 ? true : false;
    if (free) {
      // subtract 7
      await pool.query("UPDATE users SET bonus_count = bonus_count - 7 WHERE id=$1", [user_id]);
    }
    res.json({ bonus: user.rows[0].bonus_count, free });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка при обновлении бонусов" });
  }
});
export default router;
