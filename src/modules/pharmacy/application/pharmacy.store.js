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

    /** @type {import('vue').Ref<Array<{branchId: string, medicineId: string, stock: number, price: number}>>} */
    const branchMedicines = ref([]);

    const medicinesCount = computed(() => medicinesLoaded.value ? medicines.value.length : 0);

    let orderIdCounter = 0;

    function findById(collection, id) {
        return collection.value.find(resource => String(resource["id"]) === String(id));
    }

    function pushError(error) {
        errors.value.push(error);
    }

    function fetchMedicines() {
        pharmacyApi.getMedicines().then(response => {
            medicines.value = MedicineAssembler.toEntitiesFromResponse(response);
            medicinesLoaded.value = true;
            fetchBranchMedicines();
        }).catch(error => {
            pushError(error);
        });
    }

    function fetchBranchMedicines(branchId) {
        pharmacyApi.getBranchMedicines(branchId).then(response => {
            const raw = response.data;
            branchMedicines.value = Array.isArray(raw) ? raw : (raw?.value ?? []);
        }).catch(error => {
            pushError(error);
        });
    }

    function getMedicineById(id) {
        return findById(medicines, id);
    }

    function addMedicine(medicine) {
        const existingMedicine = medicines.value.find(item => String(item.id) === String(medicine.id));
        if (existingMedicine && medicine.branchId) {
            pharmacyApi.createBranchMedicine({
                branchId: medicine.branchId,
                medicineId: existingMedicine.id,
                stock: Number(medicine.stock) || 0,
                price: Number(medicine.price) || 0
            }).then(() => {
                fetchBranchMedicines();
            }).catch(error => {
                pushError(error);
            });
            return;
        }

        pharmacyApi.createMedicine(medicine).then(response => {
            const newMedicine = MedicineAssembler.toEntityFromResource(response.data);
            if (medicine.branchId) {
                pharmacyApi.createBranchMedicine({
                    branchId: medicine.branchId,
                    medicineId: newMedicine.id,
                    stock: 0,
                    price: Number(medicine.price) || 0
                }).then(() => {
                    fetchBranchMedicines();
                }).catch(error => {
                    pushError(error);
                    fetchBranchMedicines();
                });
            } else {
                fetchBranchMedicines();
            }
        }).catch(error => {
            pushError(error);
        });
    }

    function updateMedicine(medicine) {
        const newBranchId = medicine.branchId ? String(medicine.branchId) : null;
        const oldBm = branchMedicines.value.find(bm =>
            String(bm.medicineId) === String(medicine.id) && String(bm.branchId) === newBranchId
        ) || branchMedicines.value.find(bm => String(bm.medicineId) === String(medicine.id));
        const oldBranchId = oldBm ? String(oldBm.branchId) : null;

        pharmacyApi.updateMedicine(medicine).then(response => {
            const updatedMedicine = MedicineAssembler.toEntityFromResource(response.data);
            const index = medicines.value.findIndex(m => m["id"] === updatedMedicine.id);
            if (index !== -1) medicines.value[index] = updatedMedicine;

            const handleBranchMedicine = async () => {
                if (oldBranchId && oldBranchId !== newBranchId) {
                    await pharmacyApi.deleteBranchMedicine(oldBranchId, medicine.id).catch(() => {});
                    await pharmacyApi.createBranchMedicine({
                        branchId: newBranchId, medicineId: medicine.id,
                        stock: Number(medicine.stock) || 0, price: Number(medicine.price) || 0
                    }).catch(() => {});
                } else if (oldBranchId && newBranchId) {
                    await pharmacyApi.updateBranchMedicine(oldBranchId, medicine.id, {
                        branchId: oldBranchId, medicineId: medicine.id,
                        stock: Number(medicine.stock) || 0, price: Number(medicine.price) || 0
                    }).catch(() => {});
                } else if (newBranchId) {
                    await pharmacyApi.createBranchMedicine({
                        branchId: newBranchId, medicineId: medicine.id,
                        stock: Number(medicine.stock) || 0, price: Number(medicine.price) || 0
                    }).catch(() => {});
                }
                await fetchBranchMedicines();
            };
            handleBranchMedicine();
        }).catch(error => {
            pushError(error);
        });
    }

    function deleteMedicine(medicine) {
        const medicineId = String(medicine.id);
        const branchId = medicine.branchId ? String(medicine.branchId) : "";

        if (branchId) {
            pharmacyApi.deleteBranchMedicine(branchId, medicine.id)
                .catch(error => pushError(error))
                .finally(() => {
                    branchMedicines.value = branchMedicines.value.filter(bm =>
                        !(String(bm.medicineId) === medicineId && String(bm.branchId) === branchId)
                    );
                    medicines.value = medicines.value.filter(m =>
                        !(String(m.id) === medicineId && String(m.branchId || "") === branchId)
                    );
                });
            return;
        }

        const relatedBms = branchMedicines.value.filter(bm => String(bm.medicineId) === medicineId);
        const deleteAll = relatedBms.map(bm =>
            pharmacyApi.deleteBranchMedicine(bm.branchId, medicine.id).catch(error => pushError(error))
        );
        Promise.all(deleteAll)
            .then(() => pharmacyApi.deleteMedicine(medicine.id))
            .catch(error => pushError(error))
            .finally(() => {
                branchMedicines.value = branchMedicines.value.filter(bm => String(bm.medicineId) !== medicineId);
                medicines.value = medicines.value.filter(m => String(m.id) !== medicineId);
            });
    }

    function replenishStock(medicine, quantity) {
        const previousStock = Number(medicine.stock) || 0;
        const newStock = previousStock + quantity;
        const branchId = medicine.branchId ? String(medicine.branchId) : "";

        const updateStock = branchId
            ? pharmacyApi.updateBranchMedicine(branchId, medicine.id, {
                branchId,
                medicineId: medicine.id,
                stock: newStock,
                price: Number(medicine.price) || 0
            })
            : pharmacyApi.updateMedicine({...medicine, stock: newStock});

        return updateStock.then(() => {
            if (branchId) {
                const branchMedicine = branchMedicines.value.find(bm =>
                    String(bm.branchId) === branchId && String(bm.medicineId) === String(medicine.id)
                );
                if (branchMedicine) branchMedicine.stock = newStock;
            }

            orderIdCounter++;
            const order = {
                id: `ord-${orderIdCounter}-${Date.now()}`,
                branchId,
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
        branchMedicines,
        fetchMedicines,
        fetchBranchMedicines,
        getMedicineById,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        replenishStock
    };
});

export default usePharmacyStore;
