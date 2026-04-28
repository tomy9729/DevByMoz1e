import { Injectable } from "@nestjs/common";
import { AdventureIslandPeriod } from "@prisma/client";
import { QueryAdventureIslandsDto } from "../dto/query-adventure-islands.dto";
import { QueryCalendarSchedulesDto } from "../dto/query-calendar-schedules.dto";
import { LostArkEvent, LostArkNotice } from "../lostark.types";
import { AdventureIslandsService } from "./adventure-islands.service";
import { LostArkEventsService } from "./lostark-events.service";
import { LostArkNoticesService } from "./lostark-notices.service";

export type CalendarScheduleType =
    | "event"
    | "notice"
    | "patchNote"
    | "chaosGate"
    | "fieldBoss"
    | "adventureIsland";

export interface CalendarScheduleSourceRef {
    sourceType: string;
    sourceId: string;
    sourceUrl?: string;
}

export interface CalendarSchedule {
    id: string;
    type: CalendarScheduleType;
    title: string;
    scheduleDate: string;
    startDate?: string;
    endDate?: string;
    displayTime: string;
    description: string;
    source: CalendarScheduleSourceRef;
    isVisible: boolean;
    sortOrder: number;
    display: Record<string, string | null>;
}

const SCHEDULE_TYPE_SORT_ORDER: Record<CalendarScheduleType, number> = {
    event: 0,
    notice: 1,
    patchNote: 1,
    chaosGate: 2,
    fieldBoss: 3,
    adventureIsland: 4,
};
const FIXED_GAME_CONTENT_SCHEDULES = {
    chaosGate: [1, 4, 6, 0],
    fieldBoss: [2, 5, 0],
} satisfies Partial<Record<CalendarScheduleType, number[]>>;
const FIXED_GAME_CONTENT_LABELS = {
    chaosGate: "카오스게이트",
    fieldBoss: "필드보스",
} satisfies Partial<Record<CalendarScheduleType, string>>;

@Injectable()
export class LostArkCalendarSchedulesService {
    constructor(
        private readonly lostArkEventsService: LostArkEventsService,
        private readonly lostArkNoticesService: LostArkNoticesService,
        private readonly adventureIslandsService: AdventureIslandsService,
    ) {}

    /**
     * 20260428 khs
     * 역할: 연/월 조회 입력을 해당 월의 시작일과 종료일 문자열로 변환한다.
     * 파라미터 설명:
     * - query: year, month를 포함한 월별 일정 조회 조건
     * 반환값 설명: `YYYY-MM-DD` 형식의 fromDate, toDate 객체
     */
    private getMonthRange(query: QueryCalendarSchedulesDto) {
        const fromDate = this.formatDateParts(query.year, query.month, 1);
        const lastDate = new Date(query.year, query.month, 0);
        const toDate = this.formatDateParts(
            lastDate.getFullYear(),
            lastDate.getMonth() + 1,
            lastDate.getDate(),
        );

        return {
            fromDate,
            toDate,
        };
    }

    private formatDateParts(year: number, month: number, day: number) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    private toDateOnly(dateTime: string) {
        return dateTime.split("T")[0];
    }

    private addOneDay(dateText: string) {
        const [year, month, day] = dateText.split("-").map(Number);
        const nextDate = new Date(year, month - 1, day + 1);

        return this.formatDateParts(
            nextDate.getFullYear(),
            nextDate.getMonth() + 1,
            nextDate.getDate(),
        );
    }

    private isDateInRange(dateText: string, fromDate: string, toDate: string) {
        return fromDate <= dateText && dateText <= toDate;
    }

    private isRangeOverlappingMonth(startDate: string, endDate: string, fromDate: string, toDate: string) {
        return startDate <= toDate && endDate >= fromDate;
    }

    private getNoticeDisplayTitle(title = "") {
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

    private normalizeContentText(value = "") {
        return value.replace(/\s+/g, "").toLowerCase();
    }

    private normalizeNoticeCategory(noticeType = "") {
        const normalizedType = this.normalizeContentText(noticeType);

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

    private getScheduleTypeFromNotice(noticeType = ""): CalendarScheduleType {
        return this.normalizeContentText(noticeType).includes("패치노트") ? "patchNote" : "notice";
    }

    private getAdventureIslandPeriodLabel(period: AdventureIslandPeriod) {
        if (period === "weekendMorning") {
            return "오전";
        }

        if (period === "weekendAfternoon") {
            return "오후";
        }

        return "";
    }

    private getScheduleTimeSortValue(displayTime = "") {
        const timeMatch = displayTime.match(/^(\d{2}):(\d{2})/);

        if (!timeMatch) {
            return 0;
        }

        return Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
    }

    private dedupeSchedules(schedules: CalendarSchedule[]) {
        const scheduleMap = new Map<string, CalendarSchedule>();

        for (const schedule of schedules) {
            if (scheduleMap.has(schedule.id)) {
                continue;
            }

            scheduleMap.set(schedule.id, schedule);
        }

        return [...scheduleMap.values()];
    }

    private sortSchedules(schedules: CalendarSchedule[]) {
        return [...schedules].sort((left, right) => {
            const dateDifference = left.scheduleDate.localeCompare(right.scheduleDate);

            if (dateDifference !== 0) {
                return dateDifference;
            }

            const timeDifference =
                this.getScheduleTimeSortValue(left.displayTime) -
                this.getScheduleTimeSortValue(right.displayTime);

            if (timeDifference !== 0) {
                return timeDifference;
            }

            const typeDifference = left.sortOrder - right.sortOrder;

            if (typeDifference !== 0) {
                return typeDifference;
            }

            return left.title.localeCompare(right.title, "ko");
        });
    }

    private mapNewsEventToSchedule(event: LostArkEvent): CalendarSchedule {
        const startDate = this.toDateOnly(event.StartDate);
        const endDate = this.toDateOnly(event.EndDate);

        return {
            id: `event-${event.StartDate}-${event.Link}`,
            type: "event",
            title: event.Title,
            scheduleDate: startDate,
            startDate,
            endDate,
            displayTime: "종일",
            description: `${startDate} ~ ${endDate}`,
            source: {
                sourceType: "lostark-news-event",
                sourceId: event.Link,
                sourceUrl: event.Link,
            },
            isVisible: true,
            sortOrder: SCHEDULE_TYPE_SORT_ORDER.event,
            display: {
                filterTarget: "event",
                sourceStartDate: event.StartDate,
                sourceEndDate: event.EndDate,
                link: event.Link,
            },
        };
    }

    private mapNoticeToSchedule(notice: LostArkNotice): CalendarSchedule {
        const noticeDate = this.toDateOnly(notice.Date);
        const noticeType = notice.Type?.trim() ?? "";
        const scheduleType = this.getScheduleTypeFromNotice(noticeType);
        const displayTitle = this.getNoticeDisplayTitle(notice.Title);
        const title = noticeType ? `[${noticeType}] ${displayTitle}` : displayTitle;

        return {
            id: `${scheduleType}-${notice.Date}-${notice.Link}`,
            type: scheduleType,
            title,
            scheduleDate: noticeDate,
            displayTime: "종일",
            description: notice.Title,
            source: {
                sourceType: "lostark-notice",
                sourceId: notice.Link,
                sourceUrl: notice.Link,
            },
            isVisible: true,
            sortOrder: SCHEDULE_TYPE_SORT_ORDER[scheduleType],
            display: {
                filterTarget: "notice",
                noticeType,
                noticeCategory: this.normalizeNoticeCategory(noticeType),
                noticeDate: notice.Date,
                link: notice.Link,
                rawTitle: notice.Title,
            },
        };
    }

    private mapAdventureIslandToSchedule(adventureIsland: Awaited<ReturnType<AdventureIslandsService["getAdventureIslandsFromDatabaseFirst"]>>[number]): CalendarSchedule {
        const periodLabel = this.getAdventureIslandPeriodLabel(adventureIsland.period);
        const periodText = periodLabel ? `[${periodLabel}] ` : "";
        const displayTime = adventureIsland.startTime.split("T")[1]?.slice(0, 5) ?? "";

        return {
            id: `adventure-island-${adventureIsland.lostArkDate}-${adventureIsland.period}-${adventureIsland.contentsName}`,
            type: "adventureIsland",
            title: `${periodText}${adventureIsland.shortName ?? adventureIsland.contentsName}`,
            scheduleDate: adventureIsland.lostArkDate,
            displayTime,
            description: [
                adventureIsland.contentsName,
                adventureIsland.rewardShortName ?? adventureIsland.rewardName ?? "",
            ]
                .filter(Boolean)
                .join(" / "),
            source: {
                sourceType: "adventure-island",
                sourceId: adventureIsland.id,
            },
            isVisible: true,
            sortOrder: SCHEDULE_TYPE_SORT_ORDER.adventureIsland,
            display: {
                categoryName: adventureIsland.categoryName,
                contentsName: adventureIsland.contentsName,
                contentType: "adventureIsland",
                period: adventureIsland.period,
                sourceStartTime: adventureIsland.startTime,
                filterTarget: "adventureIsland",
                islandName: adventureIsland.contentsName,
                rewardName: adventureIsland.rewardShortName ?? adventureIsland.rewardName ?? "",
                rewardIconUrl: adventureIsland.rewardIconUrl ?? "",
                contentIconUrl:
                    adventureIsland.contentImageUrl ?? adventureIsland.contentIconUrl ?? "",
            },
        };
    }

    private createFixedGameContentSchedules(fromDate: string, toDate: string) {
        const schedules: CalendarSchedule[] = [];
        const currentDate = new Date(`${fromDate}T00:00:00`);
        const lastDate = new Date(`${toDate}T00:00:00`);

        while (currentDate <= lastDate) {
            const dateText = this.formatDateParts(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                currentDate.getDate(),
            );
            const dayOfWeek = currentDate.getDay();

            for (const [type, days] of Object.entries(FIXED_GAME_CONTENT_SCHEDULES)) {
                const scheduleType = type as CalendarScheduleType;

                if (!days.includes(dayOfWeek)) {
                    continue;
                }

                const label = FIXED_GAME_CONTENT_LABELS[scheduleType] ?? "";

                schedules.push({
                    id: `${scheduleType}-${dateText}`,
                    type: scheduleType,
                    title: label,
                    scheduleDate: dateText,
                    displayTime: "종일",
                    description: label,
                    source: {
                        sourceType: "fixed-game-content",
                        sourceId: `${scheduleType}-${dateText}`,
                    },
                    isVisible: true,
                    sortOrder: SCHEDULE_TYPE_SORT_ORDER[scheduleType],
                    display: {
                        contentType: scheduleType,
                        filterTarget: scheduleType,
                        categoryName: label,
                        contentsName: label,
                        period: null,
                        sourceStartTime: "",
                        rewardName: "",
                        rewardIconUrl: "",
                        contentIconUrl: "",
                    },
                });
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return schedules;
    }

    /**
     * 20260428 khs
     * 역할: 기존 로아 데이터 조회 구조를 유지한 채 월별 달력 표시용 일정 목록으로 변환한다.
     * 파라미터 설명:
     * - query: year, month를 포함한 월별 일정 조회 조건
     * 반환값 설명: 해당 월 달력에 표시할 통합 일정 배열
     */
    async getMonthlySchedules(query: QueryCalendarSchedulesDto) {
        const { fromDate, toDate } = this.getMonthRange(query);
        const adventureIslandQuery: QueryAdventureIslandsDto = {
            fromDate,
            toDate,
        };
        const [newsEvents, notices, adventureIslands] = await Promise.all([
            this.lostArkEventsService.getEvents(),
            this.lostArkNoticesService.getNotices(),
            this.adventureIslandsService.getAdventureIslandsFromDatabaseFirst(adventureIslandQuery),
        ]);
        const eventSchedules = newsEvents
            .map((event) => this.mapNewsEventToSchedule(event))
            .filter((schedule) =>
                this.isRangeOverlappingMonth(
                    schedule.startDate ?? schedule.scheduleDate,
                    schedule.endDate ?? schedule.scheduleDate,
                    fromDate,
                    toDate,
                ),
            );
        const noticeSchedules = notices
            .map((notice) => this.mapNoticeToSchedule(notice))
            .filter((schedule) => this.isDateInRange(schedule.scheduleDate, fromDate, toDate));
        const adventureIslandSchedules = adventureIslands.map((adventureIsland) =>
            this.mapAdventureIslandToSchedule(adventureIsland),
        );
        const fixedGameContentSchedules = this.createFixedGameContentSchedules(fromDate, toDate);

        return this.sortSchedules(
            this.dedupeSchedules([
                ...eventSchedules,
                ...noticeSchedules,
                ...adventureIslandSchedules,
                ...fixedGameContentSchedules,
            ]).filter((schedule) => schedule.isVisible),
        );
    }
}
