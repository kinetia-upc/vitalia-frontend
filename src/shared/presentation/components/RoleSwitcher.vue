<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const roles = ['admin', 'doctor', 'patient']

const currentRole = computed(() => route.meta.role ?? route.path.split('/')[1] ?? 'admin')

const nextRole = computed(() => {
  const currentIndex = roles.indexOf(currentRole.value)
  const index = currentIndex === -1 ? 0 : currentIndex
  return roles[(index + 1) % roles.length]
})

const getShortLabel = (role) => {
  const labels = {
    admin: 'ADM',
    doctor: 'DOC',
    patient: 'PAT'
  }
  return labels[role] ?? 'ADM'
}

const toggleRole = () => {
  router.push(`/${nextRole.value}/dashboard`)
}
</script>

<template>
  <button class="topbar-pill role-switcher" type="button" @click="toggleRole" title="Switch Role">
    <span aria-hidden="true">{{ getShortLabel(currentRole) }}</span>
  </button>
</template>
