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
  allDay: boolean
  sortOrder: number
}

export interface CalendarScheduleQuery {
  startDate: string
  endDate: string
}

export interface CalendarScheduleTimePayload {
  startDateTime: Date
  endDateTime: Date
  allDay?: boolean
}

export interface CalendarScheduleMutationPayload {
  calendarId: string
  title: string
  description?: string
  times: CalendarScheduleTimePayload[]
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

/**
 * Gets calendar list from server.
 *
 * @returns Calendar list.
 * @public
 */
export function getCalendars(): Promise<CalendarListItem[]> {
  return fetch(`${API_BASE_URL}/api/calendars`, {
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to get calendars. status=${response.status}`)
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
export function getCalendarSchedules(query: CalendarScheduleQuery): Promise<CalendarScheduleItem[]> {
  const searchParams = new URLSearchParams({
    startDate: query.startDate,
    endDate: query.endDate,
  })

  return fetch(`${API_BASE_URL}/api/schedules?${searchParams.toString()}`, {
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to get schedules. status=${response.status}`)
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
  return fetch(`${API_BASE_URL}/api/calendar/events`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify(payload),
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to create schedule. status=${response.status}`)
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
  return fetch(`${API_BASE_URL}/api/calendar/events/${scheduleId}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify(payload),
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to update schedule. status=${response.status}`)
    }

    return response.json() as Promise<CalendarScheduleItem>
  })
}
