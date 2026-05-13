<script setup>
import BaseLayout from '../components/BaseLayout.vue'
import DoctorDashboard from "../../../modules/analytics/presentation/views/dashboards/DoctorDashboard.vue";
import DoctorAgendaView from "../../../modules/scheduling/presentation/views/DoctorAgendaView.vue";
import DoctorPatientsView from "../../../modules/clinical/presentation/views/DoctorPatientsView.vue";
import DoctorOrdersView from "../../../modules/clinical/presentation/views/DoctorOrdersView.vue";
import UserDoctorView from "../../../modules/tenant/presentation/views/UserDoctorView.vue";
</script>

<template>
  <BaseLayout role="doctor" v-slot="{ activeSection, activeMessage }">
    <DoctorDashboard v-if="activeSection === 'dashboard'" />
    <DoctorPatientsView v-else-if="activeSection === 'patients'" />
    <DoctorAgendaView v-else-if="activeSection === 'agenda'" />
    <DoctorOrdersView v-else-if="activeSection === 'orders'" />
    <UserDoctorView v-else-if="activeSection === 'profile'" />
    <p v-else class="section-work-message">{{ activeMessage }}</p>
  </BaseLayout>
</template>
