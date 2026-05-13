<script setup>
defineProps({
  filters: {
    type: Array,
    required: true
  },
  selectedFilter: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:selectedFilter'])
</script>

<template>
  <div class="clinical-filter-strip" aria-label="Clinical record filters">
    <button
      v-for="filter in filters"
      :key="filter.id"
      type="button"
      :class="{ active: selectedFilter === filter.id }"
      @click="emit('update:selectedFilter', filter.id)"
    >
      {{ filter.label }}
    </button>
  </div>
</template>
