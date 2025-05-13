"use client"

import { useContext, createContext, type ReactNode } from "react"
import type { ToastProps, ToastActionElement } from "@/components/ui/toast"

type ToastType = {
  id: string
  title?: ReactNode
  description?: ReactNode
  action?: ToastActionElement
  duration?: number
} & ToastProps

type ToastContextProps = {
  toasts: ToastType[]
  toast: (props: Omit<ToastType, "id">) => void
  dismiss: (toastId?: string) => void
}

const ToastContext = createContext<ToastContextProps>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
})

export const useToast = () => {
  const context = useContext(ToastContext)

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}
