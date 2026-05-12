/**
 * Application service store for the Pharmacy bounded context.
 * It coordinates pharmacy and inventory use cases and keeps UI-facing state.
 *
 * @module usePharmacyStore
 */
import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {PharmacyApi} from "../infrastructure/pharmacy-api.js";
import {MedicationAssembler} from "../infrastructure/medication.assembler.js";
import {MedicationInventoryAssembler} from "../infrastructure/medicationInventory.assembler.js";
import {MedicationBatchAssembler} from "../infrastructure/medicationBatch.assembler.js";
import {InventoryMovementAssembler} from "../infrastructure/inventoryMovement.assembler.js";
import {DispensingAssembler} from "../infrastructure/dispensing.assembler.js";
import {DispensingItemAssembler} from "../infrastructure/dispensingItem.assembler.js";
import {StockAlertAssembler} from "../infrastructure/stockAlert.assembler.js";
import {Medication} from "../domain/model/medication.entity.js";
import {MedicationInventory} from "../domain/model/medicationInventory.entity.js";
import {MedicationBatch} from "../domain/model/medicationBatch.entity.js";
import {InventoryMovement} from "../domain/model/inventoryMovement.entity.js";
import {Dispensing} from "../domain/model/dispensing.entity.js";
import {DispensingItem} from "../domain/model/dispensingItem.entity.js";
import {StockAlert} from "../domain/model/stockAlert.entity.js";

const pharmacyApi = new PharmacyApi();

/**
 * Reactive store that exposes Pharmacy commands and queries.
 *
 * @returns {Object} Store state and actions.
 */
const usePharmacyStore = defineStore("pharmacy", () => {
    /** @type {import('vue').Ref<Medication[]>} */
    const medications = ref([]);
    /** @type {import('vue').Ref<MedicationInventory[]>} */
    const medicationInventories = ref([]);
    /** @type {import('vue').Ref<MedicationBatch[]>} */
    const medicationBatches = ref([]);
    /** @type {import('vue').Ref<InventoryMovement[]>} */
    const inventoryMovements = ref([]);
    /** @type {import('vue').Ref<Dispensing[]>} */
    const dispensings = ref([]);
    /** @type {import('vue').Ref<DispensingItem[]>} */
    const dispensingItems = ref([]);
    /** @type {import('vue').Ref<StockAlert[]>} */
    const stockAlerts = ref([]);
    /** @type {import('vue').Ref<Error[]>} */
    const errors = ref([]);

    /** @type {import('vue').Ref<boolean>} */
    const medicationsLoaded = ref(false);
    /** @type {import('vue').Ref<boolean>} */
    const medicationInventoriesLoaded = ref(false);
    /** @type {import('vue').Ref<boolean>} */
    const medicationBatchesLoaded = ref(false);
    /** @type {import('vue').Ref<boolean>} */
    const inventoryMovementsLoaded = ref(false);
    /** @type {import('vue').Ref<boolean>} */
    const dispensingsLoaded = ref(false);
    /** @type {import('vue').Ref<boolean>} */
    const dispensingItemsLoaded = ref(false);
    /** @type {import('vue').Ref<boolean>} */
    const stockAlertsLoaded = ref(false);

    const medicationsCount = computed(() => medicationsLoaded.value ? medications.value.length : 0);
    const medicationInventoriesCount = computed(() => medicationInventoriesLoaded.value ? medicationInventories.value.length : 0);
    const medicationBatchesCount = computed(() => medicationBatchesLoaded.value ? medicationBatches.value.length : 0);
    const inventoryMovementsCount = computed(() => inventoryMovementsLoaded.value ? inventoryMovements.value.length : 0);
    const dispensingsCount = computed(() => dispensingsLoaded.value ? dispensings.value.length : 0);
    const dispensingItemsCount = computed(() => dispensingItemsLoaded.value ? dispensingItems.value.length : 0);
    const stockAlertsCount = computed(() => stockAlertsLoaded.value ? stockAlerts.value.length : 0);

    function parseId(id) {
        const idNum = parseInt(id);
        return Number.isNaN(idNum) ? id : idNum;
    }

    function findById(collection, id) {
        const parsedId = parseId(id);
        return collection.value.find(resource => resource["id"] === parsedId);
    }

    function pushError(error) {
        errors.value.push(error);
    }

    function fetchMedications() {
        pharmacyApi.getMedications().then(response => {
            medications.value = MedicationAssembler.toEntitiesFromResponse(response);
            medicationsLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function getMedicationById(id) {
        return findById(medications, id);
    }

    function addMedication(medication) {
        pharmacyApi.createMedication(medication).then(response => {
            const newMedication = MedicationAssembler.toEntityFromResource(response.data);
            medications.value.push(newMedication);
        }).catch(error => {
            pushError(error);
        });
    }

    function updateMedication(medication) {
        pharmacyApi.updateMedication(medication).then(response => {
            const updatedMedication = MedicationAssembler.toEntityFromResource(response.data);
            const index = medications.value.findIndex(m => m["id"] === updatedMedication.id);
            if (index !== -1) medications.value[index] = updatedMedication;
        }).catch(error => {
            pushError(error);
        });
    }

    function deleteMedication(medication) {
        pharmacyApi.deleteMedication(medication.id).then(() => {
            const index = medications.value.findIndex(m => m["id"] === medication.id);
            if (index !== -1) medications.value.splice(index, 1);
        }).catch(error => {
            pushError(error);
        });
    }

    function fetchMedicationInventories() {
        pharmacyApi.getMedicationInventories().then(response => {
            medicationInventories.value = MedicationInventoryAssembler.toEntitiesFromResponse(response);
            medicationInventoriesLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function getMedicationInventoryById(id) {
        return findById(medicationInventories, id);
    }

    function addMedicationInventory(medicationInventory) {
        pharmacyApi.createMedicationInventory(medicationInventory).then(response => {
            const newMedicationInventory = MedicationInventoryAssembler.toEntityFromResource(response.data);
            medicationInventories.value.push(newMedicationInventory);
        }).catch(error => {
            pushError(error);
        });
    }

    function updateMedicationInventory(medicationInventory) {
        pharmacyApi.updateMedicationInventory(medicationInventory).then(response => {
            const updatedMedicationInventory = MedicationInventoryAssembler.toEntityFromResource(response.data);
            const index = medicationInventories.value.findIndex(mi => mi["id"] === updatedMedicationInventory.id);
            if (index !== -1) medicationInventories.value[index] = updatedMedicationInventory;
        }).catch(error => {
            pushError(error);
        });
    }

    function deleteMedicationInventory(medicationInventory) {
        pharmacyApi.deleteMedicationInventory(medicationInventory.id).then(() => {
            const index = medicationInventories.value.findIndex(mi => mi["id"] === medicationInventory.id);
            if (index !== -1) medicationInventories.value.splice(index, 1);
        }).catch(error => {
            pushError(error);
        });
    }

    function fetchMedicationBatches() {
        pharmacyApi.getMedicationBatches().then(response => {
            medicationBatches.value = MedicationBatchAssembler.toEntitiesFromResponse(response);
            medicationBatchesLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function getMedicationBatchById(id) {
        return findById(medicationBatches, id);
    }

    function addMedicationBatch(medicationBatch) {
        pharmacyApi.createMedicationBatch(medicationBatch).then(response => {
            const newMedicationBatch = MedicationBatchAssembler.toEntityFromResource(response.data);
            medicationBatches.value.push(newMedicationBatch);
        }).catch(error => {
            pushError(error);
        });
    }

    function updateMedicationBatch(medicationBatch) {
        pharmacyApi.updateMedicationBatch(medicationBatch).then(response => {
            const updatedMedicationBatch = MedicationBatchAssembler.toEntityFromResource(response.data);
            const index = medicationBatches.value.findIndex(mb => mb["id"] === updatedMedicationBatch.id);
            if (index !== -1) medicationBatches.value[index] = updatedMedicationBatch;
        }).catch(error => {
            pushError(error);
        });
    }

    function deleteMedicationBatch(medicationBatch) {
        pharmacyApi.deleteMedicationBatch(medicationBatch.id).then(() => {
            const index = medicationBatches.value.findIndex(mb => mb["id"] === medicationBatch.id);
            if (index !== -1) medicationBatches.value.splice(index, 1);
        }).catch(error => {
            pushError(error);
        });
    }

    function fetchInventoryMovements() {
        pharmacyApi.getInventoryMovements().then(response => {
            inventoryMovements.value = InventoryMovementAssembler.toEntitiesFromResponse(response);
            inventoryMovementsLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function getInventoryMovementById(id) {
        return findById(inventoryMovements, id);
    }

    function addInventoryMovement(inventoryMovement) {
        pharmacyApi.createInventoryMovement(inventoryMovement).then(response => {
            const newInventoryMovement = InventoryMovementAssembler.toEntityFromResource(response.data);
            inventoryMovements.value.push(newInventoryMovement);
        }).catch(error => {
            pushError(error);
        });
    }

    function updateInventoryMovement(inventoryMovement) {
        pharmacyApi.updateInventoryMovement(inventoryMovement).then(response => {
            const updatedInventoryMovement = InventoryMovementAssembler.toEntityFromResource(response.data);
            const index = inventoryMovements.value.findIndex(im => im["id"] === updatedInventoryMovement.id);
            if (index !== -1) inventoryMovements.value[index] = updatedInventoryMovement;
        }).catch(error => {
            pushError(error);
        });
    }

    function deleteInventoryMovement(inventoryMovement) {
        pharmacyApi.deleteInventoryMovement(inventoryMovement.id).then(() => {
            const index = inventoryMovements.value.findIndex(im => im["id"] === inventoryMovement.id);
            if (index !== -1) inventoryMovements.value.splice(index, 1);
        }).catch(error => {
            pushError(error);
        });
    }

    function fetchDispensings() {
        pharmacyApi.getDispensings().then(response => {
            dispensings.value = DispensingAssembler.toEntitiesFromResponse(response);
            dispensingsLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function getDispensingById(id) {
        return findById(dispensings, id);
    }

    function addDispensing(dispensing) {
        pharmacyApi.createDispensing(dispensing).then(response => {
            const newDispensing = DispensingAssembler.toEntityFromResource(response.data);
            dispensings.value.push(newDispensing);
        }).catch(error => {
            pushError(error);
        });
    }

    function updateDispensing(dispensing) {
        pharmacyApi.updateDispensing(dispensing).then(response => {
            const updatedDispensing = DispensingAssembler.toEntityFromResource(response.data);
            const index = dispensings.value.findIndex(d => d["id"] === updatedDispensing.id);
            if (index !== -1) dispensings.value[index] = updatedDispensing;
        }).catch(error => {
            pushError(error);
        });
    }

    function deleteDispensing(dispensing) {
        pharmacyApi.deleteDispensing(dispensing.id).then(() => {
            const index = dispensings.value.findIndex(d => d["id"] === dispensing.id);
            if (index !== -1) dispensings.value.splice(index, 1);
        }).catch(error => {
            pushError(error);
        });
    }

    function fetchDispensingItems() {
        pharmacyApi.getDispensingItems().then(response => {
            dispensingItems.value = DispensingItemAssembler.toEntitiesFromResponse(response);
            dispensingItemsLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function getDispensingItemById(id) {
        return findById(dispensingItems, id);
    }

    function addDispensingItem(dispensingItem) {
        pharmacyApi.createDispensingItem(dispensingItem).then(response => {
            const newDispensingItem = DispensingItemAssembler.toEntityFromResource(response.data);
            dispensingItems.value.push(newDispensingItem);
        }).catch(error => {
            pushError(error);
        });
    }

    function updateDispensingItem(dispensingItem) {
        pharmacyApi.updateDispensingItem(dispensingItem).then(response => {
            const updatedDispensingItem = DispensingItemAssembler.toEntityFromResource(response.data);
            const index = dispensingItems.value.findIndex(di => di["id"] === updatedDispensingItem.id);
            if (index !== -1) dispensingItems.value[index] = updatedDispensingItem;
        }).catch(error => {
            pushError(error);
        });
    }

    function deleteDispensingItem(dispensingItem) {
        pharmacyApi.deleteDispensingItem(dispensingItem.id).then(() => {
            const index = dispensingItems.value.findIndex(di => di["id"] === dispensingItem.id);
            if (index !== -1) dispensingItems.value.splice(index, 1);
        }).catch(error => {
            pushError(error);
        });
    }

    function fetchStockAlerts() {
        pharmacyApi.getStockAlerts().then(response => {
            stockAlerts.value = StockAlertAssembler.toEntitiesFromResponse(response);
            stockAlertsLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function getStockAlertById(id) {
        return findById(stockAlerts, id);
    }

    function addStockAlert(stockAlert) {
        pharmacyApi.createStockAlert(stockAlert).then(response => {
            const newStockAlert = StockAlertAssembler.toEntityFromResource(response.data);
            stockAlerts.value.push(newStockAlert);
        }).catch(error => {
            pushError(error);
        });
    }

    function updateStockAlert(stockAlert) {
        pharmacyApi.updateStockAlert(stockAlert).then(response => {
            const updatedStockAlert = StockAlertAssembler.toEntityFromResource(response.data);
            const index = stockAlerts.value.findIndex(sa => sa["id"] === updatedStockAlert.id);
            if (index !== -1) stockAlerts.value[index] = updatedStockAlert;
        }).catch(error => {
            pushError(error);
        });
    }

    function deleteStockAlert(stockAlert) {
        pharmacyApi.deleteStockAlert(stockAlert.id).then(() => {
            const index = stockAlerts.value.findIndex(sa => sa["id"] === stockAlert.id);
            if (index !== -1) stockAlerts.value.splice(index, 1);
        }).catch(error => {
            pushError(error);
        });
    }

    return {
        medications,
        medicationInventories,
        medicationBatches,
        inventoryMovements,
        dispensings,
        dispensingItems,
        stockAlerts,
        errors,
        medicationsLoaded,
        medicationInventoriesLoaded,
        medicationBatchesLoaded,
        inventoryMovementsLoaded,
        dispensingsLoaded,
        dispensingItemsLoaded,
        stockAlertsLoaded,
        medicationsCount,
        medicationInventoriesCount,
        medicationBatchesCount,
        inventoryMovementsCount,
        dispensingsCount,
        dispensingItemsCount,
        stockAlertsCount,
        fetchMedications,
        getMedicationById,
        addMedication,
        updateMedication,
        deleteMedication,
        fetchMedicationInventories,
        getMedicationInventoryById,
        addMedicationInventory,
        updateMedicationInventory,
        deleteMedicationInventory,
        fetchMedicationBatches,
        getMedicationBatchById,
        addMedicationBatch,
        updateMedicationBatch,
        deleteMedicationBatch,
        fetchInventoryMovements,
        getInventoryMovementById,
        addInventoryMovement,
        updateInventoryMovement,
        deleteInventoryMovement,
        fetchDispensings,
        getDispensingById,
        addDispensing,
        updateDispensing,
        deleteDispensing,
        fetchDispensingItems,
        getDispensingItemById,
        addDispensingItem,
        updateDispensingItem,
        deleteDispensingItem,
        fetchStockAlerts,
        getStockAlertById,
        addStockAlert,
        updateStockAlert,
        deleteStockAlert
    };
});

export default usePharmacyStore;