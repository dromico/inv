"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@/lib/supabase"
import { Job } from "@/types"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatCurrency } from "@/lib/utils"
import { AlertCircle, ArrowLeft, FileText, Loader2, Pencil, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface JobDetailsPageProps {
  params: {
    jobId: string
  }
}

export default function JobDetailsPage({ params }: JobDetailsPageProps) {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  
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
          .eq('id', params.jobId)
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
  }, [params.jobId, router, supabase, toast])

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
  
  const getStatusBadgeClass = (status: string) => {
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
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Go back</span>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Job Details</h2>
          <p className="text-muted-foreground">
            View detailed information about your job
          </p>
        </div>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{job.job_type}</CardTitle>
              <div className="flex items-center mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(job.status)}`}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {job.status === 'pending' && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/subcontractor/jobs/${job.id}/edit`}>
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Link>
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </>
              )}
              
              {job.status === 'completed' && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/subcontractor/invoices/${job.id}`}>
                    <FileText className="h-4 w-4 mr-2" /> View Invoice
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Location</h3>
                  <p>{job.location}</p>
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
                  <p className="text-lg font-bold">{formatCurrency(job.total)}</p>
                </div>
              </div>
            </div>
            
            {job.notes && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Notes</h3>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="whitespace-pre-wrap">{job.notes}</p>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Job ID: {job.id}
            </p>
          </CardFooter>
        </Card>
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
