<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  appointmentId: { type: String, required: true }
})
const emit = defineEmits(['paid', 'close'])

const PAYMENT_TYPES = ['CARD', 'TRANSFER', 'WALLET']
const CARD_PROVIDERS = ['Visa', 'Mastercard', 'Amex', 'Diners']
const WALLET_PROVIDERS = ['Yape', 'Plin', 'Tunki']
const BANK_PROVIDERS = ['BCP', 'Interbank', 'BBVA', 'Scotiabank']

const paymentType = ref('CARD')
const step = ref('form') // 'form' | 'processing' | 'success'

const form = reactive({
  provider: 'Visa',
  cardNumber: '',
  expiryMonth: '',
  expiryYear: '',
  cvv: '',
  phone: '',
  accountNumber: '',
  isDefault: false
})

const errors = reactive({})

const providers = computed(() => {
  if (paymentType.value === 'CARD') return CARD_PROVIDERS
  if (paymentType.value === 'WALLET') return WALLET_PROVIDERS
  if (paymentType.value === 'TRANSFER') return BANK_PROVIDERS
  return []
})

const providerLabel = computed(() => {
  if (paymentType.value === 'CARD') return 'Card network'
  if (paymentType.value === 'WALLET') return 'Wallet app'
  return 'Bank'
})

const currentYear = new Date().getFullYear()
const expiryYears = Array.from({ length: 12 }, (_, i) => currentYear + i)
const expiryMonths = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1).padStart(2, '0')
}))

function selectType(type) {
  paymentType.value = type
  form.provider = providers.value[0] ?? ''
  clearErrors()
}

function clearErrors() {
  Object.keys(errors).forEach(k => { delete errors[k] })
}

function onCardInput(e) {
  const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
  form.cardNumber = raw.replace(/(.{4})/g, '$1 ').trim()
}

function luhn(num) {
  let sum = 0
  let even = false
  for (let i = num.length - 1; i >= 0; i--) {
    let d = parseInt(num[i])
    if (even) { d *= 2; if (d > 9) d -= 9 }
    sum += d
    even = !even
  }
  return sum % 10 === 0
}

function validate() {
  clearErrors()

  if (paymentType.value === 'CARD') {
    const digits = form.cardNumber.replace(/\s/g, '')
    if (!/^\d{16}$/.test(digits)) {
      errors.cardNumber = t('billing.payment.errorCardNumberFormat')
    } else if (!luhn(digits)) {
      errors.cardNumber = t('billing.payment.errorCardNumberInvalid')
    }

    if (!form.expiryMonth) {
      errors.expiryMonth = t('billing.payment.errorRequired')
    }
    if (!form.expiryYear) {
      errors.expiryYear = t('billing.payment.errorRequired')
    }
    if (form.expiryMonth && form.expiryYear) {
      const expiry = new Date(parseInt(form.expiryYear), parseInt(form.expiryMonth) - 1, 1)
      if (expiry < new Date()) errors.expiryMonth = t('billing.payment.errorCardExpired')
    }

    if (!/^\d{3,4}$/.test(form.cvv)) {
      errors.cvv = t('billing.payment.errorCvv')
    }
  }

  if (paymentType.value === 'WALLET') {
    const phone = form.phone.replace(/[\s\-]/g, '')
    if (!/^\+?\d{9,12}$/.test(phone)) {
      errors.phone = t('billing.payment.errorPhone')
    }
  }

  if (paymentType.value === 'TRANSFER') {
    if (!form.accountNumber.trim()) {
      errors.accountNumber = t('billing.payment.errorAccountNumber')
    }
  }

  return Object.keys(errors).length === 0
}

function simulateToken() {
  if (paymentType.value === 'CARD') {
    const last4 = form.cardNumber.replace(/\s/g, '').slice(-4)
    const net = form.provider.toLowerCase()
    return `tok_sim_${net}_${last4}`
  }
  if (paymentType.value === 'WALLET') {
    return `tok_sim_wallet_${form.provider.toLowerCase()}`
  }
  if (paymentType.value === 'TRANSFER') {
    return `tok_sim_transfer_${form.provider.toLowerCase()}`
  }
  return `tok_sim_unknown`
}

async function submit() {
  if (!validate()) return

  step.value = 'processing'
  await new Promise(resolve => setTimeout(resolve, 1800))

  simulateToken()

  step.value = 'success'
  // Emit synchronously — no setTimeout, so the parent always receives it
  emit('paid', props.appointmentId)
}

function typeLabel(type) {
  if (type === 'CARD') return t('billing.payment.tabCard')
  if (type === 'TRANSFER') return t('billing.payment.tabTransfer')
  return t('billing.payment.tabWallet')
}

function maskedDisplay() {
  if (paymentType.value === 'CARD') {
    const last4 = form.cardNumber.replace(/\s/g, '').slice(-4) || '????'
    return `**** **** **** ${last4}`
  }
  return ''
}
</script>

<template>
  <div class="modal-backdrop">
    <article class="payment-popup panel">

      <!-- Header -->
      <div class="panel-heading">
        <h2>{{ t('billing.payment.title') }}</h2>
        <button
          class="text-action"
          type="button"
          :disabled="step === 'processing'"
          @click="emit('close')"
        >{{ t('billing.payment.close') }}</button>
      </div>

      <!-- Payment type selector -->
      <div v-if="step === 'form'" class="payment-type-tabs">
        <button
          v-for="type in PAYMENT_TYPES"
          :key="type"
          type="button"
          :class="['payment-type-tab', { active: paymentType === type }]"
          @click="selectType(type)"
        >
          <span class="tab-icon">
            <svg v-if="type === 'CARD'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2.5" /><path d="M2 10h20" /><path d="M6 15h4" /></svg>
            <svg v-else-if="type === 'TRANSFER'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-6 9 6" /><path d="M5 10v9M10 10v9M14 10v9M19 10v9" /><path d="M3 21h18" /></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M10 18h4" /></svg>
          </span>
          {{ typeLabel(type) }}
        </button>
      </div>

      <!-- FORM -->
      <form v-if="step === 'form'" class="payment-form" @submit.prevent="submit" novalidate>

        <!-- CARD fields -->
        <template v-if="paymentType === 'CARD'">
          <label class="popup-field">
            <span class="popup-label">{{ t('billing.payment.cardNetwork') }}</span>
            <select v-model="form.provider" class="popup-input">
              <option v-for="p in CARD_PROVIDERS" :key="p" :value="p">{{ p }}</option>
            </select>
          </label>

          <label class="popup-field">
            <span class="popup-label">{{ t('billing.payment.cardNumber') }}</span>
            <input
              class="popup-input popup-card-input"
              :value="form.cardNumber"
              @input="onCardInput"
              placeholder="0000 0000 0000 0000"
              maxlength="19"
              inputmode="numeric"
              autocomplete="cc-number"
            />
            <span class="popup-error" v-if="errors.cardNumber">{{ errors.cardNumber }}</span>
            <span class="popup-masked" v-if="form.cardNumber.length >= 4">{{ maskedDisplay() }}</span>
          </label>

          <div class="popup-row">
            <div class="popup-field">
              <span class="popup-label">{{ t('billing.payment.expiryMonth') }}</span>
              <select v-model="form.expiryMonth" class="popup-input">
                <option value="">MM</option>
                <option v-for="m in expiryMonths" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
              <span class="popup-error" v-if="errors.expiryMonth">{{ errors.expiryMonth }}</span>
            </div>
            <div class="popup-field">
              <span class="popup-label">{{ t('billing.payment.expiryYear') }}</span>
              <select v-model="form.expiryYear" class="popup-input">
                <option value="">YYYY</option>
                <option v-for="y in expiryYears" :key="y" :value="y">{{ y }}</option>
              </select>
              <span class="popup-error" v-if="errors.expiryYear">{{ errors.expiryYear }}</span>
            </div>
            <div class="popup-field">
              <span class="popup-label">{{ t('billing.payment.cvv') }}</span>
              <input
                v-model="form.cvv"
                class="popup-input"
                placeholder="•••"
                maxlength="4"
                type="password"
                autocomplete="cc-csc"
                inputmode="numeric"
              />
              <span class="popup-error" v-if="errors.cvv">{{ errors.cvv }}</span>
            </div>
          </div>
        </template>

        <!-- WALLET fields -->
        <template v-else-if="paymentType === 'WALLET'">
          <label class="popup-field">
            <span class="popup-label">{{ t('billing.payment.walletApp') }}</span>
            <select v-model="form.provider" class="popup-input">
              <option v-for="p in WALLET_PROVIDERS" :key="p" :value="p">{{ p }}</option>
            </select>
          </label>
          <label class="popup-field">
            <span class="popup-label">{{ t('billing.payment.phoneNumber') }}</span>
            <input
              v-model="form.phone"
              class="popup-input"
              placeholder="+51 999 999 999"
              inputmode="tel"
              autocomplete="tel"
            />
            <span class="popup-error" v-if="errors.phone">{{ errors.phone }}</span>
          </label>
        </template>

        <!-- TRANSFER fields -->
        <template v-else>
          <label class="popup-field">
            <span class="popup-label">{{ t('billing.payment.bank') }}</span>
            <select v-model="form.provider" class="popup-input">
              <option v-for="p in BANK_PROVIDERS" :key="p" :value="p">{{ p }}</option>
            </select>
          </label>
          <label class="popup-field">
            <span class="popup-label">{{ t('billing.payment.accountNumber') }}</span>
            <input
              v-model="form.accountNumber"
              class="popup-input"
              :placeholder="t('billing.payment.accountNumberPlaceholder')"
              inputmode="numeric"
            />
            <span class="popup-error" v-if="errors.accountNumber">{{ errors.accountNumber }}</span>
          </label>
        </template>

        <label class="popup-toggle">
          <input type="checkbox" v-model="form.isDefault" />
          <span>{{ t('billing.payment.setDefault') }}</span>
        </label>

        <!-- Security note -->
        <p v-if="paymentType === 'CARD'" class="popup-security-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          {{ t('billing.payment.securityNote') }}
        </p>

        <button type="submit" class="primary-action popup-submit">
          {{ t('billing.payment.payNow') }}
        </button>
      </form>

      <!-- PROCESSING -->
      <div v-else-if="step === 'processing'" class="payment-body payment-centered">
        <div class="payment-spinner"></div>
        <p class="processing-label">{{ t('billing.payment.processing') }}</p>
        <small class="processing-sub">{{ t('billing.payment.processingSub') }}</small>
      </div>

      <!-- SUCCESS -->
      <div v-else-if="step === 'success'" class="payment-body payment-centered">
        <span class="payment-check">✓</span>
        <p class="success-label">{{ t('billing.payment.success') }}</p>
        <small class="success-sub">{{ t('billing.payment.successSub') }}</small>
      </div>

    </article>
  </div>
</template>
