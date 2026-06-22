import sqlite3pkg from "sqlite3";
const sqlite3 = sqlite3pkg.verbose();
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 指定資料庫檔案儲存路徑（會在專案根目錄生成 database.sqlite 檔案）
const DB_PATH = path.join(__dirname, "database.sqlite");

// 建立資料庫連線
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("資料庫連線失敗:", err.message);
  } else {
    console.log("成功連線至 SQLite 資料庫。");
    initializeTables();
  }
});

// 初始化資料表的函數
function initializeTables() {
  // 使用 serialize 確保資料表依序建立
  db.serialize(() => {
    // 1. 建立使用者表 (Users)
    db.run(
      `
            CREATE TABLE IF NOT EXISTS users (
                student_id TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                department_class TEXT NOT NULL,
                role TEXT CHECK(role IN ('member', 'admin')) DEFAULT 'member',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `,
      (err) => {
        if (err) console.error("建立 users 表失敗:", err.message);
      },
    );

    // 2. 建立器材表 (Equipments)
    db.run(
      `
            CREATE TABLE IF NOT EXISTS equipments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT CHECK(category IN ('tool', 'consumable')) NOT NULL,
                status TEXT CHECK(status IN ('available', 'borrowed', 'scrapped')) DEFAULT 'available',
                stock_quantity INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `,
      (err) => {
        if (err) console.error("建立 equipments 表失敗:", err.message);
      },
    );

    // 3. 建立借用紀錄表 (Borrow_Records)
    db.run(
      `
            CREATE TABLE IF NOT EXISTS borrow_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                equipment_id INTEGER NOT NULL,
                student_id TEXT NOT NULL,
                borrow_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                expected_return_time DATETIME,
                actual_return_time DATETIME,
                photo_before_url TEXT NOT NULL,
                photo_after_url TEXT,
                FOREIGN KEY (equipment_id) REFERENCES equipments(id),
                FOREIGN KEY (student_id) REFERENCES users(student_id)
            )
        `,
      (err) => {
        if (err) console.error("建立 borrow_records 表失敗:", err.message);
      },
    );

    // 4. 建立耗材領用紀錄表 (Consumable_Logs)
    db.run(
      `
            CREATE TABLE IF NOT EXISTS consumable_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                equipment_id INTEGER NOT NULL,
                student_id TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                taken_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (equipment_id) REFERENCES equipments(id),
                FOREIGN KEY (student_id) REFERENCES users(student_id)
            )
        `,
      (err) => {
        if (err) console.error("建立 consumable_logs 表失敗:", err.message);
      },
    );

    console.log("所有資料表初始化檢查完成。");
  });
}

// 匯出 db 連線物件供其他檔案使用
export default db;
