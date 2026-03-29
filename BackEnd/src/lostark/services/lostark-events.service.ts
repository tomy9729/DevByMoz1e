import { Injectable } from "@nestjs/common";
import { LostArkClient } from "../lostark.client";

@Injectable()
export class LostArkEventsService {
    constructor(private readonly lostArkClient: LostArkClient) {}

    async getEvents() {
        return this.lostArkClient.fetchEvents();
    }
}
