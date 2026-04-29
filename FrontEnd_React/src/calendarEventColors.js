export const CALENDAR_EVENT_COLORS = {
    event: {
        backgroundColor: "#5b7c99",
        borderColor: "#446178",
        textColor: "#f6fbff",
    },
    notice: {
        backgroundColor: "#2f6f7e",
        borderColor: "#225360",
        textColor: "#f2fcff",
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
    package: {
        backgroundColor: "#8a6f3f",
        borderColor: "#6b552e",
        textColor: "#fff8e8",
    },
    custom: {
        backgroundColor: "#565b66",
        borderColor: "#3f444d",
        textColor: "#f8fafc",
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

/**
 * 20260428 khs
 * 역할: 콘텐츠 타입별 기본 배경색을 반환한다.
 * 파라미터 설명:
 * - contentType: 조회할 일정 타입 키
 * 반환값 설명: 타입에 매칭되는 기본 배경색 문자열
 */
export function getDefaultCalendarEventBackgroundColor(contentType) {
    return getCalendarEventColors(contentType).backgroundColor;
}
