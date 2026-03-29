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

/**
 * 역할: localStorage에 저장된 달력 시작 요일을 읽어 온다.
 * 파라미터 설명: 없음
 * 반환값 설명: 허용된 시작 요일 숫자값, 없거나 잘못되면 0(일요일)
 */
function getStoredCalendarFirstDay() {
    const storedValue = window.localStorage.getItem(CALENDAR_FIRST_DAY_STORAGE_KEY);
    const parsedValue = Number(storedValue);
    const isValidOption = CALENDAR_FIRST_DAY_OPTIONS.some(
        (option) => option.value === parsedValue,
    );

    return isValidOption ? parsedValue : 0;
}

/**
 * 역할: 달력 화면을 렌더링하고 일정/시작 요일 상태를 관리한다.
 * 파라미터 설명: 없음
 * 반환값 설명: 달력 화면 JSX
 */
function App() {
    const language = currentLanguage;
    const [events, setEvents] = useState([]);
    const [calendarFirstDay, setCalendarFirstDay] = useState(() => getStoredCalendarFirstDay());

    // 일정 데이터 조회 시작
    useEffect(() => {
        let isMounted = true;

        /**
         * 역할: 로스트아크 일정을 조회해 화면 상태에 저장한다.
         * 파라미터 설명: 없음
         * 반환값 설명: Promise<void>
         */
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
    // 일정 데이터 조회 끝

    // 시작 요일 설정 저장 시작
    useEffect(() => {
        window.localStorage.setItem(
            CALENDAR_FIRST_DAY_STORAGE_KEY,
            String(calendarFirstDay),
        );
    }, [calendarFirstDay]);
    // 시작 요일 설정 저장 끝

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
                        // props 목적: 사용자가 선택한 시작 요일을 달력의 왼쪽 시작 기준으로 전달한다.
                        firstDay={calendarFirstDay}
                        // props 목적: 프로젝트 언어 설정과 동일한 locale을 달력에 전달한다.
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
                        // props 목적: 가공 완료된 로스트아크 일정 배열을 달력에 전달한다.
                        events={events}
                    />
                </div>
            </section>
        </main>
    );
}

export default App;
