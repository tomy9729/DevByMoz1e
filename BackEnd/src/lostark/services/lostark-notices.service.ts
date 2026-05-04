import { Injectable, Logger, MethodNotAllowedException } from "@nestjs/common";
import { LostArkNotice } from "@prisma/client";
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
        throw new MethodNotAllowedException("Notice collection is disabled.");
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
