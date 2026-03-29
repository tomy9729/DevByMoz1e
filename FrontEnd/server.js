import express from "express";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "dist");
const indexHtmlPath = path.join(distPath, "index.html");

/**
 * 역할: 로컬 `.env.local` 파일을 읽어 process.env에 주입한다.
 * 파라미터 설명: 없음
 * 반환값 설명: 없음
 */
function loadLocalEnv() {
    const envFilePath = path.resolve(__dirname, ".env.local");

    if (!fs.existsSync(envFilePath)) {
        return;
    }

    const envFile = fs.readFileSync(envFilePath, "utf-8");

    envFile.split(/\r?\n/).forEach((line) => {
        if (!line || line.trim().startsWith("#")) {
            return;
        }

        const separatorIndex = line.indexOf("=");

        if (separatorIndex < 0) {
            return;
        }

        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();

        if (key && !process.env[key]) {
            process.env[key] = value;
        }
    });
}

loadLocalEnv();

const app = express();
const port = Number(process.env.PORT) || 4173;
const backendBaseUrl = process.env.BACKEND_BASE_URL ?? "http://localhost:3000";

app.use(express.json());

/**
 * 역할: 프런트 서버로 들어온 `/api` 요청을 백엔드 서버로 전달한다.
 * 파라미터 설명:
 * - req: Express 요청 객체
 * - res: Express 응답 객체
 * 반환값 설명: Promise<void>
 */
async function forwardApiRequest(req, res) {
    try {
        const targetUrl = new URL(req.originalUrl, backendBaseUrl);
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                accept: req.headers.accept ?? "application/json",
                "content-type": req.headers["content-type"] ?? "application/json",
            },
            body:
                req.method === "GET" || req.method === "HEAD"
                    ? undefined
                    : JSON.stringify(req.body ?? {}),
        });
        const contentType = response.headers.get("content-type");

        res.status(response.status);

        if (contentType) {
            res.setHeader("content-type", contentType);
        }

        if (contentType?.includes("application/json")) {
            res.json(await response.json());
            return;
        }

        res.send(await response.text());
    } catch (error) {
        console.error("Failed to forward API request to backend.", error);
        res.status(500).json({ message: "Failed to forward API request to backend." });
    }
}

app.use("/api", forwardApiRequest);

app.use(express.static(distPath));

app.use((req, res) => {
    if (!fs.existsSync(indexHtmlPath)) {
        res.status(404).send("Build output not found. Run npm run build first.");
        return;
    }

    res.sendFile(indexHtmlPath);
});

app.listen(port, () => {
    console.log(`Production server is running on port ${port}`);
});
