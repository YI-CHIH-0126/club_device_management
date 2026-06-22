import express from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: '權限不足' })
  next()
}

// GET /api/admin/users - 取得所有社員
router.get('/', requireAuth, requireAdmin, (req, res) => {
  db.all(
    'SELECT student_id, name, department_class, role, suspended, created_at FROM users ORDER BY created_at DESC',
    (err, rows) => {
      if (err) return res.status(500).json({ message: '資料庫錯誤' })
      res.json(rows)
    }
  )
})

// PUT /api/admin/users/:student_id/role - 設定角色
router.put('/:student_id/role', requireAuth, requireAdmin, (req, res) => {
  const { role } = req.body
  if (!['member', 'admin'].includes(role)) return res.status(400).json({ message: '角色無效' })

  db.run(
    'UPDATE users SET role = ? WHERE student_id = ?',
    [role, req.params.student_id],
    function (err) {
      if (err) return res.status(500).json({ message: '更新失敗' })
      if (this.changes === 0) return res.status(404).json({ message: '使用者不存在' })
      res.json({ message: '角色已更新' })
    }
  )
})

// PUT /api/admin/users/:student_id/suspend - 暫停或恢復借用權限
router.put('/:student_id/suspend', requireAuth, requireAdmin, (req, res) => {
  const { suspended } = req.body

  if (req.params.student_id === req.user.student_id) {
    return res.status(400).json({ message: '不能暫停自己的權限' })
  }

  db.run(
    'UPDATE users SET suspended = ? WHERE student_id = ?',
    [suspended ? 1 : 0, req.params.student_id],
    function (err) {
      if (err) return res.status(500).json({ message: '更新失敗' })
      if (this.changes === 0) return res.status(404).json({ message: '使用者不存在' })
      res.json({ message: suspended ? '已暫停借用權限' : '已恢復借用權限' })
    }
  )
})

export default router
