import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { fetchLostArkCalendarEvents } from "./api/lostark";
import { currentLanguage, getCalendarLocale, t } from "./i18n";
import "./App.css";

const CALENDAR_FIRST_DAY_STORAGE_KEY = "calendar-first-day";
const CALENDAR_FIRST_DAY_OPTIONS = [
    { value: 0, label: "일요일" },
    { value: 1, label: "월요일" },
    { value: 3, label: "수요일" },
];

function getStoredCalendarFirstDay() {
    const storedValue = window.localStorage.getItem(CALENDAR_FIRST_DAY_STORAGE_KEY);
    const parsedValue = Number(storedValue);
    const isValidOption = CALENDAR_FIRST_DAY_OPTIONS.some(
        (option) => option.value === parsedValue,
    );

    return isValidOption ? parsedValue : 0;
}

function App() {
    const language = currentLanguage;
    const [events, setEvents] = useState([]);
    const [calendarFirstDay, setCalendarFirstDay] = useState(() => getStoredCalendarFirstDay());

    useEffect(() => {
        let isMounted = true;

        async function loadEvents() {
            try {
                const calendarEvents = await fetchLostArkCalendarEvents();

                if (isMounted) {
                    setEvents(calendarEvents);
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

    return (
        <main className="app-shell">
            <section className="calendar-panel">
                <div className="calendar-copy">
                    <p className="eyebrow">{t("app.eyebrow", language)}</p>
                    <h1>{t("app.title", language)}</h1>
                    <p className="description">{t("app.description", language)}</p>
                </div>

                <div className="calendar-settings">
                    <label className="calendar-settings-label" htmlFor="calendar-first-day">
                        시작 요일
                    </label>
                    <select
                        id="calendar-first-day"
                        className="calendar-settings-select"
                        value={calendarFirstDay}
                        onChange={(event) => {
                            setCalendarFirstDay(Number(event.target.value));
                        }}
                    >
                        {CALENDAR_FIRST_DAY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
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
                        events={events}
                    />
                </div>
            </section>
        </main>
    );
}

export default App;
