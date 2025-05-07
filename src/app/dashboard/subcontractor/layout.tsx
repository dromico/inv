"use client"

import { UserNav } from "@/components/user-nav"
import { DashboardNav } from "@/components/dashboard-nav"
import { SubcontractorMobileNav } from "@/components/subcontractor-mobile-nav"

export default function SubcontractorDashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <SubcontractorMobileNav />
          <h1 className="text-lg font-bold ml-2 md:ml-0">Subcontractor Portal</h1>

          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 px-4 sm:px-6 md:px-8 lg:px-12 py-8">
        <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] md:gap-6">
          <aside className="hidden md:block">
            <DashboardNav />
          </aside>
          <main className="px-2 sm:px-4 md:px-8 lg:px-16">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
