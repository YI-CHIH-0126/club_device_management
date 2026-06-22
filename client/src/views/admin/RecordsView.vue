<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../../api.js'

const borrows = ref([])
const loading = ref(true)
const errorMsg = ref('')

const photoModal = ref({ show: false, before: '', after: '' })

async function fetchRecords() {
  try {
    const data = await get('/api/records/all')
    borrows.value = data.borrows
  } catch {
    errorMsg.value = '無法載入紀錄'
  } finally {
    loading.value = false
  }
}

function openPhoto(record) {
  photoModal.value = {
    show: true,
    before: record.photo_before_url,
    after: record.photo_after_url,
    name: record.equipment_name,
  }
}

function formatTime(t) {
  if (!t) return '—'
  return new Date(t).toLocaleString('zh-TW')
}

onMounted(fetchRecords)
</script>

<template>
  <div class="page">
    <header>
      <h1>社團器材管理系統</h1>
      <nav>
        <a href="/admin/manage">器材管理</a>
        <a href="/admin/members">社員管理</a>
        <a href="/">器材列表</a>
      </nav>
    </header>

    <main>
      <h2>全社團借用紀錄</h2>
      <p v-if="loading">載入中...</p>
      <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

      <table v-if="!loading">
        <thead>
          <tr>
            <th>器材</th>
            <th>借用人</th>
            <th>借用時間</th>
            <th>預計歸還</th>
            <th>實際歸還</th>
            <th>狀態</th>
            <th>照片</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in borrows" :key="r.id">
            <td>{{ r.equipment_name }}</td>
            <td>
              <div>{{ r.student_name }}</div>
              <div class="sub">{{ r.student_id }}</div>
            </td>
            <td>{{ formatTime(r.borrow_time) }}</td>
            <td>{{ formatTime(r.expected_return_time) }}</td>
            <td>{{ formatTime(r.actual_return_time) }}</td>
            <td>
              <span class="badge" :class="r.actual_return_time ? 'returned' : 'borrowing'">
                {{ r.actual_return_time ? '已歸還' : '借用中' }}
              </span>
            </td>
            <td>
              <button class="btn-photo" @click="openPhoto(r)">查看照片</button>
            </td>
          </tr>
          <tr v-if="borrows.length === 0">
            <td colspan="7" class="empty">尚無紀錄</td>
          </tr>
        </tbody>
      </table>
    </main>

    <!-- 照片 Modal -->
    <div v-if="photoModal.show" class="modal-backdrop" @click.self="photoModal.show = false">
      <div class="photo-modal">
        <div class="photo-modal-header">
          <h3>{{ photoModal.name }} — 前後照片對比</h3>
          <button class="close-btn" @click="photoModal.show = false">✕</button>
        </div>
        <div class="photo-grid">
          <div class="photo-item">
            <p>使用前</p>
            <img v-if="photoModal.before" :src="photoModal.before" alt="使用前" />
            <div v-else class="no-photo">無照片</div>
          </div>
          <div class="photo-item">
            <p>使用後</p>
            <img v-if="photoModal.after" :src="photoModal.after" alt="使用後" />
            <div v-else class="no-photo">尚未歸還</div>
          </div>
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
nav { display: flex; gap: 1rem; }
nav a { color: #409eff; text-decoration: none; font-size: 0.95rem; }

main { max-width: 1100px; margin: 0 auto; padding: 2rem 1rem; }
h2 { font-size: 1.2rem; color: #333; margin-bottom: 1.25rem; }

table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
th { background: #f5f7fa; color: #555; font-size: 0.9rem; padding: 0.75rem 1rem; text-align: left; }
td { padding: 0.75rem 1rem; border-top: 1px solid #f0f0f0; font-size: 0.9rem; color: #333; }

.sub { font-size: 0.8rem; color: #999; }
.empty { text-align: center; color: #aaa; }
.error-text { color: #f56c6c; }

.badge { font-size: 0.8rem; padding: 0.2rem 0.5rem; border-radius: 4px; }
.badge.borrowing { background: #fdf6ec; color: #e6a23c; }
.badge.returned { background: #f0f9eb; color: #67c23a; }

.btn-photo { background: none; border: 1px solid #409eff; color: #409eff; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }

.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; }

.photo-modal { background: #fff; border-radius: 8px; padding: 1.5rem; width: 100%; max-width: 680px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
.photo-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.photo-modal-header h3 { color: #333; font-size: 1rem; }
.close-btn { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #999; }

.photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.photo-item p { text-align: center; font-size: 0.9rem; color: #555; margin-bottom: 0.5rem; }
.photo-item img { width: 100%; border-radius: 6px; object-fit: cover; max-height: 280px; }
.no-photo { height: 160px; background: #f5f7fa; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 0.9rem; }
</style>
