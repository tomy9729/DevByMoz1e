export const LOSTARK_EVENTS_URL = "https://developer-lostark.game.onstove.com/news/events";
export const LOSTARK_CALENDAR_URL =
    "https://developer-lostark.game.onstove.com/gamecontents/calendar";

export const ADVENTURE_ISLAND_KEYWORDS = ["모험섬", "모험 섬"];

export const ADVENTURE_ISLAND_SHORT_NAMES: Record<string, string> = {
    "고요한 안식의 섬": "고안섬",
    "기회의 섬": "기회섬",
    메데이아: "메데이아",
    "블루홀 섬": "블루홀",
    "볼라르 섬": "볼라르",
    "하모니 섬": "하모니",
    "쿵덕쿵 아일랜드": "쿵덕쿵",
    포르페: "포르페",
    "잠자는 노래의 섬": "잠노섬",
    "죽음의 협곡": "죽협",
    "우거진 갈대의 섬": "우갈섬",
    알라케르: "알라케르",
    "슬라임 아일랜드": "슬라임",
    "잔혹한 장난감 성": "잔장섬",
    "라일라이 아일랜드": "라일라이",
    "스노우팡 아일랜드": "스노우팡",
};

export const ADVENTURE_ISLAND_MAJOR_REWARDS = [
    { key: "gold", sourceNames: ["골드"] },
    { key: "shilling", sourceNames: ["실링"] },
    { key: "oceanCoinChest", sourceNames: ["대양의 주화 상자", "대륙의 주화 상자"] },
    { key: "legendCardPackIv", sourceNames: ["전설 ~ 고급 카드 팩 IV"] },
] as const;

export const ADVENTURE_ISLAND_REWARD_SHORT_NAMES: Record<string, string> = {
    "대양의 주화 상자": "해주",
    "대륙의 주화 상자": "해주",
    "해적 주화": "해주",
    해적주화: "해주",
    "전설 ~ 고급 카드 팩 III": "카드",
    "전설 ~ 고급 카드 팩 IV": "카드",
    "전설 ~ 고급 카드 팩 III/전설 ~ 고급 카드 팩 IV/영웅 호감도 상자": "카드",
    "영웅 호감도 상자": "카드",
    실링: "실링",
    골드: "골드",
    카드: "카드",
};
