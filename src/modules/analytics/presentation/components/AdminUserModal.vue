<script setup>
import { reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CustomSelect from './CustomSelect.vue'
import { User } from '../../../tenant/domain/model/user.entity.js'

const props = defineProps({
  isOpen: Boolean,
  user: {
    type: Object,
    default: () => null
  },
  healthcareCenters: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'save'])

const { t } = useI18n()

const form = reactive({
  id: null,
  id_healthcare_center: '',
  name: '',
  paternal_surname: '',
  maternal_surname: '',
  identity_type: 'DNI',
  identity_number: '',
  date_birth: '',
  email: '',
  phone: '',
  gender: 'M',
  is_active: true,
  address: '',
  role: 'doctor'
})

const roles = [
  { id: 'admin', label: 'Admin' },
  { id: 'doctor', label: 'Doctor' },
  { id: 'patient', label: 'Patient' }
]

const identityTypes = ['DNI', 'CE', 'PASSPORT']
const genders = [
  { id: 'M', label: 'Male' },
  { id: 'F', label: 'Female' },
  { id: 'O', label: 'Other' }
]

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.user) {
      Object.assign(form, props.user)
    } else {
      resetForm()
    }
  }
})

const resetForm = () => {
  Object.assign(form, {
    id: null,
    id_healthcare_center: props.healthcareCenters.length > 0 ? props.healthcareCenters[0].id : '',
    name: '',
    paternal_surname: '',
    maternal_surname: '',
    identity_type: 'DNI',
    identity_number: '',
    date_birth: '',
    email: '',
    phone: '',
    gender: 'M',
    is_active: true,
    address: '',
    role: 'doctor'
  })
}

const handleSave = () => {
  emit('save', { ...form })
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <header class="modal-header">
        <h2>{{ user ? t('adminUsers.editUser') : t('adminUsers.addNewUser') }}</h2>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </header>
      
      <form @submit.prevent="handleSave" class="user-form">
        <div class="form-grid">
          <div class="form-group">
            <label>{{ t('tenant.adminProfile.name') || 'Name' }}</label>
            <input v-model="form.name" type="text" required />
          </div>
          <div class="form-group">
            <label>{{ t('tenant.adminProfile.paternalSurname') || 'Paternal Surname' }}</label>
            <input v-model="form.paternal_surname" type="text" required />
          </div>
          <div class="form-group">
            <label>{{ t('tenant.adminProfile.maternalSurname') || 'Maternal Surname' }}</label>
            <input v-model="form.maternal_surname" type="text" />
          </div>
          <div class="form-group">
            <label>{{ t('tenant.adminProfile.email') || 'Email' }}</label>
            <input v-model="form.email" type="email" required />
          </div>
          <div class="form-group">
            <label>{{ t('tenant.adminProfile.phone') || 'Phone' }}</label>
            <input v-model="form.phone" type="text" />
          </div>
          <div class="form-group">
            <label>{{ t('tenant.adminProfile.identityType') || 'Identity Type' }}</label>
            <CustomSelect v-model="form.identity_type" :options="identityTypes.map(t => ({ label: t, value: t }))" />
          </div>
          <div class="form-group">
            <label>{{ t('tenant.adminProfile.identityNumber') || 'Identity Number' }}</label>
            <input v-model="form.identity_number" type="text" required />
          </div>
          <div class="form-group">
            <label>{{ t('tenant.adminProfile.dateOfBirth') || 'Date of Birth' }}</label>
            <input v-model="form.date_birth" type="date" />
          </div>
          <div class="form-group">
            <label>{{ t('tenant.adminProfile.gender') || 'Gender' }}</label>
            <CustomSelect v-model="form.gender" :options="genders.map(g => ({ label: g.label, value: g.id }))" />
          </div>
          <div class="form-group">
            <label>{{ t('tenant.doctorProfile.role') || 'Role' }}</label>
            <CustomSelect v-model="form.role" :options="roles.map(r => ({ label: r.label, value: r.id }))" />
          </div>
          <div class="form-group">
            <label>{{ t('tenant.adminProfile.healthcareCenter') || 'Healthcare Center' }}</label>
            <CustomSelect v-model="form.id_healthcare_center" :options="healthcareCenters.map(hc => ({ label: hc.healthcare_center_name || hc.name, value: hc.id }))" />
          </div>
          <div class="form-group full-width">
            <label>{{ t('tenant.adminProfile.address') || 'Address' }}</label>
            <input v-model="form.address" type="text" />
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="form.is_active" type="checkbox" />
              {{ t('tenant.doctorProfile.active') || 'Active' }}
            </label>
          </div>
        </div>
        
        <footer class="form-actions">
          <button type="button" class="btn-cancel" @click="emit('close')">{{ t('clinical.doctorPatients.close') || 'Cancel' }}</button>
          <button type="submit" class="btn-save">{{ t('tenant.adminProfile.saveChanges') || 'Save' }}</button>
        </footer>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #1A2020;
  border-radius: 24px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #DFE3E3;
  font-size: 20px;
}

.close-btn {
  background: transparent;
  border: none;
  color: #BCC9C9;
  font-size: 24px;
  cursor: pointer;
}

.user-form {
  padding: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.full-width {
  grid-column: span 2;
}

.form-group label {
  color: #BCC9C9;
  font-size: 13px;
  font-weight: 600;
}

.form-group input {
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid #151A1A;
  border-radius: 12px;
  padding: 12px;
  color: #CCD0D0;
  font-size: 14px;
  font-family: inherit;
}

.form-group input:focus {
  border-color: #6DD6DB;
  outline: none;
}

.checkbox-label {
  flex-direction: row !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input {
  width: auto;
}

.form-actions {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.btn-cancel, .btn-save {
  padding: 12px 24px;
  border-radius: 9999px;
  font-weight: 700;
  cursor: pointer;
  border: none;
}

.btn-cancel {
  background: transparent;
  color: #BCC9C9;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-save {
  background: linear-gradient(157deg, #20999E 0%, #007A87 100%);
  color: #003739;
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .full-width {
    grid-column: span 1;
  }
}
</style>
