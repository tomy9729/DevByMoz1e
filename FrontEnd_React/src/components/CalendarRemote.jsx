import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

function CalendarRemote({ title, sections }) {
    return (
        <aside aria-label={title} className="sticky top-6 space-y-4">
            {sections.map((section) => (
                <Card key={section.key}>
                    <CardHeader className="pb-4">
                        <CardTitle>{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>{section.content}</CardContent>
                </Card>
            ))}
        </aside>
    );
}

export default CalendarRemote;
