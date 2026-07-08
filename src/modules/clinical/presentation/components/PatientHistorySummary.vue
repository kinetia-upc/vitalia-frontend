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

    <div class="history-summary-rows">
    <div class="history-summary-row cyan">
      <span class="history-summary-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4.5" width="18" height="16" rx="3" />
          <path d="M16 2.5v4M8 2.5v4M3 10h18" />
        </svg>
      </span>
      <div>
        <strong>{{ totalVisits }}</strong>
        <span>{{ labels.totalVisits }}</span>
      </div>
    </div>

    <div class="history-summary-row green">
      <span class="history-summary-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 3v3.5L5 12l1.8 6.5A2 2 0 0 0 8.7 20h6.6a2 2 0 0 0 1.9-1.5L19 12l-4-5.5V3" />
          <path d="M9 3h6" />
        </svg>
      </span>
      <div>
        <strong>{{ activeDiagnoses }}</strong>
        <span>{{ labels.activeDiagnoses }}</span>
      </div>
    </div>

    <div class="history-summary-row amber">
      <span class="history-summary-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </svg>
      </span>
      <div>
        <strong>{{ pendingPayments }}</strong>
        <span>{{ labels.pendingPayment }}</span>
      </div>
    </div>
    </div>
  </article>
</template>
