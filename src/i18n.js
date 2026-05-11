import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import es from './locales/es.json';

const savedLocale = localStorage.getItem('user-locale') || 'en';
document.documentElement.lang = savedLocale;

const i18n = createI18n({
    legacy: false,
    locale: savedLocale,
    fallbackLocale: 'en',
    messages: {
        en: en,
        es: es
    }
});

export default i18n;