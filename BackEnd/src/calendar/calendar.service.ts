import {
    BadRequestException,
    Injectable,
    Logger,
    MethodNotAllowedException,
} from "@nestjs/common";
import { CalendarEventSourceType, CalendarSourceType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
    ADVENTURE_ISLAND_CALENDAR_DEFINITIONS,
    AdventureIslandCalendarKey,
    LOSTARK_NOTICE_CALENDAR_DEFINITIONS,
    LostArkNoticeCalendarKey,
} from "./calendar.constants";
import {
    CreateCalendarEventDto,
    QueryCalendarEventsDto,
    UpdateCalendarEventDto,
} from "./dto/calendar-event.dto";
import { UpdateCalendarColorDto, UpdateCalendarVisibleDto } from "./dto/update-calendar.dto";

type CalendarRecord = {
    id: string;
    name: string;
    defaultColor: string;
    iconUrl: string | null;
    isVisible: boolean;
    sortOrder: number;
    sourceType: CalendarSourceType;
    createdAt: Date;
    updatedAt: Date;
};

type CalendarEventRecord = {
    id: string;
    title: string;
    description: string | null;
    color: string | null;
    sourceType: CalendarEventSourceType;
    alarmEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    calendar: CalendarRecord;
    times: Array<{
        id: string;
        eventId: string;
        startDateTime: Date;
        endDateTime: Date;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
};

@Injectable()
export class CalendarService {
    private readonly virtualCalendarCreatedAt = new Date(0);
    private readonly logger = new Logger(CalendarService.name);

    constructor(private readonly prismaService: PrismaService) {}

    private buildVirtualCalendar(
        sourceType: CalendarSourceType,
        name: string,
        defaultColor: string,
        iconUrl: string | null,
        sortOrder: number,
    ): CalendarRecord {
        return {
            id: `virtual:${sourceType}:${name}`,
            name,
            defaultColor,
            iconUrl,
            isVisible: true,
            sortOrder,
            sourceType,
            createdAt: this.virtualCalendarCreatedAt,
            updatedAt: this.virtualCalendarCreatedAt,
        };
    }

    private getVirtualCalendars() {
        return [
            ...Object.values(ADVENTURE_ISLAND_CALENDAR_DEFINITIONS).map((definition) =>
                this.buildVirtualCalendar(
                    CalendarSourceType.lostark,
                    definition.name,
                    definition.defaultColor,
                    definition.iconUrl,
                    definition.sortOrder,
                ),
            ),
            ...Object.values(LOSTARK_NOTICE_CALENDAR_DEFINITIONS).map((definition) =>
                this.buildVirtualCalendar(
                    CalendarSourceType.lostark,
                    definition.name,
                    definition.defaultColor,
                    null,
                    definition.sortOrder,
                ),
            ),
        ];
    }

    private async getCalendarLookup() {
        const calendars = (await this.prismaService.calendar.findMany({
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        })) as CalendarRecord[];
        const calendarMap = new Map<string, CalendarRecord>();

        for (const calendar of calendars) {
            calendarMap.set(`${calendar.sourceType}:${calendar.name}`, calendar);
        }

        return {
            calendars,
            calendarMap,
        };
    }

    private resolveCalendar(
        calendarMap: Map<string, CalendarRecord>,
        sourceType: CalendarSourceType,
        name: string,
        defaultColor: string,
        iconUrl: string | null,
        sortOrder: number,
    ) {
        return (
            calendarMap.get(`${sourceType}:${name}`) ??
            this.buildVirtualCalendar(sourceType, name, defaultColor, iconUrl, sortOrder)
        );
    }

    private formatDateParts(year: number, month: number, day: number) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    private toDateText(date: Date) {
        return this.formatDateParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    }

    private createDateOnly(value: string) {
        const date = new Date(`${value}T00:00:00.000Z`);

        if (Number.isNaN(date.getTime())) {
            throw new BadRequestException("Invalid date range.");
        }

        return date;
    }

    private createKoreaTimestampDate(
        year: number,
        month: number,
        day: number,
        hour = 0,
        minute = 0,
        second = 0,
        millisecond = 0,
    ) {
        return new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
    }

    private parseQueryDate(value: string, isRangeEnd = false) {
        const date = (() => {
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                const [year, month, day] = value.split("-").map(Number);

                return isRangeEnd
                    ? this.createKoreaTimestampDate(year, month, day, 23, 59, 59, 999)
                    : this.createKoreaTimestampDate(year, month, day);
            }

            return new Date(value);
        })();

        if (Number.isNaN(date.getTime())) {
            throw new BadRequestException("Invalid date range.");
        }

        return date;
    }

    private normalizeText(value = "") {
        return value.replace(/\s+/g, "").toLowerCase();
    }

    private getPeriodLabel(period: string) {
        if (period === "weekendMorning") {
            return "오전";
        }

        if (period === "weekendAfternoon") {
            return "오후";
        }

        return "";
    }

    private getAdventureIslandCalendarKey(rewardName = ""): AdventureIslandCalendarKey {
        const normalizedRewardName = this.normalizeText(rewardName);

        if (normalizedRewardName.includes("골드") || normalizedRewardName.includes("gold")) {
            return "gold";
        }

        if (normalizedRewardName.includes("카드") || normalizedRewardName.includes("card")) {
            return "card";
        }

        if (
            normalizedRewardName.includes("주화") ||
            normalizedRewardName.includes("ocean") ||
            normalizedRewardName.includes("coin")
        ) {
            return "oceanCoin";
        }

        if (normalizedRewardName.includes("실링") || normalizedRewardName.includes("shilling")) {
            return "shilling";
        }

        throw new BadRequestException("Unknown adventure island reward.");
    }

    private getLostArkNoticeCalendarKey(noticeType = ""): LostArkNoticeCalendarKey {
        const normalizedType = this.normalizeText(noticeType);

        if (normalizedType.includes("패치") || normalizedType.includes("patch")) {
            return "patchNote";
        }

        return "notice";
    }

    private createAdventureIslandEventDateRange(startTime: Date) {
        const startDateTime = new Date(startTime);

        if (Number.isNaN(startDateTime.getTime())) {
            throw new BadRequestException("Invalid adventure island start time.");
        }

        return {
            startDateTime,
            endDateTime: new Date(startDateTime),
        };
    }

    private createAllDayEventDateRange(date: Date) {
        const startDateTime = new Date(date);
        const endDateTime = new Date(date);

        startDateTime.setHours(0, 0, 0, 0);
        endDateTime.setHours(23, 59, 59, 999);

        return {
            startDateTime,
            endDateTime,
        };
    }

    /**
     * @private
     * @param startDateTime Event time start.
     * @param endDateTime Event time end.
     * @returns Whether the time covers a full day range.
     */
    private formatTimestampText(date: Date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        const hour = String(date.getUTCHours()).padStart(2, "0");
        const minute = String(date.getUTCMinutes()).padStart(2, "0");
        const second = String(date.getUTCSeconds()).padStart(2, "0");

        return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    }

    private mapCalendarEvent(event: CalendarEventRecord) {
        const orderedTimes = [...event.times].sort((leftTime, rightTime) => {
            if (leftTime.sortOrder !== rightTime.sortOrder) {
                return leftTime.sortOrder - rightTime.sortOrder;
            }

            return leftTime.startDateTime.getTime() - rightTime.startDateTime.getTime();
        });

        return {
            id: event.id,
            title: event.title,
            description: event.description,
            color: event.color,
            sourceType: event.sourceType,
            alarmEnabled: event.alarmEnabled,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
            calendar: event.calendar,
            times: orderedTimes.map((time) => ({
                ...time,
                startDateTime: this.formatTimestampText(time.startDateTime),
                endDateTime: this.formatTimestampText(time.endDateTime),
            })),
            displayColor: event.color ?? event.calendar.defaultColor,
        };
    }

    private mapScheduleEvent(event: CalendarEventRecord) {
        const responseEvent = this.mapCalendarEvent(event);

        this.logger.debug(
            [
                "Mapped schedule times from CalendarEventTime.",
                `eventId=${event.id}`,
                `calendarEventTimeCount=${event.times.length}`,
                `responseTimesCount=${responseEvent.times.length}`,
            ].join(" "),
        );

        return responseEvent;
    }

    private buildAdventureIslandEvent(
        adventureIsland: {
            id: string;
            date: Date | null;
            period: string;
            contentsName: string;
            rewardName: string | null;
            rewardIconUrl: string | null;
            contentIconUrl: string | null;
            contentImageUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
        },
        calendarMap: Map<string, CalendarRecord>,
    ) {
        const rewardName = adventureIsland.rewardName ?? "";
        let calendarKey: AdventureIslandCalendarKey;

        try {
            calendarKey = this.getAdventureIslandCalendarKey(rewardName);
        } catch {
            return null;
        }

        const definition = ADVENTURE_ISLAND_CALENDAR_DEFINITIONS[calendarKey];
        const calendar = this.resolveCalendar(
            calendarMap,
            CalendarSourceType.lostark,
            definition.name,
            definition.defaultColor,
            definition.iconUrl,
            definition.sortOrder,
        );

        if (!calendar.isVisible) {
            return null;
        }

        const startTime = this.createAdventureIslandStartTime(adventureIsland.date, adventureIsland.period);

        if (startTime == null) {
            return null;
        }

        const { startDateTime, endDateTime } = this.createAdventureIslandEventDateRange(
            startTime,
        );
        const periodLabel = this.getPeriodLabel(adventureIsland.period);
        const titlePrefix = periodLabel ? `[${periodLabel}] ` : "";
        const title = `${titlePrefix}${adventureIsland.contentsName}`;
        const description = [adventureIsland.contentsName, rewardName].filter(Boolean).join(" / ");

        return {
            id: `virtual:${adventureIsland.id}`,
            title,
            description,
            color: null,
            sourceType: CalendarEventSourceType.lostark,
            alarmEnabled: false,
            createdAt: adventureIsland.createdAt,
            updatedAt: adventureIsland.updatedAt,
            calendar,
            times: [
                {
                    id: `virtual:${adventureIsland.id}:time`,
                    eventId: `virtual:${adventureIsland.id}`,
                    startDateTime,
                    endDateTime,
                    sortOrder: 100,
                    createdAt: adventureIsland.createdAt,
                    updatedAt: adventureIsland.updatedAt,
                },
            ],
        } satisfies CalendarEventRecord;
    }

    private createAdventureIslandStartTime(date: Date | null, period: string) {
        if (date == null || Number.isNaN(date.getTime())) {
            return null;
        }

        const hour = period === "weekendMorning" ? 9 : period === "weekendAfternoon" ? 19 : 11;

        return this.createKoreaTimestampDate(
            date.getUTCFullYear(),
            date.getUTCMonth() + 1,
            date.getUTCDate(),
            hour,
        );
    }

    private buildLostArkNoticeEvent(
        notice: {
            id: string;
            title: string;
            noticeDate: Date;
            type: string;
            createdAt: Date;
            updatedAt: Date;
        },
        calendarMap: Map<string, CalendarRecord>,
    ) {
        const calendarKey = this.getLostArkNoticeCalendarKey(notice.type);
        const definition = LOSTARK_NOTICE_CALENDAR_DEFINITIONS[calendarKey];
        const calendar = this.resolveCalendar(
            calendarMap,
            CalendarSourceType.lostark,
            definition.name,
            definition.defaultColor,
            null,
            definition.sortOrder,
        );

        if (!calendar.isVisible) {
            return null;
        }

        const { startDateTime, endDateTime } = this.createAllDayEventDateRange(notice.noticeDate);
        const title = notice.type ? `[${notice.type}] ${notice.title}` : notice.title;

        return {
            id: `virtual:${notice.id}`,
            title,
            description: notice.title,
            color: null,
            sourceType: CalendarEventSourceType.lostark,
            alarmEnabled: false,
            createdAt: notice.createdAt,
            updatedAt: notice.updatedAt,
            calendar,
            times: [
                {
                    id: `virtual:${notice.id}:time`,
                    eventId: `virtual:${notice.id}`,
                    startDateTime,
                    endDateTime,
                    sortOrder: 100,
                    createdAt: notice.createdAt,
                    updatedAt: notice.updatedAt,
                },
            ],
        } satisfies CalendarEventRecord;
    }

    private async getCalendarEventsByRange(fromText: string, toText: string) {
        const fromDate = this.parseQueryDate(fromText);
        const toDate = this.parseQueryDate(toText, true);

        if (fromDate > toDate) {
            throw new BadRequestException("Invalid date range.");
        }

        const { calendarMap } = await this.getCalendarLookup();
        const events = (await this.prismaService.calendarEvent.findMany({
            where: {
                times: {
                    some: {
                        startDateTime: {
                            lte: toDate,
                        },
                        endDateTime: {
                            gte: fromDate,
                        },
                    },
                },
                calendar: {
                    isVisible: true,
                },
            },
            include: {
                calendar: true,
                times: {
                    orderBy: [{ sortOrder: "asc" }, { startDateTime: "asc" }],
                },
            },
            orderBy: [{ calendar: { sortOrder: "asc" } }, { title: "asc" }],
        })) as unknown as CalendarEventRecord[];

        const adventureIslands = await this.prismaService.adventureIsland.findMany({
            where: {
                date: {
                    gte: this.createDateOnly(this.toDateText(fromDate)),
                    lte: this.createDateOnly(this.toDateText(toDate)),
                },
            },
            orderBy: [{ date: "asc" }, { contentsName: "asc" }],
        });
        const notices = await this.prismaService.lostArkNotice.findMany({
            where: {
                noticeDate: {
                    gte: fromDate,
                    lte: toDate,
                },
            },
            orderBy: [{ noticeDate: "asc" }, { title: "asc" }],
        });

        for (const adventureIsland of adventureIslands) {
            const generatedEvent = this.buildAdventureIslandEvent(adventureIsland, calendarMap);

            if (generatedEvent == null) {
                continue;
            }

            events.push(generatedEvent);
        }

        for (const notice of notices) {
            const generatedEvent = this.buildLostArkNoticeEvent(notice, calendarMap);

            if (generatedEvent == null) {
                continue;
            }

            events.push(generatedEvent);
        }

        return events
            .map((event) => this.mapCalendarEvent(event))
            .sort((leftEvent, rightEvent) => {
                const leftStartTime = leftEvent.times[0]?.startDateTime ?? "";
                const rightStartTime = rightEvent.times[0]?.startDateTime ?? "";

                if (leftStartTime !== rightStartTime) {
                    return leftStartTime.localeCompare(rightStartTime);
                }

                return leftEvent.title.localeCompare(rightEvent.title);
            });
    }

    private async getScheduleEventsByRange(startDateText: string, endDateText: string) {
        const startDate = this.parseQueryDate(startDateText);
        const endDate = this.parseQueryDate(endDateText, true);

        if (startDate > endDate) {
            throw new BadRequestException("Invalid date range.");
        }

        const events = (await this.prismaService.calendarEvent.findMany({
            where: {
                OR: [
                    {
                        times: {
                            some: {
                                startDateTime: {
                                    lte: endDate,
                                },
                                endDateTime: {
                                    gte: startDate,
                                },
                            },
                        },
                    },
                    {
                        times: {
                            none: {},
                        },
                    },
                ],
                calendar: {
                    isVisible: true,
                },
            },
            include: {
                calendar: true,
                times: {
                    orderBy: [{ sortOrder: "asc" }, { startDateTime: "asc" }],
                },
            },
            orderBy: [{ calendar: { sortOrder: "asc" } }, { title: "asc" }],
        })) as unknown as CalendarEventRecord[];

        return events
            .map((event) => this.mapScheduleEvent(event))
            .sort((leftEvent, rightEvent) => {
                const leftStartTime = leftEvent.times[0]?.startDateTime ?? "";
                const rightStartTime = rightEvent.times[0]?.startDateTime ?? "";

                if (leftStartTime !== rightStartTime) {
                    return leftStartTime.localeCompare(rightStartTime);
                }

                return leftEvent.title.localeCompare(rightEvent.title);
            });
    }

    /**
     * @public
     * @returns Calendar list ordered by display order and name.
     */
    async getCalendars() {
        const { calendars, calendarMap } = await this.getCalendarLookup();
        const virtualCalendars = this.getVirtualCalendars().filter(
            (calendar) => !calendarMap.has(`${calendar.sourceType}:${calendar.name}`),
        );

        return [...calendars, ...virtualCalendars].sort((leftCalendar, rightCalendar) => {
            if (leftCalendar.sortOrder !== rightCalendar.sortOrder) {
                return leftCalendar.sortOrder - rightCalendar.sortOrder;
            }

            return leftCalendar.name.localeCompare(rightCalendar.name);
        });
    }

    /**
     * @public
     * @param calendarId Calendar id to update.
     * @param dto Visibility update payload.
     * @returns Updated calendar.
     */
    updateCalendarVisible(calendarId: string, dto: UpdateCalendarVisibleDto) {
        throw new MethodNotAllowedException(
            `Calendar updates are disabled. calendarId=${calendarId}`,
        );
    }

    /**
     * @public
     * @param calendarId Calendar id to update.
     * @param dto Default color update payload.
     * @returns Updated calendar.
     */
    updateCalendarColor(calendarId: string, dto: UpdateCalendarColorDto) {
        throw new MethodNotAllowedException(
            `Calendar updates are disabled. calendarId=${calendarId}`,
        );
    }

    /**
     * @public
     * @param fromDate Period start.
     * @param toDate Period end.
     * @returns Calendar event count.
     */
    async syncAdventureIslandEvents(fromDate: Date, toDate: Date) {
        throw new MethodNotAllowedException(
            `Calendar sync is disabled. fromDate=${fromDate.toISOString()}, toDate=${toDate.toISOString()}`,
        );
    }

    /**
     * @public
     * @param fromDate Period start.
     * @param toDate Period end.
     * @returns Calendar event count.
     */
    async syncLostArkNoticeEvents(fromDate: Date, toDate: Date) {
        throw new MethodNotAllowedException(
            `Calendar sync is disabled. fromDate=${fromDate.toISOString()}, toDate=${toDate.toISOString()}`,
        );
    }

    async getCalendarEvents(query: QueryCalendarEventsDto) {
        return this.getCalendarEventsByRange(query.from, query.to);
    }

    /**
     * @public
     * @param startDate Schedule range start.
     * @param endDate Schedule range end.
     * @returns Schedules whose times are based only on CalendarEventTime rows.
     */
    async getSchedules(startDate: string, endDate: string) {
        return this.getScheduleEventsByRange(startDate, endDate);
    }

    /**
     * @public
     * @param dto User event creation payload.
     * @returns Created user event with calendar and display color.
     */
    async createUserEvent(dto: CreateCalendarEventDto) {
        throw new MethodNotAllowedException("Calendar event mutations are disabled.");
    }

    /**
     * @public
     * @param eventId User event id.
     * @param dto User event update payload.
     * @returns Updated user event with calendar and display color.
     */
    async updateUserEvent(eventId: string, dto: UpdateCalendarEventDto) {
        throw new MethodNotAllowedException("Calendar event mutations are disabled.");
    }

    /**
     * @public
     * @param eventId User event id.
     * @returns Deleted user event id.
     */
    async deleteUserEvent(eventId: string) {
        throw new MethodNotAllowedException("Calendar event mutations are disabled.");
    }
}
