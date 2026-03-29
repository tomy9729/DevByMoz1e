const CALENDAR_EVENT_COLORS = {
    event: {
        backgroundColor: "#5b7c99",
        borderColor: "#446178",
        textColor: "#f6fbff",
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
                backgroundColor: "#c84f7a",
                borderColor: "#a3385f",
                textColor: "#fff4f8",
            },
            oceanCoinChest: {
                backgroundColor: "#d97f32",
                borderColor: "#b96521",
                textColor: "#fff8f0",
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
