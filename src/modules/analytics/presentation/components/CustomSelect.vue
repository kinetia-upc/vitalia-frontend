<script setup>
import { computed } from 'vue'
import VueSelect from 'vue3-select-component'
import 'vue3-select-component/dist/styles.css'

const props = defineProps({
  modelValue: [String, Number, Object, Array],
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <VueSelect
    v-model="value"
    :options="options"
    :placeholder="placeholder"
    class="custom-select"
  />
</template>

<style scoped>
.custom-select {
  --vs-width: 100%;
  --vs-min-height: 44px;
  --vs-padding: 10px 12px;
  --vs-border: 1px solid #151A1A;
  --vs-border-radius: 12px;
  --vs-font-size: 14px;
  --vs-font-family: inherit;
  --vs-text-color: #CCD0D0;
  --vs-line-height: 1.5;
  --vs-placeholder-color: #BCC9C9;
  --vs-background-color: rgba(0, 0, 0, 0.2);
  --vs-disabled-background-color: rgba(0, 0, 0, 0.2);
  --vs-outline-width: 0px;
  --vs-outline-color: transparent;
  --vs-menu-offset-top: 4px;
  --vs-menu-height: 200px;
  --vs-menu-border: 1px solid #151A1A;
  --vs-menu-background-color: #1A2020;
  --vs-menu-box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  --vs-menu-z-index: 100;
  --vs-option-width: 100%;
  --vs-option-padding: 10px 12px;
  --vs-option-cursor: pointer;
  --vs-option-font-size: 14px;
  --vs-option-font-weight: 400;
  --vs-option-text-color: #CCD0D0;
  --vs-option-hover-text-color: #CCD0D0;
  --vs-option-focused-text-color: #6DD6DB;
  --vs-option-selected-text-color: #6DD6DB;
  --vs-option-disabled-text-color: #BCC9C9;
  --vs-option-background-color: #1A2020;
  --vs-option-hover-background-color: rgba(109, 214, 219, 0.1);
  --vs-option-focused-background-color: rgba(109, 214, 219, 0.1);
  --vs-option-selected-background-color: rgba(109, 214, 219, 0.15);
  --vs-option-disabled-background-color: #1A2020;
  --vs-multi-value-margin: 2px;
  --vs-multi-value-border-radius: 4px;
  --vs-multi-value-background-color: rgba(109, 214, 219, 0.2);
  --vs-multi-value-label-padding: 4px 8px;
  --vs-multi-value-label-font-size: 12px;
  --vs-multi-value-label-font-weight: 400;
  --vs-multi-value-label-line-height: 1;
  --vs-multi-value-label-text-color: #6DD6DB;
  --vs-multi-value-delete-padding: 0 4px;
  --vs-multi-value-delete-hover-background-color: rgba(255, 76, 76, 0.2);
  --vs-multi-value-xmark-size: 14px;
  --vs-multi-value-xmark-cursor: pointer;
  --vs-multi-value-xmark-color: #CCD0D0;
  --vs-multi-value-xmark-hover-color: #FF4C4C;
  --vs-indicators-gap: 8px;
  --vs-indicator-icon-size: 18px;
  --vs-indicator-icon-color: #CCD0D0;
  --vs-indicator-dropdown-icon-transition: transform 0.2s ease-out;
  --vs-spinner-color: #6DD6DB;
  --vs-spinner-size: 16px;
}

:deep(.vue-select) {
  background-color: rgba(0, 0, 0, 0.2) !important;
}

:deep(.vue-select .control) {
  background-color: rgba(0, 0, 0, 0.2) !important;
  border: 1px solid #151A1A !important;
  border-radius: 12px !important;
}

:deep(.vue-select.focused .control) {
  border-color: #6DD6DB !important;
  box-shadow: 0 0 0 0px transparent !important;
}

:deep(.vue-select .single-value) {
  color: #CCD0D0 !important;
}

:deep(.vue-select .menu) {
  background-color: #1A2020 !important;
  border: 1px solid #151A1A !important;
  border-radius: 12px !important;
}

:deep(.vue-select .menu-option) {
  color: #CCD0D0 !important;
  background-color: #1A2020 !important;
}

:deep(.vue-select .menu-option:not(.disabled):hover),
:deep(.vue-select .menu-option.focused:not(.selected)) {
  background-color: rgba(109, 214, 219, 0.1) !important;
  color: #6DD6DB !important;
}

:deep(.vue-select .menu-option.selected) {
  background-color: rgba(109, 214, 219, 0.15) !important;
  color: #6DD6DB !important;
}

:deep(.vue-select .search-input) {
  color: #CCD0D0 !important;
}

:deep(.vue-select .input-container::after) {
  color: #CCD0D0 !important;
}
</style>