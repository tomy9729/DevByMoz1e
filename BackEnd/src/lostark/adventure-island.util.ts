import { AdventureIslandPeriod } from "@prisma/client";
import {
    ADVENTURE_ISLAND_KEYWORDS,
    ADVENTURE_ISLAND_MAJOR_REWARDS,
    ADVENTURE_ISLAND_REWARD_SHORT_NAMES,
    ADVENTURE_ISLAND_SHORT_NAMES,
} from "./lostark.constants";
import { LostArkGameContent, LostArkRewardItem } from "./lostark.types";

export interface AdventureIslandRecordInput {
    lostArkDate: string;
    period: AdventureIslandPeriod;
    categoryName: string;
    contentsName: string;
    shortName: string;
    rewardName: string | null;
    rewardShortName: string | null;
    rewardIconUrl: string | null;
    contentIconUrl: string | null;
    contentImageUrl: string | null;
    startTime: string;
    rawData: LostArkGameContent;
}

function parseDateTime(dateTime: string) {
    const [datePart, timePart = "00:00:00"] = dateTime.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour = 0, minute = 0] = timePart.split(":").map(Number);

    return {
        year,
        month,
        day,
        hour,
        minute,
    };
}

function formatDateParts(year: number, month: number, day: number) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeContentText(value = "") {
    return value.replace(/\s+/g, "").toLowerCase();
}

function toLostArkDateOnly(dateTime: string) {
    const { year, month, day, hour } = parseDateTime(dateTime);
    const targetDate = new Date(year, month - 1, day);

    if (hour < 6) {
        targetDate.setDate(targetDate.getDate() - 1);
    }

    return formatDateParts(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        targetDate.getDate(),
    );
}

function getLostArkMinutesFromDayStart(dateTime: string) {
    const { hour, minute } = parseDateTime(dateTime);
    const adjustedHour = hour < 6 ? hour + 24 : hour;

    return (adjustedHour - 6) * 60 + minute;
}

function isWeekendLostArkDate(dateText: string) {
    const targetDate = new Date(`${dateText}T00:00:00`);
    const dayOfWeek = targetDate.getDay();

    return dayOfWeek === 0 || dayOfWeek === 6;
}

function getAdventureIslandPeriod(startTime: string): AdventureIslandPeriod {
    const lostArkDate = toLostArkDateOnly(startTime);

    if (!isWeekendLostArkDate(lostArkDate)) {
        return AdventureIslandPeriod.weekday;
    }

    return getLostArkMinutesFromDayStart(startTime) <= 7 * 60
        ? AdventureIslandPeriod.weekendMorning
        : AdventureIslandPeriod.weekendAfternoon;
}

function flattenRewardItems(content: LostArkGameContent): LostArkRewardItem[] {
    const rewardItems = Array.isArray(content.RewardItems) ? content.RewardItems : [];

    return rewardItems.flatMap((rewardGroup) => {
        const groupedRewardItems = rewardGroup as { Items?: LostArkRewardItem[] };

        if (Array.isArray(groupedRewardItems?.Items)) {
            return groupedRewardItems.Items;
        }

        if (Array.isArray(rewardGroup)) {
            return rewardGroup;
        }

        return rewardGroup ? [rewardGroup as LostArkRewardItem] : [];
    });
}

function getAdventureIslandReward(content: LostArkGameContent, startTime: string) {
    for (const rewardItem of flattenRewardItems(content)) {
        if (!Array.isArray(rewardItem?.StartTimes) || rewardItem.StartTimes.length === 0) {
            continue;
        }

        if (!rewardItem.StartTimes.includes(startTime)) {
            continue;
        }

        const normalizedRewardName = normalizeContentText(rewardItem.Name ?? "");
        const isMajorReward = ADVENTURE_ISLAND_MAJOR_REWARDS.some((rewardType) =>
            rewardType.sourceNames.some(
                (sourceName) => normalizedRewardName === normalizeContentText(sourceName),
            ),
        );

        if (!isMajorReward) {
            continue;
        }

        return {
            rewardName: rewardItem.Name ?? "",
            rewardIconUrl: rewardItem.Icon ?? "",
        };
    }

    return {
        rewardName: "",
        rewardIconUrl: "",
    };
}

function getGameContentIconUrl(content: LostArkGameContent) {
    return content.ContentsIcon ?? content.Icon ?? "";
}

function getGameContentImageUrl(content: LostArkGameContent) {
    return content.Image ?? content.ContentsIcon ?? content.Icon ?? "";
}

function isAdventureIslandContent(content: LostArkGameContent) {
    const categoryName = normalizeContentText(content.CategoryName);
    const contentsName = normalizeContentText(content.ContentsName);

    return ADVENTURE_ISLAND_KEYWORDS.some((keyword) => {
        const normalizedKeyword = normalizeContentText(keyword);

        return (
            categoryName === normalizedKeyword ||
            contentsName === normalizedKeyword ||
            categoryName.includes(normalizedKeyword) ||
            contentsName.includes(normalizedKeyword)
        );
    });
}

export function extractAdventureIslandRecords(
    contents: LostArkGameContent[],
): AdventureIslandRecordInput[] {
    const uniqueRecords = new Map<string, AdventureIslandRecordInput>();
    const groupedRecords = new Map<string, AdventureIslandRecordInput[]>();

    for (const content of contents) {
        if (!isAdventureIslandContent(content)) {
            continue;
        }

        for (const startTime of content.StartTimes ?? []) {
            const lostArkDate = toLostArkDateOnly(startTime);
            const period = getAdventureIslandPeriod(startTime);
            const uniqueKey = [lostArkDate, period, content.ContentsName].join("|");

            if (uniqueRecords.has(uniqueKey)) {
                continue;
            }

            const reward = getAdventureIslandReward(content, startTime);
            const rewardName = reward.rewardName;
            const record: AdventureIslandRecordInput = {
                lostArkDate,
                period,
                categoryName: content.CategoryName,
                contentsName: content.ContentsName,
                shortName: ADVENTURE_ISLAND_SHORT_NAMES[content.ContentsName] ?? content.ContentsName,
                rewardName: rewardName || null,
                rewardShortName: rewardName
                    ? ADVENTURE_ISLAND_REWARD_SHORT_NAMES[rewardName] ?? rewardName
                    : null,
                rewardIconUrl: reward.rewardIconUrl || null,
                contentIconUrl: getGameContentIconUrl(content) || null,
                contentImageUrl: getGameContentImageUrl(content) || null,
                startTime,
                rawData: content,
            };

            uniqueRecords.set(uniqueKey, record);

            const groupKey = `${lostArkDate}|${period}`;
            const groupedItems = groupedRecords.get(groupKey) ?? [];

            groupedItems.push(record);
            groupedRecords.set(groupKey, groupedItems);
        }
    }

    return [...groupedRecords.values()].flatMap((group) => group.slice(0, 3));
}
