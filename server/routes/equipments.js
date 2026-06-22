import express from "express";
import db from "../db.js"; // 注意：ESM 必須加上 .js 副檔名

const router = express.Router();

// ==========================================
// 1. GET /api/equipments - 獲取所有器材列表
// ==========================================
router.get("/", (req, res) => {
  const sql = "SELECT * FROM equipments";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      message: "success",
      data: rows,
    });
  });
});

// ==========================================
// 2. POST /api/equipments - [幹部] 新增器材
// ==========================================
router.post("/", (req, res) => {
  const { name, category, stock_quantity } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: "名稱與分類為必填欄位" });
  }

  const sql = `INSERT INTO equipments (name, category, stock_quantity) VALUES (?, ?, ?)`;
  // 如果是工具，數量固定為 1；如果是耗材，則使用傳入的數量（預設為 0）
  const quantity = category === "tool" ? 1 : stock_quantity || 0;

  db.run(sql, [name, category, quantity], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      message: "成功上架器材",
      id: this.lastID,
    });
  });
});

// ==========================================
// 3. PUT /api/equipments/:id - [幹部] 修改器材或更新耗材庫存
// ==========================================
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, category, status, stock_quantity } = req.body;

  // 先檢查該器材是否存在
  db.get("SELECT * FROM equipments WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "找不到該器材" });
    }

    // 使用傳入的新值，若沒傳入則保留原本資料庫內的值 (COALESCE 的邏輯)
    const updatedName = name !== undefined ? name : row.name;
    const updatedCategory = category !== undefined ? category : row.category;
    const updatedStatus = status !== undefined ? status : row.status;

    // 耗材才可以修改庫存數量，工具類固定為 1 (除非被報廢)
    let updatedStock = row.stock_quantity;
    if (updatedCategory === "consumable" && stock_quantity !== undefined) {
      updatedStock = stock_quantity;
    } else if (updatedCategory === "tool") {
      updatedStock = 1;
    }

    const sql = `
            UPDATE equipments 
            SET name = ?, category = ?, status = ?, stock_quantity = ? 
            WHERE id = ?
        `;

    db.run(
      sql,
      [updatedName, updatedCategory, updatedStatus, updatedStock, id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({
          message: "器材資料更新成功",
          updated_id: id,
        });
      },
    );
  });
});

// ==========================================
// 4. DELETE /api/equipments/:id - [幹部] 報廢/刪除器材
// ==========================================
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM equipments WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "找不到該器材" });
    }

    // 或者是如果是耗材，直接清空數量；如果是工具，改成已報廢
    const sql = `UPDATE equipments SET status = 'scrapped', stock_quantity = 0 WHERE id = ?`;

    db.run(sql, [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        message: `器材 [${row.name}] 已成功標記為報廢。`,
      });
    });
  });
});

export default router;
