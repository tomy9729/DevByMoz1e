import process from "node:process";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const backendBaseUrl =
        env.VITE_API_BASE_URL ?? env.VITE_BACKEND_BASE_URL ?? "http://localhost:3000";

    return {
        plugins: [react(), tailwindcss()],
        server: {
            proxy: {
                "/api": {
                    target: backendBaseUrl,
                    changeOrigin: true,
                },
            },
        },
    };
});
