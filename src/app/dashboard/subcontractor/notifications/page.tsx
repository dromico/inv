"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Bell, DollarSign, FileText, AlertTriangle, Trash2 } from "lucide-react"

// Define notification types
interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'job_update' | 'invoice_status' | 'system' | 'payment_processed'
  read: boolean
  created_at: string
  job?: {
    id: string
    job_type: string
    status: string
    paid: boolean
  }
}

export default function SubcontractorNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [deletedMockIds, setDeletedMockIds] = useState<string[]>([])
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Try to fetch real notifications from the database
      let { data: realNotifications, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })

      // If we have real notifications and no error, use them
      if (realNotifications && realNotifications.length > 0 && !fetchError) {
        setNotifications(realNotifications as Notification[])
        setLoading(false)
        return
      }

      // Otherwise, use mock data
      const mockNotifications: Notification[] = [
        {
          id: "1",
          user_id: user.id,
          title: "Job Status Updated",
          message: "Your job #JOB-2023-001 has been approved by the admin.",
          type: "job_update",
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
          job: {
            id: "job-1",
            job_type: "Electrical Work",
            status: "in-progress",
            paid: false
          }
        },
        {
          id: "2",
          user_id: user.id,
          title: "Invoice Paid",
          message: "Your invoice #INV-2023-042 has been marked as paid.",
          type: "invoice_status",
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          job: {
            id: "job-2",
            job_type: "Plumbing Repair",
            status: "completed",
            paid: true
          }
        },
        {
          id: "3",
          user_id: user.id,
          title: "New System Update",
          message: "We've updated our platform with new features. Check them out!",
          type: "system",
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() // 3 days ago
        },
        {
          id: "4",
          user_id: user.id,
          title: "Job Comment",
          message: "Admin has left a comment on your job #JOB-2023-002.",
          type: "job_update",
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          job: {
            id: "job-3",
            job_type: "Roof Repair",
            status: "in-progress",
            paid: false
          }
        },
        {
          id: "5",
          user_id: user.id,
          title: "Invoice Reminder",
          message: "Reminder: Invoice #INV-2023-045 is due in 3 days.",
          type: "invoice_status",
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
          job: {
            id: "job-4",
            job_type: "Kitchen Remodeling",
            status: "completed",
            paid: false
          }
        },
        {
          id: "6",
          user_id: user.id,
          title: "Payment Processed",
          message: "Payment for your Bathroom Renovation job has been processed.",
          type: "payment_processed",
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
          job: {
            id: "job-5",
            job_type: "Bathroom Renovation",
            status: "completed",
            paid: true
          }
        },
        {
          id: "7",
          user_id: user.id,
          title: "Payment Processed",
          message: "Payment for your Flooring Installation job has been processed.",
          type: "payment_processed",
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 90 mins ago
          job: {
            id: "job-6",
            job_type: "Flooring Installation",
            status: "completed",
            paid: true
          }
        }
      ]

      // Filter out any mock notifications that have been deleted
      const filteredMockNotifications = mockNotifications.filter(
        notification => !deletedMockIds.includes(notification.id)
      )

      setNotifications(filteredMockNotifications)
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast({
        variant: "destructive",
        title: "Failed to load notifications",
        description: "There was a problem loading your notifications. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, deletedMockIds])

  // Load deleted mock notification IDs from localStorage on component mount
  useEffect(() => {
    try {
      const storedIds = localStorage.getItem('deletedMockNotificationIds')
      if (storedIds) {
        const deletedIds = JSON.parse(storedIds)
        setDeletedMockIds(deletedIds)
      }
    } catch (error) {
      console.error('Error loading deleted notification IDs from localStorage:', error)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const deleteNotification = async (notificationId: string) => {
    try {
      // Update the state immediately for better UX (optimistic update)
      setNotifications(notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, deleted: true }
          : notification
      ))

      // After a short delay, actually remove from the state
      setTimeout(() => {
        setNotifications(notifications.filter(notification => notification.id !== notificationId))
      }, 500) // 500ms delay for animation to complete

      // For mock notifications (those without hyphens), track them as deleted
      if (!notificationId.includes('-')) {
        // Store the deleted mock notification ID in local state
        setDeletedMockIds(prev => [...prev, notificationId])

        // Also store in localStorage to persist across page refreshes
        try {
          // Get existing deleted IDs from localStorage
          const storedIds = localStorage.getItem('deletedMockNotificationIds')
          const deletedIds = storedIds ? JSON.parse(storedIds) : []

          // Add the new ID if it's not already in the list
          if (!deletedIds.includes(notificationId)) {
            deletedIds.push(notificationId)
            localStorage.setItem('deletedMockNotificationIds', JSON.stringify(deletedIds))
          }
        } catch (storageError) {
          console.error('Error storing deleted notification ID in localStorage:', storageError)
        }
      } else {
        // For real notifications (with hyphens), delete from the database
        const response = await fetch('/api/notifications/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notificationId: notificationId,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Failed to delete notification')
        }
      }

      toast({
        title: "Notification deleted",
        description: "The notification has been deleted.",
      })
    } catch (error) {
      console.error('Error deleting notification:', error)

      // Revert the state change if there was an error
      setNotifications(notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, deleted: false }
          : notification
      ))

      toast({
        variant: "destructive",
        title: "Failed to delete notification",
        description: "There was a problem deleting the notification. Please try again.",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMs / 3600000)
    const diffDays = Math.round(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    }
  }

  // Utility function to highlight the word "Paid" in payment notifications
  const highlightPaidText = (message: string) => {
    if (!message.includes('Paid') && !message.includes('paid')) {
      return message
    }

    // Use regex to find the word "Paid" or "paid" and wrap it in a span with green text
    return message.replace(/(Paid|paid)/g, match => (
      `<span class="text-emerald-600 font-medium">${match}</span>`
    ))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_update':
        return <div className="bg-blue-100 p-2 md:p-2 rounded-full min-w-[40px] min-h-[40px] flex items-center justify-center"><Bell className="h-4 w-4 text-blue-600" /></div>
      case 'invoice_status':
        return <div className="bg-green-100 p-2 md:p-2 rounded-full min-w-[40px] min-h-[40px] flex items-center justify-center"><FileText className="h-4 w-4 text-green-600" /></div>
      case 'payment_processed':
        return <div className="bg-emerald-100 p-2 md:p-2 rounded-full min-w-[40px] min-h-[40px] flex items-center justify-center"><DollarSign className="h-4 w-4 text-emerald-600" /></div>
      case 'system':
        return <div className="bg-amber-100 p-2 md:p-2 rounded-full min-w-[40px] min-h-[40px] flex items-center justify-center"><Bell className="h-4 w-4 text-amber-600" /></div>
      default:
        return <div className="bg-gray-100 p-2 md:p-2 rounded-full min-w-[40px] min-h-[40px] flex items-center justify-center"><Bell className="h-4 w-4 text-gray-600" /></div>
    }
  }

  // Handle loading state with skeleton UI
  if (loading) {
    return <NotificationsLoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Stay updated with your latest activity
          </p>
        </div>
      </div>

      <div className="rounded-md border">
        {notifications.length > 0 ? (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 md:p-4 flex flex-col md:flex-row items-start gap-4 ${notification.read ? 'bg-background' : 'bg-muted/30'} transition-all duration-300 opacity-100 animate-fadeIn`}
              >
                {getNotificationIcon(notification.type)}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`text-sm font-medium ${notification.read ? '' : 'font-semibold'}`}>
                      {notification.title}
                      {notification.job && (
                        <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">
                          {notification.job.job_type}
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.type === 'payment_processed' || notification.type === 'invoice_status' ? (
                      <span dangerouslySetInnerHTML={{ __html: highlightPaidText(notification.message) }} />
                    ) : (
                      notification.message
                    )}
                  </p>
                  {notification.type === 'payment_processed' && notification.job?.paid && (
                    <div className="mt-2 flex items-center">
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Payment Processed
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 min-w-[100px] w-full md:w-auto mt-3 md:mt-0 border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="h-10 px-4 min-w-[44px] transition-colors hover:bg-destructive/10 touch-manipulation"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>

                    {(notification.type === 'payment_processed' || notification.type === 'job_update') && notification.job && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-4 min-w-[44px] touch-manipulation"
                        asChild
                      >
                        <a href={`/dashboard/subcontractor/jobs/${notification.job.id}`}>
                          View Job
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">You don&apos;t have any notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Loading skeleton component
function NotificationsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Stay updated with your latest activity
          </p>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="p-1">
          {Array(5).fill(null).map((_, i) => (
            <div key={i} className="flex flex-col md:flex-row items-start gap-4 p-4 border-t first:border-t-0">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2 w-full">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-[60px]" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex flex-col gap-2 min-w-[100px] w-full md:w-auto mt-3 md:mt-0 border-t md:border-t-0 pt-3 md:pt-0">
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-[100px]" />
                  <Skeleton className="h-10 w-[100px]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}