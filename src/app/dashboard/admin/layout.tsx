"use client"

import { UserNav } from "@/components/user-nav"
import { AdminNav } from "@/components/admin-nav"
import { MobileNav } from "@/components/mobile-nav"
import { Container } from "@/components/ui/container"

export default function AdminDashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <Container constrained={false} className="flex h-16 items-center">
          <MobileNav />
          <h1 className="text-lg font-bold ml-2 md:ml-0">Admin Dashboard</h1>

          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </Container>
      </header>
      <Container constrained={false} className="flex-1 py-6">
        <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:gap-8">
          <aside className="hidden md:block">
            <AdminNav />
          </aside>
          <main>
            {children}
          </main>
        </div>
      </Container>
    </div>
  )
}
