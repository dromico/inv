import { format } from "date-fns"
import { createServerComponentClient } from "@/lib/supabase-server"
import { Database } from "@/types/database"
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
import { FileText, CheckCircle, Send, Download, Loader2 } from "lucide-react"
import Link from "next/link"
import { PDFButtonLoading } from "@/components/pdf-loading"

// Define types based on the database schema
type InvoiceRecord = Database['public']['Tables']['invoices']['Row']
type JobRecord = Database['public']['Tables']['jobs']['Row']

// Mark this page as dynamically rendered
export const dynamic = 'force-dynamic';

// Extended invoice type with job details
interface InvoiceWithJob extends InvoiceRecord {
  jobs: Pick<JobRecord, 'id' | 'job_type' | 'location' | 'status'> | null;
}

// Format currency as Malaysian Ringgit
function formatCurrency(amount: number | null) {
  if (amount === null) return 'N/A';
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2
  }).format(amount)
}

// Format date to a readable format
function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), "PPP")
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return 'Invalid Date';
  }
}

export default async function SubcontractorInvoicesPage() {
  console.log("InvoicesPage: Creating server component client")
  const supabase = await createServerComponentClient()

  // Get the current user
  console.log("InvoicesPage: Fetching user with server component client")
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  console.log("InvoicesPage: Auth check result:", {
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
            <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
            <p className="text-muted-foreground">
              View your invoices for completed jobs
            </p>
          </div>
        </div>

        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground mb-4">You must be logged in to view your invoices</p>
        </div>
      </div>
    )
  }

  try {
    // Fetch invoices for the current user's completed jobs only
    console.log("Fetching invoices for user:", user.id);

    // First, get the jobs that belong to this subcontractor
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id')
      .eq('subcontractor_id', user.id);

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      throw new Error(`Error fetching jobs: ${JSON.stringify(jobsError)}`);
    }

    if (!jobs || jobs.length === 0) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
              <p className="text-muted-foreground">
                View your invoices for completed jobs
              </p>
            </div>
          </div>

          <div className="rounded-md border p-8 text-center">
            <p className="text-muted-foreground mb-4">You don't have any jobs yet.</p>
          </div>
        </div>
      );
    }

    // Get the job IDs
    const jobIds = jobs.map((job: any) => job.id);
    console.log("Found job IDs:", jobIds);

    // Now fetch invoices for these jobs
    console.log("Fetching invoices for job IDs:", jobIds);

    // Try the query without ordering
    console.log("Fetching invoices without ordering");
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        jobs (id, job_type, location, status)
      `)
      .in('job_id', jobIds);

    console.log("Invoices query result:", {
      hasInvoices: !!invoices && invoices.length > 0,
      count: invoices?.length,
      error: invoicesError ? JSON.stringify(invoicesError) : null
    });

    if (invoicesError) {
      throw new Error(`Error fetching invoices: ${JSON.stringify(invoicesError)}`);
    }

    // Handle loading state with skeleton UI
    if (!invoices) {
      return <InvoicesLoadingSkeleton />
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
            <p className="text-muted-foreground">
              View your invoices for completed jobs
            </p>
          </div>
        </div>

        <div className="rounded-md border">
          {invoices.length > 0 && invoices.filter((invoice: any) => invoice.jobs?.status === 'completed').length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Job Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices
                  .filter((invoice: any) => invoice.jobs?.status === 'completed')
                  .map((invoice: InvoiceWithJob) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{formatDate(invoice.invoice_date)}</TableCell>
                      <TableCell>{invoice.jobs?.job_type || 'N/A'}</TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {invoice.status === 'paid' && <CheckCircle className="mr-1 h-3 w-3" />}
                          {invoice.status === 'sent' && <Send className="mr-1 h-3 w-3" />}
                          {invoice.status === 'generated' && <FileText className="mr-1 h-3 w-3" />}
                          {invoice.status || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.total_amount)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/api/invoices/${invoice.job_id}`}>
                              <FileText className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/api/invoices/${invoice.job_id}`} target="_blank">
                              <Download className="mr-2 h-4 w-4" />
                              PDF
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground mb-4">You don&apos;t have any invoices for completed jobs yet.</p>
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in SubcontractorInvoicesPage:', error instanceof Error ? error.message : JSON.stringify(error));

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
            <p className="text-muted-foreground">
              View your invoices for completed jobs
            </p>
          </div>
        </div>

        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground mb-4">Failed to load invoices. Please try again later.</p>
          <p className="text-sm text-red-500">
            {error instanceof Error ? error.message : JSON.stringify(error)}
          </p>
        </div>
      </div>
    )
  }
}

// Loading skeleton component
function InvoicesLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">
            View your invoices for completed jobs
          </p>
        </div>
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