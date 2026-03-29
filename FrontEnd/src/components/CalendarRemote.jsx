import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

function CalendarRemote({ title, sections }) {
    return (
        <Card asChild className="sticky top-6">
            <aside aria-label={title}>
                <CardHeader className="pb-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        {title}
                    </p>
                </CardHeader>

                <CardContent className="space-y-4">
                    {sections.map((section) => (
                        <Card key={section.key}>
                            <CardHeader className="pb-4">
                                <CardTitle>{section.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {section.content}
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </aside>
        </Card>
    );
}

export default CalendarRemote;
