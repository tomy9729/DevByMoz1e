import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { fetchLostArkCalendarEvents } from "./api/lostark";
import { currentLanguage, getCalendarLocale, t } from "./i18n";
import "./App.css";

function App() {
    const language = currentLanguage;
    const [events, setEvents] = useState([]);

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

    return (
        <main className="app-shell">
            <section className="calendar-panel">
                <div className="calendar-copy">
                    <p className="eyebrow">{t("app.eyebrow", language)}</p>
                    <h1>{t("app.title", language)}</h1>
                    <p className="description">{t("app.description", language)}</p>
                </div>

                <div className="calendar-frame">
                    <FullCalendar
                        plugins={[dayGridPlugin]}
                        initialView="dayGridMonth"
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
