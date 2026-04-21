export const BOT_COMMANDS = [
    {
        key: "adventureIslands",
        names: ["모험섬", "ㅁㅎㅅ"],
        endpoint: "/api/bot/adventure-islands",
        description: "오늘 모험섬 정보를 조회합니다.",
    },
    {
        key: "commands",
        names: ["명령어"],
        endpoint: "/api/bot/commands",
        description: "사용 가능한 명령어 목록을 조회합니다.",
    },
] as const;
