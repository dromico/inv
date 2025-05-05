"use client"

import { UserNav } from "@/components/user-nav"
import { AdminNav } from "@/components/admin-nav"
import { MobileNav } from "@/components/mobile-nav"

export default function AdminDashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MobileNav />
          <h1 className="text-lg font-bold ml-2 md:ml-0">Admin Dashboard</h1>
          
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 px-4 md:px-12 py-8">
        <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] md:gap-6">
          <aside className="hidden md:block">
            <AdminNav />
          </aside>
          <main className="px-0 md:px-16">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
