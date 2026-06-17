# 社團器材管理系統系統規格書 (System Specification)

## 1. 系統概述 (System Overview)

本系統旨在提供社團（如自行車社、資工創客社等）管理出借給社員的器材與耗材。系統區分「社員」與「幹部」兩種角色，支援器材狀態追蹤、照片上傳存證以及耗材數量管理。

### 技術棧 (Technical Stack)

* **前端 (Frontend):** Vue 3 (建議搭配 Vite, Pinia, Vue Router, Tailwind CSS 或 Element Plus)
* **後端 (Backend):** Node.js + Express
* **資料庫 (Database):** SQLite (使用 `sqlite3` 或 `sequelize` ORM)
* **檔案儲存:** 本地靜態資料夾 (Express static) 或 雲端物件儲存 (如 AWS S3 / Cloudinary)

---

## 2. 使用者角色與權限 (Roles & Permissions)

| 功能 \ 角色 | 訪客 (未登入) | 社員 (已登入) | 幹部 (已登入) |
| --- | --- | --- | --- |
| 瀏覽主頁器材列表與狀態 | Logged In/Out | O | O |
| 註冊 / 登入帳號 | O | O | O |
| 借用器材 (上傳前照片+填時間) | X | O | O |
| 歸還器材 (上傳後照片) | X | O | O |
| 查看個人借用紀錄 | X | O | O |
| 查看全社團借用紀錄 | X | X | O |
| 新增、編輯、報廢器材 | X | X | O |

---

## 3. 功能需求 (Functional Requirements)

### 3.1 帳號與認證模組

* **註冊:** 欄位包含 學號 (ID, 唯一值)、密碼、姓名、系級、角色 (預設為社員，幹部帳號可由資料庫預設或特定邀請碼升級)。
* **登入:** 使用學號與密碼進行認證，後端回傳 JWT Token 作為後續請求憑證。

### 3.2 器材瀏覽模組 (主頁)

* 顯示所有社團器材，分為**工具**與**耗材**兩大類。
* **工具狀態顯示:** 顯示「可借用」或「出借中（附帶預計歸還時間）」。
* **耗材狀態顯示:** 顯示「剩餘數量」，若數量為 0 則顯示「已無庫存」。

### 3.3 借還書/器材操作模組

* **借用工具:** 1. 選擇可借用器材。
2. 必須拍攝/上傳「使用前照片」。
3. 填寫「預計歸還時間」。
4. 確認後，工具狀態變更為「出借中」。
* **歸還工具:** 1. 選擇個人出借中的器材。
2. 必須拍攝/上傳「使用後照片」。
3. 確認後，工具狀態變更為「可借用」。
* **領用耗材:** 1. 選擇耗材並輸入「領用數量」。
2. 確認後，系統自動扣減該耗材的剩餘數量。

### 3.4 幹部管理模組

* **器材上架:** 登錄新器材，設定名稱、分類（工具/耗材）、初始數量（耗材類）。
* **器材報廢:** 可將損壞工具設為「已報廢」，或調整耗材庫存。
* **紀錄審查:** 檢視全社團歷史借用流水帳，包含借還照片對比、借用人（學號/姓名）及時間。

---

## 4. 資料庫設計 (Database Schema)

針對 SQLite 的特性，設計以下 4 張核心資料表：

### Users (使用者表)

```sql
CREATE TABLE users (
    student_id TEXT PRIMARY KEY,        -- 學號 (主鍵)
    password_hash TEXT NOT NULL,       -- 加密後的密碼
    name TEXT NOT NULL,                 -- 姓名
    department_class TEXT NOT NULL,    -- 系級 (如: 資工二甲)
    role TEXT CHECK(role IN ('member', 'admin')) DEFAULT 'member', -- 角色
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

```

### Equipments (器材表)

```sql
CREATE TABLE equipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                 -- 器材名稱
    category TEXT CHECK(category IN ('tool', 'consumable')) NOT NULL, -- 分類: 工具/耗材
    status TEXT CHECK(status IN ('available', 'borrowed', 'scrapped')) DEFAULT 'available', -- 工具狀態
    stock_quantity INTEGER DEFAULT 1,   -- 剩餘數量 (耗材使用，工具預設為 1)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

```

### Borrow_Records (借用紀錄表)

```sql
CREATE TABLE borrow_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_id INTEGER NOT NULL,
    student_id TEXT NOT NULL,
    borrow_time DATETIME DEFAULT CURRENT_TIMESTAMP,      -- 實際借用時間
    expected_return_time DATETIME,                      -- 預計歸還時間
    actual_return_time DATETIME,                        -- 實際歸還時間
    photo_before_url TEXT NOT NULL,                    -- 借用前照片路徑
    photo_after_url TEXT,                               -- 歸還後照片路徑
    FOREIGN KEY (equipment_id) REFERENCES equipments(id),
    FOREIGN KEY (student_id) REFERENCES users(student_id)
);

```

### Consumable_Logs (耗材領用紀錄表)

```sql
CREATE TABLE consumable_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_id INTEGER NOT NULL,
    student_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,                           -- 領用數量
    taken_time DATETIME DEFAULT CURRENT_TIMESTAMP,      -- 領用時間
    FOREIGN KEY (equipment_id) REFERENCES equipments(id),
    FOREIGN KEY (student_id) REFERENCES users(student_id)
);

```

---

## 5. API 路由設計 (API Endpoints)

所有需要認證的 API 均需在 Header 帶入 `Authorization: Bearer <JWT_TOKEN>`。

### 5.1 使用者與認證

* `POST /api/auth/register` - 註冊新帳號
* `POST /api/auth/login` - 登入並取得 Token
* `GET /api/auth/me` - 取得當前登入使用者資訊

### 5.2 器材瀏覽與管理

* `GET /api/equipments` - 獲取所有器材列表 (主頁用)
* `POST /api/equipments` - [幹部] 新增器材
* `PUT /api/equipments/:id` - [幹部] 修改器材或更新耗材庫存
* `DELETE /api/equipments/:id` - [幹部] 報廢/刪除器材

### 5.3 借還與領用操作

* `POST /api/borrow` - 借用工具 (需上傳檔案 `photo_before`，欄位 `equipment_id`, `expected_return_time`)
* `POST /api/return/:record_id` - 歸還工具 (需上傳檔案 `photo_after`)
* `POST /api/consume` - 領用耗材 (欄位 `equipment_id`, `quantity`)

### 5.4 紀錄查詢

* `GET /api/records/my` - 查詢個人借用與領用歷史
* `GET /api/records/all` - [幹部] 查詢全社團所有借還紀錄

---

## 6. 前端頁面規劃 (Frontend Pages)

* `/login` & `/register` - 登入與註冊頁。
* `/` (Home) - 主頁，展示所有器材卡片、狀態、剩餘數量。提供「借用」與「領用」按鈕。
* `/dashboard` - 個人中心，顯示目前自己借用中的器材（附「歸還」按鈕）以及歷史紀錄。
* `/admin/manage` - [幹部專屬] 器材上架與庫存調整面板。
* `/admin/records` - [幹部專屬] 全社團借用流水帳，點擊可放大查看前後照片對比。

---

## 7. 開發注意事項 (Notes for Development)

1. **圖片上傳處理:** Express 後端建議使用 `multer` 套件來接收前端相機拍攝傳來的圖片檔案，並儲存在後端的 `public/uploads/` 目錄，資料庫則儲存相對路徑字串（如 `/uploads/photo_123.jpg`）。
2. **SQLite 的並發與佈署:** SQLite 是檔案型資料庫，雖然不適合極高並發，但對於社團管理（同時上線人數少）非常夠用。請確保資料庫檔案（如 `database.sqlite`）有定期備份。
3. **密碼安全性:** 使用者註冊時，後端切記使用 `bcrypt` 套件對密碼進行 Hash 雜湊後再存入資料庫，絕對不能存明文。