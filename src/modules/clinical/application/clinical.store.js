/**
 * Application service store for the Clinical bounded context.
 * It coordinates clinical use cases and keeps UI-facing state.
 *
 * @module useClinicalStore
 */
import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {ClinicalApi} from "../infrastructure/clinical-api.js";
import {DoctorAssembler} from "../infrastructure/doctor.assembler.js";
import {PatientAssembler} from "../infrastructure/patient.assembler.js";
import {SpecialityAssembler} from "../infrastructure/speciality.assembler.js";
import {DoctorSpecialityAssembler} from "../infrastructure/doctor-speciality.assembler.js";
import {MedicalRecordAssembler} from "../infrastructure/medical-record.assembler.js";
import {DiagnosisAssembler} from "../infrastructure/diagnosis.assembler.js";
import {TreatmentAssembler} from "../infrastructure/treatment.assembler.js";
import {PrescriptionAssembler} from "../infrastructure/prescription.assembler.js";
import {PrescriptionDetailAssembler} from "../infrastructure/prescription-detail.assembler.js";
import {Doctor} from "../domain/model/doctor.entity.js";
import {Patient} from "../domain/model/patient.entity.js";
import {Speciality} from "../domain/model/speciality.entity.js";
import {DoctorSpeciality} from "../domain/model/doctor-speciality.entity.js";
import {MedicalRecord} from "../domain/model/medicalRecord.entity.js";
import {Diagnosis} from "../domain/model/diagnosis.entity.js";
import {Treatment} from "../domain/model/treatment.entity.js";
import {Prescription} from "../domain/model/prescription.entity.js";
import {PrescriptionDetail} from "../domain/model/prescriptionDetail.entity.js";

const clinicalApi = new ClinicalApi();

/**
 * Reactive store that exposes Clinical commands and queries.
 *
 * @returns {Object} Store state and actions.
 */
const useClinicalStore = defineStore("clinical", () => {
    /** @type {import('vue').Ref<Doctor[]>} */
    const doctors = ref([]);
    /** @type {import('vue').Ref<Patient[]>} */
    const patients = ref([]);
    /** @type {import('vue').Ref<Speciality[]>} */
    const specialities = ref([]);
    /** @type {import('vue').Ref<DoctorSpeciality[]>} */
    const doctorSpecialities = ref([]);
    /** @type {import('vue').Ref<MedicalRecord[]>} */
    const medicalRecords = ref([]);
    /** @type {import('vue').Ref<Diagnosis[]>} */
    const diagnoses = ref([]);
    /** @type {import('vue').Ref<Treatment[]>} */
    const treatments = ref([]);
    /** @type {import('vue').Ref<Prescription[]>} */
    const prescriptions = ref([]);
    /** @type {import('vue').Ref<PrescriptionDetail[]>} */
    const prescriptionDetails = ref([]);
    /** @type {import('vue').Ref<Error[]>} */
    const errors = ref([]);

    /** @type {import('vue').Ref<boolean>} */
    const doctorsLoaded = ref(false);
    /** @type {import('vue').Ref<boolean>} */
    const patientsLoaded = ref(false);
    /** @type {import('vue').Ref<boolean>} */
    const specialitiesLoaded = ref(false);
    /** @type {import('vue').Ref<boolean>} */
    const doctorSpecialitiesLoaded = ref(false);
    /** @type {import('vue').Ref<boolean>} */
    const medicalRecordsLoaded = ref(false);
    /** @type {import('vue').Ref<boolean>} */
    const diagnosesLoaded = ref(false);
    /** @type {import('vue').Ref<boolean>} */
    const treatmentsLoaded = ref(false);
    /** @type {import('vue').Ref<boolean>} */
    const prescriptionsLoaded = ref(false);
    /** @type {import('vue').Ref<boolean>} */
    const prescriptionDetailsLoaded = ref(false);

    const doctorsCount = computed(() => doctorsLoaded.value ? doctors.value.length : 0);
    const patientsCount = computed(() => patientsLoaded.value ? patients.value.length : 0);
    const specialitiesCount = computed(() => specialitiesLoaded.value ? specialities.value.length : 0);
    const doctorSpecialitiesCount = computed(() => doctorSpecialitiesLoaded.value ? doctorSpecialities.value.length : 0);
    const medicalRecordsCount = computed(() => medicalRecordsLoaded.value ? medicalRecords.value.length : 0);
    const diagnosesCount = computed(() => diagnosesLoaded.value ? diagnoses.value.length : 0);
    const treatmentsCount = computed(() => treatmentsLoaded.value ? treatments.value.length : 0);
    const prescriptionsCount = computed(() => prescriptionsLoaded.value ? prescriptions.value.length : 0);
    const prescriptionDetailsCount = computed(() => prescriptionDetailsLoaded.value ? prescriptionDetails.value.length : 0);

    function parseId(id) {
        const idNum = parseInt(id);
        return Number.isNaN(idNum) ? id : idNum;
    }

    function findById(collection, id) {
        const parsedId = parseId(id);
        return collection.value.find(resource => resource["id"] === parsedId);
    }

    function pushError(error) {
        errors.value.push(error);
    }

    function fetchDoctors() {
        clinicalApi.getDoctors().then(response => {
            doctors.value = DoctorAssembler.toEntitiesFromResponse(response);
            doctorsLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function getDoctorById(id) {
        return findById(doctors, id);
    }

    function addDoctor(doctor) {
        clinicalApi.createDoctor(doctor).then(response => {
            const newDoctor = DoctorAssembler.toEntityFromResource(response.data);
            doctors.value.push(newDoctor);
        }).catch(error => {
            pushError(error);
        });
    }

    function updateDoctor(doctor) {
        clinicalApi.updateDoctor(doctor).then(response => {
            const updatedDoctor = DoctorAssembler.toEntityFromResource(response.data);
            const index = doctors.value.findIndex(d => d["id"] === updatedDoctor.id);
            if (index !== -1) doctors.value[index] = updatedDoctor;
        }).catch(error => {
            pushError(error);
        });
    }

    function deleteDoctor(doctor) {
        clinicalApi.deleteDoctor(doctor.id).then(() => {
            const index = doctors.value.findIndex(d => d["id"] === doctor.id);
            if (index !== -1) doctors.value.splice(index, 1);
        }).catch(error => {
            pushError(error);
        });
    }

    function fetchPatients() {
        clinicalApi.getPatients().then(response => {
            patients.value = PatientAssembler.toEntitiesFromResponse(response);
            patientsLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function getPatientById(id) {
        return findById(patients, id);
    }

    function addPatient(patient) {
        clinicalApi.createPatient(patient).then(response => {
            const newPatient = PatientAssembler.toEntityFromResource(response.data);
            patients.value.push(newPatient);
        }).catch(error => {
            pushError(error);
        });
    }

    function updatePatient(patient) {
        clinicalApi.updatePatient(patient).then(response => {
            const updatedPatient = PatientAssembler.toEntityFromResource(response.data);
            const index = patients.value.findIndex(p => p["id"] === updatedPatient.id);
            if (index !== -1) patients.value[index] = updatedPatient;
        }).catch(error => {
            pushError(error);
        });
    }

    function deletePatient(patient) {
        clinicalApi.deletePatient(patient.id).then(() => {
            const index = patients.value.findIndex(p => p["id"] === patient.id);
            if (index !== -1) patients.value.splice(index, 1);
        }).catch(error => {
            pushError(error);
        });
    }

    function fetchSpecialities() {
        clinicalApi.getSpecialities().then(response => {
            specialities.value = SpecialityAssembler.toEntitiesFromResponse(response);
            specialitiesLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function getSpecialityById(id) {
        return findById(specialities, id);
    }

    function addSpeciality(speciality) {
        clinicalApi.createSpeciality(speciality).then(response => {
            const newSpeciality = SpecialityAssembler.toEntityFromResource(response.data);
            specialities.value.push(newSpeciality);
        }).catch(error => {
            pushError(error);
        });
    }

    function updateSpeciality(speciality) {
        clinicalApi.updateSpeciality(speciality).then(response => {
            const updatedSpeciality = SpecialityAssembler.toEntityFromResource(response.data);
            const index = specialities.value.findIndex(s => s["id"] === updatedSpeciality.id);
            if (index !== -1) specialities.value[index] = updatedSpeciality;
        }).catch(error => {
            pushError(error);
        });
    }

    function deleteSpeciality(speciality) {
        clinicalApi.deleteSpeciality(speciality.id).then(() => {
            const index = specialities.value.findIndex(s => s["id"] === speciality.id);
            if (index !== -1) specialities.value.splice(index, 1);
        }).catch(error => {
            pushError(error);
        });
    }

    function fetchDoctorSpecialities() {
        clinicalApi.getDoctorSpecialities().then(response => {
            doctorSpecialities.value = DoctorSpecialityAssembler.toEntitiesFromResponse(response);
            doctorSpecialitiesLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function addDoctorSpeciality(doctorSpeciality) {
        clinicalApi.createDoctorSpeciality(doctorSpeciality).then(response => {
            const newDoctorSpeciality = DoctorSpecialityAssembler.toEntityFromResource(response.data);
            doctorSpecialities.value.push(newDoctorSpeciality);
        }).catch(error => {
            pushError(error);
        });
    }

    function deleteDoctorSpeciality(doctorSpeciality) {
        clinicalApi.deleteDoctorSpeciality(doctorSpeciality.id).then(() => {
            const index = doctorSpecialities.value.findIndex(ds => ds["id"] === doctorSpeciality.id);
            if (index !== -1) doctorSpecialities.value.splice(index, 1);
        }).catch(error => {
            pushError(error);
        });
    }

    function fetchMedicalRecords() {
        clinicalApi.getMedicalRecords().then(response => {
            medicalRecords.value = MedicalRecordAssembler.toEntitiesFromResponse(response);
            medicalRecordsLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function getMedicalRecordById(id) {
        return findById(medicalRecords, id);
    }

    function addMedicalRecord(medicalRecord) {
        clinicalApi.createMedicalRecord(medicalRecord).then(response => {
            const newMedicalRecord = MedicalRecordAssembler.toEntityFromResource(response.data);
            medicalRecords.value.push(newMedicalRecord);
        }).catch(error => {
            pushError(error);
        });
    }

    function updateMedicalRecord(medicalRecord) {
        clinicalApi.updateMedicalRecord(medicalRecord).then(response => {
            const updatedMedicalRecord = MedicalRecordAssembler.toEntityFromResource(response.data);
            const index = medicalRecords.value.findIndex(m => m["id"] === updatedMedicalRecord.id);
            if (index !== -1) medicalRecords.value[index] = updatedMedicalRecord;
        }).catch(error => {
            pushError(error);
        });
    }

    function deleteMedicalRecord(medicalRecord) {
        clinicalApi.deleteMedicalRecord(medicalRecord.id).then(() => {
            const index = medicalRecords.value.findIndex(m => m["id"] === medicalRecord.id);
            if (index !== -1) medicalRecords.value.splice(index, 1);
        }).catch(error => {
            pushError(error);
        });
    }

    function fetchDiagnoses() {
        clinicalApi.getDiagnoses().then(response => {
            diagnoses.value = DiagnosisAssembler.toEntitiesFromResponse(response);
            diagnosesLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function getDiagnosisById(id) {
        return findById(diagnoses, id);
    }

    function addDiagnosis(diagnosis) {
        clinicalApi.createDiagnosis(diagnosis).then(response => {
            const newDiagnosis = DiagnosisAssembler.toEntityFromResource(response.data);
            diagnoses.value.push(newDiagnosis);
        }).catch(error => {
            pushError(error);
        });
    }

    function updateDiagnosis(diagnosis) {
        clinicalApi.updateDiagnosis(diagnosis).then(response => {
            const updatedDiagnosis = DiagnosisAssembler.toEntityFromResource(response.data);
            const index = diagnoses.value.findIndex(d => d["id"] === updatedDiagnosis.id);
            if (index !== -1) diagnoses.value[index] = updatedDiagnosis;
        }).catch(error => {
            pushError(error);
        });
    }

    function deleteDiagnosis(diagnosis) {
        clinicalApi.deleteDiagnosis(diagnosis.id).then(() => {
            const index = diagnoses.value.findIndex(d => d["id"] === diagnosis.id);
            if (index !== -1) diagnoses.value.splice(index, 1);
        }).catch(error => {
            pushError(error);
        });
    }

    function fetchTreatments() {
        clinicalApi.getTreatments().then(response => {
            treatments.value = TreatmentAssembler.toEntitiesFromResponse(response);
            treatmentsLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function getTreatmentById(id) {
        return findById(treatments, id);
    }

    function addTreatment(treatment) {
        clinicalApi.createTreatment(treatment).then(response => {
            const newTreatment = TreatmentAssembler.toEntityFromResource(response.data);
            treatments.value.push(newTreatment);
        }).catch(error => {
            pushError(error);
        });
    }

    function updateTreatment(treatment) {
        clinicalApi.updateTreatment(treatment).then(response => {
            const updatedTreatment = TreatmentAssembler.toEntityFromResource(response.data);
            const index = treatments.value.findIndex(t => t["id"] === updatedTreatment.id);
            if (index !== -1) treatments.value[index] = updatedTreatment;
        }).catch(error => {
            pushError(error);
        });
    }

    function deleteTreatment(treatment) {
        clinicalApi.deleteTreatment(treatment.id).then(() => {
            const index = treatments.value.findIndex(t => t["id"] === treatment.id);
            if (index !== -1) treatments.value.splice(index, 1);
        }).catch(error => {
            pushError(error);
        });
    }

    function fetchPrescriptions() {
        clinicalApi.getPrescriptions().then(response => {
            prescriptions.value = PrescriptionAssembler.toEntitiesFromResponse(response);
            prescriptionsLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function getPrescriptionById(id) {
        return findById(prescriptions, id);
    }

    function addPrescription(prescription) {
        clinicalApi.createPrescription(prescription).then(response => {
            const newPrescription = PrescriptionAssembler.toEntityFromResource(response.data);
            prescriptions.value.push(newPrescription);
        }).catch(error => {
            pushError(error);
        });
    }

    function updatePrescription(prescription) {
        clinicalApi.updatePrescription(prescription).then(response => {
            const updatedPrescription = PrescriptionAssembler.toEntityFromResource(response.data);
            const index = prescriptions.value.findIndex(p => p["id"] === updatedPrescription.id);
            if (index !== -1) prescriptions.value[index] = updatedPrescription;
        }).catch(error => {
            pushError(error);
        });
    }

    function deletePrescription(prescription) {
        clinicalApi.deletePrescription(prescription.id).then(() => {
            const index = prescriptions.value.findIndex(p => p["id"] === prescription.id);
            if (index !== -1) prescriptions.value.splice(index, 1);
        }).catch(error => {
            pushError(error);
        });
    }

    function fetchPrescriptionDetails() {
        clinicalApi.getPrescriptionDetails().then(response => {
            prescriptionDetails.value = PrescriptionDetailAssembler.toEntitiesFromResponse(response);
            prescriptionDetailsLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function getPrescriptionDetailById(id) {
        return findById(prescriptionDetails, id);
    }

    function addPrescriptionDetail(prescriptionDetail) {
        clinicalApi.createPrescriptionDetail(prescriptionDetail).then(response => {
            const newPrescriptionDetail = PrescriptionDetailAssembler.toEntityFromResource(response.data);
            prescriptionDetails.value.push(newPrescriptionDetail);
        }).catch(error => {
            pushError(error);
        });
    }

    function updatePrescriptionDetail(prescriptionDetail) {
        clinicalApi.updatePrescriptionDetail(prescriptionDetail).then(response => {
            const updatedPrescriptionDetail = PrescriptionDetailAssembler.toEntityFromResource(response.data);
            const index = prescriptionDetails.value.findIndex(p => p["id"] === updatedPrescriptionDetail.id);
            if (index !== -1) prescriptionDetails.value[index] = updatedPrescriptionDetail;
        }).catch(error => {
            pushError(error);
        });
    }

    function deletePrescriptionDetail(prescriptionDetail) {
        clinicalApi.deletePrescriptionDetail(prescriptionDetail.id).then(() => {
            const index = prescriptionDetails.value.findIndex(p => p["id"] === prescriptionDetail.id);
            if (index !== -1) prescriptionDetails.value.splice(index, 1);
        }).catch(error => {
            pushError(error);
        });
    }

    return {
        doctors,
        patients,
        specialities,
        doctorSpecialities,
        medicalRecords,
        diagnoses,
        treatments,
        prescriptions,
        prescriptionDetails,
        errors,
        doctorsLoaded,
        patientsLoaded,
        specialitiesLoaded,
        doctorSpecialitiesLoaded,
        medicalRecordsLoaded,
        diagnosesLoaded,
        treatmentsLoaded,
        prescriptionsLoaded,
        prescriptionDetailsLoaded,
        doctorsCount,
        patientsCount,
        specialitiesCount,
        doctorSpecialitiesCount,
        medicalRecordsCount,
        diagnosesCount,
        treatmentsCount,
        prescriptionsCount,
        prescriptionDetailsCount,
        fetchDoctors,
        getDoctorById,
        addDoctor,
        updateDoctor,
        deleteDoctor,
        fetchPatients,
        getPatientById,
        addPatient,
        updatePatient,
        deletePatient,
        fetchSpecialities,
        getSpecialityById,
        addSpeciality,
        updateSpeciality,
        deleteSpeciality,
        fetchDoctorSpecialities,
        addDoctorSpeciality,
        deleteDoctorSpeciality,
        fetchMedicalRecords,
        getMedicalRecordById,
        addMedicalRecord,
        updateMedicalRecord,
        deleteMedicalRecord,
        fetchDiagnoses,
        getDiagnosisById,
        addDiagnosis,
        updateDiagnosis,
        deleteDiagnosis,
        fetchTreatments,
        getTreatmentById,
        addTreatment,
        updateTreatment,
        deleteTreatment,
        fetchPrescriptions,
        getPrescriptionById,
        addPrescription,
        updatePrescription,
        deletePrescription,
        fetchPrescriptionDetails,
        getPrescriptionDetailById,
        addPrescriptionDetail,
        updatePrescriptionDetail,
        deletePrescriptionDetail
    };
});

export default useClinicalStore;
