<script setup>
defineProps({
  record: {
    type: Object,
    required: true
  },
  labels: {
    type: Object,
    required: true
  }
})

defineEmits(['open-care', 'start-attention'])
</script>

<template>
  <article class="clinical-record-card" :class="record.status">
    <div class="record-avatar" :class="`tone-${record.accent}`">
      {{ record.initials }}
    </div>

    <div class="record-main">
      <span class="record-ehr-badge app-code">{{ record.ehrCode }}</span>
      <strong>{{ record.patientName }}</strong>
      <span class="record-appointment-line">{{ labels.appointment }}: <span class="app-code">{{ record.appointmentCode }}</span></span>
      <span class="record-reason">{{ record.reason }}</span>
    </div>

    <div class="record-appointment">
      <span class="record-appointment-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4.5" width="18" height="16" rx="3" />
          <path d="M16 2.5v4M8 2.5v4M3 10h18" />
        </svg>
      </span>
      <div>
        <small>{{ labels.appointment }}</small>
        <strong class="appointment-date">{{ record.appointmentDateLabel }}</strong>
        <span class="appointment-time">{{ record.appointmentTimeLabel }}</span>
      </div>
    </div>

    <div class="record-meta">
      <small>{{ labels.status }}</small>
      <span class="record-status" :class="record.status">{{ record.statusLabel }}</span>
    </div>

    <div class="record-actions">
      <button
        v-if="record.medicalRecord && record.status === 'released'"
        type="button"
        class="record-care-button record-care-button-readonly"
        :aria-label="labels.viewCare"
        @click="$emit('open-care', record)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        {{ labels.viewCare }}
      </button>
      <button
        v-else-if="record.medicalRecord"
        type="button"
        class="record-care-button record-care-button-readonly"
        :aria-label="labels.openCare"
        @click="$emit('open-care', record)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        {{ labels.openCare }}
      </button>
      <button
        v-else-if="record.paymentStatus === 'paid'"
        type="button"
        class="record-care-button record-care-button-readonly"
        :aria-label="labels.startAttention"
        @click="$emit('start-attention', record)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
        {{ labels.startAttention }}
      </button>
      <span v-else class="record-payment-pending" :title="labels.paymentPending">
        {{ labels.paymentPending }}
      </span>
    </div>
  </article>
</template>
