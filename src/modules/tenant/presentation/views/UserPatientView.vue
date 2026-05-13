<script setup>
import {computed, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import useTenantStore from "../../application/tenant.store.js";
import useClinicalStore from "../../../clinical/application/clinical.store.js";

const CURRENT_PATIENT_ID = "pat-001";
const SUPPORT_EMAIL = "support@vitalia.pe";

const tenantStore = useTenantStore();
const clinicalStore = useClinicalStore();
const {t, locale} = useI18n();

const emailDraft = ref("");
const phoneDraft = ref("");
const emergencyContactNameDraft = ref("");
const emergencyContactPhoneDraft = ref("");
const requestChangeOpen = ref(false);

onMounted(() => {
    if (!tenantStore.usersLoaded) tenantStore.fetchUsers();
    if (!tenantStore.healthcareCentersLoaded) tenantStore.fetchHealthcareCenters();
    if (!clinicalStore.patientsLoaded) clinicalStore.fetchPatients();
});

const patient = computed(() => clinicalStore.getPatientById(CURRENT_PATIENT_ID) ?? clinicalStore.patients[0]);
const user = computed(() => {
    if (!patient.value?.id_user) return tenantStore.users.find(item => item.role === "patient");
    return tenantStore.users.find(item => item.id === patient.value.id_user);
});

const fullName = computed(() => {
    if (!user.value) return t("tenant.patientProfile.patientFallback");
    return [
        user.value.name,
        user.value.paternal_surname,
        user.value.maternal_surname
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
    if (!user.value?.identity_type && !user.value?.identity_number) return t("tenant.patientProfile.notRegistered");
    return `${user.value.identity_type} ${user.value.identity_number}`.trim();
});

const statusLabel = computed(() => user.value?.is_active
    ? t("tenant.patientProfile.active")
    : t("tenant.patientProfile.inactive")
);
const healthcareCenter = computed(() =>
    tenantStore.healthcareCenters.find(center => center.id === user.value?.id_healthcare_center)
);

const displayFields = computed(() => [
    {label: t("tenant.patientProfile.fullName"), value: fullName.value},
    {label: t("tenant.patientProfile.role"), value: t(`tenant.patientProfile.roles.${user.value?.role ?? "patient"}`)},
    {label: t("tenant.patientProfile.identityDocument"), value: identityLabel.value},
    {label: t("tenant.patientProfile.gender"), value: user.value?.gender ?? t("tenant.patientProfile.notRegistered")},
    {label: t("tenant.patientProfile.dateOfBirth"), value: formatDate(user.value?.date_birth)},
    {label: t("tenant.patientProfile.address"), value: user.value?.address ?? t("tenant.patientProfile.notRegistered")},
    {
        label: t("tenant.patientProfile.healthcareCenter"),
        value: healthcareCenter.value?.healthcare_center_name
            ?? user.value?.id_healthcare_center
            ?? t("tenant.patientProfile.notRegistered")
    },
    {label: t("tenant.patientProfile.accountStatus"), value: statusLabel.value}
]);

watch(user, (currentUser) => {
    emailDraft.value = currentUser?.email ?? "";
    phoneDraft.value = currentUser?.phone ?? "";
}, {immediate: true});

watch(patient, (currentPatient) => {
    emergencyContactNameDraft.value = currentPatient?.emergency_contact_name ?? "";
    emergencyContactPhoneDraft.value = currentPatient?.emergency_contact_phone ?? "";
}, {immediate: true});

function formatDate(value) {
    if (!value) return t("tenant.patientProfile.notRegistered");
    return new Date(`${value}T00:00:00`).toLocaleDateString(locale.value === "es" ? "es-PE" : "en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric"
    });
}

function updateEmail() {
    if (!user.value || emailDraft.value === user.value.email) return;
    tenantStore.updateUser({...user.value, email: emailDraft.value});
}

function updatePhone() {
    if (!user.value || phoneDraft.value === user.value.phone) return;
    tenantStore.updateUser({...user.value, phone: phoneDraft.value});
}

function updateEmergencyContactName() {
    if (!patient.value || emergencyContactNameDraft.value === patient.value.emergency_contact_name) return;
    clinicalStore.updatePatient({
        ...patient.value,
        emergency_contact_name: emergencyContactNameDraft.value
    });
}

function updateEmergencyContactPhone() {
    if (!patient.value || emergencyContactPhoneDraft.value === patient.value.emergency_contact_phone) return;
    clinicalStore.updatePatient({
        ...patient.value,
        emergency_contact_phone: emergencyContactPhoneDraft.value
    });
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
      <span class="profile-status-pill">{{ statusLabel }}</span>
    </header>

    <div class="patient-profile-stack">
      <article class="profile-main-card panel">
        <div class="profile-identity">
          <div class="profile-avatar" aria-hidden="true">{{ initials }}</div>
          <button class="profile-request-button" type="button" @click="openRequestChangeModal">
            {{ t("tenant.patientProfile.requestChange") }}
          </button>
        </div>

        <div class="profile-information">
          <div class="profile-info-grid patient-info-grid">
            <section v-for="field in displayFields" :key="field.label" class="profile-readonly-field">
              <small>{{ field.label }}</small>
              <strong>{{ field.value }}</strong>
            </section>
          </div>

          <section class="profile-edit-field">
            <label for="patient-phone">{{ t("tenant.patientProfile.contactNumber") }}</label>
            <div>
              <input id="patient-phone" v-model="phoneDraft" type="tel" autocomplete="tel" />
              <button type="button" @click="updatePhone">{{ t("tenant.patientProfile.update") }}</button>
            </div>
          </section>

          <section class="profile-edit-field">
            <label for="patient-email">{{ t("tenant.patientProfile.contactEmail") }}</label>
            <div>
              <input id="patient-email" v-model="emailDraft" type="email" autocomplete="email" />
              <button type="button" @click="updateEmail">{{ t("tenant.patientProfile.update") }}</button>
            </div>
          </section>

          <section class="profile-edit-field">
            <label for="patient-emergency-name">{{ t("tenant.patientProfile.emergencyContactName") }}</label>
            <div>
              <input id="patient-emergency-name" v-model="emergencyContactNameDraft" type="text" autocomplete="name" />
              <button type="button" @click="updateEmergencyContactName">{{ t("tenant.patientProfile.update") }}</button>
            </div>
          </section>

          <section class="profile-edit-field">
            <label for="patient-emergency-phone">{{ t("tenant.patientProfile.emergencyContactPhone") }}</label>
            <div>
              <input id="patient-emergency-phone" v-model="emergencyContactPhoneDraft" type="tel" autocomplete="tel" />
              <button type="button" @click="updateEmergencyContactPhone">{{ t("tenant.patientProfile.update") }}</button>
            </div>
          </section>
        </div>
      </article>

      <article class="patient-insurance-card panel">
        <div class="profile-card-title">
          <h2>{{ t("tenant.patientProfile.insurancePolicy") }}</h2>
          <span>{{ t("tenant.patientProfile.active") }}</span>
        </div>

        <div class="insurance-policy-card">
          <div>
            <small>{{ t("tenant.patientProfile.provider") }}</small>
            <strong>{{ patient?.insurance_provider ?? t("tenant.patientProfile.notRegistered") }}</strong>
          </div>
          <div>
            <small>{{ t("tenant.patientProfile.policyNumber") }}</small>
            <strong>{{ patient?.policy_number ?? t("tenant.patientProfile.notRegistered") }}</strong>
          </div>
          <div>
            <small>{{ t("tenant.patientProfile.activeThru") }}</small>
            <strong>{{ formatDate(patient?.active_thru) }}</strong>
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
