import { AdventureIslandPeriod } from "@prisma/client";

export const ADVENTURE_ISLAND_TEST_NOTE_SOURCE_KEY = "memo-note-20260402";

const TEST_NOTE_YEAR = 2026;
const TEST_NOTE_CATEGORY_NAME = "모험 섬";
const WEEKDAY_START_TIME = "11:00:00";
const WEEKEND_MORNING_START_TIME = "09:00:00";
const WEEKEND_AFTERNOON_START_TIME = "19:00:00";

const SHORT_NAME_TO_CONTENTS_NAME: Record<string, string> = {
    고안: "고요한 안식의 섬",
    기회: "기회의 섬",
    메데: "메데이아",
    메데이아: "메데이아",
    몬테: "몬테섬",
    볼라르: "볼라르 섬",
    블루홀: "블루홀 섬",
    수라: "수라도",
    수라도: "수라도",
    스노우: "스노우팡 아일랜드",
    우갈: "우거진 갈대의 섬",
    우갈섬: "우거진 갈대의 섬",
    잔장섬: "잔혹한 장난감 성",
    장난감: "잔혹한 장난감 성",
    죽협: "죽음의 협곡",
    쿵덕쿵: "쿵덕쿵 아일랜드",
    포르페: "포르페",
    하모니: "하모니 섬",
    환나: "환영 나비 섬",
    라일: "라일라이 아일랜드",
    라일라이: "라일라이 아일랜드",
};

const REWARD_BY_TYPE = {
    gold: {
        rewardName: "골드",
        rewardShortName: "골드",
        rewardIconUrl: "https://cdn-lostark.game.onstove.com/efui_iconatlas/money/money_4.png",
    },
    card: {
        rewardName: "전설 ~ 고급 카드 팩 IV",
        rewardShortName: "카드",
        rewardIconUrl: "https://cdn-lostark.game.onstove.com/efui_iconatlas/use/use_10_236.png",
    },
} as const;

const TEST_NOTE_LINES = [
    "4/1~5 수 라일 / 하모니G / 스노우 / 토 죽협 포르페 / 블루홀 장난감G",
    "4/6~12 월 하모니 / 기회 / 수 볼라르g-수라도c / 환나 / 블루홀 / 토 죽협 스노우g-우갈c / 몬테 기회",
    "4/13~19 월 쿵덕쿵G / 장난감 / 수 블루홀 / 볼라르 / 고안G / 토 메데 하모니 / 일 쿵덕쿵 포르페g-환나c",
    "4/20~26 월 몬테 / 기회 / 수 수라g-포르페c / 하모니 / 쿵덕쿵 / 토 볼라르 메데g-라일c / 쿵덕쿵 장난감",
    "4/27~30 월 수라 / 화 라일g-장난감c / 수 환나 / 우갈",
] as const;

interface ParsedRewardToken {
    contentsName: string;
    shortName: string;
    rewardType: keyof typeof REWARD_BY_TYPE;
    sourceToken: string;
}

export interface AdventureIslandTestSeedRecord {
    sourceKey: string;
    lostArkDate: string;
    period: AdventureIslandPeriod;
    categoryName: string;
    contentsName: string;
    shortName: string;
    rewardName: string;
    rewardShortName: string;
    rewardIconUrl: string;
    startTime: string;
    rawData: {
        source: string;
        memoLine: string;
        memoDayToken: string;
        memoPeriodToken: string;
        sourceToken: string;
        rewardType: keyof typeof REWARD_BY_TYPE;
    };
}

function formatDate(month: number, day: number) {
    return `${TEST_NOTE_YEAR}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDateRange(rangeText: string) {
    const [startText, endDayText] = rangeText.split("~");
    const [monthText, startDayText] = startText.split("/");

    return {
        month: Number(monthText),
        startDay: Number(startDayText),
        endDay: Number(endDayText),
    };
}

function buildDateRange(rangeText: string) {
    const { month, startDay, endDay } = parseDateRange(rangeText);
    const dates: string[] = [];

    for (let day = startDay; day <= endDay; day += 1) {
        dates.push(formatDate(month, day));
    }

    return dates;
}

function parseRewardToken(token: string): ParsedRewardToken {
    const normalizedToken = token.trim();
    const match = normalizedToken.match(/^(.*?)([gGcC])?$/u);
    const islandToken = match?.[1]?.trim() ?? normalizedToken;
    const rewardMarker = match?.[2]?.toLowerCase();
    const contentsName = SHORT_NAME_TO_CONTENTS_NAME[islandToken];

    if (!contentsName) {
        throw new Error(`Unknown adventure island short name: ${islandToken}`);
    }

    return {
        contentsName,
        shortName: islandToken,
        rewardType: rewardMarker === "g" ? "gold" : "card",
        sourceToken: normalizedToken,
    };
}

function parsePeriodToken(token: string) {
    return token
        .split("-")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => parseRewardToken(item));
}

function getPeriodInfo(dateText: string, periodIndex: number) {
    const dayOfWeek = new Date(`${dateText}T00:00:00`).getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return periodIndex === 0
            ? {
                  period: AdventureIslandPeriod.weekendMorning,
                  startTime: `${dateText}T${WEEKEND_MORNING_START_TIME}`,
              }
            : {
                  period: AdventureIslandPeriod.weekendAfternoon,
                  startTime: `${dateText}T${WEEKEND_AFTERNOON_START_TIME}`,
              };
    }

    return {
        period: AdventureIslandPeriod.weekday,
        startTime: `${dateText}T${WEEKDAY_START_TIME}`,
    };
}

function stripDayLabel(dayToken: string) {
    return dayToken.replace(/^(월|화|수|목|금|토|일)\s+/u, "").trim();
}

export function buildAdventureIslandTestSeedRecords(): AdventureIslandTestSeedRecord[] {
    const records: AdventureIslandTestSeedRecord[] = [];

    for (const memoLine of TEST_NOTE_LINES) {
        const [rangeText, ...restTokens] = memoLine.split(" ");
        const dayTokens = restTokens.join(" ").split("/").map((item) => item.trim());
        const dateRange = buildDateRange(rangeText);

        if (dateRange.length !== dayTokens.length) {
            throw new Error(`Memo day count does not match date range: ${memoLine}`);
        }

        for (let dateIndex = 0; dateIndex < dateRange.length; dateIndex += 1) {
            const lostArkDate = dateRange[dateIndex];
            const dayToken = stripDayLabel(dayTokens[dateIndex]);
            const periodTokens = dayToken.split(/\s+/).filter(Boolean);

            for (let periodIndex = 0; periodIndex < periodTokens.length; periodIndex += 1) {
                const periodToken = periodTokens[periodIndex];
                const periodInfo = getPeriodInfo(lostArkDate, periodIndex);

                for (const parsedToken of parsePeriodToken(periodToken)) {
                    const rewardInfo = REWARD_BY_TYPE[parsedToken.rewardType];

                    /*
                     * 20260402 khs
                     * 메모장 표기 규칙상 접미사 없는 단일 표기는 카드섬으로 보고, G/g만 골드섬으로 해석한다.
                     * 사용자가 제공한 원문 규칙의 "골드섬 단일은 G 표시" 문장을 근거로 테스트 데이터 변환 기준을 고정한다.
                     */
                    records.push({
                        sourceKey: ADVENTURE_ISLAND_TEST_NOTE_SOURCE_KEY,
                        lostArkDate,
                        period: periodInfo.period,
                        categoryName: TEST_NOTE_CATEGORY_NAME,
                        contentsName: parsedToken.contentsName,
                        shortName: parsedToken.shortName,
                        rewardName: rewardInfo.rewardName,
                        rewardShortName: rewardInfo.rewardShortName,
                        rewardIconUrl: rewardInfo.rewardIconUrl,
                        startTime: periodInfo.startTime,
                        rawData: {
                            source: ADVENTURE_ISLAND_TEST_NOTE_SOURCE_KEY,
                            memoLine,
                            memoDayToken: dayTokens[dateIndex],
                            memoPeriodToken: periodToken,
                            sourceToken: parsedToken.sourceToken,
                            rewardType: parsedToken.rewardType,
                        },
                    });
                }
            }
        }
    }

    return records;
}
