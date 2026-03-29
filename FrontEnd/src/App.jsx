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
import { ChaosGateIcon, FieldBossIcon } from "./components/LostArkContentIcons";
import { Checkbox } from "./components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./components/ui/select";
import { currentLanguage, getCalendarLocale, t } from "./i18n";
import { cn } from "./lib/utils";
import "./App.css";

const CALENDAR_FIRST_DAY_STORAGE_KEY = "calendar-first-day";
const CALENDAR_FIRST_DAY_OPTION_VALUES = [0, 1, 3];
const CALENDAR_CONTENT_DISPLAY_TARGETS = ["chaosGate", "fieldBoss", "adventureIsland"];

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

function toDateKey(date) {
    return date.toISOString().split("T")[0];
}

function addDays(date, days) {
    const nextDate = new Date(date);

    nextDate.setDate(nextDate.getDate() + days);

    return nextDate;
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
    const [calendarFilters, setCalendarFilters] = useState({
        targets: {},
        groups: {},
    });
    const [calendarContentDisplayOptions, setCalendarContentDisplayOptions] = useState(() =>
        getDefaultCalendarContentDisplayOptions(),
    );

    const filterOptions = buildCalendarFilterOptions(allEvents);
    const orderedFilterTargets = sortCalendarTargets(
        filterOptions.targets,
        DEFAULT_CALENDAR_DISPLAY_ORDER,
    );
    const visibleEvents = filterCalendarEvents(allEvents, calendarFilters);
    const eventDateKeys = getEventDateKeys(visibleEvents);
    const calendarDisplayOrderMap = getCalendarDisplayOrderMap(
        DEFAULT_CALENDAR_DISPLAY_ORDER,
    );

    useEffect(() => {
        let isMounted = true;

        async function loadEvents() {
            try {
                const calendarEvents = await fetchLostArkCalendarEvents();

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
    }, []);

    useEffect(() => {
        window.localStorage.setItem(CALENDAR_FIRST_DAY_STORAGE_KEY, String(calendarFirstDay));
    }, [calendarFirstDay]);

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
        const shouldShowPeriod =
            contentType !== "adventureIsland" || displayOption.period !== false;
        const visibleTitle =
            contentType === "adventureIsland" && !shouldShowPeriod
                ? getAdventureIslandTitleWithoutPeriod(baseTitle)
                : baseTitle;
        const shouldShowText = displayOption.text !== false;
        const shouldShowIcon = displayOption.icon !== false;
        const shouldShowImage =
            contentType === "adventureIsland" &&
            displayOption.image !== false &&
            Boolean(islandImageUrl);

        return (
            <span className="calendar-event-inline">
                {shouldShowText ? (
                    <span className="calendar-event-title">
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
                <div className="space-y-3">
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
                        const hasDisplayOptions = CALENDAR_CONTENT_DISPLAY_TARGETS.includes(
                            target.key,
                        );
                        const orderedTargetGroups =
                            target.key === "adventureIsland"
                                ? ["rewards", "islands"]
                                      .filter((groupKey) => targetGroups[groupKey])
                                      .map((groupKey) => [groupKey, targetGroups[groupKey]])
                                : Object.entries(targetGroups);
                        const displayOptionsContent = hasDisplayOptions ? (
                            <div
                                className={cn(
                                    "space-y-3 pl-7",
                                    isTargetEnabled ? "" : "opacity-55",
                                )}
                            >
                                <Accordion
                                    type="single"
                                    collapsible
                                    className="rounded-lg border"
                                >
                                    <AccordionItem value={`${target.key}-display-options`}>
                                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                            <span className="text-sm font-medium">
                                                {t("displayOptions.title", language)}
                                            </span>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-2 px-4">
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
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        ) : null;
                        const targetFilterGroupsContent = hasTargetGroups ? (
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
                        const groupsContent =
                            displayOptionsContent || targetFilterGroupsContent ? (
                                <div className="space-y-3">
                                    {displayOptionsContent}
                                    {targetFilterGroupsContent}
                                </div>
                            ) : null;

                        return (
                            <div
                                key={target.key}
                                className="space-y-3 border-t pt-4 first:border-t-0 first:pt-0"
                            >
                                <label className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground">
                                    <Checkbox
                                        checked={isTargetEnabled}
                                        onCheckedChange={(checked) => {
                                            updateTargetFilter(target.key, checked === true);
                                        }}
                                    />
                                    <span>{t(target.labelPath, language)}</span>
                                </label>

                                {groupsContent}
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

                <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="rounded-xl border bg-card p-3 text-card-foreground shadow-sm md:p-5">
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
                                eventDateKeys.has(toDateKey(arg.date)) ? [] : ["calendar-day-empty"]
                            }
                            eventClassNames={getCalendarEventClassNames}
                            eventContent={renderCalendarEventContent}
                            eventClick={(info) => {
                                if (!info.event.url) {
                                    return;
                                }

                                info.jsEvent.preventDefault();
                                window.open(info.event.url, "_blank", "noopener,noreferrer");
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
