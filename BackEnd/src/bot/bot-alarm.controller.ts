import { Controller, Get, Header, MethodNotAllowedException, Query } from "@nestjs/common";
import { BotAlarmService } from "./bot-alarm.service";

@Controller("api/bot/alarms")
export class BotAlarmController {
    constructor(private readonly botAlarmService: BotAlarmService) {}

    @Get("due")
    getDueAlarms() {
        return this.botAlarmService.getDueAlarms();
    }

    @Get("deliveries/ack")
    ackDelivery(
        @Query("deliveryId") deliveryId: string,
        @Query("status") status: "sent" | "failed",
        @Query("errorReason") errorReason?: string,
    ) {
        throw new MethodNotAllowedException("Bot alarm delivery updates are disabled.");
    }

    @Get("status")
    @Header("Content-Type", "text/plain; charset=utf-8")
    getStatusMessage() {
        return this.botAlarmService.getStatusMessage();
    }

    @Get("on")
    @Header("Content-Type", "text/plain; charset=utf-8")
    turnOn() {
        throw new MethodNotAllowedException("Bot alarm setting updates are disabled.");
    }

    @Get("off")
    @Header("Content-Type", "text/plain; charset=utf-8")
    turnOff() {
        throw new MethodNotAllowedException("Bot alarm setting updates are disabled.");
    }

    @Get("targets/register")
    @Header("Content-Type", "text/plain; charset=utf-8")
    registerTarget(@Query("room") room?: string, @Query("packageName") packageName?: string) {
        throw new MethodNotAllowedException("Bot alarm target updates are disabled.");
    }

    @Get("targets/unregister")
    @Header("Content-Type", "text/plain; charset=utf-8")
    unregisterTarget(@Query("room") room?: string) {
        throw new MethodNotAllowedException("Bot alarm target updates are disabled.");
    }

    @Get("test")
    @Header("Content-Type", "text/plain; charset=utf-8")
    getTestAlarmMessage(@Query("type") type?: "weeklyNotice" | "dailyContents") {
        return this.botAlarmService.getTestAlarmMessage(type === "weeklyNotice" ? "weeklyNotice" : "dailyContents");
    }
}
