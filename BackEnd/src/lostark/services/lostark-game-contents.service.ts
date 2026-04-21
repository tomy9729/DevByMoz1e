import { Injectable, Logger } from "@nestjs/common";
import { LostArkClient } from "../lostark.client";

@Injectable()
export class LostArkGameContentsService {
    private readonly logger = new Logger(LostArkGameContentsService.name);

    constructor(private readonly lostArkClient: LostArkClient) {}

    async collectCalendarContents() {
        return this.lostArkClient.fetchCalendarContents();
    }

    async getCalendarContents() {
        try {
            return await this.collectCalendarContents();
        } catch (error) {
            this.logger.error(
                "Failed to fetch Lost Ark calendar contents. Returning empty array.",
                error,
            );
            return [];
        }
    }
}
