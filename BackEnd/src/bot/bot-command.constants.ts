export const BOT_COMMANDS = [
    {
        key: "adventureIslands",
        category: "로스트아크",
        names: ["모험섬", "ㅁㅎㅅ"],
        endpoint: "/api/bot/adventure-islands",
        description: "오늘 모험섬과 보상을 보여줍니다.",
    },
    {
        key: "commands",
        category: "기본",
        names: ["명령어"],
        endpoint: "/api/bot/commands",
        description: "사용 가능한 명령어 목록을 보여줍니다.",
    },
] as const;
