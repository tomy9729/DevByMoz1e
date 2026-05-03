import { Injectable } from "@nestjs/common";
import { AdventureIslandPeriod } from "@prisma/client";
import { AdventureIslandsService } from "../lostark/services/adventure-islands.service";
import { CharactersService } from "../lostark/services/characters.service";
import { BOT_COMMANDS } from "./bot-command.constants";

type AdventureIslandQueryType = "today" | "tomorrow" | "date" | "week" | "month" | "weekday";

interface BotAdventureIsland {
    lostArkDate: string;
    period: AdventureIslandPeriod;
    shortName: string;
    contentsName: string;
    rewardShortName: string | null;
    rewardName: string | null;
    startTime: Date;
}

interface ParsedAdventureIslandQuery {
    type: AdventureIslandQueryType;
    title: string;
    date?: string;
    fromDate?: string;
    toDate?: string;
    weekdayIndex?: number;
    invalidInput?: string;
}

@Injectable()
export class BotCommandService {
    constructor(
        private readonly adventureIslandsService: AdventureIslandsService,
        private readonly charactersService: CharactersService,
    ) {}

    private readonly weekdayShortTexts = ["일", "월", "화", "수", "목", "금", "토"];

    private readonly weekdayIndexes: Record<string, number> = {
        일: 0,
        일요일: 0,
        월: 1,
        월요일: 1,
        화: 2,
        화요일: 2,
        수: 3,
        수요일: 3,
        목: 4,
        목요일: 4,
        금: 5,
        금요일: 5,
        토: 6,
        토요일: 6,
    };

    private padDatePart(value: number) {
        return String(value).padStart(2, "0");
    }

    private getKoreaDateText(date = new Date()) {
        return new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Seoul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(date);
    }

    private getKoreaWeekdayShortText(dateText: string) {
        return new Intl.DateTimeFormat("ko-KR", {
            timeZone: "Asia/Seoul",
            weekday: "short",
        })
            .format(this.createKoreaDate(dateText))
            .replace("요일", "");
    }

    private createKoreaDate(dateText: string) {
        return new Date(`${dateText}T00:00:00+09:00`);
    }

    private addKoreaDays(dateText: string, days: number) {
        const date = this.createKoreaDate(dateText);

        date.setUTCDate(date.getUTCDate() + days);

        return this.getKoreaDateText(date);
    }

    private formatLongDate(dateText: string) {
        return `${dateText} (${this.getKoreaWeekdayShortText(dateText)})`;
    }

    private formatShortDate(dateText: string) {
        return `${dateText.slice(5, 7)}/${dateText.slice(8, 10)}(${this.getKoreaWeekdayShortText(dateText)})`;
    }

    private isValidDateText(dateText: string) {
        return /^\d{4}-\d{2}-\d{2}$/.test(dateText) && this.getKoreaDateText(this.createKoreaDate(dateText)) === dateText;
    }

    private parseDateQuery(query: string, today: string) {
        const fullDateMatch = query.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        const shortDateMatch = query.match(/^(\d{1,2})\/(\d{1,2})$/);
        const koreanDateMatch = query.match(/^(\d{1,2})월\s*(\d{1,2})일?$/);
        let dateText: string | null = null;

        if (fullDateMatch) {
            dateText = `${fullDateMatch[1]}-${this.padDatePart(Number(fullDateMatch[2]))}-${this.padDatePart(Number(fullDateMatch[3]))}`;
        } else if (shortDateMatch || koreanDateMatch) {
            const match = (shortDateMatch ?? koreanDateMatch) as RegExpMatchArray;
            const year = today.slice(0, 4);

            dateText = `${year}-${this.padDatePart(Number(match[1]))}-${this.padDatePart(Number(match[2]))}`;
        }

        return dateText && this.isValidDateText(dateText) ? dateText : null;
    }

    private getMonthRange(today: string) {
        const year = Number(today.slice(0, 4));
        const month = Number(today.slice(5, 7));
        const lastDate = new Date(year, month, 0).getDate();

        return {
            fromDate: `${year}-${this.padDatePart(month)}-01`,
            toDate: `${year}-${this.padDatePart(month)}-${this.padDatePart(lastDate)}`,
        };
    }

    private getWeekRange(today: string) {
        const weekdayIndex = this.weekdayIndexes[this.getKoreaWeekdayShortText(today)];
        const mondayOffset = -((weekdayIndex + 6) % 7);

        return {
            fromDate: this.addKoreaDays(today, mondayOffset),
            toDate: this.addKoreaDays(today, mondayOffset + 6),
        };
    }

    private getNearestFutureWeekdayDate(today: string, targetWeekdayIndex: number) {
        const todayWeekdayIndex = this.weekdayIndexes[this.getKoreaWeekdayShortText(today)];
        const dayOffset = (targetWeekdayIndex - todayWeekdayIndex + 7) % 7 || 7;

        return this.addKoreaDays(today, dayOffset);
    }

    private parseAdventureIslandQuery(query?: string): ParsedAdventureIslandQuery {
        const today = this.getKoreaDateText();
        const normalizedQuery = String(query ?? "").trim();

        if (!normalizedQuery || normalizedQuery === "오늘") {
            return {
                type: "today",
                title: "모험섬",
                date: today,
            };
        }

        if (normalizedQuery === "내일") {
            return {
                type: "tomorrow",
                title: "모험섬 - 내일",
                date: this.addKoreaDays(today, 1),
            };
        }

        if (["주간", "이번주", "주별"].includes(normalizedQuery)) {
            return {
                type: "week",
                title: "모험섬 - 이번 주",
                ...this.getWeekRange(today),
            };
        }

        if (["월간", "이번달", "월별"].includes(normalizedQuery)) {
            return {
                type: "month",
                title: "모험섬 - 이번 달",
                ...this.getMonthRange(today),
            };
        }

        if (Object.prototype.hasOwnProperty.call(this.weekdayIndexes, normalizedQuery)) {
            const weekdayIndex = this.weekdayIndexes[normalizedQuery];

            return {
                type: "weekday",
                title: `모험섬 - ${this.weekdayShortTexts[weekdayIndex]}요일`,
                date: this.getNearestFutureWeekdayDate(today, weekdayIndex),
            };
        }

        const dateText = this.parseDateQuery(normalizedQuery, today);

        if (dateText) {
            return {
                type: "date",
                title: "모험섬",
                date: dateText,
            };
        }

        return {
            type: "today",
            title: "모험섬",
            date: today,
            invalidInput: normalizedQuery,
        };
    }

    private formatAdventureIslandLine({
        shortName,
        contentsName,
        rewardShortName,
        rewardName,
    }: BotAdventureIsland) {
        const islandName = shortName || contentsName;
        const displayRewardName = rewardShortName || rewardName || "보상 미확인";

        return `- ${islandName} : ${displayRewardName}`;
    }

    getCommandListMessage() {
        const categoryNames = Array.from(new Set(BOT_COMMANDS.map((command) => command.category)));
        const lines = ["[사용 가능한 명령어]"];

        categoryNames.forEach((categoryName) => {
            lines.push("", categoryName);

            BOT_COMMANDS.filter((command) => command.category === categoryName).forEach((command) => {
                command.usages.forEach((usage) => {
                    const commandNames = usage.names.map((name) => `!${name}`).join(", ");

                    lines.push(`- ${commandNames} : ${usage.description}`);
                });
            });
        });

        return lines.join("\n");
    }

    private formatAdventureIslandPeriodLines(
        adventureIslands: BotAdventureIsland[],
        period: AdventureIslandPeriod,
    ) {
        return adventureIslands
            .filter((adventureIsland) => adventureIsland.period === period)
            .map((adventureIsland) => this.formatAdventureIslandLine(adventureIsland));
    }

    private formatAdventureIslandDateLines(
        adventureIslands: BotAdventureIsland[],
        dateText: string,
        useShortDate: boolean,
    ) {
        const lines = [useShortDate ? this.formatShortDate(dateText) : this.formatLongDate(dateText)];
        const morningLines = this.formatAdventureIslandPeriodLines(
            adventureIslands,
            AdventureIslandPeriod.weekendMorning,
        );
        const afternoonLines = this.formatAdventureIslandPeriodLines(
            adventureIslands,
            AdventureIslandPeriod.weekendAfternoon,
        );

        if (morningLines.length > 0 || afternoonLines.length > 0) {
            if (morningLines.length > 0) {
                lines.push("오전", ...morningLines);
            }

            if (afternoonLines.length > 0) {
                lines.push("오후", ...afternoonLines);
            }

            return lines;
        }

        return [
            ...lines,
            ...this.formatAdventureIslandPeriodLines(adventureIslands, AdventureIslandPeriod.weekday),
        ];
    }

    private formatAdventureIslandExamples() {
        return ["확인 가능한 예시:", "!모험섬", "!모험섬 주간", "!모험섬 2026-04-25"];
    }

    private formatNoAdventureIslandMessage(title: string) {
        return [`[${title}]`, "조회 결과가 없습니다.", "", ...this.formatAdventureIslandExamples()].join("\n");
    }

    private formatAdventureIslandErrorMessage(title: string) {
        return [`[${title}]`, "모험섬 정보를 조회하지 못했습니다.", "", ...this.formatAdventureIslandExamples()].join("\n");
    }

    private groupAdventureIslandsByDate(adventureIslands: BotAdventureIsland[]) {
        const dateGroups = new Map<string, BotAdventureIsland[]>();

        adventureIslands.forEach((adventureIsland) => {
            const dateItems = dateGroups.get(adventureIsland.lostArkDate) ?? [];

            dateItems.push(adventureIsland);
            dateGroups.set(adventureIsland.lostArkDate, dateItems);
        });

        return Array.from(dateGroups.entries());
    }

    private filterAdventureIslandsByWeekday(
        adventureIslands: BotAdventureIsland[],
        weekdayIndex?: number,
    ) {
        if (weekdayIndex === undefined) {
            return adventureIslands;
        }

        return adventureIslands.filter(
            (adventureIsland) =>
                this.weekdayIndexes[this.getKoreaWeekdayShortText(adventureIsland.lostArkDate)] === weekdayIndex,
        );
    }

    private formatAdventureIslandResult(
        parsedQuery: ParsedAdventureIslandQuery,
        adventureIslands: BotAdventureIsland[],
    ) {
        if (adventureIslands.length === 0) {
            return this.formatNoAdventureIslandMessage(parsedQuery.title);
        }

        const lines = [`[${parsedQuery.title}]`];
        const isSingleDate = Boolean(parsedQuery.date);

        this.groupAdventureIslandsByDate(adventureIslands).forEach(([dateText, dateItems], index) => {
            if (index > 0) {
                lines.push("");
            }

            lines.push(...this.formatAdventureIslandDateLines(dateItems, dateText, !isSingleDate));
        });

        if (isSingleDate) {
            lines.push("", "다른 조회:", "!모험섬 주간", "!모험섬 월간", "!모험섬 토");
        }

        return lines.join("\n");
    }

    async getAdventureIslandsMessage(query?: string) {
        const parsedQuery = this.parseAdventureIslandQuery(query);

        if (parsedQuery.invalidInput) {
            return [
                "[모험섬]",
                `지원하지 않는 조회 조건입니다: ${parsedQuery.invalidInput}`,
                "",
                ...this.formatAdventureIslandExamples(),
            ].join("\n");
        }

        const adventureIslands = await this.adventureIslandsService
            .getAdventureIslandsFromDatabaseFirst({
                date: parsedQuery.date,
                fromDate: parsedQuery.fromDate,
                toDate: parsedQuery.toDate,
            })
            .catch(() => null);

        if (!adventureIslands) {
            return this.formatAdventureIslandErrorMessage(parsedQuery.title);
        }

        return this.formatAdventureIslandResult(
            parsedQuery,
            this.filterAdventureIslandsByWeekday(adventureIslands, parsedQuery.weekdayIndex),
        );
    }

    private formatInvalidCharacterNameMessage() {
        return [
            "[캐릭터 정보]",
            "캐릭터명을 입력해 주세요.",
            "",
            "예시:",
            "!캐릭명",
            "!캐릭명 새로고침",
            "!캐릭명 장비",
            "!캐릭명 보석",
            "!캐릭명 카드",
        ].join("\n");
    }

    async getCharacterMessage(name?: string, section?: string) {
        const characterName = String(name ?? "").trim();
        const sectionName = String(section ?? "").trim();

        if (!characterName) {
            return this.formatInvalidCharacterNameMessage();
        }

        const result = await this.charactersService.getCharacterMessage(characterName, {
            section: sectionName || undefined,
        });

        return result.message;
    }

    async refreshCharacterMessage(name?: string) {
        const characterName = String(name ?? "").trim();

        if (!characterName) {
            return this.formatInvalidCharacterNameMessage();
        }

        const result = await this.charactersService.getCharacterMessage(characterName, {
            forceRefresh: true,
        });

        return result.message;
    }
}
