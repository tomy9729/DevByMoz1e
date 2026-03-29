const CALENDAR_EVENT_COLORS = {
    event: {
        backgroundColor: "#d97f32",
        borderColor: "#b96521",
        textColor: "#fff8f0",
    },
    chaosGate: {
        backgroundColor: "#7b3fe4",
        borderColor: "#5e2db8",
        textColor: "#f8f2ff",
    },
    fieldBoss: {
        backgroundColor: "#c24444",
        borderColor: "#9f2f2f",
        textColor: "#fff5f5",
    },
    adventureIsland: {
        default: {
            backgroundColor: "#2f8f83",
            borderColor: "#216c62",
            textColor: "#f2fffc",
        },
        rewards: {
            gold: {
                backgroundColor: "#d4a017",
                borderColor: "#a67a00",
                textColor: "#fff9e8",
            },
            shilling: {
                backgroundColor: "#9aa4b2",
                borderColor: "#768191",
                textColor: "#f8fbff",
            },
            legendCardPackIv: {
                backgroundColor: "#7a4bc2",
                borderColor: "#5b3698",
                textColor: "#f8f1ff",
            },
            oceanCoinChest: {
                backgroundColor: "#2d7dd2",
                borderColor: "#1f5d9f",
                textColor: "#f2f8ff",
            },
        },
    },
};

export function getCalendarEventColors(contentType, rewardTypeKey = "") {
    if (contentType === "adventureIsland") {
        return (
            CALENDAR_EVENT_COLORS.adventureIsland.rewards[rewardTypeKey] ??
            CALENDAR_EVENT_COLORS.adventureIsland.default
        );
    }

    return CALENDAR_EVENT_COLORS[contentType] ?? CALENDAR_EVENT_COLORS.event;
}
