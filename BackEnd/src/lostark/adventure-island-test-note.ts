import { AdventureIslandPeriod } from "@prisma/client";

export const ADVENTURE_ISLAND_TEST_NOTE_SOURCE_KEY = "memo-note-202605";

const TEST_NOTE_CATEGORY_NAME = "\uBAA8\uD5D8 \uC12C";
const TEST_NOTE_YEAR = 2026;

const START_TIME_BY_PERIOD: Record<AdventureIslandPeriod, string> = {
    [AdventureIslandPeriod.weekday]: "11:00:00",
    [AdventureIslandPeriod.weekendMorning]: "09:00:00",
    [AdventureIslandPeriod.weekendAfternoon]: "19:00:00",
};

const CONTENTS_NAME_BY_ALIAS: Record<
    string,
    {
        contentsName: string;
        shortName: string;
    }
> = {
    "\uACE0\uC548": {
        contentsName: "\uACE0\uC694\uD55C \uC548\uC2DD\uC758 \uC12C",
        shortName: "\uACE0\uC548\uC12C",
    },
    "\uACE0\uC548\uC12C": {
        contentsName: "\uACE0\uC694\uD55C \uC548\uC2DD\uC758 \uC12C",
        shortName: "\uACE0\uC548\uC12C",
    },
    "\uAE30\uD68C": {
        contentsName: "\uAE30\uD68C\uC758 \uC12C",
        shortName: "\uAE30\uD68C",
    },
    "\uBA54\uB370": {
        contentsName: "\uBA54\uB370\uC774\uC544",
        shortName: "\uBA54\uB370",
    },
    "\uBA54\uB370\uC774\uC544": {
        contentsName: "\uBA54\uB370\uC774\uC544",
        shortName: "\uBA54\uB370",
    },
    "\uBAAC\uD14C": {
        contentsName: "\uBAAC\uD14C\uC12C",
        shortName: "\uBAAC\uD14C\uC12C",
    },
    "\uBE14\uB8E8\uD640": {
        contentsName: "\uBE14\uB8E8\uD640 \uC12C",
        shortName: "\uBE14\uB8E8\uD640 \uC12C",
    },
    "\uBCFC\uB77C\uB974": {
        contentsName: "\uBCFC\uB77C\uB974 \uC12C",
        shortName: "\uBCFC\uB77C\uB974 \uC12C",
    },
    "\uD558\uBAA8\uB2C8": {
        contentsName: "\uD558\uBAA8\uB2C8 \uC12C",
        shortName: "\uD558\uBAA8\uB2C8 \uC12C",
    },
    "\uD558\uBAA8\uB2C8\uC12C": {
        contentsName: "\uD558\uBAA8\uB2C8 \uC12C",
        shortName: "\uD558\uBAA8\uB2C8 \uC12C",
    },
    "\uC2A4\uB178\uC6B0\uD321": {
        contentsName: "\uC2A4\uB178\uC6B0\uD321 \uC544\uC77C\uB79C\uB4DC",
        shortName: "\uC2A4\uB178\uC6B0\uD321 \uC544\uC77C\uB79C\uB4DC",
    },
    "\uC6B0\uAC08": {
        contentsName: "\uC6B0\uAC70\uC9C4 \uAC08\uB300\uC758 \uC12C",
        shortName: "\uC6B0\uAC70\uC9C4 \uAC08\uB300\uC758 \uC12C",
    },
    "\uC6B0\uAC08\uC12C": {
        contentsName: "\uC6B0\uAC70\uC9C4 \uAC08\uB300\uC758 \uC12C",
        shortName: "\uC6B0\uAC70\uC9C4 \uAC08\uB300\uC758 \uC12C",
    },
    "\uC794\uC7A5\uC12C": {
        contentsName: "\uC794\uD639\uD55C \uC7A5\uB09C\uAC10 \uC131",
        shortName: "\uC794\uD639\uD55C \uC7A5\uB09C\uAC10 \uC131",
    },
    "\uC8FD\uD611": {
        contentsName: "\uC8FD\uC74C\uC758 \uD611\uACE1",
        shortName: "\uC8FD\uC74C\uC758 \uD611\uACE1",
    },
    "\uCFF5\uB355\uCFF5": {
        contentsName: "\uCFF5\uB355\uCFF5 \uC544\uC77C\uB79C\uB4DC",
        shortName: "\uCFF5\uB355\uCFF5 \uC544\uC77C\uB79C\uB4DC",
    },
    "\uD3EC\uB974\uD398": {
        contentsName: "\uD3EC\uB974\uD398",
        shortName: "\uD3EC\uB974\uD398",
    },
    "\uC218\uB77C\uB3C4": {
        contentsName: "\uC218\uB77C\uB3C4",
        shortName: "\uC218\uB77C\uB3C4",
    },
    "\uD658\uB098": {
        contentsName: "\uD658\uC601 \uB098\uBE44 \uC12C",
        shortName: "\uD658\uC601 \uB098\uBE44 \uC12C",
    },
    "\uD658\uB098\uC12C": {
        contentsName: "\uD658\uC601 \uB098\uBE44 \uC12C",
        shortName: "\uD658\uC601 \uB098\uBE44 \uC12C",
    },
    "\uB77C\uC77C\uB77C\uC774": {
        contentsName: "\uB77C\uC77C\uB77C\uC774 \uC544\uC77C\uB79C\uB4DC",
        shortName: "\uB77C\uC77C\uB77C\uC774 \uC544\uC77C\uB79C\uB4DC",
    },
};

const REWARD_INFO_BY_LABEL = {
    "\uACE8\uB4DC": {
        rewardName: "\uACE8\uB4DC",
        rewardShortName: "\uACE8\uB4DC",
        rewardIconUrl: "https://cdn-lostark.game.onstove.com/efui_iconatlas/money/money_4.png",
    },
    "\uCE74\uB4DC": {
        rewardName: "\uC804\uC124 ~ \uACE0\uAE09 \uCE74\uB4DC \uD329 IV",
        rewardShortName: "\uCE74\uB4DC",
        rewardIconUrl: "https://cdn-lostark.game.onstove.com/efui_iconatlas/use/use_10_236.png",
    },
    "\uC2E4\uB9C1": {
        rewardName: "\uC2E4\uB9C1",
        rewardShortName: "\uC2E4\uB9C1",
        rewardIconUrl: "https://cdn-lostark.game.onstove.com/efui_iconatlas/etc/etc_14.png",
    },
    "\uD574\uC8FC": {
        rewardName: "\uB300\uC591\uC758 \uC8FC\uD654 \uC0C1\uC790",
        rewardShortName: "\uD574\uC8FC",
        rewardIconUrl: "https://cdn-lostark.game.onstove.com/efui_iconatlas/use/use_2_8.png",
    },
} as const;

type RewardLabel = keyof typeof REWARD_INFO_BY_LABEL;

interface ManualScheduleItem {
    date: string;
    weekday?: string[];
    weekendMorning?: string[];
    weekendAfternoon?: string[];
}

const TEST_NOTE_SCHEDULE: ManualScheduleItem[] = [
    {
        date: `${TEST_NOTE_YEAR}-05-01`,
        weekday: [
            "\uC794\uC7A5\uC12C:\uC2E4\uB9C1",
            "\uD3EC\uB974\uD398:\uD574\uC8FC",
            "\uBE14\uB8E8\uD640:\uACE8\uB4DC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-02`,
        weekendMorning: [
            "\uBAAC\uD14C:\uD574\uC8FC",
            "\uC2A4\uB178\uC6B0\uD321:\uCE74\uB4DC",
            "\uD658\uB098\uC12C:\uC2E4\uB9C1",
        ],
        weekendAfternoon: [
            "\uD558\uBAA8\uB2C8:\uCE74\uB4DC",
            "\uBCFC\uB77C\uB974:\uC2E4\uB9C1",
            "\uACE0\uC548\uC12C:\uD574\uC8FC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-03`,
        weekendMorning: [
            "\uB77C\uC77C\uB77C\uC774:\uCE74\uB4DC",
            "\uBA54\uB370\uC774\uC544:\uD574\uC8FC",
            "\uC218\uB77C\uB3C4:\uC2E4\uB9C1",
        ],
        weekendAfternoon: [
            "\uCFF5\uB355\uCFF5:\uCE74\uB4DC",
            "\uC8FD\uD611:\uC2E4\uB9C1",
            "\uD3EC\uB974\uD398:\uD574\uC8FC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-04`,
        weekday: [
            "\uBE14\uB8E8\uD640:\uCE74\uB4DC",
            "\uAE30\uD68C:\uACE8\uB4DC",
            "\uD658\uB098:\uD574\uC8FC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-05`,
        weekday: [
            "\uACE0\uC548\uC12C:\uC2E4\uB9C1",
            "\uC794\uC7A5\uC12C:\uD574\uC8FC",
            "\uCFF5\uB355\uCFF5:\uCE74\uB4DC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-06`,
        weekday: [
            "\uBAAC\uD14C:\uD574\uC8FC",
            "\uBA54\uB370:\uC2E4\uB9C1",
            "\uC8FD\uD611:\uCE74\uB4DC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-07`,
        weekday: [
            "\uC218\uB77C\uB3C4:\uCE74\uB4DC",
            "\uD558\uBAA8\uB2C8:\uACE8\uB4DC",
            "\uBCFC\uB77C\uB974:\uD574\uC8FC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-08`,
        weekday: [
            "\uC6B0\uAC08\uC12C:\uC2E4\uB9C1",
            "\uC2A4\uB178\uC6B0\uD321:\uD574\uC8FC",
            "\uB77C\uC77C\uB77C\uC774:\uCE74\uB4DC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-09`,
        weekendMorning: [
            "\uBE14\uB8E8\uD640:\uCE74\uB4DC",
            "\uC218\uB77C\uB3C4:\uC2E4\uB9C1",
            "\uBA54\uB370\uC774\uC544:\uD574\uC8FC",
        ],
        weekendAfternoon: [
            "\uBE14\uB8E8\uD640:\uCE74\uB4DC",
            "\uC218\uB77C\uB3C4:\uC2E4\uB9C1",
            "\uBA54\uB370\uC774\uC544:\uD574\uC8FC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-10`,
        weekendMorning: [
            "\uC8FD\uD611:\uC2E4\uB9C1",
            "\uCFF5\uB355\uCFF5:\uCE74\uB4DC",
            "\uBAAC\uD14C:\uD574\uC8FC",
        ],
        weekendAfternoon: [
            "\uC6B0\uAC08\uC12C:\uACE8\uB4DC",
            "\uACE0\uC548\uC12C:\uCE74\uB4DC",
            "\uD658\uB098\uC12C:\uD574\uC8FC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-11`,
        weekday: [
            "\uD558\uBAA8\uB2C8:\uC2E4\uB9C1",
            "\uB77C\uC77C\uB77C\uC774:\uD574\uC8FC",
            "\uD3EC\uB974\uD398:\uCE74\uB4DC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-12`,
        weekday: [
            "\uBA54\uB370\uC774\uC544:\uACE8\uB4DC",
            "\uC218\uB77C\uB3C4:\uCE74\uB4DC",
            "\uC6B0\uAC08\uC12C:\uD574\uC8FC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-13`,
        weekday: [
            "\uC2A4\uB178\uC6B0\uD321:\uC2E4\uB9C1",
            "\uB77C\uC77C\uB77C\uC774:\uCE74\uB4DC",
            "\uD558\uBAA8\uB2C8:\uD574\uC8FC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-14`,
        weekday: [
            "\uC8FD\uD611:\uC2E4\uB9C1",
            "\uBAAC\uD14C:\uCE74\uB4DC",
            "\uBA54\uB370:\uD574\uC8FC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-15`,
        weekday: [
            "\uBE14\uB8E8\uD640:\uD574\uC8FC",
            "\uAE30\uD68C:\uC2E4\uB9C1",
            "\uC794\uC7A5\uC12C:\uCE74\uB4DC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-16`,
        weekendMorning: [
            "\uBCFC\uB77C\uB974:\uCE74\uB4DC",
            "\uD658\uB098:\uC2E4\uB9C1",
            "\uACE0\uC548:\uD574\uC8FC",
        ],
        weekendAfternoon: [
            "\uCFF5\uB355\uCFF5:\uD574\uC8FC",
            "\uD558\uBAA8\uB2C8:\uC2E4\uB9C1",
            "\uD3EC\uB974\uD398:\uACE8\uB4DC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-17`,
        weekendMorning: [
            "\uC218\uB77C\uB3C4:\uD574\uC8FC",
            "\uBAAC\uD14C:\uCE74\uB4DC",
            "\uC6B0\uAC08\uC12C:\uC2E4\uB9C1",
        ],
        weekendAfternoon: [
            "\uC2A4\uB178\uC6B0\uD321:\uCE74\uB4DC",
            "\uC794\uC7A5\uC12C:\uD574\uC8FC",
            "\uAE30\uD68C:\uC2E4\uB9C1",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-18`,
        weekday: [
            "\uBA54\uB370:\uC2E4\uB9C1",
            "\uB77C\uC77C\uB77C\uC774:\uCE74\uB4DC",
            "\uC8FD\uD611:\uACE8\uB4DC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-19`,
        weekday: [
            "\uD658\uB098:\uD574\uC8FC",
            "\uBE14\uB8E8\uD640:\uC2E4\uB9C1",
            "\uC2A4\uB178\uC6B0\uD321:\uCE74\uB4DC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-20`,
        weekday: [
            "\uC6B0\uAC08:\uCE74\uB4DC",
            "\uD558\uBAA8\uB2C8:\uD574\uC8FC",
            "\uAE30\uD68C:\uACE8\uB4DC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-21`,
        weekday: [
            "\uB77C\uC77C\uB77C\uC774:\uC2E4\uB9C1",
            "\uD658\uB098\uC12C:\uD574\uC8FC",
            "\uBAAC\uD14C:\uCE74\uB4DC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-22`,
        weekday: [
            "\uC794\uC7A5\uC12C:\uD574\uC8FC",
            "\uC8FD\uD611:\uCE74\uB4DC",
            "\uAE30\uD68C:\uC2E4\uB9C1",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-23`,
        weekendMorning: [
            "\uACE0\uC548:\uC2E4\uB9C1",
            "\uBE14\uB8E8\uD640:\uD574\uC8FC",
            "\uD558\uBAA8\uB2C8:\uCE74\uB4DC",
        ],
        weekendAfternoon: [
            "\uC2A4\uB178\uC6B0\uD321:\uD574\uC8FC",
            "\uCFF5\uB355\uCFF5:\uCE74\uB4DC",
            "\uC218\uB77C\uB3C4:\uC2E4\uB9C1",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-24`,
        weekendMorning: [
            "\uD658\uB098\uC12C:\uCE74\uB4DC",
            "\uBCFC\uB77C\uB974:\uD574\uC8FC",
            "\uD3EC\uB974\uD398:\uC2E4\uB9C1",
        ],
        weekendAfternoon: [
            "\uC6B0\uAC08\uC12C:\uD574\uC8FC",
            "\uAE30\uD68C:\uCE74\uB4DC",
            "\uBAAC\uD14C:\uACE8\uB4DC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-25`,
        weekday: [
            "\uC218\uB77C\uB3C4:\uCE74\uB4DC",
            "\uCFF5\uB355\uCFF5:\uC2E4\uB9C1",
            "\uBA54\uB370:\uD574\uC8FC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-26`,
        weekday: [
            "\uAE30\uD68C:\uD574\uC8FC",
            "\uD3EC\uB974\uD398:\uCE74\uB4DC",
            "\uACE0\uC548\uC12C:\uACE8\uB4DC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-27`,
        weekday: [
            "\uBE14\uB8E8\uD640:\uD574\uC8FC",
            "\uC8FD\uD611:\uCE74\uB4DC",
            "\uC794\uC7A5\uC12C:\uC2E4\uB9C1",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-28`,
        weekday: [
            "\uB77C\uC77C\uB77C\uC774:\uACE8\uB4DC",
            "\uBCFC\uB77C\uB974:\uCE74\uB4DC",
            "\uC6B0\uAC08\uC12C:\uD574\uC8FC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-29`,
        weekday: [
            "\uBAAC\uD14C:\uD574\uC8FC",
            "\uC2A4\uB178\uC6B0\uD321:\uCE74\uB4DC",
            "\uD3EC\uB974\uD398:\uC2E4\uB9C1",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-30`,
        weekendMorning: [
            "\uD558\uBAA8\uB2C8:\uCE74\uB4DC",
            "\uC218\uB77C\uB3C4:\uD574\uC8FC",
            "\uB77C\uC77C\uB77C\uC774:\uC2E4\uB9C1",
        ],
        weekendAfternoon: [
            "\uAE30\uD68C:\uC2E4\uB9C1",
            "\uBCFC\uB77C\uB974:\uCE74\uB4DC",
            "\uC6B0\uAC08:\uD574\uC8FC",
        ],
    },
    {
        date: `${TEST_NOTE_YEAR}-05-31`,
        weekendMorning: [
            "\uC8FD\uD611:\uC2E4\uB9C1",
            "\uD658\uB098\uC12C:\uCE74\uB4DC",
            "\uCFF5\uB355\uCFF5:\uD574\uC8FC",
        ],
        weekendAfternoon: [
            "\uACE0\uC548\uC12C:\uD574\uC8FC",
            "\uBA54\uB370\uC774\uC544:\uCE74\uB4DC",
            "\uBE14\uB8E8\uD640:\uC2E4\uB9C1",
        ],
    },
];

export interface AdventureIslandTestSeedRecord {
    sourceKey: string;
    lostArkDate: string;
    period: AdventureIslandPeriod;
    categoryName: string;
    contentsName: string;
    shortName: string;
    rewardName: string;
    rewardShortName: string;
    rewardIconUrl: string;
    startTime: Date;
    rawData: {
        source: string;
        date: string;
        period: AdventureIslandPeriod;
        sourceToken: string;
        islandAlias: string;
        rewardLabel: RewardLabel;
    };
}

function buildStartTime(date: string, period: AdventureIslandPeriod) {
    const [year, month, day] = date.split("-").map(Number);
    const [hour = 0, minute = 0, second = 0] = START_TIME_BY_PERIOD[period].split(":").map(Number);

    return new Date(Date.UTC(year, month - 1, day, hour, minute, second, 0));
}

function parseScheduleToken(token: string) {
    const [islandAliasText = "", rewardLabelText = ""] = token.split(":");
    const islandAlias = islandAliasText.trim();
    const rewardLabel = rewardLabelText.trim() as RewardLabel;
    const contentInfo = CONTENTS_NAME_BY_ALIAS[islandAlias];
    const rewardInfo = REWARD_INFO_BY_LABEL[rewardLabel];

    if (!contentInfo) {
        throw new Error(`Unknown adventure island alias: ${islandAlias}`);
    }

    if (!rewardInfo) {
        throw new Error(`Unknown adventure island reward label: ${rewardLabel}`);
    }

    return {
        islandAlias,
        rewardLabel,
        contentInfo,
        rewardInfo,
    };
}

function buildPeriodRecords(
    date: string,
    period: AdventureIslandPeriod,
    tokens: string[] | undefined,
) {
    if (!tokens?.length) {
        return [];
    }

    return tokens.map((token) => {
        const parsedToken = parseScheduleToken(token);

        return {
            sourceKey: ADVENTURE_ISLAND_TEST_NOTE_SOURCE_KEY,
            lostArkDate: date,
            period,
            categoryName: TEST_NOTE_CATEGORY_NAME,
            contentsName: parsedToken.contentInfo.contentsName,
            shortName: parsedToken.contentInfo.contentsName,
            rewardName: parsedToken.rewardInfo.rewardName,
            rewardShortName: parsedToken.rewardInfo.rewardShortName,
            rewardIconUrl: parsedToken.rewardInfo.rewardIconUrl,
            startTime: buildStartTime(date, period),
            rawData: {
                source: ADVENTURE_ISLAND_TEST_NOTE_SOURCE_KEY,
                date,
                period,
                sourceToken: token,
                islandAlias: parsedToken.islandAlias,
                rewardLabel: parsedToken.rewardLabel,
            },
        } satisfies AdventureIslandTestSeedRecord;
    });
}

export function buildAdventureIslandTestSeedRecords(): AdventureIslandTestSeedRecord[] {
    return TEST_NOTE_SCHEDULE.flatMap((item) => [
        ...buildPeriodRecords(item.date, AdventureIslandPeriod.weekday, item.weekday),
        ...buildPeriodRecords(
            item.date,
            AdventureIslandPeriod.weekendMorning,
            item.weekendMorning,
        ),
        ...buildPeriodRecords(
            item.date,
            AdventureIslandPeriod.weekendAfternoon,
            item.weekendAfternoon,
        ),
    ]);
}
