import Link from "next/link"
import { format } from "date-fns"
import { createServerComponentClient } from "@/lib/supabase-server"
import { Job } from "@/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus } from "lucide-react"

// Format currency as Malaysian Ringgit
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2
  }).format(amount)
}

// Format date to a readable format
function formatDate(dateString: string) {
  return format(new Date(dateString), "PPP")
}

export default async function JobsPage() {
  const supabase = createServerComponentClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
            <p className="text-muted-foreground">
              Manage your job submissions
            </p>
          </div>
        </div>
        
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground mb-4">You must be logged in to view your jobs</p>
        </div>
      </div>
    )
  }
  
  // Fetch jobs for the current user
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('subcontractor_id', user.id)
    .order('created_at', { ascending: false })
  
  // Handle loading state with skeleton UI
  if (!jobs && !error) {
    return <JobsLoadingSkeleton />
  }
  
  // Handle error state
  if (error) {
    console.error('Error loading jobs:', error)
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
            <p className="text-muted-foreground">
              Manage your job submissions
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/subcontractor/jobs/new">
              <Plus className="mr-2 h-4 w-4" /> New Job
            </Link>
          </Button>
        </div>
        
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground mb-4">Failed to load jobs. Please try again later.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
          <p className="text-muted-foreground">
            Manage your job submissions
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/subcontractor/jobs/new">
            <Plus className="mr-2 h-4 w-4" /> New Job
          </Link>
        </Button>
      </div>
      
      <div className="rounded-md border">
        {jobs && jobs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job: Job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.job_type}</TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell>{formatDate(job.start_date)}</TableCell>
                  <TableCell>{formatDate(job.end_date)}</TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      job.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      job.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {job.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(job.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">You haven&apos;t submitted any jobs yet.</p>
            <Button asChild>
              <Link href="/dashboard/subcontractor/jobs/new">Create Your First Job</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Loading skeleton component
function JobsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
          <p className="text-muted-foreground">
            Manage your job submissions
          </p>
        </div>
        <Skeleton className="h-10 w-[120px]" />
      </div>
      
      <div className="rounded-md border">
        <div className="p-1">
          <div className="flex items-center p-4">
            <Skeleton className="h-5 w-full" />
          </div>
          {Array(5).fill(null).map((_, i) => (
            <div key={i} className="flex items-center p-4 border-t">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
