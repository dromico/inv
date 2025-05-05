"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@/lib/supabase"
import { JobWithSubcontractor } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
      const { error } = await supabase
        .from('jobs')
        .update({ status })
        .eq('id', jobId)
      
      if (error) {
        throw error
      }
      
      toast({
        title: "Status updated",
        description: `Job status updated to ${status}`,
      })
      
      loadJobs()
    } catch (error) {
      console.error('Error updating job status:', error)
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: "There was a problem updating the job status. Please try again.",
      })
    }
  }

  const totalPages = Math.ceil(totalJobs / jobsPerPage)

  const handlePageChange = (page: number) => {
    if (page < 1) page = 1
    if (page > totalPages) page = totalPages
    setCurrentPage(page)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY')
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount)
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
        <h2 className="text-3xl font-bold tracking-tight">Manage Jobs</h2>
        <p className="text-muted-foreground">
          View and manage all subcontractor jobs
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <form onSubmit={handleSearchSubmit} className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="search"
              placeholder="Search jobs or locations..."
              className="flex-1"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Button type="submit" size="icon">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </form>
        </div>
        <div className="w-full md:w-[180px]">
          <Select
            value={statusFilter}
            onValueChange={handleStatusFilterChange}
          >
            <SelectTrigger>
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
              <div className="space-y-4 p-4">
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{job.job_type}</h3>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {job.status}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Subcontractor</p>
                        <p>{job.profile?.company_name || "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <p>{job.location}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date Range</p>
                        <p>{formatDate(job.start_date)} - {formatDate(job.end_date)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium">{formatCurrency(job.total)}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(job)}>
                        Details
                      </Button>
                      {job.status === 'completed' && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/admin/invoices/${job.id}`}>
                            <Download className="h-4 w-4 mr-1" /> Invoice
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
                      <TableCell className="text-right">{formatCurrency(job.total)}</TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          job.status === 'completed' ? 'bg-green-100 text-green-800' :
                          job.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {job.status}
                        </div>
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
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/admin/invoices/${job.id}`}>
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
          <DialogContent className="max-w-[95vw] sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
              <DialogDescription>
                Detailed information about the selected job.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
                <div className="font-medium">Job Type:</div>
                <div className="col-span-2 sm:col-span-3">{selectedJob.job_type}</div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
                <div className="font-medium">Subcontractor:</div>
                <div className="col-span-2 sm:col-span-3">{selectedJob.profile?.company_name}</div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
                <div className="font-medium">Location:</div>
                <div className="col-span-2 sm:col-span-3">{selectedJob.location}</div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
                <div className="font-medium">Date Range:</div>
                <div className="col-span-2 sm:col-span-3">
                  {formatDate(selectedJob.start_date)} - {formatDate(selectedJob.end_date)}
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
                <div className="font-medium">Unit:</div>
                <div className="col-span-2 sm:col-span-3">{selectedJob.unit}</div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
                <div className="font-medium">Unit Price:</div>
                <div className="col-span-2 sm:col-span-3">{formatCurrency(selectedJob.unit_price)}</div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
                <div className="font-medium">Total:</div>
                <div className="col-span-2 sm:col-span-3 font-bold">{formatCurrency(selectedJob.total)}</div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
                <div className="font-medium">Status:</div>
                <div className="col-span-2 sm:col-span-3">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedJob.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    selectedJob.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedJob.status}
                  </div>
                </div>
              </div>
              {selectedJob.notes && (
                <div className="grid grid-cols-3 sm:grid-cols-4 items-start gap-4">
                  <div className="font-medium">Notes:</div>
                  <div className="col-span-2 sm:col-span-3 whitespace-pre-wrap">{selectedJob.notes}</div>
                </div>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
                <div className="font-medium">Submitted:</div>
                <div className="col-span-2 sm:col-span-3">{new Date(selectedJob.created_at).toLocaleString()}</div>
              </div>
            </div>
            <DialogFooter>
              <div className="flex flex-col sm:flex-row gap-2 justify-end w-full">
                {selectedJob.status === 'completed' && (
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href={`/dashboard/admin/invoices/${selectedJob.id}`}>
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
