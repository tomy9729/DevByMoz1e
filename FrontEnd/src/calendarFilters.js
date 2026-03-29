const CALENDAR_FILTER_TARGET_DEFINITIONS = [
    {
        key: "event",
        labelPath: "filters.targets.event",
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
    {
        key: "chaosGate",
        labelPath: "filters.targets.chaosGate",
    },
    {
        key: "fieldBoss",
        labelPath: "filters.targets.fieldBoss",
    },
];

function getTargetDefinition(targetKey) {
    return (
        CALENDAR_FILTER_TARGET_DEFINITIONS.find((definition) => definition.key === targetKey) ??
        null
    );
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

export function buildCalendarFilterOptions(events) {
    const groupOptions = new Map();

    events.forEach((event) => {
        const targetKey = getEventFilterTarget(event);
        const targetDefinition = getTargetDefinition(targetKey);

        if (!targetDefinition) {
            return;
        }

        targetDefinition.groups?.forEach((groupDefinition) => {
            const optionValue = groupDefinition.optionValueFromEvent(event);
            const optionLabel = groupDefinition.optionLabelFromEvent(event);

            if (!optionValue || !optionLabel) {
                return;
            }

            const groupKey = `${targetKey}:${groupDefinition.key}`;
            const optionsForGroup = groupOptions.get(groupKey) ?? new Map();

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

                groupAccumulator[group.key] = {
                    labelPath: group.labelPath,
                    options: sortFilterOptions([...optionsForGroup.values()]),
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
