<script setup>
import {computed, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import useTenantStore from "../../application/tenant.store.js";
import useClinicalStore from "../../../clinical/application/clinical.store.js";
import { useAuthStore } from "../../../../shared/application/auth-store.js";

const authStore = useAuthStore();
const CURRENT_PATIENT_ID = computed(() => authStore.currentPatientId);
const SUPPORT_EMAIL = "support@vitalia.pe";

const tenantStore = useTenantStore();
const clinicalStore = useClinicalStore();
const {t, locale} = useI18n();

const emailDraft = ref("");
const phoneDraft = ref("");
const emergencyContactNameDraft = ref("");
const emergencyContactPhoneDraft = ref("");
const requestChangeOpen = ref(false);

const insuranceProviderDraft = ref("");
const policyNumberDraft = ref("");
const activeThruDraft = ref("");
const editingPolicy = ref(false);

onMounted(() => {
    if (!tenantStore.usersLoaded) tenantStore.fetchUsers();
    if (!clinicalStore.patientsLoaded) clinicalStore.fetchPatients();
});

const patient = computed(() => clinicalStore.getPatientById(CURRENT_PATIENT_ID.value) ?? clinicalStore.patients[0]);
const user = computed(() => {
    if (!patient.value?.userId) return tenantStore.users.find(item => item.role === "patient");
    return tenantStore.users.find(item => item.id === patient.value.userId);
});

const fullName = computed(() => {
    if (!user.value) return t("tenant.patientProfile.patientFallback");
    return [
        user.value.name,
        user.value.paternalSurname,
        user.value.maternalSurname
    ].filter(Boolean).join(" ");
});

const initials = computed(() =>
    fullName.value
        .split(" ")
        .filter(Boolean)
        .map(part => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
);

const identityLabel = computed(() => {
    if (!user.value?.identityType && !user.value?.identityNumber) return t("tenant.patientProfile.notRegistered");
    return `${user.value.identityType} ${user.value.identityNumber}`.trim();
});

const genderIcon = computed(() => {
    if (user.value?.gender === "M") return "genderMale";
    if (user.value?.gender === "F") return "genderFemale";
    return "genderOther";
});

const displayFields = computed(() => [
    {label: t("tenant.patientProfile.fullName"), value: fullName.value, icon: "person"},
    {label: t("tenant.patientProfile.role"), value: t(`tenant.patientProfile.roles.${user.value?.role ?? "patient"}`), icon: "badge"},
    {label: t("tenant.patientProfile.identityDocument"), value: identityLabel.value, icon: "idCard"},
    {label: t("tenant.patientProfile.gender"), value: user.value?.gender ? t(`genders.${user.value.gender}`) : t("tenant.patientProfile.notRegistered"), icon: genderIcon.value},
    {label: t("tenant.patientProfile.dateOfBirth"), value: formatDate(user.value?.dateBirth), icon: "cake"},
    {label: t("tenant.patientProfile.address"), value: user.value?.address ?? t("tenant.patientProfile.notRegistered"), icon: "pin"}
]);

const fieldIconPaths = {
    person: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M4.5 20c0-4 3.4-6 7.5-6s7.5 2 7.5 6"],
    badge: ["M4 5h16v14H4Z", "M9 9h6", "M9 13h6", "M9 17h3"],
    idCard: ["M3 5h18v14H3Z", "M3 10h18", "M7 14h4"],
    genderFemale: ["M12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z", "M12 17v4", "M9.5 20h5"],
    genderMale: ["M10 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M13 8l6-6", "M14 2h5v5"],
    genderOther: ["M12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z", "M9.5 20h5"],
    cake: ["M4 21v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7", "M4 21h16", "M8 12V8", "M12 12V8", "M16 12V8", "M8 8c0-1 1-1 1-2s-1-1-1-2", "M16 8c0-1 1-1 1-2s-1-1-1-2"],
    pin: ["M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z", "M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"],
    phone: ["M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"],
    mail: ["M3 5h18v14H3Z", "m4 7 8 6 8-6"]
};

function iconPaths(icon) {
    return fieldIconPaths[icon] ?? [];
}

watch(user, (currentUser) => {
    emailDraft.value = currentUser?.email ?? "";
    phoneDraft.value = currentUser?.phone ?? "";
}, {immediate: true});

watch(patient, (currentPatient) => {
    emergencyContactNameDraft.value = currentPatient?.emergencyContactName ?? "";
    emergencyContactPhoneDraft.value = currentPatient?.emergencyContactPhone ?? "";
    insuranceProviderDraft.value = currentPatient?.insuranceProvider ?? "";
    policyNumberDraft.value = currentPatient?.policyNumber ?? "";
    activeThruDraft.value = currentPatient?.activeThru ?? "";
}, {immediate: true});

const minActiveThru = computed(() => {
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
});

const hasPolicy = computed(() => Boolean(patient.value?.insuranceProvider && patient.value?.policyNumber));

const isPolicyExpired = computed(() => {
    if (!patient.value?.activeThru) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(`${patient.value.activeThru}T00:00:00`) < today;
});

const policyStatusLabel = computed(() => {
    if (!hasPolicy.value) return t("tenant.patientProfile.notRegistered");
    return isPolicyExpired.value ? t("tenant.patientProfile.expired") : t("tenant.patientProfile.active");
});

const showPolicyForm = computed(() => editingPolicy.value || !hasPolicy.value || isPolicyExpired.value);

function formatDate(value) {
    if (!value) return t("tenant.patientProfile.notRegistered");
    return new Date(`${value}T00:00:00`).toLocaleDateString(locale.value === "es" ? "es-PE" : "en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric"
    });
}

async function updateEmail() {
    if (!user.value || emailDraft.value === user.value.email) return;
    await tenantStore.updateUser({...user.value, email: emailDraft.value});
    window.alert(t("tenant.patientProfile.updateSuccess"));
}

async function updatePhone() {
    if (!user.value || phoneDraft.value === user.value.phone) return;
    await tenantStore.updateUser({...user.value, phone: phoneDraft.value});
    window.alert(t("tenant.patientProfile.updateSuccess"));
}

async function updateEmergencyContactName() {
    if (!patient.value || emergencyContactNameDraft.value === patient.value.emergencyContactName) return;
    await clinicalStore.updatePatient({
        ...patient.value,
        emergencyContactName: emergencyContactNameDraft.value
    });
    window.alert(t("tenant.patientProfile.updateSuccess"));
}

async function updateEmergencyContactPhone() {
    if (!patient.value || emergencyContactPhoneDraft.value === patient.value.emergencyContactPhone) return;
    await clinicalStore.updatePatient({
        ...patient.value,
        emergencyContactPhone: emergencyContactPhoneDraft.value
    });
    window.alert(t("tenant.patientProfile.updateSuccess"));
}

function startEditPolicy() {
    editingPolicy.value = true;
}

function cancelEditPolicy() {
    if (!patient.value) return;
    insuranceProviderDraft.value = patient.value.insuranceProvider ?? "";
    policyNumberDraft.value = patient.value.policyNumber ?? "";
    activeThruDraft.value = patient.value.activeThru ?? "";
    editingPolicy.value = false;
}

async function savePolicy() {
    if (!patient.value) return;
    if (!activeThruDraft.value || activeThruDraft.value < minActiveThru.value) {
        window.alert(t("tenant.patientProfile.activeThruTooSoon"));
        return;
    }
    await clinicalStore.updatePatient({
        ...patient.value,
        insuranceProvider: insuranceProviderDraft.value,
        policyNumber: policyNumberDraft.value,
        activeThru: activeThruDraft.value || null
    });
    editingPolicy.value = false;
    window.alert(t("tenant.patientProfile.updateSuccess"));
}

async function removePolicy() {
    if (!patient.value) return;
    if (!window.confirm(t("tenant.patientProfile.confirmRemovePolicy"))) return;
    await clinicalStore.updatePatient({
        ...patient.value,
        insuranceProvider: "",
        policyNumber: "",
        activeThru: null
    });
    window.alert(t("tenant.patientProfile.updateSuccess"));
}

function openRequestChangeModal() {
    requestChangeOpen.value = true;
}

function closeRequestChangeModal() {
    requestChangeOpen.value = false;
}
</script>

<template>
  <section class="doctor-profile-view patient-profile-view">
    <header class="doctor-profile-heading">
      <div>
        <h1>{{ t("tenant.patientProfile.title") }}</h1>
        <p>{{ t("tenant.patientProfile.subtitle") }}</p>
      </div>
    </header>

    <div class="patient-profile-stack">
      <article class="profile-main-card panel">
        <div class="profile-identity">
          <div class="profile-avatar" aria-hidden="true">{{ initials }}</div>
          <button class="profile-request-button profile-request-button-outline" type="button" @click="openRequestChangeModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            {{ t("tenant.patientProfile.requestChange") }}
          </button>
        </div>

        <div class="profile-information">
          <div class="profile-info-grid patient-info-grid">
            <section v-for="field in displayFields" :key="field.label" class="profile-readonly-field">
              <span
                class="profile-field-icon"
                :class="{
                  'profile-field-icon-pink': field.icon === 'genderFemale',
                  'profile-field-icon-blue': field.icon === 'genderMale',
                  'profile-field-icon-gray': field.icon === 'genderOther'
                }"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path v-for="d in iconPaths(field.icon)" :key="d" :d="d" />
                </svg>
              </span>
              <div>
                <small>{{ field.label }}</small>
                <strong>{{ field.value }}</strong>
              </div>
            </section>
          </div>

          <section class="profile-edit-field">
            <label for="patient-phone">
              <span class="profile-field-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path v-for="d in iconPaths('phone')" :key="d" :d="d" />
                </svg>
              </span>
              {{ t("tenant.patientProfile.contactNumber") }}
            </label>
            <div>
              <input id="patient-phone" v-model="phoneDraft" type="tel" autocomplete="tel" />
              <button type="button" class="profile-edit-save" @click="updatePhone">{{ t("tenant.patientProfile.update") }}</button>
            </div>
          </section>

          <section class="profile-edit-field">
            <label for="patient-email">
              <span class="profile-field-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path v-for="d in iconPaths('mail')" :key="d" :d="d" />
                </svg>
              </span>
              {{ t("tenant.patientProfile.contactEmail") }}
            </label>
            <div>
              <input id="patient-email" v-model="emailDraft" type="email" autocomplete="email" />
              <button type="button" class="profile-edit-save" @click="updateEmail">{{ t("tenant.patientProfile.update") }}</button>
            </div>
          </section>

          <section class="profile-edit-field">
            <label for="patient-emergency-name">
              <span class="profile-field-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path v-for="d in iconPaths('person')" :key="d" :d="d" />
                </svg>
              </span>
              {{ t("tenant.patientProfile.emergencyContactName") }}
            </label>
            <div>
              <input id="patient-emergency-name" v-model="emergencyContactNameDraft" type="text" autocomplete="name" />
              <button type="button" class="profile-edit-save" @click="updateEmergencyContactName">{{ t("tenant.patientProfile.update") }}</button>
            </div>
          </section>

          <section class="profile-edit-field">
            <label for="patient-emergency-phone">
              <span class="profile-field-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path v-for="d in iconPaths('phone')" :key="d" :d="d" />
                </svg>
              </span>
              {{ t("tenant.patientProfile.emergencyContactPhone") }}
            </label>
            <div>
              <input id="patient-emergency-phone" v-model="emergencyContactPhoneDraft" type="tel" autocomplete="tel" />
              <button type="button" class="profile-edit-save" @click="updateEmergencyContactPhone">{{ t("tenant.patientProfile.update") }}</button>
            </div>
          </section>
        </div>
      </article>

      <article class="patient-insurance-card panel">
        <div class="profile-card-title">
          <h2>{{ t("tenant.patientProfile.insurancePolicy") }}</h2>
          <span class="insurance-status-badge" :class="{ inactive: !hasPolicy || isPolicyExpired }">{{ policyStatusLabel }}</span>
        </div>

        <p v-if="!hasPolicy" class="insurance-policy-notice">{{ t("tenant.patientProfile.noPolicyNotice") }}</p>
        <p v-else-if="isPolicyExpired" class="insurance-policy-notice">{{ t("tenant.patientProfile.policyExpiredNotice") }}</p>

        <div v-if="!showPolicyForm" class="insurance-policy-card">
          <span class="insurance-policy-watermark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <div>
            <small>{{ t("tenant.patientProfile.provider") }}</small>
            <strong>{{ patient?.insuranceProvider ?? t("tenant.patientProfile.notRegistered") }}</strong>
          </div>
          <div>
            <small>{{ t("tenant.patientProfile.policyNumber") }}</small>
            <strong>{{ patient?.policyNumber ?? t("tenant.patientProfile.notRegistered") }}</strong>
          </div>
          <div>
            <small>{{ t("tenant.patientProfile.activeThru") }}</small>
            <strong>{{ formatDate(patient?.activeThru) }}</strong>
          </div>
        </div>

        <div v-if="!showPolicyForm" class="insurance-policy-card-actions">
          <button type="button" class="profile-request-button" @click="startEditPolicy">
            {{ t("tenant.patientProfile.editPolicy") }}
          </button>
          <button type="button" class="insurance-policy-cancel" @click="removePolicy">
            {{ t("tenant.patientProfile.removePolicy") }}
          </button>
        </div>

        <div v-else class="insurance-policy-form">
          <section class="profile-edit-field">
            <label for="patient-insurance-provider">{{ t("tenant.patientProfile.provider") }}</label>
            <div>
              <input
                id="patient-insurance-provider"
                v-model="insuranceProviderDraft"
                type="text"
                :placeholder="t('tenant.patientProfile.providerPlaceholder')"
              />
            </div>
          </section>

          <section class="profile-edit-field">
            <label for="patient-policy-number">{{ t("tenant.patientProfile.policyNumber") }}</label>
            <div>
              <input
                id="patient-policy-number"
                v-model="policyNumberDraft"
                type="text"
                :placeholder="t('tenant.patientProfile.policyNumberPlaceholder')"
              />
            </div>
          </section>

          <section class="profile-edit-field">
            <label for="patient-active-thru">{{ t("tenant.patientProfile.activeThru") }}</label>
            <div>
              <input id="patient-active-thru" v-model="activeThruDraft" type="date" :min="minActiveThru" />
            </div>
          </section>

          <div class="insurance-policy-form-actions">
            <button type="button" class="profile-request-button" @click="savePolicy">{{ t("tenant.patientProfile.savePolicy") }}</button>
            <button v-if="hasPolicy && !isPolicyExpired" type="button" class="insurance-policy-cancel" @click="cancelEditPolicy">
              {{ t("tenant.patientProfile.cancelEdit") }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <div v-if="requestChangeOpen" class="profile-modal-backdrop" @click.self="closeRequestChangeModal">
      <article class="profile-support-modal panel" role="dialog" aria-modal="true" aria-labelledby="patient-support-modal-title">
        <header>
          <div>
            <small>{{ t("tenant.patientProfile.requestChange") }}</small>
            <h2 id="patient-support-modal-title">{{ t("tenant.patientProfile.supportModalTitle") }}</h2>
          </div>
          <button type="button" :aria-label="t('tenant.patientProfile.close')" @click="closeRequestChangeModal">x</button>
        </header>

        <p>{{ t("tenant.patientProfile.supportModalBody") }}</p>

        <a class="profile-support-email" :href="`mailto:${SUPPORT_EMAIL}`">{{ SUPPORT_EMAIL }}</a>

        <button class="profile-secondary-button" type="button" @click="closeRequestChangeModal">
          {{ t("tenant.patientProfile.close") }}
        </button>
      </article>
    </div>
  </section>
</template>
