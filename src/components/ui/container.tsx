import * as React from "react"
import { cn } from "@/lib/utils"

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The content to be rendered inside the container
   */
  children: React.ReactNode
  /**
   * Whether to apply max-width constraints
   * @default true
   */
  constrained?: boolean
}

/**
 * A responsive container component that applies appropriate padding and max-width
 * for different viewport sizes.
 */
const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, constrained = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base padding for all screen sizes
          "w-full px-4 sm:px-6 md:px-8 lg:px-16",
          // Max width constraint (only applied if constrained is true)
          constrained && "mx-auto max-w-7xl",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Container.displayName = "Container"

export { Container }
