<script setup>
defineProps({
  nextAppointment: {
    type: String,
    default: '-'
  },
  lastLab: {
    type: String,
    default: '-'
  },
  pendingResults: {
    type: Number,
    default: 0
  },
  labels: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <article class="patient-history-card recent-health-card">
    <h2>{{ labels.recentHealthActivity }}</h2>

    <div class="recent-health-grid">
      <div>
        <small>{{ labels.nextAppointment }}</small>
        <strong>{{ nextAppointment }}</strong>
      </div>
      <div>
        <small>{{ labels.lastRecord }}</small>
        <strong>{{ lastLab }}</strong>
      </div>
      <div>
        <small>{{ labels.pendingResults }}</small>
        <strong>{{ pendingResults }}</strong>
      </div>
    </div>
  </article>
</template>
