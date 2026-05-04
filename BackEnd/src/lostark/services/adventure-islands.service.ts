import { Injectable, MethodNotAllowedException } from "@nestjs/common";
import { AdventureIslandPeriod, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
    ADVENTURE_ISLAND_TEST_NOTE_SOURCE_KEY,
    buildAdventureIslandTestSeedRecords,
} from "../adventure-island-test-note";
import { extractAdventureIslandRecords } from "../adventure-island.util";
import { QueryAdventureIslandsDto } from "../dto/query-adventure-islands.dto";
import { LostArkClient } from "../lostark.client";

type AdventureIslandRecord = {
    id: string;
    lostArkDate: string;
    period: AdventureIslandPeriod;
    categoryName: string;
    contentsName: string;
    shortName: string;
    rewardName: string | null;
    rewardShortName: string | null;
    rewardIconUrl: string | null;
    contentIconUrl: string | null;
    contentImageUrl: string | null;
    startTime: Date;
    rawData: Prisma.JsonValue;
    collectedAt: Date;
    createdAt: Date;
    updatedAt: Date;
};

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

    constructor(
        private readonly prismaService: PrismaService,
        private readonly lostArkClient: LostArkClient,
    ) {}

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

    private buildAdventureIslandWhereInput(query: QueryAdventureIslandsDto) {
        return {
            period: query.period,
            lostArkDate: this.buildLostArkDateFilter(query),
        };
    }

    private async fetchAdventureIslands(collectedAt = new Date()) {
        const calendarContents = await this.lostArkClient.fetchCalendarContents();
        const records = extractAdventureIslandRecords(calendarContents);

        return records.map((record) => ({
            id: [
                record.lostArkDate,
                record.period,
                record.contentsName,
                record.startTime.toISOString(),
            ].join(":"),
            ...record,
            rawData: record.rawData as unknown as Prisma.JsonValue,
            collectedAt,
            createdAt: collectedAt,
            updatedAt: collectedAt,
        })) as AdventureIslandRecord[];
    }

    async collectAdventureIslands() {
        throw new MethodNotAllowedException("Adventure island collection is disabled.");
    }

    async getAdventureIslands(query: QueryAdventureIslandsDto) {
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

        const fetchedAdventureIslands = await this.fetchAdventureIslands();

        return fetchedAdventureIslands.filter((adventureIsland) =>
            this.matchesAdventureIslandQuery(adventureIsland, query),
        );
    }

    async importAdventureIslandTestNoteData() {
        throw new MethodNotAllowedException("Adventure island test note import is disabled.");
    }

    async getAdventureIslandTestNoteData(query?: QueryAdventureIslandsDto) {
        const testAdventureIslands = await this.prismaService.adventureIsland.findMany({
            where: {
                sourceType: "manual",
                sourceKey: ADVENTURE_ISLAND_TEST_NOTE_SOURCE_KEY,
                period: query?.period,
            },
            select: this.adventureIslandSelect,
            orderBy: [{ lostArkDate: "asc" }, { startTime: "asc" }, { contentsName: "asc" }],
        });

        return testAdventureIslands.filter((adventureIsland) =>
            this.matchesAdventureIslandQuery(adventureIsland, query ?? {}),
        );
    }

    async deleteAdventureIslandTestNoteData() {
        throw new MethodNotAllowedException("Adventure island test note deletion is disabled.");
    }
}
