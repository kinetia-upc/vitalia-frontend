<script setup>
defineProps({
  searchQuery: {
    type: String,
    default: ''
  },
  sortBy: {
    type: String,
    required: true
  },
  sortOptions: {
    type: Array,
    required: true
  },
  labels: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:searchQuery', 'update:sortBy'])
</script>

<template>
  <div class="clinical-records-toolbar">
    <div>
      <span class="clinical-eyebrow">{{ labels.searchEyebrow }}</span>
      <label class="clinical-search">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10.5 4a6.5 6.5 0 0 1 5.2 10.4l4 4-1.4 1.4-4-4A6.5 6.5 0 1 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"/>
        </svg>
        <input
          :value="searchQuery"
          type="search"
          :placeholder="labels.searchPlaceholder"
          @input="emit('update:searchQuery', $event.target.value)"
        />
      </label>
    </div>

    <div class="clinical-sort">
      <span class="clinical-eyebrow">{{ labels.sortBy }}</span>
      <select :value="sortBy" @change="emit('update:sortBy', $event.target.value)">
        <option v-for="option in sortOptions" :key="option.id" :value="option.id">
          {{ option.label }}
        </option>
      </select>
    </div>
  </div>
</template>
