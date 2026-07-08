<script setup>
defineProps({
  nextAppointment: {
    type: Object,
    default: null
  },
  lastRecord: {
    type: Object,
    default: null
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
      <div class="recent-health-item cyan">
        <span class="recent-health-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 4.2 1.5 5.5 1.5 5.5h-15S6 12.2 6 8Z" />
            <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
          </svg>
        </span>
        <div>
          <small>{{ labels.nextAppointment }}</small>
          <template v-if="nextAppointment">
            <strong>{{ nextAppointment.dateLabel }}</strong>
            <span class="recent-health-time">{{ nextAppointment.timeLabel }}</span>
            <span class="recent-health-code app-code">{{ nextAppointment.code }}</span>
          </template>
          <strong v-else class="recent-health-empty">{{ labels.noUpcomingAppointment }}</strong>
        </div>
      </div>

      <div class="recent-health-item green">
        <span class="recent-health-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7 3h7l4 4v14H7Z" />
            <path d="M14 3v4h4" />
            <path d="M9.5 12.5h5M9.5 16h5" />
          </svg>
        </span>
        <div>
          <small>{{ labels.lastRecord }}</small>
          <template v-if="lastRecord">
            <strong>{{ lastRecord.dateLabel }}</strong>
            <span class="recent-health-time">{{ lastRecord.timeLabel }}</span>
            <span class="recent-health-code app-code">{{ lastRecord.code }}</span>
          </template>
          <strong v-else class="recent-health-empty">{{ labels.noRecordYet }}</strong>
        </div>
      </div>

      <div class="recent-health-item amber">
        <span class="recent-health-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 3h12M6 21h12" />
            <path d="M8 3c0 4.5 3 5.5 4 6.5 1-1 4-2 4-6.5M8 21c0-4.5 3-5.5 4-6.5 1 1 4 2 4 6.5" />
          </svg>
        </span>
        <div>
          <small>{{ labels.pendingResults }}</small>
          <strong>{{ pendingResults }}</strong>
        </div>
      </div>
    </div>
  </article>
</template>
