import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../public/uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `photo_${Date.now()}${ext}`)
  },
})
const upload = multer({ storage })

const router = express.Router()

// POST /api/borrow - 借用工具
router.post('/borrow', requireAuth, upload.single('photo_before'), (req, res) => {
  const { equipment_id, expected_return_time } = req.body
  const student_id = req.user.student_id

  if (!equipment_id || !expected_return_time || !req.file) {
    return res.status(400).json({ message: '請填寫所有欄位並上傳使用前照片' })
  }

  const photo_before_url = `/uploads/${req.file.filename}`

  db.get('SELECT * FROM equipments WHERE id = ?', [equipment_id], (err, equipment) => {
    if (err) return res.status(500).json({ message: '資料庫錯誤' })
    if (!equipment) return res.status(404).json({ message: '器材不存在' })
    if (equipment.category !== 'tool') return res.status(400).json({ message: '此器材為耗材，請使用領用功能' })
    if (equipment.status !== 'available') return res.status(400).json({ message: '此器材目前無法借用' })

    db.run(
      'INSERT INTO borrow_records (equipment_id, student_id, expected_return_time, photo_before_url) VALUES (?, ?, ?, ?)',
      [equipment_id, student_id, expected_return_time, photo_before_url],
      function (err) {
        if (err) return res.status(500).json({ message: '借用失敗' })

        db.run("UPDATE equipments SET status = 'borrowed' WHERE id = ?", [equipment_id], (err) => {
          if (err) return res.status(500).json({ message: '狀態更新失敗' })
          res.status(201).json({ message: '借用成功', record_id: this.lastID })
        })
      }
    )
  })
})

// POST /api/return/:record_id - 歸還工具
router.post('/return/:record_id', requireAuth, upload.single('photo_after'), (req, res) => {
  const student_id = req.user.student_id
  const { record_id } = req.params

  if (!req.file) return res.status(400).json({ message: '請上傳使用後照片' })

  const photo_after_url = `/uploads/${req.file.filename}`

  db.get('SELECT * FROM borrow_records WHERE id = ?', [record_id], (err, record) => {
    if (err) return res.status(500).json({ message: '資料庫錯誤' })
    if (!record) return res.status(404).json({ message: '借用紀錄不存在' })
    if (record.student_id !== student_id) return res.status(403).json({ message: '無權限操作此紀錄' })
    if (record.actual_return_time) return res.status(400).json({ message: '此器材已歸還' })

    const now = new Date().toISOString()
    db.run(
      'UPDATE borrow_records SET actual_return_time = ?, photo_after_url = ? WHERE id = ?',
      [now, photo_after_url, record_id],
      (err) => {
        if (err) return res.status(500).json({ message: '歸還失敗' })

        db.run("UPDATE equipments SET status = 'available' WHERE id = ?", [record.equipment_id], (err) => {
          if (err) return res.status(500).json({ message: '狀態更新失敗' })
          res.json({ message: '歸還成功' })
        })
      }
    )
  })
})

// POST /api/consume - 領用耗材
router.post('/consume', requireAuth, (req, res) => {
  const { equipment_id, quantity } = req.body
  const student_id = req.user.student_id

  if (!equipment_id || !quantity || quantity <= 0) {
    return res.status(400).json({ message: '請填寫器材與領用數量' })
  }

  db.get('SELECT * FROM equipments WHERE id = ?', [equipment_id], (err, equipment) => {
    if (err) return res.status(500).json({ message: '資料庫錯誤' })
    if (!equipment) return res.status(404).json({ message: '器材不存在' })
    if (equipment.category !== 'consumable') return res.status(400).json({ message: '此器材為工具，請使用借用功能' })
    if (equipment.stock_quantity < quantity) return res.status(400).json({ message: '庫存不足' })

    db.run(
      'INSERT INTO consumable_logs (equipment_id, student_id, quantity) VALUES (?, ?, ?)',
      [equipment_id, student_id, quantity],
      function (err) {
        if (err) return res.status(500).json({ message: '領用失敗' })

        db.run(
          'UPDATE equipments SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [quantity, equipment_id],
          (err) => {
            if (err) return res.status(500).json({ message: '庫存更新失敗' })
            res.status(201).json({ message: '領用成功' })
          }
        )
      }
    )
  })
})

export default router
