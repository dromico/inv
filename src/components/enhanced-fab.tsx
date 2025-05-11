"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Plus, FileText, Bell, Settings, LayoutDashboard, ListTodo } from "lucide-react"

// Define the icons we support
const iconMap = {
  plus: Plus,
  fileText: FileText,
  bell: Bell,
  settings: Settings,
  layoutDashboard: LayoutDashboard,
  listTodo: ListTodo
}

// Define the type for icon names
type IconName = keyof typeof iconMap

interface EnhancedFABProps {
  href: string
  iconName: IconName
  className?: string
}

export function EnhancedFAB({ href, iconName, className }: EnhancedFABProps) {
  // Get the icon component from the map
  const Icon = iconMap[iconName]

  return (
    <div className="fixed bottom-6 right-6 sm:hidden z-10">
      <Button
        size="lg"
        className={cn(
          "h-14 w-14 min-h-[56px] min-w-[56px] p-0 rounded-full shadow-lg hover:shadow-xl active:shadow-md transition-all bg-black text-white hover:bg-gray-800",
          className
        )}
        asChild
      >
        <Link href={href}>
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Pulse animation effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-black opacity-0"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0, 0.1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut"
              }}
            />

            {/* Icon with hover animation */}
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Icon className="h-7 w-7" strokeWidth={2.5} />
            </motion.div>
          </div>
        </Link>
      </Button>
    </div>
  )
}
