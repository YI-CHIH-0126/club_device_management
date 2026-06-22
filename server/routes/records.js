import express from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// GET /api/records/my - 個人借用與領用歷史
router.get('/my', requireAuth, (req, res) => {
  const student_id = req.user.student_id

  db.all(
    `SELECT br.*, e.name AS equipment_name, e.category
     FROM borrow_records br
     JOIN equipments e ON br.equipment_id = e.id
     WHERE br.student_id = ?
     ORDER BY br.borrow_time DESC`,
    [student_id],
    (err, borrows) => {
      if (err) return res.status(500).json({ message: '資料庫錯誤' })

      db.all(
        `SELECT cl.*, e.name AS equipment_name
         FROM consumable_logs cl
         JOIN equipments e ON cl.equipment_id = e.id
         WHERE cl.student_id = ?
         ORDER BY cl.taken_time DESC`,
        [student_id],
        (err, consumes) => {
          if (err) return res.status(500).json({ message: '資料庫錯誤' })
          res.json({ borrows, consumes })
        }
      )
    }
  )
})

// GET /api/records/all - 幹部查詢全社團紀錄
router.get('/all', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: '權限不足' })

  db.all(
    `SELECT br.*, e.name AS equipment_name, u.name AS student_name
     FROM borrow_records br
     JOIN equipments e ON br.equipment_id = e.id
     JOIN users u ON br.student_id = u.student_id
     ORDER BY br.borrow_time DESC`,
    (err, borrows) => {
      if (err) return res.status(500).json({ message: '資料庫錯誤' })

      db.all(
        `SELECT cl.*, e.name AS equipment_name, u.name AS student_name
         FROM consumable_logs cl
         JOIN equipments e ON cl.equipment_id = e.id
         JOIN users u ON cl.student_id = u.student_id
         ORDER BY cl.taken_time DESC`,
        (err, consumes) => {
          if (err) return res.status(500).json({ message: '資料庫錯誤' })
          res.json({ borrows, consumes })
        }
      )
    }
  )
})

export default router
