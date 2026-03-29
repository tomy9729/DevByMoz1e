import process from "node:process";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const lostArkProxyTarget = "https://developer-lostark.game.onstove.com";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    // 환경 변수 로딩 시작
    const env = loadEnv(mode, process.cwd(), "");
    const lostArkApiKey = env.LOSTARK_API_KEY ?? "";
    // 환경 변수 로딩 끝

    return {
        plugins: [react()],
        server: {
            proxy: lostArkApiKey
                ? {
                      "/api/lostark": {
                          target: lostArkProxyTarget,
                          changeOrigin: true,
                          rewrite: (requestPath) => requestPath.replace(/^\/api\/lostark/, ""),
                          headers: {
                              Authorization: `bearer ${lostArkApiKey}`,
                              accept: "application/json",
                          },
                      },
                  }
                : undefined,
        },
    };
});
