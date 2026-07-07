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
  <article class="clinical-record-card">
    <div class="record-avatar" :class="`tone-${record.accent}`">
      {{ record.initials }}
    </div>

    <div class="record-main">
      <strong>{{ record.patientName }}</strong>
      <span>{{ record.ehrCode }} - {{ record.reason }}</span>
    </div>

    <div class="record-meta">
      <small>{{ labels.appointment }}</small>
      <span class="appointment-date">{{ record.appointmentDateLabel }}</span>
      <span class="appointment-time">{{ record.appointmentTimeLabel }}</span>
    </div>

    <div class="record-meta">
      <small>{{ labels.status }}</small>
      <span class="record-status" :class="record.status">{{ record.statusLabel }}</span>
    </div>

    <div class="vital-trace">
      <small>{{ labels.vitalTrace }}</small>
      <div>
        <i v-for="(bar, index) in record.trace" :key="index" :style="{ height: `${bar}%` }"></i>
      </div>
    </div>

    <div class="record-actions">
      <button
        v-if="record.medicalRecord"
        type="button"
        class="record-care-button"
        :aria-label="labels.openCare"
        @click="$emit('open-care', record)"
      >
        {{ labels.openCare }}
      </button>
      <button
        v-else
        type="button"
        class="record-care-button"
        :aria-label="labels.startAttention"
        @click="$emit('start-attention', record)"
      >
        {{ labels.startAttention }}
      </button>
    </div>
  </article>
</template>
