<script setup>
import { computed } from "vue";
import { useAuthStore } from "../../application/auth-store.js";
import UserDoctorView from "../../../modules/tenant/presentation/views/UserDoctorView.vue";
import UserPatientView from "../../../modules/tenant/presentation/views/UserPatientView.vue";

const authStore = useAuthStore();
const component = computed(() => authStore.currentUserRole === "doctor" ? UserDoctorView : UserPatientView);
</script>

<template>
  <component :is="component" />
</template>
