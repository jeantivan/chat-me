import { forwardRef } from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import mc from "@/lib/utils/mergeClassnames";

/* Código de https://ui.shadcn.com/docs/components/scroll-area */

const ScrollBar = forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={mc(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-background-9" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));

export const ScrollArea = forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    rootClassName?: string;
  }
>(({ className, children, rootClassName, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    className={mc("relative overflow-hidden", rootClassName)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport
      ref={ref}
      className={mc("h-full w-full rounded-[inherit]", className)}
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
