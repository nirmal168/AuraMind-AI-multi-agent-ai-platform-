import axios from "axios"
export const api = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_SEVER_URL || "http://localhost:5000",
    withCredentials: true
})