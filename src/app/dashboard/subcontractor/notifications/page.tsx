"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Bell, CheckCircle } from "lucide-react"

// Define notification types
interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'job_update' | 'invoice_status' | 'system'
  read: boolean
  created_at: string
}

export default function SubcontractorNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
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
      
      // For now, we'll use mock data since the notifications table might not exist yet
      // In a real implementation, you would fetch from the database
      const mockNotifications: Notification[] = [
        {
          id: "1",
          user_id: user.id,
          title: "Job Status Updated",
          message: "Your job #JOB-2023-001 has been approved by the admin.",
          type: "job_update",
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
        },
        {
          id: "2",
          user_id: user.id,
          title: "Invoice Paid",
          message: "Your invoice #INV-2023-042 has been marked as paid.",
          type: "invoice_status",
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
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
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        {
          id: "5",
          user_id: user.id,
          title: "Invoice Reminder",
          message: "Reminder: Invoice #INV-2023-045 is due in 3 days.",
          type: "invoice_status",
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() // 12 hours ago
        }
      ]
      
      setNotifications(mockNotifications)
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
  }, [supabase, toast])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const markAsRead = async (notificationId: string) => {
    try {
      // In a real implementation, you would update the database
      // For now, we'll just update the state
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      ))
      
      toast({
        title: "Notification marked as read",
        description: "The notification has been marked as read.",
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast({
        variant: "destructive",
        title: "Failed to update notification",
        description: "There was a problem updating the notification. Please try again.",
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      // In a real implementation, you would update the database
      // For now, we'll just update the state
      setNotifications(notifications.map(notification => ({ ...notification, read: true })))
      
      toast({
        title: "All notifications marked as read",
        description: "All notifications have been marked as read.",
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast({
        variant: "destructive",
        title: "Failed to update notifications",
        description: "There was a problem updating the notifications. Please try again.",
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_update':
        return <div className="bg-blue-100 p-2 rounded-full"><Bell className="h-4 w-4 text-blue-600" /></div>
      case 'invoice_status':
        return <div className="bg-green-100 p-2 rounded-full"><Bell className="h-4 w-4 text-green-600" /></div>
      case 'system':
        return <div className="bg-amber-100 p-2 rounded-full"><Bell className="h-4 w-4 text-amber-600" /></div>
      default:
        return <div className="bg-gray-100 p-2 rounded-full"><Bell className="h-4 w-4 text-gray-600" /></div>
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
        {notifications.some(n => !n.read) && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>
      
      <div className="rounded-md border">
        {notifications.length > 0 ? (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 flex items-start gap-4 ${notification.read ? 'bg-background' : 'bg-muted/30'}`}
              >
                {getNotificationIcon(notification.type)}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`text-sm font-medium ${notification.read ? '' : 'font-semibold'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                </div>
                {!notification.read && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => markAsRead(notification.id)}
                    className="self-start"
                  >
                    Mark as read
                  </Button>
                )}
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
        <Skeleton className="h-10 w-[150px]" />
      </div>
      
      <div className="rounded-md border">
        <div className="p-1">
          {Array(5).fill(null).map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 border-t first:border-t-0">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}