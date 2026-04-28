import { getShortIslandName, getShortRewardName } from "../mappings/lostark.js";
import { getCalendarEventColors } from "../calendarEventColors.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const LOSTARK_EVENTS_ENDPOINT = createApiUrl("/api/lostark/news/events");
const LOSTARK_NOTICES_ENDPOINT = createApiUrl("/api/lostark/news/notices");
const LOSTARK_ADVENTURE_ISLANDS_ENDPOINT = createApiUrl("/api/lostark/adventure-islands");
const LOSTARK_CALENDAR_SCHEDULES_ENDPOINT = createApiUrl("/api/lostark/calendar/schedules");
const LOSTARK_SHARED_REQUEST_CACHE = {
    events: {
        data: null,
    promise: null,
    },
    notices: {
        data: null,
        promise: null,
    },
};
const LOSTARK_ADVENTURE_ISLAND_REQUEST_CACHE = new Map();
const LOSTARK_CALENDAR_SCHEDULE_REQUEST_CACHE = new Map();
const FIXED_GAME_CONTENT_SCHEDULES = {
    chaosGate: [1, 4, 6, 0],
    fieldBoss: [2, 5, 0],
};
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
    {
        key: "oceanCoinChest",
        sourceNames: [
            "대양의 주화 상자",
            "대륙의 주화 상자",
            "대양의 주화",
            "해적 주화",
            "해적주화",
            "해주",
        ],
    },
    { key: "legendCardPackIv", sourceNames: ["전설 ~ 고급 카드 팩 IV"] },
];

/**
 * 20260428 khs
 * 역할: 기존 모험섬 주화 보상 표기를 화면 표시용 보상명으로 통일한다.
 * 파라미터 설명:
 * - rewardName: API 또는 DB에서 받은 보상명 문자열
 * 반환값 설명: 주화 계열은 `대양의 주화`로 통일한 보상명 문자열
 */
function normalizeAdventureIslandRewardName(rewardName = "") {
    if (
        rewardName.includes("대양") ||
        rewardName.includes("해적 주화") ||
        rewardName.includes("해적주화") ||
        rewardName.includes("주화") ||
        rewardName.includes("해주")
    ) {
        return "대양의 주화";
    }

    return rewardName;
}

/**
 * 20260421 khs
 * 역할: 환경변수의 API base URL과 API path를 하나의 요청 URL로 조합한다.
 * 파라미터 설명:
 * - path: `/api`로 시작하는 서버 API 경로 문자열
 * 반환값 설명: base URL이 있으면 절대 URL, 없으면 기존 프록시용 상대 URL 문자열
 */
function createApiUrl(path) {
    const normalizedBaseUrl = API_BASE_URL.trim().replace(/\/+$/, "");

    if (!normalizedBaseUrl) {
        return path;
    }

    return `${normalizedBaseUrl}${path}`;
}

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
        targetDate.getDate()
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
 * 역할: 주말 모험섬 구간값을 사용자 표시용 오전/오후 문자열로 변환한다.
 * 파라미터 설명:
 * - period: `weekday`, `weekendMorning`, `weekendAfternoon` 중 하나인 모험섬 구간값
 * 반환값 설명: 주말 구간이면 `오전` 또는 `오후`, 평일 구간이면 빈 문자열
 */
function getAdventureIslandPeriodLabel(period) {
    if (period === "weekendMorning") {
        return "오전";
    }

    if (period === "weekendAfternoon") {
        return "오후";
    }

    return "";
}

/**
 * 역할: 백엔드가 반환한 모험섬 period 값을 사용자 표시용 오전/오후 문자열로 변환한다.
 * 파라미터 설명:
 * - period: 백엔드 AdventureIslandPeriod 문자열
 * 반환값 설명: 주말 구간이면 `오전` 또는 `오후`, 평일이면 빈 문자열
 */
function getAdventureIslandPeriodLabelFromRecord(period) {
    return getAdventureIslandPeriodLabel(period);
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

function createDateRange(fromDate, toDate) {
    const dates = [];
    const currentDate = new Date(`${fromDate}T00:00:00`);
    const lastDate = new Date(`${toDate}T00:00:00`);

    while (currentDate <= lastDate) {
        dates.push(toLocalDateOnly(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}

function createFixedGameContentEvents(calendarMonthQuery = {}) {
    const fromDate = calendarMonthQuery.fromDate;
    const toDate = calendarMonthQuery.toDate;

    if (!fromDate || !toDate) {
        return [];
    }

    return createDateRange(fromDate, toDate).flatMap((dateText) => {
        const dayOfWeek = new Date(`${dateText}T00:00:00`).getDay();

        return Object.entries(FIXED_GAME_CONTENT_SCHEDULES)
            .filter(([, days]) => days.includes(dayOfWeek))
            .map(([contentType]) => {
                const displayType = getGameContentTypeByKey(contentType);
                const eventColors = getCalendarEventColors(contentType);

                return {
                    id: `${contentType}-${dateText}`,
                    title: displayType?.label ?? "",
                    start: dateText,
                    allDay: true,
                    ...eventColors,
                    extendedProps: {
                        contentType,
                        filterTarget: contentType,
                        categoryName: displayType?.label ?? "",
                        contentsName: displayType?.label ?? "",
                        period: null,
                        sourceStartTime: "",
                        rewardTypeKey: "",
                        rewardName: "",
                        rewardIconUrl: "",
                        contentIconUrl: "",
                    },
                };
            });
    });
}

/**
 * 역할: 공지 제목에 포함될 수 있는 날짜 표현을 제거해 표시용 제목으로 정리한다.
 * 파라미터 설명:
 * - title: notice 원본 제목 문자열
 * 반환값 설명: 날짜 표현이 제거된 notice 제목 문자열
 */
function getNoticeDisplayTitle(title = "") {
    return title
        .replace(
            /^\s*(?:(\[\s*)?\d{4}[./-]\d{1,2}[./-]\d{1,2}(\s*\])?|(\[\s*)?\d{1,2}\s*월\s*\d{1,2}\s*일(?:\s*\([^)]+\))?(\s*\])?)\s*/u,
            "",
        )
        .replace(
            /\s*(?:(\[\s*)?\d{4}[./-]\d{1,2}[./-]\d{1,2}(\s*\])?|(\[\s*)?\d{1,2}\s*월\s*\d{1,2}\s*일(?:\s*\([^)]+\))?(\s*\])?)\s*$/u,
            "",
        )
        .trim();
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
 * 역할: notice Type 값을 달력 필터에서 사용할 고정 카테고리명으로 정리한다.
 * 파라미터 설명:
 * - noticeType: notice API가 반환한 Type 문자열
 * 반환값 설명: 공지, 이벤트, 상점, 점검 중 하나의 카테고리 문자열
 */
function normalizeNoticeCategory(noticeType = "") {
    const normalizedType = normalizeContentText(noticeType);

    if (normalizedType.includes("이벤트")) {
        return "이벤트";
    }

    if (normalizedType.includes("상점")) {
        return "상점";
    }

    if (normalizedType.includes("점검")) {
        return "점검";
    }

    return "공지";
}

/**
 * 역할: 같은 종류의 API 요청이 이미 진행 중이거나 완료된 경우 기존 결과를 재사용한다.
 * 파라미터 설명:
 * - cacheKey: 요청 종류를 구분하는 캐시 키
 * - request: 실제 네트워크 요청을 수행하는 함수
 * 반환값 설명: 중복 호출이 제거된 요청 결과 Promise
 */
async function fetchWithSharedCache(cacheKey, request) {
    const cacheEntry = LOSTARK_SHARED_REQUEST_CACHE[cacheKey];

    if (cacheEntry.data) {
        return cacheEntry.data;
    }

    if (cacheEntry.promise) {
        return cacheEntry.promise;
    }

    cacheEntry.promise = request()
        .then((data) => {
            cacheEntry.data = data;
            return data;
        })
        .finally(() => {
            cacheEntry.promise = null;
        });

    return cacheEntry.promise;
}

/**
 * 역할: 같은 월 범위의 모험섬 API 요청이 이미 진행 중이거나 완료된 경우 기존 결과를 재사용한다.
 * 파라미터 설명:
 * - query: `fromDate`, `toDate`를 포함한 모험섬 조회 범위 객체
 * - request: 실제 모험섬 네트워크 요청을 수행하는 함수
 * 반환값 설명: 월 범위 기준 중복 호출이 제거된 모험섬 요청 결과 Promise
 */
async function fetchAdventureIslandsWithMonthCache(query, request) {
    const cacheKey = `${query.fromDate ?? ""}|${query.toDate ?? ""}`;
    const cacheEntry = LOSTARK_ADVENTURE_ISLAND_REQUEST_CACHE.get(cacheKey);

    if (cacheEntry?.promise) {
        return cacheEntry.promise;
    }

    const requestPromise = request()
        .finally(() => {
            LOSTARK_ADVENTURE_ISLAND_REQUEST_CACHE.delete(cacheKey);
        });

    LOSTARK_ADVENTURE_ISLAND_REQUEST_CACHE.set(cacheKey, {
        promise: requestPromise,
    });

    return requestPromise;
}

/**
 * 20260428 khs
 * 역할: 같은 연/월 일정 API 요청이 이미 진행 중이면 기존 요청을 재사용한다.
 * 파라미터 설명:
 * - query: `year`, `month`를 포함한 월별 일정 조회 조건
 * - request: 실제 월별 일정 네트워크 요청을 수행하는 함수
 * 반환값 설명: 월별 일정 API 응답 Promise
 */
async function fetchCalendarSchedulesWithMonthCache(query, request) {
    const cacheKey = `${query.year ?? ""}|${query.month ?? ""}`;
    const cacheEntry = LOSTARK_CALENDAR_SCHEDULE_REQUEST_CACHE.get(cacheKey);

    if (cacheEntry?.promise) {
        return cacheEntry.promise;
    }

    const requestPromise = request().finally(() => {
        LOSTARK_CALENDAR_SCHEDULE_REQUEST_CACHE.delete(cacheKey);
    });

    LOSTARK_CALENDAR_SCHEDULE_REQUEST_CACHE.set(cacheKey, {
        promise: requestPromise,
    });

    return requestPromise;
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
        categoryName.includes(bracketIslandKeyword) || contentsName.includes(bracketIslandKeyword)
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
            })
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
                (sourceName) => normalizedRewardName === normalizeContentText(sourceName)
            )
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
            rewardName: normalizeAdventureIslandRewardName(getShortRewardName(rewardItem.Name)),
            rewardIconUrl: rewardItem.Icon ?? "",
        };
    }

    return {
        rewardTypeKey: "",
        rewardName: "",
        rewardIconUrl: "",
    };
}

/**
 * 역할: 게임 콘텐츠 응답에서 표시용 아이콘 URL을 추출한다.
 * 파라미터 설명:
 * - content: 로스트아크 게임 콘텐츠 원본 데이터
 * 반환값 설명: 표시용 콘텐츠 아이콘 URL 또는 빈 문자열
 */
function getGameContentIconUrl(content) {
    /*
     * 확인한 필드 기준:
     * - /gamecontents/calendar 응답 최상위의 ContentsIcon
     * - 최상위 Icon
     * - 최상위 Image
     * 실제 조회 샘플에서는 ContentsIcon이 존재했고 Icon, Image는 비어 있었다.
     */
    return content.ContentsIcon ?? content.Icon ?? content.Image ?? "";
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

    // 20260330 khs
    // 제목 조합 시작: 주말 모험섬은 오전/오후를 가장 앞에 붙이고, 뒤에 섬 이름과 주요 보상을 연결한다.
    const periodLabel = getAdventureIslandPeriodLabel(getAdventureIslandPeriod(startTime));
    const periodText = periodLabel ? `[${periodLabel}] ` : "";

    return `${periodText}${getShortIslandName(content.ContentsName)}`;
    // 20260330 khs
    // 제목 조합 끝
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
/**
 * 역할: notice API 응답을 달력 이벤트 형식으로 변환한다.
 * 파라미터 설명:
 * - notice: 백엔드 notice API가 반환한 공지 데이터
 * 반환값 설명: FullCalendar에서 사용할 notice 이벤트 객체
 */
export function mapLostArkNoticeToCalendarEvent(notice) {
    const noticeDate = toDateOnly(notice.Date);
    const noticeType = notice.Type?.trim() ?? "";
    const noticeCategory = normalizeNoticeCategory(noticeType);
    const eventColors = getCalendarEventColors("notice");
    const displayTitle = getNoticeDisplayTitle(notice.Title);
    const title = noticeType ? `[${noticeType}] ${displayTitle}` : displayTitle;

    return {
        id: `notice-${notice.Date}-${notice.Link}`,
        title,
        start: noticeDate,
        allDay: true,
        url: notice.Link,
        ...eventColors,
        extendedProps: {
            filterTarget: "notice",
            noticeType,
            noticeCategory,
            noticeDate: notice.Date,
            link: notice.Link,
            rawTitle: notice.Title,
        },
    };
}

/**
 * 역할: 백엔드 DB 기준 모험섬 응답을 FullCalendar 이벤트 형식으로 변환한다.
 * 파라미터 설명:
 * - adventureIsland: 백엔드 모험섬 조회 API가 반환한 단일 모험섬 데이터
 * 반환값 설명: FullCalendar에서 사용할 모험섬 이벤트 객체
 */
export function mapAdventureIslandRecordToCalendarEvent(adventureIsland) {
    const periodLabel = getAdventureIslandPeriodLabelFromRecord(adventureIsland.period);
    const periodText = periodLabel ? `[${periodLabel}] ` : "";
    const rewardType = getAdventureIslandMajorRewardType(adventureIsland.rewardName ?? "");
    const rewardName = normalizeAdventureIslandRewardName(
        adventureIsland.rewardShortName ?? adventureIsland.rewardName ?? "",
    );
    const eventColors = getCalendarEventColors("adventureIsland", rewardType?.key ?? "");

    return {
        id: `adventure-island-${adventureIsland.lostArkDate}-${adventureIsland.period}-${adventureIsland.contentsName}`,
        title: `${periodText}${adventureIsland.shortName ?? adventureIsland.contentsName}`,
        start: adventureIsland.lostArkDate,
        allDay: true,
        ...eventColors,
        extendedProps: {
            categoryName: adventureIsland.categoryName,
            contentsName: adventureIsland.contentsName,
            contentType: "adventureIsland",
            period: adventureIsland.period,
            sourceStartTime: adventureIsland.startTime,
            filterTarget: "adventureIsland",
            islandName: adventureIsland.contentsName,
            rewardTypeKey: rewardType?.key ?? "",
            rewardName,
            rewardIconUrl: adventureIsland.rewardIconUrl ?? "",
            contentIconUrl:
                adventureIsland.contentImageUrl ?? adventureIsland.contentIconUrl ?? "",
        },
    };
}

/**
 * 20260428 khs
 * 역할: 백엔드 월별 일정 API 응답을 기존 FullCalendar 표시 구조로 변환한다.
 * 파라미터 설명:
 * - schedule: 월별 일정 API가 반환한 단일 일정 데이터
 * 반환값 설명: FullCalendar에서 사용할 이벤트 객체
 */
export function mapLostArkScheduleToCalendarEvent(schedule) {
    const display = schedule.display ?? {};
    const contentType = schedule.type === "patchNote" ? "notice" : schedule.type;
    const normalizedDisplay =
        contentType === "adventureIsland"
            ? {
                  ...display,
                  rewardName: normalizeAdventureIslandRewardName(display.rewardName ?? ""),
              }
            : display;
    const rewardType = getAdventureIslandMajorRewardType(normalizedDisplay.rewardName ?? "");
    const eventColors = getCalendarEventColors(contentType, rewardType?.key ?? "");
    const start = schedule.startDate ?? schedule.scheduleDate;
    const end = schedule.endDate ? addOneDay(schedule.endDate) : undefined;

    return {
        id: schedule.id,
        title: schedule.title,
        start,
        end,
        allDay: true,
        url: schedule.source?.sourceUrl,
        ...eventColors,
        extendedProps: {
            ...normalizedDisplay,
            contentType: normalizedDisplay.contentType ?? contentType,
            filterTarget: normalizedDisplay.filterTarget ?? contentType,
            rewardTypeKey: rewardType?.key ?? display.rewardTypeKey ?? "",
            scheduleType: schedule.type,
            scheduleDate: schedule.scheduleDate,
            displayTime: schedule.displayTime,
            description: schedule.description,
            source: schedule.source,
            sortOrder: schedule.sortOrder,
        },
    };
}

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
            adventureIslandReward.rewardTypeKey
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
                islandName: displayType.key === "adventureIsland" ? content.ContentsName : "",
                rewardTypeKey: adventureIslandReward.rewardTypeKey,
                rewardName: adventureIslandReward.rewardName,
                rewardIconUrl: adventureIslandReward.rewardIconUrl,
                contentIconUrl: getGameContentIconUrl(content),
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
function _dedupeGameContentEvents(events) {
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
        group.slice(0, 3)
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
 * 역할: 이벤트 API 실패가 전체 달력 로딩을 막지 않도록 빈 배열로 보정한다.
 * 파라미터 설명: 없음
 * 반환값 설명: 이벤트 원본 배열 Promise
 */
async function fetchLostArkEventsSafely() {
    try {
        return await fetchWithSharedCache("events", fetchLostArkEvents);
    } catch (error) {
        console.error("Failed to fetch Lost Ark events.", error);
        return [];
    }
}

/**
 * 역할: 게임 콘텐츠 일정 목록을 서버 엔드포인트에서 조회한다.
 * 파라미터 설명: 없음
 * 반환값 설명: 게임 콘텐츠 원본 배열 Promise
 */
/**
 * 역할: notice 목록을 백엔드 notice API에서 조회한다.
 * 파라미터 설명: 없음
 * 반환값 설명: notice 원본 배열 Promise
 */
async function fetchLostArkNotices() {
    const response = await fetch(LOSTARK_NOTICES_ENDPOINT, {
        headers: {
            accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch Lost Ark notices: ${response.status}`);
    }

    return response.json();
}

/**
 * 역할: notice API 실패가 기존 달력 데이터 로딩을 막지 않도록 빈 배열로 보정한다.
 * 파라미터 설명: 없음
 * 반환값 설명: notice 원본 배열 Promise
 */
async function fetchLostArkNoticesSafely() {
    try {
        return await fetchWithSharedCache("notices", fetchLostArkNotices);
    } catch (error) {
        console.error("Failed to fetch Lost Ark notices.", error);
        return [];
    }
}

/**
 * 역할: 모험섬 정보를 백엔드 DB 우선 API에서 조회한다.
 * 파라미터 설명: 없음
 * 반환값 설명: 모험섬 원본 배열 Promise
 */
async function fetchAdventureIslands(query = {}) {
    return fetchAdventureIslandsWithMonthCache(query, async () => {
        const searchParams = new URLSearchParams();

        if (query.fromDate) {
            searchParams.set("fromDate", query.fromDate);
        }

        if (query.toDate) {
            searchParams.set("toDate", query.toDate);
        }

        const requestUrl = searchParams.size
            ? `${LOSTARK_ADVENTURE_ISLANDS_ENDPOINT}?${searchParams.toString()}`
            : LOSTARK_ADVENTURE_ISLANDS_ENDPOINT;
        const response = await fetch(requestUrl, {
            headers: {
                accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch adventure islands: ${response.status}`);
        }

        return response.json();
    });
}

/**
 * 20260428 khs
 * 역할: 백엔드 월별 일정 API에서 달력 표시용 통합 일정 목록을 조회한다.
 * 파라미터 설명:
 * - query: `year`, `month`를 포함한 조회 조건
 * 반환값 설명: 월별 일정 원본 배열 Promise
 */
async function fetchLostArkCalendarSchedules(query) {
    return fetchCalendarSchedulesWithMonthCache(query, async () => {
        const searchParams = new URLSearchParams({
            year: String(query.year),
            month: String(query.month),
        });
        const response = await fetch(
            `${LOSTARK_CALENDAR_SCHEDULES_ENDPOINT}?${searchParams.toString()}`,
            {
                headers: {
                    accept: "application/json",
                },
            },
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch Lost Ark calendar schedules: ${response.status}`);
        }

        return response.json();
    });
}

/**
 * 20260428 khs
 * 역할: 기존 월 범위 객체에서 월별 일정 API 조회에 필요한 연/월 값을 계산한다.
 * 파라미터 설명:
 * - calendarMonthQuery: `fromDate`를 포함한 현재 달력 월 범위 객체
 * 반환값 설명: `year`, `month`를 포함한 월별 일정 조회 조건 또는 null
 */
function getCalendarScheduleMonthQuery(calendarMonthQuery = {}) {
    if (!calendarMonthQuery.fromDate) {
        return null;
    }

    const [year, month] = calendarMonthQuery.fromDate.split("-").map(Number);

    if (!year || !month) {
        return null;
    }

    return {
        year,
        month,
    };
}


/**
 * 역할: 게임 콘텐츠 API 실패가 전체 달력 로딩을 막지 않도록 빈 배열로 보정한다.
 * 파라미터 설명: 없음
 * 반환값 설명: 게임 콘텐츠 원본 배열 Promise
 */

/**
 * 역할: 뉴스 이벤트와 게임 콘텐츠 일정을 모두 조회해 달력 표시용 배열로 합친다.
 * 파라미터 설명: 없음
 * 반환값 설명: FullCalendar 이벤트 배열 Promise
 */
export async function fetchLostArkCalendarEvents(options = {}) {
    const calendarScheduleMonthQuery = getCalendarScheduleMonthQuery(
        options.calendarMonthQuery,
    );

    if (calendarScheduleMonthQuery) {
        try {
            const schedules = await fetchLostArkCalendarSchedules(calendarScheduleMonthQuery);

            return schedules.map((schedule) => mapLostArkScheduleToCalendarEvent(schedule));
        } catch (error) {
            console.error("Failed to fetch Lost Ark calendar schedules.", error);
        }
    }

    const [events, notices, adventureIslands] = await Promise.all([
        fetchLostArkEventsSafely(),
        fetchLostArkNoticesSafely(),
        fetchAdventureIslands(options.adventureIslandQuery),
    ]);

    // 공지 이벤트 가공 시작
    const newsEvents = events
        .filter((event) => isOngoingEvent(event.StartDate, event.EndDate))
        .map((event) => mapLostArkEventToCalendarEvent(event));
    // 공지 이벤트 가공 끝

    // 게임 콘텐츠 일정 가공 시작
    const noticeEvents = notices.map((notice) => mapLostArkNoticeToCalendarEvent(notice));
    const adventureIslandEvents = adventureIslands.map((adventureIsland) =>
        mapAdventureIslandRecordToCalendarEvent(adventureIsland)
    );
    const contentEvents = createFixedGameContentEvents(options.calendarMonthQuery);
    // 게임 콘텐츠 일정 가공 끝

    return [...newsEvents, ...noticeEvents, ...adventureIslandEvents, ...contentEvents];
}
