<script setup>
import { ref } from 'vue'
import { post } from '../api.js'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = ref({
  student_id: '',
  password: '',
  confirmPassword: '',
  name: '',
  department_class: '',
})

const errorMsg = ref('')
const loading = ref(false)

async function handleRegister() {
  errorMsg.value = ''
  successMsg.value = ''

  if (!form.value.student_id || !form.value.password || !form.value.name || !form.value.department_class) {
    errorMsg.value = '請填寫所有必填欄位'
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    errorMsg.value = '兩次密碼輸入不一致'
    return
  }

  loading.value = true
  try {
    await post('/api/auth/register', {
      student_id: form.value.student_id,
      password: form.value.password,
      name: form.value.name,
      department_class: form.value.department_class,
    })
    router.push('/login')
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '註冊失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <h1>社團器材管理系統</h1>
      <h2>註冊帳號</h2>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="student_id">學號 *</label>
          <input
            id="student_id"
            v-model="form.student_id"
            type="text"
            placeholder="請輸入學號"
            required
          />
        </div>

        <div class="form-group">
          <label for="name">姓名 *</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="請輸入姓名"
            required
          />
        </div>

        <div class="form-group">
          <label for="department_class">系級 *</label>
          <input
            id="department_class"
            v-model="form.department_class"
            type="text"
            placeholder="例：資工二甲"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">密碼 *</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="請輸入密碼"
            required
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">確認密碼 *</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            placeholder="請再次輸入密碼"
            required
          />
        </div>

        <p v-if="errorMsg" class="msg error">{{ errorMsg }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? '註冊中...' : '註冊' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.register-card {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
}

h1 {
  font-size: 1.2rem;
  color: #666;
  text-align: center;
  margin-bottom: 0.25rem;
}

h2 {
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.9rem;
  color: #555;
}

input,
select {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

input:focus,
select:focus {
  outline: none;
  border-color: #409eff;
}

button {
  width: 100%;
  padding: 0.7rem;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 0.5rem;
}

button:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}

.msg {
  font-size: 0.9rem;
  margin: 0.5rem 0;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
}

.error {
  background: #fef0f0;
  color: #f56c6c;
}

.success {
  background: #f0f9eb;
  color: #67c23a;
}
</style>
