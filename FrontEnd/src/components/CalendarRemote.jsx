function CalendarRemote({ title, sections }) {
    return (
        <aside className="calendar-remote" aria-label={title}>
            <div className="calendar-remote-copy">
                <p className="calendar-remote-eyebrow">{title}</p>
            </div>

            <div className="calendar-remote-sections">
                {sections.map((section) => (
                    <section key={section.key} className="calendar-remote-section">
                        <div className="calendar-remote-section-copy">
                            <h3>{section.title}</h3>
                        </div>
                        <div className="calendar-remote-section-body">{section.content}</div>
                    </section>
                ))}
            </div>
        </aside>
    );
}

export default CalendarRemote;
