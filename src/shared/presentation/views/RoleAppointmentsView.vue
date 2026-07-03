<script setup>
import { computed } from "vue";
import { useAuthStore } from "../../application/auth-store.js";
import AdminSchedulingView from "../../../modules/scheduling/presentation/views/AdminSchedulingView.vue";
import DoctorAgendaView from "../../../modules/scheduling/presentation/views/DoctorAgendaView.vue";
import PatientAppointmentsView from "../../../modules/scheduling/presentation/views/PatientAppointmentsView.vue";

const authStore = useAuthStore();
const component = computed(() => {
  if (authStore.currentUserRole === "doctor") return DoctorAgendaView;
  if (authStore.currentUserRole === "patient") return PatientAppointmentsView;
  return AdminSchedulingView;
});
</script>

<template>
  <component :is="component" />
</template>
