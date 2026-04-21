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

    private getPeriodLabel(period: AdventureIslandPeriod) {
        const labels: Record<AdventureIslandPeriod, string> = {
            weekday: "",
            weekendMorning: "오전",
            weekendAfternoon: "오후",
        };

        return labels[period];
    }

    private getTimeText(startTime: string) {
        const timeText = startTime.split("T")[1]?.slice(0, 5);

        return timeText || "--:--";
    }

    private formatAdventureIslandLine(adventureIsland: BotAdventureIsland) {
        const periodLabel = this.getPeriodLabel(adventureIsland.period);
        const periodText = periodLabel ? `[${periodLabel}] ` : "";
        const islandName = adventureIsland.shortName || adventureIsland.contentsName;
        const rewardName =
            adventureIsland.rewardShortName || adventureIsland.rewardName || "보상 미확인";

        return `- ${periodText}${this.getTimeText(adventureIsland.startTime)} ${islandName} / ${rewardName}`;
    }

    getCommandListMessage() {
        const lines = [
            "사용 가능한 명령어",
            ...BOT_COMMANDS.map((command) => {
                const commandNames = command.names.map((name) => `!${name}`).join(", ");

                return `${commandNames} - ${command.description}`;
            }),
        ];

        return lines.join("\n");
    }

    async getAdventureIslandsMessage() {
        const today = this.getKoreaDateText();
        const adventureIslands = await this.adventureIslandsService
            .getAdventureIslandsFromDatabaseFirst({
                date: today,
            })
            .catch(() => null);

        if (!adventureIslands) {
            return `[모험섬] ${today}\n모험섬 정보를 조회하지 못했습니다.`;
        }

        if (adventureIslands.length === 0) {
            return `[모험섬] ${today}\n조회된 모험섬 정보가 없습니다.`;
        }

        return [
            `[모험섬] ${today}`,
            ...adventureIslands.map((adventureIsland) =>
                this.formatAdventureIslandLine(adventureIsland),
            ),
        ].join("\n");
    }
}
