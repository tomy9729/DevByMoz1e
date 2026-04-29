import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";

function Card({ className, asChild = false, ...props }) {
    const Comp = asChild ? Slot : "div";

    return (
        <Comp
            data-slot="card"
            className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)}
            {...props}
        />
    );
}

function CardHeader({ className, ...props }) {
    return (
        <div
            data-slot="card-header"
            className={cn("flex flex-col space-y-1.5 p-6", className)}
            {...props}
        />
    );
}

function CardTitle({ className, ...props }) {
    return (
        <h3
            data-slot="card-title"
            className={cn("font-semibold leading-none tracking-tight", className)}
            {...props}
        />
    );
}

function CardContent({ className, ...props }) {
    return <div data-slot="card-content" className={cn("p-6 pt-0", className)} {...props} />;
}

export { Card, CardContent, CardHeader, CardTitle };
