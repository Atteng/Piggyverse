"use client"

import * as React from "react"
import type * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"
// We need to import the primitive to extend it, but since we installed @radix-ui/react-radio-group
// we should import it from there. If the environment has issues, we'll need to adapt.
// Assuming the package is installed correctly as per previous step.
import * as RadioGroupPrimitiveImport from "@radix-ui/react-radio-group"

const RadioGroup = React.forwardRef<
    React.ElementRef<typeof RadioGroupPrimitiveImport.Root>,
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitiveImport.Root>
>(({ className, ...props }, ref) => {
    return (
        <RadioGroupPrimitiveImport.Root
            className={cn("grid gap-2", className)}
            {...props}
            ref={ref}
        />
    )
})
RadioGroup.displayName = RadioGroupPrimitiveImport.Root.displayName

const RadioGroupItem = React.forwardRef<
    React.ElementRef<typeof RadioGroupPrimitiveImport.Item>,
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitiveImport.Item>
>(({ className, ...props }, ref) => {
    return (
        <RadioGroupPrimitiveImport.Item
            ref={ref}
            className={cn(
                "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        >
            <RadioGroupPrimitiveImport.Indicator className="flex items-center justify-center">
                <Circle className="h-2.5 w-2.5 fill-current text-current" />
            </RadioGroupPrimitiveImport.Indicator>
        </RadioGroupPrimitiveImport.Item>
    )
})
RadioGroupItem.displayName = RadioGroupPrimitiveImport.Item.displayName

export { RadioGroup, RadioGroupItem }
