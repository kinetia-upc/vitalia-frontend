import {BaseApi} from "../../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";

const medicinesEndpointPath = import.meta.env.VITE_VITALIA_MEDICINE_ENDPOINT_PATH
    ?? "/medicines";
const branchMedicinesEndpointPath = import.meta.env.VITE_VITALIA_BRANCH_MEDICINE_ENDPOINT_PATH
    ?? "/branchMedicines";

export class PharmacyApi extends BaseApi {
    #medicinesEndpoint;
    #branchMedicinesEndpoint;

    constructor() {
        super();
        this.#medicinesEndpoint = new BaseEndpoint(this, medicinesEndpointPath);
        this.#branchMedicinesEndpoint = new BaseEndpoint(this, branchMedicinesEndpointPath);
    }

    getMedicines() {
        return this.#medicinesEndpoint.getAll();
    }

    getMedicineById(id) {
        return this.#medicinesEndpoint.getById(id);
    }

    createMedicine(resource) {
        return this.#medicinesEndpoint.create(resource);
    }

    updateMedicine(resource) {
        return this.#medicinesEndpoint.update(resource.id, resource);
    }

    deleteMedicine(id) {
        return this.#medicinesEndpoint.delete(id);
    }

    getBranchMedicines(branchId) {
        const params = branchId ? {branchId} : {};
        return this.#branchMedicinesEndpoint.getAll(params);
    }

    createBranchMedicine(resource) {
        return this.#branchMedicinesEndpoint.create(resource);
    }

    updateBranchMedicine(branchId, medicineId, resource) {
        return this.#branchMedicinesEndpoint.update(`branches/${branchId}/medicines/${medicineId}`, resource);
    }

    deleteBranchMedicine(branchId, medicineId) {
        return this.#branchMedicinesEndpoint.delete(`branches/${branchId}/medicines/${medicineId}`);
    }
}
