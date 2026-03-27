import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { currentLanguage, getCalendarLocale, t } from './i18n'
import './App.css'

function App() {
  const language = currentLanguage

  return (
    <main className="app-shell">
      <section className="calendar-panel">
        <div className="calendar-copy">
          <p className="eyebrow">{t('app.eyebrow', language)}</p>
          <h1>{t('app.title', language)}</h1>
          <p className="description">{t('app.description', language)}</p>
        </div>

        <div className="calendar-frame">
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            locale={language}
            locales={[getCalendarLocale(language)]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
            buttonText={{
              today: t('calendar.buttons.today', language),
            }}
            height="auto"
            events={[]}
          />
        </div>
      </section>
    </main>
  )
}

export default App
