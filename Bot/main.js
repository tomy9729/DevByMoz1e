const bot = BotManager.getCurrentBot();
const BOT_CONFIG = {
    apiBaseUrl: "http://192.168.0.5:3000",
    commandPrefix: "!",
    requestTimeout: 5000,
};
const BOT_COMMANDS = [
    {
        key: "adventureIslands",
        aliases: ["모험섬", "ㅁㅎㅅ"],
        path: "/api/bot/adventure-islands",
    },
    {
        key: "commands",
        aliases: ["명령어"],
        path: "/api/bot/commands",
    },
];

bot.setCommandPrefix(BOT_CONFIG.commandPrefix);

/**
 * 20260421 khs
 * 역할: API2 command 이벤트의 command 값을 서버 봇 API 경로로 매핑한다.
 * 파라미터 설명:
 * - commandName: 접두어를 제외한 사용자의 명령어 이름
 * 반환값 설명: 매핑된 명령 설정 객체 또는 null
 */
function findBotCommand(commandName) {
    const normalizedCommandName = String(commandName || "").trim();

    for (const command of BOT_COMMANDS) {
        if (command.aliases.indexOf(normalizedCommandName) >= 0) {
            return command;
        }
    }

    return null;
}

/**
 * 20260421 khs
 * 역할: 서버 기준 API base URL과 봇전용 API path를 하나의 요청 URL로 조합한다.
 * 파라미터 설명:
 * - path: `/api/bot`으로 시작하는 서버 봇전용 API 경로 문자열
 * 반환값 설명: 봇이 호출할 서버 API 전체 URL 문자열
 */
function createBotApiUrl(path) {
    return BOT_CONFIG.apiBaseUrl.replace(/\/+$/, "") + path;
}

/**
 * 20260421 khs
 * 역할: 서버의 봇전용 API를 호출하고 사용자에게 그대로 노출할 문자열을 받는다.
 * 파라미터 설명:
 * - path: 호출할 봇전용 API 경로 문자열
 * 반환값 설명: 서버가 반환한 답장 문자열
 */
function requestBotApiText(path) {
    const document = Http.requestSync({
        url: createBotApiUrl(path),
        method: "GET",
        timeout: BOT_CONFIG.requestTimeout,
        headers: {
            Accept: "text/plain",
        },
    });

    return document.text();
}

/**
 * 20260421 khs
 * 역할: API2 command 이벤트에서 명령어 alias를 확인하고 서버 응답 문자열을 그대로 답장한다.
 * 파라미터 설명:
 * - msg: API2 Command 객체
 * 반환값 설명: 없음
 */
function onCommand(msg) {
    const command = findBotCommand(msg.command);

    if (!command) {
        return;
    }

    try {
        msg.reply(requestBotApiText(command.path));
    } catch (error) {
        Log.e(error);
        msg.reply("서버 응답을 받을 수 없습니다.");
    }
}

bot.addListener(Event.COMMAND, onCommand);
