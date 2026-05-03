export const ADVENTURE_ISLAND_CALENDAR_SOURCE_TYPE = "adventureIsland";

export const ADVENTURE_ISLAND_CALENDAR_DEFINITIONS = {
    gold: {
        name: "모험섬 골드",
        defaultColor: "#f59e0b",
        iconUrl: "https://cdn-lostark.game.onstove.com/efui_iconatlas/money/money_4.png",
        sortOrder: 10,
    },
    card: {
        name: "모험섬 카드",
        defaultColor: "#8b5cf6",
        iconUrl: "https://cdn-lostark.game.onstove.com/efui_iconatlas/use/use_10_236.png",
        sortOrder: 20,
    },
    oceanCoin: {
        name: "모험섬 대양의 주화",
        defaultColor: "#f97316",
        iconUrl: "https://cdn-lostark.game.onstove.com/efui_iconatlas/use/use_2_8.png",
        sortOrder: 30,
    },
    shilling: {
        name: "모험섬 실링",
        defaultColor: "#64748b",
        iconUrl: "https://cdn-lostark.game.onstove.com/efui_iconatlas/etc/etc_14.png",
        sortOrder: 40,
    },
} as const;

export type AdventureIslandCalendarKey = keyof typeof ADVENTURE_ISLAND_CALENDAR_DEFINITIONS;

export const LOSTARK_NOTICE_CALENDAR_SOURCE_TYPE = "lostarkNotice";

export const LOSTARK_NOTICE_CALENDAR_DEFINITIONS = {
    notice: {
        name: "공지사항",
        defaultColor: "#3b82f6",
        sortOrder: 100,
    },
    patchNote: {
        name: "패치노트",
        defaultColor: "#ef4444",
        sortOrder: 110,
    },
} as const;

export type LostArkNoticeCalendarKey = keyof typeof LOSTARK_NOTICE_CALENDAR_DEFINITIONS;
