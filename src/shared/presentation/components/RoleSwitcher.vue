<script setup>
import { computed } from 'vue'

const currentRole = new URLSearchParams(window.location.search).get('role') ?? 'admin'
const roles = ['admin', 'doctor', 'patient']

const nextRole = computed(() => {
  const currentIndex = roles.indexOf(currentRole)
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
  window.location.search = `?role=${nextRole.value}`
}
</script>

<template>
  <button class="topbar-pill role-switcher" type="button" @click="toggleRole" title="Switch Role">
    <span aria-hidden="true">{{ getShortLabel(currentRole) }}</span>
  </button>
</template>

