import { defineStore } from "pinia";
import { computed, ref } from "vue";
import iamApi from "../infrastructure/iam-api.js";
import { IamAccountAssembler } from "../infrastructure/iam-account.assembler.js";

const sessionKey = "vitalia.iam.session";
const lastRouteKey = "vitalia.iam.lastRoute";

function readStoredSession() {
    try {
        const value = JSON.parse(localStorage.getItem(sessionKey) ?? "null");
        return value && value.role && value.token ? value : null;
    } catch {
        return null;
    }
}

function persistSession(account) {
    if (!account) {
        localStorage.removeItem(sessionKey);
        return;
    }

    localStorage.setItem(sessionKey, JSON.stringify(IamAccountAssembler.toSessionResource(account)));
}

function readStoredLastRoute() {
    return localStorage.getItem(lastRouteKey) ?? "";
}

function persistLastRoute(path) {
    if (!path) {
        localStorage.removeItem(lastRouteKey);
        return;
    }

    localStorage.setItem(lastRouteKey, path);
}

export const useIamStore = defineStore("iam", () => {
    const currentUser = ref(readStoredSession());
    const loading = ref(false);
    const error = ref("");
    const resetEmail = ref("");
    const resetCode = ref("");
    const lastRoute = ref(readStoredLastRoute());

    const isAuthenticated = computed(() => Boolean(currentUser.value));
    const currentUserId = computed(() => currentUser.value?.userId ?? null);
    const currentDoctorId = computed(() =>
        currentUser.value?.doctorId ?? (currentUser.value?.role === "doctor" ? currentUser.value?.userId ?? null : null)
    );
    const currentPatientId = computed(() =>
        currentUser.value?.patientId ?? (currentUser.value?.role === "patient" ? currentUser.value?.userId ?? null : null)
    );
    const currentUserRole = computed(() => currentUser.value?.role ?? null);
    const token = computed(() => currentUser.value?.token ?? null);
    const isTokenExpired = computed(() => {
        const expiresAt = currentUser.value?.expiresAt;
        return expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;
    });

    function setSession(account) {
        currentUser.value = IamAccountAssembler.toSessionResource(account);
        persistSession(currentUser.value);
    }

    function setLastRoute(path) {
        lastRoute.value = path;
        persistLastRoute(path);
    }

    async function signIn(credentials) {
        loading.value = true;
        error.value = "";

        try {
            const account = await iamApi.signIn(credentials);
            setSession(account);
            return currentUser.value;
        } catch (caughtError) {
            error.value = caughtError.message;
            throw caughtError;
        } finally {
            loading.value = false;
        }
    }

    async function signUp(resource) {
        loading.value = true;
        error.value = "";

        try {
            const account = await iamApi.signUp(resource);
            setSession(account);
            return currentUser.value;
        } catch (caughtError) {
            error.value = caughtError.message;
            throw caughtError;
        } finally {
            loading.value = false;
        }
    }

    function requestResetCode(email) {
        resetEmail.value = email;
        resetCode.value = "12485";
        return resetCode.value;
    }

    function verifyResetCode(code) {
        return String(code).replace(/\s/g, "") === resetCode.value;
    }

    function signOut() {
        currentUser.value = null;
        error.value = "";
        persistSession(null);
        lastRoute.value = "";
        persistLastRoute("");
    }

    return {
        currentUser,
        currentUserId,
        currentDoctorId,
        currentPatientId,
        currentUserRole,
        isAuthenticated,
        token,
        isTokenExpired,
        loading,
        error,
        resetEmail,
        resetCode,
        lastRoute,
        setLastRoute,
        signIn,
        signUp,
        requestResetCode,
        verifyResetCode,
        signOut
    };
});
