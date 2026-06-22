<script setup>
import { ref, onMounted, computed } from 'vue'
import { get, post } from '../api.js'

const equipments = ref([])
const loading = ref(true)
const errorMsg = ref('')

// 借用 modal
const showBorrowModal = ref(false)
const selectedEquipment = ref(null)
const borrowForm = ref({ expected_return_time: '', photo_before: null })
const borrowLoading = ref(false)
const borrowMsg = ref({ type: '', text: '' })

// 領用 modal
const showConsumeModal = ref(false)
const consumeForm = ref({ quantity: 1 })
const consumeLoading = ref(false)
const consumeMsg = ref({ type: '', text: '' })

const tools = computed(() => equipments.value.filter(e => e.category === 'tool'))
const consumables = computed(() => equipments.value.filter(e => e.category === 'consumable'))

async function fetchEquipments() {
  try {
    equipments.value = await get('/api/equipments')
  } catch {
    errorMsg.value = '無法載入器材列表'
  } finally {
    loading.value = false
  }
}

function openBorrow(equipment) {
  selectedEquipment.value = equipment
  borrowForm.value = { expected_return_time: '', photo_before: null }
  borrowMsg.value = { type: '', text: '' }
  showBorrowModal.value = true
}

function openConsume(equipment) {
  selectedEquipment.value = equipment
  consumeForm.value = { quantity: 1 }
  consumeMsg.value = { type: '', text: '' }
  showConsumeModal.value = true
}

function onPhotoChange(e) {
  borrowForm.value.photo_before = e.target.files[0]
}

async function submitBorrow() {
  if (!borrowForm.value.expected_return_time || !borrowForm.value.photo_before) {
    borrowMsg.value = { type: 'error', text: '請填寫歸還時間並上傳照片' }
    return
  }
  borrowLoading.value = true
  borrowMsg.value = { type: '', text: '' }
  try {
    const fd = new FormData()
    fd.append('equipment_id', selectedEquipment.value.id)
    fd.append('expected_return_time', borrowForm.value.expected_return_time)
    fd.append('photo_before', borrowForm.value.photo_before)

    await post('/api/borrow', fd, true)
    borrowMsg.value = { type: 'success', text: '借用成功！' }
    await fetchEquipments()
    setTimeout(() => { showBorrowModal.value = false }, 1000)
  } catch (err) {
    borrowMsg.value = { type: 'error', text: err.response?.data?.message || '借用失敗' }
  } finally {
    borrowLoading.value = false
  }
}

async function submitConsume() {
  if (!consumeForm.value.quantity || consumeForm.value.quantity <= 0) {
    consumeMsg.value = { type: 'error', text: '請輸入有效數量' }
    return
  }
  consumeLoading.value = true
  consumeMsg.value = { type: '', text: '' }
  try {
    await post('/api/consume', {
      equipment_id: selectedEquipment.value.id,
      quantity: Number(consumeForm.value.quantity),
    })
    consumeMsg.value = { type: 'success', text: '領用成功！' }
    await fetchEquipments()
    setTimeout(() => { showConsumeModal.value = false }, 1000)
  } catch (err) {
    consumeMsg.value = { type: 'error', text: err.response?.data?.message || '領用失敗' }
  } finally {
    consumeLoading.value = false
  }
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

onMounted(fetchEquipments)
</script>

<template>
  <div class="page">
    <header>
      <h1>社團器材管理系統</h1>
      <nav>
        <a href="/dashboard">我的紀錄</a>
        <button class="logout-btn" @click="logout">登出</button>
      </nav>
    </header>

    <main>
      <p v-if="loading">載入中...</p>
      <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

      <section v-if="!loading">
        <h2>工具</h2>
        <div class="card-grid">
          <div v-if="tools.length === 0" class="empty">目前沒有工具</div>
          <div v-for="e in tools" :key="e.id" class="card">
            <div class="card-name">{{ e.name }}</div>
            <div class="card-status" :class="e.status">
              {{ e.status === 'available' ? '可借用' : e.status === 'borrowed' ? '出借中' : '已報廢' }}
            </div>
            <button
              v-if="e.status === 'available'"
              class="btn-primary"
              @click="openBorrow(e)"
            >借用</button>
          </div>
        </div>
      </section>

      <section v-if="!loading">
        <h2>耗材</h2>
        <div class="card-grid">
          <div v-if="consumables.length === 0" class="empty">目前沒有耗材</div>
          <div v-for="e in consumables" :key="e.id" class="card">
            <div class="card-name">{{ e.name }}</div>
            <div class="card-status" :class="e.stock_quantity > 0 ? 'available' : 'scrapped'">
              {{ e.stock_quantity > 0 ? `剩餘 ${e.stock_quantity}` : '已無庫存' }}
            </div>
            <button
              v-if="e.stock_quantity > 0"
              class="btn-primary"
              @click="openConsume(e)"
            >領用</button>
          </div>
        </div>
      </section>
    </main>

    <!-- 借用 Modal -->
    <div v-if="showBorrowModal" class="modal-backdrop" @click.self="showBorrowModal = false">
      <div class="modal">
        <h3>借用：{{ selectedEquipment?.name }}</h3>
        <div class="form-group">
          <label>預計歸還時間</label>
          <input type="datetime-local" v-model="borrowForm.expected_return_time" />
        </div>
        <div class="form-group">
          <label>使用前照片</label>
          <input type="file" accept="image/*" @change="onPhotoChange" />
        </div>
        <p v-if="borrowMsg.text" class="msg" :class="borrowMsg.type">{{ borrowMsg.text }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showBorrowModal = false">取消</button>
          <button class="btn-primary" :disabled="borrowLoading" @click="submitBorrow">
            {{ borrowLoading ? '處理中...' : '確認借用' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 領用 Modal -->
    <div v-if="showConsumeModal" class="modal-backdrop" @click.self="showConsumeModal = false">
      <div class="modal">
        <h3>領用：{{ selectedEquipment?.name }}</h3>
        <p class="stock-info">剩餘庫存：{{ selectedEquipment?.stock_quantity }}</p>
        <div class="form-group">
          <label>領用數量</label>
          <input type="number" v-model="consumeForm.quantity" min="1" :max="selectedEquipment?.stock_quantity" />
        </div>
        <p v-if="consumeMsg.text" class="msg" :class="consumeMsg.type">{{ consumeMsg.text }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showConsumeModal = false">取消</button>
          <button class="btn-primary" :disabled="consumeLoading" @click="submitConsume">
            {{ consumeLoading ? '處理中...' : '確認領用' }}
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

.logout-btn {
  background: none;
  border: 1px solid #ddd;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
}

main { max-width: 960px; margin: 0 auto; padding: 2rem 1rem; }

section { margin-bottom: 2rem; }
h2 { font-size: 1.1rem; color: #555; margin-bottom: 1rem; border-left: 3px solid #409eff; padding-left: 0.5rem; }

.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }

.card {
  background: #fff;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-name { font-weight: bold; color: #333; }

.card-status { font-size: 0.85rem; padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-block; }
.card-status.available { background: #f0f9eb; color: #67c23a; }
.card-status.borrowed { background: #fdf6ec; color: #e6a23c; }
.card-status.scrapped { background: #fef0f0; color: #f56c6c; }

.btn-primary {
  background: #409eff;
  color: #fff;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: auto;
}
.btn-primary:disabled { background: #a0cfff; cursor: not-allowed; }

.btn-secondary {
  background: #fff;
  color: #666;
  border: 1px solid #ddd;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.empty { color: #aaa; font-size: 0.9rem; }
.error-text { color: #f56c6c; }

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
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.modal h3 { margin-bottom: 1rem; color: #333; }

.stock-info { font-size: 0.9rem; color: #666; margin-bottom: 0.5rem; }

.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.3rem; font-size: 0.9rem; color: #555; }
.form-group input { width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }

.modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem; }

.msg { font-size: 0.85rem; padding: 0.4rem 0.6rem; border-radius: 4px; margin: 0.5rem 0; }
.msg.error { background: #fef0f0; color: #f56c6c; }
.msg.success { background: #f0f9eb; color: #67c23a; }
</style>
