const LOSTARK_EVENTS_ENDPOINT = "/api/lostark/news/events";

function toDateOnly(dateTime) {
    return dateTime.split("T")[0];
}

function toLocalDateOnly(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function addOneDay(dateText) {
    const [year, month, day] = dateText.split("-").map(Number);
    const nextDate = new Date(year, month - 1, day + 1);
    const nextYear = nextDate.getFullYear();
    const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
    const nextDay = String(nextDate.getDate()).padStart(2, "0");

    return `${nextYear}-${nextMonth}-${nextDay}`;
}

function isOngoingEvent(startDate, endDate, now = new Date()) {
    const start = toDateOnly(startDate);
    const end = toDateOnly(endDate);
    const today = toLocalDateOnly(now);

    return start <= today && today <= end;
}

export function mapLostArkEventToCalendarEvent(event) {
    const start = toDateOnly(event.StartDate);
    const inclusiveEnd = toDateOnly(event.EndDate);

    return {
        id: `${event.Title}-${event.StartDate}`,
        title: event.Title,
        start,
        end: addOneDay(inclusiveEnd),
        allDay: true,
        url: event.Link,
        extendedProps: {
            link: event.Link,
            sourceStartDate: event.StartDate,
            sourceEndDate: event.EndDate,
        },
    };
}

export async function fetchLostArkCalendarEvents() {
    const response = await fetch(LOSTARK_EVENTS_ENDPOINT, {
        headers: {
            accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch Lost Ark events: ${response.status}`);
    }

    const events = await response.json();

    return events
        .filter((event) => isOngoingEvent(event.StartDate, event.EndDate))
        .map((event) => mapLostArkEventToCalendarEvent(event));
}
