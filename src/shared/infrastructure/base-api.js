import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
    ?? import.meta.env.VITE_VITALIA_PLATFORM_API_URL
    ?? import.meta.env.VITE_LEARNING_PLATFORM_API_URL
    ?? 'http://localhost:3000/api/v1'

export class BaseApi {
    #http

    constructor() {
        this.#http = axios.create({
            baseURL: apiBaseUrl,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    get http() {
        return this.#http
    }
}
