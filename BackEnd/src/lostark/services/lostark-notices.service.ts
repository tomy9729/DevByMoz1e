import { Injectable, Logger } from "@nestjs/common";
import { LostArkNotice, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { QueryNoticesDto } from "../dto/query-notices.dto";
import { LostArkClient } from "../lostark.client";

@Injectable()
export class LostArkNoticesService {
    private readonly logger = new Logger(LostArkNoticesService.name);

    constructor(
        private readonly prismaService: PrismaService,
        private readonly lostArkClient: LostArkClient,
    ) {}

    async getNotices() {
        const storedNotices = await this.getStoredNotices({});

        if (storedNotices.length > 0) {
            return storedNotices.map((notice) => ({
                Title: notice.title,
                Date: notice.noticeDate.toISOString(),
                Link: notice.link,
                Type: notice.type,
            }));
        }

        try {
            return await this.lostArkClient.fetchNotices();
        } catch (error) {
            this.logger.error(
                "Failed to fetch Lost Ark notices and no stored notices were found. Returning empty array.",
                error,
            );
            return [];
        }
    }

    async collectNotices() {
        const notices = await this.lostArkClient.fetchNotices();
        const collectedAt = new Date();

        for (const notice of notices) {
            await this.prismaService.lostArkNotice.upsert({
                where: {
                    link: notice.Link,
                },
                create: {
                    title: notice.Title,
                    noticeDate: new Date(notice.Date),
                    link: notice.Link,
                    type: notice.Type,
                    rawData: notice as unknown as Prisma.InputJsonValue,
                    collectedAt,
                },
                update: {
                    title: notice.Title,
                    noticeDate: new Date(notice.Date),
                    type: notice.Type,
                    rawData: notice as unknown as Prisma.InputJsonValue,
                    collectedAt,
                },
            });
        }

        return {
            collectedAt,
            count: notices.length,
            items: notices,
        };
    }

    async getStoredNotices(query: QueryNoticesDto): Promise<LostArkNotice[]> {
        return this.prismaService.lostArkNotice.findMany({
            where: {
                type: query.type,
                noticeDate:
                    query.fromDate || query.toDate
                        ? {
                              gte: query.fromDate ? new Date(query.fromDate) : undefined,
                              lte: query.toDate ? new Date(query.toDate) : undefined,
                          }
                        : undefined,
            },
            orderBy: [{ noticeDate: "desc" }, { createdAt: "desc" }],
        });
    }
}
