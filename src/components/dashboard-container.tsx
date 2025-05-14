import * as React from "react"
import { cn } from "@/lib/utils"
import { Container } from "@/components/ui/container"

interface DashboardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The content to be rendered inside the container
   */
  children: React.ReactNode
}

/**
 * A specialized container for dashboard content that applies appropriate spacing
 * and responsive layout adjustments.
 */
export function DashboardContainer({
  children,
  className,
  ...props
}: DashboardContainerProps) {
  return (
    <Container
      className={cn(
        // Add dashboard-specific spacing
        "py-6 space-y-6",
        className
      )}
      {...props}
    >
      {children}
    </Container>
  )
}
