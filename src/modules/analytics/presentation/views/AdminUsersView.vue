<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const currentFilter = ref('allUsers')
const filters = [
  { id: 'allUsers', label: 'adminUsers.allUsers' },
  { id: 'doctors', label: 'adminUsers.doctors' },
  { id: 'nurses', label: 'adminUsers.nurses' },
  { id: 'patients', label: 'adminUsers.patients' },
  { id: 'staff', label: 'adminUsers.staff' }
]

const metrics = [
  { label: 'adminUsers.totalPatients', value: '842', progress: 65, color: '#6DD6DB' },
  { label: 'adminUsers.activeDoctors', value: '56', avatars: true },
  { label: 'adminUsers.pendingApprovals', value: '12', note: 'adminUsers.verificationRequired', color: '#FFB68E' },
  { label: 'adminUsers.systemLoad', value: 'Normal', note: 'adminUsers.securityPatchNote', color: '#6DD6DB' }
]

const users = [
  {
    id: 1,
    name: 'Dr. Helena Rossi',
    email: 'helena.rossi@vitalia.med',
    role: 'Chief Oncologist',
    dept: 'CLINICAL RESEARCH',
    status: 'ACTIVE',
    lastActivity: 'Today, 09:42 AM',
    avatar: 'https://placehold.co/42x42',
    type: 'doctors'
  },
  {
    id: 2,
    name: 'Sarah Jenkins',
    email: 's.jenkins92@gmail.com',
    role: 'Patient',
    dept: 'OUTPATIENT CARE',
    status: 'SCHEDULED',
    lastActivity: 'Oct 24, 2023',
    avatar: 'https://placehold.co/42x42',
    type: 'patients'
  },
  {
    id: 3,
    name: 'Marcus Thorne',
    email: 'm.thorne@vitalia.med',
    role: 'Senior Nurse',
    dept: 'EMERGENCY WING',
    status: 'OFF-DUTY',
    lastActivity: 'Yesterday, 11:15 PM',
    avatar: 'https://placehold.co/42x42',
    type: 'nurses'
  },
  {
    id: 4,
    name: 'Eleanor Rigby',
    email: 'e.rigby@vitalia.med',
    role: 'Admin Staff',
    dept: 'RECEPTION & RECORDS',
    status: 'ON LEAVE',
    lastActivity: 'Oct 18, 2023',
    avatar: 'https://placehold.co/42x42',
    type: 'staff'
  }
]

const filteredUsers = computed(() => {
  if (currentFilter.value === 'allUsers') return users
  return users.filter(user => user.type === currentFilter.value)
})

const auditLogs = [
  {
    id: 1,
    title: 'Permission Escalation Detected',
    description: 'Dr. Alistair Vance elevated "Nurse Marcus Thorne" access to Clinical Trials Repository.',
    time: '2m ago',
    type: 'alert'
  },
  {
    id: 2,
    title: 'New Patient Onboarded',
    description: 'Sarah Jenkins verified through HealthLink API.',
    time: '14m ago',
    type: 'success'
  },
  {
    id: 3,
    title: 'Directory Sync Completed',
    description: '45 staff records updated via MS Azure integration.',
    time: '1h ago',
    type: 'info'
  }
]

const allocations = [
  { label: 'adminUsers.medicalStaff', percentage: 12, color: '#6DD6DB' },
  { label: 'adminUsers.nursingUnits', percentage: 28, color: '#A7CECF' },
  { label: 'adminUsers.administrative', percentage: 15, color: '#FFB68E' },
  { label: 'adminUsers.supportStaff', percentage: 45, color: '#BCC9C9' }
]

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
        <button class="btn-secondary">
          <i class="icon-audit"></i>
          {{ t('adminUsers.auditLogs') }}
        </button>
        <button class="btn-primary">
          <i class="icon-add"></i>
          {{ t('adminUsers.addNewUser') }}
        </button>
      </div>
    </header>

    <div class="metric-grid">
      <div v-for="metric in metrics" :key="metric.label" class="metric-card" :style="metric.progress ? 'border-left: 4px ' + metric.color + ' solid' : ''">
        <span class="label">{{ t(metric.label) }}</span>
        <div class="value-container">
          <strong :style="{ color: metric.progress ? '#DFE3E3' : metric.color }">{{ metric.value }}</strong>
          <div v-if="metric.avatars" class="avatar-stack">
            <img v-for="i in 3" :key="i" src="https://placehold.co/28x28" class="stack-avatar" />
            <div class="stack-more">+53</div>
          </div>
        </div>
        <div v-if="metric.progress" class="progress-bar">
          <div class="progress-fill" :style="{ width: metric.progress + '%', background: metric.color }"></div>
        </div>
        <span v-if="metric.note" class="note">{{ t(metric.note) }}</span>
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
        <div class="action-icons">
          <button class="icon-btn"><i class="icon-filter"></i></button>
          <button class="icon-btn"><i class="icon-download"></i></button>
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
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div class="user-profile-cell">
                  <img :src="user.avatar" class="user-avatar" />
                  <div class="user-info">
                    <strong>{{ user.name }}</strong>
                    <span>{{ user.email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="role-dept-cell">
                  <strong :style="{ color: user.dept.includes('CLINICAL') || user.dept.includes('EMERGENCY') ? '#6DD6DB' : '#DFE3E3' }">
                    {{ user.role }}
                  </strong>
                  <span>{{ user.dept }}</span>
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
                  <button class="icon-btn-small"><i class="icon-edit"></i></button>
                  <button class="icon-btn-small"><i class="icon-shield"></i></button>
                  <button class="icon-btn-small"><i class="icon-more"></i></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-footer">
        <div class="showing-text">
          {{ t('adminUsers.showing', { start: 1, end: 25, total: '1,248' }) }}
        </div>
        <div class="pagination">
          <button class="page-arrow" disabled>&lt;</button>
          <button class="page-num active">1</button>
          <button class="page-num">2</button>
          <button class="page-num">3</button>
          <span class="page-dots">...</span>
          <button class="page-num">50</button>
          <button class="page-arrow">&gt;</button>
        </div>
      </div>
    </section>

    <div class="bottom-grid">
      <article class="panel audit-panel">
        <div class="panel-header">
          <h2>{{ t('adminUsers.securityAuditLogs') }}</h2>
          <button class="text-btn">{{ t('adminUsers.viewFullLedger') }}</button>
        </div>
        <div class="audit-list">
          <div v-for="log in auditLogs" :key="log.id" class="audit-item">
            <div class="audit-icon" :class="log.type">
              <i v-if="log.type === 'alert'" class="icon-alert"></i>
              <i v-if="log.type === 'success'" class="icon-user-check"></i>
              <i v-if="log.type === 'info'" class="icon-sync"></i>
            </div>
            <div class="audit-content">
              <strong>{{ log.title }}</strong>
              <p>{{ log.description }}</p>
            </div>
            <span class="audit-time">{{ log.time }}</span>
          </div>
        </div>
      </article>

      <article class="panel allocation-panel">
        <div class="panel-header">
          <h2>{{ t('adminUsers.staffAllocation') }}</h2>
        </div>
        <div class="allocation-list">
          <div v-for="item in allocations" :key="item.label" class="allocation-item">
            <div class="allocation-header">
              <span>{{ t(item.label) }}</span>
              <strong>{{ item.percentage }}%</strong>
            </div>
            <div class="progress-bar mini">
              <div class="progress-fill" :style="{ width: item.percentage + '%', background: item.color }"></div>
            </div>
          </div>
        </div>
        <div class="recommendation-card">
          <span class="rec-label">{{ t('adminUsers.optimizedStaffing') }}</span>
          <p class="rec-text">{{ t('adminUsers.systemRecommendation') }}</p>
        </div>
      </article>
    </div>
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
  grid-template-columns: repeat(4, 1fr);
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
}

.value-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.avatar-stack {
  display: flex;
  align-items: center;
}

.stack-avatar {
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  border: 3px #171C1D solid;
  margin-left: -12px;
  object-fit: cover;
}

.stack-avatar:first-child {
  margin-left: 0;
}

.stack-more {
  width: 32px;
  height: 32px;
  background: #303636;
  border-radius: 9999px;
  border: 3px #171C1D solid;
  color: #BCC9C9;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -12px;
}

.progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 9999px;
  overflow: hidden;
  margin-top: 12px;
}

.progress-fill {
  height: 100%;
  border-radius: 9999px;
}

.metric-card .note {
  color: rgba(109, 214, 219, 0.5);
  font-size: 11px;
  font-weight: 600;
  margin-top: 4px;
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

.action-icons {
  display: flex;
  gap: 12px;
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
  border-radius: 14px;
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
  grid-template-columns: 2fr 1fr;
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

.audit-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.audit-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: background 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.01);
}

.audit-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.audit-icon {
  padding: 10px;
  border-radius: 14px;
  display: flex;
  flex-shrink: 0;
}

.audit-icon.alert { background: rgba(206, 124, 75, 0.15); color: #FFB68E; }
.audit-icon.success { background: rgba(43, 159, 164, 0.15); color: #6DD6DB; }
.audit-icon.info { background: rgba(42, 79, 81, 0.15); color: #A7CECF; }

.audit-content {
  flex: 1;
}

.audit-content strong {
  display: block;
  color: #DFE3E3;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 2px;
}

.audit-content p {
  margin: 0;
  color: rgba(188, 201, 201, 0.7);
  font-size: 12px;
  line-height: 1.4;
}

.audit-time {
  color: rgba(188, 201, 201, 0.4);
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
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
  width: 24px;
  height: 24px;
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

@media (max-width: 1200px) {
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .bottom-grid {
    grid-template-columns: 1fr;
  }
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
  .action-icons {
    width: 100%;
    justify-content: flex-end;
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
