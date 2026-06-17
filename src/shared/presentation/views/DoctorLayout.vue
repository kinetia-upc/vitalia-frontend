<script setup>
import { onMounted } from 'vue'
import BaseLayout from '../components/BaseLayout.vue'
import { useAuthStore } from '../../application/auth-store.js'

const authStore = useAuthStore()

onMounted(() => {
  authStore.setCurrentUser('doc-001', 'doctor')
})
</script>

<template>
  <BaseLayout role="doctor">
    <RouterView />
  </BaseLayout>
</template>
