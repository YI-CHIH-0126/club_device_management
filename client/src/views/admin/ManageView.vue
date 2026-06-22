<script setup>
import { ref, onMounted } from 'vue'
import { get, post, put, del } from '../../api.js'

const equipments = ref([])
const loading = ref(true)
const msg = ref({ type: '', text: '' })

// 新增器材
const showAddModal = ref(false)
const addForm = ref({ name: '', category: 'tool', stock_quantity: 1 })
const addLoading = ref(false)

// 調整耗材庫存
const showStockModal = ref(false)
const stockTarget = ref(null)
const stockDelta = ref(0)
const stockLoading = ref(false)

async function fetchEquipments() {
  try {
    equipments.value = await get('/api/equipments')
  } finally {
    loading.value = false
  }
}

function showMsg(type, text) {
  msg.value = { type, text }
  setTimeout(() => { msg.value = { type: '', text: '' } }, 2500)
}

async function submitAdd() {
  if (!addForm.value.name) return showMsg('error', '請填寫器材名稱')
  addLoading.value = true
  try {
    await post('/api/equipments', {
      name: addForm.value.name,
      category: addForm.value.category,
      stock_quantity: Number(addForm.value.stock_quantity),
    })
    showMsg('success', '新增成功')
    showAddModal.value = false
    addForm.value = { name: '', category: 'tool', stock_quantity: 1 }
    await fetchEquipments()
  } catch (err) {
    showMsg('error', err.response?.data?.message || '新增失敗')
  } finally {
    addLoading.value = false
  }
}

async function scrapEquipment(e) {
  if (!confirm(`確定要報廢「${e.name}」嗎？`)) return
  try {
    await del(`/api/equipments/${e.id}`)
    showMsg('success', '已報廢')
    await fetchEquipments()
  } catch (err) {
    showMsg('error', err.response?.data?.message || '操作失敗')
  }
}

function openStock(e) {
  stockTarget.value = e
  stockDelta.value = 0
  showStockModal.value = true
}

async function submitStock() {
  const delta = Number(stockDelta.value)
  if (delta === 0) return showMsg('error', '請輸入調整數量')
  const newQty = stockTarget.value.stock_quantity + delta
  if (newQty < 0) return showMsg('error', '庫存不能為負數')
  stockLoading.value = true
  try {
    await put(`/api/equipments/${stockTarget.value.id}`, { stock_quantity: newQty })
    showMsg('success', '庫存已更新')
    showStockModal.value = false
    await fetchEquipments()
  } catch (err) {
    showMsg('error', err.response?.data?.message || '更新失敗')
  } finally {
    stockLoading.value = false
  }
}

onMounted(fetchEquipments)
</script>

<template>
  <div class="page">
    <header>
      <h1>社團器材管理系統</h1>
      <nav>
        <a href="/admin/records">借用紀錄</a>
        <a href="/admin/members">社員管理</a>
        <a href="/">器材列表</a>
      </nav>
    </header>

    <main>
      <div class="page-header">
        <h2>器材管理</h2>
        <button class="btn-primary" @click="showAddModal = true">＋ 新增器材</button>
      </div>

      <p v-if="msg.text" class="msg" :class="msg.type">{{ msg.text }}</p>

      <p v-if="loading">載入中...</p>

      <table v-if="!loading">
        <thead>
          <tr>
            <th>名稱</th>
            <th>分類</th>
            <th>狀態 / 庫存</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in equipments" :key="e.id">
            <td>{{ e.name }}</td>
            <td>{{ e.category === 'tool' ? '工具' : '耗材' }}</td>
            <td>
              <span v-if="e.category === 'tool'" class="badge" :class="e.status">
                {{ e.status === 'available' ? '可借用' : e.status === 'borrowed' ? '出借中' : '已報廢' }}
              </span>
              <span v-else>{{ e.stock_quantity }} 件</span>
            </td>
            <td class="actions">
              <button v-if="e.category === 'consumable'" class="btn-secondary" @click="openStock(e)">調整庫存</button>
              <button v-if="e.status !== 'scrapped'" class="btn-danger" @click="scrapEquipment(e)">報廢</button>
            </td>
          </tr>
        </tbody>
      </table>
    </main>

    <!-- 新增器材 Modal -->
    <div v-if="showAddModal" class="modal-backdrop" @click.self="showAddModal = false">
      <div class="modal">
        <h3>新增器材</h3>
        <div class="form-group">
          <label>名稱</label>
          <input v-model="addForm.name" type="text" placeholder="請輸入器材名稱" />
        </div>
        <div class="form-group">
          <label>分類</label>
          <select v-model="addForm.category">
            <option value="tool">工具</option>
            <option value="consumable">耗材</option>
          </select>
        </div>
        <div v-if="addForm.category === 'consumable'" class="form-group">
          <label>初始數量</label>
          <input v-model="addForm.stock_quantity" type="number" min="1" />
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showAddModal = false">取消</button>
          <button class="btn-primary" :disabled="addLoading" @click="submitAdd">
            {{ addLoading ? '新增中...' : '確認新增' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 調整庫存 Modal -->
    <div v-if="showStockModal" class="modal-backdrop" @click.self="showStockModal = false">
      <div class="modal">
        <h3>調整庫存：{{ stockTarget?.name }}</h3>
        <p class="stock-info">目前庫存：{{ stockTarget?.stock_quantity }} 件</p>
        <div class="form-group">
          <label>調整數量（正數增加，負數減少）</label>
          <input v-model="stockDelta" type="number" placeholder="例：+10 或 -5" />
        </div>
        <p v-if="stockTarget" class="stock-preview">
          調整後：{{ stockTarget.stock_quantity + Number(stockDelta) }} 件
        </p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showStockModal = false">取消</button>
          <button class="btn-primary" :disabled="stockLoading" @click="submitStock">
            {{ stockLoading ? '更新中...' : '確認調整' }}
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
nav { display: flex; gap: 1rem; }
nav a { color: #409eff; text-decoration: none; font-size: 0.95rem; }

main { max-width: 960px; margin: 0 auto; padding: 2rem 1rem; }

.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.page-header h2 { font-size: 1.2rem; color: #333; }

table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
th { background: #f5f7fa; color: #555; font-size: 0.9rem; padding: 0.75rem 1rem; text-align: left; }
td { padding: 0.75rem 1rem; border-top: 1px solid #f0f0f0; font-size: 0.9rem; color: #333; }

.actions { display: flex; gap: 0.5rem; }

.badge { font-size: 0.8rem; padding: 0.2rem 0.5rem; border-radius: 4px; }
.badge.available { background: #f0f9eb; color: #67c23a; }
.badge.borrowed { background: #fdf6ec; color: #e6a23c; }
.badge.scrapped { background: #fef0f0; color: #f56c6c; }

.btn-primary { background: #409eff; color: #fff; border: none; padding: 0.4rem 0.9rem; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }
.btn-primary:disabled { background: #a0cfff; cursor: not-allowed; }
.btn-secondary { background: #fff; color: #555; border: 1px solid #ddd; padding: 0.4rem 0.9rem; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }
.btn-danger { background: #fff; color: #f56c6c; border: 1px solid #f56c6c; padding: 0.4rem 0.9rem; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }

.msg { font-size: 0.9rem; padding: 0.5rem 0.75rem; border-radius: 4px; margin-bottom: 1rem; }
.msg.success { background: #f0f9eb; color: #67c23a; }
.msg.error { background: #fef0f0; color: #f56c6c; }

.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: #fff; border-radius: 8px; padding: 1.5rem; width: 100%; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
.modal h3 { margin-bottom: 1rem; color: #333; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.3rem; font-size: 0.9rem; color: #555; }
.form-group input, .form-group select { width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 0.95rem; }
.modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem; }
.stock-info { font-size: 0.9rem; color: #666; margin-bottom: 0.75rem; }
.stock-preview { font-size: 0.9rem; color: #409eff; margin: 0.5rem 0; }
</style>
