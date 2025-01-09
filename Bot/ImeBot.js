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
 *  - 기본정보, 스펙 / zloa, 로펙 연동
 *  - 보석 유각 악세 등 / 재료값, 융화관련 가격
 *  - !악세 고대 상단일 반지 -> 최저가부터 10개정도 세세하게 가져오기
 *  - !유각, !유각 [?각인이름] !유각 [?직업이름]
 *
 * # 기타
 *  - 서버가 느릴때 로딩중
 */

/**
 * 고민
 *
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
    // 공통 부분 처리
    const result = []
    result.push("@" + msg.author.name)

    const cmds = msg.content.slice(1).split(" ")
    if (cmds[0] == "명령어") {
        result.push("※명령어")
        result.push("모든 명령어는 !로 시작")
        result.push("[] : 해당하는 내용")
        result.push("? : 있어도 되고, 없어도 된다.")
        result.push("| : 나열된 문자열 중 하나")
        result.push("")
        result.push("![캐릭터이름]")
        result.push("!모험섬 [?요일|골드|실링|해주|카드]")
        result.push(
            "!악세 ?[고대|유물] [상상옵|상중옵|상하옵|상단일|중중옵|중하옵|중단일]"
        )
        result.push("!악세 딜증")
        result.push("!유각 ?[각인명]")
        result.push("!보석 [1~10][겁|작|멸|홍]")
    } else if (cmds[0] == "모험섬") {
        EtcUtil.getAdventureIslandForDay(result, cmds[1])
    } else if (cmds[0] == "악세") {
        if (cmds[1] == "딜증") {
            EtcUtil.getAcceDealPlus(result)
        } else {
            AuctionUtil.getAcce(result, cmds[1], cmds[2])
        }
    } else if (cmds[0] == "보석") {
        AuctionUtil.getGem(result, cmds[1])
    } else if (cmds[0] == "유각") {
        MarketUtil.getUGak(result, cmds[1])
    } else {
        CharacterUtil.getCharacterInfo(result, cmds[0])
    }

    // 답장
    msg.reply(result.join("\n"))
}

bot.setCommandPrefix("!") // "!"로 시작하는 메시지를 command로 판단
bot.addListener(Event.COMMAND, onCommand)

/**
 * util 관리
 * - 기능 주제별 : AuctionUtil CharacterUtil EtcUtil MarketUtil
 * - 자주 사용되는 함수별 : HttpUtil
 * - ErrorUtil
 */
const AuctionUtil = {
    // 경매장
    // 악세 보석
}
const CharacterUtil = {
    // 캐릭터 정보
    // 캐릭터 스펙
}
const EtcUtil = {
    // 모험섬
    // 정보 : 악세 딜증
    acceDealPlus: [
        {
            name: "하단일",
            plus: 2,
        },
        {
            name: "하하옵",
            plus: 4,
        },
        {
            name: "중단일",
            plus: 4.4,
        },
        {
            name: "중하옵",
            plus: 6.4,
        },
        {
            name: "상단일",
            plus: 7.4,
        },
        {
            name: "중중옵",
            plus: 8.8,
        },
        {
            name: "상하옵",
            plus: 9.4,
        },
        {
            name: "상중옵",
            plus: 11.8,
        },
        {
            name: "상상옵",
            plus: 14.8,
        },
    ],
}
const MarketUtil = {
    // 거래소
    // 유각 전압
    uGakNameShort: {
        "각성 각인서": "각성",
        "강령술 각인서": "강령",
        "강화 방패 각인서": "강방",
        "결투의 대가 각인서": "결대",
        "구슬동자 각인서": "구동",
        "굳은 의지 각인서": "굳의",
        "급소 타격 각인서": "급타",
        "기습의 대가 각인서": "기습",
        "긴급구조 각인서": "긴급",
        "달인의 저력 각인서": "달저",
        "돌격대장 각인서": "돌대",
        "마나의 흐름 각인서": "마흐",
        "마나 효율 증가 각인서": "마효",
        "바리케이드 각인서": "바리",
        "번개의 분노 각인서": "번분",
        "부러진 뼈 각인서": "부뼈",
        "분쇄의 주먹 각인서": "분쇄",
        "불굴 각인서": "불굴",
        "선수필승 각인서": "선필",
        "속전속결 각인서": "속속",
        "슈퍼 차지 각인서": "슈차",
        "승부사 각인서": "승부",
        "시선 집중 각인서": "시집",
        "실드 관통 각인서": "실관",
        "아드레날린 각인서": "아드",
        "안정된 상태 각인서": "안상",
        "약자 무시 각인서": "약무",
        "여신의 가호 각인서": "여신",
        "에테르 포식자 각인서": "에포",
        "예리한 둔기 각인서": "예둔",
        "원한 각인서": "원한",
        "위기 모면 각인서": "위모",
        "저주받은 인형 각인서": "저받",
        "전문의 각인서": "전문",
        "정기 흡수 각인서": "정흡",
        "정밀 단도 각인서": "정단",
        "중갑 착용 각인서": "중갑",
        "질량 증가 각인서": "질증",
        "최대 마나 증가 각인서": "최마",
        "추진력 각인서": "추진",
        "타격의 대가 각인서": "타대",
        "폭발물 전문가 각인서": "폭전",
    },
}
const HttpUtil = {
    Base_URL: "https://developer-lostark.game.onstove.com",
    authorization: ("bearer " + apiKey).toString(),
    timeout: 30 * 1000,
}
const ErrorUtil = {
    notImplemented: "구현되지 않은 기능입니다.",
    checkCmd: "명령어를 확인하세요.",
}

//AuctionUtil
{
    /**
     *
     * @param {*} msg
     * @param {string} itemGrade 유물 | 고대
     * @param {*} simpleItemOption
     * 상상옵 상중옵 상하옵 상단일
     * 중중옵 중하옵 중단일
     */
    AuctionUtil.getAcce = function (result, cmd1, cmd2) {
        const [itemGrade, simpleItemOption] = (() => {
            const simpleItemOptions = [
                "상상옵",
                "상중옵",
                "상하옵",
                "상단일",
                "중중옵",
                "중하옵",
                "중단일",
            ]
            if (simpleItemOptions.includes(cmd1)) {
                return ["고대", cmd1]
            }

            if (cmd1 != "유물" && cmd1 != "고대") {
                result.push(ErrorUtil.checkCmd + " [고대|유물]")
                return
            }
            if (!simpleItemOptions.includes(cmd2)) {
                result.push(
                    ErrorUtil.checkCmd +
                        " [상상옵|상중옵|상하옵|상단일|중중옵|중하옵|중단일]"
                )
                return
            }

            return [cmd1, cmd2]
        })()

        const url = (HttpUtil.Base_URL + "/auctions/items").toString()

        const acceKinds = [
            {
                categoryCode: 200010,
                name: "목걸이",
            },
            {
                categoryCode: 200020,
                name: "귀걸이",
            },
            {
                categoryCode: 200030,
                name: "반지",
            },
        ]

        const acceOptions = {
            200010: [
                [
                    {
                        secondOption: 41,
                        name: "추피",
                        itemGradeCode: [70, 160, 260], //4, 9, 11
                    },
                    {
                        secondOption: 42,
                        name: "적주피",
                        itemGradeCode: [55, 120, 200], //5, 10, 12
                    },
                ],
                [
                    {
                        secondOption: 43,
                        name: "아덴획",
                        itemGradeCode: [160, 360, 600], //4, 10, 12
                    },
                    {
                        secondOption: 44,
                        name: "낙인력",
                        itemGradeCode: [215, 480, 800], //4, 10, 12
                    },
                ],
            ],
            200020: [
                [
                    {
                        secondOption: 45,
                        name: "공퍼",
                        itemGradeCode: [40, 95, 155], //4, 10, 12
                    },
                    {
                        secondOption: 46,
                        name: "무공퍼",
                        itemGradeCode: [80, 180, 300], //4, 10, 12
                    },
                ],
            ],
            200030: [
                [
                    {
                        secondOption: 49,
                        name: "치적",
                        itemGradeCode: [40, 95, 155], //4, 10, 12
                    },
                    {
                        secondOption: 50,
                        name: "치피",
                        itemGradeCode: [110, 240, 400], //5, 10, 12
                    },
                ],
                [
                    {
                        secondOption: 51,
                        name: "아공강",
                        itemGradeCode: [135, 300, 500], //4, 10, 12
                    },
                    {
                        secondOption: 52,
                        name: "아피강",
                        itemGradeCode: [200, 450, 750], //4, 10, 12
                    },
                ],
            ],
        }

        // 상상옵 상중옵 상하옵 상단일 중중옵 중하옵 중단일
        // 1하 2중 3상
        const itemOptionGrades = (() => {
            if (simpleItemOption == "상상옵") return [2, 2]
            else if (simpleItemOption == "상중옵") return [2, 1]
            else if (simpleItemOption == "상하옵") return [2, 0]
            else if (simpleItemOption == "상단일") return [2]
            else if (simpleItemOption == "중중옵") return [1, 1]
            else if (simpleItemOption == "중하옵") return [2, 0]
            else if (simpleItemOption == "중단일") return [1]
        })()

        // 상단일 중단일
        /**
         * @병장망치
         * ※악세
         * - 고대 상단일
         * - 품질70↑ 3연마 최저가
         *
         * 목걸이
         * - 추피 80000
         * - 적주치 70000
         * - 낙인력 80000
         * - 아덴획 70000
         *
         * 귀걸이
         * 반지
         */
        result.push("※악세")
        result.push("- " + itemGrade + " " + simpleItemOption)
        result.push("- 품질70↑ 3연마 최저가")

        if (itemOptionGrades.length == 1) {
            acceKinds.forEach((acceKind) => {
                result.push("")
                result.push(acceKind.name)
                const categoryCode = acceKind.categoryCode
                acceOptions[categoryCode].forEach((optionsForAcceKind) => {
                    optionsForAcceKind.forEach((itemOption) => {
                        const data = {
                            ItemGradeQuality: 70,
                            EtcOptions: [
                                {
                                    // 깨달음 12~13
                                    FirstOption: 8,
                                    SecondOption: 1,
                                    MinValue: itemGrade == "유물" ? 9 : 12,
                                    MaxValue: 13,
                                },
                                {
                                    FirstOption: 7, //연마 효과
                                    SecondOption: itemOption.secondOption, // 추피, 적추피, 낙인력 등
                                    MinValue:
                                        itemOption.itemGradeCode[
                                            itemOptionGrades[0]
                                        ],
                                    MaxValue:
                                        itemOption.itemGradeCode[
                                            itemOptionGrades[0]
                                        ],
                                },
                            ],
                            Sort: "BuyPrice",
                            CategoryCode: categoryCode,
                            CharacterClass: "",
                            ItemTier: 4,
                            ItemGrade: itemGrade,
                            ItemName: "",
                            PageNo: 0,
                            SortCondition: "ASC",
                        }
                        HttpUtil.post(url, data, (searchedItems) => {
                            const price = searchedItems.Items.filter(
                                (i) => i.AuctionInfo.BuyPrice != null
                            )[0].AuctionInfo.BuyPrice
                            result.push("- " + itemOption.name + " " + price)
                        })
                    })
                })
            })
        } else if (itemOptionGrades[0] != itemOptionGrades[1]) {
            acceKinds.forEach((acceKind) => {
                result.push("")
                result.push(acceKind.name)
                const categoryCode = acceKind.categoryCode
                acceOptions[categoryCode].forEach((optionsForAcceKind) => {
                    const data1 = {
                        ItemGradeQuality: 70,
                        EtcOptions: [
                            {
                                // 깨달음 12~13
                                FirstOption: 8,
                                SecondOption: 1,
                                MinValue: itemGrade == "유물" ? 9 : 12,
                                MaxValue: 13,
                            },
                            {
                                FirstOption: 7,
                                SecondOption:
                                    optionsForAcceKind[0].secondOption,
                                MinValue:
                                    optionsForAcceKind[0].itemGradeCode[
                                        itemOptionGrades[0]
                                    ],
                                MaxValue:
                                    optionsForAcceKind[0].itemGradeCode[
                                        itemOptionGrades[0]
                                    ],
                            },
                            {
                                FirstOption: 7,
                                SecondOption:
                                    optionsForAcceKind[1].secondOption,
                                MinValue:
                                    optionsForAcceKind[1].itemGradeCode[
                                        itemOptionGrades[1]
                                    ],
                                MaxValue:
                                    optionsForAcceKind[1].itemGradeCode[
                                        itemOptionGrades[1]
                                    ],
                            },
                        ],
                        Sort: "BuyPrice",
                        CategoryCode: categoryCode,
                        CharacterClass: "",
                        ItemTier: 4,
                        ItemGrade: itemGrade,
                        ItemName: "",
                        PageNo: 0,
                        SortCondition: "ASC",
                    }
                    HttpUtil.post(url, data1, (searchedItems) => {
                        const price = searchedItems.Items.filter(
                            (i) => i.AuctionInfo.BuyPrice != null
                        )[0].AuctionInfo.BuyPrice
                        result.push(
                            "- " +
                                optionsForAcceKind[0].name +
                                "/" +
                                optionsForAcceKind[1].name +
                                " " +
                                price
                        )
                    })

                    const data2 = {
                        ItemGradeQuality: 70,
                        EtcOptions: [
                            {
                                // 깨달음 12~13
                                FirstOption: 8,
                                SecondOption: 1,
                                MinValue: itemGrade == "유물" ? 9 : 12,
                                MaxValue: 13,
                            },
                            {
                                FirstOption: 7,
                                SecondOption:
                                    optionsForAcceKind[1].secondOption,
                                MinValue:
                                    optionsForAcceKind[1].itemGradeCode[
                                        itemOptionGrades[0]
                                    ],
                                MaxValue:
                                    optionsForAcceKind[1].itemGradeCode[
                                        itemOptionGrades[0]
                                    ],
                            },
                            {
                                FirstOption: 7,
                                SecondOption:
                                    optionsForAcceKind[0].secondOption,
                                MinValue:
                                    optionsForAcceKind[0].itemGradeCode[
                                        itemOptionGrades[1]
                                    ],
                                MaxValue:
                                    optionsForAcceKind[0].itemGradeCode[
                                        itemOptionGrades[1]
                                    ],
                            },
                        ],
                        Sort: "BuyPrice",
                        CategoryCode: categoryCode,
                        CharacterClass: "",
                        ItemTier: 4,
                        ItemGrade: itemGrade,
                        ItemName: "",
                        PageNo: 0,
                        SortCondition: "ASC",
                    }
                    HttpUtil.post(url, data2, (searchedItems) => {
                        const price = searchedItems.Items.filter(
                            (i) => i.AuctionInfo.BuyPrice != null
                        )[0].AuctionInfo.BuyPrice
                        result.push(
                            "- " +
                                optionsForAcceKind[1].name +
                                "/" +
                                optionsForAcceKind[0].name +
                                " " +
                                price
                        )
                    })
                })
            })
        } else if (itemOptionGrades[0] == itemOptionGrades[1]) {
            acceKinds.forEach((acceKind) => {
                result.push("")
                result.push(acceKind.name)
                const categoryCode = acceKind.categoryCode
                acceOptions[categoryCode].forEach((optionsForAcceKind) => {
                    const data = {
                        ItemGradeQuality: 70,
                        EtcOptions: [
                            {
                                // 깨달음 12~13
                                FirstOption: 8,
                                SecondOption: 1,
                                MinValue: itemGrade == "유물" ? 9 : 12,
                                MaxValue: 13,
                            },
                            {
                                FirstOption: 7,
                                SecondOption:
                                    optionsForAcceKind[0].secondOption,
                                MinValue:
                                    optionsForAcceKind[0].itemGradeCode[
                                        itemOptionGrades[0]
                                    ],
                                MaxValue:
                                    optionsForAcceKind[0].itemGradeCode[
                                        itemOptionGrades[0]
                                    ],
                            },
                            {
                                FirstOption: 7,
                                SecondOption:
                                    optionsForAcceKind[1].secondOption,
                                MinValue:
                                    optionsForAcceKind[1].itemGradeCode[
                                        itemOptionGrades[1]
                                    ],
                                MaxValue:
                                    optionsForAcceKind[1].itemGradeCode[
                                        itemOptionGrades[1]
                                    ],
                            },
                        ],
                        Sort: "BuyPrice",
                        CategoryCode: categoryCode,
                        CharacterClass: "",
                        ItemTier: 4,
                        ItemGrade: itemGrade,
                        ItemName: "",
                        PageNo: 0,
                        SortCondition: "ASC",
                    }
                    HttpUtil.post(url, data, (searchedItems) => {
                        const price = searchedItems.Items.filter(
                            (i) => i.AuctionInfo.BuyPrice != null
                        )[0].AuctionInfo.BuyPrice
                        result.push(
                            "- " +
                                optionsForAcceKind[0].name +
                                "/" +
                                optionsForAcceKind[1].name +
                                " " +
                                price
                        )
                    })
                })
            })
        } else {
            result.push("아직 구현되지 않은 기능입니다.")
            return
        }
    }

    AuctionUtil.getGem = function (result, itemName) {
        const regex = /^(10|[1-9])(겁|작|멸|홍)$/ // 1~10의 숫자와 지정된 한글자 조합
        if (!regex.test(itemName)) {
            result.push(ErrorUtil.checkCmd + " [1~10][겁|작|멸|홍]")
            return
        }

        const numberMatch = itemName.match(/^(10|[1-9])/)
        const gemKind = itemName.match(/(겁|작|멸|홍)$/)[0]

        const level = numberMatch[0]

        const url = (HttpUtil.Base_URL + "/auctions/items").toString()
        const data = {
            ItemLevelMin: 0,
            ItemLevelMax: 0,
            ItemGradeQuality: null,
            ItemUpgradeLevel: null,
            ItemTradeAllowCount: null,
            SkillOptions: [
                {
                    FirstOption: null,
                    SecondOption: null,
                    MinValue: null,
                    MaxValue: null,
                },
            ],
            EtcOptions: [
                {
                    FirstOption: null,
                    SecondOption: null,
                    MinValue: null,
                    MaxValue: null,
                },
            ],
            Sort: "BUY_PRICE",
            CategoryCode: 210000,
            CharacterClass: "",
            ItemTier: null,
            ItemGrade: "",
            ItemName: level + "레벨 " + gemKind,
            PageNo: 0,
            SortCondition: "ASC",
        }

        result.push("※보석")
        HttpUtil.post(url, data, (searchedItems) => {
            result.push(
                itemName +
                    " 최저가 " +
                    searchedItems.Items[0].AuctionInfo.BuyPrice
            )
            result.push("거래소 물량 " + searchedItems.TotalCount + "개")
        })
    }
}

//CharacterUtil
{
    CharacterUtil.getCharacterInfo = function (result, characterName) {
        const baseUrl =
            HttpUtil.Base_URL +
            "/armories/characters/" +
            encodeURIComponent(characterName)

        const profileUrl = (baseUrl + "/profiles").toString()
        let isValid = true

        HttpUtil.get(profileUrl, (profile) => {
            if (profile == null) {
                result.push(
                    "'" +
                        characterName +
                        "'" +
                        "은(는) 존재하지않는 캐릭터입니다."
                )
                isValid = false
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
            result.push(
                "※" +
                    server +
                    " " +
                    (title ? "[" + title + "]" + " " + _cName : _cName)
            )
            result.push(cclass + " " + itemLevel + "Lv")

            const stats = profile.Stats
            const attack = stats.find((s) => s.Type == "공격력").Value
            const vitality = stats.find((s) => s.Type == "최대 생명력").Value
            result.push("공격력 : " + attack)
            result.push("최대 생명력 : " + vitality)
        })

        // 존재하지 않는 프로필
        if (!isValid) return

        /////////////////////////////////////////////////////////////////////////
        result.push("")
        const equipmentUrl = (baseUrl + "/equipment").toString()
        HttpUtil.get(equipmentUrl, (equipments) => {
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
                    } else if (
                        jsonData[key].type === "ItemTitle" ||
                        jsonData[key].type === "ItemPartBox"
                    ) {
                        // 내부의 "value" 객체 내의 텍스트 정리
                        let value = jsonData[key].value
                        if (value.leftStr0)
                            value.leftStr0 = cleanText(value.leftStr0)
                        if (value.leftStr1)
                            value.leftStr1 = cleanText(value.leftStr1)
                        if (value.leftStr2)
                            value.leftStr2 = cleanText(value.leftStr2)
                        if (value.rightStr0)
                            value.rightStr0 = cleanText(value.rightStr0)
                        if (value.Element_000)
                            value.Element_000 = cleanText(value.Element_000)
                        if (value.Element_001)
                            value.Element_001 = cleanText(value.Element_001)
                    }
                }

                return jsonData
            }
            {
                // 무기 투구 상의 하의 장갑 어깨
                // 무기 : 품질95 / +17강 / 상재10단계
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
                        const qualityValue =
                            tooltip.Element_001.value.qualityValue
                        const qualityStr =
                            qualityValue < 100
                                ? "0" + qualityValue
                                : qualityValue
                        const equipLvStr =
                            cloth.Name.toString().split(" ")[0].slice(1) + "강"
                        const highLv = tooltip.Element_005.value
                            .toString()
                            .split(" ")[2]
                        result.push(
                            [
                                cloth.Type,
                                qualityStr,
                                equipLvStr,
                                highLv ? highLv : "X",
                            ].join(" | ")
                        )
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
                    nasaengmuns.forEach((nasaengmun) => {
                        const chowolInfo = nasaengmun.find((n) => {
                            if (n && n.Element_000 && n.Element_000.topStr)
                                return n.Element_000.topStr.includes("초월")
                            else return false
                        })

                        if (chowolInfo) {
                            const cLv = Number(
                                chowolInfo.Element_000.topStr.split(" ")[4]
                            )
                            chowol.push(cLv)
                        } else {
                            chowol.push(0)
                        }
                    })
                    const mChowol = chowol[0]
                    const bChowol =
                        chowol[1] +
                        chowol[2] +
                        chowol[3] +
                        chowol[4] +
                        chowol[5]
                    const allChowol = mChowol + bChowol
                    result.push(
                        "초월" +
                            allChowol +
                            " : " +
                            "방초" +
                            bChowol +
                            "+" +
                            "무초" +
                            mChowol
                    )
                }
            }
        })
    }
}

//EtcUtil
{
    EtcUtil.islandNameShort = {
        수라도: "수라도",
        "고요한 안식의 섬": "고안섬",
        "우거진 갈대의 섬": "우갈섬",
        "환영 나비 섬": "환나섬",
        포르페: "포르페",
        "기회의 섬": "기회섬",
        "하모니 섬": "하모니",
        "쿵덕쿵 아일랜드": "쿵덕쿵",
        "잔혹한 장난감 성": "잔장성",
        몬테섬: "몬테섬",
        "블루홀 섬": "블루홀",
        "볼라르 섬": "볼라르",
        "죽음의 협곡": "죽협",
        "라일라이 아일랜드": "라일라이",
        메데이아: "메데",
        "스노우팡 아일랜드": "스노우팡",
    }
    EtcUtil.rewardItemShort = {
        "대양의 주화 상자/해적 주화": "해주",
        "대양의 주화 상자": "해주",
        "해적 주화": "해주",
        "전설 ~ 고급 카드 팩 III/전설 ~ 고급 카드 팩 IV/영혼의 잎사귀": "카드",
        "전설 ~ 고급 카드 팩 III": "카드",
        "전설 ~ 고급 카드 팩 IV": "카드",
        "영혼의 잎사귀": "카드",
        실링: "실링",
        골드: "골드",
    }

    EtcUtil.getAdventureIslandForDay = function (result, _dayOritem) {
        const days = ["일", "월", "화", "수", "목", "금", "토"]
        const days2 = [
            "일요일",
            "월요일",
            "화요일",
            "수요일",
            "목요일",
            "금요일",
            "토요일",
        ]
        const items = ["골드", "실링", "해주", "카드"]
        if (_dayOritem) {
            if (
                !days.includes(_dayOritem) &&
                !days2.includes(_dayOritem) &&
                !items.includes(_dayOritem)
            ) {
                result.push(ErrorUtil.checkCmd)
                return
            }
        }

        const today = (() => {
            const today = new Date().getDay()
            return days[today]
        })()

        const subTitle = (() => {
            if (_dayOritem) {
                if (days.includes(_dayOritem)) return _dayOritem + "요일"
                else return _dayOritem
            } else return today + "요일"
        })()
        result.push("※모험섬" + " [" + subTitle + "]")

        // 아이템 검색
        const _url = (HttpUtil.Base_URL + "/gamecontents/calendar").toString()

        HttpUtil.get(_url, (calendar) => {
            const loaDays = ["수", "목", "금", "토", "일", "월", "화"]
            const islandInfos = loaDays.map((day) => {
                return {
                    day: day,
                    island: {
                        // ([모험섬이름, 보상])[]
                        morning: [],
                        afternoon: [],
                    },
                    isWeekend: day == "토" || day == "일",
                }
            })

            calendar
                .filter((c) => c.CategoryName == "모험 섬")
                .map((i) => {
                    return {
                        name: EtcUtil.islandNameShort[i.ContentsName],
                        items: i.RewardItems[0].Items.filter(
                            (item) => !!item.StartTimes
                        ).map((item) => {
                            const _times = []
                            const seenDates = new Set()
                            item.StartTimes.forEach((time) => {
                                const date = time.split("T")[0]
                                if (!seenDates.has(date)) {
                                    _times.push(time)
                                    seenDates.add(date)
                                }
                            })
                            return {
                                name: item.Name,
                                icon: item.Icon,
                                grade: item.Grade,
                                times: _times,
                            }
                        }),
                    }
                })
                .forEach((info) => {
                    const islandName = info.name
                    info.items.forEach((item) => {
                        const itemName = item.name
                        item.times.forEach((time) => {
                            const slpitTime = time.split("T")
                            const timeInfo = {
                                date: slpitTime[0],
                                hour: Number(slpitTime[1].substr(0, 2)),
                            }
                            const date = new Date(timeInfo.date)
                            const dayOfWeek = days[date.getDay()]

                            const islandInfo = islandInfos.find(
                                (i) => i.day == dayOfWeek
                            )

                            const timePeriod = islandInfo.isWeekend
                                ? timeInfo.hour <= 13
                                    ? "morning"
                                    : "afternoon"
                                : "morning"

                            if (
                                islandInfo.island[timePeriod].every(
                                    (i) => i[0] != islandName
                                )
                            ) {
                                islandInfo.island[timePeriod].push([
                                    islandName,
                                    EtcUtil.rewardItemShort[itemName],
                                ])
                            }
                        })
                    })
                })

            if (items.includes(_dayOritem)) {
                islandInfos.forEach((info) => {
                    const moring = info.island.morning.find(
                        (i) => i[1] == _dayOritem
                    )
                    const afternoon = info.island.afternoon.find(
                        (i) => i[1] == _dayOritem
                    )
                    if (moring && afternoon) {
                        result.push(
                            info.day +
                                "요일 : " +
                                moring[0] +
                                "/" +
                                afternoon[0]
                        )
                    } else if (afternoon) {
                        result.push(info.day + "요일 : X/" + afternoon[0])
                    } else if (moring) {
                        result.push(info.day + "요일 : " + moring[0])
                    } else {
                        result.push(info.day + "요일 : X")
                    }
                })
            } else {
                const targetDay = _dayOritem ? _dayOritem[0] : today
                const info = islandInfos.find((i) => i.day == targetDay).island
                {
                    // 오전 or 하루
                    info.morning.forEach((i) => {
                        result.push(i[0] + " : " + i[1])
                    })
                }

                if (info.afternoon.length > 0) {
                    // 오후 : 주말에 한정
                    result.push("================")
                    info.afternoon.forEach((i) => {
                        result.push(i[0] + " : " + i[1])
                    })
                }
            }
        })
    }

    EtcUtil.getAcceDealPlus = function (result) {
        result.push("※악세 딜증")
        EtcUtil.acceDealPlus.forEach((info) => {
            result.push(info.name + " : " + info.plus + "%")
        })
    }
}

// MarketUtil
{
    /**
     *
     * @param {*} result
     * @param {*} itemName
     */
    MarketUtil.getUGak = function (result, itemName) {
        const url = (HttpUtil.Base_URL + "/markets/items").toString()

        result.push("※유각")
        const data = {
            Sort: "CURRENT_MIN_PRICE",
            CategoryCode: 40000,
            CharacterClass: "",
            ItemTier: null,
            ItemGrade: "유물",
            ItemName: itemName ? itemName : "",
            PageNo: 0,
            SortCondition: "DESC",
        }

        HttpUtil.post(url, data, (searchedItems) => {
            const items = searchedItems.Items
            items.forEach((item, idx) => {
                const index = idx + 1
                const name = MarketUtil.uGakNameShort[item.Name]
                const price = item.CurrentMinPrice

                result.push(index + ". " + name + " " + price)
            })
        })
    }
}

// HttpUtil
{
    HttpUtil.get = function (url, callback) {
        const result = org.jsoup.Jsoup.connect(url)
            .header("accept", "application/json")
            .header("Authorization", HttpUtil.authorization)
            .ignoreContentType(true)
            .ignoreHttpErrors(true)
            .timeout(HttpUtil.timeout)
            .get()
            .text()
        callback(JSON.parse(result))
    }
    HttpUtil.post = function (url, data, callback) {
        const result = org.jsoup.Jsoup.connect(url)
            .header("Authorization", HttpUtil.authorization)
            .header("Content-Type", "application/json")
            .requestBody(JSON.stringify(data))
            .ignoreContentType(true)
            .ignoreHttpErrors(true)
            .timeout(HttpUtil.timeout)
            .post()
            .text()
        callback(JSON.parse(result))
    }
    // TODO Error...
    // HttpUtil.error = function (error, msg) {
    //     // 사용되지 않게되버림. error 코드는 어떻게 가져오게..?
    //     Log.e(error)
    //     const errorMessage = error.toString()
    //     const statusIndex = errorMessage.indexOf("Status=")
    //     if (statusIndex !== -1) {
    //         const statusStart = statusIndex + "Status=".length
    //         const statusEnd = errorMessage.indexOf(",", statusStart)
    //         const statusCode = errorMessage
    //             .substring(statusStart, statusEnd)
    //             .trim()

    //         // 에러 처리
    //         if (statusCode.startsWith("5")) {
    //             msg.reply(
    //                 "에러코드 : " +
    //                     statusCode +
    //                     "\n로스트아크 서버 에러입니다.\nex)로스트아크 서버 점검"
    //             )
    //         } else if (statusCode.startsWith("4")) {
    //             msg.reply(
    //                 "에러코드 : " + statusCode + "\n클라이언트 에러입니다."
    //             )
    //         }
    //     } else {
    //         msg.reply("알 수 없는 에러입니다.")
    //     }
    // }
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
