import {BaseApi} from "../../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../../shared/infrastructure/base-endpoint.js";

const medicationsEndpointPath = import.meta.env.VITE_VITALIA_MEDICATION_ENDPOINT_PATH
    ?? "/medication";
const medicationInventoriesEndpointPath = import.meta.env.VITE_VITALIA_MEDICATION_INVENTORY_ENDPOINT_PATH
    ?? "/medication-inventory";
const medicationBatchesEndpointPath = import.meta.env.VITE_VITALIA_MEDICATION_BATCH_ENDPOINT_PATH
    ?? "/medication-batch";
const inventoryMovementsEndpointPath = import.meta.env.VITE_VITALIA_INVENTORY_MOVEMENT_ENDPOINT_PATH
    ?? "/inventory-movement";
const dispensingsEndpointPath = import.meta.env.VITE_VITALIA_DISPENSING_ENDPOINT_PATH
    ?? "/dispensing";
const dispensingItemsEndpointPath = import.meta.env.VITE_VITALIA_DISPENSING_ITEM_ENDPOINT_PATH
    ?? "/dispensing-item";
const stockAlertsEndpointPath = import.meta.env.VITE_VITALIA_STOCK_ALERT_ENDPOINT_PATH
    ?? "/stock-alert";

export class PharmacyApi extends BaseApi {
    #medicationsEndpoint;
    #medicationInventoriesEndpoint;
    #medicationBatchesEndpoint;
    #inventoryMovementsEndpoint;
    #dispensingsEndpoint;
    #dispensingItemsEndpoint;
    #stockAlertsEndpoint;

    constructor() {
        super();
        this.#medicationsEndpoint = new BaseEndpoint(this, medicationsEndpointPath);
        this.#medicationInventoriesEndpoint = new BaseEndpoint(this, medicationInventoriesEndpointPath);
        this.#medicationBatchesEndpoint = new BaseEndpoint(this, medicationBatchesEndpointPath);
        this.#inventoryMovementsEndpoint = new BaseEndpoint(this, inventoryMovementsEndpointPath);
        this.#dispensingsEndpoint = new BaseEndpoint(this, dispensingsEndpointPath);
        this.#dispensingItemsEndpoint = new BaseEndpoint(this, dispensingItemsEndpointPath);
        this.#stockAlertsEndpoint = new BaseEndpoint(this, stockAlertsEndpointPath);
    }

    getMedications() {
        return this.#medicationsEndpoint.getAll();
    }

    getMedicationById(id) {
        return this.#medicationsEndpoint.getById(id);
    }

    createMedication(resource) {
        return this.#medicationsEndpoint.create(resource);
    }

    updateMedication(resource) {
        return this.#medicationsEndpoint.update(resource.id, resource);
    }

    deleteMedication(id) {
        return this.#medicationsEndpoint.delete(id);
    }

    getMedicationInventories() {
        return this.#medicationInventoriesEndpoint.getAll();
    }

    getMedicationInventoryById(id) {
        return this.#medicationInventoriesEndpoint.getById(id);
    }

    createMedicationInventory(resource) {
        return this.#medicationInventoriesEndpoint.create(resource);
    }

    updateMedicationInventory(resource) {
        return this.#medicationInventoriesEndpoint.update(resource.id, resource);
    }

    deleteMedicationInventory(id) {
        return this.#medicationInventoriesEndpoint.delete(id);
    }

    getMedicationBatches() {
        return this.#medicationBatchesEndpoint.getAll();
    }

    getMedicationBatchById(id) {
        return this.#medicationBatchesEndpoint.getById(id);
    }

    createMedicationBatch(resource) {
        return this.#medicationBatchesEndpoint.create(resource);
    }

    updateMedicationBatch(resource) {
        return this.#medicationBatchesEndpoint.update(resource.id, resource);
    }

    deleteMedicationBatch(id) {
        return this.#medicationBatchesEndpoint.delete(id);
    }

    getInventoryMovements() {
        return this.#inventoryMovementsEndpoint.getAll();
    }

    getInventoryMovementById(id) {
        return this.#inventoryMovementsEndpoint.getById(id);
    }

    createInventoryMovement(resource) {
        return this.#inventoryMovementsEndpoint.create(resource);
    }

    updateInventoryMovement(resource) {
        return this.#inventoryMovementsEndpoint.update(resource.id, resource);
    }

    deleteInventoryMovement(id) {
        return this.#inventoryMovementsEndpoint.delete(id);
    }

    getDispensings() {
        return this.#dispensingsEndpoint.getAll();
    }

    getDispensingById(id) {
        return this.#dispensingsEndpoint.getById(id);
    }

    createDispensing(resource) {
        return this.#dispensingsEndpoint.create(resource);
    }

    updateDispensing(resource) {
        return this.#dispensingsEndpoint.update(resource.id, resource);
    }

    deleteDispensing(id) {
        return this.#dispensingsEndpoint.delete(id);
    }

    getDispensingItems() {
        return this.#dispensingItemsEndpoint.getAll();
    }

    getDispensingItemById(id) {
        return this.#dispensingItemsEndpoint.getById(id);
    }

    createDispensingItem(resource) {
        return this.#dispensingItemsEndpoint.create(resource);
    }

    updateDispensingItem(resource) {
        return this.#dispensingItemsEndpoint.update(resource.id, resource);
    }

    deleteDispensingItem(id) {
        return this.#dispensingItemsEndpoint.delete(id);
    }

    getStockAlerts() {
        return this.#stockAlertsEndpoint.getAll();
    }

    getStockAlertById(id) {
        return this.#stockAlertsEndpoint.getById(id);
    }

    createStockAlert(resource) {
        return this.#stockAlertsEndpoint.create(resource);
    }

    updateStockAlert(resource) {
        return this.#stockAlertsEndpoint.update(resource.id, resource);
    }

    deleteStockAlert(id) {
        return this.#stockAlertsEndpoint.delete(id);
    }
}