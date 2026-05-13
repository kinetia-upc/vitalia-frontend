<script setup>
defineProps({
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
  }
})

const emit = defineEmits(['update:sortBy', 'open-record'])
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
          <strong>{{ record.monthDay }}</strong>
          <span>{{ record.year }}</span>
        </time>

        <div class="timeline-line"></div>

        <div class="timeline-content">
          <div class="timeline-title-row">
            <button type="button" @click="emit('open-record', record)">
              {{ record.title }}
            </button>
            <span :class="{ archived: record.isArchived }">{{ record.status }}</span>
          </div>

          <p>{{ record.description }}</p>
        </div>

        <aside>
          <strong>{{ record.provider }}</strong>
          <span>{{ record.providerRole }}</span>
        </aside>
      </section>
    </div>
  </article>
</template>
