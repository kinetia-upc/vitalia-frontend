<script setup>
import {computed, onMounted, reactive, watch} from "vue";
import {useI18n} from "vue-i18n";
import useTenantStore from "../../application/tenant.store.js";

const tenantStore = useTenantStore();
const {t} = useI18n();

const form = reactive({
    healthcareCenterId: "",
    name: "",
    paternalSurname: "",
    maternalSurname: "",
    identityType: "",
    identityNumber: "",
    dateBirth: "",
    email: "",
    phone: "",
    gender: "",
    isActive: true,
    address: "",
    role: "admin"
});

onMounted(() => {
    if (!tenantStore.usersLoaded) tenantStore.fetchUsers();
    if (!tenantStore.healthcareCentersLoaded) tenantStore.fetchHealthcareCenters();
});

const adminUser = computed(() => tenantStore.users.find(user => user.role === "admin"));

const fullName = computed(() => {
    if (!adminUser.value) return t("tenant.adminProfile.adminFallback");
    return [
        adminUser.value.name,
        adminUser.value.paternalSurname,
        adminUser.value.maternalSurname
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

const healthcareCenterOptions = computed(() => tenantStore.healthcareCenters);

watch(adminUser, (currentUser) => {
    if (!currentUser) return;

    form.healthcareCenterId = currentUser.healthcareCenterId ?? "";
    form.name = currentUser.name ?? "";
    form.paternalSurname = currentUser.paternalSurname ?? "";
    form.maternalSurname = currentUser.maternalSurname ?? "";
    form.identityType = currentUser.identityType ?? "";
    form.identityNumber = currentUser.identityNumber ?? "";
    form.dateBirth = currentUser.dateBirth ?? "";
    form.email = currentUser.email ?? "";
    form.phone = currentUser.phone ?? "";
    form.gender = currentUser.gender ?? "";
    form.address = currentUser.address ?? "";
}, {immediate: true});

const editableFields = computed(() => [
    {key: "name", label: t("tenant.adminProfile.name"), type: "text", autocomplete: "given-name"},
    {key: "paternalSurname", label: t("tenant.adminProfile.paternalSurname"), type: "text", autocomplete: "family-name"},
    {key: "maternalSurname", label: t("tenant.adminProfile.maternalSurname"), type: "text", autocomplete: "family-name"},
    {key: "identityType", label: t("tenant.adminProfile.identityType"), type: "text", autocomplete: "off"},
    {key: "identityNumber", label: t("tenant.adminProfile.identityNumber"), type: "text", autocomplete: "off"},
    {key: "dateBirth", label: t("tenant.adminProfile.dateOfBirth"), type: "date", autocomplete: "bday"},
    {key: "email", label: t("tenant.adminProfile.email"), type: "email", autocomplete: "email"},
    {key: "phone", label: t("tenant.adminProfile.phone"), type: "tel", autocomplete: "tel"},
    {key: "gender", label: t("tenant.adminProfile.gender"), type: "text", autocomplete: "off"},
    {key: "address", label: t("tenant.adminProfile.address"), type: "text", autocomplete: "street-address"}
]);

function saveAdminUser() {
    if (!adminUser.value) return;

    tenantStore.updateUser({
        ...adminUser.value,
        ...form,
        isActive: adminUser.value.isActive,
        role: adminUser.value.role
    });
}
</script>

<template>
  <section class="doctor-profile-view admin-profile-view">
    <header class="doctor-profile-heading">
      <div>
        <h1>{{ t("tenant.adminProfile.title") }}</h1>
        <p>{{ t("tenant.adminProfile.subtitle") }}</p>
      </div>
    </header>

    <article class="profile-main-card admin-profile-card panel">
      <div class="profile-identity">
        <div class="profile-avatar" aria-hidden="true">{{ initials }}</div>
        <strong class="admin-profile-name">{{ fullName }}</strong>
      </div>

      <form class="admin-profile-form" @submit.prevent="saveAdminUser">
        <div class="admin-profile-form-grid">
          <label class="admin-edit-field" for="admin-healthcare-center">
            <span>{{ t("tenant.adminProfile.healthcareCenter") }}</span>
            <select id="admin-healthcare-center" v-model="form.healthcareCenterId">
              <option value="">{{ t("tenant.adminProfile.notRegistered") }}</option>
              <option
                v-for="center in healthcareCenterOptions"
                :key="center.id"
                :value="center.id"
              >
                {{ center.healthcareCenterName }}
              </option>
            </select>
          </label>

          <label
            v-for="field in editableFields"
            :key="field.key"
            class="admin-edit-field"
            :for="`admin-${field.key}`"
          >
            <span>{{ field.label }}</span>
            <select
              v-if="field.key === 'gender'"
              :id="`admin-${field.key}`"
              v-model="form[field.key]"
            >
              <option value="">{{ t("tenant.adminProfile.notRegistered") }}</option>
              <option value="M">{{ t("genders.M") }}</option>
              <option value="F">{{ t("genders.F") }}</option>
              <option value="O">{{ t("genders.O") }}</option>
            </select>
            <input
              v-else
              :id="`admin-${field.key}`"
              v-model="form[field.key]"
              :type="field.type"
              :autocomplete="field.autocomplete"
            />
          </label>
        </div>

        <button class="profile-primary-button" type="submit">
          {{ t("tenant.adminProfile.saveChanges") }}
        </button>
      </form>
    </article>
  </section>
</template>
