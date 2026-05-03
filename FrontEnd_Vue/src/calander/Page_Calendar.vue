<template>
  <section class="calendar-page">
    <CalendarSideBar
      v-model:selectedDate="selectedDate"
      v-model:activeCalendarGroups="activeCalendarGroups"
      :selected-calendar-id="selectedCalendarId"
      :lostark-calendars="lostarkCalendars"
      :my-calendars="myCalendars"
      :is-calendar-list-loading="isCalendarListLoading"
      :calendar-list-error-message="calendarListErrorMessage"
      @select-calendar="setSelectedCalendar"
      @click-add-schedule="onClickAddSchedule"
      @click-add-calendar="onClickAddCalendar"
    />
    <section class="calendar-area">
      <div class="calendar-toolbar">
        <div class="calendar-toolbar-left">
          <Button
            label="오늘"
            size="small"
            @click="onClickToday"
          />
          <Button
            icon="pi pi-chevron-left"
            size="small"
            text
            aria-label="이전"
            @click="onClickPrev"
          />
          <Button
            icon="pi pi-chevron-right"
            size="small"
            text
            aria-label="다음"
            @click="onClickNext"
          />
          <h2 class="calendar-toolbar-title">{{ currentCalendarTitle }}</h2>
        </div>
        <div class="calendar-toolbar-right">
          <Button
            icon="pi pi-search"
            size="small"
            text
            aria-label="검색"
            @click="onClickSearch"
          />
          <Button
            icon="pi pi-cog"
            size="small"
            text
            aria-label="설정"
            @click="onClickSetting"
          />
          <Select
            v-model="selectedCalendarView"
            class="calendar-view-select"
            :options="calendarViewOptions"
            option-label="name"
            option-value="id"
          />
        </div>
      </div>
      <p v-if="isScheduleLoading" class="calendar-loading-message">일정 불러오는 중...</p>
      <p v-else-if="scheduleErrorMessage" class="calendar-error-message">
        {{ scheduleErrorMessage }}
      </p>
      <FullCalendar
        ref="calendarRef"
        class="calendar-fullcalendar"
        :options="calendarOptions"
      />
    </section>
    <ScheduleEventPopup
      v-model:visible="schedulePopupStuff.visible"
      :mode="schedulePopupStuff.mode"
      :schedule="schedulePopupStuff.schedule"
      :calendars="calendars"
      :selected-calendar-id="selectedCalendarId"
      :selected-date="selectedDate"
      @save="saveSchedulePopup"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
const isScheduleLoading = ref(false)
const scheduleErrorMessage = ref('')
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
  { id: 'year', name: '년간 달력' },
  { id: 'month', name: '월간 달력' },
  { id: 'week', name: '주간 달력' },
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
    .flatMap(mapScheduleToCalendarEvents)
})

const calendarOptions = computed(() => {
  return {
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
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

function mapScheduleToCalendarEvents(schedule: CalendarScheduleItem): EventInput[] {
  const displayColor =
    schedule.displayColor ?? schedule.color ?? schedule.calendar.defaultColor

  return schedule.times.map((time) => ({
      id: `${schedule.id}:${time.id}`,
      title: schedule.title,
      start: time.startDateTime,
      end: time.endDateTime,
      allDay: time.allDay,
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
    }))
}

function getScheduleList(startDate: string, endDate: string): void {
  const requestId = ++scheduleRequestSequence

  isScheduleLoading.value = true
  scheduleErrorMessage.value = ''
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
      scheduleErrorMessage.value = '일정 목록을 불러오지 못했습니다.'
    })
    .finally(() => {
      if (requestId !== scheduleRequestSequence) {
        return
      }

      isScheduleLoading.value = false
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

  scheduleErrorMessage.value = ''

  saveRequest
    .then(() => {
      schedulePopupStuff.value.visible = false
      refreshCurrentScheduleList()
    })
    .catch(() => {
      scheduleErrorMessage.value = '일정을 저장하지 못했습니다.'
    })
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
