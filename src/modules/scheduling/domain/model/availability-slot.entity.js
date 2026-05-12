export class AvailabilitySlot {
    constructor({id = null, doctorId = '', branchId = '', date = '', startTime = '', endTime = '', status = 'available'}) {
        this.id = id
        this.doctorId = doctorId
        this.branchId = branchId
        this.date = date
        this.startTime = startTime
        this.endTime = endTime
        this.status = status
    }

    get isAvailable() {
        return this.status === 'available'
    }
}
