"use client"

import { UserNav } from "@/components/user-nav"
import { AdminNav } from "@/components/admin-nav"

export default function AdminDashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-lg font-bold">Admin Dashboard</h1>
          
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] md:gap-6">
          <aside className="hidden md:block">
            <AdminNav />
          </aside>
          <main>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
