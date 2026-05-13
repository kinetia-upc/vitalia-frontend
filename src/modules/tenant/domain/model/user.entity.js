export class User {
    constructor({
        id = null,
        id_healthcare_center = null,
        name = "",
        paternal_surname = "",
        maternal_surname = "",
        identity_type = "",
        identity_number = "",
        date_birth = null,
        email = "",
        phone = "",
        gender = null,
        is_active = true,
        address = "",
        role = ""
    }) {
        this.id = id;
        this.id_healthcare_center = id_healthcare_center;
        this.name = name;
        this.paternal_surname = paternal_surname;
        this.maternal_surname = maternal_surname;
        this.identity_type = identity_type;
        this.identity_number = identity_number;
        this.date_birth = date_birth;
        this.email = email;
        this.phone = phone;
        this.gender = gender;
        this.is_active = is_active;
        this.address = address;
        this.role = role;
    }
}
