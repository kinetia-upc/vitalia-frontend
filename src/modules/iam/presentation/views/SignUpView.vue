<script setup>
import { computed, reactive } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "../../../../shared/application/auth-store.js";

const router = useRouter();
const authStore = useAuthStore();
const form = reactive({
    name: "",
    paternalSurname: "",
    maternalSurname: "",
    gender: "",
    identityType: "",
    identityNumber: "",
    dateBirth: "",
    address: "",
    department: "",
    province: "",
    district: "",
    phone: "",
    email: "",
    password: "",
    repeatPassword: "",
    acceptedTerms: false
});

const passwordsMatch = computed(() => !form.repeatPassword || form.password === form.repeatPassword);
const canSubmit = computed(() => form.acceptedTerms && form.password && form.password === form.repeatPassword);

async function submit() {
    if (!canSubmit.value) return;

    try {
        await authStore.signUp({
            ...form,
            dateBirth: form.dateBirth || null,
            address: [form.address, form.district, form.province, form.department].filter(Boolean).join(", ")
        });

        await router.replace("/dashboard");
    } catch {
        // The store owns the user-facing error message.
    }
}
</script>

<template>
  <main class="auth-page auth-page-wide">
    <section class="auth-card auth-card-wide" aria-labelledby="signup-title">
      <div class="auth-card-accent"></div>

      <header class="auth-heading auth-heading-left">
        <h1 id="signup-title">Enter your details</h1>
        <p>Join to Clinical National</p>
      </header>

      <form class="auth-grid-form" @submit.prevent="submit">
        <label class="auth-field">
          <span>First Names</span>
          <input v-model.trim="form.name" class="auth-plain-input" required />
        </label>

        <label class="auth-field">
          <span>Father's Last Name</span>
          <input v-model.trim="form.paternalSurname" class="auth-plain-input" required />
        </label>

        <label class="auth-field">
          <span>Mother's Last Name</span>
          <input v-model.trim="form.maternalSurname" class="auth-plain-input" />
        </label>

        <label class="auth-field">
          <span>Gender</span>
          <select v-model="form.gender" class="auth-plain-input" required>
            <option value="" disabled>Select...</option>
            <option value="F">Female</option>
            <option value="M">Male</option>
            <option value="O">Other</option>
          </select>
        </label>

        <label class="auth-field">
          <span>Document Type</span>
          <select v-model="form.identityType" class="auth-plain-input" required>
            <option value="" disabled>Select...</option>
            <option value="DNI">DNI</option>
            <option value="CE">CE</option>
            <option value="PASSPORT">Passport</option>
          </select>
        </label>

        <label class="auth-field">
          <span>Document Number</span>
          <input v-model.trim="form.identityNumber" class="auth-plain-input" required />
        </label>

        <label class="auth-field">
          <span>Date of Birth</span>
          <input v-model="form.dateBirth" type="date" class="auth-plain-input" required />
        </label>

        <label class="auth-field">
          <span>Address</span>
          <input v-model.trim="form.address" class="auth-plain-input" required />
        </label>

        <label class="auth-field">
          <span>Department</span>
          <select v-model="form.department" class="auth-plain-input" required>
            <option value="" disabled>Select...</option>
            <option value="Lima">Lima</option>
            <option value="Callao">Callao</option>
            <option value="Arequipa">Arequipa</option>
          </select>
        </label>

        <label class="auth-field">
          <span>Province</span>
          <select v-model="form.province" class="auth-plain-input" required>
            <option value="" disabled>Select...</option>
            <option value="Lima">Lima</option>
            <option value="Callao">Callao</option>
            <option value="Arequipa">Arequipa</option>
          </select>
        </label>

        <label class="auth-field">
          <span>District</span>
          <select v-model="form.district" class="auth-plain-input" required>
            <option value="" disabled>Select...</option>
            <option value="San Isidro">San Isidro</option>
            <option value="Miraflores">Miraflores</option>
            <option value="San Borja">San Borja</option>
          </select>
        </label>

        <label class="auth-field">
          <span>Cell Phone</span>
          <input v-model.trim="form.phone" class="auth-plain-input" autocomplete="tel" required />
        </label>

        <label class="auth-field">
          <span>Email</span>
          <input v-model.trim="form.email" type="email" class="auth-plain-input" autocomplete="email" required />
        </label>

        <label class="auth-field">
          <span>Password</span>
          <input v-model="form.password" type="password" class="auth-plain-input" autocomplete="new-password" required />
        </label>

        <label class="auth-field">
          <span>Repeat Password</span>
          <input v-model="form.repeatPassword" type="password" class="auth-plain-input" autocomplete="new-password" required />
        </label>

        <label class="auth-terms">
          <input v-model="form.acceptedTerms" type="checkbox" required />
          <span>I have read and accept the <a href="#">Terms and Conditions</a></span>
        </label>

        <p v-if="!passwordsMatch" class="auth-error auth-grid-error">Passwords do not match.</p>
        <p v-if="authStore.error" class="auth-error auth-grid-error">{{ authStore.error }}</p>

        <div class="auth-register-actions">
          <RouterLink class="auth-return" to="/sign-in">Return</RouterLink>
          <button class="auth-submit auth-submit-compact" type="submit" :disabled="authStore.loading || !canSubmit">
            {{ authStore.loading ? "Registering..." : "Register" }}
          </button>
        </div>
      </form>
    </section>

    <footer class="auth-footer">
      <span>&copy; 2026 VITALIA. ALL RIGHTS RESERVED.</span>
      <nav>
        <a href="#">PRIVACY POLICY</a>
        <a href="#">TERMS OF SERVICE</a>
        <a href="#">COMPLIANCE</a>
        <a href="#">CONTACT SUPPORT</a>
      </nav>
    </footer>
  </main>
</template>
