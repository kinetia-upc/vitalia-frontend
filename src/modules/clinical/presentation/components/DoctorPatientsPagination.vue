<script setup>
defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  visiblePages: {
    type: Array,
    required: true
  },
  pageSize: {
    type: Number,
    required: true
  },
  totalRecords: {
    type: Number,
    required: true
  },
  visibleCount: {
    type: Number,
    required: true
  },
  showingLabel: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['change'])
</script>

<template>
  <footer class="clinical-record-footer">
    <span>{{ showingLabel }}</span>
    <div v-if="totalRecords > pageSize" class="clinical-pagination" aria-label="Clinical records pages">
      <button type="button" :disabled="currentPage === 1" @click="emit('change', currentPage - 1)">&lt;</button>
      <button
        v-for="page in visiblePages"
        :key="page"
        type="button"
        :class="{ active: currentPage === page }"
        @click="emit('change', page)"
      >
        {{ page }}
      </button>
      <button type="button" :disabled="currentPage === totalPages" @click="emit('change', currentPage + 1)">&gt;</button>
    </div>
  </footer>
</template>
