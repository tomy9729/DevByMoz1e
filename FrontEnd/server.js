import express from "express";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "dist");
const indexHtmlPath = path.join(distPath, "index.html");
const lostArkEventsUrl = "https://developer-lostark.game.onstove.com/news/events";
const lostArkCalendarUrl = "https://developer-lostark.game.onstove.com/gamecontents/calendar";

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
const lostArkApiKey = process.env.LOSTARK_API_KEY ?? "";

// 뉴스 이벤트 프록시 라우트 시작
app.get("/api/lostark/news/events", async (req, res) => {
    if (!lostArkApiKey) {
        res.status(500).json({ message: "LOSTARK_API_KEY is not configured." });
        return;
    }

    try {
        const response = await fetch(lostArkEventsUrl, {
            headers: {
                accept: "application/json",
                Authorization: `bearer ${lostArkApiKey}`,
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            res.status(response.status).send(errorBody);
            return;
        }

        const events = await response.json();
        const normalizedEvents = events.map(({ Title, StartDate, EndDate, Link }) => ({
            Title,
            StartDate,
            EndDate,
            Link,
        }));

        res.json(normalizedEvents);
    } catch (error) {
        console.error("Failed to fetch Lost Ark events.", error);
        res.status(500).json({ message: "Failed to fetch Lost Ark events." });
    }
});
// 뉴스 이벤트 프록시 라우트 끝

// 게임 콘텐츠 일정 프록시 라우트 시작
app.get("/api/lostark/gamecontents/calendar", async (req, res) => {
    if (!lostArkApiKey) {
        res.status(500).json({ message: "LOSTARK_API_KEY is not configured." });
        return;
    }

    try {
        const response = await fetch(lostArkCalendarUrl, {
            headers: {
                accept: "application/json",
                Authorization: `bearer ${lostArkApiKey}`,
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            res.status(response.status).send(errorBody);
            return;
        }

        const calendarContents = await response.json();
        const normalizedCalendarContents = calendarContents.map(
            ({ CategoryName, ContentsName, StartTimes, RewardItems }) => ({
                CategoryName,
                ContentsName,
                StartTimes,
                RewardItems,
            })
        );

        res.json(normalizedCalendarContents);
    } catch (error) {
        console.error("Failed to fetch Lost Ark calendar contents.", error);
        res.status(500).json({ message: "Failed to fetch Lost Ark calendar contents." });
    }
});
// 게임 콘텐츠 일정 프록시 라우트 끝

// 정적 파일 서빙 시작
app.use(express.static(distPath));
// 정적 파일 서빙 끝

// SPA fallback 라우트 시작
app.use((req, res) => {
    if (!fs.existsSync(indexHtmlPath)) {
        res.status(404).send("Build output not found. Run npm run build first.");
        return;
    }

    res.sendFile(indexHtmlPath);
});
// SPA fallback 라우트 끝

app.listen(port, () => {
    console.log(`Production server is running on port ${port}`);
});
