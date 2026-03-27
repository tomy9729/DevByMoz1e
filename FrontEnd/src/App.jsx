import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import './App.css'

function App() {
  return (
    <main className="app-shell">
      <section className="calendar-panel">
        <div className="calendar-copy">
          <p className="eyebrow">FrontEnd</p>
          <h1>Monthly Calendar</h1>
          <p className="description">
            FullCalendar month view is ready. Event data will be connected in a
            later step.
          </p>
        </div>

        <div className="calendar-frame">
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
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
