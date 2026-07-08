<script setup>
import {computed, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import useTenantStore from "../../application/tenant.store.js";
import useClinicalStore from "../../../clinical/application/clinical.store.js";
import { useAuthStore } from "../../../../shared/application/auth-store.js";

const authStore = useAuthStore();
const CURRENT_DOCTOR_ID = computed(() => authStore.currentDoctorId);
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

const doctor = computed(() => clinicalStore.getDoctorById(CURRENT_DOCTOR_ID.value));
const user = computed(() => {
    if (authStore.currentUser?.role === "doctor") return authStore.currentUser;
    if (!doctor.value?.userId) return null;
    return tenantStore.users.find(item => String(item.id) === String(doctor.value.userId));
});

const fullName = computed(() => {
    if (!user.value) return "Doctor";
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
    if (!user.value?.identityType && !user.value?.identityNumber) return t("tenant.doctorProfile.notRegistered");
    return `${user.value.identityType} ${user.value.identityNumber}`.trim();
});

const statusLabel = computed(() => user.value?.isActive
    ? t("tenant.doctorProfile.active")
    : t("tenant.doctorProfile.inactive")
);
const healthcareCenter = computed(() =>
    tenantStore.healthcareCenters.find(center => center.id === user.value?.healthcareCenterId)
);

const genderIcon = computed(() => {
    if (user.value?.gender === "M") return "genderMale";
    if (user.value?.gender === "F") return "genderFemale";
    return "genderOther";
});

const displayFields = computed(() => [
    {label: t("tenant.doctorProfile.fullName"), value: fullName.value, icon: "person"},
    {label: t("tenant.doctorProfile.role"), value: t(`tenant.doctorProfile.roles.${user.value?.role ?? "doctor"}`), icon: "badge"},
    {label: t("tenant.doctorProfile.identityDocument"), value: identityLabel.value, icon: "idCard"},
    {label: t("tenant.doctorProfile.gender"), value: user.value?.gender ? t(`genders.${user.value.gender}`) : t("tenant.doctorProfile.notRegistered"), icon: genderIcon.value},
    {label: t("tenant.doctorProfile.dateOfBirth"), value: formatDate(user.value?.dateBirth), icon: "cake"},
    {label: t("tenant.doctorProfile.address"), value: user.value?.address ?? t("tenant.doctorProfile.notRegistered"), icon: "pin"},
    {
        label: t("tenant.doctorProfile.healthcareCenter"),
        value: healthcareCenter.value?.healthcareCenterName
            ?? user.value?.healthcareCenterId
            ?? t("tenant.doctorProfile.notRegistered"),
        icon: "building"
    },
    {label: t("tenant.doctorProfile.accountStatus"), value: statusLabel.value, icon: "shield"}
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
    mail: ["M3 5h18v14H3Z", "m4 7 8 6 8-6"],
    building: ["M4 21V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v15", "M14 21v-9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v9", "M4 21h16", "M7.5 9h1M7.5 12h1M7.5 15h1M11.5 9h1M11.5 12h1M11.5 15h1"],
    shield: ["M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6Z", "m9 12 2 2 4-4"]
};

function iconPaths(icon) {
    return fieldIconPaths[icon] ?? [];
}

const credentialFields = computed(() => [
    {label: t("tenant.doctorProfile.license"), value: doctor.value?.licNumber ?? t("tenant.doctorProfile.notRegistered")},
    {label: t("tenant.doctorProfile.cmpn"), value: doctor.value?.cmpNumber ?? t("tenant.doctorProfile.notRegistered")}
]);

const digitalVaultDocuments = computed(() => [
    {
        title: t("tenant.doctorProfile.vaultMedicalLicense"),
        code: doctor.value?.licNumber ?? t("tenant.doctorProfile.notRegistered"),
        status: t("tenant.doctorProfile.verified"),
        issuedBy: t("tenant.doctorProfile.vaultIssuedByClinic")
    },
    {
        title: t("tenant.doctorProfile.vaultCmpnCertificate"),
        code: doctor.value?.cmpNumber ?? t("tenant.doctorProfile.notRegistered"),
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

async function updateEmail() {
    if (!user.value || emailDraft.value === user.value.email) return;
    await tenantStore.updateUser({...user.value, email: emailDraft.value});
    window.alert(t("tenant.doctorProfile.updateSuccess"));
}

async function updatePhone() {
    if (!user.value || phoneDraft.value === user.value.phone) return;
    await tenantStore.updateUser({...user.value, phone: phoneDraft.value});
    window.alert(t("tenant.doctorProfile.updateSuccess"));
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
    </header>

    <div class="doctor-profile-grid">
      <article class="profile-main-card panel">
        <div class="profile-identity">
          <div class="profile-avatar" aria-hidden="true">{{ initials }}</div>
          <button class="profile-request-button profile-request-button-outline" type="button" @click="openRequestChangeModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            {{ t("tenant.doctorProfile.requestChange") }}
          </button>
        </div>

        <div class="profile-information">
          <div class="profile-info-grid">
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
            <label for="doctor-phone">
              <span class="profile-field-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path v-for="d in iconPaths('phone')" :key="d" :d="d" />
                </svg>
              </span>
              {{ t("tenant.doctorProfile.contactNumber") }}
            </label>
            <div>
              <input id="doctor-phone" v-model="phoneDraft" type="tel" autocomplete="tel" />
              <button type="button" class="profile-edit-save" @click="updatePhone">{{ t("tenant.doctorProfile.update") }}</button>
            </div>
          </section>

          <section class="profile-edit-field">
            <label for="doctor-email">
              <span class="profile-field-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path v-for="d in iconPaths('mail')" :key="d" :d="d" />
                </svg>
              </span>
              {{ t("tenant.doctorProfile.contactEmail") }}
            </label>
            <div>
              <input id="doctor-email" v-model="emailDraft" type="email" autocomplete="email" />
              <button type="button" class="profile-edit-save" @click="updateEmail">{{ t("tenant.doctorProfile.update") }}</button>
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
