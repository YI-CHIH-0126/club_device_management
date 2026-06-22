import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import HomeView from '../views/HomeView.vue'
import DashboardView from '../views/DashboardView.vue'
import AdminManageView from '../views/admin/ManageView.vue'
import AdminRecordsView from '../views/admin/RecordsView.vue'
import AdminMembersView from '../views/admin/MembersView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/dashboard', name: 'dashboard', component: DashboardView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/admin/manage', name: 'admin-manage', component: AdminManageView, meta: { requiresAdmin: true } },
    { path: '/admin/records', name: 'admin-records', component: AdminRecordsView, meta: { requiresAdmin: true } },
    { path: '/admin/members', name: 'admin-members', component: AdminMembersView, meta: { requiresAdmin: true } },
  ],
})

router.beforeEach((to) => {
  const publicPages = ['/login', '/register']
  const isPublic = publicPages.includes(to.path)
  const token = localStorage.getItem('token')

  if (!isPublic && !token) return '/login'

  if (to.meta.requiresAdmin) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.role !== 'admin') return '/'
  }
})

export default router
