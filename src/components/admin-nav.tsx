"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  FileText,
  ListTodo,
  Settings,
  BarChart4,
} from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Jobs",
    href: "/dashboard/admin/jobs",
    icon: ListTodo,
  },
  {
    title: "Subcontractors",
    href: "/dashboard/admin/subcontractors",
    icon: Users,
  },
  {
    title: "Invoices",
    href: "/dashboard/admin/invoices",
    icon: FileText,
  },
  {
    title: "Reports",
    href: "/dashboard/admin/reports",
    icon: BarChart4,
  },
  {
    title: "Settings",
    href: "/dashboard/admin/settings",
    icon: Settings,
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2 mt-8">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
        >
          <span
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
            )}
          >
            <item.icon className="mr-2 h-4 w-4" />
            <span>{item.title}</span>
          </span>
        </Link>
      ))}
    </nav>
  )
}
