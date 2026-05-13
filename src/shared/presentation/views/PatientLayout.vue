<script setup>
import {computed, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import BaseLayout from '../components/BaseLayout.vue'

const route = useRoute()
const router = useRouter()
const openBookingOnAppointments = ref(false)

const activeSection = computed(() => route.meta.section)

function handleBookAppointment() {
  openBookingOnAppointments.value = true
  router.push('/patient/appointments')
}

function handleViewAppointments(selectSection) {
  openBookingOnAppointments.value = false
  selectSection('appointments')
}

function handleViewHistory(selectSection) {
  selectSection('history')
}

function handleBookingIntentConsumed() {
  openBookingOnAppointments.value = false
}
</script>

<template>
  <BaseLayout role="patient">
    <RouterView v-slot="{ Component }">
      <component
        v-if="activeSection === 'appointments'"
        :is="Component"
        :open-booking-on-enter="openBookingOnAppointments"
        @booking-intent-consumed="handleBookingIntentConsumed"
      />
      <component
        v-else
        :is="Component"
        @book-appointment="handleBookAppointment"
        @view-appointments="router.push('/patient/appointments')"
        @view-history="router.push('/patient/history')"
      />
    </RouterView>
  </BaseLayout>
</template>
