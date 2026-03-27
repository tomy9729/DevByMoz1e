import { getShortIslandName, getShortRewardName } from "../mappings/lostark.js";

const LOSTARK_EVENTS_ENDPOINT = "/api/lostark/news/events";
const LOSTARK_GAME_CONTENTS_ENDPOINT = "/api/lostark/gamecontents/calendar";
const DISPLAYABLE_GAME_CONTENT_TYPES = [
    {
        key: "adventureIsland",
        label: "\ubaa8\ud5d8\uc12c",
        keywords: ["\ubaa8\ud5d8\uc12c", "\ubaa8\ud5d8 \uc12c"],
    },
    {
        key: "chaosGate",
        label: "\uce74\uc624\uc2a4\uac8c\uc774\ud2b8",
        keywords: ["\uce74\uc624\uc2a4\uac8c\uc774\ud2b8", "\uce74\uc624\uc2a4 \uac8c\uc774\ud2b8"],
    },
    {
        key: "fieldBoss",
        label: "\ud544\ub4dc\ubcf4\uc2a4",
        keywords: ["\ud544\ub4dc\ubcf4\uc2a4", "\ud544\ub4dc \ubcf4\uc2a4"],
    },
];
const ADVENTURE_ISLAND_REWARD_TYPES = [
    { key: "gold", label: "골드", keywords: ["골드"] },
    { key: "card", label: "카드", keywords: ["카드"] },
    { key: "shilling", label: "실링", keywords: ["실링"] },
    { key: "pirateCoin", label: "해적주화", keywords: ["해적주화", "해적 주화"] },
];

function toDateOnly(dateTime) {
    return dateTime.split("T")[0];
}

function parseDateTime(dateTime) {
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

function formatDateParts(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toLocalDateOnly(date = new Date()) {
    return formatDateParts(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function toLostArkDateOnly(dateTime) {
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

function getLostArkMinutesFromDayStart(dateTime) {
    const { hour, minute } = parseDateTime(dateTime);
    const adjustedHour = hour < 6 ? hour + 24 : hour;

    return (adjustedHour - 6) * 60 + minute;
}

function isWeekendLostArkDate(dateText) {
    const targetDate = new Date(`${dateText}T00:00:00`);
    const dayOfWeek = targetDate.getDay();

    return dayOfWeek === 0 || dayOfWeek === 6;
}

function getAdventureIslandPeriod(startTime) {
    const lostArkDate = toLostArkDateOnly(startTime);

    if (!isWeekendLostArkDate(lostArkDate)) {
        return "weekday";
    }

    return getLostArkMinutesFromDayStart(startTime) <= 7 * 60
        ? "weekendMorning"
        : "weekendAfternoon";
}

function addOneDay(dateText) {
    const [year, month, day] = dateText.split("-").map(Number);
    const nextDate = new Date(year, month - 1, day + 1);
    const nextYear = nextDate.getFullYear();
    const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
    const nextDay = String(nextDate.getDate()).padStart(2, "0");

    return `${nextYear}-${nextMonth}-${nextDay}`;
}

function isOngoingEvent(startDate, endDate, now = new Date()) {
    const start = toDateOnly(startDate);
    const end = toDateOnly(endDate);
    const today = toLocalDateOnly(now);

    return start <= today && today <= end;
}

function normalizeContentText(value = "") {
    return value.replace(/\s+/g, "").toLowerCase();
}

function isIslandContent(content) {
    const categoryName = normalizeContentText(content.CategoryName);
    const contentsName = normalizeContentText(content.ContentsName);
    const bracketIslandKeyword = normalizeContentText("[\uc12c]");

    return (
        categoryName.includes(bracketIslandKeyword) ||
        contentsName.includes(bracketIslandKeyword)
    );
}

function isAdventureIslandContent(content) {
    const adventureIslandType = DISPLAYABLE_GAME_CONTENT_TYPES.find(
        (type) => type.key === "adventureIsland",
    );

    if (!adventureIslandType) {
        return false;
    }

    const categoryName = normalizeContentText(content.CategoryName);
    const contentsName = normalizeContentText(content.ContentsName);

    return adventureIslandType.keywords.some((keyword) => {
        const normalizedKeyword = normalizeContentText(keyword);

        return (
            categoryName.includes(normalizedKeyword) ||
            contentsName.includes(normalizedKeyword)
        );
    });
}

function getDisplayableGameContentType(content) {
    if (isAdventureIslandContent(content)) {
        return DISPLAYABLE_GAME_CONTENT_TYPES.find(
            (type) => type.key === "adventureIsland",
        );
    }

    if (isIslandContent(content)) {
        return null;
    }

    const categoryName = normalizeContentText(content.CategoryName);
    const contentsName = normalizeContentText(content.ContentsName);

    return (
        DISPLAYABLE_GAME_CONTENT_TYPES.find((type) =>
            type.keywords.some((keyword) => {
                const normalizedKeyword = normalizeContentText(keyword);

                return (
                    categoryName.includes(normalizedKeyword) ||
                    contentsName.includes(normalizedKeyword)
                );
            }),
        ) ?? null
    );
}

function getAdventureIslandRewardNames(content) {
    const rewardItems = Array.isArray(content.RewardItems) ? content.RewardItems : [];
    const flattenedRewardItems = rewardItems.flatMap((rewardGroup) => {
        if (Array.isArray(rewardGroup?.Items)) {
            return rewardGroup.Items;
        }

        if (Array.isArray(rewardGroup)) {
            return rewardGroup;
        }

        return rewardGroup ? [rewardGroup] : [];
    });
    const rewardLabelsByType = new Map();

    flattenedRewardItems.forEach((rewardItem) => {
        if (!Array.isArray(rewardItem?.StartTimes) || rewardItem.StartTimes.length === 0) {
            return;
        }

        const rewardName = normalizeContentText(rewardItem?.Name ?? "");
        const rewardType = ADVENTURE_ISLAND_REWARD_TYPES.find((type) =>
            type.keywords.some((keyword) =>
                rewardName.includes(normalizeContentText(keyword))
            )
        );

        if (rewardType && !rewardLabelsByType.has(rewardType.key)) {
            rewardLabelsByType.set(
                rewardType.key,
                getShortRewardName(rewardItem?.Name ?? rewardType.label),
            );
        }
    });

    return [...rewardLabelsByType.values()];
}

function getGameContentEventTitle(content, displayType) {
    if (displayType.key !== "adventureIsland") {
        return displayType.label;
    }

    const rewardNames = getAdventureIslandRewardNames(content);
    const rewardText = rewardNames.length > 0 ? ` (${rewardNames.join(", ")})` : "";

    return `${getShortIslandName(content.ContentsName)}${rewardText}`;
}

export function mapLostArkEventToCalendarEvent(event) {
    const start = toDateOnly(event.StartDate);
    const inclusiveEnd = toDateOnly(event.EndDate);

    return {
        id: `${event.Title}-${event.StartDate}`,
        title: event.Title,
        start,
        end: addOneDay(inclusiveEnd),
        allDay: true,
        url: event.Link,
        extendedProps: {
            link: event.Link,
            sourceStartDate: event.StartDate,
            sourceEndDate: event.EndDate,
        },
    };
}

export function mapLostArkGameContentToCalendarEvents(content) {
    const displayType = getDisplayableGameContentType(content);

    if (!displayType) {
        return [];
    }

    return (content.StartTimes ?? []).map((startTime) => {
        const lostArkDate = toLostArkDateOnly(startTime);

        return {
            id: `${displayType.key}-${lostArkDate}-${content.ContentsName}`,
            title: getGameContentEventTitle(content, displayType),
            start: lostArkDate,
            allDay: true,
            extendedProps: {
                categoryName: content.CategoryName,
                contentsName: content.ContentsName,
                contentType: displayType.key,
                period:
                    displayType.key === "adventureIsland"
                        ? getAdventureIslandPeriod(startTime)
                        : null,
                sourceStartTime: startTime,
            },
        };
    });
}

function dedupeGameContentEvents(events) {
    const uniqueEvents = new Map();
    const adventureIslandGroups = new Map();

    events.forEach((event) => {
        if (event.extendedProps.contentType !== "adventureIsland") {
            const uniqueKey = `${event.start}-${event.extendedProps.contentType}`;

            if (!uniqueEvents.has(uniqueKey)) {
                uniqueEvents.set(uniqueKey, event);
            }

            return;
        }

        const adventureIslandUniqueKey = [
            event.start,
            event.extendedProps.period,
            event.extendedProps.contentsName,
        ].join("-");

        if (uniqueEvents.has(adventureIslandUniqueKey)) {
            return;
        }

        uniqueEvents.set(adventureIslandUniqueKey, event);

        const groupKey = `${event.start}-${event.extendedProps.period}`;
        const groupedEvents = adventureIslandGroups.get(groupKey) ?? [];

        groupedEvents.push(event);
        adventureIslandGroups.set(groupKey, groupedEvents);
    });

    const nonAdventureIslandEvents = [...uniqueEvents.entries()]
        .filter(([, event]) => event.extendedProps.contentType !== "adventureIsland")
        .map(([, event]) => event);
    const adventureIslandEvents = [...adventureIslandGroups.values()].flatMap((group) =>
        group.slice(0, 3)
    );

    return [...nonAdventureIslandEvents, ...adventureIslandEvents];
}

async function fetchLostArkEvents() {
    const response = await fetch(LOSTARK_EVENTS_ENDPOINT, {
        headers: {
            accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch Lost Ark events: ${response.status}`);
    }

    return response.json();
}

async function fetchLostArkGameContents() {
    const response = await fetch(LOSTARK_GAME_CONTENTS_ENDPOINT, {
        headers: {
            accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch Lost Ark game contents: ${response.status}`);
    }

    return response.json();
}

export async function fetchLostArkCalendarEvents() {
    const [events, gameContents] = await Promise.all([
        fetchLostArkEvents(),
        fetchLostArkGameContents(),
    ]);

    const newsEvents = events
        .filter((event) => isOngoingEvent(event.StartDate, event.EndDate))
        .map((event) => mapLostArkEventToCalendarEvent(event));

    const contentEvents = dedupeGameContentEvents(
        gameContents.flatMap((content) => mapLostArkGameContentToCalendarEvents(content)),
    );

    return [...newsEvents, ...contentEvents];
}
