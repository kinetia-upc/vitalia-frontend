import {BaseApi} from "../../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";

const medicinesEndpointPath = import.meta.env.VITE_VITALIA_MEDICINE_ENDPOINT_PATH
    ?? "/medicines";

export class PharmacyApi extends BaseApi {
    #medicinesEndpoint;

    constructor() {
        super();
        this.#medicinesEndpoint = new BaseEndpoint(this, medicinesEndpointPath);
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
}
