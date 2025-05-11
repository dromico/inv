"use client"

import React from "react"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

// Shimmer animation for skeleton loaders
export const ShimmerSkeleton = ({ className }: { className: string }) => {
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

// Mobile job card skeleton
export function MobileJobCardSkeleton() {
  return (
    <Card className="rounded-lg border border-gray-200 p-4 space-y-3 shadow-sm">
      <div className="flex justify-between items-start">
        <ShimmerSkeleton className="h-5 w-32" />
        <ShimmerSkeleton className="h-6 w-20 rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Array(3).fill(null).map((_, i) => (
          <React.Fragment key={i}>
            <ShimmerSkeleton className="h-4 w-20" />
            <ShimmerSkeleton className="h-4 w-full" />
          </React.Fragment>
        ))}
      </div>

      <div className="pt-2 flex justify-end">
        <ShimmerSkeleton className="h-10 w-28 rounded-md" />
      </div>
    </Card>
  )
}

// Table row skeleton
export function TableRowSkeleton() {
  return (
    <tr>
      {Array(7).fill(null).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <ShimmerSkeleton className={`h-5 ${i === 6 ? 'w-16 ml-auto' : 'w-full max-w-[120px]'}`} />
        </td>
      ))}
    </tr>
  )
}

// Complete jobs page skeleton
export function JobsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <ShimmerSkeleton className="h-8 w-48" />
          <ShimmerSkeleton className="h-4 w-72 mt-2" />
        </div>
        <ShimmerSkeleton className="h-10 w-32" />
      </div>

      <div className="rounded-md border shadow-sm">
        {/* Mobile view skeleton */}
        <div className="md:hidden">
          <div className="space-y-3 p-3">
            {Array(4).fill(null).map((_, i) => (
              <MobileJobCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Desktop view skeleton */}
        <div className="hidden md:block">
          <div className="border-b">
            <div className="flex py-3 px-4">
              {Array(7).fill(null).map((_, i) => (
                <div key={i} className={`${i === 5 || i === 6 ? 'text-right' : ''} flex-1`}>
                  <ShimmerSkeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          </div>
          <div>
            {Array(5).fill(null).map((_, i) => (
              <div key={i} className="flex py-4 px-4 border-b last:border-0">
                {Array(7).fill(null).map((_, j) => (
                  <div key={j} className={`${j === 5 || j === 6 ? 'text-right' : ''} flex-1`}>
                    <ShimmerSkeleton className={`h-5 ${j === 6 ? 'w-16 ml-auto' : 'w-full max-w-[120px]'}`} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
