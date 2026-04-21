import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { LostArkClient } from "../lostark.client";

type AnyRecord = Record<string, any>;

interface NormalizedCharacterInfo {
    characterName: string;
    serverName: string | null;
    className: string | null;
    itemLevel: string | null;
    rosterLevel: number | null;
    guildName: string | null;
    pvpInfo: AnyRecord;
    combatInfo: AnyRecord;
    equipment: AnyRecord[];
    gems: AnyRecord;
    cards: AnyRecord;
    engravings: AnyRecord;
    bracelet: AnyRecord | null;
    avatars: AnyRecord[];
    profile: AnyRecord;
    collectibles: AnyRecord[];
    other: AnyRecord;
    rawData: AnyRecord;
}

interface GetCharacterOptions {
    forceRefresh?: boolean;
}

interface CharacterMessageResult {
    message: string;
    refreshed: boolean;
    refreshFailed: boolean;
}

@Injectable()
export class CharactersService {
    private readonly refreshTtlMs = 5 * 60 * 1000;

    constructor(
        private readonly prismaService: PrismaService,
        private readonly lostArkClient: LostArkClient,
    ) {}

    private getKoreaDateTimeText(date: Date) {
        return new Intl.DateTimeFormat("sv-SE", {
            timeZone: "Asia/Seoul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).format(date);
    }

    private toArray(value: any) {
        return Array.isArray(value) ? value : [];
    }

    private toObject(value: any): AnyRecord {
        return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    }

    private toNullableString(value: any) {
        return typeof value === "string" && value.trim() ? value.trim() : null;
    }

    private parseNumber(value: any) {
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }

        if (typeof value !== "string") {
            return null;
        }

        const parsed = Number(value.replace(/,/g, ""));

        return Number.isFinite(parsed) ? parsed : null;
    }

    private parseTooltip(tooltip: any): AnyRecord {
        if (!tooltip || typeof tooltip !== "string") {
            return {};
        }

        try {
            return JSON.parse(tooltip);
        } catch {
            return {};
        }
    }

    private collectTooltipTexts(value: any): string[] {
        if (value === null || value === undefined) {
            return [];
        }

        if (typeof value === "string") {
            return [value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()].filter(Boolean);
        }

        if (Array.isArray(value)) {
            return value.flatMap((item) => this.collectTooltipTexts(item));
        }

        if (typeof value === "object") {
            return Object.values(value).flatMap((item) => this.collectTooltipTexts(item));
        }

        return [];
    }

    private findFirstTooltipText(texts: string[], keywords: string[]) {
        return texts.find((text) => keywords.some((keyword) => text.indexOf(keyword) >= 0)) ?? null;
    }

    private normalizeEquipmentItem(item: any) {
        const tooltip = this.parseTooltip(item?.Tooltip);
        const tooltipTexts = this.collectTooltipTexts(tooltip);
        const name = this.toNullableString(item?.Name);
        const honingMatch = name?.match(/\+(\d+)/);

        return {
            type: this.toNullableString(item?.Type),
            name,
            grade: this.toNullableString(item?.Grade),
            icon: this.toNullableString(item?.Icon),
            quality: this.findFirstTooltipText(tooltipTexts, ["품질"]),
            honingLevel: honingMatch ? Number(honingMatch[1]) : null,
            advancedHoning: this.findFirstTooltipText(tooltipTexts, ["상급 재련"]),
            elixir: this.findFirstTooltipText(tooltipTexts, ["엘릭서"]),
            transcendence: this.findFirstTooltipText(tooltipTexts, ["초월"]),
            evolution: this.findFirstTooltipText(tooltipTexts, ["진화"]),
            tooltipSummary: tooltipTexts.slice(0, 20),
        };
    }

    private normalizeArmory(rawData: AnyRecord, requestedCharacterName: string): NormalizedCharacterInfo {
        const profile = this.toObject(rawData.ArmoryProfile);
        const stats = this.toArray(profile.Stats).map((stat) => ({
            type: this.toNullableString(stat?.Type),
            value: this.toNullableString(stat?.Value),
            tooltip: this.toArray(stat?.Tooltip),
        }));
        const tendencies = this.toArray(profile.Tendencies).map((tendency) => ({
            type: this.toNullableString(tendency?.Type),
            point: this.parseNumber(tendency?.Point),
            maxPoint: this.parseNumber(tendency?.MaxPoint),
        }));
        const equipment = this.toArray(rawData.ArmoryEquipment).map((item) =>
            this.normalizeEquipmentItem(item),
        );
        const gems = this.toObject(rawData.ArmoryGem);
        const cards = this.toObject(rawData.ArmoryCard);
        const engravings = this.toObject(rawData.ArmoryEngraving);
        const bracelet = equipment.find((item) => item.type === "팔찌") ?? null;

        return {
            characterName:
                this.toNullableString(profile.CharacterName) ??
                this.toNullableString(rawData.CharacterName) ??
                requestedCharacterName,
            serverName: this.toNullableString(profile.ServerName),
            className: this.toNullableString(profile.CharacterClassName),
            itemLevel: this.toNullableString(profile.ItemAvgLevel),
            rosterLevel: this.parseNumber(profile.ExpeditionLevel),
            guildName: this.toNullableString(profile.GuildName),
            pvpInfo: {
                gradeName: this.toNullableString(profile.PvpGradeName),
                honorPoint: this.toNullableString(profile.HonorPoint),
                colosseum: this.toObject(rawData.ColosseumInfo),
            },
            combatInfo: {
                combatPower: this.toNullableString(profile.CombatPower),
                title: this.toNullableString(profile.Title),
                stats,
                tendencies,
                arkPassive: this.toObject(rawData.ArkPassive),
                combatSkills: this.toArray(rawData.ArmorySkills),
            },
            equipment,
            gems: {
                gems: this.toArray(gems.Gems),
                effects: this.toArray(gems.Effects),
            },
            cards: {
                cards: this.toArray(cards.Cards),
                effects: this.toArray(cards.Effects),
            },
            engravings: {
                engravings: this.toArray(engravings.Engravings),
                effects: this.toArray(engravings.Effects),
                arkPassiveEffects: this.toArray(engravings.ArkPassiveEffects),
            },
            bracelet,
            avatars: this.toArray(rawData.ArmoryAvatars),
            profile: {
                ...profile,
                Stats: stats,
                Tendencies: tendencies,
            },
            collectibles: this.toArray(rawData.Collectibles),
            other: {
                arkGrid: this.toObject(rawData.ArkGrid),
                decorations: this.toArray(profile.Decorations),
            },
            rawData,
        };
    }

    private shouldRefresh(refreshedAt: Date) {
        return Date.now() - refreshedAt.getTime() > this.refreshTtlMs;
    }

    private async refreshCharacter(characterName: string) {
        const rawData = this.toObject(await this.lostArkClient.fetchCharacterArmory(characterName));

        if (!rawData.ArmoryProfile) {
            throw new NotFoundException(`Lost Ark character ${characterName} was not found.`);
        }

        const refreshedAt = new Date();
        const normalized = this.normalizeArmory(rawData, characterName);
        const bracelet = (normalized.bracelet ?? Prisma.JsonNull) as Prisma.InputJsonValue;

        return this.prismaService.characterInfo.upsert({
            where: {
                characterName: normalized.characterName,
            },
            create: {
                characterName: normalized.characterName,
                serverName: normalized.serverName,
                className: normalized.className,
                itemLevel: normalized.itemLevel,
                rosterLevel: normalized.rosterLevel,
                guildName: normalized.guildName,
                pvpInfo: normalized.pvpInfo as Prisma.InputJsonValue,
                combatInfo: normalized.combatInfo as Prisma.InputJsonValue,
                equipment: normalized.equipment as Prisma.InputJsonValue,
                gems: normalized.gems as Prisma.InputJsonValue,
                cards: normalized.cards as Prisma.InputJsonValue,
                engravings: normalized.engravings as Prisma.InputJsonValue,
                bracelet,
                avatars: normalized.avatars as Prisma.InputJsonValue,
                profile: normalized.profile as Prisma.InputJsonValue,
                collectibles: normalized.collectibles as Prisma.InputJsonValue,
                other: normalized.other as Prisma.InputJsonValue,
                rawData: normalized.rawData as Prisma.InputJsonValue,
                refreshedAt,
            },
            update: {
                serverName: normalized.serverName,
                className: normalized.className,
                itemLevel: normalized.itemLevel,
                rosterLevel: normalized.rosterLevel,
                guildName: normalized.guildName,
                pvpInfo: normalized.pvpInfo as Prisma.InputJsonValue,
                combatInfo: normalized.combatInfo as Prisma.InputJsonValue,
                equipment: normalized.equipment as Prisma.InputJsonValue,
                gems: normalized.gems as Prisma.InputJsonValue,
                cards: normalized.cards as Prisma.InputJsonValue,
                engravings: normalized.engravings as Prisma.InputJsonValue,
                bracelet,
                avatars: normalized.avatars as Prisma.InputJsonValue,
                profile: normalized.profile as Prisma.InputJsonValue,
                collectibles: normalized.collectibles as Prisma.InputJsonValue,
                other: normalized.other as Prisma.InputJsonValue,
                rawData: normalized.rawData as Prisma.InputJsonValue,
                refreshedAt,
            },
        });
    }

    private getDisplayValue(value: unknown, fallback = "-") {
        if (value === null || value === undefined || value === "") {
            return fallback;
        }

        return String(value);
    }

    private formatNamedList(items: any[], nameKey: string, limit: number) {
        return items
            .map((item) => this.toNullableString(item?.[nameKey]) ?? this.toNullableString(item?.Name))
            .filter((value): value is string => Boolean(value))
            .slice(0, limit)
            .join(", ");
    }

    private formatCombatStats(combatInfo: any) {
        const stats = this.toArray(combatInfo?.stats)
            .filter((stat) => ["치명", "특화", "신속", "제압", "인내", "숙련"].includes(stat?.type))
            .map((stat) => `${stat.type} ${stat.value}`)
            .slice(0, 6);

        return stats.length > 0 ? stats.join(" / ") : "-";
    }

    private formatEngravings(engravings: any) {
        const arkPassiveEffects = this.toArray(engravings?.arkPassiveEffects)
            .map((item) => this.toNullableString(item?.Name) ?? this.toNullableString(item?.Description))
            .filter((value): value is string => Boolean(value));
        const legacyEffects = this.toArray(engravings?.effects)
            .map((item) => this.toNullableString(item?.Name))
            .filter((value): value is string => Boolean(value));
        const names = arkPassiveEffects.length > 0 ? arkPassiveEffects : legacyEffects;

        return names.length > 0 ? names.slice(0, 8).join(", ") : "-";
    }

    private formatEquipmentLine(item: any) {
        const detailParts = [
            item.honingLevel ? `+${item.honingLevel}` : null,
            item.quality,
            item.advancedHoning,
            item.elixir,
            item.transcendence,
            item.evolution,
        ].filter(Boolean);

        return `- ${this.getDisplayValue(item.type)} : ${this.getDisplayValue(item.name)}${
            detailParts.length > 0 ? ` (${detailParts.join(" / ")})` : ""
        }`;
    }

    private formatCharacterMessage(characterInfo: any, refreshFailed: boolean) {
        const combatInfo = this.toObject(characterInfo.combatInfo);
        const gems = this.toObject(characterInfo.gems);
        const cards = this.toObject(characterInfo.cards);
        const engravings = this.toObject(characterInfo.engravings);
        const equipment = this.toArray(characterInfo.equipment);
        const lines = [
            "[캐릭터 정보]",
            `닉네임 : ${this.getDisplayValue(characterInfo.characterName)}`,
            `서버 : ${this.getDisplayValue(characterInfo.serverName)}`,
            `직업 : ${this.getDisplayValue(characterInfo.className)}`,
            `아이템 레벨 : ${this.getDisplayValue(characterInfo.itemLevel)}`,
            `원정대 레벨 : ${this.getDisplayValue(characterInfo.rosterLevel)}`,
            `길드 : ${this.getDisplayValue(characterInfo.guildName)}`,
            `최근 갱신 : ${this.getKoreaDateTimeText(characterInfo.refreshedAt)}`,
        ];

        if (refreshFailed) {
            lines.push("갱신 안내 : 최신 정보 갱신에 실패해 저장된 정보를 표시합니다.");
        }

        lines.push(
            "",
            "[전투]",
            `- 전투력 : ${this.getDisplayValue(combatInfo.combatPower)}`,
            `- 특성 : ${this.formatCombatStats(combatInfo)}`,
            `- 각인 : ${this.formatEngravings(engravings)}`,
            "",
            "[장비]",
            ...equipment.slice(0, 7).map((item) => this.formatEquipmentLine(item)),
            "",
            "[기타]",
            `- 보석 : ${this.toArray(gems.gems).length}개${
                this.toArray(gems.effects).length > 0
                    ? ` (${this.formatNamedList(this.toArray(gems.effects), "Name", 3)})`
                    : ""
            }`,
            `- 카드 : ${this.formatNamedList(this.toArray(cards.cards), "Name", 6) || "-"}`,
            `- 카드 효과 : ${this.formatNamedList(this.toArray(cards.effects), "Name", 4) || "-"}`,
        );

        return lines.join("\n");
    }

    private formatLoadFailedMessage(reason: "notFound" | "apiFailure" | "internal") {
        const reasonText = {
            notFound: "캐릭터를 찾을 수 없습니다.",
            apiFailure: "로스트아크 API 응답을 받지 못했습니다.",
            internal: "서버 내부 오류가 발생했습니다.",
        }[reason];

        return ["[캐릭터 정보]", "캐릭터 정보를 불러오지 못했습니다.", reasonText, "잠시 후 다시 시도해 주세요."].join("\n");
    }

    private getFailureReason(error: unknown): "notFound" | "apiFailure" | "internal" {
        if (error instanceof NotFoundException) {
            return "notFound";
        }

        if (error && typeof error === "object" && "status" in error) {
            const status = Number((error as { status?: number }).status);

            if (status === 404) {
                return "notFound";
            }

            if (status >= 400 && status < 500) {
                return "apiFailure";
            }
        }

        return "apiFailure";
    }

    async getCharacterMessage(
        characterName: string,
        options: GetCharacterOptions = {},
    ): Promise<CharacterMessageResult> {
        const normalizedCharacterName = characterName.trim();

        if (!normalizedCharacterName) {
            return {
                message: this.formatLoadFailedMessage("notFound"),
                refreshed: false,
                refreshFailed: false,
            };
        }

        const storedCharacter = await this.prismaService.characterInfo.findUnique({
            where: {
                characterName: normalizedCharacterName,
            },
        });
        const needsRefresh =
            options.forceRefresh || !storedCharacter || this.shouldRefresh(storedCharacter.refreshedAt);

        if (!needsRefresh && storedCharacter) {
            return {
                message: this.formatCharacterMessage(storedCharacter, false),
                refreshed: false,
                refreshFailed: false,
            };
        }

        try {
            const refreshedCharacter = await this.refreshCharacter(normalizedCharacterName);

            return {
                message: this.formatCharacterMessage(refreshedCharacter, false),
                refreshed: true,
                refreshFailed: false,
            };
        } catch (error) {
            if (storedCharacter) {
                return {
                    message: this.formatCharacterMessage(storedCharacter, true),
                    refreshed: false,
                    refreshFailed: true,
                };
            }

            return {
                message: this.formatLoadFailedMessage(this.getFailureReason(error)),
                refreshed: false,
                refreshFailed: true,
            };
        }
    }
}
