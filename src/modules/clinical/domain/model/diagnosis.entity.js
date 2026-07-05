export class Diagnosis {
    constructor({
        id = null,
        medicalRecordId = null,
        cie10Code = "",
        description = "",
        diagnosisCatalogSource = null,
        createdAt = null,
        updatedAt = null
    } = {}) {
        this.id = id;
        this.medicalRecordId = medicalRecordId;
        this.cie10Code = cie10Code;
        this.description = description;
        this.diagnosisCatalogSource = diagnosisCatalogSource;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
