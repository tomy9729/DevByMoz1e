const CALENDAR_FILTER_TARGET_DEFINITIONS = [
    {
        key: "event",
        labelPath: "filters.targets.event",
    },
    {
        key: "notice",
        labelPath: "filters.targets.notice",
        groups: [
            {
                key: "categories",
                labelPath: "filters.notice.categories",
                staticOptions: [
                    { value: "공지", label: "공지" },
                    { value: "이벤트", label: "이벤트" },
                    { value: "상점", label: "상점" },
                    { value: "점검", label: "점검" },
                ],
                optionValueFromEvent: (event) => getNoticeCategoryFilterValue(event),
                optionLabelFromEvent: (event) => getNoticeCategoryFilterValue(event),
            },
        ],
    },
    {
        key: "chaosGate",
        labelPath: "filters.targets.chaosGate",
    },
    {
        key: "fieldBoss",
        labelPath: "filters.targets.fieldBoss",
    },
    {
        key: "adventureIsland",
        labelPath: "filters.targets.adventureIsland",
        groups: [
            {
                key: "islands",
                labelPath: "filters.adventureIsland.islands",
                optionValueFromEvent: (event) => getAdventureIslandFilterValues(event).islandName,
                optionLabelFromEvent: (event) => getAdventureIslandFilterValues(event).islandName,
            },
            {
                key: "rewards",
                labelPath: "filters.adventureIsland.rewards",
                optionValueFromEvent: (event) => getAdventureIslandFilterValues(event).rewardName,
                optionLabelFromEvent: (event) => getAdventureIslandFilterValues(event).rewardName,
            },
        ],
    },
];

const ADVENTURE_ISLAND_REWARD_FILTER_ORDER = ["골드", "카드", "실링", "해주"];

function getTargetDefinition(targetKey) {
    return (
        CALENDAR_FILTER_TARGET_DEFINITIONS.find((definition) => definition.key === targetKey) ??
        null
    );
}

/**
 * 역할: 모험섬 보상 필터 표시 순서를 우선순위 기준으로 정렬한다.
 * 파라미터 설명:
 * - options: 보상 필터 옵션 배열
 * 반환값 설명: 골드, 카드, 실링, 해주 우선순위가 반영된 옵션 배열
 */
function sortAdventureIslandRewardOptions(options) {
    return [...options].sort((left, right) => {
        const leftIndex = ADVENTURE_ISLAND_REWARD_FILTER_ORDER.indexOf(left.label);
        const rightIndex = ADVENTURE_ISLAND_REWARD_FILTER_ORDER.indexOf(right.label);
        const normalizedLeftIndex = leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex;
        const normalizedRightIndex = rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex;

        if (normalizedLeftIndex !== normalizedRightIndex) {
            return normalizedLeftIndex - normalizedRightIndex;
        }

        return left.label.localeCompare(right.label, "ko");
    });
}

function sortFilterOptions(options) {
    return [...options].sort((left, right) => left.label.localeCompare(right.label, "ko"));
}

function getEventFilterTarget(event) {
    return event.extendedProps?.filterTarget ?? event.extendedProps?.contentType ?? "";
}

function getAdventureIslandTitleParts(title = "") {
    const [islandNamePart = "", rewardText = ""] = title.split(" (");

    return {
        islandName: islandNamePart.trim(),
        rewardName: rewardText.replace(")", "").trim(),
    };
}

function getAdventureIslandFilterValues(event) {
    const { islandName: titleIslandName, rewardName: titleRewardName } =
        getAdventureIslandTitleParts(event.title);

    return {
        islandName: event.extendedProps?.islandName ?? titleIslandName,
        rewardName: event.extendedProps?.rewardName ?? titleRewardName,
    };
}

function getNoticeCategoryFilterValue(event) {
    return event.extendedProps?.noticeCategory ?? event.extendedProps?.noticeType ?? "";
}

export function buildCalendarFilterOptions(events) {
    const groupOptions = new Map();

    events.forEach((event) => {
        const targetKey = getEventFilterTarget(event);
        const targetDefinition = getTargetDefinition(targetKey);

        if (!targetDefinition) {
            return;
        }

        targetDefinition.groups?.forEach((groupDefinition) => {
            const groupKey = `${targetKey}:${groupDefinition.key}`;
            const optionsForGroup = groupOptions.get(groupKey) ?? new Map();

            groupDefinition.staticOptions?.forEach((option) => {
                optionsForGroup.set(option.value, option);
            });

            const optionValue = groupDefinition.optionValueFromEvent(event);
            const optionLabel = groupDefinition.optionLabelFromEvent(event);

            if (!optionValue || !optionLabel) {
                groupOptions.set(groupKey, optionsForGroup);
                return;
            }

            optionsForGroup.set(optionValue, {
                value: optionValue,
                label: optionLabel,
            });
            groupOptions.set(groupKey, optionsForGroup);
        });
    });

    return {
        targets: CALENDAR_FILTER_TARGET_DEFINITIONS.map((definition) => ({
            key: definition.key,
            labelPath: definition.labelPath,
        })),
        groups: CALENDAR_FILTER_TARGET_DEFINITIONS.reduce((accumulator, definition) => {
            if (!definition.groups) {
                return accumulator;
            }

            accumulator[definition.key] = definition.groups.reduce((groupAccumulator, group) => {
                const optionsForGroup =
                    groupOptions.get(`${definition.key}:${group.key}`) ?? new Map();
                const sortedOptions =
                    definition.key === "adventureIsland" && group.key === "rewards"
                        ? sortAdventureIslandRewardOptions([...optionsForGroup.values()])
                        : sortFilterOptions([...optionsForGroup.values()]);

                groupAccumulator[group.key] = {
                    labelPath: group.labelPath,
                    options: sortedOptions,
                };

                return groupAccumulator;
            }, {});

            return accumulator;
        }, {}),
    };
}

export function mergeCalendarFilterState(previousState, filterOptions) {
    const targets = Object.fromEntries(
        filterOptions.targets.map((target) => [
            target.key,
            previousState?.targets?.[target.key] ?? true,
        ]),
    );
    const groups = Object.fromEntries(
        Object.entries(filterOptions.groups).map(([targetKey, targetGroups]) => [
            targetKey,
            Object.fromEntries(
                Object.entries(targetGroups).map(([groupKey, group]) => [
                    groupKey,
                    Object.fromEntries(
                        group.options.map((option) => [
                            option.value,
                            previousState?.groups?.[targetKey]?.[groupKey]?.[option.value] ?? true,
                        ]),
                    ),
                ]),
            ),
        ]),
    );

    return {
        targets,
        groups,
    };
}

export function filterCalendarEvents(events, filterState) {
    return events.filter((event) => {
        const targetKey = getEventFilterTarget(event);

        if (!targetKey) {
            return true;
        }

        if (!filterState.targets?.[targetKey]) {
            return false;
        }

        if (targetKey !== "adventureIsland") {
            if (targetKey === "notice") {
                const noticeCategory = getNoticeCategoryFilterValue(event);

                if (
                    noticeCategory &&
                    filterState.groups?.notice?.categories?.[noticeCategory] === false
                ) {
                    return false;
                }
            }

            return true;
        }

        const { islandName, rewardName } = getAdventureIslandFilterValues(event);

        if (
            islandName &&
            filterState.groups?.adventureIsland?.islands?.[islandName] === false
        ) {
            return false;
        }

        if (
            rewardName &&
            filterState.groups?.adventureIsland?.rewards?.[rewardName] === false
        ) {
            return false;
        }

        return true;
    });
}
