export class AnalyticsSnapshot {
    constructor({
        totalPatients = 0,
        activeDoctors = 0,
        totalMedicalRecords = 0,
        revenue = 0,
        admissions = [],
        activity = [],
        alerts = [],
        doctor = {},
        patient = {}
    } = {}) {
        this.totalPatients = totalPatients
        this.activeDoctors = activeDoctors
        this.totalMedicalRecords = totalMedicalRecords
        this.revenue = revenue
        this.admissions = admissions
        this.activity = activity
        this.alerts = alerts
        this.doctor = doctor
        this.patient = patient
    }
}
