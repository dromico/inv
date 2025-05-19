"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@/lib/supabase"
import { JobWithSubcontractor } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  MoreHorizontal,
  Search,
  CheckSquare,
  Clock,
  FileText,
  DollarSign,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobWithSubcontractor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalJobs, setTotalJobs] = useState(0)
  const [selectedJob, setSelectedJob] = useState<JobWithSubcontractor | null>(null)
  const jobsPerPage = 10

  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadJobs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter])

  const loadJobs = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('jobs')
        .select(`
          *,
          profile:profiles(*)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter)
      }

      if (searchQuery) {
        query = query.or(`job_type.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)
      }

      // Add pagination
      const from = (currentPage - 1) * jobsPerPage
      const to = from + jobsPerPage - 1

      const { data, error, count } = await query
        .range(from, to)

      if (error) {
        throw error
      }

      if (data) {
        setJobs(data as unknown as JobWithSubcontractor[])
        setTotalJobs(count || 0)
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
      toast({
        variant: "destructive",
        title: "Failed to load jobs",
        description: "There was a problem loading the jobs. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      // Get the current job to check its current status
      const job = jobs.find(j => j.id === jobId);
      if (!job) {
        toast({
          variant: "destructive",
          title: "Job not found",
          description: "The job you're trying to update could not be found.",
        });
        return;
      }

      // Update the local state immediately for better UX
      setJobs(prevJobs =>
        prevJobs.map(j =>
          j.id === jobId ? { ...j, status } : j
        )
      );

      // If selectedJob is set and matches the current job, update it too
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob({...selectedJob, status});
      }

      // Special handling for completed status
      if (status === 'completed') {
        // Check if there's already an invoice for this job
        const { data: existingInvoice, error: invoiceCheckError } = await supabase
          .from('invoices')
          .select('id')
          .eq('job_id', jobId)
          .maybeSingle();

        if (invoiceCheckError) {
          console.error('Error checking for existing invoice:', invoiceCheckError);
        }

        // If there's no invoice yet, we'll let the database trigger create it
        if (!existingInvoice) {
          console.log('No existing invoice found. The database trigger will create one.');
        } else {
          console.log('Existing invoice found:', existingInvoice.id);
        }
      }

      // Update the job status in the database
      const { error } = await supabase
        .from('jobs')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) {
        console.error('Supabase error details:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);

        // Revert the local state change if the update fails
        setJobs(prevJobs =>
          prevJobs.map(j =>
            j.id === jobId ? { ...j, status: job.status } : j
          )
        );

        // Also revert selectedJob if it was updated
        if (selectedJob && selectedJob.id === jobId) {
          setSelectedJob({...selectedJob, status: job.status});
        }

        throw error;
      }

      toast({
        title: "Status updated",
        description: `Job status updated to ${status}`,
      });

      // Refresh the jobs list to ensure we have the latest data
      loadJobs();
    } catch (error) {
      console.error('Error updating job status:', error);

      // Check if the error is a PostgreSQL error (likely a constraint violation)
      let errorMessage = 'Unknown error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;

        // Log additional details if available
        if ('code' in error) {
          console.error('Error code:', (error as any).code);
        }
        if ('details' in error) {
          console.error('Error details:', (error as any).details);
        }
      }

      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: `There was a problem updating the job status: ${errorMessage}. Please try again.`,
      });
    }
  }

  const updateJobPaidStatus = async (jobId: string, paid: boolean) => {
    try {
      // Only allow updating paid status for completed jobs
      const job = jobs.find(j => j.id === jobId)
      if (job?.status !== 'completed') {
        toast({
          variant: "destructive",
          title: "Cannot update paid status",
          description: "Only completed jobs can be marked as paid.",
        })
        return
      }

      // Update the local state immediately for better UX
      setJobs(prevJobs =>
        prevJobs.map(j =>
          j.id === jobId ? { ...j, paid } : j
        )
      )

      // If selectedJob is set and matches the current job, update it too
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob({...selectedJob, paid})
      }

      // First, try to directly update the invoice status if it exists
      // This avoids the type mismatch issue by using the update_invoice_status function
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('id')
        .eq('job_id', jobId)
        .single()

      if (invoiceData?.id) {
        // Use RPC to call the update_invoice_status function
        const { error: rpcError } = await supabase.rpc(
          'update_invoice_status',
          {
            invoice_id: invoiceData.id,
            new_status: paid ? 'paid' : 'unpaid'
          }
        )

        if (rpcError) {
          console.error('Error updating invoice status via RPC:', rpcError)
          // Continue to try updating the job directly
        } else {
          // If RPC was successful, we're done
          toast({
            title: paid ? "Payment recorded" : "Payment status updated",
            description: paid ? "Job has been marked as paid" : "Job has been marked as unpaid",
          })

          // Refresh the jobs list to ensure we have the latest data
          loadJobs()
          return
        }
      }

      // Fallback: Update the job in the database directly
      const { error } = await supabase
        .from('jobs')
        .update({ paid: paid })
        .eq('id', jobId)
        .eq('status', 'completed') // Ensure we're only updating completed jobs

      if (error) {
        console.error('Supabase error details:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)

        // Revert the local state change if the update fails
        setJobs(prevJobs =>
          prevJobs.map(j =>
            j.id === jobId ? { ...j, paid: !paid } : j
          )
        )

        // Also revert selectedJob if it was updated
        if (selectedJob && selectedJob.id === jobId) {
          setSelectedJob({...selectedJob, paid: !paid})
        }

        throw error
      }

      toast({
        title: paid ? "Payment recorded" : "Payment status updated",
        description: paid ? "Job has been marked as paid" : "Job has been marked as unpaid",
      })

      // Create a notification when a job is marked as paid
      if (paid) {
        try {
          // Check if the notifications table exists by attempting a simple query
          const { error: checkError } = await supabase
            .from('notifications')
            .select('id')
            .limit(1)

          // If the table doesn't exist or there's an error, log it but don't fail the whole operation
          if (checkError) {
            console.warn('Notifications table may not exist yet:', checkError.message)
            console.log(`Would have created notification for paid job ${jobId} if table existed`)
          } else {
            // Create a notification in the database
            const { error: notificationError } = await supabase
              .from('notifications')
              .insert({
                recipient_id: job.subcontractor_id,
                message: `Payment for job ${job.job_type} has been processed and marked as paid.`,
                related_entity_type: 'job',
                related_entity_id: jobId,
                read: false
              })

            if (notificationError) {
              console.error('Error creating notification:', notificationError)
            } else {
              console.log(`Created notification for paid job ${jobId}`)
            }
          }
        } catch (notificationError) {
          // Log the error but don't fail the whole operation
          console.error('Error creating notification:', notificationError)
          console.log('Job was still marked as paid successfully')
        }
      }

      // Refresh the jobs list to ensure we have the latest data
      loadJobs()
    } catch (error) {
      // Log the detailed error for debugging
      console.error('Error updating job paid status:', error)

      // Check if the error is a PostgreSQL error (likely a constraint violation)
      let errorMessage = 'Unknown error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;

        // Log additional details if available
        if ('code' in error) {
          console.error('Error code:', (error as any).code);
        }
        if ('details' in error) {
          console.error('Error details:', (error as any).details);
        }
      }

      // Show a more detailed error message to the user
      toast({
        variant: "destructive",
        title: "Failed to update payment status",
        description: `There was a problem updating the job payment status: ${errorMessage}. Please try again.`,
      })
    }
  }

  const totalPages = Math.ceil(totalJobs / jobsPerPage)

  const handlePageChange = (page: number) => {
    if (page < 1) page = 1
    if (page > totalPages) page = totalPages
    setCurrentPage(page)
  }
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-MY')
  }

  const formatCurrency = (amount: number | null) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount || 0)
  }

  // Calculate the total amount including all line items
  const calculateTotalAmount = (job: JobWithSubcontractor): number => {
    // Start with the base job amount (unit * unit_price)
    let total = job.total || 0;

    // If there are line items, add their totals
    if (job.line_items) {
      try {
        const lineItems = Array.isArray(job.line_items) ? job.line_items : [];

        // Calculate total from all line items
        const lineItemsTotal = lineItems.reduce((sum, item) => {
          const quantity = Number(item.unit_quantity || item.quantity || 0);
          const price = Number(item.unit_price || 0);
          return sum + (quantity * price);
        }, 0);

        // If we have line items, use their total instead of the base total
        if (lineItems.length > 0) {
          return lineItemsTotal;
        }
      } catch (error) {
        console.error('Error calculating total from line items:', error);
      }
    }

    return total;
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page
    loadJobs()
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1) // Reset to first page
  }

  const handleViewDetails = (job: JobWithSubcontractor) => {
    setSelectedJob(job)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Manage Jobs</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          View and manage all subcontractor jobs
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-end">
        <div className="flex-1">
          <form onSubmit={handleSearchSubmit} className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="search"
              placeholder="Search jobs or locations..."
              className="flex-1 h-8 md:h-10 text-xs md:text-sm"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Button type="submit" size="icon" className="h-8 w-8 md:h-10 md:w-10">
              <Search className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </form>
        </div>
        <div className="w-full md:w-[180px]">
          <Select
            value={statusFilter}
            onValueChange={handleStatusFilterChange}
          >
            <SelectTrigger className="h-8 md:h-10 text-xs md:text-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading jobs...</p>
          </div>
        ) : jobs.length > 0 ? (
          <>
            <div className="md:hidden">
              {/* Mobile card view */}
              <div className="space-y-2 p-2">
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-sm">{job.job_type}</h3>
                      <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {job.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="text-muted-foreground">Subcontractor:</div>
                      <div>{job.profile?.company_name || "—"}</div>

                      <div className="text-muted-foreground">Location:</div>
                      <div>{job.location}</div>

                      <div className="text-muted-foreground">Date Range:</div>
                      <div>{formatDate(job.start_date)} - {formatDate(job.end_date)}</div>

                      <div className="text-muted-foreground">Amount:</div>
                      <div className="font-medium">{formatCurrency(calculateTotalAmount(job))}</div>

                      {job.status === 'completed' && (
                        <>
                          <div className="text-muted-foreground">Payment Status:</div>
                          <div className="flex items-center">
                            <Switch
                              checked={!!job.paid}
                              onCheckedChange={(checked) => {
                                // Call the update function directly
                                updateJobPaidStatus(job.id, checked);
                              }}
                              className="mr-2 h-[18px] w-[32px]"
                              // Add a key to force re-render when paid status changes
                              key={`switch-mobile-${job.id}-${job.paid}`}
                            />
                            <span>{job.paid ? 'Paid' : 'Unpaid'}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => handleViewDetails(job)}>
                        Details
                      </Button>
                      {(job.status === 'completed' || job.status === 'in-progress') && (
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2" asChild>
                          <Link href={`/api/admin/invoices/${job.id}`}>
                            <Download className="h-3 w-3 mr-1" /> Invoice
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Subcontractor</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead className="text-right">Amount (RM)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.job_type}</TableCell>
                      <TableCell>{job.profile?.company_name}</TableCell>
                      <TableCell>{job.location}</TableCell>
                      <TableCell>{formatDate(job.start_date)} - {formatDate(job.end_date)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(calculateTotalAmount(job))}</TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          job.status === 'completed' ? 'bg-green-100 text-green-800' :
                          job.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {job.status}
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.status === 'completed' ? (
                          <div className="flex items-center">
                            <Switch
                              checked={!!job.paid}
                              onCheckedChange={(checked) => {
                                // Call the update function directly
                                updateJobPaidStatus(job.id, checked);
                              }}
                              className="mr-2"
                              // Add a key to force re-render when paid status changes
                              key={`switch-${job.id}-${job.paid}`}
                            />
                            <span className="text-xs">{job.paid ? 'Yes' : 'No'}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewDetails(job)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            <DropdownMenuItem
                              disabled={job.status === 'pending'}
                              onClick={() => updateJobStatus(job.id, 'pending')}
                            >
                              <Clock className="mr-2 h-4 w-4 text-amber-500" />
                              Set as Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={job.status === 'in-progress'}
                              onClick={() => updateJobStatus(job.id, 'in-progress')}
                            >
                              <FileText className="mr-2 h-4 w-4 text-blue-500" />
                              Set as In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={job.status === 'completed'}
                              onClick={() => updateJobStatus(job.id, 'completed')}
                            >
                              <CheckSquare className="mr-2 h-4 w-4 text-green-500" />
                              Set as Completed
                            </DropdownMenuItem>
                            {job.status === 'completed' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Payment Status</DropdownMenuLabel>
                                <DropdownMenuItem
                                  disabled={!!job.paid}
                                  onClick={() => updateJobPaidStatus(job.id, true)}
                                >
                                  <DollarSign className="mr-2 h-4 w-4 text-green-500" />
                                  Mark as Paid
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={!job.paid}
                                  onClick={() => updateJobPaidStatus(job.id, false)}
                                >
                                  <DollarSign className="mr-2 h-4 w-4 text-red-500" />
                                  Mark as Unpaid
                                </DropdownMenuItem>
                              </>
                            )}
                            {(job.status === 'completed' || job.status === 'in-progress') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/api/admin/invoices/${job.id}`}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Generate Invoice
                                  </Link>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Showing {((currentPage - 1) * jobsPerPage) + 1} to {Math.min(currentPage * jobsPerPage, totalJobs)} of {totalJobs} jobs
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">First page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum = i + 1;

                // Show pages around current page if there are many pages
                if (totalPages > 5) {
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <div className="sm:hidden">
              <span className="text-sm font-medium">
                {currentPage} / {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Last page</span>
            </Button>
          </div>
        </div>
      )}

      {/* Job details dialog */}
      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{selectedJob.job_type}</DialogTitle>
              <DialogDescription>
                Submitted by {selectedJob.profile?.company_name || "Unknown Subcontractor"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Location</h3>
                    <p className="break-words">{selectedJob.location}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Date Range</h3>
                    <p>{formatDate(selectedJob.start_date)} to {formatDate(selectedJob.end_date)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Submission Date</h3>
                    <p>{new Date(selectedJob.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedJob.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedJob.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedJob.status}
                    </div>
                  </div>
                  {selectedJob.status === 'completed' && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Payment Status</h3>
                      <div className="flex items-center mt-1">
                        <Switch
                          checked={!!selectedJob.paid}
                          onCheckedChange={(checked) => {
                            // Only proceed if the job is completed
                            if (selectedJob.status === 'completed') {
                              // Update the dialog state immediately for better UX
                              setSelectedJob({...selectedJob, paid: checked})
                              // Then update the database
                              updateJobPaidStatus(selectedJob.id, checked)
                            } else {
                              toast({
                                variant: "destructive",
                                title: "Cannot update paid status",
                                description: "Only completed jobs can be marked as paid.",
                              })
                            }
                          }}
                          className="mr-2"
                          // Add a key to force re-render when paid status changes
                          key={`switch-dialog-${selectedJob.id}-${selectedJob.paid}`}
                        />
                        <span className="text-sm">{selectedJob.paid ? 'Paid' : 'Unpaid'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Display line items if they exist */}
              {selectedJob.line_items && Array.isArray(selectedJob.line_items) && selectedJob.line_items.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Line Items</h3>
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-sm">Item</th>
                            <th className="text-right py-3 px-4 font-medium text-sm">Quantity</th>
                            <th className="text-right py-3 px-4 font-medium text-sm">Unit Price</th>
                            <th className="text-right py-3 px-4 font-medium text-sm">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedJob.line_items.map((item, index) => {
                            const quantity = Number(item.unit_quantity || item.quantity || 0);
                            const price = Number(item.unit_price || 0);
                            const itemTotal = quantity * price;

                            return (
                              <tr key={index} className="border-b border-muted">
                                <td className="py-3 px-4">{item.item_name || `Item ${index + 1}`}</td>
                                <td className="py-3 px-4 text-right">{quantity}</td>
                                <td className="py-3 px-4 text-right">{formatCurrency(price)}</td>
                                <td className="py-3 px-4 text-right">{formatCurrency(itemTotal)}</td>
                              </tr>
                            );
                          })}
                          <tr className="font-bold">
                            <td colSpan={3} className="py-3 px-4 text-right">Grand Total:</td>
                            <td className="py-3 px-4 text-right">{formatCurrency(calculateTotalAmount(selectedJob))}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {selectedJob.notes && (
                <div className="mt-4">
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Notes</h3>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="whitespace-pre-wrap break-words">{selectedJob.notes}</p>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Job ID: {selectedJob.id}
              </div>
            </div>

            <DialogFooter>
              <div className="flex flex-col sm:flex-row gap-2 justify-end w-full">
                {(selectedJob.status === 'completed' || selectedJob.status === 'in-progress') && (
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href={`/api/admin/invoices/${selectedJob.id}`}>
                      <Download className="mr-2 h-4 w-4" /> Generate Invoice
                    </Link>
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedJob(null)} className="w-full sm:w-auto">
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
