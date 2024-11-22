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
 *
 * # 기타
 *  - util 상위 부분 공통화
 *  - 서버가 느릴때 로딩중
 *  - 명령어 정리
 */

/**
 * 고민
 *
 * # 초월이나 엘릭서 안된 캐릭들 표시 여부
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
    /**
     * 모든 명령어는 !로 시작
     * [] : 해당하는 내용
     * ? : 있어도 되고, 없어도 된다.
     * | : 나열된 문자열 중 하나
     * ![캐릭터이름]
     * !모험섬 [?요일]
     * !악세 [고대|유물] [상상옵|상중옵|상하옵|상단일|중중옵|중하옵|중단일]
     */
    const cmds = msg.content.slice(1).split(" ")

    if (cmds[0] == "모험섬") {
        EtcUtil.getAdventureIslandForDay(msg, cmds[1])
    } else if (cmds[0] == "악세") {
        AuctionUtil.getAcce(msg, cmds[1], cmds[2])
    } else {
        CharacterUtil.getCharacterInfo(msg)
    }
}

bot.setCommandPrefix("!") // "!"로 시작하는 메시지를 command로 판단
bot.addListener(Event.COMMAND, onCommand)

/**
 * util 관리
 * - 기능 주제별 : AuctionUtil CharacterUtil EtcUtil
 * - 자주 사용되는 함수별 : HttpUtil
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
}
const HttpUtil = {
    Base_URL: "https://developer-lostark.game.onstove.com",
    authorization: ("bearer " + apiKey).toString(),
    timeout: 30 * 1000,
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
    AuctionUtil.getAcce = function (msg, itemGrade, simpleItemOption) {
        const result = []
        result.push("@" + msg.author.name)

        if (itemGrade != "유물" && itemGrade != "고대") {
            msg.reply("명령어를 확인해주세요.")
            return
        }
        const simpleItemOptions = [
            "상상옵",
            "상중옵",
            "상하옵",
            "상단일",
            "중중옵",
            "중하옵",
            "중단일",
        ]
        if (!simpleItemOptions.includes(simpleItemOption)) {
            msg.reply("명령어를 확인해주세요.\n유효하지 않은 옵션입니다.")
            return
        }

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
                    },
                    {
                        secondOption: 42,
                        name: "적주피",
                    },
                ],
                [
                    {
                        secondOption: 43,
                        name: "조게획",
                    },
                    {
                        secondOption: 44,
                        name: "낙인력",
                    },
                ],
            ],
            200020: [
                [
                    {
                        secondOption: 45,
                        name: "공퍼",
                    },
                    {
                        secondOption: 46,
                        name: "무공퍼",
                    },
                ],
            ],
            200030: [
                [
                    {
                        secondOption: 49,
                        name: "치적",
                    },
                    {
                        secondOption: 50,
                        name: "치피",
                    },
                ],
                [
                    {
                        secondOption: 51,
                        name: "아공강",
                    },
                    {
                        secondOption: 52,
                        name: "아피강",
                    },
                ],
            ],
        }

        // 상상옵 상중옵 상하옵 상단일 중중옵 중하옵 중단일
        const itemOptionGrades = (() => {
            if (simpleItemOption == "상상옵") return [3, 3]
            else if (simpleItemOption == "상중옵") return [3, 2]
            else if (simpleItemOption == "상하옵") return [3, 1]
            else if (simpleItemOption == "상단일") return [3]
            else if (simpleItemOption == "중중옵") return [2, 2]
            else if (simpleItemOption == "중하옵") return [3, 1]
            else if (simpleItemOption == "중단일") return [2]
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
         * - 조게획 70000
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
                                    MinValue: itemOptionGrades[0], // 1하 2중 3상
                                    MaxValue: itemOptionGrades[0],
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
                                MinValue: itemOptionGrades[0],
                                MaxValue: itemOptionGrades[0],
                            },
                            {
                                FirstOption: 7,
                                SecondOption:
                                    optionsForAcceKind[1].secondOption,
                                MinValue: itemOptionGrades[1],
                                MaxValue: itemOptionGrades[1],
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
                                MinValue: itemOptionGrades[0],
                                MaxValue: itemOptionGrades[0],
                            },
                            {
                                FirstOption: 7,
                                SecondOption:
                                    optionsForAcceKind[0].secondOption,
                                MinValue: itemOptionGrades[1],
                                MaxValue: itemOptionGrades[1],
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
                                MinValue: itemOptionGrades[0],
                                MaxValue: itemOptionGrades[0],
                            },
                            {
                                FirstOption: 7,
                                SecondOption:
                                    optionsForAcceKind[1].secondOption,
                                MinValue: itemOptionGrades[1],
                                MaxValue: itemOptionGrades[1],
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
            msg.reply("아직 구현되지 않은 기능입니다.")
            return
        }

        //반환
        msg.reply(result.join("\n"))
    }
}

//CharacterUtil
{
    CharacterUtil.getCharacterInfo = function (msg) {
        const result = []
        result.push("@" + msg.author.name)
        const cName = msg.content.slice(1)
        const baseUrl =
            HttpUtil.Base_URL +
            "/armories/characters/" +
            encodeURIComponent(cName)

        const profileUrl = (baseUrl + "/profiles").toString()

        HttpUtil.get(profileUrl, (profile) => {
            if (profile == null) {
                msg.reply(
                    "'" +
                        cName +
                        "'" +
                        "은(는) 존재하지않는 캐릭터나 명령어입니다."
                )
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

        //반환
        msg.reply(result.join("\n"))
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
        "전설 ~ 고급 카드 팩 III/전설 ~ 고급 카드 팩 IV/영혼의 잎사귀": "카드",
        실링: "실링",
        골드: "골드",
    }

    EtcUtil.getAdventureIslandForDay = function (msg, _day) {
        const result = []
        result.push("@" + msg.author.name)

        const days = ["일", "월", "화", "수", "목", "금", "토"]
        const today = (() => {
            const today = new Date().getDay() // 0(일요일)부터 6(토요일)까지 반환
            return days[today]
        })()

        const targetDay = (_day ? _day : today)[0]
        if (!days.includes(targetDay)) {
            result.push("요일을 다시 확인하세요.")
            msg.reply(result.join("\n"))
            return
        }
        result.push("※모험섬 [" + targetDay + "요일]")

        const targetDate = (() => {
            const dayOrder = ["수", "목", "금", "토", "일", "월", "화"]
            const todayIndex = dayOrder.indexOf(today)
            const targetIndex = dayOrder.indexOf(targetDay)

            const currentDate = new Date()
            // today가 수목금토일월화 중 몇 번째인지에 따라 위치 조정
            const diffDays = targetIndex - todayIndex
            currentDate.setDate(currentDate.getDate() + diffDays)
            return currentDate.toISOString().split("T")[0]
        })()

        const url = (HttpUtil.Base_URL + "/gamecontents/calendar").toString()
        HttpUtil.get(url, (calendar) => {
            /**
             * type adventureIslands = ai[]
             * type ai = {
             *      name : string
             *      itmes : item[]
             * }
             * type item = {
             *      name : string
             *      startTimes : ISOString[]
             * }
             */
            const adventureIslands = calendar
                .filter((c) => c.CategoryName == "모험 섬")
                .map((i) => {
                    return {
                        name: EtcUtil.islandNameShort[i.ContentsName],
                        items: i.RewardItems[0].Items.filter(
                            (item) =>
                                !!item.StartTimes &&
                                item.StartTimes.some(
                                    (st) => st.slice(0, 10) == targetDate
                                )
                        ).map((item) => {
                            return {
                                name: item.Name,
                                startTimes: item.StartTimes.filter(
                                    (st) => st.slice(0, 10) == targetDate
                                ),
                            }
                        }),
                    }
                })
                .filter((ai) => ai.items.length > 0)

            const morning = []
            const afternoon = []
            adventureIslands.forEach((ai) => {
                if (ai.items[0].startTimes.length == 3) {
                    if (
                        ai.items[0].startTimes[0].split("T")[1].split(":")[0] ==
                        "09"
                    ) {
                        morning.push(ai)
                    } else {
                        afternoon.push(ai)
                    }
                } else {
                    morning.push(ai)
                }
            })

            {
                // 오전 or 하루
                result.push("================")
                morning.forEach((ai) => {
                    const name = ai.name
                    const rewardItem = ai.items.map((i) => i.name).join("/")
                    result.push(
                        name + " : " + EtcUtil.rewardItemShort[rewardItem]
                    )
                })
            }

            if (afternoon.length > 0) {
                // 오후 : 주말에 한정
                result.push("================")

                afternoon.forEach((ai) => {
                    const name = ai.name
                    const rewardItem = ai.items.map((i) => i.name).join("/")
                    result.push(
                        name + " : " + EtcUtil.rewardItemShort[rewardItem]
                    )
                })
            }

            //반환
            msg.reply(result.join("\n"))
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
    HttpUtil.error = function (error, msg) {
        // 사용되지 않게되버림. error 코드는 어떻게 가져오게..?
        Log.e(error)
        const errorMessage = error.toString()
        const statusIndex = errorMessage.indexOf("Status=")
        if (statusIndex !== -1) {
            const statusStart = statusIndex + "Status=".length
            const statusEnd = errorMessage.indexOf(",", statusStart)
            const statusCode = errorMessage
                .substring(statusStart, statusEnd)
                .trim()

            // 에러 처리
            if (statusCode.startsWith("5")) {
                msg.reply(
                    "에러코드 : " +
                        statusCode +
                        "\n로스트아크 서버 에러입니다.\nex)로스트아크 서버 점검"
                )
            } else if (statusCode.startsWith("4")) {
                msg.reply(
                    "에러코드 : " + statusCode + "\n클라이언트 에러입니다."
                )
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
