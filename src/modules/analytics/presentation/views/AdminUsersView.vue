<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import useTenantStore from '../../../tenant/application/tenant.store.js'
import { useSchedulingStore } from '../../../scheduling/application/scheduling-store.js'
import AdminUserModal from '../components/AdminUserModal.vue'

const { t } = useI18n()
const tenantStore = useTenantStore()
const schedulingStore = useSchedulingStore()

const currentFilter = ref('allUsers')
const itemsPerPage = 10
const currentPage = ref(1)

const filters = [
  { id: 'allUsers', label: 'adminUsers.allUsers' },
  { id: 'admin', label: 'adminUsers.admins' },
  { id: 'doctor', label: 'adminUsers.doctors' },
  { id: 'patient', label: 'adminUsers.patients' }
]

const isModalOpen = ref(false)
const selectedUser = ref(null)

watch(currentFilter, () => {
  currentPage.value = 1
})

onMounted(() => {
  if (!tenantStore.usersLoaded) tenantStore.fetchUsers()
  if (!tenantStore.healthcareCentersLoaded) tenantStore.fetchHealthcareCenters()
})

const metrics = computed(() => [
  { label: 'adminUsers.totalPatients', value: tenantStore.users.filter(u => u.role === 'patient').length.toString() },
  { label: 'adminUsers.activeDoctors', value: tenantStore.users.filter(u => u.role === 'doctor' && u.is_active).length.toString() },
  { label: 'adminUsers.systemLoad', value: 'Normal' }
])

const users = computed(() => tenantStore.users.map(user => ({
  ...user,
  fullName: `${user.name} ${user.paternal_surname} ${user.maternal_surname || ''}`.trim(),
  avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
  status: user.is_active ? 'ACTIVE' : 'OFF-DUTY',
  lastActivity: 'N/A' // Store doesn't have this field yet
})))

const filteredUsers = computed(() => {
  if (currentFilter.value === 'allUsers') return users.value
  return users.value.filter(user => user.role === currentFilter.value)
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage))

const pageNumbers = computed(() => {
  const pages = []
  const maxVisiblePages = 5
  
  if (totalPages.value <= maxVisiblePages) {
    for (let i = 1; i <= totalPages.value; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage.value > 3) pages.push('...')
    
    const start = Math.max(2, currentPage.value - 1)
    const end = Math.min(totalPages.value - 1, currentPage.value + 1)
    
    for (let i = start; i <= end; i++) pages.push(i)
    
    if (currentPage.value < totalPages.value - 2) pages.push('...')
    pages.push(totalPages.value)
  }
  return pages
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredUsers.value.slice(start, start + itemsPerPage)
})

const showingStart = computed(() => filteredUsers.value.length === 0 ? 0 : (currentPage.value - 1) * itemsPerPage + 1)
const showingEnd = computed(() => Math.min(currentPage.value * itemsPerPage, filteredUsers.value.length))

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const goToPage = (page) => {
  currentPage.value = page
}

const openAddModal = () => {
  selectedUser.value = null
  isModalOpen.value = true
}

const openEditModal = (user) => {
  selectedUser.value = { ...user }
  isModalOpen.value = true
}

const handleSaveUser = async (userData) => {
  const previousRole = selectedUser.value?.role
  if (userData.id) {
    await tenantStore.updateUser(userData)
  } else {
    await tenantStore.addUser(userData)
  }

  if (userData.role === 'doctor' || previousRole === 'doctor') {
    await schedulingStore.refreshSchedulingRoster()
  }

  isModalOpen.value = false
}

const handleDeleteUser = async (user) => {
  if (confirm(t('adminUsers.confirmDelete') || `Are you sure you want to delete ${user.fullName}?`)) {
    await tenantStore.deleteUser(user)
    if (user.role === 'doctor') await schedulingStore.refreshSchedulingRoster()
  }
}

const allocations = []

const getStatusClass = (status) => {
  const classes = {
    'ACTIVE': 'status-active',
    'SCHEDULED': 'status-scheduled',
    'OFF-DUTY': 'status-off-duty',
    'ON LEAVE': 'status-on-leave'
  }
  return classes[status] || ''
}
</script>

<template>
  <div class="admin-users-view">
    <header class="view-header">
      <div class="header-info">
        <h1>{{ t('adminUsers.title') }}</h1>
        <p>{{ t('adminUsers.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="openAddModal">
          <i class="icon-add"></i>
          {{ t('adminUsers.addNewUser') }}
        </button>
      </div>
    </header>

    <div class="metric-grid">
      <div v-for="metric in metrics" :key="metric.label" class="metric-card">
        <span class="label">{{ t(metric.label) }}</span>
        <strong>{{ metric.value }}</strong>
      </div>
    </div>

    <section class="users-table-section panel">
      <div class="table-filters">
        <div class="filter-group">
          <span>{{ t('adminUsers.filterBy') }}</span>
          <div class="filter-pills">
            <button 
              v-for="filter in filters" 
              :key="filter.id"
              :class="{ active: currentFilter === filter.id }"
              @click="currentFilter = filter.id"
            >
              {{ t(filter.label) }}
            </button>
          </div>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>{{ t('adminUsers.userProfile') }}</th>
              <th>{{ t('adminUsers.roleDept') }}</th>
              <th>{{ t('adminUsers.status') }}</th>
              <th>{{ t('adminUsers.lastActivity') }}</th>
              <th class="text-right">{{ t('adminUsers.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in paginatedUsers" :key="user.id">
              <td>
                <div class="user-profile-cell">
                  <img :src="user.avatar" class="user-avatar" />
                  <div class="user-info">
                    <strong>{{ user.fullName }}</strong>
                    <span>{{ user.email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="role-dept-cell">
                  <strong :style="{ color: user.role === 'doctor' ? '#6DD6DB' : user.role === 'admin' ? '#FFB68E' : '#DFE3E3' }">
                    {{ user.role.toUpperCase() }}
                  </strong>
                  <span>{{ user.identity_number }}</span>
                </div>
              </td>
              <td>
                <span class="status-badge" :class="getStatusClass(user.status)">
                  {{ user.status }}
                </span>
              </td>
              <td>
                <span class="activity-text">{{ user.lastActivity }}</span>
              </td>
              <td class="text-right">
                <div class="action-buttons">
                  <button class="icon-btn-small" @click="openEditModal(user)"><i class="icon-edit"></i></button>
                  <button class="icon-btn-small btn-delete" @click="handleDeleteUser(user)"><i class="icon-trash"></i></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-footer">
        <div class="showing-text">
          {{ t('adminUsers.showing', { start: showingStart, end: showingEnd, total: filteredUsers.length }) }}
        </div>
        <div class="pagination">
          <button 
            class="page-arrow" 
            :disabled="currentPage === 1"
            @click="prevPage"
          >&lt;</button>
          
          <template v-for="page in pageNumbers" :key="page">
            <button 
              v-if="page !== '...'"
              class="page-num"
              :class="{ active: currentPage === page }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            <span v-else class="page-dots">...</span>
          </template>

          <button 
            class="page-arrow" 
            :disabled="currentPage === totalPages"
            @click="nextPage"
          >&gt;</button>
        </div>
      </div>
    </section>

    <AdminUserModal
      :is-open="isModalOpen"
      :user="selectedUser"
      :healthcare-centers="tenantStore.healthcareCenters"
      @close="isModalOpen = false"
      @save="handleSaveUser"
    />
  </div>
</template>

<style scoped>
.admin-users-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 0 24px 24px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.header-info h1 {
  color: #DFE3E3;
  font-size: 36px;
  font-family: Manrope, sans-serif;
  font-weight: 800;
  line-height: 40px;
  margin: 0;
}

.header-info p {
  color: #BCC9C9;
  font-size: 16px;
  line-height: 24px;
  margin: 4px 0 0;
}

.header-actions {
  display: flex;
  gap: 16px;
}

.btn-primary, .btn-secondary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  border-radius: 9999px;
  font-family: Arimo, sans-serif;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: linear-gradient(157deg, #20999E 0%, #007A87 100%);
  color: #003739;
  box-shadow: 0 4px 6px -4px rgba(109, 214, 219, 0.2), 0 10px 15px -3px rgba(109, 214, 219, 0.2);
}

.btn-secondary {
  background: transparent;
  color: #DFE3E3;
  outline: 1px rgba(61, 73, 73, 0.2) solid;
}

/* Metrics */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.metric-card {
  background: linear-gradient(145deg, #1A2020 0%, #141919 100%);
  border-radius: 32px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.03);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.metric-card .label {
  color: rgba(188, 201, 201, 0.6);
  font-size: 11px;
  font-weight: 800;
  font-family: Inter, sans-serif;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.metric-card strong {
  font-size: 32px;
  font-family: Manrope, sans-serif;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  color: #DFE3E3;
  margin-top: 8px;
}

/* Table Section */
.users-table-section {
  background: linear-gradient(145deg, #1A2020 0%, #141919 100%);
  border-radius: 32px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.03);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
}

.table-filters {
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 20px;
}

.filter-group span {
  color: rgba(188, 201, 201, 0.7);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-pills {
  padding: 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 9999px;
  display: flex;
  gap: 4px;
}

.filter-pills button {
  padding: 8px 22px;
  border-radius: 9999px;
  border: none;
  background: transparent;
  color: rgba(188, 201, 201, 0.6);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-pills button:hover {
  color: #DFE3E3;
}

.filter-pills button.active {
  background: #2A4F51;
  color: #6DD6DB;
  box-shadow: 0 4px 12px rgba(42, 79, 81, 0.3);
}

.icon-btn {
  width: 52px;
  height: 52px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #BCC9C9;
}

.icon-btn:hover {
  background: rgba(109, 214, 219, 0.1);
  transform: translateY(-3px);
  color: #6DD6DB;
  border-color: rgba(109, 214, 219, 0.3);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th {
  background: rgba(0, 0, 0, 0.1);
  padding: 24px 32px;
  text-align: left;
  color: rgba(188, 201, 201, 0.5);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.02);
}

td {
  padding: 24px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.01);
  vertical-align: middle;
  transition: background 0.2s;
}

tr:hover td {
  background: rgba(255, 255, 255, 0.01);
}

.user-profile-cell {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.05);
}

.user-info strong {
  display: block;
  color: #DFE3E3;
  font-size: 15px;
  font-family: Manrope, sans-serif;
  font-weight: 700;
  margin-bottom: 2px;
}

.user-info span {
  color: rgba(188, 201, 201, 0.5);
  font-size: 12px;
  font-weight: 500;
}

.role-dept-cell strong {
  display: block;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 4px;
}

.role-dept-cell span {
  color: rgba(188, 201, 201, 0.5);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  display: inline-flex;
}

.status-active { background: rgba(43, 159, 164, 0.1); color: #6DD6DB; border: 1px solid rgba(43, 159, 164, 0.1); }
.status-scheduled { background: rgba(188, 201, 201, 0.05); color: #BCC9C9; border: 1px solid rgba(188, 201, 201, 0.1); }
.status-off-duty { background: rgba(206, 124, 75, 0.1); color: #FFB68E; border: 1px solid rgba(206, 124, 75, 0.1); }
.status-on-leave { background: rgba(206, 124, 75, 0.08); color: #FFB68E; opacity: 0.8; }

.activity-text {
  color: rgba(188, 201, 201, 0.7);
  font-size: 13px;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.icon-btn-small {
  width: 48px;
  height: 48px;
  padding: 0;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(4px);
  cursor: pointer;
  border-radius: 32px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(188, 201, 201, 0.6);
}

.icon-btn-small i {
  width: 18px;
  height: 18px;
}

.icon-btn-small:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #6DD6DB;
  transform: scale(1.1) rotate(5deg);
  border-color: rgba(109, 214, 219, 0.4);
}

.icon-btn-small.btn-delete:hover {
  color: #FF4C4C;
  border-color: rgba(255, 76, 76, 0.4);
}

.text-right { text-align: right; }

/* Table Footer */
.table-footer {
  padding: 24px 32px;
  background: rgba(0, 0, 0, 0.15);
  border-top: 1px solid rgba(255, 255, 255, 0.02);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.showing-text {
  color: rgba(188, 201, 201, 0.5);
  font-size: 12px;
  font-weight: 600;
}

.showing-text strong {
  color: #DFE3E3;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-num, .page-arrow {
  min-width: 36px;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.02);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(188, 201, 201, 0.6);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.page-num.active {
  background: #2A4F51;
  color: #6DD6DB;
  border-color: rgba(109, 214, 219, 0.2);
}

.page-num:not(.active):hover {
  background: rgba(255, 255, 255, 0.08);
  color: #DFE3E3;
}

.page-dots {
  color: rgba(188, 201, 201, 0.3);
  font-weight: 800;
}

/* Bottom Grid */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}
.panel {
  background: linear-gradient(145deg, rgba(28, 33, 33, 0.9) 0%, rgba(20, 25, 25, 0.95) 100%);
  border-radius: 32px;
  padding: 32px;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
}
.users-table-section.panel {
  padding: 0px;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.panel-header h2 {
  color: #DFE3E3;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.02em;
}
.text-btn {
  background: transparent;
  border: none;
  color: #6DD6DB;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}
.text-btn:hover {
  background: rgba(109, 214, 219, 0.1);
  color: #A7CECF;
}
.allocation-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 32px;
  width: 100%;
}
.allocation-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.allocation-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
}
.allocation-header span { color: rgba(188, 201, 201, 0.8); }
.allocation-header strong { color: #DFE3E3; font-size: 14px; }
.progress-bar.mini {
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
}
.recommendation-card {
  padding: 20px;
  background: linear-gradient(135deg, rgba(53, 58, 58, 0.4) 0%, rgba(30, 35, 35, 0.4) 100%);
  border-radius: 24px;
  border: 1px solid rgba(109, 214, 219, 0.1);
  text-align: center;
}
.rec-label {
  color: rgba(188, 201, 201, 0.6);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  display: block;
  margin-bottom: 4px;
}
.rec-text {
  margin: 0;
  color: #6DD6DB;
  font-size: 13px;
  font-weight: 700;
}
/* Icons (Placeholders for actual icons) */
[class^="icon-"] {
  display: flex;
  width: 32px;
  height: 32px;
  background: #798484;
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
}
/* Specific icon masks */
.icon-audit { 
  background: #FFB68E; 
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'/%3E%3Cpolyline points='14 2 14 8 20 8'/%3E%3Cline x1='16' y1='13' x2='8' y2='13'/%3E%3Cline x1='16' y1='17' x2='8' y2='17'/%3E%3Cline x1='10' y1='9' x2='8' y2='9'/%3E%3C/svg%3E");
}
.icon-add { 
  background: #003739; 
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='12' y1='5' x2='12' y2='19'/%3E%3Cline x1='5' y1='12' x2='19' y2='12'/%3E%3C/svg%3E");
  width: 24px;
  height: 24px;
}
.icon-filter { 
  background: #BCC9C9; 
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolygon points='22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3'/%3E%3C/svg%3E");
}
.icon-download { 
  background: #BCC9C9; 
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='7 10 12 15 17 10'/%3E%3Cline x1='12' y1='15' x2='12' y2='3'/%3E%3C/svg%3E");
}
.icon-edit { 
  background: #BCC9C9; 
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/%3E%3Cpath d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'/%3E%3C/svg%3E");
}
.icon-shield { 
  background: #BCC9C9; 
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/%3E%3C/svg%3E");
}
.icon-more { 
  background: #BCC9C9; 
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='1'/%3E%3Ccircle cx='12' cy='5' r='1'/%3E%3Ccircle cx='12' cy='19' r='1'/%3E%3C/svg%3E");
}
.icon-trash { 
  background: #FF4C4C; 
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='3 6 5 6 21 6'/%3E%3Cpath d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'/%3E%3C/svg%3E");
}
.icon-alert { 
  background: currentColor; 
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/%3E%3Cline x1='12' y1='9' x2='12' y2='13'/%3E%3Cline x1='12' y1='17' x2='12.01' y2='17'/%3E%3C/svg%3E");
}
.icon-user-check { 
  background: currentColor; 
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='8.5' cy='7' r='4'/%3E%3Cpolyline points='17 11 19 13 23 9'/%3E%3C/svg%3E");
}
.icon-sync { 
  background: currentColor; 
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='23 4 23 10 17 10'/%3E%3Cpolyline points='1 20 1 14 7 14'/%3E%3Cpath d='M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'/%3E%3C/svg%3E");
}

@media (max-width: 992px) {
  .table-filters {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .filter-group {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .filter-pills {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 4px;
  }
}

@media (max-width: 768px) {
  .admin-users-view {
    padding: 0 16px 16px;
    gap: 24px;
  }
  .metric-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .view-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
  }
  .header-actions {
    width: 100%;
  }
  .btn-primary,
  .btn-secondary {
    flex: 1;
    justify-content: center;
    padding: 12px 16px;
    font-size: 14px;
  }
  .panel {
    padding: 20px;
  }
  th,
  td {
    padding: 16px 20px;
  }
  .user-avatar {
    width: 40px;
    height: 40px;
  }
  .header-info h1 {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .table-footer {
    flex-direction: column;
    gap: 20px;
  }
  .pagination {
    width: 100%;
    justify-content: center;
    gap: 6px;
  }
  .page-num,
  .page-arrow {
    min-width: 32px;
    height: 32px;
    font-size: 12px;
  }
}
</style>
