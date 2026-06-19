<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import usePharmacyStore from '../../../pharmacy/application/pharmacy.store.js'

const props = defineProps({
  medicine: { type: Object, required: true },
  labels: { type: Object, required: true }
})

const emit = defineEmits(['close', 'order-placed'])

const { t } = useI18n()
const pharmacyStore = usePharmacyStore()
const quantity = ref(1)
const loading = ref(false)
const successMessage = ref('')

const orderDescription = computed(() =>
  t('billing.stockReplenishment.orderDescription', {
    name: props.medicine.name,
    stock: Number(props.medicine.stock) || 0
  })
)

function placeOrder() {
  const qty = Number(quantity.value)
  if (qty < 1) return
  loading.value = true
  pharmacyStore.replenishStock(props.medicine, qty).then((order) => {
    successMessage.value = t('billing.stockReplenishment.orderSuccess', {
      quantity: qty,
      name: props.medicine.name,
      newStock: order.newStock
    })
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
          {{ orderDescription }}
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
  z-index: 25;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(5, 7, 7, 0.72);
}
.stock-order-modal {
  width: min(460px, 100%);
  display: grid;
  gap: 18px;
  padding: 26px;
  border-radius: 28px;
  background: #171b1a;
}
.stock-order-modal header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}
.stock-order-modal header h2 {
  margin: 0;
  color: var(--text);
}
.stock-order-modal header button {
  width: 36px;
  height: 36px;
  color: #dce4e2;
  background: #2b302f;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
}
.stock-order-description {
  color: #b8c2c0;
  font-size: 0.9rem;
  margin: 0;
}
.stock-order-form {
  display: grid;
  gap: 14px;
}
.stock-order-form label {
  display: grid;
  gap: 8px;
}
.stock-order-form label span {
  color: #d9e2e0;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 900;
}
.stock-order-form input {
  width: 100%;
  min-height: 42px;
  padding: 0 14px;
  color: var(--text);
  background: #303534;
  border: 1px solid transparent;
  border-radius: 999px;
  outline: 0;
  font: inherit;
  box-sizing: border-box;
}
.stock-order-form input:focus {
  border-color: var(--cyan);
}
.stock-order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.stock-order-cancel-btn {
  min-height: 44px;
  padding: 0 22px;
  color: var(--text);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
}
.stock-order-confirm-btn {
  min-height: 44px;
  padding: 0 22px;
  color: #102323;
  background: var(--cyan);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 900;
}
.stock-order-confirm-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.stock-order-success {
  text-align: center;
  padding: 1.5rem 0;
  color: #4ade80;
  font-weight: 500;
}
</style>
