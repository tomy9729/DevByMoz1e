import { Controller, Get, MethodNotAllowedException, Post, Query } from "@nestjs/common";
import { QueryNoticesDto } from "../dto/query-notices.dto";
import { LostArkNoticesService } from "../services/lostark-notices.service";

@Controller("api/lostark/news/notices")
export class LostArkNoticesController {
    constructor(private readonly lostArkNoticesService: LostArkNoticesService) {}

    @Get()
    async getNotices() {
        return this.lostArkNoticesService.getNotices();
    }

    @Post("collect")
    async collectNotices() {
        throw new MethodNotAllowedException("Notice collection is disabled.");
    }

    @Get("stored")
    async getStoredNotices(@Query() query: QueryNoticesDto) {
        return this.lostArkNoticesService.getStoredNotices(query);
    }
}
