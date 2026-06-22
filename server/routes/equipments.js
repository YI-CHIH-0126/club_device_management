import express from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/equipments
router.get("/", (req, res) => {
  db.all("SELECT * FROM equipments ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ message: "資料庫錯誤" });
    res.json(rows);
  });
});

// POST /api/equipments - 幹部新增器材
router.post("/", requireAuth, (req, res) => {
  const { name, category, stock_quantity } = req.body;
  if (!name || !category)
    return res.status(400).json({ message: "請填寫名稱與分類" });

  const qty = category === "consumable" ? stock_quantity || 1 : 1;
  db.run(
    "INSERT INTO equipments (name, category, stock_quantity) VALUES (?, ?, ?)",
    [name, category, qty],
    function (err) {
      if (err) return res.status(500).json({ message: "新增失敗" });
      res.status(201).json({
        id: this.lastID,
        name,
        category,
        stock_quantity: qty,
        status: "available",
      });
    },
  );
});

// PUT /api/equipments/:id - 幹部修改器材
router.put("/:id", requireAuth, (req, res) => {
  const { name, status, stock_quantity } = req.body;
  db.run(
    "UPDATE equipments SET name = COALESCE(?, name), status = COALESCE(?, status), stock_quantity = COALESCE(?, stock_quantity) WHERE id = ?",
    [name, status, stock_quantity, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: "更新失敗" });
      if (this.changes === 0)
        return res.status(404).json({ message: "器材不存在" });
      res.json({ message: "更新成功" });
    },
  );
});

// DELETE /api/equipments/:id - 幹部報廢器材
router.delete("/:id", requireAuth, (req, res) => {
  db.run(
    "UPDATE equipments SET status = 'scrapped' WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: "操作失敗" });
      if (this.changes === 0)
        return res.status(404).json({ message: "器材不存在" });
      res.json({ message: "已報廢" });
    },
  );
});

export default router;
