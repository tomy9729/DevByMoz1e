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
    await client.query(`DO $$ BEGIN
        CREATE TYPE "CalendarOwnerType" AS ENUM ('personal', 'group');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;`);
    await client.query(`DO $$ BEGIN
        CREATE TYPE "CalendarScheduleKind" AS ENUM ('lostarkSystem', 'user');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;`);
    await client.query(`DO $$ BEGIN
        CREATE TYPE "CalendarAlarmChannel" AS ENUM ('kakaoDirect', 'kakaoGroup');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;`);
    await client.query(`CREATE TABLE IF NOT EXISTS "CalendarOwner" (
        "id" TEXT PRIMARY KEY,
        "type" "CalendarOwnerType" NOT NULL,
        "kakaoUserKey" TEXT,
        "kakaoRoomKey" TEXT,
        "displayName" TEXT,
        "enabled" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);
    await client.query(
        'CREATE UNIQUE INDEX IF NOT EXISTS "CalendarOwner_type_kakaoUserKey_key" ON "CalendarOwner"("type", "kakaoUserKey");',
    );
    await client.query(
        'CREATE UNIQUE INDEX IF NOT EXISTS "CalendarOwner_type_kakaoRoomKey_key" ON "CalendarOwner"("type", "kakaoRoomKey");',
    );
    await client.query(
        'CREATE INDEX IF NOT EXISTS "CalendarOwner_enabled_idx" ON "CalendarOwner"("enabled");',
    );
    await client.query(`CREATE TABLE IF NOT EXISTS "LostArkSchedulePreference" (
        "id" TEXT PRIMARY KEY,
        "ownerId" TEXT NOT NULL REFERENCES "CalendarOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "scheduleKey" TEXT NOT NULL,
        "scheduleType" TEXT NOT NULL,
        "isVisible" BOOLEAN NOT NULL DEFAULT true,
        "alarmEnabled" BOOLEAN NOT NULL DEFAULT false,
        "color" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);
    await client.query(
        'CREATE UNIQUE INDEX IF NOT EXISTS "LostArkSchedulePreference_ownerId_scheduleKey_key" ON "LostArkSchedulePreference"("ownerId", "scheduleKey");',
    );
    await client.query(
        'CREATE INDEX IF NOT EXISTS "LostArkSchedulePreference_ownerId_scheduleType_idx" ON "LostArkSchedulePreference"("ownerId", "scheduleType");',
    );
    await client.query(`CREATE TABLE IF NOT EXISTS "CalendarScheduleTypePreference" (
        "id" TEXT PRIMARY KEY,
        "ownerId" TEXT NOT NULL REFERENCES "CalendarOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "scheduleType" TEXT NOT NULL,
        "isVisible" BOOLEAN NOT NULL DEFAULT true,
        "alarmEnabled" BOOLEAN NOT NULL DEFAULT false,
        "color" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);
    await client.query(
        'CREATE UNIQUE INDEX IF NOT EXISTS "CalendarScheduleTypePreference_ownerId_scheduleType_key" ON "CalendarScheduleTypePreference"("ownerId", "scheduleType");',
    );
    await client.query(`CREATE TABLE IF NOT EXISTS "UserCalendarSchedule" (
        "id" TEXT PRIMARY KEY,
        "ownerId" TEXT NOT NULL REFERENCES "CalendarOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "title" TEXT NOT NULL,
        "scheduleDate" TEXT NOT NULL,
        "startDateTime" TEXT,
        "endDateTime" TEXT,
        "allDay" BOOLEAN NOT NULL DEFAULT true,
        "description" TEXT,
        "color" TEXT,
        "isVisible" BOOLEAN NOT NULL DEFAULT true,
        "sortOrder" INTEGER NOT NULL DEFAULT 100,
        "rawData" JSONB NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);
    await client.query(
        'CREATE INDEX IF NOT EXISTS "UserCalendarSchedule_ownerId_scheduleDate_idx" ON "UserCalendarSchedule"("ownerId", "scheduleDate");',
    );
    await client.query(`CREATE TABLE IF NOT EXISTS "CalendarScheduleAlarm" (
        "id" TEXT PRIMARY KEY,
        "ownerId" TEXT NOT NULL REFERENCES "CalendarOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "scheduleKind" "CalendarScheduleKind" NOT NULL,
        "scheduleKey" TEXT,
        "userScheduleId" TEXT REFERENCES "UserCalendarSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "enabled" BOOLEAN NOT NULL DEFAULT true,
        "remindMinutes" INTEGER NOT NULL DEFAULT 0,
        "channel" "CalendarAlarmChannel" NOT NULL,
        "message" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);
    await client.query(
        'CREATE INDEX IF NOT EXISTS "CalendarScheduleAlarm_ownerId_scheduleKind_scheduleKey_idx" ON "CalendarScheduleAlarm"("ownerId", "scheduleKind", "scheduleKey");',
    );
    await client.query(
        'CREATE INDEX IF NOT EXISTS "CalendarScheduleAlarm_userScheduleId_idx" ON "CalendarScheduleAlarm"("userScheduleId");',
    );
    await client.query(`CREATE TABLE IF NOT EXISTS "BotAlarmSetting" (
        "key" TEXT PRIMARY KEY,
        "enabled" BOOLEAN NOT NULL DEFAULT true,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);
    await client.query(`CREATE TABLE IF NOT EXISTS "BotAlarmTarget" (
        "id" TEXT PRIMARY KEY,
        "room" TEXT NOT NULL,
        "packageName" TEXT,
        "enabled" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);
    await client.query(
        'CREATE UNIQUE INDEX IF NOT EXISTS "BotAlarmTarget_room_key" ON "BotAlarmTarget"("room");',
    );
    await client.query(
        'CREATE INDEX IF NOT EXISTS "BotAlarmTarget_enabled_idx" ON "BotAlarmTarget"("enabled");',
    );
    await client.query(`CREATE TABLE IF NOT EXISTS "BotAlarmDelivery" (
        "id" TEXT PRIMARY KEY,
        "alarmType" TEXT NOT NULL,
        "scheduleKey" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "message" TEXT,
        "errorReason" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);
    await client.query(
        'CREATE UNIQUE INDEX IF NOT EXISTS "BotAlarmDelivery_alarmType_scheduleKey_key" ON "BotAlarmDelivery"("alarmType", "scheduleKey");',
    );
    await client.query(
        'CREATE INDEX IF NOT EXISTS "BotAlarmDelivery_status_createdAt_idx" ON "BotAlarmDelivery"("status", "createdAt");',
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
        "accessories" JSONB NOT NULL,
        "abilityStone" JSONB NOT NULL,
        "gems" JSONB NOT NULL,
        "cards" JSONB NOT NULL,
        "engravings" JSONB NOT NULL,
        "bracelet" JSONB NOT NULL,
        "skills" JSONB NOT NULL,
        "arkPassive" JSONB NOT NULL,
        "avatars" JSONB NOT NULL,
        "profile" JSONB NOT NULL,
        "collectibles" JSONB NOT NULL,
        "arkGrid" JSONB NOT NULL,
        "other" JSONB NOT NULL,
        "rawData" JSONB NOT NULL,
        "refreshedAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`);
    await client.query('ALTER TABLE "CharacterInfo" ADD COLUMN IF NOT EXISTS "accessories" JSONB NOT NULL DEFAULT \'[]\';');
    await client.query('ALTER TABLE "CharacterInfo" ADD COLUMN IF NOT EXISTS "abilityStone" JSONB NOT NULL DEFAULT \'null\';');
    await client.query('ALTER TABLE "CharacterInfo" ADD COLUMN IF NOT EXISTS "skills" JSONB NOT NULL DEFAULT \'[]\';');
    await client.query('ALTER TABLE "CharacterInfo" ADD COLUMN IF NOT EXISTS "arkPassive" JSONB NOT NULL DEFAULT \'{}\';');
    await client.query('ALTER TABLE "CharacterInfo" ADD COLUMN IF NOT EXISTS "arkGrid" JSONB NOT NULL DEFAULT \'{}\';');
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
