import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { toPng } from "html-to-image";
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
import {
    getCalendarEventColors,
    getDefaultCalendarEventBackgroundColor,
} from "./calendarEventColors";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./components/ui/dialog";
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
import { ChevronDown, Download, ExternalLink, Settings2 } from "lucide-react";
import "./App.css";

const CALENDAR_FIRST_DAY_STORAGE_KEY = "calendar-first-day";
const CALENDAR_TODAY_FOCUS_STORAGE_KEY = "calendar-today-focus-enabled";
const CALENDAR_FILTERS_STORAGE_KEY = "calendar-filters";
const CALENDAR_TYPE_COLORS_STORAGE_KEY = "calendar-type-colors";
const CALENDAR_ADVENTURE_ISLAND_REWARD_COLORS_STORAGE_KEY =
    "calendar-adventure-island-reward-colors";
const CALENDAR_LOCAL_SCHEDULES_STORAGE_KEY = "calendar-local-schedules";
const CALENDAR_FIRST_DAY_OPTION_VALUES = [0, 1, 3];
const CALENDAR_CONTENT_DISPLAY_TARGETS = ["chaosGate", "fieldBoss", "adventureIsland"];
const CALENDAR_CUSTOMIZABLE_COLOR_TARGETS = DEFAULT_CALENDAR_DISPLAY_ORDER.filter(
    (targetKey) => targetKey !== "adventureIsland",
);
const CALENDAR_SCHEDULE_TYPE_OPTIONS = [
    { value: "notice", label: "공지" },
    { value: "adventureIsland", label: "모험섬" },
    { value: "fieldBoss", label: "필드보스" },
    { value: "chaosGate", label: "카오스게이트" },
    { value: "event", label: "이벤트" },
    { value: "package", label: "패키지" },
    { value: "custom", label: "커스텀 일정" },
];
const TIME_REQUIRED_SCHEDULE_TYPES = new Set(["adventureIsland", "fieldBoss", "chaosGate"]);
const DEFAULT_TYPE_SETTINGS = {
    notice: {
        link: "",
        important: false,
    },
    adventureIsland: {
        islandName: "",
        reward: "",
        period: "",
    },
    fieldBoss: {
        bossName: "",
    },
    chaosGate: {
        region: "",
    },
    event: {
        link: "",
        startDate: "",
        endDate: "",
    },
    package: {
        link: "",
        saleStartDate: "",
        saleEndDate: "",
    },
    custom: {},
};
const CALENDAR_COLOR_PRESETS = [
    { name: "빨강", value: "#c23b55" },
    { name: "주황", value: "#d66a2d" },
    { name: "노랑", value: "#d4a017" },
    { name: "초록", value: "#2f8f83" },
    { name: "파랑", value: "#3f65d9" },
    { name: "보라", value: "#7b3fe4" },
    { name: "검정", value: "#565b66" },
];
const ADVENTURE_ISLAND_REWARD_COLOR_OPTIONS = [
    {
        key: "gold",
        label: "골드",
        defaultRewardTypeKey: "gold",
    },
    {
        key: "shilling",
        label: "실링",
        defaultRewardTypeKey: "shilling",
    },
    {
        key: "oceanCoin",
        label: "대양의 주화",
        defaultRewardTypeKey: "oceanCoinChest",
    },
    {
        key: "card",
        label: "카드",
        defaultRewardTypeKey: "legendCardPackIv",
    },
];

function isValidHexColor(value) {
    return /^#[0-9a-f]{6}$/i.test(value);
}

function getReadableTextColor(backgroundColor) {
    if (!isValidHexColor(backgroundColor)) {
        return "#ffffff";
    }

    const red = Number.parseInt(backgroundColor.slice(1, 3), 16);
    const green = Number.parseInt(backgroundColor.slice(3, 5), 16);
    const blue = Number.parseInt(backgroundColor.slice(5, 7), 16);
    const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

    return brightness >= 150 ? "#111827" : "#ffffff";
}

function getCalendarEventBorderColor(backgroundColor) {
    return isValidHexColor(backgroundColor) ? backgroundColor : "#5b7c99";
}

/**
 * 20260428 khs
 * 역할: 비연동 사용자의 타입별 일정 색상 설정을 localStorage에서 읽는다.
 * 파라미터 설명: 없음
 * 반환값 설명: 일정 타입 키와 색상값을 매핑한 객체
 */
function getStoredCalendarTypeColors() {
    const storedValue = window.localStorage.getItem(CALENDAR_TYPE_COLORS_STORAGE_KEY);

    if (!storedValue) {
        return {};
    }

    try {
        const parsedValue = JSON.parse(storedValue);

        return Object.fromEntries(
            CALENDAR_CUSTOMIZABLE_COLOR_TARGETS.map((targetKey) => [
                targetKey,
                parsedValue[targetKey],
            ]).filter(([, color]) => isValidHexColor(color)),
        );
    } catch {
        return {};
    }
}

/**
 * 20260428 khs
 * 역할: 비연동 사용자의 모험섬 보상별 색상 설정을 localStorage에서 읽는다.
 * 파라미터 설명: 없음
 * 반환값 설명: 모험섬 보상 키와 색상값을 매핑한 객체
 */
function getStoredAdventureIslandRewardColors() {
    const storedValue = window.localStorage.getItem(
        CALENDAR_ADVENTURE_ISLAND_REWARD_COLORS_STORAGE_KEY,
    );

    if (!storedValue) {
        return {};
    }

    try {
        const parsedValue = JSON.parse(storedValue);
        const rewardKeys = new Set(
            ADVENTURE_ISLAND_REWARD_COLOR_OPTIONS.map((option) => option.key),
        );

        return Object.fromEntries(
            Object.entries(parsedValue).filter(
                ([rewardKey, color]) => rewardKeys.has(rewardKey) && isValidHexColor(color),
            ),
        );
    } catch {
        return {};
    }
}

/**
 * 20260428 khs
 * 역할: 비연동 사용자의 달력 표시 필터 설정을 localStorage에서 읽는다.
 * 파라미터 설명: 없음
 * 반환값 설명: targets, groups를 포함한 달력 필터 상태 객체
 */
function getStoredCalendarFilters() {
    const defaultFilters = {
        targets: {},
        groups: {},
    };
    const storedValue = window.localStorage.getItem(CALENDAR_FILTERS_STORAGE_KEY);

    if (!storedValue) {
        return defaultFilters;
    }

    try {
        const parsedValue = JSON.parse(storedValue);

        return {
            targets: parsedValue.targets ?? {},
            groups: parsedValue.groups ?? {},
        };
    } catch {
        return defaultFilters;
    }
}

/**
 * 20260428 khs
 * 역할: 비연동 사용자가 추가/수정한 일정 데이터를 localStorage에서 읽는다.
 * 파라미터 설명: 없음
 * 반환값 설명: localStorage에 저장된 일정 배열
 */
function getStoredLocalSchedules() {
    const storedValue = window.localStorage.getItem(CALENDAR_LOCAL_SCHEDULES_STORAGE_KEY);

    if (!storedValue) {
        return [];
    }

    try {
        const parsedValue = JSON.parse(storedValue);

        if (!Array.isArray(parsedValue)) {
            return [];
        }

        return parsedValue.filter((schedule) => schedule?.id && schedule?.sourceKind);
    } catch {
        return [];
    }
}

/**
 * 20260428 khs
 * 역할: 비연동 사용자 타입별/모험섬 보상별 색상 설정을 FullCalendar 이벤트 색상에 적용한다.
 * 파라미터 설명:
 * - events: 기존 달력 이벤트 배열
 * - typeColors: 일정 타입별 사용자 색상 설정 객체
 * - adventureIslandRewardColors: 모험섬 보상별 사용자 색상 설정 객체
 * 반환값 설명: 사용자 색상 정책이 반영된 달력 이벤트 배열
 */
function applyCalendarUserColors(events, typeColors, adventureIslandRewardColors) {
    return events.map((event) => {
        const targetKey = event.extendedProps?.filterTarget ?? event.extendedProps?.contentType;
        const rewardColorKey =
            targetKey === "adventureIsland" ? getAdventureIslandRewardColorKey(event) : "";
        const backgroundColor =
            targetKey === "adventureIsland"
                ? adventureIslandRewardColors[rewardColorKey]
                : typeColors[targetKey];

        if (!backgroundColor) {
            return event;
        }

        return {
            ...event,
            backgroundColor,
            borderColor: getCalendarEventBorderColor(backgroundColor),
            textColor: getReadableTextColor(backgroundColor),
        };
    });
}

function getAdventureIslandRewardColorKey(event) {
    const rewardTypeKey = event.extendedProps?.rewardTypeKey ?? "";
    const rewardName = event.extendedProps?.rewardName ?? "";

    if (rewardTypeKey === "gold" || rewardName.includes("골드")) {
        return "gold";
    }

    if (rewardTypeKey === "shilling" || rewardName.includes("실링")) {
        return "shilling";
    }

    if (
        rewardTypeKey === "oceanCoinChest" ||
        rewardName.includes("대양") ||
        rewardName.includes("해적주화") ||
        rewardName.includes("주화") ||
        rewardName.includes("해주")
    ) {
        return "oceanCoin";
    }

    if (rewardTypeKey === "legendCardPackIv" || rewardName.includes("카드")) {
        return "card";
    }

    return "";
}

function getScheduleDateTime(date, time) {
    return time ? `${date}T${time}:00` : date;
}

function getPrimaryDateTime(dateTimes = []) {
    return dateTimes[0] ?? {
        date: toDateKey(new Date()),
        time: "",
    };
}

function getDateTimesFromLegacySchedule(schedule) {
    if (Array.isArray(schedule.dateTimes) && schedule.dateTimes.length > 0) {
        return schedule.dateTimes.map((dateTime) => ({
            date: dateTime.date ?? "",
            time: dateTime.time ?? "",
        }));
    }

    return [
        {
            date: schedule.date ?? toDateKey(new Date()),
            time: schedule.time ?? "",
        },
    ];
}

function toScheduleTimeValue(timeText = "") {
    const timeMatch = timeText.match(/(\d{2}):(\d{2})/);

    return timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : "";
}

function getEventScheduleType(event) {
    const targetKey = event.extendedProps?.filterTarget ?? event.extendedProps?.contentType;

    return targetKey === "patchNote" ? "notice" : targetKey || "custom";
}

function createDefaultScheduleDraft(date = toDateKey(new Date())) {
    return {
        id: "",
        sourceKind: "custom",
        common: {
            title: "",
            type: "custom",
            isVisible: true,
            includeInBotResponse: false,
            canNotify: false,
            description: "",
        },
        dateTimes: [
            {
                date,
                time: "",
            },
        ],
        repeat: {
            enabled: false,
        },
        typeSettings: {
            ...DEFAULT_TYPE_SETTINGS.custom,
        },
        sourceUrl: "",
    };
}

function normalizeScheduleDraft(schedule) {
    if (schedule.common) {
        return {
            ...schedule,
            dateTimes: getDateTimesFromLegacySchedule(schedule),
            repeat: schedule.repeat ?? { enabled: false },
            typeSettings: {
                ...(DEFAULT_TYPE_SETTINGS[schedule.common.type] ?? {}),
                ...(schedule.typeSettings ?? {}),
            },
        };
    }

    return {
        id: schedule.id,
        sourceKind: schedule.sourceKind,
        common: {
            title: schedule.title ?? "",
            type: schedule.type ?? "custom",
            isVisible: schedule.isVisible ?? true,
            includeInBotResponse: schedule.includeInBotResponse ?? false,
            canNotify: schedule.canNotify ?? false,
            description: schedule.description ?? "",
        },
        dateTimes: getDateTimesFromLegacySchedule(schedule),
        repeat: schedule.repeat ?? { enabled: false },
        typeSettings: {
            ...(DEFAULT_TYPE_SETTINGS[schedule.type ?? "custom"] ?? {}),
            ...(schedule.typeSettings ?? {}),
        },
        sourceUrl: schedule.sourceUrl ?? "",
    };
}

/**
 * 20260428 khs
 * 역할: FullCalendar 이벤트를 일정 수정 팝업 draft 값으로 변환한다.
 * 파라미터 설명:
 * - event: 수정할 FullCalendar 이벤트 객체
 * - localSchedules: localStorage 기반 일정/override 배열
 * 반환값 설명: 일정 수정 팝업에 표시할 draft 객체
 */
function createScheduleDraftFromEvent(event, localSchedules) {
    const scheduleId = event.extendedProps?.localScheduleId ?? event.id;
    const storedSchedule = localSchedules.find((schedule) => schedule.id === scheduleId);
    const normalizedStoredSchedule = storedSchedule
        ? normalizeScheduleDraft(storedSchedule)
        : null;
    const scheduleType = normalizedStoredSchedule?.common.type ?? getEventScheduleType(event);
    const eventTitle =
        scheduleType === "adventureIsland"
            ? getAdventureIslandTitleWithoutPeriod(event.title)
            : event.title;
    const scheduleDate =
        normalizedStoredSchedule?.dateTimes?.[0]?.date ??
        event.startStr?.split("T")[0] ??
        toDateKey(new Date());

    return {
        id: scheduleId,
        sourceKind: normalizedStoredSchedule?.sourceKind ?? "systemOverride",
        common: {
            title: normalizedStoredSchedule?.common.title ?? eventTitle,
            type: scheduleType,
            isVisible: normalizedStoredSchedule?.common.isVisible ?? true,
            includeInBotResponse:
                normalizedStoredSchedule?.common.includeInBotResponse ?? false,
            canNotify: normalizedStoredSchedule?.common.canNotify ?? false,
            description:
                normalizedStoredSchedule?.common.description ??
                event.extendedProps?.description ??
                "",
        },
        dateTimes: normalizedStoredSchedule?.dateTimes ?? [
            {
                date: scheduleDate,
                time: toScheduleTimeValue(
                    event.extendedProps?.displayTime ?? event.extendedProps?.sourceStartTime ?? "",
                ),
            },
        ],
        repeat: normalizedStoredSchedule?.repeat ?? { enabled: false },
        typeSettings: normalizedStoredSchedule?.typeSettings ?? {
            ...(DEFAULT_TYPE_SETTINGS[scheduleType] ?? {}),
        },
        sourceUrl: normalizedStoredSchedule?.sourceUrl ?? event.url,
    };
}

function mapLocalScheduleToCalendarEvent(schedule) {
    const normalizedSchedule = normalizeScheduleDraft(schedule);
    const eventColors = getCalendarEventColors(normalizedSchedule.common.type);

    return normalizedSchedule.dateTimes.map((dateTime, index) => ({
        id: `${normalizedSchedule.id}::${index}`,
        groupId: normalizedSchedule.id,
        title: normalizedSchedule.common.title,
        start: getScheduleDateTime(dateTime.date, dateTime.time),
        allDay: !dateTime.time,
        ...eventColors,
        extendedProps: {
            contentType: normalizedSchedule.common.type,
            filterTarget: normalizedSchedule.common.type,
            scheduleType: normalizedSchedule.common.type,
            scheduleDate: dateTime.date,
            displayTime: dateTime.time,
            description: normalizedSchedule.common.description,
            includeInBotResponse: normalizedSchedule.common.includeInBotResponse,
            canNotify: normalizedSchedule.common.canNotify,
            localScheduleId: normalizedSchedule.id,
            typeSettings: normalizedSchedule.typeSettings,
            source: {
                sourceType: "local-user-schedule",
                sourceId: normalizedSchedule.id,
            },
        },
    }));
}

function applyLocalScheduleOverrides(serverEvents, localSchedules) {
    const overrides = new Map(
        localSchedules
            .map((schedule) => normalizeScheduleDraft(schedule))
            .filter((schedule) => schedule.sourceKind === "systemOverride")
            .map((schedule) => [schedule.id, schedule]),
    );
    const customEvents = localSchedules
        .map((schedule) => normalizeScheduleDraft(schedule))
        .filter(
            (schedule) =>
                schedule.sourceKind === "custom" && schedule.common.isVisible !== false,
        )
        .flatMap((schedule) => mapLocalScheduleToCalendarEvent(schedule));
    const overriddenServerEvents = serverEvents.flatMap((event) => {
        const override = overrides.get(event.id);

        if (!override) {
            return [event];
        }

        if (override.common.isVisible === false) {
            return [];
        }
        const primaryDateTime = getPrimaryDateTime(override.dateTimes);

        return [
            {
                ...event,
                title: override.common.title,
                start: getScheduleDateTime(primaryDateTime.date, primaryDateTime.time),
                allDay: !primaryDateTime.time,
                extendedProps: {
                    ...event.extendedProps,
                    contentType: override.common.type,
                    filterTarget: override.common.type,
                    scheduleType: override.common.type,
                    scheduleDate: primaryDateTime.date,
                    displayTime: primaryDateTime.time,
                    description: override.common.description,
                    includeInBotResponse: override.common.includeInBotResponse,
                    canNotify: override.common.canNotify,
                    typeSettings: override.typeSettings,
                },
            },
        ];
    });

    return [...overriddenServerEvents, ...customEvents];
}

/**
 * 20260428 khs
 * 역할: 대표 색상 목록에서 선택하는 일정 색상 드롭다운을 렌더링한다.
 * 파라미터 설명:
 * - value: 현재 선택된 `#RRGGBB` 색상 문자열
 * - onChange: 색상 선택 시 호출할 변경 함수
 * - disabled: 색상 선택 비활성화 여부
 * - ariaLabel: 색상 선택 버튼의 접근성 라벨
 * 반환값 설명: 색상 swatch 기반 Popover UI
 */
function CalendarColorSelect({ value, onChange, disabled = false, ariaLabel = "색상 선택" }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className="w-28 justify-between px-2"
                    aria-label={ariaLabel}
                >
                    <span
                        className="h-4 w-4 rounded-sm border"
                        style={{ backgroundColor: value }}
                    />
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-2">
                <div className="grid grid-cols-7 gap-1">
                    {CALENDAR_COLOR_PRESETS.map((color) => (
                        <button
                            key={color.value}
                            type="button"
                            className={cn(
                                "h-7 w-7 rounded-sm border outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                value === color.value ? "ring-2 ring-ring ring-offset-1" : "",
                            )}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                            aria-label={color.name}
                            onClick={() => {
                                onChange(color.value);
                            }}
                        />
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}

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

/**
 * 20260428 khs
 * 역할: Date 객체를 브라우저 로컬 기준 `YYYY-MM-DD` 날짜 키로 변환한다.
 * 파라미터 설명:
 * - date: 날짜 키를 만들 Date 객체
 * 반환값 설명: UTC 변환 없이 로컬 연/월/일로 조합한 날짜 문자열
 */
function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
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

function formatCalendarDownloadDatePart(value) {
    return String(value).padStart(2, "0");
}

function getCalendarDownloadFileName(date = new Date()) {
    const year = date.getFullYear();
    const month = formatCalendarDownloadDatePart(date.getMonth() + 1);
    const day = formatCalendarDownloadDatePart(date.getDate());
    const hours = formatCalendarDownloadDatePart(date.getHours());
    const minutes = formatCalendarDownloadDatePart(date.getMinutes());

    return `lostark-calendar-${year}${month}${day}-${hours}${minutes}.png`;
}

function downloadDataUrl(dataUrl, fileName) {
    const link = document.createElement("a");

    link.href = dataUrl;
    link.download = fileName;
    link.click();
}

function App() {
    const language = currentLanguage;
    const calendarDownloadTargetRef = useRef(null);
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
    const [serverEvents, setServerEvents] = useState([]);
    const [localSchedules, setLocalSchedules] = useState(() => getStoredLocalSchedules());
    const [calendarFirstDay, setCalendarFirstDay] = useState(() => getStoredCalendarFirstDay());
    const [isCalendarTodayFocusEnabled, setIsCalendarTodayFocusEnabled] = useState(() =>
        getStoredCalendarTodayFocusEnabled(),
    );
    const [calendarFilters, setCalendarFilters] = useState(() => getStoredCalendarFilters());
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
    const [calendarTypeColors, setCalendarTypeColors] = useState(() =>
        getStoredCalendarTypeColors(),
    );
    const [adventureIslandRewardColors, setAdventureIslandRewardColors] = useState(() =>
        getStoredAdventureIslandRewardColors(),
    );
    const [isAdventureIslandSettingsOpen, setIsAdventureIslandSettingsOpen] = useState(false);
    const [adventureIslandSettingsDraft, setAdventureIslandSettingsDraft] = useState(null);
    const [adventureIslandSettingsError, setAdventureIslandSettingsError] = useState("");
    const [isCalendarSettingsOpen, setIsCalendarSettingsOpen] = useState(false);
    const [calendarSettingsDraft, setCalendarSettingsDraft] = useState(null);
    const [scheduleDialogMode, setScheduleDialogMode] = useState(null);
    const [scheduleDraft, setScheduleDraft] = useState(null);
    const [scheduleFormError, setScheduleFormError] = useState("");
    const [isCalendarDownloading, setIsCalendarDownloading] = useState(false);

    const allEvents = useMemo(
        () => applyLocalScheduleOverrides(serverEvents, localSchedules),
        [serverEvents, localSchedules],
    );
    const filterOptions = buildCalendarFilterOptions(allEvents);
    const orderedFilterTargets = sortCalendarTargets(
        filterOptions.targets,
        DEFAULT_CALENDAR_DISPLAY_ORDER,
    );
    const visibleEvents = useMemo(
        () =>
            applyCalendarUserColors(
                getVisibleCalendarEvents(
                    filterCalendarEvents(allEvents, calendarFilters),
                    calendarEventDisplayOptions,
                ),
                calendarTypeColors,
                adventureIslandRewardColors,
            ),
        [
            allEvents,
            adventureIslandRewardColors,
            calendarEventDisplayOptions,
            calendarFilters,
            calendarTypeColors,
        ],
    );
    const eventDateKeys = useMemo(() => getEventDateKeys(visibleEvents), [visibleEvents]);
    const calendarDisplayOrderMap = useMemo(
        () =>
            getCalendarDisplayOrderMap(
                DEFAULT_CALENDAR_DISPLAY_ORDER,
            ),
        [],
    );
    const hiddenCalendarTargets = useMemo(
        () =>
            orderedFilterTargets.filter(
                (target) => calendarFilters.targets[target.key] === false,
            ),
        [calendarFilters.targets, orderedFilterTargets],
    );
    const isSystemScheduleDraft = scheduleDraft?.sourceKind === "systemOverride";

    useEffect(() => {
        let isMounted = true;

        async function loadEvents() {
            try {
                const calendarEvents = await fetchLostArkCalendarEvents({
                    adventureIslandQuery: visibleMonthRange,
                    calendarMonthQuery: calendarMonthRange,
                });

                if (isMounted) {
                    setServerEvents(calendarEvents);
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
        window.localStorage.setItem(
            CALENDAR_FILTERS_STORAGE_KEY,
            JSON.stringify(calendarFilters),
        );
    }, [calendarFilters]);

    useEffect(() => {
        window.localStorage.setItem(
            CALENDAR_TYPE_COLORS_STORAGE_KEY,
            JSON.stringify(calendarTypeColors),
        );
    }, [calendarTypeColors]);

    useEffect(() => {
        window.localStorage.setItem(
            CALENDAR_ADVENTURE_ISLAND_REWARD_COLORS_STORAGE_KEY,
            JSON.stringify(adventureIslandRewardColors),
        );
    }, [adventureIslandRewardColors]);

    useEffect(() => {
        window.localStorage.setItem(
            CALENDAR_LOCAL_SCHEDULES_STORAGE_KEY,
            JSON.stringify(localSchedules),
        );
    }, [localSchedules]);

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
     * 역할: 비연동 사용자의 일정 타입별 색상 설정을 갱신한다.
     * 파라미터 설명:
     * - targetKey: 색상을 변경할 일정 타입 키
     * - color: `#RRGGBB` 형식 색상 문자열
     * 반환값 설명: 없음
     */
    function updateCalendarTypeColor(targetKey, color) {
        if (!isValidHexColor(color)) {
            return;
        }

        setCalendarTypeColors((previousColors) => ({
            ...previousColors,
            [targetKey]: color,
        }));
    }

    /**
     * 역할: 비연동 사용자의 일정 타입별 색상 설정을 기본값으로 되돌린다.
     * 파라미터 설명:
     * - targetKey: 기본 색상으로 복원할 일정 타입 키
     * 반환값 설명: 없음
     */
    function resetCalendarTypeColor(targetKey) {
        setCalendarTypeColors((previousColors) => {
            const nextColors = { ...previousColors };

            delete nextColors[targetKey];

            return nextColors;
        });
    }

    function openAdventureIslandSettings() {
        setAdventureIslandSettingsDraft({ ...adventureIslandRewardColors });
        setAdventureIslandSettingsError("");
        setIsAdventureIslandSettingsOpen(true);
    }

    function updateAdventureIslandRewardColor(rewardKey, color) {
        if (!isValidHexColor(color)) {
            return;
        }

        setAdventureIslandSettingsDraft((previousDraft) => ({
            ...previousDraft,
            [rewardKey]: color,
        }));
    }

    function resetAdventureIslandRewardColor(rewardKey) {
        setAdventureIslandSettingsDraft((previousDraft) => {
            const nextDraft = { ...previousDraft };

            delete nextDraft[rewardKey];

            return nextDraft;
        });
    }

    function applyAdventureIslandSettings() {
        if (!adventureIslandSettingsDraft) {
            return;
        }

        try {
            window.localStorage.setItem(
                CALENDAR_ADVENTURE_ISLAND_REWARD_COLORS_STORAGE_KEY,
                JSON.stringify(adventureIslandSettingsDraft),
            );
            setAdventureIslandRewardColors(adventureIslandSettingsDraft);
            setIsAdventureIslandSettingsOpen(false);
            setAdventureIslandSettingsDraft(null);
            setAdventureIslandSettingsError("");
        } catch (error) {
            console.error("Failed to save adventure island reward colors.", error);
            setAdventureIslandSettingsError(
                "저장에 실패했습니다. 기존 모험섬 보상 색상 설정을 유지합니다.",
            );
        }
    }

    /**
     * 역할: 달력 형태 설정 팝업을 현재 설정값으로 초기화해 연다.
     * 파라미터 설명: 없음
     * 반환값 설명: 없음
     */
    function openCalendarSettings() {
        setCalendarSettingsDraft({
            firstDay: calendarFirstDay,
            todayFocusEnabled: isCalendarTodayFocusEnabled,
        });
        setIsCalendarSettingsOpen(true);
    }

    /**
     * 역할: 달력 형태 설정 팝업에서 편집한 값을 실제 달력 설정에 반영한다.
     * 파라미터 설명: 없음
     * 반환값 설명: 없음
     */
    function applyCalendarSettings() {
        if (!calendarSettingsDraft) {
            return;
        }

        setCalendarFirstDay(calendarSettingsDraft.firstDay);
        setIsCalendarTodayFocusEnabled(calendarSettingsDraft.todayFocusEnabled);
        setIsCalendarSettingsOpen(false);
        setCalendarSettingsDraft(null);
    }

    function openCreateScheduleDialog() {
        setScheduleDialogMode("create");
        setScheduleDraft(createDefaultScheduleDraft(calendarMonthRange.fromDate));
        setScheduleFormError("");
    }

    function openEditScheduleDialog(event) {
        setScheduleDialogMode("edit");
        setScheduleDraft(createScheduleDraftFromEvent(event, localSchedules));
        setScheduleFormError("");
    }

    function closeScheduleDialog() {
        setScheduleDialogMode(null);
        setScheduleDraft(null);
        setScheduleFormError("");
    }

    function updateScheduleCommonDraft(field, value) {
        setScheduleDraft((previousDraft) => ({
            ...previousDraft,
            common: {
                ...previousDraft.common,
                [field]: value,
            },
        }));
    }

    function updateScheduleDateTimeDraft(index, field, value) {
        setScheduleDraft((previousDraft) => ({
            ...previousDraft,
            dateTimes: previousDraft.dateTimes.map((dateTime, dateTimeIndex) =>
                dateTimeIndex === index
                    ? {
                          ...dateTime,
                          [field]: value,
                      }
                    : dateTime,
            ),
        }));
    }

    function addScheduleDateTimeDraft() {
        setScheduleDraft((previousDraft) => ({
            ...previousDraft,
            dateTimes: [
                ...previousDraft.dateTimes,
                {
                    date: previousDraft.dateTimes.at(-1)?.date ?? calendarMonthRange.fromDate,
                    time: "",
                },
            ],
        }));
    }

    function removeScheduleDateTimeDraft(index) {
        setScheduleDraft((previousDraft) => ({
            ...previousDraft,
            dateTimes: previousDraft.dateTimes.filter((_, dateTimeIndex) => dateTimeIndex !== index),
        }));
    }

    function updateScheduleRepeatDraft(field, value) {
        setScheduleDraft((previousDraft) => ({
            ...previousDraft,
            repeat: {
                ...previousDraft.repeat,
                [field]: value,
            },
        }));
    }

    function updateScheduleTypeSettingDraft(field, value) {
        setScheduleDraft((previousDraft) => ({
            ...previousDraft,
            typeSettings: {
                ...previousDraft.typeSettings,
                [field]: value,
            },
        }));
    }

    function validateScheduleCommon(draft) {
        if (!draft.common.title.trim()) {
            return "일정명을 입력해주세요.";
        }

        if (!draft.common.type) {
            return "일정 유형을 선택해주세요.";
        }

        return "";
    }

    function validateScheduleDateTimes(draft) {
        if (!draft.dateTimes.length) {
            return "날짜/시간을 1개 이상 추가해주세요.";
        }

        if (draft.dateTimes.some((dateTime) => !dateTime.date)) {
            return "날짜를 선택해주세요.";
        }

        if (
            TIME_REQUIRED_SCHEDULE_TYPES.has(draft.common.type) &&
            draft.dateTimes.some((dateTime) => !dateTime.time)
        ) {
            return "시간을 선택해주세요.";
        }

        return "";
    }

    function validateScheduleRepeat() {
        return "";
    }

    function validateScheduleTypeSettings() {
        return "";
    }

    function validateScheduleDraft(draft) {
        return (
            validateScheduleCommon(draft) ||
            validateScheduleDateTimes(draft) ||
            validateScheduleRepeat(draft) ||
            validateScheduleTypeSettings(draft)
        );
    }

    function saveScheduleDraft() {
        if (!scheduleDraft) {
            return;
        }

        const validationMessage = validateScheduleDraft(scheduleDraft);

        if (validationMessage) {
            setScheduleFormError(validationMessage);
            return;
        }

        const nextSchedule = {
            ...scheduleDraft,
            id:
                scheduleDraft.id ||
                `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            sourceKind: scheduleDraft.sourceKind ?? "custom",
            common: {
                ...scheduleDraft.common,
                title: scheduleDraft.common.title.trim(),
                description: scheduleDraft.common.description.trim(),
            },
        };

        setLocalSchedules((previousSchedules) => {
            const filteredSchedules = previousSchedules.filter(
                (schedule) => schedule.id !== nextSchedule.id,
            );

            return [...filteredSchedules, nextSchedule];
        });
        closeScheduleDialog();
    }

    function deleteScheduleDraft() {
        if (!scheduleDraft?.id) {
            return;
        }

        if (scheduleDraft.sourceKind === "custom") {
            setLocalSchedules((previousSchedules) =>
                previousSchedules.filter((schedule) => schedule.id !== scheduleDraft.id),
            );
        } else {
            setLocalSchedules((previousSchedules) => {
                const filteredSchedules = previousSchedules.filter(
                    (schedule) => schedule.id !== scheduleDraft.id,
                );

                return [
                    ...filteredSchedules,
                    {
                        ...scheduleDraft,
                        sourceKind: "systemOverride",
                        common: {
                            ...scheduleDraft.common,
                            isVisible: false,
                        },
                    },
                ];
            });
        }

        closeScheduleDialog();
    }

    async function handleCalendarPngDownload() {
        const calendarElement = calendarDownloadTargetRef.current;

        if (!calendarElement || calendarElement.offsetWidth === 0 || calendarElement.offsetHeight === 0) {
            window.alert("Calendar is not ready to download.");
            return;
        }

        setIsCalendarDownloading(true);

        try {
            await document.fonts?.ready;

            const dataUrl = await toPng(calendarElement, {
                backgroundColor: "hsl(0 0% 100%)",
                cacheBust: true,
                pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
                width: calendarElement.scrollWidth,
                height: calendarElement.scrollHeight,
                style: {
                    width: `${calendarElement.scrollWidth}px`,
                    height: `${calendarElement.scrollHeight}px`,
                },
            });

            downloadDataUrl(dataUrl, getCalendarDownloadFileName());
        } catch (error) {
            console.error("Failed to download calendar PNG.", error);
            window.alert("Failed to download calendar PNG.");
        } finally {
            setIsCalendarDownloading(false);
        }
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
        const visibleEventTitle =
            contentType === "adventureIsland"
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
                        {contentType === "adventureIsland" ? visibleEventTitle : event.title}
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
                        const hasColorOptions =
                            target.key !== "adventureIsland" &&
                            CALENDAR_CUSTOMIZABLE_COLOR_TARGETS.includes(target.key);
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
                            hasColorOptions || hasDisplayOptions || hasNoticeCategorySettings ? (
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
                                    {hasColorOptions ? (
                                        <div className="space-y-2 border-b pb-3">
                                            <label className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-sm text-foreground">
                                                <span>색상</span>
                                                <CalendarColorSelect
                                                    value={
                                                        calendarTypeColors[target.key] ??
                                                        getDefaultCalendarEventBackgroundColor(target.key)
                                                    }
                                                    disabled={!isTargetEnabled}
                                                    onChange={(color) => {
                                                        updateCalendarTypeColor(
                                                            target.key,
                                                            color,
                                                        );
                                                    }}
                                                    ariaLabel={`${t(target.labelPath, language)} 색상`}
                                                />
                                            </label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                disabled={!isTargetEnabled || !calendarTypeColors[target.key]}
                                                onClick={() => {
                                                    resetCalendarTypeColor(target.key);
                                                }}
                                            >
                                                기본 색상
                                            </Button>
                                        </div>
                                    ) : null}
                                    {target.key === "adventureIsland" ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={openAdventureIslandSettings}
                                        >
                                            보상 색상
                                        </Button>
                                    ) : null}
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
        {
            key: "hiddenSchedules",
            title: "숨긴 일정",
            content: (
                <div className="space-y-2">
                    {hiddenCalendarTargets.length > 0 ? (
                        hiddenCalendarTargets.map((target) => (
                            <div
                                key={`hidden-schedule-target-${target.key}`}
                                className="flex items-center gap-2 rounded-md border px-2 py-2"
                            >
                                <span className="min-w-0 flex-1 truncate text-sm">
                                    {t(target.labelPath, language)}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        updateTargetFilter(target.key, true);
                                    }}
                                >
                                    표시
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">숨긴 일정 없음</p>
                    )}
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
                        <div className="mb-3 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={openCreateScheduleDialog}
                            >
                                일정 추가
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={openCalendarSettings}
                                aria-label="달력 설정"
                                title="달력 설정"
                            >
                                <Settings2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <div ref={calendarDownloadTargetRef} className="calendar-download-target">
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
                                    info.jsEvent.preventDefault();
                                    clearCalendarEventSelection(info.jsEvent.target);
                                    openEditScheduleDialog(info.event);
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
                    </div>

                    <CalendarRemote title={t("remote.title", language)} sections={remoteSections} />
                </div>
            </section>
            <Dialog
                open={isCalendarSettingsOpen && Boolean(calendarSettingsDraft)}
                onOpenChange={(open) => {
                    setIsCalendarSettingsOpen(open);

                    if (!open) {
                        setCalendarSettingsDraft(null);
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogDescription>달력 형태</DialogDescription>
                        <DialogTitle>달력 설정</DialogTitle>
                    </DialogHeader>
                    {calendarSettingsDraft ? (
                        <div className="mt-4 space-y-4">
                            <label
                                className="text-sm font-medium leading-none"
                                htmlFor="calendar-settings-first-day"
                            >
                                {t("calendar.firstDayLabel", language)}
                            </label>
                            <Select
                                value={String(calendarSettingsDraft.firstDay)}
                                onValueChange={(value) => {
                                    setCalendarSettingsDraft((previousDraft) => ({
                                        ...previousDraft,
                                        firstDay: Number(value),
                                    }));
                                }}
                            >
                                <SelectTrigger id="calendar-settings-first-day">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {calendarFirstDayOptions.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={String(option.value)}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <label className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground">
                                <Checkbox
                                    checked={calendarSettingsDraft.todayFocusEnabled}
                                    onCheckedChange={(checked) => {
                                        setCalendarSettingsDraft((previousDraft) => ({
                                            ...previousDraft,
                                            todayFocusEnabled: checked === true,
                                        }));
                                    }}
                                />
                                <span>{t("calendar.todayFocusLabel", language)}</span>
                            </label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleCalendarPngDownload}
                                disabled={isCalendarDownloading}
                            >
                                <Download className="h-4 w-4" />
                                PNG 다운로드
                            </Button>
                        </div>

                    ) : null}
                    <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setIsCalendarSettingsOpen(false);
                                    setCalendarSettingsDraft(null);
                                }}
                            >
                                취소
                            </Button>
                            <Button type="button" size="sm" onClick={applyCalendarSettings}>
                                확인
                            </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog
                open={isAdventureIslandSettingsOpen && Boolean(adventureIslandSettingsDraft)}
                onOpenChange={(open) => {
                    setIsAdventureIslandSettingsOpen(open);

                    if (!open) {
                        setAdventureIslandSettingsDraft(null);
                        setAdventureIslandSettingsError("");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>모험섬 설정</DialogTitle>
                        <DialogDescription>
                            보상별 색상은 개별 모험섬 일정이 아니라 전체 모험섬 일정 표시 정책으로
                            적용됩니다.
                        </DialogDescription>
                    </DialogHeader>
                    {adventureIslandSettingsDraft ? (
                        <div className="mt-2 space-y-3">
                            {ADVENTURE_ISLAND_REWARD_COLOR_OPTIONS.map((rewardOption) => {
                                const defaultColor = getCalendarEventColors(
                                    "adventureIsland",
                                    rewardOption.defaultRewardTypeKey,
                                ).backgroundColor;
                                const selectedColor =
                                    adventureIslandSettingsDraft[rewardOption.key] ?? defaultColor;

                                return (
                                    <div
                                        key={`adventure-island-reward-color-${rewardOption.key}`}
                                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                                    >
                                        <span className="text-sm font-medium">
                                            {rewardOption.label}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <CalendarColorSelect
                                                value={selectedColor}
                                                onChange={(color) => {
                                                    updateAdventureIslandRewardColor(
                                                        rewardOption.key,
                                                        color,
                                                    );
                                                }}
                                                ariaLabel={`${rewardOption.label} 색상 선택`}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                disabled={
                                                    !adventureIslandSettingsDraft[
                                                        rewardOption.key
                                                    ]
                                                }
                                                onClick={() => {
                                                    resetAdventureIslandRewardColor(
                                                        rewardOption.key,
                                                    );
                                                }}
                                            >
                                                기본
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                            {adventureIslandSettingsError ? (
                                <p className="text-sm text-destructive">
                                    {adventureIslandSettingsError}
                                </p>
                            ) : null}
                        </div>
                    ) : null}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setIsAdventureIslandSettingsOpen(false);
                                setAdventureIslandSettingsDraft(null);
                                setAdventureIslandSettingsError("");
                            }}
                        >
                            취소
                        </Button>
                        <Button type="button" size="sm" onClick={applyAdventureIslandSettings}>
                            저장
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog
                open={Boolean(scheduleDialogMode)}
                onOpenChange={(open) => {
                    if (!open) {
                        closeScheduleDialog();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {scheduleDialogMode === "create" ? "일정 추가" : "일정 수정"}
                        </DialogTitle>
                        <DialogDescription>
                            일정 기본 정보와 노출 여부를 설정합니다.
                        </DialogDescription>
                    </DialogHeader>
                    {scheduleDraft ? (
                        <div className="mt-2 space-y-3">
                            <section className="space-y-3 rounded-md border p-3">
                                <h3 className="text-sm font-semibold">공통 설정</h3>
                                <label className="space-y-1 text-sm">
                                    <span className="font-medium">일정명</span>
                                    <input
                                        value={scheduleDraft.common.title}
                                        disabled={isSystemScheduleDraft}
                                        onChange={(event) => {
                                            updateScheduleCommonDraft("title", event.target.value);
                                        }}
                                        className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                </label>
                                <label className="space-y-1 text-sm">
                                    <span className="font-medium">일정 유형</span>
                                    <Select
                                        value={scheduleDraft.common.type}
                                        disabled={isSystemScheduleDraft}
                                        onValueChange={(value) => {
                                            setScheduleDraft((previousDraft) => ({
                                                ...previousDraft,
                                                common: {
                                                    ...previousDraft.common,
                                                    type: value,
                                                },
                                                typeSettings: {
                                                    ...(DEFAULT_TYPE_SETTINGS[value] ?? {}),
                                                },
                                            }));
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CALENDAR_SCHEDULE_TYPE_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </label>
                                <div className="space-y-2">
                                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={scheduleDraft.common.isVisible}
                                            onCheckedChange={(checked) => {
                                                updateScheduleCommonDraft(
                                                    "isVisible",
                                                    checked === true,
                                                );
                                            }}
                                        />
                                        <span>달력에 표시</span>
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={scheduleDraft.common.includeInBotResponse}
                                            onCheckedChange={(checked) => {
                                                updateScheduleCommonDraft(
                                                    "includeInBotResponse",
                                                    checked === true,
                                                );
                                            }}
                                        />
                                        <span>봇 응답에 포함</span>
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={scheduleDraft.common.canNotify}
                                            onCheckedChange={(checked) => {
                                                updateScheduleCommonDraft(
                                                    "canNotify",
                                                    checked === true,
                                                );
                                            }}
                                        />
                                        <span>추후 알림 대상으로 사용</span>
                                    </label>
                                </div>
                                <label className="space-y-1 text-sm">
                                    <span className="font-medium">설명</span>
                                    <textarea
                                        value={scheduleDraft.common.description}
                                        disabled={isSystemScheduleDraft}
                                        onChange={(event) => {
                                            updateScheduleCommonDraft(
                                                "description",
                                                event.target.value,
                                            );
                                        }}
                                        className="min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                </label>
                            </section>

                            <section className="space-y-3 rounded-md border p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-sm font-semibold">날짜/시간 및 반복 설정</h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isSystemScheduleDraft}
                                        onClick={addScheduleDateTimeDraft}
                                    >
                                        시간 추가
                                    </Button>
                                </div>
                                {scheduleDraft.dateTimes.map((dateTime, index) => (
                                    <div
                                        key={`schedule-datetime-${index}`}
                                        className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                                    >
                                        <input
                                            type="date"
                                            value={dateTime.date}
                                            disabled={isSystemScheduleDraft}
                                            onChange={(event) => {
                                                updateScheduleDateTimeDraft(
                                                    index,
                                                    "date",
                                                    event.target.value,
                                                );
                                            }}
                                            className="h-9 rounded-md border bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                        <input
                                            type="time"
                                            value={dateTime.time}
                                            disabled={isSystemScheduleDraft}
                                            onChange={(event) => {
                                                updateScheduleDateTimeDraft(
                                                    index,
                                                    "time",
                                                    event.target.value,
                                                );
                                            }}
                                            className="h-9 rounded-md border bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            disabled={
                                                isSystemScheduleDraft ||
                                                scheduleDraft.dateTimes.length <= 1
                                            }
                                            onClick={() => {
                                                removeScheduleDateTimeDraft(index);
                                            }}
                                        >
                                            삭제
                                        </Button>
                                    </div>
                                ))}
                                <label className="flex cursor-pointer items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={scheduleDraft.repeat.enabled}
                                        disabled={isSystemScheduleDraft}
                                        onCheckedChange={(checked) => {
                                            updateScheduleRepeatDraft(
                                                "enabled",
                                                checked === true,
                                            );
                                        }}
                                    />
                                    <span>반복 사용</span>
                                </label>
                                {scheduleDraft.repeat.enabled ? (
                                    <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                                        반복 상세 규칙은 추후 확장합니다.
                                    </div>
                                ) : null}
                            </section>

                            <section className="space-y-3 rounded-md border p-3">
                                <h3 className="text-sm font-semibold">타입별 개별 설정</h3>
                                {scheduleDraft.common.type === "notice" ? (
                                    <>
                                        <label className="space-y-1 text-sm">
                                            <span className="font-medium">공지 링크</span>
                                            <input
                                                value={scheduleDraft.typeSettings.link ?? ""}
                                                disabled={isSystemScheduleDraft}
                                                onChange={(event) => {
                                                    updateScheduleTypeSettingDraft(
                                                        "link",
                                                        event.target.value,
                                                    );
                                                }}
                                                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-ring"
                                            />
                                        </label>
                                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={Boolean(scheduleDraft.typeSettings.important)}
                                                disabled={isSystemScheduleDraft}
                                                onCheckedChange={(checked) => {
                                                    updateScheduleTypeSettingDraft(
                                                        "important",
                                                        checked === true,
                                                    );
                                                }}
                                            />
                                            <span>중요 여부</span>
                                        </label>
                                    </>
                                ) : null}
                                {scheduleDraft.common.type === "adventureIsland" ? (
                                    <div className="grid gap-2 sm:grid-cols-3">
                                        <input
                                            value={scheduleDraft.typeSettings.islandName ?? ""}
                                            disabled={isSystemScheduleDraft}
                                            placeholder="섬 이름"
                                            onChange={(event) => {
                                                updateScheduleTypeSettingDraft(
                                                    "islandName",
                                                    event.target.value,
                                                );
                                            }}
                                            className="h-9 rounded-md border bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                        <input
                                            value={scheduleDraft.typeSettings.reward ?? ""}
                                            disabled={isSystemScheduleDraft}
                                            placeholder="보상"
                                            onChange={(event) => {
                                                updateScheduleTypeSettingDraft(
                                                    "reward",
                                                    event.target.value,
                                                );
                                            }}
                                            className="h-9 rounded-md border bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                        <input
                                            value={scheduleDraft.typeSettings.period ?? ""}
                                            disabled={isSystemScheduleDraft}
                                            placeholder="오전/오후"
                                            onChange={(event) => {
                                                updateScheduleTypeSettingDraft(
                                                    "period",
                                                    event.target.value,
                                                );
                                            }}
                                            className="h-9 rounded-md border bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                    </div>
                                ) : null}
                                {scheduleDraft.common.type === "fieldBoss" ? (
                                    <input
                                        value={scheduleDraft.typeSettings.bossName ?? ""}
                                        disabled={isSystemScheduleDraft}
                                        placeholder="보스명"
                                        onChange={(event) => {
                                            updateScheduleTypeSettingDraft(
                                                "bossName",
                                                event.target.value,
                                            );
                                        }}
                                        className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                ) : null}
                                {scheduleDraft.common.type === "chaosGate" ? (
                                    <input
                                        value={scheduleDraft.typeSettings.region ?? ""}
                                        disabled={isSystemScheduleDraft}
                                        placeholder="지역"
                                        onChange={(event) => {
                                            updateScheduleTypeSettingDraft(
                                                "region",
                                                event.target.value,
                                            );
                                        }}
                                        className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                ) : null}
                                {scheduleDraft.common.type === "event" ? (
                                    <div className="grid gap-2 sm:grid-cols-3">
                                        <input
                                            value={scheduleDraft.typeSettings.link ?? ""}
                                            disabled={isSystemScheduleDraft}
                                            placeholder="이벤트 링크"
                                            onChange={(event) => {
                                                updateScheduleTypeSettingDraft(
                                                    "link",
                                                    event.target.value,
                                                );
                                            }}
                                            className="h-9 rounded-md border bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                        <input
                                            type="date"
                                            value={scheduleDraft.typeSettings.startDate ?? ""}
                                            disabled={isSystemScheduleDraft}
                                            onChange={(event) => {
                                                updateScheduleTypeSettingDraft(
                                                    "startDate",
                                                    event.target.value,
                                                );
                                            }}
                                            className="h-9 rounded-md border bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                        <input
                                            type="date"
                                            value={scheduleDraft.typeSettings.endDate ?? ""}
                                            disabled={isSystemScheduleDraft}
                                            onChange={(event) => {
                                                updateScheduleTypeSettingDraft(
                                                    "endDate",
                                                    event.target.value,
                                                );
                                            }}
                                            className="h-9 rounded-md border bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                    </div>
                                ) : null}
                                {scheduleDraft.common.type === "package" ? (
                                    <div className="grid gap-2 sm:grid-cols-3">
                                        <input
                                            value={scheduleDraft.typeSettings.link ?? ""}
                                            disabled={isSystemScheduleDraft}
                                            placeholder="패키지 링크"
                                            onChange={(event) => {
                                                updateScheduleTypeSettingDraft(
                                                    "link",
                                                    event.target.value,
                                                );
                                            }}
                                            className="h-9 rounded-md border bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                        <input
                                            type="date"
                                            value={scheduleDraft.typeSettings.saleStartDate ?? ""}
                                            disabled={isSystemScheduleDraft}
                                            onChange={(event) => {
                                                updateScheduleTypeSettingDraft(
                                                    "saleStartDate",
                                                    event.target.value,
                                                );
                                            }}
                                            className="h-9 rounded-md border bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                        <input
                                            type="date"
                                            value={scheduleDraft.typeSettings.saleEndDate ?? ""}
                                            disabled={isSystemScheduleDraft}
                                            onChange={(event) => {
                                                updateScheduleTypeSettingDraft(
                                                    "saleEndDate",
                                                    event.target.value,
                                                );
                                            }}
                                            className="h-9 rounded-md border bg-background px-3 text-sm outline-none disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                    </div>
                                ) : null}
                                {scheduleDraft.common.type === "custom" ? (
                                    <p className="text-xs text-muted-foreground">추가 필드 없음</p>
                                ) : null}
                            </section>
                            {scheduleFormError ? (
                                <p className="text-sm text-destructive">{scheduleFormError}</p>
                            ) : null}
                            {scheduleDraft.sourceUrl ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        window.open(
                                            scheduleDraft.sourceUrl,
                                            "_blank",
                                            "noopener,noreferrer",
                                        );
                                    }}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    원본
                                </Button>
                            ) : null}
                        </div>
                    ) : null}
                    <DialogFooter className="flex-wrap">
                        {scheduleDialogMode === "edit" && !isSystemScheduleDraft ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={deleteScheduleDraft}
                            >
                                삭제
                            </Button>
                        ) : null}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={closeScheduleDialog}
                        >
                            취소
                        </Button>
                        <Button type="button" size="sm" onClick={saveScheduleDraft}>
                            저장
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}

export default App;
