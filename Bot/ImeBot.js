/**
 * TODO
 * # 노션 활용해서 DB 구축
 *  - 노션 연결
 *  - DB 테이블 설계
 *
 * # key 관리
 *  - 로스트아크 api key
 *  - 노션 db key
 *  - 노션 api key
 *
 * # 기능 추가
 *  - 캐릭터 관련 : 기본정보, 스펙 / zloa, 로펙 연동
 *  - 경매장 관련 : 보석 유각 악세 등 / 재료값, 융화관련 가격
 *  -
 */

const bot = BotManager.getCurrentBot()
const apiKey = //key 관리
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyIsImtpZCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyJ9.eyJpc3MiOiJodHRwczovL2x1ZHkuZ2FtZS5vbnN0b3ZlLmNvbSIsImF1ZCI6Imh0dHBzOi8vbHVkeS5nYW1lLm9uc3RvdmUuY29tL3Jlc291cmNlcyIsImNsaWVudF9pZCI6IjEwMDAwMDAwMDAwODY2MTQifQ.PYeBEH3_CjaE7Sdf2Bfx9__W7644xFf77wiTUINTy0hVYlVO55pfOG-pWZwcXxz-8k-w1RB-eNxYJ0QYWhC9i3ShX57PZ4uu5rkzEjsNg2b3GeFensDj2NKkXHOl9EIlBhg9O3d87yaIVLk1UumgR1a_sqgXbSU594B9QpoY5Zh0EQVHBTbNb6w39EPgD2fH8POBG19AeyijRYlK6AzO6yKKed8IgfuglNRO20a1IHdyNG4GjgDfirGWTniCut0wXzkKP_motJLLHTTr3LriZSUmerzcC_9NDsQA11yO6eZQ3meEzaKXWGzSmWCoHRWezN1rBkQweZGdr-16fCPuMw"

/**
 * (string) msg.content: 메시지의 내용
 * (string) msg.room: 메시지를 받은 방 이름
 * (User) msg.author: 메시지 전송자
 * (string) msg.author.name: 메시지 전송자 이름
 * (Image) msg.author.avatar: 메시지 전송자 프로필 사진
 * (string) msg.author.avatar.getBase64()
 * (boolean) msg.isGroupChat: 단체/오픈채팅 여부
 * (boolean) msg.isDebugRoom: 디버그룸에서 받은 메시지일 시 true
 * (string) msg.packageName: 메시지를 받은 메신저의 패키지명
 * (void) msg.reply(string): 답장하기
 */
function onMessage(msg) {}
bot.addListener(Event.MESSAGE, onMessage)

/**
 * (string) msg.content: 메시지의 내용
 * (string) msg.room: 메시지를 받은 방 이름
 * (User) msg.author: 메시지 전송자
 * (string) msg.author.name: 메시지 전송자 이름
 * (Image) msg.author.avatar: 메시지 전송자 프로필 사진
 * (string) msg.author.avatar.getBase64()
 * (boolean) msg.isDebugRoom: 디버그룸에서 받은 메시지일 시 true
 * (boolean) msg.isGroupChat: 단체/오픈채팅 여부
 * (string) msg.packageName: 메시지를 받은 메신저의 패키지명
 * (void) msg.reply(string): 답장하기
 * (string) msg.command: 명령어 이름
 * (Array) msg.args: 명령어 인자 배열
 */
function onCommand(msg) {
    {
        CharacterUtil.getCharacterInfo(msg)
    }
}

bot.setCommandPrefix("!") // "!"로 시작하는 메시지를 command로 판단
bot.addListener(Event.COMMAND, onCommand)

/**
 * util 관리
 * - 기능 주제별 : CharacterUtil
 * - 자주 사용되는 함수별 : HttpUtil
 */
const CharacterUtil = {}
const HttpUtil = {
    Base_URL: "https://developer-lostark.game.onstove.com",
    authorization: ("bearer " + apiKey).toString(),
}

{
    //CharacterUtil
    CharacterUtil.getCharacterInfo = function (msg) {
        const result = []
        result.push("@" + msg.author.name)
        const cName = msg.content.slice(1)
        const baseUrl = HttpUtil.Base_URL + "/armories/characters/" + encodeURIComponent(cName)

        const profileUrl = (baseUrl + "/profiles").toString()

        HttpUtil.get(msg, profileUrl, (profile) => {
            if (profile == null) {
                msg.reply("'" + cName + "'" + "은(는) 존재하지않는 캐릭터나 명령어입니다.")
                return
            }

            const _cName = profile.CharacterName
            const title = profile.Title
            const server = profile.ServerName
            // const level = profile.CharacterLevel
            const cclass = profile.CharacterClassName
            const itemLevel = profile.ItemMaxLevel

            /**
             * // 프로필
             *  ※아만 [이클립스] 병장망치
                1,680.83Lv 디스트로이어
                공격력 : 104477
                최대 생명력 : 240915
             */
            result.push("※" + server + " " + (title ? "[" + title + "]" + " " + _cName : _cName))
            result.push(cclass + " " + itemLevel + "Lv")

            const stats = profile.Stats
            const attack = stats.find((s) => s.Type == "공격력").Value
            const vitality = stats.find((s) => s.Type == "최대 생명력").Value
            result.push("공격력 : " + attack)
            result.push("최대 생명력 : " + vitality)

            /////////////////////////////////////////////////////////////////////////
            result.push("")
            const equipmentUrl = (baseUrl + "/equipment").toString()
            HttpUtil.get(msg, equipmentUrl, (equipments) => {
                /**
                 * //장비 0~6
                 * 무기 : 품질95 / +17강 / 상재 10단계
                 * 투구 +16강
                 * 상의 +16강
                 * 하의 +16강
                 * 장갑 +16강
                 * 견갑 +16강
                 *
                 * 방초 +100
                 * 무초 +20
                 *
                 * //악세 7~11
                 * 목걸이 중단일
                 * 귀걸이1 떡작
                 * 귀걸이2 중단일
                 * 반지1 중단일
                 * 반지2 중단일
                 *
                 * //스톤 12
                 * 어빌리티스톤 97
                 * //팔찌 13
                 * 팔찌
                 * - 치명 109
                 * - 특화 90
                 * - 적주피 2퍼
                 * - 치적 3퍼
                 */

                function cleanTooltip(originalTooltip) {
                    const jsonData = JSON.parse(originalTooltip)

                    // HTML 태그 및 \로 시작하는 부분 제거하는 함수
                    function cleanText(text) {
                        // HTML 태그 제거
                        let clean = text.replace(/<\/?[^>]+(>|$)/g, "")
                        // \로 시작하는 부분 제거
                        clean = clean.replace(/\\[^\s]+/g, "")
                        return clean
                    }

                    // 모든 요소를 순회하여 text 값 정리
                    for (let key in jsonData) {
                        if (
                            jsonData[key].type === "NameTagBox" ||
                            jsonData[key].type === "SingleTextBox" ||
                            jsonData[key].type === "MultiTextBox"
                        ) {
                            jsonData[key].value = cleanText(jsonData[key].value)
                        } else if (jsonData[key].type === "ItemTitle" || jsonData[key].type === "ItemPartBox") {
                            // 내부의 "value" 객체 내의 텍스트 정리
                            let value = jsonData[key].value
                            if (value.leftStr0) value.leftStr0 = cleanText(value.leftStr0)
                            if (value.leftStr1) value.leftStr1 = cleanText(value.leftStr1)
                            if (value.leftStr2) value.leftStr2 = cleanText(value.leftStr2)
                            if (value.rightStr0) value.rightStr0 = cleanText(value.rightStr0)
                            if (value.Element_000) value.Element_000 = cleanText(value.Element_000)
                            if (value.Element_001) value.Element_001 = cleanText(value.Element_001)
                        }
                    }

                    return jsonData
                }
                {
                    // 무기 투구 상의 하의 장갑 어깨
                    //무기 : 품질95 / +17강 / 상재10단계
                    /**
                        장비 | 품질 | 강화 | 상재
                        =========================
                        무기 | 095 | 17강 | 10단계
                        투구 | 100 | 16강 | 10단계
                        상의 | 098 | 16강 | 10단계
                        하의 | 093 | 16강 | 10단계
                        장갑 | 096 | 16강 | 10단계
                        어깨 | 094 | 16강 | 10단계
                    */
                    const clothes = equipments.slice(0, 6)
                    result.push("장비 | 품질 | 강화 | 상재")
                    result.push("====================")

                    const nasaengmuns = []
                    clothes.forEach((cloth) => {
                        const tooltip = cleanTooltip(cloth.Tooltip)
                        {
                            //장비
                            const qualityValue = tooltip.Element_001.value.qualityValue
                            const qualityStr = qualityValue < 100 ? "0" + qualityValue : qualityValue
                            const equipLvStr = cloth.Name.toString().split(" ")[0].slice(1) + "강"
                            const highLv = tooltip.Element_005.value.toString().split(" ")[2]
                            result.push([cloth.Type, qualityStr, equipLvStr, highLv ? highLv : "X"].join(" | "))
                        }
                        {
                            //엘릭서 초월 관련 obj
                            const nasaengmun = []
                            Object.keys(tooltip).forEach((key) => {
                                if (tooltip[key].type == "IndentStringGroup") {
                                    nasaengmun.push(tooltip[key].value)
                                }
                            })
                            nasaengmuns.push(nasaengmun)
                        }
                    })
                    result.push("")
                    /**
                     *  엘릭서 42 : 회심
                        초월121 : 방초100 + 무초21

                        nasaengmuns
                        0번째는 무기 초월, null
                        그외 방어구 초월 엘릭서 엘릭서
                     */

                    {
                        //초월
                        const chowol = []
                        nasaengmuns.forEach((n) => {
                            if (n[0]) {
                                const cLv = Number(n[0].Element_000.topStr.split(" ")[4])
                                chowol.push(cLv)
                            } else {
                                chowol.push(0)
                            }
                        })
                        const mChowol = chowol[0]
                        const bChowol = chowol[1] + chowol[2] + chowol[3] + chowol[4] + chowol[5]
                        const allChowol = mChowol + bChowol
                        result.push("초월" + allChowol + " : " + "방초" + bChowol + "+" + "무초" + mChowol)
                    }
                }

                //반환
                msg.reply(result.join("\n"))
            })
        })
    }
}

{
    // HttpUtil
    HttpUtil.headerGet = function (url) {
        return {
            url: url,
            timeout: 3000,
            method: "GET",
            headers: {
                authorization: HttpUtil.authorization,
                accept: "application/json",
            },
        }
    }
    HttpUtil.get = function (msg, url, callback) {
        Http.request(HttpUtil.headerGet(url), (error, response, doc) => {
            if (error) {
                HttpUtil.error(error, msg)
                return
            }

            const info = JSON.parse(doc.text())
            callback(info)
        })
    }
    HttpUtil.error = function (error, msg) {
        Log.e(error)
        const errorMessage = error.toString()
        const statusIndex = errorMessage.indexOf("Status=")
        if (statusIndex !== -1) {
            const statusStart = statusIndex + "Status=".length
            const statusEnd = errorMessage.indexOf(",", statusStart)
            const statusCode = errorMessage.substring(statusStart, statusEnd).trim()

            // 에러 처리
            if (statusCode.startsWith("5")) {
                msg.reply("에러코드 : " + statusCode + "\n로스트아크 서버 에러입니다.\nex)로스트아크 서버 점검")
            } else if (statusCode.startsWith("4")) {
                msg.reply("에러코드 : " + statusCode + "\n클라이언트 에러입니다.")
            }
        } else {
            msg.reply("알 수 없는 에러입니다.")
        }
    }
}

/////////////////////////////////////////////////////////////////////////////
// default code
// not use
function onCreate(savedInstanceState, activity) {
    var textView = new android.widget.TextView(activity)
    textView.setText("Hello, World!")
    textView.setTextColor(android.graphics.Color.DKGRAY)
    activity.setContentView(textView)
}

function onStart(activity) {}

function onResume(activity) {}

function onPause(activity) {}

function onStop(activity) {}

function onRestart(activity) {}

function onDestroy(activity) {}

function onBackPressed(activity) {}

bot.addListener(Event.Activity.CREATE, onCreate)
bot.addListener(Event.Activity.START, onStart)
bot.addListener(Event.Activity.RESUME, onResume)
bot.addListener(Event.Activity.PAUSE, onPause)
bot.addListener(Event.Activity.STOP, onStop)
bot.addListener(Event.Activity.RESTART, onRestart)
bot.addListener(Event.Activity.DESTROY, onDestroy)
bot.addListener(Event.Activity.BACK_PRESSED, onBackPressed)
