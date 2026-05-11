<script setup>
import { computed } from 'vue'
import AdminLayout from './shared/presentation/views/AdminLayout.vue'
import PatientLayout from './shared/presentation/views/PatientLayout.vue'
import DoctorLayout from './shared/presentation/views/DoctorLayout.vue'

const role = new URLSearchParams(window.location.search).get('role') ?? 'admin'

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
