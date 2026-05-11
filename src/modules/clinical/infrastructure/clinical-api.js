import {BaseApi} from "../../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../../shared/infrastructure/pase-endpoint.js";

const doctorsEndpointPath = import.meta.env.VITE_VITALIA_DOCTOR_ENDPOINT_PATH
    ?? import.meta.env.VITALIA_DOCTOR_ENDPOINT_PATH
    ?? "/doctor";
const patientsEndpointPath = import.meta.env.VITE_VITALIA_PATIENT_ENDPOINT_PATH
    ?? import.meta.env.VITALIA_PATIENT_ENDPOINT_PATH
    ?? "/patient";
const specialitiesEndpointPath = import.meta.env.VITE_VITALIA_SPECIALITY_ENDPOINT_PATH
    ?? "/speciality";
const doctorSpecialitiesEndpointPath = import.meta.env.VITE_VITALIA_DOCTOR_SPECIALITY_ENDPOINT_PATH
    ?? "/doctor-speciality";
const medicalRecordsEndpointPath = import.meta.env.VITE_VITALIA_MEDICAL_RECORD_ENDPOINT_PATH
    ?? "/medical-record";
const diagnosesEndpointPath = import.meta.env.VITE_VITALIA_DIAGNOSIS_ENDPOINT_PATH
    ?? "/diagnosis";
const treatmentsEndpointPath = import.meta.env.VITE_VITALIA_TREATMENT_ENDPOINT_PATH
    ?? "/treatment";
const prescriptionsEndpointPath = import.meta.env.VITE_VITALIA_PRESCRIPTION_ENDPOINT_PATH
    ?? "/prescription";
const prescriptionDetailsEndpointPath = import.meta.env.VITE_VITALIA_PRESCRIPTION_DETAIL_ENDPOINT_PATH
    ?? "/prescription-detail";

export class ClinicalApi extends BaseApi {
    #doctorsEndpoint;
    #patientsEndpoint;
    #specialitiesEndpoint;
    #doctorSpecialitiesEndpoint;
    #medicalRecordsEndpoint;
    #diagnosesEndpoint;
    #treatmentsEndpoint;
    #prescriptionsEndpoint;
    #prescriptionDetailsEndpoint;

    constructor() {
        super();
        this.#doctorsEndpoint = new BaseEndpoint(this, doctorsEndpointPath);
        this.#patientsEndpoint = new BaseEndpoint(this, patientsEndpointPath);
        this.#specialitiesEndpoint = new BaseEndpoint(this, specialitiesEndpointPath);
        this.#doctorSpecialitiesEndpoint = new BaseEndpoint(this, doctorSpecialitiesEndpointPath);
        this.#medicalRecordsEndpoint = new BaseEndpoint(this, medicalRecordsEndpointPath);
        this.#diagnosesEndpoint = new BaseEndpoint(this, diagnosesEndpointPath);
        this.#treatmentsEndpoint = new BaseEndpoint(this, treatmentsEndpointPath);
        this.#prescriptionsEndpoint = new BaseEndpoint(this, prescriptionsEndpointPath);
        this.#prescriptionDetailsEndpoint = new BaseEndpoint(this, prescriptionDetailsEndpointPath);
    }

    getDoctors() {
        return this.#doctorsEndpoint.getAll();
    }

    getDoctorById(id) {
        return this.#doctorsEndpoint.getById(id);
    }

    createDoctor(resource) {
        return this.#doctorsEndpoint.create(resource);
    }

    updateDoctor(resource) {
        return this.#doctorsEndpoint.update(resource.id, resource);
    }

    deleteDoctor(id) {
        return this.#doctorsEndpoint.delete(id);
    }

    getPatients() {
        return this.#patientsEndpoint.getAll();
    }

    getPatientById(id) {
        return this.#patientsEndpoint.getById(id);
    }

    createPatient(resource) {
        return this.#patientsEndpoint.create(resource);
    }

    updatePatient(resource) {
        return this.#patientsEndpoint.update(resource.id, resource);
    }

    deletePatient(id) {
        return this.#patientsEndpoint.delete(id);
    }

    getSpecialities() {
        return this.#specialitiesEndpoint.getAll();
    }

    getSpecialityById(id) {
        return this.#specialitiesEndpoint.getById(id);
    }

    createSpeciality(resource) {
        return this.#specialitiesEndpoint.create(resource);
    }

    updateSpeciality(resource) {
        return this.#specialitiesEndpoint.update(resource.id, resource);
    }

    deleteSpeciality(id) {
        return this.#specialitiesEndpoint.delete(id);
    }

    getDoctorSpecialities() {
        return this.#doctorSpecialitiesEndpoint.getAll();
    }

    getDoctorSpecialityById(id) {
        return this.#doctorSpecialitiesEndpoint.getById(id);
    }

    createDoctorSpeciality(resource) {
        return this.#doctorSpecialitiesEndpoint.create(resource);
    }

    updateDoctorSpeciality(resource) {
        return this.#doctorSpecialitiesEndpoint.update(resource.id, resource);
    }

    deleteDoctorSpeciality(id) {
        return this.#doctorSpecialitiesEndpoint.delete(id);
    }

    getMedicalRecords() {
        return this.#medicalRecordsEndpoint.getAll();
    }

    getMedicalRecordById(id) {
        return this.#medicalRecordsEndpoint.getById(id);
    }

    createMedicalRecord(resource) {
        return this.#medicalRecordsEndpoint.create(resource);
    }

    updateMedicalRecord(resource) {
        return this.#medicalRecordsEndpoint.update(resource.id, resource);
    }

    deleteMedicalRecord(id) {
        return this.#medicalRecordsEndpoint.delete(id);
    }

    getDiagnoses() {
        return this.#diagnosesEndpoint.getAll();
    }

    getDiagnosisById(id) {
        return this.#diagnosesEndpoint.getById(id);
    }

    createDiagnosis(resource) {
        return this.#diagnosesEndpoint.create(resource);
    }

    updateDiagnosis(resource) {
        return this.#diagnosesEndpoint.update(resource.id, resource);
    }

    deleteDiagnosis(id) {
        return this.#diagnosesEndpoint.delete(id);
    }

    getTreatments() {
        return this.#treatmentsEndpoint.getAll();
    }

    getTreatmentById(id) {
        return this.#treatmentsEndpoint.getById(id);
    }

    createTreatment(resource) {
        return this.#treatmentsEndpoint.create(resource);
    }

    updateTreatment(resource) {
        return this.#treatmentsEndpoint.update(resource.id, resource);
    }

    deleteTreatment(id) {
        return this.#treatmentsEndpoint.delete(id);
    }

    getPrescriptions() {
        return this.#prescriptionsEndpoint.getAll();
    }

    getPrescriptionById(id) {
        return this.#prescriptionsEndpoint.getById(id);
    }

    createPrescription(resource) {
        return this.#prescriptionsEndpoint.create(resource);
    }

    updatePrescription(resource) {
        return this.#prescriptionsEndpoint.update(resource.id, resource);
    }

    deletePrescription(id) {
        return this.#prescriptionsEndpoint.delete(id);
    }

    getPrescriptionDetails() {
        return this.#prescriptionDetailsEndpoint.getAll();
    }

    getPrescriptionDetailById(id) {
        return this.#prescriptionDetailsEndpoint.getById(id);
    }

    createPrescriptionDetail(resource) {
        return this.#prescriptionDetailsEndpoint.create(resource);
    }

    updatePrescriptionDetail(resource) {
        return this.#prescriptionDetailsEndpoint.update(resource.id, resource);
    }

    deletePrescriptionDetail(id) {
        return this.#prescriptionDetailsEndpoint.delete(id);
    }
}
