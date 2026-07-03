import axios from "axios";

const realBackendUrl = import.meta.env.VITE_REAL_BACKEND_URL ?? import.meta.env.VITE_API_BASE_URL;
const sessionKey = "vitalia.iam.session";

export class BaseApi {
    #http;

    constructor(customBaseUrl = null) {
        const primaryUrl = customBaseUrl ?? realBackendUrl;

        this.#http = axios.create({
            baseURL: primaryUrl,
            headers: { "Content-Type": "application/json" },
        });

        this.#http.interceptors.request.use((config) => {
            try {
                const session = JSON.parse(localStorage.getItem(sessionKey) ?? "null");
                if (session?.token) {
                    config.headers = config.headers ?? {};
                    config.headers.Authorization = `Bearer ${session.token}`;
                }
            } catch {
                // Ignore malformed local session and continue unauthenticated.
            }

            return config;
        });
    }

    get http() {
        return this.#http;
    }
}
