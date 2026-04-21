import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LostArkGameContent, LostArkNotice } from "../lostark/lostark.types";
import { AdventureIslandsService } from "../lostark/services/adventure-islands.service";
import { LostArkGameContentsService } from "../lostark/services/lostark-game-contents.service";
import { LostArkNoticesService } from "../lostark/services/lostark-notices.service";

export type BotAlarmType = "weeklyNotice" | "dailyContents";
type BotAlarmAckStatus = "sent" | "failed";

interface BotAlarmCandidate {
    type: BotAlarmType;
    scheduleKey: string;
}

export interface BotAlarmMessage {
    deliveryId: string;
    alarmType: BotAlarmType;
    scheduleKey: string;
    targets: Array<{
        room: string;
        packageName: string | null;
    }>;
    message: string;
}

@Injectable()
export class BotAlarmService {
    private readonly logger = new Logger(BotAlarmService.name);
    private readonly globalSettingKey = "global";

    constructor(
        private readonly prismaService: PrismaService,
        private readonly adventureIslandsService: AdventureIslandsService,
        private readonly lostArkGameContentsService: LostArkGameContentsService,
        private readonly lostArkNoticesService: LostArkNoticesService,
    ) {}

    private getKoreaDateParts(date = new Date()) {
        const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Seoul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            weekday: "short",
            hour12: false,
        }).formatToParts(date);
        const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));

        return {
            dateText: `${partMap.year}-${partMap.month}-${partMap.day}`,
            hour: partMap.hour,
            minute: partMap.minute,
            weekday: partMap.weekday,
        };
    }

    private createKoreaDate(dateText: string) {
        return new Date(`${dateText}T00:00:00+09:00`);
    }

    private getKoreaWeekdayShortText(dateText: string) {
        return new Intl.DateTimeFormat("ko-KR", {
            timeZone: "Asia/Seoul",
            weekday: "short",
        })
            .format(this.createKoreaDate(dateText))
            .replace("요일", "");
    }

    private getNoticeKoreaDateText(notice: LostArkNotice) {
        return new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Seoul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(new Date(notice.Date));
    }

    private normalizeText(value = "") {
        return value.replace(/\s+/g, "").toLowerCase();
    }

    private parseDateTime(dateTime: string) {
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

    private formatDateParts(year: number, month: number, day: number) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    private getWeeklyNoticeTestDateText(date = new Date()) {
        const { dateText, hour, weekday } = this.getKoreaDateParts(date);
        const { year, month, day } = this.parseDateTime(dateText);
        const targetDate = new Date(Date.UTC(year, month - 1, day));
        let wednesdayOffset = (targetDate.getUTCDay() + 7 - 3) % 7;

        if (weekday === "Wed" && Number(hour) < 10) {
            wednesdayOffset = 7;
        }

        targetDate.setUTCDate(targetDate.getUTCDate() - wednesdayOffset);

        return this.formatDateParts(
            targetDate.getUTCFullYear(),
            targetDate.getUTCMonth() + 1,
            targetDate.getUTCDate(),
        );
    }

    private toLostArkDateOnly(dateTime: string) {
        const { year, month, day, hour } = this.parseDateTime(dateTime);
        const targetDate = new Date(year, month - 1, day);

        if (hour < 6) {
            targetDate.setDate(targetDate.getDate() - 1);
        }

        return this.formatDateParts(
            targetDate.getFullYear(),
            targetDate.getMonth() + 1,
            targetDate.getDate(),
        );
    }

    private formatStartTime(dateTime: string) {
        const { hour, minute } = this.parseDateTime(dateTime);

        return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }

    private getAlarmCandidates(date = new Date()): BotAlarmCandidate[] {
        const koreaDateParts = this.getKoreaDateParts(date);
        const candidates: BotAlarmCandidate[] = [];

        if (koreaDateParts.weekday === "Wed" && koreaDateParts.hour === "10" && koreaDateParts.minute === "01") {
            candidates.push({
                type: "weeklyNotice",
                scheduleKey: koreaDateParts.dateText,
            });
        }

        if (koreaDateParts.hour === "18" && koreaDateParts.minute === "50") {
            candidates.push({
                type: "dailyContents",
                scheduleKey: koreaDateParts.dateText,
            });
        }

        return candidates;
    }

    private async isGloballyEnabled() {
        const setting = await this.prismaService.botAlarmSetting.findUnique({
            where: {
                key: this.globalSettingKey,
            },
        });

        return setting?.enabled ?? true;
    }

    private async getEnabledTargets() {
        return this.prismaService.botAlarmTarget.findMany({
            where: {
                enabled: true,
            },
            orderBy: [{ createdAt: "asc" }],
        });
    }

    private async createDelivery(candidate: BotAlarmCandidate, message: string) {
        try {
            return await this.prismaService.botAlarmDelivery.create({
                data: {
                    alarmType: candidate.type,
                    scheduleKey: candidate.scheduleKey,
                    status: "pending",
                    message,
                },
            });
        } catch (error) {
            this.logger.warn(
                `Skipped duplicated bot alarm. type=${candidate.type}, scheduleKey=${candidate.scheduleKey}`,
            );
            return null;
        }
    }

    private async markSkipped(candidate: BotAlarmCandidate, status: string, errorReason?: string) {
        try {
            await this.prismaService.botAlarmDelivery.create({
                data: {
                    alarmType: candidate.type,
                    scheduleKey: candidate.scheduleKey,
                    status,
                    errorReason,
                },
            });
        } catch (error) {
            this.logger.warn(
                `Skipped duplicated bot alarm skip record. type=${candidate.type}, scheduleKey=${candidate.scheduleKey}`,
            );
        }
    }

    private findNoticeByKeywords(notices: LostArkNotice[], keywords: string[]) {
        return notices.find((notice) => {
            const title = this.normalizeText(notice.Title);

            return keywords.some((keyword) => title.includes(this.normalizeText(keyword)));
        });
    }

    private formatNoticeSummary(notice: LostArkNotice) {
        return `요약: ${notice.Title}`;
    }

    private async buildWeeklyNoticeMessage(dateText: string) {
        let notices: LostArkNotice[];

        try {
            const collectedNotices = await this.lostArkNoticesService.collectNotices();

            notices = collectedNotices.items;
        } catch (error) {
            this.logger.error(`Failed to collect notices for weekly alarm. date=${dateText}`, error);
            return null;
        }

        const todayNotices = notices.filter((notice) => this.getNoticeKoreaDateText(notice) === dateText);
        const patchNotice = this.findNoticeByKeywords(todayNotices, ["패치노트", "업데이트"]);
        const packageNotice = this.findNoticeByKeywords(todayNotices, ["패키지"]);

        if (!patchNotice && !packageNotice) {
            return null;
        }

        const lines = [`[로스트아크 공지 알람]`, `${dateText} (${this.getKoreaWeekdayShortText(dateText)})`];

        if (patchNotice) {
            lines.push("", "패치노트", patchNotice.Title, patchNotice.Link, this.formatNoticeSummary(patchNotice));
        }

        if (packageNotice) {
            lines.push("", "패키지 공지", packageNotice.Title, packageNotice.Link, this.formatNoticeSummary(packageNotice));
        }

        return lines.join("\n");
    }

    private isTargetCalendarContent(content: LostArkGameContent, keywords: string[]) {
        const categoryName = this.normalizeText(content.CategoryName);
        const contentsName = this.normalizeText(content.ContentsName);

        return keywords.some((keyword) => {
            const normalizedKeyword = this.normalizeText(keyword);

            return categoryName.includes(normalizedKeyword) || contentsName.includes(normalizedKeyword);
        });
    }

    private getContentTimesByDate(contents: LostArkGameContent[], dateText: string, keywords: string[]) {
        const times: string[] = [];

        contents
            .filter((content) => this.isTargetCalendarContent(content, keywords))
            .forEach((content) => {
                (content.StartTimes ?? []).forEach((startTime) => {
                    if (this.toLostArkDateOnly(startTime) === dateText) {
                        times.push(this.formatStartTime(startTime));
                    }
                });
            });

        return Array.from(new Set(times)).sort();
    }

    private formatContentExistsLine(label: string, times: string[]) {
        if (times.length === 0) {
            return `${label}: 없음`;
        }

        return `${label}: 있음 (${times.join(", ")})`;
    }

    private async buildDailyContentsMessage(dateText: string) {
        const adventureIslands = await this.adventureIslandsService
            .getAdventureIslandsFromDatabaseFirst({
                date: dateText,
            })
            .catch((error) => {
                this.logger.error(`Failed to collect adventure islands for daily alarm. date=${dateText}`, error);
                return null;
            });
        const calendarContents = await this.lostArkGameContentsService.collectCalendarContents().catch((error) => {
            this.logger.error(`Failed to collect calendar contents for daily alarm. date=${dateText}`, error);
            return null;
        });

        if (!adventureIslands || !calendarContents) {
            return null;
        }

        const lines = [`[로스트아크 콘텐츠 알람]`, `${dateText} (${this.getKoreaWeekdayShortText(dateText)})`, "", "모험섬"];

        if (adventureIslands.length === 0) {
            lines.push("- 없음");
        } else {
            adventureIslands.forEach((adventureIsland) => {
                lines.push(
                    `- ${adventureIsland.shortName || adventureIsland.contentsName}: ${adventureIsland.rewardShortName || adventureIsland.rewardName || "보상 미확인"}`,
                );
            });
        }

        lines.push(
            "",
            this.formatContentExistsLine(
                "필드보스",
                this.getContentTimesByDate(calendarContents, dateText, ["필드보스", "필드 보스"]),
            ),
            this.formatContentExistsLine(
                "카오스게이트",
                this.getContentTimesByDate(calendarContents, dateText, ["카오스게이트", "카오스 게이트"]),
            ),
        );

        return lines.join("\n");
    }

    private async buildAlarmMessage(candidate: BotAlarmCandidate) {
        if (candidate.type === "weeklyNotice") {
            return this.buildWeeklyNoticeMessage(candidate.scheduleKey);
        }

        return this.buildDailyContentsMessage(candidate.scheduleKey);
    }

    async getDueAlarms(date = new Date()): Promise<BotAlarmMessage[]> {
        const candidates = this.getAlarmCandidates(date);

        if (candidates.length === 0) {
            return [];
        }

        const enabled = await this.isGloballyEnabled();

        if (!enabled) {
            this.logger.log(`Skipped bot alarm because global alarm is disabled. count=${candidates.length}`);
            return [];
        }

        const targets = await this.getEnabledTargets();

        if (targets.length === 0) {
            this.logger.warn(`Skipped bot alarm because no enabled target room exists. count=${candidates.length}`);
            return [];
        }

        const result: BotAlarmMessage[] = [];

        for (const candidate of candidates) {
            const existingDelivery = await this.prismaService.botAlarmDelivery.findUnique({
                where: {
                    alarmType_scheduleKey: {
                        alarmType: candidate.type,
                        scheduleKey: candidate.scheduleKey,
                    },
                },
            });

            if (existingDelivery) {
                continue;
            }

            const message = await this.buildAlarmMessage(candidate);

            if (!message) {
                await this.markSkipped(candidate, "skipped");
                this.logger.log(
                    `Skipped bot alarm because message was empty. type=${candidate.type}, scheduleKey=${candidate.scheduleKey}`,
                );
                continue;
            }

            const delivery = await this.createDelivery(candidate, message);

            if (!delivery) {
                continue;
            }

            this.logger.log(
                `Created bot alarm delivery. id=${delivery.id}, type=${candidate.type}, scheduleKey=${candidate.scheduleKey}, targets=${targets.length}`,
            );
            result.push({
                deliveryId: delivery.id,
                alarmType: candidate.type,
                scheduleKey: candidate.scheduleKey,
                targets: targets.map((target) => ({
                    room: target.room,
                    packageName: target.packageName,
                })),
                message,
            });
        }

        return result;
    }

    async ackDelivery(id: string, status: BotAlarmAckStatus, errorReason?: string) {
        const delivery = await this.prismaService.botAlarmDelivery.update({
            where: {
                id,
            },
            data: {
                status,
                errorReason: errorReason || null,
            },
        });

        if (status === "sent") {
            this.logger.log(`Bot alarm sent. id=${id}, type=${delivery.alarmType}, scheduleKey=${delivery.scheduleKey}`);
        } else {
            this.logger.warn(
                `Bot alarm failed. id=${id}, type=${delivery.alarmType}, scheduleKey=${delivery.scheduleKey}, reason=${errorReason ?? ""}`,
            );
        }

        return delivery;
    }

    async setGlobalEnabled(enabled: boolean) {
        await this.prismaService.botAlarmSetting.upsert({
            where: {
                key: this.globalSettingKey,
            },
            create: {
                key: this.globalSettingKey,
                enabled,
            },
            update: {
                enabled,
            },
        });

        return enabled ? "알람이 켜졌습니다." : "알람이 꺼졌습니다.";
    }

    async getStatusMessage() {
        const enabled = await this.isGloballyEnabled();
        const targets = await this.getEnabledTargets();
        const lines = ["[알람 상태]", `전체 알람: ${enabled ? "ON" : "OFF"}`, "", "대상 채팅방"];

        if (targets.length === 0) {
            lines.push("- 등록된 대상 없음");
        } else {
            targets.forEach((target) => {
                lines.push(`- ${target.room}`);
            });
        }

        return lines.join("\n");
    }

    async registerTarget(room?: string, packageName?: string) {
        const targetRoom = String(room ?? "").trim();
        const targetPackageName = String(packageName ?? "").trim();

        if (!targetRoom) {
            return "알람 대상 채팅방을 확인할 수 없습니다.";
        }

        await this.prismaService.botAlarmTarget.upsert({
            where: {
                room: targetRoom,
            },
            create: {
                room: targetRoom,
                packageName: targetPackageName || null,
                enabled: true,
            },
            update: {
                packageName: targetPackageName || null,
                enabled: true,
            },
        });

        return `알람 대상 채팅방으로 등록했습니다.\n- ${targetRoom}`;
    }

    async unregisterTarget(room?: string) {
        const targetRoom = String(room ?? "").trim();

        if (!targetRoom) {
            return "알람 대상 채팅방을 확인할 수 없습니다.";
        }

        await this.prismaService.botAlarmTarget.updateMany({
            where: {
                room: targetRoom,
            },
            data: {
                enabled: false,
            },
        });

        return `알람 대상 채팅방에서 해제했습니다.\n- ${targetRoom}`;
    }

    async getTestAlarmMessage(type: BotAlarmType) {
        const dateText =
            type === "weeklyNotice" ? this.getWeeklyNoticeTestDateText() : this.getKoreaDateParts().dateText;
        const candidate: BotAlarmCandidate = {
            type,
            scheduleKey: dateText,
        };
        const message = await this.buildAlarmMessage(candidate);

        if (!message) {
            this.logger.warn(`Failed to create test bot alarm. type=${type}, scheduleKey=${dateText}`);
            return [
                "[알람 테스트 실패]",
                `type: ${type}`,
                `조회 기준일: ${dateText} (${this.getKoreaWeekdayShortText(dateText)})`,
                "테스트 메시지를 생성하지 못했습니다. 서버 로그를 확인해 주세요.",
            ].join("\n");
        }

        this.logger.log(`Created test bot alarm. type=${type}, scheduleKey=${dateText}`);

        return message;
    }
}
