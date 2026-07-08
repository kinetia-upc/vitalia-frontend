import axios from "axios";

const mockBaseUrl = import.meta.env.VITE_API_BASE_URL;
const realBackendUrl = import.meta.env.VITE_REAL_BACKEND_URL ?? mockBaseUrl;

export class AuthApi {
    #http;

    constructor() {
        this.#http = axios.create({
            baseURL: realBackendUrl,
            headers: { "Content-Type": "application/json" },
        });
    }

    signIn(credentials) {
        return this.#http.post("/auth/sign-in", credentials);
    }

    signUp(resource) {
        return this.#http.post("/auth/sign-up", resource);
    }

    me(token) {
        return this.#http.get("/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        });
    }

    signOut(token) {
        return this.#http.post("/auth/sign-out", null, {
            headers: { Authorization: `Bearer ${token}` },
        });
    }
}

export default new AuthApi();

