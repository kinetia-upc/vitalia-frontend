export class Branch {
    constructor({
        id = null,
        code = "",
        healthcareCenterId = null,
        branchName = "",
        address = "",
        diagnosisCatalogSource = "MINSA_CIE10"
    } = {}) {
        this.id = id;
        this.code = code;
        this.healthcareCenterId = healthcareCenterId;
        this.branchName = branchName;
        this.address = address;
        this.diagnosisCatalogSource = normalizeDiagnosisCatalogSource(diagnosisCatalogSource);
    }
}

function normalizeDiagnosisCatalogSource(source) {
    if (source === 0 || source === "0") return "MINSA_CIE10";
    if (source === 1 || source === "1") return "WHO_CIE10";
    if (source === "WHO_ICD10") return "WHO_CIE10";
    return source || "MINSA_CIE10";
}
