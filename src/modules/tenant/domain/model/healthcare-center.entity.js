export class HealthcareCenter {
    constructor({
        id = null,
        healthcare_center_name = "",
        alliance_start_date = null,
        alliance_finish_date = null,
        ruc_number = null
    }) {
        this.id = id;
        this.healthcare_center_name = healthcare_center_name;
        this.alliance_start_date = alliance_start_date;
        this.alliance_finish_date = alliance_finish_date;
        this.ruc_number = ruc_number;
    }
}
