"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const isHighProgress = value && value > 80;
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-muted/50 relative h-2 w-full overflow-hidden rounded-full shadow-inner",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 transition-all duration-500",
          "bg-gradient-to-r from-[oklch(0.65_0.14_60)] via-primary to-[oklch(0.65_0.14_60)]",
          "shadow-[0_0_10px_oklch(0.75_0.15_70),0_0_20px_oklch(0.65_0.14_60)]",
          isHighProgress && "animate-pulse"
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
