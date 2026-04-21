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
                description: "기본 전투 정보, 장비 품질, 악세 효과, 각인서 수치, 돌/팔찌 효과, 스킬, 보석, 내실, 카드 세트, 낙원력/보주 조회",
            },
            {
                names: ["캐릭명 새로고침"],
                description: "캐릭터 전체 정보 새로고침 후 조회",
            },
            {
                names: ["캐릭명 장비"],
                description: "장비별 강화 수치와 품질 조회",
            },
            {
                names: ["캐릭명 악세"],
                description: "악세서리별 보유 효과 조회",
            },
            {
                names: ["캐릭명 어빌리티스톤", "캐릭명 돌"],
                description: "어빌리티 스톤 각인 수치 조회",
            },
            {
                names: ["캐릭명 팔찌"],
                description: "팔찌 보유 효과 전체 조회",
            },
            {
                names: ["캐릭명 보석"],
                description: "보석별 적용 스킬, 레벨, 종류 조회",
            },
            {
                names: ["캐릭명 스킬"],
                description: "1레벨을 제외한 스킬 조회",
            },
            {
                names: ["캐릭명 내실"],
                description: "내실별 달성 수량과 퍼센트 조회",
            },
            {
                names: ["캐릭명 카드"],
                description: "카드 세트명과 적용 중인 카드 효과 조회",
            },
            {
                names: ["캐릭명 낙원력", "캐릭명 보주"],
                description: "낙원력 또는 보주 정보 조회",
            },
        ],
    },
    {
        key: "alarms",
        category: "알람",
        displayName: "알람",
        aliases: [],
        endpoint: "/api/bot/alarms/status",
        description: "알람 관리",
        usages: [
            {
                names: ["알람상태"],
                description: "알람 전체 on/off와 대상 채팅방 확인",
            },
            {
                names: ["알람켜기"],
                description: "전체 알람 켜기",
            },
            {
                names: ["알람끄기"],
                description: "전체 알람 끄기",
            },
            {
                names: ["알람등록"],
                description: "현재 채팅방을 알람 대상 채팅방으로 등록",
            },
            {
                names: ["알람해제"],
                description: "현재 채팅방을 알람 대상 채팅방에서 해제",
            },
            {
                names: ["알람테스트"],
                description: "오늘 기준 콘텐츠 알람 테스트 발송",
            },
            {
                names: ["알람테스트 공지"],
                description: "오늘 기준 공지 알람 테스트 발송",
            },
        ],
    },
] as const;
