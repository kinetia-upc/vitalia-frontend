<script setup>
import { computed } from "vue";
import { useAuthStore } from "../../application/auth-store.js";
import AdminSchedulingView from "../../../modules/scheduling/presentation/views/AdminSchedulingView.vue";
import DoctorAgendaView from "../../../modules/scheduling/presentation/views/DoctorAgendaView.vue";

const authStore = useAuthStore();
const component = computed(() => authStore.currentUserRole === "doctor" ? DoctorAgendaView : AdminSchedulingView);
</script>

<template>
  <component :is="component" />
</template>
