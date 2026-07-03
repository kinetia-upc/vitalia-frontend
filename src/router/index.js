import {createRouter, createWebHistory} from "vue-router";
import AuthenticatedLayout from "../shared/presentation/views/AuthenticatedLayout.vue";
import RoleDashboardView from "../shared/presentation/views/RoleDashboardView.vue";
import RoleAgendaView from "../shared/presentation/views/RoleAgendaView.vue";
import RoleAppointmentsView from "../shared/presentation/views/RoleAppointmentsView.vue";
import RolePrescriptionsView from "../shared/presentation/views/RolePrescriptionsView.vue";
import RoleMedicalRecordsView from "../shared/presentation/views/RoleMedicalRecordsView.vue";
import RoleProfileView from "../shared/presentation/views/RoleProfileView.vue";
import AdminUsersView from "../modules/analytics/presentation/views/AdminUsersView.vue";
import AdminBillingView from "../modules/billing/presentation/views/AdminBillingView.vue";
import ClinicSettingsView from "../modules/tenant/presentation/views/ClinicSettingsView.vue";
import DoctorOrdersView from "../modules/clinical/presentation/views/DoctorOrdersView.vue";
import SignInView from "../modules/iam/presentation/views/SignInView.vue";
import SignUpView from "../modules/iam/presentation/views/SignUpView.vue";
import ForgotPasswordView from "../modules/iam/presentation/views/ForgotPasswordView.vue";
import { useAuthStore } from "../shared/application/auth-store.js";

const routes = [
    {path: "/", redirect: "/sign-in"},
    {path: "/sign-in", component: SignInView, meta: {public: true}},
    {path: "/sign-up", component: SignUpView, meta: {public: true}},
    {path: "/forgot-password", component: ForgotPasswordView, meta: {public: true}},
    {
        path: "/",
        component: AuthenticatedLayout,
        children: [
            {path: "dashboard", component: RoleDashboardView, meta: {requiresAuth: true, section: "dashboard"}},
            {path: "users", component: AdminUsersView, meta: {requiresAuth: true, roles: ["admin"], section: "users"}},
            {path: "agenda", component: RoleAgendaView, meta: {requiresAuth: true, roles: ["admin", "doctor"], section: "agenda"}},
            {path: "appointments", component: RoleAppointmentsView, meta: {requiresAuth: true, roles: ["admin", "doctor", "patient"], section: "appointments"}},
            {path: "prescriptions", component: RolePrescriptionsView, meta: {requiresAuth: true, roles: ["doctor", "patient"], section: "prescriptions"}},
            {path: "patients", component: RoleMedicalRecordsView, meta: {requiresAuth: true, roles: ["doctor", "patient"], section: "patients"}},
            {path: "orders", component: DoctorOrdersView, meta: {requiresAuth: true, roles: ["doctor"], section: "orders"}},
            {path: "billing", component: AdminBillingView, meta: {requiresAuth: true, roles: ["admin"], section: "billing"}},
            {path: "settings", component: ClinicSettingsView, meta: {requiresAuth: true, roles: ["admin"], section: "settings"}},
            {path: "profile", component: RoleProfileView, meta: {requiresAuth: true, roles: ["doctor", "patient"], section: "profile"}}
        ]
    },
    {path: "/:pathMatch(.*)*", redirect: "/sign-in"}
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

const homeByRole = {
    admin: "/dashboard",
    doctor: "/dashboard",
    patient: "/dashboard"
};

router.beforeEach((to) => {
    const authStore = useAuthStore();

    if (to.meta.public) {
        if (authStore.isAuthenticated && !authStore.isTokenExpired) {
            return homeByRole[authStore.currentUserRole] ?? "/dashboard";
        }

        return true;
    }

    if (!authStore.isAuthenticated || authStore.isTokenExpired) {
        authStore.signOut();
        return {path: "/sign-in", query: {redirect: to.fullPath}};
    }

    if (Array.isArray(to.meta.roles) && !to.meta.roles.includes(authStore.currentUserRole)) {
        return homeByRole[authStore.currentUserRole] ?? "/dashboard";
    }

    return true;
});

export default router;
