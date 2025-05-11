"use client"

import React from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface PDFLoadingProps {
  text?: string
  size?: "sm" | "md" | "lg"
  fullPage?: boolean
}

export function PDFLoading({ 
  text = "Generating PDF...", 
  size = "md",
  fullPage = false
}: PDFLoadingProps) {
  // Size mappings for different elements
  const sizeMap = {
    sm: {
      container: "min-h-[100px]",
      icon: "h-6 w-6",
      text: "text-sm"
    },
    md: {
      container: "min-h-[150px]",
      icon: "h-8 w-8",
      text: "text-base"
    },
    lg: {
      container: "min-h-[200px]",
      icon: "h-10 w-10",
      text: "text-lg"
    }
  }

  const containerClass = fullPage 
    ? "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" 
    : `flex flex-col items-center justify-center ${sizeMap[size].container}`;

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center justify-center space-y-4 p-6 rounded-lg">
        <div className="relative">
          {/* Outer pulsing circle */}
          <motion.div
            className="absolute inset-0 rounded-full bg-black/10"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut"
            }}
          />
          
          {/* Spinning loader */}
          <Loader2 
            className={`${sizeMap[size].icon} animate-spin text-primary`} 
            style={{ 
              // Ensure touch target is at least 40px
              minWidth: "40px", 
              minHeight: "40px" 
            }} 
          />
        </div>
        
        <p className={`${sizeMap[size].text} text-muted-foreground text-center`}>
          {text}
        </p>
      </div>
    </div>
  )
}

// Button loading state component
export function PDFButtonLoading({ 
  text = "Generating...",
  className = ""
}: {
  text?: string
  className?: string
}) {
  return (
    <div className={`flex items-center ${className}`}>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      <span>{text}</span>
    </div>
  )
}
