<script setup>
import { computed } from 'vue'

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  sortBy: {
    type: String,
    default: 'recent'
  },
  labels: {
    type: Object,
    required: true
  },
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['update:sortBy', 'open-record', 'change-page'])

const visiblePages = computed(() =>
  Array.from({ length: props.totalPages }, (_, index) => index + 1)
)
</script>

<template>
  <article class="patient-history-card clinical-timeline-card">
    <header>
      <h2>{{ labels.clinicalTimeline }}</h2>
      <label>
        {{ labels.sortBy }}
        <select :value="sortBy" @change="emit('update:sortBy', $event.target.value)">
          <option value="recent">{{ labels.mostRecent }}</option>
          <option value="oldest">{{ labels.oldest }}</option>
        </select>
      </label>
    </header>

    <p v-if="loading" class="history-empty-text">{{ labels.loading }}</p>
    <p v-else-if="!records.length" class="history-empty-text">{{ labels.noRecords }}</p>

    <div v-else class="clinical-timeline-list">
      <section v-for="record in records" :key="record.id" class="clinical-timeline-item">
        <time>
          <span class="timeline-date-main">
            <strong>{{ record.monthDay }}</strong>
            <span>{{ record.year }}</span>
          </span>
          <small v-if="record.timeLabel" class="timeline-time">{{ record.timeLabel }}</small>
        </time>

        <div class="timeline-line"></div>

        <div class="timeline-content">
          <span class="timeline-record-code app-code">{{ record.recordCode }}</span>

          <div class="timeline-title-row">
            <span class="timeline-title">{{ record.title }}</span>
            <span class="timeline-status" :class="{ archived: record.isArchived }">{{ record.status }}</span>
          </div>

          <button
            type="button"
            class="timeline-view-icon"
            :aria-label="labels.viewDetails"
            @click="emit('open-record', record)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            {{ labels.viewDetails }}
          </button>
        </div>

        <aside>
          <strong>{{ record.provider }}</strong>
          <span v-if="record.providerCode" class="app-code">{{ record.providerCode }}</span>
          <span>{{ record.providerRole }}</span>
        </aside>
      </section>
    </div>

    <div v-if="totalPages > 1" class="clinical-pagination timeline-pagination" aria-label="Clinical timeline pages">
      <button type="button" :disabled="currentPage === 1" @click="emit('change-page', currentPage - 1)">&lt;</button>
      <button
        v-for="page in visiblePages"
        :key="page"
        type="button"
        :class="{ active: currentPage === page }"
        @click="emit('change-page', page)"
      >
        {{ page }}
      </button>
      <button type="button" :disabled="currentPage === totalPages" @click="emit('change-page', currentPage + 1)">&gt;</button>
    </div>
  </article>
</template>
