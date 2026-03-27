export const islandNameShort = {
    "하모니 섬": "하모니",
    "고요한 안식의 섬": "고안섬",
    "기회의 섬": "기회섬",
    "쿵덕쿵 아일랜드": "쿵덕쿵",
    "블루홀 섬": "블루홀",
    "볼라르 섬": "볼라르",
    "죽음의 협곡": "죽협",
    "슬라임 아일랜드": "슬라임",
    메데이아: "메데이아",
    알라케르: "알라케르",
    "모코코 아일랜드": "모코코",
    포르페: "포르페",
    "스노우팡 아일랜드": "스노우팡",
    "잔혹한 장난감 성": "잔장섬",
    "우거진 갈대의 섬": "우갈섬",
    "라일라이 아일랜드": "라일라이",
};

export const rewardItemShort = {
    "대륙의 주화 상자/해적 주화": "해주",
    "대륙의 주화 상자": "해주",
    "해적 주화": "해주",
    "전설 ~ 고급 카드 팩 III/전설 ~ 고급 카드 팩 IV/영웅 호감도 상자": "카드",
    "전설 ~ 고급 카드 팩 III": "카드",
    "전설 ~ 고급 카드 팩 IV": "카드",
    "영웅 호감도 상자": "카드",
    실링: "실링",
    골드: "골드",
    해적주화: "해주",
    카드: "카드",
};

export function getShortIslandName(name) {
    return islandNameShort[name] ?? name;
}

export function getShortRewardName(name) {
    return rewardItemShort[name] ?? name;
}
