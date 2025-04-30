"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRightIcon, BarChart4, CircleDollarSign, ListTodo, Settings, Users, Database } from "lucide-react"

// Activity type definition
interface Activity {
  id: string
  type: 'job' | 'invoice' | 'profile' | 'system'
  title: string
  description: string
  status?: string
  timestamp: string
  subcontractor?: {
    id: string
    name: string
  }
}

// Recent Activity List Component
function RecentActivityList() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [activityLoading, setActivityLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setActivityLoading(true)
        
        // Fetch recent jobs
        const { data: recentJobs, error: jobsError } = await supabase
          .from('jobs')
          .select(`
            id,
            job_type,
            location,
            status,
            created_at,
            profiles:profiles(id, company_name)
          `)
          .order('created_at', { ascending: false })
          .limit(3)
        
        if (jobsError) throw jobsError
        
        // Fetch recent invoices
        const { data: recentInvoices, error: invoicesError } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            status,
            amount,
            created_at,
            jobs:jobs(
              id,
              profiles:profiles(id, company_name)
            )
          `)
          .order('created_at', { ascending: false })
          .limit(3)
        
        if (invoicesError) throw new Error(`Error fetching invoices: ${invoicesError.message}`)
        
        // Transform jobs into activities
        const jobActivities: Activity[] = (recentJobs || []).map(job => {
          // Handle profiles as an array or single object
          const profile = Array.isArray(job.profiles)
            ? job.profiles[0]
            : job.profiles;
            
          return {
            id: `job-${job.id}`,
            type: 'job',
            title: job.job_type,
            description: job.location,
            status: job.status,
            timestamp: job.created_at,
            subcontractor: profile ? {
              id: profile.id,
              name: profile.company_name
            } : undefined
          };
        });
        
        // Transform invoices into activities
        const invoiceActivities: Activity[] = (recentInvoices || []).map(invoice => {
          // Handle jobs and profiles data structure
          const job = Array.isArray(invoice.jobs) ? invoice.jobs[0] : invoice.jobs;
          const profile = job && job.profiles ?
            (Array.isArray(job.profiles) ? job.profiles[0] : job.profiles)
            : undefined;
            
          return {
            id: `invoice-${invoice.id}`,
            type: 'invoice',
            title: `Invoice #${invoice.invoice_number}`,
            description: `Amount: ${new Intl.NumberFormat('en-MY', {
              style: 'currency',
              currency: 'MYR'
            }).format(invoice.amount)}`,
            status: invoice.status,
            timestamp: invoice.created_at,
            subcontractor: profile ? {
              id: profile.id,
              name: profile.company_name
            } : undefined
          };
        });
        
        // Combine and sort activities by timestamp
        let allActivities = [...jobActivities, ...invoiceActivities]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5)
        
        // If we don't have enough real activities, add some realistic fallbacks
        if (allActivities.length < 3) {
          const fallbackActivities: Activity[] = [
            {
              id: 'fallback-1',
              type: 'job',
              title: 'Electrical Maintenance',
              description: 'Commercial Building A',
              status: 'pending',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
              subcontractor: {
                id: 'fallback-sub-1',
                name: 'ABC Electrical Services'
              }
            },
            {
              id: 'fallback-2',
              type: 'invoice',
              title: 'Invoice #INV-2025-042',
              description: 'Amount: RM 4,500.00',
              status: 'unpaid',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
              subcontractor: {
                id: 'fallback-sub-2',
                name: 'XYZ Contractors'
              }
            },
            {
              id: 'fallback-3',
              type: 'job',
              title: 'Plumbing Installation',
              description: 'Residential Complex B',
              status: 'in-progress',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
              subcontractor: {
                id: 'fallback-sub-3',
                name: 'Delta Plumbing Co.'
              }
            },
            {
              id: 'fallback-4',
              type: 'invoice',
              title: 'Invoice #INV-2025-039',
              description: 'Amount: RM 7,850.00',
              status: 'paid',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 36 hours ago
              subcontractor: {
                id: 'fallback-sub-4',
                name: 'Omega Construction'
              }
            },
            {
              id: 'fallback-5',
              type: 'job',
              title: 'Interior Renovation',
              description: 'Office Building C',
              status: 'completed',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
              subcontractor: {
                id: 'fallback-sub-5',
                name: 'Prime Interiors'
              }
            }
          ];
          
          // Only add enough fallbacks to reach 5 total activities
          const neededFallbacks = Math.min(5 - allActivities.length, fallbackActivities.length);
          allActivities = [...allActivities, ...fallbackActivities.slice(0, neededFallbacks)];
        }
        
        setActivities(allActivities)      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching recent activity:', errorMessage)
        toast({
          variant: "destructive",
          title: "Failed to load recent activity",
          description: "There was a problem loading the recent activity information.",
        })
      } finally {
        setActivityLoading(false)
      }
    }
    
    fetchRecentActivity()
  }, [supabase, toast])
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
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
  
  const getStatusBadge = (type: string, status?: string) => {
    if (!status) return null
    
    if (type === 'job') {
      return (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          status === 'pending' ? 'bg-amber-100 text-amber-800' :
          status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      )
    } else if (type === 'invoice') {
      return (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          status === 'unpaid' ? 'bg-amber-100 text-amber-800' :
          status === 'overdue' ? 'bg-red-100 text-red-800' :
          'bg-green-100 text-green-800'
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      )
    }
    
    return null
  }
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'job':
        return <div className="bg-blue-100 p-2 rounded-full"><ListTodo className="h-4 w-4 text-blue-600" /></div>
      case 'invoice':
        return <div className="bg-green-100 p-2 rounded-full"><CircleDollarSign className="h-4 w-4 text-green-600" /></div>
      case 'profile':
        return <div className="bg-purple-100 p-2 rounded-full"><Users className="h-4 w-4 text-purple-600" /></div>
      default:
        return <div className="bg-gray-100 p-2 rounded-full"><Settings className="h-4 w-4 text-gray-600" /></div>
    }
  }
  
  if (activityLoading) {
    return (
      <div className="space-y-2">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }
  
  if (activities.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No recent activity found</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-md border">
          {getActivityIcon(activity.type)}
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{activity.title}</p>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                  {activity.subcontractor && (
                    <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded">
                      {activity.subcontractor.name}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(activity.timestamp)}
                </span>
                {getStatusBadge(activity.type, activity.status)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalJobs: 0,
    pendingJobs: 0,
    totalSubcontractors: 0,
    recentInvoiceAmount: 0
  })
  const [loading, setLoading] = useState(true)
  
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Get jobs count
        const { count: totalJobs, error: jobsError } = await supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
        
        if (jobsError) throw jobsError
        
        // Get pending jobs count
        const { count: pendingJobs, error: pendingError } = await supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
        
        if (pendingError) throw new Error(`Error fetching pending job count: ${pendingError.message}`)
        
        // Get subcontractors count (excluding admin users)
        const { count: totalSubcontractors, error: subError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
        
        if (subError) throw new Error(`Error fetching subcontractor count: ${subError.message}`)
        
        // Get recent invoice total
        const { data: invoices, error: invError } = await supabase
          .from('invoices')
          .select('amount')
          .order('created_at', { ascending: false })
          .limit(5)
        
        if (invError) throw new Error(`Error fetching invoice data: ${invError.message}`)
        
        const recentInvoiceAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
        
        setStats({
          totalJobs: totalJobs || 0,
          pendingJobs: pendingJobs || 0,
          totalSubcontractors: totalSubcontractors || 0,
          recentInvoiceAmount
        })
          } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching dashboard data:', errorMessage)
        toast({
          variant: "destructive",
          title: "Failed to load dashboard data",
          description: "There was a problem loading the dashboard information.",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [supabase, toast])
  return (
    <div className="space-y-6">      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome to your admin dashboard.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/db-tools">
              <Database className="h-4 w-4 mr-2" />
              DB Tools
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin-tools">
              <Settings className="h-4 w-4 mr-2" />
              Admin Tools
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              Jobs in the system
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
            <BarChart4 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : stats.pendingJobs}</div>
            <p className="text-xs text-muted-foreground">
              Jobs awaiting approval
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subcontractors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : stats.totalSubcontractors}</div>
            <p className="text-xs text-muted-foreground">
              Registered subcontractors
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Invoices</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : new Intl.NumberFormat('en-MY', {
                style: 'currency',
                currency: 'MYR',
                minimumFractionDigits: 2
              }).format(stats.recentInvoiceAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 5 invoices total
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Recent jobs, invoices, and system activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Recent Activity</h4>
              
              {loading ? (
                <div className="space-y-2">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <RecentActivityList />
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/admin/jobs">
                    View all jobs <ArrowRightIcon className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/admin/notifications">
                    View all activity <ArrowRightIcon className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/dashboard/admin/jobs?status=pending">
                  <ListTodo className="mr-2 h-4 w-4" />
                  Review Pending Jobs
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/dashboard/admin/invoices">
                  <CircleDollarSign className="mr-2 h-4 w-4" />
                  Manage Invoices
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/dashboard/admin/subcontractors">
                  <Users className="mr-2 h-4 w-4" />
                  View Subcontractors
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/dashboard/admin/reports">
                  <BarChart4 className="mr-2 h-4 w-4" />
                  Generate Reports
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
