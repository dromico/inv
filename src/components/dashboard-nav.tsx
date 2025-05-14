"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  ListTodo,
  Bell,
  Settings,
} from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard/subcontractor",
    icon: LayoutDashboard,
  },
  {
    title: "Jobs",
    href: "/dashboard/subcontractor/jobs",
    icon: ListTodo,
  },
  {
    title: "Invoices",
    href: "/dashboard/subcontractor/invoices",
    icon: FileText,
  },
  {
    title: "Notifications",
    href: "/dashboard/subcontractor/notifications",
    icon: Bell,
  },
  {
    title: "Settings",
    href: "/dashboard/subcontractor/settings",
    icon: Settings,
  },
]

export function DashboardNav({ onNavItemClick }: { onNavItemClick?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2 mt-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavItemClick}
        >
          <span
            className={cn(
              "group flex items-center rounded-md px-3 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground min-h-[44px]",
              pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
            )}
          >
            <item.icon className="mr-3 h-5 w-5" />
            <span>{item.title}</span>
          </span>
        </Link>
      ))}
    </nav>
  )
}
