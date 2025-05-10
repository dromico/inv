"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { DashboardNav } from "@/components/dashboard-nav"

export function SubcontractorMobileNav() {
  const [open, setOpen] = useState(false)

  const handleNavItemClick = () => {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[300px]">
        <SheetHeader>
          <SheetTitle>Subcontractor Portal</SheetTitle>
        </SheetHeader>
        <div className="py-4">
          <DashboardNav onNavItemClick={handleNavItemClick} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
