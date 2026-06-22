<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '../api.js'

const borrows = ref([])
const consumes = ref([])
const loading = ref(true)
const errorMsg = ref('')

// 歸還 modal
const showReturnModal = ref(false)
const selectedRecord = ref(null)
const returnPhoto = ref(null)
const returnLoading = ref(false)
const returnMsg = ref({ type: '', text: '' })

const user = JSON.parse(localStorage.getItem('user') || '{}')
const isAdmin = user.role === 'admin'

async function fetchRecords() {
  try {
    const data = await get('/api/records/my')
    borrows.value = data.borrows
    consumes.value = data.consumes
  } catch {
    errorMsg.value = '無法載入紀錄'
  } finally {
    loading.value = false
  }
}

function openReturn(record) {
  selectedRecord.value = record
  returnPhoto.value = null
  returnMsg.value = { type: '', text: '' }
  showReturnModal.value = true
}

function onReturnPhotoChange(e) {
  returnPhoto.value = e.target.files[0]
}

async function submitReturn() {
  if (!returnPhoto.value) {
    returnMsg.value = { type: 'error', text: '請上傳使用後照片' }
    return
  }
  returnLoading.value = true
  returnMsg.value = { type: '', text: '' }
  try {
    const fd = new FormData()
    fd.append('photo_after', returnPhoto.value)

    await post(`/api/return/${selectedRecord.value.id}`, fd, true)
    returnMsg.value = { type: 'success', text: '歸還成功！' }
    await fetchRecords()
    setTimeout(() => { showReturnModal.value = false }, 1000)
  } catch (err) {
    returnMsg.value = { type: 'error', text: err.response?.data?.message || '歸還失敗' }
  } finally {
    returnLoading.value = false
  }
}

function formatTime(t) {
  if (!t) return '—'
  return new Date(t).toLocaleString('zh-TW')
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

onMounted(fetchRecords)
</script>

<template>
  <div class="page">
    <header>
      <h1>社團器材管理系統</h1>
      <nav>
        <span class="user-name">{{ user.name }}</span>
        <a href="/">器材列表</a>
        <template v-if="isAdmin">
          <a href="/admin/manage">器材管理</a>
          <a href="/admin/records">借用紀錄</a>
          <a href="/admin/members">社員管理</a>
        </template>
        <button class="logout-btn" @click="logout">登出</button>
      </nav>
    </header>

    <main>
      <p v-if="loading">載入中...</p>
      <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

      <section v-if="!loading">
        <h2>借用紀錄</h2>
        <div v-if="borrows.length === 0" class="empty">尚無借用紀錄</div>
        <table v-else>
          <thead>
            <tr>
              <th>器材</th>
              <th>借用時間</th>
              <th>預計歸還</th>
              <th>實際歸還</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in borrows" :key="r.id">
              <td>{{ r.equipment_name }}</td>
              <td>{{ formatTime(r.borrow_time) }}</td>
              <td>{{ formatTime(r.expected_return_time) }}</td>
              <td>{{ formatTime(r.actual_return_time) }}</td>
              <td>
                <span class="badge" :class="r.actual_return_time ? 'returned' : 'borrowing'">
                  {{ r.actual_return_time ? '已歸還' : '借用中' }}
                </span>
              </td>
              <td>
                <button
                  v-if="!r.actual_return_time"
                  class="btn-primary"
                  @click="openReturn(r)"
                >歸還</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="!loading">
        <h2>耗材領用紀錄</h2>
        <div v-if="consumes.length === 0" class="empty">尚無領用紀錄</div>
        <table v-else>
          <thead>
            <tr>
              <th>耗材</th>
              <th>領用數量</th>
              <th>領用時間</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in consumes" :key="c.id">
              <td>{{ c.equipment_name }}</td>
              <td>{{ c.quantity }}</td>
              <td>{{ formatTime(c.taken_time) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>

    <!-- 歸還 Modal -->
    <div v-if="showReturnModal" class="modal-backdrop" @click.self="showReturnModal = false">
      <div class="modal">
        <h3>歸還：{{ selectedRecord?.equipment_name }}</h3>
        <div class="form-group">
          <label>使用後照片</label>
          <input type="file" accept="image/*" @change="onReturnPhotoChange" />
        </div>
        <p v-if="returnMsg.text" class="msg" :class="returnMsg.type">{{ returnMsg.text }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showReturnModal = false">取消</button>
          <button class="btn-primary" :disabled="returnLoading" @click="submitReturn">
            {{ returnLoading ? '處理中...' : '確認歸還' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f0f2f5; }

header {
  background: #fff;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

header h1 { font-size: 1.2rem; color: #333; }
nav { display: flex; align-items: center; gap: 1rem; }
nav a { color: #409eff; text-decoration: none; font-size: 0.95rem; }
.user-name { font-size: 0.95rem; color: #555; }

.logout-btn {
  background: none;
  border: 1px solid #ddd;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
}

main { max-width: 960px; margin: 0 auto; padding: 2rem 1rem; }
section { margin-bottom: 2.5rem; }
h2 { font-size: 1.1rem; color: #555; margin-bottom: 1rem; border-left: 3px solid #409eff; padding-left: 0.5rem; }

table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
th { background: #f5f7fa; color: #555; font-size: 0.9rem; padding: 0.75rem 1rem; text-align: left; }
td { padding: 0.75rem 1rem; border-top: 1px solid #f0f0f0; font-size: 0.9rem; color: #333; }

.badge { font-size: 0.8rem; padding: 0.2rem 0.5rem; border-radius: 4px; }
.badge.borrowing { background: #fdf6ec; color: #e6a23c; }
.badge.returned { background: #f0f9eb; color: #67c23a; }

.empty { color: #aaa; font-size: 0.9rem; }
.error-text { color: #f56c6c; }

.btn-primary {
  background: #409eff;
  color: #fff;
  border: none;
  padding: 0.35rem 0.7rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}
.btn-primary:disabled { background: #a0cfff; cursor: not-allowed; }

.btn-secondary {
  background: #fff;
  color: #666;
  border: 1px solid #ddd;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
}

.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}

.modal {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.modal h3 { margin-bottom: 1rem; color: #333; }

.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.3rem; font-size: 0.9rem; color: #555; }
.form-group input { width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }

.modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem; }

.msg { font-size: 0.85rem; padding: 0.4rem 0.6rem; border-radius: 4px; margin: 0.5rem 0; }
.msg.error { background: #fef0f0; color: #f56c6c; }
.msg.success { background: #f0f9eb; color: #67c23a; }
</style>
