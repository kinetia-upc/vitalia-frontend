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
import useTenantStore from "../../tenant/application/tenant.store.js";

const pharmacyApi = new PharmacyApi();

/**
 * Reactive store that exposes Pharmacy commands and queries.
 *
 * @returns {Object} Store state and actions.
 */
const usePharmacyStore = defineStore("pharmacy", () => {
    const tenantStore = useTenantStore();
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
            fetchBranchMedicines();
        }).catch(error => {
            pushError(error);
        });
    }

    function fetchBranchMedicines(branchId) {
        pharmacyApi.getBranchMedicines(branchId).then(response => {
            const raw = response.data;
            branchMedicines.value = Array.isArray(raw) ? raw : (raw?.value ?? []);
            mergeBranchMedicinesIntoMedicines();
        }).catch(error => {
            pushError(error);
        });
    }

    function mergeBranchMedicinesIntoMedicines() {
        const medDataMap = {};
        medicines.value.forEach(medicine => {
            medDataMap[String(medicine.id)] = medicine;
        });

        const seen = new Set();
        const merged = [];

        branchMedicines.value.forEach(bm => {
            const medId = String(bm.medicineId);
            const medicine = medDataMap[medId];
            if (!medicine) return;
            const key = `${medId}__${bm.branchId}`;
            seen.add(key);
            merged.push(new Medicine({
                ...medicine,
                price: bm.price ?? 0,
                stock: bm.stock ?? 0,
                branchId: String(bm.branchId)
            }));
        });

        Object.values(medDataMap).forEach(medicine => {
            const medId = String(medicine.id);
            const hasAny = branchMedicines.value.some(bm => String(bm.medicineId) === medId);
            if (!hasAny) {
                merged.push(new Medicine({
                    ...medicine,
                    price: 0,
                    stock: 0,
                    branchId: ""
                }));
            }
        });

        medicines.value = merged;
    }

    function getMedicineById(id) {
        return findById(medicines, id);
    }

    function addMedicine(medicine) {
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
            updatedMedicine.price = Number(medicine.price) || 0;
            updatedMedicine.stock = Number(medicine.stock) || 0;
            updatedMedicine.branchId = newBranchId || oldBranchId || "";
            const branch = tenantStore.branches.find(b => String(b.id) === updatedMedicine.branchId);
            updatedMedicine.branchName = branch?.branchName || "";

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
        const relatedBms = branchMedicines.value.filter(bm => String(bm.medicineId) === String(medicine.id));
        const deleteAll = relatedBms.map(bm =>
            pharmacyApi.deleteBranchMedicine(bm.branchId, medicine.id).catch(() => {})
        );
        Promise.all(deleteAll).then(() => {
            return pharmacyApi.deleteMedicine(medicine.id);
        }).then(() => {
            fetchBranchMedicines();
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
