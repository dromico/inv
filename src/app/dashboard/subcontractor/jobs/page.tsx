import Link from "next/link"
import { format } from "date-fns"
import { createServerComponentClient } from "@/lib/supabase-server"
import { Json } from "@/types/database"
import { Button } from "@/components/ui/button"
import { JobSubmissionSuccess } from "@/components/job-submission-success"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus } from "lucide-react"
import { EnhancedFAB } from "@/components/enhanced-fab"
import { JobsLoadingSkeleton } from "@/components/jobs-skeleton"

// Define the job type that matches what we get from the database
interface JobFromDB {
  id: string;
  subcontractor_id: string;
  job_type: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
  status: 'pending' | 'in-progress' | 'completed' | null;
  unit: number | null;
  unit_price: number | null;
  total: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  line_items: Json;
}

// Mark this page as dynamically rendered
export const dynamic = 'force-dynamic';

// Format currency as Malaysian Ringgit
function formatCurrency(amount: number | null) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2
  }).format(amount || 0)
}

// Calculate the total amount including all line items
function calculateTotalAmount(job: JobFromDB): number {
  // Start with the base job amount (unit * unit_price)
  let total = job.total || 0;

  // If there are line items, add their totals (excluding the first item which is already in the base total)
  if (job.line_items) {
    try {
      const lineItems = Array.isArray(job.line_items) ? job.line_items : [];

      // Skip the first item if it exists (as it's already counted in the base total)
      // and sum up the remaining items
      if (lineItems.length > 1) {
        const additionalTotal = lineItems.slice(1).reduce((sum, item) => {
          const quantity = Number(item.unit_quantity || item.quantity || 0);
          const price = Number(item.unit_price || 0);
          return sum + (quantity * price);
        }, 0);

        total += additionalTotal;
      }
    } catch (error) {
      console.error('Error calculating total from line items:', error);
    }
  }

  return total;
}

// Format date to a readable format
function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A'
  return format(new Date(dateString), "PPP")
}

export default async function JobsPage() {
  console.log("JobsPage: Creating server component client")
  const supabase = await createServerComponentClient()

  // Get the current user
  console.log("JobsPage: Fetching user with server component client")
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  console.log("JobsPage: Auth check result:", {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    error: userError ? JSON.stringify(userError) : null
  })

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

        {/* Success message for job submission - shown even in error state */}
        <JobSubmissionSuccess />

        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground mb-4">Failed to load jobs. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative pb-20 sm:pb-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Jobs</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your job submissions
          </p>
        </div>
        {/* Desktop New Job button - hidden on mobile */}
        <Button size="sm" className="hidden sm:flex md:h-10" asChild>
          <Link href="/dashboard/subcontractor/jobs/new">
            <Plus className="mr-2 h-4 w-4" /> New Job
          </Link>
        </Button>
      </div>

      {/* Success message for job submission */}
      <JobSubmissionSuccess />

      <div className="rounded-md border shadow-sm">
        {jobs && jobs.length > 0 ? (
          <>
            {/* Mobile view - card layout */}
            <div className="md:hidden">
              <div className="space-y-3 p-3">
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-lg border border-gray-200 p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow hover:border-gray-300">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-base">{job.job_type}</h3>
                      {job.status ? (
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          job.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                          job.status === 'in-progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {job.status}
                        </div>
                      ) : (
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          Undefined
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground font-medium">Location:</div>
                      <div>{job.location}</div>

                      <div className="text-muted-foreground font-medium">Date:</div>
                      <div>{formatDate(job.start_date)} - {formatDate(job.end_date)}</div>

                      <div className="text-muted-foreground font-medium">Total:</div>
                      <div className="font-bold">{formatCurrency(calculateTotalAmount(job))}</div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button variant="outline" size="sm" className="h-10 px-4 text-sm" asChild>
                        <Link href={`/dashboard/subcontractor/jobs/${job.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop view - table layout */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.job_type}</TableCell>
                      <TableCell>{job.location}</TableCell>
                      <TableCell>{formatDate(job.start_date)}</TableCell>
                      <TableCell>{formatDate(job.end_date)}</TableCell>
                      <TableCell>
                        {job.status ? (
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            job.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                            job.status === 'in-progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {job.status}
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            Undefined
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(calculateTotalAmount(job))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/subcontractor/jobs/${job.id}`}>
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No jobs found</p>
            <p className="text-sm text-muted-foreground">
              Create a new job to get started
            </p>
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button for New Job */}
      <EnhancedFAB
        href="/dashboard/subcontractor/jobs/new"
        iconName="plus"
      />
    </div>
  )
}
