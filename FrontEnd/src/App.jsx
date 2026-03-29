import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { fetchLostArkCalendarEvents } from "./api/lostark";
import {
    buildCalendarFilterOptions,
    filterCalendarEvents,
    mergeCalendarFilterState,
} from "./calendarFilters";
import { currentLanguage, getCalendarLocale, t } from "./i18n";
import "./App.css";

const CALENDAR_FIRST_DAY_STORAGE_KEY = "calendar-first-day";
const CALENDAR_FIRST_DAY_OPTION_VALUES = [0, 1, 3];

function getStoredCalendarFirstDay() {
    const storedValue = window.localStorage.getItem(CALENDAR_FIRST_DAY_STORAGE_KEY);
    const parsedValue = Number(storedValue);
    const isValidOption = CALENDAR_FIRST_DAY_OPTION_VALUES.includes(parsedValue);

    return isValidOption ? parsedValue : 0;
}

function App() {
    const language = currentLanguage;
    const calendarFirstDayOptions = [
        {
            value: 0,
            label: t("calendar.firstDayOptions.sunday", language),
        },
        {
            value: 1,
            label: t("calendar.firstDayOptions.monday", language),
        },
        {
            value: 3,
            label: t("calendar.firstDayOptions.wednesday", language),
        },
    ];
    const [allEvents, setAllEvents] = useState([]);
    const [calendarFirstDay, setCalendarFirstDay] = useState(() => getStoredCalendarFirstDay());
    const [calendarFilters, setCalendarFilters] = useState({
        targets: {},
        groups: {},
    });

    const filterOptions = buildCalendarFilterOptions(allEvents);
    const visibleEvents = filterCalendarEvents(allEvents, calendarFilters);

    useEffect(() => {
        let isMounted = true;

        async function loadEvents() {
            try {
                const calendarEvents = await fetchLostArkCalendarEvents();

                if (isMounted) {
                    setAllEvents(calendarEvents);
                    setCalendarFilters((previousFilters) =>
                        mergeCalendarFilterState(
                            previousFilters,
                            buildCalendarFilterOptions(calendarEvents),
                        ),
                    );
                }
            } catch (error) {
                console.error("Failed to load Lost Ark events.", error);
            }
        }

        loadEvents();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        window.localStorage.setItem(
            CALENDAR_FIRST_DAY_STORAGE_KEY,
            String(calendarFirstDay),
        );
    }, [calendarFirstDay]);

    function updateTargetFilter(targetKey, checked) {
        setCalendarFilters((previousFilters) => ({
            ...previousFilters,
            targets: {
                ...previousFilters.targets,
                [targetKey]: checked,
            },
        }));
    }

    function updateGroupFilter(targetKey, groupKey, value, checked) {
        setCalendarFilters((previousFilters) => ({
            ...previousFilters,
            groups: {
                ...previousFilters.groups,
                [targetKey]: {
                    ...previousFilters.groups[targetKey],
                    [groupKey]: {
                        ...previousFilters.groups[targetKey]?.[groupKey],
                        [value]: checked,
                    },
                },
            },
        }));
    }

    return (
        <main className="app-shell">
            <section className="calendar-panel">
                <div className="calendar-copy">
                    <p className="eyebrow">{t("app.eyebrow", language)}</p>
                    <h1>{t("app.title", language)}</h1>
                    <p className="description">{t("app.description", language)}</p>
                </div>

                <div className="calendar-controls">
                    <div className="calendar-settings">
                        <label className="calendar-settings-label" htmlFor="calendar-first-day">
                            {t("calendar.firstDayLabel", language)}
                        </label>
                        <select
                            id="calendar-first-day"
                            className="calendar-settings-select"
                            value={calendarFirstDay}
                            onChange={(event) => {
                                setCalendarFirstDay(Number(event.target.value));
                            }}
                        >
                            {calendarFirstDayOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <section className="calendar-filter-panel" aria-label={t("filters.title", language)}>
                        <div className="calendar-filter-copy">
                            <h2>{t("filters.title", language)}</h2>
                            <p>{t("filters.description", language)}</p>
                        </div>

                        <div className="calendar-filter-groups">
                            {filterOptions.targets.map((target) => {
                                const targetGroups = filterOptions.groups[target.key] ?? {};
                                const isTargetEnabled = calendarFilters.targets[target.key] ?? true;
                                const hasTargetGroups = Object.keys(targetGroups).length > 0;

                                return (
                                    <div key={target.key} className="calendar-filter-group">
                                        <label className="calendar-filter-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={isTargetEnabled}
                                                onChange={(event) => {
                                                    updateTargetFilter(target.key, event.target.checked);
                                                }}
                                            />
                                            <span>{t(target.labelPath, language)}</span>
                                        </label>

                                        {hasTargetGroups && (
                                            <div
                                                className={`calendar-filter-subgroups ${
                                                    isTargetEnabled
                                                        ? ""
                                                        : "calendar-filter-subgroups-disabled"
                                                }`}
                                            >
                                                {Object.entries(targetGroups).map(([groupKey, group]) => (
                                                    <section
                                                        key={`${target.key}-${groupKey}`}
                                                        className="calendar-filter-subgroup"
                                                        aria-label={t(group.labelPath, language)}
                                                    >
                                                        <p className="calendar-filter-subgroup-title">
                                                            {t(group.labelPath, language)}
                                                        </p>
                                                        <div className="calendar-filter-option-list">
                                                            {group.options.map((option) => (
                                                                <label
                                                                    key={`${target.key}-${groupKey}-${option.value}`}
                                                                    className="calendar-filter-checkbox"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={
                                                                            calendarFilters.groups?.[target.key]?.[
                                                                                groupKey
                                                                            ]?.[option.value] ?? true
                                                                        }
                                                                        disabled={!isTargetEnabled}
                                                                        onChange={(event) => {
                                                                            updateGroupFilter(
                                                                                target.key,
                                                                                groupKey,
                                                                                option.value,
                                                                                event.target.checked,
                                                                            );
                                                                        }}
                                                                    />
                                                                    <span>{option.label}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </section>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                <div className="calendar-frame">
                    <FullCalendar
                        plugins={[dayGridPlugin]}
                        initialView="dayGridMonth"
                        firstDay={calendarFirstDay}
                        locale={language}
                        locales={[getCalendarLocale(language)]}
                        headerToolbar={{
                            left: "prev,next today",
                            center: "title",
                            right: "",
                        }}
                        buttonText={{
                            today: t("calendar.buttons.today", language),
                        }}
                        eventClick={(info) => {
                            if (!info.event.url) {
                                return;
                            }

                            info.jsEvent.preventDefault();
                            window.open(info.event.url, "_blank", "noopener,noreferrer");
                        }}
                        height="auto"
                        events={visibleEvents}
                    />
                </div>
            </section>
        </main>
    );
}

export default App;
