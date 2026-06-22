import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'club_secret_key'

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ message: '未提供 Token' })

  const token = authHeader.split(' ')[1]
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ message: 'Token 無效或已過期' })
  }
}
