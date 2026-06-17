import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAuthStore = defineStore("auth", () => {
    // Para probar diferentes usuarios, cambia el id y rol aquí
    const currentUser = ref({
        id: "doc-001",
        role: "doctor",
    });

    const currentUserId = computed(() => currentUser.value.id);
    const currentUserRole = computed(() => currentUser.value.role);

    function setCurrentUser(id, role) {
        currentUser.value = { id, role };
    }

    return {
        currentUser,
        currentUserId,
        currentUserRole,
        setCurrentUser,
    };
});
