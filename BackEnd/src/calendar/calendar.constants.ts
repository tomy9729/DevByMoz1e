export const ADVENTURE_ISLAND_CALENDAR_SOURCE_TYPE = "adventureIsland";

export const ADVENTURE_ISLAND_CALENDAR_DEFINITIONS = {
    gold: {
        name: "모험섬 골드",
        defaultColor: "#f59e0b",
        sortOrder: 10,
    },
    card: {
        name: "모험섬 카드",
        defaultColor: "#8b5cf6",
        sortOrder: 20,
    },
    oceanCoin: {
        name: "모험섬 대양의 주화",
        defaultColor: "#0ea5e9",
        sortOrder: 30,
    },
    shilling: {
        name: "모험섬 실링",
        defaultColor: "#64748b",
        sortOrder: 40,
    },
    other: {
        name: "모험섬 기타",
        defaultColor: "#10b981",
        sortOrder: 90,
    },
} as const;

export type AdventureIslandCalendarKey = keyof typeof ADVENTURE_ISLAND_CALENDAR_DEFINITIONS;

export const USER_DEFAULT_CALENDAR_DEFINITION = {
    name: "사용자 일정",
    defaultColor: "#22c55e",
    sortOrder: 1000,
} as const;

export const LOSTARK_NOTICE_CALENDAR_SOURCE_TYPE = "lostarkNotice";

export const LOSTARK_NOTICE_CALENDAR_DEFINITIONS = {
    notice: {
        name: "로스트아크 공지사항",
        defaultColor: "#3b82f6",
        sortOrder: 100,
    },
    patchNote: {
        name: "로스트아크 패치노트",
        defaultColor: "#ef4444",
        sortOrder: 110,
    },
} as const;

export type LostArkNoticeCalendarKey = keyof typeof LOSTARK_NOTICE_CALENDAR_DEFINITIONS;
