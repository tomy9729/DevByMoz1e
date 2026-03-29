import { Injectable } from "@nestjs/common";
import { LostArkClient } from "../lostark.client";

@Injectable()
export class LostArkGameContentsService {
    constructor(private readonly lostArkClient: LostArkClient) {}

    async getCalendarContents() {
        return this.lostArkClient.fetchCalendarContents();
    }
}
