<template>
  <Dialog
    :visible="visible"
    :header="popupTitle"
    modal
    class="schedule-event-popup"
    :style="{ width: 'min(600px, calc(100vw - 32px))' }"
    @update:visible="setVisible"
  >
    <div class="schedule-popup-form">
      <Message v-if="isReadOnly" severity="secondary" size="small">
        로스트아크 일정은 내용 확인만 가능합니다.
      </Message>

      <label class="schedule-popup-field">
        <span class="schedule-popup-label">제목</span>
        <InputText
          v-model="form.title"
          :disabled="isReadOnly"
          placeholder="일정 제목"
        />
      </label>

      <label class="schedule-popup-field">
        <span class="schedule-popup-label">설명</span>
        <Textarea
          v-model="form.description"
          :disabled="isReadOnly"
          rows="4"
          auto-resize
          placeholder="일정 설명"
        />
      </label>

      <label class="schedule-popup-field">
        <span class="schedule-popup-label">캘린더 선택</span>
        <Select
          v-model="form.calendarId"
          :options="calendarOptions"
          option-label="name"
          option-value="id"
          :disabled="isReadOnly"
          placeholder="캘린더 선택"
        />
      </label>

      <div class="schedule-popup-field">
        <div class="schedule-popup-time-header">
          <span class="schedule-popup-label">시간</span>
          <Button
            v-if="!isReadOnly"
            icon="pi pi-plus"
            label="시간 추가"
            size="small"
            text
            @click="addTimeRow"
          />
        </div>

        <div class="schedule-popup-time-list">
          <div
            v-for="(timeRow, timeRowIndex) in form.timeRows"
            :key="timeRow.key"
            class="schedule-popup-time-row"
          >
            <DatePicker
              v-model="timeRow.startDateTime"
              show-time
              hour-format="24"
              date-format="yy-mm-dd"
              :disabled="isReadOnly"
              placeholder="시작 시간"
            />
            <span class="schedule-popup-time-separator">-</span>
            <DatePicker
              v-model="timeRow.endDateTime"
              show-time
              hour-format="24"
              date-format="yy-mm-dd"
              :disabled="isReadOnly"
              placeholder="종료 시간"
            />
            <Button
              v-if="!isReadOnly"
              icon="pi pi-trash"
              severity="secondary"
              size="small"
              text
              rounded
              :disabled="form.timeRows.length <= 1"
              :aria-label="`${timeRowIndex + 1}번째 시간 삭제`"
              @click="removeTimeRow(timeRowIndex)"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="닫기"
        severity="secondary"
        text
        @click="setVisible(false)"
      />
      <Button
        v-if="!isReadOnly"
        label="저장"
        icon="pi pi-check"
        :disabled="!canSave"
        @click="onClickSave"
      />
    </template>
  </Dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import type { CalendarListItem, CalendarScheduleItem } from './CalendarFetcher'

interface ScheduleEventTimeRow {
  key: number
  startDateTime: Date | null
  endDateTime: Date | null
}

interface ScheduleEventForm {
  title: string
  description: string
  calendarId: string | null
  timeRows: ScheduleEventTimeRow[]
}

export interface ScheduleEventPopupTimeRange {
  startDateTime: Date
  endDateTime: Date
}

export interface ScheduleEventPopupSavePayload {
  id: string | null
  title: string
  description: string
  calendarId: string
  timeRanges: ScheduleEventPopupTimeRange[]
}

let timeRowSequence = 0

export default defineComponent({
  name: 'ScheduleEventPopup',
  components: {
    Button,
    DatePicker,
    Dialog,
    InputText,
    Message,
    Select,
    Textarea,
  },
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    mode: {
      type: String as PropType<'add' | 'edit'>,
      required: true,
    },
    schedule: {
      type: Object as PropType<CalendarScheduleItem | null>,
      default: null,
    },
    calendars: {
      type: Array as PropType<CalendarListItem[]>,
      required: true,
    },
    selectedCalendarId: {
      type: String as PropType<string | null>,
      default: null,
    },
    selectedDate: {
      type: Object as PropType<Date | null>,
      default: null,
    },
  },
  emits: {
    'update:visible': (_value: boolean) => true,
    save: (_payload: ScheduleEventPopupSavePayload) => true,
  },
  data() {
    return {
      form: this.createEmptyForm(),
    }
  },
  computed: {
    popupTitle(): string {
      return this.mode === 'edit' ? '일정 수정' : '일정 추가'
    },
    isReadOnly(): boolean {
      return this.schedule?.sourceType === 'lostark' || this.schedule?.calendar.sourceType === 'lostark'
    },
    calendarOptions(): CalendarListItem[] {
      if (this.isReadOnly) {
        return this.calendars
      }

      return this.calendars.filter((calendarItem) => calendarItem.sourceType === 'user')
    },
    canSave(): boolean {
      return (
        this.form.title.trim() !== '' &&
        this.form.calendarId != null &&
        this.form.timeRows.length > 0 &&
        this.form.timeRows.every(
          (timeRow: ScheduleEventTimeRow) =>
            timeRow.startDateTime != null && timeRow.endDateTime != null,
        )
      )
    },
  },
  watch: {
    visible(value: boolean): void {
      if (!value) {
        return
      }

      this.setFormFromProps()
    },
    schedule(): void {
      if (!this.visible) {
        return
      }

      this.setFormFromProps()
    },
    selectedCalendarId(): void {
      if (!this.visible || this.mode !== 'add') {
        return
      }

      this.setFormFromProps()
    },
    selectedDate(): void {
      if (!this.visible || this.mode !== 'add') {
        return
      }

      this.setFormFromProps()
    },
  },
  created() {
    this.setFormFromProps()
  },
  methods: {
    /**
     * Creates initial empty popup form state.
     *
     * @returns Empty schedule popup form.
     * @public
     */
    createEmptyForm(): ScheduleEventForm {
      return {
        title: '',
        description: '',
        calendarId: null,
        timeRows: [this.createTimeRow()],
      }
    },

    /**
     * Creates a time row for the schedule popup.
     *
     * @param startInput Optional start date value.
     * @param endInput Optional end date value.
     * @returns Schedule popup time row.
     * @public
     */
    createTimeRow(
      startInput?: Date | string | null,
      endInput?: Date | string | null,
    ): ScheduleEventTimeRow {
      const startDateTime = this.createDate(startInput) ?? this.createDefaultStartDate()
      const endDateTime =
        this.createDate(endInput) ?? new Date(startDateTime.getTime() + 60 * 60 * 1000)

      return {
        key: ++timeRowSequence,
        startDateTime,
        endDateTime,
      }
    },

    /**
     * Converts an input value to Date.
     *
     * @param value Date-like value.
     * @returns Date or null.
     * @public
     */
    createDate(value?: Date | string | null): Date | null {
      if (value == null) {
        return null
      }

      const date = value instanceof Date ? new Date(value) : new Date(value)

      return Number.isNaN(date.getTime()) ? null : date
    },

    /**
     * Creates the default start date for a new schedule.
     *
     * @returns Default start date.
     * @public
     */
    createDefaultStartDate(): Date {
      const startDate = this.selectedDate != null ? new Date(this.selectedDate) : new Date()

      startDate.setMinutes(0, 0, 0)

      return startDate
    },

    /**
     * Sets popup form state from current props.
     *
     * @returns void
     * @public
     */
    setFormFromProps(): void {
      const selectedCalendar = this.calendars.find(
        (calendarItem) => calendarItem.id === this.selectedCalendarId,
      )
      const userCalendar = this.calendars.find((calendarItem) => calendarItem.sourceType === 'user')
      const fallbackCalendarId =
        selectedCalendar?.sourceType === 'user' ? selectedCalendar.id : userCalendar?.id ?? null

      if (this.mode === 'edit' && this.schedule != null) {
        this.form = {
          title: this.schedule.title,
          description: this.schedule.description ?? '',
          calendarId: this.schedule.calendar.id,
          timeRows: this.schedule.times.map((time) => this.createTimeRow(time.startDateTime, time.endDateTime)),
        }

        return
      }

      this.form = {
        title: '',
        description: '',
        calendarId: fallbackCalendarId,
        timeRows: [this.createTimeRow()],
      }
    },

    /**
     * Updates popup visibility.
     *
     * @param value Visibility value.
     * @returns void
     * @public
     */
    setVisible(value: boolean): void {
      this.$emit('update:visible', value)
    },

    /**
     * Adds a schedule time row.
     *
     * @returns void
     * @public
     */
    addTimeRow(): void {
      const lastTimeRow = this.form.timeRows[this.form.timeRows.length - 1]
      const nextStartDate = lastTimeRow?.endDateTime ?? this.createDefaultStartDate()
      const nextEndDate = new Date(nextStartDate.getTime() + 60 * 60 * 1000)

      this.form.timeRows.push(this.createTimeRow(nextStartDate, nextEndDate))
    },

    /**
     * Removes a schedule time row.
     *
     * @param timeRowIndex Time row index.
     * @returns void
     * @public
     */
    removeTimeRow(timeRowIndex: number): void {
      if (this.form.timeRows.length <= 1) {
        return
      }

      this.form.timeRows.splice(timeRowIndex, 1)
    },

    /**
     * Emits schedule popup save payload.
     *
     * @returns void
     * @public
     */
    onClickSave(): void {
      if (!this.canSave || this.form.calendarId == null) {
        return
      }

      this.$emit('save', {
        id: this.schedule?.id ?? null,
        title: this.form.title.trim(),
        description: this.form.description,
        calendarId: this.form.calendarId,
        timeRanges: this.form.timeRows
          .filter((timeRow: ScheduleEventTimeRow): timeRow is ScheduleEventTimeRow & {
            startDateTime: Date
            endDateTime: Date
          } => timeRow.startDateTime != null && timeRow.endDateTime != null)
          .map((timeRow: ScheduleEventTimeRow & { startDateTime: Date; endDateTime: Date }) => ({
            startDateTime: timeRow.startDateTime,
            endDateTime: timeRow.endDateTime,
          })),
      })
    },
  },
})
</script>
