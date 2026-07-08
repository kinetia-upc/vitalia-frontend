import { BaseApi } from "../../../shared/infrastructure/base-api.js";
import { TenantApi } from "../../tenant/infrastructure/tenant-api.js";
import { ClinicalApi } from "../../clinical/infrastructure/clinical-api.js";

function decodeBase64Url(value) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
    return atob(padded);
}

function decodeJwtPayload(token) {
    const [, payload] = String(token ?? "").split(".");
    if (!payload) return null;

    try {
        return JSON.parse(decodeBase64Url(payload));
    } catch {
        return null;
    }
}

function normalizeAuthResponse(data) {
    const token = data?.token ?? data?.accessToken ?? data?.jwt ?? null;
    const payload = token ? decodeJwtPayload(token) : null;
    const user = data?.user ?? data?.account ?? data ?? {};

    return {
        token,
        expiresAt: data?.expiresAt ?? (payload?.exp ? new Date(payload.exp * 1000).toISOString() : null),
        userId: user.userId ?? user.id ?? payload?.userId ?? payload?.sub ?? null,
        healthcareCenterId: user.healthcareCenterId ?? payload?.healthcareCenterId ?? null,
        name: user.name ?? payload?.name ?? "",
        paternalSurname: user.paternalSurname ?? payload?.paternalSurname ?? "",
        maternalSurname: user.maternalSurname ?? payload?.maternalSurname ?? "",
        identityType: user.identityType ?? "",
        identityNumber: user.identityNumber ?? "",
        dateBirth: user.dateBirth ?? user.birthDate ?? null,
        email: user.email ?? payload?.email ?? "",
        phone: user.phone ?? "",
        gender: user.gender ?? null,
        isActive: user.isActive ?? true,
        address: user.address ?? "",
        role: String(user.role ?? payload?.role ?? "patient").toLowerCase()
    };
}

function resourcesFromResponseData(data, key) {
    if (Array.isArray(data)) return data;
    return data?.value ?? data?.[key] ?? [];
}

function normalizePeruPhone(value) {
    const digits = String(value ?? "").replace(/\D/g, "");
    if (!digits) return "";
    const localDigits = digits.startsWith("51") ? digits.slice(2) : digits;
    const formattedLocalDigits = localDigits.length === 9
        ? `${localDigits.slice(0, 3)} ${localDigits.slice(3, 6)} ${localDigits.slice(6)}`
        : localDigits;

    return `+51 ${formattedLocalDigits}`;
}

export class IamApi extends BaseApi {
    #tenantApi;
    #clinicalApi;

    constructor() {
        super();
        this.#tenantApi = new TenantApi();
        this.#clinicalApi = new ClinicalApi();
    }

    decodeToken(token) {
        return decodeJwtPayload(token);
    }

    async resolveProfileIds(userId, role) {
        if (!userId || role === "admin") {
            return { doctorId: null, patientId: null };
        }

        if (role === "doctor") {
            const { data } = await this.#clinicalApi.getDoctors();
            const doctor = resourcesFromResponseData(data, "doctors")
                .find((item) => String(item.userId) === String(userId));
            return { doctorId: doctor?.id ?? userId, patientId: null };
        }

        if (role === "patient") {
            const { data } = await this.#clinicalApi.getPatients();
            const patient = resourcesFromResponseData(data, "patients")
                .find((item) => String(item.userId) === String(userId));
            return { doctorId: null, patientId: patient?.id ?? userId };
        }

        return { doctorId: null, patientId: null };
    }

    async getUserById(userId) {
        const { data } = await this.#tenantApi.getUserById(userId);
        return data;
    }

    async lookupDni(dni) {
        const normalizedDni = String(dni ?? "").replace(/\D/g, "");
        if (normalizedDni.length !== 8) {
            throw new Error("DNI must have 8 digits.");
        }

        const { data } = await this.http.get(`/identity/dni/${normalizedDni}`);
        return data;
    }

    async signIn({ email, password }) {
        if (!email || !password) {
            throw new Error("Enter your email and password.");
        }

        const { data } = await this.http.post("/authentication/signIn", { email, password });
        const session = normalizeAuthResponse(data);
        const profileIds = await this.resolveProfileIds(session.userId, session.role);

        return {
            ...session,
            ...profileIds,
        };
    }

    async signUp(resource) {
        const healthcareCenterId = resource.healthcareCenterId ?? await this.resolveDefaultHealthcareCenterId();

        await this.http.post("/authentication/signUp", {
            healthcareCenterId,
            name: resource.name,
            paternalSurname: resource.paternalSurname,
            maternalSurname: resource.maternalSurname ?? "",
            identityType: resource.identityType,
            identityNumber: resource.identityNumber,
            dateBirth: resource.dateBirth ?? resource.birthDate,
            email: resource.email,
            password: resource.password,
            phone: normalizePeruPhone(resource.phone),
            gender: resource.gender,
            address: resource.address,
            role: "patient"
        });

        return this.signIn({ email: resource.email, password: resource.password });
    }

    async resolveDefaultHealthcareCenterId() {
        const { data } = await this.#tenantApi.getHealthcareCenters();
        const centers = Array.isArray(data) ? data : [];
        const firstCenter = centers[0];
        if (!firstCenter?.code && !firstCenter?.healthcareCenterId) {
            throw new Error("No healthcare center is available for registration.");
        }

        return firstCenter.code ?? firstCenter.healthcareCenterId;
    }
}

export default new IamApi();
