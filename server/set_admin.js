import db from './db.js'

db.run("UPDATE users SET role = 'admin' WHERE student_id = 'D1348816'", (err) => {
  if (err) console.error(err)
  else console.log('成功設為幹部')
  process.exit(0)
})
