import { getShortIslandName, getShortRewardName } from "../mappings/lostark.js";
import { getCalendarEventColors } from "../calendarEventColors.js";

const LOSTARK_EVENTS_ENDPOINT = "/api/lostark/news/events";
const LOSTARK_GAME_CONTENTS_ENDPOINT = "/api/lostark/gamecontents/calendar";
const DISPLAYABLE_GAME_CONTENT_TYPES = [
    {
        key: "adventureIsland",
        label: "모험섬",
        keywords: ["모험섬", "모험 섬"],
    },
    {
        key: "chaosGate",
        label: "카오스게이트",
        keywords: ["카오스게이트", "카오스 게이트"],
    },
    {
        key: "fieldBoss",
        label: "필드보스",
        keywords: ["필드보스", "필드 보스"],
    },
];
const ADVENTURE_ISLAND_MAJOR_REWARDS = [
    { key: "gold", sourceNames: ["골드"] },
    { key: "shilling", sourceNames: ["실링"] },
    { key: "oceanCoinChest", sourceNames: ["대양의 주화 상자", "대륙의 주화 상자"] },
    { key: "legendCardPackIv", sourceNames: ["전설 ~ 고급 카드 팩 IV"] },
];

/**
 * 역할: ISO 날짜시간 문자열에서 날짜 부분만 추출한다.
 * 파라미터 설명:
 * - dateTime: `YYYY-MM-DDTHH:mm:ss` 형식 문자열
 * 반환값 설명: `YYYY-MM-DD` 형식 날짜 문자열
 */
function toDateOnly(dateTime) {
    return dateTime.split("T")[0];
}

/**
 * 역할: 날짜시간 문자열을 숫자 기반 날짜 정보로 분해한다.
 * 파라미터 설명:
 * - dateTime: `YYYY-MM-DDTHH:mm:ss` 형식 문자열
 * 반환값 설명: 연/월/일/시/분 숫자 객체
 */
function parseDateTime(dateTime) {
    const [datePart, timePart = "00:00:00"] = dateTime.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour = 0, minute = 0] = timePart.split(":").map(Number);

    return {
        year,
        month,
        day,
        hour,
        minute,
    };
}

/**
 * 역할: 연/월/일 값을 `YYYY-MM-DD` 형식으로 조합한다.
 * 파라미터 설명:
 * - year: 연도
 * - month: 월
 * - day: 일
 * 반환값 설명: 포맷된 날짜 문자열
 */
function formatDateParts(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * 역할: 현재 브라우저 로컬 기준 날짜를 문자열로 반환한다.
 * 파라미터 설명:
 * - date: 기준이 될 Date 객체
 * 반환값 설명: `YYYY-MM-DD` 형식 날짜 문자열
 */
function toLocalDateOnly(date = new Date()) {
    return formatDateParts(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * 역할: 로스트아크 기준 일자(06:00 시작)로 환산한 날짜를 반환한다.
 * 파라미터 설명:
 * - dateTime: 콘텐츠 시작 시각 문자열
 * 반환값 설명: 로스트아크 기준 `YYYY-MM-DD` 날짜 문자열
 */
function toLostArkDateOnly(dateTime) {
    const { year, month, day, hour } = parseDateTime(dateTime);
    const targetDate = new Date(year, month - 1, day);

    if (hour < 6) {
        targetDate.setDate(targetDate.getDate() - 1);
    }

    return formatDateParts(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        targetDate.getDate(),
    );
}

/**
 * 역할: 로스트아크 일자 시작 시점(06:00)부터 몇 분이 지났는지 계산한다.
 * 파라미터 설명:
 * - dateTime: 콘텐츠 시작 시각 문자열
 * 반환값 설명: 로스트아크 일자 시작 기준 경과 분
 */
function getLostArkMinutesFromDayStart(dateTime) {
    const { hour, minute } = parseDateTime(dateTime);
    const adjustedHour = hour < 6 ? hour + 24 : hour;

    return (adjustedHour - 6) * 60 + minute;
}

/**
 * 역할: 로스트아크 기준 날짜가 주말인지 판별한다.
 * 파라미터 설명:
 * - dateText: 로스트아크 기준 날짜 문자열
 * 반환값 설명: 주말 여부
 */
function isWeekendLostArkDate(dateText) {
    const targetDate = new Date(`${dateText}T00:00:00`);
    const dayOfWeek = targetDate.getDay();

    return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * 역할: 모험섬 이벤트를 평일/주말 오전/주말 오후 그룹으로 분류한다.
 * 파라미터 설명:
 * - startTime: 모험섬 시작 시각 문자열
 * 반환값 설명: `weekday`, `weekendMorning`, `weekendAfternoon` 중 하나
 */
function getAdventureIslandPeriod(startTime) {
    const lostArkDate = toLostArkDateOnly(startTime);

    if (!isWeekendLostArkDate(lostArkDate)) {
        return "weekday";
    }

    return getLostArkMinutesFromDayStart(startTime) <= 7 * 60
        ? "weekendMorning"
        : "weekendAfternoon";
}

/**
 * 역할: 전달된 날짜 다음 날의 날짜 문자열을 계산한다.
 * 파라미터 설명:
 * - dateText: 기준 날짜 문자열
 * 반환값 설명: 다음 날 `YYYY-MM-DD`
 */
function addOneDay(dateText) {
    const [year, month, day] = dateText.split("-").map(Number);
    const nextDate = new Date(year, month - 1, day + 1);
    const nextYear = nextDate.getFullYear();
    const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
    const nextDay = String(nextDate.getDate()).padStart(2, "0");

    return `${nextYear}-${nextMonth}-${nextDay}`;
}

/**
 * 역할: 진행 중인 공지 이벤트인지 날짜 기준으로 판별한다.
 * 파라미터 설명:
 * - startDate: 이벤트 시작일 문자열
 * - endDate: 이벤트 종료일 문자열
 * - now: 비교 기준 현재 시각
 * 반환값 설명: 진행 중 여부
 */
function isOngoingEvent(startDate, endDate, now = new Date()) {
    const start = toDateOnly(startDate);
    const end = toDateOnly(endDate);
    const today = toLocalDateOnly(now);

    return start <= today && today <= end;
}

/**
 * 역할: 문자열 비교를 위해 공백 제거 및 소문자화한다.
 * 파라미터 설명:
 * - value: 정규화할 문자열
 * 반환값 설명: 정규화된 문자열
 */
function normalizeContentText(value = "") {
    return value.replace(/\s+/g, "").toLowerCase();
}

/**
 * 역할: 콘텐츠 타입 키로 표시 타입 객체를 조회한다.
 * 파라미터 설명:
 * - typeKey: 조회할 콘텐츠 타입 키
 * 반환값 설명: 일치하는 타입 객체 또는 null
 */
function getGameContentTypeByKey(typeKey) {
    return DISPLAYABLE_GAME_CONTENT_TYPES.find((type) => type.key === typeKey) ?? null;
}

/**
 * 역할: 콘텐츠가 모험섬인지 판별한다.
 * 파라미터 설명:
 * - content: 로스트아크 콘텐츠 원본 데이터
 * 반환값 설명: 모험섬 여부
 */
function isAdventureIslandContent(content) {
    const categoryName = normalizeContentText(content.CategoryName);
    const contentsName = normalizeContentText(content.ContentsName);
    const adventureIslandType = getGameContentTypeByKey("adventureIsland");

    if (!adventureIslandType) {
        return false;
    }

    return adventureIslandType.keywords.some((keyword) => {
        const normalizedKeyword = normalizeContentText(keyword);

        return (
            categoryName === normalizedKeyword ||
            contentsName === normalizedKeyword ||
            categoryName.includes(normalizedKeyword) ||
            contentsName.includes(normalizedKeyword)
        );
    });
}

/**
 * 역할: 일반 `[섬]` 콘텐츠인지 판별한다.
 * 파라미터 설명:
 * - content: 로스트아크 콘텐츠 원본 데이터
 * 반환값 설명: 일반 섬 여부
 */
function isIslandContent(content) {
    const categoryName = normalizeContentText(content.CategoryName);
    const contentsName = normalizeContentText(content.ContentsName);
    const bracketIslandKeyword = normalizeContentText("[섬]");

    return (
        categoryName.includes(bracketIslandKeyword) ||
        contentsName.includes(bracketIslandKeyword)
    );
}

/**
 * 역할: 달력에 표시할 콘텐츠 타입을 결정한다.
 * 파라미터 설명:
 * - content: 로스트아크 콘텐츠 원본 데이터
 * 반환값 설명: 표시 대상 타입 객체 또는 null
 */
function getDisplayableGameContentType(content) {
    if (isAdventureIslandContent(content)) {
        return getGameContentTypeByKey("adventureIsland");
    }

    if (isIslandContent(content)) {
        return null;
    }

    const categoryName = normalizeContentText(content.CategoryName);
    const contentsName = normalizeContentText(content.ContentsName);

    return (
        DISPLAYABLE_GAME_CONTENT_TYPES.find((type) =>
            type.keywords.some((keyword) => {
                const normalizedKeyword = normalizeContentText(keyword);

                return (
                    categoryName === normalizedKeyword ||
                    contentsName === normalizedKeyword ||
                    categoryName.includes(normalizedKeyword) ||
                    contentsName.includes(normalizedKeyword)
                );
            }),
        ) ?? null
    );
}

/**
 * 역할: 주요 모험섬 보상 타입인지 정확한 이름 기준으로 판별한다.
 * 파라미터 설명:
 * - rewardName: 보상 이름
 * 반환값 설명: 일치하는 주요 보상 타입 객체 또는 null
 */
function getAdventureIslandMajorRewardType(rewardName) {
    const normalizedRewardName = normalizeContentText(rewardName);

    return (
        ADVENTURE_ISLAND_MAJOR_REWARDS.find((type) =>
            type.sourceNames.some(
                (sourceName) => normalizedRewardName === normalizeContentText(sourceName),
            ),
        ) ?? null
    );
}

/**
 * 역할: Bot 로직과 유사하게 현재 시작 시각에 매칭되는 첫 번째 주요 보상 1개를 선택한다.
 * 파라미터 설명:
 * - content: 모험섬 콘텐츠 원본 데이터
 * - startTime: 현재 이벤트 시작 시각
 * 반환값 설명: 짧게 변환된 보상명 또는 빈 문자열
 */
function getAdventureIslandReward(content, startTime) {
    const rewardItems = Array.isArray(content.RewardItems) ? content.RewardItems : [];
    const flattenedRewardItems = rewardItems.flatMap((rewardGroup) => {
        if (Array.isArray(rewardGroup?.Items)) {
            return rewardGroup.Items;
        }

        if (Array.isArray(rewardGroup)) {
            return rewardGroup;
        }

        return rewardGroup ? [rewardGroup] : [];
    });

    for (const rewardItem of flattenedRewardItems) {
        if (!Array.isArray(rewardItem?.StartTimes) || rewardItem.StartTimes.length === 0) {
            continue;
        }

        if (!rewardItem.StartTimes.includes(startTime)) {
            continue;
        }

        const rewardType = getAdventureIslandMajorRewardType(rewardItem?.Name ?? "");

        if (!rewardType) {
            continue;
        }

        return {
            rewardTypeKey: rewardType.key,
            rewardName: getShortRewardName(rewardItem.Name),
        };
    }

    return {
        rewardTypeKey: "",
        rewardName: "",
    };
}

/**
 * 역할: 콘텐츠 타입에 맞는 달력 표시 제목을 생성한다.
 * 파라미터 설명:
 * - content: 로스트아크 콘텐츠 원본 데이터
 * - displayType: 표시 대상 타입 객체
 * - startTime: 현재 이벤트 시작 시각
 * 반환값 설명: 달력 이벤트 제목 문자열
 */
function getGameContentEventTitle(content, displayType, startTime) {
    if (displayType.key !== "adventureIsland") {
        return displayType.label;
    }

    const { rewardName } = getAdventureIslandReward(content, startTime);
    const rewardText = rewardName ? ` (${rewardName})` : "";

    return `${getShortIslandName(content.ContentsName)}${rewardText}`;
}

/**
 * 역할: 공지 이벤트 응답을 FullCalendar 종일 이벤트 형식으로 변환한다.
 * 파라미터 설명:
 * - event: 로스트아크 뉴스 이벤트 원본 데이터
 * 반환값 설명: FullCalendar 이벤트 객체
 */
export function mapLostArkEventToCalendarEvent(event) {
    const start = toDateOnly(event.StartDate);
    const inclusiveEnd = toDateOnly(event.EndDate);
    const eventColors = getCalendarEventColors("event");

    return {
        id: `${event.Title}-${event.StartDate}`,
        title: event.Title,
        start,
        end: addOneDay(inclusiveEnd),
        allDay: true,
        url: event.Link,
        ...eventColors,
        extendedProps: {
            link: event.Link,
            sourceStartDate: event.StartDate,
            sourceEndDate: event.EndDate,
            filterTarget: "event",
        },
    };
}

/**
 * 역할: 게임 콘텐츠 응답을 FullCalendar 이벤트 배열로 변환한다.
 * 파라미터 설명:
 * - content: 로스트아크 게임 콘텐츠 원본 데이터
 * 반환값 설명: FullCalendar 이벤트 배열
 */
export function mapLostArkGameContentToCalendarEvents(content) {
    const displayType = getDisplayableGameContentType(content);

    if (!displayType) {
        return [];
    }

    return (content.StartTimes ?? []).map((startTime) => {
        const lostArkDate = toLostArkDateOnly(startTime);
        const adventureIslandReward =
            displayType.key === "adventureIsland"
                ? getAdventureIslandReward(content, startTime)
                : {
                      rewardTypeKey: "",
                      rewardName: "",
                  };
        const eventColors = getCalendarEventColors(
            displayType.key,
            adventureIslandReward.rewardTypeKey,
        );

        return {
            id: `${displayType.key}-${lostArkDate}-${content.ContentsName}`,
            title: getGameContentEventTitle(content, displayType, startTime),
            start: lostArkDate,
            allDay: true,
            ...eventColors,
            extendedProps: {
                categoryName: content.CategoryName,
                contentsName: content.ContentsName,
                contentType: displayType.key,
                period:
                    displayType.key === "adventureIsland"
                        ? getAdventureIslandPeriod(startTime)
                        : null,
                sourceStartTime: startTime,
                filterTarget: displayType.key,
                islandName:
                    displayType.key === "adventureIsland" ? content.ContentsName : "",
                rewardTypeKey: adventureIslandReward.rewardTypeKey,
                rewardName: adventureIslandReward.rewardName,
            },
        };
    });
}

/**
 * 역할: 콘텐츠 타입별 표시 규칙에 맞게 중복을 제거한다.
 * 파라미터 설명:
 * - events: 가공 전 게임 콘텐츠 이벤트 배열
 * 반환값 설명: 표시 규칙이 반영된 이벤트 배열
 */
function dedupeGameContentEvents(events) {
    const uniqueEvents = new Map();
    const adventureIslandGroups = new Map();

    // 콘텐츠 타입별 중복 제거 시작
    events.forEach((event) => {
        if (event.extendedProps.contentType !== "adventureIsland") {
            const uniqueKey = `${event.start}-${event.extendedProps.contentType}`;

            if (!uniqueEvents.has(uniqueKey)) {
                uniqueEvents.set(uniqueKey, event);
            }

            return;
        }

        const adventureIslandUniqueKey = [
            event.start,
            event.extendedProps.period,
            event.extendedProps.contentsName,
        ].join("-");

        if (uniqueEvents.has(adventureIslandUniqueKey)) {
            return;
        }

        uniqueEvents.set(adventureIslandUniqueKey, event);

        const groupKey = `${event.start}-${event.extendedProps.period}`;
        const groupedEvents = adventureIslandGroups.get(groupKey) ?? [];

        groupedEvents.push(event);
        adventureIslandGroups.set(groupKey, groupedEvents);
    });
    // 콘텐츠 타입별 중복 제거 끝

    const nonAdventureIslandEvents = [...uniqueEvents.entries()]
        .filter(([, event]) => event.extendedProps.contentType !== "adventureIsland")
        .map(([, event]) => event);
    const adventureIslandEvents = [...adventureIslandGroups.values()].flatMap((group) =>
        group.slice(0, 3),
    );

    return [...nonAdventureIslandEvents, ...adventureIslandEvents];
}

/**
 * 역할: 뉴스 이벤트 목록을 서버 엔드포인트에서 조회한다.
 * 파라미터 설명: 없음
 * 반환값 설명: 뉴스 이벤트 원본 배열 Promise
 */
async function fetchLostArkEvents() {
    const response = await fetch(LOSTARK_EVENTS_ENDPOINT, {
        headers: {
            accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch Lost Ark events: ${response.status}`);
    }

    return response.json();
}

/**
 * 역할: 게임 콘텐츠 일정 목록을 서버 엔드포인트에서 조회한다.
 * 파라미터 설명: 없음
 * 반환값 설명: 게임 콘텐츠 원본 배열 Promise
 */
async function fetchLostArkGameContents() {
    const response = await fetch(LOSTARK_GAME_CONTENTS_ENDPOINT, {
        headers: {
            accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch Lost Ark game contents: ${response.status}`);
    }

    return response.json();
}

/**
 * 역할: 뉴스 이벤트와 게임 콘텐츠 일정을 모두 조회해 달력 표시용 배열로 합친다.
 * 파라미터 설명: 없음
 * 반환값 설명: FullCalendar 이벤트 배열 Promise
 */
export async function fetchLostArkCalendarEvents() {
    const [events, gameContents] = await Promise.all([
        fetchLostArkEvents(),
        fetchLostArkGameContents(),
    ]);

    // 공지 이벤트 가공 시작
    const newsEvents = events
        .filter((event) => isOngoingEvent(event.StartDate, event.EndDate))
        .map((event) => mapLostArkEventToCalendarEvent(event));
    // 공지 이벤트 가공 끝

    // 게임 콘텐츠 일정 가공 시작
    const contentEvents = dedupeGameContentEvents(
        gameContents.flatMap((content) => mapLostArkGameContentToCalendarEvents(content)),
    );
    // 게임 콘텐츠 일정 가공 끝

    return [...newsEvents, ...contentEvents];
}
