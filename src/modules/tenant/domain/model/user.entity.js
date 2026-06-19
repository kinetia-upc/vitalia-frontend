export class User {
    constructor({
        id = null,
        healthcareCenterId = null,
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
        role = ""
    } = {}) {
        this.id = id;
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
