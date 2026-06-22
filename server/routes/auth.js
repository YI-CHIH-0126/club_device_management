import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'club_secret_key';

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { student_id, password, name, department_class } = req.body;

  if (!student_id || !password || !name || !department_class) {
    return res.status(400).json({ message: '請填寫所有必填欄位' });
  }

  const userRole = 'member';

  db.get('SELECT student_id FROM users WHERE student_id = ?', [student_id], async (err, row) => {
    if (err) return res.status(500).json({ message: '資料庫錯誤' });
    if (row) return res.status(409).json({ message: '學號已被註冊' });

    try {
      const password_hash = await bcrypt.hash(password, 10);
      db.run(
        'INSERT INTO users (student_id, password_hash, name, department_class, role) VALUES (?, ?, ?, ?, ?)',
        [student_id, password_hash, name, department_class, userRole],
        function (err) {
          if (err) return res.status(500).json({ message: '註冊失敗' });

          const token = jwt.sign({ student_id, role: userRole }, JWT_SECRET, { expiresIn: '7d' });
          res.status(201).json({
            message: '註冊成功',
            token,
            user: { student_id, name, department_class, role: userRole },
          });
        }
      );
    } catch {
      res.status(500).json({ message: '密碼加密失敗' });
    }
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { student_id, password } = req.body;

  if (!student_id || !password) {
    return res.status(400).json({ message: '請填寫學號與密碼' });
  }

  db.get('SELECT * FROM users WHERE student_id = ?', [student_id], async (err, user) => {
    if (err) return res.status(500).json({ message: '資料庫錯誤' });
    if (!user) return res.status(401).json({ message: '學號或密碼錯誤' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: '學號或密碼錯誤' });

    const token = jwt.sign({ student_id: user.student_id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: '登入成功',
      token,
      user: { student_id: user.student_id, name: user.name, department_class: user.department_class, role: user.role },
    });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: '未提供 Token' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    db.get(
      'SELECT student_id, name, department_class, role, created_at FROM users WHERE student_id = ?',
      [payload.student_id],
      (err, user) => {
        if (err) return res.status(500).json({ message: '資料庫錯誤' });
        if (!user) return res.status(404).json({ message: '使用者不存在' });
        res.json({ user });
      }
    );
  } catch {
    res.status(401).json({ message: 'Token 無效或已過期' });
  }
});

export default router;
