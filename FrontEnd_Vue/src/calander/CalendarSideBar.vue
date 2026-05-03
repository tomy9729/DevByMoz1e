<template>
  <aside class="calendar-sidebar">
    <Button
      class="calendar-add-schedule-button"
      icon="pi pi-plus"
      label="일정 추가"
      @click="emit('click-add-schedule')"
    />
    <DatePicker
      v-model="selectedDateModel"
      class="calendar-mini-datepicker"
      inline
    />
    <Message v-if="calendarListErrorMessage" severity="error" size="small">
      {{ calendarListErrorMessage }}
    </Message>
    <Accordion v-model:value="activeCalendarGroupsModel" multiple>
      <AccordionPanel value="lostark">
        <AccordionHeader>로스트아크 캘린더</AccordionHeader>
        <AccordionContent>
          <div class="calendar-list">
            <div
              v-for="calendarItem in lostarkCalendars"
              :key="calendarItem.id"
              class="calendar-list-item"
              :class="{ 'calendar-list-item-selected': calendarItem.id === selectedCalendarId }"
              @click="emit('select-calendar', calendarItem.id)"
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
              @click.stop="emit('click-add-calendar')"
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
              @click="emit('select-calendar', calendarItem.id)"
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Accordion from 'primevue/accordion'
import AccordionContent from 'primevue/accordioncontent'
import AccordionHeader from 'primevue/accordionheader'
import AccordionPanel from 'primevue/accordionpanel'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import DatePicker from 'primevue/datepicker'
import Message from 'primevue/message'
import type { CalendarListItem } from './CalendarFetcher'

defineOptions({
  name: 'CalendarSideBar',
})

const props = defineProps<{
  selectedDate: Date | null
  activeCalendarGroups: string[]
  selectedCalendarId: string | null
  lostarkCalendars: CalendarListItem[]
  myCalendars: CalendarListItem[]
  isCalendarListLoading: boolean
  calendarListErrorMessage: string
}>()

const emit = defineEmits<{
  (event: 'update:selectedDate', value: Date | null): void
  (event: 'update:activeCalendarGroups', value: string[]): void
  (event: 'select-calendar', calendarId: string): void
  (event: 'click-add-schedule'): void
  (event: 'click-add-calendar'): void
}>()

const selectedDateModel = computed({
  get(): Date | null {
    return props.selectedDate
  },
  set(value: Date | null) {
    emit('update:selectedDate', value)
  },
})

const activeCalendarGroupsModel = computed({
  get(): string[] {
    return props.activeCalendarGroups
  },
  set(value: string[]) {
    emit('update:activeCalendarGroups', value)
  },
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
</script>
