<script setup>
import {computed, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import useTenantStore from "../../application/tenant.store.js";
import useClinicalStore from "../../../clinical/application/clinical.store.js";

const CURRENT_DOCTOR_ID = "doc-001";
const SUPPORT_EMAIL = "support@vitalia.pe";

const tenantStore = useTenantStore();
const clinicalStore = useClinicalStore();
const {t, locale} = useI18n();

const emailDraft = ref("");
const phoneDraft = ref("");
const requestChangeOpen = ref(false);
const digitalVaultOpen = ref(false);

onMounted(() => {
    if (!tenantStore.usersLoaded) tenantStore.fetchUsers();
    if (!tenantStore.healthcareCentersLoaded) tenantStore.fetchHealthcareCenters();
    if (!clinicalStore.doctorsLoaded) clinicalStore.fetchDoctors();
});

const doctor = computed(() => clinicalStore.getDoctorById(CURRENT_DOCTOR_ID) ?? clinicalStore.doctors[0]);
const user = computed(() => {
    if (!doctor.value?.id_user) return tenantStore.users.find(item => item.role === "doctor");
    return tenantStore.users.find(item => item.id === doctor.value.id_user);
});

const fullName = computed(() => {
    if (!user.value) return "Doctor";
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
    if (!user.value?.identity_type && !user.value?.identity_number) return t("tenant.doctorProfile.notRegistered");
    return `${user.value.identity_type} ${user.value.identity_number}`.trim();
});

const statusLabel = computed(() => user.value?.is_active
    ? t("tenant.doctorProfile.active")
    : t("tenant.doctorProfile.inactive")
);
const healthcareCenter = computed(() =>
    tenantStore.healthcareCenters.find(center => center.id === user.value?.id_healthcare_center)
);

const displayFields = computed(() => [
    {label: t("tenant.doctorProfile.fullName"), value: fullName.value},
    {label: t("tenant.doctorProfile.role"), value: t(`tenant.doctorProfile.roles.${user.value?.role ?? "doctor"}`)},
    {label: t("tenant.doctorProfile.identityDocument"), value: identityLabel.value},
    {label: t("tenant.doctorProfile.gender"), value: user.value?.gender ?? t("tenant.doctorProfile.notRegistered")},
    {label: t("tenant.doctorProfile.dateOfBirth"), value: formatDate(user.value?.date_birth)},
    {label: t("tenant.doctorProfile.address"), value: user.value?.address ?? t("tenant.doctorProfile.notRegistered")},
    {
        label: t("tenant.doctorProfile.healthcareCenter"),
        value: healthcareCenter.value?.healthcare_center_name
            ?? user.value?.id_healthcare_center
            ?? t("tenant.doctorProfile.notRegistered")
    },
    {label: t("tenant.doctorProfile.accountStatus"), value: statusLabel.value}
]);

const credentialFields = computed(() => [
    {label: t("tenant.doctorProfile.license"), value: doctor.value?.lic_number ?? t("tenant.doctorProfile.notRegistered")},
    {label: t("tenant.doctorProfile.cmpn"), value: doctor.value?.cmp_number ?? t("tenant.doctorProfile.notRegistered")}
]);

const digitalVaultDocuments = computed(() => [
    {
        title: t("tenant.doctorProfile.vaultMedicalLicense"),
        code: doctor.value?.lic_number ?? t("tenant.doctorProfile.notRegistered"),
        status: t("tenant.doctorProfile.verified"),
        issuedBy: t("tenant.doctorProfile.vaultIssuedByClinic")
    },
    {
        title: t("tenant.doctorProfile.vaultCmpnCertificate"),
        code: doctor.value?.cmp_number ?? t("tenant.doctorProfile.notRegistered"),
        status: t("tenant.doctorProfile.verified"),
        issuedBy: t("tenant.doctorProfile.vaultIssuedByMedicalCollege")
    },
    {
        title: t("tenant.doctorProfile.vaultIdentityRecord"),
        code: identityLabel.value,
        status: statusLabel.value,
        issuedBy: t("tenant.doctorProfile.vaultIssuedByTenant")
    }
]);

watch(user, (currentUser) => {
    emailDraft.value = currentUser?.email ?? "";
    phoneDraft.value = currentUser?.phone ?? "";
}, {immediate: true});

function formatDate(value) {
    if (!value) return t("tenant.doctorProfile.notRegistered");
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

function openRequestChangeModal() {
    requestChangeOpen.value = true;
}

function closeRequestChangeModal() {
    requestChangeOpen.value = false;
}

function openDigitalVaultModal() {
    digitalVaultOpen.value = true;
}

function closeDigitalVaultModal() {
    digitalVaultOpen.value = false;
}
</script>

<template>
  <section class="doctor-profile-view">
    <header class="doctor-profile-heading">
      <div>
        <h1>{{ t("tenant.doctorProfile.title") }}</h1>
        <p>{{ t("tenant.doctorProfile.subtitle") }}</p>
      </div>
      <span class="profile-status-pill">{{ statusLabel }}</span>
    </header>

    <div class="doctor-profile-grid">
      <article class="profile-main-card panel">
        <div class="profile-identity">
          <div class="profile-avatar" aria-hidden="true">{{ initials }}</div>
          <button class="profile-request-button" type="button" @click="openRequestChangeModal">
            {{ t("tenant.doctorProfile.requestChange") }}
          </button>
        </div>

        <div class="profile-information">
          <div class="profile-info-grid">
            <section v-for="field in displayFields" :key="field.label" class="profile-readonly-field">
              <small>{{ field.label }}</small>
              <strong>{{ field.value }}</strong>
            </section>
          </div>

          <section class="profile-edit-field">
            <label for="doctor-phone">{{ t("tenant.doctorProfile.contactNumber") }}</label>
            <div>
              <input id="doctor-phone" v-model="phoneDraft" type="tel" autocomplete="tel" />
              <button type="button" @click="updatePhone">{{ t("tenant.doctorProfile.update") }}</button>
            </div>
          </section>

          <section class="profile-edit-field">
            <label for="doctor-email">{{ t("tenant.doctorProfile.contactEmail") }}</label>
            <div>
              <input id="doctor-email" v-model="emailDraft" type="email" autocomplete="email" />
              <button type="button" @click="updateEmail">{{ t("tenant.doctorProfile.update") }}</button>
            </div>
          </section>
        </div>
      </article>

      <article class="profile-credential-card panel">
        <div class="profile-card-title">
          <h2>{{ t("tenant.doctorProfile.credentialStatus") }}</h2>
          <span>{{ t("tenant.doctorProfile.verified") }}</span>
        </div>

        <div class="credential-list">
          <section v-for="field in credentialFields" :key="field.label" class="credential-item">
            <span aria-hidden="true">OK</span>
            <div>
              <small>{{ field.label }}</small>
              <strong>{{ field.value }}</strong>
            </div>
          </section>
        </div>

        <button class="profile-secondary-button" type="button" @click="openDigitalVaultModal">
          {{ t("tenant.doctorProfile.viewDigitalVault") }}
        </button>
      </article>
    </div>

    <div v-if="requestChangeOpen" class="profile-modal-backdrop" @click.self="closeRequestChangeModal">
      <article class="profile-support-modal panel" role="dialog" aria-modal="true" aria-labelledby="support-modal-title">
        <header>
          <div>
            <small>{{ t("tenant.doctorProfile.requestChange") }}</small>
            <h2 id="support-modal-title">{{ t("tenant.doctorProfile.supportModalTitle") }}</h2>
          </div>
          <button type="button" :aria-label="t('tenant.doctorProfile.close')" @click="closeRequestChangeModal">x</button>
        </header>

        <p>{{ t("tenant.doctorProfile.supportModalBody") }}</p>

        <a class="profile-support-email" :href="`mailto:${SUPPORT_EMAIL}`">{{ SUPPORT_EMAIL }}</a>

        <button class="profile-secondary-button" type="button" @click="closeRequestChangeModal">
          {{ t("tenant.doctorProfile.close") }}
        </button>
      </article>
    </div>

    <div v-if="digitalVaultOpen" class="profile-modal-backdrop" @click.self="closeDigitalVaultModal">
      <article class="profile-support-modal profile-vault-modal panel" role="dialog" aria-modal="true" aria-labelledby="vault-modal-title">
        <header>
          <div>
            <small>{{ t("tenant.doctorProfile.viewDigitalVault") }}</small>
            <h2 id="vault-modal-title">{{ t("tenant.doctorProfile.vaultTitle") }}</h2>
          </div>
          <button type="button" :aria-label="t('tenant.doctorProfile.close')" @click="closeDigitalVaultModal">x</button>
        </header>

        <p>{{ t("tenant.doctorProfile.vaultBody") }}</p>

        <div class="profile-vault-list">
          <section v-for="document in digitalVaultDocuments" :key="document.title" class="profile-vault-item">
            <span aria-hidden="true">DOC</span>
            <div>
              <small>{{ document.issuedBy }}</small>
              <strong>{{ document.title }}</strong>
              <p>{{ document.code }}</p>
            </div>
            <em>{{ document.status }}</em>
          </section>
        </div>

        <button class="profile-secondary-button" type="button" @click="closeDigitalVaultModal">
          {{ t("tenant.doctorProfile.close") }}
        </button>
      </article>
    </div>
  </section>
</template>
