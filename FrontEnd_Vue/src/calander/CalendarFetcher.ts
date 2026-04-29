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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://hatchling-keep-progeny.ngrok-free.dev'

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
