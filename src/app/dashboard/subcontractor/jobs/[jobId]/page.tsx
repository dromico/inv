"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@/lib/supabase"
import { Job } from "@/types"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatCurrency } from "@/lib/utils"
import { AlertCircle, ArrowLeft, FileText, Loader2, Pencil, Trash2 } from "lucide-react"
import { JobHistory } from "@/components/job-history"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface JobDetailsPageProps {
  params: Promise<{
    jobId: string
  }>
}

export default function JobDetailsPage({ params }: JobDetailsPageProps) {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const { jobId } = use(params)

  useEffect(() => {
    async function fetchJob() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to view job details.",
          })
          router.push('/auth/login')
          return
        }

        const { data: jobData, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .eq('subcontractor_id', user.id)
          .single()

        if (error) {
          throw error
        }

        if (!jobData) {
          toast({
            variant: "destructive",
            title: "Job not found",
            description: "The requested job could not be found or you don't have permission to view it.",
          })
          router.push('/dashboard/subcontractor/jobs')
          return
        }

        setJob(jobData as Job)
      } catch (error) {
        console.error('Error fetching job:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load job details. Please try again.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [jobId, router, supabase, toast])

  const handleDelete = async () => {
    try {
      if (!job) return

      setIsDeleting(true)

      if (job.status !== 'pending') {
        toast({
          variant: "destructive",
          title: "Cannot delete job",
          description: "Only jobs with 'pending' status can be deleted.",
        })
        return
      }

      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', job.id)

      if (error) {
        throw error
      }

      toast({
        title: "Job deleted",
        description: "The job has been deleted successfully.",
      })

      router.push('/dashboard/subcontractor/jobs')
    } catch (error) {
      console.error('Error deleting job:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete job. Please try again.",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const getStatusBadgeClass = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200'

    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Calculate the total amount including all line items
  const calculateTotalAmount = (job: Job): number => {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-2 text-muted-foreground">Loading job details...</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <h2 className="text-xl font-semibold mt-2">Job Not Found</h2>
        <p className="text-muted-foreground">The job you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/subcontractor/jobs">Back to Jobs</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 mr-0 sm:mr-2 self-start"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Go back</span>
        </Button>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Job Details</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            View detailed information about your job
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-0">
            <div>
              <CardTitle className="text-xl sm:text-2xl">{job.job_type}</CardTitle>
              <div className="flex items-center mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(job.status)}`}>
                  {job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'Unknown'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {job.status === 'pending' && (
                <>
                  <Button variant="outline" size="sm" className="h-10 px-4" asChild>
                    <Link href={`/dashboard/subcontractor/jobs/${job.id}/edit`}>
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-10 px-4"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </>
              )}

              {job.status === 'completed' && (
                <Button variant="outline" size="sm" className="h-10 px-4" asChild>
                  <Link href={`/dashboard/subcontractor/invoices/${job.id}`}>
                    <FileText className="h-4 w-4 mr-2" /> View Invoice
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Location</h3>
                  <p className="break-words">{job.location}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Date Range</h3>
                  <p>{formatDate(job.start_date)} to {formatDate(job.end_date)}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Submission Date</h3>
                  <p>{formatDate(job.created_at)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Units</h3>
                  <p>{job.unit} units</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Unit Price</h3>
                  <p>{formatCurrency(job.unit_price)}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Total Amount</h3>
                  <p className="text-lg font-bold">{formatCurrency(calculateTotalAmount(job))}</p>
                </div>
              </div>
            </div>

            {/* Display line items if they exist */}
            {job.line_items && Array.isArray(job.line_items) && job.line_items.length > 0 && (
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
                        {job.line_items.map((item, index) => {
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
                          <td className="py-3 px-4 text-right">{formatCurrency(calculateTotalAmount(job))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {job.notes && (
              <div className="mt-4">
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Notes</h3>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="whitespace-pre-wrap break-words">{job.notes}</p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="px-4 sm:px-6">
            <p className="text-xs text-muted-foreground">
              Job ID: {job.id}
            </p>
          </CardFooter>
        </Card>

        {/* Job History */}
        <JobHistory jobId={job.id} />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this job?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the job from your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete Job"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
