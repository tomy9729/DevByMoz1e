import { Injectable } from "@nestjs/common";
import { AdventureIslandPeriod } from "@prisma/client";
import { AdventureIslandsService } from "../lostark/services/adventure-islands.service";
import { BOT_COMMANDS } from "./bot-command.constants";

interface BotAdventureIsland {
    lostArkDate: string;
    period: AdventureIslandPeriod;
    shortName: string;
    contentsName: string;
    rewardShortName: string | null;
    rewardName: string | null;
    startTime: string;
}

@Injectable()
export class BotCommandService {
    constructor(private readonly adventureIslandsService: AdventureIslandsService) {}

    private getKoreaDateText(date = new Date()) {
        return new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Seoul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(date);
    }

    private getKoreaWeekdayText(date = new Date()) {
        return new Intl.DateTimeFormat("ko-KR", {
            timeZone: "Asia/Seoul",
            weekday: "long",
        }).format(date);
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
        const basicCommands = BOT_COMMANDS.filter((command) => command.category === "기본");
        const categoryNames = Array.from(
            new Set(
                BOT_COMMANDS.filter((command) => command.category !== "기본").map(
                    (command) => command.category,
                ),
            ),
        );
        const lines = ["[명령어]"];

        basicCommands.forEach((command) => {
            const commandNames = command.names.map((name) => `!${name}`).join(" ");

            lines.push(`${commandNames} : ${command.description}`);
        });

        categoryNames.forEach((categoryName) => {
            lines.push("", `#${categoryName}`);

            BOT_COMMANDS.filter((command) => command.category === categoryName).forEach((command) => {
                const commandNames = command.names.map((name) => `!${name}`).join(" ");

                lines.push(`${commandNames} : ${command.description}`);
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

    async getAdventureIslandsMessage() {
        const now = new Date();
        const today = this.getKoreaDateText(now);
        const weekday = this.getKoreaWeekdayText(now);
        const adventureIslands = await this.adventureIslandsService
            .getAdventureIslandsFromDatabaseFirst({
                date: today,
            })
            .catch(() => null);

        if (!adventureIslands) {
            return `${weekday} 모험섬\n모험섬 정보를 조회하지 못했습니다.`;
        }

        if (adventureIslands.length === 0) {
            return `${weekday} 모험섬\n조회된 모험섬 정보가 없습니다.`;
        }

        const morningLines = this.formatAdventureIslandPeriodLines(
            adventureIslands,
            AdventureIslandPeriod.weekendMorning,
        );
        const afternoonLines = this.formatAdventureIslandPeriodLines(
            adventureIslands,
            AdventureIslandPeriod.weekendAfternoon,
        );

        if (morningLines.length > 0 || afternoonLines.length > 0) {
            const lines = [`${weekday} 모험섬`];

            if (morningLines.length > 0) {
                lines.push("오전", ...morningLines);
            }

            if (afternoonLines.length > 0) {
                lines.push("오후", ...afternoonLines);
            }

            return lines.join("\n");
        }

        return [
            `${weekday} 모험섬`,
            ...this.formatAdventureIslandPeriodLines(adventureIslands, AdventureIslandPeriod.weekday),
        ].join("\n");
    }
}
