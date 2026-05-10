<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const nextLocale = computed(() => (locale.value === 'en' ? 'ES' : 'EN'))

const toggleLocale = () => {
  locale.value = locale.value === 'en' ? 'es' : 'en'
  document.documentElement.lang = locale.value
}
</script>

<template>
  <button class="topbar-pill language-switcher" type="button" @click="toggleLocale">
    <span class="language-dot" aria-hidden="true">{{ locale.toUpperCase() }}</span>
    <span>{{ nextLocale }}</span>
  </button>
</template>
