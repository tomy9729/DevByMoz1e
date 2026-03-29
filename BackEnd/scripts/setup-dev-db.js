const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

function loadEnvFile(fileName) {
    const filePath = path.resolve(__dirname, "..", fileName);

    if (!fs.existsSync(filePath)) {
        return;
    }

    const fileContent = fs.readFileSync(filePath, "utf8");

    for (const line of fileContent.split(/\r?\n/)) {
        if (!line || line.trim().startsWith("#")) {
            continue;
        }

        const separatorIndex = line.indexOf("=");

        if (separatorIndex < 0) {
            continue;
        }

        const key = line.slice(0, separatorIndex).trim();
        const rawValue = line.slice(separatorIndex + 1).trim();
        const value = rawValue.replace(/^"(.*)"$/, "$1");

        if (key && !process.env[key]) {
            process.env[key] = value;
        }
    }
}

async function main() {
    loadEnvFile(".env.local");
    loadEnvFile(".env");

    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is required to set up the development database.");
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    await client.query(`DO $$ BEGIN
        CREATE TYPE "AdventureIslandPeriod" AS ENUM ('weekday', 'weekendMorning', 'weekendAfternoon');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;`);
    await client.query(`CREATE TABLE IF NOT EXISTS "AdventureIsland" (
        "id" TEXT PRIMARY KEY,
        "lostArkDate" TEXT NOT NULL,
        "period" "AdventureIslandPeriod" NOT NULL,
        "categoryName" TEXT NOT NULL,
        "contentsName" TEXT NOT NULL,
        "shortName" TEXT NOT NULL,
        "rewardName" TEXT,
        "rewardShortName" TEXT,
        "startTime" TEXT NOT NULL,
        "rawData" JSONB NOT NULL,
        "collectedAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);
    await client.query(
        'CREATE UNIQUE INDEX IF NOT EXISTS "AdventureIsland_lostArkDate_period_contentsName_key" ON "AdventureIsland"("lostArkDate", "period", "contentsName");',
    );
    await client.query(
        'CREATE INDEX IF NOT EXISTS "AdventureIsland_lostArkDate_period_idx" ON "AdventureIsland"("lostArkDate", "period");',
    );
    await client.end();
    console.log("Development database schema is ready.");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
