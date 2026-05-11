<script setup>
defineProps({
  items: {
    type: Array,
    required: true
  },
  secondaryItems: {
    type: Array,
    default: () => []
  },
  activeSection: {
    type: String,
    required: true
  },
  userLabel: {
    type: String,
    default: ''
  },
  logoSrc: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['select'])

const selectItem = (item) => {
  if (!item.disabled) emit('select', item.id)
}
</script>

<template>
  <aside class="sidebar-shell" aria-label="Primary navigation">
    <div class="brand-block">
      <div class="brand-logo-slot">
        <!--<img v-if="logoSrc" :src="logoSrc" alt="Clinic Logo" />-->
        <!--<span v-else>Logo</span>-->
        <img src="../../../assets/clinic-logo.png" alt="Clinic Logo"></img>
      </div>
      <div class="brand-name">
        <span>Clinic Notional</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <button
        v-for="item in items"
        :key="item.id"
        class="sidebar-link"
        :class="{ active: activeSection === item.id }"
        type="button"
        @click="selectItem(item)"
      >
        <span class="sidebar-icon" aria-hidden="true" v-html="item.icon"></span>
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="sidebar-footer">
      <div v-if="userLabel" class="sidebar-user">
        <span class="sidebar-icon user-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.6 0-6.5 1.8-6.5 4v.5h13v-.5c0-2.2-2.9-4-6.5-4Z"/></svg>
        </span>
        <span>{{ userLabel }}</span>
      </div>

      <button
        v-for="item in secondaryItems"
        :key="item.id"
        class="sidebar-link secondary"
        :class="{ active: activeSection === item.id, danger: item.tone === 'danger' }"
        type="button"
        @click="selectItem(item)"
      >
        <span class="sidebar-icon" aria-hidden="true" v-html="item.icon"></span>
        <span>{{ item.label }}</span>
      </button>
    </div>
  </aside>
</template>
