"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Job, Notification } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { CalendarDays, FileText, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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
    async function loadDashboardData() {
      try {        setLoading(true)
        let userId = null;
        
        // Get current user with improved error handling
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          throw new Error(`Authentication error: ${userError.message}`);
        }
        
        if (!user) {
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to view this page.",
          })
          return
        }
        userId = user.id;
          // Fetch job stats
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .eq('subcontractor_id', userId);

        if (jobsError) {
          throw new Error(`Error fetching jobs: ${jobsError.message}`);
        }        // Always set data, even if null, to prevent state inconsistencies
        const jobsList = jobsData || [];
        const statsData = {
          totalJobs: jobsList.length,
          pendingJobs: jobsList.filter(job => job.status === 'pending').length,
          inProgressJobs: jobsList.filter(job => job.status === 'in-progress').length,
          completedJobs: jobsList.filter(job => job.status === 'completed').length,
        };
        setJobStats(statsData);

        const sortedJobs = [...jobsList].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 5);
        setRecentJobs(sortedJobs);// Fetch notifications
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', userId)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (notificationsError) {
          throw new Error(`Error fetching notifications: ${notificationsError.message}`);
        }        // Always set notifications, empty array if null
        setNotifications(notificationsData || []);
          } catch (error) {
        // Improve error handling by converting error to a readable string
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error loading dashboard data:', errorMessage);
        toast({
          variant: "destructive",
          title: "Failed to load dashboard",
          description: "There was a problem loading your dashboard data. Please try again.",
        })
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [supabase, toast])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-MY', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    }).format(date)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Subcontractor Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your job submissions and track their status
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/subcontractor/jobs/new">
            <Plus className="mr-2 h-4 w-4" /> New Job
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Jobs
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              {jobStats.totalJobs}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.totalJobs}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Jobs
            </CardTitle>
            <div className="rounded-full h-3 w-3 bg-amber-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.pendingJobs}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              In Progress
            </CardTitle>
            <div className="rounded-full h-3 w-3 bg-blue-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.inProgressJobs}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed
            </CardTitle>
            <div className="rounded-full h-3 w-3 bg-green-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.completedJobs}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarDays className="mr-2 h-5 w-5 text-muted-foreground" />
              Recent Jobs
            </CardTitle>
            <CardDescription>
              Your recently submitted jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : recentJobs.length > 0 ? (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center space-x-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{job.job_type}</p>
                      <p className="text-sm text-muted-foreground">{job.location}</p>
                    </div>
                    <div className={`px-2 py-1 text-xs rounded-full ${
                      job.status === 'completed' ? 'bg-green-100 text-green-700' : 
                      job.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {job.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">No jobs submitted yet</p>
                  <Button asChild size="sm">
                    <Link href="/dashboard/subcontractor/jobs/new">
                      Add Your First Job
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/subcontractor/jobs">View All Jobs</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
              Notifications
            </CardTitle>
            <CardDescription>
              Recent updates on your jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-4 border-l-4 border-primary pl-4 py-2">
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
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/subcontractor/notifications">View All Notifications</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
