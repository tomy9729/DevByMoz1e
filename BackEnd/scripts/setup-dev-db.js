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
        "sourceType" TEXT NOT NULL DEFAULT 'api',
        "sourceKey" TEXT,
        "rewardName" TEXT,
        "rewardShortName" TEXT,
        "rewardIconUrl" TEXT,
        "contentIconUrl" TEXT,
        "contentImageUrl" TEXT,
        "startTime" TEXT NOT NULL,
        "rawData" JSONB NOT NULL,
        "collectedAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);
    await client.query('ALTER TABLE "AdventureIsland" ADD COLUMN IF NOT EXISTS "sourceType" TEXT NOT NULL DEFAULT \'api\';');
    await client.query('ALTER TABLE "AdventureIsland" ADD COLUMN IF NOT EXISTS "sourceKey" TEXT;');
    await client.query('ALTER TABLE "AdventureIsland" ADD COLUMN IF NOT EXISTS "rewardIconUrl" TEXT;');
    await client.query('ALTER TABLE "AdventureIsland" ADD COLUMN IF NOT EXISTS "contentIconUrl" TEXT;');
    await client.query('ALTER TABLE "AdventureIsland" ADD COLUMN IF NOT EXISTS "contentImageUrl" TEXT;');
    await client.query(
        'CREATE UNIQUE INDEX IF NOT EXISTS "AdventureIsland_lostArkDate_period_contentsName_key" ON "AdventureIsland"("lostArkDate", "period", "contentsName");',
    );
    await client.query(
        'CREATE INDEX IF NOT EXISTS "AdventureIsland_lostArkDate_period_idx" ON "AdventureIsland"("lostArkDate", "period");',
    );
    await client.query(
        'CREATE INDEX IF NOT EXISTS "AdventureIsland_sourceType_sourceKey_lostArkDate_period_idx" ON "AdventureIsland"("sourceType", "sourceKey", "lostArkDate", "period");',
    );
    await client.query(`CREATE TABLE IF NOT EXISTS "AdventureIslandTest" (
        "id" TEXT PRIMARY KEY,
        "sourceKey" TEXT NOT NULL,
        "lostArkDate" TEXT NOT NULL,
        "period" "AdventureIslandPeriod" NOT NULL,
        "categoryName" TEXT NOT NULL,
        "contentsName" TEXT NOT NULL,
        "shortName" TEXT NOT NULL,
        "rewardName" TEXT,
        "rewardShortName" TEXT,
        "rewardIconUrl" TEXT,
        "contentIconUrl" TEXT,
        "contentImageUrl" TEXT,
        "startTime" TEXT NOT NULL,
        "rawData" JSONB NOT NULL,
        "collectedAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);
    await client.query(
        'CREATE UNIQUE INDEX IF NOT EXISTS "AdventureIslandTest_sourceKey_lostArkDate_period_contentsName_key" ON "AdventureIslandTest"("sourceKey", "lostArkDate", "period", "contentsName");',
    );
    await client.query(
        'CREATE INDEX IF NOT EXISTS "AdventureIslandTest_sourceKey_lostArkDate_period_idx" ON "AdventureIslandTest"("sourceKey", "lostArkDate", "period");',
    );
    await client.query(`CREATE TABLE IF NOT EXISTS "LostArkNotice" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "noticeDate" TIMESTAMP(3) NOT NULL,
        "link" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "rawData" JSONB NOT NULL,
        "collectedAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);
    await client.query(
        'CREATE UNIQUE INDEX IF NOT EXISTS "LostArkNotice_link_key" ON "LostArkNotice"("link");',
    );
    await client.query(
        'CREATE INDEX IF NOT EXISTS "LostArkNotice_noticeDate_type_idx" ON "LostArkNotice"("noticeDate", "type");',
    );
    await client.query(`CREATE TABLE IF NOT EXISTS "CharacterInfo" (
        "characterName" TEXT PRIMARY KEY,
        "serverName" TEXT,
        "className" TEXT,
        "itemLevel" TEXT,
        "rosterLevel" INTEGER,
        "guildName" TEXT,
        "pvpInfo" JSONB NOT NULL,
        "combatInfo" JSONB NOT NULL,
        "equipment" JSONB NOT NULL,
        "gems" JSONB NOT NULL,
        "cards" JSONB NOT NULL,
        "engravings" JSONB NOT NULL,
        "bracelet" JSONB NOT NULL,
        "avatars" JSONB NOT NULL,
        "profile" JSONB NOT NULL,
        "collectibles" JSONB NOT NULL,
        "other" JSONB NOT NULL,
        "rawData" JSONB NOT NULL,
        "refreshedAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);
    await client.query(
        'CREATE INDEX IF NOT EXISTS "CharacterInfo_serverName_characterName_idx" ON "CharacterInfo"("serverName", "characterName");',
    );
    await client.query(
        'CREATE INDEX IF NOT EXISTS "CharacterInfo_refreshedAt_idx" ON "CharacterInfo"("refreshedAt");',
    );
    await client.end();
    console.log("Development database schema is ready.");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
