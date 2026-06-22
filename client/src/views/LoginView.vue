<script setup>
import { ref } from 'vue'
import { post } from '../api.js'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = ref({
  student_id: '',
  password: '',
})

const errorMsg = ref('')
const loading = ref(false)

async function handleLogin() {
  errorMsg.value = ''

  if (!form.value.student_id || !form.value.password) {
    errorMsg.value = '請填寫學號與密碼'
    return
  }

  loading.value = true
  try {
    const data = await post('/api/auth/login', {
      student_id: form.value.student_id,
      password: form.value.password,
    })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    router.push('/')
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '登入失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1>社團器材管理系統</h1>
      <h2>登入</h2>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="student_id">學號</label>
          <input
            id="student_id"
            v-model="form.student_id"
            type="text"
            placeholder="請輸入學號"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">密碼</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="請輸入密碼"
            required
          />
        </div>

        <p v-if="errorMsg" class="msg error">{{ errorMsg }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? '登入中...' : '登入' }}
        </button>
      </form>

      <p class="switch">
        還沒有帳號？<a href="/register">立即註冊</a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.login-card {
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

input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

input:focus {
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

.switch {
  text-align: center;
  margin-top: 1.25rem;
  font-size: 0.9rem;
  color: #666;
}

.switch a {
  color: #409eff;
  text-decoration: none;
}

.switch a:hover {
  text-decoration: underline;
}
</style>
