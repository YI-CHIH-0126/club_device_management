<script setup>
import { ref, onMounted } from 'vue'
import { get, put } from '../../api.js'

const members = ref([])
const loading = ref(true)
const msg = ref({ type: '', text: '' })

async function fetchMembers() {
  try {
    members.value = await get('/api/admin/users')
  } catch {
    msg.value = { type: 'error', text: '無法載入社員列表' }
  } finally {
    loading.value = false
  }
}

function showMsg(type, text) {
  msg.value = { type, text }
  setTimeout(() => { msg.value = { type: '', text: '' } }, 2500)
}

async function setRole(member, role) {
  const label = role === 'admin' ? '設為幹部' : '設為社員'
  if (!confirm(`確定要將「${member.name}」${label}嗎？`)) return
  try {
    await put(`/api/admin/users/${member.student_id}/role`, { role })
    showMsg('success', `已${label}`)
    await fetchMembers()
  } catch (err) {
    showMsg('error', err.response?.data?.message || '操作失敗')
  }
}

async function toggleSuspend(member) {
  const action = member.suspended ? '恢復' : '暫停'
  if (!confirm(`確定要${action}「${member.name}」的借用權限嗎？`)) return
  try {
    await put(`/api/admin/users/${member.student_id}/suspend`, { suspended: !member.suspended })
    showMsg('success', `已${action}借用權限`)
    await fetchMembers()
  } catch (err) {
    showMsg('error', err.response?.data?.message || '操作失敗')
  }
}

function formatTime(t) {
  if (!t) return '—'
  return new Date(t).toLocaleDateString('zh-TW')
}

onMounted(fetchMembers)
</script>

<template>
  <div class="page">
    <header>
      <h1>社團器材管理系統</h1>
      <nav>
        <a href="/admin/manage">器材管理</a>
        <a href="/admin/records">借用紀錄</a>
        <a href="/">器材列表</a>
      </nav>
    </header>

    <main>
      <h2>社員管理</h2>
      <p v-if="msg.text" class="msg" :class="msg.type">{{ msg.text }}</p>
      <p v-if="loading">載入中...</p>

      <table v-if="!loading">
        <thead>
          <tr>
            <th>學號</th>
            <th>姓名</th>
            <th>系級</th>
            <th>角色</th>
            <th>借用權限</th>
            <th>加入時間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in members" :key="m.student_id">
            <td>{{ m.student_id }}</td>
            <td>{{ m.name }}</td>
            <td>{{ m.department_class }}</td>
            <td>
              <span class="badge" :class="m.role">
                {{ m.role === 'admin' ? '幹部' : '社員' }}
              </span>
            </td>
            <td>
              <span class="badge" :class="m.suspended ? 'suspended' : 'active'">
                {{ m.suspended ? '已暫停' : '正常' }}
              </span>
            </td>
            <td>{{ formatTime(m.created_at) }}</td>
            <td class="actions">
              <button
                v-if="m.role === 'member'"
                class="btn-secondary"
                @click="setRole(m, 'admin')"
              >設為幹部</button>
              <button
                v-if="m.role === 'admin'"
                class="btn-secondary"
                @click="setRole(m, 'member')"
              >設為社員</button>
              <button
                :class="m.suspended ? 'btn-success' : 'btn-danger'"
                @click="toggleSuspend(m)"
              >{{ m.suspended ? '恢復權限' : '暫停權限' }}</button>
            </td>
          </tr>
          <tr v-if="members.length === 0">
            <td colspan="7" class="empty">尚無社員</td>
          </tr>
        </tbody>
      </table>
    </main>
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

main { max-width: 1000px; margin: 0 auto; padding: 2rem 1rem; }
h2 { font-size: 1.2rem; color: #333; margin-bottom: 1.25rem; }

table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
th { background: #f5f7fa; color: #555; font-size: 0.9rem; padding: 0.75rem 1rem; text-align: left; }
td { padding: 0.75rem 1rem; border-top: 1px solid #f0f0f0; font-size: 0.9rem; color: #333; }

.actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.badge { font-size: 0.8rem; padding: 0.2rem 0.5rem; border-radius: 4px; }
.badge.admin { background: #ecf5ff; color: #409eff; }
.badge.member { background: #f4f4f5; color: #909399; }
.badge.active { background: #f0f9eb; color: #67c23a; }
.badge.suspended { background: #fef0f0; color: #f56c6c; }

.empty { text-align: center; color: #aaa; }

.btn-secondary { background: #fff; color: #555; border: 1px solid #ddd; padding: 0.35rem 0.7rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
.btn-danger { background: #fff; color: #f56c6c; border: 1px solid #f56c6c; padding: 0.35rem 0.7rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
.btn-success { background: #fff; color: #67c23a; border: 1px solid #67c23a; padding: 0.35rem 0.7rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }

.msg { font-size: 0.9rem; padding: 0.5rem 0.75rem; border-radius: 4px; margin-bottom: 1rem; }
.msg.success { background: #f0f9eb; color: #67c23a; }
.msg.error { background: #fef0f0; color: #f56c6c; }
</style>
