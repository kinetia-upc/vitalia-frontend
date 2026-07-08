<script setup>
import { computed, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import CustomSelect from "../../../modules/analytics/presentation/components/CustomSelect.vue";

const props = defineProps({
    isOpen: Boolean,
    currentUser: {
        type: Object,
        default: () => null
    }
});

const emit = defineEmits(["close"]);

const { t, tm } = useI18n();
const SUPPORT_EMAIL = "vitalia@enterprise.com";

const form = reactive({
    name: "",
    email: "",
    category: "",
    message: ""
});

const categories = computed(() => tm("help.supportCategories"));
const categoryOptions = computed(() => categories.value.map((option) => ({ label: option, value: option })));

watch(() => props.isOpen, (newVal) => {
    if (!newVal) return;
    const fullName = [props.currentUser?.name, props.currentUser?.paternalSurname]
        .filter(Boolean)
        .join(" ");
    form.name = fullName;
    form.email = props.currentUser?.email ?? "";
    form.category = categories.value[0] ?? "";
    form.message = "";
});

function handleSend() {
    const subject = `Reclamo de soporte - Vitalia (${form.category})`;
    const body = [
        `Nombre: ${form.name}`,
        `Correo: ${form.email}`,
        `Rol: ${props.currentUser?.role ?? ""}`,
        `Categoría: ${form.category}`,
        "",
        "Mensaje:",
        form.message
    ].join("\n");

    const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    emit("close");
}
</script>

<template>
    <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-content">
            <header class="modal-header">
                <h2>{{ t('help.supportTitle') }}</h2>
                <button class="close-btn" @click="emit('close')">&times;</button>
            </header>

            <form class="support-form" @submit.prevent="handleSend">
                <p class="support-target">{{ t('help.supportTarget') }} <strong>{{ SUPPORT_EMAIL }}</strong></p>

                <div class="form-grid">
                    <div class="form-group">
                        <label>{{ t('help.yourName') }}</label>
                        <input v-model="form.name" type="text" required />
                    </div>
                    <div class="form-group">
                        <label>{{ t('help.yourEmail') }}</label>
                        <input v-model="form.email" type="email" required />
                    </div>
                    <div class="form-group full-width">
                        <label>{{ t('help.issueCategory') }}</label>
                        <CustomSelect v-model="form.category" :options="categoryOptions" />
                    </div>
                    <div class="form-group full-width">
                        <label>{{ t('help.yourMessage') }}</label>
                        <textarea v-model="form.message" rows="5" required></textarea>
                    </div>
                </div>

                <footer class="form-actions">
                    <button type="button" class="btn-cancel" @click="emit('close')">{{ t('help.close') }}</button>
                    <button type="submit" class="btn-save">{{ t('help.send') }}</button>
                </footer>
            </form>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.modal-content {
    background: #1A2020;
    border-radius: 24px;
    width: 90%;
    max-width: 560px;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.modal-header {
    padding: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h2 {
    margin: 0;
    color: #DFE3E3;
    font-size: 20px;
}

.close-btn {
    background: transparent;
    border: none;
    color: #BCC9C9;
    font-size: 24px;
    cursor: pointer;
}

.support-form {
    padding: 24px;
}

.support-target {
    margin: 0 0 20px;
    color: #BCC9C9;
    font-size: 13px;
}

.support-target strong {
    color: #6DD6DB;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.full-width {
    grid-column: span 2;
}

.form-group label {
    color: #BCC9C9;
    font-size: 13px;
    font-weight: 600;
}

.form-group input,
.form-group textarea {
    background-color: rgba(0, 0, 0, 0.2);
    border: 1px solid #151A1A;
    border-radius: 12px;
    padding: 12px;
    color: #CCD0D0;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
    border-color: #6DD6DB;
    outline: none;
}

.form-actions {
    margin-top: 32px;
    display: flex;
    justify-content: flex-end;
    gap: 16px;
}

.btn-cancel,
.btn-save {
    padding: 12px 24px;
    border-radius: 9999px;
    font-weight: 700;
    cursor: pointer;
    border: none;
}

.btn-cancel {
    background: transparent;
    color: #BCC9C9;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-save {
    background: linear-gradient(157deg, #20999E 0%, #007A87 100%);
    color: #003739;
}

@media (max-width: 600px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
    .full-width {
        grid-column: span 1;
    }
}
</style>
