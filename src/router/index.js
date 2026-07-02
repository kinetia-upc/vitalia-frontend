import {createRouter, createWebHistory} from "vue-router";
import AdminLayout from "../shared/presentation/views/AdminLayout.vue";
import DoctorLayout from "../shared/presentation/views/DoctorLayout.vue";
import PatientLayout from "../shared/presentation/views/PatientLayout.vue";
import AdminDashboard from "../modules/analytics/presentation/views/dashboards/AdminDashboard.vue";
import AdminUsersView from "../modules/analytics/presentation/views/AdminUsersView.vue";
import AdminBillingView from "../modules/billing/presentation/views/AdminBillingView.vue";
import AdminSchedulingView from "../modules/scheduling/presentation/views/AdminSchedulingView.vue";
import ClinicSettingsView from "../modules/tenant/presentation/views/ClinicSettingsView.vue";
import DoctorDashboard from "../modules/analytics/presentation/views/dashboards/DoctorDashboard.vue";
import DoctorAgendaView from "../modules/scheduling/presentation/views/DoctorAgendaView.vue";
import DoctorPatientsView from "../modules/clinical/presentation/views/DoctorPatientsView.vue";
import DoctorOrdersView from "../modules/clinical/presentation/views/DoctorOrdersView.vue";
import UserDoctorView from "../modules/tenant/presentation/views/UserDoctorView.vue";
import PatientDashboard from "../modules/analytics/presentation/views/dashboards/PatientDashboard.vue";
import PatientAppointmentsView from "../modules/scheduling/presentation/views/PatientAppointmentsView.vue";
import PatientHistoryView from "../modules/clinical/presentation/views/PatientHistoryView.vue";
import PatientPrescriptionsView from "../modules/clinical/presentation/views/PatientPrescriptionsView.vue";
import UserPatientView from "../modules/tenant/presentation/views/UserPatientView.vue";
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
        path: "/admin",
        component: AdminLayout,
        redirect: "/admin/dashboard",
        children: [
            {path: "dashboard", component: AdminDashboard, meta: {role: "admin", section: "dashboard"}},
            {path: "users", component: AdminUsersView, meta: {role: "admin", section: "users"}},
            {path: "operations", component: AdminSchedulingView, meta: {role: "admin", section: "operations"}},
            {path: "billing", component: AdminBillingView, meta: {role: "admin", section: "billing"}},
            {path: "settings", component: ClinicSettingsView, meta: {role: "admin", section: "settings"}}
        ]
    },
    {
        path: "/doctor",
        component: DoctorLayout,
        redirect: "/doctor/dashboard",
        children: [
            {path: "dashboard", component: DoctorDashboard, meta: {role: "doctor", section: "dashboard"}},
            {path: "patients", component: DoctorPatientsView, meta: {role: "doctor", section: "patients"}},
            {path: "agenda", component: DoctorAgendaView, meta: {role: "doctor", section: "agenda"}},
            {path: "orders", component: DoctorOrdersView, meta: {role: "doctor", section: "orders"}},
            {path: "profile", component: UserDoctorView, meta: {role: "doctor", section: "profile"}}
        ]
    },
    {
        path: "/patient",
        component: PatientLayout,
        redirect: "/patient/dashboard",
        children: [
            {path: "dashboard", component: PatientDashboard, meta: {role: "patient", section: "dashboard"}},
            {path: "appointments", component: PatientAppointmentsView, meta: {role: "patient", section: "appointments"}},
            {path: "prescriptions", component: PatientPrescriptionsView, meta: {role: "patient", section: "prescriptions"}},
            {path: "history", component: PatientHistoryView, meta: {role: "patient", section: "history"}},
            {path: "profile", component: UserPatientView, meta: {role: "patient", section: "profile"}}
        ]
    },
    {path: "/:pathMatch(.*)*", redirect: "/sign-in"}
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

const homeByRole = {
    admin: "/admin/dashboard",
    doctor: "/doctor/dashboard",
    patient: "/patient/dashboard"
};

router.beforeEach((to) => {
    const authStore = useAuthStore();

    if (to.meta.public) {
        if (authStore.isAuthenticated && to.path === "/sign-in") {
            return homeByRole[authStore.currentUserRole] ?? "/patient/dashboard";
        }

        return true;
    }

    if (!authStore.isAuthenticated) {
        return {path: "/sign-in", query: {redirect: to.fullPath}};
    }

    if (to.meta.role && to.meta.role !== authStore.currentUserRole) {
        return homeByRole[authStore.currentUserRole] ?? "/patient/dashboard";
    }

    return true;
});

export default router;
