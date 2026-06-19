export class DoctorSpeciality {
    constructor({id = null, doctorId = null, specialityId = null} = {}) {
        this.id = id;
        this.doctorId = doctorId;
        this.specialityId = specialityId;
    }
}
