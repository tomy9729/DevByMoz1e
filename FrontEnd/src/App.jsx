import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { fetchLostArkCalendarEvents } from "./api/lostark";
import {
    buildCalendarFilterOptions,
    filterCalendarEvents,
    mergeCalendarFilterState,
} from "./calendarFilters";
import {
    DEFAULT_CALENDAR_DISPLAY_ORDER,
    getCalendarDisplayOrderMap,
    sortCalendarTargets,
} from "./calendarDisplayOrder";
import CalendarRemote from "./components/CalendarRemote";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "./components/ui/accordion";
import { Button } from "./components/ui/button";
import { ChaosGateIcon, FieldBossIcon } from "./components/LostArkContentIcons";
import { Checkbox } from "./components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./components/ui/select";
import { currentLanguage, getCalendarLocale, t } from "./i18n";
import { cn } from "./lib/utils";
import { Settings2 } from "lucide-react";
import "./App.css";

const CALENDAR_FIRST_DAY_STORAGE_KEY = "calendar-first-day";
const CALENDAR_TODAY_FOCUS_STORAGE_KEY = "calendar-today-focus-enabled";
const CALENDAR_FIRST_DAY_OPTION_VALUES = [0, 1, 3];
const CALENDAR_CONTENT_DISPLAY_TARGETS = ["chaosGate", "fieldBoss", "adventureIsland"];

function getDefaultCalendarEventDisplayOptions() {
    return {
        boundaryOnly: false,
    };
}

function getDefaultCalendarContentDisplayOptions() {
    return Object.fromEntries(
        CALENDAR_CONTENT_DISPLAY_TARGETS.map((targetKey) => [
            targetKey,
            {
                text: true,
                icon: true,
                image: targetKey === "adventureIsland",
                period: targetKey === "adventureIsland",
            },
        ]),
    );
}

function getStoredCalendarFirstDay() {
    const storedValue = window.localStorage.getItem(CALENDAR_FIRST_DAY_STORAGE_KEY);
    const parsedValue = Number(storedValue);
    const isValidOption = CALENDAR_FIRST_DAY_OPTION_VALUES.includes(parsedValue);

    return isValidOption ? parsedValue : 0;
}

/**
 * 20260414 khs
 * 역할: 오늘 날짜 focus 강조 표시 설정값을 localStorage에서 읽어 boolean으로 정규화한다.
 * 파라미터 설명: 없음
 * 반환값 설명: 저장값이 없거나 "true"이면 true, "false"이면 false
 */
function getStoredCalendarTodayFocusEnabled() {
    const storedValue = window.localStorage.getItem(CALENDAR_TODAY_FOCUS_STORAGE_KEY);

    if (storedValue === null) {
        return true;
    }

    return storedValue === "true";
}

function toDateKey(date) {
    return date.toISOString().split("T")[0];
}

function addDays(date, days) {
    const nextDate = new Date(date);

    nextDate.setDate(nextDate.getDate() + days);

    return nextDate;
}

function getCalendarMonthRange(baseDate = new Date()) {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    return {
        fromDate: toDateKey(startDate),
        toDate: toDateKey(endDate),
    };
}

/**
 * 역할: 현재 보고 있는 월의 시작일과 종료일을 API 조회용 문자열로 계산한다.
 * 파라미터 설명:
 * - baseDate: 현재 달력을 대표하는 기준 날짜 객체
 * 반환값 설명: `fromDate`, `toDate`를 포함한 월 범위 객체
 */
function getMonthRange(baseDate = new Date()) {
    const currentMonthRange = getCalendarMonthRange(baseDate);
    const startDate = addDays(new Date(`${currentMonthRange.fromDate}T00:00:00`), -7);
    const endDate = addDays(new Date(`${currentMonthRange.toDate}T00:00:00`), 7);

    return {
        fromDate: toDateKey(startDate),
        toDate: toDateKey(endDate),
    };
}

/**
 * 역할: 월 범위 상태가 실제로 바뀌는 경우에만 갱신되도록 두 범위를 비교한다.
 * 파라미터 설명:
 * - previousRange: 현재 저장된 월 범위 객체
 * - nextRange: 새로 계산한 월 범위 객체
 * 반환값 설명: 시작일과 종료일이 모두 같으면 true, 다르면 false
 */
function isSameMonthRange(previousRange, nextRange) {
    return (
        previousRange?.fromDate === nextRange?.fromDate &&
        previousRange?.toDate === nextRange?.toDate
    );
}

/**
 * 역할: 이벤트 표시 옵션에 따라 장기 이벤트를 시작일과 종료일 일정으로만 다시 구성한다.
 * 파라미터 설명:
 * - events: 필터 적용 후 FullCalendar에 전달할 이벤트 배열
 * - eventDisplayOptions: 이벤트 표시 옵션 상태 객체
 * 반환값 설명: 시작일/종료일 표시 규칙이 반영된 이벤트 배열
 */
function getVisibleCalendarEvents(events, eventDisplayOptions) {
    if (!eventDisplayOptions.boundaryOnly) {
        return events;
    }

    return events.flatMap((event) => {
        const filterTarget = event.extendedProps?.filterTarget ?? event.extendedProps?.contentType;

        if (filterTarget !== "event") {
            return [event];
        }

        if (!event.start) {
            return [event];
        }

        const startDateText = event.start;
        const endDateText = event.end
            ? toDateKey(addDays(new Date(`${event.end}T00:00:00`), -1))
            : startDateText;

        if (startDateText === endDateText) {
            return [
                {
                    ...event,
                    end: undefined,
                },
            ];
        }

        return [
            {
                ...event,
                id: `${event.id}-start`,
                start: startDateText,
                end: undefined,
                extendedProps: {
                    ...event.extendedProps,
                    eventBoundaryType: "start",
                },
            },
            {
                ...event,
                id: `${event.id}-end`,
                start: endDateText,
                end: undefined,
                extendedProps: {
                    ...event.extendedProps,
                    eventBoundaryType: "end",
                },
            },
        ];
    });
}

function getEventDateKeys(events) {
    const dateKeys = new Set();

    events.forEach((event) => {
        if (!event.start) {
            return;
        }

        const startDate = new Date(`${event.start}T00:00:00`);
        const endDate = event.end ? new Date(`${event.end}T00:00:00`) : addDays(startDate, 1);

        for (
            let currentDate = new Date(startDate);
            currentDate < endDate;
            currentDate = addDays(currentDate, 1)
        ) {
            dateKeys.add(toDateKey(currentDate));
        }
    });

    return dateKeys;
}

/**
 * 역할: 이벤트 제목에서 보상 괄호 텍스트를 제거한 기본 제목을 반환한다.
 * 파라미터 설명:
 * - title: FullCalendar 이벤트 제목 문자열
 * 반환값 설명: 보상 괄호가 제거된 제목 문자열
 */
function getCalendarEventBaseTitle(title = "") {
    return title.replace(/\s+\([^)]+\)$/, "");
}

/**
 * 역할: 이벤트 경계일 표시 여부에 따라 제목 앞에 시작/끝 접두어를 붙인다.
 * 파라미터 설명:
 * - event: FullCalendar 이벤트 객체
 * - baseTitle: 접두어를 붙이기 전 기본 제목 문자열
 * 반환값 설명: 시작/끝 표시가 반영된 이벤트 제목 문자열
 */
function getCalendarEventDisplayTitle(event, baseTitle) {
    const eventBoundaryType = event.extendedProps?.eventBoundaryType;

    if (eventBoundaryType === "start") {
        return `[시작] ${baseTitle}`;
    }

    if (eventBoundaryType === "end") {
        return `[끝] ${baseTitle}`;
    }

    return baseTitle;
}

/**
 * 역할: 보상 아이콘 URL 값을 배열 형태로 정규화한다.
 * 파라미터 설명:
 * - rewardIconUrl: 문자열 또는 배열 형태의 보상 아이콘 URL
 * 반환값 설명: 비어 있지 않은 보상 아이콘 URL 배열
 */
function getCalendarEventRewardIconUrls(rewardIconUrl) {
    if (Array.isArray(rewardIconUrl)) {
        return rewardIconUrl.filter(Boolean);
    }

    return rewardIconUrl ? [rewardIconUrl] : [];
}

/**
 * 역할: 콘텐츠 타입에 맞는 자체 제작 아이콘 컴포넌트를 반환한다.
 * 파라미터 설명:
 * - contentType: 현재 이벤트의 콘텐츠 타입 문자열
 * 반환값 설명: 콘텐츠 타입에 맞는 아이콘 컴포넌트 또는 null
 */
function getCalendarContentIconComponent(contentType = "") {
    if (contentType === "chaosGate") {
        return ChaosGateIcon;
    }

    if (contentType === "fieldBoss") {
        return FieldBossIcon;
    }

    return null;
}

/**
 * 역할: 이벤트가 하루 일정인지 판별한다.
 * 파라미터 설명:
 * - event: FullCalendar 이벤트 객체
 * 반환값 설명: 하루 일정이면 true, 아니면 false
 */
function isSingleDayCalendarEvent(event) {
    if (!event.start) {
        return false;
    }

    if (!event.end) {
        return true;
    }

    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    return event.end.getTime() - event.start.getTime() <= millisecondsPerDay;
}

/**
 * 역할: 콘텐츠 타입별 글자/아이콘 표시 옵션을 반환한다.
 * 파라미터 설명:
 * - displayOptions: 콘텐츠 타입별 표시 옵션 상태 객체
 * - targetKey: 조회할 콘텐츠 타입 키
 * 반환값 설명: 글자/아이콘 표시 여부 객체
 */
function getCalendarContentDisplayOption(displayOptions, targetKey) {
    return (
        displayOptions?.[targetKey] ?? {
            text: true,
            icon: true,
            image: targetKey === "adventureIsland",
            period: targetKey === "adventureIsland",
        }
    );
}

/**
 * 역할: 모험섬 제목에서 주말 오전/오후 접두어를 제거한 표시용 제목을 반환한다.
 * 파라미터 설명:
 * - title: 현재 달력에 저장된 모험섬 제목 문자열
 * 반환값 설명: 오전/오후 접두어가 제거된 모험섬 제목 문자열
 */
function getAdventureIslandTitleWithoutPeriod(title = "") {
    return title.replace(/^\[(오전|오후)\]\s*/, "");
}

/**
 * 역할: 공지류 아이템 hover 시 표시할 전체 제목 툴팁 문자열을 반환한다.
 * 파라미터 설명:
 * - event: FullCalendar 이벤트 객체
 * 반환값 설명: 공지류면 전체 제목 문자열, 아니면 undefined
 */
function getCalendarEventTooltipTitle(event) {
    const contentType = event.extendedProps?.contentType ?? event.extendedProps?.filterTarget;

    if (contentType === "notice") {
        return event.title;
    }

    if (event.extendedProps?.eventBoundaryType) {
        return event.title;
    }

    return undefined;
}

/**
 * 역할: 클릭되거나 포커스된 달력 이벤트 요소의 selected 상태가 남지 않도록 포커스를 해제한다.
 * 파라미터 설명:
 * - target: 클릭 이벤트에서 전달된 DOM 대상
 * 반환값 설명: 없음
 */
function clearCalendarEventSelection(target) {
    if (target instanceof HTMLElement) {
        target.blur();
        target.closest(".fc-daygrid-event")?.blur();
    }

    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
}

/**
 * 20260414 khs
 * 역할: 달력 셀의 데이터 유무와 오늘 날짜 focus 설정에 따라 추가 클래스명을 계산한다.
 * 파라미터 설명:
 * - dayCellInfo: FullCalendar가 전달하는 day cell 정보 객체
 * - hasEvents: 현재 날짜에 표시할 이벤트 존재 여부
 * - isTodayFocusEnabled: 오늘 날짜 focus 강조 표시 on/off 상태
 * 반환값 설명: FullCalendar day cell에 적용할 클래스명 배열
 */
function getCalendarDayCellClassNames(dayCellInfo, hasEvents, isTodayFocusEnabled) {
    const classNames = hasEvents ? [] : ["calendar-day-empty"];

    if (dayCellInfo.isToday && isTodayFocusEnabled) {
        classNames.push("calendar-day-today-focus");
    }

    return classNames;
}

function App() {
    const language = currentLanguage;
    const calendarFirstDayOptions = [
        {
            value: 0,
            label: t("calendar.firstDayOptions.sunday", language),
        },
        {
            value: 1,
            label: t("calendar.firstDayOptions.monday", language),
        },
        {
            value: 3,
            label: t("calendar.firstDayOptions.wednesday", language),
        },
    ];
    const [allEvents, setAllEvents] = useState([]);
    const [calendarFirstDay, setCalendarFirstDay] = useState(() => getStoredCalendarFirstDay());
    const [isCalendarTodayFocusEnabled, setIsCalendarTodayFocusEnabled] = useState(() =>
        getStoredCalendarTodayFocusEnabled(),
    );
    const [calendarFilters, setCalendarFilters] = useState({
        targets: {},
        groups: {},
    });
    const [visibleMonthRange, setVisibleMonthRange] = useState(() => getMonthRange());
    const [calendarMonthRange, setCalendarMonthRange] = useState(() =>
        getCalendarMonthRange(),
    );
    const [calendarEventDisplayOptions, setCalendarEventDisplayOptions] = useState(() =>
        getDefaultCalendarEventDisplayOptions(),
    );
    const [calendarContentDisplayOptions, setCalendarContentDisplayOptions] = useState(() =>
        getDefaultCalendarContentDisplayOptions(),
    );

    const filterOptions = buildCalendarFilterOptions(allEvents);
    const orderedFilterTargets = sortCalendarTargets(
        filterOptions.targets,
        DEFAULT_CALENDAR_DISPLAY_ORDER,
    );
    const visibleEvents = getVisibleCalendarEvents(
        filterCalendarEvents(allEvents, calendarFilters),
        calendarEventDisplayOptions,
    );
    const eventDateKeys = getEventDateKeys(visibleEvents);
    const calendarDisplayOrderMap = getCalendarDisplayOrderMap(
        DEFAULT_CALENDAR_DISPLAY_ORDER,
    );

    useEffect(() => {
        let isMounted = true;

        async function loadEvents() {
            try {
                const calendarEvents = await fetchLostArkCalendarEvents({
                    adventureIslandQuery: visibleMonthRange,
                    calendarMonthQuery: calendarMonthRange,
                });

                if (isMounted) {
                    setAllEvents(calendarEvents);
                    setCalendarFilters((previousFilters) =>
                        mergeCalendarFilterState(
                            previousFilters,
                            buildCalendarFilterOptions(calendarEvents),
                        ),
                    );
                }
            } catch (error) {
                console.error("Failed to load Lost Ark events.", error);
            }
        }

        loadEvents();

        return () => {
            isMounted = false;
        };
    }, [visibleMonthRange, calendarMonthRange]);

    useEffect(() => {
        window.localStorage.setItem(CALENDAR_FIRST_DAY_STORAGE_KEY, String(calendarFirstDay));
    }, [calendarFirstDay]);

    useEffect(() => {
        window.localStorage.setItem(
            CALENDAR_TODAY_FOCUS_STORAGE_KEY,
            String(isCalendarTodayFocusEnabled),
        );
    }, [isCalendarTodayFocusEnabled]);

    useEffect(() => {
        /**
         * 역할: 외부 링크 이동 후 페이지로 복귀했을 때 남아 있을 수 있는 달력 이벤트 포커스를 정리한다.
         * 파라미터 설명: 없음
         * 반환값 설명: 없음
         */
        function handleWindowRestore() {
            clearCalendarEventSelection(document.activeElement);
        }

        window.addEventListener("pageshow", handleWindowRestore);
        window.addEventListener("focus", handleWindowRestore);

        return () => {
            window.removeEventListener("pageshow", handleWindowRestore);
            window.removeEventListener("focus", handleWindowRestore);
        };
    }, []);

    function updateTargetFilter(targetKey, checked) {
        setCalendarFilters((previousFilters) => ({
            ...previousFilters,
            targets: {
                ...previousFilters.targets,
                [targetKey]: checked,
            },
        }));
    }

    function updateGroupFilter(targetKey, groupKey, value, checked) {
        setCalendarFilters((previousFilters) => ({
            ...previousFilters,
            groups: {
                ...previousFilters.groups,
                [targetKey]: {
                    ...previousFilters.groups[targetKey],
                    [groupKey]: {
                        ...previousFilters.groups[targetKey]?.[groupKey],
                        [value]: checked,
                    },
                },
            },
        }));
    }

    /**
     * 역할: 특정 그룹의 모든 체크박스 상태를 한 번에 선택 또는 해제한다.
     * 파라미터 설명:
     * - targetKey: 일괄 변경할 대상 키
     * - groupKey: 일괄 변경할 그룹 키
     * - checked: 전체 선택 또는 전체 해제 여부
     * 반환값 설명: 없음
     */
    function updateAllGroupFilters(targetKey, groupKey, checked) {
        const groupOptions = filterOptions.groups?.[targetKey]?.[groupKey]?.options ?? [];

        setCalendarFilters((previousFilters) => ({
            ...previousFilters,
            groups: {
                ...previousFilters.groups,
                [targetKey]: {
                    ...previousFilters.groups[targetKey],
                    [groupKey]: Object.fromEntries(
                        groupOptions.map((option) => [option.value, checked]),
                    ),
                },
            },
        }));
    }

    /**
     * 역할: 콘텐츠 타입별 글자/아이콘 표시 옵션 상태를 갱신한다.
     * 파라미터 설명:
     * - targetKey: 설정을 변경할 콘텐츠 타입 키
     * - optionKey: 변경할 옵션 키
     * - checked: 적용할 표시 여부
     * 반환값 설명: 없음
     */
    function updateContentDisplayOption(targetKey, optionKey, checked) {
        setCalendarContentDisplayOptions((previousOptions) => ({
            ...previousOptions,
            [targetKey]: {
                ...previousOptions[targetKey],
                [optionKey]: checked,
            },
        }));
    }

    /**
     * 역할: 이벤트 기간 표시 옵션 상태를 갱신한다.
     * 파라미터 설명:
     * - optionKey: 변경할 이벤트 표시 옵션 키
     * - checked: 옵션 적용 여부
     * 반환값 설명: 없음
     */
    function updateEventDisplayOption(optionKey, checked) {
        setCalendarEventDisplayOptions((previousOptions) => ({
            ...previousOptions,
            [optionKey]: checked,
        }));
    }

    /**
     * 역할: 하루 일정 여부에 따라 이벤트 표시 클래스를 부여한다.
     * 파라미터 설명:
     * - eventClassInfo: FullCalendar가 전달하는 이벤트 클래스 계산 정보 객체
     * 반환값 설명: 하루 일정이면 overflow 제한용 클래스 배열, 아니면 빈 배열
     */
    function getCalendarEventClassNames(eventClassInfo) {
        return isSingleDayCalendarEvent(eventClassInfo.event) ? ["calendar-event-single-day"] : [];
    }

    /**
     * 역할: FullCalendar 이벤트를 현재 UI 규칙에 맞는 내용으로 렌더링한다.
     * 파라미터 설명:
     * - eventInfo: FullCalendar가 전달하는 이벤트 렌더링 정보 객체
     * 반환값 설명: 이벤트 셀에 표시할 JSX
     */
    function renderCalendarEventContent(eventInfo) {
        const { event } = eventInfo;
        const contentType = event.extendedProps?.contentType ?? event.extendedProps?.filterTarget;
        const ContentIconComponent = getCalendarContentIconComponent(contentType);
        const displayOption = getCalendarContentDisplayOption(
            calendarContentDisplayOptions,
            contentType,
        );
        const rewardIconUrls = getCalendarEventRewardIconUrls(
            event.extendedProps?.rewardIconUrl ?? "",
        );
        const islandImageUrl = event.extendedProps?.contentIconUrl ?? "";
        const rewardName = event.extendedProps?.rewardName ?? "";
        const baseTitle = getCalendarEventBaseTitle(event.title);
        const tooltipTitle = getCalendarEventTooltipTitle(event);
        const eventDisplayTitle = getCalendarEventDisplayTitle(event, baseTitle);
        const shouldShowPeriod =
            contentType !== "adventureIsland" || displayOption.period !== false;
        const visibleTitle =
            contentType === "adventureIsland" && !shouldShowPeriod
                ? getAdventureIslandTitleWithoutPeriod(eventDisplayTitle)
                : eventDisplayTitle;
        const shouldShowText = displayOption.text !== false;
        const shouldShowIcon = displayOption.icon !== false;
        const shouldShowImage =
            contentType === "adventureIsland" &&
            displayOption.image !== false &&
            Boolean(islandImageUrl);

        return (
            <span className="calendar-event-inline">
                {shouldShowText ? (
                    <span className="calendar-event-title" title={tooltipTitle}>
                        {contentType === "adventureIsland" ? visibleTitle : event.title}
                    </span>
                ) : null}
                {shouldShowImage ? (
                    <img
                        className="calendar-event-island-image"
                        src={islandImageUrl}
                        alt={baseTitle}
                        title={baseTitle}
                    />
                ) : null}
                {shouldShowIcon && rewardIconUrls.length > 0 ? (
                    <span className="calendar-event-reward-icons">
                        {rewardIconUrls.map((iconUrl) => (
                            <img
                                key={iconUrl}
                                className="calendar-event-reward-icon"
                                src={iconUrl}
                                alt={rewardName}
                                title={rewardName}
                            />
                        ))}
                    </span>
                ) : shouldShowIcon && ContentIconComponent ? (
                    <span className="calendar-event-reward-icons">
                        <ContentIconComponent className="calendar-event-content-icon" />
                    </span>
                ) : null}
            </span>
        );
    }

    const remoteSections = [
        {
            key: "firstDay",
            title: t("remote.sections.firstDay.title", language),
            content: (
                <div className="space-y-4">
                    <label
                        className="text-sm font-medium leading-none"
                        htmlFor="calendar-first-day"
                    >
                        {t("calendar.firstDayLabel", language)}
                    </label>
                    <Select
                        value={String(calendarFirstDay)}
                        onValueChange={(value) => {
                            setCalendarFirstDay(Number(value));
                        }}
                    >
                        <SelectTrigger id="calendar-first-day">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {calendarFirstDayOptions.map((option) => (
                                <SelectItem key={option.value} value={String(option.value)}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <label className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground">
                        <Checkbox
                            checked={isCalendarTodayFocusEnabled}
                            onCheckedChange={(checked) => {
                                setIsCalendarTodayFocusEnabled(checked === true);
                            }}
                        />
                        <span>{t("calendar.todayFocusLabel", language)}</span>
                    </label>
                </div>
            ),
        },
        {
            key: "filters",
            title: t("filters.title", language),
            content: (
                <div className="space-y-4">
                    {orderedFilterTargets.map((target) => {
                        const targetGroups = filterOptions.groups[target.key] ?? {};
                        const isTargetEnabled = calendarFilters.targets[target.key] ?? true;
                        const displayOption = getCalendarContentDisplayOption(
                            calendarContentDisplayOptions,
                            target.key,
                        );
                        const hasTargetGroups = Object.keys(targetGroups).length > 0;
                        const hasEventDisplayOptions = target.key === "event";
                        const hasDisplayOptions =
                            hasEventDisplayOptions ||
                            CALENDAR_CONTENT_DISPLAY_TARGETS.includes(target.key);
                        const hasNoticeCategorySettings =
                            target.key === "notice" && Boolean(targetGroups.categories);
                        const orderedTargetGroups =
                            target.key === "adventureIsland"
                                ? ["rewards", "islands"]
                                      .filter((groupKey) => targetGroups[groupKey])
                                      .map((groupKey) => [groupKey, targetGroups[groupKey]])
                                : Object.entries(targetGroups);
                        const settingsContent =
                            hasDisplayOptions || hasNoticeCategorySettings ? (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        disabled={!isTargetEnabled}
                                        aria-label={`${t(target.labelPath, language)} ${t("displayOptions.title", language)}`}
                                    >
                                        <Settings2 className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="space-y-3">
                                    <p className="text-sm font-medium">
                                        {target.key === "notice"
                                            ? `${t(target.labelPath, language)} ${t("filters.notice.categories", language)}`
                                            : `${t(target.labelPath, language)} ${t("displayOptions.title", language)}`}
                                    </p>
                                        {target.key === "notice" ? (
                                        <div className="space-y-2">
                                            {targetGroups.categories.options.map((option) => (
                                                <label
                                                    key={`notice-category-${option.value}`}
                                                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground"
                                                >
                                                    <Checkbox
                                                        checked={
                                                            calendarFilters.groups?.notice?.categories?.[
                                                                option.value
                                                            ] ?? true
                                                        }
                                                        disabled={!isTargetEnabled}
                                                        onCheckedChange={(checked) => {
                                                            updateGroupFilter(
                                                                "notice",
                                                                "categories",
                                                                option.value,
                                                                checked === true,
                                                            );
                                                        }}
                                                    />
                                                    <span>{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    ) : hasEventDisplayOptions ? (
                                        <div className="space-y-2">
                                            <label className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground">
                                                <Checkbox
                                                    checked={calendarEventDisplayOptions.boundaryOnly}
                                                    disabled={!isTargetEnabled}
                                                    onCheckedChange={(checked) => {
                                                        updateEventDisplayOption(
                                                            "boundaryOnly",
                                                            checked === true,
                                                        );
                                                    }}
                                                />
                                                <span>시작날과 끝날만 표시</span>
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground">
                                                <Checkbox
                                                    checked={displayOption.text}
                                                    disabled={!isTargetEnabled}
                                                    onCheckedChange={(checked) => {
                                                        updateContentDisplayOption(
                                                            target.key,
                                                            "text",
                                                            checked === true,
                                                        );
                                                    }}
                                                />
                                                <span>
                                                    {t("displayOptions.options.text", language)}
                                                </span>
                                            </label>
                                            <label className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground">
                                                <Checkbox
                                                    checked={displayOption.icon}
                                                    disabled={!isTargetEnabled}
                                                    onCheckedChange={(checked) => {
                                                        updateContentDisplayOption(
                                                            target.key,
                                                            "icon",
                                                            checked === true,
                                                        );
                                                    }}
                                                />
                                                <span>
                                                    {t("displayOptions.options.icon", language)}
                                                </span>
                                            </label>
                                            {target.key === "adventureIsland" ? (
                                                <label className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground">
                                                    <Checkbox
                                                        checked={displayOption.image}
                                                        disabled={!isTargetEnabled}
                                                        onCheckedChange={(checked) => {
                                                            updateContentDisplayOption(
                                                                target.key,
                                                                "image",
                                                                checked === true,
                                                            );
                                                        }}
                                                    />
                                                    <span>
                                                        {t("displayOptions.options.image", language)}
                                                    </span>
                                                </label>
                                            ) : null}
                                            {target.key === "adventureIsland" ? (
                                                <label className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground">
                                                    <Checkbox
                                                        checked={displayOption.period}
                                                        disabled={!isTargetEnabled}
                                                        onCheckedChange={(checked) => {
                                                            updateContentDisplayOption(
                                                                target.key,
                                                                "period",
                                                                checked === true,
                                                            );
                                                        }}
                                                    />
                                                    <span>
                                                        {t("displayOptions.options.period", language)}
                                                    </span>
                                                </label>
                                            ) : null}
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        ) : null;
                        const targetFilterGroupsContent =
                            hasTargetGroups && target.key !== "notice" ? (
                            <div
                                className={cn(
                                    "space-y-3 pl-7",
                                    isTargetEnabled ? "" : "opacity-55",
                                )}
                            >
                                {orderedTargetGroups.map(([groupKey, group]) => (
                                    <Accordion
                                        key={`${target.key}-${groupKey}`}
                                        type="single"
                                        collapsible
                                        className="rounded-lg border"
                                    >
                                        <AccordionItem value={`${target.key}-${groupKey}`}>
                                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                                <span className="text-sm font-medium">
                                                    {t(group.labelPath, language)}
                                                </span>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-2 px-4">
                                                    {target.key === "adventureIsland" &&
                                                    groupKey === "islands" ? (() => {
                                                        const islandStates = group.options.map(
                                                            (option) =>
                                                                calendarFilters.groups?.[
                                                                    target.key
                                                                ]?.[groupKey]?.[option.value] ??
                                                                true,
                                                        );
                                                        const checkedCount = islandStates.filter(Boolean).length;
                                                        const allChecked =
                                                            group.options.length > 0 &&
                                                            checkedCount === group.options.length;
                                                        const someChecked =
                                                            checkedCount > 0 &&
                                                            checkedCount < group.options.length;
                                                        const selectAllState = allChecked
                                                            ? true
                                                            : someChecked
                                                              ? "indeterminate"
                                                              : false;

                                                        return (
                                                            <label className="flex w-full cursor-pointer items-center gap-2 rounded-md border-b px-2 py-2 text-sm font-medium text-foreground">
                                                                <Checkbox
                                                                    checked={selectAllState}
                                                                    disabled={!isTargetEnabled}
                                                                    onCheckedChange={(checked) => {
                                                                        updateAllGroupFilters(
                                                                            target.key,
                                                                            groupKey,
                                                                            checked === true,
                                                                        );
                                                                    }}
                                                                />
                                                                <span>
                                                                    {t("filters.adventureIsland.selectAll", language)}
                                                                </span>
                                                            </label>
                                                        );
                                                    })() : null}
                                                    {group.options.map((option) => (
                                                        <label
                                                            key={`${target.key}-${groupKey}-${option.value}`}
                                                            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground"
                                                        >
                                                            <Checkbox
                                                                checked={
                                                                    calendarFilters.groups?.[
                                                                        target.key
                                                                    ]?.[groupKey]?.[option.value] ??
                                                                    true
                                                                }
                                                                disabled={!isTargetEnabled}
                                                                onCheckedChange={(checked) => {
                                                                    updateGroupFilter(
                                                                        target.key,
                                                                        groupKey,
                                                                        option.value,
                                                                        checked === true,
                                                                    );
                                                                }}
                                                            />
                                                            <span>{option.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                ))}
                            </div>
                        ) : null;
                        return (
                            <div
                                key={target.key}
                                className="space-y-3 border-t pt-4 first:border-t-0 first:pt-0"
                            >
                                <div className="flex items-center gap-2">
                                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground">
                                        <Checkbox
                                            checked={isTargetEnabled}
                                            onCheckedChange={(checked) => {
                                                updateTargetFilter(target.key, checked === true);
                                            }}
                                        />
                                        <span>{t(target.labelPath, language)}</span>
                                    </label>
                                    {settingsContent}
                                </div>

                                {targetFilterGroupsContent}
                            </div>
                        );
                    })}
                </div>
            ),
        },
    ];

    return (
        <main className="min-h-screen bg-background px-4 py-8 md:px-8">
            <section className="mx-auto max-w-7xl space-y-6">
                <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        {t("app.eyebrow", language)}
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                        {t("app.title", language)}
                    </h1>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                        {t("app.description", language)}
                    </p>
                </div>

                <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_224px]">
                    <div
                        className={cn(
                            "rounded-xl border bg-card p-3 text-card-foreground shadow-sm md:p-5",
                            !isCalendarTodayFocusEnabled && "calendar-today-focus-disabled",
                        )}
                    >
                        <FullCalendar
                            plugins={[dayGridPlugin]}
                            initialView="dayGridMonth"
                            firstDay={calendarFirstDay}
                            locale={language}
                            locales={[getCalendarLocale(language)]}
                            headerToolbar={{
                                left: "prev,next today",
                                center: "title",
                                right: "",
                            }}
                            eventOrder={(left, right) => {
                                const leftTargetKey =
                                    left.extendedProps?.filterTarget ??
                                    left.extendedProps?.contentType;
                                const rightTargetKey =
                                    right.extendedProps?.filterTarget ??
                                    right.extendedProps?.contentType;
                                const displayOrderDifference =
                                    (calendarDisplayOrderMap[leftTargetKey] ?? 99) -
                                    (calendarDisplayOrderMap[rightTargetKey] ?? 99);

                                if (displayOrderDifference !== 0) {
                                    return displayOrderDifference;
                                }

                                return left.title.localeCompare(right.title, "ko");
                            }}
                            buttonText={{
                                today: t("calendar.buttons.today", language),
                            }}
                            dayCellClassNames={(arg) =>
                                getCalendarDayCellClassNames(
                                    arg,
                                    eventDateKeys.has(toDateKey(arg.date)),
                                    isCalendarTodayFocusEnabled,
                                )
                            }
                            eventClassNames={getCalendarEventClassNames}
                            eventContent={renderCalendarEventContent}
                            eventClick={(info) => {
                                if (!info.event.url) {
                                    return;
                                }

                                info.jsEvent.preventDefault();
                                clearCalendarEventSelection(info.jsEvent.target);
                                window.open(info.event.url, "_blank", "noopener,noreferrer");
                            }}
                            datesSet={(dateInfo) => {
                                const currentStart = dateInfo.view.currentStart ?? dateInfo.start;
                                const nextMonthRange = getMonthRange(currentStart);
                                const nextCalendarMonthRange =
                                    getCalendarMonthRange(currentStart);

                                setVisibleMonthRange((previousRange) =>
                                    isSameMonthRange(previousRange, nextMonthRange)
                                        ? previousRange
                                        : nextMonthRange,
                                );
                                setCalendarMonthRange((previousRange) =>
                                    isSameMonthRange(previousRange, nextCalendarMonthRange)
                                        ? previousRange
                                        : nextCalendarMonthRange,
                                );
                            }}
                            height="auto"
                            events={visibleEvents}
                        />
                    </div>

                    <CalendarRemote title={t("remote.title", language)} sections={remoteSections} />
                </div>
            </section>
        </main>
    );
}

export default App;
