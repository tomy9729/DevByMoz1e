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
      <FullCalendar
        ref="calendarRef"
        class="calendar-fullcalendar"
        :options="calendarOptions"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import koLocale from '@fullcalendar/core/locales/ko'
import Button from 'primevue/button'
import Select from 'primevue/select'
import CalendarSideBar from './CalendarSideBar.vue'
import { getCalendars, type CalendarListItem } from './CalendarFetcher'

defineOptions({
  name: 'Page_Calendar',
})

// Page state.
const selectedDate = ref<Date | null>(new Date())
const activeCalendarGroups = ref(['lostark', 'mine'])
const selectedCalendarId = ref<string | null>(null)
const calendars = ref<CalendarListItem[]>([])
const isCalendarListLoading = ref(false)
const calendarListErrorMessage = ref('')

// FullCalendar view settings.
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
const currentCalendarTitle = ref('')
const selectedCalendarView = ref('month')
const calendarViewOptions = [
  { id: 'year', name: '년간 달력' },
  { id: 'month', name: '월간 달력' },
  { id: 'week', name: '주간 달력' },
]

const calendarOptions = {
  plugins: [dayGridPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: false as const,
  datesSet(calendarInfo: { view: { title: string } }): void {
    currentCalendarTitle.value = calendarInfo.view.title
  },
  locale: koLocale,
  height: '100%',
  expandRows: true,
  fixedWeekCount: false,
  weekends: true,
  dayMaxEventRows: true,
  handleWindowResize: true,
}

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

/**
 * Handles add schedule button click.
 *
 * @returns void
 * @public
 */
function onClickAddSchedule(): void {
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
