import { AnalyticsSnapshot } from '../domain/model/analytics-snapshot.entity.js'

const ACTIVE_APPOINTMENT_STATUSES = ['scheduled', 'confirmed', 'arrived', 'in-attention']
const COMPLETED_APPOINTMENT_STATUSES = ['released']
const CURRENT_DOCTOR_ID = 'doc-001'

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function toLocalDateKey(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
    ].join('-')
}

function addDays(date, days) {
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + days)
    return nextDate
}

function buildWeekDays(referenceDate) {
    const day = referenceDate.getDay()
    const mondayOffset = day === 0 ? -6 : 1 - day
    const monday = addDays(referenceDate, mondayOffset)

    return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

function appointmentDateKey(appointment) {
    return appointment.scheduledAt?.slice(0, 10) ?? ''
}

function userFullName(user) {
    return [user?.name, user?.paternal_surname, user?.maternal_surname]
        .filter(Boolean)
        .join(' ')
}

function patientName(patient, users) {
    const user = users.find((item) => item.id === patient?.id_user)
    return userFullName(user) || patient?.fullName || 'Unassigned patient'
}

function doctorName(doctor, users) {
    const user = users.find((item) => item.id === doctor?.id_user)
    const fullName = userFullName(user)
    return fullName ? `Dr. ${fullName}` : doctor?.fullName || 'Assigned doctor'
}

function percent(part, total) {
    if (!total) return 0
    return Math.round((part / total) * 100)
}

function buildAdmissions(appointments, referenceDate) {
    const weekDays = buildWeekDays(referenceDate)
    const counts = weekDays.map((date) => {
        const key = toLocalDateKey(date)
        return appointments.filter((appointment) =>
            appointmentDateKey(appointment) === key &&
            appointment.status !== 'cancelled'
        ).length
    })
    const max = Math.max(...counts, 1)

    return weekDays.map((date, index) => ({
        day: DAY_LABELS[date.getDay()],
        count: counts[index],
        value: Math.max(12, Math.round((counts[index] / max) * 100))
    }))
}

function recentActivity({ appointments, medicalRecords, claims, patients, doctors, users }) {
    const recordItems = medicalRecords.map((record) => {
        const appointment = appointments.find((item) => item.id === record.id_appointment)
        const patient = patients.find((item) => item.id === record.id_patient)
        const doctor = doctors.find((item) => item.id === appointment?.doctorId)

        return {
            id: `record-${record.id}`,
            at: record.updated_at,
            title: `${doctorName(doctor, users)} updated ${record.code}`,
            body: `${patientName(patient, users)} - clinical record`,
            status: 'Internal'
        }
    })

    const claimItems = claims.map((claim) => ({
        id: `claim-${claim.id}`,
        at: new Date().toISOString(),
        title: `${claim.claimCode} moved to ${claim.cycleStatus}`,
        body: `${claim.patientName} - ${claim.insuranceProvider}`,
        status: claim.clinicalCompliance === 'verified' ? 'Success' : 'Review'
    }))

    return [...recordItems, ...claimItems]
        .filter((item) => item.at)
        .sort((left, right) => new Date(right.at) - new Date(left.at))
        .slice(0, 3)
}

function buildAlerts({ claims, slots, appointments }) {
    const rejectedClaims = claims.filter((claim) => claim.cycleStatus === 'Rejected').length
    const pendingClaims = claims.filter((claim) => claim.clinicalCompliance !== 'verified').length

    return [
        rejectedClaims > 0 && {
            title: 'Claims Attention',
            body: `${rejectedClaims} rejected claims require billing review.`,
            tone: 'amber'
        },
        pendingClaims > 0 && {
            title: 'Compliance Notice',
            body: `${pendingClaims} claims are waiting for clinical validation.`,
            tone: 'teal'
        }
    ].filter(Boolean).slice(0, 2)
}

function buildDoctorAnalytics({ appointments, medicalRecords, referenceDate }) {
    const doctorAppointments = appointments
        .filter((appointment) => appointment.doctorId === CURRENT_DOCTOR_ID && appointment.status !== 'cancelled')
        .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))
    const todayKey = toLocalDateKey(referenceDate)
    const todayAppointments = doctorAppointments.filter((appointment) => appointmentDateKey(appointment) === todayKey)
    const upcomingAppointments = doctorAppointments.filter((appointment) => new Date(appointment.scheduledAt) >= referenceDate)
    const recentAppointments = [...doctorAppointments].sort((left, right) => new Date(right.scheduledAt) - new Date(left.scheduledAt))
    const visibleAppointments = (
        todayAppointments.length ? todayAppointments :
            upcomingAppointments.length ? upcomingAppointments :
                recentAppointments
    ).slice(0, 5)
    const appointmentsWithRecords = new Set(medicalRecords.map((record) => record.id_appointment).filter(Boolean))
    const pendingRecordReviews = doctorAppointments.filter((appointment) =>
        ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status) &&
        !appointmentsWithRecords.has(appointment.id)
    )

    return {
        activePatients: new Set(doctorAppointments.map((appointment) => appointment.patientId)).size,
        todayAppointments: todayAppointments.length,
        visibleAppointments,
        pendingRecordReviews: pendingRecordReviews.length,
        trendBars: buildAdmissions(doctorAppointments, referenceDate),
        completionRate: percent(
            doctorAppointments.filter((appointment) => appointment.status === 'released').length,
            doctorAppointments.length
        )
    }
}

function buildPatientAnalytics({ appointments, medicalRecords, prescriptions, prescriptionDetails, referenceDate }) {
    const patientId = appointments.find((appointment) => appointment.patientId)?.patientId
    const patientAppointments = appointments
        .filter((appointment) => appointment.patientId === patientId)
        .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))
    const upcomingAppointment = patientAppointments.find((appointment) =>
        appointment.status !== 'cancelled' && new Date(appointment.scheduledAt) >= referenceDate
    ) ?? null
    const records = medicalRecords
        .filter((record) => record.id_patient === patientId)
        .sort((left, right) => new Date(right.updated_at) - new Date(left.updated_at))
    const recordIds = new Set(records.map((record) => record.id))
    const patientPrescriptionIds = prescriptions
        .filter((prescription) => recordIds.has(prescription.id_medical_record))
        .map((prescription) => prescription.id)

    return {
        upcomingAppointment,
        records,
        pendingResults: prescriptionDetails.filter((detail) => patientPrescriptionIds.includes(detail.id_prescription)).length
    }
}

export class AnalyticsSnapshotAssembler {
    static fromStores({ schedulingStore, clinicalStore, tenantStore, billingStore, referenceDate = new Date() }) {
        const appointments = schedulingStore.appointmentsWithDetails
        const claims = billingStore.claims
        const slots = schedulingStore.slots
        const activeDoctors = tenantStore.users.filter((user) => user.role === 'doctor' && user.is_active).length

        return new AnalyticsSnapshot({
            totalPatients: clinicalStore.patients.length,
            activeDoctors,
            totalMedicalRecords: clinicalStore.medicalRecords.length,
            revenue: billingStore.totalRevenueCycle,
            admissions: buildAdmissions(appointments, referenceDate),
            activity: recentActivity({
                appointments,
                medicalRecords: clinicalStore.medicalRecords,
                claims,
                patients: clinicalStore.patients,
                doctors: clinicalStore.doctors,
                users: tenantStore.users
            }),
            alerts: buildAlerts({ claims, slots, appointments }),
            doctor: buildDoctorAnalytics({
                appointments,
                medicalRecords: clinicalStore.medicalRecords,
                referenceDate
            }),
            patient: buildPatientAnalytics({
                appointments,
                medicalRecords: clinicalStore.medicalRecords,
                prescriptions: clinicalStore.prescriptions,
                prescriptionDetails: clinicalStore.prescriptionDetails,
                referenceDate
            })
        })
    }
}
