const defaultLabels = {
    unassignedBranch: 'Unassigned branch',
    unassignedMedicalRecord: 'Unassigned EHR',
    unassignedPatient: 'Unassigned patient',
    unassignedProvider: 'Unassigned provider'
}

export function buildRevenueMovements({
    medicalRecords = [],
    appointments = [],
    claims = [],
    branches = [],
    patients = [],
    doctors = [],
    doctorSpecialities = [],
    appointmentFees = [],
    labels = defaultLabels
} = {}) {
    const copy = { ...defaultLabels, ...labels }

    return medicalRecords
        .map((record) => {
            const appointment = appointments.find((item) => item.id === record.appointmentId)
            if (appointment?.paymentStatus !== 'paid') return null

            const claim = claims.find((item) => item.appointmentId === appointment.id)
            if (claim && claim.cycleStatus !== 'Rejected') return null

            const branch = branches.find((item) => item.id === appointment.branchId)
            const patient = patients.find((item) => item.id === appointment.patientId)
            const doctor = doctors.find((item) => item.id === appointment.doctorId)
            const doctorSpeciality = doctorSpecialities.find((item) => item.doctorId === appointment.doctorId)
            const appointmentFee = appointmentFees.find((fee) =>
                fee.branchId === appointment.branchId && fee.specialityId === doctorSpeciality?.specialityId
            )
            const value = Number(claim?.value ?? appointmentFee?.price ?? 0)

            if (value <= 0) return null

            const movementDate = record.createdAt || record.updatedAt || ''

            return {
                id: record.id,
                value,
                branchId: appointment.branchId || null,
                branchName: branch?.branchName || copy.unassignedBranch,
                movementDate,
                monthKey: movementDate ? movementDate.slice(0, 7) : '',
                medicalRecordCode: record.code || record.id || copy.unassignedMedicalRecord,
                patientName: claim?.patientName || patient?.fullName || copy.unassignedPatient,
                providerName: claim?.providerName || doctor?.fullName || copy.unassignedProvider
            }
        })
        .filter(Boolean)
}

export function sumRevenueMovements(movements = []) {
    return movements.reduce((sum, movement) => sum + (Number(movement.value) || 0), 0)
}
