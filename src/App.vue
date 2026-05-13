<script setup>
import { computed } from 'vue'
import AdminLayout from './shared/presentation/views/AdminLayout.vue'
import PatientLayout from './shared/presentation/views/PatientLayout.vue'
import DoctorLayout from './shared/presentation/views/DoctorLayout.vue'

const urlParams = new URLSearchParams(window.location.search)
if (!urlParams.has('role')) {
  window.location.search = '?role=admin'
}
const role = urlParams.get('role')

const activeLayout = computed(() => {
  const layouts = {
    admin: AdminLayout,
    patient: PatientLayout,
    doctor: DoctorLayout
  }

  return layouts[role] ?? AdminLayout
})
</script>

<template>
  <component :is="activeLayout" />
</template>
