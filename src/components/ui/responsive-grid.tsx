import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The content to be rendered inside the grid
   */
  children: React.ReactNode
  /**
   * The number of columns to display on mobile devices
   * @default 1
   */
  mobileColumns?: 1 | 2
  /**
   * The number of columns to display on tablet devices
   * @default 2
   */
  tabletColumns?: 1 | 2 | 3 | 4
  /**
   * The number of columns to display on desktop devices
   * @default 4
   */
  desktopColumns?: 1 | 2 | 3 | 4 | 5 | 6
}

/**
 * A responsive grid component that applies appropriate column layouts
 * for different viewport sizes.
 */
const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ 
    className, 
    children, 
    mobileColumns = 1, 
    tabletColumns = 2, 
    desktopColumns = 4, 
    ...props 
  }, ref) => {
    // Map the column counts to Tailwind classes
    const mobileClass = mobileColumns === 1 ? "grid-cols-1" : "grid-cols-2"
    const tabletClass = `md:grid-cols-${tabletColumns}`
    const desktopClass = `lg:grid-cols-${desktopColumns}`

    return (
      <div
        ref={ref}
        className={cn(
          "grid gap-4 sm:gap-6",
          mobileClass,
          tabletClass,
          desktopClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ResponsiveGrid.displayName = "ResponsiveGrid"

export { ResponsiveGrid }
