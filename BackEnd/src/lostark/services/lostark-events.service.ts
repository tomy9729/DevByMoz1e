import { Injectable, Logger } from "@nestjs/common";
import { LostArkClient } from "../lostark.client";

@Injectable()
export class LostArkEventsService {
    private readonly logger = new Logger(LostArkEventsService.name);

    constructor(private readonly lostArkClient: LostArkClient) {}

    async getEvents() {
        try {
            return await this.lostArkClient.fetchEvents();
        } catch (error) {
            this.logger.error("Failed to fetch Lost Ark events. Returning empty array.", error);
            return [];
        }
    }
}
