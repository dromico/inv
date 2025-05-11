"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Shimmer animation for skeleton loaders
const ShimmerSkeleton = ({ className }: { className: string }) => {
  return (
    <div className="relative overflow-hidden">
      <Skeleton className={className} />
      <motion.div
        className="absolute inset-0 -translate-x-full"
        animate={{
          translateX: ["-100%", "200%"]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
        }}
      />
    </div>
  )
}

// Skeleton for stats cards
export function StatsCardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array(4).fill(null).map((_, i) => (
        <Card key={i} className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <ShimmerSkeleton className="h-4 w-20" />
            <ShimmerSkeleton className="h-3 w-3 rounded-full" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <ShimmerSkeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Skeleton for recent jobs card
export function RecentJobsSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex items-center">
          <ShimmerSkeleton className="h-5 w-5 mr-2 rounded" />
          <ShimmerSkeleton className="h-6 w-32" />
        </div>
        <ShimmerSkeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="space-y-4">
          {Array(3).fill(null).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex-1 space-y-2">
                <ShimmerSkeleton className="h-4 w-24" />
                <ShimmerSkeleton className="h-3 w-32" />
              </div>
              <ShimmerSkeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="px-4 sm:px-6">
        <ShimmerSkeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  )
}

// Skeleton for notifications card
export function NotificationsSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex items-center">
          <ShimmerSkeleton className="h-5 w-5 mr-2 rounded" />
          <ShimmerSkeleton className="h-6 w-32" />
        </div>
        <ShimmerSkeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="space-y-4">
          {Array(3).fill(null).map((_, i) => (
            <div key={i} className="flex items-start space-x-4 border-l-4 pl-4 py-2 rounded-r-lg">
              <div className="flex-1 space-y-2">
                <ShimmerSkeleton className="h-4 w-full" />
                <ShimmerSkeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="px-4 sm:px-6">
        <ShimmerSkeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  )
}

// Complete dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <ShimmerSkeleton className="h-8 w-64 mb-2" />
          <ShimmerSkeleton className="h-4 w-80" />
        </div>
        <ShimmerSkeleton className="h-10 w-32 hidden sm:block" />
      </div>
      
      <StatsCardSkeleton />
      
      <div className="grid gap-4 md:grid-cols-2">
        <RecentJobsSkeleton />
        <NotificationsSkeleton />
      </div>
    </div>
  )
}
