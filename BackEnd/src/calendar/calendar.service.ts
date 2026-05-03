import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CalendarEventSourceType, CalendarSourceType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
    ADVENTURE_ISLAND_CALENDAR_DEFINITIONS,
    ADVENTURE_ISLAND_CALENDAR_SOURCE_TYPE,
    AdventureIslandCalendarKey,
    LOSTARK_NOTICE_CALENDAR_DEFINITIONS,
    LOSTARK_NOTICE_CALENDAR_SOURCE_TYPE,
    LostArkNoticeCalendarKey,
} from "./calendar.constants";
import {
    CreateCalendarEventDto,
    QueryCalendarEventsDto,
    UpdateCalendarEventDto,
} from "./dto/calendar-event.dto";
import { UpdateCalendarColorDto, UpdateCalendarVisibleDto } from "./dto/update-calendar.dto";

@Injectable()
export class CalendarService {
    constructor(private readonly prismaService: PrismaService) {}

    private formatDateParts(year: number, month: number, day: number) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    private toDateText(date: Date) {
        return this.formatDateParts(date.getFullYear(), date.getMonth() + 1, date.getDate());
    }

    private parseQueryDate(value: string, isRangeEnd = false) {
        const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
            ? new Date(`${value}T${isRangeEnd ? "23:59:59.999" : "00:00:00.000"}`)
            : new Date(value);

        if (Number.isNaN(date.getTime())) {
            throw new BadRequestException("Invalid date range.");
        }

        return date;
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

    private normalizeText(value = "") {
        return value.replace(/\s+/g, "").toLowerCase();
    }

    private async renameLegacyCalendar(oldName: string, newName: string) {
        const legacyCalendar = await this.prismaService.calendar.findUnique({
            where: {
                sourceType_name: {
                    sourceType: CalendarSourceType.lostark,
                    name: oldName,
                },
            },
        });

        if (legacyCalendar == null) {
            return;
        }

        const currentCalendar = await this.prismaService.calendar.findUnique({
            where: {
                sourceType_name: {
                    sourceType: CalendarSourceType.lostark,
                    name: newName,
                },
            },
        });

        if (currentCalendar != null) {
            await this.prismaService.calendar.delete({
                where: {
                    id: legacyCalendar.id,
                },
            });

            return;
        }

        await this.prismaService.calendar.update({
            where: {
                id: legacyCalendar.id,
            },
            data: {
                name: newName,
            },
        });
    }

    private async cleanupLegacyCalendars() {
        await this.prismaService.calendar.deleteMany({
            where: {
                sourceType: CalendarSourceType.lostark,
                name: "모험섬 기타",
            },
        });

        await this.renameLegacyCalendar("로스트아크 공지사항", "공지사항");
        await this.renameLegacyCalendar("로스트아크 패치노트", "패치노트");
    }

    private getAdventureIslandCalendarKey(rewardName = ""): AdventureIslandCalendarKey {
        const normalizedRewardName = this.normalizeText(rewardName);

        if (normalizedRewardName.includes("골드") || normalizedRewardName.includes("怨⑤뱶")) {
            return "gold";
        }

        if (
            normalizedRewardName.includes("카드") ||
            normalizedRewardName.includes("移대뱶") ||
            normalizedRewardName.includes("card")
        ) {
            return "card";
        }

        if (
            normalizedRewardName.includes("주화") ||
            normalizedRewardName.includes("二쇳솕") ||
            normalizedRewardName.includes("?댁＜")
        ) {
            return "oceanCoin";
        }

        if (normalizedRewardName.includes("실링") || normalizedRewardName.includes("?ㅻ쭅")) {
            return "shilling";
        }

        throw new BadRequestException("Unknown adventure island reward.");
    }

    private getLostArkNoticeCalendarKey(noticeType = ""): LostArkNoticeCalendarKey {
        const normalizedType = this.normalizeText(noticeType);

        if (normalizedType.includes("패치") || normalizedType.includes("?⑥튂")) {
            return "patchNote";
        }

        return "notice";
    }

    private async getOrCreateAdventureIslandCalendar(calendarKey: AdventureIslandCalendarKey) {
        const calendarDefinition = ADVENTURE_ISLAND_CALENDAR_DEFINITIONS[calendarKey];

        return this.prismaService.calendar.upsert({
            where: {
                sourceType_name: {
                    sourceType: CalendarSourceType.lostark,
                    name: calendarDefinition.name,
                },
            },
            create: {
                name: calendarDefinition.name,
                defaultColor: calendarDefinition.defaultColor,
                iconUrl: calendarDefinition.iconUrl,
                isVisible: true,
                sortOrder: calendarDefinition.sortOrder,
                sourceType: CalendarSourceType.lostark,
            },
            update: {
                iconUrl: calendarDefinition.iconUrl,
                sortOrder: calendarDefinition.sortOrder,
                sourceType: CalendarSourceType.lostark,
            },
        });
    }

    private async getOrCreateLostArkNoticeCalendar(calendarKey: LostArkNoticeCalendarKey) {
        const calendarDefinition = LOSTARK_NOTICE_CALENDAR_DEFINITIONS[calendarKey];

        return this.prismaService.calendar.upsert({
            where: {
                sourceType_name: {
                    sourceType: CalendarSourceType.lostark,
                    name: calendarDefinition.name,
                },
            },
            create: {
                name: calendarDefinition.name,
                defaultColor: calendarDefinition.defaultColor,
                isVisible: true,
                sortOrder: calendarDefinition.sortOrder,
                sourceType: CalendarSourceType.lostark,
            },
            update: {
                sortOrder: calendarDefinition.sortOrder,
                sourceType: CalendarSourceType.lostark,
            },
        });
    }

    private async ensureDefaultCalendars() {
        await this.cleanupLegacyCalendars();

        for (const calendarKey of Object.keys(
            ADVENTURE_ISLAND_CALENDAR_DEFINITIONS,
        ) as AdventureIslandCalendarKey[]) {
            await this.getOrCreateAdventureIslandCalendar(calendarKey);
        }

        for (const calendarKey of Object.keys(
            LOSTARK_NOTICE_CALENDAR_DEFINITIONS,
        ) as LostArkNoticeCalendarKey[]) {
            await this.getOrCreateLostArkNoticeCalendar(calendarKey);
        }
    }

    private createAdventureIslandEventDateRange(startTime: string) {
        const startDateTime = new Date(startTime);

        if (Number.isNaN(startDateTime.getTime())) {
            throw new BadRequestException("Invalid adventure island start time.");
        }

        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

        return {
            startDateTime,
            endDateTime,
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

    private mapCalendarEvent(event: {
        id: string;
        title: string;
        description: string | null;
        startDateTime: Date;
        endDateTime: Date;
        allDay: boolean;
        color: string | null;
        sourceType: CalendarEventSourceType;
        externalSourceType: string | null;
        externalSourceId: string | null;
        recurrenceRule: string | null;
        alarmEnabled: boolean;
        createdAt: Date;
        updatedAt: Date;
        calendar: {
            id: string;
            name: string;
            defaultColor: string;
            isVisible: boolean;
            sortOrder: number;
            sourceType: CalendarSourceType;
        };
    }) {
        return {
            ...event,
            displayColor: event.color ?? event.calendar.defaultColor,
        };
    }

    private async assertUserCalendar(calendarId: string) {
        const calendar = await this.prismaService.calendar.findUnique({
            where: {
                id: calendarId,
            },
        });

        if (calendar == null) {
            throw new NotFoundException("Calendar was not found.");
        }

        if (calendar.sourceType !== CalendarSourceType.user) {
            throw new ForbiddenException("User events can only use user calendars.");
        }
    }

    /**
     * @public
     * @returns Calendar list ordered by display order and name.
     */
    async getCalendars() {
        await this.ensureDefaultCalendars();

        return this.prismaService.calendar.findMany({
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        });
    }

    /**
     * @public
     * @param calendarId Calendar id to update.
     * @param dto Visibility update payload.
     * @returns Updated calendar.
     */
    updateCalendarVisible(calendarId: string, dto: UpdateCalendarVisibleDto) {
        return this.prismaService.calendar.update({
            where: {
                id: calendarId,
            },
            data: {
                isVisible: dto.isVisible,
            },
        });
    }

    /**
     * @public
     * @param calendarId Calendar id to update.
     * @param dto Default color update payload.
     * @returns Updated calendar.
     */
    updateCalendarColor(calendarId: string, dto: UpdateCalendarColorDto) {
        return this.prismaService.calendar.update({
            where: {
                id: calendarId,
            },
            data: {
                defaultColor: dto.defaultColor,
            },
        });
    }

    /**
     * @public
     * @param fromDate Period start.
     * @param toDate Period end.
     * @returns Synced Lost Ark adventure island event count.
     */
    async syncAdventureIslandEvents(fromDate: Date, toDate: Date) {
        const adventureIslands = await this.prismaService.adventureIsland.findMany({
            where: {
                lostArkDate: {
                    gte: this.toDateText(fromDate),
                    lte: this.toDateText(toDate),
                },
            },
            orderBy: [{ lostArkDate: "asc" }, { startTime: "asc" }, { contentsName: "asc" }],
        });
        let syncedCount = 0;

        for (const adventureIsland of adventureIslands) {
            const rewardName = adventureIsland.rewardShortName ?? adventureIsland.rewardName ?? "";
            let calendarKey: AdventureIslandCalendarKey;

            try {
                calendarKey = this.getAdventureIslandCalendarKey(rewardName);
            } catch {
                continue;
            }

            const calendar = await this.getOrCreateAdventureIslandCalendar(calendarKey);
            const { startDateTime, endDateTime } = this.createAdventureIslandEventDateRange(
                adventureIsland.startTime,
            );
            const periodLabel = this.getPeriodLabel(adventureIsland.period);
            const titlePrefix = periodLabel ? `[${periodLabel}] ` : "";
            const title = `${titlePrefix}${adventureIsland.contentsName}`;
            const description = [adventureIsland.contentsName, rewardName].filter(Boolean).join(" / ");

            await this.prismaService.calendarEvent.upsert({
                where: {
                    sourceType_externalSourceType_externalSourceId: {
                        sourceType: CalendarEventSourceType.lostark,
                        externalSourceType: ADVENTURE_ISLAND_CALENDAR_SOURCE_TYPE,
                        externalSourceId: adventureIsland.id,
                    },
                },
                create: {
                    calendarId: calendar.id,
                    title,
                    description,
                    startDateTime,
                    endDateTime,
                    allDay: false,
                    color: null,
                    sourceType: CalendarEventSourceType.lostark,
                    externalSourceType: ADVENTURE_ISLAND_CALENDAR_SOURCE_TYPE,
                    externalSourceId: adventureIsland.id,
                    recurrenceRule: null,
                    alarmEnabled: false,
                    rawData: {
                        adventureIslandId: adventureIsland.id,
                        lostArkDate: adventureIsland.lostArkDate,
                        period: adventureIsland.period,
                        contentsName: adventureIsland.contentsName,
                        rewardName,
                        rewardIconUrl: adventureIsland.rewardIconUrl,
                        contentIconUrl:
                            adventureIsland.contentImageUrl ?? adventureIsland.contentIconUrl,
                    } as Prisma.InputJsonValue,
                },
                update: {
                    calendarId: calendar.id,
                    title,
                    description,
                    startDateTime,
                    endDateTime,
                    allDay: false,
                    externalSourceType: ADVENTURE_ISLAND_CALENDAR_SOURCE_TYPE,
                    externalSourceId: adventureIsland.id,
                    rawData: {
                        adventureIslandId: adventureIsland.id,
                        lostArkDate: adventureIsland.lostArkDate,
                        period: adventureIsland.period,
                        contentsName: adventureIsland.contentsName,
                        rewardName,
                        rewardIconUrl: adventureIsland.rewardIconUrl,
                        contentIconUrl:
                            adventureIsland.contentImageUrl ?? adventureIsland.contentIconUrl,
                    } as Prisma.InputJsonValue,
                },
            });

            syncedCount += 1;
        }

        return syncedCount;
    }

    /**
     * @public
     * @param fromDate Period start.
     * @param toDate Period end.
     * @returns Synced Lost Ark notice event count.
     */
    async syncLostArkNoticeEvents(fromDate: Date, toDate: Date) {
        const notices = await this.prismaService.lostArkNotice.findMany({
            where: {
                noticeDate: {
                    gte: fromDate,
                    lte: toDate,
                },
            },
            orderBy: [{ noticeDate: "asc" }, { title: "asc" }],
        });
        let syncedCount = 0;

        for (const notice of notices) {
            const calendarKey = this.getLostArkNoticeCalendarKey(notice.type);
            const calendar = await this.getOrCreateLostArkNoticeCalendar(calendarKey);
            const { startDateTime, endDateTime } = this.createAllDayEventDateRange(
                notice.noticeDate,
            );
            const title = notice.type ? `[${notice.type}] ${notice.title}` : notice.title;

            await this.prismaService.calendarEvent.upsert({
                where: {
                    sourceType_externalSourceType_externalSourceId: {
                        sourceType: CalendarEventSourceType.lostark,
                        externalSourceType: LOSTARK_NOTICE_CALENDAR_SOURCE_TYPE,
                        externalSourceId: notice.id,
                    },
                },
                create: {
                    calendarId: calendar.id,
                    title,
                    description: notice.title,
                    startDateTime,
                    endDateTime,
                    allDay: true,
                    color: null,
                    sourceType: CalendarEventSourceType.lostark,
                    externalSourceType: LOSTARK_NOTICE_CALENDAR_SOURCE_TYPE,
                    externalSourceId: notice.id,
                    recurrenceRule: null,
                    alarmEnabled: false,
                    rawData: {
                        noticeId: notice.id,
                        type: notice.type,
                        link: notice.link,
                    } as Prisma.InputJsonValue,
                },
                update: {
                    calendarId: calendar.id,
                    title,
                    description: notice.title,
                    startDateTime,
                    endDateTime,
                    allDay: true,
                    externalSourceType: LOSTARK_NOTICE_CALENDAR_SOURCE_TYPE,
                    externalSourceId: notice.id,
                    rawData: {
                        noticeId: notice.id,
                        type: notice.type,
                        link: notice.link,
                    } as Prisma.InputJsonValue,
                },
            });

            syncedCount += 1;
        }

        return syncedCount;
    }

    private async getCalendarEventsByRange(fromText: string, toText: string) {
        const fromDate = this.parseQueryDate(fromText);
        const toDate = this.parseQueryDate(toText, true);

        if (fromDate > toDate) {
            throw new BadRequestException("Invalid date range.");
        }

        await this.ensureDefaultCalendars();
        await this.syncAdventureIslandEvents(fromDate, toDate);
        await this.syncLostArkNoticeEvents(fromDate, toDate);

        const events = await this.prismaService.calendarEvent.findMany({
            where: {
                startDateTime: {
                    lte: toDate,
                },
                endDateTime: {
                    gte: fromDate,
                },
                calendar: {
                    isVisible: true,
                },
            },
            include: {
                calendar: true,
            },
            orderBy: [
                { startDateTime: "asc" },
                { calendar: { sortOrder: "asc" } },
                { title: "asc" },
            ],
        });

        return events.map((event) => this.mapCalendarEvent(event));
    }

    async getCalendarEvents(query: QueryCalendarEventsDto) {
        return this.getCalendarEventsByRange(query.from, query.to);
    }

    async getSchedules(startDate: string, endDate: string) {
        return this.getCalendarEventsByRange(startDate, endDate);
    }

    /**
     * @public
     * @param dto User event creation payload.
     * @returns Created user event with calendar and display color.
     */
    async createUserEvent(dto: CreateCalendarEventDto) {
        await this.assertUserCalendar(dto.calendarId);

        const event = await this.prismaService.calendarEvent.create({
            data: {
                calendarId: dto.calendarId,
                title: dto.title,
                description: dto.description,
                startDateTime: dto.startDateTime,
                endDateTime: dto.endDateTime,
                allDay: dto.allDay ?? false,
                color: dto.color,
                sourceType: CalendarEventSourceType.user,
                externalSourceType: null,
                externalSourceId: null,
                recurrenceRule: dto.recurrenceRule,
                alarmEnabled: dto.alarmEnabled ?? false,
            },
            include: {
                calendar: true,
            },
        });

        return this.mapCalendarEvent(event);
    }

    /**
     * @public
     * @param eventId User event id.
     * @param dto User event update payload.
     * @returns Updated user event with calendar and display color.
     */
    async updateUserEvent(eventId: string, dto: UpdateCalendarEventDto) {
        const storedEvent = await this.prismaService.calendarEvent.findUnique({
            where: {
                id: eventId,
            },
        });

        if (storedEvent == null) {
            throw new NotFoundException("Calendar event was not found.");
        }

        if (storedEvent.sourceType === CalendarEventSourceType.lostark) {
            throw new ForbiddenException("Lost Ark calendar events cannot be modified.");
        }

        if (dto.calendarId != null) {
            await this.assertUserCalendar(dto.calendarId);
        }

        const event = await this.prismaService.calendarEvent.update({
            where: {
                id: eventId,
            },
            data: {
                calendarId: dto.calendarId,
                title: dto.title,
                description: dto.description,
                startDateTime: dto.startDateTime,
                endDateTime: dto.endDateTime,
                allDay: dto.allDay,
                color: dto.color,
                recurrenceRule: dto.recurrenceRule,
                alarmEnabled: dto.alarmEnabled,
            },
            include: {
                calendar: true,
            },
        });

        return this.mapCalendarEvent(event);
    }

    /**
     * @public
     * @param eventId User event id.
     * @returns Deleted user event id.
     */
    async deleteUserEvent(eventId: string) {
        const storedEvent = await this.prismaService.calendarEvent.findUnique({
            where: {
                id: eventId,
            },
        });

        if (storedEvent == null) {
            throw new NotFoundException("Calendar event was not found.");
        }

        if (storedEvent.sourceType === CalendarEventSourceType.lostark) {
            throw new ForbiddenException("Lost Ark calendar events cannot be deleted.");
        }

        await this.prismaService.calendarEvent.delete({
            where: {
                id: eventId,
            },
        });

        return {
            id: eventId,
        };
    }
}
