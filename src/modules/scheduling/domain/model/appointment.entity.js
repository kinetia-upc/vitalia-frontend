export class Appointment {
    constructor({id = null, doctorId = '', patientId = '', branchId = '', scheduledAt = '', reason = '', status = 'scheduled', paymentStatus = 'pending', doctor = null, patient = null, branch = null}) {
        this.id = id
        this.doctorId = doctorId
        this.patientId = patientId
        this.branchId = branchId
        this.scheduledAt = scheduledAt
        this.reason = reason
        this.status = status
        this.paymentStatus = paymentStatus
        this.doctor = doctor
        this.patient = patient
        this.branch = branch
    }

    get isCancelled() {
        return this.status === 'cancelled'
    }

    get appointmentDate() {
        return this.scheduledAt.slice(0, 10)
    }

    belongsToDoctor(doctorId) {
        return this.doctorId === doctorId
    }

    isScheduledForDate(date) {
        const targetDate = date instanceof Date
            ? [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, '0'),
                String(date.getDate()).padStart(2, '0')
            ].join('-')
            : date

        return this.appointmentDate === targetDate
    }
}
