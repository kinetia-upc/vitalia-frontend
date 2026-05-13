<script setup>
import {computed, onMounted, reactive, ref} from "vue";
import useTenantStore from "../../application/tenant.store.js";
import useClinicalStore from "../../../clinical/application/clinical.store.js";
import usePharmacyStore from "../../../pharmacy/application/pharmacy.store.js";

const tabs = [
    {id: "branches", label: "Branch"},
    {id: "doctors", label: "Doctors"},
    {id: "patients", label: "Patients"},
    {id: "specialities", label: "Specialities"},
    {id: "pharmacy", label: "Pharmacy"}
];

const tenantStore = useTenantStore();
const clinicalStore = useClinicalStore();
const pharmacyStore = usePharmacyStore();

const activeTab = ref("branches");
const searchQuery = ref("");
const modalOpen = ref(false);
const modalMode = ref("add");
const modalType = ref("branches");
const deleteConfirmOpen = ref(false);
const pendingDelete = ref(null);

const form = reactive({
    branch: emptyBranch(),
    doctor: emptyDoctor(),
    patient: emptyPatient(),
    medicine: emptyMedicine(),
    speciality: emptySpeciality()
});

onMounted(() => {
    if (!tenantStore.usersLoaded) tenantStore.fetchUsers();
    if (!tenantStore.healthcareCentersLoaded) tenantStore.fetchHealthcareCenters();
    if (!tenantStore.branchesLoaded) tenantStore.fetchBranches();
    if (!tenantStore.appointmentFeesLoaded) tenantStore.fetchAppointmentFees();
    if (!clinicalStore.doctorsLoaded) clinicalStore.fetchDoctors();
    if (!clinicalStore.patientsLoaded) clinicalStore.fetchPatients();
    if (!clinicalStore.specialitiesLoaded) clinicalStore.fetchSpecialities();
    if (!clinicalStore.doctorSpecialitiesLoaded) clinicalStore.fetchDoctorSpecialities();
    if (!pharmacyStore.medicinesLoaded) pharmacyStore.fetchMedicines();
});

const modalTitle = computed(() => `${modalMode.value === "add" ? "Add" : "Edit"} ${modalLabel(modalType.value)}`);
const deleteTargetLabel = computed(() => {
    if (!pendingDelete.value) return "record";
    const {type, resource} = pendingDelete.value;
    if (type === "branches") return resource.branch_name;
    if (type === "doctors" || type === "patients") return fullName(resource.user);
    if (type === "pharmacy") return resource.name;
    if (type === "speciality") return resource.description;
    return "record";
});
const doctors = computed(() => clinicalStore.doctors.map(doctor => {
    const doctorSpeciality = clinicalStore.doctorSpecialities.find(item => item.id_doctor === doctor.id);
    return {
        ...doctor,
        user: tenantStore.users.find(user => user.id === doctor.id_user),
        doctorSpeciality,
        speciality: clinicalStore.specialities.find(item => item.id === doctorSpeciality?.id_speciality)
    };
}));
const patients = computed(() => clinicalStore.patients.map(patient => ({
    ...patient,
    user: tenantStore.users.find(user => user.id === patient.id_user)
})));
const branchRows = computed(() => tenantStore.branches.map(branch => ({
    ...branch,
    fees: tenantStore.appointmentFees.filter(fee => fee.id_branch === branch.id)
})));

const visibleBranches = computed(() => filterRows(branchRows.value, branch => [branch.branch_name, branch.address]));
const visibleDoctors = computed(() => filterRows(doctors.value, doctor => [fullName(doctor.user), doctor.user?.email, doctor.speciality?.description, doctor.cmp_number]));
const visiblePatients = computed(() => filterRows(patients.value, patient => [fullName(patient.user), patient.user?.email, patient.insurance_provider, patient.policy_number]));
const visibleSpecialities = computed(() => filterRows(clinicalStore.specialities, speciality => [speciality.description, speciality.id]));
const visibleMedicines = computed(() => filterRows(pharmacyStore.medicines, medicine => [medicine.name, medicine.unitType, medicine.price, medicine.stock]));

function emptyBranch() {
    return {id: "", id_healthcare_center: "hc-001", id_address: "", branch_name: "", address: "", fees: {}};
}

function emptyDoctor() {
    return {
        id: "", userId: "", name: "", paternal_surname: "", maternal_surname: "",
        identity_type: "DNI", identity_number: "", date_birth: "", email: "", phone: "",
        gender: "", address: "", id_speciality: "", lic_number: "", cmp_number: ""
    };
}

function emptyPatient() {
    return {
        id: "", userId: "", name: "", paternal_surname: "", maternal_surname: "",
        identity_type: "DNI", identity_number: "", date_birth: "", email: "", phone: "",
        gender: "", address: "", insurance_provider: "", policy_number: "", active_thru: "",
        emergency_contact_name: "", emergency_contact_phone: ""
    };
}

function emptyMedicine() {
    return {id: "", name: "", unitQuantity: 0, unitType: "", price: 0, stock: 0};
}

function emptySpeciality() {
    return {id: "", description: ""};
}

function modalLabel(type) {
    return {branches: "branch", doctors: "doctor", patients: "patient", pharmacy: "medicine", speciality: "speciality"}[type] ?? "record";
}

function formKey(type) {
    return {branches: "branch", doctors: "doctor", patients: "patient", pharmacy: "medicine", speciality: "speciality"}[type];
}

function normalizedModalType(type) {
    return type === "specialities" ? "speciality" : type;
}

function resetForm(type) {
    const factory = {branches: emptyBranch, doctors: emptyDoctor, patients: emptyPatient, pharmacy: emptyMedicine, speciality: emptySpeciality}[type];
    Object.assign(form[formKey(type)], factory());
}

function nextId(prefix) {
    return `${prefix}-${crypto.randomUUID()}`;
}

function fullName(user) {
    return [user?.name, user?.paternal_surname, user?.maternal_surname].filter(Boolean).join(" ") || "Unassigned";
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
    if (modalType.value === "doctors") fillDoctorForm(resource);
    if (modalType.value === "patients") fillPatientForm(resource);
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

function fillDoctorForm(doctor) {
    Object.assign(form.doctor, {
        id: doctor.id,
        userId: doctor.id_user,
        name: doctor.user?.name ?? "",
        paternal_surname: doctor.user?.paternal_surname ?? "",
        maternal_surname: doctor.user?.maternal_surname ?? "",
        identity_type: doctor.user?.identity_type ?? "DNI",
        identity_number: doctor.user?.identity_number ?? "",
        date_birth: doctor.user?.date_birth ?? "",
        email: doctor.user?.email ?? "",
        phone: doctor.user?.phone ?? "",
        gender: doctor.user?.gender ?? "",
        address: doctor.user?.address ?? "",
        id_speciality: doctor.doctorSpeciality?.id_speciality ?? "",
        lic_number: doctor.lic_number,
        cmp_number: doctor.cmp_number
    });
}

function fillPatientForm(patient) {
    Object.assign(form.patient, {
        id: patient.id,
        userId: patient.id_user,
        name: patient.user?.name ?? "",
        paternal_surname: patient.user?.paternal_surname ?? "",
        maternal_surname: patient.user?.maternal_surname ?? "",
        identity_type: patient.user?.identity_type ?? "DNI",
        identity_number: patient.user?.identity_number ?? "",
        date_birth: patient.user?.date_birth ?? "",
        email: patient.user?.email ?? "",
        phone: patient.user?.phone ?? "",
        gender: patient.user?.gender ?? "",
        address: patient.user?.address ?? "",
        insurance_provider: patient.insurance_provider,
        policy_number: patient.policy_number,
        active_thru: patient.active_thru,
        emergency_contact_name: patient.emergency_contact_name,
        emergency_contact_phone: patient.emergency_contact_phone
    });
}

function saveModal() {
    if (modalType.value === "branches") saveBranch();
    if (modalType.value === "doctors") saveDoctor();
    if (modalType.value === "patients") savePatient();
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

function saveDoctor() {
    const userId = modalMode.value === "add" ? nextId("usr") : form.doctor.userId;
    const doctorId = modalMode.value === "add" ? nextId("doc") : form.doctor.id;
    const user = userResource(userId, "doctor", form.doctor);
    const doctor = {id: doctorId, id_user: userId, lic_number: form.doctor.lic_number, cmp_number: form.doctor.cmp_number};
    if (modalMode.value === "add") {
        tenantStore.addUser(user);
        clinicalStore.addDoctor(doctor);
    } else {
        tenantStore.updateUser(user);
        clinicalStore.updateDoctor(doctor);
    }
    saveDoctorSpeciality(doctorId);
}

function saveDoctorSpeciality(doctorId) {
    const current = clinicalStore.doctorSpecialities.find(item => item.id_doctor === doctorId);
    if (!form.doctor.id_speciality) {
        if (current) clinicalStore.deleteDoctorSpeciality(current);
        return;
    }
    if (current) clinicalStore.deleteDoctorSpeciality(current);
    clinicalStore.addDoctorSpeciality({id: nextId("ds"), id_doctor: doctorId, id_speciality: form.doctor.id_speciality});
}

function savePatient() {
    const userId = modalMode.value === "add" ? nextId("usr") : form.patient.userId;
    const patientId = modalMode.value === "add" ? nextId("pat") : form.patient.id;
    const user = userResource(userId, "patient", form.patient);
    const patient = {
        id: patientId,
        id_user: userId,
        insurance_provider: form.patient.insurance_provider,
        policy_number: form.patient.policy_number,
        active_thru: form.patient.active_thru,
        emergency_contact_name: form.patient.emergency_contact_name,
        emergency_contact_phone: form.patient.emergency_contact_phone
    };
    if (modalMode.value === "add") {
        tenantStore.addUser(user);
        clinicalStore.addPatient(patient);
    } else {
        tenantStore.updateUser(user);
        clinicalStore.updatePatient(patient);
    }
}

function userResource(id, role, source) {
    const previous = tenantStore.getUserById(id) ?? {};
    return {
        ...previous,
        id,
        id_healthcare_center: previous.id_healthcare_center ?? "hc-001",
        name: source.name,
        paternal_surname: source.paternal_surname,
        maternal_surname: source.maternal_surname,
        identity_type: source.identity_type,
        identity_number: source.identity_number,
        date_birth: source.date_birth,
        email: source.email,
        phone: source.phone,
        gender: source.gender,
        is_active: previous.is_active ?? true,
        address: source.address,
        role
    };
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
    if (type === "doctors") {
        if (resource.doctorSpeciality) clinicalStore.deleteDoctorSpeciality(resource.doctorSpeciality);
        clinicalStore.deleteDoctor(resource);
        if (resource.user) tenantStore.deleteUser(resource.user);
    }
    if (type === "patients") {
        clinicalStore.deletePatient(resource);
        if (resource.user) tenantStore.deleteUser(resource.user);
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
      <h1>Clinic Settings</h1>
      <p>Orchestrate the Clinical digital backbone.</p>
    </header>

    <label class="clinic-settings-search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 4a6.5 6.5 0 0 1 5.2 10.4l4 4-1.4 1.4-4-4A6.5 6.5 0 1 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"/></svg>
      <input v-model="searchQuery" type="search" placeholder="Search facilities" />
    </label>

    <header class="clinic-settings-toolbar panel">
      <span>Filter by:</span>
      <div class="clinic-settings-tabs">
        <button v-for="tab in tabs" :key="tab.id" type="button" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
          {{ tab.label }}
        </button>
      </div>
      <button class="clinic-settings-add" type="button" @click="openAdd()">Add</button>
    </header>

    <article v-if="activeTab === 'branches'" class="clinic-settings-panel panel">
      <div class="clinic-settings-table">
        <div class="clinic-settings-row table-head"><span>Branch</span><span>Address</span><span>Appointment fees</span><span>Actions</span></div>
        <div v-for="branch in visibleBranches" :key="branch.id" class="clinic-settings-row">
          <strong>{{ branch.branch_name }}</strong><span>{{ branch.address }}</span><span>{{ branch.fees.length }} specialities</span>
          <div class="clinic-settings-actions"><button type="button" @click="openEdit('branches', branch)">Edit</button><button type="button" class="danger" @click="requestDelete('branches', branch)">Delete</button></div>
        </div>
      </div>
    </article>

    <article v-else-if="activeTab === 'doctors'" class="clinic-settings-panel panel">
      <div class="clinic-settings-table">
        <div class="clinic-settings-row five table-head"><span>Doctor</span><span>Email</span><span>Speciality</span><span>CMPN</span><span>Actions</span></div>
        <div v-for="doctor in visibleDoctors" :key="doctor.id" class="clinic-settings-row five">
          <strong>{{ fullName(doctor.user) }}</strong><span>{{ doctor.user?.email }}</span><span>{{ doctor.speciality?.description ?? "Unassigned" }}</span><span>{{ doctor.cmp_number }}</span>
          <div class="clinic-settings-actions"><button type="button" @click="openEdit('doctors', doctor)">Edit</button><button type="button" class="danger" @click="requestDelete('doctors', doctor)">Delete</button></div>
        </div>
      </div>
    </article>

    <article v-else-if="activeTab === 'patients'" class="clinic-settings-panel panel">
      <div class="clinic-settings-table">
        <div class="clinic-settings-row five table-head"><span>Patient</span><span>Email</span><span>Insurance</span><span>Policy</span><span>Actions</span></div>
        <div v-for="patient in visiblePatients" :key="patient.id" class="clinic-settings-row five">
          <strong>{{ fullName(patient.user) }}</strong><span>{{ patient.user?.email }}</span><span>{{ patient.insurance_provider }}</span><span>{{ patient.policy_number }}</span>
          <div class="clinic-settings-actions"><button type="button" @click="openEdit('patients', patient)">Edit</button><button type="button" class="danger" @click="requestDelete('patients', patient)">Delete</button></div>
        </div>
      </div>
    </article>

    <article v-else-if="activeTab === 'specialities'" class="clinic-settings-panel panel">
      <div class="clinic-settings-table">
        <div class="clinic-settings-row table-head"><span>Speciality</span><span>Identifier</span><span>Assigned fees</span><span>Actions</span></div>
        <div v-for="speciality in visibleSpecialities" :key="speciality.id" class="clinic-settings-row">
          <strong>{{ speciality.description }}</strong><span>{{ speciality.id }}</span><span>{{ tenantStore.appointmentFees.filter(fee => fee.id_speciality === speciality.id).length }} branches</span>
          <div class="clinic-settings-actions"><button type="button" @click="openEdit('speciality', speciality)">Edit</button><button type="button" class="danger" @click="requestDelete('speciality', speciality)">Delete</button></div>
        </div>
      </div>
    </article>

    <article v-else class="clinic-settings-panel panel">
      <div class="clinic-settings-table">
        <div class="clinic-settings-row five table-head"><span>Medicine</span><span>Unit</span><span>Price</span><span>Stock</span><span>Actions</span></div>
        <div v-for="medicine in visibleMedicines" :key="medicine.id" class="clinic-settings-row five">
          <strong>{{ medicine.name }}</strong><span>{{ medicine.unitQuantity }} {{ medicine.unitType }}</span><span>S/ {{ medicine.price }}</span><span>{{ medicine.stock }}</span>
          <div class="clinic-settings-actions"><button type="button" @click="openEdit('pharmacy', medicine)">Edit</button><button type="button" class="danger" @click="requestDelete('pharmacy', medicine)">Delete</button></div>
        </div>
      </div>
    </article>

    <div v-if="modalOpen" class="profile-modal-backdrop" @click.self="closeModal">
      <article class="clinic-settings-modal panel" role="dialog" aria-modal="true">
        <header><h2>{{ modalTitle }}</h2><button type="button" @click="closeModal">x</button></header>
        <form class="clinic-settings-form" @submit.prevent="saveModal">
          <template v-if="modalType === 'branches'">
            <label><span>Name</span><input v-model="form.branch.branch_name" required /></label>
            <label><span>Address id</span><input v-model="form.branch.id_address" /></label>
            <label class="wide"><span>Address</span><input v-model="form.branch.address" required /></label>
            <section class="wide fee-editor"><h3>Appointment fees by speciality</h3><label v-for="speciality in clinicalStore.specialities" :key="speciality.id"><span>{{ speciality.description }}</span><input v-model="form.branch.fees[speciality.id]" type="number" min="0" step="0.01" placeholder="0.00" /></label></section>
          </template>
          <template v-else-if="modalType === 'doctors'">
            <label><span>Name</span><input v-model="form.doctor.name" required /></label><label><span>Paternal surname</span><input v-model="form.doctor.paternal_surname" required /></label><label><span>Maternal surname</span><input v-model="form.doctor.maternal_surname" /></label><label><span>Identity type</span><input v-model="form.doctor.identity_type" /></label><label><span>Identity number</span><input v-model="form.doctor.identity_number" /></label><label><span>Date of birth</span><input v-model="form.doctor.date_birth" type="date" /></label><label><span>Email</span><input v-model="form.doctor.email" type="email" /></label><label><span>Phone</span><input v-model="form.doctor.phone" /></label><label><span>Gender</span><input v-model="form.doctor.gender" /></label><label class="wide"><span>Address</span><input v-model="form.doctor.address" /></label><label><span>Speciality</span><select v-model="form.doctor.id_speciality"><option value="">Unassigned</option><option v-for="speciality in clinicalStore.specialities" :key="speciality.id" :value="speciality.id">{{ speciality.description }}</option></select></label><label><span>License</span><input v-model="form.doctor.lic_number" required /></label><label><span>CMPN</span><input v-model="form.doctor.cmp_number" required /></label>
          </template>
          <template v-else-if="modalType === 'patients'">
            <label><span>Name</span><input v-model="form.patient.name" required /></label><label><span>Paternal surname</span><input v-model="form.patient.paternal_surname" required /></label><label><span>Maternal surname</span><input v-model="form.patient.maternal_surname" /></label><label><span>Identity type</span><input v-model="form.patient.identity_type" /></label><label><span>Identity number</span><input v-model="form.patient.identity_number" /></label><label><span>Date of birth</span><input v-model="form.patient.date_birth" type="date" /></label><label><span>Email</span><input v-model="form.patient.email" type="email" /></label><label><span>Phone</span><input v-model="form.patient.phone" /></label><label><span>Gender</span><input v-model="form.patient.gender" /></label><label class="wide"><span>Address</span><input v-model="form.patient.address" /></label><label><span>Insurance provider</span><input v-model="form.patient.insurance_provider" /></label><label><span>Policy number</span><input v-model="form.patient.policy_number" /></label><label><span>Active thru</span><input v-model="form.patient.active_thru" type="date" /></label><label><span>Emergency contact</span><input v-model="form.patient.emergency_contact_name" /></label><label><span>Emergency phone</span><input v-model="form.patient.emergency_contact_phone" /></label>
          </template>
          <template v-else-if="modalType === 'pharmacy'">
            <label class="wide"><span>Name</span><input v-model="form.medicine.name" required /></label><label><span>Unit quantity</span><input v-model="form.medicine.unitQuantity" type="number" min="0" required /></label><label><span>Unit type</span><input v-model="form.medicine.unitType" required /></label><label><span>Price</span><input v-model="form.medicine.price" type="number" min="0" step="0.01" required /></label><label><span>Stock</span><input v-model="form.medicine.stock" type="number" min="0" required /></label>
          </template>
          <template v-else>
            <label class="wide"><span>Description</span><input v-model="form.speciality.description" required /></label>
          </template>
          <button class="profile-primary-button wide" type="submit">Save</button>
        </form>
      </article>
    </div>

    <div v-if="deleteConfirmOpen" class="profile-modal-backdrop" @click.self="cancelDelete">
      <article class="clinic-delete-modal panel" role="dialog" aria-modal="true">
        <h2>Are you sure?</h2>
        <p>This will delete <strong>{{ deleteTargetLabel }}</strong>. This action cannot be undone.</p>
        <div class="clinic-delete-actions">
          <button type="button" @click="cancelDelete">Cancel</button>
          <button type="button" class="danger" @click="confirmDelete">Delete</button>
        </div>
      </article>
    </div>
  </section>
</template>
