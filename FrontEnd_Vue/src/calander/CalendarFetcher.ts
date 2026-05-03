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
  startDateTime: string
  endDateTime: string
  allDay: boolean
  color?: string | null
  displayColor?: string | null
  calendar: CalendarListItem
}

export interface CalendarScheduleQuery {
  startDate: string
  endDate: string
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

export function getCalendarSchedules(
  query: CalendarScheduleQuery,
): Promise<CalendarScheduleItem[]> {
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
