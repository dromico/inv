import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardCardProps extends React.ComponentProps<typeof Card> {
  /**
   * The content to be rendered inside the card
   */
  children: React.ReactNode
}

/**
 * A specialized card component for dashboard content that applies appropriate spacing
 * and responsive layout adjustments.
 */
const DashboardCard = React.forwardRef<
  HTMLDivElement,
  DashboardCardProps
>(({ className, children, ...props }, ref) => {
  return (
    <Card
      ref={ref}
      className={cn(
        "overflow-hidden transition-all",
        "hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
})
DashboardCard.displayName = "DashboardCard"

/**
 * A specialized card header component for dashboard content that applies appropriate spacing
 * and responsive layout adjustments.
 */
const DashboardCardHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof CardHeader>
>(({ className, ...props }, ref) => {
  return (
    <CardHeader
      ref={ref}
      className={cn(
        "p-4 sm:p-6",
        className
      )}
      {...props}
    />
  )
})
DashboardCardHeader.displayName = "DashboardCardHeader"

/**
 * A specialized card content component for dashboard content that applies appropriate spacing
 * and responsive layout adjustments.
 */
const DashboardCardContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof CardContent>
>(({ className, ...props }, ref) => {
  return (
    <CardContent
      ref={ref}
      className={cn(
        "p-4 sm:p-6 pt-0",
        className
      )}
      {...props}
    />
  )
})
DashboardCardContent.displayName = "DashboardCardContent"

/**
 * A specialized card footer component for dashboard content that applies appropriate spacing
 * and responsive layout adjustments.
 */
const DashboardCardFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof CardFooter>
>(({ className, ...props }, ref) => {
  return (
    <CardFooter
      ref={ref}
      className={cn(
        "p-4 sm:p-6 pt-0",
        className
      )}
      {...props}
    />
  )
})
DashboardCardFooter.displayName = "DashboardCardFooter"

export { DashboardCard, DashboardCardHeader, DashboardCardContent, DashboardCardFooter }
