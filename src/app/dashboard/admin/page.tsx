"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRightIcon, BarChart4, CircleDollarSign, ListTodo, Settings, Users, Database } from "lucide-react"

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
        
        if (pendingError) throw pendingError
        
        // Get subcontractors count (excluding admin users)
        const { count: totalSubcontractors, error: subError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
        
        if (subError) throw subError
        
        // Get recent invoice total
        const { data: invoices, error: invError } = await supabase
          .from('invoices')
          .select('amount')
          .order('created_at', { ascending: false })
          .limit(5)
        
        if (invError) throw invError
        
        const recentInvoiceAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
        
        setStats({
          totalJobs: totalJobs || 0,
          pendingJobs: pendingJobs || 0,
          totalSubcontractors: totalSubcontractors || 0,
          recentInvoiceAmount
        })
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
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
            <CardDescription>Recent jobs and subcontractor activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Recent Jobs</h4>
              
              {loading ? (
                <div className="space-y-2">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-md border">
                    <div>
                      <p className="font-medium">Electrical Wiring</p>
                      <p className="text-sm text-muted-foreground">Site A</p>
                    </div>
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Pending
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md border">
                    <div>
                      <p className="font-medium">Plumbing Installation</p>
                      <p className="text-sm text-muted-foreground">Building B</p>
                    </div>
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      In Progress
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md border">
                    <div>
                      <p className="font-medium">Interior Painting</p>
                      <p className="text-sm text-muted-foreground">Residence 123</p>
                    </div>
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/admin/jobs">
                    View all jobs <ArrowRightIcon className="ml-1 h-4 w-4" />
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
