import {BaseApi} from "../../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";

const usersEndpointPath = import.meta.env.VITE_VITALIA_USER_ENDPOINT_PATH
    ?? "/user";
const healthcareCentersEndpointPath = import.meta.env.VITE_VITALIA_HEALTHCARE_CENTER_ENDPOINT_PATH
    ?? "/healthcare-center";
const branchesEndpointPath = import.meta.env.VITE_VITALIA_BRANCH_ENDPOINT_PATH
    ?? "/branch";
const appointmentFeesEndpointPath = import.meta.env.VITE_VITALIA_APPOINTMENT_FEE_ENDPOINT_PATH
    ?? "/appointment-fee";

export class TenantApi extends BaseApi {
    #usersEndpoint;
    #healthcareCentersEndpoint;
    #branchesEndpoint;
    #appointmentFeesEndpoint;

    constructor() {
        super();
        this.#usersEndpoint = new BaseEndpoint(this, usersEndpointPath);
        this.#healthcareCentersEndpoint = new BaseEndpoint(this, healthcareCentersEndpointPath);
        this.#branchesEndpoint = new BaseEndpoint(this, branchesEndpointPath);
        this.#appointmentFeesEndpoint = new BaseEndpoint(this, appointmentFeesEndpointPath);
    }

    getUsers() {
        return this.#usersEndpoint.getAll();
    }

    getUserById(id) {
        return this.#usersEndpoint.getById(id);
    }

    createUser(resource) {
        return this.#usersEndpoint.create(resource);
    }

    updateUser(resource) {
        return this.#usersEndpoint.update(resource.id, resource);
    }

    deleteUser(id) {
        return this.#usersEndpoint.delete(id);
    }

    getHealthcareCenters() {
        return this.#healthcareCentersEndpoint.getAll();
    }

    getHealthcareCenterById(id) {
        return this.#healthcareCentersEndpoint.getById(id);
    }

    createHealthcareCenter(resource) {
        return this.#healthcareCentersEndpoint.create(resource);
    }

    updateHealthcareCenter(resource) {
        return this.#healthcareCentersEndpoint.update(resource.id, resource);
    }

    deleteHealthcareCenter(id) {
        return this.#healthcareCentersEndpoint.delete(id);
    }

    getBranches() {
        return this.#branchesEndpoint.getAll();
    }

    getBranchById(id) {
        return this.#branchesEndpoint.getById(id);
    }

    createBranch(resource) {
        return this.#branchesEndpoint.create(resource);
    }

    updateBranch(resource) {
        return this.#branchesEndpoint.update(resource.id, resource);
    }

    deleteBranch(id) {
        return this.#branchesEndpoint.delete(id);
    }

    getAppointmentFees() {
        return this.#appointmentFeesEndpoint.getAll();
    }

    getAppointmentFeeById(id) {
        return this.#appointmentFeesEndpoint.getById(id);
    }

    createAppointmentFee(resource) {
        return this.#appointmentFeesEndpoint.create(resource);
    }

    updateAppointmentFee(resource) {
        return this.#appointmentFeesEndpoint.update(resource.id, resource);
    }

    deleteAppointmentFee(id) {
        return this.#appointmentFeesEndpoint.delete(id);
    }
}
