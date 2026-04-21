import {
    BadGatewayException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    ServiceUnavailableException,
    UnauthorizedException,
} from "@nestjs/common";
import { LOSTARK_CALENDAR_URL, LOSTARK_EVENTS_URL } from "./lostark.constants";
import { LostArkEvent, LostArkGameContent, LostArkNotice } from "./lostark.types";

@Injectable()
export class LostArkClient {
    private readonly logger = new Logger(LostArkClient.name);

    private getHeaders() {
        const apiKey = process.env.LOSTARK_API_KEY;

        if (!apiKey) {
            throw new InternalServerErrorException("LOSTARK_API_KEY is not configured.");
        }

        return {
            accept: "application/json",
            Authorization: `bearer ${apiKey}`,
        };
    }

    private async fetchJson<T>(url: string, targetName: string): Promise<T> {
        try {
            const response = await fetch(url, {
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                const summarizedBody = errorBody.slice(0, 500);

                this.logger.error(
                    `${targetName} request failed. status=${response.status}, body=${summarizedBody}`,
                );

                if (response.status === 401) {
                    throw new UnauthorizedException(
                        `${targetName} request failed: LOSTARK_API_KEY is invalid or expired.`,
                    );
                }

                if (response.status === 403) {
                    throw new ForbiddenException(
                        `${targetName} request failed: access to Lost Ark API was denied.`,
                    );
                }

                if (response.status === 429) {
                    throw new ServiceUnavailableException(
                        `${targetName} request failed: Lost Ark API rate limit was exceeded.`,
                    );
                }

                if (response.status >= 500) {
                    throw new BadGatewayException(
                        `${targetName} request failed: Lost Ark API returned ${response.status}.`,
                    );
                }

                if (response.status === 404) {
                    throw new NotFoundException(`${targetName} was not found.`);
                }

                throw new BadGatewayException(
                    `${targetName} request failed: Lost Ark API returned ${response.status}.`,
                );
            }

            return (await response.json()) as T;
        } catch (error) {
            if (
                error instanceof UnauthorizedException ||
                error instanceof ForbiddenException ||
                error instanceof NotFoundException ||
                error instanceof BadGatewayException ||
                error instanceof InternalServerErrorException
            ) {
                throw error;
            }

            this.logger.error(`${targetName} request threw an unexpected error.`, error);
            throw new ServiceUnavailableException(
                `${targetName} request failed: unable to reach Lost Ark API.`,
            );
        }
    }

    async fetchEvents(): Promise<LostArkEvent[]> {
        const events = await this.fetchJson<LostArkEvent[]>(LOSTARK_EVENTS_URL, "Lost Ark events");

        return events.map(({ Title, StartDate, EndDate, Link }) => ({
            Title,
            StartDate,
            EndDate,
            Link,
        }));
    }

    async fetchNotices(): Promise<LostArkNotice[]> {
        const notices = await this.fetchJson<LostArkNotice[]>(
            "https://developer-lostark.game.onstove.com/news/notices",
            "Lost Ark notices",
        );

        return notices.map(({ Title, Date, Link, Type }) => ({
            Title,
            Date,
            Link,
            Type,
        }));
    }

    async fetchCalendarContents(): Promise<LostArkGameContent[]> {
        const contents = await this.fetchJson<LostArkGameContent[]>(
            LOSTARK_CALENDAR_URL,
            "Lost Ark calendar contents",
        );

        return contents.map(
            ({ CategoryName, ContentsName, ContentsIcon, Icon, Image, StartTimes, RewardItems }) => ({
            CategoryName,
            ContentsName,
            ContentsIcon,
            Icon,
            Image,
            StartTimes,
            RewardItems,
        }),
        );
    }

    async fetchCharacterArmory(characterName: string): Promise<Record<string, unknown>> {
        const encodedCharacterName = encodeURIComponent(characterName);

        return this.fetchJson<Record<string, unknown>>(
            `https://developer-lostark.game.onstove.com/armories/characters/${encodedCharacterName}`,
            `Lost Ark character ${characterName}`,
        );
    }
}
