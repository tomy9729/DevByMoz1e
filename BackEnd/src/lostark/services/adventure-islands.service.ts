import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
    ADVENTURE_ISLAND_TEST_NOTE_SOURCE_KEY,
    buildAdventureIslandTestSeedRecords,
} from "../adventure-island-test-note";
import { extractAdventureIslandRecords } from "../adventure-island.util";
import { QueryAdventureIslandsDto } from "../dto/query-adventure-islands.dto";
import { LostArkClient } from "../lostark.client";

@Injectable()
export class AdventureIslandsService {
    private readonly adventureIslandSelect = {
        id: true,
        lostArkDate: true,
        period: true,
        categoryName: true,
        contentsName: true,
        shortName: true,
        rewardName: true,
        rewardShortName: true,
        rewardIconUrl: true,
        contentIconUrl: true,
        contentImageUrl: true,
        startTime: true,
        rawData: true,
        collectedAt: true,
        createdAt: true,
        updatedAt: true,
    };
    private adventureIslandShortNamesNormalized = false;

    constructor(
        private readonly prismaService: PrismaService,
        private readonly lostArkClient: LostArkClient,
    ) {}

    private async normalizeAdventureIslandShortNames() {
        if (this.adventureIslandShortNamesNormalized) {
            return;
        }

        const storedAdventureIslands = await this.prismaService.adventureIsland.findMany({
            select: {
                id: true,
                contentsName: true,
                shortName: true,
            },
        });

        for (const adventureIsland of storedAdventureIslands) {
            if (adventureIsland.shortName === adventureIsland.contentsName) {
                continue;
            }

            await this.prismaService.adventureIsland.update({
                where: {
                    id: adventureIsland.id,
                },
                data: {
                    shortName: adventureIsland.contentsName,
                },
            });
        }

        this.adventureIslandShortNamesNormalized = true;
    }

    private matchesAdventureIslandQuery(
        adventureIsland: {
            lostArkDate: string;
            period: string;
        },
        query: QueryAdventureIslandsDto,
    ) {
        if (query.period && adventureIsland.period !== query.period) {
            return false;
        }

        if (query.date) {
            return adventureIsland.lostArkDate === query.date;
        }

        if (query.fromDate && adventureIsland.lostArkDate < query.fromDate) {
            return false;
        }

        if (query.toDate && adventureIsland.lostArkDate > query.toDate) {
            return false;
        }

        return true;
    }

    private buildLostArkDateFilter(query: QueryAdventureIslandsDto) {
        return query.date
            ? query.date
            : query.fromDate || query.toDate
              ? {
                    gte: query.fromDate,
                    lte: query.toDate,
                }
              : undefined;
    }

    private buildAdventureIslandWhereInput(
        query: QueryAdventureIslandsDto,
    ): Prisma.AdventureIslandWhereInput {
        return {
            period: query.period,
            lostArkDate: this.buildLostArkDateFilter(query),
        };
    }

    private async saveAdventureIslands(collectedAt = new Date()) {
        const calendarContents = await this.lostArkClient.fetchCalendarContents();
        const records = extractAdventureIslandRecords(calendarContents);

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
                    sourceType: "api",
                    sourceKey: null,
                    rawData: record.rawData as unknown as Prisma.InputJsonValue,
                    collectedAt,
                },
                update: {
                    categoryName: record.categoryName,
                    shortName: record.shortName,
                    sourceType: "api",
                    sourceKey: null,
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

        return records;
    }

    async collectAdventureIslands() {
        const collectedAt = new Date();
        const records = await this.saveAdventureIslands(collectedAt);

        return {
            collectedAt,
            count: records.length,
            items: records,
        };
    }

    async getAdventureIslands(query: QueryAdventureIslandsDto) {
        await this.normalizeAdventureIslandShortNames();

        return this.prismaService.adventureIsland.findMany({
            where: this.buildAdventureIslandWhereInput(query),
            select: this.adventureIslandSelect,
            orderBy: [{ lostArkDate: "asc" }, { startTime: "asc" }, { contentsName: "asc" }],
        });
    }

    async getAdventureIslandsFromDatabaseFirst(query: QueryAdventureIslandsDto) {
        const storedAdventureIslands = await this.getAdventureIslands(query);

        if (storedAdventureIslands.length > 0) {
            return storedAdventureIslands;
        }

        await this.saveAdventureIslands();

        return this.getAdventureIslands(query);
    }

    private async getAdventureIslandAssetMap(contentsNames: string[]) {
        const latestAdventureIslands = await this.prismaService.adventureIsland.findMany({
            where: {
                contentsName: {
                    in: contentsNames,
                },
            },
            select: {
                contentsName: true,
                contentIconUrl: true,
                contentImageUrl: true,
                collectedAt: true,
            },
            orderBy: [{ collectedAt: "desc" }, { createdAt: "desc" }],
        });
        const assetMap = new Map<
            string,
            {
                contentIconUrl: string | null;
                contentImageUrl: string | null;
            }
        >();

        for (const item of latestAdventureIslands) {
            if (assetMap.has(item.contentsName)) {
                continue;
            }

            assetMap.set(item.contentsName, {
                contentIconUrl: item.contentIconUrl,
                contentImageUrl: item.contentImageUrl,
            });
        }

        return assetMap;
    }

    async importAdventureIslandTestNoteData() {
        const collectedAt = new Date();
        const seedRecords = buildAdventureIslandTestSeedRecords();
        const assetMap = await this.getAdventureIslandAssetMap(
            [...new Set(seedRecords.map((item) => item.contentsName))],
        );

        await this.prismaService.adventureIsland.deleteMany({
            where: {
                sourceType: "manual",
                sourceKey: ADVENTURE_ISLAND_TEST_NOTE_SOURCE_KEY,
            } as Prisma.AdventureIslandWhereInput,
        });

        for (const record of seedRecords) {
            const asset = assetMap.get(record.contentsName);

            await this.prismaService.adventureIsland.upsert({
                where: {
                    lostArkDate_period_contentsName: {
                        lostArkDate: record.lostArkDate,
                        period: record.period,
                        contentsName: record.contentsName,
                    },
                },
                create: {
                    lostArkDate: record.lostArkDate,
                    period: record.period,
                    categoryName: record.categoryName,
                    contentsName: record.contentsName,
                    shortName: record.shortName,
                    sourceType: "manual",
                    sourceKey: record.sourceKey,
                    rewardName: record.rewardName,
                    rewardShortName: record.rewardShortName,
                    rewardIconUrl: record.rewardIconUrl,
                    contentIconUrl: asset?.contentIconUrl ?? null,
                    contentImageUrl: asset?.contentImageUrl ?? null,
                    startTime: record.startTime,
                    rawData: record.rawData as unknown as Prisma.InputJsonValue,
                    collectedAt,
                },
                update: {
                    categoryName: record.categoryName,
                    shortName: record.shortName,
                    sourceType: "manual",
                    sourceKey: record.sourceKey,
                    rewardName: record.rewardName,
                    rewardShortName: record.rewardShortName,
                    rewardIconUrl: record.rewardIconUrl,
                    contentIconUrl: asset?.contentIconUrl ?? null,
                    contentImageUrl: asset?.contentImageUrl ?? null,
                    startTime: record.startTime,
                    rawData: record.rawData as unknown as Prisma.InputJsonValue,
                    collectedAt,
                },
            });
        }

        return this.getAdventureIslandTestNoteData();
    }

    async getAdventureIslandTestNoteData(query?: QueryAdventureIslandsDto) {
        const testAdventureIslands = await this.prismaService.adventureIsland.findMany({
            where: {
                sourceType: "manual",
                sourceKey: ADVENTURE_ISLAND_TEST_NOTE_SOURCE_KEY,
                period: query?.period,
            } as Prisma.AdventureIslandWhereInput,
            select: this.adventureIslandSelect,
            orderBy: [{ lostArkDate: "asc" }, { startTime: "asc" }, { contentsName: "asc" }],
        });

        return testAdventureIslands.filter((adventureIsland) =>
            this.matchesAdventureIslandQuery(adventureIsland, query ?? {}),
        );
    }

    async deleteAdventureIslandTestNoteData() {
        const deleteResult = await this.prismaService.adventureIsland.deleteMany({
            where: {
                sourceType: "manual",
                sourceKey: ADVENTURE_ISLAND_TEST_NOTE_SOURCE_KEY,
            } as Prisma.AdventureIslandWhereInput,
        });

        return {
            sourceKey: ADVENTURE_ISLAND_TEST_NOTE_SOURCE_KEY,
            deletedCount: deleteResult.count,
        };
    }
}
