import { BadRequestException, Injectable, MethodNotAllowedException } from "@nestjs/common";
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
    date?: Date | null;
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

type StoredAdventureIslandRecord = {
    id: string;
    date: Date | null;
    period: AdventureIslandPeriod;
    categoryName: string;
    contentsName: string;
    sourceType: string;
    sourceKey: string | null;
    rewardName: string | null;
    rewardIconUrl: string | null;
    contentIconUrl: string | null;
    contentImageUrl: string | null;
    collectedAt: Date;
    createdAt: Date;
    updatedAt: Date;
};

@Injectable()
export class AdventureIslandsService {
    private readonly adventureIslandSelect = {
        id: true,
        date: true,
        period: true,
        categoryName: true,
        contentsName: true,
        sourceType: true,
        sourceKey: true,
        rewardName: true,
        rewardIconUrl: true,
        contentIconUrl: true,
        contentImageUrl: true,
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

    private createDateOnly(value: string) {
        const date = new Date(`${value}T00:00:00.000Z`);

        if (Number.isNaN(date.getTime())) {
            throw new BadRequestException("Invalid adventure island date.");
        }

        return date;
    }

    private formatDateText(date: Date | null) {
        if (date == null) {
            return "";
        }

        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    private buildDateFilter(query: QueryAdventureIslandsDto) {
        return query.date
            ? this.createDateOnly(query.date)
            : query.fromDate || query.toDate
              ? {
                    gte: query.fromDate ? this.createDateOnly(query.fromDate) : undefined,
                    lte: query.toDate ? this.createDateOnly(query.toDate) : undefined,
                }
              : undefined;
    }

    private buildAdventureIslandWhereInput(query: QueryAdventureIslandsDto) {
        return {
            period: query.period,
            date: this.buildDateFilter(query),
        };
    }

    private mapStoredAdventureIsland(adventureIsland: StoredAdventureIslandRecord): AdventureIslandRecord {
        const lostArkDate = this.formatDateText(adventureIsland.date);

        return {
            ...adventureIsland,
            lostArkDate,
            shortName: adventureIsland.contentsName,
            rewardShortName: adventureIsland.rewardName,
            startTime: this.createStartTime(lostArkDate, adventureIsland.period),
            rawData: {
                sourceType: adventureIsland.sourceType,
                sourceKey: adventureIsland.sourceKey,
            },
        };
    }

    private createStartTime(dateText: string, period: AdventureIslandPeriod) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
            return new Date(0);
        }

        const [year, month, day] = dateText.split("-").map(Number);
        const hour =
            period === AdventureIslandPeriod.weekendMorning
                ? 9
                : period === AdventureIslandPeriod.weekendAfternoon
                  ? 19
                  : 11;

        return new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0));
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
            orderBy: [{ date: "asc" }, { contentsName: "asc" }],
        }).then((adventureIslands) =>
            adventureIslands.map((adventureIsland) =>
                this.mapStoredAdventureIsland(adventureIsland as StoredAdventureIslandRecord),
            ),
        );
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
            orderBy: [{ date: "asc" }, { contentsName: "asc" }],
        });

        return testAdventureIslands
            .map((adventureIsland) =>
                this.mapStoredAdventureIsland(adventureIsland as StoredAdventureIslandRecord),
            )
            .filter((adventureIsland) => this.matchesAdventureIslandQuery(adventureIsland, query ?? {}));
    }

    async deleteAdventureIslandTestNoteData() {
        throw new MethodNotAllowedException("Adventure island test note deletion is disabled.");
    }
}
