export class PrescriptionDetail {
    constructor({
        id = null,
        id_prescription = null,
        id_medicine = null,
        medicine_name = "",
        dose = 0,
        dose_unit_type = "",
        frequency = "",
        duration = "",
        form_type = ""
    }) {
        this.id = id;
        this.id_prescription = id_prescription;
        this.id_medicine = id_medicine;
        this.medicine_name = medicine_name;
        this.dose = dose;
        this.dose_unit_type = dose_unit_type;
        this.frequency = frequency;
        this.duration = duration;
        this.form_type = form_type;
    }
}
