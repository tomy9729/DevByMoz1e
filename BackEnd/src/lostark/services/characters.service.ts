import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { LostArkClient } from "../lostark.client";

type AnyRecord = Record<string, any>;
type CharacterSection =
    | "equipment"
    | "accessories"
    | "abilityStone"
    | "bracelet"
    | "skills"
    | "arkPassive"
    | "gems"
    | "avatars"
    | "collectibles"
    | "combatPower"
    | "arkGrid";

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
    accessories: AnyRecord[];
    abilityStone: AnyRecord | null;
    gems: AnyRecord;
    cards: AnyRecord;
    engravings: AnyRecord;
    bracelet: AnyRecord | null;
    skills: AnyRecord[];
    arkPassive: AnyRecord;
    avatars: AnyRecord[];
    profile: AnyRecord;
    collectibles: AnyRecord[];
    arkGrid: AnyRecord;
    other: AnyRecord;
    rawData: AnyRecord;
}

interface GetCharacterOptions {
    forceRefresh?: boolean;
    section?: string;
}

interface CharacterMessageResult {
    message: string;
    refreshed: boolean;
    refreshFailed: boolean;
}

@Injectable()
export class CharactersService {
    private readonly refreshTtlMs = 5 * 60 * 1000;
    private readonly sectionAliases: Record<string, CharacterSection> = {
        장비: "equipment",
        악세: "accessories",
        악세사리: "accessories",
        어빌리티스톤: "abilityStone",
        어빌돌: "abilityStone",
        돌: "abilityStone",
        팔찌: "bracelet",
        스킬: "skills",
        아크패시브: "arkPassive",
        보석: "gems",
        아바타: "avatars",
        내실: "collectibles",
        수집: "collectibles",
        수집형: "collectibles",
        전투력: "combatPower",
        전투: "combatPower",
        아크그리드: "arkGrid",
    };

    private readonly sectionTitles: Record<CharacterSection, string> = {
        equipment: "장비",
        accessories: "악세",
        abilityStone: "어빌리티스톤",
        bracelet: "팔찌",
        skills: "스킬",
        arkPassive: "아크패시브",
        gems: "보석",
        avatars: "아바타",
        collectibles: "내실",
        combatPower: "전투력",
        arkGrid: "아크그리드",
    };

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

    private isAccessoryItem(item: AnyRecord) {
        return ["목걸이", "귀걸이", "반지"].includes(String(item.type));
    }

    private isAbilityStoneItem(item: AnyRecord) {
        return String(item.type).indexOf("어빌리티") >= 0 && String(item.type).indexOf("스톤") >= 0;
    }

    private isBraceletItem(item: AnyRecord) {
        return item.type === "팔찌";
    }

    private normalizeSkill(skill: any) {
        return {
            type: this.toNullableString(skill?.SkillType),
            name: this.toNullableString(skill?.Name),
            icon: this.toNullableString(skill?.Icon),
            level: this.parseNumber(skill?.Level),
            tripod: this.toNullableString(skill?.Tripod),
            rune: this.toNullableString(skill?.Rune?.Name),
            gemSlot: this.parseNumber(skill?.GemSlot),
            tripods: this.toArray(skill?.Tripods).map((tripod) => ({
                tier: this.parseNumber(tripod?.Tier),
                slot: this.parseNumber(tripod?.Slot),
                name: this.toNullableString(tripod?.Name),
                icon: this.toNullableString(tripod?.Icon),
                isSelected: Boolean(tripod?.IsSelected),
            })),
        };
    }

    private normalizeAvatar(avatar: any) {
        return {
            type: this.toNullableString(avatar?.Type),
            name: this.toNullableString(avatar?.Name),
            grade: this.toNullableString(avatar?.Grade),
            icon: this.toNullableString(avatar?.Icon),
            isSet: Boolean(avatar?.IsSet),
            isInner: Boolean(avatar?.IsInner),
        };
    }

    private normalizeCollectible(collectible: any) {
        return {
            type: this.toNullableString(collectible?.Type),
            point: this.parseNumber(collectible?.Point),
            maxPoint: this.parseNumber(collectible?.MaxPoint),
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
        const accessories = equipment.filter((item) => this.isAccessoryItem(item));
        const abilityStone = equipment.find((item) => this.isAbilityStoneItem(item)) ?? null;
        const bracelet = equipment.find((item) => this.isBraceletItem(item)) ?? null;
        const gearEquipment = equipment.filter(
            (item) => !this.isAccessoryItem(item) && !this.isAbilityStoneItem(item) && !this.isBraceletItem(item),
        );
        const gems = this.toObject(rawData.ArmoryGem);
        const cards = this.toObject(rawData.ArmoryCard);
        const engravings = this.toObject(rawData.ArmoryEngraving);
        const arkPassive = this.toObject(rawData.ArkPassive);
        const arkGrid = this.toObject(rawData.ArkGrid);

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
                arkPassive,
                combatSkills: this.toArray(rawData.ArmorySkills),
            },
            equipment: gearEquipment,
            accessories,
            abilityStone,
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
            skills: this.toArray(rawData.ArmorySkills).map((skill) => this.normalizeSkill(skill)),
            arkPassive,
            avatars: this.toArray(rawData.ArmoryAvatars).map((avatar) => this.normalizeAvatar(avatar)),
            profile: {
                ...profile,
                Stats: stats,
                Tendencies: tendencies,
            },
            collectibles: this.toArray(rawData.Collectibles).map((collectible) =>
                this.normalizeCollectible(collectible),
            ),
            arkGrid,
            other: {
                arkGrid,
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
        const abilityStone = (normalized.abilityStone ?? Prisma.JsonNull) as Prisma.InputJsonValue;

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
                accessories: normalized.accessories as Prisma.InputJsonValue,
                abilityStone,
                gems: normalized.gems as Prisma.InputJsonValue,
                cards: normalized.cards as Prisma.InputJsonValue,
                engravings: normalized.engravings as Prisma.InputJsonValue,
                bracelet,
                skills: normalized.skills as Prisma.InputJsonValue,
                arkPassive: normalized.arkPassive as Prisma.InputJsonValue,
                avatars: normalized.avatars as Prisma.InputJsonValue,
                profile: normalized.profile as Prisma.InputJsonValue,
                collectibles: normalized.collectibles as Prisma.InputJsonValue,
                arkGrid: normalized.arkGrid as Prisma.InputJsonValue,
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
                accessories: normalized.accessories as Prisma.InputJsonValue,
                abilityStone,
                gems: normalized.gems as Prisma.InputJsonValue,
                cards: normalized.cards as Prisma.InputJsonValue,
                engravings: normalized.engravings as Prisma.InputJsonValue,
                bracelet,
                skills: normalized.skills as Prisma.InputJsonValue,
                arkPassive: normalized.arkPassive as Prisma.InputJsonValue,
                avatars: normalized.avatars as Prisma.InputJsonValue,
                profile: normalized.profile as Prisma.InputJsonValue,
                collectibles: normalized.collectibles as Prisma.InputJsonValue,
                arkGrid: normalized.arkGrid as Prisma.InputJsonValue,
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

    private resolveSection(section?: string): CharacterSection | null | undefined {
        const normalizedSection = String(section ?? "").trim();

        if (!normalizedSection) {
            return null;
        }

        return this.sectionAliases[normalizedSection];
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

    private formatCommonHeader(characterInfo: any, title: string, refreshFailed: boolean) {
        const lines = [
            `[캐릭터 정보${title ? ` - ${title}` : ""}]`,
            `닉네임 : ${this.getDisplayValue(characterInfo.characterName)}`,
            `서버 : ${this.getDisplayValue(characterInfo.serverName)}`,
            `직업 : ${this.getDisplayValue(characterInfo.className)}`,
            `아이템 레벨 : ${this.getDisplayValue(characterInfo.itemLevel)}`,
            `최근 갱신 : ${this.getKoreaDateTimeText(characterInfo.refreshedAt)}`,
        ];

        if (refreshFailed) {
            lines.push("갱신 안내 : 최신 정보 갱신에 실패해 저장된 정보를 표시합니다.");
        }

        return lines;
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

    private formatSkillLine(skill: any) {
        const selectedTripods = this.toArray(skill.tripods)
            .filter((tripod) => tripod?.isSelected)
            .map((tripod) => tripod?.name)
            .filter(Boolean)
            .slice(0, 3);
        const details = [
            skill.level ? `Lv.${skill.level}` : null,
            skill.type,
            skill.rune ? `룬 ${skill.rune}` : null,
            selectedTripods.length > 0 ? selectedTripods.join("/") : null,
        ].filter(Boolean);

        return `- ${this.getDisplayValue(skill.name)}${details.length > 0 ? ` (${details.join(" / ")})` : ""}`;
    }

    private formatAvatarLine(avatar: any) {
        const details = [avatar.grade, avatar.isInner ? "덧입기" : null, avatar.isSet ? "세트" : null].filter(Boolean);

        return `- ${this.getDisplayValue(avatar.type)} : ${this.getDisplayValue(avatar.name)}${
            details.length > 0 ? ` (${details.join(" / ")})` : ""
        }`;
    }

    private formatCollectibleLine(collectible: any) {
        const pointText =
            collectible.maxPoint === null || collectible.maxPoint === undefined
                ? this.getDisplayValue(collectible.point)
                : `${this.getDisplayValue(collectible.point)}/${this.getDisplayValue(collectible.maxPoint)}`;

        return `- ${this.getDisplayValue(collectible.type)} : ${pointText}`;
    }

    private formatArkPassiveLines(arkPassive: any) {
        const effects = this.toArray(arkPassive?.Effects);
        const points = this.toArray(arkPassive?.Points);
        const lines = [
            `- 활성화 : ${arkPassive?.IsArkPassive ? "예" : "아니오"}`,
            ...points
                .map((point) => `- ${this.getDisplayValue(point?.Name)} : ${this.getDisplayValue(point?.Value)}`)
                .slice(0, 8),
            ...effects
                .map((effect) => `- ${this.getDisplayValue(effect?.Name)} : ${this.getDisplayValue(effect?.Description)}`)
                .slice(0, 8),
        ];

        return lines.length > 0 ? lines : ["조회 가능한 아크패시브 정보가 없습니다."];
    }

    private formatArkGridLines(arkGrid: any) {
        const effects = this.toArray(arkGrid?.Effects);
        const points = this.toArray(arkGrid?.Points);
        const lines = [
            ...points
                .map((point) => `- ${this.getDisplayValue(point?.Name)} : ${this.getDisplayValue(point?.Value)}`)
                .slice(0, 8),
            ...effects
                .map((effect) => `- ${this.getDisplayValue(effect?.Name)} : ${this.getDisplayValue(effect?.Description)}`)
                .slice(0, 8),
        ];

        return lines.length > 0 ? lines : ["조회 가능한 아크그리드 정보가 없습니다."];
    }

    private formatGemLines(gems: any) {
        const gemItems = this.toArray(gems?.gems);
        const effectItems = this.toArray(gems?.effects);

        if (gemItems.length === 0 && effectItems.length === 0) {
            return ["보석 정보가 없습니다."];
        }

        if (effectItems.length > 0) {
            return effectItems
                .map((effect) => {
                    const gemName = this.toNullableString(effect?.GemName) ?? this.toNullableString(effect?.Name);
                    const skillName = this.toNullableString(effect?.SkillName) ?? this.toNullableString(effect?.Description);

                    return `- ${this.getDisplayValue(gemName)} : ${this.getDisplayValue(skillName)}`;
                })
                .slice(0, 12);
        }

        return gemItems
            .map((gem) => `- ${this.getDisplayValue(gem?.Name)} : ${this.getDisplayValue(gem?.Grade)}`)
            .slice(0, 12);
    }

    private formatItemOrEmpty(item: any, emptyText: string) {
        if (!item || item === Prisma.JsonNull) {
            return [emptyText];
        }

        return [this.formatEquipmentLine(item)];
    }

    private formatCharacterMessage(characterInfo: any, refreshFailed: boolean) {
        const combatInfo = this.toObject(characterInfo.combatInfo);
        const gems = this.toObject(characterInfo.gems);
        const cards = this.toObject(characterInfo.cards);
        const engravings = this.toObject(characterInfo.engravings);
        const equipment = this.toArray(characterInfo.equipment);
        const accessories = this.toArray(characterInfo.accessories);
        const skills = this.toArray(characterInfo.skills);
        const avatars = this.toArray(characterInfo.avatars);
        const collectibles = this.toArray(characterInfo.collectibles);
        const lines = [
            ...this.formatCommonHeader(characterInfo, "", refreshFailed),
            `원정대 레벨 : ${this.getDisplayValue(characterInfo.rosterLevel)}`,
            `길드 : ${this.getDisplayValue(characterInfo.guildName)}`,
        ];

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
            "[악세/특수장비]",
            ...(accessories.length > 0 ? accessories.map((item) => this.formatEquipmentLine(item)) : ["악세 정보가 없습니다."]),
            ...this.formatItemOrEmpty(characterInfo.abilityStone, "어빌리티스톤 정보가 없습니다."),
            ...this.formatItemOrEmpty(characterInfo.bracelet, "팔찌 정보가 없습니다."),
            "",
            "[스킬]",
            ...(skills.length > 0 ? skills.slice(0, 8).map((skill) => this.formatSkillLine(skill)) : ["스킬 정보가 없습니다."]),
            "",
            "[기타]",
            `- 보석 : ${this.toArray(gems.gems).length}개${
                this.toArray(gems.effects).length > 0
                    ? ` (${this.formatNamedList(this.toArray(gems.effects), "Name", 3)})`
                    : ""
            }`,
            `- 아바타 : ${avatars.length}개`,
            `- 내실 : ${collectibles.length}종`,
            `- 카드 : ${this.formatNamedList(this.toArray(cards.cards), "Name", 6) || "-"}`,
            `- 카드 효과 : ${this.formatNamedList(this.toArray(cards.effects), "Name", 4) || "-"}`,
        );

        return lines.join("\n");
    }

    private formatSectionMessage(characterInfo: any, section: CharacterSection, refreshFailed: boolean) {
        const title = this.sectionTitles[section];
        const lines = this.formatCommonHeader(characterInfo, title, refreshFailed);
        const combatInfo = this.toObject(characterInfo.combatInfo);

        lines.push("");

        if (section === "equipment") {
            const equipment = this.toArray(characterInfo.equipment);
            lines.push(...(equipment.length > 0 ? equipment.map((item) => this.formatEquipmentLine(item)) : ["장비 정보가 없습니다."]));
        } else if (section === "accessories") {
            const accessories = this.toArray(characterInfo.accessories);
            lines.push(...(accessories.length > 0 ? accessories.map((item) => this.formatEquipmentLine(item)) : ["악세 정보가 없습니다."]));
        } else if (section === "abilityStone") {
            lines.push(...this.formatItemOrEmpty(characterInfo.abilityStone, "어빌리티스톤 정보가 없습니다."));
        } else if (section === "bracelet") {
            lines.push(...this.formatItemOrEmpty(characterInfo.bracelet, "팔찌 정보가 없습니다."));
        } else if (section === "skills") {
            const skills = this.toArray(characterInfo.skills);
            lines.push(...(skills.length > 0 ? skills.map((skill) => this.formatSkillLine(skill)).slice(0, 16) : ["스킬 정보가 없습니다."]));
        } else if (section === "arkPassive") {
            lines.push(...this.formatArkPassiveLines(this.toObject(characterInfo.arkPassive)));
        } else if (section === "gems") {
            lines.push(...this.formatGemLines(this.toObject(characterInfo.gems)));
        } else if (section === "avatars") {
            const avatars = this.toArray(characterInfo.avatars);
            lines.push(...(avatars.length > 0 ? avatars.map((avatar) => this.formatAvatarLine(avatar)).slice(0, 16) : ["아바타 정보가 없습니다."]));
        } else if (section === "collectibles") {
            const collectibles = this.toArray(characterInfo.collectibles);
            lines.push(...(collectibles.length > 0 ? collectibles.map((collectible) => this.formatCollectibleLine(collectible)) : ["내실 정보가 없습니다."]));
        } else if (section === "combatPower") {
            lines.push(
                `- 전투력 : ${this.getDisplayValue(combatInfo.combatPower)}`,
                `- 특성 : ${this.formatCombatStats(combatInfo)}`,
            );
        } else if (section === "arkGrid") {
            lines.push(...this.formatArkGridLines(this.toObject(characterInfo.arkGrid)));
        }

        return lines.join("\n");
    }

    private formatUnsupportedSectionMessage() {
        return [
            "[캐릭터 정보]",
            "지원하지 않는 조회 항목입니다.",
            "",
            "사용 예시:",
            "!캐릭명",
            "!캐릭명 새로고침",
            "!캐릭명 장비",
            "!캐릭명 보석",
        ].join("\n");
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
        const section = this.resolveSection(options.section);

        if (!normalizedCharacterName) {
            return {
                message: this.formatLoadFailedMessage("notFound"),
                refreshed: false,
                refreshFailed: false,
            };
        }

        if (section === undefined) {
            return {
                message: this.formatUnsupportedSectionMessage(),
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
                message: section
                    ? this.formatSectionMessage(storedCharacter, section, false)
                    : this.formatCharacterMessage(storedCharacter, false),
                refreshed: false,
                refreshFailed: false,
            };
        }

        try {
            const refreshedCharacter = await this.refreshCharacter(normalizedCharacterName);

            return {
                message: section
                    ? this.formatSectionMessage(refreshedCharacter, section, false)
                    : this.formatCharacterMessage(refreshedCharacter, false),
                refreshed: true,
                refreshFailed: false,
            };
        } catch (error) {
            if (storedCharacter) {
                return {
                    message: section
                        ? this.formatSectionMessage(storedCharacter, section, true)
                        : this.formatCharacterMessage(storedCharacter, true),
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
