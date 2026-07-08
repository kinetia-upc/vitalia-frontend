<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";

const email = ref("");
const sent = ref(false);
</script>

<template>
  <main class="auth-page auth-page-centered">
    <section class="auth-card auth-card-narrow" aria-labelledby="forgot-title">
      <div class="auth-card-accent"></div>
      <header class="auth-heading">
        <span class="auth-round-icon">↺</span>
        <h1 id="forgot-title">Reset Password</h1>
        <p>Enter your registered email address and we'll send you a link to reset your password.</p>
      </header>

      <form v-if="!sent" class="auth-form" @submit.prevent="sent = true">
        <label class="auth-field">
          <span>Email Address</span>
          <div class="auth-input-shell">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4V6Zm2 2v.6l6 3.8 6-3.8V8H6Zm12 2.8-6 3.8-6-3.8V16h12v-5.2Z"/></svg>
            <input v-model.trim="email" type="email" autocomplete="email" placeholder="patient@gmail.com" required />
          </div>
        </label>
        <button class="auth-submit" type="submit">Send Reset Code</button>
      </form>

      <div v-else class="auth-form auth-reset-sent">
        <h2>Introduce the Reset Code</h2>
        <div class="auth-code-preview"><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span></div>
        <button class="auth-submit" type="button">Verify Reset Code</button>
      </div>

      <RouterLink class="auth-return auth-return-center" to="/sign-in">Return to Sign In</RouterLink>
    </section>
  </main>
</template>

