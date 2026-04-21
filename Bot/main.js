var bot = BotManager.getCurrentBot();
var BOT_CONFIG = {
    apiBaseUrl: "http://192.168.0.5:3000",
    commandPrefix: "!",
    requestTimeout: 5000,
    alarmIntervalMs: 30000
};
var BOT_COMMANDS = [
    {
        key: "adventureIslands",
        aliases: ["모험섬", "ㅁㅎㅅ"],
        path: "/api/bot/adventure-islands"
    },
    {
        key: "commands",
        aliases: ["명령어", "ㅁㄹㅇ"],
        path: "/api/bot/commands"
    },
    {
        key: "alarmStatus",
        aliases: ["알람상태"],
        path: "/api/bot/alarms/status"
    },
    {
        key: "alarmOn",
        aliases: ["알람켜기"],
        path: "/api/bot/alarms/on"
    },
    {
        key: "alarmOff",
        aliases: ["알람끄기"],
        path: "/api/bot/alarms/off"
    },
    {
        key: "alarmRegister",
        aliases: ["알람등록"],
        path: "/api/bot/alarms/targets/register",
        includeRoom: true
    },
    {
        key: "alarmUnregister",
        aliases: ["알람해제"],
        path: "/api/bot/alarms/targets/unregister",
        includeRoom: true
    },
    {
        key: "alarmTest",
        aliases: ["알람테스트"],
        path: "/api/bot/alarms/test"
    }
];
var CHARACTER_SECTIONS = [
    "장비",
    "악세",
    "악세사리",
    "어빌리티스톤",
    "어빌돌",
    "돌",
    "팔찌",
    "스킬",
    "아크패시브",
    "보석",
    "카드",
    "아바타",
    "내실",
    "수집",
    "수집형",
    "전투력",
    "전투",
    "낙원력",
    "보주",
    "아크그리드"
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

function requestBotApiJson(path) {
    return JSON.parse(requestBotApiText(path));
}

function appendQueryParam(path, name, value) {
    var separator = path.indexOf("?") >= 0 ? "&" : "?";

    return path + separator + encodeURIComponent(name) + "=" + encodeURIComponent(value);
}

function createCommandPath(command, args, msg) {
    var normalizedArgs = args || [];
    var path = command.path;
    var queryText;

    if (command.key === "alarmTest") {
        path = appendQueryParam(path, "type", normalizedArgs[0] === "공지" ? "weeklyNotice" : "dailyContents");
    }

    if (command.includeRoom) {
        path = appendQueryParam(path, "room", msg.room || "");

        if (msg.packageName) {
            path = appendQueryParam(path, "packageName", msg.packageName);
        }
    }

    if (normalizedArgs.length && command.key !== "alarmTest") {
        queryText = normalizedArgs.join(" ");
        path = appendQueryParam(path, "query", queryText);
    }

    return path;
}

function parseCharacterCommand(msg) {
    var content = String(msg.content || "").trim();
    var prefix = BOT_CONFIG.commandPrefix;
    var commandText;
    var refreshSuffix = " 새로고침";
    var lastSpaceIndex;
    var lastToken;
    var nameText;

    if (content.indexOf(prefix) !== 0) {
        return null;
    }

    commandText = content.substring(prefix.length).trim();

    if (!commandText) {
        return null;
    }

    if (commandText === "새로고침") {
        return null;
    }

    if (commandText.length > refreshSuffix.length && commandText.substring(commandText.length - refreshSuffix.length) === refreshSuffix) {
        return {
            name: commandText.substring(0, commandText.length - refreshSuffix.length).trim(),
            refresh: true,
            section: ""
        };
    }

    lastSpaceIndex = commandText.lastIndexOf(" ");

    if (lastSpaceIndex > 0) {
        lastToken = commandText.substring(lastSpaceIndex + 1).trim();
        nameText = commandText.substring(0, lastSpaceIndex).trim();

        if (CHARACTER_SECTIONS.indexOf(lastToken) >= 0) {
            return {
                name: nameText,
                refresh: false,
                section: lastToken
            };
        }
    }

    return {
        name: commandText,
        refresh: false,
        section: ""
    };
}

function createCharacterPath(characterCommand) {
    var path = characterCommand.refresh ? "/api/bot/characters/refresh" : "/api/bot/characters";
    var query = "?name=" + encodeURIComponent(characterCommand.name);

    if (characterCommand.section) {
        query += "&section=" + encodeURIComponent(characterCommand.section);
    }

    return path + query;
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
    var characterCommand;

    if (!command) {
        characterCommand = parseCharacterCommand(msg);

        if (!characterCommand || !characterCommand.name) {
            return;
        }
    }

    try {
        if (command) {
            msg.reply(requestBotApiText(createCommandPath(command, msg.args, msg)));
        } else {
            msg.reply(requestBotApiText(createCharacterPath(characterCommand)));
        }
    } catch (error) {
        Log.e(error);
        msg.reply("서버 응답을 받을 수 없습니다.");
    }
}

bot.addListener(Event.COMMAND, onCommand);

function ackAlarmDelivery(deliveryId, status, errorReason) {
    var path = "/api/bot/alarms/deliveries/ack";

    path = appendQueryParam(path, "deliveryId", deliveryId);
    path = appendQueryParam(path, "status", status);

    if (errorReason) {
        path = appendQueryParam(path, "errorReason", errorReason);
    }

    requestBotApiText(path);
}

function sendAlarmToTarget(target, message) {
    if (target.packageName) {
        return bot.send(target.room, message, target.packageName);
    }

    return bot.send(target.room, message);
}

function sendDueAlarms() {
    var alarms;
    var alarm;
    var target;
    var i;
    var j;
    var sentCount;
    var failedCount;

    try {
        alarms = requestBotApiJson("/api/bot/alarms/due");
    } catch (error) {
        Log.e(error);
        return;
    }

    if (!alarms || !alarms.length) {
        return;
    }

    for (i = 0; i < alarms.length; i += 1) {
        alarm = alarms[i];
        sentCount = 0;
        failedCount = 0;

        for (j = 0; j < alarm.targets.length; j += 1) {
            target = alarm.targets[j];

            try {
                if (sendAlarmToTarget(target, alarm.message)) {
                    sentCount += 1;
                } else {
                    failedCount += 1;
                }
            } catch (error) {
                failedCount += 1;
                Log.e(error);
            }
        }

        try {
            if (failedCount > 0 || sentCount === 0) {
                ackAlarmDelivery(alarm.deliveryId, "failed", "sent=" + sentCount + ", failed=" + failedCount);
            } else {
                ackAlarmDelivery(alarm.deliveryId, "sent", "");
            }
        } catch (error) {
            Log.e(error);
        }
    }
}

sendDueAlarms();
setInterval(sendDueAlarms, BOT_CONFIG.alarmIntervalMs);
