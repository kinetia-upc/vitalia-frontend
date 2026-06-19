/**
 * Application service store for the Pharmacy bounded context.
 * It coordinates pharmacy use cases and keeps UI-facing state.
 *
 * @module usePharmacyStore
 */
import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {PharmacyApi} from "../infrastructure/pharmacy-api.js";
import {MedicineAssembler} from "../infrastructure/medicine.assembler.js";
import {Medicine} from "../domain/model/medicine.entity.js";

const pharmacyApi = new PharmacyApi();

/**
 * Reactive store that exposes Pharmacy commands and queries.
 *
 * @returns {Object} Store state and actions.
 */
const usePharmacyStore = defineStore("pharmacy", () => {
    /** @type {import('vue').Ref<Medicine[]>} */
    const medicines = ref([]);
    /** @type {import('vue').Ref<Error[]>} */
    const errors = ref([]);

    /** @type {import('vue').Ref<boolean>} */
    const medicinesLoaded = ref(false);

    /** @type {import('vue').Ref<Array<{id: string, medicineId: string|number, medicineName: string, quantity: number, previousStock: number, newStock: number, date: string}>>} */
    const orders = ref([]);

    const medicinesCount = computed(() => medicinesLoaded.value ? medicines.value.length : 0);

    let orderIdCounter = 0;

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

    function fetchMedicines() {
        pharmacyApi.getMedicines().then(response => {
            medicines.value = MedicineAssembler.toEntitiesFromResponse(response);
            medicinesLoaded.value = true;
        }).catch(error => {
            pushError(error);
        });
    }

    function getMedicineById(id) {
        return findById(medicines, id);
    }

    function addMedicine(medicine) {
        pharmacyApi.createMedicine(medicine).then(response => {
            const newMedicine = MedicineAssembler.toEntityFromResource(response.data);
            medicines.value.push(newMedicine);
        }).catch(error => {
            pushError(error);
        });
    }

    function updateMedicine(medicine) {
        pharmacyApi.updateMedicine(medicine).then(response => {
            const updatedMedicine = MedicineAssembler.toEntityFromResource(response.data);
            const index = medicines.value.findIndex(m => m["id"] === updatedMedicine.id);
            if (index !== -1) medicines.value[index] = updatedMedicine;
        }).catch(error => {
            pushError(error);
        });
    }

    function deleteMedicine(medicine) {
        pharmacyApi.deleteMedicine(medicine.id).then(() => {
            const index = medicines.value.findIndex(m => m["id"] === medicine.id);
            if (index !== -1) medicines.value.splice(index, 1);
        }).catch(error => {
            pushError(error);
        });
    }

    function replenishStock(medicine, quantity) {
        const previousStock = Number(medicine.stock) || 0;
        const newStock = previousStock + quantity;
        const updatedMedicine = {...medicine, stock: newStock};
        return pharmacyApi.updateMedicine(updatedMedicine).then(response => {
            const updated = MedicineAssembler.toEntityFromResource(response.data);
            const index = medicines.value.findIndex(m => m["id"] === updated.id);
            if (index !== -1) medicines.value[index] = updated;
            orderIdCounter++;
            const order = {
                id: `ord-${orderIdCounter}-${Date.now()}`,
                medicineId: medicine.id,
                medicineName: medicine.name,
                quantity,
                previousStock,
                newStock,
                date: new Date().toISOString()
            };
            orders.value.unshift(order);
            return order;
        }).catch(error => {
            pushError(error);
            throw error;
        });
    }

    return {
        medicines,
        errors,
        medicinesLoaded,
        medicinesCount,
        orders,
        fetchMedicines,
        getMedicineById,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        replenishStock
    };
});

export default usePharmacyStore;
