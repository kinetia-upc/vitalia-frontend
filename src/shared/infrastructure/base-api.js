import axios from "axios";

const mockBaseUrl = import.meta.env.VITE_API_BASE_URL;

const realBackendUrl = import.meta.env.VITE_REAL_BACKEND_URL ?? mockBaseUrl;

export class BaseApi {
    #http;

    constructor(customBaseUrl = null) {
        const primaryUrl = customBaseUrl ?? realBackendUrl;
        const fallbackUrl = mockBaseUrl;

        this.#http = axios.create({
            baseURL: primaryUrl,
            headers: { "Content-Type": "application/json" },
        });

        if (primaryUrl !== fallbackUrl) {
            this.#http.interceptors.response.use(
                (response) => response,
                async (error) => {
                    const config = error.config;

                    if (!config || config._retried) {
                        return Promise.reject(error);
                    }

                    const isNetworkOrCorsError = !error.response;
                    const isEndpointMissing =
                        error.response &&
                        (error.response.status === 404 ||
                            error.response.status === 405 ||
                            error.response.status === 501);

                    if (isNetworkOrCorsError || isEndpointMissing) {
                        config._retried = true;
                        config.baseURL = fallbackUrl;

                        console.warn(
                            `[Fallback API] Request to ${config.url} failed on real backend. Falling back to mock server...`,
                        );

                        return axios.request(config);
                    }

                    return Promise.reject(error);
                },
            );
        }
    }

    get http() {
        return this.#http;
    }
}
