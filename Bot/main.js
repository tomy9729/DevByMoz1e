var bot = BotManager.getCurrentBot();
var BOT_CONFIG = {
    apiBaseUrl: "http://192.168.0.5:3000",
    commandPrefix: "!",
    requestTimeout: 5000
};
var BOT_COMMANDS = [
    {
        key: "adventureIslands",
        aliases: ["모험섬", "ㅁㅎㅅ"],
        path: "/api/bot/adventure-islands"
    },
    {
        key: "commands",
        aliases: ["명령어"],
        path: "/api/bot/commands"
    }
];

bot.setCommandPrefix(BOT_CONFIG.commandPrefix);

/**
 * 20260421 khs
 * 역할: Rhino 문자열 결합 결과를 API2 Java 내부 캐스팅에 맞는 JS 문자열로 평탄화한다.
 * 파라미터 설명:
 * - value: Java API로 전달할 문자열 값
 * 반환값 설명: ConsString 또는 NativeJavaObject가 아닌 JS 문자열 값
 */
function toFlatString(value) {
    var text = String(value);

    return text.substring(0, text.length);
}

/**
 * 20260421 khs
 * 역할: API2 command 이벤트의 command 값을 서버 봇 API 경로로 매핑한다.
 * 파라미터 설명:
 * - commandName: 접두어를 제외한 사용자의 명령어 이름
 * 반환값 설명: 매핑된 명령 설정 객체 또는 null
 */
function findBotCommand(commandName) {
    var normalizedCommandName = String(commandName || "").trim();
    var i;
    var command;

    for (i = 0; i < BOT_COMMANDS.length; i += 1) {
        command = BOT_COMMANDS[i];
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
    return toFlatString([BOT_CONFIG.apiBaseUrl.replace(/\/+$/, ""), path].join(""));
}

/**
 * 20260421 khs
 * 역할: Http.requestSync 응답 본문에서 서버가 내려준 줄바꿈을 보존한 답장 문자열을 추출한다.
 * 파라미터 설명:
 * - document: Http.requestSync가 반환한 응답 Document 객체
 * 반환값 설명: 서버 응답 본문 기준의 답장 문자열
 */
function getResponseBodyText(document) {
    if (document.body && document.body()) {
        return toFlatString(document.body().wholeText());
    }

    return toFlatString(document.text());
}

/**
 * 20260421 khs
 * 역할: 서버의 봇전용 API를 호출하고 사용자에게 그대로 노출할 문자열을 받는다.
 * 파라미터 설명:
 * - path: 호출할 봇전용 API 경로 문자열
 * 반환값 설명: 서버가 반환한 답장 문자열
 */
function requestBotApiText(path) {
    var requestUrl = createBotApiUrl(path);
    var document = Http.requestSync({
        url: requestUrl,
        method: "GET",
        timeout: BOT_CONFIG.requestTimeout,
        headers: {
            Accept: "text/plain"
        }
    });

    return getResponseBodyText(document);
}

/**
 * 20260421 khs
 * 역할: API2 command 이벤트에서 명령어 alias를 확인하고 서버 응답 문자열을 그대로 답장한다.
 * 파라미터 설명:
 * - msg: API2 Command 객체
 * 반환값 설명: 없음
 */
function onCommand(msg) {
    var command = findBotCommand(msg.command);

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
