<template>
  <section class="calendar-page">
    <aside class="calendar-sidebar">
      <Button
        class="calendar-add-schedule-button"
        icon="pi pi-plus"
        label="일정 추가"
        @click="onClickAddSchedule"
      />
      <DatePicker
        v-model="selectedDate"
        class="calendar-mini-datepicker"
        inline
      />
      <Message v-if="calendarListErrorMessage" severity="error" size="small">
        {{ calendarListErrorMessage }}
      </Message>
      <Accordion v-model:value="activeCalendarGroups" multiple>
        <AccordionPanel value="lostark">
          <AccordionHeader>로스트아크 캘린더</AccordionHeader>
          <AccordionContent>
            <div class="calendar-list">
              <div
                v-for="calendarItem in lostarkCalendars"
                :key="calendarItem.id"
                class="calendar-list-item"
                :class="{ 'calendar-list-item-selected': calendarItem.id === selectedCalendarId }"
                @click="setSelectedCalendar(calendarItem.id)"
              >
                <Checkbox
                  v-model="calendarItem.isVisible"
                  binary
                  @click.stop
                />
                <span
                  v-if="calendarItem.name === '공지사항' || calendarItem.name === '패치노트'"
                  class="calendar-list-prime-icon"
                  :class="getCalendarPrimeIconClass(calendarItem.name)"
                  aria-hidden="true"
                ></span>
                <img
                  v-else-if="calendarItem.iconUrl != null && calendarItem.iconUrl !== ''"
                  class="calendar-list-icon"
                  :src="calendarItem.iconUrl"
                  :alt="`${calendarItem.name} 아이콘`"
                />
                <span
                  v-else
                  class="calendar-list-fallback-icon"
                  :style="{ backgroundColor: calendarItem.defaultColor }"
                  aria-hidden="true"
                ></span>
                <span class="calendar-list-name">{{ calendarItem.name }}</span>
              </div>
              <p v-if="!isCalendarListLoading && lostarkCalendars.length === 0" class="calendar-list-empty">
                표시할 캘린더가 없습니다.
              </p>
            </div>
          </AccordionContent>
        </AccordionPanel>
        <AccordionPanel value="mine">
          <AccordionHeader>
            <span class="calendar-accordion-header">
              <span>내 캘린더</span>
              <Button
                icon="pi pi-plus"
                text
                rounded
                size="small"
                aria-label="캘린더 추가"
                @click.stop="onClickAddCalendar"
              />
            </span>
          </AccordionHeader>
          <AccordionContent>
            <div class="calendar-list">
              <div
                v-for="calendarItem in myCalendars"
                :key="calendarItem.id"
                class="calendar-list-item"
                :class="{ 'calendar-list-item-selected': calendarItem.id === selectedCalendarId }"
                @click="setSelectedCalendar(calendarItem.id)"
              >
                <Checkbox
                  v-model="calendarItem.isVisible"
                  binary
                  @click.stop
                />
                <span
                  class="calendar-list-color"
                  :style="{ backgroundColor: calendarItem.defaultColor }"
                  aria-hidden="true"
                ></span>
                <span class="calendar-list-name">{{ calendarItem.name }}</span>
              </div>
              <p v-if="!isCalendarListLoading && myCalendars.length === 0" class="calendar-list-empty">
                추가된 캘린더가 없습니다.
              </p>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </aside>
    <section class="calendar-area"></section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Accordion from 'primevue/accordion'
import AccordionContent from 'primevue/accordioncontent'
import AccordionHeader from 'primevue/accordionheader'
import AccordionPanel from 'primevue/accordionpanel'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import DatePicker from 'primevue/datepicker'
import Message from 'primevue/message'
import { getCalendars, type CalendarListItem } from './CalendarFetcher'

defineOptions({
  name: 'Page_Calendar',
})

const selectedDate = ref<Date | null>(new Date())
const selectedCalendarId = ref<string | null>(null)
const calendars = ref<CalendarListItem[]>([])
const activeCalendarGroups = ref(['lostark', 'mine'])
const isCalendarListLoading = ref(false)
const calendarListErrorMessage = ref('')

const lostarkCalendars = computed(() => {
  return calendars.value.filter((calendarItem) => calendarItem.sourceType === 'lostark')
})

const myCalendars = computed(() => {
  return calendars.value.filter((calendarItem) => calendarItem.sourceType === 'user')
})

/**
 * Gets PrimeVue icon class for built-in calendar labels.
 *
 * @param calendarName Calendar name.
 * @returns Prime icon class name.
 * @public
 */
function getCalendarPrimeIconClass(calendarName: string): string {
  if (calendarName === '공지사항') {
    return 'pi pi-bell'
  }

  if (calendarName === '패치노트') {
    return 'pi pi-file-edit'
  }

  return ''
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
 * Sets selected calendar id.
 *
 * @param calendarId Calendar id.
 * @returns void
 * @public
 */
function setSelectedCalendar(calendarId: string): void {
  selectedCalendarId.value = calendarId
}

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

onMounted(() => {
  getCalendarList()
})
</script>
