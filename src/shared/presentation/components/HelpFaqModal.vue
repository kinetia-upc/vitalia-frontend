<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
    isOpen: Boolean,
    role: {
        type: String,
        default: "admin"
    }
});

const emit = defineEmits(["close"]);

const { t, tm } = useI18n();
const openIndex = ref(null);

const faqItems = computed(() => {
    const items = tm(`help.faq.${props.role}`);
    return Array.isArray(items) && items.length ? items : tm("help.faq.admin");
});

function toggle(index) {
    openIndex.value = openIndex.value === index ? null : index;
}
</script>

<template>
    <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-content">
            <header class="modal-header">
                <h2>{{ t('help.faqTitle') }}</h2>
                <button class="close-btn" @click="emit('close')">&times;</button>
            </header>

            <div class="faq-body">
                <div v-for="(item, index) in faqItems" :key="index" class="faq-item">
                    <button type="button" class="faq-question" @click="toggle(index)">
                        <span>{{ item.question }}</span>
                        <span class="faq-caret" :class="{ open: openIndex === index }">&#9662;</span>
                    </button>
                    <p v-if="openIndex === index" class="faq-answer">{{ item.answer }}</p>
                </div>
            </div>

            <footer class="form-actions">
                <button type="button" class="btn-cancel" @click="emit('close')">{{ t('help.close') }}</button>
            </footer>
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

.faq-body {
    padding: 8px 24px 24px;
}

.faq-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding: 14px 0;
}

.faq-question {
    width: 100%;
    background: transparent;
    border: none;
    color: #DFE3E3;
    font-size: 14px;
    font-weight: 600;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 0;
}

.faq-caret {
    color: #6DD6DB;
    transition: transform 0.15s ease;
}

.faq-caret.open {
    transform: rotate(180deg);
}

.faq-answer {
    margin: 10px 0 0;
    color: #BCC9C9;
    font-size: 13px;
    line-height: 1.5;
}

.form-actions {
    padding: 0 24px 24px;
    display: flex;
    justify-content: flex-end;
}

.btn-cancel {
    padding: 12px 24px;
    border-radius: 9999px;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: transparent;
    color: #BCC9C9;
}
</style>
