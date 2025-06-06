"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  disabled?: boolean
  className?: string
}

export function DatePicker({ date, setDate, disabled = false, className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Handle date selection and close the popover when a date is selected
  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          onClick={() => !disabled && setOpen(true)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border rounded-md" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
