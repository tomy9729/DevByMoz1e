import { Injectable } from "@nestjs/common";
import { AdventureIsland, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { extractAdventureIslandRecords } from "../adventure-island.util";
import { QueryAdventureIslandsDto } from "../dto/query-adventure-islands.dto";
import { LostArkClient } from "../lostark.client";

@Injectable()
export class AdventureIslandsService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly lostArkClient: LostArkClient,
    ) {}

    async collectAdventureIslands() {
        const calendarContents = await this.lostArkClient.fetchCalendarContents();
        const records = extractAdventureIslandRecords(calendarContents);
        const collectedAt = new Date();

        for (const record of records) {
            await this.prismaService.adventureIsland.upsert({
                where: {
                    lostArkDate_period_contentsName: {
                        lostArkDate: record.lostArkDate,
                        period: record.period,
                        contentsName: record.contentsName,
                    },
                },
                create: {
                    ...record,
                    rawData: record.rawData as unknown as Prisma.InputJsonValue,
                    collectedAt,
                },
                update: {
                    categoryName: record.categoryName,
                    shortName: record.shortName,
                    rewardName: record.rewardName,
                    rewardShortName: record.rewardShortName,
                    rewardIconUrl: record.rewardIconUrl,
                    contentIconUrl: record.contentIconUrl,
                    contentImageUrl: record.contentImageUrl,
                    startTime: record.startTime,
                    rawData: record.rawData as unknown as Prisma.InputJsonValue,
                    collectedAt,
                },
            });
        }

        return {
            collectedAt,
            count: records.length,
            items: records,
        };
    }

    async getAdventureIslands(query: QueryAdventureIslandsDto): Promise<AdventureIsland[]> {
        return this.prismaService.adventureIsland.findMany({
            where: {
                period: query.period,
                lostArkDate: query.date
                    ? query.date
                    : query.fromDate || query.toDate
                      ? {
                            gte: query.fromDate,
                            lte: query.toDate,
                        }
                      : undefined,
            },
            orderBy: [{ lostArkDate: "asc" }, { startTime: "asc" }, { contentsName: "asc" }],
        });
    }
}
