<script setup>
import { reactive, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../../../shared/application/auth-store.js";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const showPassword = ref(false);
const form = reactive({
    email: "",
    password: ""
});

async function submit() {
    try {
        await authStore.signIn({
            email: form.email,
            password: form.password
        });

        await router.replace(route.query.redirect?.toString() || "/dashboard");
    } catch {
        // The store owns the user-facing error message.
    }
}
</script>

<template>
  <main class="auth-page auth-page-centered">
    <section class="auth-card auth-card-narrow" aria-labelledby="signin-title">
      <div class="auth-card-accent"></div>

      <header class="auth-heading">
        <h1 id="signin-title">Welcome Back</h1>
        <p>Access your clinical sanctuary securely.</p>
      </header>

      <form class="auth-form" @submit.prevent="submit">
        <label class="auth-field">
          <span>Email Address</span>
          <div class="auth-input-shell">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4V6Zm2 2v.6l6 3.8 6-3.8V8H6Zm12 2.8-6 3.8-6-3.8V16h12v-5.2Z"/></svg>
            <input v-model.trim="form.email" type="email" autocomplete="email" placeholder="doctor@gmail.com" required />
          </div>
        </label>

        <label class="auth-field">
          <span class="auth-row-label">
            Password
            <RouterLink to="/forgot-password">Forgot password?</RouterLink>
          </span>
          <div class="auth-input-shell">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 9h1a2 2 0 0 1 2 2v8H4v-8a2 2 0 0 1 2-2h1V7a5 5 0 0 1 10 0v2Zm-8 0h6V7a3 3 0 0 0-6 0v2Zm2 4v4h2v-4h-2Z"/></svg>
            <input v-model="form.password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="********" required />
            <button class="auth-icon-button" type="button" :aria-pressed="showPassword" @click="showPassword = !showPassword">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.8 3.6 4.2 2.2l17 17-1.4 1.4-3-3A10.8 10.8 0 0 1 12 19C6.5 19 3.2 14.9 2 12c.7-1.7 2.1-3.7 4.2-5.1L2.8 3.6Zm5 5C6.4 9.5 5.3 10.7 4.5 12c1.2 2 3.7 5 7.5 5 1.1 0 2.1-.2 3-.6l-2-2A3 3 0 0 1 9.6 11l-1.8-2.4ZM12 5c5.5 0 8.8 4.1 10 7-.4 1-1.2 2.3-2.4 3.5l-2.1-2.1c.1-.4.2-.9.2-1.4A5.7 5.7 0 0 0 12 6.3c-.5 0-1 .1-1.4.2L8.9 4.8c1-.5 2-.8 3.1-.8Z"/></svg>
            </button>
          </div>
        </label>

        <p v-if="authStore.error" class="auth-error">{{ authStore.error }}</p>

        <button class="auth-submit" type="submit" :disabled="authStore.loading">
          {{ authStore.loading ? "Signing in..." : "Sign In to Portal" }}
        </button>
      </form>

      <p class="auth-switch">Dont have an account? <RouterLink to="/sign-up">Sign Up</RouterLink></p>
      <p class="auth-compliance">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 5 5v6c0 4.4 2.8 8.4 7 10 4.2-1.6 7-5.6 7-10V5l-7-3Zm0 2.2 5 2.1V11c0 3.3-1.9 6.3-5 7.7-3.1-1.4-5-4.4-5-7.7V6.3l5-2.1Z"/></svg>
        HIPAA Compliant & End-to-End Encrypted
      </p>
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
