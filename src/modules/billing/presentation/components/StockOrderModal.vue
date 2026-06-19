<script setup>
import { ref } from 'vue'
import usePharmacyStore from '../../../pharmacy/application/pharmacy.store.js'

const props = defineProps({
  medicine: { type: Object, required: true },
  labels: { type: Object, required: true }
})

const emit = defineEmits(['close', 'order-placed'])

const pharmacyStore = usePharmacyStore()
const quantity = ref(1)
const loading = ref(false)
const successMessage = ref('')

function placeOrder() {
  const qty = Number(quantity.value)
  if (qty < 1) return
  loading.value = true
  pharmacyStore.replenishStock(props.medicine, qty).then((order) => {
    successMessage.value = props.labels.orderSuccess
      .replace('{quantity}', String(qty))
      .replace('{name}', props.medicine.name)
      .replace('{newStock}', String(order.newStock))
    loading.value = false
    setTimeout(() => {
      emit('order-placed', order)
    }, 1500)
  }).catch(() => {
    loading.value = false
  })
}
</script>

<template>
  <div class="stock-order-backdrop" @click.self="$emit('close')">
    <article class="stock-order-modal panel" role="dialog" aria-modal="true">
      <header>
        <h2>{{ labels.orderTitle }}</h2>
        <button type="button" class="stock-order-close" @click="$emit('close')">x</button>
      </header>

      <div v-if="successMessage" class="stock-order-success">
        <p>{{ successMessage }}</p>
      </div>

      <template v-else>
        <p class="stock-order-description">
          {{ labels.orderDescription.replace('{name}', medicine.name).replace('{stock}', String(medicine.stock)) }}
        </p>

        <form class="stock-order-form" @submit.prevent="placeOrder">
          <label>
            <span>{{ labels.quantity }}</span>
            <input v-model.number="quantity" type="number" min="1" :max="9999" required />
          </label>

          <div class="stock-order-actions">
            <button type="button" class="stock-order-cancel-btn" @click="$emit('close')">
              {{ labels.cancel }}
            </button>
            <button type="submit" class="stock-order-confirm-btn" :disabled="loading || quantity < 1">
              {{ labels.confirmOrder }}
            </button>
          </div>
        </form>
      </template>
    </article>
  </div>
</template>

<style scoped>
.stock-order-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.stock-order-modal {
  background: var(--layout-bg, #fff);
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 440px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
}
.stock-order-modal header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.stock-order-modal header h2 {
  margin: 0;
  font-size: 1.1rem;
}
.stock-order-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}
.stock-order-description {
  color: var(--text-secondary, #666);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
.stock-order-form label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}
.stock-order-form label span {
  font-size: 0.85rem;
  font-weight: 600;
}
.stock-order-form input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  font-size: 0.9rem;
}
.stock-order-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
.stock-order-cancel-btn,
.stock-order-confirm-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
}
.stock-order-cancel-btn {
  background: var(--bg-secondary, #f0f0f0);
  color: var(--text-primary, #333);
}
.stock-order-confirm-btn {
  background: var(--primary, #2563eb);
  color: #fff;
}
.stock-order-confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.stock-order-success {
  text-align: center;
  padding: 1.5rem 0;
  color: var(--success, #16a34a);
  font-weight: 500;
}
</style>
