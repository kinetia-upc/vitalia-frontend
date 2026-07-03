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
        email: user.email ?? payload?.email ?? "",
        role: user.role ?? payload?.role ?? "patient"
    };
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
            const doctor = (Array.isArray(data) ? data : []).find((item) => item.userId === userId);
            return { doctorId: doctor?.id ?? null, patientId: null };
        }

        if (role === "patient") {
            const { data } = await this.#clinicalApi.getPatients();
            const patient = (Array.isArray(data) ? data : []).find((item) => item.userId === userId);
            return { doctorId: null, patientId: patient?.id ?? null };
        }

        return { doctorId: null, patientId: null };
    }

    async getUserById(userId) {
        const { data } = await this.#tenantApi.getUserById(userId);
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
            birthDate: resource.birthDate ?? resource.dateBirth,
            email: resource.email,
            password: resource.password,
            phone: resource.phone,
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
        if (!firstCenter?.id) {
            throw new Error("No healthcare center is available for registration.");
        }

        return firstCenter.id;
    }
}

export default new IamApi();
