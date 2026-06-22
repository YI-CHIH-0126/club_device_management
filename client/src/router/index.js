import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
  ],
})

router.beforeEach((to) => {
  const publicPages = ['/login', '/register']
  const isPublic = publicPages.includes(to.path)
  const loggedIn = localStorage.getItem('token')

  if (!isPublic && !loggedIn) {
    return '/login'
  }
})

export default router
