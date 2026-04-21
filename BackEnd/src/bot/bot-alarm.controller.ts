import { Controller, Get, Header, Query } from "@nestjs/common";
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
        return this.botAlarmService.ackDelivery(deliveryId, status, errorReason);
    }

    @Get("status")
    @Header("Content-Type", "text/plain; charset=utf-8")
    getStatusMessage() {
        return this.botAlarmService.getStatusMessage();
    }

    @Get("on")
    @Header("Content-Type", "text/plain; charset=utf-8")
    turnOn() {
        return this.botAlarmService.setGlobalEnabled(true);
    }

    @Get("off")
    @Header("Content-Type", "text/plain; charset=utf-8")
    turnOff() {
        return this.botAlarmService.setGlobalEnabled(false);
    }

    @Get("targets/register")
    @Header("Content-Type", "text/plain; charset=utf-8")
    registerTarget(@Query("room") room?: string, @Query("packageName") packageName?: string) {
        return this.botAlarmService.registerTarget(room, packageName);
    }

    @Get("targets/unregister")
    @Header("Content-Type", "text/plain; charset=utf-8")
    unregisterTarget(@Query("room") room?: string) {
        return this.botAlarmService.unregisterTarget(room);
    }

    @Get("test")
    @Header("Content-Type", "text/plain; charset=utf-8")
    getTestAlarmMessage(@Query("type") type?: "weeklyNotice" | "dailyContents") {
        return this.botAlarmService.getTestAlarmMessage(type === "weeklyNotice" ? "weeklyNotice" : "dailyContents");
    }
}
