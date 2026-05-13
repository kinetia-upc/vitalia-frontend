/**
 * Application service store for the Tenant bounded context.
 * It coordinates user, healthcare center, branch and appointment fee use cases and keeps UI-facing state.
 *
 * @module useTenantStore
 */
import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {TenantApi} from "../infrastructure/tenant-api.js";
import {UserAssembler} from "../infrastructure/user.assembler.js";
import {HealthcareCenterAssembler} from "../infrastructure/healthcare-center.assembler.js";
import {BranchAssembler} from "../infrastructure/branch.assembler.js";
import {AppointmentFeeAssembler} from "../infrastructure/appointment-fee.assembler.js";
import {User} from "../domain/model/user.entity.js";
import {HealthcareCenter} from "../domain/model/healthcare-center.entity.js";
import {Branch} from "../domain/model/branch.entity.js";
import {AppointmentFee} from "../domain/model/appointment-fee.entity.js";

const tenantApi = new TenantApi();

/**
 * Reactive store that exposes Tenant commands and queries.
 *
 * @returns {Object} Store state and actions.
 */
const useTenantStore = defineStore("tenant", () => {
    /**
     * List of user entities.
     * @type {import('vue').Ref<User[]>}
     */
    const users = ref([]);
    /**
     * List of healthcare center entities.
     * @type {import('vue').Ref<HealthcareCenter[]>}
     */
    const healthcareCenters = ref([]);
    /**
     * List of branch entities.
     * @type {import('vue').Ref<Branch[]>}
     */
    const branches = ref([]);
    /**
     * List of appointment fee entities.
     * @type {import('vue').Ref<AppointmentFee[]>}
     */
    const appointmentFees = ref([]);
    /**
     * List of errors encountered during API operations.
     * @type {import('vue').Ref<Error[]>}
     */
    const errors = ref([]);
    /**
     * Whether users have been loaded from the API.
     * @type {import('vue').Ref<boolean>}
     */
    const usersLoaded = ref(false);
    /**
     * Whether healthcare centers have been loaded from the API.
     * @type {import('vue').Ref<boolean>}
     */
    const healthcareCentersLoaded = ref(false);
    /**
     * Whether branches have been loaded from the API.
     * @type {import('vue').Ref<boolean>}
     */
    const branchesLoaded = ref(false);
    /**
     * Whether appointment fees have been loaded from the API.
     * @type {import('vue').Ref<boolean>}
     */
    const appointmentFeesLoaded = ref(false);
    /**
     * Number of loaded users.
     * @type {import('vue').ComputedRef<number>}
     */
    const usersCount = computed(() => {
        return usersLoaded.value ? users.value.length : 0;
    });
    /**
     * Number of loaded healthcare centers.
     * @type {import('vue').ComputedRef<number>}
     */
    const healthcareCentersCount = computed(() => {
        return healthcareCentersLoaded.value ? healthcareCenters.value.length : 0;
    });
    /**
     * Number of loaded branches.
     * @type {import('vue').ComputedRef<number>}
     */
    const branchesCount = computed(() => {
        return branchesLoaded.value ? branches.value.length : 0;
    });
    /**
     * Number of loaded appointment fees.
     * @type {import('vue').ComputedRef<number>}
     */
    const appointmentFeesCount = computed(() => {
        return appointmentFeesLoaded.value ? appointmentFees.value.length : 0;
    });

    /**
     * Loads users from infrastructure and updates the application state.
     * @returns {void}
     */
    function fetchUsers() {
        tenantApi.getUsers().then(response => {
            users.value = UserAssembler.toEntitiesFromResponse(response);
            usersLoaded.value = true;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Finds a user entity by identifier.
     * @param {number|string} id - User identifier.
     * @returns {User|undefined} Matching user, if available.
     */
    function getUserById(id) {
        let idNum = parseInt(id);
        return users.value.find(user => user["id"] === idNum || user["id"] === id);
    }

    /**
     * Creates a user through infrastructure and appends it to local state.
     * @param {User} user - User entity to persist.
     * @returns {void}
     */
    function addUser(user) {
        tenantApi.createUser(user).then(response => {
            const resource = response.data;
            const newUser = UserAssembler.toEntityFromResource(resource);
            users.value.push(newUser);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Updates an existing user and synchronizes local state.
     * @param {User} user - User entity with updated data.
     * @returns {void}
     */
    function updateUser(user) {
        tenantApi.updateUser(user).then(response => {
            const resource = response.data;
            const updatedUser = UserAssembler.toEntityFromResource(resource);
            const index = users.value.findIndex(u => u["id"] === updatedUser.id);
            if (index !== -1) users.value[index] = updatedUser;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Deletes a user and removes it from local state.
     * @param {User} user - User entity to remove.
     * @returns {void}
     */
    function deleteUser(user) {
        tenantApi.deleteUser(user.id).then(() => {
            const index = users.value.findIndex(u => u["id"] === user.id);
            if (index !== -1) users.value.splice(index, 1);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Loads healthcare centers from infrastructure and updates the application state.
     * @returns {void}
     */
    function fetchHealthcareCenters() {
        tenantApi.getHealthcareCenters().then(response => {
            healthcareCenters.value = HealthcareCenterAssembler.toEntitiesFromResponse(response);
            healthcareCentersLoaded.value = true;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Finds a healthcare center entity by identifier.
     * @param {number|string} id - Healthcare center identifier.
     * @returns {HealthcareCenter|undefined} Matching healthcare center, if available.
     */
    function getHealthcareCenterById(id) {
        let idNum = parseInt(id);
        return healthcareCenters.value.find(healthcareCenter => healthcareCenter["id"] === idNum || healthcareCenter["id"] === id);
    }

    /**
     * Creates a healthcare center through infrastructure and appends it to local state.
     * @param {HealthcareCenter} healthcareCenter - Healthcare center entity to persist.
     * @returns {void}
     */
    function addHealthcareCenter(healthcareCenter) {
        tenantApi.createHealthcareCenter(healthcareCenter).then(response => {
            const resource = response.data;
            const newHealthcareCenter = HealthcareCenterAssembler.toEntityFromResource(resource);
            healthcareCenters.value.push(newHealthcareCenter);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Updates an existing healthcare center and synchronizes local state.
     * @param {HealthcareCenter} healthcareCenter - Healthcare center entity with updated data.
     * @returns {void}
     */
    function updateHealthcareCenter(healthcareCenter) {
        tenantApi.updateHealthcareCenter(healthcareCenter).then(response => {
            const resource = response.data;
            const updatedHealthcareCenter = HealthcareCenterAssembler.toEntityFromResource(resource);
            const index = healthcareCenters.value.findIndex(h => h["id"] === updatedHealthcareCenter.id);
            if (index !== -1) healthcareCenters.value[index] = updatedHealthcareCenter;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Deletes a healthcare center and removes it from local state.
     * @param {HealthcareCenter} healthcareCenter - Healthcare center entity to remove.
     * @returns {void}
     */
    function deleteHealthcareCenter(healthcareCenter) {
        tenantApi.deleteHealthcareCenter(healthcareCenter.id).then(() => {
            const index = healthcareCenters.value.findIndex(h => h["id"] === healthcareCenter.id);
            if (index !== -1) healthcareCenters.value.splice(index, 1);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Loads branches from infrastructure and updates the application state.
     * @returns {void}
     */
    function fetchBranches() {
        tenantApi.getBranches().then(response => {
            branches.value = BranchAssembler.toEntitiesFromResponse(response);
            branchesLoaded.value = true;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Finds a branch entity by identifier.
     * @param {number|string} id - Branch identifier.
     * @returns {Branch|undefined} Matching branch, if available.
     */
    function getBranchById(id) {
        let idNum = parseInt(id);
        return branches.value.find(branch => branch["id"] === idNum || branch["id"] === id);
    }

    /**
     * Creates a branch through infrastructure and appends it to local state.
     * @param {Branch} branch - Branch entity to persist.
     * @returns {void}
     */
    function addBranch(branch) {
        tenantApi.createBranch(branch).then(response => {
            const resource = response.data;
            const newBranch = BranchAssembler.toEntityFromResource(resource);
            branches.value.push(newBranch);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Updates an existing branch and synchronizes local state.
     * @param {Branch} branch - Branch entity with updated data.
     * @returns {void}
     */
    function updateBranch(branch) {
        tenantApi.updateBranch(branch).then(response => {
            const resource = response.data;
            const updatedBranch = BranchAssembler.toEntityFromResource(resource);
            const index = branches.value.findIndex(b => b["id"] === updatedBranch.id);
            if (index !== -1) branches.value[index] = updatedBranch;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Deletes a branch and removes it from local state.
     * @param {Branch} branch - Branch entity to remove.
     * @returns {void}
     */
    function deleteBranch(branch) {
        tenantApi.deleteBranch(branch.id).then(() => {
            const index = branches.value.findIndex(b => b["id"] === branch.id);
            if (index !== -1) branches.value.splice(index, 1);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Loads appointment fees from infrastructure and updates the application state.
     * @returns {void}
     */
    function fetchAppointmentFees() {
        tenantApi.getAppointmentFees().then(response => {
            appointmentFees.value = AppointmentFeeAssembler.toEntitiesFromResponse(response);
            appointmentFeesLoaded.value = true;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Finds an appointment fee entity by identifier.
     * @param {number|string} id - Appointment fee identifier.
     * @returns {AppointmentFee|undefined} Matching appointment fee, if available.
     */
    function getAppointmentFeeById(id) {
        let idNum = parseInt(id);
        return appointmentFees.value.find(appointmentFee => appointmentFee["id"] === idNum || appointmentFee["id"] === id);
    }

    /**
     * Creates an appointment fee through infrastructure and appends it to local state.
     * @param {AppointmentFee} appointmentFee - Appointment fee entity to persist.
     * @returns {void}
     */
    function addAppointmentFee(appointmentFee) {
        tenantApi.createAppointmentFee(appointmentFee).then(response => {
            const resource = response.data;
            const newAppointmentFee = AppointmentFeeAssembler.toEntityFromResource(resource);
            appointmentFees.value.push(newAppointmentFee);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Updates an existing appointment fee and synchronizes local state.
     * @param {AppointmentFee} appointmentFee - Appointment fee entity with updated data.
     * @returns {void}
     */
    function updateAppointmentFee(appointmentFee) {
        tenantApi.updateAppointmentFee(appointmentFee).then(response => {
            const resource = response.data;
            const updatedAppointmentFee = AppointmentFeeAssembler.toEntityFromResource(resource);
            const index = appointmentFees.value.findIndex(a => a["id"] === updatedAppointmentFee.id);
            if (index !== -1) appointmentFees.value[index] = updatedAppointmentFee;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Deletes an appointment fee and removes it from local state.
     * @param {AppointmentFee} appointmentFee - Appointment fee entity to remove.
     * @returns {void}
     */
    function deleteAppointmentFee(appointmentFee) {
        tenantApi.deleteAppointmentFee(appointmentFee.id).then(() => {
            const index = appointmentFees.value.findIndex(a => a["id"] === appointmentFee.id);
            if (index !== -1) appointmentFees.value.splice(index, 1);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    return {
        users,
        healthcareCenters,
        branches,
        appointmentFees,
        errors,
        usersLoaded,
        healthcareCentersLoaded,
        branchesLoaded,
        appointmentFeesLoaded,
        usersCount,
        healthcareCentersCount,
        branchesCount,
        appointmentFeesCount,
        fetchUsers,
        fetchHealthcareCenters,
        fetchBranches,
        fetchAppointmentFees,
        getUserById,
        addUser,
        updateUser,
        deleteUser,
        getHealthcareCenterById,
        addHealthcareCenter,
        updateHealthcareCenter,
        deleteHealthcareCenter,
        getBranchById,
        addBranch,
        updateBranch,
        deleteBranch,
        getAppointmentFeeById,
        addAppointmentFee,
        updateAppointmentFee,
        deleteAppointmentFee
    };
});

export default useTenantStore;
