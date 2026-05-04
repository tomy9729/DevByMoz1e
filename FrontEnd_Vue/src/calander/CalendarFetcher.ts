export interface CalendarListItem {
    id: string
    name: string
    defaultColor: string
    iconUrl: string
    isVisible: boolean
    sortOrder: number
    sourceType: string
    createdAt?: string
    updatedAt?: string
}

export interface CalendarScheduleItem {
    id: string
    title: string
    description?: string | null
    color?: string | null
    displayColor?: string | null
    sourceType?: string
    times: CalendarScheduleTimeItem[]
    calendar: CalendarListItem
}

export interface CalendarScheduleTimeItem {
    id: string
    eventId: string
    startDateTime: string
    endDateTime: string
    sortOrder: number
}

export interface CalendarScheduleQuery {
    startDate: string
    endDate: string
}

export interface CalendarScheduleTimePayload {
    startDateTime: Date
    endDateTime: Date
}

export interface CalendarScheduleMutationPayload {
    calendarId: string
    title: string
    description?: string
    times: CalendarScheduleTimePayload[]
}

const API_BASE_URL_LIST = [
    "http://localhost:3000",
    "https://hatchling-keep-progeny.ngrok-free.dev",
]

/**
 * Creates a server API URL.
 *
 * @param baseUrl Server base URL.
 * @param path API path starting with `/api`.
 * @returns Server API URL.
 * @private
 */
function createApiUrl(baseUrl: string, path: string): string {
    return `${baseUrl}${path}`
}

/**
 * Requests server API with local backend first and ngrok backend fallback.
 *
 * @param path API path starting with `/api`.
 * @param init Fetch request options.
 * @returns Server API response.
 * @private
 */
function requestApi(path: string, init?: RequestInit): Promise<Response> {
    return fetch(createApiUrl(API_BASE_URL_LIST[0], path), init).catch(
        (error: unknown) => {
            return fetch(createApiUrl(API_BASE_URL_LIST[1], path), init).catch(
                () => {
                    // 두 번째 fallback도 실패하면, 최초 실패한 로컬 서버의 에러를 기록한다.
                    console.error(error)
                    throw error
                },
            )
        },
    )
}

/**
 * Gets calendar list from server.
 *
 * @returns Calendar list.
 * @public
 */
export function getCalendars(): Promise<CalendarListItem[]> {
    return requestApi("/api/calendars", {
        headers: {
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
        },
    }).then((response) => {
        if (!response.ok) {
            return response
                .json()
                .catch(() => null)
                .then((errorBody: unknown): never => {
                    const message = (errorBody as { message?: string } | null)
                        ?.message
                    console.error(message ?? errorBody ?? response)
                    throw new Error(
                        `Failed to get calendars. status=${response.status}`,
                    )
                })
        }

        return response.json() as Promise<CalendarListItem[]>
    })
}

/**
 * Gets calendar schedules with their time list.
 *
 * @param query Schedule range query.
 * @returns Calendar schedule list.
 * @public
 */
export function getCalendarSchedules(
    query: CalendarScheduleQuery,
): Promise<CalendarScheduleItem[]> {
    const searchParams = new URLSearchParams({
        startDate: query.startDate,
        endDate: query.endDate,
    })

    return requestApi(`/api/schedules?${searchParams.toString()}`, {
        headers: {
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
        },
    }).then((response) => {
        if (!response.ok) {
            return response
                .json()
                .catch(() => null)
                .then((errorBody: unknown): never => {
                    const message = (errorBody as { message?: string } | null)
                        ?.message
                    console.error(message ?? errorBody ?? response)
                    throw new Error(
                        `Failed to get schedules. status=${response.status}`,
                    )
                })
        }

        return response.json() as Promise<CalendarScheduleItem[]>
    })
}

/**
 * Creates a user calendar schedule.
 *
 * @param payload Schedule creation payload.
 * @returns Created schedule.
 * @public
 */
export function createCalendarSchedule(
    payload: CalendarScheduleMutationPayload,
): Promise<CalendarScheduleItem> {
    return requestApi("/api/calendar/events", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
    }).then((response) => {
        if (!response.ok) {
            return response
                .json()
                .catch(() => null)
                .then((errorBody: unknown): never => {
                    const message = (errorBody as { message?: string } | null)
                        ?.message
                    console.error(message ?? errorBody ?? response)
                    throw new Error(
                        `Failed to create schedule. status=${response.status}`,
                    )
                })
        }

        return response.json() as Promise<CalendarScheduleItem>
    })
}

/**
 * Updates a user calendar schedule.
 *
 * @param scheduleId Schedule id.
 * @param payload Schedule update payload.
 * @returns Updated schedule.
 * @public
 */
export function updateCalendarSchedule(
    scheduleId: string,
    payload: CalendarScheduleMutationPayload,
): Promise<CalendarScheduleItem> {
    return requestApi(`/api/calendar/events/${scheduleId}`, {
        method: "PATCH",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
    }).then((response) => {
        if (!response.ok) {
            return response
                .json()
                .catch(() => null)
                .then((errorBody: unknown): never => {
                    const message = (errorBody as { message?: string } | null)
                        ?.message
                    console.error(message ?? errorBody ?? response)
                    throw new Error(
                        `Failed to update schedule. status=${response.status}`,
                    )
                })
        }

        return response.json() as Promise<CalendarScheduleItem>
    })
}
