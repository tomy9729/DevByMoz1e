import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "../../lib/utils";

function Checkbox({ className, checked, ...props }) {
    return (
        <CheckboxPrimitive.Root
            data-slot="checkbox"
            className={cn(
                "peer h-4 w-4 shrink-0 rounded-[4px] border border-primary shadow-xs outline-none transition-shadow focus-visible:ring-1 focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50",
                className,
            )}
            checked={checked}
            {...props}
        >
            <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
                {checked === "indeterminate" ? (
                    <Minus className="h-3.5 w-3.5" />
                ) : (
                    <Check className="h-3.5 w-3.5" />
                )}
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}

export { Checkbox };
