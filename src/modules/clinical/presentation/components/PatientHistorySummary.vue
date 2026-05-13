<script setup>
defineProps({
  totalVisits: {
    type: Number,
    default: 0
  },
  activeDiagnoses: {
    type: Number,
    default: 0
  },
  pendingPayments: {
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
  <article class="patient-history-card history-summary-card">
    <small>{{ labels.patientSummary }}</small>

    <div class="history-summary-row">
      <strong>{{ totalVisits }}</strong>
      <span>{{ labels.totalVisits }}</span>
    </div>

    <div class="history-summary-row">
      <strong>{{ String(activeDiagnoses).padStart(2, '0') }}</strong>
      <span>{{ labels.activeDiagnoses }}</span>
    </div>

    <div class="history-summary-row">
      <strong>{{ pendingPayments }}</strong>
      <span>{{ labels.pendingPayment }}</span>
    </div>
  </article>
</template>
