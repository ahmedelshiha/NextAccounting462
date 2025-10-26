import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverPortal({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Portal>) {
  return <PopoverPrimitive.Portal data-slot="popover-portal" {...props} />
}

function PopoverContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPortal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        data-slot="popover-content"
        className={cn("z-50 rounded-md border bg-popover p-1 shadow-md", className)}
        {...props}
      />
    </PopoverPortal>
  )
}

function PopoverArrow(props: React.ComponentProps<typeof PopoverPrimitive.Arrow>) {
  return <PopoverPrimitive.Arrow data-slot="popover-arrow" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverArrow }
