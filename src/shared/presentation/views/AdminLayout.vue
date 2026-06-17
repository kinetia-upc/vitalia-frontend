<script setup>
import { onMounted } from 'vue'
import BaseLayout from '../components/BaseLayout.vue'
import { useAuthStore } from '../../application/auth-store.js'

const authStore = useAuthStore()

onMounted(() => {
  authStore.setCurrentUser('usr-admin-001', 'admin')
})
</script>

<template>
  <BaseLayout role="admin">
    <RouterView />
  </BaseLayout>
</template>
