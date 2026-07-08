<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useSchedulingStore } from "../../application/scheduling-store.js";
import BillingPaymentPopup from "../../../billing/presentation/components/BillingPaymentPopup.vue";

const props = defineProps({
    openBookingOnEnter: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(["booking-intent-consumed"]);

const store = useSchedulingStore();
const { t, locale } = useI18n();
const reschedulingAppointment = ref(null);
const rescheduleDoctorId = ref("");
const bookingDialogOpen = ref(false);
const bookingStep = ref(1);
const selectedBranchId = ref("");
const selectedSpecialtyId = ref("");
const selectedDoctorId = ref("");
const selectedDate = ref("");
const selectedSlot = ref(null);
const payingAppointmentId = ref(null);
const selectedAppointment = ref(null);

const todayDateKey = [
    new Date().getFullYear(),
    String(new Date().getMonth() + 1).padStart(2, "0"),
    String(new Date().getDate()).padStart(2, "0")
].join("-");

function openBookingDialog() {
    bookingStep.value = 1;
    selectedBranchId.value = "";
    selectedSpecialtyId.value = "";
    selectedDoctorId.value = "";
    selectedDate.value = "";
    selectedSlot.value = null;
    bookingDialogOpen.value = true;
}

function closeBooking() {
    bookingDialogOpen.value = false;
    bookingStep.value = 1;
}

function goToStep(step) {
    bookingStep.value = step;
}

async function confirmBooking() {
    if (!selectedSlot.value) return;
    await store.reserveAppointment(selectedSlot.value);
    closeBooking();
}

onMounted(() => {
    if (!store.loaded) store.fetchSchedulingData();
});

watch(
    () => props.openBookingOnEnter,
    (shouldOpen) => {
        if (!shouldOpen) return;
        openBookingDialog();
        emit("booking-intent-consumed");
    },
    { immediate: true },
);



const closedStatuses = ["cancelled", "released", "completed"];
const sortedPatientAppointments = computed(() =>
    [...store.patientAppointments].sort(
        (left, right) =>
            new Date(left.scheduledAt) - new Date(right.scheduledAt),
    ),
);
const nextAppointment = computed(() =>
    sortedPatientAppointments.value.find(
        (appointment) => !closedStatuses.includes(appointment.status),
    ),
);
const completedAppointmentsCount = computed(() =>
    store.patientAppointments.filter((appointment) =>
        appointment.status === 'released'
    ).length
);
const statusPriority = (appt) => {
    if (['scheduled', 'confirmed', 'arrived', 'in-attention'].includes(appt.status)) return 0;
    if (appt.paymentStatus === 'paid') return 1;
    return 2;
};

const allUpcomingAppointments = computed(() =>
    sortedPatientAppointments.value
    .filter((appointment) => !closedStatuses.includes(appointment.status))
    .sort((a, b) => {
        const pa = statusPriority(a);
        const pb = statusPriority(b);
        if (pa !== pb) return pa - pb;
        return new Date(a.scheduledAt) - new Date(b.scheduledAt);
    })
);

const pageSize = ref(4);
const currentPage = ref(1);

const totalPages = computed(() =>
    Math.ceil(allUpcomingAppointments.value.length / pageSize.value),
);

const paginatedAppointments = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return allUpcomingAppointments.value.slice(start, start + pageSize.value);
});

const paginationLabel = computed(() => {
    const total = allUpcomingAppointments.value.length;
    if (!total) return t("scheduling.patientAppointments.noAppointments");
    const start = (currentPage.value - 1) * pageSize.value + 1;
    const end = Math.min(currentPage.value * pageSize.value, total);
    return t("scheduling.patientAppointments.paginationOf", {
        start,
        end,
        total,
    });
});

const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) currentPage.value = page;
};

const rescheduleDateRange = computed(() => {
    const appt = reschedulingAppointment.value;
    if (!appt) return null;
    const d = new Date(appt.scheduledAt);
    const before = new Date(d);
    before.setDate(before.getDate() - 7);
    const after = new Date(d);
    after.setDate(after.getDate() + 7);
    return { before, after };
});

const rescheduleDoctors = computed(() => {
    const specialty = reschedulingAppointment.value?.doctor?.specialty;
    const range = rescheduleDateRange.value;
    if (!specialty || !range) return [];

    const doctorIdsWithSlots = new Set(
        store.availableSlots
            .filter(s =>
                s.status === 'available' &&
                new Date(s.date) >= range.before &&
                new Date(s.date) <= range.after
            )
            .map(s => s.doctorId)
    );

    return store.doctors.filter(d =>
        d.specialty === specialty &&
        doctorIdsWithSlots.has(d.id)
    );
});

const rescheduleSlots = computed(() => {
    const range = rescheduleDateRange.value;
    if (!range || !rescheduleDoctorId.value) return [];
    return store.availableSlots.filter(s =>
        s.status === 'available' &&
        s.doctorId === rescheduleDoctorId.value &&
        new Date(s.date) >= range.before &&
        new Date(s.date) <= range.after
    );
});

const rescheduleDates = computed(() => {
    const dates = [...new Set(rescheduleSlots.value.map(s => s.date))];
    return dates.sort();
});

const getSlotsForDate = (date) => rescheduleSlots.value.filter(s => s.date === date);

const doctorIdsWithSlots = computed(() => {
    const ids = new Set(store.availableSlots.filter(s => s.status === 'available').map(s => s.doctorId));
    return ids;
});

const doctorIdsWithSlotsInSelectedBranch = computed(() => {
    if (!selectedBranchId.value) return new Set();
    return new Set(
        store.availableSlots
            .filter(s => s.status === 'available' && s.branchId === selectedBranchId.value)
            .map(s => s.doctorId)
    );
});

const specialtiesInBranch = computed(() => {
    if (!selectedBranchId.value) return [];
    const seen = new Set();
    return store.doctors
        .filter(d => d.specialty && doctorIdsWithSlotsInSelectedBranch.value.has(d.id))
        .filter(d => {
            if (seen.has(d.specialty)) return false;
            seen.add(d.specialty);
            return true;
        })
        .map(d => ({ id: d.specialty, name: d.specialty }));
});

const doctorsBySpecialty = computed(() =>
    store.doctors.filter(d =>
        d.specialty === selectedSpecialtyId.value &&
        doctorIdsWithSlotsInSelectedBranch.value.has(d.id)
    )
);

const availableBookingDates = computed(() => {
    if (!selectedDoctorId.value) return [];
    const dates = [...new Set(
        store.availableSlots
            .filter(s => s.doctorId === selectedDoctorId.value && s.status === 'available' && s.date >= todayDateKey)
            .map(s => s.date)
    )];
    return dates.sort();
});

const availableBookingSlots = computed(() => {
    if (!selectedDoctorId.value || !selectedDate.value) return [];
    return store.availableSlots.filter(s =>
        s.doctorId === selectedDoctorId.value &&
        s.date === selectedDate.value &&
        s.status === 'available'
    );
});

const canManageAppointment = (appointment) =>
    appointment && !closedStatuses.includes(appointment.status);

const openReschedule = (appointment) => {
    if (!canManageAppointment(appointment)) return;
    reschedulingAppointment.value = appointment;
    rescheduleDoctorId.value = appointment.doctorId;
};

const openDetails = (appointment) => {
    selectedAppointment.value = appointment;
};

const rescheduleTo = async (slot) => {
    if (!reschedulingAppointment.value) return;
    await store.rescheduleAppointment(reschedulingAppointment.value.id, slot);
    reschedulingAppointment.value = null;
};

const closeReschedule = () => {
    reschedulingAppointment.value = null;
    rescheduleDoctorId.value = "";
};

const handleCancel = async (id) => {
    if (!window.confirm(t("scheduling.patientAppointments.confirmCancel"))) return;
    try {
        await store.cancelAppointment(id);
    } catch (err) {
        console.error("Cancel appointment failed:", err);
        window.alert(t("scheduling.patientAppointments.errorCancel"));
    }
};

const openPayDialog = (id) => {
    payingAppointmentId.value = id;
};

const handlePaid = async (appointmentId) => {
    try {
        await store.payAppointment(appointmentId);
        await new Promise((resolve) => setTimeout(resolve, 1400));
    } catch (err) {
        console.error("Pay appointment failed:", err);
        window.alert(t("scheduling.patientAppointments.errorPay"));
    }
    payingAppointmentId.value = null;
};

const formatMonthDay = (value) =>
    new Date(value).toLocaleDateString(
        locale.value === "es" ? "es-PE" : "en-US",
        { month: "short", day: "numeric" },
    );

const formatWeekdayTime = (value) =>
    new Date(value).toLocaleDateString(
        locale.value === "es" ? "es-PE" : "en-US",
        { weekday: "long", hour: "2-digit", minute: "2-digit" },
    );

const formatLongDate = (value) =>
    new Date(value).toLocaleDateString(
        locale.value === "es" ? "es-PE" : "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        },
    );

const formatTime = (value) =>
    new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

const detailLabels = computed(() =>
    ({
        title: t("scheduling.patientAppointments.detailTitle"),
        appointmentId: t("scheduling.patientAppointments.appointmentIdLabel"),
        doctor: t("scheduling.patientAppointments.doctor"),
        specialty: t("scheduling.patientAppointments.stepSpecialty"),
        clinic: t("scheduling.patientAppointments.clinic"),
        date: t("patient.date"),
        time: t("patient.time"),
        reason: t("scheduling.patientAppointments.reasonLabel"),
    }),
);
</script>

<template>
    <section class="scheduling-view patient-appointments-screen">
        <div class="schedule-page-heading">
            <div>
                <h1>{{ t("scheduling.patientAppointments.title") }}</h1>
                <p>{{ t("scheduling.patientAppointments.subtitle") }}</p>
            </div>
            <button
                class="primary-action compact-action"
                type="button"
                @click="openBookingDialog"
            >
                {{ t("scheduling.patientAppointments.bookNew") }}
            </button>
        </div>

        <div class="patient-appointment-layout">
            <article class="patient-next-card" v-if="nextAppointment">
                <span class="patient-next-card-watermark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6 3v6a4 4 0 0 0 8 0V3" />
                        <path d="M10 13v2a5 5 0 0 0 10 0v-2" />
                        <circle cx="20" cy="10" r="1.6" />
                        <circle cx="6" cy="3" r="1" />
                        <circle cx="14" cy="3" r="1" />
                    </svg>
                </span>
                <div>
                    <div class="next-card-pills">
                        <span class="pill-label">{{
                            t("scheduling.patientAppointments.nextVisit")
                        }}</span>
                        <span
                            v-if="nextAppointment.paymentStatus === 'paid'"
                            class="pill-label pill-paid"
                            >✓ PAID</span
                        >
                    </div>
                    <h2>{{ nextAppointment.doctor?.fullName }}</h2>
                    <p>
                        {{ nextAppointment.doctor?.specialty }} -
                        {{ nextAppointment.branch?.description }}
                    </p>
                    <div class="appointment-actions">
                        <button
                            type="button"
                            class="ghost-action"
                            @click="openDetails(nextAppointment)"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                            {{
                                t("scheduling.patientAppointments.viewDetails")
                            }}
                        </button>
                        <button
                            type="button"
                            class="sched-action"
                            @click="openReschedule(nextAppointment)"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M16 2.5v4M8 2.5v4M3 10h18" /><path d="M8 15h2M8 18h2M14 15h2M14 18h2" /></svg>
                            {{ t("scheduling.patientAppointments.reschedule") }}
                        </button>
                        <button
                            type="button"
                            class="danger-action"
                            @click="handleCancel(nextAppointment.id)"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></svg>
                            {{ t("scheduling.patientAppointments.cancel") }}
                        </button>
                        <button
                            v-if="nextAppointment.paymentStatus === 'pending'"
                            type="button"
                            class="pay-action"
                            @click="openPayDialog(nextAppointment.id)"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2.5" /><path d="M2 10h20" /><path d="M6 15h4" /></svg>
                            {{ t("scheduling.patientAppointments.pay") }}
                        </button>
                    </div>
                </div>

                <time>
                    <strong>{{
                        formatMonthDay(nextAppointment.scheduledAt)
                    }}</strong>
                    <span
                        >{{
                            formatTime(nextAppointment.scheduledAt)
                        }}
                        (GMT)</span
                    >
                </time>
            </article>

            <aside class="patient-stat-stack">
                <article class="patient-stat cyan">
                    <span class="patient-stat-watermark" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4.5" width="18" height="16" rx="3" />
                            <path d="M16 2.5v4M8 2.5v4M3 10h18" />
                            <path d="M8.5 15.2l2.1 2.1 4.4-4.4" />
                        </svg>
                    </span>
                    <span class="patient-stat-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="7.2" r="3.2" />
                            <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
                            <path d="M9 21v-3a3 3 0 0 1 6 0v3" />
                        </svg>
                    </span>
                    <strong>{{ completedAppointmentsCount }}</strong>
                    <small>{{
                        t("scheduling.patientAppointments.totalVisits", { year: new Date().getFullYear() })
                    }}</small>
                </article>
                <article class="patient-stat amber">
                    <span class="patient-stat-watermark" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4.5" width="18" height="16" rx="3" />
                            <path d="M16 2.5v4M8 2.5v4M3 10h18" />
                            <circle cx="16" cy="16" r="3.2" />
                            <path d="M16 14.8v1.4l1 0.6" />
                        </svg>
                    </span>
                    <span class="patient-stat-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="10" cy="7.2" r="3.2" />
                            <path d="M4 20v-1a6 6 0 0 1 10.5-3.9" />
                            <circle cx="18" cy="17" r="4" />
                            <path d="M18 15v2l1.2 0.8" />
                        </svg>
                    </span>
                    <strong>{{ store.patientAppointments.filter(a => ['scheduled','confirmed'].includes(a.status)).length }}</strong>
                    <small>{{
                        t("scheduling.patientAppointments.scheduledAppointments")
                    }}</small>
                </article>
            </aside>
        </div>

        <article class="upcoming-panel">
            <div class="upcoming-panel-header">
                <h2>
                    {{
                        t("scheduling.patientAppointments.upcomingAppointments")
                    }}
                </h2>
            </div>
            <div v-if="paginatedAppointments.length" class="patient-appointment-list">
                <div
                    v-for="appointment in paginatedAppointments"
                    :key="appointment.id"
                    class="patient-appointment-row"
                >
                    <time>
                        <strong
                            >{{ formatMonthDay(appointment.scheduledAt) }},
                            {{ new Date(appointment.scheduledAt).getFullYear() }}</strong
                        >
                        <span>{{
                            formatWeekdayTime(appointment.scheduledAt)
                        }}</span>
                    </time>
                    <span class="avatar small"></span>
                    <div>
                        <strong>{{ appointment.doctor?.fullName }}</strong>
                        <p>{{ appointment.reason }}</p>
                        <span class="appointment-row-id app-code">{{ appointment.code || appointment.id }}</span>
                    </div>
                    <div>
                        <small>{{
                            t("scheduling.patientAppointments.clinic")
                        }}</small>
                        <p>{{ appointment.branch?.name }}</p>
                    </div>
                    <div class="patient-row-actions">
                        <button
                            v-if="
                                appointment.paymentStatus === 'pending' &&
                                canManageAppointment(appointment)
                            "
                            type="button"
                            class="pay"
                            @click="openPayDialog(appointment.id)"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2.5" /><path d="M2 10h20" /><path d="M6 15h4" /></svg>
                            {{ t("scheduling.patientAppointments.pay") }}
                        </button>
                        <button
                            type="button"
                            class="sched"
                            :disabled="!canManageAppointment(appointment)"
                            @click="openReschedule(appointment)"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M16 2.5v4M8 2.5v4M3 10h18" /><path d="M8 15h2M8 18h2M14 15h2M14 18h2" /></svg>
                            {{ t("scheduling.patientAppointments.reschedule") }}
                        </button>
                        <button
                            type="button"
                            class="danger"
                            :disabled="!canManageAppointment(appointment)"
                            @click="handleCancel(appointment.id)"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></svg>
                            {{ t("scheduling.patientAppointments.cancel") }}
                        </button>
                    </div>
                    <div class="appointment-badges">
                        <span
                            v-if="appointment.paymentStatus === 'paid'"
                            class="status paid"
                            >{{
                                t("scheduling.patientAppointments.paidBadge")
                            }}</span
                        >
                        <span v-else :class="`status ${appointment.status}`">{{
                            appointment.status
                        }}</span>
                    </div>
                    <button
                        type="button"
                        class="chevron-button"
                        :aria-label="t('scheduling.patientAppointments.viewDetails')"
                        @click="openDetails(appointment)"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                </div>
            </div>
            <p v-else class="patient-appointments-empty-state">
                {{ t("patient.noUpcomingAppointment") }}
            </p>

            <div class="upcoming-pagination" v-if="totalPages > 1">
                <span class="pagination-label">{{ paginationLabel }}</span>
                <div class="pagination-controls">
                    <button
                        type="button"
                        class="page-nav"
                        :disabled="currentPage <= 1"
                        @click="goToPage(currentPage - 1)"
                    >
                        ‹
                    </button>
                    <button
                        v-for="page in totalPages"
                        :key="page"
                        type="button"
                        class="page-btn"
                        :class="{ active: page === currentPage }"
                        @click="goToPage(page)"
                    >
                        {{ page }}
                    </button>
                    <button
                        type="button"
                        class="page-nav"
                        :disabled="currentPage >= totalPages"
                        @click="goToPage(currentPage + 1)"
                    >
                        ›
                    </button>
                </div>
            </div>
        </article>

        <BillingPaymentPopup
            v-if="payingAppointmentId"
            :appointmentId="payingAppointmentId"
            @paid="handlePaid"
            @close="payingAppointmentId = null"
        />

        <div
            v-if="selectedAppointment"
            class="modal-backdrop"
            @click.self="selectedAppointment = null"
        >
            <article class="schedule-dialog appointment-detail-dialog panel">
                <div class="panel-heading">
                    <div>
                        <h2>{{ detailLabels.title }}</h2>
                        <p>{{ selectedAppointment.reason }}</p>
                    </div>
                    <button
                        class="text-action"
                        type="button"
                        @click="selectedAppointment = null"
                    >
                        {{ t("scheduling.patientAppointments.close") }}
                    </button>
                </div>

                <div class="appointment-detail-hero">
                    <span class="avatar"></span>
                    <div>
                        <small>{{ detailLabels.doctor }}</small>
                        <strong>{{
                            selectedAppointment.doctor?.fullName || "-"
                        }}</strong>
                        <p>
                            {{ selectedAppointment.doctor?.specialty || "-" }}
                        </p>
                    </div>
                </div>

                <div class="appointment-detail-grid">
                    <section>
                        <small>{{ detailLabels.date }}</small>
                        <strong>{{
                            formatLongDate(selectedAppointment.scheduledAt)
                        }}</strong>
                    </section>
                    <section>
                        <small>{{ detailLabels.time }}</small>
                        <strong>{{
                            formatTime(selectedAppointment.scheduledAt)
                        }}</strong>
                    </section>
                    <section>
                        <small>{{ detailLabels.clinic }}</small>
                        <strong>{{
                            selectedAppointment.branch?.name || "-"
                        }}</strong>
                        <span>{{
                            selectedAppointment.branch?.description || ""
                        }}</span>
                    </section>
                    <section>
                        <small>{{ detailLabels.appointmentId }}</small>
                        <strong class="app-code">{{ selectedAppointment.code || selectedAppointment.id }}</strong>
                    </section>
                </div>
            </article>
        </div>

        <div
            v-if="bookingDialogOpen"
            class="modal-backdrop"
            @click.self="closeBooking"
        >
            <article class="schedule-dialog panel">
                <div class="panel-heading">
                    <h2>{{ t("scheduling.patientAppointments.bookNew") }}</h2>
                    <button
                        class="text-action"
                        type="button"
                        @click="closeBooking"
                    >
                        {{ t("scheduling.patientAppointments.close") }}
                    </button>
                </div>

                <div class="booking-step-indicators">
                    <span
                        v-for="s in 5"
                        :key="s"
                        class="booking-step-dot"
                        :class="{ active: bookingStep >= s, filled: bookingStep > s }"
                    >
                        {{ s }}
                    </span>
                </div>

                <div v-if="bookingStep === 1" class="booking-step">
                    <label>
                        {{ t("scheduling.patientAppointments.stepBranch") }}
                        <select v-model="selectedBranchId">
                            <option value="" disabled>
                                {{ t("scheduling.patientAppointments.selectBranch") }}
                            </option>
                            <option
                                v-for="b in store.branches"
                                :key="b.id"
                                :value="b.id"
                            >
                                {{ b.name }}
                            </option>
                        </select>
                    </label>
                    <button
                        type="button"
                        class="primary-action compact-action"
                        :disabled="!selectedBranchId"
                        @click="goToStep(2)"
                    >
                        {{ t("scheduling.patientAppointments.next") }}
                    </button>
                </div>

                <div v-else-if="bookingStep === 2" class="booking-step">
                    <label>
                        {{ t("scheduling.patientAppointments.stepSpecialty") }}
                        <select v-model="selectedSpecialtyId">
                            <option value="" disabled>
                                {{ t("scheduling.patientAppointments.selectSpecialty") }}
                            </option>
                            <option
                                v-for="spec in specialtiesInBranch"
                                :key="spec.id"
                                :value="spec.id"
                            >
                                {{ spec.name }}
                            </option>
                        </select>
                    </label>
                    <div class="booking-nav-actions">
                        <button
                            type="button"
                            class="ghost-action"
                            @click="goToStep(1)"
                        >
                            {{ t("scheduling.patientAppointments.back") }}
                        </button>
                        <button
                            type="button"
                            class="primary-action compact-action"
                            :disabled="!selectedSpecialtyId"
                            @click="goToStep(3)"
                        >
                            {{ t("scheduling.patientAppointments.next") }}
                        </button>
                    </div>
                </div>

                <div v-else-if="bookingStep === 3" class="booking-step">
                    <label>
                        {{ t("scheduling.patientAppointments.stepDoctor") }}
                        <select v-model="selectedDoctorId">
                            <option value="" disabled>
                                {{ t("scheduling.patientAppointments.selectDoctorBooking") }}
                            </option>
                            <option
                                v-for="doc in doctorsBySpecialty"
                                :key="doc.id"
                                :value="doc.id"
                            >
                                {{ doc.fullName }}
                            </option>
                        </select>
                    </label>
                    <div class="booking-nav-actions">
                        <button
                            type="button"
                            class="ghost-action"
                            @click="goToStep(2)"
                        >
                            {{ t("scheduling.patientAppointments.back") }}
                        </button>
                        <button
                            type="button"
                            class="primary-action compact-action"
                            :disabled="!selectedDoctorId"
                            @click="goToStep(4)"
                        >
                            {{ t("scheduling.patientAppointments.next") }}
                        </button>
                    </div>
                </div>

                <div v-else-if="bookingStep === 4" class="booking-step">
                    <label>
                        {{ t("scheduling.patientAppointments.stepDate") }}
                    </label>
                    <div
                        v-if="availableBookingDates.length"
                        class="booking-date-grid"
                    >
                        <button
                            v-for="date in availableBookingDates"
                            :key="date"
                            type="button"
                            :class="{ selected: selectedDate === date }"
                            @click="selectedDate = date"
                        >
                            {{ date }}
                        </button>
                    </div>
                    <p v-else class="form-error">
                        {{ t("scheduling.patientAppointments.noSlots") }}
                    </p>
                    <div class="booking-nav-actions">
                        <button
                            type="button"
                            class="ghost-action"
                            @click="goToStep(3)"
                        >
                            {{ t("scheduling.patientAppointments.back") }}
                        </button>
                        <button
                            type="button"
                            class="primary-action compact-action"
                            :disabled="!selectedDate"
                            @click="goToStep(5)"
                        >
                            {{ t("scheduling.patientAppointments.next") }}
                        </button>
                    </div>
                </div>

                <div v-else-if="bookingStep === 5" class="booking-step">
                    <label>
                        {{ t("scheduling.patientAppointments.stepSlot") }}
                    </label>
                    <div
                        v-if="availableBookingSlots.length"
                        class="reschedule-slot-list"
                    >
                        <button
                            v-for="slot in availableBookingSlots"
                            :key="slot.id"
                            type="button"
                            @click="selectedSlot = slot"
                            :class="{ selected: selectedSlot?.id === slot.id }"
                        >
                            {{ slot.startTime }} - {{ slot.endTime }}
                        </button>
                    </div>
                    <p v-else class="form-error">
                        {{ t("scheduling.patientAppointments.noSlotsForDate") }}
                    </p>
                    <div class="booking-nav-actions">
                        <button
                            type="button"
                            class="ghost-action"
                            @click="goToStep(4)"
                        >
                            {{ t("scheduling.patientAppointments.back") }}
                        </button>
                        <button
                            type="button"
                            class="primary-action compact-action"
                            :disabled="!selectedSlot"
                            @click="goToStep(6)"
                        >
                            {{ t("scheduling.patientAppointments.next") }}
                        </button>
                    </div>
                </div>

                <div v-else-if="bookingStep === 6" class="booking-step">
                    <label>{{ t("scheduling.patientAppointments.confirmTitle") }}</label>
                    <div class="booking-confirm-details">
                        <div class="confirm-row">
                            <span class="confirm-label">{{ t("scheduling.patientAppointments.stepBranch") }}:</span>
                            <span>{{ store.branches.find(b => b.id === selectedBranchId)?.name || selectedBranchId }}</span>
                        </div>
                        <div class="confirm-row">
                            <span class="confirm-label">{{ t("scheduling.patientAppointments.stepSpecialty") }}:</span>
                            <span>{{ selectedSpecialtyId }}</span>
                        </div>
                        <div class="confirm-row">
                            <span class="confirm-label">{{ t("scheduling.patientAppointments.stepDoctor") }}:</span>
                            <span>{{ store.doctors.find(d => d.id === selectedDoctorId)?.fullName || selectedDoctorId }}</span>
                        </div>
                        <div class="confirm-row">
                            <span class="confirm-label">{{ t("scheduling.patientAppointments.stepDate") }}:</span>
                            <span>{{ selectedDate }}</span>
                        </div>
                        <div class="confirm-row">
                            <span class="confirm-label">{{ t("scheduling.patientAppointments.stepSlot") }}:</span>
                            <span>{{ selectedSlot?.startTime }} - {{ selectedSlot?.endTime }}</span>
                        </div>
                    </div>
                    <div class="booking-confirm-actions">
                        <button
                            type="button"
                            class="ghost-action"
                            @click="goToStep(5)"
                        >
                            {{ t("scheduling.patientAppointments.back") }}
                        </button>
                        <button
                            type="button"
                            class="primary-action"
                            @click="confirmBooking"
                        >
                            {{ t("scheduling.patientAppointments.confirmBooking") }}
                        </button>
                    </div>
                </div>
            </article>
        </div>

        <div
            v-if="reschedulingAppointment"
            class="modal-backdrop"
            @click.self="closeReschedule"
        >
            <article class="schedule-dialog panel">
                <div class="panel-heading">
                    <div>
                        <h2>
                            {{
                                t("scheduling.patientAppointments.rescheduleTitle")
                            }}
                        </h2>
                        <p class="reschedule-current-info">
                            {{ reschedulingAppointment.doctor?.fullName }}
                            &mdash;
                            {{ reschedulingAppointment.doctor?.specialty }}
                            <br />
                            {{ formatLongDate(reschedulingAppointment.scheduledAt) }}
                            &bull;
                            {{ formatTime(reschedulingAppointment.scheduledAt) }}
                        </p>
                    </div>
                    <button
                        class="text-action"
                        type="button"
                        @click="closeReschedule"
                    >
                        {{ t("scheduling.patientAppointments.close") }}
                    </button>
                </div>

                <label>
                    {{ t("scheduling.patientAppointments.selectDoctor") }}
                    <select v-model="rescheduleDoctorId">
                        <option value="" disabled>
                            {{ t("scheduling.patientAppointments.chooseDoctor") }}
                        </option>
                        <option
                            v-for="doc in rescheduleDoctors"
                            :key="doc.id"
                            :value="doc.id"
                        >
                            {{ doc.fullName }}
                        </option>
                    </select>
                </label>

                <div
                    v-if="rescheduleDoctorId && rescheduleDates.length"
                    class="reschedule-slot-list"
                >
                    <div
                        v-for="date in rescheduleDates"
                        :key="date"
                        class="reschedule-date-group"
                    >
                        <strong>{{ date }}</strong>
                        <button
                            v-for="slot in getSlotsForDate(date)"
                            :key="slot.id"
                            type="button"
                            @click="rescheduleTo(slot)"
                        >
                            {{ slot.startTime }} - {{ slot.endTime }}
                        </button>
                    </div>
                </div>
                <p
                    v-else-if="rescheduleDoctorId"
                    class="form-error"
                >
                    {{
                        t("scheduling.patientAppointments.noSlotsReschedule")
                    }}
                </p>
            </article>
        </div>
    </section>
</template>
