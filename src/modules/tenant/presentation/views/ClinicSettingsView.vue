<script setup>
import {computed, onMounted, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import useTenantStore from "../../application/tenant.store.js";
import useClinicalStore from "../../../clinical/application/clinical.store.js";
import usePharmacyStore from "../../../pharmacy/application/pharmacy.store.js";

const tenantStore = useTenantStore();
const clinicalStore = useClinicalStore();
const pharmacyStore = usePharmacyStore();
const {t} = useI18n();
const doseUnitOptions = ['mg', 'g', 'mcg', 'ml', 'l', 'unit', 'tablet', 'capsule', 'drop', 'puff', 'patch', 'ampoule', 'vial'];

const activeTab = ref("branches");
const searchQuery = ref("");
const modalOpen = ref(false);
const modalMode = ref("add");
const modalType = ref("branches");
const deleteConfirmOpen = ref(false);
const pendingDelete = ref(null);
const bulkDiagnosisCatalogSource = ref("MINSA_CIE10");
const applyingCatalogToAll = ref(false);
const catalogAppliedToAll = ref(false);

const branchForm = ref(emptyBranch());
const specialityForm = ref(emptySpeciality());

const medId = ref("");
const medCode = ref("");
const medName = ref("");
const medValidationMessage = ref("");
const medUnitQuantity = ref(0);
const medUnitType = ref("");
const medPrice = ref(0);
const medStock = ref(0);
const medBranchId = ref("");
const originalMedBranchId = ref("");
const medicinePickerOpen = ref(false);

const tabs = computed(() => [
    {id: "branches", label: t("tenant.clinicSettings.tabs.branches")},
    {id: "specialities", label: t("tenant.clinicSettings.tabs.specialities")},
    {id: "pharmacy", label: t("tenant.clinicSettings.tabs.pharmacy")}
]);
const diagnosisCatalogOptions = computed(() => [
    {value: "MINSA_CIE10", label: t("tenant.clinicSettings.diagnosisCatalogOptions.minsa")},
    {value: "WHO_CIE10", label: t("tenant.clinicSettings.diagnosisCatalogOptions.who")}
]);

onMounted(() => {
    if (!tenantStore.healthcareCentersLoaded) tenantStore.fetchHealthcareCenters();
    if (!tenantStore.branchesLoaded) tenantStore.fetchBranches();
    if (!tenantStore.appointmentFeesLoaded) tenantStore.fetchAppointmentFees();
    if (!clinicalStore.specialitiesLoaded) clinicalStore.fetchSpecialities();
    if (!clinicalStore.doctorSpecialitiesLoaded) clinicalStore.fetchDoctorSpecialities();
    if (!pharmacyStore.medicinesLoaded) pharmacyStore.fetchMedicines();
});

watch(bulkDiagnosisCatalogSource, () => {
    catalogAppliedToAll.value = false;
});

watch(medId, id => {
    if (modalType.value !== "pharmacy" || modalMode.value !== "add") return;
    const selectedMedicine = medicineCatalogOptions.value.find(medicine => String(medicine.id) === String(id));
    medCode.value = selectedMedicine?.code || "";
    medName.value = selectedMedicine?.name || "";
    medUnitQuantity.value = Number(selectedMedicine?.unitQuantity) || 0;
    medUnitType.value = selectedMedicine?.unitType || "";
    medValidationMessage.value = "";
});

watch([medId, medBranchId], () => {
    medValidationMessage.value = "";
});

const modalTitle = computed(() => {
    const action = modalMode.value === "add" ? t("tenant.clinicSettings.add") : t("tenant.clinicSettings.edit");
    return `${action} ${modalLabel(modalType.value)}`;
});
const deleteTargetLabel = computed(() => {
    if (!pendingDelete.value) return t("tenant.clinicSettings.record");
    const {type, resource} = pendingDelete.value;
    if (type === "branches") return resource.branchName;
    if (type === "pharmacy") return resource.name;
    if (type === "speciality") return resource.description;
    return t("tenant.clinicSettings.record");
});
const branchRows = computed(() => tenantStore.branches.map(branch => ({
    ...branch,
    fees: tenantStore.appointmentFees.filter(fee => fee.branchId === branch.id)
})));

const visibleBranches = computed(() => filterRows(branchRows.value, branch => [
    branch.branchName,
    branch.address,
    catalogSourceLabel(branch.diagnosisCatalogSource)
]));
const visibleSpecialities = computed(() => filterRows(clinicalStore.specialities, speciality => [speciality.description, speciality.id]));
const visibleMedicines = computed(() => {
    const enriched = pharmacyStore.branchMedicines.map(branchMedicine => {
        const medicine = pharmacyStore.medicines.find(item => String(item.id) === String(branchMedicine.medicineId));
        const branch = tenantStore.branches.find(b => String(b.id) === String(branchMedicine.branchId));
        if (!medicine || !branch) return null;

        return {
            ...medicine,
            branchId: String(branchMedicine.branchId),
            price: Number(branchMedicine.price) || 0,
            stock: Number(branchMedicine.stock) || 0,
            branchName: branch.branchName
        };
    }).filter(Boolean);
    return filterRows(enriched, medicine => [medicine.name, medicine.unitType, medicine.branchName, medicine.price, medicine.stock]);
});
const medicineCatalogOptions = computed(() => {
    const byId = new Map();
    pharmacyStore.medicines.forEach(medicine => {
        if (!byId.has(String(medicine.id))) byId.set(String(medicine.id), medicine);
    });
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
});
const selectedMedicineLabel = computed(() => {
    const medicine = medicineCatalogOptions.value.find(item => String(item.id) === String(medId.value));
    return medicine ? `${medicine.name} - ${medicine.unitQuantity} ${medicine.unitType}` : "--";
});

function emptyBranch() {
    return {
        id: "",
        healthcareCenterId: "hc-001",
        branchName: "",
        address: "",
        diagnosisCatalogSource: "MINSA_CIE10",
        fees: {}
    };
}

function emptySpeciality() {
    return {id: "", description: ""};
}

function resetMedicineForm() {
    medId.value = "";
    medCode.value = "";
    medName.value = "";
    medValidationMessage.value = "";
    medUnitQuantity.value = 0;
    medUnitType.value = "";
    medPrice.value = 0;
    medStock.value = 0;
    medBranchId.value = "";
    originalMedBranchId.value = "";
    medicinePickerOpen.value = false;
}

function fillMedicineForm(resource) {
    medId.value = resource.id;
    medCode.value = resource.code || "";
    medName.value = resource.name;
    medValidationMessage.value = "";
    medUnitQuantity.value = resource.unitQuantity;
    medUnitType.value = resource.unitType;
    medPrice.value = resource.price;
    medStock.value = resource.stock;
    medBranchId.value = String(resource.branchId || "");
    originalMedBranchId.value = String(resource.branchId || "");
    medicinePickerOpen.value = false;
}

function modalLabel(type) {
    return {
        branches: t("tenant.clinicSettings.singular.branch"),
        pharmacy: t("tenant.clinicSettings.singular.medicine"),
        speciality: t("tenant.clinicSettings.singular.speciality")
    }[type] ?? t("tenant.clinicSettings.record");
}

function normalizedModalType(type) {
    return type === "specialities" ? "speciality" : type;
}

function nextId(prefix) {
    return `${prefix}-${crypto.randomUUID()}`;
}

function filterRows(rows, fieldsGetter) {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(row => fieldsGetter(row).join(" ").toLowerCase().includes(query));
}

function catalogSourceLabel(source) {
    return diagnosisCatalogOptions.value.find(option => option.value === source)?.label ?? source ?? "-";
}

function openAdd(type = activeTab.value) {
    modalMode.value = "add";
    modalType.value = normalizedModalType(type);
    if (!tenantStore.branchesLoaded) tenantStore.fetchBranches();
    if (modalType.value === "branches") {
        branchForm.value = emptyBranch();
        clinicalStore.specialities.forEach(speciality => {
            branchForm.value.fees[speciality.id] = "";
        });
    }
    if (modalType.value === "pharmacy") resetMedicineForm();
    if (modalType.value === "speciality") specialityForm.value = emptySpeciality();
    modalOpen.value = true;
}

function openEdit(type, resource) {
    modalMode.value = "edit";
    modalType.value = normalizedModalType(type);
    if (!tenantStore.branchesLoaded) tenantStore.fetchBranches();
    if (modalType.value === "branches") {
        const fees = {};
        clinicalStore.specialities.forEach(speciality => {
            const fee = tenantStore.appointmentFees.find(item => item.branchId === resource.id && item.specialityId === speciality.id);
            fees[speciality.id] = fee?.price ?? "";
        });
        branchForm.value = {...resource, fees};
    }
    if (modalType.value === "pharmacy") fillMedicineForm(resource);
    if (modalType.value === "speciality") specialityForm.value = {...resource};
    modalOpen.value = true;
}

function closeModal() {
    modalOpen.value = false;
    medValidationMessage.value = "";
    medicinePickerOpen.value = false;
}

function selectMedicine(medicine) {
    if (modalMode.value === "edit") return;
    medId.value = String(medicine.id);
    medicinePickerOpen.value = false;
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

function saveModal() {
    if (modalType.value === "branches") saveBranch();
    if (modalType.value === "pharmacy" && !saveMedicine()) return;
    if (modalType.value === "speciality") saveSpeciality();
    closeModal();
}

function saveBranch() {
    const branch = {
        id: modalMode.value === "add" ? nextId("branch") : branchForm.value.id,
        healthcareCenterId: branchForm.value.healthcareCenterId,
        branchName: branchForm.value.branchName,
        address: branchForm.value.address,
        diagnosisCatalogSource: branchForm.value.diagnosisCatalogSource
    };
    modalMode.value === "add" ? tenantStore.addBranch(branch) : tenantStore.updateBranch(branch);
    clinicalStore.specialities.forEach(speciality => saveAppointmentFee(branch.id, speciality.id));
}

async function applyCatalogToAllBranches() {
    if (!bulkDiagnosisCatalogSource.value || applyingCatalogToAll.value) return;
    catalogAppliedToAll.value = false;
    applyingCatalogToAll.value = true;
    try {
        await tenantStore.updateDiagnosisCatalogSourceForBranches(bulkDiagnosisCatalogSource.value);
        catalogAppliedToAll.value = true;
    } catch {
        catalogAppliedToAll.value = false;
    } finally {
        applyingCatalogToAll.value = false;
    }
}

function saveAppointmentFee(branchId, specialityId) {
    const price = branchForm.value.fees[specialityId];
    const currentFee = tenantStore.appointmentFees.find(item => item.branchId === branchId && item.specialityId === specialityId);
    if (price === "" || price === null || Number.isNaN(Number(price))) {
        if (currentFee) tenantStore.deleteAppointmentFee(currentFee);
        return;
    }
    const fee = {id: currentFee?.id ?? nextId("fee"), branchId: branchId, specialityId: specialityId, price: Number(price)};
    currentFee ? tenantStore.updateAppointmentFee(fee) : tenantStore.addAppointmentFee(fee);
}

function saveMedicine() {
    const selectedMedicine = medicineCatalogOptions.value.find(medicine => String(medicine.id) === String(medId.value));
    const existsInBranch = pharmacyStore.branchMedicines.some(branchMedicine =>
        String(branchMedicine.medicineId) === String(medId.value) &&
        String(branchMedicine.branchId) === String(medBranchId.value) &&
        !(modalMode.value === "edit" && String(branchMedicine.branchId) === String(originalMedBranchId.value))
    );

    if (existsInBranch) {
        medValidationMessage.value = t("tenant.clinicSettings.medicineAlreadyExistsInBranch");
        return false;
    }

    const medicine = {
        id: modalMode.value === "add" ? selectedMedicine.id : medId.value,
        code: selectedMedicine?.code || medCode.value,
        name: selectedMedicine?.name || medName.value,
        unitQuantity: Number(selectedMedicine?.unitQuantity ?? medUnitQuantity.value),
        unitType: selectedMedicine?.unitType || medUnitType.value,
        price: Number(medPrice.value),
        stock: medStock.value,
        branchId: medBranchId.value
    };
    modalMode.value === "add" ? pharmacyStore.addMedicine(medicine) : pharmacyStore.updateMedicine(medicine);
    return true;
}

function saveSpeciality() {
    const speciality = {id: modalMode.value === "add" ? nextId("spec") : specialityForm.value.id, description: specialityForm.value.description};
    modalMode.value === "add" ? clinicalStore.addSpeciality(speciality) : clinicalStore.updateSpeciality(speciality);
}

function removeResource(type, resource) {
    if (type === "branches") {
        tenantStore.appointmentFees.filter(fee => fee.branchId === resource.id).forEach(fee => tenantStore.deleteAppointmentFee(fee));
        tenantStore.deleteBranch(resource);
    }
    if (type === "pharmacy") pharmacyStore.deleteMedicine(resource);
    if (type === "speciality") {
        tenantStore.appointmentFees.filter(fee => fee.specialityId === resource.id).forEach(fee => tenantStore.deleteAppointmentFee(fee));
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
      <div v-if="activeTab === 'branches'" class="clinic-settings-bulk">
        <select v-model="bulkDiagnosisCatalogSource" :aria-label="t('tenant.clinicSettings.applyCatalogToAll')">
          <option v-for="option in diagnosisCatalogOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <button type="button" :class="{ applied: catalogAppliedToAll }" :disabled="applyingCatalogToAll" @click="applyCatalogToAllBranches">
          {{ catalogAppliedToAll ? t("tenant.clinicSettings.catalogApplied") : t("tenant.clinicSettings.applyCatalogToAll") }}
        </button>
      </div>
      <button class="clinic-settings-add" type="button" @click="openAdd()">{{ t("tenant.clinicSettings.add") }}</button>
    </header>

    <article v-if="activeTab === 'branches'" class="clinic-settings-panel panel">
      <div class="clinic-settings-table">
        <div class="clinic-settings-row five table-head"><span>{{ t("tenant.clinicSettings.branch") }}</span><span>{{ t("tenant.clinicSettings.address") }}</span><span>{{ t("tenant.clinicSettings.diagnosisCatalog") }}</span><span>{{ t("tenant.clinicSettings.appointmentFees") }}</span><span>{{ t("tenant.clinicSettings.actions") }}</span></div>
        <div v-for="branch in visibleBranches" :key="branch.id" class="clinic-settings-row five">
          <strong>{{ branch.branchName }}</strong><span>{{ branch.address }}</span><span>{{ catalogSourceLabel(branch.diagnosisCatalogSource) }}</span><span>{{ t("tenant.clinicSettings.specialitiesCount", { count: branch.fees.length }) }}</span>
          <div class="clinic-settings-actions"><button type="button" @click="openEdit('branches', branch)">{{ t("tenant.clinicSettings.edit") }}</button><button type="button" class="danger" @click="requestDelete('branches', branch)">{{ t("tenant.clinicSettings.delete") }}</button></div>
        </div>
      </div>
    </article>

    <article v-if="activeTab === 'specialities'" class="clinic-settings-panel panel">
      <div class="clinic-settings-table">
        <div class="clinic-settings-row table-head"><span>{{ t("tenant.clinicSettings.speciality") }}</span><span>{{ t("tenant.clinicSettings.doctors") }}</span><span>{{ t("tenant.clinicSettings.assignedFees") }}</span><span>{{ t("tenant.clinicSettings.actions") }}</span></div>
        <div v-for="speciality in visibleSpecialities" :key="speciality.id" class="clinic-settings-row">
          <strong>{{ speciality.description }}</strong><span>{{ t("tenant.clinicSettings.doctorsCount", { count: clinicalStore.doctorSpecialities.filter(ds => ds.specialityId === speciality.id).length }) }}</span><span>{{ t("tenant.clinicSettings.feesCount", { count: tenantStore.appointmentFees.filter(fee => fee.specialityId === speciality.id).length }) }}</span>
          <div class="clinic-settings-actions"><button type="button" @click="openEdit('speciality', speciality)">{{ t("tenant.clinicSettings.edit") }}</button><button type="button" class="danger" @click="requestDelete('speciality', speciality)">{{ t("tenant.clinicSettings.delete") }}</button></div>
        </div>
      </div>
    </article>

    <article v-if="activeTab === 'pharmacy'" class="clinic-settings-panel panel">
      <div class="clinic-settings-table">
        <div class="clinic-settings-row six table-head"><span>{{ t("tenant.clinicSettings.medicine") }}</span><span>{{ t("tenant.clinicSettings.unit") }}</span><span>{{ t("tenant.clinicSettings.branch") }}</span><span>{{ t("tenant.clinicSettings.price") }}</span><span>{{ t("tenant.clinicSettings.stock") }}</span><span>{{ t("tenant.clinicSettings.actions") }}</span></div>
        <div v-for="medicine in visibleMedicines" :key="`${medicine.id}__${medicine.branchId}`" class="clinic-settings-row six">
          <strong>{{ medicine.name }}</strong><span>{{ medicine.unitQuantity }} {{ medicine.unitType }}</span><span>{{ medicine.branchName || '-' }}</span><span>S/ {{ medicine.price }}</span><span>{{ medicine.stock }}</span>
          <div class="clinic-settings-actions"><button type="button" @click="openEdit('pharmacy', medicine)">{{ t("tenant.clinicSettings.edit") }}</button><button type="button" class="danger" @click="requestDelete('pharmacy', medicine)">{{ t("tenant.clinicSettings.delete") }}</button></div>
        </div>
      </div>
    </article>

    <div v-if="modalOpen" class="profile-modal-backdrop" @click.self="closeModal">
      <article class="clinic-settings-modal panel" role="dialog" aria-modal="true">
        <header><h2>{{ modalTitle }}</h2><button type="button" @click="closeModal">x</button></header>
        <form class="clinic-settings-form" @submit.prevent="saveModal">
          <template v-if="modalType === 'branches'">
            <label class="wide"><span>{{ t("tenant.clinicSettings.name") }}</span><input v-model="branchForm.branchName" required /></label>
            <label class="wide"><span>{{ t("tenant.clinicSettings.address") }}</span><input v-model="branchForm.address" required /></label>
            <label class="wide"><span>{{ t("tenant.clinicSettings.diagnosisCatalog") }}</span><select v-model="branchForm.diagnosisCatalogSource" required><option v-for="option in diagnosisCatalogOptions" :key="option.value" :value="option.value">{{ option.label }}</option></select></label>
            <section class="wide fee-editor"><h3>{{ t("tenant.clinicSettings.feesBySpeciality") }}</h3><label v-for="speciality in clinicalStore.specialities" :key="speciality.id"><span>{{ speciality.description }}</span><input v-model="branchForm.fees[speciality.id]" type="number" min="0" step="0.01" placeholder="0.00" /></label></section>
          </template>
          <template v-else-if="modalType === 'pharmacy'">
            <label class="wide medicine-picker-field"><span>{{ t("tenant.clinicSettings.medicine") }}</span><input :value="selectedMedicineLabel" readonly required @click="medicinePickerOpen = modalMode !== 'edit' && !medicinePickerOpen" /><div v-if="medicinePickerOpen" class="medicine-picker-list"><button v-for="medicine in medicineCatalogOptions" :key="String(medicine.id)" type="button" @click="selectMedicine(medicine)"><strong>{{ medicine.name }}</strong><span>{{ medicine.unitQuantity }} {{ medicine.unitType }}</span></button></div></label>
            <p v-if="medValidationMessage" class="clinic-settings-error wide">{{ medValidationMessage }}</p>
            <label><span>{{ t("tenant.clinicSettings.unitQuantity") }}</span><input v-model.number="medUnitQuantity" type="number" min="0" disabled required /></label>
            <label><span>{{ t("tenant.clinicSettings.unitType") }}</span><select v-model="medUnitType" disabled required><option value="">--</option><option v-for="opt in doseUnitOptions" :key="opt" :value="opt">{{ opt }}</option></select></label>
            <label><span>{{ t("tenant.clinicSettings.price") }}</span><input v-model.number="medPrice" type="number" min="0" step="0.01" required /></label>
            <label><span>{{ t("tenant.clinicSettings.branch") }}</span><select v-model="medBranchId" required><option value="">--</option><option v-for="b in tenantStore.branches" :key="String(b.id)" :value="String(b.id)">{{ b.branchName }}</option></select></label>
          </template>
          <template v-else>
            <label class="wide"><span>{{ t("tenant.clinicSettings.description") }}</span><input v-model="specialityForm.description" required /></label>
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
