export class IamAccount {
    constructor({
        userId = null,
        doctorId = null,
        patientId = null,
        token = null,
        expiresAt = null,
        healthcareCenterId = "hc-001",
        name = "",
        paternalSurname = "",
        maternalSurname = "",
        identityType = "",
        identityNumber = "",
        dateBirth = null,
        email = "",
        phone = "",
        gender = null,
        isActive = true,
        address = "",
        role = "patient"
    } = {}) {
        this.userId = userId;
        this.doctorId = doctorId;
        this.patientId = patientId;
        this.token = token;
        this.expiresAt = expiresAt;
        this.healthcareCenterId = healthcareCenterId;
        this.name = name;
        this.paternalSurname = paternalSurname;
        this.maternalSurname = maternalSurname;
        this.identityType = identityType;
        this.identityNumber = identityNumber;
        this.dateBirth = dateBirth;
        this.email = email;
        this.phone = phone;
        this.gender = gender;
        this.isActive = isActive;
        this.address = address;
        this.role = role;
    }
}
