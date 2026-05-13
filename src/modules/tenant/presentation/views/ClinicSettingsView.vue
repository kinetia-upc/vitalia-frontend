<script setup>
import {computed, onMounted, reactive, ref} from "vue";
import {useI18n} from "vue-i18n";
import useTenantStore from "../../application/tenant.store.js";
import useClinicalStore from "../../../clinical/application/clinical.store.js";
import usePharmacyStore from "../../../pharmacy/application/pharmacy.store.js";

const tenantStore = useTenantStore();
const clinicalStore = useClinicalStore();
const pharmacyStore = usePharmacyStore();
const {t} = useI18n();

const activeTab = ref("branches");
const searchQuery = ref("");
const modalOpen = ref(false);
const modalMode = ref("add");
const modalType = ref("branches");
const deleteConfirmOpen = ref(false);
const pendingDelete = ref(null);

const form = reactive({
    branch: emptyBranch(),
    medicine: emptyMedicine(),
    speciality: emptySpeciality()
});

const tabs = computed(() => [
    {id: "branches", label: t("tenant.clinicSettings.tabs.branches")},
    {id: "specialities", label: t("tenant.clinicSettings.tabs.specialities")},
    {id: "pharmacy", label: t("tenant.clinicSettings.tabs.pharmacy")}
]);

onMounted(() => {
    if (!tenantStore.healthcareCentersLoaded) tenantStore.fetchHealthcareCenters();
    if (!tenantStore.branchesLoaded) tenantStore.fetchBranches();
    if (!tenantStore.appointmentFeesLoaded) tenantStore.fetchAppointmentFees();
    if (!clinicalStore.specialitiesLoaded) clinicalStore.fetchSpecialities();
    if (!pharmacyStore.medicinesLoaded) pharmacyStore.fetchMedicines();
});

const modalTitle = computed(() => {
    const action = modalMode.value === "add" ? t("tenant.clinicSettings.add") : t("tenant.clinicSettings.edit");
    return `${action} ${modalLabel(modalType.value)}`;
});
const deleteTargetLabel = computed(() => {
    if (!pendingDelete.value) return t("tenant.clinicSettings.record");
    const {type, resource} = pendingDelete.value;
    if (type === "branches") return resource.branch_name;
    if (type === "pharmacy") return resource.name;
    if (type === "speciality") return resource.description;
    return t("tenant.clinicSettings.record");
});
const branchRows = computed(() => tenantStore.branches.map(branch => ({
    ...branch,
    fees: tenantStore.appointmentFees.filter(fee => fee.id_branch === branch.id)
})));

const visibleBranches = computed(() => filterRows(branchRows.value, branch => [branch.branch_name, branch.address]));
const visibleSpecialities = computed(() => filterRows(clinicalStore.specialities, speciality => [speciality.description, speciality.id]));
const visibleMedicines = computed(() => filterRows(pharmacyStore.medicines, medicine => [medicine.name, medicine.unitType, medicine.price, medicine.stock]));

function emptyBranch() {
    return {id: "", id_healthcare_center: "hc-001", id_address: "", branch_name: "", address: "", fees: {}};
}

function emptyMedicine() {
    return {id: "", name: "", unitQuantity: 0, unitType: "", price: 0, stock: 0};
}

function emptySpeciality() {
    return {id: "", description: ""};
}

function modalLabel(type) {
    return {
        branches: t("tenant.clinicSettings.singular.branch"),
        pharmacy: t("tenant.clinicSettings.singular.medicine"),
        speciality: t("tenant.clinicSettings.singular.speciality")
    }[type] ?? t("tenant.clinicSettings.record");
}

function formKey(type) {
    return {branches: "branch", pharmacy: "medicine", speciality: "speciality"}[type];
}

function normalizedModalType(type) {
    return type === "specialities" ? "speciality" : type;
}

function resetForm(type) {
    const factory = {branches: emptyBranch, pharmacy: emptyMedicine, speciality: emptySpeciality}[type];
    Object.assign(form[formKey(type)], factory());
}

function nextId(prefix) {
    return `${prefix}-${crypto.randomUUID()}`;
}

function filterRows(rows, fieldsGetter) {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(row => fieldsGetter(row).join(" ").toLowerCase().includes(query));
}

function openAdd(type = activeTab.value) {
    modalMode.value = "add";
    modalType.value = normalizedModalType(type);
    resetForm(modalType.value);
    if (modalType.value === "branches") {
        clinicalStore.specialities.forEach(speciality => {
            form.branch.fees[speciality.id] = "";
        });
    }
    modalOpen.value = true;
}

function openEdit(type, resource) {
    modalMode.value = "edit";
    modalType.value = normalizedModalType(type);
    resetForm(modalType.value);
    if (modalType.value === "branches") fillBranchForm(resource);
    if (modalType.value === "pharmacy") Object.assign(form.medicine, resource);
    if (modalType.value === "speciality") Object.assign(form.speciality, resource);
    modalOpen.value = true;
}

function closeModal() {
    modalOpen.value = false;
}

function requestDelete(type, resource) {
    pendingDelete.value = {type, resource};
    deleteConfirmOpen.value = true;
}

function cancelDelete() {
    pendingDelete.value = null;
    deleteConfirmOpen.value = false;
}

function confirmDelete() {
    if (!pendingDelete.value) return;
    removeResource(pendingDelete.value.type, pendingDelete.value.resource);
    cancelDelete();
}

function fillBranchForm(branch) {
    Object.assign(form.branch, {...branch, fees: {}});
    clinicalStore.specialities.forEach(speciality => {
        const fee = tenantStore.appointmentFees.find(item => item.id_branch === branch.id && item.id_speciality === speciality.id);
        form.branch.fees[speciality.id] = fee?.price ?? "";
    });
}

function saveModal() {
    if (modalType.value === "branches") saveBranch();
    if (modalType.value === "pharmacy") saveMedicine();
    if (modalType.value === "speciality") saveSpeciality();
    closeModal();
}

function saveBranch() {
    const branch = {
        id: modalMode.value === "add" ? nextId("branch") : form.branch.id,
        id_healthcare_center: form.branch.id_healthcare_center,
        id_address: form.branch.id_address,
        branch_name: form.branch.branch_name,
        address: form.branch.address
    };
    modalMode.value === "add" ? tenantStore.addBranch(branch) : tenantStore.updateBranch(branch);
    clinicalStore.specialities.forEach(speciality => saveAppointmentFee(branch.id, speciality.id));
}

function saveAppointmentFee(branchId, specialityId) {
    const price = form.branch.fees[specialityId];
    const currentFee = tenantStore.appointmentFees.find(item => item.id_branch === branchId && item.id_speciality === specialityId);
    if (price === "" || price === null || Number.isNaN(Number(price))) {
        if (currentFee) tenantStore.deleteAppointmentFee(currentFee);
        return;
    }
    const fee = {id: currentFee?.id ?? nextId("fee"), id_branch: branchId, id_speciality: specialityId, price: Number(price)};
    currentFee ? tenantStore.updateAppointmentFee(fee) : tenantStore.addAppointmentFee(fee);
}

function saveMedicine() {
    const medicine = {
        ...form.medicine,
        id: modalMode.value === "add" ? nextId("med") : form.medicine.id,
        unitQuantity: Number(form.medicine.unitQuantity),
        price: Number(form.medicine.price),
        stock: Number(form.medicine.stock)
    };
    modalMode.value === "add" ? pharmacyStore.addMedicine(medicine) : pharmacyStore.updateMedicine(medicine);
}

function saveSpeciality() {
    const speciality = {id: modalMode.value === "add" ? nextId("spec") : form.speciality.id, description: form.speciality.description};
    modalMode.value === "add" ? clinicalStore.addSpeciality(speciality) : clinicalStore.updateSpeciality(speciality);
}

function removeResource(type, resource) {
    if (type === "branches") {
        tenantStore.appointmentFees.filter(fee => fee.id_branch === resource.id).forEach(fee => tenantStore.deleteAppointmentFee(fee));
        tenantStore.deleteBranch(resource);
    }
    if (type === "pharmacy") pharmacyStore.deleteMedicine(resource);
    if (type === "speciality") {
        tenantStore.appointmentFees.filter(fee => fee.id_speciality === resource.id).forEach(fee => tenantStore.deleteAppointmentFee(fee));
        clinicalStore.deleteSpeciality(resource);
    }
}
</script>

<template>
  <section class="clinic-settings-view">
    <header class="clinic-settings-title">
      <h1>{{ t("tenant.clinicSettings.title") }}</h1>
      <p>{{ t("tenant.clinicSettings.subtitle") }}</p>
    </header>

    <label class="clinic-settings-search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 4a6.5 6.5 0 0 1 5.2 10.4l4 4-1.4 1.4-4-4A6.5 6.5 0 1 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"/></svg>
      <input v-model="searchQuery" type="search" :placeholder="t('tenant.clinicSettings.search')" />
    </label>

    <header class="clinic-settings-toolbar panel">
      <span>{{ t("tenant.clinicSettings.filterBy") }}</span>
      <div class="clinic-settings-tabs">
        <button v-for="tab in tabs" :key="tab.id" type="button" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
          {{ tab.label }}
        </button>
      </div>
      <button class="clinic-settings-add" type="button" @click="openAdd()">{{ t("tenant.clinicSettings.add") }}</button>
    </header>

    <article v-if="activeTab === 'branches'" class="clinic-settings-panel panel">
      <div class="clinic-settings-table">
        <div class="clinic-settings-row table-head"><span>{{ t("tenant.clinicSettings.branch") }}</span><span>{{ t("tenant.clinicSettings.address") }}</span><span>{{ t("tenant.clinicSettings.appointmentFees") }}</span><span>{{ t("tenant.clinicSettings.actions") }}</span></div>
        <div v-for="branch in visibleBranches" :key="branch.id" class="clinic-settings-row">
          <strong>{{ branch.branch_name }}</strong><span>{{ branch.address }}</span><span>{{ t("tenant.clinicSettings.specialitiesCount", { count: branch.fees.length }) }}</span>
          <div class="clinic-settings-actions"><button type="button" @click="openEdit('branches', branch)">{{ t("tenant.clinicSettings.edit") }}</button><button type="button" class="danger" @click="requestDelete('branches', branch)">{{ t("tenant.clinicSettings.delete") }}</button></div>
        </div>
      </div>
    </article>

    <article v-else-if="activeTab === 'specialities'" class="clinic-settings-panel panel">
      <div class="clinic-settings-table">
        <div class="clinic-settings-row table-head"><span>{{ t("tenant.clinicSettings.speciality") }}</span><span>{{ t("tenant.clinicSettings.identifier") }}</span><span>{{ t("tenant.clinicSettings.assignedFees") }}</span><span>{{ t("tenant.clinicSettings.actions") }}</span></div>
        <div v-for="speciality in visibleSpecialities" :key="speciality.id" class="clinic-settings-row">
          <strong>{{ speciality.description }}</strong><span>{{ speciality.id }}</span><span>{{ t("tenant.clinicSettings.branchesCount", { count: tenantStore.appointmentFees.filter(fee => fee.id_speciality === speciality.id).length }) }}</span>
          <div class="clinic-settings-actions"><button type="button" @click="openEdit('speciality', speciality)">{{ t("tenant.clinicSettings.edit") }}</button><button type="button" class="danger" @click="requestDelete('speciality', speciality)">{{ t("tenant.clinicSettings.delete") }}</button></div>
        </div>
      </div>
    </article>

    <article v-else class="clinic-settings-panel panel">
      <div class="clinic-settings-table">
        <div class="clinic-settings-row five table-head"><span>{{ t("tenant.clinicSettings.medicine") }}</span><span>{{ t("tenant.clinicSettings.unit") }}</span><span>{{ t("tenant.clinicSettings.price") }}</span><span>{{ t("tenant.clinicSettings.stock") }}</span><span>{{ t("tenant.clinicSettings.actions") }}</span></div>
        <div v-for="medicine in visibleMedicines" :key="medicine.id" class="clinic-settings-row five">
          <strong>{{ medicine.name }}</strong><span>{{ medicine.unitQuantity }} {{ medicine.unitType }}</span><span>S/ {{ medicine.price }}</span><span>{{ medicine.stock }}</span>
          <div class="clinic-settings-actions"><button type="button" @click="openEdit('pharmacy', medicine)">{{ t("tenant.clinicSettings.edit") }}</button><button type="button" class="danger" @click="requestDelete('pharmacy', medicine)">{{ t("tenant.clinicSettings.delete") }}</button></div>
        </div>
      </div>
    </article>

    <div v-if="modalOpen" class="profile-modal-backdrop" @click.self="closeModal">
      <article class="clinic-settings-modal panel" role="dialog" aria-modal="true">
        <header><h2>{{ modalTitle }}</h2><button type="button" @click="closeModal">x</button></header>
        <form class="clinic-settings-form" @submit.prevent="saveModal">
          <template v-if="modalType === 'branches'">
            <label><span>{{ t("tenant.clinicSettings.name") }}</span><input v-model="form.branch.branch_name" required /></label>
            <label><span>{{ t("tenant.clinicSettings.addressId") }}</span><input v-model="form.branch.id_address" /></label>
            <label class="wide"><span>{{ t("tenant.clinicSettings.address") }}</span><input v-model="form.branch.address" required /></label>
            <section class="wide fee-editor"><h3>{{ t("tenant.clinicSettings.feesBySpeciality") }}</h3><label v-for="speciality in clinicalStore.specialities" :key="speciality.id"><span>{{ speciality.description }}</span><input v-model="form.branch.fees[speciality.id]" type="number" min="0" step="0.01" placeholder="0.00" /></label></section>
          </template>
          <template v-else-if="modalType === 'pharmacy'">
            <label class="wide"><span>{{ t("tenant.clinicSettings.name") }}</span><input v-model="form.medicine.name" required /></label><label><span>{{ t("tenant.clinicSettings.unitQuantity") }}</span><input v-model="form.medicine.unitQuantity" type="number" min="0" required /></label><label><span>{{ t("tenant.clinicSettings.unitType") }}</span><input v-model="form.medicine.unitType" required /></label><label><span>{{ t("tenant.clinicSettings.price") }}</span><input v-model="form.medicine.price" type="number" min="0" step="0.01" required /></label><label><span>{{ t("tenant.clinicSettings.stock") }}</span><input v-model="form.medicine.stock" type="number" min="0" required /></label>
          </template>
          <template v-else>
            <label class="wide"><span>{{ t("tenant.clinicSettings.description") }}</span><input v-model="form.speciality.description" required /></label>
          </template>
          <button class="profile-primary-button wide" type="submit">{{ t("tenant.clinicSettings.save") }}</button>
        </form>
      </article>
    </div>

    <div v-if="deleteConfirmOpen" class="profile-modal-backdrop" @click.self="cancelDelete">
      <article class="clinic-delete-modal panel" role="dialog" aria-modal="true">
        <h2>{{ t("tenant.clinicSettings.deleteTitle") }}</h2>
        <p>{{ t("tenant.clinicSettings.deleteBodyStart") }} <strong>{{ deleteTargetLabel }}</strong>. {{ t("tenant.clinicSettings.deleteBodyEnd") }}</p>
        <div class="clinic-delete-actions">
          <button type="button" @click="cancelDelete">{{ t("tenant.clinicSettings.cancel") }}</button>
          <button type="button" class="danger" @click="confirmDelete">{{ t("tenant.clinicSettings.delete") }}</button>
        </div>
      </article>
    </div>
  </section>
</template>
