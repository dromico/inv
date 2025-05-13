"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Job, Notification } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { CalendarDays, FileText, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EnhancedFAB } from "@/components/enhanced-fab"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"

export default function SubcontractorDashboard() {
  const [jobStats, setJobStats] = useState({
    totalJobs: 0,
    pendingJobs: 0,
    completedJobs: 0,
    inProgressJobs: 0,
  })
  const [recentJobs, setRecentJobs] = useState<Job[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Define the function inside useEffect
    async function loadDashboardData() {
      try {
        setLoading(true)
        let userId = null;

        // Get current user with improved error handling
        const { data, error: userError } = await supabase.auth.getUser()

        if (userError) {
          throw new Error(`Authentication error: ${userError.message}`);
        }

        if (!data || !data.user) {
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to view this page.",
          })
          return
        }

        userId = data.user.id;

        // Fetch job stats
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .eq('subcontractor_id', userId);

        if (jobsError) {
          throw new Error(`Error fetching jobs: ${jobsError.message}`);
        }

        // Always set data, even if null, to prevent state inconsistencies
        const jobsList = jobsData || [];

        // Calculate job statistics
        const statsData = {
          totalJobs: jobsList.length,
          pendingJobs: jobsList.filter(job => job.status === 'pending').length,
          inProgressJobs: jobsList.filter(job => job.status === 'in-progress').length,
          completedJobs: jobsList.filter(job => job.status === 'completed').length,
        };
        setJobStats(statsData);

        // Sort jobs by creation date and take the 5 most recent
        const sortedJobs = [...jobsList].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 5);

        setRecentJobs(sortedJobs);

        // Fetch notifications
        try {
          const { data: notificationsData, error: notificationsError } = await supabase
            .from('notifications')
            .select('*')
            .eq('recipient_id', userId)
            .eq('read', false)
            .order('created_at', { ascending: false })
            .limit(5);

          if (notificationsError) {
            throw new Error(`Error fetching notifications: ${notificationsError.message}`);
          }

          // Always set notifications, empty array if null
          setNotifications(notificationsData || []);
        } catch (notificationError) {
          // Handle notification errors separately to prevent dashboard from failing completely
          console.error('Error loading notifications:', notificationError);
          // Still set empty notifications to prevent undefined state
          setNotifications([]);
        }
      } catch (error) {
        // Improve error handling by converting error to a readable string
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error loading dashboard data:', errorMessage);
        toast({
          variant: "destructive",
          title: "Failed to load dashboard",
          description: "There was a problem loading your dashboard data. Please try again.",
        });

        // Set default values for states to prevent undefined errors
        setJobStats({
          totalJobs: 0,
          pendingJobs: 0,
          completedJobs: 0,
          inProgressJobs: 0,
        });
        setRecentJobs([]);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }

    // Call the function and handle any uncaught errors
    loadDashboardData().catch(error => {
      console.error('Uncaught error in loadDashboardData:', error);
      setLoading(false);
    });
  }, [supabase, toast])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  // Show skeleton loading state while data is being fetched
  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6 relative pb-20 sm:pb-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Subcontractor Dashboard</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your job submissions and track their status
          </p>
        </div>
        {/* Desktop New Job button - hidden on mobile */}
        <Button className="hidden sm:flex" asChild>
          <Link href="/dashboard/subcontractor/jobs/new">
            <Plus className="mr-2 h-4 w-4" /> New Job
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Jobs
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              {jobStats.totalJobs}
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">{jobStats.totalJobs}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Pending Jobs
            </CardTitle>
            <div className="rounded-full h-3 w-3 bg-amber-500"/>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">{jobStats.pendingJobs}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              In Progress
            </CardTitle>
            <div className="rounded-full h-3 w-3 bg-blue-500"/>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">{jobStats.inProgressJobs}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Completed
            </CardTitle>
            <div className="rounded-full h-3 w-3 bg-green-500"/>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">{jobStats.completedJobs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Floating Action Button for New Job */}
      <EnhancedFAB
        href="/dashboard/subcontractor/jobs/new"
        iconName="plus"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <CalendarDays className="mr-2 h-5 w-5 text-muted-foreground" />
              Recent Jobs
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Your recently submitted jobs
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {recentJobs.length > 0 ? (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center space-x-4 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{job.job_type}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{job.location}</p>
                    </div>
                    <div className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                      job.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                      job.status === 'in-progress' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {job.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">No jobs submitted yet</p>
                  <Button asChild size="sm" className="h-10 px-4">
                    <Link href="/dashboard/subcontractor/jobs/new">
                      Add Your First Job
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="px-4 sm:px-6">
            <Button variant="outline" asChild className="w-full h-10">
              <Link href="/dashboard/subcontractor/jobs">View All Jobs</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="col-span-1 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
              Notifications
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Recent updates on your jobs
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-4 border-l-4 border-primary pl-4 py-2 bg-gray-50 rounded-r-lg">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(notification.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-muted-foreground">No new notifications</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="px-4 sm:px-6">
            <Button variant="outline" asChild className="w-full h-10">
              <Link href="/dashboard/subcontractor/notifications">View All Notifications</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
