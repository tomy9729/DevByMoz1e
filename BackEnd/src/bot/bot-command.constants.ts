export const BOT_COMMANDS = [
    {
        key: "commands",
        category: "기본",
        displayName: "명령어",
        aliases: ["ㅁㄹㅇ"],
        endpoint: "/api/bot/commands",
        description: "명령어 목록 보기",
        usages: [
            {
                names: ["명령어", "ㅁㄹㅇ"],
                description: "명령어 목록 보기",
            },
        ],
    },
    {
        key: "adventureIslands",
        category: "모험섬",
        displayName: "모험섬",
        aliases: ["ㅁㅎㅅ"],
        endpoint: "/api/bot/adventure-islands",
        description: "모험섬 조회",
        usages: [
            {
                names: ["모험섬", "ㅁㅎㅅ"],
                description: "오늘 모험섬 보기",
            },
            {
                names: ["모험섬 주간"],
                description: "이번 주 모험섬 보기",
            },
            {
                names: ["모험섬 월간"],
                description: "이번 달 모험섬 보기",
            },
            {
                names: ["모험섬 2026-04-25"],
                description: "특정 날짜 조회",
            },
            {
                names: ["모험섬 토"],
                description: "특정 요일 조회",
            },
        ],
    },
    {
        key: "characters",
        category: "캐릭터",
        displayName: "캐릭터",
        aliases: [],
        endpoint: "/api/bot/characters",
        description: "캐릭터 정보 조회",
        usages: [
            {
                names: ["캐릭명"],
                description: "캐릭터 전체 정보 조회",
            },
            {
                names: ["캐릭명 새로고침"],
                description: "캐릭터 전체 정보 새로고침 후 조회",
            },
            {
                names: ["캐릭명 장비"],
                description: "장비 정보만 조회",
            },
            {
                names: ["캐릭명 악세"],
                description: "악세 정보만 조회",
            },
            {
                names: ["캐릭명 보석"],
                description: "보석 정보만 조회",
            },
            {
                names: ["캐릭명 스킬"],
                description: "스킬/팔찌/내실/아바타 등 세부 항목 조회 가능",
            },
        ],
    },
] as const;
