<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const setLocale = (lang) => {
  locale.value = lang
  document.documentElement.lang = lang
  localStorage.setItem('user-locale', lang)
}
</script>

<template>
  <div class="segmented-control">
    <button
      type="button"
      class="lang-btn"
      :class="{ selected: locale === 'en' }"
      @click="setLocale('en')"
    >
      EN
    </button>
    <button
      type="button"
      class="lang-btn"
      :class="{ selected: locale === 'es' }"
      @click="setLocale('es')"
    >
      ES
    </button>
  </div>
</template>
