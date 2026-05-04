<template>
    <section class="calendar-page">
        <CalendarSideBar v-model:selectedDate="selectedDate" v-model:activeCalendarGroups="activeCalendarGroups"
            :selected-calendar-id="selectedCalendarId" :lostark-calendars="lostarkCalendars" :my-calendars="myCalendars"
            :is-calendar-list-loading="isCalendarListLoading" :calendar-list-error-message="calendarListErrorMessage"
            @select-calendar="setSelectedCalendar" @click-add-schedule="onClickAddSchedule"
            @click-add-calendar="onClickAddCalendar" @select-date="moveCalendarToDate" />
        <section class="calendar-area">
            <div class="calendar-toolbar">
                <div class="calendar-toolbar-left">
                    <Button label="오늘" size="small" @click="onClickToday" />
                    <Button icon="pi pi-chevron-left" size="small" text aria-label="이전" @click="onClickPrev" />
                    <Button icon="pi pi-chevron-right" size="small" text aria-label="다음" @click="onClickNext" />
                    <h2 class="calendar-toolbar-title">{{ currentCalendarTitle }}</h2>
                </div>
                <div class="calendar-toolbar-right">
                    <Button icon="pi pi-search" size="small" text aria-label="검색" @click="onClickSearch" />
                    <Button icon="pi pi-cog" size="small" text aria-label="설정" @click="onClickSetting" />
                    <Select v-model="selectedCalendarView" class="calendar-view-select" :options="calendarViewOptions"
                        option-label="name" option-value="id" />
                </div>
            </div>
            <FullCalendar ref="calendarRef" class="calendar-fullcalendar" :options="calendarOptions" />
        </section>
        <ScheduleEventPopup v-model:visible="schedulePopupStuff.visible" :mode="schedulePopupStuff.mode"
            :schedule="schedulePopupStuff.schedule" :calendars="calendars" :selected-calendar-id="selectedCalendarId"
            :selected-date="selectedDate" @save="saveSchedulePopup" />
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { EventClickArg, EventInput } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import koLocale from '@fullcalendar/core/locales/ko'
import Button from 'primevue/button'
import Select from 'primevue/select'
import CalendarSideBar from './CalendarSideBar.vue'
import ScheduleEventPopup, {
    type ScheduleEventPopupSavePayload,
} from './ScheduleEventPopup.vue'
import {
    createCalendarSchedule,
    getCalendarSchedules,
    getCalendars,
    updateCalendarSchedule,
    type CalendarListItem,
    type CalendarScheduleItem,
    type CalendarScheduleTimeItem,
    type CalendarScheduleMutationPayload,
} from './CalendarFetcher'

defineOptions({
    name: 'Page_Calendar',
})

// Page state.
const selectedDate = ref<Date | null>(new Date())
const activeCalendarGroups = ref(['lostark', 'mine'])
const selectedCalendarId = ref<string | null>(null)
const calendars = ref<CalendarListItem[]>([])
const schedules = ref<CalendarScheduleItem[]>([])
const isCalendarListLoading = ref(false)
const calendarListErrorMessage = ref('')
const schedulePopupStuff = ref<{
    visible: boolean
    mode: 'add' | 'edit'
    schedule: CalendarScheduleItem | null
}>({
    visible: false,
    mode: 'add',
    schedule: null,
})

// FullCalendar view settings.
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
const currentCalendarTitle = ref('')
const selectedCalendarView = ref('month')
const currentScheduleRange = ref<{ startDate: string; endDate: string } | null>(null)
let scheduleRequestSequence = 0
const calendarViewOptions = [
    { id: 'year', name: '년간' },
    { id: 'month', name: '월간' },
    { id: 'week', name: '주간' },
]

const visibleCalendarIds = computed(() => {
    return calendars.value
        .filter((calendarItem) => calendarItem.isVisible)
        .map((calendarItem) => calendarItem.id)
})

const visibleEvents = computed(() => {
    const visibleCalendarIdSet = new Set(visibleCalendarIds.value)

    return schedules.value
        .filter((schedule) => visibleCalendarIdSet.has(schedule.calendar.id))
        .flatMap((schedule) => mapScheduleToCalendarEvents(schedule, selectedCalendarView.value))
})

const calendarOptions = computed(() => {
    return {
        plugins: [dayGridPlugin],
        initialView: getCalendarFullCalendarView(selectedCalendarView.value),
        headerToolbar: false as const,
        datesSet: handleDatesSet,
        displayEventTime: false,
        locale: koLocale,
        height: '100%',
        expandRows: true,
        fixedWeekCount: false,
        weekends: true,
        dayMaxEventRows: true,
        handleWindowResize: true,
        eventClick: onClickCalendarEvent,
        events: visibleEvents.value,
    }
})

// Derived calendar groups for the sidebar.
const lostarkCalendars = computed(() => {
    return calendars.value.filter((calendarItem) => calendarItem.sourceType === 'lostark')
})

const myCalendars = computed(() => {
    return calendars.value.filter((calendarItem) => calendarItem.sourceType === 'user')
})

/**
 * Handles calendar selection.
 *
 * @param calendarId Calendar id.
 * @returns void
 * @public
 */
function setSelectedCalendar(calendarId: string): void {
    selectedCalendarId.value = calendarId
}

function toDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number): Date {
    const nextDate = new Date(date)

    nextDate.setDate(nextDate.getDate() + days)

    return nextDate
}

/**
 * Moves FullCalendar to the selected date.
 *
 * @param date Selected date.
 * @returns void
 * @public
 */
function moveCalendarToDate(date: Date): void {
    if (Number.isNaN(date.getTime())) {
        return
    }

    calendarRef.value?.getApi().gotoDate(toDateKey(date))
}

/**
 * Gets FullCalendar day grid view name.
 *
 * @param calendarView Calendar view id.
 * @returns FullCalendar view name.
 * @public
 */
function getCalendarFullCalendarView(calendarView: string): string {
    if (calendarView === 'year') {
        return 'dayGridYear'
    }

    if (calendarView === 'week') {
        return 'dayGridWeek'
    }

    return 'dayGridMonth'
}

/**
 * Checks whether same-day representative display should be used.
 *
 * @param calendarView Calendar view id.
 * @returns Whether same-day times should be represented by one event.
 * @public
 */
function getIsRepresentativeCalendarView(calendarView: string): boolean {
    return calendarView === 'month' || calendarView === 'year'
}

/**
 * Gets date key from schedule time datetime.
 *
 * @param dateTime Schedule datetime string.
 * @returns Date key or null if the datetime is invalid.
 * @public
 */
function getScheduleTimeDateKey(dateTime: string): string | null {
    const datePartMatch = /^(\d{4}-\d{2}-\d{2})/.exec(dateTime)

    if (datePartMatch != null) {
        return datePartMatch[1]
    }

    const date = new Date(dateTime)

    if (Number.isNaN(date.getTime())) {
        return null
    }

    return toDateKey(date)
}

/**
 * Gets one representative schedule time per start date.
 *
 * @param times Schedule time list.
 * @returns Schedule times represented by date.
 * @public
 */
function getRepresentativeScheduleTimesByDate(times: CalendarScheduleTimeItem[]): CalendarScheduleTimeItem[] {
    if (times.length < 2) {
        return times
    }

    const dateKeySet = new Set<string>()
    const representativeTimes: CalendarScheduleTimeItem[] = []

    for (const time of times) {
        const dateKey = getScheduleTimeDateKey(time.startDateTime)

        if (dateKey == null) {
            return times
        }

        if (dateKeySet.has(dateKey)) {
            continue
        }

        dateKeySet.add(dateKey)
        representativeTimes.push(time)
    }

    return representativeTimes
}

/**
 * Gets schedule time label in HH:mm format.
 *
 * @param dateTime Schedule datetime string.
 * @returns Time label or null if the datetime is invalid.
 * @public
 */
function getScheduleTimeLabel(dateTime: string): string | null {
    const timePartMatch = /(?:T|\s)(\d{2}:\d{2})/.exec(dateTime)

    if (timePartMatch != null) {
        return timePartMatch[1]
    }

    const date = new Date(dateTime)

    if (Number.isNaN(date.getTime())) {
        return null
    }

    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${hours}:${minutes}`
}

/**
 * Creates a FullCalendar event title.
 *
 * @param title Schedule title.
 * @param time Schedule time item.
 * @param calendarView Calendar view id.
 * @returns FullCalendar event title.
 * @public
 */
function createScheduleCalendarEventTitle(
    title: string,
    time: CalendarScheduleTimeItem,
    calendarView: string,
): string {
    if (calendarView !== 'week') {
        return title
    }

    const timeLabel = getScheduleTimeLabel(time.startDateTime)

    if (timeLabel == null) {
        return title
    }

    const titlePrefixMatch = /^(\[(?:오전|오후)\])\s*(.*)$/.exec(title)

    if (titlePrefixMatch != null) {
        return `${titlePrefixMatch[1]} ${timeLabel} ${titlePrefixMatch[2]}`
    }

    return `${timeLabel} ${title}`
}

/**
 * Creates a FullCalendar event from schedule time.
 *
 * @param schedule Schedule item.
 * @param time Schedule time item.
 * @param displayColor Event display color.
 * @param calendarView Calendar view id.
 * @returns FullCalendar event.
 * @public
 */
function createScheduleCalendarEvent(
    schedule: CalendarScheduleItem,
    time: CalendarScheduleTimeItem,
    displayColor: string,
    calendarView: string,
): EventInput {
    return {
        id: `${schedule.id}:${time.id}`,
        title: createScheduleCalendarEventTitle(schedule.title, time, calendarView),
        start: time.startDateTime,
        end: time.endDateTime,
        backgroundColor: displayColor,
        borderColor: displayColor,
        extendedProps: {
            scheduleId: schedule.id,
            timeId: time.id,
            calendarId: schedule.calendar.id,
            calendarName: schedule.calendar.name,
            sourceType: schedule.sourceType ?? schedule.calendar.sourceType,
            description: schedule.description,
            displayColor,
        },
    }
}

/**
 * Maps schedule times to FullCalendar events.
 *
 * @param schedule Schedule item.
 * @param calendarView Calendar view id.
 * @returns FullCalendar events.
 * @public
 */
function mapScheduleToCalendarEvents(schedule: CalendarScheduleItem, calendarView: string): EventInput[] {
    const displayColor =
        schedule.displayColor ?? schedule.color ?? schedule.calendar.defaultColor
    const displayTimes =
        getIsRepresentativeCalendarView(calendarView)
            ? getRepresentativeScheduleTimesByDate(schedule.times)
            : schedule.times

    return displayTimes.map((time) => createScheduleCalendarEvent(schedule, time, displayColor, calendarView))
}

function getScheduleList(startDate: string, endDate: string): void {
    const requestId = ++scheduleRequestSequence

    schedules.value = []

    getCalendarSchedules({
        startDate,
        endDate,
    })
        .then((scheduleList) => {
            if (requestId !== scheduleRequestSequence) {
                return
            }

            schedules.value = Array.isArray(scheduleList) ? scheduleList : []
        })
        .catch(() => {
            if (requestId !== scheduleRequestSequence) {
                return
            }

            schedules.value = []
        })
}

function handleDatesSet(calendarInfo: { start: Date; end: Date; view: { title: string } }): void {
    currentCalendarTitle.value = calendarInfo.view.title

    const nextRange = {
        startDate: toDateKey(calendarInfo.start),
        endDate: toDateKey(addDays(calendarInfo.end, -1)),
    }

    if (
        currentScheduleRange.value?.startDate === nextRange.startDate &&
        currentScheduleRange.value?.endDate === nextRange.endDate
    ) {
        return
    }

    currentScheduleRange.value = nextRange
    getScheduleList(nextRange.startDate, nextRange.endDate)
}

/**
 * Opens the add schedule popup.
 *
 * @returns void
 * @public
 */
function onClickAddSchedule(): void {
    schedulePopupStuff.value = {
        visible: true,
        mode: 'add',
        schedule: null,
    }
}

/**
 * Opens the edit schedule popup from a calendar event click.
 *
 * @param eventClickInfo FullCalendar event click payload.
 * @returns void
 * @public
 */
function onClickCalendarEvent(eventClickInfo: EventClickArg): void {
    const scheduleId = eventClickInfo.event.extendedProps.scheduleId

    if (typeof scheduleId !== 'string') {
        return
    }

    const schedule = schedules.value.find((scheduleItem) => scheduleItem.id === scheduleId)

    if (schedule == null) {
        return
    }

    schedulePopupStuff.value = {
        visible: true,
        mode: 'edit',
        schedule,
    }
}

/**
 * Creates a schedule mutation payload from popup data.
 *
 * @param payload Popup save payload.
 * @returns Calendar schedule mutation payload.
 * @public
 */
function createScheduleMutationPayload(payload: ScheduleEventPopupSavePayload): CalendarScheduleMutationPayload {
    return {
        calendarId: payload.calendarId,
        title: payload.title,
        description: payload.description,
        times: payload.timeRanges,
    }
}

/**
 * Reloads schedules for the current visible range.
 *
 * @returns void
 * @public
 */
function refreshCurrentScheduleList(): void {
    if (currentScheduleRange.value == null) {
        return
    }

    getScheduleList(currentScheduleRange.value.startDate, currentScheduleRange.value.endDate)
}

/**
 * Saves popup schedule changes.
 *
 * @param payload Popup save payload.
 * @returns void
 * @public
 */
function saveSchedulePopup(payload: ScheduleEventPopupSavePayload): void {
    if (payload.timeRanges.length === 0) {
        return
    }

    const saveRequest =
        schedulePopupStuff.value.mode === 'edit' && payload.id != null
            ? updateCalendarSchedule(payload.id, createScheduleMutationPayload(payload))
            : createCalendarSchedule(createScheduleMutationPayload(payload))

    saveRequest
        .then(() => {
            schedulePopupStuff.value.visible = false
            refreshCurrentScheduleList()
        })
        .catch(() => undefined)
}

/**
 * Handles add calendar button click.
 *
 * @returns void
 * @public
 */
function onClickAddCalendar(): void {
    // TODO: Add calendar creation entry point.
}

/**
 * Moves calendar to today.
 *
 * @returns void
 * @public
 */
function onClickToday(): void {
    calendarRef.value?.getApi().today()
}

/**
 * Moves calendar to previous range.
 *
 * @returns void
 * @public
 */
function onClickPrev(): void {
    calendarRef.value?.getApi().prev()
}

/**
 * Moves calendar to next range.
 *
 * @returns void
 * @public
 */
function onClickNext(): void {
    calendarRef.value?.getApi().next()
}

/**
 * Handles search icon button click.
 *
 * @returns void
 * @public
 */
function onClickSearch(): void {
}

/**
 * Handles setting icon button click.
 *
 * @returns void
 * @public
 */
function onClickSetting(): void {
}

// Calendar list loading.
/**
 * Loads calendar list from server.
 *
 * @returns void
 * @public
 */
function getCalendarList(): void {
    isCalendarListLoading.value = true
    calendarListErrorMessage.value = ''

    getCalendars()
        .then((calendarList) => {
            calendars.value = Array.isArray(calendarList) ? calendarList : []
            selectedCalendarId.value = calendars.value[0]?.id ?? null
        })
        .catch(() => {
            calendars.value = []
            selectedCalendarId.value = null
            calendarListErrorMessage.value = '캘린더 목록을 불러오지 못했습니다.'
        })
        .finally(() => {
            isCalendarListLoading.value = false
        })
}

// Initial data load.
onMounted(() => {
    getCalendarList()
})

watch(selectedCalendarView, (nextCalendarView) => {
    calendarRef.value?.getApi().changeView(getCalendarFullCalendarView(nextCalendarView))
})
</script>

<style scoped>
.calendar-area {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
}

.calendar-fullcalendar {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
}
</style>
