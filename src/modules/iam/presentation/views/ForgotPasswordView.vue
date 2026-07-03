<script setup>
import { computed, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "../../../../shared/application/auth-store.js";

const authStore = useAuthStore();
const email = ref("");
const sent = ref(false);
const verified = ref(false);
const code = reactive(["", "", "", "", ""]);

const resetCode = computed(() => code.join(""));

function sendCode() {
    authStore.requestResetCode(email.value);
    sent.value = true;
}

function verifyCode() {
    verified.value = authStore.verifyResetCode(resetCode.value);
}
</script>

<template>
  <main class="auth-page auth-page-centered">
    <section class="auth-card auth-card-narrow auth-reset-card" aria-labelledby="forgot-title">
      <div class="auth-card-accent"></div>
      <header class="auth-heading">
        <span class="auth-round-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.2 3.8H3.5A9 9 0 1 0 12 3v2Zm-1 3h2v5h4v2h-6V8Z"/></svg>
        </span>
        <h1 id="forgot-title">Reset Password</h1>
        <p>Enter your registered email address and we'll send you a link to reset your password.</p>
      </header>

      <form v-if="!sent" class="auth-form" @submit.prevent="sendCode">
        <label class="auth-field">
          <span>Email Address</span>
          <div class="auth-input-shell">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4V6Zm2 2v.6l6 3.8 6-3.8V8H6Zm12 2.8-6 3.8-6-3.8V16h12v-5.2Z"/></svg>
            <input v-model.trim="email" type="email" autocomplete="email" placeholder="patient@gmail.com" required />
          </div>
        </label>
        <button class="auth-submit" type="submit">Send Reset Code -></button>
      </form>

      <div v-else class="auth-form auth-reset-sent">
        <span class="auth-round-icon auth-code-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-7 16c.8-3 3.5-5 7-5 1.3 0 2.5.3 3.5.8L14 17.3l2.8 2.8L22 14.9l-1.4-1.4-3.8 3.8-2.8-2.8-.6.6c-.5-.1-.9-.1-1.4-.1-4.3 0-7.8 2.4-9 6h2Z"/></svg>
        </span>
        <h2>Introduce the Reset Code</h2>
        <div class="auth-code-inputs" aria-label="Reset code">
          <input v-for="(_, index) in code" :key="index" v-model="code[index]" maxlength="1" inputmode="numeric" placeholder="-" />
        </div>
        <p v-if="verified" class="auth-success">Code verified locally. Backend connection is pending.</p>
        <button class="auth-submit" type="button" @click="verifyCode">Verify Reset Code -></button>
      </div>

      <RouterLink class="auth-return auth-return-center" to="/sign-in">Return to Sign In</RouterLink>
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
